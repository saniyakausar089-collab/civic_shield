// Run: node scripts/test-surrogate.mjs
import fs from "node:fs";
import { simulate } from "../src/engine/cascade.ts";
import { predictSurrogate } from "../src/engine/surrogate.ts";

const read = (f) => JSON.parse(fs.readFileSync(`public/data/${f}`, "utf8"));
const network = read("network.json");
const hoods = read("neighborhoods.geojson");
const { scenarios } = read("scenarios.json");
const model = read("surrogate-model.json");
const fx = JSON.parse(fs.readFileSync("ml/fixtures.json", "utf8"));
const fmt = (n) => n.toLocaleString("en-IN");

let failures = 0;
const check = (ok, msg) => { console.log(`  ${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failures++; };

console.log(`model: ${model.trained_on} training runs, ${model.tested_on} held-out runs`);
for (const [k, v] of Object.entries(model.metrics))
  console.log(typeof v === "number" ? `  ${k}: ${v}` : `  ${k}: R2 ${v.r2_model} (additive baseline ${v.r2_additive_baseline})`);

console.log("\n=== JS inference matches scikit-learn ===");
let maxRel = 0, maxFailDiff = 0;
fx.X.forEach((x, i) => {
  const ids = model.features.filter((_, j) => x[j] === 1);
  const p = predictSurrogate(model, ids);
  const a = [p.affected_pop_hours, p.hospital_downtime_h, p.peak_affected_pop, p.final_failed];
  // the JS API rounds its outputs for display (1, 0.1, 1, 1 steps), so allow half a step of rounding
  const half = [0.5, 0.05, 0.5, 0.5];
  a.forEach((v, j) => { const s = model.heads.agg.scale[j]; maxRel = Math.max(maxRel, Math.max(0, Math.abs(v - fx.agg[i][j]) - half[j]) / s); });
  // JS additionally zeroes assets that are neither triggers nor downstream of one; compare only the reachable ones
  const reach = new Set(ids);
  ids.forEach((id) => (model.descendants[id] ?? []).forEach((d) => reach.add(d)));
  model.heads.fail.targets.forEach((t, j) => {
    const id = t.replace("fail:", "");
    const got = p.asset_failure_probability[id];
    maxFailDiff = Math.max(maxFailDiff, reach.has(id) ? Math.abs(got - fx.fail[i][j]) : got);
  });
});
check(maxRel < 2e-3, `aggregate predictions match sklearn after display rounding (max residual ${(maxRel * 100).toFixed(3)}%)`);
check(maxFailDiff < 2e-3, `failure probabilities match sklearn on reachable assets and are 0 elsewhere (max diff ${maxFailDiff.toFixed(4)})`);

console.log("\n=== Surrogate vs real engine on the preset scenarios (all triggers treated as simultaneous) ===");
console.log("scenario              | engine aff-pop-hrs | surrogate | err%  | engine hosp-h | surrogate | final failed (eng/surr)");
const errs = {};
for (const s of scenarios) {
  const simult = { ...s, triggers: s.triggers.map((t) => ({ ...t, t_hours: 0 })) };
  const r = simulate(network, hoods, simult).summary;
  const p = predictSurrogate(model, s.triggers.map((t) => t.node));
  const err = ((p.affected_pop_hours - r.affected_pop_hours) / r.affected_pop_hours) * 100;
  errs[s.id] = Math.abs(err);
  console.log(`${s.id.padEnd(21)} | ${fmt(r.affected_pop_hours).padStart(18)} | ${fmt(p.affected_pop_hours).padStart(9)} | ${err.toFixed(1).padStart(5)} | ${String(r.hospital_downtime_h).padStart(13)} | ${String(p.hospital_downtime_h).padStart(9)} | ${r.final_failed}/${p.final_failed}`);
}
check(Object.values(errs).every((e) => e < 25), "preset estimates within 25% of the engine on affected population-hours");

console.log("\n=== Sanity ===");
const p = predictSurrogate(model, ["PIPE1"]);
const top = Object.entries(p.asset_failure_probability).sort((a, b) => b[1] - a[1]).slice(0, 4);
console.log("  PIPE1 fails -> most likely victims:", top.map(([k, v]) => `${k} ${(v * 100).toFixed(0)}%`).join(", "));
check(p.asset_failure_probability.PIPE1 > 0.95, "a triggered asset is predicted to fail (~100%)");
check(p.asset_failure_probability.PUMPA > 0.8, "PIPE1 failure predicts Pumping Station A failure");
check(p.asset_failure_probability.T3 < 0.2, "PIPE1 failure does not predict an unrelated telecom tower failure");
// regression: physically impossible victims (the agent's UI once listed WT1, SUB2, PP1 for a pipeline burst)
for (const impossible of ["WT1", "SUB2", "PP1", "T3"]) check(p.asset_failure_probability[impossible] === 0, `PIPE1 failure gives ${impossible} zero probability (not downstream of PIPE1)`);
// accuracy against the engine on every single-asset failure
const ids = network.nodes.map((n) => n.id);
let tp = 0, fp = 0, fn = 0;
for (const id of ids) {
  const r = simulate(network, hoods, { id, name: id, triggers: [{ node: id, t_hours: 0, severity: 1, event: "x" }] });
  const truth = new Set(r.frames.flatMap((f) => f.failed));
  const pr = predictSurrogate(model, [id]).asset_failure_probability;
  for (const a of ids) { const pred = pr[a] >= 0.5, real = truth.has(a); if (pred && real) tp++; else if (pred) fp++; else if (real) fn++; }
}
console.log(`  single-asset failures vs engine: precision ${(tp / (tp + fp)).toFixed(2)}, recall ${(tp / (tp + fn)).toFixed(2)} (TP ${tp}, FP ${fp}, FN ${fn})`);
check(tp / (tp + fp) >= 0.8 && tp / (tp + fn) >= 0.8, "single-asset victim lists: precision and recall both >= 0.8");
check(predictSurrogate(model, []).in_distribution === false && predictSurrogate(model, ["PIPE1"]).in_distribution === true, "flags inputs outside the training range");
console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll surrogate checks passed");
process.exit(failures ? 1 : 0);
