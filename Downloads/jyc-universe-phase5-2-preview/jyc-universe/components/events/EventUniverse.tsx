"use client";

import "./events.css";
import { memo, useCallback, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { MotionConfig, motion } from "framer-motion";
import { useTravel } from "@/components/TravelProvider";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMotionTier } from "@/hooks/useMotionTier";
import { useToday } from "@/hooks/useToday";
import { daysBetween, longDate, dayOf, monthOf, splitEvents, whenLabel } from "@/lib/dates";
import {
  ORB_RANGE,
  STAGE,
  TRAIL_RANGE,
  arcPath,
  arcPoint,
  NOW_T,
  orbLayout,
  trailLayout,
  type EventView,
  type OrbSpec,
  type TrailSpec,
} from "@/lib/events";
import { EASE } from "@/lib/timing";
import { centerOf, rememberOrb } from "./orbOrigin";

/**
 * The event universe: every upcoming event is a glowing light on a time arc, the soonest one
 * nearest (big, bright, low left), the furthest one far away (small, dim, high right).
 * Past events collapse into a dim trail of dots behind "now".
 *
 * One SVG, no canvas, no filters. Hover state is one string of React state; the lights are
 * memoised so only the two affected ones re-render. All visuals are CSS (opacity + transform).
 * Clicking a light travels into /events/[id] with that light as the camera origin.
 */

const hex = (c: string) => c.replace("#", "");
const dateTag = (iso: string) => `${dayOf(iso)} ${monthOf(iso)}`;

type Handlers = {
  enter: (id: string) => void;
  leave: (id: string) => void;
  activate: (id: string, el: Element, viaKey: boolean) => void;
};

/** Keyboard focus only (not the focus a mouse or finger click gives). */
function focusVisible(el: Element): boolean {
  try {
    return el.matches(":focus-visible");
  } catch {
    return true;
  }
}

const Orb = memo(function Orb({
  spec,
  view,
  index,
  soon,
  on,
  h,
}: {
  spec: OrbSpec;
  view: EventView;
  index: number;
  soon: boolean;
  on: boolean;
  h: Handlers;
}) {
  const { event, clubName, identity } = view;
  const a = identity.accent;
  const id = event.id;
  return (
    <g transform={`translate(${spec.x} ${spec.y})`}>
      <g
        className="orb"
        data-on={on ? "true" : "false"}
        data-soon={soon ? "true" : undefined}
        role="link"
        tabIndex={0}
        aria-label={`${event.title}, ${clubName}, ${longDate(event.date)}`}
        style={{ "--a": a, "--i": index, "--g": spec.glow } as CSSProperties}
        onPointerEnter={(e) => e.pointerType === "mouse" && h.enter(id)}
        onPointerLeave={(e) => e.pointerType === "mouse" && h.leave(id)}
        onFocus={(e) => focusVisible(e.currentTarget) && h.enter(id)}
        onBlur={() => h.leave(id)}
        onClick={(e: MouseEvent<SVGGElement>) => h.activate(id, e.currentTarget, false)}
        onKeyDown={(e: KeyboardEvent<SVGGElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            h.activate(id, e.currentTarget, true);
          }
        }}
      >
        <circle className="orb-hit" r={Math.max(spec.r * 1.7, 28)} />
        <g className="orb-body">
          <circle className="orb-halo" r={spec.r * 2.7} fill={`url(#ev-halo-${hex(a)})`} />
          <circle className="orb-ring2" r={spec.r * 1.75} />
          <circle className="orb-ring" r={spec.r * 1.3} />
          <circle className="orb-core" r={spec.r} fill={`url(#ev-core-${hex(a)})`} />
        </g>
        <circle className="orb-focus" r={spec.r * 2} />
        <text className="orb-date" y={spec.r * 1.75 + 26}>
          {dateTag(event.date)}
        </text>
      </g>
    </g>
  );
});

const TrailDot = memo(function TrailDot({
  spec,
  view,
  on,
  h,
}: {
  spec: TrailSpec;
  view: EventView;
  on: boolean;
  h: Handlers;
}) {
  const { event, clubName, identity } = view;
  const id = event.id;
  return (
    <g transform={`translate(${spec.x} ${spec.y})`}>
      <g
        className="trail-dot"
        data-on={on ? "true" : "false"}
        role="link"
        tabIndex={0}
        aria-label={`Past event: ${event.title}, ${clubName}, ${longDate(event.date)}`}
        style={{ "--a": identity.accent, "--o": spec.o } as CSSProperties}
        onPointerEnter={(e) => e.pointerType === "mouse" && h.enter(id)}
        onPointerLeave={(e) => e.pointerType === "mouse" && h.leave(id)}
        onFocus={(e) => focusVisible(e.currentTarget) && h.enter(id)}
        onBlur={() => h.leave(id)}
        onClick={(e: MouseEvent<SVGGElement>) => h.activate(id, e.currentTarget, false)}
        onKeyDown={(e: KeyboardEvent<SVGGElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            h.activate(id, e.currentTarget, true);
          }
        }}
      >
        <circle className="orb-hit" r={Math.max(spec.r + 5, 10)} />
        <circle className="dot" r={spec.r} />
        <circle className="orb-focus" r={spec.r + 8} />
      </g>
    </g>
  );
});

/** Plate beside the hovered light: club, title, date and time, and how to open it. */
function Callout({
  at,
  view,
  past,
  today,
  touch,
  on,
}: {
  at: Pt2;
  view: EventView;
  past: boolean;
  today: string;
  touch: boolean;
  on: boolean;
}) {
  const { event, clubName, identity } = view;
  const meta = `${dateTag(event.date)} · ${event.time} · ${past ? "Past" : whenLabel(event.date, today)}`;
  const open = touch ? "Tap the light again to open" : "Open event →";
  const width = Math.round(Math.min(360, Math.max(210, event.title.length * 12.6 + 46, meta.length * 7.2 + 40, open.length * 7 + 40)));
  const height = 96;
  const lead = at.r * (past ? 1 : 1.5) + 22;

  // Open toward the emptier side of the stage; keep the plate inside the picture.
  const side: 1 | -1 = at.x + lead + width > STAGE.w - 24 ? -1 : 1;
  const px = at.x + side * lead;
  const py = Math.min(STAGE.h - 24 - height / 2, Math.max(104 + height / 2, at.y - 8));
  const x0 = side === 1 ? 0 : -width;
  const tx = x0 + 20;

  return (
    <g
      className="ev-callout"
      data-on={on ? "true" : "false"}
      style={{ "--a": identity.accent, "--dx": `${-side * 12}px` } as CSSProperties}
      aria-hidden="true"
    >
      <path className="ev-co-leader" d={`M${at.x + side * (at.r * (past ? 1 : 1.3))} ${at.y}L${px} ${py}`} />
      <g transform={`translate(${px} ${py})`}>
        <rect className="ev-co-bg" x={x0} y={-height / 2} width={width} height={height} />
        <rect className="ev-co-bar" x={side === 1 ? x0 : x0 + width - 3} y={-height / 2} width={3} height={height} />
        <text className="ev-co-club" x={tx} y={-height / 2 + 24}>
          {clubName.toUpperCase()}
        </text>
        <text className="ev-co-title" x={tx} y={-height / 2 + 49}>
          {event.title}
        </text>
        <text className="ev-co-meta" x={tx} y={-height / 2 + 69}>
          {meta}
        </text>
        <text className="ev-co-open" x={tx} y={-height / 2 + 87}>
          {open}
        </text>
      </g>
    </g>
  );
}

type Pt2 = { x: number; y: number; r: number };

export default function EventUniverse({ views, todayISO }: { views: EventView[]; todayISO: string }) {
  const { travelTo } = useTravel();
  const tier = useMotionTier();
  const touch = useMediaQuery("(hover: none)") === true;
  const today = useToday(todayISO);

  const byId = useMemo(() => new Map(views.map((v) => [v.event.id, v])), [views]);
  const { upcoming, past } = useMemo(() => splitEvents(views.map((v) => v.event), today), [views, today]);

  const orbs = useMemo(() => orbLayout(upcoming.map((e) => e.id)), [upcoming]);
  const trail = useMemo(() => trailLayout(past.map((e) => e.id)), [past]);
  const hiddenAhead = Math.max(0, upcoming.length - orbs.length);

  // Hover / focus state. `last` keeps the plate mounted while it fades out.
  const [active, setActive] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const activeRef = useRef<string | null>(null);
  const touchRef = useRef(false);
  touchRef.current = touch;

  const h = useMemo<Handlers>(() => {
    const set = (id: string | null) => {
      activeRef.current = id;
      setActive(id);
      if (id) setLast(id);
    };
    return {
      enter: (id) => set(id),
      leave: (id) => {
        if (activeRef.current === id) set(null);
      },
      activate: (id, el, viaKey) => {
        // Touch: first tap shows the plate, second tap travels. Mouse and keyboard travel at once.
        if (touchRef.current && !viaKey && activeRef.current !== id) {
          set(id);
          return;
        }
        const view = byId.get(id);
        if (!view) return;
        const core = el.querySelector(".orb-core, .dot") ?? el;
        const origin = centerOf(core);
        rememberOrb(id, origin);
        travelTo(`/events/${id}`, { origin, accent: view.identity.accent, label: view.event.title });
      },
    };
  }, [byId, travelTo]);

  const clear = useCallback(() => {
    activeRef.current = null;
    setActive(null);
  }, []);

  // One radial gradient pair per accent that appears in the scene.
  const accents = useMemo(() => Array.from(new Set(views.map((v) => v.identity.accent))), [views]);

  const lastView = last ? byId.get(last) : undefined;
  const lastAt: Pt2 | undefined = useMemo(() => {
    if (!last) return undefined;
    const o = orbs.find((s) => s.id === last);
    if (o) return { x: o.x, y: o.y, r: o.r };
    const t = trail.find((s) => s.id === last);
    return t ? { x: t.x, y: t.y, r: t.r } : undefined;
  }, [last, orbs, trail]);
  const lastIsPast = last ? trail.some((s) => s.id === last) : false;

  const now = arcPoint(NOW_T);
  const nearest = orbs[0] ? byId.get(orbs[0].id) : undefined;
  const glowVar = nearest?.identity.accent ?? "#ece7dc";
  const trailMid = trail[Math.floor(trail.length / 2)];

  return (
    <MotionConfig reducedMotion="user">
      <section
        className="ev-root relative h-dvh min-h-[560px] overflow-hidden"
        data-tier={tier}
        style={{ "--a": glowVar } as CSSProperties}
      >
        {/* Soft light from the nearest event, static gradient only. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 55% at 16% 92%, ${glowVar}1c 0%, transparent 70%)`,
          }}
        />

        <svg
          className="ev-svg absolute inset-0 h-full w-full"
          viewBox={`0 0 ${STAGE.w} ${STAGE.h}`}
          preserveAspectRatio="xMidYMid meet"
          role="group"
          aria-label="Events on a timeline, soonest nearest"
        >
          <defs>
            {accents.map((c) => (
              <g key={c}>
                <radialGradient id={`ev-halo-${hex(c)}`}>
                  <stop offset="0" stopColor={c} stopOpacity="0.5" />
                  <stop offset="0.42" stopColor={c} stopOpacity="0.16" />
                  <stop offset="1" stopColor={c} stopOpacity="0" />
                </radialGradient>
                <radialGradient id={`ev-core-${hex(c)}`} cx="0.36" cy="0.32" r="0.8">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
                  <stop offset="0.3" stopColor={c} stopOpacity="1" />
                  <stop offset="1" stopColor={c} stopOpacity="0.5" />
                </radialGradient>
              </g>
            ))}
          </defs>

          {/* Tapping empty space clears a touch selection. */}
          <rect x={-2000} y={-2000} width={6000} height={6000} fill="transparent" onPointerDown={clear} />

          <path className="ev-arc ev-arc-past" d={arcPath(TRAIL_RANGE[0], TRAIL_RANGE[1], 16)} />
          {orbs.length > 0 && <path className="ev-arc" d={arcPath(ORB_RANGE[0], ORB_RANGE[1])} />}

          {/* NOW marker */}
          <circle className="ev-now-dot" cx={now.x} cy={now.y} r={3} />
          <text className="ev-now-label" x={now.x + 3} y={now.y - 16} textAnchor="middle">
            NOW
          </text>

          {/* Past: a dim trail behind now */}
          {trail.map((s) => {
            const v = byId.get(s.id);
            return v ? <TrailDot key={s.id} spec={s} view={v} on={active === s.id} h={h} /> : null;
          })}
          {trailMid && past.length > 0 && (
            <text className="ev-trail-label" x={28} y={trailMid.y - 26}>
              {`PAST · ${past.length}`}
            </text>
          )}

          {/* Upcoming: furthest first, so nearer lights sit on top */}
          {[...orbs].reverse().map((s) => {
            const v = byId.get(s.id);
            if (!v) return null;
            const i = orbs.indexOf(s);
            return (
              <Orb
                key={s.id}
                spec={s}
                view={v}
                index={i}
                soon={daysBetween(today, v.event.date) <= 7}
                on={active === s.id}
                h={h}
              />
            );
          })}

          {hiddenAhead > 0 && (
            <text className="ev-trail-label" x={STAGE.w - 60} y={arcPoint(0.99).y - 30} textAnchor="end">
              {`+${hiddenAhead} BEYOND THE HORIZON`}
            </text>
          )}

          {/* Plate: above everything */}
          {lastView && lastAt && (
            <Callout at={lastAt} view={lastView} past={lastIsPast} today={today} touch={touch} on={active === last} />
          )}
        </svg>

        {/* Title block, top-left under the HUD */}
        <div className="pointer-events-none absolute left-5 top-24 z-10 md:left-12 md:top-28">
          <p className="mb-2 text-sm text-bone/60">Event universe</p>
          <div className="overflow-hidden pb-[0.06em]">
            <motion.h1
              className="font-display text-[clamp(2.8rem,6vw,5.5rem)] font-semibold leading-[0.9] tracking-[-0.04em]"
              initial={{ y: "105%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1, delay: 0.35, ease: EASE }}
            >
              Events
            </motion.h1>
          </div>
          <motion.p
            className="mt-4 max-w-xs text-sm leading-relaxed text-bone/65"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 1 }}
          >
            {upcoming.length > 0
              ? "Lights that switch on for a few days. The nearest one is the soonest."
              : "Nothing is lit right now. What has passed sits in the trail below."}
          </motion.p>
        </div>

        {/* Hint, bottom-right (the arc leaves this corner empty) */}
        <motion.p
          className="pointer-events-none absolute bottom-8 right-5 z-10 max-w-[15rem] text-right text-sm leading-relaxed text-ash md:bottom-10 md:right-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 1.4 }}
        >
          {touch ? "Tap a light to read it, tap again to travel in." : "Hover a light to read it, click to travel in."}
        </motion.p>
      </section>
    </MotionConfig>
  );
}
