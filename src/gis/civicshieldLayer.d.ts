import * as Cesium from "cesium";

export interface NodeData {
  id: string;
  name: string;
  type: string;
  network: "water" | "power" | "telecom" | "road" | "hazard" | string;
  lon: number;
  lat: number;
  capacity: number;
  load: number;
  unit?: string;
  built_year: number;
  age_years?: number;
  criticality?: number;
  status?: string;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  delay_h?: number;
}

export interface NetworkData {
  meta: {
    name: string;
    center: {
      lon: number;
      lat: number;
    };
    [key: string]: any;
  };
  nodes: NodeData[];
  edges: EdgeData[];
  [key: string]: any;
}

export interface ScenarioTrigger {
  node: string;
  t_hours?: number;
  severity?: number;
  event?: string;
}

export interface ScenarioData {
  id: string;
  name: string;
  icon?: string;
  severity?: number;
  summary?: string;
  triggers: ScenarioTrigger[];
}

export interface CivicShieldData {
  network: NetworkData;
  neighborhoods: any;
  scenarios: ScenarioData[];
}

export declare function loadCivicShieldData(base?: string): Promise<CivicShieldData>;

export declare class CivicShieldLayer {
  viewer: Cesium.Viewer;
  network: NetworkData;
  nodeById: Map<string, NodeData>;
  status: Record<string, string>;
  ds: Cesium.CustomDataSource;
  nodeEntities: Map<string, Cesium.Entity>;
  edgeEntities: Map<string, { entity: Cesium.Entity; edge: EdgeData }>;
  hoodEntities: Map<string, Cesium.Entity>;
  pulseEntities: Cesium.Entity[];
  hiddenNetworks: Set<string>;

  constructor(
    viewer: Cesium.Viewer,
    opts: {
      network: NetworkData;
      neighborhoods: any;
      onNodeSelect?: (node: NodeData) => void;
    }
  );

  setNodeStatus(statusMap: Record<string, "normal" | "degraded" | "failed">): void;
  setNeighborhoodImpact(impactMap: Record<string, number>): void;
  resetAll(): void;
  previewScenario(scenario: ScenarioData): void;
  clearPreview(): void;
  setNetworkVisible(network: string, visible: boolean): void;
  setNeighborhoodsVisible(visible: boolean): void;
  flyToCity(duration?: number): void;
  destroy(): void;
}

