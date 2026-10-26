import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CityNode } from "@/engine/types";

interface TriggerRingProps {
  nodes: CityNode[];
  triggers: string[];
}

export const TriggerRing: React.FC<TriggerRingProps> = ({ nodes, triggers }) => {
  const triggerNodes = nodes.filter((n) => triggers.includes(n.id));
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const scale = 1 + Math.sin(t * 4) * 0.18;
    groupRef.current.children.forEach((child) => {
      child.scale.set(scale, scale, 1);
    });
  });

  return (
    <group ref={groupRef}>
      {triggerNodes.map((node) => {
        const posX = (node.x - 4) * 2.6;
        const posZ = (node.y - 3) * 2.6;
        return (
          <mesh
            key={`trigger-${node.id}`}
            position={[posX, 0.05, posZ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[1.2, 1.45, 32]} />
            <meshBasicMaterial
              color="#ef4444"
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
            />
          </mesh>
        );
      })}
    </group>
  );
};
