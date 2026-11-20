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

// Lazy-loaded or direct chapter components
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
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const lenisRef = useRef<Lenis | null>(null);

  // Mouse spotlight state
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });
  
  // Interactive click shockwaves and screen flash
  const [shockwaves, setShockwaves] = useState<ClickShockwave[]>([]);
  const [screenFlash, setScreenFlash] = useState<"white" | "crimson" | null>(null);
  const [uiShake, setUiShake] = useState<boolean>(false);

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

  // Trigger crimson screen flash when entering chapter 2 (index 1)
  const prevChapterRef = useRef<number>(0);
  useEffect(() => {
    if (currentChapter === 1 && prevChapterRef.current !== 1 && !reducedMotion) {
      setScreenFlash("crimson");
      setUiShake(true);
      const timer = setTimeout(() => {
        setScreenFlash(null);
        setUiShake(false);
      }, 150);
      return () => clearTimeout(timer);
    }
    prevChapterRef.current = currentChapter;
  }, [currentChapter, reducedMotion]);

  // Compute relative progress within the current chapter [0, 1]
  const chapterRelativeProgress = useMemo(() => {
    const start = currentChapter / 6;
    const end = (currentChapter + 1) / 6;
    return Math.min(1, Math.max(0, (scrollProgress - start) / (end - start)));
  }, [scrollProgress, currentChapter]);

  // Mouse move handler for accent spotlight (desktop only)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    setMousePos({ x: e.clientX, y: e.clientY });
  }, [isMobile]);

  // Click ripple / shockwave handler
  const handlePointerDown = useCallback((e: React.MouseEvent) => {
    if (reducedMotion) return;
    const newWave: ClickShockwave = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
    };
    setShockwaves((prev) => [...prev.slice(-2), newWave]);
    setTimeout(() => {
      setShockwaves((prev) => prev.filter((w) => w.id !== newWave.id));
    }, 500);

    // Subtle click flash
    setScreenFlash("white");
    setTimeout(() => setScreenFlash(null), 100);
  }, [reducedMotion]);

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
    <div
      onMouseMove={handleMouseMove}
      onMouseDown={handlePointerDown}
      className={`relative w-full bg-[#0a0612] text-white select-none overflow-x-hidden min-h-screen ${
        uiShake && !reducedMotion ? "translate-x-0.5 -translate-y-0.5 transition-transform duration-75" : ""
      }`}
    >
      {/* 0. Soft Cursor Spotlight Glow (Desktop only) */}
      {!isMobile && mousePos.x > 0 && (
        <div
          className="pointer-events-none fixed inset-0 z-10 transition-opacity duration-300"
          style={{
            background: `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(192, 38, 211, 0.12), transparent 70%)`,
          }}
        />
      )}

      {/* 0. Screen Flash Wash (on click or rupture trigger) */}
      {screenFlash && !reducedMotion && (
        <div
          className={`pointer-events-none fixed inset-0 z-50 transition-opacity duration-150 ${
            screenFlash === "crimson" ? "bg-red-600/20" : "bg-white/10"
          }`}
        />
      )}

      {/* 0. Expanding Pointer Shockwave Rings */}
      {shockwaves.map((w) => (
        <span
          key={w.id}
          className="pointer-events-none fixed z-50 rounded-full border border-fuchsia-400/60 animate-ping"
          style={{
            left: w.x - 20,
            top: w.y - 20,
            width: 40,
            height: 40,
            boxShadow: "0 0 15px rgba(192, 38, 211, 0.6)",
          }}
        />
      ))}

      {/* 1. Fixed Top HUD Header */}
      <header className="fixed top-0 left-0 right-0 z-40 p-3 sm:p-5 flex flex-col gap-2 pointer-events-none bg-gradient-to-b from-[#0a0612]/90 via-[#0a0612]/40 to-transparent backdrop-blur-[2px]">
        <div className="flex items-center justify-between w-full">
          {/* Logo & City Twin Tag */}
          <div className="flex items-center gap-2.5 pointer-events-auto">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-600/30 to-purple-600/20 border border-fuchsia-500/40 flex items-center justify-center backdrop-blur-md shadow-[0_0_15px_rgba(192,38,211,0.25)]">
              <Shield className="w-4 h-4 text-fuchsia-300" />
            </div>
            <div>
              <span className="text-sm font-bold font-mono tracking-wider text-white">
                CIVIC<span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">SHIELD</span>
              </span>
              <span className="hidden sm:inline-block ml-2.5 px-2 py-0.5 text-[9px] font-mono uppercase rounded bg-white/5 border border-white/10 text-slate-400">
                Hyderabad Geospatial Twin
              </span>
            </div>
          </div>

          {/* Right Header Badges & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
            {/* Live Simulation Pulse Tag */}
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34f5a5]" />
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
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">
                  {profile?.role?.replace("_", " ") || "Operator Active"}
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Operator</span>
              </Link>
            )}

            {/* Quick Launch Simulator Button */}
            <Link
              to="/simulator"
              className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(192,38,211,0.35)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Launch Twin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Status Ticker Strip */}
        <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-white/5 pt-1">
          <div className="flex items-center gap-2 truncate">
            <Radio className="w-3 h-3 text-fuchsia-400 animate-pulse shrink-0" />
            <span className="text-slate-300 truncate">
              {CHAPTERS[currentChapter]?.ticker || "HYD-GRID: 50.0 Hz NOMINAL • RES: 410 ML/d STABLE • EMS READY"}
            </span>
          </div>
          <span className="hidden sm:inline-block text-[9px] uppercase tracking-wider text-slate-500 shrink-0">
            SEC-SEC-01 // REALTIME
          </span>
        </div>
      </header>

      {/* 2. Sticky Fullscreen Cesium Viewport & Media Overlays */}
      <div className="fixed inset-0 z-0 w-full h-full pointer-events-none">
        {mounted && (
          <Suspense
            fallback={
              <div className="w-full h-full bg-[#0a0612] flex items-center justify-center text-fuchsia-400 font-mono text-xs">
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

      {/* 3. Pinned Compact Bottom-Left Chapter Cards Container (>=60% open map) */}
      <div className="fixed bottom-20 left-4 sm:left-8 z-30 max-w-[390px] w-[calc(100vw-32px)] sm:w-[390px] pointer-events-auto">
        {currentChapter === 0 && <Chapter1Flyover />}
        {currentChapter === 1 && <Chapter2PipeBurst />}
        {currentChapter === 2 && <Chapter3ChainReaction progress={chapterRelativeProgress} />}
        {currentChapter === 3 && <Chapter4PlanTriage />}
        {currentChapter === 4 && <Chapter5AiReport progress={chapterRelativeProgress} />}
        {currentChapter === 5 && <Chapter6CallToAction reducedMotion={reducedMotion} />}
      </div>

      {/* 4. Scroll Track Triggers (6 tall sections driving scrollProgress smoothly) */}
      <main className="relative z-10 w-full pointer-events-none">
        {CHAPTERS.map((ch, idx) => (
          <section
            key={ch.id}
            aria-label={ch.title}
            className="min-h-[190vh] sm:min-h-[210vh]"
          />
        ))}
      </main>

      {/* 5. Fixed Step Navigator at Bottom */}
      <StepNavigator
        currentChapter={currentChapter}
        onSelectChapter={handleSelectChapter}
      />
    </div>
  );
};
