import React, { useState } from "react";

interface MediaSlotProps {
  mediaKey: "flood" | "blackout" | "ambulance";
  active: boolean;
  opacity?: number;
}

export const MediaSlot: React.FC<MediaSlotProps> = ({ mediaKey, active, opacity = 0.28 }) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // Gradient themes matching context
  const fallbackGradients = {
    flood: "radial-gradient(circle at 60% 50%, rgba(20, 60, 90, 0.45) 0%, rgba(10, 15, 22, 0.85) 75%)",
    blackout: "radial-gradient(circle at 40% 60%, rgba(80, 20, 20, 0.45) 0%, rgba(5, 7, 10, 0.95) 75%)",
    ambulance: "radial-gradient(circle at 50% 50%, rgba(90, 20, 40, 0.4) 0%, rgba(10, 15, 22, 0.9) 70%)",
  };

  if (!active) return null;

  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000 ease-in-out overflow-hidden"
      style={{ opacity }}
    >
      {/* 1. Try video first */}
      {!videoFailed ? (
        <video
          key={mediaKey}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoFailed(true)}
          className="w-full h-full object-cover filter contrast-125 brightness-75 scale-105"
        >
          <source src={`/media/${mediaKey}.mp4`} type="video/mp4" />
        </video>
      ) : !imageFailed ? (
        /* 2. Fall back to static picture */
        <img
          src={`/media/${mediaKey}.jpg`}
          alt=""
          onError={() => setImageFailed(true)}
          className="w-full h-full object-cover filter contrast-125 brightness-70 scale-105"
        />
      ) : null}

      {/* 3. Subtle noise and atmospheric color tint */}
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{ background: fallbackGradients[mediaKey] }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-transparent to-[#0a0f16]/80" />
    </div>
  );
};
