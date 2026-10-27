import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface CascadeFailureProps {
  scrollProgress: number;
}

export const CascadeFailure: React.FC<CascadeFailureProps> = ({ scrollProgress }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const floodWaterRef = useRef<THREE.Mesh>(null);
  const warningLightRef = useRef<THREE.PointLight>(null);

  // Active during Stage 6.8 to Stage 8.2 (progress 0.68 to 0.83)
  const isVisible = scrollProgress >= 0.68 && scrollProgress <= 0.84;

  // Local stage 7 scrub intensity (0 to 1)
  const failureIntensity = useMemo(() => {
    if (scrollProgress < 0.70) return 0;
    if (scrollProgress >= 0.70 && scrollProgress <= 0.81) {
      return (scrollProgress - 0.70) / 0.11;
    }
    return 1;
  }, [scrollProgress]);

  // Water jet particle fountain simulation
  const { particleGeom, particleCount, velocities } = useMemo(() => {
    const count = 450;
    const positions = new Float32Array(count * 3);
    const vels = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;

      vels[i * 3] = (Math.random() - 0.5) * 4;
      vels[i * 3 + 1] = 6 + Math.random() * 8; // High upward velocity
      vels[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { particleGeom: geom, particleCount: count, velocities: vels };
  }, []);

  useFrame((state, delta) => {
    // Animate high-pressure ruptured water jet spray
    if (particlesRef.current && isVisible) {
      const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        // Apply velocity & gravity
        positions[i * 3 + 1] += (velocities[i * 3 + 1]! - delta * 9.8) * delta * 2.2;
        positions[i * 3] += velocities[i * 3]! * delta;
        positions[i * 3 + 2] += velocities[i * 3 + 2]! * delta;

        // Reset particles that hit ground
        if (positions[i * 3 + 1]! < 0.2) {
          positions[i * 3] = (Math.random() - 0.5) * 1.5;
          positions[i * 3 + 1] = 0.2;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Rising floodwater depth inside the underpass
    if (floodWaterRef.current) {
      const targetWaterY = 0.4 + failureIntensity * 1.6;
      floodWaterRef.current.position.y = targetWaterY;
    }

    // Flashing emergency warning hazard beacon
    if (warningLightRef.current) {
      const strobe = Math.sin(state.clock.getElapsedTime() * 10) > 0 ? 3.5 : 0;
      warningLightRef.current.intensity = strobe * failureIntensity;
    }
  });

  if (!isVisible) return null;

  return (
    <group position={[2, 0, -16]}>
      {/* 1. Cracked Ground Asphalt Epicenter Fissure */}
      <group position={[0, 0.05, 0]}>
        {/* Asphalt crater displacement */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[12, 10]} />
          <meshStandardMaterial color="#0f1115" roughness={0.95} />
        </mesh>

        {/* High-Contrast Fissure Jagged Cracks */}
        {[-3, 0, 3].map((cx) => (
          <mesh key={cx} position={[cx, 0.06, (cx % 2) * 1.5]} rotation={[0, 0.4, 0]}>
            <boxGeometry args={[4.2, 0.08, 0.3]} />
            <meshBasicMaterial color="#05080c" />
          </mesh>
        ))}
      </group>

      {/* 2. High-Pressure Water Jet Geyser Particles */}
      <points ref={particlesRef} geometry={particleGeom}>
        <pointsMaterial
          size={0.45}
          color="#38bdf8"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 3. Flooded East Underpass (UJ1) */}
      <group position={[0, 0, 10]}>
        {/* Underpass Retaining Walls */}
        <mesh position={[-6, 1.2, 0]}>
          <boxGeometry args={[0.8, 3.6, 22]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        <mesh position={[6, 1.2, 0]}>
          <boxGeometry args={[0.8, 3.6, 22]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* Rising Murky Floodwater Mesh */}
        <mesh ref={floodWaterRef} position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[11.2, 22]} />
          <meshStandardMaterial
            color="#082f49"
            roughness={0.12}
            metalness={0.85}
            transparent
            opacity={0.92}
          />
        </mesh>

        {/* Submerged Stranded Vehicles with Flashing Hazards */}
        <group position={[-1.5, 0.8, -2]}>
          <mesh castShadow>
            <boxGeometry args={[2, 1.4, 4.2]} />
            <meshStandardMaterial color="#991b1b" roughness={0.4} />
          </mesh>
          {/* Amber Hazard Point Light */}
          <pointLight
            ref={warningLightRef}
            position={[0, 1.2, 0]}
            color="#f59e0b"
            distance={15}
            decay={2}
          />
        </group>
      </group>
    </group>
  );
};
