// Run: node scripts/test-plans.mjs
import fs from "node:fs";
import { simulate } from "../src/engine/cascade.ts";
import { evaluatePlans } from "../src/engine/plans.ts";

const read = (f) => JSON.parse(fs.readFileSync(`public/data/${f}`, "utf8"));
const network = read("network.json");
const hoods = read("neighborhoods.geojson");
const { scenarios } = read("scenarios.json");
const fmt = (n) => n.toLocaleString("en-IN");

let failures = 0;
const check = (ok, msg) => { console.log(`  ${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failures++; };

const evals = {};
for (const s of scenarios) {
  const ev = evaluatePlans(simulate, network, hoods, s);
  evals[s.id] = ev;
  console.log(`\n=== ${s.name} ===`);
  console.log("rank  plan                              aff-pop-hrs   saved   hosp-down-h  peak-aff   res");
  for (const e of ev) {
    const m = e.result.summary;
    console.log(
      `${String(e.rank).padStart(3)}   ${e.plan.name.padEnd(32)} ${fmt(m.affected_pop_hours).padStart(12)}  ${(e.affected_pop_hours_saved_pct + "%").padStart(6)}   ${String(m.hospital_downtime_h).padStart(6)}      ${fmt(m.peak_affected_pop).padStart(9)}  ${e.resources}`
    );
  }
}

console.log("\n=== Checks ===");
for (const s of scenarios) {
  const ev = evals[s.id];
  const base = ev.find((e) => e.plan.id === "no_action");
  const best = ev[0];
  check(best.plan.id !== "no_action", `${s.id}: at least one plan beats doing nothing`);
  check(ev.every((e) => e.result.summary.affected_pop_hours <= base.result.summary.affected_pop_hours + 1e-9), `${s.id}: no plan is worse than no action on affected-pop-hours`);
  check(ev.length === 4 && new Set(ev.map((e) => e.rank)).size === 4, `${s.id}: 3 plans + baseline, unique ranks`);
}
const burst = evals.pipeline_burst;
const shield = burst.find((e) => e.plan.id === "hospital_shield");
check(shield.result.summary.hospital_downtime_h === 0, "pipeline_burst: hospital shield keeps City General up for the full 24h");
const again = evaluatePlans(simulate, network, hoods, scenarios[0]);
check(JSON.stringify(again.map((e) => [e.plan.id, e.score])) === JSON.stringify(burst.map((e) => [e.plan.id, e.score])), "deterministic ranking");
console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll plan checks passed");
process.exit(failures ? 1 : 0);
