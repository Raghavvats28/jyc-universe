"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useTravel } from "./TravelProvider";

/** Wraps every page so the camera (TravelProvider) can push in on the current scene. */
export default function SceneFrame({ children }: { children: ReactNode }) {
  const { scene } = useTravel();
  return (
    <motion.main
      id="scene"
      className="relative z-10 min-h-dvh"
      style={{
        scale: scene.scale,
        opacity: scene.opacity,
        originX: scene.originX,
        originY: scene.originY,
      }}
    >
      {children}
    </motion.main>
  );
}
