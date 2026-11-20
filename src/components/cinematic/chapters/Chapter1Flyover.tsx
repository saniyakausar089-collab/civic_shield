import React from "react";
import { Shield, Activity, Zap, Droplets, Radio, Navigation } from "lucide-react";

export const Chapter1Flyover: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col justify-center min-h-[75vh] px-4 sm:px-6 pointer-events-none">
      <div className="pointer-events-auto space-y-6 max-w-2xl">
        {/* Category tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>CIVICSHIELD // GEOSPATIAL INFRASTRUCTURE TWIN</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-display leading-[1.08]">
          A city that <br />
          <span className="text-cyan-400">works.</span>
        </h1>

        {/* Narrative Copy */}
        <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed max-w-xl">
          Every morning, ten million residents rely on invisible connections: water flowing through pressure mains, 220kV power lines, fiber backbones, and rapid transit routes feeding emergency centers.
        </p>

        {/* Glass Status Telemetry Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3.5 rounded-2xl bg-[#101418]/80 backdrop-blur-xl border border-white/10 shadow-xl">
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
              <Droplets className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Water Trunk</span>
            </div>
            <div className="text-lg font-bold font-mono text-white">410 ML/d</div>
            <span className="text-[10px] font-mono text-emerald-400">NOMINAL (100%)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#101418]/80 backdrop-blur-xl border border-white/10 shadow-xl">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Power Grid</span>
            </div>
            <div className="text-lg font-bold font-mono text-white">1,840 MW</div>
            <span className="text-[10px] font-mono text-emerald-400">STABLE (50 Hz)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#101418]/80 backdrop-blur-xl border border-white/10 shadow-xl">
            <div className="flex items-center gap-2 text-violet-400 mb-1">
              <Radio className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Telecom Core</span>
            </div>
            <div className="text-lg font-bold font-mono text-white">99.99%</div>
            <span className="text-[10px] font-mono text-emerald-400">OPERATIONAL</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#101418]/80 backdrop-blur-xl border border-white/10 shadow-xl">
            <div className="flex items-center gap-2 text-rose-400 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Trauma Centers</span>
            </div>
            <div className="text-lg font-bold font-mono text-white">READY</div>
            <span className="text-[10px] font-mono text-emerald-400">GREEN STATUS</span>
          </div>
        </div>

        {/* Scroll down prompt */}
        <div className="pt-2 flex items-center gap-2 text-xs font-mono text-slate-400">
          <Navigation className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
          <span>Scroll to initiate systemic pressure rupture...</span>
        </div>
      </div>
    </div>
  );
};
