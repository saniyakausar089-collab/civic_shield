/**
 * CIVICSHIELD response plans (Phase 4a).
 *
 * A plan is a set of actions the engine understands:
 *  - restore:     triggered node -> hour its repair completes
 *  - isolate:     "SRC>TGT" -> weight multiplier (0 = link cut, e.g. valves closed early)
 *  - backupBoost: node -> extra ride-through hours (generators / water tankers)
 *
 * evaluatePlans() re-runs the engine once per plan and ranks them.
 * The simulate function is passed in so this file has no runtime imports.
 */
import type { NetworkData, NeighborhoodsData, Scenario, SimOptions, SimResult } from "./cascade";
import type { NodeKind } from "./types";

export interface Plan {
  id: string;
  name: string;
  summary: string;
  restore?: Record<string, number>;
  isolate?: Record<string, number>;
  backupBoost?: Record<string, { power?: number; water?: number }>;
}

export type SimulateFn = (
  network: NetworkData,
  hoods: NeighborhoodsData,
  scenario: Scenario,
  opts?: SimOptions
) => SimResult;

export const BASELINE_PLAN: Plan = {
  id: "no_action",
  name: "No action",
  summary: "Let the failure run its course. Used as the comparison baseline.",
};

/** Lower score = better. Hospital downtime is weighted heavily on purpose. */
export const SCORE_WEIGHTS = { hospitalDowntimeH: 100000 };

export const PLANS: Record<string, Plan[]> = {
  pipeline_burst: [
    {
      id: "valves_then_repair",
      name: "Close valves, then repair",
      summary: "Shut isolation valves to limit flooding of the East Underpass; main repaired by T+8h.",
      isolate: { "PIPE1>UJ1": 0.3 },
      restore: { PIPE1: 8 },
    },
    {
      id: "fast_repair",
      name: "Rapid repair crew",
      summary: "Deploy all crews on the trunk main; repair complete by T+4h.",
      restore: { PIPE1: 4 },
    },
    {
      id: "hospital_shield",
      name: "Hospital shield",
      summary: "Water tankers and generator fuel to City General first; main repaired by T+10h.",
      restore: { PIPE1: 10 },
      backupBoost: { H1: { water: 12, power: 8 } },
    },
  ],
  monsoon_flood: [
    {
      id: "pump_out_underpass",
      name: "Pump out underpass first",
      summary: "Restore road access first so crews and ambulances can move: UJ1 T+3h, PIPE1 T+12h, WT2 T+18h.",
      restore: { UJ1: 3, PIPE1: 12, WT2: 18 },
    },
    {
      id: "water_first",
      name: "Water works first",
      summary: "Prioritise supply: WT2 T+6h, PIPE1 T+8h, UJ1 T+10h.",
      restore: { WT2: 6, PIPE1: 8, UJ1: 10 },
    },
    {
      id: "hospital_shield",
      name: "Hospital shield",
      summary: "Tankers and fuel to both hospitals; pipeline repaired T+6h, underpass T+8h.",
      restore: { PIPE1: 6, UJ1: 8 },
      backupBoost: { H1: { water: 12, power: 8 }, H2: { water: 12, power: 8 } },
    },
  ],
  heatwave_overload: [
    {
      id: "load_shed_restore",
      name: "Load shedding + fast restart",
      summary: "Controlled load shedding to protect the Central Substation (restored T+3h); plant restarted by T+6h.",
      restore: { SUB2: 3, PP1: 6 },
    },
    {
      id: "hospital_fuel",
      name: "Protect hospitals",
      summary: "Generator fuel to both hospitals; Central Substation restored T+4h, plant T+10h.",
      restore: { SUB2: 4, PP1: 10 },
      backupBoost: { H1: { power: 12 }, H2: { power: 12 } },
    },
    {
      id: "substation_first",
      name: "Substation first",
      summary: "Crews on the Central Substation only (T+2h); plant recovers on its own schedule (T+14h).",
      restore: { SUB2: 2, PP1: 14 },
    },
  ],
  cyberattack: [
    {
      id: "manual_restore",
      name: "Manual override restore",
      summary: "Switch to manual control: SUB2 T+4h, SUB3 T+6h, tower T+8h.",
      restore: { SUB2: 4, SUB3: 6, T2: 8 },
    },
    {
      id: "hospital_feeders",
      name: "Hospital feeders first",
      summary: "Generator fuel to hospitals while SUB2 is restored by T+6h and SUB3 by T+10h.",
      restore: { SUB2: 6, SUB3: 10, T2: 12 },
      backupBoost: { H1: { power: 12 }, H2: { power: 12 } },
    },
    {
      id: "full_isolation",
      name: "Isolate and rebuild",
      summary: "Take affected systems offline and rebuild clean: slower (SUB2 T+10h, SUB3 T+12h) but safe.",
      restore: { SUB2: 10, SUB3: 12, T2: 14 },
    },
  ],
  earthquake: [
    {
      id: "power_access_first",
      name: "Power and access first",
      summary: "Triage: SUB1 T+6h, Central Junction T+4h, underpass T+10h, pipeline T+18h, pump T+20h.",
      restore: { SUB1: 6, RJ1: 4, UJ1: 10, PIPE1: 18, PUMPA: 20 },
    },
    {
      id: "water_first",
      name: "Water first",
      summary: "Pipeline T+8h, pump T+10h, then power T+14h and roads T+16h / T+20h.",
      restore: { PIPE1: 8, PUMPA: 10, SUB1: 14, RJ1: 16, UJ1: 20 },
    },
    {
      id: "hospital_shield",
      name: "Hospital shield",
      summary: "Tankers and fuel to both hospitals; junction T+4h, substation T+8h, pipeline T+14h.",
      restore: { RJ1: 4, SUB1: 8, PIPE1: 14, PUMPA: 16 },
      backupBoost: { H1: { water: 12, power: 12 }, H2: { water: 12, power: 12 } },
    },
  ],
};

export interface PlanEvaluation {
  plan: Plan;
  result: SimResult;
  score: number;
  /** % reduction in affected-population-hours vs the no-action baseline (positive = better). */
  affected_pop_hours_saved_pct: number;
  /** Hospital downtime hours avoided vs baseline. */
  hospital_hours_saved: number;
  /** Rough resource load: repairs + isolations (0.5 each) + hospital support packages. */
  resources: number;
  rank: number;
}

export function planResources(plan: Plan): number {
  return (
    Object.keys(plan.restore ?? {}).length +
    Object.keys(plan.isolate ?? {}).length * 0.5 +
    Object.keys(plan.backupBoost ?? {}).length
  );
}

export function evaluatePlans(
  simulate: SimulateFn,
  network: NetworkData,
  hoods: NeighborhoodsData,
  scenario: Scenario,
  plans: Plan[] = PLANS[scenario.id] ?? []
): PlanEvaluation[] {
  const all = [BASELINE_PLAN, ...plans];
  const runs = all.map((plan) => {
    const result = simulate(network, hoods, scenario, {
      restore: plan.restore,
      edgeScale: plan.isolate,
      backupBoost: plan.backupBoost,
    });
    const m = result.summary;
    return { plan, result, score: m.affected_pop_hours + SCORE_WEIGHTS.hospitalDowntimeH * m.hospital_downtime_h };
  });

  const base = runs[0]!;
  const baseAff = base.result.summary.affected_pop_hours;
  const baseHosp = base.result.summary.hospital_downtime_h;

  return runs
    .map((r) => ({
      plan: r.plan,
      result: r.result,
      score: r.score,
      affected_pop_hours_saved_pct:
        baseAff > 0 ? Math.round(((baseAff - r.result.summary.affected_pop_hours) / baseAff) * 1000) / 10 : 0,
      hospital_hours_saved: baseHosp - r.result.summary.hospital_downtime_h,
      resources: planResources(r.plan),
      rank: 0,
    }))
    .sort((a, b) => a.score - b.score)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

// ==========================================
// Legacy Types & Constants (for backwards compatibility)
// ==========================================

export interface PlanMods {
  id: string;
  name: string;
  blurb: string;
  crew: number;
  repairMult: number;
  bufferByKind: Partial<Record<NodeKind, number>>;
  cutLinks: string[];
  ignoreTransport: boolean;
  popMultiplier: number;
}

export const PLAN_WAIT: PlanMods = {
  id: "wait",
  name: "Wait it out",
  blurb: "No action. Let backups run out and crews repair at normal pace.",
  crew: 0,
  repairMult: 1,
  bufferByKind: {},
  cutLinks: [],
  ignoreTransport: false,
  popMultiplier: 1,
};

export const PLAN_VALVE: PlanMods = {
  id: "valve",
  name: "Valve & reroute",
  blurb: "Cut the flood link, extend reservoir buffers, crews repair 40% faster.",
  crew: 4,
  repairMult: 0.6,
  bufferByKind: { pump: 6, waterplant: 4, pipeline: 4 },
  cutLinks: ["UJ1>PIPE1"],
  ignoreTransport: true,
  popMultiplier: 1,
};

export const PLAN_HOSPITALS: PlanMods = {
  id: "hospitals",
  name: "Hospitals first",
  blurb: "Generators and water tankers for hospitals, extra telecom backup.",
  crew: 3,
  repairMult: 1,
  bufferByKind: { hospital: 8, tower: 4 },
  cutLinks: [],
  ignoreTransport: false,
  popMultiplier: 1,
};

export const PLAN_FULL: PlanMods = {
  id: "full",
  name: "Full triage",
  blurb: "All of the above: reroute, hospital backup and faster repair.",
  crew: 8,
  repairMult: 0.6,
  bufferByKind: { hospital: 8, tower: 4, pump: 6, waterplant: 4, pipeline: 4 },
  cutLinks: ["UJ1>PIPE1"],
  ignoreTransport: true,
  popMultiplier: 1,
};

export const LEGACY_PLANS: PlanMods[] = [PLAN_WAIT, PLAN_VALVE, PLAN_HOSPITALS, PLAN_FULL];

export interface CustomParams {
  crew: number;
  repairSpeed: number;
  hospitalBackup: number;
  waterBuffer: number;
  reroute: boolean;
}

export function customPlan(p: CustomParams): PlanMods {
  return {
    id: "custom",
    name: "Custom plan",
    blurb: "Your own mix of crews, hospital backup and water buffers.",
    crew: p.crew,
    repairMult: 1 - p.repairSpeed * 0.6,
    bufferByKind: { hospital: p.hospitalBackup, pump: p.waterBuffer, waterplant: p.waterBuffer, pipeline: p.waterBuffer },
    cutLinks: p.reroute ? ["UJ1>PIPE1"] : [],
    ignoreTransport: p.reroute,
    popMultiplier: 1,
  };
}

export function planById(id: string, custom: CustomParams): PlanMods {
  if (id === "custom") return customPlan(custom);
  return LEGACY_PLANS.find((p) => p.id === id) ?? PLAN_WAIT;
}

export interface Preset {
  id: string;
  label: string;
  icon: string;
  blurb: string;
  triggers: string[];
}

export const PRESETS: Preset[] = [
  { id: "pipeline", label: "Pipeline burst", icon: "💧", blurb: "The Main Pipeline ruptures — water and the East Underpass follow.", triggers: ["PIPE1"] },
  { id: "monsoon", label: "Monsoon flood", icon: "🌧️", blurb: "Flooding takes the South Water Works, pipeline and underpass at once.", triggers: ["PIPE1", "WT2", "UJ1"] },
  { id: "heatwave", label: "Heatwave overload", icon: "🔥", blurb: "Record demand trips the grid plant and the Central Substation.", triggers: ["PP1", "SUB2"] },
  { id: "cyber", label: "Cyberattack", icon: "⚡", blurb: "Intrusion drops Central and South substations plus one telecom tower.", triggers: ["SUB2", "SUB3", "T2"] },
  { id: "quake", label: "Earthquake", icon: "🌎", blurb: "Multi-structure damage: pipeline, North Substation, underpass, junction.", triggers: ["PIPE1", "SUB1", "UJ1", "RJ1", "PUMPA"] },
];

export interface CommandActionDef {
  id: string;
  label: string;
  icon: string;
  cost: number;
  delayHours: number;
  effect: string;
}

export const COMMAND_ACTIONS: CommandActionDef[] = [
  { id: "tankers", label: "Send water tankers", icon: "🚰", cost: 2, delayHours: 2, effect: "Hospitals & pump stations gain +5h water buffer from hour 2" },
  { id: "generators", label: "Deploy generators", icon: "🔌", cost: 2, delayHours: 1, effect: "Hospitals & neighborhoods gain +6h power from hour 1" },
  { id: "closeRoad", label: "Close flooded road", icon: "🚧", cost: 1, delayHours: 1, effect: "Traffic rerouted — transport dependencies held from hour 1" },
  { id: "shelter", label: "Open emergency shelter", icon: "🏚️", cost: 1, delayHours: 2, effect: "30% fewer residents counted affected from hour 2" },
];
