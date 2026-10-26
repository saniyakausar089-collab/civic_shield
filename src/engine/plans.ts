// Response plans, disaster presets and command actions.
import type { NodeKind } from "./types";

export interface PlanMods {
  id: string;
  name: string;
  blurb: string;
  /** crew units this plan costs */
  crew: number;
  /** multiplier applied to repair hours (lower = faster repair) */
  repairMult: number;
  /** extra backup hours granted per node kind */
  bufferByKind: Partial<Record<NodeKind, number>>;
  /** dependency links to cut, as "dependentId>dependencyId" (valve & reroute) */
  cutLinks: string[];
  /** transport dependencies held via rerouting */
  ignoreTransport: boolean;
  /** multiplier on affected population (shelters etc.) */
  popMultiplier: number;
}

export const PLAN_WAIT: PlanMods = {
  id: "wait", name: "Wait it out", blurb: "No action. Let backups run out and crews repair at normal pace.", crew: 0,
  repairMult: 1, bufferByKind: {}, cutLinks: [], ignoreTransport: false, popMultiplier: 1,
};

export const PLAN_VALVE: PlanMods = {
  id: "valve", name: "Valve & reroute", blurb: "Cut the flood link, extend reservoir buffers, crews repair 40% faster.", crew: 4,
  repairMult: 0.6, bufferByKind: { pump: 6, waterplant: 4, pipeline: 4 }, cutLinks: ["UJ1>PIPE1"], ignoreTransport: true, popMultiplier: 1,
};

export const PLAN_HOSPITALS: PlanMods = {
  id: "hospitals", name: "Hospitals first", blurb: "Generators and water tankers for hospitals, extra telecom backup.", crew: 3,
  repairMult: 1, bufferByKind: { hospital: 8, tower: 4 }, cutLinks: [], ignoreTransport: false, popMultiplier: 1,
};

export const PLAN_FULL: PlanMods = {
  id: "full", name: "Full triage", blurb: "All of the above: reroute, hospital backup and faster repair.", crew: 8,
  repairMult: 0.6, bufferByKind: { hospital: 8, tower: 4, pump: 6, waterplant: 4, pipeline: 4 }, cutLinks: ["UJ1>PIPE1"], ignoreTransport: true, popMultiplier: 1,
};

export const PLANS: PlanMods[] = [PLAN_WAIT, PLAN_VALVE, PLAN_HOSPITALS, PLAN_FULL];

export interface CustomParams {
  /** crew units 1..10 — the plan's cost */
  crew: number;
  /** repair speed 0.4 (slow) .. 1 (normal pace) — slider = crew effort on repairs */
  repairSpeed: number;
  /** extra hospital backup hours 0..12 */
  hospitalBackup: number;
  /** extra water buffer hours 0..8 for pumps, plants and the pipeline */
  waterBuffer: number;
  /** reroute traffic (transport deps held) */
  reroute: boolean;
}

export function customPlan(p: CustomParams): PlanMods {
  return {
    id: "custom",
    name: "Custom plan",
    blurb: "Your own mix of crews, hospital backup and water buffers.",
    crew: p.crew,
    repairMult: 1 - p.repairSpeed * 0.6, // slider 0..1 → up to 60% faster
    bufferByKind: { hospital: p.hospitalBackup, pump: p.waterBuffer, waterplant: p.waterBuffer, pipeline: p.waterBuffer },
    cutLinks: p.reroute ? ["UJ1>PIPE1"] : [],
    ignoreTransport: p.reroute,
    popMultiplier: 1,
  };
}

export function planById(id: string, custom: CustomParams): PlanMods {
  if (id === "custom") return customPlan(custom);
  return PLANS.find((p) => p.id === id) ?? PLAN_WAIT;
}

// ---- Disaster presets ----

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

// ---- Emergency command actions ----

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
