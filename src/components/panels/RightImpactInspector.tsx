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
    failed: { label: "Failed / Out of Service", color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
    stressed: { label: "Stressed / Contingency", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    recovering: { label: "Recovering / Restoring", color: "text-[#2563EB] dark:text-[#3B82F6]", bg: "bg-[#2563EB]/10 border-[#2563EB]/20" },
    ok: { label: "Normal Operations", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  }[status];

  // Downstream dependents: nodes in city that depend on this node
  const dependents = city.nodes.filter((n) => n.deps.some((d) => d.id === node.id));

  return (
    <div className="w-88 h-full flex flex-col bg-white dark:bg-[#111318] border-l border-[#E5E7EB] dark:border-[#27272A] text-[#111827] dark:text-[#FAFAFA] select-none text-xs font-sans shadow-lg">
      {/* Header */}
      <div className="p-3.5 border-b border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[#111827] dark:text-[#FAFAFA]">{node.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#F7F8FA] dark:bg-[#181B22] text-[#94A3B8] dark:text-[#71717A] border border-[#E5E7EB] dark:border-[#27272A] font-medium">
              {node.id}
            </span>
          </div>
          <div className="text-[11px] text-[#94A3B8] dark:text-[#71717A] mt-0.5">
            CLASS: {node.kind.toUpperCase()} • {geoInfo?.district ?? "District Core"}
          </div>
        </div>
        <button
          onClick={() => select(null)}
          className="p-1 rounded-md text-[#94A3B8] dark:text-[#71717A] hover:text-[#111827] dark:hover:text-[#FAFAFA] hover:bg-[#F7F8FA] dark:hover:bg-[#181B22] transition-colors cursor-pointer"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Inspector Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Status Indicator Bar */}
        <div className={`p-2.5 rounded-xl border ${statusConfig.bg}`}>
          <div className="text-[10px] uppercase font-medium tracking-wider text-[#94A3B8] dark:text-[#71717A]">
            Operational State (T+{hour.toString().padStart(2, "0")}h)
          </div>
          <div className={`font-semibold text-xs mt-0.5 ${statusConfig.color}`}>
            {statusConfig.label}
          </div>
        </div>

        {/* Geographic Coordinates & Elevation */}
        <div className="p-2.5 bg-[#F7F8FA] dark:bg-[#181B22] rounded-xl border border-[#E5E7EB] dark:border-[#27272A] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-[#94A3B8] dark:text-[#71717A]">
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" /> Coordinates (WGS 84)
            </span>
            <span>Alt: {geoInfo?.elevation ?? 15}m MSL</span>
          </div>
          <div className="text-[11px] font-semibold text-[#111827] dark:text-[#FAFAFA]">
            {geoInfo ? `${geoInfo.lat.toFixed(4)}°N, ${Math.abs(geoInfo.lng).toFixed(4)}°W` : "17.3850°N, 78.4867°E"}
          </div>
          <div className="text-[11px] text-[#94A3B8] dark:text-[#71717A]">
            Footprint: {geoInfo?.footprintDimensions[0] ?? 60}m × {geoInfo?.footprintDimensions[1] ?? 50}m cadastral parcel
          </div>
        </div>

        {/* Engineering Capacity & Resilience Parameters */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#F7F8FA] dark:bg-[#181B22] p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#27272A]">
            <div className="text-[10px] uppercase text-[#94A3B8] dark:text-[#71717A] font-medium">Service Demand</div>
            <div className="font-semibold text-[#111827] dark:text-[#FAFAFA] mt-0.5">
              {node.population > 0 ? `${node.population.toLocaleString()} pop` : "Infrastructure"}
            </div>
          </div>
          <div className="bg-[#F7F8FA] dark:bg-[#181B22] p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#27272A]">
            <div className="text-[10px] uppercase text-[#94A3B8] dark:text-[#71717A] font-medium">Backup Autonomy</div>
            <div className="font-semibold text-[#111827] dark:text-[#FAFAFA] mt-0.5">{node.backupHours} hrs reserve</div>
          </div>
          <div className="bg-[#F7F8FA] dark:bg-[#181B22] p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#27272A]">
            <div className="text-[10px] uppercase text-[#94A3B8] dark:text-[#71717A] font-medium">Stress Degradation</div>
            <div className="font-semibold text-[#111827] dark:text-[#FAFAFA] mt-0.5">
              {Math.round(lostFraction * 100)}% <span className="text-[#94A3B8] dark:text-[#71717A] text-[10px] font-normal">(&ge;{Math.round(node.failureThreshold * 100)}%)</span>
            </div>
          </div>
          <div className="bg-[#F7F8FA] dark:bg-[#181B22] p-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#27272A]">
            <div className="text-[10px] uppercase text-[#94A3B8] dark:text-[#71717A] font-medium">Standard MTTR</div>
            <div className="font-semibold text-[#111827] dark:text-[#FAFAFA] mt-0.5">{node.repairHours} hrs repair</div>
          </div>
        </div>

        {/* Upstream Dependencies */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-medium tracking-wider text-[#94A3B8] dark:text-[#71717A] flex items-center justify-between">
            <span>Upstream Dependencies ({node.deps.length})</span>
            <span className="text-[#94A3B8] dark:text-[#71717A]">Supply Inflow</span>
          </div>
          {node.deps.length === 0 ? (
            <div className="p-2.5 bg-[#F7F8FA] dark:bg-[#181B22] rounded-xl border border-[#E5E7EB] dark:border-[#27272A] text-[11px] text-[#94A3B8] dark:text-[#71717A]">
              Root generation asset (no upstream dependencies).
            </div>
          ) : (
            <div className="space-y-1">
              {node.deps.map((d) => {
                const depStatus = snap.status[d.id] ?? "ok";
                const depNode = nodeById(city, d.id);
                return (
                  <div
                    key={d.id}
                    onClick={() => select(d.id)}
                    className="p-2 rounded-lg bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] hover:bg-[#E5E7EB]/70 dark:hover:bg-[#20242D] cursor-pointer flex items-center justify-between text-[11px] transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-[#111827] dark:text-[#FAFAFA]">{depNode?.name ?? d.id}</span>
                      <span className="text-[10px] text-[#94A3B8] dark:text-[#71717A] ml-1.5 uppercase font-medium">({d.layer})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-[#94A3B8] dark:text-[#71717A]">{Math.round(d.weight * 100)}%</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-md font-medium text-[10px] ${
                          depStatus === "failed"
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                            : depStatus === "stressed"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
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
          <div className="text-[10px] uppercase font-medium tracking-wider text-[#94A3B8] dark:text-[#71717A] flex items-center justify-between">
            <span>Downstream Dependents ({dependents.length})</span>
            <span className="text-[#94A3B8] dark:text-[#71717A]">Impact Outflow</span>
          </div>
          {dependents.length === 0 ? (
            <div className="p-2.5 bg-[#F7F8FA] dark:bg-[#181B22] rounded-xl border border-[#E5E7EB] dark:border-[#27272A] text-[11px] text-[#94A3B8] dark:text-[#71717A]">
              Terminal consumer endpoint (no further downstream assets).
            </div>
          ) : (
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {dependents.map((depTarget) => {
                const targetStatus = snap.status[depTarget.id] ?? "ok";
                return (
                  <div
                    key={depTarget.id}
                    onClick={() => select(depTarget.id)}
                    className="p-2 rounded-lg bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] hover:bg-[#E5E7EB]/70 dark:hover:bg-[#20242D] cursor-pointer flex items-center justify-between text-[11px] transition-colors"
                  >
                    <span className="font-semibold text-[#111827] dark:text-[#FAFAFA] truncate">{depTarget.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium shrink-0 ml-1 ${
                        targetStatus === "failed"
                          ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                          : targetStatus === "stressed"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
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
        <div className="p-2.5 bg-[#F7F8FA] dark:bg-[#181B22] rounded-xl border border-[#E5E7EB] dark:border-[#27272A] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-[#2563EB] dark:text-[#3B82F6]">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Root Cause Propagation Diagnosis</span>
          </div>
          <p className="text-[11px] text-[#475569] dark:text-[#A1A1AA] leading-relaxed font-sans">{explanation}</p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 border-t border-[#E5E7EB] dark:border-[#27272A]">
        <button
          onClick={() => toggleTrigger(node.id)}
          className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-180 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98] ${
            isTrigger
              ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
              : "bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isTrigger ? "Remove Primary Trigger" : "Trigger Outage At This Node"}</span>
        </button>
      </div>
    </div>
  );
};
