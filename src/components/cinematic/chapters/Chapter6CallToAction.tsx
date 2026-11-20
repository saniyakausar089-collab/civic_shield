import React from "react";
import { Link } from "@tanstack/react-router";
import { useAppStore } from "@/store/appStore";
import { PRESETS } from "@/engine/plans";
import { Shield, ArrowRight, Droplets, CloudRain, Flame, Zap, Activity } from "lucide-react";
import { CINEMATIC_THEME } from "../theme";

interface Chapter6Props {
  reducedMotion?: boolean;
}

export const Chapter6CallToAction: React.FC<Chapter6Props> = () => {
  const enterSim = useAppStore((s) => s.enterSim);
  const setPreset = useAppStore((s) => s.setPreset);

  const getPresetIcon = (id: string) => {
    switch (id) {
      case "pipeline":
        return <Droplets className="w-3.5 h-3.5 text-[#00d1a0]" />;
      case "monsoon":
        return <CloudRain className="w-3.5 h-3.5 text-teal-400" />;
      case "heatwave":
        return <Flame className="w-3.5 h-3.5 text-[#ffb020]" />;
      case "cyber":
        return <Zap className="w-3.5 h-3.5 text-amber-300" />;
      case "quake":
        return <Activity className="w-3.5 h-3.5 text-[#ff2d55]" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-[#00d1a0]" />;
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
    <div className="group relative overflow-hidden rounded-2xl bg-[#060b09]/90 backdrop-blur-2xl border border-[#00d1a0]/40 p-5 shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(0,209,160,0.15)] transition-all duration-300 hover:border-[#00d1a0]/60 hover:-translate-y-1">
      {/* 300ms light sweep */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-300 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="space-y-3.5">
        {/* Category tag */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#00d1a0]/10 border border-[#00d1a0]/30 text-[#00d1a0] text-[10px] font-mono tracking-wider">
            <Shield className="w-3.5 h-3.5 text-[#00d1a0]" />
            <span>OPERATIONAL WORKSPACE</span>
          </div>
          <span className="text-[10px] font-mono text-[#00d1a0] font-semibold">
            READY
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display leading-tight">
          Take{" "}
          <span className="bg-gradient-to-r from-[#00d1a0] to-[#2dffb3] bg-clip-text text-transparent">
            command.
          </span>
        </h2>

        {/* Short copy: two short lines */}
        <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
          Test custom valve isolations, route emergency generators, and safeguard all 150 municipal wards.
        </p>

        {/* Launch Button */}
        <div className="pt-1">
          <Link
            to="/simulator"
            onClick={enterSim}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#00d1a0] to-[#2dffb3] hover:brightness-110 text-[#030605] font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,209,160,0.35)] cursor-pointer active:scale-95 transition-all"
          >
            <span>LAUNCH SIMULATOR WORKSPACE</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Crisis Preset Quick Jump */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block">
            Or launch with crisis preset:
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleLaunchWithPreset(preset.id, preset.triggers)}
                className="p-1.5 rounded-lg bg-black/40 hover:bg-white/10 border border-white/5 hover:border-[#00d1a0]/40 flex flex-col items-center text-center gap-1 transition-all group cursor-pointer"
                title={`${preset.label} (${preset.triggers.length} triggers)`}
              >
                <div className="p-1 rounded bg-white/5 group-hover:scale-110 transition-transform">
                  {getPresetIcon(preset.id)}
                </div>
                <span className="text-[10px] font-semibold font-mono text-slate-300 group-hover:text-white truncate w-full">
                  {preset.label.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
