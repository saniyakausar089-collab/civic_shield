import React, { useMemo } from "react";
import * as THREE from "three";
import { BASE_CITY } from "@/engine/city";

interface NetworkOverlayProps {
  scrollProgress: number;
}

export const NetworkOverlay: React.FC<NetworkOverlayProps> = ({ scrollProgress }) => {
  // Fade in at stage 1 (progress 0.06 -> 0.12), stay visible through 0.22, then fade out during descent
  const opacity = useMemo(() => {
    if (scrollProgress < 0.05) return 0;
    if (scrollProgress >= 0.05 && scrollProgress <= 0.12) {
      return (scrollProgress - 0.05) / 0.07;
    }
    if (scrollProgress > 0.12 && scrollProgress <= 0.22) {
      return 1;
    }
    if (scrollProgress > 0.22 && scrollProgress <= 0.30) {
      return 1 - (scrollProgress - 0.22) / 0.08;
    }
    return 0;
  }, [scrollProgress]);

  // Map 2D grid coordinates (9x7) of BASE_CITY to 3D city space
  const nodeCoords = useMemo(() => {
    const map = new Map<string, THREE.Vector3>();
    BASE_CITY.nodes.forEach((n) => {
      // Map x (0..8) to (-80..80), y (0..6) to (-70..70)
      const worldX = (n.x - 4) * 22;
      const worldZ = (n.y - 3) * 24;
      const worldY = n.kind === "hospital" ? 18 : n.kind === "tower" ? 32 : 8;
      map.set(n.id, new THREE.Vector3(worldX, worldY, worldZ));
    });
    return map;
  }, []);

  // Generate line segments for all dependency edges
  const linesByLayer = useMemo(() => {
    const powerLines: THREE.Vector3[] = [];
    const waterLines: THREE.Vector3[] = [];
    const telecomLines: THREE.Vector3[] = [];
    const transportLines: THREE.Vector3[] = [];

    BASE_CITY.nodes.forEach((n) => {
      const from = nodeCoords.get(n.id);
      if (!from) return;

      n.deps.forEach((d) => {
        const to = nodeCoords.get(d.id);
        if (!to) return;

        // Curved arc over the city
        const mid = new THREE.Vector3()
          .addVectors(from, to)
          .multiplyScalar(0.5);
        mid.y += 12; // Arched trajectory

        const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
        const points = curve.getPoints(12);

        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i]!;
          const p2 = points[i + 1]!;
          if (d.layer === "power") {
            powerLines.push(p1, p2);
          } else if (d.layer === "water") {
            waterLines.push(p1, p2);
          } else if (d.layer === "telecom") {
            telecomLines.push(p1, p2);
          } else {
            transportLines.push(p1, p2);
          }
        }
      });
    });

    return {
      powerGeom: new THREE.BufferGeometry().setFromPoints(powerLines),
      waterGeom: new THREE.BufferGeometry().setFromPoints(waterLines),
      telecomGeom: new THREE.BufferGeometry().setFromPoints(telecomLines),
      transportGeom: new THREE.BufferGeometry().setFromPoints(transportLines),
    };
  }, [nodeCoords]);

  if (opacity <= 0.01) return null;

  return (
    <group>
      {/* Power lines - Warm Amber */}
      <lineSegments geometry={linesByLayer.powerGeom}>
        <lineBasicMaterial
          color="#f59e0b"
          transparent
          opacity={opacity * 0.75}
          linewidth={1}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Water lines - High-tech Cyan */}
      <lineSegments geometry={linesByLayer.waterGeom}>
        <lineBasicMaterial
          color="#06b6d4"
          transparent
          opacity={opacity * 0.75}
          linewidth={1}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Telecom lines - Indigo */}
      <lineSegments geometry={linesByLayer.telecomGeom}>
        <lineBasicMaterial
          color="#818cf8"
          transparent
          opacity={opacity * 0.65}
          linewidth={1}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Transport lines - Emerald */}
      <lineSegments geometry={linesByLayer.transportGeom}>
        <lineBasicMaterial
          color="#10b981"
          transparent
          opacity={opacity * 0.6}
          linewidth={1}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Glowing Node Beacons */}
      {Array.from(nodeCoords.entries()).map(([id, pos]) => {
        const node = BASE_CITY.nodes.find((n) => n.id === id);
        let color = "#06b6d4";
        if (node?.kind === "powerplant" || node?.kind === "substation") color = "#f59e0b";
        else if (node?.kind === "hospital") color = "#ef4444";
        else if (node?.kind === "tower") color = "#818cf8";

        return (
          <group key={id} position={[pos.x, pos.y, pos.z]}>
            {/* Core beacon dot */}
            <mesh>
              <sphereGeometry args={[0.9, 12, 12]} />
              <meshBasicMaterial color={color} transparent opacity={opacity * 0.9} />
            </mesh>
            {/* Outer pulse halo */}
            <mesh>
              <sphereGeometry args={[1.8, 12, 12]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity * 0.25}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
