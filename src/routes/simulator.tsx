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
  Sparkles,
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
  const cesiumBuildingStyle = useAppStore((s) => s.cesiumBuildingStyle);
  const setStore = useAppStore((s) => s.set);

  const [resetSignal, setResetSignal] = useState(0);
  const [showLeftPanel, setShowLeftPanel] = useState(true);

  useEffect(() => {
    setStore({ view: "sim" });
  }, [setStore]);

  return (
    <AuthGuard>
      <div className="relative w-screen h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)] select-none flex flex-col font-sans">
      {/* 1. Engineering Top Bar */}
      <TopBar />

      {/* 2. Main Middle Workspace: Left Panel + GIS 3D Viewport + Right Inspector */}
      <div className="flex-1 relative flex flex-row overflow-hidden min-h-0">
        {/* Collapsible Left Scenario Control Panel */}
        {showLeftPanel && <LeftScenarioPanel />}

        {/* Central GIS Viewport Container */}
        <div
          className="flex-1 relative h-full min-w-0 bg-[var(--bg-base)]"
          style={{ height: "100%", minHeight: "400px" }}
        >
          {/* 3D GIS Canvas (CesiumJS 3D Globe or ThreeJS Synthetic Twin) */}
          <ClientOnly
            fallback={
              <div className="w-full h-full flex items-center justify-center font-mono text-xs text-[var(--text-tertiary)] bg-[var(--bg-base)]">
                Initializing 3D Viewport...
              </div>
            }
          >
            <ErrorBoundary fallbackTitle="Geospatial 3D Viewport Error">
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center font-mono text-xs text-[var(--text-tertiary)] bg-[var(--bg-base)]">
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

          {/* Unified Floating Glass Map Toolbar (Minimalist Ops Console) */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 p-1.5 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-full shadow-[var(--shadow-floating)] max-w-[calc(100%-24px)] flex-wrap">
            {/* Toggle Left Scenario Panel */}
            <button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className="w-8 h-8 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title={showLeftPanel ? "Hide Scenario Panel" : "Show Scenario Panel"}
              aria-label={showLeftPanel ? "Hide Scenario Panel" : "Show Scenario Panel"}
            >
              {showLeftPanel ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            {/* Segmented Control: Cesium 3D | Synthetic Twin */}
            <div className="flex items-center bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-full p-0.5 shrink-0">
              <button
                onClick={() => setStore({ viewportMode: "cesium" })}
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewportMode === "cesium"
                    ? "bg-[var(--surface-1)] text-[var(--text-primary)] font-semibold shadow-none"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
                title="Cesium 3D Globe + Satellite Imagery"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Cesium 3D</span>
              </button>
              <button
                onClick={() => setStore({ viewportMode: "three" })}
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewportMode === "three"
                    ? "bg-[var(--surface-1)] text-[var(--text-primary)] font-semibold shadow-none"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
                title="Synthetic Topographic Twin (Three.js)"
              >
                <Box className="w-3.5 h-3.5" />
                <span>Synthetic Twin</span>
              </button>
            </div>

            {/* Fast Map Area & Facility Search */}
            <div className="shrink-0">
              <MapAreaSearch />
            </div>

            {/* Reset Camera View */}
            <button
              onClick={() => {
                resetAllLayers();
                setResetSignal((s) => s + 1);
              }}
              className="w-8 h-8 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Reset GIS Camera View"
              aria-label="Reset GIS Camera View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Toggle Place Labels */}
            <button
              onClick={togglePlaceLabels}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                showPlaceLabels
                  ? "bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]"
                  : "bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title={showPlaceLabels ? "Hide College & Place Labels on Globe" : "Show College & Place Labels on Globe"}
              aria-label="Toggle College & Place Labels"
            >
              <GraduationCap className="w-4 h-4" />
            </button>

            {/* Toggle Place Inspection Mode */}
            <button
              onClick={toggleInspectMode}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                inspectMode
                  ? "bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]"
                  : "bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title={inspectMode ? "Inspect Mode Active (Click any building)" : "Enable Inspect Places Mode"}
              aria-label="Toggle Inspect Places Mode"
            >
              <span className={`w-2 h-2 rounded-full ${inspectMode ? "bg-[var(--accent)]" : "bg-[var(--text-tertiary)]"}`} />
            </button>

            {/* 3D Tiles Style Selector (when in Cesium Mode) */}
            {viewportMode === "cesium" && (
              <div
                className="flex items-center gap-1.5 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-full px-2.5 py-1 shrink-0 text-xs text-[var(--text-secondary)]"
                title="Cesium 3D Building Styling"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                <select
                  value={cesiumBuildingStyle}
                  onChange={(e) =>
                    setStore({
                      cesiumBuildingStyle: e.target.value as "year" | "height" | "tall" | "none",
                    })
                  }
                  className="bg-transparent text-xs text-[var(--text-primary)] font-medium focus:outline-none cursor-pointer"
                  aria-label="Cesium 3D Building Styling"
                >
                  <option value="year">Construction Year</option>
                  <option value="height">Roof Height</option>
                  <option value="tall">Tall Buildings</option>
                  <option value="none">Monochrome Base</option>
                </select>
              </div>
            )}

            {/* Map Compass & North Indicator */}
            <div
              className="px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1 shrink-0"
              title="Camera Orientation: North Up"
            >
              <Compass className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <span>NORTH ↑</span>
            </div>
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
