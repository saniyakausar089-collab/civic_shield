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
          "color('#4A4E57', 0.65)",
        ],
        ["Number(${cnstrct_yr}) < 1900", "color('#312E5C', 0.85)"],
        ["Number(${cnstrct_yr}) < 1940", "color('#3F4F8C', 0.85)"],
        ["Number(${cnstrct_yr}) < 1970", "color('#3F7D9A', 0.85)"],
        ["Number(${cnstrct_yr}) < 1990", "color('#52A38F', 0.85)"],
        ["Number(${cnstrct_yr}) < 2000", "color('#9CC47E', 0.85)"],
        ["Number(${cnstrct_yr}) < 2010", "color('#E0C56B', 0.85)"],
        ["true", "color('#F0F0D8', 0.85)"],
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

export { STYLE_LEGEND_CONFIGS } from "./cesiumLegendConfigs";
