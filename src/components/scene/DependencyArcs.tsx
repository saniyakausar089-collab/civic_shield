import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import type { CityNode, NodeStatus, SystemLayer } from "@/engine/types";
import { getNodeHeight } from "./NodeMesh";

interface LinkData {
  fromNode: CityNode;
  toNode: CityNode;
  layer: SystemLayer;
  isFailed: boolean;
  curve: THREE.QuadraticBezierCurve3;
}

interface DependencyArcsProps {
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

function getLayerColor(layer: SystemLayer): string {
  switch (layer) {
    case "power":
      return "#f59e0b";
    case "water":
      return "#06b6d4";
    case "telecom":
      return "#8b5cf6";
    case "transport":
      return "#64748b";
    default:
      return "#94a3b8";
  }
}

export const DependencyArcs: React.FC<DependencyArcsProps> = ({
  nodes,
  statusMap,
  visibleLayers,
}) => {
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Compute 3D curve for each dependency
  const links: LinkData[] = useMemo(() => {
    const list: LinkData[] = [];
    for (const target of nodes) {
      for (const dep of target.deps) {
        // layer filter
        if (dep.layer === "power" && !visibleLayers.power) continue;
        if (dep.layer === "water" && !visibleLayers.water) continue;
        if (dep.layer === "telecom" && !visibleLayers.telecom) continue;
        if (dep.layer === "transport" && !visibleLayers.roads) continue;

        const source = nodeMap.get(dep.id);
        if (!source) continue;

        const p1 = new THREE.Vector3(
          (source.x - 4) * 2.6,
          getNodeHeight(source) * 0.8,
          (source.y - 3) * 2.6
        );
        const p2 = new THREE.Vector3(
          (target.x - 4) * 2.6,
          getNodeHeight(target) * 0.8,
          (target.y - 3) * 2.6
        );

        // Control point curved up in Y
        const dist = p1.distanceTo(p2);
        const midX = (p1.x + p2.x) / 2;
        const midZ = (p1.z + p2.z) / 2;
        const midY = Math.max(p1.y, p2.y) + Math.min(3.5, 0.6 + dist * 0.22);
        const control = new THREE.Vector3(midX, midY, midZ);

        const curve = new THREE.QuadraticBezierCurve3(p1, control, p2);
        const isFailed = statusMap[source.id] === "failed";

        list.push({ fromNode: source, toNode: target, layer: dep.layer, isFailed, curve });
      }
    }
    return list;
  }, [nodes, nodeMap, statusMap, visibleLayers]);

  // Animated particle references
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const failedLinks = useMemo(() => links.filter((l) => l.isFailed), [links]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Animate particles flowing along failed links
  useFrame(({ clock }) => {
    if (!particlesRef.current || failedLinks.length === 0) return;
    const t = clock.getElapsedTime() * 1.5;

    let index = 0;
    // 2 particles per failed link
    for (const link of failedLinks) {
      for (let p = 0; p < 2; p++) {
        const u = (t * 0.8 + p * 0.5) % 1;
        const pos = link.curve.getPoint(u);
        dummy.position.copy(pos);
        dummy.scale.setScalar(0.12);
        dummy.updateMatrix();
        particlesRef.current.setMatrixAt(index++, dummy.matrix);
      }
    }
    particlesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Glow Arc Lines using Drei Line */}
      {links.map((link, idx) => {
        const points = link.curve.getPoints(20);
        const color = link.isFailed ? "#ef4444" : getLayerColor(link.layer);
        const opacity = link.isFailed ? 0.95 : 0.45;

        return (
          <Line
            key={`${link.fromNode.id}->${link.toNode.id}-${idx}`}
            points={points}
            color={color}
            lineWidth={link.isFailed ? 2.5 : 1.2}
            transparent
            opacity={opacity}
          />
        );
      })}

      {/* Instanced Flowing Particles for Failed Links */}
      {failedLinks.length > 0 && (
        <instancedMesh
          ref={particlesRef}
          args={[undefined, undefined, failedLinks.length * 2]}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color="#ff2233" />
        </instancedMesh>
      )}
    </group>
  );
};
