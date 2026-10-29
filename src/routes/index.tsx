import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CinematicLanding } from "@/components/landing3d/CinematicLanding";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AuthGuard>
      <CinematicLanding />
    </AuthGuard>
  );
}
