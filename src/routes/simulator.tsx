import React, { useState, useEffect, lazy, Suspense } from "react";
import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { useAppStore } from "@/store/appStore";
import { TopBar } from "@/components/hud/TopBar";
import { CompactTimelineBar } from "@/components/hud/CompactTimelineBar";
import { LeftScenarioPanel } from "@/components/panels/LeftScenarioPanel";
import { RightImpactInspector } from "@/components/panels/RightImpactInspector";
import { ResizableAnalysisDrawer } from "@/components/panels/ResizableAnalysisDrawer";
import { MapLegendOverlay } from "@/components/hud/MapLegendOverlay";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import {
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Compass,
  Globe,
  Box,
  GraduationCap,
} from "lucide-react";

const CityScene = lazy(() =>
  import("@/components/scene/CityScene").then((m) => ({ default: m.CityScene }))
);
const CesiumMap = lazy(() =>
  import("@/components/scene/CesiumMap").then((m) => ({ default: m.CesiumMap }))
);
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
      <div className="relative w-screen h-screen overflow-hidden bg-[#F7F8FA] dark:bg-[#09090B] select-none flex flex-col font-sans">
      {/* 1. Engineering Top Bar */}
      <TopBar />

      {/* 2. Main Middle Workspace: Left Panel + GIS 3D Viewport + Right Inspector */}
      <div className="flex-1 relative flex flex-row overflow-hidden min-h-0">
        {/* Collapsible Left Scenario Control Panel */}
        {showLeftPanel && <LeftScenarioPanel />}

        {/* Central GIS Viewport Container */}
        <div
          className="flex-1 relative h-full min-w-0 bg-[#09090B]"
          style={{ height: "100%", minHeight: "400px" }}
        >
          {/* 3D GIS Canvas (CesiumJS 3D Globe or ThreeJS Synthetic Twin) */}
          <ClientOnly
            fallback={
              <div className="w-full h-full flex items-center justify-center font-mono text-xs text-[#94A3B8] dark:text-[#A1A1AA] bg-[#09090B]">
                Initializing 3D Viewport...
              </div>
            }
          >
            <ErrorBoundary fallbackTitle="Geospatial 3D Viewport Error">
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center font-mono text-xs text-[#94A3B8] dark:text-[#A1A1AA] bg-[#09090B]">
                    Loading 3D Viewport...
                  </div>
                }
              >
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
              </Suspense>
            </ErrorBoundary>
          </ClientOnly>

          {/* Floating Map Utility Controls */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 max-w-[calc(100%-160px)]">
            {/* Toggle Left Scenario Panel */}
            <button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className="p-2 rounded-lg bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md border border-[#E5E7EB] dark:border-[#27272A] text-[#475569] dark:text-[#A1A1AA] hover:text-[#111827] dark:hover:text-[#FAFAFA] hover:bg-[#F7F8FA] dark:hover:bg-[#181B22] transition-colors shadow-xs cursor-pointer"
              title={showLeftPanel ? "Hide Scenario Panel" : "Show Scenario Panel"}
            >
              {showLeftPanel ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            {/* Viewport Engine Switcher: Cesium 3D Tiles vs Three.js */}
            <div className="flex items-center bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md border border-[#E5E7EB] dark:border-[#27272A] rounded-lg p-0.5 shadow-xs">
              <button
                onClick={() => setStore({ viewportMode: "cesium" })}
                className={`px-3 py-1 rounded-md text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewportMode === "cesium"
                    ? "bg-[#2563EB] text-white font-semibold shadow-2xs"
                    : "text-[#94A3B8] dark:text-[#71717A] hover:text-[#111827] dark:hover:text-[#FAFAFA]"
                }`}
                title="Cesium 3D Globe + 3D Tileset (Asset #4854512)"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Cesium 3D</span>
              </button>
              <button
                onClick={() => setStore({ viewportMode: "three" })}
                className={`px-3 py-1 rounded-md text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewportMode === "three"
                    ? "bg-[#2563EB] text-white font-semibold shadow-2xs"
                    : "text-[#94A3B8] dark:text-[#71717A] hover:text-[#111827] dark:hover:text-[#FAFAFA]"
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
              className="px-3 py-1.5 rounded-lg bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md border border-[#E5E7EB] dark:border-[#27272A] text-[#475569] dark:text-[#A1A1AA] hover:text-[#111827] dark:hover:text-[#FAFAFA] hover:bg-[#F7F8FA] dark:hover:bg-[#181B22] transition-colors shadow-xs flex items-center gap-1.5 text-[13px] cursor-pointer"
              title="Reset GIS Camera View & Clear Scenario Pulses"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#71717A]" />
              <span className="hidden sm:inline">Reset View</span>
            </button>

            {/* Fast Map Area & Facility Search */}
            <MapAreaSearch />

            {/* Toggle Place & College Labels */}
            <button
              onClick={togglePlaceLabels}
              className={`px-3 py-1.5 rounded-lg backdrop-blur-md border text-[13px] flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
                showPlaceLabels
                  ? "bg-[#2563EB]/15 border-[#2563EB]/50 text-[#2563EB] dark:text-[#3B82F6] font-semibold"
                  : "bg-white/95 dark:bg-[#111318]/95 border-[#E5E7EB] dark:border-[#27272A] text-[#94A3B8] dark:text-[#71717A] hover:text-[#111827] dark:hover:text-[#FAFAFA] hover:bg-[#F7F8FA] dark:hover:bg-[#181B22]"
              }`}
              title={showPlaceLabels ? "Hide College & Place Labels on Globe" : "Show College & Place Labels on Globe"}
            >
              <GraduationCap className={`w-3.5 h-3.5 ${showPlaceLabels ? "text-[#2563EB] dark:text-[#3B82F6]" : "text-[#94A3B8] dark:text-[#71717A]"}`} />
              <span className="hidden lg:inline">Colleges &amp; Places</span>
            </button>

            {/* Toggle Place Inspection Mode */}
            <button
              onClick={toggleInspectMode}
              className={`px-3 py-1.5 rounded-lg backdrop-blur-md border text-[13px] flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
                inspectMode
                  ? "bg-[#2563EB]/15 border-[#2563EB]/50 text-[#2563EB] dark:text-[#3B82F6] font-semibold"
                  : "bg-white/95 dark:bg-[#111318]/95 border-[#E5E7EB] dark:border-[#27272A] text-[#94A3B8] dark:text-[#71717A] hover:text-[#111827] dark:hover:text-[#FAFAFA] hover:bg-[#F7F8FA] dark:hover:bg-[#181B22]"
              }`}
              title="Click any building, college, or location on the 3D globe to reveal full place information"
            >
              <span className={`w-2 h-2 rounded-full ${inspectMode ? "bg-[#2563EB] dark:bg-[#3B82F6] animate-pulse" : "bg-[#94A3B8]"}`} />
              <span className="hidden lg:inline">Inspect Places</span>
            </button>
          </div>

          {/* Map Compass & North Indicator */}
          <div className="absolute top-3 right-3 z-10 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md border border-[#E5E7EB] dark:border-[#27272A] px-3 py-1 rounded-lg flex items-center gap-1.5 text-[12px] text-[#94A3B8] dark:text-[#71717A] shadow-xs">
            <Compass className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
            <span className="font-semibold text-[#111827] dark:text-[#FAFAFA]">NORTH ↑</span>
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
