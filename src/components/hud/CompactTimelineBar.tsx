import React, { useEffect } from "react";
import { Play, Pause, RotateCcw, FastForward, Clock } from "lucide-react";
import { useAppStore } from "@/store/appStore";

export const CompactTimelineBar: React.FC = () => {
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
    const intervalMs = speed === 4 ? 300 : 1000;
    const timer = setInterval(() => {
      setHour(hour >= 24 ? 0 : hour + 1);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [playing, hour, speed, setHour]);

  const chartData = result.hours;
  const maxPop = Math.max(1, ...chartData.map((h) => h.affectedPopulation));
  const svgWidth = 220;
  const svgHeight = 20;

  const points = chartData.map((d, i) => {
    const x = (i / 24) * svgWidth;
    const y = svgHeight - (d.affectedPopulation / maxPop) * (svgHeight - 4);
    return `${x},${y}`;
  });
  const pathD = `M 0,${svgHeight} L ${points.join(" ")} L ${svgWidth},${svgHeight} Z`;
  const lineD = `M ${points.join(" L ")}`;
  const currentMarkerX = (Math.min(24, hour) / 24) * svgWidth;

  // Actual simulation event markers from engine results
  const currentHourEvents = result.events.filter((e) => e.hour === hour);

  return (
    <div className="h-10 bg-[#191F24] border-t border-[#303941] px-3 flex items-center justify-between gap-3 text-xs text-[#e5e9ec] select-none shrink-0 z-20">
      {/* Playback Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={togglePlay}
          className={`p-1.5 rounded transition-colors ${
            playing
              ? "bg-[#e09f3e] text-[#101418] hover:bg-[#c78024]"
              : "bg-[#9BAA76] text-[#101418] hover:bg-[#8fa06b]"
          }`}
          title={playing ? "Pause Simulation" : "Run Simulation"}
        >
          {playing ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
        </button>

        <button
          onClick={() => setHour(0)}
          className="p-1.5 rounded bg-[#242c33] border border-[#303941] text-[#8a96a1] hover:text-[#f1f4f6] hover:bg-[#2c363f] transition-colors"
          title="Reset to Hour 0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setSpeed(speed === 1 ? 4 : 1)}
          className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition-colors flex items-center gap-1 border ${
            speed === 4
              ? "bg-[#3d2d14] text-[#e09f3e] border-[#e09f3e]/40"
              : "bg-[#242c33] text-[#8a96a1] border-[#303941] hover:text-[#d2d8de]"
          }`}
          title="Simulation Rate"
        >
          <FastForward className="w-3 h-3" />
          {speed}x
        </button>
      </div>

      {/* Discrete 24-Hour Slider */}
      <div className="flex-1 flex items-center gap-3 max-w-xl">
        <div className="flex items-center gap-1 font-mono text-[11px] text-[#9BAA76] shrink-0">
          <Clock className="w-3.5 h-3.5" />
          <span>T+{hour.toString().padStart(2, "0")}:00</span>
        </div>

        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            min={0}
            max={24}
            step={1}
            value={hour}
            onChange={(e) => setHour(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[#242c33] rounded-lg appearance-none cursor-pointer accent-[#9BAA76] focus:outline-none"
          />
        </div>
      </div>

      {/* Simulation Event & Mini Curve Display */}
      <div className="hidden md:flex items-center gap-3 shrink-0">
        <div className="text-[11px] text-[#8a96a1] truncate max-w-[200px]">
          {currentHourEvents.length > 0 && currentHourEvents[0] ? (
            <span className="text-[#ff8f8f] font-mono">⚠️ {currentHourEvents[0].message}</span>
          ) : (
            <span className="font-mono">Steady state analysis</span>
          )}
        </div>

        {/* Mini Sparkline Chart */}
        <div className="relative overflow-hidden rounded bg-[#14191d] px-1 py-0.5 border border-[#303941]">
          <svg
            width={svgWidth}
            height={svgHeight}
            className="w-28 sm:w-36 h-4"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
          >
            <path d={pathD} fill="rgba(155, 170, 118, 0.18)" />
            <path d={lineD} fill="none" stroke="#9BAA76" strokeWidth="1.2" />
            <line
              x1={currentMarkerX}
              y1={0}
              x2={currentMarkerX}
              y2={svgHeight}
              stroke="#d9534f"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
