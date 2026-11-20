import React, { useRef, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useAppStore } from "@/store/appStore";
import { PRESETS } from "@/engine/plans";
import { Shield, ArrowRight, Droplets, CloudRain, Flame, Zap, Activity } from "lucide-react";
import { CINEMATIC_THEME } from "../theme";

interface Chapter6Props {
  reducedMotion?: boolean;
}

export const Chapter6CallToAction: React.FC<Chapter6Props> = ({ reducedMotion }) => {
  const enterSim = useAppStore((s) => s.enterSim);
  const setPreset = useAppStore((s) => s.setPreset);

  // Magnetic button state for desktop
  const buttonRef = useRef<HTMLAnchorElement | null>(null);
  const [btnOffset, setBtnOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (reducedMotion || typeof window === "undefined" || window.innerWidth < 768) return;
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) * 0.25;
      const deltaY = (e.clientY - centerY) * 0.25;
      setBtnOffset({ x: deltaX, y: deltaY });
    },
    [reducedMotion]
  );

  const handleMouseLeave = useCallback(() => {
    setBtnOffset({ x: 0, y: 0 });
  }, []);

  const getPresetIcon = (id: string) => {
    switch (id) {
      case "pipeline":
        return <Droplets className="w-3.5 h-3.5 text-fuchsia-400" />;
      case "monsoon":
        return <CloudRain className="w-3.5 h-3.5 text-purple-400" />;
      case "heatwave":
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      case "cyber":
        return <Zap className="w-3.5 h-3.5 text-rose-400" />;
      case "quake":
        return <Activity className="w-3.5 h-3.5 text-[#ff2d55]" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-fuchsia-400" />;
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
    <div className="group relative overflow-hidden rounded-2xl bg-[#0a0612]/90 backdrop-blur-2xl border border-fuchsia-500/40 p-5 shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(192,38,211,0.2)] transition-all duration-300 hover:border-fuchsia-500/60 hover:-translate-y-1">
      {/* Shimmer light sweep */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="space-y-4">
        {/* Category tag */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-[10px] font-mono tracking-wider">
            <Shield className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>OPERATIONAL WORKSPACE</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold">
            READY
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display leading-tight">
          Take{" "}
          <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
            command.
          </span>
        </h2>

        {/* Streamlined Narrative Copy */}
        <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
          Test custom valve isolations, route emergency generators, and inspect all 150 municipal wards.
        </p>

        {/* Magnetic Launch Button (desktop) */}
        <div className="pt-1">
          <Link
            to="/simulator"
            ref={buttonRef}
            onClick={enterSim}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `translate3d(${btnOffset.x}px, ${btnOffset.y}px, 0)`,
              transition: btnOffset.x === 0 && btnOffset.y === 0 ? "transform 0.4s ease-out" : "transform 0.1s ease-out",
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(192,38,211,0.4)] hover:shadow-[0_0_35px_rgba(192,38,211,0.6)] cursor-pointer active:scale-95 transition-shadow"
          >
            <span>LAUNCH SIMULATOR WORKSPACE</span>
            <ArrowRight className="w-4 h-4 animate-pulse" />
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
                className="p-1.5 rounded-lg bg-black/40 hover:bg-white/10 border border-white/5 hover:border-fuchsia-500/40 flex flex-col items-center text-center gap-1 transition-all group cursor-pointer"
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
