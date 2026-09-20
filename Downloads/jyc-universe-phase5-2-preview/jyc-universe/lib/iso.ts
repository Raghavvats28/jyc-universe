/**
 * Tiny isometric toolkit for the city scenes. Pure functions, no React.
 *
 * Grid space:   (gx, gy, z)  gx/gy in grid cells, z in screen px (up).
 * Screen space: 2:1 dimetric. +gx runs down-right, +gy runs down-left,
 *               so the corner nearest the viewer is (max gx, max gy).
 *
 * Everything returns rounded numbers so server and client render identical markup.
 */

export const HALF_W = 48;
export const HALF_H = 24;
/** Screen length (px) of one grid cell along either axis. */
export const CELL = Math.hypot(HALF_W, HALF_H);
const UX = HALF_W / CELL;
const UY = HALF_H / CELL;

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 10000) / 10000;

export type Pt = readonly [number, number];

/** Project a grid point to screen space. */
export const P = (gx: number, gy: number, z = 0): Pt => [r2((gx - gy) * HALF_W), r2((gx + gy) * HALF_H - z)];

/** "x,y x,y ..." for <polygon points>. */
export const pts = (list: readonly Pt[]): string => list.map(([x, y]) => `${x},${y}`).join(" ");

/** Closed path string for <path d>. */
export const path = (list: readonly Pt[]): string =>
  list.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join("") + "Z";

/**
 * Face coordinate systems. Inside these, geometry is authored in flat px:
 *   local x = along the wall, local y = UP from the wall's base.
 * That lets windows, pips, code lines and signs be drawn as plain rects/circles.
 */

/** Wall that faces down-left (the plane y = gy + d). Local x runs along +gx. */
export function faceL(gx: number, gy: number, d: number, z0 = 0): string {
  const [ox, oy] = P(gx, gy + d, z0);
  return `matrix(${r4(UX)} ${r4(UY)} 0 -1 ${ox} ${oy})`;
}

/** Wall that faces down-right (the plane x = gx + w). Local x runs from the front corner along -gy. */
export function faceR(gx: number, gy: number, w: number, d: number, z0 = 0): string {
  const [ox, oy] = P(gx + w, gy + d, z0);
  return `matrix(${r4(UX)} ${r4(-UY)} 0 -1 ${ox} ${oy})`;
}

/** Flat plane at height z. Local x runs along +gx, local y along +gy (both in px). */
export function groundM(gx: number, gy: number, z = 0): string {
  const [ox, oy] = P(gx, gy, z);
  return `matrix(${r4(UX)} ${r4(UY)} ${r4(-UX)} ${r4(UY)} ${ox} ${oy})`;
}

/** Rectangle as a path fragment. Concatenate many into a single <path d>. */
export const rect = (x: number, y: number, w: number, h: number): string =>
  `M${r1(x)} ${r1(y)}h${r1(w)}v${r1(h)}h${r1(-w)}Z`;

/* ---------------- deterministic randomness ---------------- */

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- window grids ---------------- */

export interface WindowSpec {
  /** Face size in local px. */
  fw: number;
  fh: number;
  cols: number;
  rows: number;
  /** Margins in px. */
  mx?: number;
  top?: number;
  bottom?: number;
  /** Window size as a fraction of its cell (0-1). */
  fillX?: number;
  fillY?: number;
  /** Share of windows that are lit (0-1). */
  lit: number;
  /** Share of the lit windows that are warm rather than cool (default 0.6). */
  warm?: number;
  seed: number;
}

export interface WindowPaths {
  warm: string;
  cool: string;
  off: string;
  /** A subset of the unlit windows that switch on while the building is hovered. */
  hover: string;
}

export function windowGrid(s: WindowSpec): WindowPaths {
  const { fw, fh, cols, rows, lit, seed } = s;
  const mx = s.mx ?? 8;
  const top = s.top ?? 10;
  const bottom = s.bottom ?? 10;
  const fx = s.fillX ?? 0.6;
  const fy = s.fillY ?? 0.5;
  const cw = (fw - mx * 2) / cols;
  const ch = (fh - top - bottom) / rows;
  const ww = cw * fx;
  const wh = ch * fy;
  const warm = s.warm ?? 0.6;
  const rand = rng(seed);
  const out = { warm: "", cool: "", off: "", hover: "" };

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = mx + col * cw + (cw - ww) / 2;
      const y = bottom + row * ch + (ch - wh) / 2;
      const v = rand();
      const w = rect(x, y, ww, wh);
      if (v < lit * warm) out.warm += w;
      else if (v < lit) out.cool += w;
      else {
        out.off += w;
        if (rand() < 0.4) out.hover += w;
      }
    }
  }
  return out;
}

/** Windows that look like lines of code: left-aligned bars of varying length and indent. */
export function codeLines(fw: number, fh: number, seed: number, opts: { top?: number; bottom?: number; pitch?: number } = {}) {
  const rand = rng(seed);
  const top = opts.top ?? 14;
  const bottom = opts.bottom ?? 12;
  const pitch = opts.pitch ?? 12;
  const mx = 10;
  const rows = Math.max(1, Math.floor((fh - top - bottom) / pitch));
  const out = { lit: "", dim: "", hover: "" };
  let indent = 0;

  for (let i = 0; i < rows; i++) {
    const y = bottom + i * pitch;
    const roll = rand();
    if (roll < 0.14) continue; // blank line
    if (roll < 0.4) indent = Math.min(3, indent + 1);
    else if (roll < 0.62) indent = Math.max(0, indent - 1);
    const x = mx + indent * 9;
    const len = 14 + rand() * Math.max(10, fw - x - mx - 14);
    const bar = rect(x, y, Math.min(len, fw - x - mx), 3.6);
    const v = rand();
    if (v < 0.55) out.lit += bar;
    else {
      out.dim += bar;
      if (rand() < 0.5) out.hover += bar;
    }
  }
  return out;
}

/* ---------------- cylinders ---------------- */

/** Screen radii of a ground circle of radius r (grid cells). */
export const ellipseR = (r: number): { rx: number; ry: number } => ({
  rx: r2(r * HALF_W * Math.SQRT2),
  ry: r2(r * HALF_H * Math.SQRT2),
});

export interface CylWindowSpec {
  cx: number;
  cy: number;
  r: number;
  z0: number;
  h: number;
  slots: number;
  rows: number;
  lit: number;
  warm?: number;
  seed: number;
}

/** Ribbon windows wrapped around the visible (front) half of a cylinder. */
export function cylWindows(s: CylWindowSpec): WindowPaths {
  const { rx, ry } = ellipseR(s.r);
  const [X, Y] = P(s.cx, s.cy, s.z0);
  const rand = rng(s.seed);
  const out: WindowPaths = { warm: "", cool: "", off: "", hover: "" };
  const padTop = 12;
  const padBottom = 10;
  const rowH = (s.h - padTop - padBottom) / s.rows;
  const wh = rowH * 0.5;
  const span = Math.PI / s.slots;
  const half = span * 0.3;

  for (let row = 0; row < s.rows; row++) {
    const zb = padBottom + row * rowH + (rowH - wh) / 2;
    for (let i = 0; i < s.slots; i++) {
      const mid = (i + 0.5) * span;
      const a1 = mid - half;
      const a2 = mid + half;
      const q: Pt[] = [
        [X + rx * Math.cos(a1), Y + ry * Math.sin(a1) - zb],
        [X + rx * Math.cos(a2), Y + ry * Math.sin(a2) - zb],
        [X + rx * Math.cos(a2), Y + ry * Math.sin(a2) - zb - wh],
        [X + rx * Math.cos(a1), Y + ry * Math.sin(a1) - zb - wh],
      ].map(([x, y]) => [r1(x), r1(y)] as Pt);
      const d = path(q);
      const v = rand();
      if (v < s.lit * (s.warm ?? 0.6)) out.warm += d;
      else if (v < s.lit) out.cool += d;
      else {
        out.off += d;
        if (rand() < 0.4) out.hover += d;
      }
    }
  }
  return out;
}

/* ---------------- world-space helpers ---------------- */

/** Screen-space centre of a grid rectangle at height z. */
export const centerOf = (gx: number, gy: number, w: number, d: number, z = 0): Pt => P(gx + w / 2, gy + d / 2, z);
