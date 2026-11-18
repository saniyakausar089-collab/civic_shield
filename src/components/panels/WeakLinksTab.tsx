import React, { useMemo, useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";
import { simulate, type Scenario } from "@/engine/cascade";
import { analyzeWeakLinks, type WeakLink } from "@/engine/weaklinks";
import { loadCivicShieldData } from "@/gis/civicshieldLayer";
import {
  AlertTriangle,
  Play,
  Radio,
  ChevronDown,
  ChevronUp,
  Activity,
  ShieldAlert,
  Flame,
  Layers,
  MapPin,
  Clock,
  Gauge,
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

  // Helper for network chips
  const renderNetworkChip = (network: string) => {
    switch (network.toLowerCase()) {
      case "power":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-[var(--status-warning)] border border-amber-500/20">
            <Zap className="w-2.5 h-2.5" />
            Power
          </span>
        );
      case "water":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--accent-tint)] text-[var(--accent)] border border-[var(--accent)]/30">
            <Droplets className="w-2.5 h-2.5" />
            Water
          </span>
        );
      case "telecom":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Wifi className="w-2.5 h-2.5" />
            Telecom
          </span>
        );
      case "road":
      case "transport":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            <Navigation className="w-2.5 h-2.5" />
            Road
          </span>
        );
      case "hospital":
      case "health":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-[var(--status-danger)] border border-rose-500/20">
            <Cross className="w-2.5 h-2.5" />
            Hospital
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] text-[var(--text-tertiary)] bg-[var(--surface-2)] border border-[var(--border)]">
            {network}
          </span>
        );
    }
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
    <div className="space-y-4 select-none font-sans text-[var(--text)]">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface)] p-5 rounded-[20px] border border-[var(--border)] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[var(--status-danger)]" />
            <h3 className="text-xs uppercase font-semibold tracking-wider text-[var(--text)]">
              Infrastructure Weak Links Ranking
            </h3>
          </div>
          <p className="text-[11.5px] text-[var(--text-secondary)] mt-1">
            Composite 0–100 vulnerability: Impact (55%) • Graph Structure (20%) • Asset Condition (25%)
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Button: Show top 5 on globe */}
          <button
            onClick={handleToggleTop5}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors border cursor-pointer ${
              top5Active
                ? "bg-rose-500/10 border-rose-500/40 text-[var(--status-danger)] shadow-xs"
                : "bg-[var(--surface-2)] hover:bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]"
            }`}
            title="Pulse top 5 vulnerable single points of failure on the 3D globe"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{top5Active ? "Clear Top 5 Pulses" : "Show Top 5 on Globe"}</span>
          </button>

          {/* Toggle All / Top 10 */}
          <button
            onClick={() => setShowAll((v) => !v)}
            className="apple-btn-secondary py-1.5 px-3 text-xs"
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

          // Score color logic: >=60 red, 40-60 amber, else grey
          const scoreColor =
            score >= 60
              ? { text: "text-rose-600 dark:text-rose-400", bar: "bg-rose-600 dark:bg-rose-500", border: "border-rose-500/20" }
              : score >= 40
              ? { text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", border: "border-amber-500/20" }
              : { text: "text-[#94A3B8] dark:text-[#71717A]", bar: "bg-[#94A3B8] dark:bg-[#71717A]", border: "border-[#E5E7EB] dark:border-[#27272A]" };

          return (
            <div
              key={link.node}
              data-node-id={link.node}
              onClick={() => handleRowClick(link)}
              className={`rounded-[16px] border transition-all duration-200 cursor-pointer ${
                isExpanded
                  ? "bg-[var(--surface)] border-[var(--accent)] shadow-[var(--shadow-soft)] ring-2 ring-[var(--accent-tint)]"
                  : "bg-[var(--surface)] hover:bg-[var(--surface-2)] border-[var(--border)] shadow-xs hover:-translate-y-0.5"
              }`}
            >
              {/* Primary Row Summary */}
              <div
                className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                {/* Left: Rank, Name, Node ID, Network Chip */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-semibold shrink-0 ${
                      link.rank <= 3
                        ? "bg-rose-500/10 text-[var(--status-danger)]"
                        : link.rank <= 5
                        ? "bg-amber-500/10 text-[var(--status-warning)]"
                        : "bg-[var(--surface-2)] text-[var(--text-tertiary)] border border-[var(--border)]"
                    }`}
                  >
                    #{link.rank}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-[var(--text)] truncate">
                        {link.name}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] font-medium">
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
                    <div className="px-2 py-0.5 rounded-md bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A]">
                      <span className="text-[#94A3B8] dark:text-[#71717A]">Impact:</span>{" "}
                      <span className="text-[#111827] dark:text-[#FAFAFA] font-semibold">
                        {link.breakdown.impact}
                      </span>
                    </div>
                    <div className="px-2 py-0.5 rounded-md bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A]">
                      <span className="text-[#94A3B8] dark:text-[#71717A]">Struct:</span>{" "}
                      <span className="text-[#111827] dark:text-[#FAFAFA] font-semibold">
                        {link.breakdown.structure}
                      </span>
                    </div>
                    <div className="px-2 py-0.5 rounded-md bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A]">
                      <span className="text-[#94A3B8] dark:text-[#71717A]">Cond:</span>{" "}
                      <span className="text-[#111827] dark:text-[#FAFAFA] font-semibold">
                        {link.breakdown.condition}
                      </span>
                    </div>
                  </div>

                  {/* Score & Progress Bar */}
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className={`font-semibold text-xs tabular-nums ${scoreColor.text}`}>
                        {link.score.toFixed(1)}
                        <span className="text-[9px] font-normal text-[#94A3B8] dark:text-[#71717A]">/100</span>
                      </div>
                      <div className="w-20 h-1.5 bg-[#E5E7EB] dark:bg-[#27272A] rounded-full overflow-hidden mt-0.5">
                        <div
                          className={`h-full rounded-full ${scoreColor.bar}`}
                          style={{ width: `${Math.min(100, Math.max(4, link.score))}%` }}
                        />
                      </div>
                    </div>

                    {/* Expand icon */}
                    <div className="text-[#94A3B8] dark:text-[#71717A] pl-1">
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
                  className="px-3 pb-3 pt-1 border-t border-[#E5E7EB] dark:border-[#27272A] space-y-3 bg-[#F7F8FA] dark:bg-[#181B22] rounded-b-xl animate-in fade-in cursor-default"
                >
                  {/* Detailed metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pt-2">
                    <div className="bg-white dark:bg-[#111318] p-2 rounded-lg border border-[#E5E7EB] dark:border-[#27272A]">
                      <span className="text-[#94A3B8] dark:text-[#71717A]">Peak Affected Pop</span>
                      <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5 tabular-nums">
                        {link.impact.peak_affected_pct}%
                        <span className="text-[10px] text-[#94A3B8] dark:text-[#71717A] font-normal ml-1">
                          ({link.impact.peak_affected_pop.toLocaleString("en-IN")})
                        </span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-[#111318] p-2 rounded-lg border border-[#E5E7EB] dark:border-[#27272A]">
                      <span className="text-[#94A3B8] dark:text-[#71717A]">Hospital Downtime</span>
                      <div className="text-xs font-semibold text-[#2563EB] dark:text-[#3B82F6] mt-0.5 tabular-nums">
                        {link.impact.hospital_downtime_h}h
                      </div>
                    </div>

                    <div className="bg-white dark:bg-[#111318] p-2 rounded-lg border border-[#E5E7EB] dark:border-[#27272A]">
                      <span className="text-[#94A3B8] dark:text-[#71717A]">Asset Age &amp; Built</span>
                      <div className="text-xs font-semibold text-[#111827] dark:text-[#FAFAFA] mt-0.5">
                        {link.condition.age_years} yrs
                        {link.condition.built_year ? (
                          <span className="text-[10px] text-[#94A3B8] dark:text-[#71717A] font-normal ml-1">
                            ({link.condition.built_year})
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-[#111318] p-2 rounded-lg border border-[#E5E7EB] dark:border-[#27272A]">
                      <span className="text-[#94A3B8] dark:text-[#71717A]">Operating Load</span>
                      <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums">
                        {Math.round(link.condition.utilization * 100)}% capacity
                      </div>
                    </div>
                  </div>

                  {/* Knocked Out Assets */}
                  <div>
                    <div className="text-[10px] text-[#94A3B8] dark:text-[#71717A] mb-1.5 flex items-center gap-1.5 font-medium">
                      <Flame className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                      <span>Cascading Failures Knocked Out Alone:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {link.impact.knocked_out.length > 0 ? (
                        link.impact.knocked_out.map((koId) => {
                          const koNode = networkData?.nodes.find((n) => n.id === koId);
                          return (
                            <span
                              key={koId}
                              className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-[10px] flex items-center gap-1 font-medium"
                            >
                              <span>{koNode?.name || koId}</span>
                              <span className="text-rose-500/80">({koId})</span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[10px] text-[#94A3B8] dark:text-[#71717A] italic">
                          None (failure is contained locally with zero downstream asset blackouts)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reasons list */}
                  <div>
                    <div className="text-[10px] text-[#94A3B8] dark:text-[#71717A] mb-1 font-medium">
                      Criticality &amp; Vulnerability Drivers:
                    </div>
                    <ul className="space-y-1">
                      {link.reasons.map((r, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 text-[11px] text-[#475569] dark:text-[#A1A1AA]"
                        >
                          <span className="text-rose-600 dark:text-rose-400 mt-0.5 shrink-0">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#E5E7EB] dark:border-[#27272A]">
                    <div className="flex items-center gap-2 text-[10px] text-[#94A3B8] dark:text-[#71717A]">
                      <span>Betweenness: {link.structure.betweenness}</span>
                      <span>•</span>
                      <span>Downstream Assets: {link.structure.downstream_assets}</span>
                    </div>

                    <button
                      data-testid={`simulate-${link.node}`}
                      onClick={(e) => handleSimulateSingle(e, link)}
                      className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-[0.98]"
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
