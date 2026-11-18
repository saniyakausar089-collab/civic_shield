/**
 * Legend configuration for 3D tilesets and GIS styling.
 * Separated from cesiumStyles.ts so components like MapLegendOverlay
 * can import legend metadata without triggering Cesium imports during SSR.
 */

export const STYLE_LEGEND_CONFIGS = {
  year: {
    title: "Construction Year",
    items: [
      { color: "#4A4E57", label: "Unknown / Missing data" },
      { color: "#312E5C", label: "Before 1900" },
      { color: "#3F4F8C", label: "1900–1939" },
      { color: "#3F7D9A", label: "1940–1969" },
      { color: "#52A38F", label: "1970–1989" },
      { color: "#9CC47E", label: "1990–1999" },
      { color: "#E0C56B", label: "2000–2009" },
      { color: "#F0F0D8", label: "2010–present" },
    ],
  },
  height: {
    title: "Roof Height (ft)",
    items: [
      { color: "#808080", label: "Unknown / Missing data" },
      { color: "#ffffcc", label: "< 10 ft" },
      { color: "#a1dab4", label: "10–19 ft" },
      { color: "#41b6c4", label: "20–49 ft" },
      { color: "#2c7fb8", label: "50–99 ft" },
      { color: "#253494", label: "≥ 100 ft" },
    ],
  },
  tall: {
    title: "Tall Building Isolation",
    items: [
      { color: "#ff0000", label: "≥ 300 ft (Skyscraper)" },
      { color: "#ff8c00", label: "100–299 ft (Tall)" },
      { color: "#aaaaaa", label: "Low-rise / Baseline" },
    ],
  },
} as const;
