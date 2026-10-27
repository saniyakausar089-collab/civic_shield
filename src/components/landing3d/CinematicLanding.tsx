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
import { BASE_CITY } from "@/engine/city";
import { weakestLinks, analyzeHarm, resilienceScore } from "@/engine/analysis";
import { runSim } from "@/engine/sim";
import { PLANS } from "@/engine/plans";
import { Shield, ArrowRight, Eye, RefreshCw } from "lucide-react";

export const CinematicLanding: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [dpr, setDpr] = useState<number>(1.5);
  const [webglError, setWebglError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis smooth scroll
  useEffect(() => {
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

  // Compute active stage (0 through 9)
  const currentStage = useMemo(() => {
    return Math.min(9, Math.floor(scrollProgress * 10));
  }, [scrollProgress]);

  // Jump smoothly to a specific stage
  const handleSelectStage = (stageIndex: number) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = (stageIndex / 9.5) * maxScroll;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(targetScroll, { duration: 1.4 });
    } else {
      window.scrollTo({ top: targetScroll, behavior: "smooth" });
    }
  };

  const handleLaunchSimulator = () => {
    window.location.href = "/simulator";
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
    // Stage 7 spans progress 0.70 to 0.80 -> scrubs hours 0 to 24
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
    // Lingers slightly into stage 8 then resets as plan recovers
    if (scrollProgress > 0.82 && scrollProgress <= 0.92) {
      return 1 - (scrollProgress - 0.82) / 0.10;
    }
    return 0;
  }, [scrollProgress]);

  // WebGL Error Fallback
  if (webglError) {
    return (
      <div className="min-h-screen bg-[#0a0f16] text-white p-8 flex flex-col justify-between">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="font-mono font-bold tracking-wider">CIVICSHIELD</span>
          </div>
          <button
            onClick={handleLaunchSimulator}
            className="px-4 py-2 bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl"
          >
            Launch Simulator
          </button>
        </header>
        <main className="max-w-2xl mx-auto text-center space-y-6 py-24">
          <h1 className="text-4xl font-extrabold">Civic Infrastructure Resilience Twin</h1>
          <p className="text-slate-300">
            WebGL acceleration is unavailable in your browser environment. You can still access the complete analytical simulation workspace directly.
          </p>
          <button
            onClick={handleLaunchSimulator}
            className="px-8 py-4 bg-cyan-400 text-slate-950 font-bold rounded-2xl inline-flex items-center gap-2"
          >
            <span>Enter Simulator</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </main>
        <footer className="text-xs font-mono text-slate-500 text-center">
          CivicShield Urban Failure Simulator
        </footer>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-[#0a0f16] text-white select-none">
      {/* 1. Fixed Top HUD Header */}
      <header className="fixed top-0 left-0 right-0 z-40 p-4 sm:p-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center backdrop-blur-md">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="text-sm font-bold font-mono tracking-wider text-white">
              CIVIC<span className="text-cyan-400">SHIELD</span>
            </span>
            <span className="hidden sm:inline-block ml-3 px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-white/5 border border-white/10 text-slate-400">
              3D Infrastructure Twin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Reduced motion toggle */}
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors hidden sm:flex items-center gap-1.5 ${
              reducedMotion
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "bg-black/30 border-white/10 text-slate-400 hover:text-white"
            }`}
            title="Toggle between smooth camera flight and still frames"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{reducedMotion ? "Reduced Motion: ON" : "Motion: Fluid"}</span>
          </button>

          {/* Skip Intro Button */}
          <button
            onClick={handleLaunchSimulator}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-mono text-xs uppercase tracking-wider flex items-center gap-2 backdrop-blur-md transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Skip Intro</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </header>

      {/* 2. Full-Screen Fixed Three.js WebGL Canvas */}
      <div className="fixed inset-0 z-10 pointer-events-none">
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
            onDecline={() => setDpr(1.0)}
            onIncline={() => setDpr(1.5)}
          />

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
        </Canvas>
      </div>

      {/* 3. Interactive Floating Glass HUD Panels */}
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

      {/* 4. Side Stage Dot Indicator */}
      <StageIndicator
        currentStage={currentStage}
        onSelectStage={handleSelectStage}
      />

      {/* 5. Scroll Track: 10 sections of 100vh each */}
      <div className="relative z-20 pointer-events-none">
        {Array.from({ length: 10 }).map((_, i) => (
          <section key={i} className="h-screen w-full flex items-center justify-center">
            {/* Visual spacer anchors for browser scroll */}
            <div className="sr-only">Stage {i}</div>
          </section>
        ))}
      </div>
    </div>
  );
};
