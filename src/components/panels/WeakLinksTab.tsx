import React, { useMemo, useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";
import { simulate, type Scenario } from "@/engine/cascade";
import { analyzeWeakLinks, type WeakLink } from "@/engine/weaklinks";
import { loadCivicShieldData } from "@/gis/civicshieldLayer";
import {
  Play,
  Radio,
  ChevronDown,
  ChevronUp,
  Activity,
  ShieldAlert,
  Flame,
  Zap,
  Droplets,
  Wifi,
  Navigation,
  Cross,
} from "lucide-react";

export const WeakLinksTab: React.FC = () => {
  const networkData = useAppStore((s) => s.networkData);
  const neighborhoodsData = useAppStore((s) => s.neighborhoodsData);
  const scenariosData = useAppStore((s) => s.scenariosData);
  const civicShieldLayer = useAppStore((s) => s.civicShieldLayer);
  const setCivicShieldData = useAppStore((s) => s.setCivicShieldData);
  const setSelectedGisNode = useAppStore((s) => s.setSelectedGisNode);
  const runSim = useAppStore((s) => s.runSim);

  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [top5Active, setTop5Active] = useState(false);
  const weakLinksCacheRef = useRef<WeakLink[] | null>(null);

  // Lazy load data if not already present in store
  useEffect(() => {
    if (!networkData || !neighborhoodsData || scenariosData.length === 0) {
      loadCivicShieldData()
        .then((data) => {
          setCivicShieldData({
            network: data.network,
            neighborhoods: data.neighborhoods,
            scenarios: data.scenarios,
          });
        })
        .catch(() => {});
    }
  }, [networkData, neighborhoodsData, scenariosData.length, setCivicShieldData]);

  // Compute analyzeWeakLinks once lazily and memoize (~26 engine runs)
  const weakLinks: WeakLink[] = useMemo(() => {
    if (!networkData || !neighborhoodsData) return [];
    if (weakLinksCacheRef.current) return weakLinksCacheRef.current;
    const computed = analyzeWeakLinks(simulate, networkData, neighborhoodsData);
    weakLinksCacheRef.current = computed;
    return computed;
  }, [networkData, neighborhoodsData]);

  const displayedLinks = showAll ? weakLinks : weakLinks.slice(0, 10);

  // Toggle "Show top 5 on globe"
  const handleToggleTop5 = () => {
    if (!civicShieldLayer) return;
    if (top5Active) {
      if (typeof civicShieldLayer.clearPreview === "function") {
        civicShieldLayer.clearPreview();
      }
      setTop5Active(false);
    } else {
      const top5Triggers = weakLinks.slice(0, 5).map((l) => ({ node: l.node }));
      if (typeof civicShieldLayer.previewScenario === "function") {
        civicShieldLayer.previewScenario({ triggers: top5Triggers });
      }
      setTop5Active(true);
    }
  };

  // Row click: selects node on globe, flies camera to it, and pulses it
  const handleRowClick = (link: WeakLink) => {
    setExpandedId((prev) => (prev === link.node ? null : link.node));
    const n = networkData?.nodes.find((item) => item.id === link.node);
    if (n) {
      setSelectedGisNode(n);
    }
    if (civicShieldLayer) {
      if (typeof civicShieldLayer.flyToNode === "function") {
        civicShieldLayer.flyToNode(link.node);
      }
      if (typeof civicShieldLayer.previewScenario === "function") {
        civicShieldLayer.previewScenario({ triggers: [{ node: link.node }] });
      }
    }
    if (top5Active) {
      setTop5Active(false);
    }
  };

  // "Simulate this failure" per row
  const handleSimulateSingle = (e: React.MouseEvent, link: WeakLink) => {
    e.stopPropagation();
    const singleScenario: Scenario = {
      id: `single:${link.node}`,
      name: `${link.name} Failure`,
      triggers: [
        {
          node: link.node,
          t_hours: 0,
          severity: 1,
          event: `${link.name} failed`,
        },
      ],
    };
    runSim(singleScenario);
  };

  // Helper for network chips (neutral chip with muted icon)
  const renderNetworkChip = (network: string) => {
    const icon = (() => {
      switch (network.toLowerCase()) {
        case "power":
          return <Zap className="w-2.5 h-2.5 text-[var(--sys-power)]" />;
        case "water":
          return <Droplets className="w-2.5 h-2.5 text-[var(--sys-water)]" />;
        case "telecom":
          return <Wifi className="w-2.5 h-2.5 text-[var(--sys-telecom)]" />;
        case "road":
        case "transport":
          return <Navigation className="w-2.5 h-2.5 text-[var(--sys-road)]" />;
        case "hospital":
        case "health":
          return <Cross className="w-2.5 h-2.5 text-[var(--status-failed)]" />;
        default:
          return null;
      }
    })();

    return (
      <span className="ops-chip text-[10px] gap-1">
        {icon}
        <span className="capitalize">{network}</span>
      </span>
    );
  };

  if (!networkData || !neighborhoodsData || weakLinks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs font-sans text-[var(--text-tertiary)] gap-2">
        <Activity className="w-5 h-5 text-[var(--accent)] animate-pulse" />
        <span>Evaluating multi-network vulnerability and criticality across 26 assets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none font-sans text-[var(--text-primary)]">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface-1)] p-4 rounded-[12px] border border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[var(--status-failed)]" />
            <h3 className="text-xs uppercase font-semibold tracking-wider text-[var(--text-primary)]">
              Infrastructure Weak Links Ranking
            </h3>
          </div>
          <p className="text-[11.5px] text-[var(--text-secondary)] mt-1">
            Composite 0–100 vulnerability: Impact (55%) • Graph Structure (20%) • Asset Condition (25%)
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleToggleTop5}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors border cursor-pointer ${
              top5Active
                ? "bg-[var(--surface-3)] border-[var(--status-failed)] text-[var(--status-failed)]"
                : "ops-btn-secondary"
            }`}
            title="Pulse top 5 vulnerable single points of failure on the 3D globe"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{top5Active ? "Clear Top 5 Pulses" : "Show Top 5 on Globe"}</span>
          </button>

          <button
            onClick={() => setShowAll((v) => !v)}
            className="ops-btn-secondary py-1.5 px-3 text-xs"
          >
            {showAll ? "Show Top 10" : "Show All 26 Assets"}
          </button>
        </div>
      </div>

      {/* Ranked Asset List */}
      <div className="space-y-2">
        {displayedLinks.map((link) => {
          const isExpanded = expandedId === link.node;
          const score = link.score;

          const scoreColor =
            score >= 60
              ? { text: "text-[var(--status-failed)]", bar: "bg-[var(--status-failed)]" }
              : score >= 40
              ? { text: "text-[var(--status-degraded)]", bar: "bg-[var(--status-degraded)]" }
              : { text: "text-[var(--status-normal)]", bar: "bg-[var(--status-normal)]" };

          return (
            <div
              key={link.node}
              data-node-id={link.node}
              onClick={() => handleRowClick(link)}
              className={`rounded-[12px] border transition-colors cursor-pointer ${
                isExpanded
                  ? "bg-[var(--surface-2)] border-[var(--accent)]"
                  : "bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border-[var(--border-subtle)]"
              }`}
            >
              {/* Primary Row Summary */}
              <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left: Rank, Name, Node ID, Network Chip */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-semibold shrink-0 ${
                      link.rank <= 3
                        ? "bg-[var(--status-failed)]/15 text-[var(--status-failed)]"
                        : link.rank <= 5
                        ? "bg-[var(--status-degraded)]/15 text-[var(--status-degraded)]"
                        : "bg-[var(--surface-3)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]"
                    }`}
                  >
                    #{link.rank}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-[var(--text-primary)] truncate">
                        {link.name}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] px-2 py-0.5 rounded-[4px] bg-[var(--surface-3)] border border-[var(--border-subtle)] font-medium">
                        {link.node}
                      </span>
                      {renderNetworkChip(link.network)}
                    </div>
                  </div>
                </div>

                {/* Right: Score bar & 3-part breakdown */}
                <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                  {/* 3-part Breakdown: Impact / Structure / Condition */}
                  <div className="hidden sm:flex items-center gap-2 text-[10px]">
                    <div className="px-2 py-0.5 rounded-[4px] bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                      <span className="text-[var(--text-tertiary)]">Impact:</span>{" "}
                      <span className="text-[var(--text-primary)] font-semibold tabular-nums">
                        {link.breakdown.impact}
                      </span>
                    </div>
                    <div className="px-2 py-0.5 rounded-[4px] bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                      <span className="text-[var(--text-tertiary)]">Struct:</span>{" "}
                      <span className="text-[var(--text-primary)] font-semibold tabular-nums">
                        {link.breakdown.structure}
                      </span>
                    </div>
                    <div className="px-2 py-0.5 rounded-[4px] bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                      <span className="text-[var(--text-tertiary)]">Cond:</span>{" "}
                      <span className="text-[var(--text-primary)] font-semibold tabular-nums">
                        {link.breakdown.condition}
                      </span>
                    </div>
                  </div>

                  {/* Score & Progress Bar */}
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className={`font-semibold text-xs tabular-nums ${scoreColor.text}`}>
                        {link.score.toFixed(1)}
                        <span className="text-[9px] font-normal text-[var(--text-tertiary)]">/100</span>
                      </div>
                      <div className="w-20 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden mt-0.5">
                        <div
                          className={`h-full rounded-full ${scoreColor.bar}`}
                          style={{ width: `${Math.min(100, Math.max(4, link.score))}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[var(--text-tertiary)] pl-1">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Row Details */}
              {isExpanded && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="px-3.5 pb-3.5 pt-2 border-t border-[var(--border-subtle)] space-y-3 bg-[var(--surface-2)] rounded-b-[12px] cursor-default"
                >
                  {/* Detailed metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pt-1">
                    <div className="bg-[var(--surface-1)] p-2 rounded-[8px] border border-[var(--border-subtle)]">
                      <span className="text-[var(--text-tertiary)]">Peak Affected Pop</span>
                      <div className="text-xs font-semibold text-[var(--status-failed)] mt-0.5 tabular-nums">
                        {link.impact.peak_affected_pct}%
                        <span className="text-[10px] text-[var(--text-tertiary)] font-normal ml-1">
                          ({link.impact.peak_affected_pop.toLocaleString("en-IN")})
                        </span>
                      </div>
                    </div>

                    <div className="bg-[var(--surface-1)] p-2 rounded-[8px] border border-[var(--border-subtle)]">
                      <span className="text-[var(--text-tertiary)]">Hospital Downtime</span>
                      <div className="text-xs font-semibold text-[var(--accent)] mt-0.5 tabular-nums">
                        {link.impact.hospital_downtime_h}h
                      </div>
                    </div>

                    <div className="bg-[var(--surface-1)] p-2 rounded-[8px] border border-[var(--border-subtle)]">
                      <span className="text-[var(--text-tertiary)]">Asset Age &amp; Built</span>
                      <div className="text-xs font-semibold text-[var(--text-primary)] mt-0.5 tabular-nums">
                        {link.condition.age_years} yrs
                        {link.condition.built_year ? (
                          <span className="text-[10px] text-[var(--text-tertiary)] font-normal ml-1">
                            ({link.condition.built_year})
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="bg-[var(--surface-1)] p-2 rounded-[8px] border border-[var(--border-subtle)]">
                      <span className="text-[var(--text-tertiary)]">Operating Load</span>
                      <div className="text-xs font-semibold text-[var(--status-good)] mt-0.5 tabular-nums">
                        {Math.round(link.condition.utilization * 100)}% capacity
                      </div>
                    </div>
                  </div>

                  {/* Knocked Out Assets */}
                  <div>
                    <div className="text-[10px] text-[var(--text-tertiary)] mb-1.5 flex items-center gap-1.5 font-medium">
                      <Flame className="w-3 h-3 text-[var(--status-failed)]" />
                      <span>Cascading Failures Knocked Out Alone:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {link.impact.knocked_out.length > 0 ? (
                        link.impact.knocked_out.map((koId) => {
                          const koNode = networkData?.nodes.find((n) => n.id === koId);
                          return (
                            <span
                              key={koId}
                              className="px-2 py-0.5 rounded-[4px] bg-[var(--surface-3)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[10px] flex items-center gap-1 font-medium"
                            >
                              <span>{koNode?.name || koId}</span>
                              <span className="text-[var(--text-tertiary)]">({koId})</span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[10px] text-[var(--text-tertiary)] italic">
                          None (failure is contained locally with zero downstream asset blackouts)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reasons list */}
                  <div>
                    <div className="text-[10px] text-[var(--text-tertiary)] mb-1 font-medium">
                      Criticality &amp; Vulnerability Drivers:
                    </div>
                    <ul className="space-y-1">
                      {link.reasons.map((r, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 text-[11px] text-[var(--text-secondary)]"
                        >
                          <span className="text-[var(--status-failed)] mt-0.5 shrink-0">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
                      <span>Betweenness: {link.structure.betweenness}</span>
                      <span>•</span>
                      <span>Downstream Assets: {link.structure.downstream_assets}</span>
                    </div>

                    <button
                      data-testid={`simulate-${link.node}`}
                      onClick={(e) => handleSimulateSingle(e, link)}
                      className="ops-btn-primary w-full sm:w-auto px-3.5 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      title={`Simulate failure of ${link.name} in the cascade engine`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Simulate This Failure</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
