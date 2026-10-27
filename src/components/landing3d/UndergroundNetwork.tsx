import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getSoilCutawayTexture, getBrushedMetalTexture } from "./textures";

interface UndergroundNetworkProps {
  scrollProgress: number;
}

export const UndergroundNetwork: React.FC<UndergroundNetworkProps> = ({ scrollProgress }) => {
  const waterFlowRef = useRef<THREE.Mesh>(null);
  const powerPulseRef = useRef<THREE.Mesh>(null);
  const dataPulseRef = useRef<THREE.Mesh>(null);

  const soilTexture = useMemo(() => getSoilCutawayTexture(), []);
  const { map: metalMap, roughness: metalRough } = useMemo(() => getBrushedMetalTexture(), []);

  // Underground scene visibility / fade
  // Most visible between stage 2.5 and stage 4.5 (progress 0.25 to 0.48)
  const isVisible = scrollProgress >= 0.20 && scrollProgress <= 0.55;

  // Pulse shader material for flowing potable water in pipeline
  const waterFlowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#06b6d4") },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          // Flowing rhythmic water pulses
          float pulse = sin((vUv.x * 24.0) - (uTime * 6.0)) * 0.5 + 0.5;
          float pulse2 = sin((vUv.x * 48.0) - (uTime * 12.0)) * 0.25 + 0.25;
          float intensity = pow(pulse + pulse2, 2.5);
          gl_FragColor = vec4(uColor * (1.2 + intensity * 2.0), 0.85);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // Energy pulse material for high-voltage power cables
  const powerPulseMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#f59e0b") },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          float pulse = sin((vUv.x * 32.0) - (uTime * 8.0));
          pulse = smoothstep(0.7, 1.0, pulse);
          gl_FragColor = vec4(uColor * (1.5 + pulse * 4.0), pulse * 0.9);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((_, delta) => {
    if (waterFlowMaterial) {
      waterFlowMaterial.uniforms.uTime.value += delta;
    }
    if (powerPulseMaterial) {
      powerPulseMaterial.uniforms.uTime.value += delta;
    }
  });

  if (!isVisible) return null;

  return (
    <group position={[8, 0, 0]}>
      {/* 1. Geological Soil Cutaway Trench Walls */}
      {/* East Trench Wall */}
      <mesh position={[12, -6, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[70, 14]} />
        <meshStandardMaterial
          map={soilTexture}
          roughness={0.95}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* West Trench Wall */}
      <mesh position={[-4, -6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[70, 14]} />
        <meshStandardMaterial
          map={soilTexture}
          roughness={0.95}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Trench Bedrock Floor */}
      <mesh position={[4, -13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 70]} />
        <meshStandardMaterial color="#121315" roughness={0.9} />
      </mesh>

      {/* 2. Structural Steel Shoring I-Beams bracing trench */}
      {[-24, -12, 0, 12, 24].map((z) => (
        <group key={z} position={[4, -1.8, z]}>
          <mesh>
            <boxGeometry args={[16.2, 0.5, 0.5]} />
            <meshStandardMaterial color="#8a5a36" roughness={0.8} metalness={0.3} />
          </mesh>
          <mesh position={[-7.8, -4.5, 0]}>
            <boxGeometry args={[0.5, 9, 0.5]} />
            <meshStandardMaterial color="#4a403a" roughness={0.7} metalness={0.4} />
          </mesh>
          <mesh position={[7.8, -4.5, 0]}>
            <boxGeometry args={[0.5, 9, 0.5]} />
            <meshStandardMaterial color="#4a403a" roughness={0.7} metalness={0.4} />
          </mesh>
        </group>
      ))}

      {/* 3. High-Pressure Main Water Pipeline (PIPE1) */}
      <group position={[2, -6.5, 0]}>
        {/* Main Ductile Steel Pipe Body */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.85, 0.85, 70, 32]} />
          <meshStandardMaterial
            color="#2a3542"
            metalnessMap={metalMap}
            roughnessMap={metalRough}
            metalness={0.85}
            roughness={0.3}
          />
        </mesh>

        {/* Inner Glowing Animated Water Flow Pulse */}
        <mesh ref={waterFlowRef} rotation={[Math.PI / 2, 0, 0]} material={waterFlowMaterial}>
          <cylinderGeometry args={[0.87, 0.87, 70, 24]} />
        </mesh>

        {/* Flanged Bolted Joint Rings */}
        {[-30, -20, -10, 0, 10, 20, 30].map((fz) => (
          <group key={fz} position={[0, 0, fz]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[1.05, 1.05, 0.35, 24]} />
              <meshStandardMaterial color="#1f2730" metalness={0.9} roughness={0.35} />
            </mesh>
          </group>
        ))}

        {/* Industrial Isolation Gate Valve */}
        <group position={[0, 0, -4]}>
          {/* Valve Bonnet & Yoke */}
          <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[1.4, 1.4, 0.9]} />
            <meshStandardMaterial color="#8b2626" roughness={0.5} metalness={0.5} />
          </mesh>
          {/* Valve Stem */}
          <mesh position={[0, 2.1, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.2, 12]} />
            <meshStandardMaterial color="#d4af37" metalness={0.95} roughness={0.2} />
          </mesh>
          {/* Cast Iron Red Handwheel */}
          <mesh position={[0, 2.7, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.65, 0.09, 12, 24]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.4} metalness={0.6} />
          </mesh>
        </group>
      </group>

      {/* 4. 132kV Primary High-Voltage Feeder Conduit */}
      <group position={[6, -4.5, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 70, 20]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.7} metalness={0.2} />
        </mesh>
        {/* Animated amber electrical conduction pulse */}
        <mesh ref={powerPulseRef} rotation={[Math.PI / 2, 0, 0]} material={powerPulseMaterial}>
          <cylinderGeometry args={[0.32, 0.32, 70, 16]} />
        </mesh>

        {/* Heavy brass electrical junction boxes */}
        {[-16, 8].map((jz) => (
          <mesh key={jz} position={[0, 0, jz]}>
            <boxGeometry args={[0.9, 0.9, 1.1]} />
            <meshStandardMaterial color="#a07d35" metalness={0.8} roughness={0.35} />
          </mesh>
        ))}
      </group>

      {/* 5. Telecom Fiber-Optic Conduit Trunk */}
      <group position={[6, -8.2, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 70, 16]} />
          <meshStandardMaterial color="#ea580c" roughness={0.5} />
        </mesh>
      </group>

      {/* 6. Concrete Gravity Sewer & Drainage Main */}
      <group position={[-1, -10.5, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.4, 1.4, 70, 24]} />
          <meshStandardMaterial color="#32373d" roughness={0.9} />
        </mesh>
        {/* Reinforced concrete pipe segment rib joints */}
        {[-25, -12, 0, 12, 25].map((rz) => (
          <mesh key={rz} position={[0, 0, rz]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.5, 1.5, 0.5, 20]} />
            <meshStandardMaterial color="#262a2e" roughness={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
