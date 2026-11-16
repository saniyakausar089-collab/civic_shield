import React, { useEffect, useRef, useState, useCallback } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { useAppStore } from "@/store/appStore";
import { CivicShieldLayer, loadCivicShieldData, type NodeData } from "@/gis/civicshieldLayer";
import { identifyPlaceAtLocation } from "@/data/hyderabadPlaces";
import { PlaceInspectorPopup } from "@/components/hud/PlaceInspectorPopup";
import {
  createYearStyle,
  createHeightStyle,
  createTallStyle,
} from "./cesiumStyles";
import { AlertTriangle, Sparkles, ShieldAlert, X } from "lucide-react";

// Ensure CESIUM_BASE_URL points to static assets (/cesium)
if (typeof window !== "undefined" && !(window as any).CESIUM_BASE_URL) {
  (window as any).CESIUM_BASE_URL = "/cesium";
}

// Hyderabad fallback coordinates
const HYDERABAD_COORDS = {
  lng: 78.4867,
  lat: 17.3850,
  altitude: 6000,
  pitch: -45,
};

interface CesiumMapProps {
  resetSignal: number;
}

export const CesiumMap: React.FC<CesiumMapProps> = ({ resetSignal }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const layerRef = useRef<CivicShieldLayer | null>(null);
  const tilesetRef = useRef<Cesium.Cesium3DTileset | null>(null);

  // Zustand Store
  const layers = useAppStore((s) => s.layers);
  const cesiumBuildingStyle = useAppStore((s) => s.cesiumBuildingStyle);
  const selectedGisNode = useAppStore((s) => s.selectedGisNode);
  const setSelectedGisNode = useAppStore((s) => s.setSelectedGisNode);
  const select = useAppStore((s) => s.select);
  const setCivicShieldLayer = useAppStore((s) => s.setCivicShieldLayer);
  const setCivicShieldData = useAppStore((s) => s.setCivicShieldData);
  const setScenariosData = useAppStore((s) => s.setScenariosData);
  const engineError = useAppStore((s) => s.engineError);
  const setStore = useAppStore((s) => s.set);
  const presetId = useAppStore((s) => s.presetId);
  const viewportMode = useAppStore((s) => s.viewportMode);
  const showPlaceLabels = useAppStore((s) => s.showPlaceLabels);
  const inspectedPlace = useAppStore((s) => s.inspectedPlace);

  // Component State
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Camera Fly To Hyderabad Helper
  const flyToHyderabad = useCallback((viewer: Cesium.Viewer) => {
    if (layerRef.current) {
      layerRef.current.flyToCity();
    } else {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          HYDERABAD_COORDS.lng,
          HYDERABAD_COORDS.lat,
          HYDERABAD_COORDS.altitude
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(HYDERABAD_COORDS.pitch),
          roll: 0.0,
        },
        duration: 1.5,
      });
    }
  }, []);

  // 1. Initialize Cesium Viewer & CivicShieldLayer
  useEffect(() => {
    if (!containerRef.current) return;
    let isMounted = true;

    if (typeof window !== "undefined" && !(window as any).CESIUM_BASE_URL) {
      (window as any).CESIUM_BASE_URL = "/cesium";
    }

    // Check Cesium Ion Access Token
    const ionToken = import.meta.env["VITE_CESIUM_ION_TOKEN"] as string | undefined;
    const hasValidToken = Boolean(ionToken && ionToken.trim() !== "");

    if (hasValidToken) {
      Cesium.Ion.defaultAccessToken = ionToken!.trim();
    } else {
      console.warn(
        "[CIVICSHIELD] Cesium Ion access token (VITE_CESIUM_ION_TOKEN) is missing or empty in .env. Falling back to Esri World Imagery."
      );
    }

    let viewer: Cesium.Viewer | null = null;

    try {
      // Step 4: Fallback Esri World Imagery via UrlTemplateImageryProvider
      const esriImageryProvider = new Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        maximumLevel: 19,
        credit: "Esri, Maxar",
      });
      const esriImageryLayer = new Cesium.ImageryLayer(esriImageryProvider);

      esriImageryLayer.errorEvent.addEventListener((err: any) => {
        console.warn("[CIVICSHIELD] Base imagery tile loading error:", err);
        setLoadError("Notice: Unable to load some base satellite tiles. Please check your network connection.");
      });

      // Initialize Cesium Viewer
      viewer = new Cesium.Viewer(containerRef.current, {
        baseLayer: esriImageryLayer,
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        baseLayerPicker: false,
        geocoder: false,
        animation: false,
        timeline: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        infoBox: false,
        selectionIndicator: false,
        fullscreenButton: false,
        shouldAnimate: true,
      });

      // Suppress and handle default Cesium crash dialog panel
      if (viewer.cesiumWidget) {
        viewer.cesiumWidget.showErrorPanel = (_title: string, message: any, error: any) => {
          console.warn("[CIVICSHIELD] Cesium render error suppressed:", message, error);
          setLoadError(`Cesium render notice: ${message || "Viewport issue"}`);
        };
      }

      viewer.scene.renderError.addEventListener((_scene: Cesium.Scene, error: any) => {
        console.warn("[CIVICSHIELD] Cesium scene render warning caught:", error);
        setLoadError(`Cesium scene error: ${error.message || error}`);
      });

      const scene = viewer.scene;
      scene.globe.show = true;
      scene.globe.depthTestAgainstTerrain = false;

      viewerRef.current = viewer;
      if (typeof window !== "undefined") {
        (window as any).cesiumViewer = viewer;
      }

      // Fly camera to Hyderabad initially
      flyToHyderabad(viewer);

      // Load CivicShield Phase 1 Geospatial Data
      setLoading(true);
      loadCivicShieldData()
        .then((data) => {
          if (!isMounted || !viewer || viewer.isDestroyed()) return;

          setScenariosData(data.scenarios);
          setCivicShieldData({
            network: data.network,
            neighborhoods: data.neighborhoods,
            scenarios: data.scenarios,
          });

          // Guard against React StrictMode double-mount: destroy old layer if exists
          if (layerRef.current) {
            layerRef.current.destroy();
            layerRef.current = null;
          }

          // Create CivicShieldLayer
          const layer = new CivicShieldLayer(viewer, {
            network: data.network,
            neighborhoods: data.neighborhoods,
            onNodeSelect: (node: NodeData) => {
              setSelectedGisNode(node);
              select(node?.id ?? null);
            },
            onPlaceInspect: async (target: any) => {
              const store = useAppStore.getState();
              if (!store.inspectMode) return;

              if (target.isResolving) {
                store.setInspectedPlace({
                  name: "Scanning Location...",
                  category: "resolving",
                  categoryLabel: "Identifying Place & Facility",
                  subtext: `Inspecting urban sector at ${target.lat.toFixed(4)}° N, ${target.lon.toFixed(4)}° E`,
                  address: `Hyderabad Urban Area (${target.lat.toFixed(5)}° N, ${target.lon.toFixed(5)}° E)`,
                  lon: target.lon,
                  lat: target.lat,
                  isCurated: false,
                  isLoading: true,
                });

                try {
                  const place = await identifyPlaceAtLocation(target.lon, target.lat);
                  store.setInspectedPlace({ ...place, isLoading: false });
                } catch {
                  store.setInspectedPlace({
                    name: "Hyderabad Urban Sector",
                    category: "location",
                    categoryLabel: "Urban Facility / Sector",
                    subtext: `Coordinates: ${target.lat.toFixed(4)}° N, ${target.lon.toFixed(4)}° E`,
                    address: `Greater Hyderabad Metropolitan Area (${target.lat.toFixed(5)}° N, ${target.lon.toFixed(5)}° E)`,
                    lon: target.lon,
                    lat: target.lat,
                    isCurated: false,
                    isLoading: false,
                  });
                }
              } else {
                store.setInspectedPlace({ ...target, isLoading: false });
              }
            },
          });

          layerRef.current = layer;
          setCivicShieldLayer(layer);
          if (typeof window !== "undefined") {
            (window as any).civicShieldLayer = layer;
            (window as any).__CIVIC_LAYER__ = layer;
          }

          // Apply initial layer visibilities
          layer.setNetworkVisible("power", layers.power);
          layer.setNetworkVisible("water", layers.water);
          layer.setNetworkVisible("road", layers.roads);
          layer.setNetworkVisible("telecom", layers.telecom);
          layer.setPlaceLabelsVisible(useAppStore.getState().showPlaceLabels);

          // Fly camera to city bounding sphere
          layer.flyToCity();

          // Preview initial scenario if one is active
          const curPreset = useAppStore.getState().presetId;
          const initialScenario = data.scenarios.find(
            (s) =>
              s.id === curPreset ||
              (curPreset === "pipeline" && s.id === "pipeline_burst") ||
              (curPreset === "monsoon" && s.id === "monsoon_flood") ||
              (curPreset === "heatwave" && s.id === "heatwave_overload") ||
              (curPreset === "cyber" && s.id === "cyberattack") ||
              (curPreset === "quake" && s.id === "earthquake")
          );
          if (initialScenario) {
            layer.previewScenario(initialScenario);
          }

          setLoading(false);
        })
        .catch((err) => {
          console.error("[CIVICSHIELD] Error loading CivicShield layer data:", err);
          setLoadError(`Failed to load geospatial network data: ${err.message || err}`);
          setLoading(false);
        });

      // Optional: Add OSM Buildings if token is valid
      if (hasValidToken) {
        Cesium.createOsmBuildingsAsync()
          .then((tileset) => {
            if (!isMounted || !viewerRef.current) return;
            viewerRef.current.scene.primitives.add(tileset);
            tilesetRef.current = tileset;
            applyCurrentStyle(tileset, cesiumBuildingStyle);
          })
          .catch((err) => {
            console.warn("[CIVICSHIELD] OSM Buildings note:", err.message);
          });
      }
    } catch (err: any) {
      console.error("[CIVICSHIELD] Cesium Viewer initialization error:", err);
      setLoadError(`Failed to initialize Cesium 3D Viewport: ${err.message || err}`);
      setLoading(false);
    }

    return () => {
      isMounted = false;
      if (layerRef.current) {
        layerRef.current.destroy();
        layerRef.current = null;
      }
      setCivicShieldLayer(null);
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
      tilesetRef.current = null;
      if (typeof window !== "undefined") {
        delete (window as any).cesiumViewer;
        delete (window as any).civicShieldLayer;
        delete (window as any).__CIVIC_LAYER__;
      }
    };
  }, [flyToHyderabad]);

  // 2. React to resetSignal
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.resetAll();
      layerRef.current.flyToCity();
    } else if (viewerRef.current) {
      flyToHyderabad(viewerRef.current);
    }
    setSelectedGisNode(null);
    select(null);
  }, [resetSignal, flyToHyderabad, setSelectedGisNode, select]);

  // 3. React to network layer visibility toggles
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setNetworkVisible("power", layers.power);
      layerRef.current.setNetworkVisible("water", layers.water);
      layerRef.current.setNetworkVisible("road", layers.roads);
      layerRef.current.setNetworkVisible("telecom", layers.telecom);
    }
  }, [layers]);

  // React to place & college labels visibility
  useEffect(() => {
    if (layerRef.current && typeof layerRef.current.setPlaceLabelsVisible === "function") {
      layerRef.current.setPlaceLabelsVisible(showPlaceLabels);
    }
  }, [showPlaceLabels]);

  // 4. Resize Viewer when viewport mode switches to cesium
  useEffect(() => {
    if (viewportMode === "cesium" && viewerRef.current) {
      viewerRef.current.resize();
    }
  }, [viewportMode]);

  // 5. Building Styling logic
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
        console.warn("[CIVICSHIELD] Could not apply style to 3D tileset:", e);
      }
    },
    []
  );

  useEffect(() => {
    if (tilesetRef.current) {
      applyCurrentStyle(tilesetRef.current, cesiumBuildingStyle);
    }
  }, [cesiumBuildingStyle, applyCurrentStyle]);

  return (
    <div
      className="relative w-full h-full select-none"
      style={{ width: "100%", height: "100%", minHeight: "100%" }}
    >
      {/* Cesium WebGL Container with non-zero explicit dimensions */}
      <div
        id="cesiumContainer"
        ref={containerRef}
        className="w-full h-full"
        style={{ width: "100%", height: "100%", minHeight: "100%" }}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#101418]/85 backdrop-blur-sm gap-3 font-mono text-xs text-[#9BAA76]">
          <div className="w-7 h-7 border-2 border-[#9BAA76] border-t-transparent rounded-full animate-spin" />
          <span>Connecting to 3D Geospatial Viewport & Infrastructure...</span>
        </div>
      )}

      {/* Diagnostics / Error / Notice Bar */}
      {(loadError || engineError) && (
        <div className="absolute top-12 left-3 right-3 z-30 p-2.5 rounded bg-[#401c1c]/95 border border-[#d9534f] text-xs font-mono text-[#ff8f8f] flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#d9534f] shrink-0" />
            <span>{loadError || engineError}</span>
          </div>
          <button
            onClick={() => {
              setLoadError(null);
              setStore({ engineError: null });
            }}
            className="text-[10px] uppercase font-bold text-[#e5e9ec] hover:underline shrink-0 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Node Info Panel on select (Step 6) */}
      {selectedGisNode && (
        <div className="absolute top-14 right-3 z-20 w-72 bg-[#191F24]/95 backdrop-blur-md border border-[#303941] rounded-lg p-3 text-[#e5e9ec] shadow-2xl animate-in fade-in slide-in-from-right-2 duration-150">
          <div className="flex items-start justify-between gap-2 border-b border-[#303941] pb-2 mb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-[#f1f4f6]">
                  {selectedGisNode.name}
                </span>
                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#242c33] text-[#8a96a1] border border-[#303941]">
                  {selectedGisNode.id}
                </span>
              </div>
              <div className="text-[10px] text-[#8a96a1] font-mono mt-0.5 uppercase flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      selectedGisNode.network === "water"
                        ? "#4fb3e8"
                        : selectedGisNode.network === "power"
                        ? "#f5b942"
                        : selectedGisNode.network === "telecom"
                        ? "#9aa7b8"
                        : selectedGisNode.network === "road"
                        ? "#e5e7eb"
                        : "#ef4444",
                  }}
                />
                <span>{selectedGisNode.network}</span>
                <span>•</span>
                <span>{selectedGisNode.type?.replace(/_/g, " ")}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedGisNode(null);
                select(null);
              }}
              className="p-1 rounded text-[#8a96a1] hover:text-[#f1f4f6] hover:bg-[#242c33] transition-colors"
              title="Close Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
            <div className="bg-[#14191d] p-1.5 rounded border border-[#242c33]">
              <div className="text-[9px] text-[#8a96a1] uppercase">Capacity</div>
              <div className="text-[#e5e9ec] font-semibold mt-0.5">
                {selectedGisNode.capacity} {selectedGisNode.unit || ""}
              </div>
            </div>
            <div className="bg-[#14191d] p-1.5 rounded border border-[#242c33]">
              <div className="text-[9px] text-[#8a96a1] uppercase">Current Load</div>
              <div className="text-[#9BAA76] font-semibold mt-0.5">
                {selectedGisNode.load} {selectedGisNode.unit || ""}
              </div>
            </div>
            <div className="bg-[#14191d] p-1.5 rounded border border-[#242c33]">
              <div className="text-[9px] text-[#8a96a1] uppercase">Built Year</div>
              <div className="text-[#e5e9ec] mt-0.5">
                {selectedGisNode.built_year}
              </div>
            </div>
            <div className="bg-[#14191d] p-1.5 rounded border border-[#242c33]">
              <div className="text-[9px] text-[#8a96a1] uppercase">Utilization</div>
              <div className="text-[#e5e9ec] mt-0.5">
                {selectedGisNode.capacity > 0
                  ? `${Math.round((selectedGisNode.load / selectedGisNode.capacity) * 100)}%`
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Place & College Inspector Popup */}
      <PlaceInspectorPopup />

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
          SYNTHETIC TESTBED: <span className="text-[#e5e9ec]">Hyderabad Urban Sector</span>
        </span>
      </div>
    </div>
  );
};
