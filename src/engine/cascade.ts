/**
 * CIVICSHIELD cascade engine v1 (hourly steps).
 *
 * Model
 *  - Every node has functionality f in [0,1] (1 = fully working).
 *  - A dependency edge (source -> target, weight w, delay d) removes
 *    w * (1 - f_source(t - d)) of the target's function.
 *  - Losses are summed per utility type (capped at 1), then combined
 *    multiplicatively across types:  f = PRODUCT(1 - loss_type).
 *  - Scenario triggers force a node to (1 - severity) from t_hours on,
 *    until an optional restore hour (used later for response plans).
 *  - Hospitals can ride through power / water loss for backup_*_hours.
 *  - Status: f < failed_below -> failed, f < degraded_below -> degraded.
 *
 * The file is dependency free so it can later be ported to C++ / WASM
 * with the same input and output shapes.
 */

export type Status = "normal" | "degraded" | "failed";
export type EdgeType = "water" | "power" | "telecom" | "road" | "hazard";

export interface NetNode {
  id: string;
  name: string;
  type: string;
  network: string;
  backup_power_hours?: number;
  backup_water_hours?: number;
}

export interface NetEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  weight: number;
  delay_h: number;
}

export interface NetworkData {
  engine_defaults: {
    time_step_h: number;
    horizon_h: number;
    degraded_below: number;
    failed_below: number;
    neighborhood_impact_weights: Record<string, number>;
  };
  nodes: NetNode[];
  edges: NetEdge[];
}

export interface NeighborhoodsData {
  features: {
    properties: {
      id: string;
      name: string;
      population: number;
      served_by: Record<string, string>;
    };
  }[];
}

export interface ScenarioTrigger {
  node: string;
  t_hours: number;
  severity: number;
  event: string;
}

export interface Scenario {
  id: string;
  name: string;
  triggers: ScenarioTrigger[];
}

export interface SimOptions {
  /** Simulation length in hours (default: network.engine_defaults.horizon_h). */
  horizonH?: number;
  /** nodeId -> hour at which a triggered node is repaired. */
  restore?: Record<string, number>;
  /** A neighborhood counts as "affected" when its impact >= this (default 0.25). */
  affectedThreshold?: number;
}

export interface SimEvent {
  t: number;
  node: string;
  kind: "trigger" | "cascade" | "recovery";
  to: Status;
  text: string;
}

export interface Frame {
  t: number;
  functionality: Record<string, number>;
  status: Record<string, Status>;
  failed: string[];
  degraded: string[];
  neighborhood_impact: Record<string, number>;
  affected_pop: number;
  service_loss_pop: number;
  hospitals_down: number;
  hospitals_degraded: number;
  events: SimEvent[];
}

export interface Summary {
  peak_affected_pop: number;
  peak_t: number;
  final_failed: number;
  final_degraded: number;
  peak_hospitals_down: number;
  first_hospital_down_t: number | null;
  affected_pop_hours: number;
  hospital_downtime_h: number;
  node_hours_lost: number;
}

export interface SimResult {
  scenario_id: string;
  horizon_h: number;
  total_population: number;
  frames: Frame[];
  events: SimEvent[];
  summary: Summary;
}

const EDGE_TYPES: EdgeType[] = ["water", "power", "telecom", "road", "hazard"];
const RANK: Record<Status, number> = { normal: 0, degraded: 1, failed: 2 };
const r3 = (x: number) => Math.round(x * 1000) / 1000;

export function statusOf(f: number, degradedBelow: number, failedBelow: number): Status {
  return f < failedBelow ? "failed" : f < degradedBelow ? "degraded" : "normal";
}

function topoOrder(nodes: NetNode[], edges: NetEdge[]): string[] {
  const indeg = new Map(nodes.map((n) => [n.id, 0]));
  const adj = new Map<string, string[]>(nodes.map((n) => [n.id, []]));
  for (const e of edges) {
    adj.get(e.source)!.push(e.target);
    indeg.set(e.target, indeg.get(e.target)! + 1);
  }
  const queue = nodes.filter((n) => indeg.get(n.id) === 0).map((n) => n.id);
  const order: string[] = [];
  while (queue.length) {
    const u = queue.shift()!;
    order.push(u);
    for (const v of adj.get(u)!) {
      indeg.set(v, indeg.get(v)! - 1);
      if (indeg.get(v) === 0) queue.push(v);
    }
  }
  if (order.length !== nodes.length) throw new Error("Dependency graph has a cycle");
  return order;
}

export function simulate(
  network: NetworkData,
  hoods: NeighborhoodsData,
  scenario: Scenario,
  opts: SimOptions = {}
): SimResult {
  const H = opts.horizonH ?? network.engine_defaults.horizon_h;
  const { degraded_below, failed_below, neighborhood_impact_weights: iw } = network.engine_defaults;
  const affectedThr = opts.affectedThreshold ?? 0.25;

  const byId = new Map(network.nodes.map((n) => [n.id, n]));
  const incoming = new Map<string, NetEdge[]>(network.nodes.map((n) => [n.id, []]));
  for (const e of network.edges) incoming.get(e.target)!.push(e);
  const order = topoOrder(network.nodes, network.edges);
  const triggerOf = new Map(scenario.triggers.map((t) => [t.node, t]));
  const hospitals = network.nodes.filter((n) => n.type === "hospital");
  const totalPop = hoods.features.reduce((a, f) => a + f.properties.population, 0);

  const hist: Record<string, number[]> = Object.fromEntries(network.nodes.map((n) => [n.id, []]));
  const lossStart: Record<string, Partial<Record<EdgeType, number>>> = {};
  const prevStatus: Record<string, Status> = Object.fromEntries(network.nodes.map((n) => [n.id, "normal"]));
  const histD: Record<string, number[]> = Object.fromEntries(network.nodes.map((n) => [n.id, []]));
  const valueAt = (id: string, tt: number): number => (tt < 0 ? 1 : hist[id]?.[tt] ?? 1);
  const damageAt = (id: string, tt: number): number => (tt < 0 ? 0 : histD[id]?.[tt] ?? 0);
  const trigIndex = new Map(scenario.triggers.map((t, i) => [t.node, i]));

  const frames: Frame[] = [];
  const allEvents: SimEvent[] = [];

  for (let t = 0; t <= H; t++) {
    const fNow: Record<string, number> = {};
    const dNow: Record<string, number> = {};
    const mainSource: Record<string, string | undefined> = {};

    for (const id of order) {
      const n = byId.get(id)!;
      const groups: Partial<Record<EdgeType, number>> = {};
      let best = 0;
      let bestSrc: string | undefined;

      for (const e of incoming.get(id)!) {
        // hazard edges spread physical damage only (a pipe that merely lost supply does not flood anything)
        const lossOfSource =
          e.type === "hazard"
            ? (e.delay_h === 0 ? (dNow[e.source] ?? 0) : damageAt(e.source, t - e.delay_h))
            : 1 - (e.delay_h === 0 ? (fNow[e.source] ?? 1) : valueAt(e.source, t - e.delay_h));
        const contrib = e.weight * lossOfSource;
        groups[e.type] = (groups[e.type] ?? 0) + contrib;
        if (contrib > best) { best = contrib; bestSrc = e.source; }
      }

      const ls = (lossStart[id] ??= {});
      let keep = 1;
      for (const type of EDGE_TYPES) {
        let loss = Math.min(1, groups[type] ?? 0);
        if (loss > 1e-9) {
          if (ls[type] === undefined) ls[type] = t;
          const backup = type === "power" ? n.backup_power_hours : type === "water" ? n.backup_water_hours : 0;
          if (backup && t - ls[type]! < backup) loss = 0;
        } else {
          delete ls[type];
        }
        keep *= 1 - loss;
      }

      let f = keep;
      let triggerDamage = 0;
      const tr = triggerOf.get(id);
      const restoredAt = opts.restore?.[id];
      if (tr && t >= tr.t_hours && !(restoredAt !== undefined && t >= restoredAt)) {
        f = Math.min(f, 1 - tr.severity);
        triggerDamage = tr.severity;
      }
      const damage = Math.max(triggerDamage, Math.min(1, groups.hazard ?? 0));
      dNow[id] = damage;
      histD[id]!.push(damage);
      f = r3(Math.max(0, Math.min(1, f)));
      fNow[id] = f;
      hist[id]!.push(f);
      mainSource[id] = bestSrc;
    }

    // statuses + events
    const status: Record<string, Status> = {};
    const events: SimEvent[] = [];
    for (const n of network.nodes) {
      const s = statusOf(fNow[n.id] ?? 1, degraded_below, failed_below);
      status[n.id] = s;
      const prev = prevStatus[n.id] ?? "normal";
      if (s === prev) continue;
      const tr = triggerOf.get(n.id);
      if (RANK[s] > RANK[prev]) {
        if (tr && t === tr.t_hours) {
          events.push({ t, node: n.id, kind: "trigger", to: s, text: tr.event });
        } else {
          const src = mainSource[n.id] ? byId.get(mainSource[n.id]!)!.name : undefined;
          events.push({ t, node: n.id, kind: "cascade", to: s, text: `${n.name} ${s}${src ? ` (loss of ${src})` : ""}` });
        }
      } else {
        events.push({ t, node: n.id, kind: "recovery", to: s, text: `${n.name} ${s === "normal" ? "recovered" : "partly restored"}` });
      }
      prevStatus[n.id] = s;
    }
    events.sort((a, b) => {
      const ka = a.kind === "trigger" ? trigIndex.get(a.node)! : 1000;
      const kb = b.kind === "trigger" ? trigIndex.get(b.node)! : 1000;
      return ka - kb;
    });
    allEvents.push(...events);

    // neighborhoods
    const impact: Record<string, number> = {};
    let affected = 0;
    let serviceLoss = 0;
    for (const f of hoods.features) {
      const p = f.properties;
      let v = 0;
      for (const [net, w] of Object.entries(iw)) {
        const nodeId = p.served_by[net];
        if (nodeId) v += w * (1 - (fNow[nodeId] ?? 1));
      }
      v = r3(Math.min(1, v));
      impact[p.id] = v;
      if (v >= affectedThr) affected += p.population;
      serviceLoss += p.population * v;
    }

    frames.push({
      t,
      functionality: fNow,
      status,
      failed: network.nodes.filter((n) => status[n.id] === "failed").map((n) => n.id),
      degraded: network.nodes.filter((n) => status[n.id] === "degraded").map((n) => n.id),
      neighborhood_impact: impact,
      affected_pop: affected,
      service_loss_pop: Math.round(serviceLoss),
      hospitals_down: hospitals.filter((h) => status[h.id] === "failed").length,
      hospitals_degraded: hospitals.filter((h) => status[h.id] === "degraded").length,
      events,
    });
  }

  // summary
  let peak = frames[0]!;
  let nodeHours = 0;
  let hospH = 0;
  let affH = 0;
  for (const fr of frames) {
    if (fr.affected_pop > peak.affected_pop) peak = fr;
    affH += fr.affected_pop;
    hospH += fr.hospitals_down;
    for (const n of network.nodes) nodeHours += 1 - (fr.functionality[n.id] ?? 1);
  }
  const last = frames[frames.length - 1]!;
  const firstHosp = frames.find((fr) => fr.hospitals_down > 0);

  return {
    scenario_id: scenario.id,
    horizon_h: H,
    total_population: totalPop,
    frames,
    events: allEvents,
    summary: {
      peak_affected_pop: peak.affected_pop,
      peak_t: peak.t,
      final_failed: last.failed.length,
      final_degraded: last.degraded.length,
      peak_hospitals_down: Math.max(...frames.map((f) => f.hospitals_down)),
      first_hospital_down_t: firstHosp ? firstHosp.t : null,
      affected_pop_hours: affH,
      hospital_downtime_h: hospH,
      node_hours_lost: r3(nodeHours),
    },
  };
}
