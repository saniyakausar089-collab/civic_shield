import * as Cesium from "cesium";

export const STATUS_COLOR = {
  normal: "#8a9a7b",
  degraded: "#f59e0b",
  failed: "#ef4444",
};

export const NETWORK_COLOR = {
  water: "#4fb3e8",
  power: "#f5b942",
  telecom: "#9aa7b8",
  road: "#e5e7eb",
  hazard: "#ef4444",
};

const NODE_SIZE = {
  hospital: 17,
  power_plant: 15,
  water_plant: 14,
  telecom_core: 14,
  pipeline: 12,
  substation: 12,
  pump_station: 11,
  reservoir: 11,
  junction: 10,
  underpass: 10,
  telecom_tower: 9,
};

const NODE_HEIGHT_M = 25;
const css = (hex, alpha = 1) => Cesium.Color.fromCssColorString(hex).withAlpha(alpha);

export async function loadCivicShieldData(base = "/data") {
  const get = async (f) => {
    const res = await fetch(`${base}/${f}`);
    if (!res.ok) throw new Error(`Failed to load ${f}: ${res.status}`);
    return res.json();
  };
  const [network, neighborhoods, scenarios] = await Promise.all([
    get("network.json"),
    get("neighborhoods.geojson"),
    get("scenarios.json"),
  ]);
  return { network, neighborhoods, scenarios: scenarios.scenarios };
}

export class CivicShieldLayer {
  /**
   * @param {Cesium.Viewer} viewer
   * @param {{network:object, neighborhoods:object, onNodeSelect?:(node:object)=>void}} opts
   */
  constructor(viewer, { network, neighborhoods, onNodeSelect }) {
    this.viewer = viewer;
    this.network = network;
    this.nodeById = new Map(network.nodes.map((n) => [n.id, n]));
    this.status = Object.fromEntries(network.nodes.map((n) => [n.id, "normal"]));
    this.ds = new Cesium.CustomDataSource("civicshield");
    this.nodeEntities = new Map();
    this.edgeEntities = new Map();
    this.hoodEntities = new Map();
    this.pulseEntities = [];
    this.hiddenNetworks = new Set();
    this.onNodeSelect = onNodeSelect;

    this._buildNeighborhoods(neighborhoods);
    this._buildEdges();
    this._buildNodes();
    viewer.dataSources.add(this.ds);
    this._bindPicking(onNodeSelect);
  }

  // ---------- build ----------
  _buildNeighborhoods(geojson) {
    for (const f of geojson.features) {
      const ring = f.geometry.coordinates[0].slice(0, -1).flat();
      const e = this.ds.entities.add({
        id: `hood:${f.properties.id}`,
        name: f.properties.name,
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(ring),
          material: this._impactColor(0),
          outline: true,
          outlineColor: css("#ffffff", 0.18),
          height: 0,
        },
      });
      this.hoodEntities.set(f.properties.id, e);
    }
  }

  _buildEdges() {
    for (const edge of this.network.edges) {
      const a = this.nodeById.get(edge.source);
      const b = this.nodeById.get(edge.target);
      const e = this.ds.entities.add({
        id: `edge:${edge.id}`,
        show: edge.type !== "hazard",
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights([
            a.lon, a.lat, NODE_HEIGHT_M, b.lon, b.lat, NODE_HEIGHT_M,
          ]),
          width: edge.type === "hazard" ? 3 : 2,
          material: this._edgeMaterial(edge, "normal"),
        },
      });
      this.edgeEntities.set(edge.id, { entity: e, edge });
    }
  }

  _buildNodes() {
    for (const n of this.network.nodes) {
      const e = this.ds.entities.add({
        id: `node:${n.id}`,
        name: n.name,
        position: Cesium.Cartesian3.fromDegrees(n.lon, n.lat, NODE_HEIGHT_M),
        properties: new Cesium.PropertyBag({ nodeId: n.id }),
        point: {
          pixelSize: NODE_SIZE[n.type] ?? 10,
          color: css(STATUS_COLOR.normal),
          outlineColor: css(NETWORK_COLOR[n.network] ?? "#ffffff"),
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: n.id,
          font: '11px "JetBrains Mono", monospace',
          fillColor: Cesium.Color.WHITE,
          showBackground: true,
          backgroundColor: Cesium.Color.BLACK.withAlpha(0.6),
          pixelOffset: new Cesium.Cartesian2(0, -18),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 25000),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      this.nodeEntities.set(n.id, e);
    }
  }

  _bindPicking(onNodeSelect) {
    if (!onNodeSelect) return;
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.handler.setInputAction((click) => {
      const picked = this.viewer.scene.pick(click.position);
      const id = picked?.id?.properties?.nodeId?.getValue?.();
      if (id) onNodeSelect(this.nodeById.get(id));
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  // ---------- styling helpers ----------
  _edgeMaterial(edge, sourceStatus) {
    if (sourceStatus === "failed") return css(STATUS_COLOR.failed, 0.95);
    if (sourceStatus === "degraded") return css(STATUS_COLOR.degraded, 0.9);
    const base = NETWORK_COLOR[edge.type];
    if (edge.type === "telecom") {
      return new Cesium.PolylineDashMaterialProperty({ color: css(base, 0.7), dashLength: 12 });
    }
    return css(base, 0.6);
  }

  _impactColor(v) {
    if (v <= 0) return css("#ffffff", 0.04);
    const c = Cesium.Color.lerp(css("#f59e0b"), css("#ef4444"), Math.min(1, v), new Cesium.Color());
    return c.withAlpha(0.15 + 0.45 * Math.min(1, v));
  }

  // ---------- public API (Phase 3 drives these from engine output) ----------
  /** @param {Record<string,'normal'|'degraded'|'failed'>} statusMap */
  setNodeStatus(statusMap) {
    Object.assign(this.status, statusMap);
    for (const id of Object.keys(statusMap)) {
      const e = this.nodeEntities.get(id);
      if (e) e.point.color = css(STATUS_COLOR[this.status[id]]);
    }
    for (const { entity, edge } of this.edgeEntities.values()) {
      const s = this.status[edge.source];
      entity.polyline.material = this._edgeMaterial(edge, s);
      if (edge.type === "hazard") entity.show = s !== "normal" && !this.hiddenNetworks.has("road");
    }
  }

  /** @param {Record<string,number>} impactMap neighborhoodId -> 0..1 */
  setNeighborhoodImpact(impactMap) {
    for (const [id, v] of Object.entries(impactMap)) {
      const e = this.hoodEntities.get(id);
      if (e) e.polygon.material = this._impactColor(v);
    }
  }

  resetAll() {
    this.clearPreview();
    this.setNodeStatus(Object.fromEntries(this.network.nodes.map((n) => [n.id, "normal"])));
    this.setNeighborhoodImpact(Object.fromEntries([...this.hoodEntities.keys()].map((k) => [k, 0])));
  }

  /** Pulsing red rings on a scenario's trigger nodes (before simulation runs). */
  previewScenario(scenario) {
    this.clearPreview();
    for (const t of scenario.triggers) {
      const n = this.nodeById.get(t.node);
      const pulse = this.ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(n.lon, n.lat, NODE_HEIGHT_M),
        point: {
          pixelSize: new Cesium.CallbackProperty(() => 14 + 14 * ((Date.now() % 1200) / 1200), false),
          color: new Cesium.CallbackProperty(
            () => css(STATUS_COLOR.failed, 0.5 * (1 - (Date.now() % 1200) / 1200)),
            false
          ),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      this.pulseEntities.push(pulse);
    }
  }

  clearPreview() {
    this.pulseEntities.forEach((e) => this.ds.entities.remove(e));
    this.pulseEntities = [];
  }

  /** Toggle a utility network ('water' | 'power' | 'telecom' | 'road' | 'health'). */
  setNetworkVisible(network, visible) {
    visible ? this.hiddenNetworks.delete(network) : this.hiddenNetworks.add(network);
    for (const n of this.network.nodes) {
      if (n.network === network) this.nodeEntities.get(n.id).show = visible;
    }
    for (const { entity, edge } of this.edgeEntities.values()) {
      if (edge.type === network) entity.show = visible;
    }
  }

  setNeighborhoodsVisible(visible) {
    this.hoodEntities.forEach((e) => (e.show = visible));
  }

  flyToCity(duration = 2.5) {
    const { lon, lat } = this.network.meta.center;
    const target = new Cesium.BoundingSphere(Cesium.Cartesian3.fromDegrees(lon, lat, 0), 7000);
    this.viewer.camera.flyToBoundingSphere(target, {
      duration,
      offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 11000),
    });
  }

  destroy() {
    this.handler?.destroy();
    if (this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.dataSources.remove(this.ds, true);
    }
  }
}
