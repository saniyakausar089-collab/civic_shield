import React from "react";
import { Info, Layers, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { STYLE_LEGEND_CONFIGS } from "../scene/cesiumStyles";

export const MapLegendOverlay: React.FC = () => {
  const viewportMode = useAppStore((s) => s.viewportMode);
  const cesiumBuildingStyle = useAppStore((s) => s.cesiumBuildingStyle);

  const activeCesiumLegend =
    viewportMode === "cesium" && cesiumBuildingStyle !== "none"
      ? STYLE_LEGEND_CONFIGS[cesiumBuildingStyle]
      : null;

  return (
    <div className="absolute bottom-3 left-3 z-10 bg-[#191F24]/90 backdrop-blur-md border border-[#303941] rounded p-2.5 text-[11px] text-[#e5e9ec] select-none pointer-events-auto shadow-lg max-w-xs space-y-2">
      {/* Legend Title */}
      <div className="flex items-center justify-between border-b border-[#303941] pb-1">
        <span className="font-semibold text-[10px] uppercase font-mono tracking-wider text-[#8a96a1]">
          GIS Network Legend
        </span>
        <span className="text-[9px] font-mono text-[#9BAA76]">
          {viewportMode === "cesium" ? "Cesium 3D Globe" : "Synthetic Twin"}
        </span>
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

      {/* Utility Network Lines */}
      <div className="space-y-1 pt-1 border-t border-[#303941]">
        <div className="text-[9px] uppercase font-mono text-[#8a96a1]">Utility Networks</div>
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#d4a359]" />
            <span>Power Grid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#5c8ca3]" />
            <span>Water Mains</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#6f7881]" />
            <span>Transport Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#837d99]" />
            <span>Telecom Link</span>
          </div>
        </div>
      </div>

      {/* Ground Truth Label */}
      <div className="text-[9px] text-[#616e79] pt-1 border-t border-[#303941] leading-tight">
        Synthetic interdependent utility network over metric 3D geospatial terrain.
      </div>
    </div>
  );
};
