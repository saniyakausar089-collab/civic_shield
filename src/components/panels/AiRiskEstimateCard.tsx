import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAppStore } from "@/store/appStore";
import {
  predictSurrogate,
  type SurrogateModel,
  type SurrogatePrediction,
} from "@/engine/surrogate";
import {
  Cpu,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

// Static asset name dictionary from public/data/network.json (Never print raw IDs as names)
const STATIC_ASSET_NAMES: Record<string, string> = {
  WT1: "North Water Works",
  WT2: "South Water Works",
  PIPE1: "Main Pipeline",
  PIPE2: "West Feeder Main",
  PUMPA: "Pumping Station A",
  PUMPB: "Pumping Station B",
  RES1: "Hill Reservoir",
  RES2: "East Overhead Tank",
  PP1: "Grid Power Plant",
  SUB1: "North Substation",
  SUB2: "Central Substation",
  SUB3: "South Substation",
  SUB4: "East Substation",
  SUB5: "West Substation",
  TX1: "Core Telecom Exchange",
  T1: "Telecom Tower 1",
  T2: "Telecom Tower 2",
  T3: "Telecom Tower 3",
  T4: "Telecom Tower 4",
  RJ1: "Central Junction",
  RJ2: "North Junction",
  RJ3: "East Junction",
  UJ1: "East Underpass",
  UJ2: "West Underpass",
  H1: "City General Hospital",
  H2: "Northwest Medical Center",
};

// Module-level cache for surrogate model (3.1 MB)
let cachedModel: SurrogateModel | null = null;
let modelLoadPromise: Promise<SurrogateModel> | null = null;

async function loadSurrogateModel(): Promise<SurrogateModel> {
  if (cachedModel) return cachedModel;
  if (modelLoadPromise) return modelLoadPromise;

  modelLoadPromise = fetch("/data/surrogate-model.json")
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load surrogate model`);
      }
      const data = (await res.json()) as SurrogateModel;
      cachedModel = data;
      return data;
    })
    .catch((err) => {
      modelLoadPromise = null;
      throw err;
    });

  return modelLoadPromise;
}

const fmt = (n: number) => n.toLocaleString("en-IN");

export const AiRiskEstimateCard: React.FC = () => {
  const selectedScenario = useAppStore((s) => s.selectedScenario);
  const scenariosData = useAppStore((s) => s.scenariosData);
  const presetId = useAppStore((s) => s.presetId);
  const result = useAppStore((s) => s.result);
  const networkData = useAppStore((s) => s.networkData);
  const setSelectedGisNode = useAppStore((s) => s.setSelectedGisNode);
  const civicShieldLayer = useAppStore((s) => s.civicShieldLayer);

  const [model, setModel] = useState<SurrogateModel | null>(cachedModel);
  const [loading, setLoading] = useState<boolean>(!cachedModel);
  const [error, setError] = useState<string | null>(null);

  // Lazy-load model on first render
  useEffect(() => {
    if (!model && !cachedModel) {
      setLoading(true);
      loadSurrogateModel()
        .then((m) => {
          setModel(m);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to load model");
          setLoading(false);
        });
    } else if (cachedModel && !model) {
      setModel(cachedModel);
      setLoading(false);
    }
  }, [model]);

  // Asset name lookup helper (never returns a raw ID as the name)
  const getAssetName = useCallback(
    (id: string): string => {
      if (STATIC_ASSET_NAMES[id]) return STATIC_ASSET_NAMES[id];
      const fromStore = networkData?.nodes.find((n) => n.id === id);
      if (fromStore?.name) return fromStore.name;
      return STATIC_ASSET_NAMES[id] || id;
    },
    [networkData]
  );

  // Determine active scenario
  const isScenarioActive = (s: any) =>
    presetId === s.id ||
    (presetId === "pipeline" && s.id === "pipeline_burst") ||
    (presetId === "monsoon" && s.id === "monsoon_flood") ||
    (presetId === "heatwave" && s.id === "heatwave_overload") ||
    (presetId === "cyber" && s.id === "cyberattack") ||
    (presetId === "quake" && s.id === "earthquake");

  const activeScenario = useMemo(() => {
    return (
      selectedScenario ||
      scenariosData.find((s) => isScenarioActive(s)) ||
      scenariosData[0] ||
      null
    );
  }, [selectedScenario, scenariosData, presetId]);

  // Extract trigger node IDs (canonical per scenario specifications)
  const triggerIds = useMemo(() => {
    if (!activeScenario?.triggers) return [];
    return activeScenario.triggers.map((t: any) => t.node || t);
  }, [activeScenario]);

  const triggerSet = useMemo(() => new Set(triggerIds), [triggerIds]);

  // Compute prediction
  const prediction: SurrogatePrediction | null = useMemo(() => {
    if (!model || triggerIds.length === 0) return null;
    return predictSurrogate(model, triggerIds);
  }, [model, triggerIds]);

  // Check if simulation result corresponds to current active scenario
  const isEngineRunForActiveScenario = useMemo(() => {
    if (!result || !activeScenario) return false;
    return (
      result.scenario_id === activeScenario.id ||
      isScenarioActive({ id: result.scenario_id })
    );
  }, [result, activeScenario]);

  const engineActual = isEngineRunForActiveScenario ? result?.summary : null;

  // Handle clicking an asset -> select on globe via existing flow
  const handleSelectNode = (nodeId: string) => {
    const nodeObj = networkData?.nodes.find((n) => n.id === nodeId);
    if (nodeObj) {
      setSelectedGisNode(nodeObj);
    }
    if (civicShieldLayer) {
      if (typeof civicShieldLayer.flyToNode === "function") {
        civicShieldLayer.flyToNode(nodeId);
      }
      if (typeof civicShieldLayer.previewScenario === "function") {
        civicShieldLayer.previewScenario({ triggers: [{ node: nodeId }] });
      }
    }
  };

  // Categorize secondary failure victims (excluding triggers):
  // 1. "Likely to fail" (probability >= 0.5)
  // 2. "At risk" (probability >= 0.2 and < 0.5)
  // Hide all assets with probability < 0.2
  const { likelyToFail, atRisk } = useMemo(() => {
    if (!prediction?.asset_failure_probability) {
      return { likelyToFail: [], atRisk: [] };
    }

    const items = Object.entries(prediction.asset_failure_probability)
      .filter(([id]) => !triggerSet.has(id))
      .map(([id, prob]) => ({
        id,
        name: getAssetName(id),
        prob,
        pct: Math.round(prob * 100),
      }))
      .sort((a, b) => b.prob - a.prob);

    return {
      likelyToFail: items.filter((x) => x.prob >= 0.5),
      atRisk: items.filter((x) => x.prob >= 0.2 && x.prob < 0.5),
    };
  }, [prediction, triggerSet, getAssetName]);

  // Formatting helper for % diff
  const renderDiff = (estimate: number, actual: number) => {
    if (actual === 0) {
      if (estimate === 0) return <span className="text-[#8a96a1]"> (0.0%)</span>;
      return <span className="text-amber-400 font-mono"> (+{estimate})</span>;
    }
    const diffPct = ((estimate - actual) / actual) * 100;
    const sign = diffPct > 0 ? "+" : "";
    const colorClass = Math.abs(diffPct) <= 10 ? "text-emerald-400" : "text-amber-400";
    return (
      <span className={`font-mono font-medium ${colorClass}`}>
        {" "}
        ({sign}
        {diffPct.toFixed(1)}%)
      </span>
    );
  };

  // 1. Loading Skeleton
  if (loading) {
    return (
      <div className="bg-[#191F24] border border-[#303941] rounded-xl p-4 space-y-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#303941]" />
            <div className="h-4 w-36 bg-[#303941] rounded" />
          </div>
          <div className="h-3 w-24 bg-[#28323a] rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="h-16 bg-[#14191d] rounded-lg border border-[#252f37]" />
          <div className="h-16 bg-[#14191d] rounded-lg border border-[#252f37]" />
          <div className="h-16 bg-[#14191d] rounded-lg border border-[#252f37]" />
        </div>
        <div className="h-24 bg-[#14191d] rounded-lg border border-[#252f37]" />
        <div className="h-3 w-3/4 bg-[#28323a] rounded" />
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="bg-[#241c1c] border border-red-500/40 rounded-xl p-3.5 flex items-start gap-3 text-red-200 text-xs font-mono">
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold text-red-300 mb-0.5">Surrogate Model Unavailable</div>
          <div className="text-[11px] text-red-300/80 mb-2">{error}</div>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              loadSurrogateModel()
                .then((m) => {
                  setModel(m);
                  setLoading(false);
                })
                .catch((e) => {
                  setError(e.message);
                  setLoading(false);
                });
            }}
            className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 flex items-center gap-1.5 transition-colors text-[10px]"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry Loading</span>
          </button>
        </div>
      </div>
    );
  }

  if (!prediction || !model) {
    return null;
  }

  const r2PopHours =
    typeof model.metrics.affected_pop_hours === "object"
      ? (model.metrics.affected_pop_hours as any).r2_model
      : model.metrics.affected_pop_hours;

  return (
    <div
      data-testid="ai-risk-estimate-card"
      className="bg-[#191F24] border border-[#303941] rounded-xl p-3.5 sm:p-4 space-y-3.5 text-[#e5e9ec] select-none"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#303941]/70 pb-2.5">
        <div className="flex items-start sm:items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#252f38] border border-[#3a4752] flex items-center justify-center text-[#9BAA76] shrink-0 mt-0.5 sm:mt-0">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#f1f4f6] flex items-center gap-1.5 font-mono">
              <span>AI Risk Estimate</span>
              <span className="text-[10px] text-[#8a96a1] font-normal">
                ({activeScenario?.name || "Scenario"})
              </span>
            </h4>
            {/* Re-checked trigger labels: Name + ID (never raw ID alone) */}
            <div className="text-[10px] text-[#9BAA76] font-mono mt-0.5 truncate max-w-xl">
              Triggers:{" "}
              {triggerIds.map((id) => `${getAssetName(id)} (${id})`).join(" + ")}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#242c33] text-[#9BAA76] border border-[#303941] flex items-center gap-1">
            <Cpu className="w-2.5 h-2.5" />
            <span>Surrogate ML</span>
          </span>
        </div>
      </div>

      {/* Out of Distribution Notice OR Metric Tiles */}
      {!prediction.in_distribution ? (
        <div className="p-4 rounded-lg bg-[#242018] border border-amber-500/40 text-center space-y-1">
          <div className="text-xs font-mono font-semibold text-amber-300 uppercase tracking-wide">
            outside training range
          </div>
          <div className="text-[11px] text-amber-200/70 font-mono">
            Model was trained on 1 to 5 simultaneous failures. The current selection has{" "}
            {triggerIds.length} trigger nodes.
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Estimated affected population-hours */}
            <div className="bg-[#14191d] p-2.5 rounded-lg border border-[#303941] flex flex-col justify-between">
              <span className="text-[10px] text-[#8a96a1] font-mono leading-tight mb-1">
                Estimated affected population-hours
              </span>
              <div>
                <div className="text-sm sm:text-base font-bold font-mono text-[#f1f4f6]">
                  {fmt(prediction.affected_pop_hours)}
                </div>
                {engineActual && (
                  <div className="text-[10px] font-mono mt-1 text-[#8a96a1] pt-1 border-t border-[#252f38] flex items-center justify-between">
                    <span>Engine: {fmt(engineActual.affected_pop_hours)}</span>
                    {renderDiff(prediction.affected_pop_hours, engineActual.affected_pop_hours)}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Estimated hospital downtime (low confidence (R2 0.72)) */}
            <div className="bg-[#14191d] p-2.5 rounded-lg border border-[#303941] flex flex-col justify-between">
              <div className="flex flex-col mb-1">
                <span className="text-[10px] text-[#8a96a1] font-mono leading-tight">
                  Estimated hospital downtime
                </span>
                <span className="text-[9px] text-amber-400 font-mono">
                  low confidence (R2 0.72)
                </span>
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold font-mono text-[#f1f4f6]">
                  {prediction.hospital_downtime_h}h
                </div>
                {engineActual && (
                  <div className="text-[10px] font-mono mt-1 text-[#8a96a1] pt-1 border-t border-[#252f38] flex items-center justify-between">
                    <span>Engine: {engineActual.hospital_downtime_h}h</span>
                    {renderDiff(prediction.hospital_downtime_h, engineActual.hospital_downtime_h)}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Estimated failed assets */}
            <div className="bg-[#14191d] p-2.5 rounded-lg border border-[#303941] flex flex-col justify-between">
              <span className="text-[10px] text-[#8a96a1] font-mono leading-tight mb-1">
                Estimated failed assets
              </span>
              <div>
                <div className="text-sm sm:text-base font-bold font-mono text-[#f1f4f6]">
                  {prediction.final_failed}{" "}
                  <span className="text-[10px] text-[#8a96a1] font-normal">of 26</span>
                </div>
                {engineActual && (
                  <div className="text-[10px] font-mono mt-1 text-[#8a96a1] pt-1 border-t border-[#252f38] flex items-center justify-between">
                    <span>Engine: {engineActual.final_failed}</span>
                    {renderDiff(prediction.final_failed, engineActual.final_failed)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section A: Likely to fail (probability >= 0.5) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h5 className="text-[11px] font-mono font-semibold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>Likely to fail (≥ 50% probability)</span>
              </h5>
              <span className="text-[10px] font-mono text-[#6e7b85]">Click to locate</span>
            </div>

            {likelyToFail.length === 0 ? (
              <div className="text-[11px] font-mono text-[#8a96a1] bg-[#14191d] p-2.5 rounded-lg border border-[#27323b] italic">
                No non-trigger assets reach the 50% failure threshold.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {likelyToFail.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNode(item.id)}
                    className="p-2 rounded-lg bg-[#14191d] hover:bg-[#202930] border border-[#27323b] hover:border-red-500/60 text-left transition-all group flex flex-col justify-between"
                    title={`Locate ${item.name} (${item.id}) on map`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full mb-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-semibold text-[#f1f4f6] group-hover:text-red-300 transition-colors truncate">
                          {item.name}
                        </span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#252f38] text-[#8a96a1] shrink-0">
                          {item.id}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-red-400 shrink-0">
                        {item.pct}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-[#252f38] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all duration-300 rounded-full"
                        style={{ width: `${Math.max(item.pct, 3)}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Section B: At risk (0.2 <= probability < 0.5) in a lighter style */}
          {atRisk.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <h5 className="text-[11px] font-mono font-semibold text-amber-300/80 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                  <span>At risk (20% – 50% probability)</span>
                </h5>
                <span className="text-[10px] font-mono text-[#6e7b85]">Click to locate</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {atRisk.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNode(item.id)}
                    className="p-2 rounded-lg bg-[#14191d]/60 hover:bg-[#1a2128] border border-[#262f37] hover:border-amber-400/50 text-left transition-all group flex flex-col justify-between"
                    title={`Locate ${item.name} (${item.id}) on map`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full mb-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-medium text-[#c2cbd2] group-hover:text-amber-300 transition-colors truncate">
                          {item.name}
                        </span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#20272e] text-[#717e89] shrink-0">
                          {item.id}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-medium text-amber-300/90 shrink-0">
                        {item.pct}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-[#20272e] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400/70 transition-all duration-300 rounded-full"
                        style={{ width: `${Math.max(item.pct, 3)}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer (Requirement 2: exact text, no words like instant or faster than simulation) */}
      <div className="pt-2 border-t border-[#303941]/60 text-[10px] font-mono text-[#8a96a1] leading-relaxed">
        Surrogate ML model trained on {model.trained_on} simulated cascades; held-out R2{" "}
        {r2PopHours} on population impact. Synthetic data. The simulator is the source of truth.
      </div>
    </div>
  );
};
