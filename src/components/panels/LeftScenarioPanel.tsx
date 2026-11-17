import React, { useEffect } from "react";
import { PRESETS } from "@/engine/plans";
import { BASE_CITY } from "@/engine/city";
import { applyMods } from "@/engine/analysis";
import { useAppStore } from "@/store/appStore";
import {
  Play,
  RotateCcw,
  Sliders,
  CheckSquare,
  Square,
  Pause,
} from "lucide-react";

export const LeftScenarioPanel: React.FC = () => {
  const presetId = useAppStore((s) => s.presetId);
  const triggers = useAppStore((s) => s.triggers);
  const layers = useAppStore((s) => s.layers);
  const cityMods = useAppStore((s) => s.cityMods);
  const playing = useAppStore((s) => s.playing);
  const result = useAppStore((s) => s.result);
  const scenariosData = useAppStore((s) => s.scenariosData);
  const setScenariosData = useAppStore((s) => s.setScenariosData);
  const selectScenario = useAppStore((s) => s.selectScenario);
  const resetSim = useAppStore((s) => s.resetSim);
  const resetAllLayers = useAppStore((s) => s.resetAllLayers);
  const runSim = useAppStore((s) => s.runSim);
  const play = useAppStore((s) => s.play);
  const pause = useAppStore((s) => s.pause);
  const toggleTrigger = useAppStore((s) => s.toggleTrigger);
  const toggleLayer = useAppStore((s) => s.toggleLayer);

  // If scenariosData is not yet loaded, load scenarios.json
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

  // Build scenarios list from scenarios.json if available, or fallback to PRESETS
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
    <div className="w-80 h-full flex flex-col bg-white dark:bg-[#111318] border-r border-[#E5E7EB] dark:border-[#27272A] text-[#111827] dark:text-[#FAFAFA] select-none text-xs font-sans shadow-xs">
      {/* Header */}
      <div className="p-3.5 border-b border-[#E5E7EB] dark:border-[#27272A] bg-[#F7F8FA] dark:bg-[#181B22] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
          <span className="font-semibold text-sm tracking-tight text-[#111827] dark:text-[#FAFAFA]">
            Scenario Control
          </span>
        </div>
        <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-white dark:bg-[#111318] text-[#94A3B8] dark:text-[#71717A] border border-[#E5E7EB] dark:border-[#27272A]">
          GIS Engine
        </span>
      </div>

      {/* Main Controls Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* 1. Simulation Actions */}
        <div className="space-y-1.5">
          <div className="text-[11px] uppercase tracking-wider text-[#94A3B8] dark:text-[#71717A] font-medium">
            Simulation State
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (playing) {
                  pause();
                } else if (!result) {
                  runSim();
                } else {
                  play();
                }
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-180 cursor-pointer shadow-xs active:scale-[0.98] ${
                playing
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              }`}
            >
              {playing ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{playing ? "Pause" : "Run Sim"}</span>
            </button>
            <button
              onClick={() => resetSim()}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] hover:bg-[#F7F8FA] dark:hover:bg-[#20242D] text-[#475569] dark:text-[#A1A1AA] hover:text-[#111827] dark:hover:text-[#FAFAFA] font-medium transition-colors cursor-pointer"
              title="Reset simulation and return all nodes to normal (Reset T+0)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#71717A]" />
              <span>Reset T+0</span>
            </button>
          </div>
        </div>

        {/* 2. Failure Scenarios wired to scenarios.json */}
        <div className="space-y-1.5">
          <div className="text-[11px] uppercase tracking-wider text-[#94A3B8] dark:text-[#71717A] font-medium">
            Failure Scenario Presets
          </div>
          <div className="space-y-1.5">
            {scenariosList.map((s) => {
              const isActive = isScenarioActive(s);
              return (
                <button
                  key={s.id}
                  onClick={() => selectScenario(s)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col gap-1 ${
                    isActive
                      ? "bg-[#2563EB]/10 dark:bg-[#3B82F6]/15 border-[#2563EB] dark:border-[#3B82F6] text-[#111827] dark:text-[#FAFAFA] shadow-2xs"
                      : "bg-white dark:bg-[#181B22] border-[#E5E7EB] dark:border-[#27272A] text-[#475569] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#20242D]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#111827] dark:text-[#FAFAFA]">
                      {s.name || s.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F7F8FA] dark:bg-[#111318] border border-[#E5E7EB] dark:border-[#27272A] text-[#94A3B8] dark:text-[#71717A]">
                      {s.triggers.length} {s.triggers.length === 1 ? "node" : "nodes"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] dark:text-[#71717A] line-clamp-1 leading-normal">
                    {s.summary || s.blurb}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Target Asset Trigger Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] dark:text-[#71717A] font-medium">
              Target Failures ({triggers.length})
            </span>
            <button
              onClick={() => resetAllLayers()}
              className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] hover:underline cursor-pointer"
            >
              Reset default
            </button>
          </div>
          <div className="max-h-44 overflow-y-auto space-y-1 p-2 bg-[#F7F8FA] dark:bg-[#181B22] rounded-lg border border-[#E5E7EB] dark:border-[#27272A]">
            {city.nodes.map((n) => {
              const isTrigger = triggers.includes(n.id);
              return (
                <div
                  key={n.id}
                  onClick={() => toggleTrigger(n.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors text-[11px] ${
                    isTrigger
                      ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-semibold"
                      : "hover:bg-white dark:hover:bg-[#111318] text-[#475569] dark:text-[#A1A1AA]"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isTrigger ? (
                      <CheckSquare className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#71717A] shrink-0" />
                    )}
                    <span className="truncate">{n.name}</span>
                  </div>
                  <span className="text-[10px] text-[#94A3B8] dark:text-[#71717A] shrink-0 ml-1 uppercase">{n.kind.slice(0, 4)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. GIS Network Layers */}
        <div className="space-y-1.5">
          <div className="text-[11px] uppercase tracking-wider text-[#94A3B8] dark:text-[#71717A] font-medium">
            GIS Overlay Layers
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { key: "power", label: "Power Network", color: "#F59E0B" },
                { key: "water", label: "Water Distribution", color: "#0284C7" },
                { key: "roads", label: "Roadways & Bridges", color: "#64748B" },
                { key: "telecom", label: "Telecom Links", color: "#7C3AED" },
                { key: "hospitals", label: "Critical Facilities", color: "#DC2626" },
              ] as const
            ).map((l) => (
              <button
                key={l.key}
                onClick={() => toggleLayer(l.key)}
                className={`p-2 rounded-lg border text-left flex items-center justify-between text-[11px] transition-colors cursor-pointer ${
                  layers[l.key]
                    ? "bg-[#F7F8FA] dark:bg-[#181B22] border-[#2563EB]/40 dark:border-[#3B82F6]/40 text-[#111827] dark:text-[#FAFAFA] font-medium shadow-2xs"
                    : "bg-white dark:bg-[#111318] border-[#E5E7EB] dark:border-[#27272A] text-[#94A3B8] dark:text-[#71717A]"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                  <span className="truncate">{l.label}</span>
                </div>
                <span className="text-[9px] font-semibold shrink-0">
                  {layers[l.key] ? "ON" : "OFF"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#E5E7EB] dark:border-[#27272A] bg-[#F7F8FA] dark:bg-[#181B22] text-[11px] text-[#94A3B8] dark:text-[#71717A] space-y-1">
        <div className="flex justify-between">
          <span>Active Testbed:</span>
          <span className="text-[#111827] dark:text-[#FAFAFA] font-medium">HYD-METRO-01</span>
        </div>
        <div className="flex justify-between">
          <span>Asset Grid:</span>
          <span className="text-[#2563EB] dark:text-[#3B82F6] font-medium">26 Critical Nodes</span>
        </div>
      </div>
    </div>
  );
};
