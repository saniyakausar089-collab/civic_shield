// Analysis tools: weakest links, Monte Carlo, budget optimizer, resilience
// score, city modifications (what-if builder).
import type { City, CityNode } from "./types";
import { runSim, type SimResult } from "./sim";
import { BASE_CITY, cloneCity, nodeById, totalPopulation } from "./city";
import { PRESETS, type Preset } from "./plans";

// Deterministic RNG so Monte Carlo runs are reproducible.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Composite harm score used to rank plans and weakest links. */
export function analyzeHarm(r: SimResult): number {
  return r.personHoursLost + r.hospitalHoursDown * 3000 + r.systemsFailed * 500;
}

// ---- Weakest links (a criticality heuristic, not a validated risk model) ----

export interface WeakLink {
  nodeId: string;
  name: string;
  kind: CityNode["kind"];
  harm: number;
  /** 0–100 criticality heuristic */
  score: number;
}

export function weakestLinks(city: City): WeakLink[] {
  const rows = city.nodes.map((n) => {
    const result = runSim(city, [n.id]);
    return { nodeId: n.id, name: n.name, kind: n.kind, harm: analyzeHarm(result) };
  });
  const max = Math.max(...rows.map((r) => r.harm), 1);
  return rows
    .map((r) => ({ ...r, score: Math.round((100 * r.harm) / max) }))
    .sort((a, b) => b.harm - a.harm);
}

// ---- Monte Carlo ----

export interface MonteCarloResult {
  runs: number;
  bands: { hour: number; min: number; p25: number; med: number; p75: number; max: number }[];
  worst: SimResult;
  median: SimResult;
  best: SimResult;
  cascadeProbability: number;
}

function jitterCity(city: City, rng: () => number): City {
  const j = (lo: number, hi: number) => lo + rng() * (hi - lo);
  return {
    nodes: city.nodes.map((n) => ({
      ...n,
      failureThreshold: Math.min(0.95, n.failureThreshold * j(0.75, 1.25)),
      backupHours: Math.max(0, Math.round(n.backupHours * j(0.7, 1.3))),
      repairHours: Math.max(1, Math.round(n.repairHours * j(0.6, 1.4))),
      deps: n.deps.map((d) => ({ ...d })),
    })),
  };
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
}

export function monteCarlo(city: City, triggers: string[], runs = 200, seed = 42): MonteCarloResult {
  const rng = mulberry32(seed);
  const sims: SimResult[] = [];
  for (let i = 0; i < runs; i++) sims.push(runSim(jitterCity(city, rng), triggers));
  const order = sims.map((s, i) => i).sort((a, b) => analyzeHarm(sims[a]) - analyzeHarm(b, ));

  const bands = [];
  for (let h = 0; h <= 24; h++) {
    const vals = sims.map((s) => s.hours[h].affectedPopulation).sort((a, b) => a - b);
    bands.push({
      hour: h,
      min: vals[0],
      p25: percentile(vals, 0.25),
      med: percentile(vals, 0.5),
      p75: percentile(vals, 0.75),
      max: vals[vals.length - 1],
    });
  }
  const cascadeProbability = sims.filter((s) => s.systemsFailed >= 3).length / sims.length;
  return {
    runs,
    bands,
    worst: sims[order[order.length - 1]],
    median: sims[order[Math.floor(order.length / 2)]],
    best: sims[order[0]],
    cascadeProbability,
  };
}

// ---- City modifications (what-if builder) ----

export type CityMod =
  | { type: "backup"; nodeId: string; hours: number; label: string }
  | { type: "redundantPower"; nodeId: string; label: string }
  | { type: "secondWaterLine"; label: string }
  | { type: "floodBarrier"; label: string };

function nearestAlternateSubstation(city: City, node: CityNode): string | null {
  const subs = city.nodes.filter((n) => n.kind === "substation");
  const existing = new Set(node.deps.map((d) => d.id));
  const candidates = subs
    .filter((s) => !existing.has(s.id))
    .sort((a, b) => Math.hypot(a.x - node.x, a.y - node.y) - Math.hypot(b.x - node.x, b.y - node.y));
  return candidates[0]?.id ?? null;
}

export function applyMods(city: City, mods: CityMod[]): City {
  const out = cloneCity(city);
  for (const m of mods) {
    if (m.type === "backup") {
      const n = nodeById(out, m.nodeId);
      if (n) n.backupHours += m.hours;
    } else if (m.type === "redundantPower") {
      const n = nodeById(out, m.nodeId);
      if (!n) continue;
      const powerDeps = n.deps.filter((d) => d.layer === "power");
      const alt = nearestAlternateSubstation(out, n);
      if (powerDeps.length === 1 && alt) {
        powerDeps[0].weight /= 2;
        n.deps.push({ id: alt, weight: powerDeps[0].weight, layer: "power" });
      }
    } else if (m.type === "secondWaterLine") {
      const pipe = out.nodes.find((n) => n.kind === "pipeline");
      const wt2 = out.nodes.find((n) => n.id === "WT2");
      if (pipe && wt2 && !pipe.deps.some((d) => d.id === "WT2" && d.weight >= 0.5)) {
        pipe.deps = [ { id: "WT1", weight: 0.5, layer: "water" }, { id: "WT2", weight: 0.5, layer: "water" } ];
      }
    } else if (m.type === "floodBarrier") {
      const uj = out.nodes.find((n) => n.id === "UJ1");
      if (uj) uj.backupHours = 24;
      for (const id of ["RJ1", "RJ2"]) {
        const r = out.nodes.find((n) => n.id === id);
        if (r) r.backupHours += 2;
      }
    }
  }
  return out;
}

// ---- Budget optimizer ----

export interface Upgrade {
  id: string;
  label: string;
  cost: number;
  mod: CityMod;
}

export const UPGRADES: Upgrade[] = [
  { id: "gen_h1", label: "Backup generator — Eastside Medical", cost: 2, mod: { type: "backup", nodeId: "H1", hours: 10, label: "Generator H1" } },
  { id: "gen_h2", label: "Backup generator — Riverside Hospital", cost: 2, mod: { type: "backup", nodeId: "H2", hours: 10, label: "Generator H2" } },
  { id: "tank_pumps", label: "Reservoir tanks at all pump stations", cost: 2, mod: { type: "backup", nodeId: "PUMPB", hours: 6, label: "Pump tanks" } },
  { id: "tank_pumps2", label: "Second pump buffer set", cost: 2, mod: { type: "backup", nodeId: "PUMPA", hours: 6, label: "Pump tanks A/C" } },
  { id: "cut_flood", label: "Flood valve on the East Underpass", cost: 1, mod: { type: "floodBarrier", label: "Flood valve" } },
  { id: "second_line", label: "Second water main into the pipeline", cost: 3, mod: { type: "secondWaterLine", label: "Second water main" } },
  { id: "sub_redundancy", label: "Redundant feed — Central Substation", cost: 3, mod: { type: "redundantPower", nodeId: "SUB2", label: "Redundant SUB2 feed" } },
  { id: "tower_batteries", label: "Battery banks at all towers", cost: 1, mod: { type: "backup", nodeId: "T1", hours: 6, label: "Tower batteries" } },
];

export interface BudgetCombo {
  upgrades: Upgrade[];
  harm: number;
  result: SimResult;
}

export function optimizeBudget(city: City, triggers: string[], budget: number): { best: BudgetCombo[]; baseline: SimResult } {
  const baseline = runSim(city, triggers);
  const combos: BudgetCombo[] = [];
  const n = UPGRADES.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    const chosen: Upgrade[] = [];
    let cost = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        chosen.push(UPGRADES[i]);
        cost += UPGRADES[i].cost;
      }
    }
    if (cost > budget) continue;
    const modded = applyMods(city, chosen.map((u) => u.mod));
    const result = runSim(modded, triggers);
    combos.push({ upgrades: chosen, harm: analyzeHarm(result), result });
  }
  combos.sort((a, b) => a.harm - b.harm);
  return { best: combos.slice(0, 3), baseline };
}

// ---- Resilience score ----

/** 0–100 gauge across all disaster presets for the current city. */
export function resilienceScore(city: City): number {
  const harms = PRESETS.map((p: Preset) => analyzeHarm(runSim(city, p.triggers)));
  const avg = harms.reduce((s, h) => s + h, 0) / harms.length;
  const norm = avg / Math.max(1, totalPopulation(city) * 24);
  return Math.max(1, Math.min(99, Math.round(100 * (1 - norm))));
}

export { BASE_CITY };
