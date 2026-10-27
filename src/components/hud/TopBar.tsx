import React from "react";
import { Users, Building2, AlertTriangle, Sun, Moon, RotateCcw, Home, Sliders, Shield } from "lucide-react";
import { useAppStore, currentSnapshot } from "@/store/appStore";
import { PRESETS } from "@/engine/plans";

interface TopBarProps {
  onToggleLeftPanel?: () => void;
  isLeftPanelOpen?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleLeftPanel, isLeftPanelOpen }) => {
  const result = useAppStore((s) => s.result);
  const hour = useAppStore((s) => s.hour);
  const presetId = useAppStore((s) => s.presetId);
  const dayNight = useAppStore((s) => s.dayNight);
  const set = useAppStore((s) => s.set);
  const setHour = useAppStore((s) => s.setHour);

  const snap = currentSnapshot(result, hour);
  const activePreset = PRESETS.find((p) => p.id === presetId);

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
            {activePreset ? activePreset.label : "Custom Outage"}
          </span>
        </div>

        {/* Current Simulated Time */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] bg-[#14191d] px-2 py-1 rounded border border-[#303941]">
          <span className="text-[#9BAA76] font-bold">T+{hour.toString().padStart(2, "0")}h</span>
          <span className="text-[#8a96a1]">/ 24h</span>
        </div>
      </div>

      {/* Center Operational Impact Counters */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Affected Population */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#14191d] border border-[#303941]">
          <Users className="w-3.5 h-3.5 text-[#8a96a1]" />
          <div className="flex items-center gap-1">
            <span className="hidden sm:inline text-[10px] text-[#8a96a1] uppercase font-mono">Affected:</span>
            <span className="font-mono font-bold text-[#f1f4f6] tabular-nums">
              {snap.affectedPopulation.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Hospitals Impacted */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors ${
            snap.hospitalsDown > 0
              ? "bg-[#401c1c] border-[#d9534f]/60 text-[#ff8f8f]"
              : "bg-[#14191d] border-[#303941] text-[#e5e9ec]"
          }`}
        >
          <Building2 className={`w-3.5 h-3.5 ${snap.hospitalsDown > 0 ? "text-[#d9534f]" : "text-[#8a96a1]"}`} />
          <div className="flex items-center gap-1">
            <span className="hidden sm:inline text-[10px] text-[#8a96a1] uppercase font-mono">Hospitals:</span>
            <span className="font-mono font-bold tabular-nums">
              {snap.hospitalsDown} <span className="text-[10px] text-[#8a96a1] font-normal">/ 2</span>
            </span>
          </div>
        </div>

        {/* Systems Failed */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors ${
            snap.systemsFailed > 0
              ? "bg-[#3d2d14] border-[#e09f3e]/60 text-[#f6be73]"
              : "bg-[#14191d] border-[#303941] text-[#e5e9ec]"
          }`}
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${snap.systemsFailed > 0 ? "text-[#e09f3e]" : "text-[#8a96a1]"}`} />
          <div className="flex items-center gap-1">
            <span className="hidden sm:inline text-[10px] text-[#8a96a1] uppercase font-mono">Failed:</span>
            <span className="font-mono font-bold tabular-nums">
              {snap.systemsFailed} <span className="text-[10px] text-[#8a96a1] font-normal">/ 26</span>
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

        {/* Reset Simulation to Hour 0 */}
        <button
          onClick={() => setHour(0)}
          className="p-1.5 rounded bg-[#242c33] border border-[#303941] text-[#8a96a1] hover:text-[#f1f4f6] hover:bg-[#2c363f] transition-colors"
          title="Reset Simulation Time"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
