import React from "react";
import { X, ShieldAlert, Zap, Layers, MapPin, Activity, CheckCircle, AlertCircle } from "lucide-react";
import { useAppStore, currentSnapshot } from "@/store/appStore";
import { BASE_CITY, nodeById } from "@/engine/city";
import { applyMods } from "@/engine/analysis";
import { explainFailure } from "@/engine/explain";
import { GEO_NODES, GIS_ORIGIN } from "@/engine/geoCoordinates";

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
    failed: { label: "Failed / Out of Service", color: "text-[#ff453a]", bg: "bg-rose-500/10 border-rose-500/20" },
    stressed: { label: "Stressed / Contingency", color: "text-[#ff9f0a]", bg: "bg-amber-500/10 border-amber-500/20" },
    recovering: { label: "Recovering / Restoring", color: "text-[var(--accent)]", bg: "bg-[var(--accent-tint)] border-[var(--accent)]/20" },
    ok: { label: "Normal Operations", color: "text-[#30d158]", bg: "bg-emerald-500/10 border-emerald-500/20" },
  }[status];

  // Downstream dependents: nodes in city that depend on this node
  const dependents = city.nodes.filter((n) => n.deps.some((d) => d.id === node.id));

  return (
    <div className="w-88 h-full flex flex-col bg-[var(--surface)] border-l border-[var(--border)] text-[var(--text)] select-none text-xs font-sans shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--text)]">{node.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)] font-medium">
              {node.id}
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
            CLASS: {node.kind.toUpperCase()} • {geoInfo?.district ?? "District Core"}
          </div>
        </div>
        <button
          onClick={() => select(null)}
          className="p-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Inspector Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* Status Indicator Bar */}
        <div className={`p-3 rounded-[16px] border ${statusConfig.bg}`}>
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-tertiary)]">
            Operational State (T+{hour.toString().padStart(2, "0")}h)
          </div>
          <div className={`font-semibold text-xs mt-0.5 ${statusConfig.color}`}>
            {statusConfig.label}
          </div>
        </div>

        {/* Geographic Coordinates & Elevation */}
        <div className="p-3 bg-[var(--surface-2)] rounded-[16px] border border-[var(--border)] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" /> Coordinates (WGS 84)
            </span>
            <span>Alt: {geoInfo?.elevation ?? 15}m MSL</span>
          </div>
          <div className="text-[11px] font-semibold text-[var(--text)]">
            {geoInfo ? `${geoInfo.lat.toFixed(4)}°N, ${Math.abs(geoInfo.lng).toFixed(4)}°W` : "17.3850°N, 78.4867°E"}
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)]">
            Footprint: {geoInfo?.footprintDimensions[0] ?? 60}m × {geoInfo?.footprintDimensions[1] ?? 50}m cadastral parcel
          </div>
        </div>

        {/* Engineering Capacity & Resilience Parameters */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[var(--surface-2)] p-2.5 rounded-[14px] border border-[var(--border)]">
            <div className="text-[10px] uppercase text-[var(--text-tertiary)] font-semibold">Service Demand</div>
            <div className="font-semibold text-[var(--text)] mt-0.5">
              {node.population > 0 ? `${node.population.toLocaleString()} pop` : "Infrastructure"}
            </div>
          </div>
          <div className="bg-[var(--surface-2)] p-2.5 rounded-[14px] border border-[var(--border)]">
            <div className="text-[10px] uppercase text-[var(--text-tertiary)] font-semibold">Backup Autonomy</div>
            <div className="font-semibold text-[var(--text)] mt-0.5">{node.backupHours} hrs reserve</div>
          </div>
          <div className="bg-[var(--surface-2)] p-2.5 rounded-[14px] border border-[var(--border)]">
            <div className="text-[10px] uppercase text-[var(--text-tertiary)] font-semibold">Stress Degradation</div>
            <div className="font-semibold text-[var(--text)] mt-0.5">
              {Math.round(lostFraction * 100)}% <span className="text-[var(--text-tertiary)] text-[10px] font-normal">(&ge;{Math.round(node.failureThreshold * 100)}%)</span>
            </div>
          </div>
          <div className="bg-[var(--surface-2)] p-2.5 rounded-[14px] border border-[var(--border)]">
            <div className="text-[10px] uppercase text-[var(--text-tertiary)] font-semibold">Standard MTTR</div>
            <div className="font-semibold text-[var(--text)] mt-0.5">{node.repairHours} hrs repair</div>
          </div>
        </div>

        {/* Upstream Dependencies */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-tertiary)] flex items-center justify-between">
            <span>Upstream Dependencies ({node.deps.length})</span>
            <span className="text-[var(--text-tertiary)]">Supply Inflow</span>
          </div>
          {node.deps.length === 0 ? (
            <div className="p-3 bg-[var(--surface-2)] rounded-[14px] border border-[var(--border)] text-[11px] text-[var(--text-tertiary)]">
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
                    className="p-2.5 rounded-[12px] bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--surface)] hover:shadow-xs cursor-pointer flex items-center justify-between text-[11px] transition-all"
                  >
                    <div>
                      <span className="font-semibold text-[var(--text)]">{depNode?.name ?? d.id}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)] ml-1.5 uppercase font-medium">({d.layer})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-[var(--text-tertiary)]">{Math.round(d.weight * 100)}%</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${
                          depStatus === "failed"
                            ? "bg-rose-500/10 text-[#ff453a] border border-rose-500/20"
                            : depStatus === "stressed"
                            ? "bg-amber-500/10 text-[#ff9f0a] border border-amber-500/20"
                            : "bg-emerald-500/10 text-[#30d158] border border-emerald-500/20"
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
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-tertiary)] flex items-center justify-between">
            <span>Downstream Dependents ({dependents.length})</span>
            <span className="text-[var(--text-tertiary)]">Impact Outflow</span>
          </div>
          {dependents.length === 0 ? (
            <div className="p-3 bg-[var(--surface-2)] rounded-[14px] border border-[var(--border)] text-[11px] text-[var(--text-tertiary)]">
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
                    className="p-2.5 rounded-[12px] bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--surface)] hover:shadow-xs cursor-pointer flex items-center justify-between text-[11px] transition-all"
                  >
                    <span className="font-semibold text-[var(--text)] truncate">{depTarget.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ml-1 ${
                        targetStatus === "failed"
                          ? "bg-rose-500/10 text-[#ff453a] border border-rose-500/20"
                          : targetStatus === "stressed"
                          ? "bg-amber-500/10 text-[#ff9f0a] border border-amber-500/20"
                          : "bg-emerald-500/10 text-[#30d158] border border-emerald-500/20"
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
        <div className="p-3 bg-[var(--surface-2)] rounded-[16px] border border-[var(--border)] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-[var(--accent)] tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Root Cause Propagation Diagnosis</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-sans">{explanation}</p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3.5 border-t border-[var(--border)]">
        <button
          onClick={() => toggleTrigger(node.id)}
          className={`w-full py-2.5 px-4 rounded-full text-xs font-semibold transition-all duration-180 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98] ${
            isTrigger
              ? "bg-rose-500/10 text-[#ff453a] border border-rose-500/30 hover:bg-rose-500/20"
              : "apple-btn-primary text-white"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isTrigger ? "Remove Primary Trigger" : "Trigger Outage At This Node"}</span>
        </button>
      </div>
    </div>
  );
};
