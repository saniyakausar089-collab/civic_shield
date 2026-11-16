// Run: node ml/gen-training-data.mjs [nRuns=6000] [out=ml/training-data.json]
// Generates random failure scenarios, runs the REAL cascade engine on each, and records the outcomes.
import fs from "node:fs";
import { simulate } from "../src/engine/cascade.ts";

const N = parseInt(process.argv[2] ?? "6000", 10);
const out = process.argv[3] ?? "ml/training-data.json";
const read = (f) => JSON.parse(fs.readFileSync(`public/data/${f}`, "utf8"));
const network = read("network.json");
const hoods = read("neighborhoods.geojson");
const ids = network.nodes.map((n) => n.id);

// deterministic RNG so the dataset is reproducible
let seed = 20261029;
const rand = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const targets = ["affected_pop_hours", "hospital_downtime_h", "peak_affected_pop", "final_failed", ...ids.map((i) => `fail:${i}`)];
const X = [];
const Y = [];
const seen = new Set();
// size mix: 1..5 simultaneous failures (presets use 1-5)
const sizes = [1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5];
while (X.length < N) {
  const k = sizes[Math.floor(rand() * sizes.length)];
  const pick = new Set();
  while (pick.size < k) pick.add(ids[Math.floor(rand() * ids.length)]);
  const key = [...pick].sort().join(",");
  if (seen.has(key)) continue;       // every scenario is unique -> honest train/test split
  seen.add(key);
  const scenario = { id: key, name: key, triggers: [...pick].map((n) => ({ node: n, t_hours: 0, severity: 1, event: "x" })) };
  const r = simulate(network, hoods, scenario);
  const everFailed = new Set(r.frames.flatMap((f) => f.failed));
  X.push(ids.map((i) => (pick.has(i) ? 1 : 0)));
  Y.push([r.summary.affected_pop_hours, r.summary.hospital_downtime_h, r.summary.peak_affected_pop, r.summary.final_failed, ...ids.map((i) => (everFailed.has(i) ? 1 : 0))]);
}
fs.writeFileSync(out, JSON.stringify({ features: ids, targets, X, Y }));
console.log(`wrote ${X.length} unique scenarios x ${ids.length} features, ${targets.length} targets -> ${out}`);
