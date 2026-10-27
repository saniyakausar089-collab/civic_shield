import React from "react";
import { SCROLL_STAGES, type StageInfo } from "./stagesData";
import { ArrowRight, ShieldCheck, Activity, Zap, Droplets, Radio, ChevronDown } from "lucide-react";

interface GlassPanelProps {
  currentStage: number;
  scrollProgress: number;
  onLaunchSimulator: () => void;
  // Dynamic simulation engine values
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

  // Stage 0: Initial cinematic title screen
  if (currentStage === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none z-30">
        <div className="max-w-3xl space-y-6 pointer-events-auto">
          {/* Top Status Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121a24]/80 border border-cyan-500/30 text-cyan-400 font-mono text-xs uppercase tracking-widest backdrop-blur-md shadow-lg shadow-cyan-950/20 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Civic Infrastructure Twin Initialized</span>
          </div>

          {/* Master Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-sans leading-[1.08] drop-shadow-md">
            CivicShield.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-200">
              Break one thing. Watch the city follow.
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-base sm:text-lg text-slate-300 font-sans font-light leading-relaxed">
            A single pipe rupture triggers an interdependent chain reaction through water, power, hospitals and transit. Explore systemic cascades in a continuous 3D flight.
          </p>

          {/* Scroll Cue & Progress bar */}
          <div className="pt-6 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-400">
              <span>Scroll to Begin Descent</span>
              <ChevronDown className="w-4 h-4 text-cyan-400 animate-bounce" />
            </div>
            {/* Visual scroll track preview */}
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-sky-300 transition-all duration-150"
                style={{ width: `${Math.max(5, scrollProgress * 100)}%` }}
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
      <div className="fixed inset-0 flex items-center justify-center p-6 select-none pointer-events-none z-30">
        <div className="max-w-4xl w-full bg-[#0c131c]/85 border border-white/15 rounded-3xl p-8 sm:p-12 backdrop-blur-2xl shadow-2xl space-y-8 pointer-events-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase">
                // EXECUTIVE RESILIENCE WORKSPACE
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-1">
                Take Command of the City
              </h2>
            </div>
            <button
              onClick={onLaunchSimulator}
              className="px-8 py-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-base flex items-center justify-center gap-3 transition-all shadow-xl shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Launch Simulator</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Feature capability tiles - 5 key platform capabilities */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-400">
                <Activity className="w-4 h-4" />
                <span className="text-[11px] font-mono uppercase font-semibold">Monte Carlo</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                200 stochastic runs with P25–P75 confidence envelopes.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Zap className="w-4 h-4" />
                <span className="text-[11px] font-mono uppercase font-semibold">Weak Links</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                Heuristic ranking of single-point cascading bottlenecks.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center gap-1.5 text-sky-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[11px] font-mono uppercase font-semibold">Command Panel</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                Emergency interventions: tankers, generators, and road closures.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center gap-1.5 text-rose-400">
                <span className="text-xs font-mono font-bold">{resilienceScoreValue}/100</span>
                <span className="text-[11px] font-mono uppercase font-semibold">Resilience</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                Composite stress score benchmarked against all presets.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Radio className="w-4 h-4" />
                <span className="text-[11px] font-mono uppercase font-semibold">Voice Brief</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                Speech-synthesized incident debrief and timeline audio.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2">
            <span>Cesium 3D Globe Tileset & Synthetic Three.js Twin</span>
            <span>Zero external dependencies • Framework-free core</span>
          </div>
        </div>
      </div>
    );
  }

  // Stages 1 through 8: Left-aligned glass HUD panel
  return (
    <div className="fixed bottom-8 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 left-6 sm:left-12 max-w-md w-[calc(100vw-3rem)] sm:w-full z-30 select-none pointer-events-none">
      <div className="bg-[#0b1118]/80 border border-white/15 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-4 pointer-events-auto transition-all duration-300">
        {/* Stage Badge & Category */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-widest uppercase text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/40">
            {stage.badge}
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            STAGE 0{currentStage} / 09
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
          {stage.headline}
        </h2>

        {/* Body paragraph */}
        <p className="text-sm text-slate-300 font-sans font-light leading-relaxed">
          {stage.body}
        </p>

        {/* Contextual dynamic live telemetry from Engine */}
        {currentStage === 4 && weakLinkData && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-amber-400 uppercase">
                #1 Weak Link Identified
              </div>
              <div className="text-sm font-semibold text-white">{weakLinkData.name}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-amber-400 font-bold">
                {weakLinkData.score} / 100
              </div>
              <div className="text-[10px] text-slate-400">Criticality Index</div>
            </div>
          </div>
        )}

        {currentStage === 5 && (
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-sky-400 uppercase">
                Eastside Medical Backup
              </div>
              <div className="text-sm font-semibold text-white">Generator Autonomy</div>
            </div>
            <div className="text-right">
              <div className="text-base font-mono text-sky-300 font-bold">
                {hospitalBackupHours}.0 Hours
              </div>
              <div className="text-[10px] text-slate-400">Before Grid Expiry</div>
            </div>
          </div>
        )}

        {currentStage === 7 && failureStats && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-rose-400 uppercase font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Cascade Timeline
              </span>
              <span className="text-white font-bold">HOUR {failureStats.hour}:00</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
              <span>Affected Citizens:</span>
              <span className="text-rose-300 font-semibold">
                {failureStats.affectedPop.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full transition-all duration-200"
                style={{ width: `${(failureStats.hour / 24) * 100}%` }}
              />
            </div>
          </div>
        )}

        {currentStage === 8 && planComparison && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase">
              Response Harm Comparison
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {planComparison.map((p) => (
                <div
                  key={p.id}
                  className={`p-2 rounded-lg border text-xs font-mono flex flex-col justify-between ${
                    p.isBest
                      ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300"
                      : "bg-white/5 border-white/10 text-slate-400"
                  }`}
                >
                  <span className="font-semibold text-[11px] truncate">{p.name}</span>
                  <span className="text-[10px] opacity-80 mt-1">
                    Harm: {Math.round(p.harm).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subtext footer */}
        {stage.subtext && (
          <div className="pt-2 border-t border-white/10 text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>{stage.subtext}</span>
          </div>
        )}
      </div>
    </div>
  );
};
