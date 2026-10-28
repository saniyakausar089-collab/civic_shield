// Run: node scripts/validate-data.mjs [dataDir]
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2] || "public/data";
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
const network = read("network.json");
const hoods = read("neighborhoods.geojson");
const { scenarios } = read("scenarios.json");

const errors = [];
const err = (m) => errors.push(m);

// ---- nodes
const ids = new Set();
for (const n of network.nodes) {
  if (ids.has(n.id)) err(`duplicate node id ${n.id}`);
  ids.add(n.id);
  if (!(n.lat > 17 && n.lat < 18 && n.lon > 78 && n.lon < 79)) err(`${n.id} outside Hyderabad bbox`);
  if (n.load > n.capacity) err(`${n.id} load exceeds capacity`);
}

// ---- edges
const seen = new Set();
const lossByTargetType = {};
for (const e of network.edges) {
  if (!ids.has(e.source) || !ids.has(e.target)) err(`${e.id} references unknown node`);
  if (e.source === e.target) err(`${e.id} is a self loop`);
  if (!(e.weight > 0 && e.weight <= 1)) err(`${e.id} weight out of (0,1]`);
  const key = `${e.source}>${e.target}:${e.type}`;
  if (seen.has(key)) err(`duplicate edge ${key}`);
  seen.add(key);
  if (e.type !== "hazard") {
    const k = `${e.target}:${e.type}`;
    lossByTargetType[k] = (lossByTargetType[k] || 0) + e.weight;
  }
}
for (const [k, v] of Object.entries(lossByTargetType)) {
  if (v > 1.0001) err(`incoming ${k} weights sum to ${v.toFixed(2)} (> 1)`);
}

// ---- cycle check (Kahn)
const indeg = Object.fromEntries([...ids].map((i) => [i, 0]));
const adj = Object.fromEntries([...ids].map((i) => [i, []]));
for (const e of network.edges) { adj[e.source].push(e.target); indeg[e.target]++; }
const q = Object.keys(indeg).filter((i) => indeg[i] === 0);
let visited = 0;
while (q.length) {
  const u = q.shift(); visited++;
  for (const v of adj[u]) if (--indeg[v] === 0) q.push(v);
}
if (visited !== ids.size) err("dependency graph contains a cycle");

// ---- neighborhoods
for (const f of hoods.features) {
  const p = f.properties;
  for (const [net, nodeId] of Object.entries(p.served_by)) {
    if (!ids.has(nodeId)) err(`${p.id} ${net} -> unknown node ${nodeId}`);
  }
  const ring = f.geometry.coordinates[0];
  const [a, b] = [ring[0], ring[ring.length - 1]];
  if (a[0] !== b[0] || a[1] !== b[1]) err(`${p.id} polygon ring not closed`);
}

// ---- scenarios
for (const s of scenarios) {
  for (const t of s.triggers) if (!ids.has(t.node)) err(`scenario ${s.id} -> unknown node ${t.node}`);
}

const hospitals = network.nodes.filter((n) => n.type === "hospital").length;
const pop = hoods.features.reduce((a, f) => a + f.properties.population, 0);
console.log(`nodes: ${network.nodes.length} | edges: ${network.edges.length} | hospitals: ${hospitals}`);
console.log(`neighborhoods: ${hoods.features.length} | population: ${pop.toLocaleString("en-IN")} | scenarios: ${scenarios.length}`);

if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  errors.forEach((e) => console.error(" - " + e));
  process.exit(1);
}
console.log("OK: all Phase 1 data checks passed");
