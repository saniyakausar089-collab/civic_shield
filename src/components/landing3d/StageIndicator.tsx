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
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-2 select-none pointer-events-auto">
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
              className={`text-[12px] font-medium transition-all duration-200 opacity-0 group-hover:opacity-100 px-2.5 py-1 rounded-md bg-white/95 dark:bg-[#111318]/95 border border-[#E5E7EB] dark:border-[#27272A] shadow-sm ${
                isActive
                  ? "text-[#2563EB] dark:text-[#3B82F6] font-semibold"
                  : "text-[#475569] dark:text-[#A1A1AA]"
              }`}
            >
              {s.badge.split("//")[0]?.trim()}
            </span>

            {/* Indicator pip */}
            <div
              className={`transition-all duration-300 rounded-full ${
                isActive
                  ? "w-2 h-7 bg-[#2563EB] dark:bg-[#3B82F6] shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                  : "w-2 h-2 bg-[#CBD5E1] dark:bg-[#3F3F46] group-hover:bg-[#94A3B8] dark:group-hover:bg-[#71717A]"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
