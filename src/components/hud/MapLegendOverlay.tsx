import React, { useState } from "react";
import { Layers, ChevronDown, ChevronUp } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { STYLE_LEGEND_CONFIGS } from "../scene/cesiumLegendConfigs";

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
        className="absolute bottom-3 left-3 z-10 bg-white/95 dark:bg-[#111318]/95 hover:bg-[#F7F8FA] dark:hover:bg-[#181B22] backdrop-blur-md border border-[#E5E7EB] dark:border-[#27272A] rounded-lg px-3 py-1.5 text-[12px] text-[#111827] dark:text-[#FAFAFA] select-none pointer-events-auto shadow-xs flex items-center gap-2 transition-colors cursor-pointer font-sans"
        title="Click to expand GIS Legend"
      >
        <Layers className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
        <span className="font-semibold text-[11px] uppercase tracking-wider text-[#94A3B8] dark:text-[#71717A]">
          GIS Legend
        </span>
        <ChevronUp className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#71717A]" />
      </button>
    );
  }

  return (
    <div
      data-testid="gis-legend-expanded"
      className="absolute bottom-3 left-3 z-10 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md border border-[#E5E7EB] dark:border-[#27272A] rounded-lg p-3 text-[12px] text-[#111827] dark:text-[#FAFAFA] select-none pointer-events-auto shadow-md max-w-xs space-y-2.5 font-sans"
    >
      {/* Legend Title */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#27272A] pb-2 gap-2">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
          <span className="font-semibold text-[11px] uppercase tracking-wider text-[#94A3B8] dark:text-[#71717A]">
            GIS Legend
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#2563EB] dark:text-[#3B82F6] font-medium">
            {viewportMode === "cesium" ? "Cesium 3D" : "Twin"}
          </span>
          <button
            data-testid="gis-legend-collapse-btn"
            onClick={() => setCollapsed(true)}
            className="p-0.5 hover:bg-[#F7F8FA] dark:hover:bg-[#181B22] rounded text-[#94A3B8] dark:text-[#71717A] hover:text-[#111827] dark:hover:text-[#FAFAFA] transition-colors cursor-pointer"
            title="Collapse GIS Legend"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Network Layers */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase font-semibold text-[#94A3B8] dark:text-[#71717A]">
          Network Lifelines
        </div>
        <div className="grid grid-cols-2 gap-1 text-[11px]">
          {[
            { label: "Power", color: "#d4a359", key: "power" },
            { label: "Water", color: "#2563EB", key: "water" },
            { label: "Roads", color: "#94A3B8", key: "roads" },
            { label: "Telecom", color: "#8b5cf6", key: "telecom" },
            { label: "Hospitals", color: "#e11d48", key: "hospitals" },
          ].map((l) => (
            <button
              key={l.key}
              onClick={() => toggleLayer(l.key as any)}
              className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-[#F7F8FA] dark:hover:bg-[#181B22] transition-colors text-left cursor-pointer"
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: layers[l.key as keyof typeof layers]
                    ? l.color
                    : "#71717A",
                }}
              />
              <span
                className={
                  layers[l.key as keyof typeof layers]
                    ? "text-[#111827] dark:text-[#FAFAFA] font-medium"
                    : "text-[#94A3B8] dark:text-[#71717A]"
                }
              >
                {l.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Cesium 3D Tile Thematic Legend */}
      {activeCesiumLegend && (
        <div className="space-y-1.5 border-t border-[#E5E7EB] dark:border-[#27272A] pt-2">
          <div className="text-[10px] uppercase font-semibold text-[#94A3B8] dark:text-[#71717A] flex items-center justify-between">
            <span>{activeCesiumLegend.title}</span>
          </div>
          <div className="space-y-1 text-[11px]">
            {activeCesiumLegend.items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className="w-3 h-2 rounded-xs shrink-0"
                  style={{ backgroundColor: it.color }}
                />
                <span className="text-[#475569] dark:text-[#A1A1AA]">{it.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Node Status Legend */}
      <div className="space-y-1 border-t border-[#E5E7EB] dark:border-[#27272A] pt-2 text-[10px]">
        <div className="font-semibold text-[#94A3B8] dark:text-[#71717A] uppercase">Node Status</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[#475569] dark:text-[#A1A1AA]">Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[#475569] dark:text-[#A1A1AA]">Stressed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[#475569] dark:text-[#A1A1AA]">Failed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
