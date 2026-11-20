import React, { useMemo } from "react";
import { AlertCircle, Clock, Users, Building2, Flame, Droplets, Zap, Radio, Car } from "lucide-react";

interface Chapter3Props {
  progress: number; // 0.0 to 1.0 within chapter 3
}

export const Chapter3ChainReaction: React.FC<Chapter3Props> = ({ progress }) => {
  // Compute T+ hour from 0 to 14
  const hour = useMemo(() => {
    return Math.min(14, Math.floor(progress * 14));
  }, [progress]);

  // Compute residents affected counting smoothly up to 4,28,000
  const affectedResidents = useMemo(() => {
    const target = 428000;
    const current = Math.floor(Math.min(1, progress * 1.08) * target);
    return current.toLocaleString("en-IN");
  }, [progress]);

  // Hospital status based on hour
  const hospitalStatus = useMemo(() => {
    if (hour < 2) return { text: "GRID POWER (STRESSED)", color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30" };
    if (hour < 11) return { text: "DIESEL BACKUP (GENERATORS)", color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30" };
    return { text: "OFFLINE // WATER & POWER EXHAUSTED", color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/40" };
  }, [hour]);

  // Dynamic failure milestones
  const milestones = [
    { hour: 1, asset: "East Underpass (UJ1)", desc: "Flooded by water surge • 2 ambulance lanes submerged", icon: Car, failed: hour >= 1 },
    { hour: 3, asset: "Pump Station A", desc: "Suction head lost • Supply to East Hospital reservoir cut", icon: Droplets, failed: hour >= 3 },
    { hour: 6, asset: "Central Substation (SUB2)", desc: "Cooling system failed • 220kV bus trips on thermal overload", icon: Zap, failed: hour >= 6 },
    { hour: 9, asset: "Telecom Tower 2 (T2)", desc: "Battery backup exhausted • Dispatch telemetry blind", icon: Radio, failed: hour >= 9 },
    { hour: 11, asset: "City General Hospital (H1)", desc: "Water dry, emergency gens shut down • ICU transferred", icon: Building2, failed: hour >= 11 },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col justify-center min-h-[85vh] px-4 sm:px-6 pointer-events-none">
      <div className="pointer-events-auto space-y-5 max-w-2xl">
        {/* Category tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono backdrop-blur-md">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span>CASCADE DYNAMICS // INTERDEPENDENT SIMULATION</span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-display leading-[1.08]">
          The chain <br />
          <span className="text-red-400">reaction.</span>
        </h2>

        {/* Narrative Copy */}
        <p className="text-base sm:text-lg text-slate-300 font-sans leading-relaxed max-w-xl">
          Infrastructure never fails in isolation. Flooding drowns road junctions; pumps fail without water pressure; substations overheat without pumps; hospitals lose life-support reserves.
        </p>

        {/* Realtime Scrub Ticker Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
          {/* T+ Clock Card */}
          <div className="p-4 rounded-2xl bg-[#101418]/90 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">
                INCIDENT TIMELINE
              </span>
              <div className="text-3xl font-extrabold text-white flex items-center gap-2">
                <Clock className="w-6 h-6 text-red-400" />
                <span>T+{String(hour).padStart(2, "0")}:00h</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">HORIZON</span>
              <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                24h Window
              </span>
            </div>
          </div>

          {/* Residents without service */}
          <div className="p-4 rounded-2xl bg-[#101418]/90 backdrop-blur-xl border border-red-500/30 shadow-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">
                RESIDENTS WITHOUT SERVICE
              </span>
              <div className="text-3xl font-extrabold text-red-400 flex items-center gap-2">
                <Users className="w-6 h-6 text-red-400" />
                <span>{affectedResidents}</span>
              </div>
            </div>
            <span className="text-[10px] text-red-300/80 font-bold px-2 py-1 rounded bg-red-500/20 border border-red-500/30 animate-pulse">
              +CRITICAL
            </span>
          </div>
        </div>

        {/* Hospital Crisis Callout */}
        <div className={`p-4 rounded-2xl bg-[#101418]/90 backdrop-blur-xl border ${hospitalStatus.border} shadow-2xl transition-all duration-300`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Building2 className={`w-4 h-4 ${hospitalStatus.color}`} />
              <span className="text-xs font-mono font-bold text-white tracking-wider">
                FACILITY IMPACT // CITY GENERAL HOSPITAL (H1)
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${hospitalStatus.bg} ${hospitalStatus.color} border ${hospitalStatus.border}`}>
              {hospitalStatus.text}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400">
            {hour < 11
              ? "East Underpass flooding blocks arterial ambulances. Backup diesel generation supplying intensive care."
              : "Diesel generators tripped at T+11h after pump intake dry run. Facility declared OFFLINE. 850 emergency patients critical."}
          </p>
        </div>

        {/* Milestone Sequence */}
        <div className="space-y-1.5 pt-1">
          {milestones.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.asset}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all duration-300 border ${
                  m.failed
                    ? "bg-red-500/10 border-red-500/30 text-slate-200"
                    : "bg-white/[0.02] border-white/5 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${m.failed ? "bg-red-400 shadow-[0_0_6px_#ef4444]" : "bg-slate-700"}`} />
                  <Icon className={`w-3.5 h-3.5 ${m.failed ? "text-red-400" : "text-slate-600"}`} />
                  <span className={`font-semibold ${m.failed ? "text-white" : "text-slate-500"}`}>{m.asset}</span>
                </div>
                <span className={`text-[11px] ${m.failed ? "text-red-300" : "text-slate-600"}`}>
                  {m.failed ? `FAILED T+${m.hour}h` : `Protected`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
