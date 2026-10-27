import * as Cesium from "cesium";

/**
 * Creates building styles matching the Sandcastle specification,
 * guarded against missing properties in 3D Tilesets.
 */

export function createYearStyle(): Cesium.Cesium3DTileStyle {
  return new Cesium.Cesium3DTileStyle({
    color: {
      conditions: [
        [
          "Boolean(${cnstrct_yr}) === false || Number(${cnstrct_yr}) === 0 || ${cnstrct_yr} === null",
          "color('grey', 0.65)",
        ],
        ["Number(${cnstrct_yr}) < 1900", "color('#4b0082', 0.85)"],
        ["Number(${cnstrct_yr}) < 1940", "color('#0000cd', 0.85)"],
        ["Number(${cnstrct_yr}) < 1970", "color('#008080', 0.85)"],
        ["Number(${cnstrct_yr}) < 1990", "color('#228b22', 0.85)"],
        ["Number(${cnstrct_yr}) < 2000", "color('#ffd700', 0.85)"],
        ["Number(${cnstrct_yr}) < 2010", "color('#ff8c00', 0.85)"],
        ["true", "color('#ff3300', 0.85)"],
      ],
    },
  });
}

export function createHeightStyle(): Cesium.Cesium3DTileStyle {
  // Support both custom tileset heightroof and global Cesium OSM estimatedHeight
  return new Cesium.Cesium3DTileStyle({
    color: {
      conditions: [
        [
          "Boolean(${heightroof}) && Number(${heightroof}) > 0",
          "Number(${heightroof}) >= 100 ? color('#253494', 0.9) : (Number(${heightroof}) >= 50 ? color('#2c7fb8', 0.85) : (Number(${heightroof}) >= 20 ? color('#41b6c4', 0.85) : (Number(${heightroof}) >= 10 ? color('#a1dab4', 0.8) : color('#ffffcc', 0.8))))",
        ],
        [
          "Boolean(${cesium#estimatedHeight}) && Number(${cesium#estimatedHeight}) > 0",
          "Number(${cesium#estimatedHeight}) >= 60 ? color('#253494', 0.9) : (Number(${cesium#estimatedHeight}) >= 30 ? color('#2c7fb8', 0.85) : (Number(${cesium#estimatedHeight}) >= 15 ? color('#41b6c4', 0.85) : (Number(${cesium#estimatedHeight}) >= 8 ? color('#a1dab4', 0.8) : color('#ffffcc', 0.8))))",
        ],
        ["true", "color('#3a4a58', 0.75)"],
      ],
    },
  });
}

export function createTallStyle(): Cesium.Cesium3DTileStyle {
  return new Cesium.Cesium3DTileStyle({
    color: {
      conditions: [
        ["(Boolean(${heightroof}) && Number(${heightroof}) >= 300) || (Boolean(${cesium#estimatedHeight}) && Number(${cesium#estimatedHeight}) >= 90)", "color('#ff0000', 1.0)"],
        ["(Boolean(${heightroof}) && Number(${heightroof}) >= 100) || (Boolean(${cesium#estimatedHeight}) && Number(${cesium#estimatedHeight}) >= 35)", "color('#ff8c00', 0.9)"],
        ["true", "color('#556270', 0.4)"],
      ],
    },
  });
}

export const STYLE_LEGEND_CONFIGS = {
  year: {
    title: "Construction Year",
    items: [
      { color: "#808080", label: "Unknown / Missing data" },
      { color: "#4b0082", label: "Before 1900" },
      { color: "#0000cd", label: "1900–1939" },
      { color: "#008080", label: "1940–1969" },
      { color: "#228b22", label: "1970–1989" },
      { color: "#ffd700", label: "1990–1999" },
      { color: "#ff8c00", label: "2000–2009" },
      { color: "#ff3300", label: "2010–present" },
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
