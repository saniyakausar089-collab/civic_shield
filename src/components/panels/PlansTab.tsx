import React, { useMemo } from "react";
import { PLANS, PLAN_WAIT } from "@/engine/plans";
import { BASE_CITY } from "@/engine/city";
import { applyMods, analyzeHarm } from "@/engine/analysis";
import { runSim, type SimResult } from "@/engine/sim";
import { useAppStore } from "@/store/appStore";
import { Award, Check, Sliders } from "lucide-react";

export const PlansTab: React.FC = () => {
  const planId = useAppStore((s) => s.planId);
  const triggers = useAppStore((s) => s.triggers);
  const cityMods = useAppStore((s) => s.cityMods);
  const actionIds = useAppStore((s) => s.actionIds);
  const custom = useAppStore((s) => s.custom);
  const setPlan = useAppStore((s) => s.setPlan);
  const setCustom = useAppStore((s) => s.setCustom);

  const city = useMemo(() => applyMods(BASE_CITY, cityMods), [cityMods]);

  // Compute outcomes for the 4 standard plans
  const planStats = useMemo(() => {
    const list = PLANS.map((p) => {
      const res = runSim(city, triggers, p, actionIds);
      const harm = analyzeHarm(res);
      return { plan: p, result: res, harm };
    });

    // Find best value plan:
    // Compare harm reduction vs wait plan per crew unit
    const waitPlan = list.find((p) => p.plan.id === "wait") ?? list[0];
    const waitHarm = waitPlan ? waitPlan.harm : 1;

    let bestPlanId = "valve";
    let maxRatio = -Infinity;

    for (const item of list) {
      if (item.plan.id === "wait") continue;
      const reduction = Math.max(0, waitHarm - item.harm);
      const ratio = reduction / Math.max(1, item.plan.crew);
      if (ratio > maxRatio) {
        maxRatio = ratio;
        bestPlanId = item.plan.id;
      }
    }

    return { list, bestPlanId };
  }, [city, triggers, actionIds]);

  const maxPersonHours = Math.max(
    1,
    ...planStats.list.map((p) => p.result.personHoursLost)
  );

  return (
    <div className="space-y-6">
      {/* 4 Plans Side-by-Side Comparison */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
            Response Strategy Comparison
          </h3>
          <span className="text-xs text-muted-foreground">
            Active: <span className="text-cyan-400 font-semibold">{planId.toUpperCase()}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {planStats.list.map(({ plan, result, harm }) => {
            const isSelected = planId === plan.id;
            const isBestValue = planStats.bestPlanId === plan.id;
            const barWidth = Math.round((result.personHoursLost / maxPersonHours) * 100);

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-cyan-950/20 border-cyan-500 shadow-md ring-1 ring-cyan-500"
                    : "bg-card hover:bg-muted/40 border-border"
                }`}
              >
                {/* Best Value Badge */}
                {isBestValue && (
                  <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Award className="w-3 h-3" />
                    Best Value
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="font-bold text-sm text-foreground">{plan.name}</h4>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Cost: {plan.crew} crew
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{plan.blurb}</p>

                  {/* Visual Impact Bar */}
                  <div className="space-y-2 mb-3">
                    <div>
                      <div className="flex justify-between text-[11px] font-mono mb-1">
                        <span className="text-muted-foreground">Person-Hours Lost</span>
                        <span className="font-bold text-foreground">
                          {Math.round(result.personHoursLost).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                      <div className="bg-muted/40 p-1.5 rounded-lg border border-border/40">
                        <span className="text-muted-foreground">Hospitals Down:</span>{" "}
                        <span className="font-bold text-foreground">
                          {result.hospitalHoursDown}h
                        </span>
                      </div>
                      <div className="bg-muted/40 p-1.5 rounded-lg border border-border/40">
                        <span className="text-muted-foreground">Peak Pop:</span>{" "}
                        <span className="font-bold text-foreground">
                          {result.peakPopulationAffected.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setPlan(plan.id)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    isSelected
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Active Plan
                    </>
                  ) : (
                    "Deploy Plan"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Plan Fine-Tuning */}
      <div className="p-4 rounded-2xl bg-muted/20 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
            Custom Plan Fine-Tuning
          </h3>
          {planId === "custom" && (
            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">
              Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Crew Units */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-muted-foreground">Crew Units</span>
              <span className="font-bold text-foreground">{custom.crew}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={custom.crew}
              onChange={(e) => setCustom({ crew: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Repair Speed */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-muted-foreground">Repair Speed Effort</span>
              <span className="font-bold text-foreground">
                {Math.round(custom.repairSpeed * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.1}
              value={custom.repairSpeed}
              onChange={(e) => setCustom({ repairSpeed: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Hospital Backup */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-muted-foreground">Hospital Extra Buffer</span>
              <span className="font-bold text-foreground">+{custom.hospitalBackup}h</span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              value={custom.hospitalBackup}
              onChange={(e) => setCustom({ hospitalBackup: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Water Buffer */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-muted-foreground">Water Buffers</span>
              <span className="font-bold text-foreground">+{custom.waterBuffer}h</span>
            </div>
            <input
              type="range"
              min={0}
              max={8}
              value={custom.waterBuffer}
              onChange={(e) => setCustom({ waterBuffer: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-400"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between pt-3 border-t border-border/50">
          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={custom.reroute}
              onChange={(e) => setCustom({ reroute: e.target.checked })}
              className="rounded accent-cyan-400"
            />
            <span>Reroute traffic around flooded East Underpass (cuts UJ1 &gt; PIPE1 link)</span>
          </label>
          <button
            onClick={() => setPlan("custom")}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            Apply Custom Plan
          </button>
        </div>
      </div>
    </div>
  );
};
