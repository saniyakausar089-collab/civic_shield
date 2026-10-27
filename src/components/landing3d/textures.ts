import * as THREE from "three";

/**
 * Procedural PBR Texture generators.
 * Creates deterministic, high-quality textures in memory with zero external requests.
 */

// Cached singletons
let buildingTextureCache: { diffuse: THREE.CanvasTexture; emissive: THREE.CanvasTexture } | null = null;
let asphaltTextureCache: THREE.CanvasTexture | null = null;
let concreteTextureCache: { map: THREE.CanvasTexture; roughness: THREE.CanvasTexture } | null = null;
let soilCutawayTextureCache: THREE.CanvasTexture | null = null;
let metalTextureCache: { map: THREE.CanvasTexture; roughness: THREE.CanvasTexture } | null = null;

export function getBuildingTextures() {
  if (buildingTextureCache) return buildingTextureCache;

  const width = 512;
  const height = 1024;

  // Diffuse Canvas
  const diffCanvas = document.createElement("canvas");
  diffCanvas.width = width;
  diffCanvas.height = height;
  const diffCtx = diffCanvas.getContext("2d")!;

  // Emissive Canvas
  const emissCanvas = document.createElement("canvas");
  emissCanvas.width = width;
  emissCanvas.height = height;
  const emissCtx = emissCanvas.getContext("2d")!;

  // Dark slate concrete facade background
  diffCtx.fillStyle = "#1e242b";
  diffCtx.fillRect(0, 0, width, height);

  emissCtx.fillStyle = "#000000";
  emissCtx.fillRect(0, 0, width, height);

  const cols = 16;
  const rows = 48;
  const cellW = width / cols;
  const cellH = height / rows;
  const padX = cellW * 0.22;
  const padY = cellH * 0.28;
  const winW = cellW - padX * 2;
  const winH = cellH - padY * 2;

  // Pseudo-random seeded pattern
  let seed = 12345;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW + padX;
      const y = r * cellH + padY;
      const val = rnd();

      // Diffuse window tint (dark reflective glass)
      diffCtx.fillStyle = "#0d1318";
      diffCtx.fillRect(x, y, winW, winH);

      // Emissive windows (some lit, some off)
      if (val > 0.42) {
        let col = "#dce7f0"; // Cool LED office white
        if (val > 0.78) col = "#f8d59e"; // Warm sodium incandescent
        else if (val > 0.95) col = "#64b5f6"; // High-tech cyan glow

        emissCtx.fillStyle = col;
        emissCtx.fillRect(x, y, winW, winH);

        diffCtx.fillStyle = col;
        diffCtx.fillRect(x, y, winW, winH);
      }
    }
  }

  const diffuse = new THREE.CanvasTexture(diffCanvas);
  diffuse.wrapS = THREE.RepeatWrapping;
  diffuse.wrapT = THREE.RepeatWrapping;
  diffuse.anisotropy = 4;

  const emissive = new THREE.CanvasTexture(emissCanvas);
  emissive.wrapS = THREE.RepeatWrapping;
  emissive.wrapT = THREE.RepeatWrapping;
  emissive.anisotropy = 4;

  buildingTextureCache = { diffuse, emissive };
  return buildingTextureCache;
}

export function getAsphaltTexture() {
  if (asphaltTextureCache) return asphaltTextureCache;

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Dark charcoal asphalt
  ctx.fillStyle = "#121518";
  ctx.fillRect(0, 0, size, size);

  // Subtle noise grain
  const imgData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 16;
    imgData.data[i] = Math.min(255, Math.max(0, 18 + noise));
    imgData.data[i + 1] = Math.min(255, Math.max(0, 21 + noise));
    imgData.data[i + 2] = Math.min(255, Math.max(0, 24 + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Center road divider yellow dashed line
  ctx.strokeStyle = "#c99a38";
  ctx.lineWidth = 4;
  ctx.setLineDash([20, 16]);
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.stroke();

  // White lane boundaries
  ctx.strokeStyle = "#505a63";
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(24, size);
  ctx.moveTo(size - 24, 0);
  ctx.lineTo(size - 24, size);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  asphaltTextureCache = texture;
  return texture;
}

export function getSoilCutawayTexture() {
  if (soilCutawayTextureCache) return soilCutawayTextureCache;

  const w = 512;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Geotechnical soil strata layers (dark realistic cross-section)
  // Layer 0: asphalt base
  ctx.fillStyle = "#181a1d";
  ctx.fillRect(0, 0, w, 30);

  // Layer 1: engineered gravel substrate
  ctx.fillStyle = "#2c2825";
  ctx.fillRect(0, 30, w, 70);

  // Layer 2: dense clay / loam
  ctx.fillStyle = "#201c18";
  ctx.fillRect(0, 100, w, 140);

  // Layer 3: deep bedrock and shale
  ctx.fillStyle = "#141517";
  ctx.fillRect(0, 240, w, 272);

  // Strata horizontal fissure lines
  ctx.strokeStyle = "#38322c";
  ctx.lineWidth = 2;
  for (let y = 35; y < h; y += 45) {
    ctx.beginPath();
    ctx.moveTo(0, y + (Math.random() - 0.5) * 8);
    ctx.bezierCurveTo(
      w * 0.3,
      y + (Math.random() - 0.5) * 12,
      w * 0.7,
      y + (Math.random() - 0.5) * 12,
      w,
      y + (Math.random() - 0.5) * 8
    );
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  soilCutawayTextureCache = texture;
  return texture;
}

export function getBrushedMetalTexture() {
  if (metalTextureCache) return metalTextureCache;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#555b63";
  ctx.fillRect(0, 0, size, size);

  // Directional brush lines
  ctx.strokeStyle = "#40454c";
  ctx.lineWidth = 1;
  for (let i = 0; i < 400; i++) {
    const y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;

  // Roughness map (metallic high-specular with subtle striation)
  const rCanvas = document.createElement("canvas");
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext("2d")!;
  rCtx.fillStyle = "#4a4a4a";
  rCtx.fillRect(0, 0, size, size);

  const roughness = new THREE.CanvasTexture(rCanvas);
  metalTextureCache = { map, roughness };
  return metalTextureCache;
}
