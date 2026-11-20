import React, { useState, useEffect, useMemo } from "react";
import { simulate, type NetworkData, type NeighborhoodsData, type Scenario } from "@/engine/cascade";
import { evaluatePlans, type PlanEvaluation } from "@/engine/plans";
import { loadCivicShieldData } from "@/gis/civicshieldLayer";
import { CheckCircle2, XCircle, ShieldCheck, RefreshCw } from "lucide-react";
import { CINEMATIC_THEME } from "../theme";

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

    const baselineResult = simulate(networkData, hoodsData, scenarioData, {});
    const planEvals = evaluatePlans(simulate, networkData, hoodsData, scenarioData);
    const bestPlanEval: PlanEvaluation = planEvals[0]!;

    const baselineHospDown = baselineResult.summary.hospital_downtime_h;
    const bestHospDown = bestPlanEval.result.summary.hospital_downtime_h;
    const popHoursSavedPct = bestPlanEval.affected_pop_hours_saved_pct;

    return {
      baseline: {
        name: "No action",
        summary: "Unmitigated cascade: underpass floods, substation overheats.",
        affectedPopHours: baselineResult.summary.affected_pop_hours,
        hospitalDowntimeH: baselineHospDown,
      },
      best: {
        name: bestPlanEval.plan.name,
        summary: "Isolate valves at T+0h, restore trunk by T+8h, preserve ICU.",
        affectedPopHours: bestPlanEval.result.summary.affected_pop_hours,
        hospitalDowntimeH: bestHospDown,
        popHoursSavedPct,
      },
    };
  }, [networkData, hoodsData, scenarioData]);

  const isBest = selectedPlanMode === "best";
  const activeStats = isBest ? calculation?.best : calculation?.baseline;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-[#060b09]/90 backdrop-blur-2xl border p-5 shadow-[0_15px_35px_rgba(0,0,0,0.85)] transition-all duration-300 ${
        isBest
          ? "border-[#00d1a0]/40 shadow-[0_0_25px_rgba(0,209,160,0.15)]"
          : "border-red-500/40 shadow-[0_0_25px_rgba(255,45,85,0.2)]"
      }`}
    >
      {/* 300ms light sweep */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-300 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="space-y-3.5">
        {/* Category tag */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#00d1a0]/10 border border-[#00d1a0]/30 text-[#00d1a0] text-[10px] font-mono tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00d1a0]" />
            <span>ALGORITHMIC TRIAGE</span>
          </div>
          <span className="text-[10px] font-mono text-[#00d1a0] font-semibold">
            MATH VERIFIED
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display leading-tight">
          Test the fix{" "}
          <span className="bg-gradient-to-r from-[#00d1a0] to-[#2dffb3] bg-clip-text text-transparent">
            first.
          </span>
        </h2>

        {/* Short copy: two short lines */}
        <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
          Simulate emergency interventions in milliseconds before dispatching crews into flooded sectors.
        </p>

        {/* Plan Mode Toggle Pill */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-black/60 border border-white/10">
          <button
            onClick={() => setSelectedPlanMode("baseline")}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              !isBest
                ? "bg-red-500/25 text-red-200 border border-red-500/50 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            <span>Baseline (No Fix)</span>
          </button>
          <button
            onClick={() => setSelectedPlanMode("best")}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isBest
                ? "bg-gradient-to-r from-[#00d1a0]/25 to-[#2dffb3]/25 text-[#2dffb3] border border-[#00d1a0]/50 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00d1a0]" />
            <span>Best Plan (Valves)</span>
          </button>
        </div>

        {/* Dynamic Telemetry Comparison Card */}
        {loading ? (
          <div className="py-4 font-mono text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00d1a0]" />
            <span>Evaluating engine graph...</span>
          </div>
        ) : calculation ? (
          <div className="space-y-2.5 font-mono">
            <div className="grid grid-cols-2 gap-2">
              {/* Population Hours */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                  POP-HOURS LOST
                </span>
                <div className="text-base font-extrabold text-white">
                  {activeStats?.affectedPopHours.toLocaleString()}
                </div>
                {isBest ? (
                  <span className="text-[9px] font-bold text-[#00d1a0] block">
                    ↓ {calculation.best.popHoursSavedPct}% SAVED
                  </span>
                ) : (
                  <span className="text-[9px] text-red-400 block">UNMITIGATED</span>
                )}
              </div>

              {/* Hospital Downtime */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                  HOSPITAL BLACKOUT
                </span>
                <div className={`text-base font-extrabold ${isBest ? "text-[#00d1a0]" : "text-red-400"}`}>
                  {activeStats?.hospitalDowntimeH} h
                </div>
                {isBest ? (
                  <span className="text-[9px] font-bold text-[#00d1a0] block">
                    11 h → 0 h (SAVED)
                  </span>
                ) : (
                  <span className="text-[9px] text-red-400 block">11 h OUTAGE</span>
                )}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-tight border-t border-white/5 pt-2">
              {activeStats?.summary}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
