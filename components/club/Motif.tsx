import { useId, type CSSProperties } from "react";
import { gearPath } from "@/lib/gear";
import { rng } from "@/lib/iso";
import type { MotifKind } from "@/lib/identity";

/**
 * Generative artwork for a club's identity. Static SVG, no images, no animation.
 * Reused for the hero, posters, portraits and gallery placeholders (different `seed`s),
 * so one club looks like one club everywhere.
 *
 *   pips   dice pips and circles      (DICE)
 *   mesh   constellation network      (DSC)
 *   rings  radar rings and a sweep    (CICE)
 *   gears  interlocking gear outlines (Robotics)
 *   code   indented lines of code     (Coding)
 *   waves  layered sine waves and an   (Music: Band, Vocals, DJ)
 *          equaliser skyline
 */

const W = 800;
const H = 600;
const r1 = (n: number) => Math.round(n * 10) / 10;

function Pips({ accent, seed, id }: { accent: string; seed: number; id: string }) {
  const rand = rng(seed * 13 + 5);
  const circles = Array.from({ length: 7 }, () => ({
    x: r1(rand() * W),
    y: r1(rand() * H),
    r: r1(50 + rand() * 120),
  }));
  return (
    <>
      <defs>
        <pattern id={id} width="160" height="160" patternUnits="userSpaceOnUse" patternTransform={`rotate(${(seed * 7) % 30})`}>
          {[
            [40, 40],
            [120, 40],
            [80, 80],
            [40, 120],
            [120, 120],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={7} fill={accent} fillOpacity={0.4} />
          ))}
        </pattern>
      </defs>
      <g className="sig-l1">
        <rect x={-60} y={-60} width={W + 120} height={H + 120} fill={`url(#${id})`} />
      </g>
      <g className="sig-l2">
        {circles.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={c.r} fill="none" stroke={accent} strokeOpacity={0.22} strokeWidth={1.2} />
        ))}
      </g>
    </>
  );
}

function Mesh({ accent, seed }: { accent: string; seed: number }) {
  const rand = rng(seed * 31 + 7);
  const nodes = Array.from({ length: 30 }, () => ({ x: r1(rand() * W), y: r1(rand() * H), r: r1(1.6 + rand() * 2.8) }));
  const links: string[] = [];
  nodes.forEach((a, i) => {
    const near = nodes
      .map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
      .filter((n) => n.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2);
    near.forEach((n) => {
      if (n.j > i) links.push(`M${a.x} ${a.y}L${nodes[n.j].x} ${nodes[n.j].y}`);
    });
  });
  return (
    <>
      <path d={links.join("")} fill="none" stroke={accent} strokeOpacity={0.4} strokeWidth={1} />
      {nodes.map((n, i) => (
        <circle key={i} className="sig-node" cx={n.x} cy={n.y} r={n.r} fill={accent} fillOpacity={0.75} />
      ))}
    </>
  );
}

function Rings({ accent, seed }: { accent: string; seed: number }) {
  const rand = rng(seed * 17 + 3);
  const cx = r1(W * (0.45 + rand() * 0.3));
  const cy = r1(H * (0.4 + rand() * 0.25));
  const a = rand() * Math.PI * 2;
  const R = 760;
  const wedge = `M${cx} ${cy}L${r1(cx + Math.cos(a) * R)} ${r1(cy + Math.sin(a) * R)}A${R} ${R} 0 0 1 ${r1(cx + Math.cos(a + 0.5) * R)} ${r1(cy + Math.sin(a + 0.5) * R)}Z`;
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={70 + i * 68}
          fill="none"
          stroke={accent}
          strokeOpacity={0.3}
          strokeWidth={1.1}
          strokeDasharray={i % 3 === 0 ? undefined : "2 9"}
        />
      ))}
      <path d={`M${cx - 900} ${cy}H${cx + 900}M${cx} ${cy - 900}V${cy + 900}`} stroke={accent} strokeOpacity={0.22} />
      <g className="sig-sweep" style={{ transformBox: "view-box", transformOrigin: `${cx}px ${cy}px` }}>
        <path d={wedge} fill={accent} fillOpacity={0.12} />
        <path d={`M${cx} ${cy}L${r1(cx + Math.cos(a + 0.5) * R)} ${r1(cy + Math.sin(a + 0.5) * R)}`} stroke={accent} strokeOpacity={0.55} strokeWidth={1.2} />
      </g>
      <circle cx={cx} cy={cy} r={4} fill={accent} />
    </>
  );
}

function Gears({ accent, seed }: { accent: string; seed: number }) {
  const rand = rng(seed * 23 + 11);
  const x0 = 200 + rand() * 260;
  const y0 = 180 + rand() * 200;
  const gears = [
    { x: x0, y: y0, r: 130, t: 16, d: 26 },
    { x: x0 + 130 + 92 - 8, y: y0 + 40, r: 88, t: 11, d: 22 },
    { x: x0 + 40, y: y0 + 130 + 66 - 8, r: 62, t: 8, d: 18 },
  ];
  return (
    <>
      {gears.map((g, i) => (
        <g
          key={i}
          className="sig-gear"
          style={
            {
              transformBox: "view-box",
              transformOrigin: `${r1(g.x)}px ${r1(g.y)}px`,
              "--gdur": `${g.t * 6}s`,
              "--gdir": i === 0 ? "normal" : "reverse",
            } as CSSProperties
          }
        >
          <path d={gearPath(r1(g.x), r1(g.y), g.r, g.t, g.d)} fill="none" stroke={accent} strokeOpacity={0.5} strokeWidth={1.4} />
          <circle cx={r1(g.x)} cy={r1(g.y)} r={g.r * 0.28} fill="none" stroke={accent} strokeOpacity={0.4} />
          <circle cx={r1(g.x)} cy={r1(g.y)} r={4} fill={accent} fillOpacity={0.8} />
        </g>
      ))}
      <path
        d={Array.from({ length: 48 }, (_, i) => `M${i * 17} ${H - 16}v${i % 4 === 0 ? 14 : 7}`).join("")}
        stroke={accent}
        strokeOpacity={0.35}
      />
    </>
  );
}

function Code({ accent, seed }: { accent: string; seed: number }) {
  const rand = rng(seed * 41 + 9);
  let indent = 0;
  let lit = "";
  let dim = "";
  for (let i = 0; i < 34; i++) {
    const y = 18 + i * 17;
    const roll = rand();
    if (roll < 0.12) continue;
    if (roll < 0.4) indent = Math.min(4, indent + 1);
    else if (roll < 0.62) indent = Math.max(0, indent - 1);
    const x = 36 + indent * 28;
    const len = r1(40 + rand() * 340);
    const bar = `M${x} ${y}h${len}v5h${-len}Z`;
    if (rand() < 0.5) lit += bar;
    else dim += bar;
  }
  return (
    <>
      <path d={dim} fill={accent} fillOpacity={0.16} />
      <path d={lit} fill={accent} fillOpacity={0.5} />
    </>
  );
}

/**
 * Layered sine waves with an equaliser skyline along the bottom. Every layer completes a whole number
 * of cycles per WAVE_PERIOD px, so translating the group by exactly one period loops seamlessly
 * (the drift in club.css does that; the artwork itself is static).
 */
const WAVE_PERIOD = 200;

function Waves({ accent, seed }: { accent: string; seed: number }) {
  const rand = rng(seed * 29 + 13);
  const layers = Array.from({ length: 9 }, (_, i) => {
    const cycles = 1 + Math.floor(rand() * 3); // whole cycles per period
    const amp = 12 + rand() * 44;
    const phase = rand() * Math.PI * 2;
    const base = 70 + i * 46 + rand() * 14;
    let d = "";
    for (let x = -WAVE_PERIOD; x <= W + WAVE_PERIOD; x += 10) {
      const y = base + Math.sin((x / WAVE_PERIOD) * cycles * Math.PI * 2 + phase) * amp;
      d += `${d ? "L" : "M"}${x} ${r1(y)}`;
    }
    return { d, o: r1(0.14 + (i % 3) * 0.1 + rand() * 0.08) };
  });

  let bars = "";
  const n = 40;
  for (let i = 0; i < n; i++) {
    const env = 0.3 + 0.7 * Math.abs(Math.sin(i * 0.55 + seed));
    const h = r1((10 + rand() * 60) * env);
    bars += `M${i * 20 + 4} ${H}v${-h}h9v${h}Z`;
  }

  return (
    <>
      <g className="sig-wave" style={{ "--wp": WAVE_PERIOD } as CSSProperties}>
        {layers.map((l, i) => (
          <path key={i} d={l.d} fill="none" stroke={accent} strokeOpacity={l.o} strokeWidth={i % 4 === 0 ? 1.8 : 1.1} />
        ))}
      </g>
      <path d={bars} fill={accent} fillOpacity={0.22} />
    </>
  );
}

export default function Motif({
  kind,
  accent,
  seed = 1,
  className = "",
}: {
  kind: MotifKind;
  accent: string;
  seed?: number;
  className?: string;
}) {
  const id = "m" + useId().replace(/:/g, "");
  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
    >
      {kind === "pips" && <Pips accent={accent} seed={seed} id={id} />}
      {kind === "mesh" && <Mesh accent={accent} seed={seed} />}
      {kind === "rings" && <Rings accent={accent} seed={seed} />}
      {kind === "gears" && <Gears accent={accent} seed={seed} />}
      {kind === "code" && <Code accent={accent} seed={seed} />}
      {kind === "waves" && <Waves accent={accent} seed={seed} />}
    </svg>
  );
}
