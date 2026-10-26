import React from "react";
import { Users, Building2, AlertTriangle, Sun, Moon } from "lucide-react";
import { useAppStore, currentSnapshot } from "@/store/appStore";

export const TopStats: React.FC = () => {
  const result = useAppStore((s) => s.result);
  const hour = useAppStore((s) => s.hour);
  const dayNight = useAppStore((s) => s.dayNight);
  const set = useAppStore((s) => s.set);
  const snap = currentSnapshot(result, hour);

  return (
    <header className="absolute top-3 left-3 right-3 z-20 pointer-events-none flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
      {/* Brand & Mode switch */}
      <div className="pointer-events-auto flex items-center justify-between sm:justify-start gap-3 bg-card/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-border shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h1 className="text-sm font-semibold tracking-wide text-foreground">
            CIVIC<span className="text-cyan-400">SHIELD</span>
          </h1>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
            SIM V2.4
          </span>
        </div>
        <button
          onClick={() => set({ dayNight: dayNight === "day" ? "night" : "day" })}
          className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Toggle Day/Night"
          aria-label="Toggle Day/Night"
        >
          {dayNight === "day" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      {/* 3 Stat Cards */}
      <div className="pointer-events-auto grid grid-cols-3 gap-2">
        {/* Residents Without Service */}
        <div className="bg-card/85 backdrop-blur-md px-3 py-2 rounded-xl border border-border shadow-lg flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground truncate">
              Affected
            </div>
            <div className="text-sm sm:text-base font-bold tabular-nums text-foreground">
              {snap.affectedPopulation.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Hospitals Down */}
        <div
          className={`bg-card/85 backdrop-blur-md px-3 py-2 rounded-xl border shadow-lg flex items-center gap-2.5 transition-colors ${
            snap.hospitalsDown > 0 ? "border-pink-500/50 bg-pink-950/20" : "border-border"
          }`}
        >
          <div
            className={`p-1.5 rounded-lg shrink-0 ${
              snap.hospitalsDown > 0
                ? "bg-pink-500/20 text-pink-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground truncate">
              Hospitals Down
            </div>
            <div
              className={`text-sm sm:text-base font-bold tabular-nums ${
                snap.hospitalsDown > 0 ? "text-pink-400" : "text-foreground"
              }`}
            >
              {snap.hospitalsDown} <span className="text-xs font-normal text-muted-foreground">/ 2</span>
            </div>
          </div>
        </div>

        {/* Systems Failed */}
        <div
          className={`bg-card/85 backdrop-blur-md px-3 py-2 rounded-xl border shadow-lg flex items-center gap-2.5 transition-colors ${
            snap.systemsFailed > 0 ? "border-red-500/50 bg-red-950/20" : "border-border"
          }`}
        >
          <div
            className={`p-1.5 rounded-lg shrink-0 ${
              snap.systemsFailed > 0
                ? "bg-red-500/20 text-red-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground truncate">
              Systems Down
            </div>
            <div
              className={`text-sm sm:text-base font-bold tabular-nums ${
                snap.systemsFailed > 0 ? "text-red-400" : "text-foreground"
              }`}
            >
              {snap.systemsFailed} <span className="text-xs font-normal text-muted-foreground">/ 26</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
