import React, { useEffect, useRef, useState, useCallback } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { useAppStore, currentSnapshot } from "@/store/appStore";
import { BASE_CITY } from "@/engine/city";
import { applyMods } from "@/engine/analysis";
import { HYDERABAD_REGION, SF_REGION, type CityRegion } from "@/engine/geoRegions";
import {
  createYearStyle,
  createHeightStyle,
  createTallStyle,
} from "./cesiumStyles";
import { AlertTriangle, RefreshCw, Eye, EyeOff, ShieldAlert, Sparkles, MapPin } from "lucide-react";

interface CesiumMapProps {
  resetSignal: number;
}

export const CesiumMap: React.FC<CesiumMapProps> = ({ resetSignal }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const tilesetRef = useRef<Cesium.Cesium3DTileset | null>(null);
  const pinEntitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const arcEntitiesRef = useRef<Cesium.Entity[]>([]);

  // Zustand Store
  const hour = useAppStore((s) => s.hour);
  const result = useAppStore((s) => s.result);
  const cityMods = useAppStore((s) => s.cityMods);
  const triggers = useAppStore((s) => s.triggers);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const select = useAppStore((s) => s.select);
  const layers = useAppStore((s) => s.layers);
  const cesiumBuildingStyle = useAppStore((s) => s.cesiumBuildingStyle);
  const setStore = useAppStore((s) => s.set);

  // Component State
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [assetStatus, setAssetStatus] = useState<"loading" | "loaded" | "failed" | "token_missing">("loading");
  const [assetMetadataInfo, setAssetMetadataInfo] = useState<{
    hasYear: boolean;
    hasRoof: boolean;
    name: string;
  } | null>(null);

  // Active synthetic region: Hyderabad by default
  const [region] = useState<CityRegion>(HYDERABAD_REGION);

  const city = React.useMemo(() => applyMods(BASE_CITY, cityMods), [cityMods]);
  const snapshot = currentSnapshot(result, hour);

  // 1. Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current) return;

    if (typeof window !== "undefined" && !(window as any).CESIUM_BASE_URL) {
      (window as any).CESIUM_BASE_URL = "/cesium";
    }

    // Set Ion Access Token safely from Vite environment
    const ionToken = import.meta.env["VITE_CESIUM_ION_TOKEN"] as string | undefined;
    if (ionToken && ionToken.trim() !== "") {
      Cesium.Ion.defaultAccessToken = ionToken.trim();
    }

    let viewer: Cesium.Viewer | null = null;

    try {
      // If Ion token exists, try to use it; otherwise configure safe baseLayer so Viewer doesn't crash on Ion World Imagery
      const hasValidToken = Boolean(ionToken && ionToken.trim() !== "");

      viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        infoBox: false,
        selectionIndicator: false,
        fullscreenButton: false,
        shouldAnimate: true,
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      });

      // Suppress and override default Cesium crash dialog panel
      if (viewer.cesiumWidget) {
        viewer.cesiumWidget.showErrorPanel = (_title: string, message: any, error: any) => {
          console.warn("Cesium render error suppressed:", message, error);
        };
      }

      // Suppress default modal alert & capture scene render errors gracefully
      viewer.scene.renderError.addEventListener((_scene: Cesium.Scene, error: any) => {
        console.warn("Cesium scene render warning caught:", error);
      });

      // Natural atmosphere & lighting configuration
      const scene = viewer.scene;
      scene.globe.show = true;
      scene.globe.baseColor = Cesium.Color.fromCssColorString("#1a232a");
      scene.globe.depthTestAgainstTerrain = false;

      viewerRef.current = viewer;

      // Handle Canvas Click for Asset Selection
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
        const pickedObject = viewer?.scene.pick(click.position);
        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.name) {
          const nodeId = pickedObject.id.properties?.nodeId?.getValue();
          if (nodeId) {
            select(nodeId);
            return;
          }
        }
        // If clicking empty space, don't necessarily clear unless clicking far away
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // Load 3D Tileset (Asset ID 4854512) only if token is present, else skip directly to synthetic overlays
      setLoading(true);
      setLoadError(null);

      if (hasValidToken) {
        // Direct universal 3D building stream (Cesium OSM Buildings, Asset 96188)
        let didComplete = false;

        const loadTimeout = setTimeout(() => {
          if (!didComplete) {
            setLoading(false);
            if (viewerRef.current) flyToRegion(viewerRef.current, region);
          }
        }, 5000);

        Cesium.createOsmBuildingsAsync()
          .then((tileset) => {
            didComplete = true;
            clearTimeout(loadTimeout);
            if (!viewerRef.current) return;
            viewerRef.current.scene.primitives.add(tileset);
            tilesetRef.current = tileset;
            setAssetStatus("loaded");
            setLoading(false);
            setLoadError(null);

            setAssetMetadataInfo({
              hasYear: false,
              hasRoof: true,
              name: "Cesium OSM Global 3D Buildings (Asset #96188)",
            });

            // Apply current style (Year, Height, Tall)
            applyCurrentStyle(tileset, cesiumBuildingStyle);

            flyToRegion(viewerRef.current, region);
          })
          .catch((err) => {
            didComplete = true;
            clearTimeout(loadTimeout);
            console.warn("Could not connect to OSM Buildings:", err);
            setAssetStatus("failed");
            setLoadError(`3D Buildings stream note: ${err.message || "Network issue"}. Synthetic infrastructure is active.`);
            setLoading(false);
            if (viewer) flyToRegion(viewer, region);
          });
      } else {
        setAssetStatus("token_missing");
        setLoadError("Cesium Ion Token not detected. Using synthetic GIS overlays.");
        setLoading(false);
        flyToRegion(viewer, region);
      }
    } catch (err: any) {
      console.error("Cesium Viewer initialization error:", err);
      setLoadError(`Failed to initialize WebGL Cesium viewport: ${err.message}`);
      setLoading(false);
    }

    return () => {
      // Clean up viewer on unmount
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
      tilesetRef.current = null;
    };
  }, []);

  // 2. Camera Fly To Helper
  const flyToRegion = (viewer: Cesium.Viewer, targetRegion: CityRegion) => {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        targetRegion.origin.lng,
        targetRegion.origin.lat - 0.025,
        targetRegion.origin.elevation + 2200
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-35),
        roll: 0.0,
      },
      duration: 1.5,
    });
  };

  // 3. React to resetSignal
  useEffect(() => {
    if (viewerRef.current) {
      flyToRegion(viewerRef.current, region);
    }
  }, [resetSignal, region]);

  // 4. Building Styling logic
  const applyCurrentStyle = useCallback(
    (tileset: Cesium.Cesium3DTileset, mode: "year" | "height" | "tall" | "none") => {
      if (!tileset) return;
      try {
        switch (mode) {
          case "year":
            tileset.style = createYearStyle();
            break;
          case "height":
            tileset.style = createHeightStyle();
            break;
          case "tall":
            tileset.style = createTallStyle();
            break;
          case "none":
            tileset.style = new Cesium.Cesium3DTileStyle({
              color: "color('#8a96a1', 0.8)",
            });
            break;
        }
      } catch (e) {
        console.warn("Could not apply style to 3D tileset:", e);
      }
    },
    []
  );

  useEffect(() => {
    if (tilesetRef.current) {
      applyCurrentStyle(tilesetRef.current, cesiumBuildingStyle);
    }
  }, [cesiumBuildingStyle, applyCurrentStyle]);

  // 5. Render Synthetic Infrastructure Overlays
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Clear previous entities
    pinEntitiesRef.current.forEach((entity) => viewer.entities.remove(entity));
    pinEntitiesRef.current.clear();
    arcEntitiesRef.current.forEach((entity) => viewer.entities.remove(entity));
    arcEntitiesRef.current = [];

    // Map status to Cesium Colors
    const getStatusColor = (status: string) => {
      switch (status) {
        case "failed":
          return Cesium.Color.fromCssColorString("#d9534f");
        case "stressed":
          return Cesium.Color.fromCssColorString("#e09f3e");
        case "recovering":
          return Cesium.Color.fromCssColorString("#8fae70");
        default:
          return Cesium.Color.fromCssColorString("#5c7356");
      }
    };

    // Render 26 Infrastructure Assets
    city.nodes.forEach((node) => {
      // Filter by layer visibility
      if ((node.kind === "powerplant" || node.kind === "substation") && !layers.power) return;
      if (
        (node.kind === "waterplant" || node.kind === "pipeline" || node.kind === "pump") &&
        !layers.water
      )
        return;
      if (node.kind === "tower" && !layers.telecom) return;
      if ((node.kind === "road" || node.kind === "underpass") && !layers.roads) return;
      if (node.kind === "hospital" && !layers.hospitals) return;

      const geo = region.nodes[node.id];
      if (!geo) return;

      const nodeStatus = snapshot.status[node.id] ?? "ok";
      const isSelected = selectedNodeId === node.id;
      const isTrigger = triggers.includes(node.id);
      const color = getStatusColor(nodeStatus);

      // Height of extruded marker proportional to population or critical asset
      const baseHeight = geo.elevation;
      const markerHeight = Math.max(80, (node.population / 40000) * 350 + 60);

      // Create Cesium Cylinder / Extruded Box for the synthetic asset
      const entity = viewer.entities.add({
        name: `[SYNTHETIC] ${node.name}`,
        properties: {
          nodeId: node.id,
          synthetic: true,
          status: nodeStatus,
        },
        position: Cesium.Cartesian3.fromDegrees(geo.lng, geo.lat, baseHeight + markerHeight / 2),
        cylinder: {
          length: markerHeight,
          topRadius: node.kind === "hospital" ? 35 : node.kind === "powerplant" ? 45 : 25,
          bottomRadius: node.kind === "hospital" ? 35 : node.kind === "powerplant" ? 45 : 25,
          material: isSelected
            ? Cesium.Color.fromCssColorString("#38bdf8").withAlpha(0.95)
            : isTrigger
            ? Cesium.Color.fromCssColorString("#ff2222").withAlpha(0.9)
            : color.withAlpha(0.85),
          outline: true,
          outlineColor: isSelected
            ? Cesium.Color.WHITE
            : isTrigger
            ? Cesium.Color.YELLOW
            : color.brighten(0.3, new Cesium.Color()),
          outlineWidth: isSelected ? 3 : 1.5,
        },
        label: {
          text: `[SYNTHETIC]\n${node.name}\n(${nodeStatus.toUpperCase()})`,
          font: "11px monospace",
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -markerHeight / 2 - 8),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 15000),
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString("#191f24").withAlpha(0.85),
        },
      });

      pinEntitiesRef.current.set(node.id, entity);
    });

    // Render Dependency Arcs
    city.nodes.forEach((targetNode) => {
      const targetGeo = region.nodes[targetNode.id];
      if (!targetGeo) return;

      targetNode.deps.forEach((d) => {
        const sourceGeo = region.nodes[d.id];
        if (!sourceGeo) return;

        // Check if source or target failed
        const sourceFailed = (snapshot.status[d.id] ?? "ok") === "failed";
        const arcColor = sourceFailed
          ? Cesium.Color.fromCssColorString("#d9534f").withAlpha(0.9)
          : Cesium.Color.fromCssColorString("#38bdf8").withAlpha(0.4);

        const arcEntity = viewer.entities.add({
          polyline: {
            positions: [
              Cesium.Cartesian3.fromDegrees(sourceGeo.lng, sourceGeo.lat, sourceGeo.elevation + 40),
              Cesium.Cartesian3.fromDegrees(
                (sourceGeo.lng + targetGeo.lng) / 2,
                (sourceGeo.lat + targetGeo.lat) / 2,
                Math.max(sourceGeo.elevation, targetGeo.elevation) + 250
              ),
              Cesium.Cartesian3.fromDegrees(targetGeo.lng, targetGeo.lat, targetGeo.elevation + 40),
            ],
            width: sourceFailed ? 3 : 1.5,
            material: new Cesium.PolylineDashMaterialProperty({
              color: arcColor,
              dashLength: sourceFailed ? 12 : 24,
            }),
          },
        });
        arcEntitiesRef.current.push(arcEntity);
      });
    });
  }, [city, region, snapshot, selectedNodeId, triggers, layers]);

  return (
    <div className="relative w-full h-full select-none">
      {/* Cesium WebGL Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#101418]/85 backdrop-blur-sm gap-3 font-mono text-xs text-[#9BAA76]">
          <div className="w-7 h-7 border-2 border-[#9BAA76] border-t-transparent rounded-full animate-spin" />
          <span>Connecting to 3D Geospatial Tileset & Urban Infrastructure...</span>
        </div>
      )}

      {/* Diagnostics / Error / Notice Bar */}
      {loadError && (
        <div className="absolute top-12 left-3 right-3 z-10 p-2.5 rounded bg-[#241c1c]/95 border border-[#d9534f]/60 text-xs font-mono text-[#ff8f8f] flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#d9534f] shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            onClick={() => setLoadError(null)}
            className="text-[10px] uppercase font-bold text-[#e5e9ec] hover:underline shrink-0 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Floating Cesium Style Controls */}
      <div className="absolute top-3 right-28 z-10 flex items-center gap-2 bg-[#191F24]/90 backdrop-blur-md border border-[#303941] px-2.5 py-1.5 rounded shadow">
        <Sparkles className="w-3.5 h-3.5 text-[#9BAA76]" />
        <span className="text-[11px] font-mono text-[#8a96a1]">3D Tiles Style:</span>
        <select
          value={cesiumBuildingStyle}
          onChange={(e) =>
            setStore({
              cesiumBuildingStyle: e.target.value as "year" | "height" | "tall" | "none",
            })
          }
          className="bg-[#242c33] border border-[#303941] rounded px-2 py-0.5 text-xs text-[#f1f4f6] font-mono focus:outline-none focus:border-[#9BAA76]"
        >
          <option value="year">Color by Construction Year</option>
          <option value="height">Color by Roof Height</option>
          <option value="tall">Highlight Tall Buildings</option>
          <option value="none">Monochrome Base</option>
        </select>
        {tilesetRef.current && (
          <button
            onClick={() => {
              if (viewerRef.current && tilesetRef.current) {
                viewerRef.current.flyTo(tilesetRef.current, {
                  offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 8000),
                  duration: 1.5,
                });
              }
            }}
            className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#2a343d] hover:bg-[#34414c] text-[#9BAA76] border border-[#3e4a54] transition"
            title="Focus camera on 3D Tileset"
          >
            Zoom to Tiles
          </button>
        )}
      </div>

      {/* Region & Synthetic Infrastructure Disclaimer */}
      <div className="absolute bottom-3 right-3 z-10 bg-[#191F24]/90 backdrop-blur-md border border-[#303941] px-3 py-1.5 rounded flex items-center gap-2 text-[10px] font-mono text-[#8a96a1] shadow">
        <ShieldAlert className="w-3.5 h-3.5 text-[#e09f3e]" />
        <span>
          SYNTHETIC TESTBED: <span className="text-[#e5e9ec]">{region.name}</span>
        </span>
      </div>
    </div>
  );
};
