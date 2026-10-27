import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { sampleCameraTrajectory } from "./cameraPath";

interface CameraControllerProps {
  scrollProgress: number;
  reducedMotion?: boolean;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  scrollProgress,
  reducedMotion = false,
}) => {
  const { camera } = useThree();
  const currentPos = useRef(new THREE.Vector3(0, 190, 240));
  const currentLookAt = useRef(new THREE.Vector3(0, 12, 0));
  const mouseOffset = useRef({ x: 0, y: 0 });

  // Handle subtle mouse parallax
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseOffset.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseOffset.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  useFrame((state, delta) => {
    // If reduced motion is requested, use clamped discrete stages
    const targetProgress = reducedMotion
      ? Math.round(scrollProgress * 9) / 9
      : scrollProgress;

    const { pos: targetPos, lookAt: targetLookAt } = sampleCameraTrajectory(targetProgress);

    // Subtle handheld camera micro-drift (cinematic documentary feel)
    const time = state.clock.getElapsedTime();
    const driftIntensity = targetProgress > 0.15 && targetProgress < 0.75 ? 0.22 : 0.08;
    const driftX = Math.sin(time * 0.85) * driftIntensity + mouseOffset.current.x * 0.5;
    const driftY = Math.cos(time * 0.72) * (driftIntensity * 0.6) - mouseOffset.current.y * 0.3;
    const driftZ = Math.sin(time * 0.61 + 1.2) * (driftIntensity * 0.5);

    const effectiveTargetPos = new THREE.Vector3(
      targetPos.x + driftX,
      targetPos.y + driftY,
      targetPos.z + driftZ
    );

    // Damped interpolation using MathUtils.damp for silky smooth lag-free response
    const dampSpeed = reducedMotion ? 12 : 3.5;
    currentPos.current.x = THREE.MathUtils.damp(currentPos.current.x, effectiveTargetPos.x, dampSpeed, delta);
    currentPos.current.y = THREE.MathUtils.damp(currentPos.current.y, effectiveTargetPos.y, dampSpeed, delta);
    currentPos.current.z = THREE.MathUtils.damp(currentPos.current.z, effectiveTargetPos.z, dampSpeed, delta);

    currentLookAt.current.x = THREE.MathUtils.damp(currentLookAt.current.x, targetLookAt.x, dampSpeed, delta);
    currentLookAt.current.y = THREE.MathUtils.damp(currentLookAt.current.y, targetLookAt.y, dampSpeed, delta);
    currentLookAt.current.z = THREE.MathUtils.damp(currentLookAt.current.z, targetLookAt.z, dampSpeed, delta);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};
