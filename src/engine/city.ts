// Synthetic city model: ~26 nodes on a 9x7 grid with weighted dependencies,
// redundancy, and the flood-prone East Underpass linked to the Main Pipeline.
import type { City, CityNode, Dep, NodeKind, SystemLayer } from "./types";

const dep = (id: string, weight: number, layer: SystemLayer): Dep => ({ id, weight, layer });

const node = (
  id: string,
  name: string,
  kind: NodeKind,
  x: number,
  y: number,
  population: number,
  backupHours: number,
  failureThreshold: number,
  repairHours: number,
  deps: Dep[],
): CityNode => ({ id, name, kind, x, y, population, backupHours, failureThreshold, repairHours, deps });

export const BASE_CITY: City = {
  nodes: [
    // ---- Power ----
    node("PP1", "Central Grid Plant", "powerplant", 0, 3, 0, 6, 0.9, 24, []),
    node("SUB1", "North Substation", "substation", 2, 1, 0, 2, 0.8, 12, [dep("PP1", 1.0, "power")]),
    node("SUB2", "Central Substation", "substation", 3, 3, 0, 3, 0.8, 12, [dep("PP1", 0.5, "power"), dep("SUB1", 0.5, "power")]),
    node("SUB3", "South Substation", "substation", 2, 5, 0, 2, 0.8, 12, [dep("PP1", 0.5, "power"), dep("SUB2", 0.5, "power")]),
    // ---- Water ----
    node("WT1", "North Water Works", "waterplant", 4, 0, 0, 3, 0.7, 10, [dep("SUB1", 1.0, "power")]),
    node("WT2", "South Water Works", "waterplant", 4, 6, 0, 3, 0.7, 10, [dep("SUB2", 0.5, "power"), dep("SUB3", 0.5, "power")]),
    node("PIPE1", "Main Pipeline", "pipeline", 5, 3, 0, 2, 0.7, 10, [dep("WT1", 0.6, "water"), dep("WT2", 0.4, "water")]),
    // ---- Pumps ----
    node("PUMPA", "Pump Station A", "pump", 6, 1, 0, 2, 0.5, 8, [dep("PIPE1", 0.6, "water"), dep("SUB1", 0.4, "power")]),
    node("PUMPB", "Pump Station B", "pump", 6, 4, 0, 1, 0.5, 8, [dep("PIPE1", 0.6, "water"), dep("SUB2", 0.4, "power")]),
    node("PUMPC", "Pump Station C", "pump", 5, 5, 0, 2, 0.5, 8, [dep("PIPE1", 0.5, "water"), dep("SUB3", 0.5, "power")]),
    // ---- Hospitals ----
    node("H1", "Eastside Medical", "hospital", 7, 2, 40000, 8, 0.3, 12, [dep("SUB2", 0.45, "power"), dep("PUMPA", 0.35, "water"), dep("T1", 0.2, "telecom")]),
    node("H2", "Riverside Hospital", "hospital", 7, 5, 30000, 10, 0.3, 12, [dep("SUB3", 0.45, "power"), dep("PUMPC", 0.35, "water"), dep("T2", 0.2, "telecom")]),
    // ---- Neighborhoods ----
    node("N1", "Harborview", "neighborhood", 0, 0, 18000, 3, 0.3, 6, [dep("SUB1", 0.4, "power"), dep("PUMPA", 0.35, "water"), dep("RJ1", 0.15, "transport"), dep("T1", 0.1, "telecom")]),
    node("N2", "Old Town", "neighborhood", 1, 2, 24000, 2, 0.3, 6, [dep("SUB2", 0.4, "power"), dep("PUMPB", 0.35, "water"), dep("RJ1", 0.15, "transport"), dep("T2", 0.1, "telecom")]),
    node("N3", "Riverside", "neighborhood", 1, 4, 30000, 2, 0.3, 6, [dep("SUB3", 0.4, "power"), dep("PUMPB", 0.35, "water"), dep("RJ2", 0.15, "transport"), dep("T2", 0.1, "telecom")]),
    node("N4", "Millbrook", "neighborhood", 2, 3, 15000, 4, 0.3, 6, [dep("SUB2", 0.45, "power"), dep("PUMPB", 0.3, "water"), dep("RJ2", 0.15, "transport"), dep("T2", 0.1, "telecom")]),
    node("N5", "Hillcrest", "neighborhood", 3, 1, 22000, 3, 0.3, 6, [dep("SUB1", 0.45, "power"), dep("PUMPA", 0.3, "water"), dep("RJ1", 0.15, "transport"), dep("T1", 0.1, "telecom")]),
    node("N6", "Southgate", "neighborhood", 3, 5, 26000, 2, 0.3, 6, [dep("SUB3", 0.4, "power"), dep("PUMPC", 0.35, "water"), dep("RJ2", 0.15, "transport"), dep("T3", 0.1, "telecom")]),
    node("N7", "Eastgate", "neighborhood", 8, 1, 20000, 3, 0.3, 6, [dep("SUB2", 0.4, "power"), dep("PUMPA", 0.35, "water"), dep("UJ1", 0.15, "transport"), dep("T2", 0.1, "telecom")]),
    node("N8", "Docklands", "neighborhood", 8, 5, 16000, 3, 0.3, 6, [dep("SUB3", 0.4, "power"), dep("PUMPC", 0.35, "water"), dep("RJ2", 0.15, "transport"), dep("T3", 0.1, "telecom")]),
    // ---- Roads ----
    node("RJ1", "North Junction", "road", 5, 1, 0, 2, 0.75, 4, [dep("SUB1", 0.6, "power"), dep("T1", 0.4, "telecom")]),
    node("RJ2", "South Junction", "road", 6, 6, 0, 2, 0.75, 4, [dep("SUB3", 0.6, "power"), dep("T3", 0.4, "telecom")]),
    node("UJ1", "East Underpass", "underpass", 6, 3, 0, 0, 0.05, 8, [dep("PIPE1", 1.0, "transport")]), // floods when the pipeline fails
    // ---- Telecom ----
    node("T1", "Harbor Tower", "tower", 8, 0, 0, 4, 0.6, 6, [dep("SUB1", 0.7, "power")]),
    node("T2", "Central Tower", "tower", 8, 3, 0, 4, 0.6, 6, [dep("SUB2", 0.7, "power")]),
    node("T3", "South Tower", "tower", 8, 6, 0, 4, 0.6, 6, [dep("SUB3", 0.7, "power")]),
  ],
};

export function nodeById(city: City, id: string): CityNode | undefined {
  return city.nodes.find((n) => n.id === id);
}

export function totalPopulation(city: City): number {
  return city.nodes.reduce((s, n) => s + n.population, 0);
}

export function cloneCity(city: City): City {
  return { nodes: city.nodes.map((n) => ({ ...n, deps: n.deps.map((d) => ({ ...d })) })) };
}
