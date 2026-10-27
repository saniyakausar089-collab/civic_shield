import React, { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { GIS_ROADS } from "@/engine/geoCoordinates";

interface GisTerrainBasemapProps {
  isDay: boolean;
  visibleRoads: boolean;
}

export const GisTerrainBasemap: React.FC<GisTerrainBasemapProps> = ({ isDay, visibleRoads }) => {
  // Convert GIS GeoJSON roads [lng, lat] to 3D scene space
  // Base center lat: 37.7749, lng: -122.4194
  const roadLines = useMemo(() => {
    return GIS_ROADS.map((road) => {
      const points = road.coords.map(([lng, lat]) => {
        // Map delta to 3D units
        const x = (lng - (-122.4194)) * 380;
        const z = -(lat - 37.7749) * 440;
        return [x, 0.04, z] as [number, number, number];
      });
      return {
        id: road.id,
        points,
        type: road.type,
      };
    });
  }, []);

  return (
    <group>
      {/* Primary Topographic Surface (2.5D Digital Elevation Model style) */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[48, 42]} />
        <meshStandardMaterial
          color={isDay ? "#d8dfe5" : "#13181d"}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Secondary Regional Boundary Base */}
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[65, 58]} />
        <meshBasicMaterial color={isDay ? "#cbd3da" : "#0e1115"} />
      </mesh>

      {/* Cartographic Coordinate Grid Overlay (1km Survey Grids) */}
      <gridHelper
        args={[44, 22, isDay ? "#b8c3cd" : "#242c33", isDay ? "#cbd5df" : "#192026"]}
        position={[0, 0.01, 0]}
      />

      {/* Geographic Arterial Road Network Overlay */}
      {visibleRoads &&
        roadLines.map((road) => (
          <Line
            key={road.id}
            points={road.points}
            color={isDay ? "#6c7a87" : "#434e57"}
            lineWidth={road.type === "highway" ? 3.0 : 1.8}
            transparent
            opacity={0.8}
          />
        ))}

      {/* East Underpass Depressed Hazard Bowl / Topographic Contour (UJ1 area) */}
      <mesh position={[(6 - 4) * 3.4, 0.02, (3 - 3) * 3.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.8, 32]} />
        <meshBasicMaterial color={isDay ? "#a8b5c2" : "#1f2933"} transparent opacity={0.6} />
      </mesh>
    </group>
  );
};
