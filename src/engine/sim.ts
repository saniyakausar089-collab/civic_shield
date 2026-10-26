// Core simulation — pure TypeScript, no React.
// 1 tick = 1 hour, 24-hour horizon.
//
// Rules:
// - A node's lost fraction = weighted share of failed dependencies.
// - At or above the node's failureThreshold a stress counter starts; the node
//   fails once the counter exceeds its backup hours (generator/tank buffer).
// - Trigger nodes are forced down until their repair time, then dependents
//   recover as their lost fraction drops and stress decays.
import type { City, CityNode, NodeStatus } from "./types";
import { PLAN_WAIT, COMMAND_ACTIONS, type PlanMods } from "./plans";

export const HORIZON = 24;

export interface FailCause {
  depId: string;
  depName: string;
  depFailHour: number;
  lostFraction: number;
  threshold: number;
  stressStart: number;
  backupHours: number;
}

export type Severity = "info" | "warn" | "critical";

export interface SimEvent {
  hour: number;
  severity: Severity;
  nodeId?: string;
  message: string;
}

export interface HourSnapshot {
  hour: number;
  affectedPopulation: number;
  hospitalsDown: number;
  systemsFailed: number;
  lost: Record<string, number>;
  status: Record<string, NodeStatus>;
}

export interface SimResult {
  hours: HourSnapshot[];
  /** person-hours without service */
  personHoursLost: number;
  /** hospital-hours down */
  hospitalHoursDown: number;
  peakPopulationAffected: number;
  systemsFailed: number;
  crewCost: number;
  events: SimEvent[];
  failHours: Record<string, number>;
  causes: Record<string, FailCause>;
}

export function runSim(
  city: City,
  triggers: string[],
  plan: PlanMods = PLAN_WAIT,
  actionIds: string[] = [],
): SimResult {
  const nodes = city.nodes;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const triggerSet = new Set(triggers.filter((id) => byId.has(id)));
  const cutLinks = new Set(plan.cutLinks);
  const actionDefs = COMMAND_ACTIONS.filter((a) => actionIds.includes(a.id));
  const closeRoadActive = (h: number) =>
    plan.ignoreTransport || actionDefs.some((a) => a.id === "closeRoad" && h >= a.delayHours);

  const effBackup = (node: CityNode, h: number) => {
    let b = node.backupHours + (plan.bufferByKind[node.kind] ?? 0);
    for (const a of actionDefs) {
      if (h < a.delayHours) continue;
      if (a.id === "tankers" && (node.kind === "hospital" || node.kind === "pump")) b += 5;
      if (a.id === "generators" && (node.kind === "hospital" || node.kind === "neighborhood")) b += 6;
    }
    return b;
  };

  const effRepair = (node: CityNode) => Math.max(1, Math.round(node.repairHours * plan.repairMult));

  const effectiveDeps = (node: CityNode, h: number) =>
    node.deps.filter((d) => {
      if (cutLinks.has(`${node.id}>${d.id}`)) return false;
      if (d.layer === "transport" && closeRoadActive(h)) return false;
      return true;
    });

  const status: Record<string, NodeStatus> = {};
  const lost: Record<string, number> = {};
  const stress: Record<string, number> = {};
  const stressStart: Record<string, number> = {};
  const failHours: Record<string, number> = {};
  const causes: Record<string, FailCause> = {};
  const events: SimEvent[] = [];
  const hours: HourSnapshot[] = [];

  for (const n of nodes) {
    status[n.id] = "ok";
    stress[n.id] = 0;
    lost[n.id] = 0;
  }

  // Hour 0 — the event: trigger nodes go down instantly.
  for (const id of triggerSet) {
    status[id] = "failed";
    lost[id] = 1;
    failHours[id] = 0;
    events.push({
      hour: 0,
      severity: "critical",
      nodeId: id,
      message: `Hour 0 — ${byId.get(id)!.name} went down. Cascade risk across dependent systems.`,
    });
  }

  const pushHour = (h: number) => {
    let affected = 0;
    let hospitalsDown = 0;
    for (const n of nodes) {
      const l = Math.min(1, lost[n.id] ?? 0);
      if (n.population > 0) affected += n.population * l * plan.popMultiplier;
      if (n.kind === "hospital" && status[n.id] === "failed") hospitalsDown++;
    }
    hours.push({
      hour: h,
      affectedPopulation: Math.round(affected),
      hospitalsDown,
      systemsFailed: Object.values(status).filter((s) => s === "failed").length,
      lost: { ...lost },
      status: { ...status },
    });
  };

  pushHour(0);

  for (let h = 1; h <= HORIZON; h++) {
    for (const n of nodes) {
      if (triggerSet.has(n.id)) {
        if (h < effRepair(n)) {
          status[n.id] = "failed";
          lost[n.id] = 1;
        } else {
          if (status[n.id] === "failed") {
            events.push({ hour: h, severity: "info", nodeId: n.id, message: `Hour ${h} — ${n.name} repaired and back online.` });
          }
          status[n.id] = "ok";
          lost[n.id] = 0;
          stress[n.id] = 0;
          delete stressStart[n.id];
        }
        continue;
      }

      const deps = effectiveDeps(n, h);
      const totalW = deps.reduce((s, d) => s + d.weight, 0);
      const failedW = deps.reduce((s, d) => s + (status[d.id] === "failed" ? d.weight : 0), 0);
      const l = totalW > 0 ? failedW / totalW : 0;
      lost[n.id] = l;

      const prevStatus = status[n.id];
      const b = effBackup(n, h);
      const underStress = totalW > 0 && l >= n.failureThreshold;

      if (underStress) {
        if (stressStart[n.id] === undefined) stressStart[n.id] = h;
        stress[n.id] += 1;
        if (stress[n.id] > b) {
          if (prevStatus !== "failed") {
            const failedDep = deps
              .filter((d) => status[d.id] === "failed")
              .sort((a, c) => c.weight - a.weight)[0];
            if (failedDep) {
              causes[n.id] = {
                depId: failedDep.id,
                depName: byId.get(failedDep.id)!.name,
                depFailHour: failHours[failedDep.id] ?? 0,
                lostFraction: l,
                threshold: n.failureThreshold,
                stressStart: stressStart[n.id],
                backupHours: b,
              };
            }
            failHours[n.id] = h;
            const bufferNote = n.backupHours > 0 ? ` Its ${b}-hour backup was exhausted.` : "";
            events.push({ hour: h, severity: "critical", nodeId: n.id, message: `Hour ${h} — ${n.name} failed.${bufferNote}` });
          }
          status[n.id] = "failed";
        } else {
          status[n.id] = "stressed";
        }
      } else {
        // supplies restored — stress decays and the node recovers
        stress[n.id] = Math.max(0, stress[n.id] - 0.5);
        if (prevStatus === "failed" && stress[n.id] <= b) {
          status[n.id] = stress[n.id] > 0 ? "recovering" : "ok";
          events.push({ hour: h, severity: "info", nodeId: n.id, message: `Hour ${h} — ${n.name} recovering — supplies restored.` });
        } else if (prevStatus !== "failed") {
          status[n.id] = stress[n.id] > 0 ? "recovering" : "ok";
        }
        if (stress[n.id] === 0) delete stressStart[n.id];
      }
    }
    pushHour(h);
  }

  let personHoursLost = 0;
  let hospitalHoursDown = 0;
  let peak = 0;
  for (const s of hours) {
    personHoursLost += s.affectedPopulation;
    hospitalHoursDown += s.hospitalsDown;
    peak = Math.max(peak, s.affectedPopulation);
  }

  return {
    hours,
    personHoursLost,
    hospitalHoursDown,
    peakPopulationAffected: peak,
    systemsFailed: Object.keys(failHours).length,
    crewCost: plan.crew,
    events,
    failHours,
    causes,
  };
}
