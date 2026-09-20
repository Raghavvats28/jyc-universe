"use client";

import { useEffect, useState } from "react";

/**
 * full   – desktop-class device: parallax, denser stars, higher pixel ratio
 * lite   – phones, touch devices, weak or data-saving devices: fewer particles, no parallax
 * static – prefers-reduced-motion: no travel animation, stars drawn once
 */
export type MotionTier = "full" | "lite" | "static";

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

const REDUCED = "(prefers-reduced-motion: reduce)";
const SMALL = "(max-width: 767px), (pointer: coarse)";

export function detectTier(): MotionTier {
  if (typeof window === "undefined") return "lite";
  if (window.matchMedia(REDUCED).matches) return "static";

  const nav = navigator as NavigatorHints;
  const smallScreen = window.matchMedia(SMALL).matches;
  const weakDevice =
    (nav.hardwareConcurrency ?? 8) <= 2 ||
    (nav.deviceMemory ?? 8) <= 2 ||
    nav.connection?.saveData === true;

  return smallScreen || weakDevice ? "lite" : "full";
}

export function useMotionTier(): MotionTier {
  const [tier, setTier] = useState<MotionTier>("lite");

  useEffect(() => {
    const update = () => setTier(detectTier());
    update();
    const queries = [window.matchMedia(REDUCED), window.matchMedia(SMALL)];
    queries.forEach((q) => q.addEventListener("change", update));
    return () => queries.forEach((q) => q.removeEventListener("change", update));
  }, []);

  return tier;
}
