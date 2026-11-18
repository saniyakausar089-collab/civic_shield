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
  Calendar,
  Sparkles,
  Info,
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

  const isLandmark =
    inspectedPlace.category === "landmark" ||
    inspectedPlace.categoryLabel.toLowerCase().includes("landmark") ||
    inspectedPlace.categoryLabel.toLowerCase().includes("heritage");

  const categoryColor = isCollege
    ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
    : isHospital
      ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
      : isLandmark
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
        : "bg-[var(--accent-tint)] text-[var(--accent)] border-[var(--accent)]/20";

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
    <div className="absolute bottom-14 left-4 z-30 w-88 sm:w-96 max-h-[calc(100%-64px)] overflow-y-auto bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--border)] rounded-[20px] p-4 shadow-[var(--shadow-elevated)] text-xs font-sans text-[var(--text)] animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Top Banner / Header */}
      <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-[var(--border)]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full border flex items-center gap-1 font-semibold ${categoryColor}`}
            >
              {inspectedPlace.isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                  <span>IDENTIFYING...</span>
                </>
              ) : isCollege ? (
                <>
                  <GraduationCap className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span>{inspectedPlace.categoryLabel || "College / University"}</span>
                </>
              ) : isHospital ? (
                <>
                  <Building2 className="w-3 h-3 text-rose-600 dark:text-rose-400" />
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
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)] flex items-center gap-1 font-medium">
                <Sparkles className="w-2.5 h-2.5 text-[var(--accent)]" />
                <span>Verified POI</span>
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-[var(--text)] leading-snug truncate">
            {inspectedPlace.name}
          </h3>
        </div>

        <button
          onClick={() => setInspectedPlace(null)}
          className="p-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
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
      <div className="mt-2.5 flex items-start gap-1.5 text-[12px] text-[var(--text-secondary)] bg-[var(--surface-2)] p-2.5 rounded-[12px] border border-[var(--border)]">
        <MapPin className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" />
        <span className="line-clamp-2">{inspectedPlace.address}</span>
      </div>

      {/* Details Grid */}
      {inspectedPlace.details && Object.keys(inspectedPlace.details).length > 0 && (
        <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
          {Object.entries(inspectedPlace.details).map(([key, val]) => (
            <div
              key={key}
              className="bg-[var(--surface-2)] px-2.5 py-1.5 rounded-[12px] border border-[var(--border)] flex flex-col"
            >
              <span className="text-[var(--text-tertiary)] uppercase text-[9px] font-medium">{key}</span>
              <span className="text-[var(--text)] font-semibold truncate mt-0.5">{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Coordinates Bar */}
      <div className="mt-2.5 flex items-center justify-between bg-[var(--surface-2)] px-2.5 py-1.5 rounded-full border border-[var(--border)] text-[11px] text-[var(--text-tertiary)]">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3 h-3 text-[var(--accent)]" />
          <span>
            {inspectedPlace.lat.toFixed(5)}° N, {inspectedPlace.lon.toFixed(5)}° E
          </span>
        </div>
        <button
          onClick={handleCopyCoords}
          className="flex items-center gap-1 text-[11px] hover:text-[var(--text)] transition-colors text-[var(--accent)] font-medium cursor-pointer"
          title="Copy exact coordinates"
        >
          {copied ? <Check className="w-3 h-3 text-[#30d158]" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2 pt-2.5 border-t border-[var(--border)]">
        <button
          onClick={handleFlyTo}
          className="apple-btn-primary flex-1 py-2 px-3.5 rounded-full text-white font-semibold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-xs"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Fly Closer</span>
        </button>

        <button
          onClick={() => setInspectedPlace(null)}
          className="apple-btn-secondary py-2 px-3.5 rounded-full transition-all text-xs font-medium cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};

