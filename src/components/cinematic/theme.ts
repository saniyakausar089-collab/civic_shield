/**
 * CIVICSHIELD CINEMATIC THEME TOKENS
 * Single source of truth for the cinematic landing page.
 * Edit this file to retune the palette across the entire experience.
 */

import * as Cesium from "cesium";

export const CINEMATIC_THEME = {
  // Backgrounds: Deep violet-black space
  bg: {
    base: "#0a0612",
    glass: "rgba(16, 10, 26, 0.82)",
    glassDark: "rgba(10, 6, 18, 0.92)",
    cardBorder: "rgba(168, 85, 247, 0.18)",
    cardBorderHover: "rgba(217, 70, 239, 0.55)",
  },

  // Status Colors
  healthy: {
    hex: "#34f5a5",
    tailwindText: "text-[#34f5a5]",
    tailwindBg: "bg-[#34f5a5]/15",
    tailwindBorder: "border-[#34f5a5]/30",
    glowRgba: "rgba(52, 245, 165, 0.4)",
    cesiumColor: Cesium.Color.fromCssColorString("#34f5a5"),
    cesiumOutline: Cesium.Color.fromCssColorString("#064e3b"),
  },

  warning: {
    hex: "#ffb020",
    tailwindText: "text-[#ffb020]",
    tailwindBg: "bg-[#ffb020]/15",
    tailwindBorder: "border-[#ffb020]/30",
    glowRgba: "rgba(255, 176, 32, 0.4)",
    cesiumColor: Cesium.Color.fromCssColorString("#ffb020"),
    cesiumOutline: Cesium.Color.fromCssColorString("#78350f"),
  },

  critical: {
    hex: "#ff2d55",
    tailwindText: "text-[#ff2d55]",
    tailwindBg: "bg-[#ff2d55]/15",
    tailwindBorder: "border-[#ff2d55]/30",
    glowRgba: "rgba(255, 45, 85, 0.45)",
    cesiumColor: Cesium.Color.fromCssColorString("#ff2d55"),
    cesiumOutline: Cesium.Color.fromCssColorString("#881337"),
  },

  // UI Accents: Magenta to Violet Gradient
  accent: {
    primaryHex: "#d946ef",
    secondaryHex: "#a855f7",
    darkHex: "#701a75",
    gradientCss: "linear-gradient(135deg, #c026d3 0%, #a855f7 100%)",
    gradientHoverCss: "linear-gradient(135deg, #d946ef 0%, #c084fc 100%)",
    tailwindGradient: "bg-gradient-to-r from-fuchsia-600 to-purple-500",
    tailwindText: "text-fuchsia-400",
    glowShadow: "0 0 25px rgba(217, 70, 239, 0.35)",
    cesiumColor: Cesium.Color.fromCssColorString("#d946ef"),
  },

  // Text Contrast Tokens
  text: {
    primary: "#f8fafc",
    secondary: "#cbd5e1",
    muted: "#94a3b8",
    monoMuted: "#64748b",
  },
} as const;
