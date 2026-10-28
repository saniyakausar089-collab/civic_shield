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
} from "lucide-react";

export const LeftScenarioPanel: React.FC = () => {
  const presetId = useAppStore((s) => s.presetId);
  const triggers = useAppStore((s) => s.triggers);
  const layers = useAppStore((s) => s.layers);
  const cityMods = useAppStore((s) => s.cityMods);
  const playing = useAppStore((s) => s.playing);
  const scenariosData = useAppStore((s) => s.scenariosData);
  const setScenariosData = useAppStore((s) => s.setScenariosData);
  const previewScenario = useAppStore((s) => s.previewScenario);
  const resetAllLayers = useAppStore((s) => s.resetAllLayers);
  const toggleTrigger = useAppStore((s) => s.toggleTrigger);
  const toggleLayer = useAppStore((s) => s.toggleLayer);
  const togglePlay = useAppStore((s) => s.togglePlay);
  const setHour = useAppStore((s) => s.setHour);

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
    <div className="w-80 h-full flex flex-col bg-[#191F24] border-r border-[#303941] text-[#e5e9ec] select-none text-xs">
      {/* Header */}
      <div className="p-3 border-b border-[#303941] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#9BAA76]" />
          <span className="font-semibold text-sm tracking-wide text-[#f1f4f6]">
            Scenario Control
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#242c33] text-[#8a96a1] border border-[#303941]">
          GIS ENGINE
        </span>
      </div>

      {/* Main Controls Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* 1. Simulation Actions */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#8a96a1]">
            Simulation State
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={togglePlay}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded font-medium transition-colors ${
                playing
                  ? "bg-[#e09f3e] text-[#101418] hover:bg-[#c78024]"
                  : "bg-[#9BAA76] text-[#101418] hover:bg-[#8fa06b]"
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${playing ? "fill-current" : ""}`} />
              <span>{playing ? "Pause" : "Run Sim"}</span>
            </button>
            <button
              onClick={() => {
                resetAllLayers();
                setHour(0);
                if (playing) togglePlay();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-[#242c33] border border-[#303941] hover:bg-[#2c363f] text-[#d2d8de] transition-colors"
              title="Reset simulation and clear active failure pulses"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset T+0</span>
            </button>
          </div>
        </div>

        {/* 2. Failure Scenarios wired to scenarios.json */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#8a96a1]">
            Failure Scenario Presets
          </div>
          <div className="space-y-1">
            {scenariosList.map((s) => {
              const isActive = isScenarioActive(s);
              return (
                <button
                  key={s.id}
                  onClick={() => previewScenario(s)}
                  className={`w-full text-left p-2 rounded border transition-colors flex flex-col gap-0.5 ${
                    isActive
                      ? "bg-[#252e35] border-[#9BAA76] text-[#f1f4f6]"
                      : "bg-[#1c242a] border-[#303941] text-[#8a96a1] hover:bg-[#222a31] hover:text-[#d2d8de]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#e5e9ec]">
                      {s.name || s.label}
                    </span>
                    <span className="text-[9px] font-mono px-1 rounded bg-[#2c363f] text-[#8a96a1]">
                      {s.triggers.length} {s.triggers.length === 1 ? "node" : "nodes"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8a96a1] line-clamp-1">
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
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#8a96a1]">
              Target Failures ({triggers.length})
            </span>
            <button
              onClick={() => resetAllLayers()}
              className="text-[10px] text-[#9BAA76] hover:underline"
            >
              Reset default
            </button>
          </div>
          <div className="max-h-44 overflow-y-auto space-y-1 p-1.5 bg-[#14191d] rounded border border-[#303941]">
            {city.nodes.map((n) => {
              const isTrigger = triggers.includes(n.id);
              return (
                <div
                  key={n.id}
                  onClick={() => toggleTrigger(n.id)}
                  className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors text-[11px] ${
                    isTrigger
                      ? "bg-[#401c1c] text-[#ff8f8f] border border-[#d9534f]/50"
                      : "hover:bg-[#1f262d] text-[#8a96a1]"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {isTrigger ? (
                      <CheckSquare className="w-3.5 h-3.5 text-[#d9534f] shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-[#404c56] shrink-0" />
                    )}
                    <span className="truncate">{n.name}</span>
                  </div>
                  <span className="text-[9px] font-mono shrink-0 ml-1 uppercase">{n.kind.slice(0, 4)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. GIS Network Layers */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#8a96a1]">
            GIS Overlay Layers
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { key: "power", label: "Power Network", color: "#f5b942" },
                { key: "water", label: "Water Distribution", color: "#4fb3e8" },
                { key: "roads", label: "Roadways & Bridges", color: "#e5e7eb" },
                { key: "telecom", label: "Telecom Links", color: "#9aa7b8" },
                { key: "hospitals", label: "Critical Facilities", color: "#c76a75" },
              ] as const
            ).map((l) => (
              <button
                key={l.key}
                onClick={() => toggleLayer(l.key)}
                className={`p-1.5 rounded border text-left flex items-center justify-between text-[11px] transition-colors ${
                  layers[l.key]
                    ? "bg-[#222a31] border-[#303941] text-[#e5e9ec]"
                    : "bg-[#14191d] border-[#242c33] text-[#616e79] opacity-60"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                  <span className="truncate">{l.label}</span>
                </div>
                <span className="text-[9px] font-mono shrink-0">
                  {layers[l.key] ? "ON" : "OFF"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#303941] bg-[#14191d] text-[10px] text-[#8a96a1] space-y-1">
        <div className="flex justify-between">
          <span>Active Testbed:</span>
          <span className="text-[#e5e9ec] font-mono">HYD-METRO-01</span>
        </div>
        <div className="flex justify-between">
          <span>Asset Grid:</span>
          <span className="text-[#9BAA76] font-mono">26 Critical Nodes</span>
        </div>
      </div>
    </div>
  );
};
