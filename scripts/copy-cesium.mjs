import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const cesiumSource = path.resolve(rootDir, "node_modules/cesium/Build/Cesium");
const publicCesium = path.resolve(rootDir, "public/cesium");

const dirsToCopy = ["Assets", "ThirdParty", "Widgets", "Workers"];

console.log("[CIVICSHIELD] Ensuring Cesium static assets in public/cesium/...");

if (!fs.existsSync(cesiumSource)) {
  console.warn("[CIVICSHIELD] Cesium build source not found in node_modules, skipping copy.");
  process.exit(0);
}

if (!fs.existsSync(publicCesium)) {
  fs.mkdirSync(publicCesium, { recursive: true });
}

for (const dir of dirsToCopy) {
  const src = path.join(cesiumSource, dir);
  const dest = path.join(publicCesium, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true, force: true });
    console.log(`[CIVICSHIELD] Copied ${dir} to public/cesium/${dir}`);
  }
}

console.log("[CIVICSHIELD] Cesium assets ready.");
