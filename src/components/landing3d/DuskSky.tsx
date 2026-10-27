import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * Cinematic dusk sky dome and ambient lighting at blue hour.
 */
export const DuskSky: React.FC = () => {
  const skyMaterial = useMemo(() => {
    // Custom gradient shader for a physically-toned dusk sky
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec3 point = normalize(vWorldPosition);
        float h = max(0.0, point.y);

        // Dusk blue-hour color progression:
        // Deep indigo zenith -> Muted steel blue -> Warm dusty twilight horizon
        vec3 zenithColor = vec3(0.03, 0.06, 0.12);
        vec3 midColor = vec3(0.08, 0.14, 0.22);
        vec3 horizonColor = vec3(0.18, 0.16, 0.18);
        vec3 sunsetGlow = vec3(0.32, 0.20, 0.14);

        vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.35, h));
        col = mix(col, zenithColor, smoothstep(0.35, 1.0, h));

        // Subtle horizon sunset glow in west
        float sunAngle = dot(point, normalize(vec3(-0.8, 0.1, -0.6)));
        if (sunAngle > 0.0) {
          col += sunsetGlow * pow(sunAngle, 6.0) * (1.0 - h * 1.5) * 0.45;
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, []);

  return (
    <>
      {/* Sky Sphere */}
      <mesh material={skyMaterial}>
        <sphereGeometry args={[800, 32, 24]} />
      </mesh>

      {/* Lighting for realistic architectural PBR */}
      {/* Soft directional dusk keylight casting gentle shadows from horizon */}
      <directionalLight
        position={[-120, 60, -90]}
        intensity={1.4}
        color="#f0d5b8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={10}
        shadow-camera-far={600}
        shadow-camera-left={-160}
        shadow-camera-right={160}
        shadow-camera-top={160}
        shadow-camera-bottom={-160}
        shadow-bias={-0.0005}
      />

      {/* Cool blue skylight fill */}
      <directionalLight position={[90, 100, 120]} intensity={0.6} color="#4a709c" />

      {/* Atmospheric ambient ground reflection */}
      <ambientLight intensity={0.35} color="#152438" />

      {/* Atmospheric blue hour fog */}
      <fogExp2 attach="fog" args={["#0c1522", 0.0035]} />
    </>
  );
};
