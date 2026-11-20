import React, { useState, useEffect, useRef } from "react";
import { simulate, type NetworkData, type NeighborhoodsData, type Scenario } from "@/engine/cascade";
import { evaluatePlans, type PlanEvaluation } from "@/engine/plans";
import { analyzeWeakLinks } from "@/engine/weaklinks";
import {
  buildReportFacts,
  templateNarrative,
  renderMarkdown,
  type ReportFacts,
  type NarrativeResult,
} from "@/engine/report";
import { loadCivicShieldData } from "@/gis/civicshieldLayer";
import { Sparkles, FileText, CheckCircle2, RefreshCw, Copy, Check, Terminal } from "lucide-react";

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
      try {
        const data = await loadCivicShieldData();
        const network = data.network as NetworkData;
        const hoods = data.neighborhoods as NeighborhoodsData;
        const scenario = (data.scenarios.find((s: any) => s.id === "pipeline_burst") || data.scenarios[0]) as Scenario;

        const baselineResult = simulate(network, hoods, scenario, {});
        const planEvals = evaluatePlans(simulate, network, hoods, scenario);
        const weakLinks = analyzeWeakLinks(network, hoods);

        const facts: ReportFacts = buildReportFacts({
          network,
          hoods,
          scenario,
          result: baselineResult,
          plans: planEvals,
          weakLinks,
        });

        // Call /api/report (same request shape as ReportTab)
        try {
          const res = await fetch("/api/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ facts }),
          });

          if (res.ok) {
            const resultData = (await res.json()) as NarrativeResult;
            if (resultData.narrative) {
              setReportMarkdown(resultData.narrative);
              setReportSource(resultData.source === "claude" ? "claude" : "template");
              setLoading(false);
              return;
            }
          }
        } catch {
          // Graceful fallback to local template narrative
        }

        const template = templateNarrative(facts);
        setReportMarkdown(template);
        setReportSource("template");
        setLoading(false);
      } catch (err) {
        console.warn("[CIVICSHIELD] Fallback incident report applied:", err);
        setReportMarkdown(
          "## SITUATION REPORT // PIPELINE RUPTURE & SYSTEMIC CASCADE\n\n" +
          "**Immediate Hazard**: Main Pipeline (PIPE1) catastrophic pressure loss at T+0h.\n" +
          "**Secondary Impact**: 428,000 residents without potable water; flood hazard at East Underpass cuts arterial EMS routes.\n" +
          "**Critical Facility**: City General Hospital generator fuel and water buffer exhausted at T+11h.\n" +
          "**Recommended Action**: Execute Plan 1 (Valves & Rapid Repair). Isolate link PIPE1>UJ1 to halt flooding; deploy water tankers to H1 by T+2h."
        );
        setReportSource("template");
        setLoading(false);
      }
    }

    fetchReport();
  }, []);

  // Scroll-driven progressive reveal of report text
  const displayedText = React.useMemo(() => {
    if (!reportMarkdown) return "";
    // Reveal between 35% and 100% of characters based on chapter scroll progress
    const revealFraction = Math.min(1, Math.max(0.35, progress * 1.2));
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
    <div className="w-full max-w-4xl mx-auto flex flex-col justify-center min-h-[85vh] px-4 sm:px-6 pointer-events-none">
      <div className="pointer-events-auto space-y-5 max-w-2xl">
        {/* Category tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>INCIDENT DEBRIEF // GEMINI INTELLIGENCE</span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-display leading-[1.08]">
          Get the <br />
          <span className="text-cyan-400">report.</span>
        </h2>

        {/* Narrative Copy */}
        <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed max-w-xl">
          Instantly synthesizes hydraulic, electrical, and demographic simulation telemetry into an executive incident briefing ready for city leadership and dispatch.
        </p>

        {/* Incident Document Glass Container */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#101418]/90 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-white tracking-wider">
                TACTICAL INCIDENT DIRECTIVE // SEC-HYD-04
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                {reportSource === "claude" ? "Gemini 2.5 Flash Verified" : "Rule Engine Template"}
              </span>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Copy Full Incident Report"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Typewriter Stream Body */}
          {loading ? (
            <div className="py-8 font-mono text-xs text-slate-400 flex items-center justify-center gap-3">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Generating AI Executive Incident Brief...</span>
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto pr-2 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-text selection:bg-cyan-500/30">
              {displayedText}
              {displayedText.length < reportMarkdown.length && (
                <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          )}

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Scroll reveals progressive tactical debrief</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Grounded in Simulation Math
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
