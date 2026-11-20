import React from "react";
import { Link } from "@tanstack/react-router";
import { useAppStore } from "@/store/appStore";
import { PRESETS } from "@/engine/plans";
import { Shield, ArrowRight, Droplets, CloudRain, Flame, Zap, Activity } from "lucide-react";

export const Chapter6CallToAction: React.FC = () => {
  const enterSim = useAppStore((s) => s.enterSim);
  const setPreset = useAppStore((s) => s.setPreset);

  const getPresetIcon = (id: string) => {
    switch (id) {
      case "pipeline":
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case "monsoon":
        return <CloudRain className="w-4 h-4 text-blue-400" />;
      case "heatwave":
        return <Flame className="w-4 h-4 text-amber-400" />;
      case "cyber":
        return <Zap className="w-4 h-4 text-violet-400" />;
      case "quake":
        return <Activity className="w-4 h-4 text-rose-400" />;
      default:
        return <Shield className="w-4 h-4 text-cyan-400" />;
    }
  };

  const handleLaunchWithPreset = (presetId: string, triggers: string[]) => {
    setPreset(presetId, triggers);
    enterSim();
    if (typeof window !== "undefined") {
      window.location.href = "/simulator";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col justify-center min-h-[85vh] px-4 sm:px-6 pointer-events-none">
      <div className="pointer-events-auto space-y-6 max-w-2xl text-left">
        {/* Category tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono backdrop-blur-md">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>CIVIC DEFENSE TWIN // LIVE DEPLOYMENT</span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-display leading-[1.08]">
          Take <br />
          <span className="text-cyan-400">command.</span>
        </h2>

        {/* Narrative Copy */}
        <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed max-w-xl">
          Enter the full operational workspace. Scrub hourly timelines, test custom valve isolations, deploy generator buffers, inspect individual urban wards, and formulate resilient emergency response plans.
        </p>

        {/* Main Launch Button */}
        <div className="pt-2">
          <Link
            to="/simulator"
            onClick={enterSim}
            className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono font-bold text-base transition-all shadow-[0_0_30px_rgba(34,211,238,0.35)] hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            <span>LAUNCH SIMULATOR WORKSPACE</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Crisis Preset Quick Jump */}
        <div className="pt-6 space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 block">
            Or launch directly with a crisis preset:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleLaunchWithPreset(preset.id, preset.triggers)}
                className="p-3 rounded-xl bg-[#101418]/80 hover:bg-[#101418] border border-white/10 hover:border-cyan-500/50 flex flex-col items-center text-center gap-1.5 transition-all group backdrop-blur-lg cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform">
                  {getPresetIcon(preset.id)}
                </div>
                <span className="text-xs font-semibold font-mono text-white">{preset.label}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {preset.triggers.length} {preset.triggers.length === 1 ? "trigger" : "triggers"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
