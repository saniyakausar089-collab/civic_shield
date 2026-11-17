import React, { lazy, Suspense } from "react";
import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const CinematicLanding = lazy(() =>
  import("@/components/landing3d/CinematicLanding").then((m) => ({
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
        <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-[#2563EB] font-mono text-sm">
          Loading CivicShield...
        </div>
      }
    >
      <ErrorBoundary fallbackTitle="3D Landing Viewport Error">
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-[#2563EB] font-mono text-sm">
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

