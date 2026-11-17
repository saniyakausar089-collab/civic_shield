import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

/* ===== CONFIG ===== */
export const FRAME_COUNT = 240;
export const FRAME_PATH = (i: number) =>
  `/scroll-video/frames/frame_${String(i).padStart(4, "0")}.webp`;
export const SCROLL_LENGTH = "600vh";
export const SMOOTHING = 0.12; // 0..1 (lower = smoother/laggier)

export interface CaptionConfig {
  start: number;
  end: number;
  heading: string;
  subtext: string;
  align?: "left" | "right";
  isHero?: boolean;
}

export const CAPTIONS: CaptionConfig[] = [
  {
    start: 0.00,
    end: 0.28,
    heading: "The Living City",
    subtext: "Scroll to scrub through interconnected civic infrastructure.",
    align: "left",
    isHero: true,
  },
  {
    start: 0.33,
    end: 0.58,
    heading: "Everything Connected",
    subtext: "Roads, towers, utilities and hospitals in one living system.",
    align: "left",
  },
  {
    start: 0.63,
    end: 0.88,
    heading: "One Failure Cascades",
    subtext: "See how a single point of failure ripples across the city.",
    align: "right",
  },
];

interface ScrollVideoHeroProps {
  onProgressChange?: (progress: number) => void;
  onHeroCompleteChange?: (isComplete: boolean) => void;
}

export const ScrollVideoHero: React.FC<ScrollVideoHeroProps> = ({
  onProgressChange,
  onHeroCompleteChange,
}) => {
  console.log("=== [ScrollVideoHero] Component Rendering ===");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const captionElsRef = useRef<(HTMLElement | null)[]>([]);

  // Loader refs for high-performance direct DOM updates
  const loaderRef = useRef<HTMLDivElement>(null);
  const loaderFillRef = useRef<HTMLDivElement>(null);
  const loaderTextRef = useRef<HTMLParagraphElement>(null);

  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Animation & scrubbing refs
  const readyRef = useRef<boolean>(false);
  const currentFrameRef = useRef<number>(0);
  const targetFrameRef = useRef<number>(0);
  const lastDrawnRef = useRef<number>(-1);
  const rafIdRef = useRef<number | null>(null);
  const reducedMotionRef = useRef<boolean>(false);
  const wasCompleteRef = useRef<boolean>(false);

  // Draw a specific frame index on the canvas with cover behavior
  const draw = (index: number) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !ctx || !img || !img.complete || !img.naturalWidth) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih); // cover
    const w = iw * scale;
    const h = ih * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;

    ctx.drawImage(img, x, y, w, h);
  };

  // DPR-aware resize
  const resize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    lastDrawnRef.current = -1; // force redraw
    const cur = Math.max(0, Math.round(currentFrameRef.current));
    draw(cur);
  };

  // Preload all 240 WebP frames with high-performance direct DOM updates
  useEffect(() => {
    console.log("=== [ScrollVideoHero] useEffect STARTING PRELOAD ===");
    let loadedCount = 0;
    const totalFrames = FRAME_COUNT;
    const imgs: HTMLImageElement[] = new Array(totalFrames);
    imagesRef.current = imgs;

    const finishLoading = () => {
      if (readyRef.current) return;
      readyRef.current = true;
      setIsLoaded(true);
      if (loaderRef.current) {
        loaderRef.current.style.opacity = "0";
        loaderRef.current.style.pointerEvents = "none";
      }
      draw(0);
    };

    const onFrameDone = () => {
      loadedCount++;
      const pct = Math.round((loadedCount / totalFrames) * 100);

      if (loaderFillRef.current) {
        loaderFillRef.current.style.width = `${pct}%`;
      }
      if (loaderTextRef.current) {
        loaderTextRef.current.textContent = `Loading ${pct}%`;
      }

      if (loadedCount >= totalFrames) {
        finishLoading();
      }
    };

    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      img.onload = onFrameDone;
      img.onerror = onFrameDone;
      img.src = FRAME_PATH(i + 1);
      imgs[i] = img;

      // Draw frame 1 as soon as it loads to avoid blank canvas
      if (i === 0) {
        if (img.complete && img.naturalWidth) {
          draw(0);
        } else {
          img.addEventListener(
            "load",
            () => {
              draw(0);
            },
            { once: true }
          );
        }
      }
    }

    // Safety fallback so the UI never blocks indefinitely
    const timer = setTimeout(() => {
      if (!readyRef.current) {
        finishLoading();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Main setup: scroll listener, rAF loop, smooth lerp
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctxRef.current = canvas.getContext("2d", { alpha: false });

    // Respect prefers-reduced-motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = motionQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    motionQuery.addEventListener?.("change", handleMotionChange);

    resize();
    window.addEventListener("resize", resize, { passive: true });

    const loop = () => {
      if (!wrapperRef.current) {
        rafIdRef.current = requestAnimationFrame(loop);
        return;
      }

      // Passive getBoundingClientRect progress calculation
      const rect = wrapperRef.current.getBoundingClientRect();
      const total = wrapperRef.current.offsetHeight - window.innerHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;

      if (onProgressChange) {
        onProgressChange(progress);
      }

      const isComplete = progress >= 0.999;
      if (isComplete !== wasCompleteRef.current) {
        wasCompleteRef.current = isComplete;
        if (onHeroCompleteChange) {
          onHeroCompleteChange(isComplete);
        }
      }

      // Frame mapping & smoothing
      if (reducedMotionRef.current) {
        const targetIdx = Math.min(
          FRAME_COUNT - 1,
          Math.max(0, Math.round(progress * (FRAME_COUNT - 1)))
        );
        if (readyRef.current && targetIdx !== lastDrawnRef.current) {
          draw(targetIdx);
          lastDrawnRef.current = targetIdx;
        }
      } else {
        targetFrameRef.current = progress * (FRAME_COUNT - 1);
        currentFrameRef.current +=
          (targetFrameRef.current - currentFrameRef.current) * SMOOTHING;
        if (Math.abs(targetFrameRef.current - currentFrameRef.current) < 0.01) {
          currentFrameRef.current = targetFrameRef.current;
        }
        const idx = Math.min(
          FRAME_COUNT - 1,
          Math.max(0, Math.round(currentFrameRef.current))
        );
        if (readyRef.current && idx !== lastDrawnRef.current) {
          draw(idx);
          lastDrawnRef.current = idx;
        }
      }

      // Overlay UI 1: Thin fixed scroll progress bar at top
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${(progress * 100).toFixed(2)}%`;
        progressBarRef.current.style.opacity =
          progress > 0.001 && progress < 0.999 ? "1" : "0";
      }

      // Overlay UI 2: Bouncing scroll hint
      if (hintRef.current) {
        hintRef.current.style.opacity = progress > 0.02 ? "0" : "1";
      }

      // Overlay UI 3: Captions
      captionElsRef.current.forEach((el, i) => {
        if (!el) return;
        const c = CAPTIONS[i];
        if (!c) return;
        const isVisible = progress >= c.start && progress <= c.end;
        if (isVisible) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          el.style.pointerEvents = "auto";
        } else {
          el.style.opacity = "0";
          el.style.transform = reducedMotionRef.current ? "none" : "translateY(24px)";
          el.style.pointerEvents = "none";
        }
      });

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener("resize", resize);
      motionQuery.removeEventListener?.("change", handleMotionChange);
    };
  }, [onProgressChange, onHeroCompleteChange]);

  return (
    <>
      {/* 1. Full-Screen Preloader */}
      <div
        ref={loaderRef}
        className="fixed inset-0 z-60 bg-[#05070A] flex flex-col items-center justify-center gap-4 transition-opacity duration-600 pointer-events-auto"
        style={{ transitionDuration: "600ms" }}
      >
        <div className="w-[min(320px,75vw)] h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            ref={loaderFillRef}
            className="h-full bg-[#2563EB] dark:bg-[#3B82F6] transition-all duration-150 ease-out shadow-[0_0_12px_rgba(37,99,235,0.6)]"
            style={{ width: "0%" }}
          />
        </div>
        <p
          ref={loaderTextRef}
          className="text-[13px] tracking-[0.1em] uppercase font-mono text-white/60"
        >
          Loading 0%
        </p>
      </div>

      {/* 2. Thin Scroll Progress Bar fixed at viewport top */}
      <div className="fixed top-0 left-0 right-0 h-[3px] z-55 pointer-events-none bg-white/5">
        <div
          ref={progressBarRef}
          className="h-full bg-[#2563EB] dark:bg-[#3B82F6] shadow-[0_0_8px_rgba(37,99,235,0.8)] transition-[opacity] duration-300"
          style={{ width: "0%", opacity: 0 }}
        />
      </div>

      {/* 3. Outer Scroll Wrapper (600vh) */}
      <div
        ref={wrapperRef}
        id="scroll-video-hero"
        className="relative w-full"
        style={{ height: SCROLL_LENGTH }}
      >
        {/* Inner Sticky Container (100dvh) */}
        <div className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-[#05070A] z-30 select-none">
          {/* Cover Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block"
          />

          {/* Dark Vignette Gradient Overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, transparent 40%, rgba(5, 7, 10, 0.65) 100%),
                           linear-gradient(to top, rgba(5, 7, 10, 0.88) 0%, transparent 45%),
                           linear-gradient(to bottom, rgba(5, 7, 10, 0.70) 0%, transparent 28%)`,
            }}
          />

          {/* Captions Overlay */}
          {CAPTIONS.map((cap, i) => (
            <section
              key={i}
              ref={(el) => (captionElsRef.current[i] = el)}
              className={`absolute bottom-[14vh] max-w-[min(580px,88vw)] transition-all ease-out pointer-events-none ${
                cap.align === "right"
                  ? "right-[6vw] text-right ml-auto"
                  : "left-[6vw] text-left"
              }`}
              style={{
                opacity: 0,
                transform: "translateY(24px)",
                transitionProperty: "opacity, transform",
                transitionDuration: "450ms",
              }}
            >
              <h2 className="text-[32px] sm:text-[44px] lg:text-[54px] font-semibold text-white tracking-tight leading-[1.1]">
                {cap.heading}
              </h2>
              <p className="mt-3 text-[15px] sm:text-[17px] text-white/80 leading-relaxed font-normal">
                {cap.subtext}
              </p>
            </section>
          ))}

          {/* Bouncing Scroll Hint */}
          <div
            ref={hintRef}
            className="absolute bottom-[4vh] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/75 text-[11px] uppercase tracking-[0.2em] font-medium transition-opacity duration-300 pointer-events-none"
            style={{
              animation: "bob 1.6s ease-in-out infinite",
            }}
          >
            <span>Scroll</span>
            <ChevronDown className="w-4 h-4 text-white/75" />
          </div>
        </div>
      </div>
    </>
  );
};
