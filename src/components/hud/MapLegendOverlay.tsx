import React, { useState } from "react";
import { Sparkles, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { STYLE_LEGEND_CONFIGS } from "../scene/cesiumStyles";

export const MapLegendOverlay: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const viewportMode = useAppStore((s) => s.viewportMode);
  const cesiumBuildingStyle = useAppStore((s) => s.cesiumBuildingStyle);
  const layers = useAppStore((s) => s.layers);
  const toggleLayer = useAppStore((s) => s.toggleLayer);

  const activeCesiumLegend =
    viewportMode === "cesium" && cesiumBuildingStyle !== "none"
      ? STYLE_LEGEND_CONFIGS[cesiumBuildingStyle]
      : null;

  if (collapsed) {
    return (
      <button
        data-testid="gis-legend-collapsed-btn"
        onClick={() => setCollapsed(false)}
        className="absolute bottom-3 left-3 z-10 bg-[#191F24]/90 hover:bg-[#20282f] backdrop-blur-md border border-[#303941] rounded px-2.5 py-1.5 text-[11px] text-[#e5e9ec] select-none pointer-events-auto shadow-lg flex items-center gap-2 transition-colors font-mono"
        title="Click to expand GIS Legend"
      >
        <Layers className="w-3.5 h-3.5 text-[#9BAA76]" />
        <span className="font-semibold text-[10px] uppercase tracking-wider text-[#8a96a1]">
          GIS Legend
        </span>
        <ChevronUp className="w-3.5 h-3.5 text-[#8a96a1]" />
      </button>
    );
  }

  return (
    <div
      data-testid="gis-legend-expanded"
      className="absolute bottom-3 left-3 z-10 bg-[#191F24]/90 backdrop-blur-md border border-[#303941] rounded p-2.5 text-[11px] text-[#e5e9ec] select-none pointer-events-auto shadow-lg max-w-xs space-y-2"
    >
      {/* Legend Title */}
      <div className="flex items-center justify-between border-b border-[#303941] pb-1 gap-2">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#9BAA76]" />
          <span className="font-semibold text-[10px] uppercase font-mono tracking-wider text-[#8a96a1]">
            GIS Legend
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-[#9BAA76]">
            {viewportMode === "cesium" ? "Cesium 3D" : "Twin"}
          </span>
          <button
            data-testid="gis-legend-collapse-btn"
            onClick={() => setCollapsed(true)}
            className="p-0.5 hover:bg-[#252e35] rounded text-[#8a96a1] hover:text-[#e5e9ec] transition-colors"
            title="Collapse GIS Legend"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dynamic 3D Tiles Legend (when Cesium is active) */}
      {activeCesiumLegend && (
        <div className="space-y-1.5 pb-2 border-b border-[#303941]">
          <div className="flex items-center gap-1.5 text-[9px] uppercase font-mono text-[#38bdf8]">
            <Sparkles className="w-3 h-3" />
            <span>3D Tiles: {activeCesiumLegend.title}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
            {activeCesiumLegend.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0 border border-white/20"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-[#d2d8de]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Infrastructure Asset Status */}
      <div className="space-y-1">
        <div className="text-[9px] uppercase font-mono text-[#8a96a1]">Asset Status</div>
        <div className="grid grid-cols-3 gap-1 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#5c7356] border border-[#7a9a7a]" />
            <span className="text-[#8fae70]">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#e09f3e] border border-[#f6be73]" />
            <span className="text-[#e09f3e]">Degraded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#d9534f] border border-[#ff8f8f]" />
            <span className="text-[#ff8f8f]">Failed</span>
          </div>
        </div>
      </div>

      {/* Utility Network Lines (Interactive Toggles) */}
      <div className="space-y-1 pt-1 border-t border-[#303941]">
        <div className="flex items-center justify-between text-[9px] uppercase font-mono text-[#8a96a1]">
          <span>Utility Networks</span>
          <span className="text-[8px] text-[#616e79]">(click to toggle)</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => toggleLayer("power")}
            className={`flex items-center gap-1.5 p-1 rounded hover:bg-[#242c33] transition-colors text-left ${
              layers.power ? "opacity-100" : "opacity-40"
            }`}
            title={layers.power ? "Click to hide Power Grid" : "Click to show Power Grid"}
          >
            <div className="w-3 h-0.5 bg-[#f5b942]" />
            <span className={layers.power ? "text-[#e5e9ec]" : "text-[#8a96a1] line-through"}>
              Power Grid
            </span>
          </button>
          <button
            type="button"
            onClick={() => toggleLayer("water")}
            className={`flex items-center gap-1.5 p-1 rounded hover:bg-[#242c33] transition-colors text-left ${
              layers.water ? "opacity-100" : "opacity-40"
            }`}
            title={layers.water ? "Click to hide Water Mains" : "Click to show Water Mains"}
          >
            <div className="w-3 h-0.5 bg-[#4fb3e8]" />
            <span className={layers.water ? "text-[#e5e9ec]" : "text-[#8a96a1] line-through"}>
              Water Mains
            </span>
          </button>
          <button
            type="button"
            onClick={() => toggleLayer("roads")}
            className={`flex items-center gap-1.5 p-1 rounded hover:bg-[#242c33] transition-colors text-left ${
              layers.roads ? "opacity-100" : "opacity-40"
            }`}
            title={layers.roads ? "Click to hide Transport Routes" : "Click to show Transport Routes"}
          >
            <div className="w-3 h-0.5 bg-[#e5e7eb]" />
            <span className={layers.roads ? "text-[#e5e9ec]" : "text-[#8a96a1] line-through"}>
              Transport Route
            </span>
          </button>
          <button
            type="button"
            onClick={() => toggleLayer("telecom")}
            className={`flex items-center gap-1.5 p-1 rounded hover:bg-[#242c33] transition-colors text-left ${
              layers.telecom ? "opacity-100" : "opacity-40"
            }`}
            title={layers.telecom ? "Click to hide Telecom Links" : "Click to show Telecom Links"}
          >
            <div className="w-3 h-0.5 bg-[#9aa7b8]" />
            <span className={layers.telecom ? "text-[#e5e9ec]" : "text-[#8a96a1] line-through"}>
              Telecom Link
            </span>
          </button>
        </div>
      </div>

      {/* Ground Truth Label */}
      <div className="text-[9px] text-[#616e79] pt-1 border-t border-[#303941] leading-tight">
        Synthetic interdependent utility network over metric 3D geospatial terrain.
      </div>
    </div>
  );
};
