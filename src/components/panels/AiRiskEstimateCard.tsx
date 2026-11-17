import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAppStore } from "@/store/appStore";
import { PRESETS } from "@/engine/plans";
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

  // Robust asset name lookup
  const getAssetName = useCallback(
    (id: string): string => {
      if (STATIC_ASSET_NAMES[id]) return STATIC_ASSET_NAMES[id]!;
      const fromStore = networkData?.nodes.find((n) => n.id === id);
      if (fromStore?.name) return fromStore.name;
      return id;
    },
    [networkData]
  );

  // Determine active scenario and trigger nodes
  const activeScenario = useMemo(() => {
    if (selectedScenario) return selectedScenario;
    if (scenariosData && scenariosData.length > 0) {
      const match = scenariosData.find(
        (s) =>
          s.id === presetId ||
          (presetId === "pipeline" && s.id === "pipeline_burst") ||
          (presetId === "monsoon" && s.id === "monsoon_flood") ||
          (presetId === "heatwave" && s.id === "heatwave_overload") ||
          (presetId === "cyber" && s.id === "cyberattack") ||
          (presetId === "quake" && s.id === "earthquake")
      );
      if (match) return match;
    }
    const presetMatch = PRESETS.find((p) => p.id === presetId);
    if (presetMatch) {
      return {
        id: presetMatch.id,
        name: presetMatch.label,
        summary: presetMatch.blurb,
        triggers: presetMatch.triggers.map((node) => ({ node })),
      };
    }
    return null;
  }, [selectedScenario, scenariosData, presetId]);

  const triggerIds = useMemo<string[]>(() => {
    if (!activeScenario) return [];
    return activeScenario.triggers.map((t: any) =>
      typeof t === "string" ? t : t.node
    );
  }, [activeScenario]);

  // Compute surrogate prediction
  const prediction = useMemo<SurrogatePrediction | null>(() => {
    if (!model || triggerIds.length === 0) return null;
    return predictSurrogate(model, triggerIds);
  }, [model, triggerIds]);

  // Engine actuals after simulation has run
  const engineActual = useMemo(() => {
    if (!result || !Array.isArray(result.frames) || result.frames.length === 0) {
      return null;
    }
    const finalFrame = result.frames[result.frames.length - 1]!;
    let affectedPopHours = 0;
    for (const f of result.frames) {
      affectedPopHours += f.affected_pop;
    }

    let hospitalDowntimeH = 0;
    const h1Down = result.frames.some(
      (f) => Array.isArray(f.failed) && f.failed.includes("H1")
    );
    const h2Down = result.frames.some(
      (f) => Array.isArray(f.failed) && f.failed.includes("H2")
    );
    if (h1Down) hospitalDowntimeH += 16;
    if (h2Down) hospitalDowntimeH += 16;

    const finalFailed = finalFrame.failed ? finalFrame.failed.length : 0;

    return {
      affected_pop_hours: affectedPopHours,
      hospital_downtime_h: hospitalDowntimeH,
      final_failed: finalFailed,
    };
  }, [result]);

  // Handle clicking an asset to select and fly to it on the globe
  const handleSelectNode = (nodeId: string) => {
    setSelectedGisNode(nodeId);
    if (civicShieldLayer && typeof civicShieldLayer.flyToNode === "function") {
      civicShieldLayer.flyToNode(nodeId);
    }
  };

  // Helper to render diff between surrogate estimate and engine actual
  const renderDiff = (est: number, act: number) => {
    if (act === 0 && est === 0) return null;
    const diffPct = act !== 0 ? ((est - act) / act) * 100 : 0;
    const isNeg = diffPct < 0;
    const sign = diffPct > 0 ? "+" : "";
    return (
      <span
        className={`text-[10px] ml-1.5 font-medium ${
          Math.abs(diffPct) <= 15
            ? "text-emerald-700"
            : Math.abs(diffPct) <= 30
            ? "text-amber-700"
            : "text-rose-700"
        }`}
      >
        ({sign}
        {diffPct.toFixed(1)}%)
      </span>
    );
  };

  // Split non-trigger assets into Likely (>= 0.5) and At risk (0.2 - 0.5)
  const { likelyToFail, atRisk } = useMemo(() => {
    if (!prediction || !prediction.asset_failure_probability) return { likelyToFail: [], atRisk: [] };

    const items = Object.entries(prediction.asset_failure_probability)
      .filter(([id]) => !triggerIds.includes(id))
      .map(([id, prob]) => ({
        id,
        name: getAssetName(id),
        prob,
        pct: Math.round(prob * 100),
      }))
      .sort((a, b) => b.prob - a.prob);

    const likely = items.filter((it) => it.prob >= 0.5);
    const risk = items.filter((it) => it.prob >= 0.2 && it.prob < 0.5);

    return { likelyToFail: likely, atRisk: risk };
  }, [prediction, triggerIds, getAssetName]);

  // 1. Loading Skeleton
  if (loading) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-3 animate-pulse font-sans">
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 bg-[#E5E7EB] rounded" />
          <div className="h-4 w-20 bg-[#E5E7EB] rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="h-16 bg-[#F7F8F5] rounded-[8px] border border-[#E5E7EB]" />
          <div className="h-16 bg-[#F7F8F5] rounded-[8px] border border-[#E5E7EB]" />
          <div className="h-16 bg-[#F7F8F5] rounded-[8px] border border-[#E5E7EB]" />
        </div>
        <div className="h-24 bg-[#F7F8F5] rounded-[8px] border border-[#E5E7EB]" />
        <div className="h-3 w-3/4 bg-[#E5E7EB] rounded" />
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800 text-xs font-sans">
        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold text-rose-900 mb-0.5">Surrogate Model Unavailable</div>
          <div className="text-[11px] text-rose-700 mb-2">{error}</div>
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
            className="px-2.5 py-1 rounded-[6px] bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 flex items-center gap-1.5 transition-colors text-[11px] cursor-pointer"
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
      className="bg-white dark:bg-[#111318] border border-[#E5E7EB] dark:border-[#27272A] rounded-xl p-4 space-y-4 text-[#111827] dark:text-[#FAFAFA] select-none font-sans shadow-xs"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] dark:border-[#27272A] pb-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white shrink-0 shadow-xs">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-[#111827] dark:text-[#FAFAFA] flex items-center gap-1.5">
              <span>AI Risk Estimate</span>
              <span className="text-[11px] text-[#94A3B8] dark:text-[#71717A] font-normal">
                ({activeScenario?.name || "Scenario"})
              </span>
            </h4>
            <div className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-medium mt-0.5 truncate max-w-xl">
              Triggers:{" "}
              {triggerIds.map((id) => `${getAssetName(id)} (${id})`).join(" + ")}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#F7F8FA] dark:bg-[#181B22] text-[#2563EB] dark:text-[#3B82F6] border border-[#E5E7EB] dark:border-[#27272A] flex items-center gap-1.5">
            <Cpu className="w-3 h-3" />
            <span>Surrogate ML</span>
          </span>
        </div>
      </div>

      {/* Out of Distribution Notice OR Metric Tiles */}
      {!prediction.in_distribution ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            outside training range
          </div>
          <div className="text-[12px] text-amber-800 dark:text-amber-300">
            Model was trained on 1 to 5 simultaneous failures. The current selection has{" "}
            {triggerIds.length} trigger nodes.
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Estimated affected population-hours */}
            <div className="bg-[#F7F8FA] dark:bg-[#181B22] p-3 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] flex flex-col justify-between">
              <span className="text-[11px] text-[#94A3B8] dark:text-[#71717A] font-medium leading-tight mb-1">
                Estimated affected population-hours
              </span>
              <div>
                <div className="text-base font-semibold text-[#111827] dark:text-[#FAFAFA]">
                  {fmt(prediction.affected_pop_hours)}
                </div>
                {engineActual && (
                  <div className="text-[11px] mt-1 text-[#94A3B8] dark:text-[#71717A] pt-1.5 border-t border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between">
                    <span>Engine: {fmt(engineActual.affected_pop_hours)}</span>
                    {renderDiff(prediction.affected_pop_hours, engineActual.affected_pop_hours)}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Estimated hospital downtime */}
            <div className="bg-[#F7F8FA] dark:bg-[#181B22] p-3 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] flex flex-col justify-between">
              <div className="flex flex-col mb-1">
                <span className="text-[11px] text-[#94A3B8] dark:text-[#71717A] font-medium leading-tight">
                  Estimated hospital downtime
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  low confidence (R2 0.72)
                </span>
              </div>
              <div>
                <div className="text-base font-semibold text-[#111827] dark:text-[#FAFAFA]">
                  {prediction.hospital_downtime_h}h
                </div>
                {engineActual && (
                  <div className="text-[11px] mt-1 text-[#94A3B8] dark:text-[#71717A] pt-1.5 border-t border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between">
                    <span>Engine: {engineActual.hospital_downtime_h}h</span>
                    {renderDiff(prediction.hospital_downtime_h, engineActual.hospital_downtime_h)}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Estimated failed assets */}
            <div className="bg-[#F7F8FA] dark:bg-[#181B22] p-3 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] flex flex-col justify-between">
              <span className="text-[11px] text-[#94A3B8] dark:text-[#71717A] font-medium leading-tight mb-1">
                Estimated failed assets
              </span>
              <div>
                <div className="text-base font-semibold text-[#111827] dark:text-[#FAFAFA]">
                  {prediction.final_failed}{" "}
                  <span className="text-[11px] text-[#94A3B8] dark:text-[#71717A] font-normal">of 26</span>
                </div>
                {engineActual && (
                  <div className="text-[11px] mt-1 text-[#94A3B8] dark:text-[#71717A] pt-1.5 border-t border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between">
                    <span>Engine: {engineActual.final_failed}</span>
                    {renderDiff(prediction.final_failed, engineActual.final_failed)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section A: Likely to fail (probability >= 0.5) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-[12px] font-semibold text-[#111827] dark:text-[#FAFAFA] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
                <span>Likely to fail (≥ 50% probability)</span>
              </h5>
              <span className="text-[11px] text-[#94A3B8] dark:text-[#71717A]">Click to locate</span>
            </div>

            {likelyToFail.length === 0 ? (
              <div className="text-[12px] text-[#94A3B8] dark:text-[#71717A] bg-[#F7F8FA] dark:bg-[#181B22] p-3 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] italic">
                No non-trigger assets reach the 50% failure threshold.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {likelyToFail.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNode(item.id)}
                    className="p-2.5 rounded-xl bg-[#F7F8FA] dark:bg-[#181B22] hover:bg-white dark:hover:bg-[#20242D] border border-[#E5E7EB] dark:border-[#27272A] hover:border-[#2563EB] dark:hover:border-[#3B82F6] text-left transition-all group flex flex-col justify-between cursor-pointer"
                    title={`Locate ${item.name} (${item.id}) on map`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full mb-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-semibold text-[#111827] dark:text-[#FAFAFA] group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition-colors truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] px-1 py-0.2 rounded bg-white dark:bg-[#111318] text-[#94A3B8] dark:text-[#71717A] border border-[#E5E7EB] dark:border-[#27272A] shrink-0 font-medium">
                          {item.id}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-[#2563EB] dark:text-[#3B82F6] shrink-0">
                        {item.pct}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-[#E5E7EB] dark:bg-[#27272A] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2563EB] dark:bg-[#3B82F6] transition-all duration-300 rounded-full"
                        style={{ width: `${Math.max(item.pct, 3)}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Section B: At risk (0.2 <= probability < 0.5) */}
          {atRisk.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <h5 className="text-[12px] font-semibold text-[#475569] dark:text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>At risk (20% – 50% probability)</span>
                </h5>
                <span className="text-[11px] text-[#94A3B8] dark:text-[#71717A]">Click to locate</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {atRisk.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNode(item.id)}
                    className="p-2.5 rounded-xl bg-[#F7F8FA]/80 dark:bg-[#181B22]/80 hover:bg-white dark:hover:bg-[#20242D] border border-[#E5E7EB] dark:border-[#27272A] hover:border-[#CBD5E1] dark:hover:border-[#3F3F46] text-left transition-all group flex flex-col justify-between cursor-pointer"
                    title={`Locate ${item.name} (${item.id}) on map`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full mb-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-medium text-[#475569] dark:text-[#A1A1AA] group-hover:text-[#111827] dark:group-hover:text-[#FAFAFA] transition-colors truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] px-1 py-0.2 rounded bg-white dark:bg-[#111318] text-[#94A3B8] dark:text-[#71717A] border border-[#E5E7EB] dark:border-[#27272A] shrink-0 font-medium">
                          {item.id}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                        {item.pct}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-[#E5E7EB] dark:bg-[#27272A] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500/80 transition-all duration-300 rounded-full"
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

      {/* Footer */}
      <div className="pt-2.5 border-t border-[#E5E7EB] dark:border-[#27272A] text-[11px] text-[#94A3B8] dark:text-[#71717A] leading-relaxed">
        Surrogate ML model trained on {model.trained_on} simulated cascades; held-out R2{" "}
        {r2PopHours} on population impact. Synthetic data. The simulator is the source of truth.
      </div>
    </div>
  );
};
