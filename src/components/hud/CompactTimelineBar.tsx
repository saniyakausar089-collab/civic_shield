import React, { useEffect } from "react";
import { Play, Pause, RotateCcw, FastForward, Clock, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store/appStore";

export const CompactTimelineBar: React.FC = () => {
  const t = useAppStore((s) => s.t);
  const playing = useAppStore((s) => s.playing);
  const speed = useAppStore((s) => s.speed);
  const result = useAppStore((s) => s.result);
  const setT = useAppStore((s) => s.setT);
  const play = useAppStore((s) => s.play);
  const pause = useAppStore((s) => s.pause);
  const togglePlay = useAppStore((s) => s.togglePlay);
  const setSpeed = useAppStore((s) => s.setSpeed);
  const resetSim = useAppStore((s) => s.resetSim);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  // Playback timer
  useEffect(() => {
    if (!playing) return;
    const intervalMs = Math.round(1000 / speed);
    const timer = setInterval(() => {
      const curT = useAppStore.getState().t;
      if (curT >= 24) {
        pause();
      } else {
        setT(curT + 1);
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [playing, speed, pause, setT]);

  // Sparkline
  const svgWidth = 160;
  const svgHeight = 20;

  let pathD = `M 0,${svgHeight - 2} L ${svgWidth},${svgHeight - 2}`;
  let lineD = `M 0,${svgHeight - 2} L ${svgWidth},${svgHeight - 2}`;

  if (result && Array.isArray(result.frames) && result.frames.length > 0) {
    const popList = result.frames.map((f) => f.affected_pop);
    const maxPop = Math.max(1, ...popList);
    const points = popList.map((pop, i) => {
      const x = (i / 24) * svgWidth;
      const y = svgHeight - (pop / maxPop) * (svgHeight - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    lineD = `M ${points.join(" L ")}`;
    pathD = `M 0,${svgHeight} L ${points.join(" L ")} L ${svgWidth},${svgHeight} Z`;
  }

  const currentMarkerX = (Math.min(24, Math.max(0, t)) / 24) * svgWidth;

  // Ticker
  const eventsUpToT = result && Array.isArray(result.events) ? result.events.filter((e) => e.t <= t) : [];
  const latestEvent = eventsUpToT.length > 0 ? eventsUpToT[eventsUpToT.length - 1] : null;

  const tickerText = latestEvent
    ? `Hour ${latestEvent.t} — ${latestEvent.text}`
    : result
    ? `Hour ${t} — Normal operations`
    : `Hour 0 — Ready to simulate`;

  const nextSpeed = (s: 1 | 2 | 4): 1 | 2 | 4 => (s === 1 ? 2 : s === 2 ? 4 : 1);

  return (
    <div className="h-11 bg-white dark:bg-[#111318] border-t border-[#E5E7EB] dark:border-[#27272A] px-4 flex items-center justify-between gap-4 text-xs text-[#111827] dark:text-[#FAFAFA] select-none shrink-0 z-20 font-sans shadow-xs">
      {/* Playback Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={togglePlay}
          className={`p-2 rounded-lg transition-all duration-180 cursor-pointer shadow-xs active:scale-[0.98] ${
            playing
              ? "bg-amber-600 text-white hover:bg-amber-700"
              : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
          }`}
          title={playing ? "Pause Simulation" : "Run / Resume Simulation"}
        >
          {playing ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        <button
          onClick={() => resetSim()}
          className="p-2 rounded-lg bg-white dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] text-[#94A3B8] dark:text-[#71717A] hover:text-[#111827] dark:hover:text-[#FAFAFA] hover:bg-[#F7F8FA] dark:hover:bg-[#20242D] transition-colors cursor-pointer"
          title="Reset Simulation (Reset T+0)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setSpeed(nextSpeed(speed))}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 border cursor-pointer ${
            speed > 1
              ? "bg-[#2563EB]/10 dark:bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#3B82F6] border-[#2563EB]/30 dark:border-[#3B82F6]/40"
              : "bg-white dark:bg-[#181B22] text-[#94A3B8] dark:text-[#71717A] border-[#E5E7EB] dark:border-[#27272A] hover:text-[#111827] dark:hover:text-[#FAFAFA] hover:bg-[#F7F8FA] dark:hover:bg-[#20242D]"
          }`}
          title="Simulation Rate (1x / 2x / 4x)"
        >
          <FastForward className="w-3 h-3" />
          {speed}x
        </button>
      </div>

      {/* Discrete 24-Hour Slider (Bound to t) */}
      <div className="flex-1 flex items-center gap-3.5 max-w-xl">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#2563EB] dark:text-[#3B82F6] shrink-0 bg-[#F7F8FA] dark:bg-[#181B22] px-2.5 py-1 rounded-lg border border-[#E5E7EB] dark:border-[#27272A]">
          <Clock className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
          <span>T+{t.toString().padStart(2, "0")}:00</span>
        </div>

        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            min={0}
            max={24}
            step={1}
            value={t}
            onChange={(e) => setT(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[#E5E7EB] dark:bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-[#2563EB] dark:accent-[#3B82F6] focus:outline-none"
            title="Drag slider to scrub simulation hour"
          />
        </div>
      </div>

      {/* Simulation Event Ticker & Mini Sparkline */}
      <div className="hidden md:flex items-center gap-3.5 shrink-0">
        {/* Clickable Event Ticker */}
        <button
          onClick={() => setActiveTab("simulate")}
          className="text-[12px] text-[#475569] dark:text-[#A1A1AA] hover:text-[#111827] dark:hover:text-[#FAFAFA] truncate max-w-[280px] text-left transition-colors flex items-center gap-2 cursor-pointer bg-[#F7F8FA] dark:bg-[#181B22] px-2.5 py-1 rounded-lg border border-[#E5E7EB] dark:border-[#27272A]"
          title="Click to view full event log in Simulate tab"
        >
          <AlertTriangle
            className={`w-3.5 h-3.5 shrink-0 ${
              latestEvent?.kind === "trigger"
                ? "text-rose-600 dark:text-rose-400"
                : latestEvent?.kind === "cascade"
                ? "text-amber-600 dark:text-amber-400"
                : "text-[#94A3B8] dark:text-[#71717A]"
            }`}
          />
          <span className="truncate">{tickerText}</span>
        </button>

        {/* Mini Sparkline Chart */}
        <div
          className="relative overflow-hidden rounded-lg bg-[#F7F8FA] dark:bg-[#181B22] px-1.5 py-1 border border-[#E5E7EB] dark:border-[#27272A]"
          title={`Affected Population Curve (Hour ${t}: ${
            result?.frames?.[t]?.affected_pop.toLocaleString("en-IN") || 0
          })`}
        >
          <svg
            width={svgWidth}
            height={svgHeight}
            className="w-28 sm:w-36 h-4"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
          >
            <path d={pathD} fill="rgba(37, 99, 235, 0.2)" />
            <path d={lineD} fill="none" stroke="#2563EB" strokeWidth="1.5" />
            <line
              x1={currentMarkerX}
              y1={0}
              x2={currentMarkerX}
              y2={svgHeight}
              stroke="#EF4444"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
