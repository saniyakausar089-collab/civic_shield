import * as THREE from "three";

/**
 * Camera spline trajectory and LookAt target spline.
 * Interpolated smoothly using CatmullRomCurve3 for a continuous cinematic flight.
 */

// Camera position spline waypoints
export const CAMERA_WAYPOINTS = [
  new THREE.Vector3(0, 190, 240),     // Stage 0: Title / High dusk orbit
  new THREE.Vector3(45, 140, 190),    // Stage 1: Sky view & network overlay
  new THREE.Vector3(14, 10, 48),      // Stage 2: Descent down to neighborhood street level
  new THREE.Vector3(8, -6.5, 14),     // Stage 3: Underground cutaway slice (pipes & cables)
  new THREE.Vector3(-14, 1.5, -12),   // Stage 4: Substations & pump station
  new THREE.Vector3(26, 15, -24),     // Stage 5: Hospital cutaway & generator room
  new THREE.Vector3(42, 28, -62),     // Stage 6: Schools, shelters & telecom tower
  new THREE.Vector3(2, 14, -14),      // Stage 7: Pipeline rupture & cascading blackout
  new THREE.Vector3(-28, 95, 135),    // Stage 8: Pull back to sky, city re-lighting
  new THREE.Vector3(0, 130, 200),     // Stage 9: Final city night vista with CTA
];

// Camera look-at target waypoints
export const LOOKAT_WAYPOINTS = [
  new THREE.Vector3(0, 12, 0),        // Stage 0: Center of metropolitan skyline
  new THREE.Vector3(10, 8, -10),      // Stage 1: Dependency network hubs
  new THREE.Vector3(12, 6, 2),        // Stage 2: Street intersection
  new THREE.Vector3(8, -7.5, -20),    // Stage 3: Subterranean infrastructure corridor
  new THREE.Vector3(-20, 2, -26),     // Stage 4: Transformer yard & pumps
  new THREE.Vector3(34, 16, -46),     // Stage 5: Medical center interior
  new THREE.Vector3(44, 32, -88),     // Stage 6: Telecom mast beacon
  new THREE.Vector3(2, 1, -22),       // Stage 7: Ruptured pipeline fault epicenter
  new THREE.Vector3(0, 8, -12),       // Stage 8: Restored power grid
  new THREE.Vector3(0, 10, -5),       // Stage 9: Metropolis night panorama
];

export const cameraPositionCurve = new THREE.CatmullRomCurve3(CAMERA_WAYPOINTS, false, "catmullrom", 0.5);
export const cameraLookAtCurve = new THREE.CatmullRomCurve3(LOOKAT_WAYPOINTS, false, "catmullrom", 0.5);

export function sampleCameraTrajectory(progress: number) {
  const t = Math.max(0, Math.min(1, progress));
  const pos = cameraPositionCurve.getPointAt(t);
  const lookAt = cameraLookAtCurve.getPointAt(t);
  return { pos, lookAt };
}
