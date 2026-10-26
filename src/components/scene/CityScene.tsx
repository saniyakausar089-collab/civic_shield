import React, { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { useAppStore, currentSnapshot } from "@/store/appStore";
import { BASE_CITY } from "@/engine/city";
import { applyMods } from "@/engine/analysis";
import { NodeMesh } from "./NodeMesh";
import { DependencyArcs } from "./DependencyArcs";
import { TriggerRing } from "./TriggerRing";

const DEFAULT_CAMERA_POS: [number, number, number] = [0, 22, 22];
const DEFAULT_TARGET: [number, number, number] = [0, 0, 0];

function SceneContent({ resetSignal }: { resetSignal: number }) {
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
      <color attach="background" args={[isDay ? "#e2e8f0" : "#0b0f19"]} />
      <ambientLight intensity={isDay ? 0.9 : 0.4} />
      <directionalLight
        position={[15, 25, 10]}
        intensity={isDay ? 1.4 : 0.8}
        castShadow={false}
      />
      <directionalLight
        position={[-15, 10, -10]}
        intensity={isDay ? 0.6 : 0.3}
        color={isDay ? "#ffffff" : "#38bdf8"}
      />

      {/* Grid Floor */}
      <gridHelper
        args={[36, 36, isDay ? "#cbd5e1" : "#1e293b", isDay ? "#e2e8f0" : "#0f172a"]}
        position={[0, 0, 0]}
      />

      {/* Dependency Arcs */}
      <DependencyArcs
        nodes={city.nodes}
        statusMap={snapshot.status}
        visibleLayers={layers}
      />

      {/* Trigger Pulsing Rings */}
      <TriggerRing nodes={city.nodes} triggers={triggers} />

      {/* 26 Node Meshes */}
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
          <NodeMesh
            key={node.id}
            node={node}
            status={nodeStatus}
            isTrigger={isTrigger}
            isSelected={isSelected}
            onClick={() => select(node.id)}
          />
        );
      })}

      {/* Touch & Mouse Orbit Controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.8}
        zoomSpeed={0.9}
        panSpeed={0.8}
        minDistance={8}
        maxDistance={45}
        maxPolarAngle={Math.PI / 2.05} // prevent going underneath ground
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
        camera={{ position: DEFAULT_CAMERA_POS, fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        onPointerMissed={() => {
          useAppStore.getState().select(null);
        }}
      >
        <SceneContent resetSignal={resetSignal} />
      </Canvas>
    </div>
  );
};
