import React from "react";
import { X, ShieldAlert, Zap, MapPin } from "lucide-react";
import { useAppStore, currentSnapshot } from "@/store/appStore";
import { BASE_CITY, nodeById } from "@/engine/city";
import { applyMods } from "@/engine/analysis";
import { explainFailure } from "@/engine/explain";
import { GEO_NODES } from "@/engine/geoCoordinates";

export const RightImpactInspector: React.FC = () => {
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const select = useAppStore((s) => s.select);
  const triggers = useAppStore((s) => s.triggers);
  const toggleTrigger = useAppStore((s) => s.toggleTrigger);
  const cityMods = useAppStore((s) => s.cityMods);
  const result = useAppStore((s) => s.result);
  const hour = useAppStore((s) => s.hour);

  if (!selectedNodeId) return null;

  const city = applyMods(BASE_CITY, cityMods);
  const node = nodeById(city, selectedNodeId);
  if (!node) return null;

  const geoInfo = GEO_NODES[node.id];
  const snap = currentSnapshot(result, hour);
  const status = snap.status[node.id] ?? "ok";
  const lostFraction = snap.lost[node.id] ?? 0;
  const isTrigger = triggers.includes(node.id);
  const explanation = explainFailure(result, city, node.id);

  // Status badge styling
  const statusConfig = {
    failed: { label: "Failed / Out of Service", color: "text-[var(--status-failed)]", bg: "bg-[var(--status-failed)]/15 border-[var(--status-failed)]/30" },
    stressed: { label: "Stressed / Contingency", color: "text-[var(--status-degraded)]", bg: "bg-[var(--status-degraded)]/15 border-[var(--status-degraded)]/30" },
    recovering: { label: "Recovering / Restoring", color: "text-[var(--accent)]", bg: "bg-[var(--accent-muted)] border-[var(--accent)]/30" },
    ok: { label: "Normal Operations", color: "text-[var(--status-good)]", bg: "bg-[var(--status-good)]/15 border-[var(--status-good)]/30" },
  }[status];

  // Downstream dependents: nodes in city that depend on this node
  const dependents = city.nodes.filter((n) => n.deps.some((d) => d.id === node.id));

  return (
    <div className="w-88 h-full flex flex-col bg-[var(--surface-1)] border-l border-[var(--border-subtle)] text-[var(--text-primary)] select-none text-xs font-sans shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--text-primary)]">{node.name}</span>
            <span className="ops-chip text-[10px]">
              {node.id}
            </span>
          </div>
          <div className="ops-eyebrow text-[10px] mt-0.5">
            CLASS: {node.kind.toUpperCase()} • {geoInfo?.district ?? "District Core"}
          </div>
        </div>
        <button
          onClick={() => select(null)}
          className="p-1 rounded-[6px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Inspector Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* Status Indicator Bar */}
        <div className={`p-3 rounded-[12px] border ${statusConfig.bg}`}>
          <div className="ops-eyebrow text-[10px]">
            Operational State (T+{hour.toString().padStart(2, "0")}h)
          </div>
          <div className={`font-semibold text-xs mt-0.5 ${statusConfig.color}`}>
            {statusConfig.label}
          </div>
        </div>

        {/* Geographic Coordinates & Elevation */}
        <div className="p-3 bg-[var(--surface-2)] rounded-[12px] border border-[var(--border-subtle)] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" /> Coordinates (WGS 84)
            </span>
            <span>Alt: {geoInfo?.elevation ?? 15}m MSL</span>
          </div>
          <div className="text-[11px] font-semibold text-[var(--text-primary)]">
            {geoInfo ? `${geoInfo.lat.toFixed(4)}°N, ${Math.abs(geoInfo.lng).toFixed(4)}°W` : "17.3850°N, 78.4867°E"}
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)]">
            Footprint: {geoInfo?.footprintDimensions[0] ?? 60}m × {geoInfo?.footprintDimensions[1] ?? 50}m cadastral parcel
          </div>
        </div>

        {/* Engineering Capacity & Resilience Parameters */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[var(--surface-2)] p-2.5 rounded-[12px] border border-[var(--border-subtle)]">
            <div className="ops-eyebrow text-[9.5px]">Service Demand</div>
            <div className="font-semibold text-[var(--text-primary)] mt-0.5 tabular-nums">
              {node.population > 0 ? `${node.population.toLocaleString()} pop` : "Infrastructure"}
            </div>
          </div>
          <div className="bg-[var(--surface-2)] p-2.5 rounded-[12px] border border-[var(--border-subtle)]">
            <div className="ops-eyebrow text-[9.5px]">Backup Autonomy</div>
            <div className="font-semibold text-[var(--text-primary)] mt-0.5 tabular-nums">{node.backupHours} hrs reserve</div>
          </div>
          <div className="bg-[var(--surface-2)] p-2.5 rounded-[12px] border border-[var(--border-subtle)]">
            <div className="ops-eyebrow text-[9.5px]">Stress Degradation</div>
            <div className="font-semibold text-[var(--text-primary)] mt-0.5 tabular-nums">
              {Math.round(lostFraction * 100)}% <span className="text-[var(--text-tertiary)] text-[10px] font-normal">(&ge;{Math.round(node.failureThreshold * 100)}%)</span>
            </div>
          </div>
          <div className="bg-[var(--surface-2)] p-2.5 rounded-[12px] border border-[var(--border-subtle)]">
            <div className="ops-eyebrow text-[9.5px]">Standard MTTR</div>
            <div className="font-semibold text-[var(--text-primary)] mt-0.5 tabular-nums">{node.repairHours} hrs repair</div>
          </div>
        </div>

        {/* Upstream Dependencies */}
        <div className="space-y-1.5">
          <div className="ops-eyebrow text-[10px] flex items-center justify-between">
            <span>Upstream Dependencies ({node.deps.length})</span>
            <span>Supply Inflow</span>
          </div>
          {node.deps.length === 0 ? (
            <div className="p-3 bg-[var(--surface-2)] rounded-[12px] border border-[var(--border-subtle)] text-[11px] text-[var(--text-tertiary)]">
              Root generation asset (no upstream dependencies).
            </div>
          ) : (
            <div className="space-y-1.5">
              {node.deps.map((d) => {
                const depStatus = snap.status[d.id] ?? "ok";
                const depNode = nodeById(city, d.id);
                return (
                  <div
                    key={d.id}
                    onClick={() => select(d.id)}
                    className="p-2.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:bg-[var(--surface-3)] cursor-pointer flex items-center justify-between text-[11px] transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-[var(--text-primary)]">{depNode?.name ?? d.id}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)] ml-1.5 uppercase font-medium">({d.layer})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-[var(--text-tertiary)] tabular-nums">{Math.round(d.weight * 100)}%</span>
                      <span
                        className={`px-2 py-0.5 rounded-[4px] font-medium text-[10px] ${
                          depStatus === "failed"
                            ? "bg-[var(--status-failed)]/15 text-[var(--status-failed)] border border-[var(--status-failed)]/30"
                            : depStatus === "stressed"
                            ? "bg-[var(--status-degraded)]/15 text-[var(--status-degraded)] border border-[var(--status-degraded)]/30"
                            : "bg-[var(--status-good)]/15 text-[var(--status-good)] border border-[var(--status-good)]/30"
                        }`}
                      >
                        {depStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Downstream Impact Cascades */}
        <div className="space-y-1.5">
          <div className="ops-eyebrow text-[10px] flex items-center justify-between">
            <span>Downstream Dependents ({dependents.length})</span>
            <span>Impact Outflow</span>
          </div>
          {dependents.length === 0 ? (
            <div className="p-3 bg-[var(--surface-2)] rounded-[12px] border border-[var(--border-subtle)] text-[11px] text-[var(--text-tertiary)]">
              Terminal consumer endpoint (no further downstream assets).
            </div>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {dependents.map((depTarget) => {
                const targetStatus = snap.status[depTarget.id] ?? "ok";
                return (
                  <div
                    key={depTarget.id}
                    onClick={() => select(depTarget.id)}
                    className="p-2.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:bg-[var(--surface-3)] cursor-pointer flex items-center justify-between text-[11px] transition-colors"
                  >
                    <span className="font-semibold text-[var(--text-primary)] truncate">{depTarget.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium shrink-0 ml-1 ${
                        targetStatus === "failed"
                          ? "bg-[var(--status-failed)]/15 text-[var(--status-failed)] border border-[var(--status-failed)]/30"
                          : targetStatus === "stressed"
                          ? "bg-[var(--status-degraded)]/15 text-[var(--status-degraded)] border border-[var(--status-degraded)]/30"
                          : "bg-[var(--status-good)]/15 text-[var(--status-good)] border border-[var(--status-good)]/30"
                      }`}
                    >
                      {targetStatus}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Engineering Failure Diagnosis */}
        <div className="p-3 bg-[var(--surface-2)] rounded-[12px] border border-[var(--border-subtle)] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-[var(--accent)] tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Root Cause Propagation Diagnosis</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">{explanation}</p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3.5 border-t border-[var(--border-subtle)]">
        <button
          onClick={() => toggleTrigger(node.id)}
          className={`w-full py-2.5 px-4 rounded-[8px] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            isTrigger
              ? "bg-[var(--status-failed)]/15 text-[var(--status-failed)] border border-[var(--status-failed)]/30 hover:bg-[var(--status-failed)]/25"
              : "ops-btn-primary"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isTrigger ? "Remove Primary Trigger" : "Trigger Outage At This Node"}</span>
        </button>
      </div>
    </div>
  );
};
