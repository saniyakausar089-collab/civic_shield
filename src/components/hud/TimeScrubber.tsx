import React, { useEffect } from "react";
import { Play, Pause, RotateCcw, FastForward } from "lucide-react";
import { useAppStore } from "@/store/appStore";

export const TimeScrubber: React.FC = () => {
  const hour = useAppStore((s) => s.hour);
  const playing = useAppStore((s) => s.playing);
  const speed = useAppStore((s) => s.speed);
  const result = useAppStore((s) => s.result);
  const setHour = useAppStore((s) => s.setHour);
  const togglePlay = useAppStore((s) => s.togglePlay);
  const setSpeed = useAppStore((s) => s.setSpeed);

  // Auto-play timer
  useEffect(() => {
    if (!playing) return;
    const intervalMs = speed === 4 ? 250 : 1000;
    const timer = setInterval(() => {
      setHour(hour >= 24 ? 0 : hour + 1);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [playing, hour, speed, setHour]);

  // Sparkline data
  const chartData = result.hours;
  const maxPop = Math.max(1, ...chartData.map((h) => h.affectedPopulation));
  const chartWidth = 260;
  const chartHeight = 28;

  const points = chartData.map((d, i) => {
    const x = (i / 24) * chartWidth;
    const y = chartHeight - (d.affectedPopulation / maxPop) * (chartHeight - 4);
    return `${x},${y}`;
  });
  const pathD = `M 0,${chartHeight} L ${points.join(" ")} L ${chartWidth},${chartHeight} Z`;
  const lineD = `M ${points.join(" L ")}`;

  const currentMarkerX = (Math.min(24, hour) / 24) * chartWidth;

  return (
    <div className="bg-card/90 backdrop-blur-md rounded-2xl border border-border shadow-xl p-3 max-w-lg w-full mx-auto">
      {/* Top Row: Mini Chart & Current Hour Indicator */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50">
            T+{hour.toString().padStart(2, "0")}h
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            {chartData[hour]?.affectedPopulation.toLocaleString()} residents affected
          </span>
        </div>

        {/* Mini Sparkline Chart */}
        <div className="relative overflow-hidden rounded bg-muted/40 px-1 py-0.5">
          <svg
            width={chartWidth}
            height={chartHeight}
            className="w-32 sm:w-44 h-7"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
          >
            <path d={pathD} fill="rgba(6, 182, 212, 0.15)" />
            <path d={lineD} fill="none" stroke="#06b6d4" strokeWidth="1.5" />
            {/* Current Hour Indicator Line */}
            <line
              x1={currentMarkerX}
              y1={0}
              x2={currentMarkerX}
              y2={chartHeight}
              stroke="#ef4444"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* Scrubber Controls */}
      <div className="flex items-center gap-2">
        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm shrink-0"
          title={playing ? "Pause" : "Play"}
          aria-label={playing ? "Pause simulation" : "Play simulation"}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        {/* Reset Hour to 0 */}
        <button
          onClick={() => {
            setHour(0);
          }}
          className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-accent transition-colors shrink-0"
          title="Reset to Hour 0"
          aria-label="Reset to Hour 0"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* 1x / 4x Speed */}
        <button
          onClick={() => setSpeed(speed === 1 ? 4 : 1)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-colors shrink-0 flex items-center gap-1 border ${
            speed === 4
              ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
              : "bg-secondary text-muted-foreground border-border hover:text-foreground"
          }`}
          title="Playback speed"
        >
          <FastForward className="w-3 h-3" />
          {speed}x
        </button>

        {/* Range Scrubber */}
        <div className="relative flex-1 flex items-center">
          <input
            type="range"
            min={0}
            max={24}
            step={1}
            value={hour}
            onChange={(e) => setHour(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            aria-label="Simulation hour scrubber"
          />
        </div>
      </div>
    </div>
  );
};
