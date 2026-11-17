import React from "react";
import { SCROLL_STAGES } from "./stagesData";
import {
  ArrowRight,
  ShieldCheck,
  Activity,
  Zap,
  ChevronDown,
  Check,
  Layers,
  Cpu,
  Radio,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface GlassPanelProps {
  currentStage: number;
  scrollProgress: number;
  onLaunchSimulator: () => void;
  weakLinkData?: { name: string; score: number; harm: number };
  hospitalBackupHours?: number;
  failureStats?: { hour: number; affectedPop: number; systemsFailed: number };
  planComparison?: { id: string; name: string; harm: number; isBest: boolean }[];
  resilienceScoreValue?: number;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  currentStage,
  scrollProgress,
  onLaunchSimulator,
  weakLinkData,
  hospitalBackupHours = 8,
  failureStats,
  planComparison,
  resilienceScoreValue = 92,
}) => {
  const stage = SCROLL_STAGES[currentStage] || SCROLL_STAGES[0]!;

  // Stage 0: World-Class Editorial Hero Section
  if (currentStage === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-10 select-none pointer-events-none z-30">
        <div className="max-w-4xl w-full bg-white/95 dark:bg-[#111318]/95 backdrop-blur-2xl border border-[#E5E7EB] dark:border-[#27272A] rounded-2xl p-7 sm:p-11 lg:p-14 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-center pointer-events-auto transition-all duration-300 relative overflow-hidden">
          {/* Subtle ambient lighting inside hero card */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#2563EB]/10 dark:bg-[#3B82F6]/15 blur-3xl rounded-full pointer-events-none" />

          {/* Premium Status Pill Badge */}
          <div className="relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] text-[#475569] dark:text-[#A1A1AA] text-[13px] font-medium mb-6 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563EB] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563EB]" />
            </span>
            <span className="text-[#111827] dark:text-[#FAFAFA] font-semibold">CivicShield</span>
            <span className="w-1 h-1 rounded-full bg-[#94A3B8] dark:bg-[#71717A]" />
            <span>Urban Resilience Digital Twin</span>
          </div>

          {/* Oversized Headline (64px, weight 600, line-height 1.1) */}
          <h1 className="relative text-[36px] sm:text-[50px] lg:text-[64px] font-semibold text-[#111827] dark:text-[#FAFAFA] leading-[1.1] tracking-[-0.03em] max-w-3xl mx-auto">
            Break one thing. Watch the city follow.
          </h1>

          {/* Impactful Supporting Description */}
          <p className="relative mt-5 text-[16px] sm:text-[18px] text-[#475569] dark:text-[#A1A1AA] font-normal leading-[1.6] max-w-2xl mx-auto">
            A single pipe rupture triggers an interdependent chain reaction through water, power, hospitals, and transit networks. Explore systemic cascades in a continuous 3D twin and test emergency municipal interventions.
          </p>

          {/* Primary & Secondary Call To Actions */}
          <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={onLaunchSimulator}
              className="w-full sm:w-auto px-7 py-3.5 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-semibold text-[15px] flex items-center justify-center gap-2.5 transition-all duration-200 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <span>Launch Simulator</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })}
              className="w-full sm:w-auto px-6 py-3.5 rounded-[8px] bg-[#FFFFFF] dark:bg-[#181B22] hover:bg-[#F7F8FA] dark:hover:bg-[#20242D] text-[#111827] dark:text-[#FAFAFA] font-semibold text-[15px] border border-[#E5E7EB] dark:border-[#27272A] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] active:scale-[0.98]"
            >
              <span>Explore 3D Flight</span>
              <ChevronDown className="w-4 h-4 text-[#94A3B8] dark:text-[#71717A]" />
            </button>
          </div>

          {/* Live Product Preview & Telemetry Strip */}
          <div className="relative mt-8 pt-6 border-t border-[#E5E7EB] dark:border-[#27272A] grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A]">
              <div className="flex items-center gap-2 text-[#2563EB] dark:text-[#3B82F6] mb-1">
                <Layers className="w-4 h-4" />
                <span className="text-[13px] font-semibold text-[#111827] dark:text-[#FAFAFA]">26 Critical Assets</span>
              </div>
              <p className="text-[12px] text-[#475569] dark:text-[#A1A1AA] leading-snug">
                Power substations, water plants, hospitals, and arterial transit hubs.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A]">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-[13px] font-semibold text-[#111827] dark:text-[#FAFAFA]">Cascade Propagation</span>
              </div>
              <p className="text-[12px] text-[#475569] dark:text-[#A1A1AA] leading-snug">
                Interdependent stress transmission modeling multi-sector systemic shock.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A]">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                <Cpu className="w-4 h-4" />
                <span className="text-[13px] font-semibold text-[#111827] dark:text-[#FAFAFA]">&lt; 5ms WASM Engine</span>
              </div>
              <p className="text-[12px] text-[#475569] dark:text-[#A1A1AA] leading-snug">
                High-performance C++ cascade core with surrogate ML hazard estimation.
              </p>
            </div>
          </div>

          {/* Scroll Cue & Progress bar */}
          <div className="relative mt-6 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-[13px] text-[#94A3B8] dark:text-[#71717A] font-normal">
              <span>Scroll down to navigate cascade stages</span>
              <ChevronDown className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6] animate-bounce" />
            </div>
            <div className="w-48 h-1 bg-[#E5E7EB] dark:bg-[#27272A] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563EB] dark:bg-[#3B82F6] transition-all duration-150"
                style={{ width: `${Math.max(8, scrollProgress * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stage 9: Final Executive Call-To-Action screen
  if (currentStage === 9) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 select-none pointer-events-none z-30">
        <div className="max-w-4xl w-full bg-white/98 dark:bg-[#111318]/98 border border-[#E5E7EB] dark:border-[#27272A] rounded-2xl p-7 sm:p-11 backdrop-blur-2xl shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] space-y-7 pointer-events-auto transition-all duration-300 relative overflow-hidden">
          {/* Subtle ambient lighting inside card */}
          <div className="absolute -top-24 right-1/4 w-80 h-40 bg-[#2563EB]/10 dark:bg-[#3B82F6]/15 blur-3xl rounded-full pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#E5E7EB] dark:border-[#27272A] pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#2563EB]/10 dark:bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#3B82F6] text-[12px] font-semibold uppercase tracking-wider mb-2">
                Executive Resilience Workspace
              </div>
              <h2 className="text-[30px] sm:text-[38px] font-semibold text-[#111827] dark:text-[#FAFAFA] leading-[1.2] tracking-[-0.025em]">
                Take Command of the City
              </h2>
              <p className="text-[15px] text-[#475569] dark:text-[#A1A1AA] font-normal mt-1.5 max-w-xl leading-relaxed">
                Evaluate municipal disaster scenarios, test generator contingencies, and dispatch real-time emergency interventions.
              </p>
            </div>
            <button
              onClick={onLaunchSimulator}
              className="px-7 py-3.5 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-semibold text-[15px] flex items-center justify-center gap-3 transition-all duration-200 shadow-sm cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              <span>Launch Simulator</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Feature capability tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#2563EB] dark:text-[#3B82F6]">
                <Activity className="w-4 h-4" />
                <span className="text-[14px] font-semibold text-[#111827] dark:text-[#FAFAFA]">Monte Carlo</span>
              </div>
              <p className="text-[13px] text-[#475569] dark:text-[#A1A1AA] leading-relaxed">
                200 stochastic runs with P25–P75 confidence envelopes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Zap className="w-4 h-4" />
                <span className="text-[14px] font-semibold text-[#111827] dark:text-[#FAFAFA]">Weak Links</span>
              </div>
              <p className="text-[13px] text-[#475569] dark:text-[#A1A1AA] leading-relaxed">
                Heuristic ranking of single-point cascading bottlenecks.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#475569] dark:text-[#A1A1AA]">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[14px] font-semibold text-[#111827] dark:text-[#FAFAFA]">Command Panel</span>
              </div>
              <p className="text-[13px] text-[#475569] dark:text-[#A1A1AA] leading-relaxed">
                Emergency interventions: tankers, generators, and isolation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="text-[14px] font-semibold text-[#111827] dark:text-[#FAFAFA]">{resilienceScoreValue}/100</span>
                <span className="text-[13px] text-[#475569] dark:text-[#A1A1AA]">Score</span>
              </div>
              <p className="text-[13px] text-[#475569] dark:text-[#A1A1AA] leading-relaxed">
                Composite stress index benchmarked across all disaster scenarios.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[13px] text-[#94A3B8] dark:text-[#71717A] pt-4 border-t border-[#E5E7EB] dark:border-[#27272A]">
            <span className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
              <span>Cesium 3D Globe &amp; Synthetic Urban Twin</span>
            </span>
            <span>Framework-agnostic cascade simulation core</span>
          </div>
        </div>
      </div>
    );
  }

  // Stages 1 through 8: Left-aligned clean glass HUD panel
  return (
    <div className="fixed bottom-6 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 left-4 sm:left-12 max-w-md w-[calc(100vw-2rem)] sm:w-full z-30 select-none pointer-events-none">
      <div className="bg-white/95 dark:bg-[#111318]/95 border border-[#E5E7EB] dark:border-[#27272A] rounded-2xl p-6 sm:p-7 backdrop-blur-2xl shadow-2xl dark:shadow-[0_20px_40px_rgba(0,0,0,0.8)] space-y-4 pointer-events-auto transition-all duration-300">
        {/* Stage Badge & Category */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[#2563EB] dark:text-[#3B82F6] px-2.5 py-1 rounded-[6px] bg-[#2563EB]/10 dark:bg-[#3B82F6]/15 border border-[#2563EB]/20 dark:border-[#3B82F6]/30">
            {stage.badge}
          </span>
          <span className="text-[13px] text-[#94A3B8] dark:text-[#71717A] font-normal">
            Stage {currentStage + 1} of 10
          </span>
        </div>

        {/* Section Heading */}
        <h2 className="text-[22px] sm:text-[26px] font-semibold text-[#111827] dark:text-[#FAFAFA] tracking-tight leading-[1.25]">
          {stage.headline}
        </h2>

        {/* Body paragraph */}
        <p className="text-[15px] sm:text-[16px] text-[#475569] dark:text-[#A1A1AA] font-normal leading-[1.6]">
          {stage.body}
        </p>

        {/* Stage 4 — Weak Link telemetry */}
        {currentStage === 4 && weakLinkData && (
          <div className="p-3.5 rounded-xl bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Primary Vulnerability</span>
              </div>
              <div className="text-[15px] font-semibold text-[#111827] dark:text-[#FAFAFA] mt-0.5">{weakLinkData.name}</div>
            </div>
            <div className="text-right">
              <div className="text-[17px] font-semibold text-[#2563EB] dark:text-[#3B82F6]">
                {weakLinkData.score} <span className="text-[12px] text-[#94A3B8] dark:text-[#71717A] font-normal">/ 100</span>
              </div>
              <div className="text-[11px] text-[#94A3B8] dark:text-[#71717A]">Criticality Index</div>
            </div>
          </div>
        )}

        {/* Stage 5 — Hospital backup */}
        {currentStage === 5 && (
          <div className="p-3.5 rounded-xl bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-[#475569] dark:text-[#A1A1AA] uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
                <span>Eastside Medical Backup</span>
              </div>
              <div className="text-[15px] font-semibold text-[#111827] dark:text-[#FAFAFA] mt-0.5">Generator Autonomy</div>
            </div>
            <div className="text-right">
              <div className="text-[17px] font-semibold text-[#2563EB] dark:text-[#3B82F6]">
                {hospitalBackupHours}.0 Hours
              </div>
              <div className="text-[11px] text-[#94A3B8] dark:text-[#71717A]">Before Power Depletion</div>
            </div>
          </div>
        )}

        {/* Stage 7 — Cascade timeline */}
        {currentStage === 7 && failureStats && (
          <div className="p-3.5 rounded-xl bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] space-y-2.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                Cascade Timeline
              </span>
              <span className="text-[#111827] dark:text-[#FAFAFA] font-semibold">T+{failureStats.hour}:00</span>
            </div>
            <div className="flex items-center justify-between text-[13px] text-[#475569] dark:text-[#A1A1AA]">
              <span>Affected Population:</span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                {failureStats.affectedPop.toLocaleString()} citizens
              </span>
            </div>
            <div className="w-full bg-[#E5E7EB] dark:bg-[#27272A] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#2563EB] dark:bg-[#3B82F6] h-full transition-all duration-200"
                style={{ width: `${(failureStats.hour / 24) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Stage 8 — Plan comparison */}
        {currentStage === 8 && planComparison && (
          <div className="space-y-2 pt-1">
            <div className="text-[12px] font-semibold text-[#94A3B8] dark:text-[#71717A] uppercase tracking-wide">
              Municipal Response Comparison
            </div>
            <div className="grid grid-cols-2 gap-2">
              {planComparison.map((p) => (
                <div
                  key={p.id}
                  className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between transition-all ${
                    p.isBest
                      ? "bg-[#2563EB]/10 dark:bg-[#3B82F6]/15 border-[#2563EB]/40 dark:border-[#3B82F6]/40 text-[#2563EB] dark:text-[#3B82F6]"
                      : "bg-[#F7F8FA] dark:bg-[#181B22] border-[#E5E7EB] dark:border-[#27272A] text-[#475569] dark:text-[#A1A1AA]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-[13px] truncate text-[#111827] dark:text-[#FAFAFA]">{p.name}</span>
                    {p.isBest && <Check className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6] shrink-0" />}
                  </div>
                  <span className="text-[11px] text-[#94A3B8] dark:text-[#71717A] mt-1">
                    Harm: {Math.round(p.harm).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subtext footer */}
        {stage.subtext && (
          <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#27272A] text-[13px] text-[#94A3B8] dark:text-[#71717A] flex items-center gap-2 font-normal">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
            <span>{stage.subtext}</span>
          </div>
        )}
      </div>
    </div>
  );
};
