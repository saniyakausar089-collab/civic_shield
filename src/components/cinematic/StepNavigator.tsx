import React from "react";
import { CHAPTERS } from "./types";

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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[92vw] px-2 py-1.5 sm:px-3 sm:py-2 rounded-full bg-[#101418]/85 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/80 flex items-center gap-1.5 sm:gap-2 select-none"
    >
      {CHAPTERS.map((ch, idx) => {
        const isActive = currentChapter === idx;
        const isPast = currentChapter > idx;

        return (
          <button
            key={ch.id}
            onClick={() => onSelectChapter(idx)}
            className={`group relative flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full transition-all duration-300 text-xs font-mono cursor-pointer ${
              isActive
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                : isPast
                  ? "text-slate-400 hover:text-white hover:bg-white/5"
                  : "text-slate-600 hover:text-slate-300 hover:bg-white/5"
            }`}
            title={`${ch.shortLabel}: ${ch.title}`}
          >
            {/* Step indicator dot */}
            <span
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isActive
                  ? "bg-cyan-400 scale-125 shadow-[0_0_8px_#22d3ee]"
                  : isPast
                    ? "bg-slate-400"
                    : "bg-slate-700 group-hover:bg-slate-500"
              }`}
            />

            {/* Label - visible on larger screens, active on smaller */}
            <span
              className={`text-[11px] font-medium tracking-tight whitespace-nowrap transition-all ${
                isActive
                  ? "inline-block text-cyan-200 font-semibold"
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
