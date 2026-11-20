import React, { useState } from "react";

interface MediaSlotProps {
  mediaKey: "flood" | "blackout" | "ambulance";
  active: boolean;
  opacity?: number;
}

export const MediaSlot: React.FC<MediaSlotProps> = ({ mediaKey, active, opacity = 0.25 }) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // Gradient themes matching context (deep violet-black & hot crimson/amber accents)
  const fallbackGradients = {
    flood: "radial-gradient(circle at 60% 50%, rgba(192, 38, 211, 0.22) 0%, rgba(10, 6, 18, 0.9) 75%)",
    blackout: "radial-gradient(circle at 40% 60%, rgba(255, 45, 85, 0.25) 0%, rgba(10, 6, 18, 0.95) 75%)",
    ambulance: "radial-gradient(circle at 50% 50%, rgba(255, 176, 32, 0.22) 0%, rgba(10, 6, 18, 0.9) 70%)",
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
          className="w-full h-full object-cover filter contrast-125 brightness-70 scale-105"
        >
          <source src={`/media/${mediaKey}.mp4`} type="video/mp4" />
        </video>
      ) : !imageFailed ? (
        /* 2. Fall back to static picture */
        <img
          src={`/media/${mediaKey}.jpg`}
          alt=""
          onError={() => setImageFailed(true)}
          className="w-full h-full object-cover filter contrast-125 brightness-65 scale-105"
        />
      ) : null}

      {/* 3. Deep violet-black color wash */}
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{ background: fallbackGradients[mediaKey] }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0612] via-transparent to-[#0a0612]/80" />
    </div>
  );
};
