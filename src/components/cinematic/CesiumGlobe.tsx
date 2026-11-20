import React, { useEffect, useRef, useState, useCallback } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { GIS_NODES } from "./types";
import { Shield, AlertTriangle } from "lucide-react";

// Ensure CESIUM_BASE_URL matches the project's static asset configuration
if (typeof window !== "undefined" && !(window as any).CESIUM_BASE_URL) {
  (window as any).CESIUM_BASE_URL = "/cesium";
}

interface CesiumGlobeProps {
  chapter: number;
  scrollProgress: number;
  reducedMotion: boolean;
}

export const CesiumGlobe: React.FC<CesiumGlobeProps> = ({
  chapter,
  scrollProgress,
  reducedMotion,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entitiesRef = useRef<{
    nodes: Record<string, Cesium.Entity>;
    pulseRings: Record<string, Cesium.Entity>;
    lines: Cesium.Entity[];
  }>({ nodes: {}, pulseRings: {}, lines: [] });

  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const lastTargetRef = useRef<number>(-1);

  // Check WebGL availability
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

      // Suppress standard error modal
      if (viewer.cesiumWidget) {
        viewer.cesiumWidget.showErrorPanel = () => {};
      }

      viewer.scene.globe.depthTestAgainstTerrain = false;
      viewer.scene.globe.enableLighting = true;
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.00018;

      // Dark atmospheric color
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#0a0f16");

      // Set initial wide view over Hyderabad
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          GIS_NODES.CITY_CENTER.lon,
          GIS_NODES.CITY_CENTER.lat,
          GIS_NODES.CITY_CENTER.alt
        ),
        orientation: {
          heading: Cesium.Math.toRadians(GIS_NODES.CITY_CENTER.heading),
          pitch: Cesium.Math.toRadians(GIS_NODES.CITY_CENTER.pitch),
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
              color: "color('rgba(25, 38, 54, 0.72)')",
            });
          })
          .catch(() => {
            // Graceful silent fallback to basemap
          });
      }

      // Add Key Infrastructure Entities to Globe
      const nodesMap: Record<string, Cesium.Entity> = {};
      const pulseMap: Record<string, Cesium.Entity> = {};

      const assetList = [
        { ...GIS_NODES.PIPE1, label: "MAIN WATER PIPELINE" },
        { ...GIS_NODES.UJ1, label: "EAST UNDERPASS" },
        { ...GIS_NODES.PUMPA, label: "PUMP STATION A" },
        { ...GIS_NODES.SUB2, label: "CENTRAL SUBSTATION" },
        { ...GIS_NODES.T2, label: "TELECOM TOWER 2" },
        { ...GIS_NODES.H1, label: "CITY GENERAL HOSPITAL" },
      ];

      assetList.forEach((asset) => {
        const pos = Cesium.Cartesian3.fromDegrees(asset.lon, asset.lat, 25);

        // Core Marker
        const nodeEntity = viewer!.entities.add({
          name: asset.label,
          position: pos,
          point: {
            pixelSize: asset.id === "H1" || asset.id === "PIPE1" ? 14 : 10,
            color: Cesium.Color.fromCssColorString("#22d3ee"),
            outlineColor: Cesium.Color.fromCssColorString("#083344"),
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: asset.label,
            font: "11px 'IBM Plex Mono', monospace",
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -14),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            translucencyByDistance: new Cesium.NearFarScalar(500, 1.0, 7000, 0.0),
          },
        });
        nodesMap[asset.id] = nodeEntity;

        // Pulse Ring (initially hidden)
        const pulseEntity = viewer!.entities.add({
          name: `${asset.label} Pulse`,
          position: Cesium.Cartesian3.fromDegrees(asset.lon, asset.lat, 5),
          ellipse: {
            semiMinorAxis: 180,
            semiMajorAxis: 180,
            material: new Cesium.ColorMaterialProperty(
              Cesium.Color.fromCssColorString("#ef4444").withAlpha(0.0)
            ),
            height: 5,
          },
          show: false,
        });
        pulseMap[asset.id] = pulseEntity;
      });

      // Animated Dependency Flow Lines
      const depEdges = [
        { from: GIS_NODES.PIPE1, to: GIS_NODES.UJ1 },
        { from: GIS_NODES.PIPE1, to: GIS_NODES.PUMPA },
        { from: GIS_NODES.PUMPA, to: GIS_NODES.H1 },
        { from: GIS_NODES.UJ1, to: GIS_NODES.H1 },
        { from: GIS_NODES.SUB2, to: GIS_NODES.H1 },
        { from: GIS_NODES.T2, to: GIS_NODES.H1 },
      ];

      const lineEntities: Cesium.Entity[] = [];
      depEdges.forEach((edge) => {
        const line = viewer!.entities.add({
          polyline: {
            positions: [
              Cesium.Cartesian3.fromDegrees(edge.from.lon, edge.from.lat, 15),
              Cesium.Cartesian3.fromDegrees(edge.to.lon, edge.to.lat, 15),
            ],
            width: 2.5,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.25,
              color: Cesium.Color.fromCssColorString("#06b6d4").withAlpha(0.6),
            }),
            arcType: Cesium.ArcType.GEODESIC,
            clampToGround: false,
          },
          show: false,
        });
        lineEntities.push(line);
      });

      entitiesRef.current = {
        nodes: nodesMap,
        pulseRings: pulseMap,
        lines: lineEntities,
      };

      viewerRef.current = viewer;
      setReady(true);
    } catch (err: any) {
      console.warn("[CIVICSHIELD] Cesium initialization notice:", err);
      setInitError(err.message || "Cesium 3D initialization failed");
    }

    return () => {
      isMounted = false;
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
    };
  }, [webglSupported]);

  // Handle Camera Flights & Entity States on Chapter Change
  const updateSceneForChapter = useCallback(
    (chap: number) => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      const { nodes, pulseRings, lines } = entitiesRef.current;

      // Define target camera destination & orientation per chapter
      let dest = GIS_NODES.CITY_CENTER;
      let duration = reducedMotion ? 0.0 : 2.4;

      if (chap === 0) {
        // Chapter 1: Wide City Flyover (Healthy Cyan)
        dest = GIS_NODES.CITY_CENTER;
        Object.values(nodes).forEach((n) => {
          if (n.point) n.point.color = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString("#22d3ee"));
        });
        Object.values(pulseRings).forEach((p) => {
          p.show = false;
        });
        lines.forEach((l) => {
          l.show = false;
        });
      } else if (chap === 1) {
        // Chapter 2: Pipe Burst (Zoom to PIPE1, Pulse Ring active)
        dest = GIS_NODES.PIPE1;
        if (nodes["PIPE1"]?.point) {
          nodes["PIPE1"].point.color = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString("#ef4444"));
        }
        if (pulseRings["PIPE1"]) {
          pulseRings["PIPE1"].show = true;
          if (pulseRings["PIPE1"].ellipse) {
            pulseRings["PIPE1"].ellipse.material = new Cesium.ColorMaterialProperty(
              Cesium.Color.fromCssColorString("#ef4444").withAlpha(0.65)
            );
          }
        }
        lines.forEach((l) => {
          l.show = false;
        });
      } else if (chap === 2) {
        // Chapter 3: Chain Reaction (Cascade to UJ1, SUB2, T2, H1)
        dest = {
          lon: 78.498,
          lat: 17.373,
          alt: 1900,
          pitch: -44,
          heading: 340,
        };
        // Turn nodes failing red in sequence
        ["PIPE1", "UJ1", "PUMPA", "SUB2", "T2", "H1"].forEach((id) => {
          if (nodes[id]?.point) {
            nodes[id].point.color = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString("#ef4444"));
          }
          if (pulseRings[id]) {
            pulseRings[id].show = true;
            if (pulseRings[id].ellipse) {
              pulseRings[id].ellipse.material = new Cesium.ColorMaterialProperty(
                Cesium.Color.fromCssColorString("#ef4444").withAlpha(0.5)
              );
            }
          }
        });
        // Reveal dependency lines with red glow
        lines.forEach((l) => {
          l.show = true;
          if (l.polyline) {
            l.polyline.material = new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.4,
              color: Cesium.Color.fromCssColorString("#ef4444").withAlpha(0.9),
            });
          }
        });
      } else if (chap === 3) {
        // Chapter 4: Plan Triage (Camera views city sector)
        dest = {
          lon: 78.496,
          lat: 17.374,
          alt: 2100,
          pitch: -48,
          heading: 0,
        };
      } else if (chap === 4) {
        // Chapter 5: Incident Report (Slow orbital focus on City General Hospital)
        dest = GIS_NODES.H1;
      } else {
        // Chapter 6: Final CTA (Wide vantage point over the full twin)
        dest = {
          lon: 78.492,
          lat: 17.376,
          alt: 3200,
          pitch: -40,
          heading: 20,
        };
      }

      if (lastTargetRef.current !== chap) {
        lastTargetRef.current = chap;
        if (reducedMotion) {
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(dest.lon, dest.lat, dest.alt),
            orientation: {
              heading: Cesium.Math.toRadians(dest.heading),
              pitch: Cesium.Math.toRadians(dest.pitch),
              roll: 0.0,
            },
          });
        } else {
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(dest.lon, dest.lat, dest.alt),
            orientation: {
              heading: Cesium.Math.toRadians(dest.heading),
              pitch: Cesium.Math.toRadians(dest.pitch),
              roll: 0.0,
            },
            duration,
          });
        }
      }
    },
    [reducedMotion]
  );

  useEffect(() => {
    if (ready) {
      updateSceneForChapter(chapter);
    }
  }, [chapter, ready, updateSceneForChapter]);

  // Subtle camera drift on scroll progress within current chapter
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || reducedMotion || !ready) return;

    // Small heading drift based on scrollProgress
    const deltaHeading = (scrollProgress * 12) % 360;
    viewer.camera.lookRight(0.0003);
  }, [scrollProgress, reducedMotion, ready]);

  // Fallback if WebGL or Cesium fails
  if (!webglSupported || initError) {
    return (
      <div className="absolute inset-0 bg-[#0a0f16] flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_25px_rgba(6,182,212,0.2)]">
          <Shield className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold font-mono tracking-wider text-white mb-2">
          HYDERABAD DIGITAL TWIN // 2D SCHEMATIC
        </h3>
        <p className="max-w-md text-xs font-mono text-slate-400 mb-6">
          Hardware WebGL acceleration is unavailable. Switching to analytical telemetry overview. All cascade data and plan evaluations remain live.
        </p>
        <div className="w-full max-w-sm p-4 rounded-xl bg-white/[0.03] border border-white/10 text-left font-mono text-[11px] text-slate-300 space-y-2">
          <div className="flex justify-between border-b border-white/5 pb-1">
            <span className="text-slate-500">SECTOR</span>
            <span className="text-cyan-400">Hyderabad Metropolitan (17.385° N, 78.486° E)</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-1">
            <span className="text-slate-500">TRUNK ASSET</span>
            <span className="text-red-400">PIPE1 (Main Trunk Pipeline)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">CRITICAL FACILITY</span>
            <span className="text-amber-400">City General Hospital (H1)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {/* Cinematic vignette & ambient darkening for readability */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0a0f16] via-transparent to-[#0a0f16]/75" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0a0f16]/30 to-[#0a0f16]/80" />
    </div>
  );
};
