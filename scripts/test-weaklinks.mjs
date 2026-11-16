// Run: node scripts/test-weaklinks.mjs
import fs from "node:fs";
import { simulate } from "../src/engine/cascade.ts";
import { analyzeWeakLinks } from "../src/engine/weaklinks.ts";

const read = (f) => JSON.parse(fs.readFileSync(`public/data/${f}`, "utf8"));
const network = read("network.json");
const hoods = read("neighborhoods.geojson");
const fmt = (n) => n.toLocaleString("en-IN");

const links = analyzeWeakLinks(simulate, network, hoods);
console.log("rank  node   name                       score  impact struct cond   peak%  hosp-h  knocked");
for (const l of links) {
  console.log(
    `${String(l.rank).padStart(3)}   ${l.node.padEnd(6)} ${l.name.padEnd(26)} ${String(l.score).padStart(5)}  ${String(l.breakdown.impact).padStart(6)} ${String(l.breakdown.structure).padStart(6)} ${String(l.breakdown.condition).padStart(5)}  ${String(l.impact.peak_affected_pct).padStart(5)}  ${String(l.impact.hospital_downtime_h).padStart(5)}   ${l.impact.knocked_out.length}`
  );
}
console.log("\nTop 3 reasons:");
for (const l of links.slice(0, 3)) { console.log(` #${l.rank} ${l.name}`); l.reasons.forEach((r) => console.log("    - " + r)); }

let failures = 0;
const check = (ok, msg) => { console.log(`  ${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failures++; };
const by = Object.fromEntries(links.map((l) => [l.node, l]));
console.log("\n=== Checks ===");
check(links.length === 26, "26 assets analysed");
check(links.every((l) => l.score >= 0 && l.score <= 100), "all scores within 0-100");
check(new Set(links.map((l) => l.rank)).size === 26, "unique ranks 1..26");
check(by.PP1.rank <= 5 || by.SUB2.rank <= 5, "grid plant or central substation is in the top 5");
check(by.SUB2.score > by.T4.score, "central substation outranks a leaf telecom tower");
check(by.PIPE1.score > by.RES2.score, "main pipeline outranks an overhead tank");
check(links.slice(0, 5).some((l) => l.impact.knocked_out.length > 0), "top 5 contains a cascading single point of failure");
check(JSON.stringify(analyzeWeakLinks(simulate, network, hoods).map((l) => l.node)) === JSON.stringify(links.map((l) => l.node)), "deterministic");
console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll weak-link checks passed");
process.exit(failures ? 1 : 0);
