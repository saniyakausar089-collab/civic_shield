import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface CivicLifelinesProps {
  scrollProgress: number;
}

export const CivicLifelines: React.FC<CivicLifelinesProps> = ({ scrollProgress }) => {
  const beaconRef = useRef<THREE.Mesh>(null);

  // Visible during Stage 5.8 to Stage 7.2 (progress 0.58 to 0.74)
  const isVisible = scrollProgress >= 0.55 && scrollProgress <= 0.76;

  useFrame((state) => {
    // Blinking red aviation obstruction beacon on cell tower top
    if (beaconRef.current) {
      const flash = Math.sin(state.clock.getElapsedTime() * 4) > 0.3;
      beaconRef.current.visible = flash;
    }
  });

  if (!isVisible) return null;

  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================
          1. CIVIC SCHOOL CAMPUS (x: 22, z: -80)
          ======================================================== */}
      <group position={[22, 0, -80]}>
        {/* Main 2-story Classroom Wing */}
        <mesh position={[0, 4, 0]} castShadow receiveShadow>
          <boxGeometry args={[22, 8, 12]} />
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>

        {/* Gymnasium / Multipurpose Hall Wing */}
        <mesh position={[14, 5, 2]} castShadow receiveShadow>
          <boxGeometry args={[10, 10, 16]} />
          <meshStandardMaterial color="#475569" roughness={0.5} />
        </mesh>

        {/* School Courtyard / Sports Court */}
        <mesh position={[0, 0.05, 12]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[26, 14]} />
          <meshStandardMaterial color="#047857" roughness={0.9} />
        </mesh>

        {/* 3D Floating Lifeline Badge */}
        <group position={[5, 12, 0]}>
          <mesh>
            <planeGeometry args={[14, 2.2]} />
            <meshBasicMaterial color="#0b131e" transparent opacity={0.88} />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <planeGeometry args={[13.6, 1.8]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
        </group>
      </group>

      {/* ========================================================
          2. MUNICIPAL EMERGENCY SHELTER (x: 64, z: -82)
          ======================================================== */}
      <group position={[64, 0, -82]}>
        {/* Curved Vaulted Roof Evacuation Arena */}
        <mesh position={[0, 6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[8, 8, 24, 24, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Arena End Walls */}
        <mesh position={[-12, 4, 0]} receiveShadow>
          <boxGeometry args={[0.5, 8, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
        <mesh position={[12, 4, 0]} receiveShadow>
          <boxGeometry args={[0.5, 8, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>

        {/* Staging Apron */}
        <mesh position={[0, 0.05, 12]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[28, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>

        {/* 3D Floating Lifeline Badge */}
        <group position={[0, 15, 0]}>
          <mesh>
            <planeGeometry args={[15, 2.2]} />
            <meshBasicMaterial color="#0b131e" transparent opacity={0.88} />
          </mesh>
        </group>
      </group>

      {/* ========================================================
          3. TELECOMMUNICATION TRANSMISSION MAST (x: 44, z: -92)
          ======================================================== */}
      <group position={[44, 0, -92]}>
        {/* Concrete Foundation Base */}
        <mesh position={[0, 0.5, 0]} receiveShadow>
          <boxGeometry args={[8, 1, 8]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* Equipment Shelter & Battery Backup Enclosure */}
        <mesh position={[2, 1.6, 2]} castShadow>
          <boxGeometry args={[3, 2.2, 3]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Steel Lattice Transmission Tower (height: 48m) */}
        {/* 3 main structural corner steel columns tapering to top */}
        <group position={[0, 24, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.4, 2.4, 48, 3, 8, true]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.9}
              roughness={0.25}
              wireframe
            />
          </mesh>

          {/* Central Structural Mast */}
          <mesh>
            <cylinderGeometry args={[0.2, 0.4, 48, 6]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>

          {/* Triangular Antenna Platforms */}
          {[16, 32, 44].map((py) => (
            <group key={py} position={[0, py - 24, 0]}>
              <mesh>
                <cylinderGeometry args={[2.2 - py * 0.03, 2.2 - py * 0.03, 0.3, 3]} />
                <meshStandardMaterial color="#475569" metalness={0.8} />
              </mesh>

              {/* Cellular Transceiver Panel Antennas */}
              {Array.from({ length: 3 }).map((_, i) => {
                const angle = (i / 3) * Math.PI * 2;
                return (
                  <mesh
                    key={i}
                    position={[
                      Math.cos(angle) * (2.4 - py * 0.03),
                      0.8,
                      Math.sin(angle) * (2.4 - py * 0.03),
                    ]}
                    rotation={[0, -angle, 0]}
                  >
                    <boxGeometry args={[0.3, 1.6, 0.8]} />
                    <meshStandardMaterial color="#f8fafc" roughness={0.2} />
                  </mesh>
                );
              })}
            </group>
          ))}

          {/* Parabolic Microwave Dish Antenna */}
          <group position={[1.4, 12, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <mesh>
              <sphereGeometry args={[1.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.3} side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* Top Lightning Finial Spire */}
          <mesh position={[0, 26, 0]}>
            <cylinderGeometry args={[0.04, 0.1, 4, 8]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} />
          </mesh>

          {/* Flashing Red Aviation Obstruction Beacon */}
          <mesh ref={beaconRef} position={[0, 28.2, 0]}>
            <sphereGeometry args={[0.3, 12, 12]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>

        {/* 3D Floating Lifeline Badge */}
        <group position={[0, 52, 0]}>
          <mesh>
            <planeGeometry args={[16, 2.4]} />
            <meshBasicMaterial color="#0b131e" transparent opacity={0.88} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
