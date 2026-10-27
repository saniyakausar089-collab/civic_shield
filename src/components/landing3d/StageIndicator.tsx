import React from "react";
import { SCROLL_STAGES } from "./stagesData";

interface StageIndicatorProps {
  currentStage: number;
  onSelectStage: (stage: number) => void;
}

export const StageIndicator: React.FC<StageIndicatorProps> = ({
  currentStage,
  onSelectStage,
}) => {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-3 select-none pointer-events-auto">
      {SCROLL_STAGES.map((s) => {
        const isActive = s.index === currentStage;
        return (
          <button
            key={s.index}
            onClick={() => onSelectStage(s.index)}
            className="group flex items-center gap-3 py-1 cursor-pointer focus:outline-none"
            title={s.headline}
          >
            {/* Stage label tooltip on hover */}
            <span
              className={`text-[10px] font-mono tracking-widest uppercase transition-all duration-300 opacity-0 group-hover:opacity-100 ${
                isActive ? "text-cyan-400 font-semibold" : "text-slate-400"
              }`}
            >
              {s.badge.split("//")[0]?.trim()}
            </span>

            {/* Indicator pip */}
            <div
              className={`transition-all duration-300 rounded-full ${
                isActive
                  ? "w-2.5 h-6 bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                  : "w-1.5 h-1.5 bg-slate-600 hover:bg-slate-400"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
