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
    // Default to rank 1 actionable plan or first
    const topActionable = evaluations.find((e) => e.plan.id !== "no_action");
    return topActionable || evaluations[0];
  }, [evaluations, selectedPlanId]);

  // Build 24-hour chart comparison dataset
  const chartData = useMemo(() => {
    if (!activeEval || !baselineEval) return [];

    return Array.from({ length: 25 }, (_, hour) => {
      const activeFrame = activeEval.simResult.frames[hour];
      const baselineFrame = baselineEval.simResult.frames[hour];

      return {
        hour: `T+${hour}h`,
        [activeEval.plan.name]: activeFrame ? activeFrame.affected_pop : 0,
        "No action (baseline)": baselineFrame ? baselineFrame.affected_pop : 0,
      };
    });
  }, [activeEval, baselineEval]);

  if (!scenario) {
    return (
      <div className="text-center py-12 text-[#94A3B8] dark:text-[#71717A] text-xs">
        No active disaster scenario selected. Please pick a scenario in the Simulate tab.
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#111827] dark:text-[#FAFAFA] font-sans">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#27272A] pb-3">
        <div>
          <h3 className="text-xs uppercase tracking-wider text-[#94A3B8] dark:text-[#71717A] font-semibold">
            Municipal Emergency Response Plans
          </h3>
          <div className="text-sm text-[#475569] dark:text-[#A1A1AA] mt-0.5">
            Scenario: <span className="text-[#2563EB] dark:text-[#3B82F6] font-semibold">{scenario.name}</span>
          </div>
        </div>

        {appliedPlan && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#2563EB]/10 dark:bg-[#3B82F6]/15 border border-[#2563EB]/30 dark:border-[#3B82F6]/40 text-[#2563EB] dark:text-[#3B82F6] text-xs font-semibold">
            <Check className="w-3.5 h-3.5" />
            <span>Active: {appliedPlan.name}</span>
          </div>
        )}
      </div>

      {/* 1. Ranked Plan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {evaluations.map((e) => {
          const isRank1 = e.rank === 1 && e.plan.id !== "no_action";
          const isCardSelected = activeEval?.plan.id === e.plan.id;
          const isPlanApplied = appliedPlan?.id === e.plan.id;

          return (
            <div
              key={e.plan.id}
              onClick={() => setSelectedPlanId(e.plan.id)}
              className={`relative flex flex-col justify-between p-4 rounded-[20px] border transition-all duration-200 cursor-pointer ${
                isCardSelected
                  ? "bg-[var(--surface)] border-[var(--accent)] shadow-[var(--shadow-soft)] ring-2 ring-[var(--accent-tint)]"
                  : "bg-[var(--surface)] hover:bg-[var(--surface-2)] border-[var(--border)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-subtle)]"
              }`}
            >
              {/* RECOMMENDED badge on Rank 1 */}
              {isRank1 && (
                <div className="absolute -top-2.5 right-4 bg-[var(--accent)] text-[var(--accent-foreground)] text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <Award className="w-3 h-3" />
                  RECOMMENDED
                </div>
              )}

              <div>
                {/* Rank & Title */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10.5px] font-semibold ${
                        isRank1
                          ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                          : "bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]"
                      }`}
                    >
                      #{e.rank}
                    </span>
                    <h4 className="font-semibold text-xs text-[var(--text)] line-clamp-1">
                      {e.plan.name}
                    </h4>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-[11.5px] text-[var(--text-secondary)] line-clamp-2 min-h-[34px] mb-3 leading-normal">
                  {e.plan.summary}
                </p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-1.5 text-[10px] mb-3">
                  <div className="bg-[var(--surface-2)] p-2.5 rounded-[12px] border border-[var(--border)] flex flex-col">
                    <span className="text-[var(--text-tertiary)] text-[9px] uppercase font-semibold">Saved Pop-Hrs</span>
                    <span
                      className={`font-semibold text-xs mt-0.5 tabular-nums ${
                        e.affected_pop_hours_saved_pct > 0
                          ? "text-[var(--accent)]"
                          : "text-[var(--text-tertiary)]"
                      }`}
                    >
                      {e.affected_pop_hours_saved_pct > 0
                        ? `+${e.affected_pop_hours_saved_pct}%`
                        : "0%"}
                    </span>
                  </div>

                  <div className="bg-[var(--surface-2)] p-2.5 rounded-[12px] border border-[var(--border)] flex flex-col">
                    <span className="text-[var(--text-tertiary)] text-[9px] uppercase font-semibold">Hosp. Avoided</span>
                    <span
                      className={`font-semibold text-xs mt-0.5 tabular-nums ${
                        e.hospital_hours_saved > 0 ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"
                      }`}
                    >
                      {e.hospital_hours_saved > 0 ? `+${e.hospital_hours_saved}h` : "0h"}
                    </span>
                  </div>

                  <div className="bg-[var(--surface-2)] p-2.5 rounded-[12px] border border-[var(--border)] flex flex-col">
                    <span className="text-[var(--text-tertiary)] text-[9px] uppercase font-semibold">Resources</span>
                    <span className="font-semibold text-xs mt-0.5 text-[var(--text)] tabular-nums">
                      {e.resources}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1">
                {e.plan.id === "no_action" ? (
                  <div className="w-full py-1.5 text-center text-[11px] font-medium text-[var(--text-tertiary)] bg-[var(--surface-2)] rounded-full border border-[var(--border)]">
                    Baseline Comparison
                  </div>
                ) : (
                  <button
                    onClick={(evt) => {
                      evt.stopPropagation();
                      applyPlan(e);
                    }}
                    className={`w-full py-1.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isPlanApplied
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-[var(--status-success)] cursor-default"
                        : "apple-btn-primary shadow-xs active:scale-[0.98]"
                    }`}
                  >
                    {isPlanApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
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
        <div className="apple-card p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] dark:border-[#27272A] pb-2.5">
            <div>
              <h4 className="text-xs font-semibold text-[#111827] dark:text-[#FAFAFA] flex items-center gap-2">
                <span>Impact Trajectory:</span>
                <span className="text-[#2563EB] dark:text-[#3B82F6]">{activeEval.plan.name}</span>
                <span className="text-[#94A3B8] dark:text-[#71717A] font-normal">vs</span>
                <span className="text-rose-600 dark:text-rose-400">No Action (Baseline)</span>
              </h4>
              <p className="text-[11px] text-[#94A3B8] dark:text-[#71717A] mt-0.5">
                Metric: Hourly affected population across 24-hour simulation horizon
              </p>
            </div>

            <div className="text-[11px] text-[#94A3B8] dark:text-[#71717A] flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
                <span className="text-[#111827] dark:text-[#FAFAFA] font-semibold">{activeEval.plan.name}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-rose-600 dark:bg-rose-400" />
                <span>No Action</span>
              </span>
            </div>
          </div>

          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis
                  dataKey="hour"
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB" }}
                  interval={3}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E5E7EB",
                    borderRadius: "8px",
                    color: "#111827",
                    fontSize: "11px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: any, name: any) => [
                    `${Number(value).toLocaleString("en-IN")} affected`,
                    String(name),
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey={activeEval.plan.name}
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#2563EB" }}
                />
                <Line
                  type="monotone"
                  dataKey="No action (baseline)"
                  stroke="#DC2626"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 4, fill: "#DC2626" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
