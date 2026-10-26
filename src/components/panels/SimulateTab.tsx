import React from "react";
import { PRESETS } from "@/engine/plans";
import { BASE_CITY } from "@/engine/city";
import { applyMods } from "@/engine/analysis";
import { useAppStore } from "@/store/appStore";
import { Flame, Droplets, Zap, Shield, Globe, Layers } from "lucide-react";

export const SimulateTab: React.FC = () => {
  const presetId = useAppStore((s) => s.presetId);
  const triggers = useAppStore((s) => s.triggers);
  const layers = useAppStore((s) => s.layers);
  const cityMods = useAppStore((s) => s.cityMods);
  const setPreset = useAppStore((s) => s.setPreset);
  const toggleTrigger = useAppStore((s) => s.toggleTrigger);
  const toggleLayer = useAppStore((s) => s.toggleLayer);

  const city = applyMods(BASE_CITY, cityMods);

  const getPresetIcon = (id: string) => {
    switch (id) {
      case "pipeline":
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case "monsoon":
        return <Globe className="w-4 h-4 text-blue-400" />;
      case "heatwave":
        return <Flame className="w-4 h-4 text-orange-400" />;
      case "cyber":
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case "quake":
        return <Shield className="w-4 h-4 text-red-400" />;
      default:
        return <Layers className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Disaster Presets */}
      <div>
        <h3 className="text-xs uppercase font-mono tracking-wider text-muted-foreground mb-3">
          1. Select Disaster Scenario
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {PRESETS.map((p) => {
            const isActive = presetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPreset(p.id, p.triggers)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                  isActive
                    ? "bg-cyan-950/30 border-cyan-500/60 shadow-md shadow-cyan-950/20"
                    : "bg-card hover:bg-muted/50 border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {getPresetIcon(p.id)}
                    <span className="font-semibold text-sm text-foreground">{p.label}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {p.triggers.length} {p.triggers.length === 1 ? "trigger" : "triggers"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{p.blurb}</p>
                <div className="mt-2 text-[10px] font-mono text-cyan-400/80 truncate">
                  Nodes: {p.triggers.join(", ")}
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

      {/* Layer Visibility Toggles */}
      <div>
        <h3 className="text-xs uppercase font-mono tracking-wider text-muted-foreground mb-3">
          3. System Layers
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(
            [
              { key: "power", label: "Power Grid", color: "text-amber-400" },
              { key: "water", label: "Water Works", color: "text-cyan-400" },
              { key: "roads", label: "Transportation", color: "text-slate-300" },
              { key: "telecom", label: "Telecom", color: "text-violet-400" },
              { key: "hospitals", label: "Hospitals", color: "text-pink-400" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => toggleLayer(item.key)}
              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors ${
                layers[item.key]
                  ? "bg-card border-border text-foreground"
                  : "bg-muted/20 border-border/40 text-muted-foreground opacity-60"
              }`}
            >
              <span className={item.color}>{item.label}</span>
              <span className="text-[10px] font-mono">
                {layers[item.key] ? "ON" : "OFF"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
