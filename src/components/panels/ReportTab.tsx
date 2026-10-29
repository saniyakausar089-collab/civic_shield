import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAppStore } from "@/store/appStore";
import { simulate, type Scenario, type SimResult } from "@/engine/cascade";
import { evaluatePlans, type PlanEvaluation } from "@/engine/plans";
import { analyzeWeakLinks, type WeakLink } from "@/engine/weaklinks";
import {
  buildReportFacts,
  templateNarrative,
  renderMarkdown,
  type ReportFacts,
  type NarrativeResult,
} from "@/engine/report";
import { loadCivicShieldData } from "@/gis/civicshieldLayer";
import {
  FileText,
  Play,
  Copy,
  Check,
  Download,
  Printer,
  Sparkles,
  AlertTriangle,
  RotateCw,
  ShieldAlert,
  Clock,
  Building,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

// Global memoization cache for weak links and plan evaluations across tabs
let cachedWeakLinks: WeakLink[] | null = null;
const cachedPlanEvals = new Map<string, PlanEvaluation[]>();

export const ReportTab: React.FC = () => {
  const networkData = useAppStore((s) => s.networkData);
  const neighborhoodsData = useAppStore((s) => s.neighborhoodsData);
  const scenariosData = useAppStore((s) => s.scenariosData);
  const selectedScenario = useAppStore((s) => s.selectedScenario);
  const presetId = useAppStore((s) => s.presetId);
  const baselineResult = useAppStore((s) => s.baselineResult);
  const result = useAppStore((s) => s.result);
  const appliedPlan = useAppStore((s) => s.appliedPlan);
  const runSim = useAppStore((s) => s.runSim);
  const setCivicShieldData = useAppStore((s) => s.setCivicShieldData);

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [narrativeResult, setNarrativeResult] = useState<NarrativeResult | null>(null);
  const [reportFacts, setReportFacts] = useState<ReportFacts | null>(null);
  const [reportMarkdown, setReportMarkdown] = useState<string>("");
  const lastGeneratedKeyRef = useRef<string>("");

  // Ensure GIS network and scenario data are loaded
  useEffect(() => {
    if (!networkData || !neighborhoodsData || scenariosData.length === 0) {
      loadCivicShieldData()
        .then((data) => {
          setCivicShieldData({
            network: data.network,
            neighborhoods: data.neighborhoods,
            scenarios: data.scenarios,
          });
        })
        .catch(() => {});
    }
  }, [networkData, neighborhoodsData, scenariosData.length, setCivicShieldData]);

  // Determine active scenario
  const scenario: Scenario | null = useMemo(() => {
    return (
      selectedScenario ||
      scenariosData.find(
        (s) =>
          s.id === presetId ||
          (presetId === "pipeline" && s.id === "pipeline_burst") ||
          (presetId === "monsoon" && s.id === "monsoon_flood") ||
          (presetId === "heatwave" && s.id === "heatwave_overload") ||
          (presetId === "cyber" && s.id === "cyberattack") ||
          (presetId === "quake" && s.id === "earthquake")
      ) ||
      scenariosData[0] ||
      null
    );
  }, [selectedScenario, scenariosData, presetId]);

  // Memoized weak links (~26 engine runs, static for network)
  const weakLinks = useMemo(() => {
    if (!networkData || !neighborhoodsData) return [];
    if (cachedWeakLinks) return cachedWeakLinks;
    const computed = analyzeWeakLinks(simulate, networkData, neighborhoodsData);
    cachedWeakLinks = computed;
    return computed;
  }, [networkData, neighborhoodsData]);

  // Memoized plan evaluations per scenario
  const planEvaluations = useMemo(() => {
    if (!networkData || !neighborhoodsData || !scenario) return [];
    if (cachedPlanEvals.has(scenario.id)) {
      return cachedPlanEvals.get(scenario.id)!;
    }
    const computed = evaluatePlans(simulate, networkData, neighborhoodsData, scenario);
    cachedPlanEvals.set(scenario.id, computed);
    return computed;
  }, [networkData, neighborhoodsData, scenario]);

  // Always use the baseline simulation result (Requirement C)
  const effectiveBaselineResult: SimResult | null = useMemo(() => {
    if (baselineResult) return baselineResult;
    if (appliedPlan && planEvaluations.length > 0) {
      const noAction = planEvaluations.find((e) => e.plan.id === "no_action");
      if (noAction) return noAction.result;
    }
    return result;
  }, [baselineResult, appliedPlan, planEvaluations, result]);

  // Node ID to Asset Name Map for humanizing plan summaries (Requirement D)
  const nodeNameMap = useMemo(() => {
    if (!networkData) return new Map<string, string>();
    return new Map(networkData.nodes.map((n) => [n.id, n.name]));
  }, [networkData]);

  // Humanize plan summaries without changing plans.ts logic
  const humanizedPlans = useMemo(() => {
    if (!planEvaluations) return [];
    return planEvaluations.map((p) => {
      let summary = p.plan.summary;
      for (const [id, name] of nodeNameMap.entries()) {
        summary = summary.replace(new RegExp(`\\b${id}\\b`, "g"), name);
      }
      return {
        ...p,
        plan: {
          ...p.plan,
          summary,
        },
      };
    });
  }, [planEvaluations, nodeNameMap]);

  // Generate Report Handler
  const handleGenerateReport = async (forceRefresh = false) => {
    if (!networkData || !neighborhoodsData || !scenario || !effectiveBaselineResult) {
      return;
    }

    const runKey = `${scenario.id}:${effectiveBaselineResult.summary.peak_affected_pop}:${effectiveBaselineResult.summary.final_failed}`;
    if (!forceRefresh && runKey === lastGeneratedKeyRef.current && reportFacts && narrativeResult) {
      return;
    }

    setLoading(true);

    // 1. Build facts from engine data
    const facts = buildReportFacts({
      network: networkData,
      hoods: neighborhoodsData,
      scenario,
      result: effectiveBaselineResult,
      plans: humanizedPlans,
      weakLinks,
    });
    setReportFacts(facts);

    // 2. Request narrative from /api/report (with fallback to local template)
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facts }),
      });

      if (response.ok) {
        const data = (await response.json()) as NarrativeResult;
        setNarrativeResult(data);
        const md = renderMarkdown(facts, data.narrative, data.source);
        setReportMarkdown(md);
        lastGeneratedKeyRef.current = runKey;
      } else {
        // Fallback to local template narrative on non-ok HTTP
        const template = templateNarrative(facts);
        const fallbackRes: NarrativeResult = {
          narrative: template,
          source: "template",
          verified: true,
          unverified_numbers: [],
          unverified_terms: [],
          error: `Server endpoint returned HTTP ${response.status}; fell back to template narrative`,
        };
        setNarrativeResult(fallbackRes);
        setReportMarkdown(renderMarkdown(facts, template, "template"));
        lastGeneratedKeyRef.current = runKey;
      }
    } catch (netErr: any) {
      // Fallback to local template narrative if server route unreachable
      const template = templateNarrative(facts);
      const fallbackRes: NarrativeResult = {
        narrative: template,
        source: "template",
        verified: true,
        unverified_numbers: [],
        unverified_terms: [],
        error: `Server route unreachable (${netErr.message || netErr}); fell back to template narrative`,
      };
      setNarrativeResult(fallbackRes);
      setReportMarkdown(renderMarkdown(facts, template, "template"));
      lastGeneratedKeyRef.current = runKey;
    } finally {
      setLoading(false);
    }
  };

  // Switch to template narrative if Claude narrative contains unverified figures
  const handleUseTemplate = () => {
    if (!reportFacts) return;
    const template = templateNarrative(reportFacts);
    const templateRes: NarrativeResult = {
      narrative: template,
      source: "template",
      verified: true,
      unverified_numbers: [],
      unverified_terms: [],
    };
    setNarrativeResult(templateRes);
    setReportMarkdown(renderMarkdown(reportFacts, template, "template"));
  };

  // Copy Markdown to clipboard
  const handleCopy = async () => {
    if (!reportMarkdown) return;
    try {
      await navigator.clipboard.writeText(reportMarkdown);
      setCopied(true);
      toast.success("Report Markdown copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Download Markdown file
  const handleDownload = () => {
    if (!reportMarkdown || !scenario) return;
    const blob = new Blob([reportMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `civicshield-report-${scenario.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded civicshield-report-${scenario.id}.md`);
  };

  // Print / Save as PDF
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Auto-generate report when simulation result is available and tab is viewed
  useEffect(() => {
    if (effectiveBaselineResult && scenario && !reportFacts && !loading) {
      handleGenerateReport(false);
    }
  }, [effectiveBaselineResult, scenario, reportFacts, loading]);

  // 1. If no simulation result exists, show prompt (Requirement C)
  if (!effectiveBaselineResult) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center select-none bg-[#14191d]">
        <div className="w-12 h-12 rounded-full bg-[#242c33] border border-[#303941] flex items-center justify-center mb-3 text-[#9BAA76]">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-[#f1f4f6] mb-1">
          No Simulation Result for {scenario?.name || "Selected Scenario"}
        </h3>
        <p className="text-xs text-[#8a96a1] max-w-sm mb-4 leading-relaxed font-mono">
          Run the cascade simulation first to generate empirical failure facts, impact statistics, and response plan assessments.
        </p>
        <button
          onClick={() => runSim()}
          className="px-4 py-2 rounded-lg bg-[#9BAA76] hover:bg-[#8fa06b] text-[#101418] font-semibold text-xs flex items-center gap-2 shadow-lg transition-colors font-mono"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Run Simulation First</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#14191d] text-[#e5e9ec] select-none text-xs font-sans overflow-hidden">
      {/* Print Stylesheet: prints ONLY #printable-report on pure white with dark text */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-report, #printable-report * {
            visibility: visible !important;
          }
          #printable-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px 32px !important;
            background: #ffffff !important;
            color: #111827 !important;
            border: none !important;
            box-shadow: none !important;
            display: block !important;
          }
          #printable-report div,
          #printable-report p,
          #printable-report ul,
          #printable-report li,
          #printable-report span {
            background: #ffffff !important;
            color: #111827 !important;
            border-color: #e5e7eb !important;
          }
          #printable-report strong,
          #printable-report h1,
          #printable-report h2,
          #printable-report h3 {
            color: #000000 !important;
          }
          #printable-report h2 {
            border-bottom: 2px solid #e5e7eb !important;
            padding-bottom: 4px !important;
            margin-top: 20px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Control Header (no-print) */}
      <div className="p-3 border-b border-[#303941] bg-[#191F24] flex items-center justify-between gap-3 shrink-0 no-print flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-semibold text-sm text-[#f1f4f6]">
            <FileText className="w-4 h-4 text-[#9BAA76]" />
            <span>Incident Report</span>
            <span className="text-xs text-[#8a96a1] font-mono">({scenario?.name})</span>
          </div>

          {/* Source Badge (Requirement C) */}
          {narrativeResult && (
            <div className="flex items-center gap-1.5">
              {narrativeResult.source === "claude" ? (
                narrativeResult.verified ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border bg-emerald-500/20 text-emerald-300 border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>AI narrative · figures checked</span>
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const unsupported = [
                        ...(narrativeResult.unverified_numbers || []),
                        ...(narrativeResult.unverified_terms || []),
                      ];
                      return (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>
                            AI narrative · unsupported: {unsupported.join(", ")}
                          </span>
                        </span>
                      );
                    })()}
                    <button
                      onClick={handleUseTemplate}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#242c33] hover:bg-[#2c363f] text-[#38bdf8] border border-[#3e4a54] transition-colors"
                      title="Switch to deterministic template narrative"
                    >
                      Use template instead
                    </button>
                  </div>
                )
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border bg-[#242c33] text-[#8a96a1] border-[#303941] flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-[#9BAA76]" />
                  <span>Template narrative</span>
                </span>
              )}
            </div>
          )}

          {narrativeResult?.error && (
            <span className="text-[10px] font-mono text-[#e09f3e] italic truncate max-w-xs">
              {narrativeResult.error}
            </span>
          )}
        </div>

        {/* Action Buttons (Requirement C) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleGenerateReport(true)}
            disabled={loading}
            className="px-2.5 py-1.5 rounded bg-[#242c33] hover:bg-[#2c363f] border border-[#303941] text-[#e5e9ec] hover:text-[#f1f4f6] text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Re-run facts compilation and narrative synthesis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#9BAA76]" : ""}`} />
            <span>{loading ? "Generating..." : "Regenerate"}</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={!reportMarkdown}
            className="px-2.5 py-1.5 rounded bg-[#242c33] hover:bg-[#2c363f] border border-[#303941] text-[#e5e9ec] hover:text-[#f1f4f6] text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Copy Report as Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Markdown"}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!reportMarkdown}
            className="px-2.5 py-1.5 rounded bg-[#242c33] hover:bg-[#2c363f] border border-[#303941] text-[#e5e9ec] hover:text-[#f1f4f6] text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Download .md file"
          >
            <Download className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="hidden sm:inline">Download .md</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!reportMarkdown}
            className="px-2.5 py-1.5 rounded bg-[#242c33] hover:bg-[#2c363f] border border-[#303941] text-[#e5e9ec] hover:text-[#f1f4f6] text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-[#9BAA76]" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {loading && !reportFacts ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-center text-[#8a96a1] font-mono">
            <RefreshCw className="w-6 h-6 animate-spin text-[#9BAA76]" />
            <p className="text-xs">Compiling simulation facts and synthesizing incident narrative...</p>
          </div>
        ) : reportFacts && narrativeResult ? (
          <div
            id="printable-report"
            className="max-w-4xl mx-auto bg-[#191F24] border border-[#303941] rounded-xl p-6 sm:p-8 shadow-xl text-xs space-y-6"
          >
            {/* Report Header */}
            <div className="border-b border-[#303941] pb-4">
              <h1 className="text-xl sm:text-2xl font-bold text-[#f1f4f6] tracking-tight">
                CIVICSHIELD Incident Brief: {reportFacts.scenario.name}
              </h1>
              <p className="text-xs text-[#8a96a1] font-mono italic mt-1">
                {reportFacts.testbed}. Narrative:{" "}
                {narrativeResult.source === "claude" ? "AI-written from engine facts" : "template from engine facts"}.
              </p>
            </div>

            {/* Narrative Paragraphs */}
            <div className="space-y-3 text-xs leading-relaxed text-[#c5cdd4] bg-[#14191d] p-4 rounded-lg border border-[#242c33]">
              {narrativeResult.narrative.split("\n\n").map((para, idx) => {
                const match = para.match(/^\*\*([^*]+)\*\*(.*)/s);
                if (match) {
                  return (
                    <p key={idx}>
                      <strong className="text-[#f1f4f6] font-semibold">{match[1]}</strong>
                      <span>{match[2]}</span>
                    </p>
                  );
                }
                return <p key={idx}>{para}</p>;
              })}
            </div>

            {/* Key Figures Grid */}
            <div>
              <h2 className="text-sm font-mono font-semibold text-[#9BAA76] uppercase tracking-wider mb-2.5 pb-1 border-b border-[#303941]">
                Key Figures
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#14191d] p-3 rounded-lg border border-[#242c33]">
                  <div className="text-[10px] text-[#8a96a1] font-mono uppercase">Peak Affected Residents</div>
                  <div className="text-base font-bold text-[#f1f4f6] mt-0.5">
                    {reportFacts.display.peak_affected_pop}{" "}
                    <span className="text-xs font-normal text-[#8a96a1]">
                      ({reportFacts.headline.peak_affected_pct}%)
                    </span>
                  </div>
                  <div className="text-[10px] text-[#9BAA76] font-mono mt-1">
                    Occurs at {reportFacts.display.peak_t}
                  </div>
                </div>

                <div className="bg-[#14191d] p-3 rounded-lg border border-[#242c33]">
                  <div className="text-[10px] text-[#8a96a1] font-mono uppercase">Assets Failed by T+{reportFacts.horizon_h}h</div>
                  <div className="text-base font-bold text-[#f1f4f6] mt-0.5">
                    {reportFacts.display.assets_failed}
                  </div>
                  <div className="text-[10px] text-[#e09f3e] font-mono mt-1">
                    Out of {reportFacts.headline.assets_total} network assets
                  </div>
                </div>

                <div className="bg-[#14191d] p-3 rounded-lg border border-[#242c33]">
                  <div className="text-[10px] text-[#8a96a1] font-mono uppercase">Hospitals Offline at Peak</div>
                  <div className="text-base font-bold text-[#f1f4f6] mt-0.5">
                    {reportFacts.display.hospitals}
                  </div>
                  <div className="text-[10px] text-[#d9534f] font-mono mt-1">
                    First down: {reportFacts.display.first_hospital_down}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Milestones */}
            {reportFacts.timeline.length > 0 && (
              <div>
                <h2 className="text-sm font-mono font-semibold text-[#9BAA76] uppercase tracking-wider mb-2.5 pb-1 border-b border-[#303941]">
                  Timeline Milestones
                </h2>
                <div className="bg-[#14191d] rounded-lg border border-[#242c33] divide-y divide-[#242c33]">
                  {reportFacts.timeline.map((event, idx) => (
                    <div key={idx} className="p-2.5 flex items-start gap-2.5 font-mono text-xs">
                      <span className="px-1.5 py-0.5 rounded bg-[#242c33] text-[#38bdf8] border border-[#3e4a54] font-semibold text-[10px] shrink-0">
                        {event.label}
                      </span>
                      <span className="text-[#c5cdd4] leading-snug">{event.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most Affected Neighborhoods */}
            {reportFacts.most_affected_neighborhoods.length > 0 && (
              <div>
                <h2 className="text-sm font-mono font-semibold text-[#9BAA76] uppercase tracking-wider mb-2.5 pb-1 border-b border-[#303941]">
                  Most Affected Neighborhoods
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {reportFacts.most_affected_neighborhoods.map((n, idx) => (
                    <div key={idx} className="bg-[#14191d] p-3 rounded-lg border border-[#242c33]">
                      <div className="font-semibold text-sm text-[#f1f4f6] truncate">{n.name}</div>
                      <div className="mt-1 text-[11px] font-mono text-[#e09f3e]">
                        Peak loss: {n.peak_impact_pct}%
                      </div>
                      <div className="text-[10px] font-mono text-[#8a96a1] mt-0.5">
                        Pop: {n.population.toLocaleString("en-IN")} · {n.hours_affected}h affected
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response Plans Compared */}
            {(reportFacts.recommended_plan || reportFacts.other_plans.length > 0) && (
              <div>
                <h2 className="text-sm font-mono font-semibold text-[#9BAA76] uppercase tracking-wider mb-2.5 pb-1 border-b border-[#303941]">
                  Response Plans Compared
                </h2>
                <div className="space-y-2">
                  {reportFacts.recommended_plan && (
                    <div className="bg-[#1b261b] border border-[#8fae70]/40 rounded-lg p-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-[#253320] text-[#9BAA76] border border-[#9BAA76]/50 font-mono text-[10px] font-bold">
                          RECOMMENDED
                        </span>
                        <span className="font-semibold text-sm text-[#f1f4f6]">
                          {reportFacts.recommended_plan.name}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#c5cdd4]">{reportFacts.recommended_plan.summary}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs font-mono text-[#8fae70]">
                        <span>{reportFacts.recommended_plan.affected_pop_hours_saved_pct}% population-hours saved</span>
                        <span>{reportFacts.recommended_plan.hospital_hours_saved} hospital hours avoided</span>
                      </div>
                    </div>
                  )}

                  {reportFacts.other_plans.map((p, idx) => (
                    <div key={idx} className="bg-[#14191d] border border-[#242c33] rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs flex-wrap">
                      <span className="font-medium text-[#e5e9ec]">{p.name}</span>
                      <div className="flex items-center gap-3 font-mono text-[11px] text-[#8a96a1]">
                        <span>{p.affected_pop_hours_saved_pct}% pop-hours saved</span>
                        <span>{p.hospital_hours_saved}h hospital downtime avoided</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vulnerability Context */}
            {reportFacts.weak_link_context.trigger_assets.length > 0 && (
              <div>
                <h2 className="text-sm font-mono font-semibold text-[#9BAA76] uppercase tracking-wider mb-2.5 pb-1 border-b border-[#303941]">
                  Vulnerability Context
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {reportFacts.weak_link_context.trigger_assets.map((w, idx) => (
                    <div key={idx} className="bg-[#14191d] p-2.5 rounded-lg border border-[#242c33] font-mono text-xs">
                      <div className="font-semibold text-[#f1f4f6] truncate">{w.name}</div>
                      <div className="mt-1 text-[11px] text-[#38bdf8]">
                        Weak-Link Rank #{w.rank} of {reportFacts.headline.assets_total}
                      </div>
                      <div className="text-[10px] text-[#8a96a1]">Criticality Score: {w.score}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Limitations & Caveats */}
            <div>
              <h2 className="text-sm font-mono font-semibold text-[#9BAA76] uppercase tracking-wider mb-2 pb-1 border-b border-[#303941]">
                Limitations & Simulation Caveats
              </h2>
              <ul className="list-disc list-inside space-y-1 text-xs text-[#8a96a1] leading-relaxed">
                {reportFacts.caveats.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
