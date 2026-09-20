"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import LogoMark from "@/components/LogoMark";
import { useSite } from "@/components/SiteProvider";
import { useTravel } from "@/components/TravelProvider";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMotionTier } from "@/hooks/useMotionTier";
import { EASE } from "@/lib/timing";
import type { Domain, DomainId } from "@/lib/types";

/**
 * The interactive JYC map, for every screen size.
 *
 * One component, two layouts and two views:
 *
 *   layout "wide"  desktop and tablet, laid out on the 1200 x 800 map the domains already have
 *   layout "tall"  phones, a portrait 400 x 600 map: hub in the middle, worlds in two columns
 *   view   "2d"    the flat map
 *   view   "3d"    the same map tilted back in space, every world standing up above its own ring
 *
 * The map is drawn on a fixed logical stage and scaled to fit, so the drawing is identical at every
 * size. 3D is plain CSS 3D transforms (no WebGL, no library): the plane tilts, each world is
 * counter-rotated to face the viewer and lifted along the plane's normal. Only transform and
 * opacity ever animate. The hub is the real logo through <LogoMark />, unchanged.
 */

export type UniverseView = "2d" | "3d";
export type UniverseLayout = "wide" | "tall";

interface Spec {
  /** Logical stage size. */
  w: number;
  h: number;
  /** Size of one world's drawing relative to the 260 x 140 base. */
  art: number;
  /** Extra weight for the small things (stars, dust, strokes) when the drawing is scaled down. */
  star: number;
  dust: number;
  stroke: number;
  /** Logo size, in stage units. */
  logo: string;
  glow: number;
  /** Flat hub orbit (2D) and round hub orbit (3D). */
  ringRx: number;
  ringRy: number;
  ringR: number;
  /** Ring under each world in 3D. */
  pad: number;
  /** Height reserved for a world's name, inside its button, so nothing overflows the box. */
  label: number;
  fit: "contain" | "width";
  maxScale: number;
}

const SPECS: Record<UniverseLayout, Spec> = {
  wide: {
    w: 1200,
    h: 800,
    art: 1,
    star: 1,
    dust: 1,
    stroke: 1,
    logo: "90px",
    glow: 280,
    ringRx: 170,
    ringRy: 116,
    ringR: 150,
    pad: 130,
    label: 52,
    fit: "contain",
    maxScale: 4,
  },
  tall: {
    w: 400,
    h: 600,
    art: 0.46,
    star: 1.7,
    dust: 1.8,
    stroke: 2.1,
    logo: "76px",
    glow: 200,
    ringRx: 84,
    ringRy: 84,
    ringR: 84,
    pad: 70,
    label: 24,
    fit: "width",
    maxScale: 1.3,
  },
};

/** Base size of one world's drawing, in stage units at art = 1. */
const ART_W = 260;
const ART_H = 140;

type Point = { x: number; y: number };

/** Phone placement: the same six-around-a-hub structure, stacked for a portrait screen. */
const TALL_SLOTS: Partial<Record<DomainId, Point>> = {
  technical: { x: 110, y: 110 },
  music: { x: 290, y: 110 },
  cultural: { x: 72, y: 300 },
  dance: { x: 328, y: 300 },
  literary: { x: 110, y: 490 },
  sports: { x: 290, y: 490 },
};

/** Four-point spark, about 22 units across. Scaled per layout at the call site. */
const SPARK = "M0 -11 L1.6 -1.6 L11 0 L1.6 1.6 L0 11 L-1.6 1.6 L-11 0 L-1.6 -1.6 Z";

/** How high each world floats above the plane in 3D (px). Uneven on purpose: it reads as depth. */
const DEPTHS = [70, 46, 84, 38, 60, 30];

export function titleCase(name: string): string {
  return name.charAt(0) + name.slice(1).toLowerCase();
}

/**
 * Which side of its drawing a world's name sits on in 2D. On the wide map the two worlds at the very top
 * and bottom put it on the hub side (there is no room outside), the rest put it on the outer side,
 * so neighbouring names never collide. On phones the name sits on the outer side too (above the
 * top row, below the middle and bottom rows), which keeps the rows apart once the map is tilted.
 */
function labelAbove(dy: number, layout: UniverseLayout): boolean {
  if (layout === "tall") return dy < -1;
  return Math.abs(dy) > 200 ? dy > 0 : dy < 0;
}

function slotFor(d: Domain, index: number, count: number, layout: UniverseLayout, spec: Spec): Point {
  if (layout === "wide") return d.position;
  const fixed = TALL_SLOTS[d.id];
  if (fixed) return fixed;
  // A domain added later with no phone slot of its own goes on a ring around the hub.
  const a = ((-90 + (360 / count) * index) * Math.PI) / 180;
  return { x: spec.w / 2 + 150 * Math.cos(a), y: spec.h / 2 + 200 * Math.sin(a) };
}

/**
 * Which side of its drawing a world's name sits on in 3D. Always the outer side: once the plane is
 * tilted, the hub side of the top and bottom worlds is where the hub orbit and the logo are.
 */
function labelAbove3d(dy: number, layout: UniverseLayout): boolean {
  return layout === "tall" ? dy < -1 : dy < 0;
}

/**
 * Half-size of the box a world's drawing needs, in drawing units. The base drawing is 260 x 140,
 * but the faint dust around a world reaches well past that (and grows on hover), and a 3D layer
 * clips whatever it paints outside its own box, so the box is measured from the data instead.
 */
function reach(d: Domain, spec: Spec) {
  let hw = ART_W / 2;
  let hh = ART_H / 2;
  for (const [x, y, r] of d.dust) {
    const e = r * spec.dust * 1.8 + 3;
    hw = Math.max(hw, Math.abs(x) + e);
    hh = Math.max(hh, Math.abs(y) + e);
  }
  for (const [x, y] of d.stars) {
    const e = 12 * spec.star;
    hw = Math.max(hw, Math.abs(x) + e);
    hh = Math.max(hh, Math.abs(y) + e);
  }
  return { hw: Math.ceil(hw), hh: Math.ceil(hh) };
}

/** Slightly bent line between two domains, pulled toward the hub. */
function collabPath(a: Point, b: Point, c: Point): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const qx = mx + (c.x - mx) * 0.3;
  const qy = my + (c.y - my) * 0.3;
  return `M${a.x} ${a.y} Q${qx} ${qy} ${b.x} ${b.y}`;
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Scale of the stage so the whole map fits its container. Uses layout size, so travel zooms can't disturb it. */
function useFit(spec: Spec) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const s = spec.fit === "width" ? w / spec.w : Math.min(w / spec.w, h / spec.h);
      setScale(Math.min(s, spec.maxScale));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [spec]);

  return [ref, scale] as const;
}

interface NodeProps {
  domain: Domain;
  index: number;
  spec: Spec;
  pos: Point;
  /** Name side in 2D and in 3D (they differ for the top and bottom worlds on the wide map). */
  above2d: boolean;
  above3d: boolean;
  active: boolean;
  dim: boolean;
  /** Only set on touch devices, where a tap selects before it travels. */
  pressed: boolean;
  onHover: (id: string | null) => void;
  /** viaKeyboard: keyboard and screen-reader activations (click with detail 0). */
  onPick: (domain: Domain, el: Element, viaKeyboard: boolean) => void;
}

/** One world: its constellation, planet and label, as a single button. */
function WorldNode({ domain: d, index, spec, pos, above2d, above3d, active, dim, pressed, onHover, onPick }: NodeProps) {
  const aw = ART_W * spec.art; // the base drawing: what is tappable and what the name sits against
  const ah = ART_H * spec.art;
  const lh = spec.label;
  const { hw, hh } = reach(d, spec);
  // The button is the paint box: big enough for every star and grain of dust (3D layers clip to
  // their own box), with room for a name on either side. Its centre, the planet, is the anchor.
  // Only the inner .u-hit area (the base drawing plus name rows) takes pointer events, so the
  // roomy box never steals a neighbour's hover.
  const bw = hw * 2 * spec.art;
  const bh = hh * 2 * spec.art;
  const boxH = bh + lh * 2;
  const anchorY = boxH / 2;

  return (
    <button
      type="button"
      className="u-node"
      data-active={active}
      data-dim={dim}
      aria-label={`${titleCase(d.name)}: ${d.tagline}${pressed ? ". Previewing" : ""}`}
      style={
        {
          left: pos.x,
          top: pos.y,
          width: bw,
          height: boxH,
          marginLeft: -bw / 2,
          marginTop: -anchorY,
          transformOrigin: `50% ${anchorY}px`,
          "--accent": d.accent,
          "--zd": `${DEPTHS[index % DEPTHS.length]}px`,
        } as CSSProperties
      }
      // Touch taps also fire pointerenter; those go through onPick instead, so skip them here.
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") onHover(d.id);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "touch") onHover(null);
      }}
      onFocus={(e) => {
        if (e.currentTarget.matches(":focus-visible")) onHover(d.id);
      }}
      onBlur={() => onHover(null)}
      onClick={(e) => onPick(d, e.currentTarget, e.detail === 0)}
    >
      <span
        aria-hidden
        className="u-hit"
        style={{ left: (bw - aw) / 2, top: anchorY - ah / 2 - lh, width: aw, height: ah + lh * 2 }}
      />

      <motion.span
        className="u-art"
        style={{ top: lh, height: bh }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, delay: 0.5 + index * 0.14, ease: EASE }}
      >
        <svg viewBox={`${-hw} ${-hh} ${hw * 2} ${hh * 2}`} width={bw} height={bh} aria-hidden>
          <defs>
            <radialGradient id={`pg-${d.id}`} cx="34%" cy="30%" r="80%">
              <stop offset="0%" stopColor={d.accent} stopOpacity="0.95" />
              <stop offset="55%" stopColor={d.accent} stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0b0c0c" stopOpacity="1" />
            </radialGradient>
          </defs>

          {d.dust.map(([x, y, r], k) => (
            <circle key={k} className="cdust" cx={x} cy={y} r={r * spec.dust} />
          ))}

          {d.links.map(([a, b], k) => (
            <path
              key={k}
              className="cline"
              pathLength={1}
              d={`M${d.stars[a][0]} ${d.stars[a][1]} L${d.stars[b][0]} ${d.stars[b][1]}`}
              style={{ "--delay": `${0.9 + index * 0.14 + k * 0.1}s` } as CSSProperties}
            />
          ))}

          {d.stars.map(([x, y], k) => (
            <circle key={k} className="cstar" cx={x} cy={y} r={2.4 * spec.star} />
          ))}

          {/* Shine: on hover (or tap) every star of the world lights up with a white core, a soft halo and a twinkling four-point spark. */}
          {d.stars.map(([x, y], k) => (
            <g key={`shine-${k}`} transform={`translate(${x} ${y})`} style={{ "--k": k } as CSSProperties}>
              <circle className="cglow" r={10 * spec.star} />
              <path className="cspark" d={SPARK} transform={`scale(${spec.star})`} />
              <circle className="ccore" r={1.7 * spec.star} />
            </g>
          ))}

          <g className="cplanet">
            <ellipse className="cring" rx={d.planetRadius * 1.9} ry={d.planetRadius * 0.5} transform={`rotate(${d.tilt})`} />
            <circle className="chalo" r={d.planetRadius + 14} />
            <circle r={d.planetRadius} fill={`url(#pg-${d.id})`} />
          </g>
        </svg>
      </motion.span>

      {/* Two copies of the name, one on each side of the drawing; each view shows one (opacity only, so switching views never jumps). */}
      {(["top", "bottom"] as const).map((side) => (
        <span
          key={side}
          aria-hidden
          className="u-label"
          data-side={side}
          data-in2d={(side === "top") === above2d}
          data-in3d={(side === "top") === above3d}
          style={{ top: side === "top" ? anchorY - ah / 2 - lh : anchorY + ah / 2, height: lh }}
        >
          <span className="u-name">{titleCase(d.name)}</span>
          <span className="u-tag">{d.tagline}</span>
        </span>
      ))}
    </button>
  );
}

interface Props {
  layout: UniverseLayout;
  view: UniverseView;
  /** The world picked by a tap (touch only). Hover is tracked inside. */
  selected: string | null;
  onSelect: (id: string | null) => void;
  /** Sizing and positioning of the container, from the parent. */
  className?: string;
}

export default function UniverseMap({ layout, view, selected, onSelect, className }: Props) {
  const spec = SPECS[layout];
  const is3d = view === "3d";
  const { collaborations, domains } = useSite();
  const { travelTo } = useTravel();
  const tier = useMotionTier();
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const [hovered, setHovered] = useState<string | null>(null);
  const [ref, scale] = useFit(spec);

  const cx = spec.w / 2;
  const cy = spec.h / 2;
  const hub: Point = { x: cx, y: cy };
  const activeId = hovered ?? selected;

  // Pointer parallax (desktop-class devices only). One set of motion values serves both views, so
  // switching never swaps a binding or jumps: `mode` springs 0 -> 1 when 3D is on. In 2D the far
  // layer moves a little and the near layer a little more; in 3D the whole map turns toward the
  // pointer instead. (Reduced motion: MotionConfig in UniverseScene, and the tier gate in onMove.)
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spx = useSpring(px, { stiffness: 50, damping: 18, mass: 0.8 });
  const spy = useSpring(py, { stiffness: 50, damping: 18, mass: 0.8 });
  const mode = useSpring(is3d ? 1 : 0, { stiffness: 90, damping: 22 });
  useEffect(() => {
    mode.set(is3d ? 1 : 0);
  }, [is3d, mode]);
  const farX = useTransform([spx, mode], ([v, m]: number[]) => v * -10 * (1 - m));
  const farY = useTransform([spy, mode], ([v, m]: number[]) => v * -10 * (1 - m));
  const nearX = useTransform([spx, mode], ([v, m]: number[]) => v * -28 * (1 - m));
  const nearY = useTransform([spy, mode], ([v, m]: number[]) => v * -28 * (1 - m));
  const turnY = useTransform([spx, mode], ([v, m]: number[]) => v * 16 * m);
  const turnX = useTransform([spy, mode], ([v, m]: number[]) => v * -8 * m);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (tier !== "full") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  const go = useCallback(
    (d: Domain, el: Element) => {
      // Zoom out of the planet itself, not the middle of the button: the button's box is bigger
      // than the drawing, and in 3D its projected box is offset from the planet.
      const target = el.querySelector(".cplanet") ?? el;
      const r = target.getBoundingClientRect();
      travelTo(`/domain/${d.id}`, {
        origin: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
        accent: d.accent,
        label: d.name,
      });
    },
    [travelTo],
  );

  // Mouse: click travels. Touch: the first tap previews (the same thing hover does), a second tap
  // on the same world, or the Enter button under the map, travels. Keyboard and screen readers
  // (a click with detail 0) travel straight away: focusing a world already previews it, so a
  // second activation would only be an obstacle.
  const pick = useCallback(
    (d: Domain, el: Element, viaKeyboard: boolean) => {
      if (canHover || viaKeyboard || selected === d.id) go(d, el);
      else onSelect(d.id);
    },
    [canHover, selected, go, onSelect],
  );

  const slots = domains.map((d, i) => slotFor(d, i, domains.length, layout, spec));
  const slotOf = (id: string): Point | undefined => {
    const i = domains.findIndex((d) => d.id === id);
    return i === -1 ? undefined : slots[i];
  };

  return (
    <div ref={ref} className={className} onPointerMove={onMove} onPointerLeave={onLeave} role="group" aria-label="Map of the JYC universe">
      <div
        className="u-stage"
        data-view={view}
        data-layout={layout}
        data-touch={!canHover}
        style={
          {
            width: spec.w,
            height: spec.h,
            transform: `translate(-50%, -50%) scale(${scale})`,
            "--u-stroke": spec.stroke,
            // Small wide maps (landscape phones) draw the names in stage units, so lift them to stay readable.
            ...(layout === "wide" ? { "--u-name": `${Math.min(24, Math.max(22, 12 / scale))}px` } : null),
          } as CSSProperties
        }
      >
        <motion.div className="u-fill u-3d" style={{ rotateX: turnX, rotateY: turnY }}>
          <div className="u-fill u-3d u-sway" data-sway={is3d && tier === "lite"}>
            <div className="u-fill u-3d u-plane">
              {/* Lying flat on the plane: hub orbit, light from the hub, collaboration between worlds. */}
              <svg viewBox={`0 0 ${spec.w} ${spec.h}`} className="u-fill" aria-hidden>
                <ellipse className="u-ring u-ring-flat" cx={cx} cy={cy} rx={spec.ringRx} ry={spec.ringRy} />
                <circle className="u-ring u-ring-round" cx={cx} cy={cy} r={spec.ringR} />
                <motion.g style={{ x: farX, y: farY }}>
                  {domains.map((d, i) => (
                    <path
                      key={`spoke-${d.id}`}
                      className="cspoke"
                      d={`M${cx} ${cy} L${slots[i].x} ${slots[i].y}`}
                      data-hot={activeId === d.id}
                      style={{ "--accent": d.accent } as CSSProperties}
                    />
                  ))}
                  {collaborations.map(([a, b]) => {
                    const pa = slotOf(a);
                    const pb = slotOf(b);
                    if (!pa || !pb) return null;
                    return (
                      <path
                        key={`${a}-${b}`}
                        className="ccollab"
                        d={collabPath(pa, pb, hub)}
                        data-hot={activeId === a || activeId === b}
                      />
                    );
                  })}
                </motion.g>
              </svg>

              <div aria-hidden className="u-glow" style={{ left: cx, top: cy, width: spec.glow, height: spec.glow }} />

              {/* 3D only: a ring on the plane under each world, so it reads as floating above it. */}
              {domains.map((d, i) => (
                <div
                  key={`pad-${d.id}`}
                  aria-hidden
                  className="u-pad"
                  data-active={activeId === d.id}
                  data-dim={activeId !== null && activeId !== d.id}
                  style={{ left: slots[i].x, top: slots[i].y, width: spec.pad, height: spec.pad, "--accent": d.accent } as CSSProperties}
                />
              ))}

              {/* Hub: the real logo, exactly as on the opening screen, at the centre of the map. */}
              <div className="u-hub" style={{ left: cx, top: cy }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.2, ease: EASE }}
                >
                  <LogoMark size={spec.logo} />
                </motion.div>
              </div>

              <motion.div className="u-fill u-3d" style={{ x: nearX, y: nearY }}>
                {domains.map((d, i) => (
                  <WorldNode
                    key={d.id}
                    domain={d}
                    index={i}
                    spec={spec}
                    pos={slots[i]}
                    above2d={labelAbove(slots[i].y - cy, layout)}
                    above3d={labelAbove3d(slots[i].y - cy, layout)}
                    active={activeId === d.id}
                    dim={activeId !== null && activeId !== d.id}
                    pressed={!canHover && selected === d.id}
                    onHover={setHovered}
                    onPick={pick}
                  />
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
