// Run: node scripts/test-engine.mjs   (Node 22.18+ runs .ts directly)
import fs from "node:fs";
import { simulate } from "../src/engine/cascade.ts";

const read = (f) => JSON.parse(fs.readFileSync(`public/data/${f}`, "utf8"));
const network = read("network.json");
const hoods = read("neighborhoods.geojson");
const { scenarios } = read("scenarios.json");
const nameOf = Object.fromEntries(network.nodes.map((n) => [n.id, n.name]));

let failures = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${msg}`);
  if (!ok) failures++;
};
const fmt = (n) => n.toLocaleString("en-IN");

// ---------- run every scenario ----------
const results = {};
for (const s of scenarios) {
  const r = simulate(network, hoods, s);
  results[s.id] = r;
  const m = r.summary;
  console.log(`\n=== ${s.name} ===`);
  console.log(
    `peak affected: ${fmt(m.peak_affected_pop)} / ${fmt(r.total_population)} at T+${m.peak_t}h | ` +
      `failed(final): ${m.final_failed} degraded(final): ${m.final_degraded} | ` +
      `hospitals down (peak): ${m.peak_hospitals_down} first at ${m.first_hospital_down_t === null ? "never" : "T+" + m.first_hospital_down_t + "h"}`
  );
  for (const e of r.events.slice(0, 14)) console.log(`   T+${String(e.t).padStart(2, "0")}h  [${e.kind}] ${e.text}`);
  if (r.events.length > 14) console.log(`   ... ${r.events.length - 14} more events`);
}

// ---------- invariants ----------
console.log("\n=== Checks ===");

const empty = simulate(network, hoods, { id: "none", name: "none", triggers: [] });
check(empty.frames.every((f) => f.failed.length === 0 && f.degraded.length === 0 && f.affected_pop === 0), "no triggers -> everything stays normal");

for (const [id, r] of Object.entries(results)) {
  let monotone = true;
  for (const n of network.nodes) {
    for (let t = 1; t < r.frames.length; t++) {
      if (r.frames[t].functionality[n.id] > r.frames[t - 1].functionality[n.id] + 1e-9) monotone = false;
    }
  }
  check(monotone, `${id}: functionality never improves without repairs (monotone)`);
}

const sc = Object.fromEntries(scenarios.map((s) => [s.id, s]));
for (const s of scenarios) {
  const r = results[s.id];
  const ok = s.triggers.every((t) => r.frames[t.t_hours].status[t.node] === "failed");
  check(ok, `${s.id}: every trigger node is failed at its trigger hour`);
}

const burst = results.pipeline_burst;
check(burst.frames[3].status.PUMPA === "failed", "pipeline_burst: Pumping Station A fails downstream of PIPE1");
check(burst.frames[3].status.UJ1 === "failed", "pipeline_burst: East Underpass floods (hazard edge)");
check(burst.frames[24].affected_pop > 0, "pipeline_burst: neighborhoods end up affected");

const flood = results.monsoon_flood;
check(flood.summary.peak_affected_pop >= burst.summary.peak_affected_pop, "monsoon_flood is at least as bad as pipeline_burst");

const heat = results.heatwave_overload;
check(heat.frames[6].failed.includes("SUB3") || heat.frames[6].degraded.includes("SUB3"), "heatwave: loss of PP1 spreads to downstream substations");
check(heat.summary.first_hospital_down_t === null || heat.summary.first_hospital_down_t >= 6, "heatwave: hospital backup power delays hospital failure (>= 6h)");
check(heat.frames[0].affected_pop < heat.total_population, "heatwave: not an instant total blackout at T+0");
check(heat.frames[24].affected_pop > heat.frames[0].affected_pop, "heatwave: impact grows over time (cascade develops)");
const cyber = results.cyberattack;
check(cyber.frames[0].affected_pop < cyber.total_population, "cyberattack: not an instant total blackout at T+0");
check(!burst.frames[24].failed.includes("WT2") && !burst.frames[24].failed.includes("WT1"), "pipeline_burst: upstream water plants are not damaged by a downstream burst");
const noFlood = simulate(network, hoods, sc.heatwave_overload);
check(noFlood.frames[24].functionality.UJ1 > 0.5, "heatwave: loss of water supply does not flood the East Underpass (hazard = physical damage only)");

const quake = results.earthquake;
const severity = scenarios.map((s) => [s.id, results[s.id].summary.affected_pop_hours]).sort((a, b) => b[1] - a[1]);
console.log(`\nSeverity ranking (affected-pop-hours): ${severity.map(([i, v]) => `${i}=${fmt(v)}`).join(" > ")}`);
check(quake.summary.final_failed >= burst.summary.final_failed, "earthquake fails at least as many nodes as pipeline_burst");

// repair test
const fixed = simulate(network, hoods, sc.pipeline_burst, { restore: { PIPE1: 4, UJ1: 4 } });
check(fixed.frames[12].status.PUMPA === "normal", "restoring PIPE1 at T+4h brings Pumping Station A back to normal");
check(fixed.summary.affected_pop_hours < burst.summary.affected_pop_hours, "repair plan reduces affected-pop-hours vs no repair");

// determinism
const again = simulate(network, hoods, sc.monsoon_flood);
check(JSON.stringify(again.summary) === JSON.stringify(results.monsoon_flood.summary), "deterministic: same input gives same output");

console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll engine checks passed");
process.exit(failures ? 1 : 0);
