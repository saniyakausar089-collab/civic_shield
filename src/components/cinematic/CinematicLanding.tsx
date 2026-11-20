import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import Lenis from "lenis";
import { Link } from "@tanstack/react-router";
import { Shield, Eye, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CHAPTERS } from "./types";
import { StepNavigator } from "./StepNavigator";
import { MediaSlot } from "./MediaSlot";

// Lazy-load heavy Cesium globe so initial page load stays fast
const CesiumGlobe = lazy(() =>
  import("./CesiumGlobe").then((m) => ({ default: m.CesiumGlobe }))
);

// Lazy-load chapter components
import { Chapter1Flyover } from "./chapters/Chapter1Flyover";
import { Chapter2PipeBurst } from "./chapters/Chapter2PipeBurst";
import { Chapter3ChainReaction } from "./chapters/Chapter3ChainReaction";
import { Chapter4PlanTriage } from "./chapters/Chapter4PlanTriage";
import { Chapter5AiReport } from "./chapters/Chapter5AiReport";
import { Chapter6CallToAction } from "./chapters/Chapter6CallToAction";

export const CinematicLanding: React.FC = () => {
  const { isAuthenticated, profile } = useAuth();
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    setMounted(true);
    // Respect system prefers-reduced-motion
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) {
        setReducedMotion(true);
      }
    }
  }, []);

  // Initialize smooth scroll via Lenis
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.3,
    });
    lenisRef.current = lenis;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;
      setScrollProgress(progress);
    };

    lenis.on("scroll", onScroll);

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Compute active chapter index (0 to 5)
  const currentChapter = useMemo(() => {
    return Math.min(5, Math.floor(scrollProgress * 6));
  }, [scrollProgress]);

  // Compute relative progress within the current chapter [0, 1]
  const chapterRelativeProgress = useMemo(() => {
    const start = currentChapter / 6;
    const end = (currentChapter + 1) / 6;
    return Math.min(1, Math.max(0, (scrollProgress - start) / (end - start)));
  }, [scrollProgress, currentChapter]);

  // Jump to specific chapter smoothly
  const handleSelectChapter = (chapterIndex: number) => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = (chapterIndex / 5.5) * maxScroll;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(targetScroll, { duration: 1.4 });
    } else {
      window.scrollTo({ top: targetScroll, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full bg-[#0a0f16] text-white select-none overflow-x-hidden min-h-screen">
      {/* 1. Fixed Top HUD Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 sm:p-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="text-sm font-bold font-mono tracking-wider text-white">
              CIVIC<span className="text-cyan-400">SHIELD</span>
            </span>
            <span className="hidden sm:inline-block ml-3 px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-white/5 border border-white/10 text-slate-400">
              Hyderabad Geospatial Twin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Reduced motion toggle */}
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors hidden sm:flex items-center gap-1.5 cursor-pointer ${
              reducedMotion
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
            }`}
            title="Toggle between smooth camera flight and still frames"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{reducedMotion ? "Reduced Motion: ON" : "Motion: Fluid"}</span>
          </button>

          {/* Operator Login / Status Link */}
          {isAuthenticated ? (
            <Link
              to="/simulator"
              className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">
                {profile?.role?.replace("_", " ") || "Operator Active"}
              </span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Operator Login</span>
            </Link>
          )}

          {/* Quick Launch Simulator Button */}
          <Link
            to="/simulator"
            className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(34,211,238,0.35)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Launch Twin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* 2. Sticky Fullscreen Cesium Viewport & Media Overlays */}
      <div className="fixed inset-0 z-0 w-full h-full pointer-events-none">
        {mounted && (
          <Suspense
            fallback={
              <div className="w-full h-full bg-[#0a0f16] flex items-center justify-center text-cyan-400 font-mono text-xs">
                Initializing Cesium 3D Globe...
              </div>
            }
          >
            <CesiumGlobe
              chapter={currentChapter}
              scrollProgress={scrollProgress}
              reducedMotion={reducedMotion}
            />
          </Suspense>
        )}

        {/* Media Background Slots between chapters */}
        <MediaSlot
          mediaKey="flood"
          active={currentChapter === 1 || currentChapter === 2}
          opacity={currentChapter === 1 ? 0.22 : 0.15}
        />
        <MediaSlot
          mediaKey="blackout"
          active={currentChapter === 2 || currentChapter === 3}
          opacity={currentChapter === 2 ? 0.25 : 0.18}
        />
        <MediaSlot
          mediaKey="ambulance"
          active={currentChapter === 3 || currentChapter === 4}
          opacity={currentChapter === 3 ? 0.22 : 0.14}
        />
      </div>

      {/* 3. Scrollable Narrative Chapters (6 Tall Scroll Triggers) */}
      <main className="relative z-20 w-full">
        {/* Chapter 1: A City That Works */}
        <section className="relative min-h-[140vh] flex items-center justify-center">
          <Chapter1Flyover />
        </section>

        {/* Chapter 2: One Pipe Bursts */}
        <section className="relative min-h-[140vh] flex items-center justify-center">
          <Chapter2PipeBurst />
        </section>

        {/* Chapter 3: The Chain Reaction */}
        <section className="relative min-h-[160vh] flex items-center justify-center">
          <Chapter3ChainReaction progress={currentChapter === 2 ? chapterRelativeProgress : currentChapter > 2 ? 1 : 0} />
        </section>

        {/* Chapter 4: Test The Fix First */}
        <section className="relative min-h-[150vh] flex items-center justify-center">
          <Chapter4PlanTriage />
        </section>

        {/* Chapter 5: Incident Intelligence Report */}
        <section className="relative min-h-[150vh] flex items-center justify-center">
          <Chapter5AiReport progress={currentChapter === 4 ? chapterRelativeProgress : currentChapter > 4 ? 1 : 0} />
        </section>

        {/* Chapter 6: Final Call to Action */}
        <section className="relative min-h-[130vh] flex items-center justify-center pb-24">
          <Chapter6CallToAction />
        </section>
      </main>

      {/* 4. Fixed Step Navigator at Bottom */}
      <StepNavigator
        currentChapter={currentChapter}
        onSelectChapter={handleSelectChapter}
      />
    </div>
  );
};
