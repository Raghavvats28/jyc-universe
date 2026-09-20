import { memo, type ComponentType } from "react";
import type { CitySpot, Silhouette } from "@/lib/city";
import { gearPath } from "@/lib/gear";
import {
  CELL,
  P,
  codeLines,
  cylWindows,
  ellipseR,
  faceL,
  faceR,
  groundM,
  pts,
  rect,
  rng,
  windowGrid,
} from "@/lib/iso";
import { Beacon, EdgeLight, FaceText, Prism, WindowLayers, Windows, cylBody } from "./parts";
import { Hall, Stage, Studio, Vinyl } from "./musicBuildings";

export { cylBody };

/**
 * Silhouettes for the cities. Technical's five live here; Music's four are in ./musicBuildings. Each is a pure function of its plot (CitySpot),
 * so it renders identically on server and client and never re-renders on hover.
 * Hover styling is done in city.css via the parent's data-active attribute.
 */

/* ------------------------------------------------------------------ */
/* DICE: a die. The pips are the windows.                              */
/* ------------------------------------------------------------------ */

function Pips({ w, h, value, r }: { w: number; h: number; value: 1 | 3 | 5; r: number }) {
  const side = Math.min(w, h) * 0.66;
  const ox = (w - side) / 2;
  const oy = (h - side) / 2;
  const layout: Record<1 | 3 | 5, Array<[number, number]>> = {
    1: [[0.5, 0.5]],
    3: [
      [0.2, 0.8],
      [0.5, 0.5],
      [0.8, 0.2],
    ],
    5: [
      [0.2, 0.8],
      [0.8, 0.8],
      [0.2, 0.2],
      [0.8, 0.2],
      [0.5, 0.5],
    ],
  };
  return (
    <g>
      {layout[value].map(([u, v], i) => {
        const cx = Math.round((ox + u * side) * 10) / 10;
        const cy = Math.round((oy + v * side) * 10) / 10;
        return (
          <g key={i}>
            <circle className="pip-halo" cx={cx} cy={cy} r={r + 13} />
            <circle className="pip-bezel" cx={cx} cy={cy} r={r + 5} />
            <circle className="pip-lit" cx={cx} cy={cy} r={r} />
          </g>
        );
      })}
    </g>
  );
}

function Die({ spot }: { spot: CitySpot }) {
  const s = 3.2;
  const off = (spot.w - s) / 2;
  const cx = spot.gx + off;
  const cy = spot.gy + off;
  const base = 12;
  const h = 158;
  const zt = base + h;
  const fw = s * CELL;
  const L = faceL(cx, cy, s, base);
  const R = faceR(cx, cy, s, s, base);
  const spec = { fw, fh: h, cols: 10, rows: 9, mx: 9, top: 10, bottom: 10, fillX: 0.4, fillY: 0.34, lit: 0.3, warm: 0.55 };

  return (
    <g>
      <Prism gx={spot.gx} gy={spot.gy} w={spot.w} d={spot.d} h={base} className="edge plinth" />
      <Prism gx={cx} gy={cy} w={s} d={s} z0={base} h={h} />
      <Windows matrix={L} spec={{ ...spec, seed: 71 }} />
      <Windows matrix={R} spec={{ ...spec, seed: 72 }} />
      <g transform={L}>
        <Pips w={fw} h={h} value={3} r={12} />
      </g>
      <g transform={R}>
        <Pips w={fw} h={h} value={1} r={17} />
      </g>
      <g transform={groundM(cx, cy, zt)}>
        <Pips w={fw} h={fw} value={5} r={12} />
      </g>
      <EdgeLight matrix={L} x={fw} h={h} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* CODING: a slim tower whose windows are lines of code.               */
/* ------------------------------------------------------------------ */

function Spire({ spot }: { spot: CitySpot }) {
  const o = 0.3;
  const w1 = 2.0;
  const gx = spot.gx + o;
  const gy = spot.gy + o;
  const h1 = 215;

  const in2 = 0.25;
  const w2 = w1 - in2 * 2;
  const h2 = 85;
  const g2x = gx + in2;
  const g2y = gy + in2;

  const in3 = 0.4;
  const w3 = w2 - in3 * 2;
  const h3 = 30;
  const g3x = g2x + in3;
  const g3y = g2y + in3;

  const fw1 = w1 * CELL;
  const fw2 = w2 * CELL;
  const L1 = faceL(gx, gy, w1, 0);
  const R1 = faceR(gx, gy, w1, w1, 0);
  const L2 = faceL(g2x, g2y, w2, h1);
  const R2 = faceR(g2x, g2y, w2, w2, h1);

  const l1 = codeLines(fw1, h1, 31, { top: 56, bottom: 10, pitch: 11 });
  const r1 = codeLines(fw1, h1, 47, { top: 56, bottom: 10, pitch: 11 });
  const l2 = codeLines(fw2, h2, 53, { top: 8, bottom: 8, pitch: 11 });
  const r2 = codeLines(fw2, h2, 59, { top: 8, bottom: 8, pitch: 11 });

  const [mx, my] = P(g3x + w3 / 2, g3y + w3 / 2, h1 + h2 + h3);

  return (
    <g>
      <Prism gx={gx} gy={gy} w={w1} d={w1} h={h1} />
      <WindowLayers matrix={L1} paths={{ accent: l1.lit, off: l1.dim, hover: l1.hover }} />
      <WindowLayers matrix={R1} paths={{ accent: r1.lit, off: r1.dim, hover: r1.hover }} />

      {/* Sign plate near the top of the tower */}
      <g transform={L1}>
        <rect className="sign-plate" x={8} y={h1 - 46} width={fw1 - 16} height={32} />
      </g>
      <FaceText matrix={L1} x={fw1 / 2} y={h1 - 30} size={16} spacing={2} className="sign-text sign-accent">
        {"</>"}
      </FaceText>
      <EdgeLight matrix={L1} x={fw1} h={h1} />

      <Prism gx={g2x} gy={g2y} w={w2} d={w2} z0={h1} h={h2} />
      <WindowLayers matrix={L2} paths={{ accent: l2.lit, off: l2.dim, hover: l2.hover }} />
      <WindowLayers matrix={R2} paths={{ accent: r2.lit, off: r2.dim, hover: r2.hover }} />
      <EdgeLight matrix={L2} x={fw2} h={h2} />

      <Prism gx={g3x} gy={g3y} w={w3} d={w3} z0={h1 + h2} h={h3} />

      <line className="mast" x1={mx} y1={my} x2={mx} y2={my - 34} />
      <Beacon x={mx} y={my - 34} delay={0.4} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* DSC: twin towers joined by a sky bridge.                            */
/* ------------------------------------------------------------------ */

function Dish({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <line className="mast" x1={0} y1={0} x2={0} y2={-12} />
      <ellipse className="dish" cx={0} cy={-16} rx={13} ry={6.5} transform="rotate(-24 0 -16)" />
      <line className="mast" x1={0} y1={-16} x2={9} y2={-27} />
    </g>
  );
}

function Twin({ spot }: { spot: CitySpot }) {
  const w = 2.0;
  const gap = 1.3;
  const y0 = spot.gy + 0.3;
  const x1 = spot.gx + 0.3;
  const x2 = x1 + w + gap;
  const h1 = 236;
  const h2 = 292;
  const fw = w * CELL;
  const bridgeZ = 138;

  const spec1 = { fw, fh: h1, cols: 5, rows: 15, mx: 8, top: 12, bottom: 10, fillX: 0.56, fillY: 0.42, lit: 0.5, warm: 0.3 };
  const spec2 = { ...spec1, fh: h2, rows: 19 };

  const [dx, dy] = P(x1 + 1, y0 + 1, h1 + 8);
  const [ax, ay] = P(x2 + 1, y0 + 1, h2 + 8);

  return (
    <g>
      <Prism gx={x1} gy={y0} w={w} d={w} h={h1} />
      <Windows matrix={faceL(x1, y0, w)} spec={{ ...spec1, seed: 81 }} />
      <Windows matrix={faceR(x1, y0, w, w)} spec={{ ...spec1, seed: 82 }} />
      <EdgeLight matrix={faceL(x1, y0, w)} x={fw} h={h1} />
      <Prism gx={x1 + 0.25} gy={y0 + 0.25} w={w - 0.5} d={w - 0.5} z0={h1} h={8} />
      <Dish x={dx} y={dy} />

      {/* Sky bridge */}
      <Prism gx={x1 + w} gy={y0 + 0.7} w={gap} d={0.6} z0={bridgeZ} h={18} className="edge glass" />
      <WindowLayers matrix={faceL(x1 + w, y0 + 0.7, 0.6, bridgeZ)} paths={{ cool: rect(5, 5, gap * CELL - 10, 8) }} />

      <Prism gx={x2} gy={y0} w={w} d={w} h={h2} />
      <Windows matrix={faceL(x2, y0, w)} spec={{ ...spec2, seed: 83 }} />
      <Windows matrix={faceR(x2, y0, w, w)} spec={{ ...spec2, seed: 84 }} />
      <EdgeLight matrix={faceL(x2, y0, w)} x={fw} h={h2} />
      <Prism gx={x2 + 0.25} gy={y0 + 0.25} w={w - 0.5} d={w - 0.5} z0={h2} h={8} />
      <line className="mast" x1={ax} y1={ay} x2={ax} y2={ay - 40} />
      <Beacon x={ax} y={ay - 40} delay={1.1} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* CICE: a tiered cylinder with an observation ring and a radar.       */
/* ------------------------------------------------------------------ */


function Ring({ cx, cy, r, z, front }: { cx: number; cy: number; r: number; z: number; front: boolean }) {
  const [X, Y] = P(cx, cy, z);
  const { rx, ry } = ellipseR(r);
  const d = front ? `M${X - rx} ${Y}A${rx} ${ry} 0 0 0 ${X + rx} ${Y}` : `M${X - rx} ${Y}A${rx} ${ry} 0 0 1 ${X + rx} ${Y}`;
  return <path className="ring" d={d} />;
}

const TIERS = [
  { r: 1.9, z0: 0, h: 112, rows: 4, slots: 15 },
  { r: 1.45, z0: 112, h: 82, rows: 3, slots: 12 },
  { r: 1.0, z0: 194, h: 58, rows: 2, slots: 9 },
] as const;

function Tiered({ spot }: { spot: CitySpot }) {
  const cx = spot.gx + spot.w / 2;
  const cy = spot.gy + spot.d / 2;
  const top = TIERS[2].z0 + TIERS[2].h;
  const [X, Ytop] = P(cx, cy, top);
  const { rx: domeRx } = ellipseR(TIERS[2].r);
  const ringZ = 150;

  return (
    <g>
      <Prism gx={spot.gx} gy={spot.gy} w={spot.w} d={spot.d} h={8} className="edge plinth" />

      <Ring cx={cx} cy={cy} r={2.4} z={ringZ} front={false} />

      {TIERS.map((t, i) => {
        const [tx, ty] = P(cx, cy, t.z0 + t.h);
        const { rx, ry } = ellipseR(t.r);
        const win = cylWindows({ cx, cy, r: t.r, z0: t.z0, h: t.h, slots: t.slots, rows: t.rows, lit: 0.5, warm: 0.45, seed: 91 + i });
        return (
          <g key={i}>
            <path className="cyl edge" d={cylBody(cx, cy, t.r, t.z0, t.h)} fill="url(#jc-cyl)" />
            <WindowLayers matrix="" paths={win} />
            <ellipse className="edge" cx={tx} cy={ty} rx={rx} ry={ry} fill="url(#jc-top)" />
          </g>
        );
      })}

      <Ring cx={cx} cy={cy} r={2.4} z={ringZ} front />

      {/* Dome, mast and radar sweep */}
      <path className="edge" fill="url(#jc-top)" d={`M${X - domeRx} ${Ytop}A${domeRx} 24 0 0 1 ${X + domeRx} ${Ytop}Z`} />
      <line className="mast" x1={X} y1={Ytop - 22} x2={X} y2={Ytop - 52} />
      <g transform={groundM(cx, cy, top + 52)}>
        <g className="radar-spin">
          <line className="radar-arm" x1={0} y1={0} x2={30} y2={0} />
          <circle className="radar-tip" cx={30} cy={0} r={2.6} />
        </g>
      </g>
      <Beacon x={X} y={Ytop - 52} delay={0.7} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* ROBOTICS: a sawtooth workshop with a robot arm outside.             */
/* ------------------------------------------------------------------ */

function hazard(width: number): string {
  let d = "";
  for (let x = 0; x + 12 <= width; x += 12) d += `M${x} 0h6l6 6h-6Z`;
  return d;
}

function Workshop({ spot }: { spot: CitySpot }) {
  const bx = spot.gx + 0.3;
  const by = spot.gy + 0.3;
  const bw = 4.0;
  const bd = 2.6;
  const h = 78;
  const fwL = bw * CELL;
  const fwR = bd * CELL;
  const L = faceL(bx, by, bd);
  const R = faceR(bx, by, bw, bd);

  // Side windows: a strip of six on the long wall (right of the roller door)
  const rand = rng(97);
  let winOn = "";
  let winOff = "";
  let winHover = "";
  for (let i = 0; i < 6; i++) {
    const r = rect(112 + i * 17, 34, 11, 22);
    if (rand() < 0.62) winOn += r;
    else {
      winOff += r;
      if (rand() < 0.5) winHover += r;
    }
  }
  const sideWin = windowGrid({ fw: fwR, fh: h, cols: 4, rows: 1, mx: 14, top: 22, bottom: 20, fillX: 0.55, fillY: 1, lit: 0.55, warm: 0.8, seed: 98 });

  // Roof teeth (sawtooth) along x
  const y0 = by + 0.25;
  const y1 = by + bd - 0.25;
  const th = 26;
  const teeth = [0, 1, 2, 3].map((i) => {
    const xa = bx + i * 1.0;
    const xb = xa + 1.0;
    return {
      slope: pts([P(xa, y0, h), P(xb, y0, h + th), P(xb, y1, h + th), P(xa, y1, h)]),
      glass: pts([P(xb, y0, h), P(xb, y1, h), P(xb, y1, h + th), P(xb, y0, h + th)]),
      end: pts([P(xa, y1, h), P(xb, y1, h), P(xb, y1, h + th)]),
      key: i,
    };
  });

  // Robot arm standing beside the workshop
  const [ax, ay] = P(spot.gx + 5.1, spot.gy + 2.75, 0);
  // Crates by the door
  const crateA = { gx: bx + 0.5, gy: by + bd + 0.25 };
  const crateB = { gx: bx + 1.05, gy: by + bd + 0.45 };

  return (
    <g>
      <Prism gx={spot.gx} gy={spot.gy} w={spot.w} d={spot.d} h={4} className="edge plinth" />
      <Prism gx={bx} gy={by} w={bw} d={bd} h={h} />

      {/* Long wall: door, windows, hazard stripe */}
      <WindowLayers matrix={L} paths={{ warm: winOn, off: winOff, hover: winHover }} />
      <g transform={L}>
        <rect className="door" x={22} y={6} width={66} height={46} />
        <path className="door-slat" d={Array.from({ length: 7 }, (_, k) => rect(26, 9 + k * 6, 58, 2)).join("")} />
        <path className="hazard" d={hazard(fwL)} />
      </g>
      <EdgeLight matrix={L} x={fwL} h={h} tone="warm" />

      {/* Short wall: windows and the gear emblem */}
      <WindowLayers matrix={R} paths={sideWin} />
      <g transform={R}>
        <path className="gear-emblem" d={gearPath(fwR / 2, 56, 14, 10, 6)} />
        <circle className="gear-emblem" cx={fwR / 2} cy={56} r={5} />
      </g>

      {/* Sawtooth roof, drawn back to front */}
      {teeth.map((t) => (
        <g key={t.key} className="edge">
          <polygon points={t.end} fill="url(#jc-left)" />
          <polygon points={t.glass} fill="url(#jc-glass)" />
          <polygon points={t.slope} fill="url(#jc-roof)" />
        </g>
      ))}

      <Prism gx={crateA.gx} gy={crateA.gy} w={0.5} d={0.5} h={16} />
      <Prism gx={crateB.gx} gy={crateB.gy} w={0.45} d={0.45} h={11} />

      {/* Robot arm */}
      <g transform={`translate(${ax} ${ay})`}>
        <ellipse className="arm-base" cx={0} cy={0} rx={17} ry={8.5} />
        <rect className="arm-post" x={-4} y={-14} width={8} height={14} />
        <g transform="translate(0 -14)">
          <g className="arm-a">
            <line className="arm" x1={0} y1={0} x2={0} y2={-42} />
            <circle className="arm-joint" cx={0} cy={-42} r={4} />
            <g transform="translate(0 -42)">
              <g className="arm-b">
                <line className="arm" x1={0} y1={0} x2={34} y2={-14} />
                <line className="arm" x1={34} y1={-14} x2={41} y2={-21} />
                <line className="arm" x1={34} y1={-14} x2={42} y2={-8} />
                <circle className="arm-joint" cx={34} cy={-14} r={2.8} />
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */

const SILHOUETTES: Record<Silhouette, ComponentType<{ spot: CitySpot }>> = {
  die: Die,
  spire: Spire,
  twin: Twin,
  tiered: Tiered,
  workshop: Workshop,
  stage: Stage,
  studio: Studio,
  hall: Hall,
  vinyl: Vinyl,
};

export const Silhouettes = memo(function Silhouettes({ spot }: { spot: CitySpot }) {
  const Shape = SILHOUETTES[spot.silhouette];
  return <Shape spot={spot} />;
});
