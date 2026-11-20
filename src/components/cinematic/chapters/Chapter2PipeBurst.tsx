import React from "react";
import { Gauge, Droplets, AlertCircle } from "lucide-react";
import { CINEMATIC_THEME } from "../theme";

export const Chapter2PipeBurst: React.FC = () => {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-[#060b09]/90 backdrop-blur-2xl border border-red-500/40 p-5 shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(255,45,85,0.2)] transition-all duration-300 hover:border-red-500/60 hover:-translate-y-1">
      {/* 300ms light sweep */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-300 bg-gradient-to-r from-transparent via-red-500/10 to-transparent" />

      <div className="space-y-3.5">
        {/* Category tag */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-red-300 text-[10px] font-mono tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff2d55] shadow-[0_0_6px_#ff2d55] animate-ping" />
            <span>TRIGGER // T+00:00h</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono text-[9px] font-bold border border-red-500/40">
            OFFLINE
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display leading-tight">
          One pipe{" "}
          <span className="text-[#ff2d55] drop-shadow-[0_0_12px_rgba(255,45,85,0.4)]">
            bursts.
          </span>
        </h2>

        {/* Short copy: two short lines */}
        <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
          At 04:00, 92-year-old trunk <span className="text-white font-mono font-semibold">PIPE1</span> ruptures. 220 ML/d floods into the eastern arterial underpass.
        </p>

        {/* Slim Critical Telemetry Chips */}
        <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
          <div className="p-2.5 rounded-xl bg-black/40 border border-red-500/20">
            <div className="flex items-center gap-1 text-red-400 mb-0.5">
              <Gauge className="w-3.5 h-3.5" />
              <span className="text-[9px] text-slate-400 uppercase">Pressure</span>
            </div>
            <div className="text-xs font-bold text-red-400">0.0 BAR</div>
            <span className="text-[9px] text-red-400 font-semibold">OFFLINE</span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-red-500/20">
            <div className="flex items-center gap-1 text-amber-400 mb-0.5">
              <Droplets className="w-3.5 h-3.5" />
              <span className="text-[9px] text-slate-400 uppercase">Lost</span>
            </div>
            <div className="text-xs font-bold text-white">220 ML/d</div>
            <span className="text-[9px] text-amber-400 font-semibold">SURGE</span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-red-500/20">
            <div className="flex items-center gap-1 text-red-400 mb-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-[9px] text-slate-400 uppercase">Blocked</span>
            </div>
            <div className="text-xs font-bold text-red-300 truncate">East Underpass</div>
            <span className="text-[9px] text-red-400 font-semibold">SEVERED</span>
          </div>
        </div>

        {/* Impact footer */}
        <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-white/5">
          <span className="text-red-300">Ambulance route submerged</span>
          <span className="text-slate-500">Trace cascade below</span>
        </div>
      </div>
    </div>
  );
};
