import React, { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import type { CityNode, NodeStatus, SystemLayer } from "@/engine/types";
import { getAssetHeight } from "./GisAssetMesh";

interface UtilityNetworkProps {
  nodes: CityNode[];
  statusMap: Record<string, NodeStatus>;
  visibleLayers: {
    power: boolean;
    water: boolean;
    roads: boolean;
    telecom: boolean;
    hospitals: boolean;
  };
}

/**
 * Restrained engineering utility colors:
 * - Water: Restrained cyan / blue-gray lines (#5c8ca3)
 * - Electricity: Muted amber lines (#d4a359)
 * - Transport: Neutral gray or subdued orange (#6f7881)
 * - Telecom: Thin violet-gray lines (#837d99)
 * - Failed connection: Distinct muted red (#d9534f)
 */
function getUtilityColor(layer: SystemLayer, isFailed: boolean): string {
  if (isFailed) return "#d9534f";
  switch (layer) {
    case "power":
      return "#d4a359";
    case "water":
      return "#5c8ca3";
    case "transport":
      return "#6f7881";
    case "telecom":
      return "#837d99";
    default:
      return "#718096";
  }
}

export const UtilityNetworkOverlays: React.FC<UtilityNetworkProps> = ({
  nodes,
  statusMap,
  visibleLayers,
}) => {
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Build utility link coordinates
  const links = useMemo(() => {
    const list: {
      key: string;
      points: [number, number, number][];
      color: string;
      lineWidth: number;
      opacity: number;
    }[] = [];

    for (const target of nodes) {
      for (const dep of target.deps) {
        // Layer filtering
        if (dep.layer === "power" && !visibleLayers.power) continue;
        if (dep.layer === "water" && !visibleLayers.water) continue;
        if (dep.layer === "transport" && !visibleLayers.roads) continue;
        if (dep.layer === "telecom" && !visibleLayers.telecom) continue;

        const source = nodeMap.get(dep.id);
        if (!source) continue;

        const isFailed = statusMap[source.id] === "failed";
        const color = getUtilityColor(dep.layer, isFailed);

        const srcX = (source.x - 4) * 3.4;
        const srcZ = (source.y - 3) * 3.2;
        const srcY = 0.15; // Ground utility duct height

        const tgtX = (target.x - 4) * 3.4;
        const tgtZ = (target.y - 3) * 3.2;
        const tgtY = 0.15;

        // Ground-level route with slight curvature only when needed, avoiding cartoon 3D parabolas
        const p1 = new THREE.Vector3(srcX, srcY, srcZ);
        const p2 = new THREE.Vector3(tgtX, tgtY, tgtZ);

        // Low profile engineering utility easement
        const midX = (p1.x + p2.x) / 2;
        const midZ = (p1.z + p2.z) / 2;
        const dist = p1.distanceTo(p2);
        const midY = 0.15 + (dep.layer === "telecom" ? Math.min(1.2, dist * 0.1) : 0.05);

        const curve = new THREE.QuadraticBezierCurve3(
          p1,
          new THREE.Vector3(midX, midY, midZ),
          p2
        );

        const points = curve.getPoints(12).map((pt) => [pt.x, pt.y, pt.z] as [number, number, number]);

        list.push({
          key: `${source.id}->${target.id}-${dep.layer}`,
          points,
          color,
          lineWidth: isFailed ? 2.0 : dep.layer === "power" || dep.layer === "water" ? 1.6 : 1.0,
          opacity: isFailed ? 0.95 : 0.65,
        });
      }
    }
    return list;
  }, [nodes, nodeMap, statusMap, visibleLayers]);

  return (
    <group>
      {links.map((link) => (
        <Line
          key={link.key}
          points={link.points}
          color={link.color}
          lineWidth={link.lineWidth}
          transparent
          opacity={link.opacity}
        />
      ))}
    </group>
  );
};
