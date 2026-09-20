import type { Atmosphere } from "./types";

/** Cheap CSS-only surface textures for domain planets. No images, no canvas. */
export function planetSurface(kind: Atmosphere, accent: string): string {
  switch (kind) {
    case "circuit":
      return `repeating-linear-gradient(0deg, ${accent}24 0 1px, transparent 1px 34px), repeating-linear-gradient(90deg, ${accent}24 0 1px, transparent 1px 34px)`;
    case "pulse":
      return `repeating-radial-gradient(circle at 30% 40%, ${accent}34 0 2px, transparent 2px 26px)`;
    case "flow":
      return `repeating-conic-gradient(from 20deg at 30% 60%, ${accent}28 0deg 6deg, transparent 6deg 18deg)`;
    case "heritage":
      return `repeating-conic-gradient(from 45deg at 50% 50%, ${accent}2c 0deg 12deg, transparent 12deg 24deg)`;
    case "dynamic":
      return `repeating-linear-gradient(115deg, ${accent}30 0 3px, transparent 3px 28px)`;
    case "ink":
      return `repeating-linear-gradient(0deg, ${accent}26 0 1px, transparent 1px 14px)`;
  }
}
