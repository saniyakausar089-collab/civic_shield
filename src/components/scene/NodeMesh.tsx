import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CityNode, NodeStatus } from "@/engine/types";

interface NodeMeshProps {
  node: CityNode;
  status: NodeStatus;
  isTrigger: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export function getNodeBaseColor(kind: CityNode["kind"]): string {
  switch (kind) {
    case "powerplant":
    case "substation":
      return "#f59e0b"; // amber
    case "waterplant":
    case "pipeline":
    case "pump":
      return "#06b6d4"; // cyan
    case "tower":
      return "#8b5cf6"; // violet
    case "neighborhood":
      return "#10b981"; // mint
    case "hospital":
      return "#ec4899"; // pink
    case "road":
    case "underpass":
      return "#64748b"; // slate
    default:
      return "#94a3b8";
  }
}

export function getNodeHeight(node: CityNode): number {
  if (node.population > 0) {
    return Math.max(0.9, 0.7 + (node.population / 40000) * 2.8);
  }
  switch (node.kind) {
    case "powerplant":
      return 2.2;
    case "tower":
      return 3.2;
    case "waterplant":
      return 1.6;
    case "substation":
      return 1.3;
    case "pump":
      return 1.0;
    case "pipeline":
      return 0.6;
    case "road":
    case "underpass":
      return 0.25;
    default:
      return 1.0;
  }
}

export const NodeMesh: React.FC<NodeMeshProps> = ({
  node,
  status,
  isTrigger,
  isSelected,
  onClick,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const outlineRef = useRef<THREE.LineSegments>(null);

  const height = getNodeHeight(node);
  const posX = (node.x - 4) * 2.6;
  const posZ = (node.y - 3) * 2.6;
  const posY = height / 2;

  const baseColor = getNodeBaseColor(node.kind);
  const isFailed = status === "failed";
  const isStressed = status === "stressed";
  const isRecovering = status === "recovering";

  // Pulse animation for failed or stressed nodes
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    if (isFailed) {
      const s = 1 + Math.sin(t * 5) * 0.08;
      meshRef.current.scale.set(s, 1, s);
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissive.setHex(0xff1122);
        mat.emissiveIntensity = 0.5 + Math.sin(t * 6) * 0.4;
      }
    } else if (isStressed) {
      const s = 1 + Math.sin(t * 3) * 0.04;
      meshRef.current.scale.set(s, 1, s);
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissive.setHex(0xf59e0b);
        mat.emissiveIntensity = 0.4 + Math.sin(t * 4) * 0.3;
      }
    } else if (isRecovering) {
      meshRef.current.scale.set(1, 1, 1);
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissive.setHex(0x10b981);
        mat.emissiveIntensity = 0.3;
      }
    } else {
      meshRef.current.scale.set(1, 1, 1);
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    }
  });

  const displayColor = isFailed ? "#ef4444" : isStressed ? "#f59e0b" : baseColor;
  const radius = node.kind === "tower" || node.kind === "pipeline" ? 0.45 : 0.7;

  return (
    <group position={[posX, 0, posZ]}>
      {/* Main Extruded Building */}
      {node.kind === "tower" ? (
        <mesh
          ref={meshRef}
          position={[0, posY, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <cylinderGeometry args={[0.2, 0.45, height, 8]} />
          <meshStandardMaterial
            color={displayColor}
            metalness={0.7}
            roughness={0.2}
            wireframe={false}
          />
        </mesh>
      ) : node.kind === "pipeline" ? (
        <mesh
          ref={meshRef}
          position={[0, posY, 0]}
          rotation={[0, 0, Math.PI / 2]}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <cylinderGeometry args={[0.4, 0.4, 1.8, 16]} />
          <meshStandardMaterial
            color={displayColor}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
      ) : (
        <mesh
          ref={meshRef}
          position={[0, posY, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <boxGeometry args={[radius * 2, height, radius * 2]} />
          <meshStandardMaterial
            color={displayColor}
            metalness={0.3}
            roughness={0.4}
            emissive={isFailed ? "#ef4444" : "#000000"}
            emissiveIntensity={isFailed ? 0.4 : 0}
          />
        </mesh>
      )}

      {/* Hospital 3D Cross Marker */}
      {node.kind === "hospital" && (
        <group position={[0, height + 0.35, 0]}>
          <mesh>
            <boxGeometry args={[0.2, 0.5, 0.12]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.5, 0.2, 0.12]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}

      {/* Stressed Amber Outline Box */}
      {isStressed && (
        <mesh position={[0, posY, 0]}>
          <boxGeometry args={[radius * 2.2, height * 1.02, radius * 2.2]} />
          <meshBasicMaterial color="#f59e0b" wireframe />
        </mesh>
      )}

      {/* Selected Indicator Outline / Halo */}
      {isSelected && (
        <mesh position={[0, height + 0.2, 0]}>
          <ringGeometry args={[0.6, 0.75, 24]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Base footprint pad */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.7, 1.7]} />
        <meshBasicMaterial
          color={isFailed ? "#7f1d1d" : isStressed ? "#78350f" : "#1e293b"}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
};
