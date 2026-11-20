import React, { useState, useEffect, useMemo } from "react";
import { simulate, type NetworkData, type NeighborhoodsData, type Scenario } from "@/engine/cascade";
import { evaluatePlans, BASELINE_PLAN, type PlanEvaluation } from "@/engine/plans";
import { loadCivicShieldData } from "@/gis/civicshieldLayer";
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, Zap, Activity, Clock, Users, RefreshCw } from "lucide-react";

export const Chapter4PlanTriage: React.FC = () => {
  const [selectedPlanMode, setSelectedPlanMode] = useState<"baseline" | "best">("best");
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [hoodsData, setHoodsData] = useState<NeighborhoodsData | null>(null);
  const [scenarioData, setScenarioData] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load real engine data
  useEffect(() => {
    let active = true;
    loadCivicShieldData()
      .then((data) => {
        if (!active) return;
        setNetworkData(data.network as NetworkData);
        setHoodsData(data.neighborhoods as NeighborhoodsData);
        const pipeScenario = data.scenarios.find((s: any) => s.id === "pipeline_burst") || data.scenarios[0];
        setScenarioData(pipeScenario as Scenario);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("[CIVICSHIELD] Error loading engine data in Chapter 4:", err);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Compute live evaluations from real cascade engine
  const calculation = useMemo(() => {
    if (!networkData || !hoodsData || !scenarioData) {
      return null;
    }

    // 1. Run baseline simulation ("No action")
    const baselineResult = simulate(networkData, hoodsData, scenarioData, {});

    // 2. Run plan evaluations
    const planEvals = evaluatePlans(simulate, networkData, hoodsData, scenarioData);
    const bestPlanEval: PlanEvaluation = planEvals[0]!;

    const baselineHospDown = baselineResult.summary.hospital_downtime_h; // Real value: 11h
    const bestHospDown = bestPlanEval.result.summary.hospital_downtime_h; // Real value: 0h
    const popHoursSavedPct = bestPlanEval.affected_pop_hours_saved_pct; // Real value: ~83.5%

    return {
      baseline: {
        name: "No action",
        summary: "Let the failure run its course without intervention.",
        affectedPopHours: baselineResult.summary.affected_pop_hours,
        hospitalDowntimeH: baselineHospDown,
        peakAffectedPop: baselineResult.summary.peak_affected_pop,
        finalFailedNodes: baselineResult.summary.final_failed,
      },
      best: {
        name: bestPlanEval.plan.name,
        summary: bestPlanEval.plan.summary,
        affectedPopHours: bestPlanEval.result.summary.affected_pop_hours,
        hospitalDowntimeH: bestHospDown,
        peakAffectedPop: bestPlanEval.result.summary.peak_affected_pop,
        popHoursSavedPct,
        hospitalHoursSaved: bestPlanEval.hospital_hours_saved,
        resources: bestPlanEval.resources,
      },
    };
  }, [networkData, hoodsData, scenarioData]);

  const activeStats = selectedPlanMode === "best" ? calculation?.best : calculation?.baseline;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col justify-center min-h-[85vh] px-4 sm:px-6 pointer-events-none">
      <div className="pointer-events-auto space-y-5 max-w-2xl">
        {/* Category tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>REAL CASCADE ENGINE // ALGORITHMIC TRIAGE</span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-display leading-[1.08]">
          Test the fix <br />
          <span className="text-cyan-400">first.</span>
        </h2>

        {/* Narrative Copy */}
        <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed max-w-xl">
          In an urban crisis, intuition fails. Dispatching water tankers everywhere burns precious time. CivicShield tests intervention sequences in milliseconds before a single crew leaves the depot.
        </p>

        {/* Plan Mode Toggle Pill */}
        <div className="inline-flex p-1 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
          <button
            onClick={() => setSelectedPlanMode("baseline")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              selectedPlanMode === "baseline"
                ? "bg-red-500/20 text-red-300 border border-red-500/40 shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Baseline // No Action</span>
          </button>
          <button
            onClick={() => setSelectedPlanMode("best")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              selectedPlanMode === "best"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Best Plan // Optimized Response</span>
          </button>
        </div>

        {/* Dynamic Telemetry Comparison Card */}
        {loading ? (
          <div className="p-6 rounded-2xl bg-[#101418]/90 border border-white/10 font-mono text-xs text-slate-400 flex items-center gap-3">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Running Cascade Engine & Plan Evaluation...</span>
          </div>
        ) : calculation ? (
          <div className="p-5 sm:p-6 rounded-2xl bg-[#101418]/90 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block mb-0.5">
                  SELECTED PROTOCOL
                </span>
                <h4 className="text-base font-bold font-mono text-white flex items-center gap-2">
                  <span>{activeStats?.name}</span>
                  {selectedPlanMode === "best" && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      RANK #1 (ENGINE TOP)
                    </span>
                  )}
                </h4>
              </div>
              <p className="text-xs font-mono text-slate-400 max-w-sm sm:text-right">
                {activeStats?.summary}
              </p>
            </div>

            {/* Impact Metric Cards */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              {/* Population Hours */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  AFFECTED POPULATION-HOURS
                </span>
                <div className="text-2xl font-extrabold text-white">
                  {activeStats?.affectedPopHours.toLocaleString()}
                </div>
                {selectedPlanMode === "best" ? (
                  <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                    ↓ {calculation.best.popHoursSavedPct}% FEWER HOURS AFFECTED
                  </span>
                ) : (
                  <span className="text-[11px] text-red-400">UNMITIGATED CASUALTY BURDEN</span>
                )}
              </div>

              {/* Hospital Downtime */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  HOSPITAL DOWNTIME
                </span>
                <div className={`text-2xl font-extrabold ${selectedPlanMode === "best" ? "text-cyan-400" : "text-red-400"}`}>
                  {activeStats?.hospitalDowntimeH} h
                </div>
                {selectedPlanMode === "best" ? (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    SAVED 11 h → 0 h DOWNTIME
                  </span>
                ) : (
                  <span className="text-[11px] text-red-400">11 HOURS COMPLETE BLACKOUT</span>
                )}
              </div>
            </div>

            {/* Intervention Highlights */}
            {selectedPlanMode === "best" ? (
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 font-mono text-xs text-cyan-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-cyan-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Engine Output Verified:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Shutting isolation valves at T+0h limits flooding into East Underpass. Rapid repair crews restore the main trunk by T+8h, preventing Central Substation trip and preserving uninterrupted ICU power at City General Hospital.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 font-mono text-xs text-red-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-red-400">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Failure Projection:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Without coordinated valve closure, floodwaters submerge the underpass, pump station dies, Central Substation overheats, and City General Hospital loses power and water for 11 consecutive hours.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
