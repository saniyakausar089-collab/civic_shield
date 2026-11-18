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
        className="absolute bottom-3 left-3 z-10 bg-[var(--glass-bg)] hover:bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] rounded-full px-3.5 py-1.5 text-xs text-[var(--text)] select-none pointer-events-auto shadow-[var(--shadow-soft)] flex items-center gap-2 transition-all cursor-pointer font-sans"
        title="Click to expand GIS Legend"
      >
        <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span className="font-semibold text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">
          GIS Legend
        </span>
        <ChevronUp className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
      </button>
    );
  }

  return (
    <div
      data-testid="gis-legend-expanded"
      className="absolute bottom-3 left-3 z-10 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[12px] p-3.5 text-xs text-[var(--text-primary)] select-none pointer-events-auto shadow-[var(--shadow-floating)] max-w-xs space-y-3 font-sans"
    >
      {/* Legend Title */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 gap-2">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <span className="font-semibold text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">
            GIS Legend
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-tertiary)] font-medium">
            {viewportMode === "cesium" ? "Cesium 3D" : "Twin"}
          </span>
          <button
            data-testid="gis-legend-collapse-btn"
            onClick={() => setCollapsed(true)}
            className="p-1 hover:bg-[var(--surface-2)] rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Collapse GIS Legend"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Network Layers */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase font-semibold text-[var(--text-tertiary)] tracking-wider">
          Network Lifelines
        </div>
        <div className="grid grid-cols-2 gap-1 text-[11px]">
          {[
            { label: "Power", color: "#C9B27A", key: "power" },
            { label: "Water", color: "#6FA8B8", key: "water" },
            { label: "Roads", color: "#BFC3CB", key: "roads" },
            { label: "Telecom", color: "#8A90A0", key: "telecom" },
            { label: "Hospitals", color: "var(--status-failed)", key: "hospitals" },
          ].map((l) => (
            <button
              key={l.key}
              onClick={() => toggleLayer(l.key as any)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-[var(--surface-2)] transition-colors text-left cursor-pointer"
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: layers[l.key as keyof typeof layers]
                    ? l.color
                    : "var(--text-tertiary)",
                }}
              />
              <span
                className={
                  layers[l.key as keyof typeof layers]
                    ? "text-[var(--text-primary)] font-medium"
                    : "text-[var(--text-tertiary)]"
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
        <div className="space-y-1.5 border-t border-[var(--border-subtle)] pt-2.5">
          <div className="text-[10px] uppercase font-semibold text-[var(--text-tertiary)] flex items-center justify-between tracking-wider">
            <span>{activeCesiumLegend.title}</span>
          </div>
          <div className="space-y-1 text-[11px]">
            {activeCesiumLegend.items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className="w-3 h-2 rounded-xs shrink-0"
                  style={{ backgroundColor: it.color }}
                />
                <span className="text-[var(--text-secondary)]">{it.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Node Status Legend */}
      <div className="space-y-1.5 border-t border-[var(--border-subtle)] pt-2.5 text-[10px]">
        <div className="font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Node Status</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--status-normal)]" />
            <span className="text-[var(--text-secondary)]">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--status-degraded)]" />
            <span className="text-[var(--text-secondary)]">Stressed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--status-failed)]" />
            <span className="text-[var(--text-secondary)]">Failed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
