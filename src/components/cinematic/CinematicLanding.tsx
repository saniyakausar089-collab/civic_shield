import React, { useState, useEffect, useRef, useMemo, lazy, Suspense, useCallback } from "react";
import Lenis from "lenis";
import { Link } from "@tanstack/react-router";
import { Shield, Eye, Lock, ArrowRight, Radio } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CHAPTERS } from "./types";
import { StepNavigator } from "./StepNavigator";
import { MediaSlot } from "./MediaSlot";
import { CINEMATIC_THEME } from "./theme";

// Lazy-load heavy Cesium globe so initial page load stays fast
const CesiumGlobe = lazy(() =>
  import("./CesiumGlobe").then((m) => ({ default: m.CesiumGlobe }))
);

// Chapter components
import { Chapter1Flyover } from "./chapters/Chapter1Flyover";
import { Chapter2PipeBurst } from "./chapters/Chapter2PipeBurst";
import { Chapter3ChainReaction } from "./chapters/Chapter3ChainReaction";
import { Chapter4PlanTriage } from "./chapters/Chapter4PlanTriage";
import { Chapter5AiReport } from "./chapters/Chapter5AiReport";
import { Chapter6CallToAction } from "./chapters/Chapter6CallToAction";

interface ClickShockwave {
  id: number;
  x: number;
  y: number;
}

export const CinematicLanding: React.FC = () => {
  const { isAuthenticated, profile } = useAuth();
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [smoothedProgress, setSmoothedProgress] = useState<number>(0);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const lenisRef = useRef<Lenis | null>(null);

  // Mouse spotlight state (max 120px subtle glow, desktop only)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });
  
  // Interactive click ripples (max 80px, no screen flash)
  const [shockwaves, setShockwaves] = useState<ClickShockwave[]>([]);
  
  // Soft 200ms vignette pulse at burst and hospital failure
  const [vignettePulse, setVignettePulse] = useState<"burst" | "hospital" | null>(null);

  const targetProgressRef = useRef<number>(0);
  const smoothedProgressRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) {
        setReducedMotion(true);
      }
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Initialize Lenis with damped smoothed progress
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.3,
    });
    lenisRef.current = lenis;

    let lastScrollY = window.scrollY;
    let cachedMaxScroll = document.documentElement.scrollHeight - window.innerHeight;

    const onScroll = () => {
      lastScrollY = window.scrollY;
      cachedMaxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = cachedMaxScroll > 0 ? Math.min(1, Math.max(0, lastScrollY / cachedMaxScroll)) : 0;
      targetProgressRef.current = progress;
      setScrollProgress(progress);
    };

    lenis.on("scroll", onScroll);

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);

      // Damp smoothed progress with lerp
      const target = targetProgressRef.current;
      const current = smoothedProgressRef.current;
      const diff = target - current;
      if (Math.abs(diff) > 0.0001) {
        smoothedProgressRef.current += diff * 0.1;
      } else {
        smoothedProgressRef.current = target;
      }
      setSmoothedProgress(smoothedProgressRef.current);

      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Active chapter index (0 to 5)
  const currentChapter = useMemo(() => {
    return Math.min(5, Math.floor(smoothedProgress * 6));
  }, [smoothedProgress]);

  // Relative progress within the chapter [0, 1]
  const chapterRelativeProgress = useMemo(() => {
    const start = currentChapter / 6;
    const end = (currentChapter + 1) / 6;
    return Math.min(1, Math.max(0, (smoothedProgress - start) / (end - start)));
  }, [smoothedProgress, currentChapter]);

  // Soft 200ms vignette pulse callbacks
  const handleBurstTrigger = useCallback(() => {
    if (reducedMotion) return;
    setVignettePulse("burst");
    setTimeout(() => setVignettePulse(null), 200);
  }, [reducedMotion]);

  const handleHospitalFail = useCallback(() => {
    if (reducedMotion) return;
    setVignettePulse("hospital");
    setTimeout(() => setVignettePulse(null), 200);
  }, [reducedMotion]);

  // Mouse move for small soft accent spotlight (desktop only, max 120px)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    setMousePos({ x: e.clientX, y: e.clientY });
  }, [isMobile]);

  // Small click ripple (max 80px, no screen flash)
  const handlePointerDown = useCallback((e: React.MouseEvent) => {
    if (reducedMotion) return;
    const newWave: ClickShockwave = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
    };
    setShockwaves((prev) => [...prev.slice(-1), newWave]);
    setTimeout(() => {
      setShockwaves((prev) => prev.filter((w) => w.id !== newWave.id));
    }, 400);
  }, [reducedMotion]);

  // Smooth jump to chapter
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

  // Editorial Opening Headline reveal calculation
  const openerOpacity = useMemo(() => {
    // Reveal between 0% and 40% of chapter progress, then fade out into corner card
    if (chapterRelativeProgress < 0.25) return chapterRelativeProgress / 0.25;
    if (chapterRelativeProgress < 0.55) return 1.0;
    return Math.max(0, 1.0 - (chapterRelativeProgress - 0.55) / 0.35);
  }, [chapterRelativeProgress]);

  const openerTranslateY = useMemo(() => {
    return (1.0 - openerOpacity) * 20;
  }, [openerOpacity]);

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseDown={handlePointerDown}
      className="relative w-full bg-[#060b09] text-white select-none overflow-x-hidden min-h-screen"
    >
      {/* 0. Small Soft Cursor Glow (max 120px, opacity <= 0.12, desktop only) */}
      {!isMobile && mousePos.x > 0 && (
        <div
          className="pointer-events-none fixed inset-0 z-10 transition-opacity duration-300"
          style={{
            background: `radial-gradient(120px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 209, 160, 0.11), transparent 75%)`,
          }}
        />
      )}

      {/* 0. Soft 200ms Vignette Pulse (burst or hospital failure) */}
      {vignettePulse && !reducedMotion && (
        <div
          className={`pointer-events-none fixed inset-0 z-50 transition-opacity duration-200 ${
            vignettePulse === "burst"
              ? "bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(255,45,85,0.22)_100%)]"
              : "bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(255,176,32,0.22)_100%)]"
          }`}
        />
      )}

      {/* 0. Small Pointer Ripple (max 80px, no flash) */}
      {shockwaves.map((w) => (
        <span
          key={w.id}
          className="pointer-events-none fixed z-50 rounded-full border border-[#00d1a0]/50 animate-ping"
          style={{
            left: w.x - 20,
            top: w.y - 20,
            width: 40,
            height: 40,
            maxWidth: 80,
            maxHeight: 80,
            boxShadow: "0 0 12px rgba(0, 209, 160, 0.4)",
          }}
        />
      ))}

      {/* 0. Subtle Film Grain (Desktop only) */}
      {!isMobile && !reducedMotion && (
        <div
          className="pointer-events-none fixed inset-0 z-20 opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* 1. Fixed Top HUD Header */}
      <header className="fixed top-0 left-0 right-0 z-40 p-3 sm:p-5 flex flex-col gap-2 pointer-events-none bg-gradient-to-b from-[#060b09]/90 via-[#060b09]/40 to-transparent backdrop-blur-[2px]">
        <div className="flex items-center justify-between w-full">
          {/* Logo & City Twin Tag */}
          <div className="flex items-center gap-2.5 pointer-events-auto">
            <div className="w-8 h-8 rounded-xl bg-[#00d1a0]/10 border border-[#00d1a0]/30 flex items-center justify-center backdrop-blur-md shadow-[0_0_15px_rgba(0,209,160,0.2)]">
              <Shield className="w-4 h-4 text-[#00d1a0]" />
            </div>
            <div>
              <span className="text-sm font-bold font-mono tracking-wider text-white">
                CIVIC<span className="bg-gradient-to-r from-[#00d1a0] to-[#2dffb3] bg-clip-text text-transparent">SHIELD</span>
              </span>
              <span className="hidden sm:inline-block ml-2.5 px-2 py-0.5 text-[9px] font-mono uppercase rounded bg-white/5 border border-white/10 text-slate-400">
                Hyderabad Geospatial Twin
              </span>
            </div>
          </div>

          {/* Right Header Badges & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
            {/* Live Simulation Pulse Tag */}
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00d1a0]/10 border border-[#00d1a0]/30 text-[#00d1a0] font-mono text-[10px] tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2dffb3] animate-pulse shadow-[0_0_6px_#2dffb3]" />
              <span>LIVE SIMULATION</span>
            </div>

            {/* Reduced motion toggle */}
            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono transition-colors hidden sm:flex items-center gap-1.5 cursor-pointer ${
                reducedMotion
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
              }`}
              title="Toggle between smooth camera flight and still frames"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{reducedMotion ? "Motion: Reduced" : "Motion: Fluid"}</span>
            </button>

            {/* Operator Login / Status Link */}
            {isAuthenticated ? (
              <Link
                to="/simulator"
                className="px-3 py-1.5 rounded-xl bg-[#00d1a0]/15 hover:bg-[#00d1a0]/25 border border-[#00d1a0]/30 text-[#2dffb3] font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#2dffb3] animate-pulse" />
                <span className="hidden sm:inline">
                  {profile?.role?.replace("_", " ") || "Operator Active"}
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl bg-[#00d1a0]/10 hover:bg-[#00d1a0]/20 border border-[#00d1a0]/30 text-[#00d1a0] font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Operator</span>
              </Link>
            )}

            {/* Quick Launch Simulator Button */}
            <Link
              to="/simulator"
              className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00d1a0] to-[#2dffb3] text-[#030605] font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,209,160,0.3)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Launch Twin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Status Ticker Strip */}
        <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-white/5 pt-1">
          <div className="flex items-center gap-2 truncate">
            <Radio className="w-3 h-3 text-[#00d1a0] animate-pulse shrink-0" />
            <span className="text-slate-300 truncate">
              {CHAPTERS[currentChapter]?.ticker || "HYD-GRID: 50.0 Hz NOMINAL • RES: 410 ML/d STABLE • EMS READY"}
            </span>
          </div>
          <span className="hidden sm:inline-block text-[9px] uppercase tracking-wider text-slate-500 shrink-0">
            SEC-SEC-01 // REALTIME
          </span>
        </div>
      </header>

      {/* 2. Full-bleed Cesium Viewport & Media Overlays */}
      <div className="fixed inset-0 z-0 w-full h-full pointer-events-none">
        {mounted && (
          <Suspense
            fallback={
              <div className="w-full h-full bg-[#060b09] flex items-center justify-center text-[#00d1a0] font-mono text-xs">
                Initializing Cesium 3D Globe...
              </div>
            }
          >
            <CesiumGlobe
              chapter={currentChapter}
              scrollProgress={smoothedProgress}
              reducedMotion={reducedMotion}
              onBurstTrigger={handleBurstTrigger}
              onHospitalFail={handleHospitalFail}
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

      {/* 3. Editorial Chapter Opening Headline (Center overlay revealing on scroll) */}
      <div
        className="fixed inset-0 z-20 pointer-events-none flex flex-col items-center justify-center text-center px-4 transition-all duration-300"
        style={{
          opacity: openerOpacity,
          transform: `translate3d(0, ${openerTranslateY}px, 0)`,
        }}
      >
        <div className="max-w-2xl">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#00d1a0] block mb-2">
            CHAPTER {CHAPTERS[currentChapter]?.id} // {CHAPTERS[currentChapter]?.subtitle}
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-display leading-[1.05] drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)]">
            {CHAPTERS[currentChapter]?.title}
          </h1>
        </div>
      </div>

      {/* 4. Compact Bottom-Left Glass Cards Container (>=60% clear open map) */}
      <div className="fixed bottom-20 left-4 sm:left-8 z-30 max-w-[390px] w-[calc(100vw-32px)] sm:w-[390px] max-h-[35vh] sm:max-h-none overflow-y-auto pointer-events-auto">
        {currentChapter === 0 && <Chapter1Flyover />}
        {currentChapter === 1 && <Chapter2PipeBurst />}
        {currentChapter === 2 && <Chapter3ChainReaction progress={chapterRelativeProgress} />}
        {currentChapter === 3 && <Chapter4PlanTriage />}
        {currentChapter === 4 && <Chapter5AiReport progress={chapterRelativeProgress} />}
        {currentChapter === 5 && <Chapter6CallToAction reducedMotion={reducedMotion} />}
      </div>

      {/* 5. Scroll Track Triggers (6 sections driving scrollProgress smoothly) */}
      <main className="relative z-10 w-full pointer-events-none">
        {CHAPTERS.map((ch) => (
          <section
            key={ch.id}
            aria-label={ch.title}
            className="min-h-[190vh] sm:min-h-[210vh]"
          />
        ))}
      </main>

      {/* 6. Fixed Step Navigator at Bottom */}
      <StepNavigator
        currentChapter={currentChapter}
        onSelectChapter={handleSelectChapter}
      />
    </div>
  );
};
