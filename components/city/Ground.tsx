import { memo, type CSSProperties } from "react";
import type { CityLayout } from "@/lib/city";
import { CELL, HALF_H, HALF_W, P, groundM, path, pts } from "@/lib/iso";
import { Prism, cylBody } from "./parts";

/**
 * Everything at ground level. Never changes after mount, so it is memoised and
 * React never touches it again (hover only re-renders the two affected buildings).
 * Traffic is the only moving part here: a handful of tiny lines animated with transform.
 */

const SLAB = 28;

const circlePath = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

const coneTree = (x: number, y: number) => `M${x - 6} ${y}L${x} ${y - 24}L${x + 6} ${y}ZM${x - 4} ${y - 9}L${x} ${y - 30}L${x + 4} ${y - 9}Z`;
/** A lollipop tree: trunk and a round crown. */
const roundTree = (x: number, y: number) => `M${x - 1.3} ${y}v-13h2.6v13Z` + circlePath(x, y - 20, 8.5);

function Ground({ layout }: { layout: CityLayout }) {
  const N = layout.size;
  const ave = layout.avenues;
  const ax = ave.find((a) => a.axis === "x");
  const ay = ave.find((a) => a.axis === "y");
  const cx = ay?.at ?? N / 2; // x of the vertical avenue
  const cy = ax?.at ?? N / 2;

  /* --- island body --- */
  const top = [P(0, 0), P(N, 0), P(N, N), P(0, N)];
  const sideL = [P(0, N, 0), P(N, N, 0), P(N, N, -SLAB), P(0, N, -SLAB)];
  const sideR = [P(N, 0, 0), P(N, N, 0), P(N, N, -SLAB), P(N, 0, -SLAB)];
  const inset = 6;
  const zLow = -SLAB - 170;
  const underL = [P(0, N, -SLAB), P(N, N, -SLAB), P(N - inset, N - inset, zLow), P(inset, N - inset, zLow)];
  const underR = [P(N, 0, -SLAB), P(N, N, -SLAB), P(N - inset, N - inset, zLow), P(N - inset, inset, zLow)];

  /* --- grid every two cells --- */
  let grid = "";
  for (let i = 2; i < N; i += 2) grid += `M${P(i, 0).join(" ")}L${P(i, N).join(" ")}M${P(0, i).join(" ")}L${P(N, i).join(" ")}`;

  /* --- avenues --- */
  const roads = ave.map((a) => {
    const lo = a.at - a.width / 2;
    const hi = a.at + a.width / 2;
    return a.axis === "x" ? [P(0, lo), P(N, lo), P(N, hi), P(0, hi)] : [P(lo, 0), P(hi, 0), P(hi, N), P(lo, N)];
  });
  const curbs = ave
    .map((a) => {
      const lo = a.at - a.width / 2;
      const hi = a.at + a.width / 2;
      return a.axis === "x"
        ? `M${P(0, lo).join(" ")}L${P(N, lo).join(" ")}M${P(0, hi).join(" ")}L${P(N, hi).join(" ")}`
        : `M${P(lo, 0).join(" ")}L${P(lo, N).join(" ")}M${P(hi, 0).join(" ")}L${P(hi, N).join(" ")}`;
    })
    .join("");
  const lanes = `M${P(0, cy).join(" ")}L${P(N, cy).join(" ")}M${P(cx, 0).join(" ")}L${P(cx, N).join(" ")}`;

  /* --- crosswalks on each approach to the junction --- */
  let cross = "";
  const cw = 0.15;
  for (let k = 0; k < 5; k++) {
    const t = -0.85 + k * 0.34;
    const quad = (a: [number, number], b: [number, number], c: [number, number], d: [number, number]) => path([P(...a), P(...b), P(...c), P(...d)]);
    cross += quad([cx - 1.5, cy + t], [cx - 1.15, cy + t], [cx - 1.15, cy + t + cw], [cx - 1.5, cy + t + cw]);
    cross += quad([cx + 1.15, cy + t], [cx + 1.5, cy + t], [cx + 1.5, cy + t + cw], [cx + 1.15, cy + t + cw]);
    cross += quad([cx + t, cy - 1.5], [cx + t + cw, cy - 1.5], [cx + t + cw, cy - 1.15], [cx + t, cy - 1.15]);
    cross += quad([cx + t, cy + 1.15], [cx + t + cw, cy + 1.15], [cx + t + cw, cy + 1.5], [cx + t, cy + 1.5]);
  }

  /* --- street lamps along both curbs, skipping the junction --- */
  let poles = "";
  let lamps = "";
  let glows = "";
  const lampAt = (gx: number, gy: number) => {
    const [x, y] = P(gx, gy, 0);
    poles += `M${x} ${y}v-20`;
    lamps += circlePath(x, y - 21, 2.4);
    glows += circlePath(x, y - 21, 8);
  };
  const near = (v: number, c: number) => Math.abs(v - c) < 1.9;
  for (let k = 0.6; k < N; k += 2) {
    if (!near(k, cx)) {
      lampAt(k, cy - 1.15);
      lampAt(k, cy + 1.15);
    }
    if (!near(k, cy)) {
      lampAt(cx - 1.15, k);
      lampAt(cx + 1.15, k);
    }
  }

  /* --- trees, pad and yard: set dressing comes from the layout (lib/city.ts) --- */
  const { dressing } = layout;
  const treeAt = dressing.treeKind === "round" ? roundTree : coneTree;
  const trees = dressing.trees.map(([gx, gy]) => treeAt(...P(gx, gy, 0))).join("");
  const pad = dressing.pad;
  const yard = dressing.yard;

  const plaza = P(cx, cy, 0);

  /* --- traffic lanes --- */
  const lane = (axis: "x" | "y", at: number, reverse: boolean, delay: number, dur: number) => {
    const start = axis === "x" ? P(0, at) : P(at, 0);
    const vec = axis === "x" ? [N * HALF_W, N * HALF_H] : [-N * HALF_W, N * HALF_H];
    const dir = axis === "x" ? [12, 6] : [-12, 6];
    return { start, vec, dir, reverse, delay, dur, key: `${axis}${at}${delay}` };
  };
  const traffic = [
    lane("x", cy - 0.45, false, -1, 11),
    lane("x", cy - 0.45, false, -6.5, 11),
    lane("x", cy + 0.45, true, -3, 13),
    lane("y", cx - 0.45, false, -2, 12),
    lane("y", cx + 0.45, true, -8, 10),
    lane("y", cx + 0.45, true, -3, 10),
  ];

  return (
    <g>
      {/* Island body */}
      <polygon points={pts(underL)} fill="url(#jc-under-l)" className="under" />
      <polygon points={pts(underR)} fill="url(#jc-under-r)" className="under" />
      <polygon points={pts(sideL)} fill="url(#jc-slab-l)" className="slab-edge" />
      <polygon points={pts(sideR)} fill="url(#jc-slab-r)" className="slab-edge" />
      <polygon points={pts(top)} fill="url(#jc-ground)" className="slab-top" />
      <path d={grid} className="grid-lines" />

      {/* Avenues */}
      {roads.map((r, i) => (
        <polygon key={i} points={pts(r)} className="road" />
      ))}
      <path d={curbs} className="curb" />
      <path d={lanes} className="lane" />
      <path d={cross} className="crosswalk" />

      {/* Plot pads for each building */}
      {layout.spots.map((s) => (
        <polygon key={s.clubId} points={pts([P(s.gx, s.gy), P(s.gx + s.w, s.gy), P(s.gx + s.w, s.gy + s.d), P(s.gx, s.gy + s.d)])} className="plot" />
      ))}

      {/* Plaza */}
      <g transform={groundM(cx, cy)}>
        <circle className="plaza-ring" r={CELL * 1.05} />
        <circle className="plaza-ring plaza-ring-dash" r={CELL * 0.72} />
      </g>
      <path className="edge plaza-core" d={cylBody(cx, cy, 0.42, 0, 14)} fill="url(#jc-cyl)" />
      <ellipse className="plaza-top" cx={plaza[0]} cy={plaza[1] - 14} rx={28.5} ry={14.3} />

      {/* Pad: a landing pad (Technical) or a busking circle (Music) */}
      {pad && (
        <g transform={groundM(pad.gx, pad.gy)}>
          <circle className="pad" r={CELL * 0.62} />
          <circle className="pad pad-inner" r={CELL * 0.42} />
          <path className="pad-h" d={pad.mark === "note" ? "M-6 7a4.2 3.1 0 1 0 8.4 0a4.2 3.1 0 1 0 -8.4 0M2.4 7V-10l8 3.2" : "M-7 -9v18M7 -9v18M-7 0h14"} />
        </g>
      )}

      {/* Yard: a fenced compound (substation, or a stack of flight cases) */}
      {yard && (
        <g>
          <polygon
            className="fence"
            points={pts([P(yard.fence[0], yard.fence[1]), P(yard.fence[2], yard.fence[1]), P(yard.fence[2], yard.fence[3]), P(yard.fence[0], yard.fence[3])])}
          />
          {yard.blocks.map(([gx, gy, w, d, h]) => (
            <Prism key={`${gx}-${gy}`} gx={gx} gy={gy} w={w} d={d} h={h} />
          ))}
        </g>
      )}

      {/* Furniture */}
      <path d={trees} className="tree" />
      <path d={poles} className="pole" />
      <path d={glows} className="lamp-glow" />
      <path d={lamps} className="lamp-dot" />

      {/* Traffic: tiny light packets driving the avenues (transform-only animation) */}
      <g className="traffic">
        {traffic.map((t) => (
          <g key={t.key} transform={`translate(${t.start[0]} ${t.start[1]})`}>
            <line
              className="packet"
              x1={0}
              y1={0}
              x2={t.dir[0]}
              y2={t.dir[1]}
              style={
                {
                  "--dx": `${t.vec[0]}px`,
                  "--dy": `${t.vec[1]}px`,
                  animationDuration: `${t.dur}s`,
                  animationDelay: `${t.delay}s`,
                  animationDirection: t.reverse ? "reverse" : "normal",
                } as CSSProperties
              }
            />
          </g>
        ))}
      </g>
    </g>
  );
}

export default memo(Ground);
