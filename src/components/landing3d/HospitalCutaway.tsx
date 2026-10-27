import React from "react";
import * as THREE from "three";

interface HospitalCutawayProps {
  scrollProgress: number;
}

export const HospitalCutaway: React.FC<HospitalCutawayProps> = ({ scrollProgress }) => {
  // Visible during Stage 4.8 to Stage 6.2 (progress 0.48 to 0.62)
  const isVisible = scrollProgress >= 0.44 && scrollProgress <= 0.65;

  if (!isVisible) return null;

  return (
    <group position={[32, 0, -42]}>
      {/* ========================================================
          EASTSIDE MEDICAL CENTER (H1) - ARCHITECTURAL CUTAWAY
          ======================================================== */}

      {/* Main Structural Frame (4 Floors: y = 0 to y = 20) */}
      <group position={[0, 10, 0]}>
        {/* Rear & Left Solid Walls */}
        <mesh position={[0, 0, -10]} receiveShadow>
          <boxGeometry args={[26, 20, 0.6]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
        </mesh>
        <mesh position={[-13, 0, 0]} receiveShadow>
          <boxGeometry args={[0.6, 20, 20]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
        </mesh>
        <mesh position={[13, 0, 0]} receiveShadow>
          <boxGeometry args={[0.6, 20, 20]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
        </mesh>

        {/* Concrete Floor Slabs (Basement/Ground, 2nd, 3rd, Rooftop) */}
        {[0, 5, 10, 15, 20].map((fy) => (
          <mesh key={fy} position={[0, fy - 10, 0]} receiveShadow>
            <boxGeometry args={[26, 0.6, 20]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.6} />
          </mesh>
        ))}

        {/* Structural Column Grid */}
        {[-8, 0, 8].map((cx) => (
          <mesh key={cx} position={[cx, 0, 6]}>
            <cylinderGeometry args={[0.35, 0.35, 20, 12]} />
            <meshStandardMaterial color="#64748b" roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* ========================================================
          INTERIOR CUTAWAY ROOMS
          ======================================================== */}

      {/* 1. Basement / Ground: Emergency Backup Generator & Water Cistern */}
      <group position={[0, 0, 0]}>
        {/* Diesel Generator 1 */}
        <group position={[-5, 1.4, -2]}>
          <mesh castShadow>
            <boxGeometry args={[3.2, 1.8, 1.8]} />
            <meshStandardMaterial color="#15803d" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Exhaust Stack */}
          <mesh position={[1.2, 1.8, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 1.8, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
          </mesh>
        </group>

        {/* Diesel Generator 2 */}
        <group position={[1, 1.4, -2]}>
          <mesh castShadow>
            <boxGeometry args={[3.2, 1.8, 1.8]} />
            <meshStandardMaterial color="#15803d" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[1.2, 1.8, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 1.8, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
          </mesh>
        </group>

        {/* Emergency Potable Water Cistern / Tank */}
        <group position={[7, 1.8, -2]}>
          <mesh castShadow>
            <cylinderGeometry args={[1.6, 1.6, 3, 20]} />
            <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.25} />
          </mesh>
        </group>

        {/* Floating 3D Label: Generator Room */}
        <group position={[-2, 3.8, 4]}>
          <mesh>
            <planeGeometry args={[7.2, 0.9]} />
            <meshBasicMaterial color="#0f172a" transparent opacity={0.85} />
          </mesh>
        </group>
      </group>

      {/* 2. 2nd Floor: Intensive Care Unit (ICU) / Surgery */}
      <group position={[0, 5, 0]}>
        {/* Hospital Patient Beds */}
        {[-7, -2, 3, 8].map((bx) => (
          <group key={bx} position={[bx, 0.8, -3]}>
            {/* Bed Mattress */}
            <mesh>
              <boxGeometry args={[1.4, 0.6, 2.4]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} />
            </mesh>
            {/* Medical Monitor Screen Glow */}
            <mesh position={[0.9, 1.2, -0.6]}>
              <boxGeometry args={[0.1, 0.6, 0.8]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </group>
        ))}
      </group>

      {/* 3. 3rd & 4th Floors: Inpatient Care Wards */}
      <group position={[0, 10, 0]}>
        {/* Lit Warm Patient Room Partitions */}
        {[-8, -2, 4].map((px) => (
          <mesh key={px} position={[px, 2.5, -2]}>
            <boxGeometry args={[0.2, 4.4, 8]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
        ))}
      </group>

      {/* ========================================================
          AMBULANCE EMERGENCY BAY (Ground level front canopy)
          ======================================================== */}
      <group position={[0, 0, 14]}>
        {/* Cantilever Entrance Overhang */}
        <mesh position={[0, 4.2, 0]} receiveShadow castShadow>
          <boxGeometry args={[18, 0.6, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>

        {/* Support Steel Stanchions */}
        <mesh position={[-8, 2, 3.5]}>
          <cylinderGeometry args={[0.2, 0.2, 4, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
        <mesh position={[8, 2, 3.5]}>
          <cylinderGeometry args={[0.2, 0.2, 4, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>

        {/* Red Medical Cross Emblem on Canopy Front */}
        <group position={[0, 4.2, 4.1]}>
          <mesh>
            <boxGeometry args={[1.6, 0.45, 0.05]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh>
            <boxGeometry args={[0.45, 1.6, 0.05]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>

        {/* Ambulance 1 */}
        <group position={[-4, 0.9, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.2, 1.8, 4.4]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
          </mesh>
          {/* Emergency Roof Lightbar */}
          <mesh position={[0, 1.05, 0]}>
            <boxGeometry args={[1.2, 0.2, 0.4]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>

        {/* Ambulance 2 */}
        <group position={[4, 0.9, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.2, 1.8, 4.4]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.05, 0]}>
            <boxGeometry args={[1.2, 0.2, 0.4]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>
        </group>
      </group>

      {/* ========================================================
          ROOFTOP HELIPAD & HVAC PLANT
          ======================================================== */}
      <group position={[0, 20.3, 0]}>
        {/* Circular Helipad Landing Deck */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[7, 32]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* Outer White Helipad Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[6.2, 6.7, 32]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>

        {/* Center 'H' Marker */}
        <group position={[0, 0.03, 0]}>
          <mesh position={[-1.2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, 3.2]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[1.2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, 3.2]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.4, 0.5]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        </group>

        {/* Perimeter Green Navigation Beacons */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 6.8, 0.2, Math.sin(angle) * 6.8]}
            >
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshBasicMaterial color="#22c55e" />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};
