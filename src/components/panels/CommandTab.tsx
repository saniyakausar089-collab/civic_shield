import React, { useMemo, useState } from "react";
import { COMMAND_ACTIONS } from "@/engine/plans";
import { BASE_CITY } from "@/engine/city";
import {
  applyMods,
  resilienceScore,
  optimizeBudget,
  UPGRADES,
  type CityMod,
} from "@/engine/analysis";
import { runSim } from "@/engine/sim";
import { useAppStore } from "@/store/appStore";
import { ShieldCheck, Plus, Trash2, Cpu, Wrench, Sparkles, Check } from "lucide-react";

export const CommandTab: React.FC = () => {
  const actionIds = useAppStore((s) => s.actionIds);
  const toggleAction = useAppStore((s) => s.toggleAction);
  const cityMods = useAppStore((s) => s.cityMods);
  const addMod = useAppStore((s) => s.addMod);
  const removeMod = useAppStore((s) => s.removeMod);
  const triggers = useAppStore((s) => s.triggers);

  const [budget, setBudget] = useState(4);

  // Compute Resilience Scores
  const baseScore = useMemo(() => resilienceScore(BASE_CITY), []);
  const currentCity = useMemo(() => applyMods(BASE_CITY, cityMods), [cityMods]);
  const currentScore = useMemo(() => resilienceScore(currentCity), [currentCity]);

  // Budget Optimizer calculation
  const optimization = useMemo(() => {
    return optimizeBudget(BASE_CITY, triggers, budget);
  }, [triggers, budget]);

  // Pre-configured What-If Mod options
  const whatIfOptions: { label: string; description: string; mod: CityMod }[] = [
    {
      label: "Eastside Medical Generator (+10h)",
      description: "Dedicated backup diesel genset for H1 hospital",
      mod: { type: "backup", nodeId: "H1", hours: 10, label: "Generator H1" },
    },
    {
      label: "Riverside Hospital Generator (+10h)",
      description: "Dedicated backup diesel genset for H2 hospital",
      mod: { type: "backup", nodeId: "H2", hours: 10, label: "Generator H2" },
    },
    {
      label: "Second Water Main (WT2 Pipeline)",
      description: "Dual-feed redundancy into Main Pipeline from South Water Works",
      mod: { type: "secondWaterLine", label: "Second water main" },
    },
    {
      label: "Flood Barriers on East Underpass",
      description: "Pumps and flood valves give UJ1 24h water protection",
      mod: { type: "floodBarrier", label: "Flood barrier UJ1" },
    },
    {
      label: "Redundant Power Feed for Central Substation",
      description: "Alternate substation loop connection for SUB2",
      mod: { type: "redundantPower", nodeId: "SUB2", label: "Redundant SUB2 feed" },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Resilience Gauge */}
      <div className="p-4 rounded-2xl bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Radial Circular Gauge */}
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-muted/40"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-cyan-400 transition-all duration-500 ease-out"
                strokeDasharray={`${currentScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold font-mono text-foreground leading-none">
                {currentScore}
              </span>
              <span className="text-[9px] font-mono uppercase text-muted-foreground">/ 100</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-foreground text-sm">City Resilience Score</h3>
              {currentScore > baseScore && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  +{currentScore - baseScore} from baseline
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Calculated across all disaster presets (pipeline, monsoon, heatwave, cyberattack, earthquake).
              Current upgrades: {cityMods.length} active. Baseline score: {baseScore}.
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Command Panel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
            Emergency Command Actions
          </h3>
          <span className="text-xs text-muted-foreground">
            Active: <span className="font-mono text-cyan-400">{actionIds.length} deployed</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COMMAND_ACTIONS.map((action) => {
            const isDeployed = actionIds.includes(action.id);
            return (
              <button
                key={action.id}
                onClick={() => toggleAction(action.id)}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  isDeployed
                    ? "bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-500/50 shadow-md"
                    : "bg-card hover:bg-muted/40 border-border"
                }`}
              >
                <div
                  className={`text-xl p-2 rounded-xl shrink-0 ${
                    isDeployed ? "bg-cyan-500/20" : "bg-muted"
                  }`}
                >
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-xs text-foreground">{action.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      Cost: {action.cost} crew
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{action.effect}</p>
                  <div className="mt-2 text-[10px] font-mono text-cyan-400/90 flex items-center justify-between">
                    <span>Delay: T+{action.delayHours}h</span>
                    <span className={isDeployed ? "text-cyan-300 font-bold" : "text-muted-foreground"}>
                      {isDeployed ? "● DEPLOYED" : "○ STANDBY"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* What-If Infrastructure Builder */}
      <div className="p-4 rounded-2xl bg-card border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
              What-If Infrastructure Builder
            </h3>
          </div>
          {cityMods.length > 0 && (
            <button
              onClick={() => {
                cityMods.forEach((m) => removeMod(m.label));
              }}
              className="text-xs text-red-400 hover:text-red-300 underline font-mono"
            >
              Reset all mods
            </button>
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          Simulate hardening the city with physical redundancy and backup systems before a disaster strikes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {whatIfOptions.map((opt) => {
            const isInstalled = cityMods.some((m) => m.label === opt.mod.label);
            return (
              <div
                key={opt.label}
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                  isInstalled
                    ? "bg-emerald-950/20 border-emerald-500/50"
                    : "bg-muted/20 border-border"
                }`}
              >
                <div>
                  <div className="font-semibold text-xs text-foreground">{opt.label}</div>
                  <div className="text-[11px] text-muted-foreground">{opt.description}</div>
                </div>
                <button
                  onClick={() => {
                    if (isInstalled) {
                      removeMod(opt.mod.label);
                    } else {
                      addMod(opt.mod);
                    }
                  }}
                  className={`p-2 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                    isInstalled
                      ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {isInstalled ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget Optimizer */}
      <div className="p-4 rounded-2xl bg-muted/20 border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
              Automated Budget Optimizer
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              Budget: <strong className="text-foreground">{budget} units</strong>
            </span>
            <input
              type="range"
              min={1}
              max={8}
              value={budget}
              onChange={(e) => setBudget(parseInt(e.target.value, 10))}
              className="w-24 sm:w-32 accent-amber-400"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          Evaluates all 256 capital upgrade combinations against the active scenario and selects the highest harm-reduction combos within budget.
        </p>

        <div className="space-y-2">
          {optimization.best.map((combo, idx) => {
            const cost = combo.upgrades.reduce((s, u) => s + u.cost, 0);
            const saved = Math.max(
              0,
              optimization.baseline.personHoursLost - combo.result.personHoursLost
            );
            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      Option #{idx + 1}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      Cost: {cost} / {budget} units
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Saves {Math.round(saved).toLocaleString()} person-hours
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                    {combo.upgrades.map((u) => (
                      <span
                        key={u.id}
                        className="bg-muted px-2 py-0.5 rounded text-[11px] text-foreground"
                      >
                        {u.label}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    combo.upgrades.forEach((u) => addMod(u.mod));
                  }}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                >
                  Deploy All {combo.upgrades.length}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
