import React from "react";
import { CHAPTERS } from "./types";
import { CINEMATIC_THEME } from "./theme";

interface StepNavigatorProps {
  currentChapter: number;
  onSelectChapter: (chapterIndex: number) => void;
}

export const StepNavigator: React.FC<StepNavigatorProps> = ({
  currentChapter,
  onSelectChapter,
}) => {
  return (
    <nav
      aria-label="Story Chapters Navigator"
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[94vw] px-2 py-1.5 sm:px-3 sm:py-2 rounded-full bg-[#060b09]/90 backdrop-blur-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.85),0_0_20px_rgba(0,209,160,0.12)] flex items-center gap-1 sm:gap-2 select-none"
    >
      {CHAPTERS.map((ch, idx) => {
        const isActive = currentChapter === idx;
        const isPast = currentChapter > idx;

        return (
          <button
            key={ch.id}
            onClick={() => onSelectChapter(idx)}
            className={`group relative overflow-hidden flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full transition-all duration-300 text-xs font-mono cursor-pointer active:scale-95 ${
              isActive
                ? "bg-gradient-to-r from-[#00d1a0]/25 to-[#2dffb3]/25 text-[#2dffb3] border border-[#00d1a0]/60 shadow-[0_0_15px_rgba(0,209,160,0.3)] -translate-y-0.5"
                : isPast
                  ? "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 hover:-translate-y-0.5"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent hover:border-white/10 hover:-translate-y-0.5"
            }`}
            title={`${ch.shortLabel}: ${ch.title}`}
          >
            {/* Quick 300ms shimmer sweep on hover */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-300 bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {/* Step indicator dot */}
            <span
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isActive
                  ? "bg-[#2dffb3] scale-125 shadow-[0_0_10px_#2dffb3]"
                  : isPast
                    ? "bg-[#00d1a0]/70 shadow-[0_0_6px_rgba(0,209,160,0.4)]"
                    : "bg-slate-700 group-hover:bg-slate-500"
              }`}
            />

            {/* Label - visible on larger screens, active on smaller */}
            <span
              className={`text-[11px] font-medium tracking-tight whitespace-nowrap transition-all ${
                isActive
                  ? "inline-block text-[#2dffb3] font-semibold"
                  : "hidden md:inline-block"
              }`}
            >
              {ch.shortLabel}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
