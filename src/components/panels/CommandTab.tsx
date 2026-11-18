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
      <div className="apple-card p-5 rounded-[20px] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Radial Circular Gauge */}
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[var(--border)]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[var(--accent)] transition-all duration-500 ease-out"
                strokeDasharray={`${currentScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold tabular-nums text-[var(--text)] leading-none">
                {currentScore}
              </span>
              <span className="text-[9px] uppercase font-semibold text-[var(--text-tertiary)]">/ 100</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="font-semibold text-[var(--text)] text-sm">City Resilience Score</h3>
              {currentScore > baseScore && (
                <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[var(--status-success)] border border-emerald-500/20 font-semibold tabular-nums">
                  +{currentScore - baseScore} from baseline
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md leading-relaxed">
              Calculated across all disaster presets (pipeline, monsoon, heatwave, cyberattack, earthquake).
              Current upgrades: {cityMods.length} active. Baseline score: {baseScore}.
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Command Panel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="apple-eyebrow">
            Emergency Command Actions
          </div>
          <span className="text-xs text-[var(--text-tertiary)]">
            Active: <span className="font-semibold text-[var(--accent)]">{actionIds.length} deployed</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {COMMAND_ACTIONS.map((action) => {
            const isDeployed = actionIds.includes(action.id);
            return (
              <button
                key={action.id}
                onClick={() => toggleAction(action.id)}
                className={`p-4 rounded-[20px] border text-left flex items-start gap-3.5 transition-all duration-200 cursor-pointer ${
                  isDeployed
                    ? "bg-[var(--accent-tint)] border-[var(--accent)] shadow-xs"
                    : "bg-[var(--surface)] hover:bg-[var(--surface-2)] border-[var(--border)] hover:-translate-y-0.5"
                }`}
              >
                <div
                  className={`text-xl p-2 rounded-lg shrink-0 ${
                    isDeployed ? "bg-[#2563EB]/15 dark:bg-[#3B82F6]/20" : "bg-[#F7F8FA] dark:bg-[#111318]"
                  }`}
                >
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-xs text-[#111827] dark:text-[#FAFAFA]">{action.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#F7F8FA] dark:bg-[#111318] text-[#94A3B8] dark:text-[#71717A] border border-[#E5E7EB] dark:border-[#27272A]">
                      Cost: {action.cost} crew
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] dark:text-[#A1A1AA]">{action.effect}</p>
                  <div className="mt-2 text-[10px] text-[#2563EB] dark:text-[#3B82F6] flex items-center justify-between">
                    <span>Delay: T+{action.delayHours}h</span>
                    <span className={isDeployed ? "text-[#2563EB] dark:text-[#3B82F6] font-semibold" : "text-[#94A3B8] dark:text-[#71717A]"}>
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
      <div className="p-4 rounded-lg bg-white dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
            <h3 className="text-xs uppercase tracking-wider text-[#94A3B8] dark:text-[#71717A] font-semibold">
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
