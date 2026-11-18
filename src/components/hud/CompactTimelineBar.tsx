import React, { useEffect } from "react";
import { Play, Pause, RotateCcw, FastForward, Clock } from "lucide-react";
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
  const svgWidth = 140;
  const svgHeight = 18;

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

  // Event Ticker
  const eventsUpToT = result && Array.isArray(result.events) ? result.events.filter((e) => e.t <= t) : [];
  const latestEvent = eventsUpToT.length > 0 ? eventsUpToT[eventsUpToT.length - 1] : null;

  const tickerText = latestEvent
    ? `Hour ${latestEvent.t} — ${latestEvent.text}`
    : result
    ? `Hour ${t} — Normal operations`
    : `Hour 0 — Ready to simulate`;

  const nextSpeed = (s: 1 | 2 | 4): 1 | 2 | 4 => (s === 1 ? 2 : s === 2 ? 4 : 1);

  return (
    <div className="h-12 bg-[var(--surface)] border-t border-[var(--border)] px-4 sm:px-6 flex items-center justify-between gap-4 text-xs text-[var(--text)] select-none shrink-0 z-20 font-sans shadow-xs transition-colors">
      {/* 1. Playback Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Round Play Button in Accent */}
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          title={playing ? "Pause Simulation" : "Run Simulation"}
          aria-label={playing ? "Pause Simulation" : "Run Simulation"}
        >
          {playing ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Reset Round Pill Button */}
        <button
          onClick={() => resetSim()}
          className="w-8 h-8 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text)] flex items-center justify-center transition-colors cursor-pointer"
          title="Reset Simulation (Hour 0)"
          aria-label="Reset Simulation (Hour 0)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Small Muted Speed Chip */}
        <button
          onClick={() => setSpeed(nextSpeed(speed))}
          className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border)] transition-colors flex items-center gap-1 cursor-pointer"
          title="Toggle Simulation Speed (1x / 2x / 4x)"
        >
          <FastForward className="w-3 h-3 text-[var(--text-tertiary)]" />
          {speed}x
        </button>
      </div>

      {/* 2. Discrete 24-Hour Slider (Thin 4px Track + Accent Thumb) */}
      <div className="flex-1 flex items-center gap-3.5 max-w-xl">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] shrink-0 tabular-nums">
          <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
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
            className="w-full h-1 bg-[var(--border)] rounded-full appearance-none cursor-pointer accent-[var(--accent)] focus:outline-none transition-all"
            title="Drag slider to scrub simulation hour"
          />
        </div>
      </div>

      {/* 3. Quiet Status Label & Mini Sparkline */}
      <div className="hidden md:flex items-center gap-3.5 shrink-0">
        {/* Quiet Status Label */}
        <button
          onClick={() => setActiveTab("simulate")}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text)] truncate max-w-[280px] text-left transition-colors cursor-pointer"
          title="Click to view full event log in Simulate tab"
        >
          <span className="truncate">{tickerText}</span>
        </button>

        {/* Mini Sparkline Chart */}
        <div
          className="relative overflow-hidden rounded-full bg-[var(--surface-2)] px-2 py-1 border border-[var(--border)]"
          title={`Affected Population Curve (Hour ${t}: ${
            result?.frames?.[t]?.affected_pop.toLocaleString("en-IN") || 0
          })`}
        >
          <svg
            width={svgWidth}
            height={svgHeight}
            className="w-28 sm:w-32 h-3.5"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
          >
            <path d={pathD} fill="var(--accent-tint)" />
            <path d={lineD} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
            <line
              x1={currentMarkerX}
              y1={0}
              x2={currentMarkerX}
              y2={svgHeight}
              stroke="var(--status-danger)"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
