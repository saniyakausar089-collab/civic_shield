import React, { useState, useEffect, useRef } from "react";
import { simulate, type NetworkData, type NeighborhoodsData, type Scenario } from "@/engine/cascade";
import { evaluatePlans, type PlanEvaluation } from "@/engine/plans";
import { analyzeWeakLinks } from "@/engine/weaklinks";
import {
  buildReportFacts,
  templateNarrative,
  type ReportFacts,
} from "@/engine/report";
import { loadCivicShieldData } from "@/gis/civicshieldLayer";
import { Sparkles, Terminal, Copy, Check, RefreshCw } from "lucide-react";
import { CINEMATIC_THEME } from "../theme";

interface Chapter5Props {
  progress: number;
}

export const Chapter5AiReport: React.FC<Chapter5Props> = ({ progress }) => {
  const [reportMarkdown, setReportMarkdown] = useState<string>("");
  const [reportSource, setReportSource] = useState<"claude" | "template">("template");
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const requestedRef = useRef<boolean>(false);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;

    async function fetchReport() {
      const staticFallback =
        "## SITUATION REPORT // PIPELINE RUPTURE\n\n" +
        "• Immediate Hazard: Main Pipeline (PIPE1) rupture at T+0h.\n" +
        "• Secondary: 428,000 without water; East Underpass flooded.\n" +
        "• Critical: City General Hospital generator buffer exhausted at T+11h.\n" +
        "• Action Order: Isolate valves PIPE1>UJ1; route tankers to H1 by T+2h.";

      try {
        const data = await loadCivicShieldData();
        const network = data?.network as NetworkData;
        const hoods = data?.neighborhoods as NeighborhoodsData;
        const rawScenarios = Array.isArray(data?.scenarios) ? data.scenarios : [];
        const rawScenario = rawScenarios.find((s: any) => s?.id === "pipeline_burst") || rawScenarios[0];

        // Safe scenario fallback with guaranteed triggers array
        const scenario: Scenario = {
          id: rawScenario?.id || "pipeline_burst",
          name: rawScenario?.name || "Pipeline burst",
          triggers: Array.isArray(rawScenario?.triggers) && rawScenario.triggers.length > 0
            ? rawScenario.triggers
            : [{ node: "PIPE1", t_hours: 0, severity: 1.0, event: "Main Pipeline ruptured" }],
        };

        if (!network?.nodes || !hoods?.features) {
          setReportMarkdown(staticFallback);
          setReportSource("template");
          setLoading(false);
          return;
        }

        const baselineResult = simulate(network, hoods, scenario, {});
        const planEvals = evaluatePlans(simulate, network, hoods, scenario);
        const weakLinks = analyzeWeakLinks(network, hoods) || [];

        let facts: ReportFacts | null = null;
        try {
          facts = buildReportFacts({
            network,
            hoods,
            scenario,
            result: baselineResult,
            plans: planEvals,
            weakLinks,
          });
        } catch {
          facts = null;
        }

        // Call /api/report safely
        if (facts) {
          try {
            const res = await fetch("/api/report", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ facts }),
            });

            if (res.ok) {
              const resultData: any = await res.json();
              const narrativeText =
                typeof resultData?.narrative === "string"
                  ? resultData.narrative
                  : typeof resultData?.body?.narrative === "string"
                    ? resultData.body.narrative
                    : null;

              if (narrativeText && narrativeText.trim().length > 0) {
                setReportMarkdown(narrativeText);
                setReportSource(resultData.source === "claude" ? "claude" : "template");
                setLoading(false);
                return;
              }
            }
          } catch {
            // Server endpoint unreachable; continue to template fallback
          }

          // Safe template narrative fallback
          try {
            if (facts && facts.headline && Array.isArray(facts.timeline) && Array.isArray(facts.most_affected_neighborhoods)) {
              const template = templateNarrative(facts);
              if (template && typeof template === "string" && template.trim().length > 0) {
                setReportMarkdown(template);
                setReportSource("template");
                setLoading(false);
                return;
              }
            }
          } catch {
            // Continue to static fallback
          }
        }

        setReportMarkdown(staticFallback);
        setReportSource("template");
        setLoading(false);
      } catch {
        setReportMarkdown(staticFallback);
        setReportSource("template");
        setLoading(false);
      }
    }

    fetchReport();
  }, []);

  // Progressive scroll-driven reveal
  const displayedText = React.useMemo(() => {
    if (!reportMarkdown) return "";
    const revealFraction = Math.min(1, Math.max(0.4, progress * 1.3));
    const charCount = Math.floor(reportMarkdown.length * revealFraction);
    return reportMarkdown.slice(0, charCount);
  }, [reportMarkdown, progress]);

  const handleCopy = () => {
    if (!reportMarkdown) return;
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-[#0a0612]/90 backdrop-blur-2xl border border-fuchsia-500/40 p-5 shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(192,38,211,0.2)] transition-all duration-300 hover:border-fuchsia-500/60 hover:-translate-y-1">
      {/* Shimmer light sweep */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="space-y-4">
        {/* Category tag */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-[10px] font-mono tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>AI DIRECTIVE // REPORT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              {reportSource === "claude" ? "Gemini Verified" : "Rule Engine"}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Copy Briefing"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display leading-tight">
          Get the{" "}
          <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
            report.
          </span>
        </h2>

        {/* Streamlined Narrative Copy */}
        <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
          Instant executive briefing synthesizing hydraulic, grid, and ICU telemetry into actionable orders.
        </p>

        {/* Terminal Text Box */}
        <div className="p-3.5 rounded-xl bg-black/70 border border-white/10 font-mono text-[11px] leading-relaxed select-text">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2 text-slate-500 text-[9px]">
            <span className="flex items-center gap-1 text-fuchsia-400">
              <Terminal className="w-3 h-3" />
              <span>INCIDENT_DEBRIEF.MD</span>
            </span>
            {copied && <span className="text-emerald-400 font-bold">COPIED TO CLIPBOARD</span>}
          </div>

          {loading ? (
            <div className="py-4 text-center text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-fuchsia-400" />
              <span>Synthesizing incident briefing...</span>
            </div>
          ) : (
            <div className="max-h-[160px] overflow-y-auto pr-1 text-slate-200 whitespace-pre-wrap">
              {displayedText}
              {displayedText.length < reportMarkdown.length && (
                <span className="inline-block w-1.5 h-3 bg-fuchsia-400 animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
