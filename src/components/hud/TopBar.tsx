import React from "react";
import { Link } from "@tanstack/react-router";
import {
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

export const TopBar: React.FC<TopBarProps> = () => {
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

  // Counters from current simulation frame
  const frame = result && Array.isArray(result.frames) ? result.frames[t] : null;
  const affectedStr = frame ? frame.affected_pop.toLocaleString("en-IN") : "0";
  const hospitalsCount = frame ? frame.hospitals_down : 0;
  const failedCount = frame ? frame.failed.length : 0;

  // Active scenario label
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
    <header className="h-14 w-full bg-[var(--surface-1)] border-b border-[var(--border-subtle)] px-4 sm:px-6 flex items-center justify-between text-xs text-[var(--text-primary)] select-none shrink-0 z-40 transition-colors">
      {/* Zone 1: Left — Brand + Synthetic Twin Tag */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => set({ view: "landing" })}
          className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group"
          title="Return to Landing"
        >
          <div className="w-6 h-6 rounded-md bg-[var(--surface-3)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] font-semibold text-[11px]">
            C
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-[var(--text-primary)]">
            Civic<span className="text-[var(--text-secondary)]">Shield</span>
          </span>
        </button>

        <span className="hidden sm:inline-flex items-center text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--surface-3)] border border-[var(--border-subtle)] px-2.5 py-0.5 rounded-full">
          Synthetic Twin
        </span>

        {/* Quiet Engine Chip (Neutral Surface-3 + Static Dot) */}
        {activeEngine === "cpp" && (
          <span
            className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--surface-3)] border border-[var(--border-subtle)] px-2.5 py-0.5 rounded-full tabular-nums"
            title={`Native C++ Cascade Engine (${engineDurationMs != null ? `${engineDurationMs.toFixed(1)}ms` : "sub-ms"})`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-normal)] shrink-0" />
            C++
          </span>
        )}
      </div>

      {/* Zone 2: Center — Quiet Row of Small Text Stats */}
      <div className="hidden md:flex items-center gap-3 text-[13px] text-[var(--text-secondary)]">
        {/* Scenario Name */}
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--text-tertiary)] text-[12px]">Scenario:</span>
          <span className="font-semibold text-[var(--text-primary)] truncate max-w-[170px]">
            {scenarioTitle}
          </span>
        </div>

        {appliedPlan && (
          <>
            <span className="text-[var(--border-subtle)] select-none">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-tertiary)] text-[12px]">Plan:</span>
              <span className="font-medium text-[var(--accent)] truncate max-w-[140px]">
                {appliedPlan.name}
              </span>
            </div>
          </>
        )}

        <span className="text-[var(--border-subtle)] select-none">|</span>

        {/* Time */}
        <div className="flex items-center gap-1 tabular-nums">
          <span className="font-semibold text-[var(--text-primary)]">
            T+{String(t).padStart(2, "0")}:00
          </span>
          <span className="text-[var(--text-tertiary)] text-[11px]">/ 24h</span>
        </div>

        <span className="text-[var(--border-subtle)] select-none">|</span>

        {/* Affected */}
        <div className="flex items-center gap-1.5 tabular-nums">
          <span className="text-[var(--text-tertiary)] text-[12px]">Affected:</span>
          <span className="font-semibold text-[var(--text-primary)]">
            {affectedStr}
          </span>
        </div>

        <span className="text-[var(--border-subtle)] select-none">|</span>

        {/* Hospitals */}
        <div className="flex items-center gap-1.5 tabular-nums">
          <span className="text-[var(--text-tertiary)] text-[12px]">Hospitals:</span>
          <span className={`font-semibold flex items-center gap-1 ${hospitalsCount > 0 ? "text-[var(--status-failed)]" : "text-[var(--text-primary)]"}`}>
            {hospitalsCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-failed)] shrink-0" />}
            {hospitalsCount}
            <span className="text-[var(--text-tertiary)] font-normal text-[11px]">/2</span>
          </span>
        </div>

        <span className="text-[var(--border-subtle)] select-none">|</span>

        {/* Failed */}
        <div className="flex items-center gap-1.5 tabular-nums">
          <span className="text-[var(--text-tertiary)] text-[12px]">Failed:</span>
          <span className={`font-semibold flex items-center gap-1 ${failedCount > 0 ? "text-[var(--status-degraded)]" : "text-[var(--text-primary)]"}`}>
            {failedCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-degraded)] shrink-0" />}
            {failedCount}
            <span className="text-[var(--text-tertiary)] font-normal text-[11px]">/26</span>
          </span>
        </div>
      </div>

      {/* Zone 3: Right — Live Weather/Clock + User + Theme + Reset */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Environmental Clock Telemetry */}
        <LiveEnvironmentClock />

        <div className="h-4 w-px bg-[var(--border-subtle)] mx-0.5 hidden sm:block" />

        {/* Supabase User Pill */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-1.5">
            <Link
              to="/login"
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-3)] hover:bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title={`Logged in as ${profile?.full_name || user.email}`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--status-good)] shrink-0" />
              <span className="font-medium text-[var(--text-primary)] max-w-[85px] sm:max-w-[105px] truncate">
                {profile?.full_name?.split(" ")[0] || "Operator"}
              </span>
              <span className="hidden xl:inline text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">
                {profile?.role?.replace("_", " ") || "Analyst"}
              </span>
            </Link>
            <button
              onClick={async () => {
                await signOut();
                window.location.replace("/login");
              }}
              className="w-8 h-8 rounded-full bg-transparent hover:bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--status-failed)] flex items-center justify-center transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-3)] hover:bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-colors text-xs font-medium"
            title="Authenticate with Supabase"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Operator Login</span>
          </Link>
        )}

        {/* Theme Toggle (Sun / Moon) */}
        <button
          onClick={() => toggleTheme()}
          className="w-8 h-8 rounded-full bg-transparent hover:bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
          title={theme === "dark" || dayNight === "night" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {theme === "dark" || dayNight === "night" ? (
            <Sun className="w-3.5 h-3.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" />
          )}
        </button>

        {/* Reset Simulation to Hour 0 */}
        <button
          onClick={() => resetSim()}
          className="w-8 h-8 rounded-full bg-transparent hover:bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
          title="Reset Simulation (Hour 0)"
          aria-label="Reset simulation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
