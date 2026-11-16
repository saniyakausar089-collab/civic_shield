/**
 * CIVICSHIELD incident report (Phase 5a).
 *
 * Flow:  engine result  ->  buildReportFacts()  ->  narrative  ->  renderMarkdown()
 *
 *  - Every number in a report comes from the engine (facts), never from the LLM.
 *  - generateNarrative() asks Claude to put the facts into plain language, then
 *    checkNarrativeNumbers() verifies Claude did not introduce a figure that is not in the facts.
 *  - With no API key, or on any error, a deterministic template narrative is used,
 *    so the Report tab always works (offline demo, Rs 0 budget).
 *  - The API key is a function argument: call generateNarrative() from SERVER code only.
 *
 * No runtime imports, so it runs in Node, the browser, and a server route.
 */
import type { NetworkData, NeighborhoodsData, Scenario, SimResult } from "./cascade";
import type { PlanEvaluation } from "./plans";
import type { WeakLink } from "./weaklinks";

export const TESTBED_NAME = "Hyderabad Urban Sector (Synthetic Testbed)";

export const CAVEATS = [
  "All infrastructure, populations and dependencies are synthetic. This is a simulation prototype, not a prediction for the real city.",
  "Real-world accuracy would require validated utility data and rigorous testing.",
  "Response-plan timings are illustrative assumptions.",
];

const fmt = (n: number) => n.toLocaleString("en-IN");
const tLabel = (t: number) => `T+${t}h`;

export interface ReportFacts {
  testbed: string;
  scenario: { id: string; name: string; trigger_assets: string[] };
  horizon_h: number;
  headline: {
    total_population: number;
    peak_affected_pop: number;
    peak_affected_pct: number;
    peak_t: number;
    assets_failed_final: number;
    assets_total: number;
    peak_hospitals_down: number;
    hospitals_total: number;
    first_hospital_down_t: number | null;
  };
  display: {
    total_population: string;
    peak_affected_pop: string;
    peak_t: string;
    assets_failed: string;
    hospitals: string;
    first_hospital_down: string;
  };
  timeline: { t: number; label: string; text: string }[];
  most_affected_neighborhoods: { name: string; population: number; peak_impact_pct: number; hours_affected: number }[];
  hospitals: { name: string; first_degraded_t: number | null; first_down_t: number | null; down_hours: number; backup_power_hours: number; backup_water_hours: number }[];
  failed_assets_final: string[];
  weak_link_context: { trigger_assets: { name: string; rank: number; score: number }[] };
  recommended_plan: null | {
    name: string;
    summary: string;
    affected_pop_hours_saved_pct: number;
    hospital_hours_saved: number;
    resources: number;
    resources_note: string;
  };
  other_plans: { name: string; affected_pop_hours_saved_pct: number; hospital_hours_saved: number }[];
  caveats: string[];
}

export interface BuildInput {
  network: NetworkData;
  hoods: NeighborhoodsData;
  scenario: Scenario;
  result: SimResult;
  plans?: PlanEvaluation[];
  weakLinks?: WeakLink[];
}

export function buildReportFacts(input: BuildInput): ReportFacts {
  const { network, hoods, scenario, result, plans, weakLinks } = input;
  const nameOf = new Map(network.nodes.map((n) => [n.id, n.name]));
  const netOf = new Map(network.nodes.map((n) => [n.id, n.network]));
  const hospitals = network.nodes.filter((n) => n.type === "hospital");
  const m = result.summary;
  const total = result.total_population;
  const pct = total > 0 ? Math.round((m.peak_affected_pop / total) * 100) : 0;

  // timeline milestones: all triggers, hospital events, first failure in each utility network
  const seenNet = new Set<string>();
  const picked: { t: number; text: string }[] = [];
  for (const e of result.events) {
    const isHospital = hospitals.some((h) => h.id === e.node);
    const net = netOf.get(e.node) ?? "";
    let keep = e.kind === "trigger" || isHospital;
    if (!keep && e.kind === "cascade" && e.to === "failed" && !seenNet.has(net)) {
      seenNet.add(net);
      keep = true;
    }
    if (keep) picked.push({ t: e.t, text: e.text });
  }
  const timeline = picked.slice(0, 12).map((e) => ({ t: e.t, label: tLabel(e.t), text: e.text }));

  // neighborhoods
  const hoodRows = hoods.features.map((f) => {
    const id = f.properties.id;
    let peak = 0;
    let hours = 0;
    for (const fr of result.frames) {
      const v = fr.neighborhood_impact[id] ?? 0;
      if (v > peak) peak = v;
      if (v >= 0.25) hours++;
    }
    return { name: f.properties.name, population: f.properties.population, peak_impact_pct: Math.round(peak * 100), hours_affected: hours };
  });
  hoodRows.sort((a, b) => b.peak_impact_pct - a.peak_impact_pct || b.population - a.population);

  // hospitals
  const hospRows = hospitals.map((h) => {
    let firstDeg: number | null = null;
    let firstDown: number | null = null;
    let downH = 0;
    for (const fr of result.frames) {
      const s = fr.status[h.id];
      if (s === "degraded" && firstDeg === null) firstDeg = fr.t;
      if (s === "failed") {
        if (firstDown === null) firstDown = fr.t;
        downH++;
      }
    }
    return {
      name: h.name,
      first_degraded_t: firstDeg,
      first_down_t: firstDown,
      down_hours: downH,
      backup_power_hours: h.backup_power_hours ?? 0,
      backup_water_hours: h.backup_water_hours ?? 0,
    };
  });

  const last = result.frames[result.frames.length - 1];
  const failedFinal = (last?.failed ?? []).map((id) => nameOf.get(id) ?? id);

  const ranked = (plans ?? []).filter((p) => p.plan.id !== "no_action").sort((a, b) => a.rank - b.rank);
  const best = plans && plans.length > 0 && plans[0]?.plan.id !== "no_action" ? plans[0] : undefined;
  const recommended = best
    ? {
        name: best.plan.name,
        summary: best.plan.summary,
        affected_pop_hours_saved_pct: best.affected_pop_hours_saved_pct,
        hospital_hours_saved: best.hospital_hours_saved,
        resources: best.resources,
        resources_note: "abstract effort score (repairs + 0.5 per isolation + support packages); it is not a headcount of people",
      }
    : null;

  const wlRank = new Map((weakLinks ?? []).map((w) => [w.node, w]));
  const triggerAssets = scenario.triggers.map((t) => nameOf.get(t.node) ?? t.node);

  return {
    testbed: TESTBED_NAME,
    scenario: { id: scenario.id, name: scenario.name, trigger_assets: triggerAssets },
    horizon_h: result.horizon_h,
    headline: {
      total_population: total,
      peak_affected_pop: m.peak_affected_pop,
      peak_affected_pct: pct,
      peak_t: m.peak_t,
      assets_failed_final: m.final_failed,
      assets_total: network.nodes.length,
      peak_hospitals_down: m.peak_hospitals_down,
      hospitals_total: hospitals.length,
      first_hospital_down_t: m.first_hospital_down_t,
    },
    display: {
      total_population: fmt(total),
      peak_affected_pop: fmt(m.peak_affected_pop),
      peak_t: tLabel(m.peak_t),
      assets_failed: `${m.final_failed} of ${network.nodes.length}`,
      hospitals: `${m.peak_hospitals_down} of ${hospitals.length}`,
      first_hospital_down: m.first_hospital_down_t === null ? "none within the horizon" : tLabel(m.first_hospital_down_t),
    },
    timeline,
    most_affected_neighborhoods: hoodRows.slice(0, 3),
    hospitals: hospRows,
    failed_assets_final: failedFinal,
    weak_link_context: {
      trigger_assets: scenario.triggers
        .map((t) => wlRank.get(t.node))
        .filter((w): w is WeakLink => w !== undefined)
        .map((w) => ({ name: w.name, rank: w.rank, score: w.score })),
    },
    recommended_plan: recommended,
    other_plans: ranked
      .filter((p) => !best || p.plan.id !== best.plan.id)
      .map((p) => ({ name: p.plan.name, affected_pop_hours_saved_pct: p.affected_pop_hours_saved_pct, hospital_hours_saved: p.hospital_hours_saved })),
    caveats: CAVEATS,
  };
}

// ---------------------------------------------------------------- narrative

/** Deterministic narrative: always available, always consistent with the facts. */
export function templateNarrative(f: ReportFacts): string {
  const h = f.headline;
  const lines: string[] = [];
  lines.push(
    `**Situation.** In the ${f.testbed}, the "${f.scenario.name}" scenario starts with the loss of ${f.scenario.trigger_assets.join(", ")}.`
  );
  lines.push(
    `**Cascade.** The failure spreads across connected utilities. By the end of the ${f.horizon_h}-hour horizon, ${f.display.assets_failed} assets are out of service.`
  );
  lines.push(
    `**Impact.** Service loss peaks at ${f.display.peak_t}, affecting ${f.display.peak_affected_pop} of ${f.display.total_population} residents (${h.peak_affected_pct}%).` +
      (f.most_affected_neighborhoods.length > 0
        ? ` The hardest-hit areas are ${f.most_affected_neighborhoods.map((n) => n.name).join(", ")}.`
        : "")
  );
  if (h.peak_hospitals_down > 0) {
    const down = f.hospitals.filter((x) => x.first_down_t !== null).map((x) => `${x.name} (from ${tLabel(x.first_down_t as number)})`);
    lines.push(`**Hospitals.** ${f.display.hospitals} hospitals go offline: ${down.join("; ")}.`);
  } else {
    lines.push(`**Hospitals.** No hospital goes offline within the ${f.horizon_h}-hour horizon.`);
  }
  if (f.recommended_plan) {
    const p = f.recommended_plan;
    lines.push(
      `**Recommended action.** The best-ranked response is "${p.name}": ${p.summary} It reduces affected population-hours by ${p.affected_pop_hours_saved_pct}% and avoids ${p.hospital_hours_saved} hospital-downtime hours compared with taking no action.`
    );
  } else {
    lines.push(`**Recommended action.** No response plan was evaluated for this run.`);
  }
  lines.push(`**Limitations.** ${f.caveats[0]}`);
  return lines.join("\n\n");
}

export function renderMarkdown(f: ReportFacts, narrative: string, source: "claude" | "template" = "template"): string {
  const out: string[] = [];
  out.push(`# CIVICSHIELD Incident Brief: ${f.scenario.name}`);
  out.push(`*${f.testbed}. Narrative: ${source === "claude" ? "AI-written from engine facts" : "template from engine facts"}.*`);
  out.push(narrative);
  out.push(`## Key figures`);
  out.push(
    [
      `- Peak affected residents: ${f.display.peak_affected_pop} of ${f.display.total_population} (${f.headline.peak_affected_pct}%) at ${f.display.peak_t}`,
      `- Assets failed by T+${f.horizon_h}h: ${f.display.assets_failed}`,
      `- Hospitals offline at peak: ${f.display.hospitals} (first: ${f.display.first_hospital_down})`,
    ].join("\n")
  );
  if (f.timeline.length > 0) {
    out.push(`## Timeline`);
    out.push(f.timeline.map((e) => `- ${e.label}: ${e.text}`).join("\n"));
  }
  if (f.most_affected_neighborhoods.length > 0) {
    out.push(`## Most affected neighborhoods`);
    out.push(
      f.most_affected_neighborhoods
        .map((n) => `- ${n.name}: peak service loss ${n.peak_impact_pct}%, population ${fmt(n.population)}, ${n.hours_affected} hours affected`)
        .join("\n")
    );
  }
  if (f.recommended_plan || f.other_plans.length > 0) {
    out.push(`## Response plans compared`);
    const rows: string[] = [];
    if (f.recommended_plan)
      rows.push(`- RECOMMENDED ${f.recommended_plan.name}: ${f.recommended_plan.affected_pop_hours_saved_pct}% population-hours saved, ${f.recommended_plan.hospital_hours_saved} hospital hours avoided`);
    for (const p of f.other_plans) rows.push(`- ${p.name}: ${p.affected_pop_hours_saved_pct}% population-hours saved, ${p.hospital_hours_saved} hospital hours avoided`);
    out.push(rows.join("\n"));
  }
  if (f.weak_link_context.trigger_assets.length > 0) {
    out.push(`## Vulnerability context`);
    out.push(f.weak_link_context.trigger_assets.map((w) => `- ${w.name}: weak-link rank #${w.rank} of ${f.headline.assets_total} (score ${w.score})`).join("\n"));
  }
  out.push(`## Limitations`);
  out.push(f.caveats.map((c) => `- ${c}`).join("\n"));
  return out.join("\n\n");
}

// ---------------------------------------------------------------- Claude

export const CLAUDE_SYSTEM_PROMPT = [
  "You write short incident briefs for municipal emergency planners.",
  "You are given a JSON object of simulation facts. Use ONLY facts in that JSON.",
  "Never invent or estimate numbers, names, places or times. Quote figures exactly as written in the `display` field or the JSON values.",
  "Do not convert units (no lakh/crore/million rephrasing); copy numbers as given.",
  "`resources` is an abstract effort score: never call it crews, people, staff, workers or money.",
  "Do not add causes, equipment, staffing, costs, casualties or evacuations that are not stated in the JSON.",
  "State plainly that the data is synthetic and the result is a simulation, not a prediction.",
  "Write exactly these bold-labelled paragraphs: Situation, Cascade, Impact, Hospitals, Recommended action, Limitations.",
  "Plain language, under 260 words, no bullet lists, no headings.",
].join(" ");

export function buildClaudeRequest(facts: ReportFacts, model: string) {
  return {
    model,
    max_tokens: 700,
    system: CLAUDE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user" as const,
        content: `Simulation facts (JSON):\n${JSON.stringify(facts)}\n\nWrite the incident brief.`,
      },
    ],
  };
}

function collectNumbers(v: unknown, out: Set<number>): void {
  if (typeof v === "number") out.add(v);
  else if (typeof v === "string") for (const n of extractNumbers(v)) out.add(n);
  else if (Array.isArray(v)) v.forEach((x) => collectNumbers(x, out));
  else if (v && typeof v === "object") Object.values(v as Record<string, unknown>).forEach((x) => collectNumbers(x, out));
}

function extractNumbers(text: string): number[] {
  const found = text.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
  return found.map((s) => parseFloat(s.replace(/,/g, ""))).filter((n) => Number.isFinite(n));
}

/**
 * Returns the figures in `narrative` that do not appear anywhere in the facts.
 * Numbers below 10 are ignored (counts like "two hospitals" or "3 sections").
 */
export function checkNarrativeNumbers(narrative: string, facts: ReportFacts): string[] {
  const allowed = new Set<number>();
  collectNumbers(facts, allowed);
  const unknown: string[] = [];
  const seen = new Set<number>();
  for (const n of extractNumbers(narrative)) {
    if (n < 10 || allowed.has(n) || seen.has(n)) continue;
    seen.add(n);
    unknown.push(String(n));
  }
  return unknown;
}

export const UNSUPPORTED_TERMS = [
  "crew", "personnel", "technician", "staff", "workers", "budget", "cost", "rupee", "\u20b9", "$",
  "casualt", "death", "injur", "fatalit", "evacuat", "hospitalised", "hospitalized",
];

/**
 * Words that imply data the simulation does not have (people, money, casualties...).
 * Returns those that appear in the narrative but nowhere in the facts.
 * Catches "5 response crews" even when the number 5 happens to exist elsewhere in the facts.
 */
export function checkUnsupportedTerms(narrative: string, facts: ReportFacts): string[] {
  const text = narrative.toLowerCase();
  const known = JSON.stringify(facts).toLowerCase();
  return UNSUPPORTED_TERMS.filter((t) => text.includes(t) && !known.includes(t));
}

export interface NarrativeResult {
  narrative: string;
  source: "claude" | "template";
  /** true when no figure in the narrative is outside the facts */
  verified: boolean;
  unverified_numbers: string[];
  /** terms that imply data the facts do not contain (crews, cost, casualties...) */
  unverified_terms: string[];
  error?: string;
}

export interface NarrativeOptions {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/** SERVER-SIDE ONLY (needs the API key). Falls back to the template on any problem. */
export async function generateNarrative(facts: ReportFacts, opts: NarrativeOptions = {}): Promise<NarrativeResult> {
  const fallback = (error?: string): NarrativeResult => ({
    narrative: templateNarrative(facts),
    source: "template",
    verified: true,
    unverified_numbers: [],
    unverified_terms: [],
    ...(error ? { error } : {}),
  });
  if (!opts.apiKey) return fallback();

  const doFetch = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20000);
  try {
    const res = await doFetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": opts.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(buildClaudeRequest(facts, opts.model ?? "claude-sonnet-5-5")),
      signal: controller.signal,
    });
    if (!res.ok) return fallback(`Claude API returned HTTP ${res.status}`);
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? [])
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text as string)
      .join("\n")
      .trim();
    if (!text) return fallback("Claude returned an empty response");
    const unknown = checkNarrativeNumbers(text, facts);
    const terms = checkUnsupportedTerms(text, facts);
    return {
      narrative: text,
      source: "claude",
      verified: unknown.length === 0 && terms.length === 0,
      unverified_numbers: unknown,
      unverified_terms: terms,
    };
  } catch (e) {
    return fallback(e instanceof Error ? e.message : "Claude request failed");
  } finally {
    clearTimeout(timer);
  }
}
