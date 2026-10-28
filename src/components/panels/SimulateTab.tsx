import React, { useEffect } from "react";
import { PRESETS } from "@/engine/plans";
import { BASE_CITY } from "@/engine/city";
import { applyMods } from "@/engine/analysis";
import { useAppStore } from "@/store/appStore";
import { Flame, Droplets, Zap, Shield, Globe, Layers } from "lucide-react";

export const SimulateTab: React.FC = () => {
  const presetId = useAppStore((s) => s.presetId);
  const triggers = useAppStore((s) => s.triggers);
  const cityMods = useAppStore((s) => s.cityMods);
  const scenariosData = useAppStore((s) => s.scenariosData);
  const setScenariosData = useAppStore((s) => s.setScenariosData);
  const previewScenario = useAppStore((s) => s.previewScenario);
  const toggleTrigger = useAppStore((s) => s.toggleTrigger);

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
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case "monsoon":
      case "monsoon_flood":
        return <Globe className="w-4 h-4 text-blue-400" />;
      case "heatwave":
      case "heatwave_overload":
        return <Flame className="w-4 h-4 text-orange-400" />;
      case "cyber":
      case "cyberattack":
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case "quake":
      case "earthquake":
        return <Shield className="w-4 h-4 text-red-400" />;
      default:
        return <Layers className="w-4 h-4 text-cyan-400" />;
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
    <div className="space-y-6">
      {/* Disaster Presets */}
      <div>
        <h3 className="text-xs uppercase font-mono tracking-wider text-muted-foreground mb-3">
          1. Select Disaster Scenario
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {scenariosList.map((s) => {
            const isActive = isScenarioActive(s);
            const triggerNodes = s.triggers.map((t: any) => t.node || t);
            return (
              <button
                key={s.id}
                onClick={() => previewScenario(s)}
                className={`flex flex-col text-left p-3 rounded border transition-all ${
                  isActive
                    ? "bg-[#252e35] border-[#9BAA76] shadow-sm"
                    : "bg-[#191F24] hover:bg-[#222a31] border-[#303941]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {getPresetIcon(s.id)}
                    <span className="font-semibold text-sm text-[#e5e9ec]">
                      {s.name || s.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#242c33] text-[#8a96a1]">
                    {triggerNodes.length} {triggerNodes.length === 1 ? "trigger" : "triggers"}
                  </span>
                </div>
                <p className="text-xs text-[#8a96a1] line-clamp-2">
                  {s.summary || s.blurb}
                </p>
                <div className="mt-2 text-[10px] font-mono text-[#9BAA76] truncate">
                  Nodes: {triggerNodes.join(", ")}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Triggers Picker */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
            2. Or Break Any Individual Node ({triggers.length} currently failed at T+0)
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-muted/20 rounded-xl border border-border">
          {city.nodes.map((n) => {
            const isTrig = triggers.includes(n.id);
            return (
              <button
                key={n.id}
                onClick={() => toggleTrigger(n.id)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-colors ${
                  isTrig
                    ? "bg-red-500/20 border-red-500 text-red-300 font-bold"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {n.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
