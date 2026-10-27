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
    failed: { label: "Failed / Out of Service", color: "text-[#d9534f]", bg: "bg-[#401c1c] border-[#d9534f]/60" },
    stressed: { label: "Stressed / Contingency", color: "text-[#e09f3e]", bg: "bg-[#3d2d14] border-[#e09f3e]/60" },
    recovering: { label: "Recovering / Restoring", color: "text-[#8fae70]", bg: "bg-[#253320] border-[#8fae70]/60" },
    ok: { label: "Normal Operations", color: "text-[#9BAA76]", bg: "bg-[#222a20] border-[#9BAA76]/40" },
  }[status];

  // Downstream dependents: nodes in city that depend on this node
  const dependents = city.nodes.filter((n) => n.deps.some((d) => d.id === node.id));

  return (
    <div className="w-88 h-full flex flex-col bg-[#191F24] border-l border-[#303941] text-[#e5e9ec] select-none text-xs">
      {/* Header */}
      <div className="p-3 border-b border-[#303941] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[#f1f4f6]">{node.name}</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#242c33] text-[#8a96a1] border border-[#303941]">
              {node.id}
            </span>
          </div>
          <div className="text-[10px] text-[#8a96a1] font-mono mt-0.5">
            CLASS: {node.kind.toUpperCase()} • {geoInfo?.district ?? "District Core"}
          </div>
        </div>
        <button
          onClick={() => select(null)}
          className="p-1 rounded text-[#8a96a1] hover:text-[#f1f4f6] hover:bg-[#242c33] transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Inspector Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Status Indicator Bar */}
        <div className={`p-2.5 rounded border ${statusConfig.bg}`}>
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#8a96a1]">
            Operational State (T+{hour.toString().padStart(2, "0")}h)
          </div>
          <div className={`font-semibold text-xs mt-0.5 ${statusConfig.color}`}>
            {statusConfig.label}
          </div>
        </div>

        {/* Geographic Coordinates & Elevation */}
        <div className="p-2.5 bg-[#14191d] rounded border border-[#303941] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-[#8a96a1] font-mono">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#9BAA76]" /> Coordinates (WGS 84)
            </span>
            <span>Alt: {geoInfo?.elevation ?? 15}m MSL</span>
          </div>
          <div className="font-mono text-[11px] text-[#d2d8de]">
            {geoInfo ? `${geoInfo.lat.toFixed(4)}°N, ${Math.abs(geoInfo.lng).toFixed(4)}°W` : "37.7749°N, 122.4194°W"}
          </div>
          <div className="text-[10px] text-[#616e79]">
            Footprint: {geoInfo?.footprintDimensions[0] ?? 60}m × {geoInfo?.footprintDimensions[1] ?? 50}m cadastral parcel
          </div>
        </div>

        {/* Engineering Capacity & Resilience Parameters */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#14191d] p-2 rounded border border-[#303941]">
            <div className="text-[9px] uppercase font-mono text-[#8a96a1]">Service Demand</div>
            <div className="font-semibold text-[#f1f4f6] mt-0.5">
              {node.population > 0 ? `${node.population.toLocaleString()} pop` : "Infrastructure"}
            </div>
          </div>
          <div className="bg-[#14191d] p-2 rounded border border-[#303941]">
            <div className="text-[9px] uppercase font-mono text-[#8a96a1]">Backup Autonomy</div>
            <div className="font-semibold text-[#f1f4f6] mt-0.5">{node.backupHours} hrs reserve</div>
          </div>
          <div className="bg-[#14191d] p-2 rounded border border-[#303941]">
            <div className="text-[9px] uppercase font-mono text-[#8a96a1]">Stress Degradation</div>
            <div className="font-semibold text-[#f1f4f6] mt-0.5">
              {Math.round(lostFraction * 100)}% <span className="text-[#8a96a1] text-[10px]">(&ge;{Math.round(node.failureThreshold * 100)}%)</span>
            </div>
          </div>
          <div className="bg-[#14191d] p-2 rounded border border-[#303941]">
            <div className="text-[9px] uppercase font-mono text-[#8a96a1]">Standard MTTR</div>
            <div className="font-semibold text-[#f1f4f6] mt-0.5">{node.repairHours} hrs repair</div>
          </div>
        </div>

        {/* Upstream Dependencies */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#8a96a1] flex items-center justify-between">
            <span>Upstream Dependencies ({node.deps.length})</span>
            <span className="text-[#616e79]">Supply Inflow</span>
          </div>
          {node.deps.length === 0 ? (
            <div className="p-2 bg-[#14191d] rounded border border-[#303941] text-[11px] text-[#616e79]">
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
                    className="p-1.5 rounded bg-[#14191d] border border-[#303941] hover:bg-[#20272e] cursor-pointer flex items-center justify-between text-[11px] transition-colors"
                  >
                    <div>
                      <span className="font-medium text-[#e5e9ec]">{depNode?.name ?? d.id}</span>
                      <span className="text-[9px] text-[#8a96a1] ml-1.5 font-mono uppercase">({d.layer})</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span className="text-[#8a96a1]">{Math.round(d.weight * 100)}%</span>
                      <span
                        className={`px-1 py-0.5 rounded text-[9px] ${
                          depStatus === "failed"
                            ? "bg-[#401c1c] text-[#ff8f8f]"
                            : depStatus === "stressed"
                            ? "bg-[#3d2d14] text-[#e09f3e]"
                            : "bg-[#222a20] text-[#8fae70]"
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
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#8a96a1] flex items-center justify-between">
            <span>Downstream Dependents ({dependents.length})</span>
            <span className="text-[#616e79]">Impact Outflow</span>
          </div>
          {dependents.length === 0 ? (
            <div className="p-2 bg-[#14191d] rounded border border-[#303941] text-[11px] text-[#616e79]">
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
                    className="p-1.5 rounded bg-[#14191d] border border-[#303941] hover:bg-[#20272e] cursor-pointer flex items-center justify-between text-[11px] transition-colors"
                  >
                    <span className="font-medium text-[#e5e9ec] truncate">{depTarget.name}</span>
                    <span
                      className={`px-1 py-0.5 rounded text-[9px] font-mono shrink-0 ml-1 ${
                        targetStatus === "failed"
                          ? "bg-[#401c1c] text-[#ff8f8f]"
                          : targetStatus === "stressed"
                          ? "bg-[#3d2d14] text-[#e09f3e]"
                          : "bg-[#222a20] text-[#8fae70]"
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
        <div className="p-2.5 bg-[#14191d] rounded border border-[#303941] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#9BAA76]">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Root Cause Propagation Diagnosis</span>
          </div>
          <p className="text-[11px] text-[#8a96a1] leading-relaxed font-sans">{explanation}</p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 border-t border-[#303941]">
        <button
          onClick={() => toggleTrigger(node.id)}
          className={`w-full py-2 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
            isTrigger
              ? "bg-[#401c1c] text-[#ff8f8f] border border-[#d9534f]/70 hover:bg-[#502222]"
              : "bg-[#2c363f] border border-[#303941] text-[#e5e9ec] hover:bg-[#35414c]"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-[#d9534f]" />
          <span>{isTrigger ? "Remove Primary Trigger" : "Trigger Outage At This Node"}</span>
        </button>
      </div>
    </div>
  );
};
