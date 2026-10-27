import React, { useRef } from "react";
import * as THREE from "three";
import type { CityNode, NodeStatus } from "@/engine/types";
import { GEO_NODES } from "@/engine/geoCoordinates";

interface GisAssetMeshProps {
  node: CityNode;
  status: NodeStatus;
  isTrigger: boolean;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Restrained engineering color scheme:
 * - Normal/Operational: Muted green (#7a9a7a / #4d6b4d)
 * - Degraded/Stressed: Amber (#e09f3e / #b57a22)
 * - Failed: Muted Red (#d9534f / #b33935)
 * - Selected: Restrained Olive Accent (#9BAA76) or white highlight
 */
export function getAssetStatusColor(status: NodeStatus): string {
  switch (status) {
    case "failed":
      return "#d9534f";
    case "stressed":
      return "#e09f3e";
    case "recovering":
      return "#8fae70";
    case "ok":
    default:
      return "#5c7356"; // Restrained GIS green
  }
}

/**
 * Realistic architectural heights in meters scaled to scene units
 */
export function getAssetHeight(node: CityNode): number {
  if (node.population > 0) {
    // Extruded residential footprint proportional to population density
    return Math.max(0.7, 0.4 + (node.population / 40000) * 1.6);
  }
  switch (node.kind) {
    case "powerplant":
      return 1.4;
    case "waterplant":
      return 0.9;
    case "substation":
      return 0.6;
    case "hospital":
      return 1.2;
    case "tower":
      return 2.5; // Telecom lattice/mast
    case "pump":
      return 0.5;
    case "pipeline":
      return 0.35;
    case "road":
    case "underpass":
      return 0.15;
    default:
      return 0.6;
  }
}

export const GisAssetMesh: React.FC<GisAssetMeshProps> = ({
  node,
  status,
  isTrigger,
  isSelected,
  onClick,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geoInfo = GEO_NODES[node.id];

  // Map to geospatial metric scale coordinates
  const posX = (node.x - 4) * 3.4;
  const posZ = (node.y - 3) * 3.2;
  const height = getAssetHeight(node);
  const posY = height / 2;

  const statusColor = getAssetStatusColor(status);
  const isFailed = status === "failed";
  const isStressed = status === "stressed";

  // Footprint dimensions based on realistic parcel footprint
  const [fpW, fpD] = geoInfo ? [geoInfo.footprintDimensions[0] / 50, geoInfo.footprintDimensions[1] / 50] : [1.4, 1.4];

  return (
    <group position={[posX, 0, posZ]}>
      {/* Parcel Boundary / Ground Footprint */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[fpW * 1.15, fpD * 1.15]} />
        <meshBasicMaterial
          color={isFailed ? "#401c1c" : isStressed ? "#3d2d14" : isSelected ? "#3a462b" : "#1e262c"}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Parcel Cadastral Outline */}
      <lineSegments position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(fpW * 1.15, fpD * 1.15)]} />
        <lineBasicMaterial
          color={isSelected ? "#9BAA76" : isFailed ? "#d9534f" : "#303941"}
          linewidth={isSelected ? 2 : 1}
        />
      </lineSegments>

      {/* Primary Structure - Extruded Engineering Footprint */}
      {node.kind === "tower" ? (
        // Telecom Mast / Antenna Structure
        <group position={[0, 0, 0]}>
          <mesh
            ref={meshRef}
            position={[0, posY, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <cylinderGeometry args={[0.08, 0.35, height, 4]} />
            <meshStandardMaterial
              color={statusColor}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          {/* Mast top beacon */}
          <mesh position={[0, height + 0.1, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color={isFailed ? "#d9534f" : "#9BAA76"} />
          </mesh>
        </group>
      ) : node.kind === "pipeline" ? (
        // Infrastructure Pipeline Corridor
        <group
          position={[0, posY, 0]}
          rotation={[0, 0, Math.PI / 2]}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <mesh ref={meshRef}>
            <cylinderGeometry args={[0.22, 0.22, fpD * 1.5, 12]} />
            <meshStandardMaterial
              color={statusColor}
              metalness={0.5}
              roughness={0.4}
            />
          </mesh>
        </group>
      ) : (
        // Architectural Engineering Building Volume
        <mesh
          ref={meshRef}
          position={[0, posY, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <boxGeometry args={[fpW, height, fpD]} />
          <meshStandardMaterial
            color={statusColor}
            metalness={0.25}
            roughness={0.65}
          />
        </mesh>
      )}

      {/* Structural Edges Highlight for Clean Technical Wireframe */}
      {node.kind !== "tower" && node.kind !== "pipeline" && (
        <lineSegments position={[0, posY, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(fpW, height, fpD)]} />
          <lineBasicMaterial
            color={isSelected ? "#ffffff" : isFailed ? "#ff6b6b" : "#404c56"}
          />
        </lineSegments>
      )}

      {/* Hospital Structural Medical Cross Symbol (Restrained White) */}
      {node.kind === "hospital" && (
        <group position={[0, height + 0.25, 0]}>
          <mesh>
            <boxGeometry args={[0.15, 0.4, 0.08]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh>
            <boxGeometry args={[0.4, 0.15, 0.08]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      )}

      {/* Subtle Asset Selection Highlight - Restrained Olive/White Ring */}
      {isSelected && (
        <group position={[0, height + 0.35, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.55, 0.7, 32]} />
            <meshBasicMaterial color="#9BAA76" side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* Engineering Status Indicator Pin for Critical Outages */}
      {isTrigger && (
        <group position={[0, height + 0.5, 0]}>
          <mesh>
            <octahedronGeometry args={[0.22]} />
            <meshBasicMaterial color="#d9534f" />
          </mesh>
        </group>
      )}
    </group>
  );
};
