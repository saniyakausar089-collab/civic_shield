import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "@/store/appStore";
import { CityScene } from "@/components/scene/CityScene";
import { CesiumMap } from "@/components/scene/CesiumMap";
import { TopBar } from "@/components/hud/TopBar";
import { CompactTimelineBar } from "@/components/hud/CompactTimelineBar";
import { LeftScenarioPanel } from "@/components/panels/LeftScenarioPanel";
import { RightImpactInspector } from "@/components/panels/RightImpactInspector";
import { ResizableAnalysisDrawer } from "@/components/panels/ResizableAnalysisDrawer";
import { MapLegendOverlay } from "@/components/hud/MapLegendOverlay";
import { LandingView } from "@/components/landing/LandingView";
import {
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Compass,
  Globe,
  Box,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const view = useAppStore((s) => s.view);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const viewportMode = useAppStore((s) => s.viewportMode);
  const setStore = useAppStore((s) => s.set);

  const [mounted, setMounted] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [showLeftPanel, setShowLeftPanel] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (view === "landing") {
    return <LandingView />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#101418] select-none flex flex-col font-sans">
      {/* 1. Engineering Top Bar */}
      <TopBar />

      {/* 2. Main Middle Workspace: Left Panel + GIS 3D Viewport + Right Inspector */}
      <div className="flex-1 relative flex flex-row overflow-hidden min-h-0">
        {/* Collapsible Left Scenario Control Panel */}
        {showLeftPanel && <LeftScenarioPanel />}

        {/* Central GIS Viewport Container */}
        <div className="flex-1 relative h-full min-w-0 bg-[#101418]">
          {/* 3D GIS Canvas (CesiumJS 3D Globe with Asset 4854512 or ThreeJS Synthetic Twin) */}
          {mounted ? (
            viewportMode === "cesium" ? (
              <CesiumMap resetSignal={resetSignal} />
            ) : (
              <CityScene resetSignal={resetSignal} />
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-[#9BAA76] font-mono text-xs">
              <div className="w-6 h-6 border-2 border-[#9BAA76] border-t-transparent rounded-full animate-spin" />
              <span>Loading Geospatial Infrastructure Scene...</span>
            </div>
          )}

          {/* Floating Map Utility Controls */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
            {/* Toggle Left Scenario Panel */}
            <button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className="p-2 rounded bg-[#191F24]/90 backdrop-blur-md border border-[#303941] text-[#e5e9ec] hover:bg-[#242c33] transition-colors shadow"
              title={showLeftPanel ? "Hide Scenario Panel" : "Show Scenario Panel"}
            >
              {showLeftPanel ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            {/* Viewport Engine Switcher: Cesium 3D Tiles vs Three.js */}
            <div className="flex items-center bg-[#191F24]/90 backdrop-blur-md border border-[#303941] rounded p-0.5 shadow">
              <button
                onClick={() => setStore({ viewportMode: "cesium" })}
                className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
                  viewportMode === "cesium"
                    ? "bg-[#2c363f] text-[#38bdf8] font-medium"
                    : "text-[#8a96a1] hover:text-[#d2d8de]"
                }`}
                title="Cesium 3D Globe + 3D Tileset (Asset #4854512)"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Cesium 3D</span>
              </button>
              <button
                onClick={() => setStore({ viewportMode: "three" })}
                className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
                  viewportMode === "three"
                    ? "bg-[#2c363f] text-[#9BAA76] font-medium"
                    : "text-[#8a96a1] hover:text-[#d2d8de]"
                }`}
                title="Three.js Extruded Topographic Twin"
              >
                <Box className="w-3.5 h-3.5" />
                <span>Synthetic Twin</span>
              </button>
            </div>

            {/* Reset Camera View Button */}
            <button
              onClick={() => setResetSignal((s) => s + 1)}
              className="p-2 rounded bg-[#191F24]/90 backdrop-blur-md border border-[#303941] text-[#e5e9ec] hover:bg-[#242c33] transition-colors shadow flex items-center gap-1.5 text-xs font-mono"
              title="Reset GIS Camera View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset View</span>
            </button>
          </div>

          {/* Map Compass & North Indicator */}
          <div className="absolute top-3 right-3 z-10 bg-[#191F24]/90 backdrop-blur-md border border-[#303941] px-2.5 py-1 rounded flex items-center gap-1.5 text-[11px] font-mono text-[#8a96a1]">
            <Compass className="w-3.5 h-3.5 text-[#9BAA76]" />
            <span>NORTH ↑</span>
          </div>

          {/* Map Legend Overlay */}
          <MapLegendOverlay />
        </div>

        {/* Collapsible Right Impact Inspector (appears when an asset is selected) */}
        {selectedNodeId && <RightImpactInspector />}
      </div>

      {/* 3. Compact Simulation Timeline */}
      <CompactTimelineBar />

      {/* 4. Bottom Resizable & Collapsible Analysis Drawer */}
      <ResizableAnalysisDrawer />
    </div>
  );
}
