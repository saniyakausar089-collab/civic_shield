import React from "react";
import {
  X,
  MapPin,
  GraduationCap,
  Building2,
  Navigation,
  Compass,
  Copy,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";

export const PlaceInspectorPopup: React.FC = () => {
  const inspectedPlace = useAppStore((s) => s.inspectedPlace);
  const setInspectedPlace = useAppStore((s) => s.setInspectedPlace);
  const civicShieldLayer = useAppStore((s) => s.civicShieldLayer);
  const [copied, setCopied] = React.useState(false);

  if (!inspectedPlace) return null;

  const isCollege =
    inspectedPlace.category === "college" ||
    inspectedPlace.category === "university" ||
    inspectedPlace.categoryLabel.toLowerCase().includes("college") ||
    inspectedPlace.categoryLabel.toLowerCase().includes("university");

  const isHospital =
    inspectedPlace.category === "hospital" ||
    inspectedPlace.categoryLabel.toLowerCase().includes("hospital") ||
    inspectedPlace.categoryLabel.toLowerCase().includes("medical");

  const handleFlyTo = () => {
    if (civicShieldLayer) {
      if (typeof civicShieldLayer.flyToCoordinates === "function") {
        civicShieldLayer.flyToCoordinates(
          inspectedPlace.lon,
          inspectedPlace.lat,
          isCollege ? 1500 : 2000,
          1.2
        );
      }
      if (typeof civicShieldLayer.highlightLocation === "function") {
        civicShieldLayer.highlightLocation(
          inspectedPlace.lon,
          inspectedPlace.lat,
          inspectedPlace.name
        );
      }
    }
  };

  const handleCopyCoords = () => {
    const text = `${inspectedPlace.lat.toFixed(5)}, ${inspectedPlace.lon.toFixed(5)}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute bottom-14 left-4 z-30 w-88 sm:w-96 max-h-[calc(100%-64px)] overflow-y-auto bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[12px] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)] text-xs font-sans text-[var(--text-primary)] animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Top Banner / Header */}
      <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-[var(--border-subtle)]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="ops-chip text-[11px] gap-1 font-semibold">
              {inspectedPlace.isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-[var(--accent)]" />
                  <span>IDENTIFYING...</span>
                </>
              ) : isCollege ? (
                <>
                  <GraduationCap className="w-3 h-3 text-[var(--accent)]" />
                  <span>{inspectedPlace.categoryLabel || "College / University"}</span>
                </>
              ) : isHospital ? (
                <>
                  <Building2 className="w-3 h-3 text-[var(--status-failed)]" />
                  <span>{inspectedPlace.categoryLabel || "Hospital / Medical"}</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3 text-[var(--accent)]" />
                  <span>{inspectedPlace.categoryLabel || "Urban Location"}</span>
                </>
              )}
            </span>

            {inspectedPlace.isCurated && (
              <span className="ops-chip text-[10px] gap-1">
                <Sparkles className="w-2.5 h-2.5 text-[var(--accent)]" />
                <span>Verified POI</span>
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-snug truncate">
            {inspectedPlace.name}
          </h3>
        </div>

        <button
          onClick={() => setInspectedPlace(null)}
          className="p-1 rounded-[6px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          title="Close place inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Overview / Subtext */}
      {inspectedPlace.subtext && (
        <p className="mt-2 text-[12px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
          {inspectedPlace.subtext}
        </p>
      )}

      {/* Address */}
      <div className="mt-2.5 flex items-start gap-1.5 text-[12px] text-[var(--text-secondary)] bg-[var(--surface-2)] p-2.5 rounded-[8px] border border-[var(--border-subtle)]">
        <MapPin className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" />
        <span className="line-clamp-2">{inspectedPlace.address}</span>
      </div>

      {/* Details Grid */}
      {inspectedPlace.details && Object.keys(inspectedPlace.details).length > 0 && (
        <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
          {Object.entries(inspectedPlace.details).map(([key, val]) => (
            <div
              key={key}
              className="bg-[var(--surface-2)] px-2.5 py-1.5 rounded-[8px] border border-[var(--border-subtle)] flex flex-col"
            >
              <span className="text-[var(--text-tertiary)] uppercase text-[9px] font-medium">{key}</span>
              <span className="text-[var(--text-primary)] font-semibold truncate mt-0.5">{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Coordinates Bar */}
      <div className="mt-2.5 flex items-center justify-between bg-[var(--surface-2)] px-2.5 py-1.5 rounded-full border border-[var(--border-subtle)] text-[11px] text-[var(--text-tertiary)]">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3 h-3 text-[var(--accent)]" />
          <span>
            {inspectedPlace.lat.toFixed(5)}° N, {inspectedPlace.lon.toFixed(5)}° E
          </span>
        </div>
        <button
          onClick={handleCopyCoords}
          className="flex items-center gap-1 text-[11px] hover:text-[var(--text-primary)] transition-colors text-[var(--accent)] font-medium cursor-pointer"
          title="Copy exact coordinates"
        >
          {copied ? <Check className="w-3 h-3 text-[var(--status-good)]" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2 pt-2.5 border-t border-[var(--border-subtle)]">
        <button
          onClick={handleFlyTo}
          className="ops-btn-primary flex-1 py-2 px-3.5 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Fly Closer</span>
        </button>

        <button
          onClick={() => setInspectedPlace(null)}
          className="ops-btn-secondary py-2 px-3.5 text-xs font-medium cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
