import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CinematicLanding } from "@/components/landing3d/CinematicLanding";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <CinematicLanding />;
}

