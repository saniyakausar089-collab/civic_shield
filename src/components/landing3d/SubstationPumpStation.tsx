import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface SubstationPumpStationProps {
  scrollProgress: number;
}

export const SubstationPumpStation: React.FC<SubstationPumpStationProps> = ({
  scrollProgress,
}) => {
  const pumpShaft1Ref = useRef<THREE.Group>(null);
  const pumpShaft2Ref = useRef<THREE.Group>(null);
  const transformerRef = useRef<THREE.Group>(null);

  // Visible around Stage 3.5 to 5.2 (progress 0.35 to 0.54)
  const isVisible = scrollProgress >= 0.32 && scrollProgress <= 0.60;

  useFrame((state, delta) => {
    // Subtle rotation of pump drive shafts (operating municipal pumps)
    if (pumpShaft1Ref.current) {
      pumpShaft1Ref.current.rotation.z += delta * 12;
    }
    if (pumpShaft2Ref.current) {
      pumpShaft2Ref.current.rotation.z += delta * 12;
    }

    // High voltage transformer electromagnetic micro-vibration
    if (transformerRef.current) {
      const hum = Math.sin(state.clock.getElapsedTime() * 120) * 0.002;
      transformerRef.current.position.y = 0 + hum;
    }
  });

  if (!isVisible) return null;

  return (
    <group position={[-20, 0, -26]}>
      {/* Concrete Equipment Base Foundation Slab */}
      <mesh position={[0, 0.25, 0]} receiveShadow>
        <boxGeometry args={[24, 0.5, 20]} />
        <meshStandardMaterial color="#2b3138" roughness={0.8} />
      </mesh>

      {/* ========================================================
          SECTION 1: MUNICIPAL WATER PUMP STATION (PUMPA)
          ======================================================== */}
      <group position={[-5, 0.5, 2]}>
        {/* Pump Station Low-Profile Shelter Wall / Slab */}
        <mesh position={[0, 4, -4]}>
          <boxGeometry args={[10, 8, 0.4]} />
          <meshStandardMaterial color="#1a2026" roughness={0.7} />
        </mesh>

        {/* --- Pump Unit 1 --- */}
        <group position={[-2.4, 0.6, 0]}>
          {/* Centrifugal Pump Volute (Scroll casing) */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.9, 0.9, 0.8, 24]} />
            <meshStandardMaterial color="#1e4e69" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Pump Motor Frame */}
          <mesh position={[1.4, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.7, 0.7, 1.6, 20]} />
            <meshStandardMaterial color="#143649" metalness={0.8} roughness={0.25} />
          </mesh>

          {/* Motor Cooling Fan Shroud */}
          <mesh position={[2.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.65, 0.65, 0.3, 16]} />
            <meshStandardMaterial color="#0c202b" roughness={0.5} />
          </mesh>

          {/* Rotating Drive Shaft Coupler */}
          <group ref={pumpShaft1Ref} position={[0.5, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.22, 0.22, 0.4, 12]} />
              <meshStandardMaterial color="#b59445" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>

          {/* Suction & Discharge Manifold Pipes */}
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 1.6, 16]} />
            <meshStandardMaterial color="#2d3748" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>

        {/* --- Pump Unit 2 --- */}
        <group position={[2.4, 0.6, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.9, 0.9, 0.8, 24]} />
            <meshStandardMaterial color="#1e4e69" metalness={0.7} roughness={0.3} />
          </mesh>

          <mesh position={[1.4, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.7, 0.7, 1.6, 20]} />
            <meshStandardMaterial color="#143649" metalness={0.8} roughness={0.25} />
          </mesh>

          <mesh position={[2.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.65, 0.65, 0.3, 16]} />
            <meshStandardMaterial color="#0c202b" roughness={0.5} />
          </mesh>

          <group ref={pumpShaft2Ref} position={[0.5, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.22, 0.22, 0.4, 12]} />
              <meshStandardMaterial color="#b59445" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>

          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 1.6, 16]} />
            <meshStandardMaterial color="#2d3748" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>

        {/* High-Pressure Hydro-Pneumatic Surge Vessel */}
        <group position={[-4.5, 2.2, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[1.1, 1.1, 3.8, 24]} />
            <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 1.9, 0]}>
            <sphereGeometry args={[1.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.25} />
          </mesh>
        </group>
      </group>

      {/* ========================================================
          SECTION 2: ELECTRICAL STEP-DOWN SUBSTATION (SUB2)
          ======================================================== */}
      <group position={[6, 0.5, -1]}>
        {/* Main Transformer Unit */}
        <group ref={transformerRef} position={[0, 1.8, 0]}>
          {/* Main Oil Tank Enclosure */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.2, 3.2, 3.6]} />
            <meshStandardMaterial color="#475569" metalness={0.65} roughness={0.35} />
          </mesh>

          {/* Corrugated Radiator Cooling Fin Banks (Left & Right) */}
          {[-1.85, 1.85].map((sideX) => (
            <mesh key={sideX} position={[sideX, 0, 0]}>
              <boxGeometry args={[0.4, 2.6, 3.2]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}

          {/* Oil Conservator Drum (Cylindrical Header Tank on top) */}
          <mesh position={[0, 2.1, -0.6]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.55, 0.55, 2.8, 20]} />
            <meshStandardMaterial color="#64748b" metalness={0.75} roughness={0.3} />
          </mesh>

          {/* High Voltage Ceramic Insulator Bushings */}
          {[-0.9, 0, 0.9].map((bx) => (
            <group key={bx} position={[bx, 1.6, 0.8]}>
              {/* Ceramic Ridged Cone */}
              <mesh castShadow>
                <cylinderGeometry args={[0.08, 0.22, 1.4, 16]} />
                <meshStandardMaterial color="#854d0e" roughness={0.15} metalness={0.1} />
              </mesh>
              {/* Copper Terminal Cap */}
              <mesh position={[0, 0.75, 0]}>
                <sphereGeometry args={[0.1, 12, 12]} />
                <meshStandardMaterial color="#ea580c" metalness={0.95} roughness={0.1} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Structural Steel Gantry Busbar Framework */}
        <group position={[0, 4.5, 0]}>
          <mesh position={[-2, 0, 0]}>
            <boxGeometry args={[0.2, 8, 0.2]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
          <mesh position={[2, 0, 0]}>
            <boxGeometry args={[0.2, 8, 0.2]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
          <mesh position={[0, 3.8, 0]}>
            <boxGeometry args={[4.2, 0.2, 0.2]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
        </group>

        {/* Substation Warning Placard */}
        <mesh position={[0, 1.2, 2.4]}>
          <planeGeometry args={[0.9, 0.6]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      </group>

      {/* Perimeter Security Palisade Fence */}
      <group position={[0, 1.5, 0]}>
        {/* Front Wire Barrier */}
        <mesh position={[0, 0, 9.5]}>
          <boxGeometry args={[23.5, 2.8, 0.08]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.3} wireframe />
        </mesh>
        {/* Back Wire Barrier */}
        <mesh position={[0, 0, -9.5]}>
          <boxGeometry args={[23.5, 2.8, 0.08]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.3} wireframe />
        </mesh>
      </group>
    </group>
  );
};
