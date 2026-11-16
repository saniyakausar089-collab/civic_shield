// Run: node scripts/test-report.mjs
import fs from "node:fs";
import { simulate } from "../src/engine/cascade.ts";
import { evaluatePlans } from "../src/engine/plans.ts";
import { analyzeWeakLinks } from "../src/engine/weaklinks.ts";
import { buildReportFacts, templateNarrative, renderMarkdown, checkNarrativeNumbers, checkUnsupportedTerms, generateNarrative, buildClaudeRequest } from "../src/engine/report.ts";

const read = (f) => JSON.parse(fs.readFileSync(`public/data/${f}`, "utf8"));
const network = read("network.json");
const hoods = read("neighborhoods.geojson");
const { scenarios } = read("scenarios.json");
const weakLinks = analyzeWeakLinks(simulate, network, hoods);

let failures = 0;
const check = (ok, msg) => { console.log(`  ${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failures++; };

const built = {};
for (const s of scenarios) {
  const result = simulate(network, hoods, s);
  const plans = evaluatePlans(simulate, network, hoods, s);
  built[s.id] = { s, result, plans, facts: buildReportFacts({ network, hoods, scenario: s, result, plans, weakLinks }) };
}

console.log("=== Facts vs engine ===");
for (const { s, result, facts } of Object.values(built)) {
  const m = result.summary;
  check(
    facts.headline.peak_affected_pop === m.peak_affected_pop && facts.headline.assets_failed_final === m.final_failed &&
      facts.headline.peak_hospitals_down === m.peak_hospitals_down && facts.headline.first_hospital_down_t === m.first_hospital_down_t,
    `${s.id}: facts match engine summary`
  );
  check(facts.timeline.length > 0 && facts.timeline[0].t === 0, `${s.id}: timeline starts at T+0h`);
  check(facts.recommended_plan !== null && facts.other_plans.length === 2, `${s.id}: recommended plan + 2 alternatives`);
}

console.log("\n=== Template narrative ===");
for (const { s, facts } of Object.values(built)) {
  const n = templateNarrative(facts);
  const bad = checkNarrativeNumbers(n, facts);
  check(bad.length === 0, `${s.id}: template narrative uses only facts${bad.length ? " (unknown: " + bad.join(",") + ")" : ""}`);
}

console.log("\n=== Number verification ===");
const monsoon = built.monsoon_flood.facts;
check(checkNarrativeNumbers("Peak impact hit 5,68,000 residents at T+5h.", monsoon).length === 0, "accepts figures that are in the facts");
check(checkNarrativeNumbers("About 9,99,999 residents lost power.", monsoon).join() === "999999", "flags an invented figure");
check(checkNarrativeNumbers("Two hospitals and 3 areas were hit.", monsoon).length === 0, "ignores small counts (<10)");

console.log("\n=== Unsupported-term check (regression: '5 response crews') ===");
const crewText = `The plan is projected to avoid ${monsoon.recommended_plan.hospital_hours_saved} hospital outage hours using 5 response crews.`;
check(checkNarrativeNumbers(crewText, monsoon).length === 0, "the number check alone does NOT catch '5 crews' (5 exists elsewhere in the facts)");
check(checkUnsupportedTerms(crewText, monsoon).includes("crew"), "unsupported-term check flags 'crews'");
check(checkUnsupportedTerms("Estimated cost and casualties were low.", monsoon).join() === "cost,casualt", "flags cost / casualties claims");
check(Object.values(built).every(({ facts }) => checkUnsupportedTerms(templateNarrative(facts), facts).length === 0), "template narratives contain no unsupported terms");

console.log("\n=== generateNarrative (mocked Claude API) ===");
const calls = [];
const mockFetch = (text, status = 200) => async (url, init) => {
  calls.push({ url, init });
  return { ok: status === 200, status, json: async () => ({ content: [{ type: "text", text }] }) };
};
const good = `**Situation.** Flood. **Impact.** ${monsoon.display.peak_affected_pop} residents (${monsoon.headline.peak_affected_pct}%) at ${monsoon.display.peak_t}.`;
let r = await generateNarrative(monsoon, { apiKey: "sk-test-123", fetchImpl: mockFetch(good) });
check(r.source === "claude" && r.verified, "good Claude text accepted and verified");
const call = calls[0];
check(call.url === "https://api.anthropic.com/v1/messages" && call.init.headers["x-api-key"] === "sk-test-123" && call.init.headers["anthropic-version"] === "2023-06-01", "request goes to Anthropic with key in header");
check(!call.init.body.includes("sk-test-123"), "API key never appears in the request body");
const body = JSON.parse(call.init.body);
check(body.system.includes("ONLY facts") && body.messages[0].content.includes('"peak_affected_pop"'), "request carries the grounding prompt and facts JSON");
r = await generateNarrative(monsoon, { apiKey: "sk-test-123", fetchImpl: mockFetch(crewText) });
check(r.source === "claude" && !r.verified && r.unverified_terms.includes("crew"), "Claude text mentioning crews is flagged as unverified");
r = await generateNarrative(monsoon, { apiKey: "sk-test-123", fetchImpl: mockFetch("About 9,99,999 residents were affected.") });
check(r.source === "claude" && !r.verified && r.unverified_numbers.includes("999999"), "Claude text with invented number is flagged as unverified");
r = await generateNarrative(monsoon, { fetchImpl: mockFetch(good) });
check(r.source === "template" && r.verified, "no API key -> template narrative");
r = await generateNarrative(monsoon, { apiKey: "k", fetchImpl: mockFetch("x", 500) });
check(r.source === "template" && /HTTP 500/.test(r.error ?? ""), "HTTP error -> template fallback with error note");
r = await generateNarrative(monsoon, { apiKey: "k", fetchImpl: async () => { throw new Error("network down"); } });
check(r.source === "template" && r.error === "network down", "network failure -> template fallback");

const md = renderMarkdown(monsoon, templateNarrative(monsoon), "template");
fs.writeFileSync("sample-report-monsoon.md", md);
check(md.includes("# CIVICSHIELD Incident Brief: Monsoon flood") && md.includes("## Limitations"), "markdown report renders");
console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll report checks passed (sample written to sample-report-monsoon.md)");
process.exit(failures ? 1 : 0);
