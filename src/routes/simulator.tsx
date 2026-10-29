import React, { useState, useEffect, lazy, Suspense } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/appStore";
import { TopBar } from "@/components/hud/TopBar";
import { CompactTimelineBar } from "@/components/hud/CompactTimelineBar";
import { LeftScenarioPanel } from "@/components/panels/LeftScenarioPanel";
import { RightImpactInspector } from "@/components/panels/RightImpactInspector";
import { ResizableAnalysisDrawer } from "@/components/panels/ResizableAnalysisDrawer";
import { MapLegendOverlay } from "@/components/hud/MapLegendOverlay";
import {
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Compass,
  Globe,
  Box,
  GraduationCap,
} from "lucide-react";

import { CityScene } from "@/components/scene/CityScene";
import { CesiumMap } from "@/components/scene/CesiumMap";
import { MapAreaSearch } from "@/components/hud/MapAreaSearch";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { hasStoredSession } from "@/lib/supabase";

export const Route = createFileRoute("/simulator")({
  component: SimulatorPage,
});

export function SimulatorPage() {
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const viewportMode = useAppStore((s) => s.viewportMode);
  const resetAllLayers = useAppStore((s) => s.resetAllLayers);
  const showPlaceLabels = useAppStore((s) => s.showPlaceLabels);
  const togglePlaceLabels = useAppStore((s) => s.togglePlaceLabels);
  const inspectMode = useAppStore((s) => s.inspectMode);
  const toggleInspectMode = useAppStore((s) => s.toggleInspectMode);
  const setStore = useAppStore((s) => s.set);

  const [resetSignal, setResetSignal] = useState(0);
  const [showLeftPanel, setShowLeftPanel] = useState(true);

  useEffect(() => {
    setStore({ view: "sim" });
  }, [setStore]);

  return (
    <AuthGuard>
      <div className="relative w-screen h-screen overflow-hidden bg-[#101418] select-none flex flex-col font-sans">
      {/* 1. Engineering Top Bar */}
      <TopBar />

      {/* 2. Main Middle Workspace: Left Panel + GIS 3D Viewport + Right Inspector */}
      <div className="flex-1 relative flex flex-row overflow-hidden min-h-0">
        {/* Collapsible Left Scenario Control Panel */}
        {showLeftPanel && <LeftScenarioPanel />}

        {/* Central GIS Viewport Container */}
        <div
          className="flex-1 relative h-full min-w-0 bg-[#101418]"
          style={{ height: "100%", minHeight: "400px" }}
        >
          {/* 3D GIS Canvas (CesiumJS 3D Globe or ThreeJS Synthetic Twin) */}
          <div
            className="w-full h-full"
            style={{ display: viewportMode === "cesium" ? "block" : "none" }}
          >
            <CesiumMap resetSignal={resetSignal} />
          </div>

          <div
            className="w-full h-full"
            style={{ display: viewportMode === "three" ? "block" : "none" }}
          >
            <CityScene resetSignal={resetSignal} />
          </div>

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
              onClick={() => {
                resetAllLayers();
                setResetSignal((s) => s + 1);
              }}
              className="p-2 rounded bg-[#191F24]/90 backdrop-blur-md border border-[#303941] text-[#e5e9ec] hover:bg-[#242c33] transition-colors shadow flex items-center gap-1.5 text-xs font-mono"
              title="Reset GIS Camera View & Clear Scenario Pulses"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset View</span>
            </button>

            {/* Fast Map Area & Facility Search */}
            <MapAreaSearch />

            {/* Toggle Place & College Labels */}
            <button
              onClick={togglePlaceLabels}
              className={`px-2.5 py-1.5 rounded backdrop-blur-md border text-xs font-mono flex items-center gap-1.5 transition-colors shadow ${
                showPlaceLabels
                  ? "bg-[#282138] border-purple-500/50 text-purple-300 font-medium"
                  : "bg-[#191F24]/90 border-[#303941] text-[#8a96a1] hover:text-[#d2d8de]"
              }`}
              title={showPlaceLabels ? "Hide College & Place Labels on Globe" : "Show College & Place Labels on Globe"}
            >
              <GraduationCap className={`w-3.5 h-3.5 ${showPlaceLabels ? "text-purple-400" : "text-[#8a96a1]"}`} />
              <span className="hidden lg:inline">Colleges & Places</span>
            </button>

            {/* Toggle Place Inspection Mode */}
            <button
              onClick={toggleInspectMode}
              className={`px-2.5 py-1.5 rounded backdrop-blur-md border text-xs font-mono flex items-center gap-1.5 transition-colors shadow ${
                inspectMode
                  ? "bg-[#1d2d3d] border-sky-500/50 text-sky-300 font-medium"
                  : "bg-[#191F24]/90 border-[#303941] text-[#8a96a1] hover:text-[#d2d8de]"
              }`}
              title="Click any building, college, or location on the 3D globe to reveal full place information"
            >
              <span className={`w-2 h-2 rounded-full ${inspectMode ? "bg-sky-400 animate-pulse" : "bg-[#505a63]"}`} />
              <span className="hidden lg:inline">Inspect Places</span>
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
    </AuthGuard>
  );
}
