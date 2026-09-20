import type { ClubIdentity } from "./identity";
import type { JycEvent } from "./types";

/**
 * Event universe geometry. Pure functions, no React, no data imports, so both the scene and any
 * future server code can use it.
 *
 * The scene is one SVG with a fixed 1200 x 720 stage. Time runs along a single cubic arc:
 *
 *   past trail  ..  NOW  ..  soonest event (near, big)  ..........  furthest event (far, small)
 *
 * The nearest light is the soonest event. Size, brightness and spacing follow simple perspective:
 * things further away in time are smaller, dimmer and closer together.
 */

/** An event joined with what the UI needs about its club. Serializable. */
export interface EventView {
  event: JycEvent;
  clubName: string;
  identity: ClubIdentity;
}

export const STAGE = { w: 1200, h: 720 } as const;

export interface Pt {
  x: number;
  y: number;
}

/** Cubic bezier control points of the time arc (stage units). Starts at the bottom-left edge. */
const A: Pt = { x: -40, y: 706 };
const B: Pt = { x: 260, y: 724 };
const C: Pt = { x: 560, y: 420 };
const D: Pt = { x: 1140, y: 210 };

const r1 = (n: number) => Math.round(n * 10) / 10;

export function arcPoint(t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return { x: r1(a * A.x + b * B.x + c * C.x + d * D.x), y: r1(a * A.y + b * B.y + c * C.y + d * D.y) };
}

/** Polyline through the arc between two parameters. */
export function arcPath(t0: number, t1: number, steps = 28): string {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const p = arcPoint(t0 + ((t1 - t0) * i) / steps);
    d += `${i === 0 ? "M" : "L"}${p.x} ${p.y}`;
  }
  return d;
}

/** Where "today" sits on the arc. Past events trail behind it, upcoming ones lie ahead. */
export const NOW_T = 0.3;
const T_NEAR = 0.42;
const T_FAR = 0.95;
const T_TRAIL_START = NOW_T - 0.035;
const T_TRAIL_END = 0.035;

export const MAX_ORBS = 10;
export const MAX_TRAIL = 12;

const R_NEAR = 42;
const R_FAR = 19;
/** Perspective compression: spacing shrinks with distance but never reaches zero. */
const K = 1.2;

export interface OrbSpec extends Pt {
  id: string;
  r: number;
  /** 1 = brightest (nearest), lower = further away. */
  glow: number;
}

/** Lights for upcoming events. `ids` must already be soonest first. */
export function orbLayout(ids: string[]): OrbSpec[] {
  const list = ids.slice(0, MAX_ORBS);
  const n = list.length;
  return list.map((id, i) => {
    const u = n === 1 ? 0 : i / (n - 1);
    const t = T_NEAR + (T_FAR - T_NEAR) * (Math.log(1 + K * u) / Math.log(1 + K));
    return { id, ...arcPoint(t), r: r1(R_NEAR - (R_NEAR - R_FAR) * u), glow: r1(1 - 0.4 * u) };
  });
}

export interface TrailSpec extends Pt {
  id: string;
  r: number;
  /** Resting opacity of the dot. */
  o: number;
}

/** Dim dots for past events. `ids` must already be most recent first. */
export function trailLayout(ids: string[]): TrailSpec[] {
  const list = ids.slice(0, MAX_TRAIL);
  const n = list.length;
  return list.map((id, i) => {
    const k = n === 1 ? 0 : i / (n - 1);
    const t = T_TRAIL_START - (T_TRAIL_START - T_TRAIL_END) * k;
    return { id, ...arcPoint(t), r: r1(6 - 2.6 * k), o: r1(0.55 - 0.35 * k) };
  });
}

export const TRAIL_RANGE: [number, number] = [T_TRAIL_END, NOW_T];
export const ORB_RANGE: [number, number] = [NOW_T, T_FAR + 0.03];
