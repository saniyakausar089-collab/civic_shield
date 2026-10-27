import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getBuildingTextures, getAsphaltTexture } from "./textures";

interface ProceduralCityProps {
  scrollProgress: number;
  failureProgress?: number; // 0 to 1 for blackouts in stage 7+
}

export const ProceduralCity: React.FC<ProceduralCityProps> = ({
  scrollProgress,
  failureProgress = 0,
}) => {
  const buildingMeshRef = useRef<THREE.InstancedMesh>(null);
  const rooftopMeshRef = useRef<THREE.InstancedMesh>(null);
  const trafficMeshRef = useRef<THREE.InstancedMesh>(null);

  // Textures
  const { diffuse, emissive } = useMemo(() => getBuildingTextures(), []);
  const asphaltTexture = useMemo(() => getAsphaltTexture(), []);

  // Procedural Building layout definition
  const { buildingData, rooftopData, totalBuildings } = useMemo(() => {
    const buildings: {
      matrix: THREE.Matrix4;
      color: THREE.Color;
      distFromCenter: number;
      isDowntown: boolean;
      id: number;
    }[] = [];

    const rooftops: {
      matrix: THREE.Matrix4;
    }[] = [];

    let seed = 42;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    let id = 0;
    const blockSize = 32;
    const streetWidth = 10;
    const gridRange = 4; // -4 to +4 blocks -> 9x9 block grid

    for (let bx = -gridRange; bx <= gridRange; bx++) {
      for (let bz = -gridRange; bz <= gridRange; bz++) {
        const blockCenterX = bx * (blockSize + streetWidth);
        const blockCenterZ = bz * (blockSize + streetWidth);

        // Skip blocks occupied by the river canal
        if (blockCenterZ >= -20 && blockCenterZ <= 15) {
          continue;
        }

        const distFromCenter = Math.hypot(blockCenterX, blockCenterZ);
        const isDowntown = distFromCenter < 55;

        // Populate 4 to 8 buildings per block
        const subCols = 2;
        const subRows = 2;
        const subCell = blockSize / 2;

        for (let sx = 0; sx < subCols; sx++) {
          for (let sz = 0; sz < subRows; sz++) {
            const offsetX = (sx - 0.5) * subCell + (rnd() - 0.5) * 2;
            const offsetZ = (sz - 0.5) * subCell + (rnd() - 0.5) * 2;
            const x = blockCenterX + offsetX;
            const z = blockCenterZ + offsetZ;

            // Height depends on zoning: downtown towers vs outer residential
            let baseH = isDowntown ? 45 + rnd() * 45 : 12 + rnd() * 24;
            // Hospital/Substation clearing areas preserved
            if (Math.hypot(x - 26, z - (-24)) < 16) {
              // Reserved for hospital
              continue;
            }
            if (Math.hypot(x - (-14), z - (-12)) < 16) {
              // Reserved for substation/pump
              continue;
            }

            const w = 8 + rnd() * 6;
            const d = 8 + rnd() * 6;
            const h = baseH;

            const mat = new THREE.Matrix4();
            mat.compose(
              new THREE.Vector3(x, h / 2, z),
              new THREE.Quaternion(),
              new THREE.Vector3(w, h, d)
            );

            // Facade tint variation
            const tint = 0.85 + rnd() * 0.3;
            const col = new THREE.Color(tint * 0.88, tint * 0.92, tint * 0.98);

            buildings.push({
              matrix: mat,
              color: col,
              distFromCenter,
              isDowntown,
              id: id++,
            });

            // Rooftop mechanical unit / elevator penthouse
            if (rnd() > 0.3) {
              const rw = w * 0.45;
              const rd = d * 0.45;
              const rh = 2.5 + rnd() * 3;
              const rMat = new THREE.Matrix4();
              rMat.compose(
                new THREE.Vector3(x + (rnd() - 0.5) * 2, h + rh / 2, z + (rnd() - 0.5) * 2),
                new THREE.Quaternion(),
                new THREE.Vector3(rw, rh, rd)
              );
              rooftops.push({ matrix: rMat });
            }
          }
        }
      }
    }

    return {
      buildingData: buildings,
      rooftopData: rooftops,
      totalBuildings: buildings.length,
    };
  }, []);

  // Initialize building instance transforms
  useMemo(() => {
    if (!buildingMeshRef.current) return;
    const mesh = buildingMeshRef.current;
    buildingData.forEach((b, i) => {
      mesh.setMatrixAt(i, b.matrix);
      mesh.setColorAt(i, b.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [buildingData]);

  // Initialize rooftop instance transforms
  useMemo(() => {
    if (!rooftopMeshRef.current) return;
    const mesh = rooftopMeshRef.current;
    rooftopData.forEach((r, i) => {
      mesh.setMatrixAt(i, r.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [rooftopData]);

  // Traffic vehicle streams
  const trafficCount = 72;
  const traffic = useMemo(() => {
    const list: {
      avenue: "NS" | "EW";
      pos: number;
      lane: number;
      speed: number;
      isWhite: boolean;
      fixedCoord: number;
    }[] = [];

    const avenues = [-126, -84, -42, 0, 42, 84, 126];
    for (let i = 0; i < trafficCount; i++) {
      const isNS = Math.random() > 0.5;
      const fixedCoord = avenues[Math.floor(Math.random() * avenues.length)]!;
      const lane = Math.random() > 0.5 ? 2.5 : -2.5; // opposing lanes
      const isWhite = lane > 0; // headlights one way, taillights other
      list.push({
        avenue: isNS ? "NS" : "EW",
        pos: (Math.random() - 0.5) * 360,
        lane,
        speed: (0.35 + Math.random() * 0.45) * (lane > 0 ? 1 : -1),
        isWhite,
        fixedCoord,
      });
    }
    return list;
  }, [trafficCount]);

  // Per-frame animation for traffic & blackout dimming
  const dummyMatrix = useMemo(() => new THREE.Matrix4(), []);
  const dummyColor = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    if (trafficMeshRef.current) {
      const tMesh = trafficMeshRef.current;
      for (let i = 0; i < trafficCount; i++) {
        const item = traffic[i]!;
        item.pos += item.speed * delta * 45;
        if (item.pos > 180) item.pos = -180;
        if (item.pos < -180) item.pos = 180;

        const x = item.avenue === "NS" ? item.fixedCoord + item.lane : item.pos;
        const z = item.avenue === "NS" ? item.pos : item.fixedCoord + item.lane;

        // Skip cars entering river canal unless on bridge
        const inRiver = z > -18 && z < 12;
        const onBridge = Math.abs(x) < 5 || Math.abs(x - 84) < 5 || Math.abs(x + 84) < 5;
        const y = inRiver && !onBridge ? -50 : 0.45;

        dummyMatrix.compose(
          new THREE.Vector3(x, y, z),
          new THREE.Quaternion(),
          new THREE.Vector3(1.2, 0.4, 2.4)
        );
        tMesh.setMatrixAt(i, dummyMatrix);

        // Color: cool white headlights vs deep red tail lights
        if (item.isWhite) {
          dummyColor.set("#f0f4ff");
        } else {
          dummyColor.set("#ff2222");
        }
        tMesh.setColorAt(i, dummyColor);
      }
      tMesh.instanceMatrix.needsUpdate = true;
      if (tMesh.instanceColor) tMesh.instanceColor.needsUpdate = true;
    }

    // Dynamic blackout cascading on buildings when failureProgress > 0 (Stage 7)
    if (buildingMeshRef.current && failureProgress > 0) {
      const bMesh = buildingMeshRef.current;
      buildingData.forEach((b, i) => {
        // Cascade spreads outward from pipeline epicenter at (0, 0, -5)
        const d = Math.hypot(b.matrix.elements[12]!, b.matrix.elements[14]! - (-5));
        const threshold = failureProgress * 150;
        if (d < threshold) {
          // Blackout: dim building color
          const darkFactor = Math.max(0.12, 1 - (threshold - d) / 30);
          dummyColor.copy(b.color).multiplyScalar(darkFactor);
          bMesh.setColorAt(i, dummyColor);
        } else {
          bMesh.setColorAt(i, b.color);
        }
      });
      if (bMesh.instanceColor) bMesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. Road Ground Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[360, 360]} />
        <meshStandardMaterial
          map={asphaltTexture}
          roughness={0.88}
          metalness={0.12}
          color="#161a20"
        />
      </mesh>

      {/* 2. River Canal Cutting across City */}
      <group position={[0, -1.8, -4]}>
        {/* River Water Surface */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.8, 0]}>
          <planeGeometry args={[360, 28]} />
          <meshStandardMaterial
            color="#081422"
            roughness={0.08}
            metalness={0.92}
            envMapIntensity={1.5}
          />
        </mesh>
        {/* River Embankment Walls */}
        <mesh position={[0, 0.9, -14]} receiveShadow>
          <boxGeometry args={[360, 2.2, 1]} />
          <meshStandardMaterial color="#222830" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.9, 14]} receiveShadow>
          <boxGeometry args={[360, 2.2, 1]} />
          <meshStandardMaterial color="#222830" roughness={0.7} />
        </mesh>
      </group>

      {/* 3. Road Bridges crossing the River */}
      {[-84, 0, 84].map((bx) => (
        <group key={bx} position={[bx, 0.1, -4]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[14, 0.6, 32]} />
            <meshStandardMaterial color="#1a2026" roughness={0.8} />
          </mesh>
          {/* Bridge Safety Parapets */}
          <mesh position={[-6.8, 0.8, 0]}>
            <boxGeometry args={[0.4, 0.9, 32]} />
            <meshStandardMaterial color="#3a4550" roughness={0.6} />
          </mesh>
          <mesh position={[6.8, 0.8, 0]}>
            <boxGeometry args={[0.4, 0.9, 32]} />
            <meshStandardMaterial color="#3a4550" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* 4. Instanced Buildings */}
      <instancedMesh
        ref={buildingMeshRef}
        args={[undefined, undefined, totalBuildings]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          map={diffuse}
          emissiveMap={emissive}
          emissive="#ffffff"
          emissiveIntensity={failureProgress > 0 ? 0.35 * (1 - failureProgress * 0.7) : 0.85}
          roughness={0.35}
          metalness={0.25}
        />
      </instancedMesh>

      {/* 5. Instanced Rooftop Mechanical Structures */}
      <instancedMesh
        ref={rooftopMeshRef}
        args={[undefined, undefined, rooftopData.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1c2229" roughness={0.7} metalness={0.4} />
      </instancedMesh>

      {/* 6. Instanced Moving Traffic Light Trails */}
      <instancedMesh ref={trafficMeshRef} args={[undefined, undefined, trafficCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffffff" />
      </instancedMesh>
    </group>
  );
};
