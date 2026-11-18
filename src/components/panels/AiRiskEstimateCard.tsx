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

  // Asset name lookup with fallback
  const getAssetName = useCallback(
    (id: string) => {
      if (STATIC_ASSET_NAMES[id]) return STATIC_ASSET_NAMES[id];
      const fromNet = networkData?.nodes.find((n) => n.id === id);
      return fromNet?.name || id;
    },
    [networkData]
  );

  // Determine active scenario triggers
  const activeScenario = useMemo(() => {
    return (
      selectedScenario ||
      scenariosData.find(
        (s) =>
          s.id === presetId ||
          (presetId === "pipeline" && s.id === "pipeline_burst") ||
          (presetId === "monsoon" && s.id === "monsoon_flood") ||
          (presetId === "heatwave" && s.id === "heatwave_overload") ||
          (presetId === "cyber" && s.id === "cyberattack") ||
          (presetId === "quake" && s.id === "earthquake")
      ) ||
      PRESETS.find((p) => p.id === presetId) ||
      null
    );
  }, [selectedScenario, scenariosData, presetId]);

  const triggerIds: string[] = useMemo(() => {
    if (!activeScenario) return [];
    const raw = (activeScenario as any).triggers || [];
    return raw
      .map((t: any) => (typeof t === "string" ? t : t?.node || t?.id))
      .filter(Boolean);
  }, [activeScenario]);

  // Compute ML prediction
  const prediction: SurrogatePrediction | null = useMemo(() => {
    if (!model || triggerIds.length === 0) return null;
    try {
      return predictSurrogate(model, triggerIds);
    } catch {
      return null;
    }
  }, [model, triggerIds]);

  // Ground truth actuals from engine (if available)
  const engineActual = useMemo(() => {
    if (!result || !result.metrics) return null;
    return {
      affected_pop_hours: Math.round(result.metrics.personHoursLost || 0),
      hospital_downtime_h: Math.round(result.metrics.hospitalHoursLost || 0),
      final_failed: result.metrics.finalFailed || 0,
    };
  }, [result]);

  // Handle locating node on map
  const handleSelectNode = (nodeId: string) => {
    const node = networkData?.nodes.find((n) => n.id === nodeId);
    if (node) {
      setSelectedGisNode(node);
    }
    if (civicShieldLayer && typeof (civicShieldLayer as any).flyToNode === "function") {
      (civicShieldLayer as any).flyToNode(nodeId);
    }
  };

  // Helper to render difference vs engine
  const renderDiff = (predVal: number, actualVal: number) => {
    if (actualVal === 0 && predVal === 0) return null;
    const diff = predVal - actualVal;
    const denom = actualVal === 0 ? 1 : actualVal;
    const diffPct = (diff / denom) * 100;
    const sign = diff >= 0 ? "+" : "";

    return (
      <span
        className={`text-[10px] ml-1.5 font-medium ${
          Math.abs(diffPct) <= 15
            ? "text-[var(--status-good)]"
            : Math.abs(diffPct) <= 30
            ? "text-[var(--status-degraded)]"
            : "text-[var(--status-failed)]"
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

  // Loading Skeleton
  if (loading) {
    return (
      <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[12px] p-4 space-y-3 animate-pulse font-sans">
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 bg-[var(--surface-3)] rounded" />
          <div className="h-4 w-20 bg-[var(--surface-3)] rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="h-16 bg-[var(--surface-2)] rounded-[8px] border border-[var(--border-subtle)]" />
          <div className="h-16 bg-[var(--surface-2)] rounded-[8px] border border-[var(--border-subtle)]" />
          <div className="h-16 bg-[var(--surface-2)] rounded-[8px] border border-[var(--border-subtle)]" />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-[var(--surface-2)] border border-[var(--status-failed)]/30 rounded-[12px] p-4 flex items-start gap-3 text-xs font-sans">
        <AlertTriangle className="w-4 h-4 text-[var(--status-failed)] shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold text-[var(--text-primary)] mb-0.5">Surrogate Model Unavailable</div>
          <div className="text-[11px] text-[var(--text-secondary)] mb-2">{error}</div>
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
            className="ops-btn-secondary px-2.5 py-1 text-[11px]"
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
      className="p-4 rounded-[12px] bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-4 text-[var(--text-primary)] select-none font-sans"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-[var(--surface-3)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)] shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <span>AI Risk Estimate</span>
              <span className="text-[11px] text-[var(--text-tertiary)] font-normal">
                ({activeScenario?.name || "Scenario"})
              </span>
            </h4>
            <div className="text-[11.5px] text-[var(--accent)] font-medium mt-0.5 truncate max-w-xl">
              Triggers:{" "}
              {triggerIds.map((id) => `${getAssetName(id)} (${id})`).join(" + ")}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <span className="ops-chip text-[11px]">
            <Cpu className="w-3 h-3 text-[var(--accent)]" />
            <span>Surrogate ML</span>
          </span>
        </div>
      </div>

      {/* Out of Distribution Notice OR Metric Tiles */}
      {!prediction.in_distribution ? (
        <div className="p-3.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--status-degraded)]/30 text-center space-y-1">
          <div className="text-xs font-semibold text-[var(--status-degraded)] uppercase tracking-wide">
            outside training range
          </div>
          <div className="text-[12px] text-[var(--text-secondary)]">
            Model was trained on 1 to 5 simultaneous failures. The current selection has{" "}
            {triggerIds.length} trigger nodes.
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Estimated affected population-hours */}
            <div className="bg-[var(--surface-2)] p-3 rounded-[8px] border border-[var(--border-subtle)] flex flex-col justify-between">
              <span className="text-[11px] text-[var(--text-tertiary)] font-medium leading-tight mb-1">
                Estimated affected population-hours
              </span>
              <div>
                <div className="text-base font-semibold text-[var(--text-primary)] tabular-nums">
                  {fmt(prediction.affected_pop_hours)}
                </div>
                {engineActual && (
                  <div className="text-[11px] mt-1 text-[var(--text-tertiary)] pt-1 border-t border-[var(--border-subtle)] flex items-center justify-between tabular-nums">
                    <span>Engine: {fmt(engineActual.affected_pop_hours)}</span>
                    {renderDiff(prediction.affected_pop_hours, engineActual.affected_pop_hours)}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Estimated hospital downtime */}
            <div className="bg-[var(--surface-2)] p-3 rounded-[8px] border border-[var(--border-subtle)] flex flex-col justify-between">
              <div className="flex flex-col mb-1">
                <span className="text-[11px] text-[var(--text-tertiary)] font-medium leading-tight">
                  Estimated hospital downtime
                </span>
                <span className="text-[10px] text-[var(--status-degraded)] font-medium">
                  low confidence (R2 0.72)
                </span>
              </div>
              <div>
                <div className="text-base font-semibold text-[var(--text-primary)] tabular-nums">
                  {prediction.hospital_downtime_h}h
                </div>
                {engineActual && (
                  <div className="text-[11px] mt-1 text-[var(--text-tertiary)] pt-1 border-t border-[var(--border-subtle)] flex items-center justify-between tabular-nums">
                    <span>Engine: {engineActual.hospital_downtime_h}h</span>
                    {renderDiff(prediction.hospital_downtime_h, engineActual.hospital_downtime_h)}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Estimated failed assets */}
            <div className="bg-[var(--surface-2)] p-3 rounded-[8px] border border-[var(--border-subtle)] flex flex-col justify-between">
              <span className="text-[11px] text-[var(--text-tertiary)] font-medium leading-tight mb-1">
                Estimated failed assets
              </span>
              <div>
                <div className="text-base font-semibold text-[var(--text-primary)] tabular-nums">
                  {prediction.final_failed}{" "}
                  <span className="text-[11px] text-[var(--text-tertiary)] font-normal">of 26</span>
                </div>
                {engineActual && (
                  <div className="text-[11px] mt-1 text-[var(--text-tertiary)] pt-1 border-t border-[var(--border-subtle)] flex items-center justify-between tabular-nums">
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
              <div className="ops-eyebrow flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <span>Likely to fail (≥ 50% probability)</span>
              </div>
              <span className="text-[11px] text-[var(--text-tertiary)]">Click to locate</span>
            </div>

            {likelyToFail.length === 0 ? (
              <div className="text-xs text-[var(--text-tertiary)] bg-[var(--surface-2)] p-2.5 rounded-[8px] border border-[var(--border-subtle)] italic">
                No non-trigger assets reach the 50% failure threshold.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {likelyToFail.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNode(item.id)}
                    className="p-2.5 rounded-[8px] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border-subtle)] text-left transition-colors flex flex-col justify-between cursor-pointer"
                    title={`Locate ${item.name} (${item.id}) on map`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full mb-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--surface-3)] text-[var(--text-tertiary)] border border-[var(--border-subtle)] shrink-0 font-medium">
                          {item.id}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-[var(--accent)] shrink-0 tabular-nums">
                        {item.pct}%
                      </span>
                    </div>

                    <div className="w-full h-1 bg-[var(--surface-3)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] rounded-full"
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
                <div className="ops-eyebrow flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-degraded)]" />
                  <span>At risk (20% – 50% probability)</span>
                </div>
                <span className="text-[11px] text-[var(--text-tertiary)]">Click to locate</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {atRisk.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNode(item.id)}
                    className="p-2.5 rounded-[8px] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border-subtle)] text-left transition-colors flex flex-col justify-between cursor-pointer"
                    title={`Locate ${item.name} (${item.id}) on map`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full mb-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--surface-3)] text-[var(--text-tertiary)] border border-[var(--border-subtle)] shrink-0 font-medium">
                          {item.id}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-[var(--status-degraded)] shrink-0 tabular-nums">
                        {item.pct}%
                      </span>
                    </div>

                    <div className="w-full h-1 bg-[var(--surface-3)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--status-degraded)] rounded-full"
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
      <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-tertiary)] leading-relaxed">
        Surrogate ML model trained on {model.trained_on} simulated cascades; held-out R2{" "}
        {r2PopHours} on population impact. Synthetic data. The simulator is the source of truth.
      </div>
    </div>
  );
};
