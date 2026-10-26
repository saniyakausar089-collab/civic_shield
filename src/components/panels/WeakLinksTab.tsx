import React, { useMemo, useState } from "react";
import { BASE_CITY } from "@/engine/city";
import { applyMods, weakestLinks, monteCarlo, type MonteCarloResult } from "@/engine/analysis";
import { useAppStore } from "@/store/appStore";
import { AlertCircle, Dna, Play, TrendingUp, Info } from "lucide-react";

export const WeakLinksTab: React.FC = () => {
  const cityMods = useAppStore((s) => s.cityMods);
  const triggers = useAppStore((s) => s.triggers);
  const setTriggers = useAppStore((s) => s.setTriggers);
  const select = useAppStore((s) => s.select);

  const city = useMemo(() => applyMods(BASE_CITY, cityMods), [cityMods]);
  const rankedLinks = useMemo(() => weakestLinks(city), [city]);

  // Monte Carlo calculation (cached per trigger set)
  const [mcState, setMcState] = useState<{ triggersKey: string; data: MonteCarloResult } | null>(null);
  const [computing, setComputing] = useState(false);

  const triggersKey = triggers.slice().sort().join(",");

  const currentMcData = useMemo(() => {
    if (mcState && mcState.triggersKey === triggersKey) {
      return mcState.data;
    }
    // Calculate synchronously or on-demand
    return monteCarlo(city, triggers, 200);
  }, [city, triggers, triggersKey, mcState]);

  const handleRunMonteCarlo = () => {
    setComputing(true);
    setTimeout(() => {
      const res = monteCarlo(city, triggers, 200, Math.floor(Math.random() * 10000));
      setMcState({ triggersKey, data: res });
      setComputing(false);
    }, 50);
  };

  // Probability Band Chart SVG
  const bands = currentMcData.bands;
  const maxVal = Math.max(1, ...bands.map((b) => b.max));
  const svgWidth = 600;
  const svgHeight = 160;

  const getPoints = (key: "min" | "p25" | "med" | "p75" | "max") =>
    bands
      .map((b, i) => {
        const x = (i / 24) * svgWidth;
        const y = svgHeight - (b[key] / maxVal) * (svgHeight - 16) - 8;
        return `${x},${y}`;
      })
      .join(" ");

  const pMinMaxArea = `M 0,${svgHeight} L ${getPoints("max")} L ${bands
    .slice()
    .reverse()
    .map((b, i) => {
      const idx = 24 - i;
      const x = (idx / 24) * svgWidth;
      const y = svgHeight - (b.min / maxVal) * (svgHeight - 16) - 8;
      return `${x},${y}`;
    })
    .join(" ")} Z`;

  const p25p75Area = `M 0,${svgHeight} L ${getPoints("p75")} L ${bands
    .slice()
    .reverse()
    .map((b, i) => {
      const idx = 24 - i;
      const x = (idx / 24) * svgWidth;
      const y = svgHeight - (b.p25 / maxVal) * (svgHeight - 16) - 8;
      return `${x},${y}`;
    })
    .join(" ")} Z`;

  return (
    <div className="space-y-6">
      {/* Monte Carlo Section */}
      <div className="p-4 rounded-2xl bg-card border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Dna className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-foreground">
                Monte Carlo Simulation (200 Stochastic Runs)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Simulating failure threshold jitters, repair variability & autonomous buffer depletion.
            </p>
          </div>
          <button
            onClick={handleRunMonteCarlo}
            disabled={computing}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {computing ? "Running..." : "Resimulate (200 Runs)"}
          </button>
        </div>

        {/* 3 Outcome Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          <div className="bg-muted/40 p-2.5 rounded-xl border border-border">
            <div className="text-[10px] uppercase font-mono text-muted-foreground">
              Cascade Probability
            </div>
            <div className="text-base font-bold text-red-400 mt-0.5">
              {Math.round(currentMcData.cascadeProbability * 100)}%
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">&ge;3 systems failed</div>
          </div>
          <div className="bg-muted/40 p-2.5 rounded-xl border border-border">
            <div className="text-[10px] uppercase font-mono text-muted-foreground">
              Best Case Lost
            </div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {Math.round(currentMcData.best.personHoursLost).toLocaleString()}h
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Peak: {currentMcData.best.peakPopulationAffected.toLocaleString()}
            </div>
          </div>
          <div className="bg-muted/40 p-2.5 rounded-xl border border-border">
            <div className="text-[10px] uppercase font-mono text-muted-foreground">
              Median Case Lost
            </div>
            <div className="text-base font-bold text-cyan-400 mt-0.5">
              {Math.round(currentMcData.median.personHoursLost).toLocaleString()}h
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Peak: {currentMcData.median.peakPopulationAffected.toLocaleString()}
            </div>
          </div>
          <div className="bg-muted/40 p-2.5 rounded-xl border border-border">
            <div className="text-[10px] uppercase font-mono text-muted-foreground">
              Worst Case Lost
            </div>
            <div className="text-base font-bold text-red-400 mt-0.5">
              {Math.round(currentMcData.worst.personHoursLost).toLocaleString()}h
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Peak: {currentMcData.worst.peakPopulationAffected.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Probability Band Chart */}
        <div className="relative bg-muted/20 rounded-xl p-3 border border-border">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-2">
            <span>Affected Population Probability Bands (0h &rarr; 24h)</span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2 rounded bg-cyan-500/20 border border-cyan-500/40 inline-block" />
                Min-Max
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2 rounded bg-cyan-500/50 inline-block" />
                25-75th %ile
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
                Median
              </span>
            </div>
          </div>

          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-32 sm:h-40"
              preserveAspectRatio="none"
            >
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((r) => (
                <line
                  key={r}
                  x1={0}
                  y1={svgHeight - r * (svgHeight - 16) - 8}
                  x2={svgWidth}
                  y2={svgHeight - r * (svgHeight - 16) - 8}
                  stroke="#334155"
                  strokeDasharray="4 4"
                  strokeWidth="0.8"
                />
              ))}

              {/* Min-Max Outer Band */}
              <polygon points={getPoints("max") + " " + bands.slice().reverse().map((b, i) => {
                const idx = 24 - i;
                return `${(idx / 24) * svgWidth},${svgHeight - (b.min / maxVal) * (svgHeight - 16) - 8}`;
              }).join(" ")} fill="rgba(6, 182, 212, 0.12)" />

              {/* 25th-75th Interquartile Band */}
              <polygon points={getPoints("p75") + " " + bands.slice().reverse().map((b, i) => {
                const idx = 24 - i;
                return `${(idx / 24) * svgWidth},${svgHeight - (b.p25 / maxVal) * (svgHeight - 16) - 8}`;
              }).join(" ")} fill="rgba(6, 182, 212, 0.28)" />

              {/* Median Line */}
              <polyline
                points={getPoints("med")}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Weak Links Ranking */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
              Criticality Ranking: Weakest Infrastructure Links
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ranked by total cascade harm if this single node fails. Tap any item to trigger that failure in the simulator.
            </p>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {rankedLinks.length} Nodes Ranked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rankedLinks.map((item, index) => {
            const isCurrentlyTrigger = triggers.includes(item.nodeId);
            return (
              <button
                key={item.nodeId}
                onClick={() => {
                  setTriggers([item.nodeId]);
                  select(item.nodeId);
                }}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isCurrentlyTrigger
                    ? "bg-red-950/30 border-red-500 ring-1 ring-red-500 shadow-sm"
                    : "bg-card hover:bg-muted/40 border-border"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`text-xs font-mono font-bold w-5 text-center ${
                      index < 3 ? "text-amber-400" : "text-muted-foreground"
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-foreground truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">
                      ID: {item.nodeId} • KIND: {item.kind}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-foreground">
                      {item.score}
                      <span className="text-[10px] font-normal text-muted-foreground">/100</span>
                    </div>
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full ${
                          item.score >= 80
                            ? "bg-red-500"
                            : item.score >= 50
                            ? "bg-amber-500"
                            : "bg-cyan-500"
                        }`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
