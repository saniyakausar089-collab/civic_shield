import React, { useState } from "react";

interface MediaSlotProps {
  mediaKey: "flood" | "blackout" | "ambulance";
  active: boolean;
  opacity?: number;
}

export const MediaSlot: React.FC<MediaSlotProps> = ({ mediaKey, active, opacity = 0.22 }) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // Gradient themes matching dark bioluminescent jungle aesthetic
  const fallbackGradients = {
    flood: "radial-gradient(circle at 60% 50%, rgba(0, 209, 160, 0.18) 0%, rgba(6, 11, 9, 0.92) 75%)",
    blackout: "radial-gradient(circle at 40% 60%, rgba(255, 45, 85, 0.22) 0%, rgba(6, 11, 9, 0.95) 75%)",
    ambulance: "radial-gradient(circle at 50% 50%, rgba(255, 176, 32, 0.18) 0%, rgba(6, 11, 9, 0.92) 70%)",
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

      {/* 3. Deep green-teal color wash overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: fallbackGradients[mediaKey],
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
};
