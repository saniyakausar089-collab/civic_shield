import React from "react";
import { Users, Building2, AlertTriangle, Sun, Moon, RotateCcw } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { PRESETS } from "@/engine/plans";

interface TopBarProps {
  onToggleLeftPanel?: () => void;
  isLeftPanelOpen?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleLeftPanel, isLeftPanelOpen }) => {
  const result = useAppStore((s) => s.result);
  const t = useAppStore((s) => s.t);
  const selectedScenario = useAppStore((s) => s.selectedScenario);
  const appliedPlan = useAppStore((s) => s.appliedPlan);
  const presetId = useAppStore((s) => s.presetId);
  const scenariosData = useAppStore((s) => s.scenariosData);
  const dayNight = useAppStore((s) => s.dayNight);
  const set = useAppStore((s) => s.set);
  const resetSim = useAppStore((s) => s.resetSim);

  // Requirement 5: Top bar counters from frame. Before any run, show zeros.
  const frame = result && Array.isArray(result.frames) ? result.frames[t] : null;

  const affectedStr = frame ? frame.affected_pop.toLocaleString("en-IN") : "0";
  const hospitalsCount = frame ? frame.hospitals_down : 0;
  const failedCount = frame ? frame.failed.length : 0;

  // Active scenario name
  const scenarioTitle =
    selectedScenario?.name ||
    scenariosData.find(
      (s) =>
        s.id === presetId ||
        (presetId === "pipeline" && s.id === "pipeline_burst") ||
        (presetId === "monsoon" && s.id === "monsoon_flood") ||
        (presetId === "heatwave" && s.id === "heatwave_overload") ||
        (presetId === "cyber" && s.id === "cyberattack") ||
        (presetId === "quake" && s.id === "earthquake")
    )?.name ||
    PRESETS.find((p) => p.id === presetId)?.label ||
    "Custom Outage";

  return (
    <header className="h-12 w-full bg-[#191F24] border-b border-[#303941] px-3 flex items-center justify-between text-xs text-[#e5e9ec] select-none shrink-0 z-30">
      {/* Brand & Scenario info */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => set({ view: "landing" })}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          title="CIVICSHIELD Digital Twin - Return to Landing"
        >
          <div className="w-5 h-5 rounded bg-[#9BAA76] flex items-center justify-center text-[#101418] font-bold text-xs">
            C
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-wider text-sm text-[#f1f4f6]">
              CIVIC<span className="text-[#9BAA76]">SHIELD</span>
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#242c33] text-[#8a96a1] border border-[#303941]">
              GIS OPS
            </span>
          </div>
        </button>

        <div className="h-4 w-px bg-[#303941]" />

        {/* Current Active Scenario */}
        <div className="hidden md:flex items-center gap-2 bg-[#14191d] px-2.5 py-1 rounded border border-[#303941]">
          <span className="text-[10px] uppercase font-mono text-[#8a96a1]">Scenario:</span>
          <span className="font-medium text-[#e5e9ec] truncate max-w-[160px]">
            {scenarioTitle}
          </span>
        </div>

        {/* Applied Plan Chip (Phase 4a) */}
        {appliedPlan && (
          <div className="hidden md:flex items-center gap-1.5 bg-[#142328] border border-[#38bdf8]/60 px-2.5 py-1 rounded text-[10px] font-mono shadow-sm animate-in fade-in">
            <span className="text-[#8a96a1] uppercase">PLAN:</span>
            <span className="font-semibold text-[#38bdf8] truncate max-w-[160px]">
              {appliedPlan.name}
            </span>
          </div>
        )}

        {/* Current Simulated Time: T+hh:00 / 24h */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] bg-[#14191d] px-2 py-1 rounded border border-[#303941]">
          <span className="text-[#9BAA76] font-bold">T+{String(t).padStart(2, "0")}:00</span>
          <span className="text-[#8a96a1]">/ 24h</span>
        </div>
      </div>

      {/* Center Operational Impact Counters (Requirement 5) */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Affected Population */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#14191d] border border-[#303941]">
          <Users className="w-3.5 h-3.5 text-[#8a96a1]" />
          <div className="flex items-center gap-1">
            <span className="hidden sm:inline text-[10px] text-[#8a96a1] uppercase font-mono">Affected:</span>
            <span className="font-mono font-bold text-[#f1f4f6] tabular-nums">
              {affectedStr}
            </span>
          </div>
        </div>

        {/* Hospitals Impacted */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors ${
            hospitalsCount > 0
              ? "bg-[#401c1c] border-[#d9534f]/60 text-[#ff8f8f]"
              : "bg-[#14191d] border-[#303941] text-[#e5e9ec]"
          }`}
        >
          <Building2 className={`w-3.5 h-3.5 ${hospitalsCount > 0 ? "text-[#d9534f]" : "text-[#8a96a1]"}`} />
          <div className="flex items-center gap-1">
            <span className="hidden sm:inline text-[10px] text-[#8a96a1] uppercase font-mono">Hospitals:</span>
            <span className="font-mono font-bold tabular-nums">
              {hospitalsCount} <span className="text-[10px] text-[#8a96a1] font-normal">/ 2</span>
            </span>
          </div>
        </div>

        {/* Systems Failed */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors ${
            failedCount > 0
              ? "bg-[#3d2d14] border-[#e09f3e]/60 text-[#f6be73]"
              : "bg-[#14191d] border-[#303941] text-[#e5e9ec]"
          }`}
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${failedCount > 0 ? "text-[#e09f3e]" : "text-[#8a96a1]"}`} />
          <div className="flex items-center gap-1">
            <span className="hidden sm:inline text-[10px] text-[#8a96a1] uppercase font-mono">Failed:</span>
            <span className="font-mono font-bold tabular-nums">
              {failedCount} <span className="text-[10px] text-[#8a96a1] font-normal">/ 26</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5">
        {/* Day/Night Basemap Mode */}
        <button
          onClick={() => set({ dayNight: dayNight === "day" ? "night" : "day" })}
          className="p-1.5 rounded bg-[#242c33] border border-[#303941] text-[#8a96a1] hover:text-[#f1f4f6] hover:bg-[#2c363f] transition-colors"
          title="Toggle Day/Night GIS Map Style"
        >
          {dayNight === "day" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>

        {/* Reset Simulation to Hour 0 (Reset T+0) */}
        <button
          onClick={() => resetSim()}
          className="p-1.5 rounded bg-[#242c33] border border-[#303941] text-[#8a96a1] hover:text-[#f1f4f6] hover:bg-[#2c363f] transition-colors"
          title="Reset Simulation (Reset T+0)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
