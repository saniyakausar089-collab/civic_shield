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
    ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
    : isHospital
      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
      : isLandmark
        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
        : "bg-sky-500/20 text-sky-300 border-sky-500/40";

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
    <div className="absolute bottom-14 left-4 z-30 w-88 sm:w-96 max-h-[calc(100%-64px)] overflow-y-auto bg-[#191F24]/95 backdrop-blur-md border border-[#303941] rounded-xl p-4 shadow-2xl text-xs font-mono text-[#e5e9ec] animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Top Banner / Header */}
      <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-[#303941]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 font-semibold ${categoryColor}`}
            >
              {inspectedPlace.isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                  <span>IDENTIFYING...</span>
                </>
              ) : isCollege ? (
                <>
                  <GraduationCap className="w-3 h-3 text-purple-400" />
                  <span>{inspectedPlace.categoryLabel || "College / University"}</span>
                </>
              ) : isHospital ? (
                <>
                  <Building2 className="w-3 h-3 text-rose-400" />
                  <span>{inspectedPlace.categoryLabel || "Hospital / Medical"}</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3 text-sky-400" />
                  <span>{inspectedPlace.categoryLabel || "Urban Location"}</span>
                </>
              )}
            </span>

            {inspectedPlace.isCurated && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#242c33] text-[#9BAA76] border border-[#3e4a54] flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-[#9BAA76]" />
                <span>VERIFIED POI</span>
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-[#f1f4f6] leading-snug truncate">
            {inspectedPlace.name}
          </h3>
        </div>

        <button
          onClick={() => setInspectedPlace(null)}
          className="p-1 rounded-md text-[#8a96a1] hover:text-[#f1f4f6] hover:bg-[#242c33] transition-colors"
          title="Close place inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Overview / Subtext */}
      {inspectedPlace.subtext && (
        <p className="mt-2 text-[11px] text-[#9ba8b3] leading-relaxed line-clamp-2">
          {inspectedPlace.subtext}
        </p>
      )}

      {/* Address */}
      <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-[#c2cbd2] bg-[#14191d] p-2 rounded-lg border border-[#242c33]">
        <MapPin className="w-3.5 h-3.5 text-[#38bdf8] shrink-0 mt-0.5" />
        <span className="line-clamp-2">{inspectedPlace.address}</span>
      </div>

      {/* Details Grid */}
      {inspectedPlace.details && Object.keys(inspectedPlace.details).length > 0 && (
        <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[10px]">
          {Object.entries(inspectedPlace.details).map(([key, val]) => (
            <div
              key={key}
              className="bg-[#14191d]/80 px-2 py-1 rounded border border-[#242c33] flex flex-col"
            >
              <span className="text-[#8a96a1] uppercase text-[9px]">{key}</span>
              <span className="text-[#e5e9ec] font-semibold truncate mt-0.5">{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Coordinates Bar */}
      <div className="mt-2.5 flex items-center justify-between bg-[#14191d] px-2.5 py-1.5 rounded-lg border border-[#242c33] text-[10px] text-[#8a96a1]">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3 h-3 text-[#9BAA76]" />
          <span>
            {inspectedPlace.lat.toFixed(5)}° N, {inspectedPlace.lon.toFixed(5)}° E
          </span>
        </div>
        <button
          onClick={handleCopyCoords}
          className="flex items-center gap-1 text-[9px] hover:text-[#f1f4f6] transition-colors text-[#38bdf8]"
          title="Copy exact coordinates"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-[#303941]">
        <button
          onClick={handleFlyTo}
          className="flex-1 py-1.5 px-3 rounded-lg bg-[#242c33] hover:bg-[#2c363f] text-[#38bdf8] border border-[#3e4a54] font-medium flex items-center justify-center gap-1.5 transition-colors text-xs"
        >
          <Navigation className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Fly Closer</span>
        </button>

        <button
          onClick={() => setInspectedPlace(null)}
          className="py-1.5 px-3 rounded-lg bg-[#1e242a] hover:bg-[#242c33] text-[#8a96a1] hover:text-[#e5e9ec] border border-[#303941] transition-colors text-xs"
        >
          Close
        </button>
      </div>
    </div>
  );
};

