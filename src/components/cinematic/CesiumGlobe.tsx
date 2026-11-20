import React, { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { GIS_NODES, evaluateCameraSpline } from "./types";
import { CINEMATIC_THEME } from "./theme";
import { Shield } from "lucide-react";

// Ensure CESIUM_BASE_URL matches static asset configuration
if (typeof window !== "undefined" && !(window as any).CESIUM_BASE_URL) {
  (window as any).CESIUM_BASE_URL = "/cesium";
}

interface CesiumGlobeProps {
  chapter: number;
  scrollProgress: number; // Smoothed progress 0.0 to 1.0
  reducedMotion: boolean;
  onHospitalFail?: () => void;
  onBurstTrigger?: () => void;
}

export const CesiumGlobe: React.FC<CesiumGlobeProps> = ({
  chapter,
  scrollProgress,
  reducedMotion,
  onHospitalFail,
  onBurstTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Latest progress ref for 60fps RAF loop
  const progressRef = useRef<number>(scrollProgress);
  progressRef.current = scrollProgress;

  const reducedMotionRef = useRef<boolean>(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  // Track event triggers so they fire only once per sequence
  const hospitalFiredRef = useRef<boolean>(false);
  const burstFiredRef = useRef<boolean>(false);

  // Reusable Cesium Colors (Instantiated once, never re-allocated)
  const colorsRef = useRef({
    healthy: Cesium.Color.fromCssColorString(CINEMATIC_THEME.healthy.hex),
    healthyAlpha: Cesium.Color.fromCssColorString(CINEMATIC_THEME.healthy.hex).withAlpha(0.65),
    warning: Cesium.Color.fromCssColorString(CINEMATIC_THEME.warning.hex),
    warningAlpha: Cesium.Color.fromCssColorString(CINEMATIC_THEME.warning.hex).withAlpha(0.7),
    critical: Cesium.Color.fromCssColorString(CINEMATIC_THEME.critical.hex),
    criticalAlpha: Cesium.Color.fromCssColorString(CINEMATIC_THEME.critical.hex).withAlpha(0.85),
    outline: Cesium.Color.fromCssColorString(CINEMATIC_THEME.bg.hex),
  });

  // Entity references created ONCE at mount
  const entitiesRef = useRef<{
    nodes: Record<string, Cesium.Entity>;
    beams: Record<string, Cesium.Entity>;
    lines: Cesium.Entity[];
    shockwaveCircle: Cesium.Entity | null;
    burstRings: Cesium.Entity[];
  }>({
    nodes: {},
    beams: {},
    lines: [],
    shockwaveCircle: null,
    burstRings: [],
  });

  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Check WebGL availability once at mount
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) {
        setWebglSupported(false);
      }
    } catch {
      setWebglSupported(false);
    }
  }, []);

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!webglSupported || !containerRef.current) return;
    let isMounted = true;

    // Use existing Cesium Ion Token configuration
    const ionToken = import.meta.env["VITE_CESIUM_ION_TOKEN"] as string | undefined;
    const hasValidToken = Boolean(ionToken && ionToken.trim() !== "");
    if (hasValidToken) {
      Cesium.Ion.defaultAccessToken = ionToken!.trim();
    }

    let viewer: Cesium.Viewer | null = null;

    try {
      const esriImageryProvider = new Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        maximumLevel: 19,
        credit: "Esri, Maxar",
      });
      const esriImageryLayer = new Cesium.ImageryLayer(esriImageryProvider);

      // Jungle-video grade: Darkened, slightly desaturated, high contrast
      esriImageryLayer.brightness = 0.52;
      esriImageryLayer.contrast = 1.38;
      esriImageryLayer.saturation = 0.62;

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
        skyBox: false,
        skyAtmosphere: false,
      });

      // Configure resolution scaling and DPI cap
      const isMobile = window.innerWidth < 768;
      viewer.resolutionScale = isMobile ? 0.75 : Math.min(1.5, window.devicePixelRatio || 1);

      // WebGL context resilience
      const canvas = viewer.canvas;
      if (canvas) {
        canvas.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          console.warn("[CIVICSHIELD] WebGL context lost handled.");
        });
        canvas.addEventListener("webglcontextrestored", () => {
          console.warn("[CIVICSHIELD] WebGL context restored.");
        });
      }

      // Quiet renderError handler: DO NOT switch to 2D schematic on frame hiccups
      if (viewer.cesiumWidget) {
        viewer.cesiumWidget.showErrorPanel = (_title: string, message: any, error: any) => {
          console.warn("[CIVICSHIELD] Cesium notice suppressed:", message, error);
        };
      }

      viewer.scene.renderError.addEventListener((_scene: Cesium.Scene, error: any) => {
        console.warn("[CIVICSHIELD] Cesium frame notice:", error?.message || error);
        // On render warning, hide heavy rings to lighten GPU load without killing viewer
        entitiesRef.current.burstRings.forEach((r) => {
          r.show = false;
        });
        if (entitiesRef.current.shockwaveCircle) {
          entitiesRef.current.shockwaveCircle.show = false;
        }
      });

      // Disable celestial asset dependencies
      if (viewer.scene.moon) viewer.scene.moon.show = false;
      if (viewer.scene.sun) viewer.scene.sun.show = false;

      const scene = viewer.scene;
      scene.globe.show = true;
      scene.globe.depthTestAgainstTerrain = false;
      scene.globe.enableLighting = false;

      // Set initial camera view
      const initCam = evaluateCameraSpline(0);
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(initCam.lon, initCam.lat, initCam.alt),
        orientation: {
          heading: Cesium.Math.toRadians(initCam.heading),
          pitch: Cesium.Math.toRadians(initCam.pitch),
          roll: 0.0,
        },
      });

      // Optional: Add OSM Buildings if token is valid
      if (hasValidToken) {
        Cesium.createOsmBuildingsAsync()
          .then((tileset) => {
            if (!isMounted || !viewer || viewer.isDestroyed()) return;
            viewer.scene.primitives.add(tileset);
            tileset.style = new Cesium.Cesium3DTileStyle({
              color: "color('rgba(10, 20, 16, 0.75)')",
            });
          })
          .catch(() => {});
      }

      // CREATE ALL ENTITIES ONCE AT MOUNT
      const nodesMap: Record<string, Cesium.Entity> = {};
      const beamMap: Record<string, Cesium.Entity> = {};

      const assetList = [
        { ...GIS_NODES.PIPE1, label: "MAIN WATER PIPELINE" },
        { ...GIS_NODES.UJ1, label: "EAST UNDERPASS" },
        { ...GIS_NODES.PUMPA, label: "PUMP STATION A" },
        { ...GIS_NODES.SUB2, label: "CENTRAL SUBSTATION" },
        { ...GIS_NODES.T2, label: "TELECOM TOWER 2" },
        { ...GIS_NODES.H1, label: "CITY GENERAL HOSPITAL" },
      ];

      // 1. Exactly 6 Infrastructure Nodes and 6 Vertical Beams
      assetList.forEach((asset) => {
        const nodePos = Cesium.Cartesian3.fromDegrees(asset.lon, asset.lat, 25);
        const beamPos = Cesium.Cartesian3.fromDegrees(asset.lon, asset.lat, 175);

        // Core marker with dynamic color callback
        const nodeEntity = viewer!.entities.add({
          name: asset.label,
          position: nodePos,
          point: {
            pixelSize: asset.id === "H1" || asset.id === "PIPE1" ? 13 : 10,
            color: new Cesium.CallbackProperty(() => {
              const p = progressRef.current;
              if (asset.id === "PIPE1") {
                return p >= 0.2 ? colorsRef.current.critical : colorsRef.current.healthy;
              }
              if (asset.id === "UJ1") {
                return p >= 0.32 ? colorsRef.current.critical : p >= 0.22 ? colorsRef.current.warning : colorsRef.current.healthy;
              }
              if (asset.id === "PUMPA") {
                return p >= 0.38 ? colorsRef.current.critical : colorsRef.current.healthy;
              }
              if (asset.id === "SUB2") {
                return p >= 0.44 ? colorsRef.current.critical : colorsRef.current.healthy;
              }
              if (asset.id === "T2") {
                return p >= 0.52 ? colorsRef.current.critical : colorsRef.current.healthy;
              }
              if (asset.id === "H1") {
                return p >= 0.60 ? colorsRef.current.critical : p >= 0.32 ? colorsRef.current.warning : colorsRef.current.healthy;
              }
              return colorsRef.current.healthy;
            }, false),
            outlineColor: colorsRef.current.outline,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: new Cesium.CallbackProperty(() => {
              const p = progressRef.current;
              let status = "ONLINE";
              if (asset.id === "PIPE1" && p >= 0.2) status = "RUPTURED";
              else if (asset.id === "H1" && p >= 0.6) status = "OFFLINE";
              else if (p >= 0.44 && (asset.id === "SUB2" || asset.id === "UJ1")) status = "FAILED";
              return `${asset.label} [${status}]`;
            }, false),
            font: "10px 'IBM Plex Mono', monospace",
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.WHITE,
            outlineColor: colorsRef.current.outline,
            outlineWidth: 3,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -16),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            translucencyByDistance: new Cesium.NearFarScalar(300, 1.0, 5500, 0.0),
          },
        });
        nodesMap[asset.id] = nodeEntity;

        // Vertical Light Beam
        const beamEntity = viewer!.entities.add({
          name: `${asset.label} Beam`,
          position: beamPos,
          cylinder: {
            length: 350,
            topRadius: 2.0,
            bottomRadius: 5.5,
            material: new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const p = progressRef.current;
                const isFail =
                  (asset.id === "PIPE1" && p >= 0.2) ||
                  (asset.id === "H1" && p >= 0.6) ||
                  (p >= 0.44 && (asset.id === "SUB2" || asset.id === "UJ1"));
                return isFail ? colorsRef.current.criticalAlpha : colorsRef.current.healthyAlpha;
              }, false)
            ),
          },
        });
        beamMap[asset.id] = beamEntity;
      });

      // 2. Exactly 5 Dependency Flow Lines
      const depEdges = [
        { from: GIS_NODES.PIPE1, to: GIS_NODES.UJ1 },
        { from: GIS_NODES.PIPE1, to: GIS_NODES.PUMPA },
        { from: GIS_NODES.PUMPA, to: GIS_NODES.H1 },
        { from: GIS_NODES.UJ1, to: GIS_NODES.H1 },
        { from: GIS_NODES.SUB2, to: GIS_NODES.H1 },
      ];

      const lineEntities: Cesium.Entity[] = [];
      depEdges.forEach((edge) => {
        const line = viewer!.entities.add({
          polyline: {
            positions: [
              Cesium.Cartesian3.fromDegrees(edge.from.lon, edge.from.lat, 18),
              Cesium.Cartesian3.fromDegrees(edge.to.lon, edge.to.lat, 18),
            ],
            width: 2.6,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.28,
              color: new Cesium.CallbackProperty(() => {
                const p = progressRef.current;
                return p >= 0.35 ? colorsRef.current.critical : colorsRef.current.healthy;
              }, false),
            }),
            arcType: Cesium.ArcType.GEODESIC,
            clampToGround: false,
          },
          show: new Cesium.CallbackProperty(() => progressRef.current >= 0.18, false),
        });
        lineEntities.push(line);
      });

      // 3. Exactly 1 Set of 3 Burst Shockwave Rings at PIPE1
      let animClock = 0;
      const burstRings: Cesium.Entity[] = [];
      for (let i = 0; i < 3; i++) {
        const ring = viewer!.entities.add({
          name: `Burst Ring ${i}`,
          position: Cesium.Cartesian3.fromDegrees(GIS_NODES.PIPE1.lon, GIS_NODES.PIPE1.lat, 8),
          ellipse: {
            semiMinorAxis: new Cesium.CallbackProperty(() => {
              const p = progressRef.current;
              if (p < 0.18 || p > 0.45) return 0;
              const phase = (animClock + i * 0.6) % 1.8;
              return 40 + (phase / 1.8) * 360;
            }, false),
            semiMajorAxis: new Cesium.CallbackProperty(() => {
              const p = progressRef.current;
              if (p < 0.18 || p > 0.45) return 0;
              const phase = (animClock + i * 0.6) % 1.8;
              return 40 + (phase / 1.8) * 360;
            }, false),
            material: new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const p = progressRef.current;
                if (p < 0.18 || p > 0.45) return Cesium.Color.TRANSPARENT;
                const phase = (animClock + i * 0.6) % 1.8;
                const alpha = Math.max(0, 0.45 * (1 - phase / 1.8));
                return colorsRef.current.critical.withAlpha(alpha);
              }, false)
            ),
            outline: true,
            outlineColor: new Cesium.CallbackProperty(() => {
              const p = progressRef.current;
              if (p < 0.18 || p > 0.45) return Cesium.Color.TRANSPARENT;
              const phase = (animClock + i * 0.6) % 1.8;
              const alpha = Math.max(0, 0.75 * (1 - phase / 1.8));
              return colorsRef.current.critical.withAlpha(alpha);
            }, false),
            outlineWidth: 2,
            height: 8,
          },
          show: new Cesium.CallbackProperty(() => {
            const p = progressRef.current;
            return p >= 0.18 && p <= 0.45;
          }, false),
        });
        burstRings.push(ring);
      }

      // 4. Cascade Perimeter Circle
      const shockwaveCircle = viewer!.entities.add({
        name: "Cascade Spread",
        position: Cesium.Cartesian3.fromDegrees(GIS_NODES.PIPE1.lon, GIS_NODES.PIPE1.lat, 6),
        ellipse: {
          semiMinorAxis: new Cesium.CallbackProperty(() => {
            const p = progressRef.current;
            if (p < 0.3) return 0;
            return Math.min(2200, 200 + (p - 0.3) * 3500);
          }, false),
          semiMajorAxis: new Cesium.CallbackProperty(() => {
            const p = progressRef.current;
            if (p < 0.3) return 0;
            return Math.min(2200, 200 + (p - 0.3) * 3500);
          }, false),
          material: new Cesium.ColorMaterialProperty(
            colorsRef.current.critical.withAlpha(0.12)
          ),
          outline: true,
          outlineColor: colorsRef.current.critical.withAlpha(0.45),
          outlineWidth: 2,
          height: 6,
        },
        show: new Cesium.CallbackProperty(() => {
          const p = progressRef.current;
          return p >= 0.3 && p <= 0.68;
        }, false),
      });

      entitiesRef.current = {
        nodes: nodesMap,
        beams: beamMap,
        lines: lineEntities,
        burstRings,
        shockwaveCircle,
      };

      viewerRef.current = viewer;

      // 60 FPS CONTINUOUS CAMERA DRIVE & IDLE DRIFT LOOP
      let startTime = performance.now();

      const renderLoop = (time: number) => {
        if (!viewer || viewer.isDestroyed() || !isMounted) return;

        // Skip rendering when tab is hidden to save power
        if (typeof document !== "undefined" && document.visibilityState === "hidden") {
          animFrameRef.current = requestAnimationFrame(renderLoop);
          return;
        }

        const elapsed = (time - startTime) / 1000;
        animClock = elapsed;

        const currentProg = progressRef.current;
        const targetCam = evaluateCameraSpline(currentProg);

        // Continuous slow idle drift (a few meters) so scene never looks frozen
        const idleDriftLon = reducedMotionRef.current ? 0 : Math.sin(elapsed * 0.35) * 0.00012;
        const idleDriftLat = reducedMotionRef.current ? 0 : Math.cos(elapsed * 0.28) * 0.00008;

        // Direct camera position and orientation drive (NO flyTo, NO gaps)
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            targetCam.lon + idleDriftLon,
            targetCam.lat + idleDriftLat,
            targetCam.alt
          ),
          orientation: {
            heading: Cesium.Math.toRadians(targetCam.heading),
            pitch: Cesium.Math.toRadians(targetCam.pitch),
            roll: 0.0,
          },
        });

        // Trigger milestone events once per narrative threshold
        if (currentProg >= 0.20 && !burstFiredRef.current) {
          burstFiredRef.current = true;
          onBurstTrigger?.();
        }
        if (currentProg >= 0.58 && !hospitalFiredRef.current) {
          hospitalFiredRef.current = true;
          onHospitalFail?.();
        }

        animFrameRef.current = requestAnimationFrame(renderLoop);
      };

      animFrameRef.current = requestAnimationFrame(renderLoop);
    } catch (err: any) {
      console.warn("[CIVICSHIELD] Cesium mount notice:", err);
      setInitError(err.message || "Cesium 3D initialization unavailable");
    }

    return () => {
      isMounted = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (viewer && !viewer.isDestroyed()) {
        try {
          viewer.entities.removeAll();
          viewer.destroy();
        } catch {}
      }
      viewerRef.current = null;
      entitiesRef.current = {
        nodes: {},
        beams: {},
        lines: [],
        shockwaveCircle: null,
        burstRings: [],
      };
    };
  }, [webglSupported, onBurstTrigger, onHospitalFail]);

  // Initial WebGL Unavailable Fallback Only
  if (!webglSupported || initError) {
    return (
      <div className="absolute inset-0 bg-[#060b09] flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-[#00d1a0]/10 border border-[#00d1a0]/30 flex items-center justify-center text-[#00d1a0] mb-4 shadow-[0_0_25px_rgba(0,209,160,0.2)]">
          <Shield className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold font-mono tracking-wider text-white mb-2">
          HYDERABAD DIGITAL TWIN // 2D SCHEMATIC
        </h3>
        <p className="max-w-md text-xs font-mono text-slate-400 mb-6">
          Hardware acceleration unavailable. Live telemetry stream active.
        </p>
        <div className="w-full max-w-sm p-4 rounded-xl bg-white/[0.03] border border-[#00d1a0]/20 text-left font-mono text-[11px] text-slate-300 space-y-2">
          <div className="flex justify-between border-b border-white/5 pb-1">
            <span className="text-slate-500">SECTOR</span>
            <span className="text-[#00d1a0]">Hyderabad Metro (17.385° N, 78.486° E)</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-1">
            <span className="text-slate-500">TRUNK ASSET</span>
            <span className="text-[#ff2d55]">PIPE1 [RUPTURED // 0.0 BAR]</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">CRITICAL FACILITY</span>
            <span className="text-[#ffb020]">City General Hospital (H1)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {/* Cinematic dark jungle grade with soft vignette */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#060b09] via-transparent to-[#060b09]/75" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#060b09]/25 to-[#060b09]/85" />
    </div>
  );
};
