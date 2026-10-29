import {
  generateNarrative,
  templateNarrative,
  checkNarrativeNumbers,
  checkUnsupportedTerms,
  CLAUDE_SYSTEM_PROMPT,
  type ReportFacts,
  type NarrativeResult,
} from "../engine/report.ts";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) {
    return false;
  }
  entry.count++;
  return true;
}

export interface ReportApiResponse {
  status: number;
  body: NarrativeResult | { error: string };
}

async function generateGeminiNarrative(
  facts: ReportFacts,
  apiKey: string,
  model: string = "gemini-2.5-flash"
): Promise<NarrativeResult> {
  const prompt = `${CLAUDE_SYSTEM_PROMPT}\n\nImportant instructions:\n- \`resources\` is an abstract effort score: never call it crews, people, staff, workers or money.\n- Do not add causes, equipment, staffing, costs, casualties or evacuations that are not stated in the JSON.\n\nSimulation facts (JSON):\n${JSON.stringify(facts)}\n\nWrite the incident brief.`;

  const callModel = async (targetModel: string) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 1200,
            temperature: 0.1,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
        signal: controller.signal,
      });
      return { res, status: res.status, data: res.ok ? await res.json() : null };
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    let result = await callModel(model);
    // If the primary model hit daily quota (HTTP 429), try gemini-3-flash-preview as fallback model
    if (result.status === 429 && model !== "gemini-3-flash-preview") {
      result = await callModel("gemini-3-flash-preview");
    }

    if (!result.data) {
      return {
        narrative: templateNarrative(facts),
        source: "template",
        verified: true,
        unverified_numbers: [],
        unverified_terms: [],
        error: `Gemini API returned HTTP ${result.status}`,
      };
    }

    const text = (result.data as any).candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      return {
        narrative: templateNarrative(facts),
        source: "template",
        verified: true,
        unverified_numbers: [],
        unverified_terms: [],
        error: "Gemini returned an empty response",
      };
    }

    const unknown = checkNarrativeNumbers(text, facts);
    const terms = checkUnsupportedTerms(text, facts);
    return {
      narrative: text,
      source: "claude", // flags as AI narrative in ReportTab
      verified: unknown.length === 0 && terms.length === 0,
      unverified_numbers: unknown,
      unverified_terms: terms,
    };
  } catch (err: any) {
    return {
      narrative: templateNarrative(facts),
      source: "template",
      verified: true,
      unverified_numbers: [],
      unverified_terms: [],
      error: err.message || "Gemini request failed",
    };
  }
}

export async function handleReportRequest(
  bodyStr: string,
  ip: string,
  envKey?: string,
  envModel?: string
): Promise<ReportApiResponse> {
  // 1. Rate limit: max 10 requests per minute per IP
  if (!checkRateLimit(ip)) {
    return {
      status: 429,
      body: { error: "Rate limit exceeded. Maximum 10 requests per minute per IP." },
    };
  }

  // 2. Reject bodies over 50 KB
  if (bodyStr.length > 50 * 1024) {
    return {
      status: 400,
      body: { error: "Payload too large. Maximum body size is 50 KB." },
    };
  }

  // 3. Parse JSON
  let body: any;
  try {
    body = JSON.parse(bodyStr || "{}");
  } catch (err: any) {
    return {
      status: 400,
      body: { error: "Invalid JSON in request body" },
    };
  }

  const facts = body?.facts as ReportFacts | undefined;

  // 4. Reject obviously malformed facts (missing headline/scenario)
  if (!facts || typeof facts !== "object" || !facts.headline || !facts.scenario) {
    return {
      status: 400,
      body: { error: "Malformed facts: headline and scenario objects are required" },
    };
  }

  // 5. Check Gemini key first
  const geminiKey =
    process.env.GEMINI_API_KEY ||
    (envKey?.startsWith("AQ.") || envKey?.startsWith("AIzaSy") ? envKey : undefined);

  if (geminiKey) {
    const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const result = await generateGeminiNarrative(facts, geminiKey, geminiModel);
    return {
      status: 200,
      body: result,
    };
  }

  // 6. Otherwise use Anthropic Claude
  const apiKey = envKey || process.env.ANTHROPIC_API_KEY;
  const model = envModel || process.env.CLAUDE_MODEL || "claude-sonnet-5-5";

  const result = await generateNarrative(facts, { apiKey, model });
  return {
    status: 200,
    body: result,
  };
}

