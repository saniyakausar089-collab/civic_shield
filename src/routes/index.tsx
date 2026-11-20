import React, { lazy, Suspense } from "react";
import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const CinematicLanding = lazy(() =>
  import("@/components/cinematic/CinematicLanding").then((m) => ({
    default: m.CinematicLanding,
  }))
);

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center text-cyan-400 font-mono text-sm">
          Loading CivicShield...
        </div>
      }
    >
      <ErrorBoundary fallbackTitle="3D Landing Viewport Error">
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center text-cyan-400 font-mono text-sm">
              Loading CivicShield...
            </div>
          }
        >
          <CinematicLanding />
        </Suspense>
      </ErrorBoundary>
    </ClientOnly>
  );
}

