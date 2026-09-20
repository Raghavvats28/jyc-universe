import type { CitySpot } from "@/lib/city";
import { CELL, P, cylWindows, ellipseR, faceL, faceR, groundM, path, pts, rect, rng, windowGrid } from "@/lib/iso";
import { Beacon, EdgeLight, FaceText, Prism, WindowLayers, cylBody } from "./parts";

/**
 * Silhouettes for the Music city. Same rules as buildings.tsx: each one is a pure function of its
 * plot, hover styling is CSS (see city.css, "Music" section), and the only thing that ever moves is
 * the tiny EQ on the stage marquee.
 *
 *   Stage   (Band)           fly tower with a lit proscenium, a deck, speaker stacks, a truss and a marquee
 *   Studio  (Vocals)         a padded round drum, a control room with waveform windows, a mic on the roof
 *   Hall    (Instrumentals)  a concert hall with an arcade and a row of organ pipes rising from the roof
 *   Vinyl   (DJ)             a record: low and round, grooved top, label, tonearm, speaker towers
 *
 * Face coordinates: inside faceL / faceR groups, x runs along the wall and y is UP from the wall's
 * base, so windows, sign text and speaker cones are drawn as plain rects and circles (lib/iso.ts).
 */

const r1 = (n: number) => Math.round(n * 10) / 10;

/* ------------------------------------------------------------------ */
/* Shared little pieces                                                */
/* ------------------------------------------------------------------ */

/** A speaker cabinet: woofer and tweeter on the left face, grille slats on the right face. */
function Cabinet({ gx, gy, s, z0, h, tweeter = true }: { gx: number; gy: number; s: number; z0: number; h: number; tweeter?: boolean }) {
  const fw = s * CELL;
  const rw = Math.min(fw * 0.34, h * (tweeter ? 0.3 : 0.36));
  const cyW = tweeter ? h * 0.36 : h * 0.5;
  let slats = "";
  for (let y = 6; y < h - 5; y += 5) slats += rect(5, y, fw - 10, 1.3);
  return (
    <g>
      <Prism gx={gx} gy={gy} w={s} d={s} z0={z0} h={h} />
      <g transform={faceL(gx, gy, s, z0)}>
        <circle className="spk-cone" cx={r1(fw / 2)} cy={r1(cyW)} r={r1(rw)} />
        <circle className="spk-ring" cx={r1(fw / 2)} cy={r1(cyW)} r={r1(rw * 0.58)} />
        <circle className="spk-dust" cx={r1(fw / 2)} cy={r1(cyW)} r={r1(rw * 0.2)} />
        {tweeter && <circle className="spk-cone" cx={r1(fw / 2)} cy={r1(h * 0.8)} r={r1(rw * 0.34)} />}
      </g>
      <g transform={faceR(gx, gy, s, s, z0)}>
        <path className="spk-grille" d={slats} />
      </g>
    </g>
  );
}

/**
 * A window with an audio waveform in it: mirrored bars around the centre line.
 * `lit` bars are always on; `dim` bars (and the pane) switch on when the building is hovered.
 */
function waveWindow(x: number, y: number, w: number, h: number, seed: number) {
  const rand = rng(seed);
  const n = Math.max(4, Math.floor((w - 8) / 3.6));
  const mid = y + h / 2;
  let lit = "";
  let dim = "";
  for (let i = 0; i < n; i++) {
    const env = Math.pow(Math.sin(((i + 0.5) / n) * Math.PI), 0.6);
    const bh = Math.max(2, (0.18 + 0.82 * rand()) * env * (h - 9));
    const bar = rect(x + 4 + i * 3.6, mid - bh / 2, 2.2, bh);
    if (rand() < 0.7) lit += bar;
    else dim += bar;
  }
  return { pane: rect(x, y, w, h), lit, dim };
}

/** Front-half arc of a ground circle at height z (a ring around the front of a drum). */
function frontArc(cx: number, cy: number, r: number, z: number): string {
  const [X, Y] = P(cx, cy, z);
  const { rx, ry } = ellipseR(r);
  return `M${X - rx} ${Y}A${rx} ${ry} 0 0 0 ${X + rx} ${Y}`;
}

/** A quad on the visible half of a cylinder between two angles (0 to PI, PI/2 faces the viewer). */
function cylQuad(cx: number, cy: number, r: number, z0: number, a1: number, a2: number, zb: number, zt: number): string {
  const { rx, ry } = ellipseR(r);
  const [X, Y] = P(cx, cy, z0);
  const pt = (a: number, z: number) => [r1(X + rx * Math.cos(a)), r1(Y + ry * Math.sin(a) - z)] as const;
  return path([pt(a1, zb), pt(a2, zb), pt(a2, zt), pt(a1, zt)]);
}

/* ------------------------------------------------------------------ */
/* BAND: the stage                                                     */
/* ------------------------------------------------------------------ */

/** Marquee EQ bars: [height in px, cycle in s, delay in s]. Heights are the still frame on lite/static tiers. */
const EQ_BARS: Array<[number, number, number]> = [
  [9, 0.95, -0.2],
  [15, 1.25, -0.7],
  [19, 0.85, -0.4],
  [12, 1.5, -1.1],
  [17, 1.05, -0.1],
  [10, 1.35, -0.9],
  [14, 0.9, -0.5],
];

export function Stage({ spot }: { spot: CitySpot }) {
  const x0 = spot.gx + 0.3;
  const y0 = spot.gy + 0.3;
  const w1 = spot.w - 0.6;
  const d1 = 2.0;
  const h1 = 176;
  const fw = w1 * CELL;
  const fwR = d1 * CELL;
  const L = faceL(x0, y0, d1);
  const R = faceR(x0, y0, w1, d1);

  // The deck (stage floor) in front of the tower
  const yF = y0 + d1;
  const dd = 1.9;
  const deckH = 22;

  // Proscenium opening on the tower's front wall
  const ox = 34;
  const ow = fw - 68;
  const oy = 30;
  const oh = 98;
  const mid = ox + ow / 2;

  // Marquee plate above the opening
  const mw = 172;
  const mx = fw / 2 - mw / 2;
  const my = 140;

  let bulbs = "";
  let bulbsHover = "";
  for (let i = 0; i < 14; i++) {
    const x = mx + 8 + i * 11.6;
    bulbs += rect(x, my + 2.5, 3, 3);
    bulbsHover += rect(x + 5.8, my + 2.5, 3, 3);
    bulbs += rect(x + 5.8, my + 24.5, 3, 3);
    bulbsHover += rect(x, my + 24.5, 3, 3);
  }

  let foot = "";
  for (let x = 8; x < fw - 10; x += 12) foot += rect(x, 15, 3, 3);

  let folds = "";
  for (let x = ox + 3; x < ox + 22; x += 4.5) folds += rect(x, oy, 1.1, oh);
  for (let x = ox + ow - 22; x < ox + ow - 3; x += 4.5) folds += rect(x, oy, 1.1, oh);

  // Side window strips either side of the opening
  const strip = { fw: 22, fh: 104, cols: 2, rows: 9, mx: 2, top: 6, bottom: 6, fillX: 0.55, fillY: 0.4, lit: 0.55, warm: 0.9 };
  const sideWin = windowGrid({ fw: fwR, fh: h1, cols: 3, rows: 9, mx: 10, top: 14, bottom: 10, fillX: 0.5, fillY: 0.36, lit: 0.5, warm: 0.9, seed: 141 });

  // Speaker stacks at the ends of the deck
  const sx = 0.85;
  const stackY = yF + 0.28;
  const leftX = x0 + 0.2;
  const rightX = x0 + w1 - 0.2 - sx;

  // Truss with three lights, and their pools on the deck
  const yT = yF + dd - 0.32;
  const zT = deckH + 92;
  const xa = x0 + 1.35;
  const xb = x0 + w1 - 1.35;
  const xs = [xa + 0.5, (xa + xb) / 2, xb - 0.5];
  const yP = yF + 0.8;

  const [ax, ay] = P(x0 + w1 - 0.75, y0 + 0.65, h1 + 10);

  return (
    <g>
      <Prism gx={spot.gx} gy={spot.gy} w={spot.w} d={spot.d} h={5} className="edge plinth" />

      {/* Fly tower */}
      <Prism gx={x0} gy={y0} w={w1} d={d1} h={h1} />
      <WindowLayers matrix={R} paths={sideWin} />
      <WindowLayers matrix={`${L} translate(8 22)`} paths={windowGrid({ ...strip, seed: 142 })} />
      <WindowLayers matrix={`${L} translate(${fw - 30} 22)`} paths={windowGrid({ ...strip, seed: 143 })} />

      {/* Proscenium: a lit opening with curtains, a drum kit and two mic stands as silhouettes */}
      <g transform={L}>
        <rect className="pro-void" x={ox} y={oy} width={ow} height={oh} />
        <rect x={ox} y={oy} width={ow} height={oh} fill="url(#jc-stage)" />
        <g className="pro-cast">
          <circle cx={r1(mid)} cy={oy + 14} r={13} />
          <circle cx={r1(mid - 19)} cy={oy + 31} r={6.5} />
          <circle cx={r1(mid + 19)} cy={oy + 31} r={6.5} />
          <path d={rect(mid - 46, oy + 36, 20, 1.8) + rect(mid + 26, oy + 32, 20, 1.8) + rect(mid - 37, oy + 8, 1.3, 29) + rect(mid + 36, oy + 8, 1.3, 25)} />
          <path d={rect(ox + ow * 0.2, oy, 1.6, 46) + rect(ox + ow * 0.8, oy, 1.6, 46)} />
          <circle cx={r1(ox + ow * 0.2 + 0.8)} cy={oy + 50} r={3.6} />
          <circle cx={r1(ox + ow * 0.8 + 0.8)} cy={oy + 50} r={3.6} />
        </g>
        <path className="pro-curtain" d={folds} />
        <rect className="pro-frame" x={ox} y={oy} width={ow} height={oh} />
      </g>

      {/* Marquee: bulbs, LIVE, and the one animated thing in this city (the EQ) */}
      <g transform={L}>
        <rect className="mq-plate" x={mx} y={my} width={mw} height={30} />
        <path className="mq-bulb" d={bulbs} />
        <path className="mq-bulb mq-bulb-hover" d={bulbsHover} />
      </g>
      <FaceText matrix={L} x={mx + 38} y={my + 15.5} size={15} spacing={2.4} className="sign-text sign-accent">
        LIVE
      </FaceText>
      <g transform={L}>
        {EQ_BARS.map(([bh, dur, delay], i) => (
          <rect
            key={i}
            className="eq-bar"
            x={r1(mx + 88 + i * 10)}
            y={my + 6}
            width={6}
            height={bh}
            style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
          />
        ))}
      </g>
      <EdgeLight matrix={L} x={fw} h={h1} />

      {/* Roof */}
      <Prism gx={x0 + 0.35} gy={y0 + 0.3} w={w1 - 0.7} d={d1 - 0.6} z0={h1} h={10} />
      <line className="mast" x1={ax} y1={ay} x2={ax} y2={ay - 34} />
      <Beacon x={ax} y={ay - 34} delay={0.5} />

      {/* Deck, footlights and pools of light */}
      <Prism gx={x0} gy={yF} w={w1} d={dd} h={deckH} className="edge plinth" />
      <g transform={faceL(x0, yF, dd, 0)}>
        <path className="mq-bulb" d={foot} />
      </g>
      {xs.map((x, i) => (
        <g key={`pool${i}`} transform={groundM(x, yP, deckH)}>
          <circle className="deck-pool" r={CELL * 0.42} />
        </g>
      ))}
      {xs.map((x, i) => (
        <polygon key={`cone${i}`} className="beam-cone" points={pts([P(x, yT, zT - 5), P(x - 0.42, yP - 0.25, deckH), P(x + 0.42, yP + 0.25, deckH)])} />
      ))}

      {/* Monitor wedges */}
      <Prism gx={xs[0] - 0.2} gy={yF + 1.15} w={0.4} d={0.28} z0={deckH} h={7} />
      <Prism gx={xs[2] - 0.2} gy={yF + 1.15} w={0.4} d={0.28} z0={deckH} h={7} />

      {/* Speaker stacks */}
      <Cabinet gx={leftX} gy={stackY} s={sx} z0={deckH} h={44} />
      <Cabinet gx={leftX} gy={stackY} s={sx} z0={deckH + 44} h={34} tweeter={false} />
      <Cabinet gx={rightX} gy={stackY} s={sx} z0={deckH} h={44} />
      <Cabinet gx={rightX} gy={stackY} s={sx} z0={deckH + 44} h={34} tweeter={false} />

      {/* Truss: two poles, a bar and three lights */}
      {[xa, xb].map((x) => {
        const [bx, by] = P(x, yT, deckH);
        const [tx, ty] = P(x, yT, zT);
        return <line key={x} className="truss" x1={bx} y1={by} x2={tx} y2={ty} />;
      })}
      <line className="truss truss-bar" x1={P(xa, yT, zT)[0]} y1={P(xa, yT, zT)[1]} x2={P(xb, yT, zT)[0]} y2={P(xb, yT, zT)[1]} />
      {xs.map((x, i) => {
        const [cx, cy] = P(x, yT, zT - 5);
        return (
          <g key={`can${i}`}>
            <circle className="can-halo" cx={cx} cy={cy} r={8} />
            <circle className="can" cx={cx} cy={cy} r={3.4} />
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* VOCALS: the studio                                                  */
/* ------------------------------------------------------------------ */

export function Studio({ spot }: { spot: CitySpot }) {
  const cx = spot.gx + 3.3;
  const cy = spot.gy + 2.5;
  const R = 1.75;
  const H = 128;
  const { rx, ry } = ellipseR(R);
  const [X, Yt] = P(cx, cy, H);

  const win = cylWindows({ cx, cy, r: R, z0: 0, h: H, slots: 9, rows: 2, lit: 0.62, warm: 0.9, seed: 121 });
  let foam = "";
  for (let z = 8; z < H - 6; z += 10) foam += frontArc(cx, cy, R, z);

  // Control room, butted onto the front of the drum
  const bx = spot.gx + 0.3;
  const by = spot.gy + 3.4;
  const bw = 1.9;
  const bd = 1.6;
  const bh = 84;
  const fwL = bw * CELL;
  const fwR = bd * CELL;
  const wl = waveWindow(38, 24, 58, 32, 131);
  const wr = waveWindow(10, 24, 66, 34, 132);

  // Vocal mic on the drum's cap: shock mount, capsule, grille
  const capZ = H + 12;
  const [mxp, myp] = P(cx, cy, capZ);
  const micY = myp - 34;

  return (
    <g>
      <Prism gx={spot.gx} gy={spot.gy} w={spot.w} d={spot.d} h={5} className="edge plinth" />

      {/* The drum */}
      <path className="cyl edge" d={cylBody(cx, cy, R, 0, H)} fill="url(#jc-cyl)" />
      <path className="foam" d={foam} />
      {[8, 64, 118].map((z) => (
        <path key={z} className="ring" d={frontArc(cx, cy, R, z)} />
      ))}
      <WindowLayers matrix="" paths={win} />
      <ellipse className="edge" cx={X} cy={Yt} rx={rx} ry={ry} fill="url(#jc-top)" />
      <ellipse className="lid-ring" cx={X} cy={Yt} rx={r1(rx * 0.78)} ry={r1(ry * 0.78)} />
      <path className="cyl edge" d={cylBody(cx, cy, 0.75, H, 12)} fill="url(#jc-cyl)" />
      <ellipse className="edge" cx={mxp} cy={myp} rx={r1(ellipseR(0.75).rx)} ry={r1(ellipseR(0.75).ry)} fill="url(#jc-top)" />

      {/* Mic sculpture */}
      <line className="mast" x1={mxp} y1={myp} x2={mxp} y2={micY + 14} />
      <path className="mic-cradle" d={`M${mxp - 11} ${micY - 4}v10a11 8 0 0 0 22 0v-10`} />
      <ellipse className="mic-body" cx={mxp} cy={micY} rx={8} ry={13} />
      <path className="mic-grille" d={`M${mxp - 7} ${micY - 7}h14M${mxp - 8} ${micY - 2}h16M${mxp - 8} ${micY + 3}h16M${mxp - 7} ${micY + 8}h14`} />
      <circle className="mic-halo" cx={mxp} cy={micY} r={20} />

      {/* Control room */}
      <Prism gx={bx} gy={by} w={bw} d={bd} h={bh} />
      <WindowLayers matrix={faceL(bx, by, bd)} paths={{ off: wl.pane + wl.dim, accent: wl.lit, hover: wl.dim }} />
      <g transform={faceL(bx, by, bd)}>
        <rect className="door" x={8} y={0} width={20} height={46} />
        <rect className="win-warm" x={11} y={3} width={14} height={41} />
        <rect className="sign-plate" x={6} y={62} width={fwL - 12} height={16} />
      </g>
      <FaceText matrix={faceL(bx, by, bd)} x={fwL / 2} y={70.5} size={9} spacing={2.6} className="sign-text sign-accent">
        ON AIR
      </FaceText>
      <WindowLayers matrix={faceR(bx, by, bw, bd)} paths={{ off: wr.pane + wr.dim, accent: wr.lit, hover: wr.dim }} />
      <EdgeLight matrix={faceL(bx, by, bd)} x={fwL} h={bh} tone="warm" />
      <g transform={faceR(bx, by, bw, bd)}>
        <path className="hazard-soft" d={rect(0, 0, fwR, 3)} />
      </g>
      {/* Roof vent */}
      <Prism gx={bx + 0.55} gy={by + 0.3} w={0.55} d={0.5} z0={bh} h={9} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* INSTRUMENTALS: the hall                                             */
/* ------------------------------------------------------------------ */

/** Pipe heights above the roof, left to right: a crescendo. */
const PIPES = [38, 54, 76, 92, 112, 128, 150, 170];

export function Hall({ spot }: { spot: CitySpot }) {
  const bx = spot.gx + 0.3;
  const by = spot.gy + 0.3;
  const bw = spot.w - 0.6;
  const bd = spot.d - 0.6;
  const bh = 64;
  const fw = bw * CELL;
  const fwR = bd * CELL;
  const L = faceL(bx, by, bd);
  const R = faceR(bx, by, bw, bd);

  // Arcade of five arches on the front wall
  const aw = 33;
  const ah = 34;
  const arch = (x: number) => `M${r1(x)} 0h${aw}v${ah - aw / 2}a${aw / 2} ${aw / 2} 0 0 1 ${-aw} 0Z`;
  const gap = (fw - 5 * aw) / 6;
  let archLit = "";
  let archOff = "";
  let archHover = "";
  for (let i = 0; i < 5; i++) {
    const a = arch(gap + i * (aw + gap));
    if (i % 2 === 0) archLit += a;
    else {
      archOff += a;
      archHover += a;
    }
  }
  const band = windowGrid({ fw, fh: bh, cols: 9, rows: 1, mx: 12, top: 10, bottom: 40, fillX: 0.55, fillY: 1, lit: 0.55, warm: 0.9, seed: 151 });
  const sideWin = windowGrid({ fw: fwR, fh: bh, cols: 8, rows: 2, mx: 14, top: 10, bottom: 12, fillX: 0.5, fillY: 0.5, lit: 0.55, warm: 0.9, seed: 152 });

  // Skylights on the roof (flat, in the roof plane)
  const sky = groundM(bx, by, bh);

  // Organ pipes along the front edge of the roof
  const pw = 0.36;
  const pd = 0.42;
  const py = by + bd - 0.85;
  const px = (i: number) => bx + 0.42 + i * 0.55;
  const last = PIPES.length - 1;
  const [tx, ty] = P(px(last) + pw / 2, py + pd / 2, bh + PIPES[last]);

  return (
    <g>
      <Prism gx={spot.gx} gy={spot.gy} w={spot.w} d={spot.d} h={5} className="edge plinth" />

      <Prism gx={bx} gy={by} w={bw} d={bd} h={bh} />
      <WindowLayers matrix={R} paths={sideWin} />
      <WindowLayers matrix={L} paths={band} />
      <g transform={L}>
        <path className="win-off" d={archOff} />
        <path className="win-warm" d={archLit} />
        <path className="win-hover" d={archHover} />
        <path className="cornice" d={rect(6, 58, fw - 12, 2.4)} />
      </g>
      <EdgeLight matrix={L} x={fw} h={bh} tone="warm" />

      <g transform={sky}>
        <path className="skylight" d={rect(0.5 * CELL, 0.6 * CELL, 1.3 * CELL, 0.9 * CELL) + rect(2.2 * CELL, 0.6 * CELL, 1.3 * CELL, 0.9 * CELL)} />
      </g>

      {PIPES.map((hp, i) => {
        const gx = px(i);
        const slitRows = Math.max(2, Math.floor((hp - 16) / 11));
        const slits = windowGrid({ fw: pw * CELL, fh: hp, cols: 1, rows: slitRows, mx: 5, top: 8, bottom: 8, fillX: 0.6, fillY: 0.45, lit: 0.62, warm: 0.92, seed: 160 + i });
        return (
          <g key={i}>
            <Prism gx={gx} gy={py} w={pw} d={pd} z0={bh} h={hp} />
            <WindowLayers matrix={faceL(gx, py, pd, bh)} paths={slits} />
          </g>
        );
      })}
      <Beacon x={tx} y={ty - 2} delay={0.9} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* DJ: the record                                                      */
/* ------------------------------------------------------------------ */

export function Vinyl({ spot }: { spot: CitySpot }) {
  const cx = spot.gx + spot.w / 2;
  const cy = spot.gy + spot.d / 2;
  const R = 2.0;
  const H = 62;
  const { rx, ry } = ellipseR(R);
  const [X, Yt] = P(cx, cy, H);

  const win = cylWindows({ cx, cy, r: R, z0: 0, h: H, slots: 14, rows: 1, lit: 0.66, warm: 0.92, seed: 171 });

  // Grooves, sheen and tonearm are drawn flat on the disc's top plane (ground-local px)
  const grooves: number[] = [];
  for (let k = 0.78; k < 1.95; k += 0.13) grooves.push(k);
  const wedge = (a: number, b: number, rr: number) => {
    const p = (t: number) => `${r1(Math.cos(t) * rr * CELL)} ${r1(Math.sin(t) * rr * CELL)}`;
    return `M0 0L${p(a)}A${rr * CELL} ${rr * CELL} 0 0 1 ${p(b)}Z`;
  };
  const arm = [
    [0.95, -1.3],
    [1.0, -0.8],
    [0.42, -0.5],
  ].map(([u, v]) => `${r1(u * CELL)} ${r1(v * CELL)}`);

  // Front door: a lit slot on the left half of the drum, between the two speaker towers
  const doorMid = Math.PI / 2 + 0.62;
  const doorA = cylQuad(cx, cy, R, 0, doorMid - 0.15, doorMid + 0.15, 3, 34);

  // Speaker towers at the two front corners of the plot
  const sw = 0.62;
  const towerZ = [0, 34, 66];
  const towers = [
    [spot.gx + 0.12, spot.gy + spot.d - sw - 0.12],
    [spot.gx + spot.w - sw - 0.12, spot.gy + spot.d - sw - 0.12],
  ];

  return (
    <g>
      <Prism gx={spot.gx} gy={spot.gy} w={spot.w} d={spot.d} h={5} className="edge plinth" />

      {/* The disc */}
      <path className="cyl edge" d={cylBody(cx, cy, R, 0, H)} fill="url(#jc-cyl)" />
      <WindowLayers matrix="" paths={win} />
      <path className="ring" d={frontArc(cx, cy, R, 6)} />
      <path className="ring ring-strong" d={frontArc(cx, cy, R, H - 3)} />
      <path className="win-warm door-glow" d={doorA} />
      <ellipse className="edge vinyl-top" cx={X} cy={Yt} rx={rx} ry={ry} />

      <g transform={groundM(cx, cy, H)}>
        {grooves.map((k) => (
          <circle key={k} className="vinyl-groove" r={r1(k * CELL)} />
        ))}
        <path className="vinyl-sheen" d={wedge(-2.55, -2.15, 1.95) + wedge(0.6, 1.0, 1.95)} />
      </g>

      {/* Label: a raised amber disc with a spindle */}
      <path className="cyl edge" d={cylBody(cx, cy, 0.6, H, 8)} fill="url(#jc-cyl)" />
      <ellipse className="vinyl-label" cx={X} cy={Yt - 8} rx={r1(ellipseR(0.6).rx)} ry={r1(ellipseR(0.6).ry)} />
      <circle className="vinyl-spindle" cx={X} cy={Yt - 8} r={2.4} />

      {/* Tonearm */}
      <g transform={groundM(cx, cy, H + 3)}>
        <circle className="arm-pivot" cx={r1(0.95 * CELL)} cy={r1(-1.3 * CELL)} r={7} />
        <path className="arm-line" d={`M${arm[0]}L${arm[1]}L${arm[2]}`} />
        <circle className="arm-head" cx={r1(0.42 * CELL)} cy={r1(-0.5 * CELL)} r={2.8} />
      </g>

      {/* Speaker towers, in front of the disc */}
      {towers.map(([gx, gy]) =>
        towerZ.map((z0, i) => <Cabinet key={`${gx}-${i}`} gx={gx} gy={gy} s={sw} z0={z0} h={i === 2 ? 30 : 32} tweeter={i === 0} />),
      )}
    </g>
  );
}
