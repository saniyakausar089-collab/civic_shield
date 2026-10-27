import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * Atmospheric mist and low-hanging valley cloud layers.
 * Punched through during Stage 2 street descent.
 */
export const AtmosphericClouds: React.FC = () => {
  const cloudMaterial = useMemo(() => {
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      void main() {
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `;

    const fragmentShader = `
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      void main() {
        // Soft circular radial fade
        float dist = distance(vUv, vec2(0.5));
        float alpha = smoothstep(0.5, 0.1, dist);

        // Dusk blue-tinted haze
        vec3 hazeColor = vec3(0.08, 0.13, 0.20);
        gl_FragColor = vec4(hazeColor, alpha * 0.45);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
    });
  }, []);

  return (
    <group position={[15, 35, 45]}>
      {/* Cloud layer 1 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={cloudMaterial}>
        <planeGeometry args={[140, 140]} />
      </mesh>
      {/* Cloud layer 2 (higher, offset) */}
      <mesh position={[-15, 20, -10]} rotation={[-Math.PI / 2, 0, 0.4]} material={cloudMaterial}>
        <planeGeometry args={[160, 160]} />
      </mesh>
      {/* Cloud layer 3 (lower valley mist over river) */}
      <mesh position={[-5, -15, -45]} rotation={[-Math.PI / 2, 0, -0.2]} material={cloudMaterial}>
        <planeGeometry args={[120, 80]} />
      </mesh>
    </group>
  );
};
