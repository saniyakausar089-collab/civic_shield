import React from "react";
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  Noise,
} from "@react-three/postprocessing";
import * as THREE from "three";

interface PostProcessingEffectsProps {
  enabled?: boolean;
  lowQuality?: boolean;
}

export const PostProcessingEffects: React.FC<PostProcessingEffectsProps> = ({
  enabled = true,
  lowQuality = false,
}) => {
  if (!enabled) return null;

  // On low quality devices, render only subtle bloom or bypass heavy passes
  if (lowQuality) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={0.88}
          luminanceSmoothing={0.25}
          intensity={0.35}
        />
        <Vignette eskil={false} offset={0.3} darkness={0.55} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={2}>
      {/* 1. Subtle bloom on emissives only (lit windows, beacons, neon water/power lines) */}
      <Bloom
        luminanceThreshold={0.82}
        luminanceSmoothing={0.3}
        intensity={0.45}
        kernelSize={3}
      />

      {/* 2. Light cinematic vignette */}
      <Vignette eskil={false} offset={0.28} darkness={0.6} />

      {/* 3. Very subtle lens chromatic aberration */}
      <ChromaticAberration
        offset={new THREE.Vector2(0.0006, 0.0006)}
        radialModulation={true}
        modulationOffset={0.5}
      />

      {/* 4. Film grain for documentary realism */}
      <Noise opacity={0.022} />
    </EffectComposer>
  );
};
