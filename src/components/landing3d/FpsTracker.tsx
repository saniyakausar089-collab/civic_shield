import React, { useState } from "react";
import { useFrame } from "@react-three/fiber";

interface FpsTrackerProps {
  onFpsUpdate?: (fps: number) => void;
}

export const FpsTracker: React.FC<FpsTrackerProps> = ({ onFpsUpdate }) => {
  const frames = React.useRef(0);
  const lastTime = React.useRef(performance.now());

  useFrame(() => {
    frames.current++;
    const now = performance.now();
    if (now - lastTime.current >= 1000) {
      const currentFps = Math.round((frames.current * 1000) / (now - lastTime.current));
      onFpsUpdate?.(currentFps);
      frames.current = 0;
      lastTime.current = now;
    }
  });

  return null;
};
