import React from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  Building2,
  AlertTriangle,
  Sun,
  Moon,
  RotateCcw,
  LogIn,
  LogOut,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { PRESETS } from "@/engine/plans";
import { LiveEnvironmentClock } from "./LiveEnvironmentClock";
import { useAuth } from "@/context/AuthContext";

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
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const activeEngine = useAppStore((s) => s.activeEngine);
  const engineDurationMs = useAppStore((s) => s.engineDurationMs);
  const set = useAppStore((s) => s.set);
  const resetSim = useAppStore((s) => s.resetSim);

  // Supabase Auth hook
  const { user, profile, isAuthenticated, signOut } = useAuth();

  // Top bar counters from frame. Before any run, show zeros.
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
    <header className="h-14 w-full bg-white dark:bg-[#111318] border-b border-[#E5E7EB] dark:border-[#27272A] px-4 flex items-center justify-between text-xs text-[#111827] dark:text-[#FAFAFA] select-none shrink-0 z-40 shadow-xs font-sans">
      {/* Brand & Scenario info */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={() => set({ view: "landing" })}
          className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer"
          title="CIVICSHIELD Digital Twin - Return to Landing"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white font-semibold text-xs shadow-xs">
            C
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-[15px] text-[#111827] dark:text-[#FAFAFA]">
              Civic<span className="text-[#2563EB] dark:text-[#3B82F6]">Shield</span>
            </span>
            <span className="text-[11px] font-normal uppercase px-2 py-0.5 rounded-md bg-[#F7F8FA] dark:bg-[#181B22] text-[#475569] dark:text-[#A1A1AA] border border-[#E5E7EB] dark:border-[#27272A]">
              Synthetic Twin
            </span>
          </div>
        </button>

        <div className="h-4 w-px bg-[#E5E7EB] dark:bg-[#27272A]" />

        {/* Current Active Scenario */}
        <div className="hidden md:flex items-center gap-2 bg-[#F7F8FA] dark:bg-[#181B22] px-3 py-1 rounded-lg border border-[#E5E7EB] dark:border-[#27272A]">
          <span className="text-[11px] font-medium text-[#475569] dark:text-[#A1A1AA]">Scenario:</span>
          <span className="font-semibold text-[#111827] dark:text-[#FAFAFA] truncate max-w-[160px]">
            {scenarioTitle}
          </span>
        </div>

        {/* Applied Plan Chip */}
        {appliedPlan && (
          <div className="hidden md:flex items-center gap-1.5 bg-[#2563EB]/10 dark:bg-[#3B82F6]/15 border border-[#2563EB]/30 dark:border-[#3B82F6]/40 px-3 py-1 rounded-lg text-[11px] shadow-2xs animate-in fade-in">
            <span className="text-[#475569] dark:text-[#A1A1AA] font-medium">PLAN:</span>
            <span className="font-semibold text-[#2563EB] dark:text-[#3B82F6] truncate max-w-[160px]">
              {appliedPlan.name}
            </span>
          </div>
        )}

        {/* Active Engine Badge */}
        {activeEngine === "cpp" && (
          <div
            className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[11px] shadow-2xs animate-in fade-in text-emerald-700 dark:text-emerald-400"
            title={`Native C++ Cascade Engine Execution (${engineDurationMs != null ? `${engineDurationMs.toFixed(1)}ms` : "sub-millisecond"})`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold tracking-tight">ENGINE: C++ NATIVE</span>
            {engineDurationMs != null && (
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                {engineDurationMs < 0.1 ? "<0.1ms" : `${engineDurationMs.toFixed(1)}ms`}
              </span>
            )}
          </div>
        )}
        {activeEngine === "ts" && (
          <div
            className="hidden sm:flex items-center gap-1.5 bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] px-2.5 py-1 rounded-lg text-[11px] shadow-2xs animate-in fade-in text-[#475569] dark:text-[#A1A1AA]"
            title="TypeScript Fallback Cascade Engine"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
            <span className="font-semibold tracking-tight">ENGINE: TS</span>
          </div>
        )}

        {/* Current Simulated Time: T+hh:00 / 24h */}
        <div className="flex items-center gap-1.5 text-[12px] bg-[#F7F8FA] dark:bg-[#181B22] px-2.5 py-1 rounded-lg border border-[#E5E7EB] dark:border-[#27272A]">
          <span className="text-[#2563EB] dark:text-[#3B82F6] font-semibold">T+{String(t).padStart(2, "0")}:00</span>
          <span className="text-[#94A3B8] dark:text-[#71717A]">/ 24h</span>
        </div>
      </div>

      {/* Center Operational Impact Counters */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Affected Population */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] shrink-0 whitespace-nowrap">
          <Users className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#71717A]" />
          <div className="flex items-center gap-1">
            <span className="hidden sm:inline text-[11px] text-[#94A3B8] dark:text-[#71717A] font-medium">Affected:</span>
            <span className="font-semibold text-[#111827] dark:text-[#FAFAFA] tabular-nums">
              {affectedStr}
            </span>
          </div>
        </div>

        {/* Hospitals Impacted */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shrink-0 whitespace-nowrap transition-colors ${
            hospitalsCount > 0
              ? "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400"
              : "bg-[#F7F8FA] dark:bg-[#181B22] border-[#E5E7EB] dark:border-[#27272A] text-[#111827] dark:text-[#FAFAFA]"
          }`}
        >
          <Building2 className={`w-3.5 h-3.5 ${hospitalsCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-[#94A3B8] dark:text-[#71717A]"}`} />
          <div className="flex items-center gap-1">
            <span className="hidden sm:inline text-[11px] text-[#94A3B8] dark:text-[#71717A] font-medium">Hospitals:</span>
            <span className="font-semibold tabular-nums whitespace-nowrap">
              {hospitalsCount} <span className="text-[11px] text-[#94A3B8] dark:text-[#71717A] font-normal">/ 2</span>
            </span>
          </div>
        </div>

        {/* Systems Failed */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shrink-0 whitespace-nowrap transition-colors ${
            failedCount > 0
              ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
              : "bg-[#F7F8FA] dark:bg-[#181B22] border-[#E5E7EB] dark:border-[#27272A] text-[#111827] dark:text-[#FAFAFA]"
          }`}
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${failedCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-[#94A3B8] dark:text-[#71717A]"}`} />
          <div className="flex items-center gap-1">
            <span className="hidden sm:inline text-[11px] text-[#94A3B8] dark:text-[#71717A] font-medium">Failed:</span>
            <span className="font-semibold tabular-nums whitespace-nowrap">
              {failedCount} <span className="text-[11px] text-[#94A3B8] dark:text-[#71717A] font-normal">/ 26</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Real-time Clock */}
        <LiveEnvironmentClock />

        <div className="h-4 w-px bg-[#E5E7EB] dark:bg-[#27272A] hidden sm:block" />

        {/* Supabase Authentication Widget */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-1.5">
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7F8FA] dark:bg-[#181B22] hover:bg-[#E5E7EB]/70 dark:hover:bg-[#20242D] border border-[#E5E7EB] dark:border-[#27272A] text-xs transition-colors"
              title={`Logged in as ${profile?.full_name || user.email}`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[#2563EB] dark:text-[#3B82F6] font-semibold max-w-[80px] sm:max-w-[100px] truncate">
                {profile?.full_name?.split(" ")[0] || "Operator"}
              </span>
              <span className="hidden lg:inline text-[10px] px-1.5 py-0.2 rounded bg-white dark:bg-[#111318] text-[#94A3B8] dark:text-[#71717A] border border-[#E5E7EB] dark:border-[#27272A] uppercase">
                {profile?.role?.replace("_", " ") || "Analyst"}
              </span>
            </Link>
            <button
              onClick={async () => {
                await signOut();
                window.location.replace("/login");
              }}
              className="p-1.5 rounded-lg bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] text-[#94A3B8] dark:text-[#71717A] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Sign Out (Supabase Session)"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors text-xs font-semibold shadow-xs"
            title="Authenticate with Supabase"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Operator Login</span>
          </Link>
        )}

        <div className="h-4 w-px bg-[#E5E7EB] dark:bg-[#27272A] hidden sm:block" />

        {/* Dark/Light & Day/Night Mode Toggle */}
        <button
          onClick={() => toggleTheme()}
          className="p-1.5 rounded-lg bg-white dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] text-[#94A3B8] dark:text-[#71717A] hover:text-[#111827] dark:hover:text-[#FAFAFA] hover:bg-[#F7F8FA] dark:hover:bg-[#20242D] transition-colors cursor-pointer"
          title={theme === "dark" || dayNight === "night" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" || dayNight === "night" ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-[#475569]" />
          )}
        </button>

        {/* Reset Simulation to Hour 0 (Reset T+0) */}
        <button
          onClick={() => resetSim()}
          className="p-1.5 rounded-lg bg-white dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] text-[#94A3B8] dark:text-[#71717A] hover:text-[#111827] dark:hover:text-[#FAFAFA] hover:bg-[#F7F8FA] dark:hover:bg-[#20242D] transition-colors cursor-pointer"
          title="Reset Simulation (Reset T+0)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
