import React, { useMemo, useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";
import { simulate } from "@/engine/cascade";
import { evaluatePlans, type PlanEvaluation } from "@/engine/plans";
import { loadCivicShieldData } from "@/gis/civicshieldLayer";
import { Award, Check, Play, ShieldAlert, Sparkles, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export const PlansTab: React.FC = () => {
  const networkData = useAppStore((s) => s.networkData);
  const neighborhoodsData = useAppStore((s) => s.neighborhoodsData);
  const scenariosData = useAppStore((s) => s.scenariosData);
  const selectedScenario = useAppStore((s) => s.selectedScenario);
  const presetId = useAppStore((s) => s.presetId);
  const appliedPlan = useAppStore((s) => s.appliedPlan);
  const setCivicShieldData = useAppStore((s) => s.setCivicShieldData);
  const applyPlan = useAppStore((s) => s.applyPlan);

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const evalCacheRef = useRef<Map<string, PlanEvaluation[]>>(new Map());

  // Load GIS network data if not present in store
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
  const scenario =
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
    null;

  // Evaluate and rank plans with caching per scenario
  const evaluations: PlanEvaluation[] = useMemo(() => {
    if (!networkData || !neighborhoodsData || !scenario) return [];
    if (evalCacheRef.current.has(scenario.id)) {
      return evalCacheRef.current.get(scenario.id)!;
    }
    const ev = evaluatePlans(simulate, networkData, neighborhoodsData, scenario);
    evalCacheRef.current.set(scenario.id, ev);
    return ev;
  }, [networkData, neighborhoodsData, scenario]);

  // Selected plan for chart comparison
  const baselineEval = useMemo(
    () => evaluations.find((e) => e.plan.id === "no_action") || evaluations[evaluations.length - 1],
    [evaluations]
  );

  const activeEval = useMemo(() => {
    if (selectedPlanId) {
      const match = evaluations.find((e) => e.plan.id === selectedPlanId);
      if (match) return match;
    }
    return evaluations.find((e) => e.rank === 1) || evaluations[0];
  }, [evaluations, selectedPlanId]);

  // Chart data: affected_pop over time (0..24) for activeEval vs Baseline
  const chartData = useMemo(() => {
    if (!activeEval || !baselineEval) return [];
    const hours = Array.from({ length: 25 }, (_, i) => i);
    return hours.map((hour) => {
      const planPop = activeEval.result.frames[hour]?.affected_pop ?? 0;
      const basePop = baselineEval.result.frames[hour]?.affected_pop ?? 0;
      return {
        hour: `T+${hour}h`,
        t: hour,
        [activeEval.plan.name]: planPop,
        "No action (baseline)": basePop,
      };
    });
  }, [activeEval, baselineEval]);

  if (!scenario || evaluations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs font-mono text-[#8a96a1] gap-2">
        <Activity className="w-5 h-5 text-[#9BAA76] animate-pulse" />
        <span>Evaluating scenario response strategies...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs uppercase font-mono tracking-wider text-[#8a96a1]">
            Response Strategy Triage & Optimization
          </h3>
          <div className="text-[11px] text-[#e5e9ec] font-mono mt-0.5">
            Scenario: <span className="text-[#9BAA76] font-semibold">{scenario.name}</span>
          </div>
        </div>

        {appliedPlan && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#17252a] border border-[#38bdf8]/60 text-[#38bdf8] text-xs font-mono">
            <Check className="w-3.5 h-3.5" />
            <span>Active: {appliedPlan.name}</span>
          </div>
        )}
      </div>

      {/* 1. Ranked Plan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {evaluations.map((e) => {
          const isRank1 = e.rank === 1 && e.plan.id !== "no_action";
          const isCardSelected = activeEval?.plan.id === e.plan.id;
          const isPlanApplied = appliedPlan?.id === e.plan.id;

          return (
            <div
              key={e.plan.id}
              onClick={() => setSelectedPlanId(e.plan.id)}
              className={`relative flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                isCardSelected
                  ? "bg-[#252e35] border-[#9BAA76] shadow-lg ring-1 ring-[#9BAA76]/50"
                  : "bg-[#191F24] hover:bg-[#20282f] border-[#303941]"
              }`}
            >
              {/* RECOMMENDED badge on Rank 1 */}
              {isRank1 && (
                <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-[#9BAA76] to-[#b3c58d] text-[#101418] text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                  <Award className="w-3 h-3" />
                  RECOMMENDED
                </div>
              )}

              <div>
                {/* Rank & Title */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                        isRank1
                          ? "bg-[#9BAA76] text-[#101418]"
                          : e.plan.id === "no_action"
                          ? "bg-[#242c33] text-[#8a96a1] border border-[#303941]"
                          : "bg-[#2c363f] text-[#f1f4f6]"
                      }`}
                    >
                      #{e.rank}
                    </span>
                    <h4 className="font-bold text-xs text-[#f1f4f6] line-clamp-1">
                      {e.plan.name}
                    </h4>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-[11px] text-[#8a96a1] line-clamp-2 min-h-[32px] mb-3">
                  {e.plan.summary}
                </p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono mb-3">
                  <div className="bg-[#14191d] p-1.5 rounded border border-[#242c33] flex flex-col">
                    <span className="text-[#8a96a1] text-[9px]">Saved Pop-Hrs</span>
                    <span
                      className={`font-bold text-xs mt-0.5 ${
                        e.affected_pop_hours_saved_pct > 0
                          ? "text-[#9BAA76]"
                          : "text-[#8a96a1]"
                      }`}
                    >
                      {e.affected_pop_hours_saved_pct > 0
                        ? `+${e.affected_pop_hours_saved_pct}%`
                        : "0%"}
                    </span>
                  </div>

                  <div className="bg-[#14191d] p-1.5 rounded border border-[#242c33] flex flex-col">
                    <span className="text-[#8a96a1] text-[9px]">Hosp. Avoided</span>
                    <span
                      className={`font-bold text-xs mt-0.5 ${
                        e.hospital_hours_saved > 0 ? "text-[#38bdf8]" : "text-[#8a96a1]"
                      }`}
                    >
                      {e.hospital_hours_saved > 0 ? `+${e.hospital_hours_saved}h` : "0h"}
                    </span>
                  </div>

                  <div className="bg-[#14191d] p-1.5 rounded border border-[#242c33] flex flex-col">
                    <span className="text-[#8a96a1] text-[9px]">Resources</span>
                    <span className="font-bold text-xs mt-0.5 text-[#e5e9ec]">
                      {e.resources}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1">
                {e.plan.id === "no_action" ? (
                  <div className="w-full py-1.5 text-center text-[11px] font-mono text-[#8a96a1] bg-[#14191d] rounded border border-[#242c33]">
                    Baseline Comparison
                  </div>
                ) : (
                  <button
                    onClick={(evt) => {
                      evt.stopPropagation();
                      applyPlan(e);
                    }}
                    className={`w-full py-1.5 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      isPlanApplied
                        ? "bg-[#1f2b23] border border-[#9BAA76]/50 text-[#9BAA76] cursor-default font-mono"
                        : "bg-[#9BAA76] hover:bg-[#8fa06b] text-[#101418] font-bold shadow"
                    }`}
                  >
                    {isPlanApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#9BAA76]" />
                        <span>Plan Applied</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Apply Plan</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Plan Comparison Chart (selected plan vs No action baseline) */}
      {activeEval && baselineEval && (
        <div className="bg-[#191F24] p-4 rounded-xl border border-[#303941] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#303941] pb-2">
            <div>
              <h4 className="text-xs font-semibold text-[#f1f4f6] flex items-center gap-2">
                <span>Impact Trajectory:</span>
                <span className="text-[#38bdf8] font-mono">{activeEval.plan.name}</span>
                <span className="text-[#8a96a1] font-normal">vs</span>
                <span className="text-[#ef4444] font-mono">No Action (Baseline)</span>
              </h4>
              <p className="text-[10px] text-[#8a96a1] font-mono mt-0.5">
                Metric: Hourly affected population across 24-hour simulation horizon
              </p>
            </div>

            <div className="text-[11px] font-mono text-[#8a96a1] flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
                <span className="text-[#e5e9ec]">{activeEval.plan.name}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-[#ef4444]" />
                <span>No Action</span>
              </span>
            </div>
          </div>

          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#242c33" vertical={false} />
                <XAxis
                  dataKey="hour"
                  stroke="#8a96a1"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#303941" }}
                  interval={3}
                />
                <YAxis
                  stroke="#8a96a1"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#303941" }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#14191d",
                    borderColor: "#303941",
                    borderRadius: "8px",
                    color: "#f1f4f6",
                    fontSize: "11px",
                    fontFamily: "monospace",
                  }}
                  formatter={(value: any, name: any) => [
                    `${Number(value).toLocaleString("en-IN")} affected`,
                    String(name),
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey={activeEval.plan.name}
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#38bdf8" }}
                />
                <Line
                  type="monotone"
                  dataKey="No action (baseline)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 4, fill: "#ef4444" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
