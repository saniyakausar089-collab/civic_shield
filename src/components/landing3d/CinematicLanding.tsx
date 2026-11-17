import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import Lenis from "lenis";
import { DuskSky } from "./DuskSky";
import { ProceduralCity } from "./ProceduralCity";
import { NetworkOverlay } from "./NetworkOverlay";
import { AtmosphericClouds } from "./AtmosphericClouds";
import { UndergroundNetwork } from "./UndergroundNetwork";
import { SubstationPumpStation } from "./SubstationPumpStation";
import { HospitalCutaway } from "./HospitalCutaway";
import { CivicLifelines } from "./CivicLifelines";
import { CascadeFailure } from "./CascadeFailure";
import { CameraController } from "./CameraController";
import { GlassPanel } from "./GlassPanel";
import { StageIndicator } from "./StageIndicator";
import { ScrollVideoHero } from "./ScrollVideoHero";
import { BASE_CITY } from "@/engine/city";
import { weakestLinks, analyzeHarm, resilienceScore } from "@/engine/analysis";
import { runSim } from "@/engine/sim";
import { LEGACY_PLANS as PLANS } from "@/engine/plans";
import { PostProcessingEffects } from "./PostProcessingEffects";
import { FpsTracker } from "./FpsTracker";
import { Shield, ArrowRight, Eye, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";

export const CinematicLanding: React.FC = () => {
  const { isAuthenticated, profile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [dpr, setDpr] = useState<number>(1.5);
  const [fps, setFps] = useState<number>(60);
  const [lowQuality, setLowQuality] = useState(false);
  const [webglError, setWebglError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isHeroActive, setIsHeroActive] = useState<boolean>(true);
  const stagesTrackRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    // Check reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setReducedMotion(true);
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const heroEl = document.getElementById("scroll-video-hero");
      const heroDistance = heroEl
        ? heroEl.offsetHeight - window.innerHeight
        : window.innerHeight * 5;

      const heroActive = scrollY < heroDistance - 20;
      setIsHeroActive(heroActive);

      const stagesTrack = stagesTrackRef.current;
      const stagesDistance = stagesTrack
        ? stagesTrack.offsetHeight - window.innerHeight
        : window.innerHeight * 9;

      const stageProgress =
        stagesDistance > 0
          ? Math.min(1, Math.max(0, (scrollY - heroDistance) / stagesDistance))
          : 0;

      setScrollProgress(stageProgress);
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

  // Compute active stage (0 through 9)
  const currentStage = useMemo(() => {
    return Math.min(9, Math.floor(scrollProgress * 10));
  }, [scrollProgress]);

  // Jump smoothly to a specific stage
  const handleSelectStage = (stageIndex: number) => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const heroEl = document.getElementById("scroll-video-hero");
    const heroDistance = heroEl
      ? heroEl.offsetHeight - window.innerHeight
      : window.innerHeight * 5;
    const stagesTrack = stagesTrackRef.current;
    const stagesDistance = stagesTrack
      ? stagesTrack.offsetHeight - window.innerHeight
      : window.innerHeight * 9;

    const targetScroll = heroDistance + (stageIndex / 9.5) * stagesDistance;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(targetScroll, { duration: 1.4 });
    } else {
      window.scrollTo({ top: targetScroll, behavior: "smooth" });
    }
  };

  const handleLaunchSimulator = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/simulator";
    }
  };

  // Live simulation engine data for contextual panels
  const engineData = useMemo(() => {
    // 1. Weakest links
    const weakLinks = weakestLinks(BASE_CITY);
    const topWeak = weakLinks[0] || { name: "Main Pipeline", score: 98, harm: 42000 };

    // 2. Hospital backup hours from Eastside Medical (H1)
    const hospital = BASE_CITY.nodes.find((n) => n.id === "H1");
    const hospitalBackupHours = hospital?.backupHours ?? 8;

    // 3. Cascade simulation scrubbed by scroll progress in stage 7
    const stage7Local = Math.max(0, Math.min(1, (scrollProgress - 0.70) / 0.10));
    const currentHour = Math.min(24, Math.floor(stage7Local * 24));
    const simResult = runSim(BASE_CITY, ["PIPE1"]);
    const snap = simResult.hours[currentHour] || simResult.hours[0]!;

    // 4. 4-Plan comparison
    const planComparison = PLANS.map((p) => {
      const res = runSim(BASE_CITY, ["PIPE1"], p);
      return {
        id: p.id,
        name: p.name,
        harm: analyzeHarm(res),
        isBest: p.id === "full",
      };
    }).sort((a, b) => a.harm - b.harm);

    // 5. Resilience rating across all disaster presets
    const score = resilienceScore(BASE_CITY);

    return {
      topWeak,
      hospitalBackupHours,
      failureStats: {
        hour: currentHour,
        affectedPop: snap.affectedPopulation,
        systemsFailed: snap.systemsFailed,
      },
      planComparison,
      resilienceScoreValue: score,
    };
  }, [scrollProgress]);

  // Failure progress for 3D city scene blackouts (Stage 7)
  const failureProgress = useMemo(() => {
    if (scrollProgress < 0.70) return 0;
    if (scrollProgress >= 0.70 && scrollProgress <= 0.82) {
      return (scrollProgress - 0.70) / 0.12;
    }
    if (scrollProgress > 0.82 && scrollProgress <= 0.92) {
      return 1 - (scrollProgress - 0.82) / 0.10;
    }
    return 0;
  }, [scrollProgress]);

  // WebGL Error Fallback
  if (webglError) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#09090B] text-[#111827] dark:text-[#FAFAFA] p-8 flex flex-col justify-between font-sans">
        <header className="h-16 border-b border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#111318] px-6 flex items-center justify-between rounded-xl shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-[17px] font-semibold tracking-tight text-[#111827] dark:text-[#FAFAFA]">
              Civic<span className="text-[#2563EB] dark:text-[#3B82F6]">Shield</span>
            </span>
          </div>
          <button
            onClick={handleLaunchSimulator}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[14px] rounded-lg transition-all duration-200 active:scale-[0.98]"
          >
            Launch Simulator
          </button>
        </header>
        <main className="max-w-2xl mx-auto text-center space-y-6 py-24 bg-white dark:bg-[#111318] p-10 rounded-2xl border border-[#E5E7EB] dark:border-[#27272A] shadow-xl">
          <h1 className="text-[36px] font-semibold text-[#111827] dark:text-[#FAFAFA] leading-[1.2] tracking-tight">
            Civic Infrastructure Resilience Twin
          </h1>
          <p className="text-[17px] text-[#475569] dark:text-[#A1A1AA] leading-[1.6]">
            WebGL hardware acceleration is unavailable in your current browser configuration. You can proceed directly into the analytical simulation console.
          </p>
          <button
            onClick={handleLaunchSimulator}
            className="px-8 py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[15px] rounded-lg inline-flex items-center gap-2.5 transition-all duration-200 shadow-sm active:scale-[0.98]"
          >
            <span>Enter Simulator</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </main>
        <footer className="text-[13px] text-[#94A3B8] dark:text-[#71717A] text-center">
          CivicShield Urban Failure Simulator • Interdependent Infrastructure Analysis
        </footer>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-[#09090B] text-[#111827] dark:text-[#FAFAFA] select-none font-sans">
      {/* 1. World-Class Minimal SaaS Navigation Bar (Fixed above Hero at z-50) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-xl border-b border-[#E5E7EB]/40 dark:border-[#27272A]/40 shadow-xs px-6 sm:px-10 h-16 flex items-center justify-between pointer-events-auto transition-colors">
        {/* Left: Brand mark & Subtitle */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => {
              if (lenisRef.current) {
                lenisRef.current.scrollTo(0, { duration: 1.2 });
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-150">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[17px] font-semibold tracking-tight text-[#111827] dark:text-[#FAFAFA]">
                Civic<span className="text-[#2563EB] dark:text-[#3B82F6]">Shield</span>
              </span>
              <span className="hidden sm:inline-block text-[13px] text-[#94A3B8] dark:text-[#71717A] font-normal">
                Urban Resilience Digital Twin
              </span>
            </div>
          </div>
        </div>

        {/* Right: Navigation items and Action Buttons */}
        <nav className="flex items-center gap-3 sm:gap-5">
          {/* Navigation text (14px–16px, font-weight 400) */}
          <div className="hidden lg:flex items-center gap-6 text-[14px] font-medium text-[#475569] dark:text-[#A1A1AA]">
            <button
              onClick={() => {
                if (lenisRef.current) {
                  lenisRef.current.scrollTo(0, { duration: 1.2 });
                } else {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="hover:text-[#111827] dark:hover:text-[#FAFAFA] transition-colors duration-150 cursor-pointer"
            >
              Intro
            </button>
            <button
              onClick={() => handleSelectStage(0)}
              className="hover:text-[#111827] dark:hover:text-[#FAFAFA] transition-colors duration-150 cursor-pointer"
            >
              Overview
            </button>
            <button
              onClick={() => handleSelectStage(4)}
              className="hover:text-[#111827] dark:hover:text-[#FAFAFA] transition-colors duration-150 cursor-pointer"
            >
              System Cascades
            </button>
            <button
              onClick={() => handleSelectStage(8)}
              className="hover:text-[#111827] dark:hover:text-[#FAFAFA] transition-colors duration-150 cursor-pointer"
            >
              Response Plans
            </button>
          </div>

          <div className="h-4 w-px bg-[#E5E7EB] dark:bg-[#27272A] hidden lg:block" />

          {/* Reduced motion toggle */}
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            className={`px-3 py-1.5 rounded-lg border text-[13px] font-medium transition-colors duration-150 hidden sm:flex items-center gap-1.5 cursor-pointer ${
              reducedMotion
                ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                : "bg-white/80 dark:bg-[#111318]/80 border-[#E5E7EB] dark:border-[#27272A] text-[#475569] dark:text-[#A1A1AA] hover:bg-[#F7F8FA] dark:hover:bg-[#181B22]"
            }`}
            title="Toggle between smooth camera flight and still frames"
          >
            <Eye className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#71717A]" />
            <span>{reducedMotion ? "Motion: Paused" : "Motion: Fluid"}</span>
          </button>

          {/* Operator Login / Status Link */}
          {isAuthenticated ? (
            <Link
              to="/simulator"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[13.5px] font-medium flex items-center gap-2 transition-all duration-150 shadow-2xs cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">
                {profile?.role?.replace("_", " ") || "Operator Active"}
              </span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-[13.5px] font-medium text-[#475569] dark:text-[#A1A1AA] hover:text-[#2563EB] dark:hover:text-[#3B82F6] px-2.5 py-1.5 rounded-lg transition-colors duration-150 flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#71717A]" />
              <span className="hidden sm:inline">Operator Login</span>
            </Link>
          )}

          {/* Primary CTA Button: Launch Simulator */}
          <button
            onClick={handleLaunchSimulator}
            className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-[14px] font-semibold flex items-center gap-2 transition-all duration-180 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <span>Launch Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </nav>
      </header>

      {/* 2. Scroll-Driven Video Hero (First section of the page, above all existing content) */}
      <ScrollVideoHero />

      {/* 3. Full-Screen Fixed Three.js WebGL Canvas (Revealed after video hero) */}
      <div
        className={`fixed inset-0 z-10 pointer-events-none transition-opacity duration-700 ${
          isHeroActive ? "opacity-0" : "opacity-100"
        }`}
      >
        {mounted && (
          <Canvas
            dpr={dpr}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            onCreated={({ gl }) => {
              gl.toneMappingExposure = 1.1;
            }}
            onError={() => setWebglError(true)}
          >
            <PerformanceMonitor
              onDecline={() => {
                setDpr(1.0);
                setLowQuality(true);
              }}
              onIncline={() => {
                setDpr(1.5);
                setLowQuality(false);
              }}
            />

            <FpsTracker onFpsUpdate={setFps} />

            <CameraController
              scrollProgress={scrollProgress}
              reducedMotion={reducedMotion}
            />

            <DuskSky />

            <Suspense fallback={null}>
              <ProceduralCity
                scrollProgress={scrollProgress}
                failureProgress={failureProgress}
              />
              <UndergroundNetwork scrollProgress={scrollProgress} />
              <SubstationPumpStation scrollProgress={scrollProgress} />
              <HospitalCutaway scrollProgress={scrollProgress} />
              <CivicLifelines scrollProgress={scrollProgress} />
              <CascadeFailure scrollProgress={scrollProgress} />
              <NetworkOverlay scrollProgress={scrollProgress} />
              <AtmosphericClouds />
            </Suspense>

            <PostProcessingEffects
              enabled={!reducedMotion}
              lowQuality={lowQuality}
            />
          </Canvas>
        )}
      </div>

      {/* 4. Interactive Floating Microsoft-Styled Panels (Revealed after video hero) */}
      <div
        className={`transition-opacity duration-500 ${
          isHeroActive ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
        }`}
      >
        <GlassPanel
          currentStage={currentStage}
          scrollProgress={scrollProgress}
          onLaunchSimulator={handleLaunchSimulator}
          weakLinkData={engineData.topWeak}
          hospitalBackupHours={engineData.hospitalBackupHours}
          failureStats={engineData.failureStats}
          planComparison={engineData.planComparison}
          resilienceScoreValue={engineData.resilienceScoreValue}
        />
      </div>

      {/* 5. Side Stage Dot Indicator (Revealed after video hero) */}
      <div
        className={`transition-opacity duration-500 ${
          isHeroActive ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
        }`}
      >
        <StageIndicator
          currentStage={currentStage}
          onSelectStage={handleSelectStage}
        />
      </div>

      {/* 6. Scroll Track for 3D City Stages: 10 sections of 100vh each */}
      <div ref={stagesTrackRef} className="relative z-20 pointer-events-none">
        {Array.from({ length: 10 }).map((_, i) => (
          <section key={i} className="h-screen w-full flex items-center justify-center">
            <div className="sr-only">Stage {i}</div>
          </section>
        ))}
      </div>
    </div>
  );
};
