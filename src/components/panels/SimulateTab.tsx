import React, { useEffect } from "react";
import { PRESETS } from "@/engine/plans";
import { BASE_CITY } from "@/engine/city";
import { applyMods } from "@/engine/analysis";
import { useAppStore } from "@/store/appStore";
import { Flame, Droplets, Zap, Shield, Globe, Layers } from "lucide-react";
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
        return <Droplets className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />;
      case "monsoon":
      case "monsoon_flood":
        return <Globe className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />;
      case "heatwave":
      case "heatwave_overload":
        return <Flame className="w-4 h-4 text-amber-600 dark:text-amber-500" />;
      case "cyber":
      case "cyberattack":
        return <Zap className="w-4 h-4 text-amber-600 dark:text-amber-500" />;
      case "quake":
      case "earthquake":
        return <Shield className="w-4 h-4 text-rose-600 dark:text-rose-500" />;
      default:
        return <Layers className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />;
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
    <div className="space-y-6 text-[#111827] dark:text-[#FAFAFA] font-sans">
      {/* Disaster Presets */}
      <div>
        <h3 className="text-[12px] uppercase tracking-wider text-[#94A3B8] dark:text-[#71717A] font-semibold mb-3">
          1. Select Disaster Scenario
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenariosList.map((s) => {
            const isActive = isScenarioActive(s);
            const triggerNodes = s.triggers.map((t: any) => t.node || t);
            return (
              <button
                key={s.id}
                onClick={() => selectScenario(s)}
                className={`flex flex-col text-left p-3.5 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#2563EB]/10 dark:bg-[#3B82F6]/15 border border-[#2563EB] dark:border-[#3B82F6] shadow-xs"
                    : "bg-white dark:bg-[#181B22] hover:bg-[#F7F8FA] dark:hover:bg-[#20242D] border border-[#E5E7EB] dark:border-[#27272A] hover:border-[#CBD5E1] dark:hover:border-[#3F3F46] shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {getPresetIcon(s.id)}
                    <span className="font-semibold text-[14px] text-[#111827] dark:text-[#FAFAFA]">
                      {s.name || s.label}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F7F8FA] dark:bg-[#111318] border border-[#E5E7EB] dark:border-[#27272A] text-[#94A3B8] dark:text-[#71717A] font-medium">
                    {triggerNodes.length} {triggerNodes.length === 1 ? "trigger" : "triggers"}
                  </span>
                </div>
                <p className="text-[12px] text-[#475569] dark:text-[#A1A1AA] line-clamp-2 leading-relaxed">
                  {s.summary || s.blurb}
                </p>
                <div className="mt-2.5 text-[11px] font-medium text-[#2563EB] dark:text-[#3B82F6] truncate">
                  Triggers: {triggerNodes.map((id: string) => getAssetName(id)).join(", ")}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Risk Estimate Card (Surrogate Model) */}
      <AiRiskEstimateCard />

      {/* Manual Triggers Picker */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[12px] uppercase tracking-wider text-[#94A3B8] dark:text-[#71717A] font-semibold">
            2. Or Break Any Individual Node ({triggers.length} currently failed at T+0)
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 bg-[#F7F8FA] dark:bg-[#111318] rounded-lg border border-[#E5E7EB] dark:border-[#27272A]">
          {city.nodes.map((n) => {
            const isTrig = triggers.includes(n.id);
            return (
              <button
                key={n.id}
                onClick={() => toggleTrigger(n.id)}
                className={`text-[12px] px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                  isTrig
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-semibold"
                    : "bg-white dark:bg-[#181B22] border-[#E5E7EB] dark:border-[#27272A] text-[#475569] dark:text-[#A1A1AA] hover:text-[#111827] dark:hover:text-[#FAFAFA] hover:bg-[#F7F8FA] dark:hover:bg-[#20242D]"
                }`}
              >
                {n.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cascade Event Log (T+0 to T+{t}, newest first) */}
      {result && Array.isArray(result.events) && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[12px] uppercase tracking-wider text-[#94A3B8] dark:text-[#71717A] font-semibold">
              3. Cascade Event Log (T+0 to T+{t}h — {result.events.filter((e) => e.t <= t).length} events)
            </h3>
            <span className="text-[11px] text-[#94A3B8] dark:text-[#71717A]">Newest first</span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 bg-[#F7F8FA] dark:bg-[#111318] p-3 rounded-lg border border-[#E5E7EB] dark:border-[#27272A]">
            {result.events.filter((e) => e.t <= t).length === 0 ? (
              <div className="text-[12px] text-[#94A3B8] dark:text-[#71717A] text-center py-2">
                No events recorded up to T+{t}h
              </div>
            ) : (
              [...result.events.filter((e) => e.t <= t)].reverse().map((e, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-[12px] py-1 px-2 rounded-md bg-white dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] hover:border-[#CBD5E1] dark:hover:border-[#3F3F46] transition-colors"
                >
                  <span className="text-[#2563EB] dark:text-[#3B82F6] shrink-0 font-semibold tabular-nums">
                    T+{String(e.t).padStart(2, "0")}h
                  </span>
                  <span
                    className={`text-[10px] uppercase px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                      e.kind === "trigger"
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                        : e.kind === "cascade"
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    }`}
                  >
                    {e.kind}
                  </span>
                  <span className="text-[#475569] dark:text-[#A1A1AA]">{e.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
