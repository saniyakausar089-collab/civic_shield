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
    <div className="w-80 h-full flex flex-col bg-[var(--surface)] border-r border-[var(--border)] text-[var(--text)] select-none text-xs font-sans shadow-xs transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[var(--accent)]" />
          <span className="font-semibold text-sm tracking-tight text-[var(--text)]">
            Scenario Control
          </span>
        </div>
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-tertiary)] border border-[var(--border)]">
          GIS Engine
        </span>
      </div>

      {/* Main Controls Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* 1. Simulation Actions */}
        <div className="space-y-2">
          <div className="apple-eyebrow">
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
              className="apple-btn-primary py-2 px-3 text-xs w-full shadow-xs active:scale-[0.98]"
            >
              {playing ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{playing ? "Pause" : "Run Sim"}</span>
            </button>
            <button
              onClick={() => resetSim()}
              className="apple-btn-secondary py-2 px-3 text-xs w-full active:scale-[0.98]"
              title="Reset simulation and return all nodes to normal (Reset T+0)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <span>Reset T+0</span>
            </button>
          </div>
        </div>

        <div className="h-px bg-[var(--border)]" />

        {/* 2. Failure Scenarios wired to scenarios.json */}
        <div className="space-y-2">
          <div className="apple-eyebrow">
            Failure Scenario Presets
          </div>
          <div className="space-y-2">
            {scenariosList.map((s) => {
              const isActive = isScenarioActive(s);
              return (
                <button
                  key={s.id}
                  onClick={() => selectScenario(s)}
                  className={`w-full text-left p-3 rounded-[16px] border transition-all duration-200 cursor-pointer flex flex-col gap-1.5 ${
                    isActive
                      ? "bg-[var(--accent-tint)] border-[var(--accent)] text-[var(--text)] shadow-xs"
                      : "bg-[var(--surface)] hover:bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)] hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[var(--text)]">
                      {s.name || s.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-tertiary)] font-medium">
                      {s.triggers.length} {s.triggers.length === 1 ? "node" : "nodes"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 leading-normal">
                    {s.summary || s.blurb}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-[var(--border)]" />

        {/* 3. Target Asset Trigger Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="apple-eyebrow">
              Target Failures ({triggers.length})
            </span>
            <button
              onClick={() => resetAllLayers()}
              className="apple-link text-[11px]"
            >
              Reset default
            </button>
          </div>
          <div className="max-h-44 overflow-y-auto space-y-1 p-2 bg-[var(--surface-2)] rounded-[16px] border border-[var(--border)]">
            {city.nodes.map((n) => {
              const isTrigger = triggers.includes(n.id);
              return (
                <div
                  key={n.id}
                  onClick={() => toggleTrigger(n.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-full cursor-pointer transition-colors text-[11px] ${
                    isTrigger
                      ? "bg-rose-500/10 text-[var(--status-danger)] font-medium"
                      : "hover:bg-[var(--surface)] text-[var(--text-secondary)]"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isTrigger ? (
                      <CheckSquare className="w-3.5 h-3.5 text-[var(--status-danger)] shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
                    )}
                    <span className="truncate">{n.name}</span>
                  </div>
                  <span className="text-[10px] text-[var(--text-tertiary)] shrink-0 ml-1 uppercase">{n.kind.slice(0, 4)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-[var(--border)]" />

        {/* 4. GIS Network Layers */}
        <div className="space-y-2">
          <div className="apple-eyebrow">
            GIS Overlay Layers
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { key: "power", label: "Power Network", color: "#ff9f0a" },
                { key: "water", label: "Water Distribution", color: "#0071e3" },
                { key: "roads", label: "Roadways & Bridges", color: "#6e6e73" },
                { key: "telecom", label: "Telecom Links", color: "#86868b" },
                { key: "hospitals", label: "Critical Facilities", color: "#ff453a" },
              ] as const
            ).map((l) => (
              <button
                key={l.key}
                onClick={() => toggleLayer(l.key)}
                className={`p-2 rounded-full border text-left flex items-center justify-between text-[11px] transition-colors cursor-pointer ${
                  layers[l.key]
                    ? "bg-[var(--surface-2)] border-[var(--accent)] text-[var(--text)] font-medium"
                    : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-tertiary)]"
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

      {/* Footer Info (Google style tiny muted footer) */}
      <div className="p-3.5 border-t border-[var(--border)] bg-[var(--surface-2)] text-[11px] text-[var(--text-tertiary)] space-y-1">
        <div className="flex justify-between">
          <span>Active Testbed:</span>
          <span className="text-[var(--text)] font-medium">HYD-METRO-01</span>
        </div>
        <div className="flex justify-between">
          <span>Asset Grid:</span>
          <span className="text-[var(--accent)] font-medium">26 Critical Nodes</span>
        </div>
      </div>
    </div>
  );
};
