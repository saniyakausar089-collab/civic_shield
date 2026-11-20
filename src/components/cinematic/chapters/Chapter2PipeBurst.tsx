import React from "react";
import { AlertTriangle, Droplets, Gauge, Clock } from "lucide-react";

export const Chapter2PipeBurst: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col justify-center min-h-[75vh] px-4 sm:px-6 pointer-events-none">
      <div className="pointer-events-auto space-y-6 max-w-2xl">
        {/* Category tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono backdrop-blur-md">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span>INCIDENT TRIGGER // T+00:00</span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-display leading-[1.08]">
          One pipe <br />
          <span className="text-red-400">bursts.</span>
        </h2>

        {/* Narrative Copy */}
        <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed max-w-xl">
          At 04:00, the 92-year-old cast-iron Main Pipeline (<span className="text-white font-mono font-semibold">PIPE1</span>) suffers an immediate structural rupture. 220 million liters of pressurized water begins inundating the eastern arterial corridor.
        </p>

        {/* Glass Asset Telemetry Card */}
        <div className="p-5 rounded-2xl bg-[#101418]/85 backdrop-blur-xl border border-red-500/30 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold font-mono text-white">PIPE1 // MAIN PIPELINE</h4>
                <p className="text-[11px] font-mono text-slate-400">17.370° N, 78.480° E • Built 1934 (Age: 92 yrs)</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 font-mono text-[11px] font-bold border border-red-500/40 animate-pulse">
              RUPTURED
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[10px] text-slate-500 block mb-0.5">LINE PRESSURE</span>
              <span className="text-red-400 font-bold text-sm">0.0 BAR</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[10px] text-slate-500 block mb-0.5">CAPACITY LOST</span>
              <span className="text-white font-bold text-sm">220 ML/d</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
              <span className="text-[10px] text-slate-500 block mb-0.5">SPILL HAZARD</span>
              <span className="text-amber-400 font-bold text-sm">East Underpass</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
