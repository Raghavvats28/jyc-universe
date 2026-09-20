/**
 * Opening sequence timeline (seconds). Everything in the intro reads from here,
 * so a future scene (e.g. the eagle fly-in) can be slotted in by shifting values.
 */
export const INTRO = {
  logoIn: 1.4,
  wordmarkIn: 3.0,
  // Phase 4 (eagle): fly-in + landing would sit between logoIn and ringsIn.
  ringsIn: 3.6,
  seedsIn: 4.4,
  enter: 6.0,
} as const;

/** Shared easing: fast start, long soft landing. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
