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

  // Playback timer (Requirement 3: 1 hour per second at 1x, 2x/4x faster, stops at t=24 and flips Pause back to Play)
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

  // Requirement 7: Sparkline (plot frames[].affected_pop across 0..24 with marker at current t)
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

  // Requirement 6: Ticker (show most recent event with event.t <= t as "Hour {t} — {text}")
  const eventsUpToT = result && Array.isArray(result.events) ? result.events.filter((e) => e.t <= t) : [];
  const latestEvent = eventsUpToT.length > 0 ? eventsUpToT[eventsUpToT.length - 1] : null;

  const tickerText = latestEvent
    ? `Hour ${latestEvent.t} — ${latestEvent.text}`
    : result
    ? `Hour ${t} — Normal operations`
    : `Hour 0 — Ready to simulate`;

  const nextSpeed = (s: 1 | 2 | 4): 1 | 2 | 4 => (s === 1 ? 2 : s === 2 ? 4 : 1);

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
          className="p-1.5 rounded bg-[#242c33] border border-[#303941] text-[#8a96a1] hover:text-[#f1f4f6] hover:bg-[#2c363f] transition-colors"
          title="Reset Simulation (Reset T+0)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setSpeed(nextSpeed(speed))}
          className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition-colors flex items-center gap-1 border ${
            speed > 1
              ? "bg-[#3d2d14] text-[#e09f3e] border-[#e09f3e]/40"
              : "bg-[#242c33] text-[#8a96a1] border-[#303941] hover:text-[#d2d8de]"
          }`}
          title="Simulation Rate (1x / 2x / 4x)"
        >
          <FastForward className="w-3 h-3" />
          {speed}x
        </button>
      </div>

      {/* Discrete 24-Hour Slider (Bound to t) */}
      <div className="flex-1 flex items-center gap-3 max-w-xl">
        <div className="flex items-center gap-1 font-mono text-[11px] text-[#9BAA76] shrink-0">
          <Clock className="w-3.5 h-3.5" />
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
            className="w-full h-1.5 bg-[#242c33] rounded-lg appearance-none cursor-pointer accent-[#9BAA76] focus:outline-none"
            title="Drag slider to scrub simulation hour"
          />
        </div>
      </div>

      {/* Simulation Event Ticker & Mini Sparkline */}
      <div className="hidden md:flex items-center gap-3 shrink-0">
        {/* Clickable Event Ticker (Requirement 6) */}
        <button
          onClick={() => setActiveTab("simulate")}
          className="text-[11px] text-[#8a96a1] hover:text-[#f1f4f6] truncate max-w-[260px] text-left transition-colors flex items-center gap-1.5"
          title="Click to view full event log in Simulate tab"
        >
          <AlertTriangle
            className={`w-3.5 h-3.5 shrink-0 ${
              latestEvent?.kind === "trigger"
                ? "text-[#d9534f]"
                : latestEvent?.kind === "cascade"
                ? "text-[#e09f3e]"
                : "text-[#8a96a1]"
            }`}
          />
          <span className="font-mono truncate">{tickerText}</span>
        </button>

        {/* Mini Sparkline Chart (Requirement 7) */}
        <div
          className="relative overflow-hidden rounded bg-[#14191d] px-1 py-0.5 border border-[#303941]"
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
