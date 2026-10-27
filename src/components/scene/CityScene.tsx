import React, { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { useAppStore, currentSnapshot } from "@/store/appStore";
import { BASE_CITY } from "@/engine/city";
import { applyMods } from "@/engine/analysis";
import { GisAssetMesh } from "./GisAssetMesh";
import { UtilityNetworkOverlays } from "./UtilityNetworkOverlays";
import { GisTerrainBasemap } from "./GisTerrainBasemap";

const DEFAULT_CAMERA_POS: [number, number, number] = [0, 26, 26];
const DEFAULT_TARGET: [number, number, number] = [0, 0, 0];

function GisSceneContent({ resetSignal }: { resetSignal: number }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cityMods = useAppStore((s) => s.cityMods);
  const triggers = useAppStore((s) => s.triggers);
  const hour = useAppStore((s) => s.hour);
  const result = useAppStore((s) => s.result);
  const layers = useAppStore((s) => s.layers);
  const dayNight = useAppStore((s) => s.dayNight);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const select = useAppStore((s) => s.select);

  const city = React.useMemo(() => applyMods(BASE_CITY, cityMods), [cityMods]);
  const snapshot = currentSnapshot(result, hour);

  // Handle camera reset
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(...DEFAULT_TARGET);
      controlsRef.current.object.position.set(...DEFAULT_CAMERA_POS);
      controlsRef.current.update();
    }
  }, [resetSignal]);

  const isDay = dayNight === "day";

  return (
    <>
      {/* Restrained GIS Background: Charcoal black #101418 or Light GIS #eef2f5 */}
      <color attach="background" args={[isDay ? "#eef2f5" : "#101418"]} />

      {/* Balanced natural lighting for engineering analysis */}
      <ambientLight intensity={isDay ? 0.85 : 0.45} />
      <directionalLight
        position={[20, 35, 15]}
        intensity={isDay ? 1.2 : 0.75}
        castShadow={false}
      />
      <directionalLight
        position={[-20, 20, -15]}
        intensity={isDay ? 0.5 : 0.3}
        color={isDay ? "#d8e2ea" : "#4a5966"}
      />

      {/* Geographic Basemap with Topography, Parcel Bounds, and Road Geometry */}
      <GisTerrainBasemap isDay={isDay} visibleRoads={layers.roads} />

      {/* Explicit Utility Network Overlays */}
      <UtilityNetworkOverlays
        nodes={city.nodes}
        statusMap={snapshot.status}
        visibleLayers={layers}
      />

      {/* 26 Infrastructure Assets Rendered as Extruded Geospatial Footprints */}
      {city.nodes.map((node) => {
        // Filter by layer visibility
        if (
          (node.kind === "powerplant" || node.kind === "substation") &&
          !layers.power
        )
          return null;
        if (
          (node.kind === "waterplant" ||
            node.kind === "pipeline" ||
            node.kind === "pump") &&
          !layers.water
        )
          return null;
        if (node.kind === "tower" && !layers.telecom) return null;
        if ((node.kind === "road" || node.kind === "underpass") && !layers.roads)
          return null;
        if (node.kind === "hospital" && !layers.hospitals) return null;

        const nodeStatus = snapshot.status[node.id] ?? "ok";
        const isTrigger = triggers.includes(node.id);
        const isSelected = selectedNodeId === node.id;

        return (
          <GisAssetMesh
            key={node.id}
            node={node}
            status={nodeStatus}
            isTrigger={isTrigger}
            isSelected={isSelected}
            onClick={() => select(node.id)}
          />
        );
      })}

      {/* Professional GIS Camera Controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.7}
        zoomSpeed={0.8}
        panSpeed={0.75}
        minDistance={6}
        maxDistance={55}
        maxPolarAngle={Math.PI / 2.08}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
    </>
  );
}

export const CityScene: React.FC<{ resetSignal: number }> = ({ resetSignal }) => {
  return (
    <div className="relative w-full h-full select-none touch-none">
      <Canvas
        camera={{ position: DEFAULT_CAMERA_POS, fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onPointerMissed={() => {
          useAppStore.getState().select(null);
        }}
      >
        <GisSceneContent resetSignal={resetSignal} />
      </Canvas>
    </div>
  );
};
