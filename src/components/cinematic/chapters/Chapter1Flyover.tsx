import React from "react";
import { Droplets, Zap, Activity, ChevronRight } from "lucide-react";
import { CINEMATIC_THEME } from "../theme";

export const Chapter1Flyover: React.FC = () => {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-[#0a0612]/85 backdrop-blur-2xl border border-white/10 p-5 shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(192,38,211,0.1)] transition-all duration-300 hover:border-fuchsia-500/40 hover:-translate-y-1">
      {/* Shimmer light sweep on hover */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="space-y-4">
        {/* Category tag */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-[10px] font-mono tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34f5a5] animate-pulse" />
            <span>GEO-TWIN // NOMINAL STATE</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">HYD CORE</span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display leading-tight">
          A city that{" "}
          <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
            works.
          </span>
        </h2>

        {/* Streamlined Narrative Copy */}
        <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
          Ten million residents linked by continuous water trunks, 220kV power corridors, and trauma networks operating at peak synchronization.
        </p>

        {/* Slim Stat Chips */}
        <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 transition-all group-hover:border-white/10">
            <div className="flex items-center gap-1.5 text-emerald-400 mb-0.5">
              <Droplets className="w-3.5 h-3.5" />
              <span className="text-[9px] uppercase tracking-wider text-slate-400">Water</span>
            </div>
            <div className="text-xs font-bold text-white">410 ML/d</div>
            <span className="text-[9px] text-emerald-400 font-semibold">ONLINE</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 transition-all group-hover:border-white/10">
            <div className="flex items-center gap-1.5 text-emerald-400 mb-0.5">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-[9px] uppercase tracking-wider text-slate-400">Grid</span>
            </div>
            <div className="text-xs font-bold text-white">1,840 MW</div>
            <span className="text-[9px] text-emerald-400 font-semibold">ONLINE</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 transition-all group-hover:border-white/10">
            <div className="flex items-center gap-1.5 text-emerald-400 mb-0.5">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[9px] uppercase tracking-wider text-slate-400">Trauma</span>
            </div>
            <div className="text-xs font-bold text-white">6 Hubs</div>
            <span className="text-[9px] text-emerald-400 font-semibold">ONLINE</span>
          </div>
        </div>

        {/* Prompt hint */}
        <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-white/5">
          <span>Scroll to trigger systemic shock</span>
          <ChevronRight className="w-3 h-3 text-fuchsia-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
