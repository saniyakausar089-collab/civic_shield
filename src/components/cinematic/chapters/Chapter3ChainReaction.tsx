import React, { useMemo, useState, useEffect } from "react";
import { Clock, Users, Building2, AlertOctagon } from "lucide-react";
import { CINEMATIC_THEME } from "../theme";

interface Chapter3Props {
  progress: number;
}

export const Chapter3ChainReaction: React.FC<Chapter3Props> = ({ progress }) => {
  const hour = useMemo(() => {
    return Math.min(14, Math.floor(progress * 14));
  }, [progress]);

  const targetResidents = useMemo(() => {
    return Math.floor(Math.min(1, progress * 1.08) * 428000);
  }, [progress]);

  const [glitchText, setGlitchText] = useState<string>("");

  useEffect(() => {
    const chars = "0123456789";
    const raw = targetResidents.toLocaleString("en-IN");
    if (progress > 0.05 && progress < 0.95 && Math.random() > 0.4) {
      const scrambled = raw
        .split("")
        .map((c) => (c !== "," && Math.random() > 0.6 ? chars[Math.floor(Math.random() * chars.length)] : c))
        .join("");
      setGlitchText(scrambled);
      const timer = setTimeout(() => setGlitchText(raw), 80);
      return () => clearTimeout(timer);
    } else {
      setGlitchText(raw);
    }
  }, [targetResidents, progress]);

  const hospitalStatus = useMemo(() => {
    if (hour < 2) return { text: "GRID (STRESSED)", color: "text-[#ffb020]", bg: "bg-amber-500/15", border: "border-amber-500/40" };
    if (hour < 11) return { text: "DIESEL BACKUP", color: "text-[#ffb020]", bg: "bg-amber-500/15", border: "border-amber-500/40" };
    return { text: "OFFLINE // 850 AT RISK", color: "text-[#ff2d55]", bg: "bg-red-500/20", border: "border-red-500/50" };
  }, [hour]);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-[#060b09]/90 backdrop-blur-2xl border border-red-500/40 p-5 shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(255,45,85,0.2)] transition-all duration-300 hover:border-red-500/60 hover:-translate-y-1">
      {/* 300ms light sweep */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-300 bg-gradient-to-r from-transparent via-red-500/10 to-transparent" />

      <div className="space-y-3.5">
        {/* Category tag */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-red-300 text-[10px] font-mono tracking-wider">
            <AlertOctagon className="w-3.5 h-3.5 text-[#ff2d55] animate-pulse" />
            <span>CASCADE DYNAMICS</span>
          </div>
          <span className="text-[10px] font-mono text-[#ffb020] font-bold">
            SPREADING
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display leading-tight">
          The chain{" "}
          <span className="text-[#ff2d55] drop-shadow-[0_0_12px_rgba(255,45,85,0.4)]">
            reaction.
          </span>
        </h2>

        {/* Short copy: two short lines */}
        <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
          Floods drown roads; pumps stall; substations overheat; hospitals lose life-support reserves.
        </p>

        {/* Metric Chips */}
        <div className="grid grid-cols-2 gap-2 font-mono">
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-0.5">TIMELINE</span>
            <div className="text-lg font-extrabold text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#ffb020]" />
              <span>T+{String(hour).padStart(2, "0")}:00h</span>
            </div>
            <span className="text-[9px] text-slate-500">24h Horizon</span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-red-500/20">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-0.5">POPULATION CUT OFF</span>
            <div className="text-lg font-extrabold text-[#ff2d55] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#ff2d55]" />
              <span className="font-mono tracking-tight">{glitchText || targetResidents.toLocaleString("en-IN")}</span>
            </div>
            <span className="text-[9px] text-red-400 font-semibold">+CRITICAL BURDEN</span>
          </div>
        </div>

        {/* Hospital Crisis Callout */}
        <div className={`p-3 rounded-xl bg-black/50 border ${hospitalStatus.border} transition-all duration-300 space-y-1.5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Building2 className={`w-3.5 h-3.5 ${hospitalStatus.color}`} />
              <span className="text-[11px] font-mono font-bold text-white">City General Hospital (H1)</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${hospitalStatus.bg} ${hospitalStatus.color} border ${hospitalStatus.border}`}>
              {hospitalStatus.text}
            </span>
          </div>
          <p className="text-[10px] font-mono text-slate-300 leading-tight">
            {hour < 11
              ? "Ambulance artery severed. Backup generators supplying trauma ICU."
              : "City General Hospital: diesel generators tripped at T+11h, 850 patients at risk."}
          </p>
        </div>
      </div>
    </div>
  );
};
