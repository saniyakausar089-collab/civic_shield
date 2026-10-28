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
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-[#2a2415] text-[#f5b942] border border-[#f5b942]/40">
            <Zap className="w-2.5 h-2.5" />
            Power
          </span>
        );
      case "water":
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-[#162736] text-[#38bdf8] border border-[#38bdf8]/40">
            <Droplets className="w-2.5 h-2.5" />
            Water
          </span>
        );
      case "telecom":
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-[#261830] text-[#c084fc] border border-[#c084fc]/40">
            <Wifi className="w-2.5 h-2.5" />
            Telecom
          </span>
        );
      case "road":
      case "transport":
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-[#2d1f18] text-[#fb923c] border border-[#fb923c]/40">
            <Navigation className="w-2.5 h-2.5" />
            Road
          </span>
        );
      case "hospital":
      case "health":
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-[#2e1619] text-[#f87171] border border-[#f87171]/40">
            <Cross className="w-2.5 h-2.5" />
            Hospital
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-[#8a96a1] bg-[#1e252c] border border-[#303941]">
            {network}
          </span>
        );
    }
  };

  if (!networkData || !neighborhoodsData || weakLinks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs font-mono text-[#8a96a1] gap-2">
        <Activity className="w-5 h-5 text-[#9BAA76] animate-pulse" />
        <span>Evaluating multi-network vulnerability and criticality across 26 assets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#191F24] p-3.5 rounded-xl border border-[#303941]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#ef4444]" />
            <h3 className="text-xs uppercase font-mono tracking-wider text-[#e5e9ec] font-bold">
              Infrastructure Weak Links Ranking
            </h3>
          </div>
          <p className="text-[11px] text-[#8a96a1] font-mono mt-0.5">
            Composite 0–100 vulnerability: Impact (55%) • Graph Structure (20%) • Asset Condition (25%)
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Button: Show top 5 on globe */}
          <button
            onClick={handleToggleTop5}
            className={`px-3 py-1.5 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors border ${
              top5Active
                ? "bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444] shadow-sm animate-pulse"
                : "bg-[#14191d] hover:bg-[#20282f] border-[#303941] text-[#e5e9ec]"
            }`}
            title="Pulse top 5 vulnerable single points of failure on the 3D globe"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{top5Active ? "Clear Top 5 Pulses" : "Show Top 5 on Globe"}</span>
          </button>

          {/* Toggle All / Top 10 */}
          <button
            onClick={() => setShowAll((v) => !v)}
            className="px-3 py-1.5 rounded text-xs font-mono font-semibold bg-[#14191d] hover:bg-[#20282f] border border-[#303941] text-[#9BAA76] transition-colors"
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
              ? { text: "text-[#f87171]", bar: "bg-[#ef4444]", border: "border-[#ef4444]/30" }
              : score >= 40
              ? { text: "text-[#fbbf24]", bar: "bg-[#f59e0b]", border: "border-[#f59e0b]/30" }
              : { text: "text-[#8a96a1]", bar: "bg-[#64748b]", border: "border-[#64748b]/30" };

          return (
            <div
              key={link.node}
              data-node-id={link.node}
              onClick={() => handleRowClick(link)}
              className={`rounded-xl border transition-all cursor-pointer ${
                isExpanded
                  ? "bg-[#1d252c] border-[#9BAA76] shadow-md ring-1 ring-[#9BAA76]/40"
                  : "bg-[#191F24] hover:bg-[#20282f] border-[#303941]"
              }`}
            >
              {/* Primary Row Summary */}
              <div
                className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                {/* Left: Rank, Name, Node ID, Network Chip */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                      link.rank <= 3
                        ? "bg-[#ef4444] text-[#101418]"
                        : link.rank <= 5
                        ? "bg-[#f59e0b] text-[#101418]"
                        : "bg-[#242c33] text-[#8a96a1] border border-[#303941]"
                    }`}
                  >
                    #{link.rank}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-[#f1f4f6] truncate">
                        {link.name}
                      </span>
                      <span className="font-mono text-[10px] text-[#8a96a1] px-1.5 py-0.2 rounded bg-[#14191d] border border-[#242c33]">
                        {link.node}
                      </span>
                      {renderNetworkChip(link.network)}
                    </div>
                  </div>
                </div>

                {/* Right: Score bar & 3-part breakdown */}
                <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                  {/* 3-part Breakdown: Impact / Structure / Condition */}
                  <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono">
                    <div className="px-2 py-0.5 rounded bg-[#14191d] border border-[#242c33]">
                      <span className="text-[#8a96a1]">Impact:</span>{" "}
                      <span className="text-[#f1f4f6] font-semibold">
                        {link.breakdown.impact}
                      </span>
                    </div>
                    <div className="px-2 py-0.5 rounded bg-[#14191d] border border-[#242c33]">
                      <span className="text-[#8a96a1]">Struct:</span>{" "}
                      <span className="text-[#f1f4f6] font-semibold">
                        {link.breakdown.structure}
                      </span>
                    </div>
                    <div className="px-2 py-0.5 rounded bg-[#14191d] border border-[#242c33]">
                      <span className="text-[#8a96a1]">Cond:</span>{" "}
                      <span className="text-[#f1f4f6] font-semibold">
                        {link.breakdown.condition}
                      </span>
                    </div>
                  </div>

                  {/* Score & Progress Bar */}
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className={`font-mono font-bold text-xs ${scoreColor.text}`}>
                        {link.score.toFixed(1)}
                        <span className="text-[9px] font-normal text-[#8a96a1]">/100</span>
                      </div>
                      <div className="w-20 h-1.5 bg-[#14191d] rounded-full overflow-hidden mt-0.5 border border-[#242c33]">
                        <div
                          className={`h-full rounded-full ${scoreColor.bar}`}
                          style={{ width: `${Math.min(100, Math.max(4, link.score))}%` }}
                        />
                      </div>
                    </div>

                    {/* Expand icon */}
                    <div className="text-[#8a96a1] pl-1">
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
                  className="px-3 pb-3 pt-1 border-t border-[#303941] space-y-3 bg-[#14191d]/80 rounded-b-xl animate-in fade-in cursor-default"
                >
                  {/* Detailed metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono pt-2">
                    <div className="bg-[#191F24] p-2 rounded border border-[#303941]">
                      <span className="text-[#8a96a1]">Peak Affected Pop</span>
                      <div className="text-xs font-bold text-[#ef4444] mt-0.5">
                        {link.impact.peak_affected_pct}%
                        <span className="text-[10px] text-[#8a96a1] font-normal ml-1">
                          ({link.impact.peak_affected_pop.toLocaleString("en-IN")})
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#191F24] p-2 rounded border border-[#303941]">
                      <span className="text-[#8a96a1]">Hospital Downtime</span>
                      <div className="text-xs font-bold text-[#38bdf8] mt-0.5">
                        {link.impact.hospital_downtime_h}h
                      </div>
                    </div>

                    <div className="bg-[#191F24] p-2 rounded border border-[#303941]">
                      <span className="text-[#8a96a1]">Asset Age & Built</span>
                      <div className="text-xs font-bold text-[#e5e9ec] mt-0.5">
                        {link.condition.age_years} yrs
                        {link.condition.built_year ? (
                          <span className="text-[10px] text-[#8a96a1] font-normal ml-1">
                            ({link.condition.built_year})
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="bg-[#191F24] p-2 rounded border border-[#303941]">
                      <span className="text-[#8a96a1]">Operating Load</span>
                      <div className="text-xs font-bold text-[#9BAA76] mt-0.5">
                        {Math.round(link.condition.utilization * 100)}% capacity
                      </div>
                    </div>
                  </div>

                  {/* Knocked Out Assets */}
                  <div>
                    <div className="text-[10px] font-mono text-[#8a96a1] mb-1.5 flex items-center gap-1.5">
                      <Flame className="w-3 h-3 text-[#ef4444]" />
                      <span>Cascading Failures Knocked Out Alone:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {link.impact.knocked_out.length > 0 ? (
                        link.impact.knocked_out.map((koId) => {
                          const koNode = networkData?.nodes.find((n) => n.id === koId);
                          return (
                            <span
                              key={koId}
                              className="px-2 py-0.5 rounded bg-[#2a1719] border border-[#ef4444]/40 text-[#fca5a5] text-[10px] font-mono flex items-center gap-1"
                            >
                              <span>{koNode?.name || koId}</span>
                              <span className="text-[#8a96a1]">({koId})</span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[10px] text-[#8a96a1] font-mono italic">
                          None (failure is contained locally with zero downstream asset blackouts)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reasons list */}
                  <div>
                    <div className="text-[10px] font-mono text-[#8a96a1] mb-1">
                      Criticality & Vulnerability Drivers:
                    </div>
                    <ul className="space-y-1">
                      {link.reasons.map((r, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 text-[11px] text-[#d2d8de] font-mono"
                        >
                          <span className="text-[#ef4444] mt-0.5 shrink-0">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#242c33]">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#8a96a1]">
                      <span>Betweenness: {link.structure.betweenness}</span>
                      <span>•</span>
                      <span>Downstream Assets: {link.structure.downstream_assets}</span>
                    </div>

                    <button
                      data-testid={`simulate-${link.node}`}
                      onClick={(e) => handleSimulateSingle(e, link)}
                      className="w-full sm:w-auto px-3 py-1.5 rounded bg-[#ef4444] hover:bg-[#dc2626] text-[#101418] font-bold text-xs font-mono flex items-center justify-center gap-1.5 shadow transition-colors"
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
