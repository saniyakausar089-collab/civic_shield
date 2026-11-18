import React, { useMemo, useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";
import { simulate } from "@/engine/cascade";
import { evaluatePlans, type PlanEvaluation } from "@/engine/plans";
import { loadCivicShieldData } from "@/gis/civicshieldLayer";
import { Check, Play } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
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
    const topActionable = evaluations.find((e) => e.plan.id !== "no_action");
    return topActionable || evaluations[0];
  }, [evaluations, selectedPlanId]);

  // Build 24-hour chart comparison dataset
  const chartData = useMemo(() => {
    if (!activeEval || !baselineEval) return [];

    return Array.from({ length: 25 }, (_, hour) => {
      const activeFrame = activeEval?.simResult?.frames ? activeEval.simResult.frames[hour] : null;
      const baselineFrame = baselineEval?.simResult?.frames ? baselineEval.simResult.frames[hour] : null;

      return {
        hour: `T+${hour}h`,
        [activeEval.plan.name]: activeFrame ? activeFrame.affected_pop : 0,
        "No action (baseline)": baselineFrame ? baselineFrame.affected_pop : 0,
      };
    });
  }, [activeEval, baselineEval]);

  if (!scenario) {
    return (
      <div className="text-center py-12 text-[var(--text-tertiary)] text-xs">
        No active disaster scenario selected. Please pick a scenario in the Simulate tab.
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[var(--text-primary)] font-sans">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <div className="ops-eyebrow">
            Municipal Emergency Response Plans
          </div>
          <div className="text-sm text-[var(--text-secondary)] mt-0.5">
            Scenario: <span className="text-[var(--text-primary)] font-semibold">{scenario.name}</span>
          </div>
        </div>

        {appliedPlan && (
          <div className="ops-chip text-xs font-semibold text-[var(--status-good)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-good)]" />
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
              className={`relative flex flex-col justify-between p-4 rounded-[12px] border transition-colors cursor-pointer ${
                isCardSelected
                  ? "bg-[var(--surface-2)] border-[var(--accent)]"
                  : "bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border-[var(--border-subtle)]"
              }`}
            >
              {/* RECOMMENDED badge on Rank 1 */}
              {isRank1 && (
                <div className="absolute -top-2.5 right-3 bg-[var(--surface-3)] text-[var(--text-secondary)] border border-[var(--border-subtle)] text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-good)] shrink-0" />
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
                          : "bg-[var(--surface-3)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                      }`}
                    >
                      #{e.rank}
                    </span>
                    <h4 className="font-semibold text-xs text-[var(--text-primary)] line-clamp-1">
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
                  <div className="bg-[var(--surface-2)] p-2 rounded-[8px] border border-[var(--border-subtle)] flex flex-col">
                    <span className="text-[var(--text-tertiary)] text-[9px] uppercase font-semibold">Saved Pop-Hrs</span>
                    <span
                      className={`font-semibold text-xs mt-0.5 tabular-nums ${
                        e.affected_pop_hours_saved_pct > 0
                          ? "text-[var(--status-good)]"
                          : "text-[var(--text-tertiary)]"
                      }`}
                    >
                      {e.affected_pop_hours_saved_pct > 0
                        ? `+${e.affected_pop_hours_saved_pct}%`
                        : "0%"}
                    </span>
                  </div>

                  <div className="bg-[var(--surface-2)] p-2 rounded-[8px] border border-[var(--border-subtle)] flex flex-col">
                    <span className="text-[var(--text-tertiary)] text-[9px] uppercase font-semibold">Hosp. Avoided</span>
                    <span
                      className={`font-semibold text-xs mt-0.5 tabular-nums ${
                        e.hospital_hours_saved > 0 ? "text-[var(--status-good)]" : "text-[var(--text-tertiary)]"
                      }`}
                    >
                      {e.hospital_hours_saved > 0 ? `+${e.hospital_hours_saved}h` : "0h"}
                    </span>
                  </div>

                  <div className="bg-[var(--surface-2)] p-2 rounded-[8px] border border-[var(--border-subtle)] flex flex-col">
                    <span className="text-[var(--text-tertiary)] text-[9px] uppercase font-semibold">Resources</span>
                    <span className="font-semibold text-xs mt-0.5 text-[var(--text-primary)] tabular-nums">
                      {e.resources}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1">
                {e.plan.id === "no_action" ? (
                  <div className="w-full py-1.5 text-center text-[11px] font-medium text-[var(--text-tertiary)] bg-[var(--surface-2)] rounded-[6px] border border-[var(--border-subtle)]">
                    Baseline Comparison
                  </div>
                ) : (
                  <button
                    onClick={(evt) => {
                      evt.stopPropagation();
                      applyPlan(e);
                    }}
                    className={`w-full py-1.5 px-3 rounded-[6px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isPlanApplied
                        ? "bg-[var(--surface-3)] border border-[var(--border-subtle)] text-[var(--status-good)] cursor-default"
                        : "ops-btn-primary"
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
        <div className="p-4 rounded-[12px] bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <span>Impact Trajectory:</span>
                <span className="text-[var(--accent)]">{activeEval.plan.name}</span>
                <span className="text-[var(--text-tertiary)] font-normal">vs</span>
                <span className="text-[var(--text-tertiary)]">No Action (Baseline)</span>
              </h4>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                Metric: Hourly affected population across 24-hour simulation horizon
              </p>
            </div>

            <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
                <span className="text-[var(--text-primary)] font-semibold">{activeEval.plan.name}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-[var(--text-tertiary)]" />
                <span>No Action</span>
              </span>
            </div>
          </div>

          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  stroke="var(--text-tertiary)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border-subtle)" }}
                  interval={3}
                />
                <YAxis
                  stroke="var(--text-tertiary)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border-subtle)" }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface-3)",
                    borderColor: "var(--border-subtle)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "11px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                  }}
                  formatter={(value: any, name: any) => [
                    `${Number(value).toLocaleString("en-IN")} affected`,
                    String(name),
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey={activeEval.plan.name}
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "var(--accent)" }}
                />
                <Line
                  type="monotone"
                  dataKey="No action (baseline)"
                  stroke="var(--text-tertiary)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 3, fill: "var(--text-tertiary)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
