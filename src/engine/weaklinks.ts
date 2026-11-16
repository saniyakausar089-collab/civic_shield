/**
 * CIVICSHIELD weak-link analysis (Phase 4b).
 *
 * For every asset we combine three things into a 0-100 vulnerability score:
 *  1. IMPACT     - run the real cascade engine with only that asset failed
 *                  (population-hours affected, hospital downtime).
 *  2. STRUCTURE  - graph metrics: betweenness centrality + number of downstream assets.
 *  3. CONDITION  - asset age and how close it runs to capacity.
 *
 * The simulate function is passed in, so this file has no runtime imports.
 */
import type { NetworkData, NeighborhoodsData, NetNode, Scenario } from "./cascade";
import type { SimulateFn } from "./plans";

interface AssetNode extends NetNode {
  built_year?: number;
  age_years?: number;
  load?: number;
  capacity?: number;
}

export const WEAK_LINK_WEIGHTS = { impact: 0.55, structure: 0.2, condition: 0.25 };

export interface WeakLink {
  node: string;
  name: string;
  type: string;
  network: string;
  rank: number;
  /** 0-100, higher = more vulnerable / more damaging when it fails. */
  score: number;
  breakdown: { impact: number; structure: number; condition: number };
  impact: {
    affected_pop_hours: number;
    peak_affected_pop: number;
    peak_affected_pct: number;
    hospital_downtime_h: number;
    /** Other assets that reach "failed" at some point when only this asset fails. */
    knocked_out: string[];
    degraded_count: number;
  };
  structure: { betweenness: number; downstream_assets: number };
  condition: { age_years: number; built_year: number | null; utilization: number };
  reasons: string[];
}

function betweenness(ids: string[], adj: Map<string, string[]>): Map<string, number> {
  const cb = new Map<string, number>(ids.map((i) => [i, 0]));
  for (const s of ids) {
    const stack: string[] = [];
    const pred = new Map<string, string[]>(ids.map((i) => [i, []]));
    const sigma = new Map<string, number>(ids.map((i) => [i, 0]));
    const dist = new Map<string, number>(ids.map((i) => [i, -1]));
    sigma.set(s, 1);
    dist.set(s, 0);
    const queue: string[] = [s];
    while (queue.length) {
      const v = queue.shift()!;
      stack.push(v);
      for (const w of adj.get(v) ?? []) {
        if (dist.get(w)! < 0) {
          dist.set(w, dist.get(v)! + 1);
          queue.push(w);
        }
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          pred.get(w)!.push(v);
        }
      }
    }
    const delta = new Map<string, number>(ids.map((i) => [i, 0]));
    while (stack.length) {
      const w = stack.pop()!;
      for (const v of pred.get(w)!) {
        delta.set(v, delta.get(v)! + (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!));
      }
      if (w !== s) cb.set(w, cb.get(w)! + delta.get(w)!);
    }
  }
  return cb;
}

function downstreamCount(start: string, adj: Map<string, string[]>): number {
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length) {
    const v = queue.shift()!;
    for (const w of adj.get(v) ?? []) {
      if (!seen.has(w)) {
        seen.add(w);
        queue.push(w);
      }
    }
  }
  return seen.size - 1;
}

const norm = (v: number, max: number) => (max > 0 ? v / max : 0);
const round1 = (x: number) => Math.round(x * 10) / 10;

export function analyzeWeakLinks(
  simulate: SimulateFn,
  network: NetworkData,
  hoods: NeighborhoodsData
): WeakLink[] {
  const nodes = network.nodes as AssetNode[];
  const ids = nodes.map((n) => n.id);
  const nameOf = new Map(nodes.map((n) => [n.id, n.name]));
  const adj = new Map<string, string[]>(ids.map((i) => [i, []]));
  for (const e of network.edges) adj.get(e.source)!.push(e.target);
  const bc = betweenness(ids, adj);

  const raw = nodes.map((n) => {
    const scenario: Scenario = {
      id: `single:${n.id}`,
      name: `${n.name} failure`,
      triggers: [{ node: n.id, t_hours: 0, severity: 1, event: `${n.name} failed` }],
    };
    const r = simulate(network, hoods, scenario);
    const down = new Set<string>();
    const bad = new Set<string>();
    for (const fr of r.frames) {
      fr.failed.forEach((i) => down.add(i));
      fr.degraded.forEach((i) => bad.add(i));
    }
    const knocked = [...down].filter((i) => i !== n.id);
    const degradedOnly = [...bad].filter((i) => i !== n.id && !down.has(i));
    return {
      n,
      r,
      knocked,
      degradedCount: degradedOnly.length,
      bc: bc.get(n.id) ?? 0,
      downstream: downstreamCount(n.id, adj),
    };
  });

  const maxAff = Math.max(...raw.map((x) => x.r.summary.affected_pop_hours));
  const maxHosp = Math.max(...raw.map((x) => x.r.summary.hospital_downtime_h));
  const maxBc = Math.max(...raw.map((x) => x.bc));
  const maxDown = Math.max(...raw.map((x) => x.downstream));

  const links: WeakLink[] = raw.map((x) => {
    const m = x.r.summary;
    const age = x.n.age_years ?? 0;
    const util = x.n.capacity ? Math.min(1, (x.n.load ?? 0) / x.n.capacity) : 0;

    const impact = 0.6 * norm(m.affected_pop_hours, maxAff) + 0.4 * norm(m.hospital_downtime_h, maxHosp);
    const structure = 0.5 * norm(x.bc, maxBc) + 0.5 * norm(x.downstream, maxDown);
    const condition = 0.5 * Math.min(1, age / 100) + 0.5 * util;
    const W = WEAK_LINK_WEIGHTS;
    const score = 100 * (W.impact * impact + W.structure * structure + W.condition * condition);

    const peakPct = x.r.total_population > 0 ? (m.peak_affected_pop / x.r.total_population) * 100 : 0;
    const reasons: string[] = [];
    if (x.knocked.length > 0) {
      const names = x.knocked.slice(0, 3).map((i) => nameOf.get(i) ?? i).join(", ");
      reasons.push(`Its failure alone knocks out ${x.knocked.length} other asset${x.knocked.length > 1 ? "s" : ""} (${names}${x.knocked.length > 3 ? ", ..." : ""})`);
    }
    if (peakPct >= 25) reasons.push(`Peak impact reaches ${Math.round(peakPct)}% of residents`);
    if (m.hospital_downtime_h > 0) reasons.push(`Causes ${m.hospital_downtime_h} hospital-downtime hours within 24h`);
    if (age >= 60) reasons.push(`Ageing asset: ${age} years old${x.n.built_year ? ` (built ${x.n.built_year})` : ""}`);
    if (util >= 0.8) reasons.push(`Runs at ${Math.round(util * 100)}% of capacity, little headroom`);
    if (reasons.length === 0) reasons.push("Low-impact asset: failure is largely contained");

    return {
      node: x.n.id,
      name: x.n.name,
      type: x.n.type,
      network: x.n.network,
      rank: 0,
      score: round1(score),
      breakdown: { impact: round1(impact * 100), structure: round1(structure * 100), condition: round1(condition * 100) },
      impact: {
        affected_pop_hours: m.affected_pop_hours,
        peak_affected_pop: m.peak_affected_pop,
        peak_affected_pct: round1(peakPct),
        hospital_downtime_h: m.hospital_downtime_h,
        knocked_out: x.knocked,
        degraded_count: x.degradedCount,
      },
      structure: { betweenness: Math.round(x.bc * 100) / 100, downstream_assets: x.downstream },
      condition: { age_years: age, built_year: x.n.built_year ?? null, utilization: Math.round(util * 100) / 100 },
      reasons,
    };
  });

  return links.sort((a, b) => b.score - a.score).map((l, i) => ({ ...l, rank: i + 1 }));
}
