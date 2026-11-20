import * as Cesium from "cesium";

/**
 * CIVICSHIELD CINEMATIC THEME
 * Jungle-video / Bioluminescent aesthetic:
 * Deep near-black with subtle green-teal tint (#060b09),
 * Glowing bioluminescent emerald accent (#00d1a0 to #2dffb3),
 * Amber for warning/spreading (#ffb020),
 * Hot crimson for rupture/failure (#ff2d55).
 */
export const CINEMATIC_THEME = {
  // Background Palette: Deep near-black with green-teal undertone
  bg: {
    hex: "#060b09",
    deepHex: "#030605",
    tailwind: "bg-[#060b09]",
    rgba: (alpha: number) => `rgba(6, 11, 9, ${alpha})`,
  },

  // Primary UI Accent: Glowing Bioluminescent Emerald-Mint
  accent: {
    hex: "#00d1a0",
    glowHex: "#2dffb3",
    hoverHex: "#39ffc4",
    rgb: "0, 209, 160",
    gradient: "linear-gradient(135deg, #00d1a0 0%, #2dffb3 100%)",
    tailwindGradient: "from-[#00d1a0] to-[#2dffb3]",
    tailwindText: "text-[#00d1a0]",
    tailwindBorder: "border-[#00d1a0]/40",
    tailwindBg: "bg-[#00d1a0]/10",
    glowShadow: "0 0 25px rgba(0, 209, 160, 0.4)",
    cesiumColor: Cesium.Color.fromCssColorString("#00d1a0"),
  },

  // Healthy / Nominal System Lifelines
  healthy: {
    hex: "#00d1a0",
    glowHex: "#2dffb3",
    tailwindText: "text-[#00d1a0]",
    tailwindBg: "bg-[#00d1a0]/10",
    tailwindBorder: "border-[#00d1a0]/30",
    cesiumColor: Cesium.Color.fromCssColorString("#00d1a0"),
    cesiumGlow: Cesium.Color.fromCssColorString("#2dffb3"),
    cesiumOutline: Cesium.Color.fromCssColorString("#060b09"),
  },

  // Warning / Interdependent Propagation
  warning: {
    hex: "#ffb020",
    tailwindText: "text-[#ffb020]",
    tailwindBg: "bg-[#ffb020]/10",
    tailwindBorder: "border-[#ffb020]/30",
    cesiumColor: Cesium.Color.fromCssColorString("#ffb020"),
    cesiumOutline: Cesium.Color.fromCssColorString("#060b09"),
  },

  // Rupture / Critical Offline Status
  critical: {
    hex: "#ff2d55",
    tailwindText: "text-[#ff2d55]",
    tailwindBg: "bg-[#ff2d55]/15",
    tailwindBorder: "border-[#ff2d55]/40",
    glowShadow: "0 0 25px rgba(255, 45, 85, 0.4)",
    cesiumColor: Cesium.Color.fromCssColorString("#ff2d55"),
    cesiumOutline: Cesium.Color.fromCssColorString("#060b09"),
  },

  // Premium Dark Glass Card Styling
  glass: {
    bg: "bg-[#060b09]/85 backdrop-blur-2xl",
    border: "border border-white/10",
    hoverBorder: "hover:border-[#00d1a0]/50",
    shadow: "shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(0,209,160,0.08)]",
  },
} as const;
