import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "@/store/appStore";
import { CityScene } from "@/components/scene/CityScene";
import { TopStats } from "@/components/hud/TopStats";
import { TimeScrubber } from "@/components/hud/TimeScrubber";
import { NodeDetailsModal } from "@/components/hud/NodeDetailsModal";
import { BottomSheet } from "@/components/panels/BottomSheet";
import { LandingView } from "@/components/landing/LandingView";
import { RotateCcw, Home, Info } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const view = useAppStore((s) => s.view);
  const set = useAppStore((s) => s.set);
  const [mounted, setMounted] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (view === "landing") {
    return <LandingView />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b0f19] select-none">
      {/* 3D City Viewport */}
      <div className="absolute inset-0 z-0">
        {mounted ? (
          <CityScene resetSignal={resetSignal} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-cyan-400 font-mono text-xs">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span>Initializing 3D City Model...</span>
          </div>
        )}
      </div>

      {/* Floating Top Stats HUD */}
      <TopStats />

      {/* Floating Canvas Controls: Reset View & Home Buttons */}
      <div className="absolute top-20 left-3 sm:left-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => set({ view: "landing" })}
          className="p-2.5 rounded-xl bg-card/85 backdrop-blur-md border border-border text-foreground hover:bg-muted transition-colors shadow-lg"
          title="Return to Landing"
          aria-label="Return to Landing"
        >
          <Home className="w-4 h-4" />
        </button>
        <button
          onClick={() => setResetSignal((s) => s + 1)}
          className="p-2.5 rounded-xl bg-card/85 backdrop-blur-md border border-border text-foreground hover:bg-muted transition-colors shadow-lg"
          title="Reset Camera View"
          aria-label="Reset Camera View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Selected Node Details Modal */}
      <NodeDetailsModal />

      {/* Floating Time Scrubber Bar - position above Bottom Sheet */}
      <div className="absolute bottom-[270px] sm:bottom-[300px] left-3 right-3 z-10 pointer-events-auto">
        <TimeScrubber />
      </div>

      {/* Bottom Sheet Tabs Panel */}
      <BottomSheet />
    </div>
  );
}
