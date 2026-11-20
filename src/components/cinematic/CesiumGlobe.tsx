import React, { useEffect, useRef, useState, useCallback } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { GIS_NODES } from "./types";
import { CINEMATIC_THEME } from "./theme";
import { Shield } from "lucide-react";

// Ensure CESIUM_BASE_URL matches the project's static asset configuration
if (typeof window !== "undefined" && !(window as any).CESIUM_BASE_URL) {
  (window as any).CESIUM_BASE_URL = "/cesium";
}

interface CesiumGlobeProps {
  chapter: number;
  scrollProgress: number;
  chapterProgress: number;
  reducedMotion: boolean;
  onHospitalFail?: () => void;
}

export const CesiumGlobe: React.FC<CesiumGlobeProps> = ({
  chapter,
  scrollProgress,
  chapterProgress,
  reducedMotion,
  onHospitalFail,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const esriLayerRef = useRef<Cesium.ImageryLayer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const shockwavesRef = useRef<Cesium.Entity[]>([]);

  const entitiesRef = useRef<{
    nodes: Record<string, Cesium.Entity>;
    beams: Record<string, Cesium.Entity>;
    pulseRings: Record<string, Cesium.Entity>;
    lines: Cesium.Entity[];
    shockwaveCircle: Cesium.Entity | null;
  }>({ nodes: {}, beams: {}, pulseRings: {}, lines: [], shockwaveCircle: null });

  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const lastTargetRef = useRef<number>(-1);
  const hospitalFiredRef = useRef<boolean>(false);

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

      // Darken and desaturate satellite imagery to make glowing overlays pop dramatically
      esriImageryLayer.brightness = 0.55;
      esriImageryLayer.contrast = 1.35;
      esriImageryLayer.saturation = 0.65;
      esriLayerRef.current = esriImageryLayer;

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

      // Suppress standard error modal and catch render failures
      if (viewer.cesiumWidget) {
        viewer.cesiumWidget.showErrorPanel = (_title: string, message: any, error: any) => {
          console.warn("[CIVICSHIELD] Cesium render error suppressed:", message, error);
          setInitError(`Cesium render notice: ${message || "Viewport issue"}`);
        };
      }

      viewer.scene.renderError.addEventListener((_scene: Cesium.Scene, error: any) => {
        console.warn("[CIVICSHIELD] Cesium scene render warning caught:", error);
        setInitError(`Cesium scene error: ${error.message || error}`);
      });

      // Explicitly disable moon and sun asset dependencies
      if (viewer.scene.moon) {
        viewer.scene.moon.show = false;
      }
      if (viewer.scene.sun) {
        viewer.scene.sun.show = false;
      }

      const scene = viewer.scene;
      scene.globe.show = true;
      scene.globe.depthTestAgainstTerrain = false;
      scene.globe.enableLighting = false; // Keep fully illuminated 24/7 matching /simulator

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
              color: "color('rgba(25, 18, 42, 0.75)')",
            });
          })
          .catch(() => {
            // Graceful silent fallback to basemap
          });
      }

      // Add Key Infrastructure Entities to Globe
      const nodesMap: Record<string, Cesium.Entity> = {};
      const beamMap: Record<string, Cesium.Entity> = {};
      const pulseMap: Record<string, Cesium.Entity> = {};

      const assetList = [
        { ...GIS_NODES.PIPE1, label: "MAIN WATER PIPELINE", status: "ONLINE" },
        { ...GIS_NODES.UJ1, label: "EAST UNDERPASS", status: "ONLINE" },
        { ...GIS_NODES.PUMPA, label: "PUMP STATION A", status: "ONLINE" },
        { ...GIS_NODES.SUB2, label: "CENTRAL SUBSTATION", status: "ONLINE" },
        { ...GIS_NODES.T2, label: "TELECOM TOWER 2", status: "ONLINE" },
        { ...GIS_NODES.H1, label: "CITY GENERAL HOSPITAL", status: "ONLINE" },
      ];

      assetList.forEach((asset) => {
        const pos = Cesium.Cartesian3.fromDegrees(asset.lon, asset.lat, 25);

        // 1. Core Marker
        const nodeEntity = viewer!.entities.add({
          name: asset.label,
          position: pos,
          point: {
            pixelSize: asset.id === "H1" || asset.id === "PIPE1" ? 14 : 11,
            color: CINEMATIC_THEME.healthy.cesiumColor,
            outlineColor: CINEMATIC_THEME.healthy.cesiumOutline,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: `${asset.label} [ONLINE]`,
            font: "10px 'IBM Plex Mono', monospace",
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.fromCssColorString("#0a0612"),
            outlineWidth: 3,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -16),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            translucencyByDistance: new Cesium.NearFarScalar(400, 1.0, 6500, 0.0),
          },
        });
        nodesMap[asset.id] = nodeEntity;

        // 2. Vertical Light Beam (extending 350m skyward)
        const beamPos = Cesium.Cartesian3.fromDegrees(asset.lon, asset.lat, 175);
        const beamEntity = viewer!.entities.add({
          name: `${asset.label} Beam`,
          position: beamPos,
          cylinder: {
            length: 350,
            topRadius: 2.0,
            bottomRadius: 5.5,
            material: new Cesium.ColorMaterialProperty(
              CINEMATIC_THEME.healthy.cesiumColor.withAlpha(0.65)
            ),
          },
        });
        beamMap[asset.id] = beamEntity;

        // 3. Pulse Ground Ring
        const pulseEntity = viewer!.entities.add({
          name: `${asset.label} Pulse`,
          position: Cesium.Cartesian3.fromDegrees(asset.lon, asset.lat, 6),
          ellipse: {
            semiMinorAxis: 160,
            semiMajorAxis: 160,
            material: new Cesium.ColorMaterialProperty(
              CINEMATIC_THEME.critical.cesiumColor.withAlpha(0.0)
            ),
            height: 6,
          },
          show: false,
        });
        pulseMap[asset.id] = pulseEntity;
      });

      // 4. Expanding Cascade Perimeter Circle (grows in Chapter 3)
      const shockwaveCircle = viewer!.entities.add({
        name: "Cascade Spread",
        position: Cesium.Cartesian3.fromDegrees(GIS_NODES.PIPE1.lon, GIS_NODES.PIPE1.lat, 5),
        ellipse: {
          semiMinorAxis: 100,
          semiMajorAxis: 100,
          material: new Cesium.ColorMaterialProperty(
            CINEMATIC_THEME.critical.cesiumColor.withAlpha(0.18)
          ),
          outline: true,
          outlineColor: CINEMATIC_THEME.critical.cesiumColor.withAlpha(0.55),
          outlineWidth: 2,
          height: 5,
        },
        show: false,
      });

      // 5. Animated Dependency Flow Lines
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
              Cesium.Cartesian3.fromDegrees(edge.from.lon, edge.from.lat, 18),
              Cesium.Cartesian3.fromDegrees(edge.to.lon, edge.to.lat, 18),
            ],
            width: 2.8,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.28,
              color: CINEMATIC_THEME.healthy.cesiumColor.withAlpha(0.65),
            }),
            arcType: Cesium.ArcType.GEODESIC,
            clampToGround: false,
          },
          show: false,
        });
        lineEntities.push(line);
      });

      // 6. Expanding Burst Shockwave Rings (Maximum 3)
      const rings: Cesium.Entity[] = [];
      for (let i = 0; i < 3; i++) {
        const ring = viewer!.entities.add({
          name: `Burst Ring ${i}`,
          position: Cesium.Cartesian3.fromDegrees(GIS_NODES.PIPE1.lon, GIS_NODES.PIPE1.lat, 8),
          ellipse: {
            semiMinorAxis: 60,
            semiMajorAxis: 60,
            material: new Cesium.ColorMaterialProperty(
              CINEMATIC_THEME.critical.cesiumColor.withAlpha(0.0)
            ),
            outline: true,
            outlineColor: CINEMATIC_THEME.critical.cesiumColor.withAlpha(0.0),
            outlineWidth: 2,
            height: 8,
          },
          show: false,
        });
        rings.push(ring);
      }
      shockwavesRef.current = rings;

      entitiesRef.current = {
        nodes: nodesMap,
        beams: beamMap,
        pulseRings: pulseMap,
        lines: lineEntities,
        shockwaveCircle,
      };

      viewerRef.current = viewer;
      setReady(true);
    } catch (err: any) {
      console.warn("[CIVICSHIELD] Cesium initialization notice:", err);
      setInitError(err.message || "Cesium 3D initialization failed");
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
      shockwavesRef.current = [];
    };
  }, [webglSupported]);

  // Handle Camera Flights & Entity States on Chapter Change
  const updateSceneForChapter = useCallback(
    (chap: number) => {
      const viewer = viewerRef.current;
      if (!viewer || viewer.isDestroyed()) return;

      const { nodes, beams, pulseRings, lines, shockwaveCircle } = entitiesRef.current;
      const duration = reducedMotion ? 0.0 : 2.2;

      let dest = GIS_NODES.CITY_CENTER;

      if (chap === 0) {
        // Chapter 1: Wide City Flyover (Healthy Emerald-Mint)
        dest = GIS_NODES.CITY_CENTER;
        Object.keys(nodes).forEach((id) => {
          const n = nodes[id];
          if (n?.point) {
            n.point.color = new Cesium.ConstantProperty(CINEMATIC_THEME.healthy.cesiumColor);
            n.point.outlineColor = new Cesium.ConstantProperty(CINEMATIC_THEME.healthy.cesiumOutline);
          }
          if (n?.label) {
            const raw = n.name?.split(" [")[0] || id;
            n.label.text = new Cesium.ConstantProperty(`${raw} [ONLINE]`);
          }
        });
        Object.values(beams).forEach((b) => {
          if (b.cylinder) {
            b.cylinder.material = new Cesium.ColorMaterialProperty(
              CINEMATIC_THEME.healthy.cesiumColor.withAlpha(0.6)
            );
          }
        });
        Object.values(pulseRings).forEach((p) => {
          p.show = false;
        });
        lines.forEach((l) => {
          l.show = false;
        });
        if (shockwaveCircle) shockwaveCircle.show = false;
        shockwavesRef.current.forEach((r) => {
          r.show = false;
        });
      } else if (chap === 1) {
        // Chapter 2: Fast swoop down to PIPE1 rupture point
        dest = GIS_NODES.PIPE1;
        if (nodes["PIPE1"]?.point) {
          nodes["PIPE1"].point.color = new Cesium.ConstantProperty(CINEMATIC_THEME.critical.cesiumColor);
          nodes["PIPE1"].point.outlineColor = new Cesium.ConstantProperty(CINEMATIC_THEME.critical.cesiumOutline);
        }
        if (nodes["PIPE1"]?.label) {
          nodes["PIPE1"].label.text = new Cesium.ConstantProperty("PIPE1 [RUPTURED // 0.0 BAR]");
        }
        if (beams["PIPE1"]?.cylinder) {
          beams["PIPE1"].cylinder.material = new Cesium.ColorMaterialProperty(
            CINEMATIC_THEME.critical.cesiumColor.withAlpha(0.85)
          );
        }
        if (pulseRings["PIPE1"]) {
          pulseRings["PIPE1"].show = true;
          if (pulseRings["PIPE1"].ellipse) {
            pulseRings["PIPE1"].ellipse.material = new Cesium.ColorMaterialProperty(
              CINEMATIC_THEME.critical.cesiumColor.withAlpha(0.7)
            );
          }
        }
        lines.forEach((l) => {
          l.show = false;
        });
        if (shockwaveCircle) shockwaveCircle.show = false;
      } else if (chap === 2) {
        // Chapter 3: Sweeping cascade path across failure order
        dest = {
          lon: 78.497,
          lat: 17.373,
          alt: 1850,
          pitch: -36,
          heading: 335,
        };

        // Turn nodes failing crimson in sequence
        ["PIPE1", "UJ1", "PUMPA", "SUB2", "T2", "H1"].forEach((id) => {
          if (nodes[id]?.point) {
            nodes[id].point.color = new Cesium.ConstantProperty(CINEMATIC_THEME.critical.cesiumColor);
            nodes[id].point.outlineColor = new Cesium.ConstantProperty(CINEMATIC_THEME.critical.cesiumOutline);
          }
          if (nodes[id]?.label) {
            const raw = nodes[id].name?.split(" [")[0] || id;
            nodes[id].label.text = new Cesium.ConstantProperty(`${raw} [FAILED]`);
          }
          if (beams[id]?.cylinder) {
            beams[id].cylinder.material = new Cesium.ColorMaterialProperty(
              CINEMATIC_THEME.critical.cesiumColor.withAlpha(0.8)
            );
          }
          if (pulseRings[id]) {
            pulseRings[id].show = true;
            if (pulseRings[id].ellipse) {
              pulseRings[id].ellipse.material = new Cesium.ColorMaterialProperty(
                CINEMATIC_THEME.critical.cesiumColor.withAlpha(0.55)
              );
            }
          }
        });

        // Flow lines glow hot crimson
        lines.forEach((l) => {
          l.show = true;
          if (l.polyline) {
            l.polyline.material = new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.35,
              color: CINEMATIC_THEME.critical.cesiumColor.withAlpha(0.9),
            });
          }
        });

        if (shockwaveCircle) shockwaveCircle.show = true;
      } else if (chap === 3) {
        // Chapter 4: High angled pull-back view
        dest = {
          lon: 78.496,
          lat: 17.375,
          alt: 2500,
          pitch: -38,
          heading: 0,
        };
      } else if (chap === 4) {
        // Chapter 5: Orbital focus on City General Hospital
        dest = GIS_NODES.H1;
      } else {
        // Chapter 6: Final wide overview
        dest = {
          lon: 78.492,
          lat: 17.376,
          alt: 3200,
          pitch: -36,
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

  // Subtle continuous orbital drift and shockwave ring animation
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed() || !ready) return;

    let startTime = performance.now();

    const loop = (time: number) => {
      // 1. Gentle continuous camera drift
      if (!reducedMotion) {
        viewer.camera.lookRight(0.00025);
      }

      // 2. Animate Chapter 2 Burst Shockwave Rings (3 rings max)
      if (chapter === 1 && !reducedMotion) {
        const elapsed = (time - startTime) / 1000;
        shockwavesRef.current.forEach((ring, idx) => {
          ring.show = true;
          const phase = (elapsed + idx * 0.6) % 1.8; // 1.8s cycle
          const progress = phase / 1.8;
          const radius = 60 + progress * 320;
          const alpha = Math.max(0, 0.75 * (1 - progress));

          if (ring.ellipse) {
            ring.ellipse.semiMinorAxis = new Cesium.ConstantProperty(radius);
            ring.ellipse.semiMajorAxis = new Cesium.ConstantProperty(radius);
            ring.ellipse.material = new Cesium.ColorMaterialProperty(
              CINEMATIC_THEME.critical.cesiumColor.withAlpha(alpha * 0.3)
            );
            ring.ellipse.outlineColor = new Cesium.ConstantProperty(
              CINEMATIC_THEME.critical.cesiumColor.withAlpha(alpha)
            );
          }
        });
      } else {
        shockwavesRef.current.forEach((r) => {
          r.show = false;
        });
      }

      // 3. Dynamic Cascade Radius expansion in Chapter 3
      if (chapter === 2 && entitiesRef.current.shockwaveCircle) {
        const circle = entitiesRef.current.shockwaveCircle;
        const radius = 250 + chapterProgress * 1200;
        if (circle.ellipse) {
          circle.ellipse.semiMinorAxis = new Cesium.ConstantProperty(radius);
          circle.ellipse.semiMajorAxis = new Cesium.ConstantProperty(radius);
        }

        // Fire hospital fail callback once when progress crosses 80% (T+11h)
        if (chapterProgress >= 0.78 && !hospitalFiredRef.current) {
          hospitalFiredRef.current = true;
          onHospitalFail?.();
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [chapter, chapterProgress, reducedMotion, ready, onHospitalFail]);

  // Fallback if WebGL or Cesium fails
  if (!webglSupported || initError) {
    return (
      <div className="absolute inset-0 bg-[#0a0612] flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mb-4 shadow-[0_0_25px_rgba(217,70,239,0.2)]">
          <Shield className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold font-mono tracking-wider text-white mb-2">
          HYDERABAD DIGITAL TWIN // 2D SCHEMATIC
        </h3>
        <p className="max-w-md text-xs font-mono text-slate-400 mb-6">
          Hardware acceleration unavailable. Live telemetry stream active.
        </p>
        <div className="w-full max-w-sm p-4 rounded-xl bg-white/[0.03] border border-fuchsia-500/20 text-left font-mono text-[11px] text-slate-300 space-y-2">
          <div className="flex justify-between border-b border-white/5 pb-1">
            <span className="text-slate-500">SECTOR</span>
            <span className="text-[#34f5a5]">Hyderabad Metro (17.385° N, 78.486° E)</span>
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
      {/* Subtle deep violet atmospheric vignette */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0a0612] via-transparent to-[#0a0612]/70" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0a0612]/20 to-[#0a0612]/80" />
    </div>
  );
};
