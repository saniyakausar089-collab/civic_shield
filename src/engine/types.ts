// CivicShield engine — shared types. Pure TypeScript, no React imports.
// The engine is intentionally framework-free so it can later be swapped for a
// C++/WebAssembly build with the same data contracts.

export type NodeKind =
  | "powerplant"
  | "substation"
  | "waterplant"
  | "pipeline"
  | "pump"
  | "neighborhood"
  | "hospital"
  | "road"
  | "underpass"
  | "tower";

export type NodeStatus = "ok" | "stressed" | "failed" | "recovering";

export type SystemLayer = "power" | "water" | "transport" | "telecom";

export interface Dep {
  /** id of the node this node depends on */
  id: string;
  /** weight of this dependency (0..1-ish; shares are relative) */
  weight: number;
  /** which system layer the dependency belongs to */
  layer: SystemLayer;
}

export interface CityNode {
  id: string;
  name: string;
  kind: NodeKind;
  /** grid coordinates, 9x7 grid */
  x: number;
  y: number;
  /** residents served (0 for infrastructure) */
  population: number;
  /** generator / tank buffer in hours of autonomy */
  backupHours: number;
  /** lost-fraction of dependencies at which stress begins (0..1) */
  failureThreshold: number;
  /** hours of repair once failed (for trigger nodes: forced downtime) */
  repairHours: number;
  deps: Dep[];
}

export interface City {
  nodes: CityNode[];
}
