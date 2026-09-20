import { memo } from "react";
import type { CityLayout, IsletKind } from "@/lib/city";
import { CELL, P, faceL, pts } from "@/lib/iso";
import { Beacon, Prism } from "./parts";

/**
 * Scenery around the main island. Static except for one drone and the beacons.
 * Islets are what you find when you drag the camera to the edges.
 */

interface Islet {
  x: number;
  y: number;
  s: number;
  o: number;
}

/** Where the eight islets float. What sits on each comes from the layout (`dressing.islets`). */
const ISLETS: Islet[] = [
  { x: -1010, y: 120, s: 0.62, o: 0.9 },
  { x: -930, y: 610, s: 0.5, o: 0.8 },
  { x: -1130, y: 400, s: 0.3, o: 0.55 },
  { x: 930, y: 60, s: 0.56, o: 0.9 },
  { x: 990, y: 560, s: 0.66, o: 0.85 },
  { x: 1120, y: 300, s: 0.3, o: 0.55 },
  { x: -420, y: -250, s: 0.28, o: 0.45 },
  { x: 520, y: -230, s: 0.24, o: 0.4 },
];

const K = 4; // islet size in cells
const T = 16;

function IsletShape({ islet, kind }: { islet: Islet; kind: IsletKind }) {
  const top = [P(0, 0), P(K, 0), P(K, K), P(0, K)];
  const sl = [P(0, K, 0), P(K, K, 0), P(K, K, -T), P(0, K, -T)];
  const sr = [P(K, 0, 0), P(K, K, 0), P(K, K, -T), P(K, 0, -T)];
  const ul = [P(0, K, -T), P(K, K, -T), P(K - 1.4, K - 1.4, -T - 90), P(1.4, K - 1.4, -T - 90)];
  const ur = [P(K, 0, -T), P(K, K, -T), P(K - 1.4, K - 1.4, -T - 90), P(K - 1.4, 1.4, -T - 90)];
  const [px, py] = P(K / 2, K / 2, 0);

  return (
    <g transform={`translate(${islet.x} ${islet.y}) scale(${islet.s})`} opacity={islet.o}>
      <polygon points={pts(ul)} fill="url(#jc-under-l)" className="under" />
      <polygon points={pts(ur)} fill="url(#jc-under-r)" className="under" />
      <polygon points={pts(sl)} fill="url(#jc-slab-l)" className="slab-edge" />
      <polygon points={pts(sr)} fill="url(#jc-slab-r)" className="slab-edge" />
      <polygon points={pts(top)} fill="url(#jc-ground)" className="slab-top" />
      {kind === "cube" && <Prism gx={1.2} gy={1.2} w={1.6} d={1.6} h={70} />}
      {kind === "pylon" && (
        <>
          <Prism gx={1.7} gy={1.7} w={0.6} d={0.6} h={150} />
          <Beacon x={px} y={py - 158} delay={1.6} />
        </>
      )}
      {kind === "dish" && (
        <g transform={`translate(${px} ${py})`}>
          <line className="mast" x1={0} y1={0} x2={0} y2={-46} />
          <ellipse className="dish" cx={0} cy={-52} rx={26} ry={13} transform="rotate(-24 0 -52)" />
        </g>
      )}
      {kind === "pad" && <ellipse className="pad" cx={px} cy={py} rx={60} ry={30} />}
      {kind === "speaker" && (
        <g>
          <Prism gx={1.2} gy={1.2} w={1.6} d={1.6} h={86} />
          <g transform={faceL(1.2, 1.2, 1.6)}>
            <circle className="spk-cone" cx={CELL * 0.8} cy={32} r={20} />
            <circle className="spk-ring" cx={CELL * 0.8} cy={32} r={11} />
            <circle className="spk-dust" cx={CELL * 0.8} cy={32} r={4} />
            <circle className="spk-cone" cx={CELL * 0.8} cy={68} r={8} />
          </g>
        </g>
      )}
      {kind === "mic" && (
        <g transform={`translate(${px} ${py})`}>
          <line className="mast" x1={0} y1={0} x2={0} y2={-40} />
          <ellipse className="mic-body" cx={0} cy={-56} rx={9} ry={14} />
          <path className="mic-grille" d="M-7 -62h14M-8 -56h16M-7 -50h14" />
        </g>
      )}
    </g>
  );
}

/** Faint dashed light links from the main island to the nearest islets. */
function Links({ layout }: { layout: CityLayout }) {
  const N = layout.size;
  const left = P(0, N, 0);
  const right = P(N, 0, 0);
  const back = P(0, 0, 0);
  const d = [
    `M${left[0]} ${left[1]}L${ISLETS[0].x + 140} ${ISLETS[0].y + 60}`,
    `M${left[0]} ${left[1] + 10}L${ISLETS[1].x + 130} ${ISLETS[1].y + 30}`,
    `M${right[0]} ${right[1]}L${ISLETS[3].x + 100} ${ISLETS[3].y + 60}`,
    `M${right[0]} ${right[1] + 10}L${ISLETS[4].x + 120} ${ISLETS[4].y + 60}`,
    `M${back[0]} ${back[1]}L${ISLETS[6].x + 60} ${ISLETS[6].y + 30}`,
  ].join("");
  return <path className="link" d={d} />;
}

function Scenery({ layout }: { layout: CityLayout }) {
  return (
    <g>
      <Links layout={layout} />
      {ISLETS.map((i, k) => (
        <IsletShape key={k} islet={i} kind={layout.dressing.islets[k] ?? "cube"} />
      ))}
    </g>
  );
}

export const CityScenery = memo(Scenery);

/** The plaza's light column. Painted in depth order with the buildings so nearer buildings hide its base. */
function Beam({ layout }: { layout: CityLayout }) {
  const [bx, by] = P(...plazaOf(layout), 0);
  return (
    <g>
      <rect className="beam" x={bx - 3} y={by - 230} width={6} height={224} fill="url(#jc-beam)" />
      <polygon className="beam-gem" points={`${bx},${by - 252} ${bx + 7},${by - 241} ${bx},${by - 230} ${bx - 7},${by - 241}`} />
    </g>
  );
}

export const CityBeam = memo(Beam);

/** Grid position of the plaza (where the avenues cross). */
export function plazaOf(layout: CityLayout): [number, number] {
  const cx = layout.avenues.find((a) => a.axis === "y")?.at ?? layout.size / 2;
  const cy = layout.avenues.find((a) => a.axis === "x")?.at ?? layout.size / 2;
  return [cx, cy];
}

/** Drawn after everything: things that fly. Only cities whose pad has a drone get one. */
function Drone({ layout }: { layout: CityLayout }) {
  const pad = layout.dressing.pad;
  if (!pad?.drone) return null;
  const [dx, dy] = P(pad.gx, pad.gy, 30);
  return (
    <g transform={`translate(${dx} ${dy})`}>
      <g className="drone">
        <ellipse className="drone-body" cx={0} cy={0} rx={7} ry={3.2} />
        <path className="drone-arm" d="M-13 -4l8 3M13 -4l-8 3" />
        <circle className="drone-light" cx={0} cy={4} r={1.6} />
      </g>
    </g>
  );
}

export const CityDrone = memo(Drone);
