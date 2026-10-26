import React from "react";
import { X, AlertCircle, ShieldAlert, Zap, Activity } from "lucide-react";
import { useAppStore, currentSnapshot } from "@/store/appStore";
import { BASE_CITY, nodeById } from "@/engine/city";
import { applyMods } from "@/engine/analysis";
import { explainFailure } from "@/engine/explain";

export const NodeDetailsModal: React.FC = () => {
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

  const snap = currentSnapshot(result, hour);
  const status = snap.status[node.id] ?? "ok";
  const lostFraction = snap.lost[node.id] ?? 0;
  const isTrigger = triggers.includes(node.id);
  const explanation = explainFailure(result, city, node.id);

  const statusBadge = {
    failed: { label: "Failed", color: "bg-red-500/20 text-red-400 border-red-500/40" },
    stressed: { label: "Stressed", color: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
    recovering: { label: "Recovering", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
    ok: { label: "Operational", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  }[status];

  return (
    <div className="absolute top-16 right-3 sm:right-6 z-30 w-80 sm:w-96 bg-card/95 backdrop-blur-md rounded-2xl border border-border shadow-2xl p-4 animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-border pb-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">{node.name}</h2>
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${statusBadge.color}`}
            >
              {statusBadge.label}
            </span>
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5 uppercase">
            ID: {node.id} • KIND: {node.kind}
          </div>
        </div>
        <button
          onClick={() => select(null)}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Close details"
          aria-label="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="bg-muted/40 p-2 rounded-xl border border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase font-mono">Population</div>
          <div className="font-semibold text-foreground mt-0.5">
            {node.population > 0 ? node.population.toLocaleString() : "Infrastructure (0)"}
          </div>
        </div>
        <div className="bg-muted/40 p-2 rounded-xl border border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase font-mono">Autonomy Backup</div>
          <div className="font-semibold text-foreground mt-0.5">{node.backupHours} hours</div>
        </div>
        <div className="bg-muted/40 p-2 rounded-xl border border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase font-mono">Dep Loss</div>
          <div className="font-semibold text-foreground mt-0.5">
            {Math.round(lostFraction * 100)}% (Thresh: {Math.round(node.failureThreshold * 100)}%)
          </div>
        </div>
        <div className="bg-muted/40 p-2 rounded-xl border border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase font-mono">Repair Time</div>
          <div className="font-semibold text-foreground mt-0.5">{node.repairHours} hours</div>
        </div>
      </div>

      {/* Causal Explanation ("Explain Why") */}
      <div className="bg-secondary/40 rounded-xl p-2.5 border border-border/60 mb-3 text-xs leading-relaxed">
        <div className="flex items-center gap-1.5 font-semibold text-cyan-400 mb-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Failure Diagnosis</span>
        </div>
        <p className="text-muted-foreground">{explanation}</p>
      </div>

      {/* Dependencies */}
      {node.deps.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] uppercase font-mono text-muted-foreground mb-1.5">
            Dependencies ({node.deps.length})
          </div>
          <div className="space-y-1">
            {node.deps.map((d) => {
              const depStatus = snap.status[d.id] ?? "ok";
              const depNode = nodeById(city, d.id);
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between text-xs px-2 py-1 rounded-lg bg-muted/30 border border-border/30"
                >
                  <span className="font-mono text-foreground">
                    {depNode?.name ?? d.id} ({d.layer})
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase ${
                      depStatus === "failed"
                        ? "text-red-400 font-bold"
                        : depStatus === "stressed"
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {depStatus} ({Math.round(d.weight * 100)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-border">
        <button
          onClick={() => toggleTrigger(node.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-colors shadow-sm ${
            isTrigger
              ? "bg-red-500/20 text-red-300 border border-red-500/50 hover:bg-red-500/30"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          {isTrigger ? "Remove Trigger" : "Break This Node (Trigger)"}
        </button>
      </div>
    </div>
  );
};
