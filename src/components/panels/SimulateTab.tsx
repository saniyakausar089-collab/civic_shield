import React, { useEffect } from "react";
import { PRESETS } from "@/engine/plans";
import { BASE_CITY } from "@/engine/city";
import { applyMods } from "@/engine/analysis";
import { useAppStore } from "@/store/appStore";
import { Flame, Droplets, Zap, Shield, Globe, Layers, ArrowUpRight } from "lucide-react";
import { AiRiskEstimateCard } from "./AiRiskEstimateCard";

export const SimulateTab: React.FC = () => {
  const presetId = useAppStore((s) => s.presetId);
  const triggers = useAppStore((s) => s.triggers);
  const cityMods = useAppStore((s) => s.cityMods);
  const scenariosData = useAppStore((s) => s.scenariosData);
  const setScenariosData = useAppStore((s) => s.setScenariosData);
  const selectScenario = useAppStore((s) => s.selectScenario);
  const result = useAppStore((s) => s.result);
  const t = useAppStore((s) => s.t);
  const toggleTrigger = useAppStore((s) => s.toggleTrigger);
  const networkData = useAppStore((s) => s.networkData);

  const getAssetName = (id: string) => {
    const fromStore = networkData?.nodes.find((n) => n.id === id);
    if (fromStore?.name) return fromStore.name;
    const names: Record<string, string> = {
      WT1: "North Water Works",
      WT2: "South Water Works",
      PIPE1: "Main Pipeline",
      PIPE2: "West Feeder Main",
      PUMPA: "Pumping Station A",
      PUMPB: "Pumping Station B",
      RES1: "Hill Reservoir",
      RES2: "East Overhead Tank",
      PP1: "Grid Power Plant",
      SUB1: "North Substation",
      SUB2: "Central Substation",
      SUB3: "South Substation",
      SUB4: "East Substation",
      SUB5: "West Substation",
      TX1: "Core Telecom Exchange",
      T1: "Telecom Tower 1",
      T2: "Telecom Tower 2",
      T3: "Telecom Tower 3",
      T4: "Telecom Tower 4",
      RJ1: "Central Junction",
      RJ2: "North Junction",
      RJ3: "East Junction",
      UJ1: "East Underpass",
      UJ2: "West Underpass",
      H1: "City General Hospital",
      H2: "Northwest Medical Center",
    };
    return names[id] || id;
  };

  useEffect(() => {
    if (scenariosData.length === 0) {
      fetch("/data/scenarios.json")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.scenarios) {
            setScenariosData(data.scenarios);
          }
        })
        .catch(() => {});
    }
  }, [scenariosData.length, setScenariosData]);

  const city = applyMods(BASE_CITY, cityMods);

  const getPresetIcon = (id: string) => {
    switch (id) {
      case "pipeline":
      case "pipeline_burst":
        return <Droplets className="w-4 h-4 text-[var(--accent)]" />;
      case "monsoon":
      case "monsoon_flood":
        return <Globe className="w-4 h-4 text-[var(--accent)]" />;
      case "heatwave":
      case "heatwave_overload":
        return <Flame className="w-4 h-4 text-[var(--status-warning)]" />;
      case "cyber":
      case "cyberattack":
        return <Zap className="w-4 h-4 text-[var(--status-warning)]" />;
      case "quake":
      case "earthquake":
        return <Shield className="w-4 h-4 text-[var(--status-danger)]" />;
      default:
        return <Layers className="w-4 h-4 text-[var(--accent)]" />;
    }
  };

  const scenariosList =
    scenariosData.length > 0
      ? scenariosData
      : PRESETS.map((p) => ({
          id: p.id,
          name: p.label,
          summary: p.blurb,
          triggers: p.triggers.map((node) => ({ node })),
        }));

  const isScenarioActive = (s: any) =>
    presetId === s.id ||
    (presetId === "pipeline" && s.id === "pipeline_burst") ||
    (presetId === "monsoon" && s.id === "monsoon_flood") ||
    (presetId === "heatwave" && s.id === "heatwave_overload") ||
    (presetId === "cyber" && s.id === "cyberattack") ||
    (presetId === "quake" && s.id === "earthquake");

  return (
    <div className="space-y-6 text-[var(--text)] font-sans">
      {/* 1. Select Disaster Scenario (Apple Responsive 3-Column Grid) */}
      <div>
        <div className="apple-eyebrow mb-3">
          1. Select Disaster Scenario
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {scenariosList.map((s) => {
            const isActive = isScenarioActive(s);
            const triggerNodes = s.triggers.map((t: any) => t.node || t);
            return (
              <button
                key={s.id}
                onClick={() => selectScenario(s)}
                className={`flex flex-col text-left p-4 rounded-[20px] transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[var(--accent-tint)] border border-[var(--accent)] shadow-xs"
                    : "bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-subtle)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    {/* Soft Tinted Circle for Icon */}
                    <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      {getPresetIcon(s.id)}
                    </div>
                    <span className="font-semibold text-[15px] text-[var(--text)] tracking-tight">
                      {s.name || s.label}
                    </span>
                  </div>
                  <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-tertiary)] font-medium">
                    {triggerNodes.length} {triggerNodes.length === 1 ? "trigger" : "triggers"}
                  </span>
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] line-clamp-1 leading-normal mb-2.5">
                  {s.summary || s.blurb}
                </p>
                {/* Blue link-style text with arrow ↗ */}
                <div className="mt-auto pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <span className="apple-link text-[12px] truncate max-w-[240px]">
                    Triggers: {triggerNodes.map((id: string) => getAssetName(id)).join(", ")}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Risk Estimate Card (Surrogate Model) */}
      <AiRiskEstimateCard />

      {/* 2. Manual Triggers Picker */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="apple-eyebrow">
            2. Or Break Any Individual Node ({triggers.length} currently failed at T+0)
          </div>
        </div>
        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-3 bg-[var(--surface-2)] rounded-[20px] border border-[var(--border)]">
          {city.nodes.map((n) => {
            const isTrig = triggers.includes(n.id);
            return (
              <button
                key={n.id}
                onClick={() => toggleTrigger(n.id)}
                className={`text-xs px-3 py-1 rounded-full border transition-all cursor-pointer font-medium ${
                  isTrig
                    ? "bg-rose-500/10 border-rose-500/30 text-[var(--status-danger)] font-semibold"
                    : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {n.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Cascade Event Log (T+0 to T+{t}, newest first) */}
      {result && Array.isArray(result.events) && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="apple-eyebrow">
              3. Cascade Event Log (T+0 to T+{t}h — {result.events.filter((e) => e.t <= t).length} events)
            </div>
            <span className="text-[11px] text-[var(--text-tertiary)] font-medium">Newest first</span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 bg-[var(--surface-2)] p-3 rounded-[20px] border border-[var(--border)]">
            {result.events.filter((e) => e.t <= t).length === 0 ? (
              <div className="text-xs text-[var(--text-tertiary)] text-center py-3">
                No events recorded up to T+{t}h
              </div>
            ) : (
              [...result.events.filter((e) => e.t <= t)].reverse().map((e, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs py-1.5 px-3 rounded-full bg-[var(--surface)] border border-[var(--border)] transition-colors"
                >
                  <span className="text-[var(--accent)] shrink-0 font-semibold tabular-nums">
                    T+{String(e.t).padStart(2, "0")}h
                  </span>
                  <span
                    className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                      e.kind === "trigger"
                        ? "bg-rose-500/10 text-[var(--status-danger)]"
                        : e.kind === "cascade"
                        ? "bg-amber-500/10 text-[var(--status-warning)]"
                        : "bg-emerald-500/10 text-[var(--status-success)]"
                    }`}
                  >
                    {e.kind}
                  </span>
                  <span className="text-[var(--text-secondary)]">{e.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
