"use client";

import "./city.css";
import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import { MotionConfig, motion, useTransform } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { originOf, useTravel } from "@/components/TravelProvider";
import { useMotionTier } from "@/hooks/useMotionTier";
import { planetSurface } from "@/lib/atmosphere";
import { RETURN_KEY, spotCenter, themeVars, type CityLayout } from "@/lib/city";
import { P } from "@/lib/iso";
import { identityFor } from "@/lib/identity";
import { EASE } from "@/lib/timing";
import type { Club, Domain } from "@/lib/types";
import CityMinimap, { type MinimapDot } from "./CityMinimap";
import CityWorld from "./CityWorld";
import { useCityCamera } from "./useCityCamera";

/**
 * The city scene for any world that has a layout (lib/city.ts). Colours, set dressing and the
 * silhouettes come from the layout, so this component is the same for Technical and Music.
 *
 *   sky layer   : the world's planet, drifting at 12% of the camera (parallax)
 *   world layer : one SVG city, panned with a translate only
 *   overlays    : title, club index, hint (HTML, outside the pan)
 *
 * Clicking a building measures it on screen and hands that point to travelTo(),
 * so the existing camera transition zooms into THAT building.
 */
export default function CityScene({ domain, clubs, layout }: { domain: Domain; clubs: Club[]; layout: CityLayout }) {
  const tier = useMotionTier();
  const { travelTo } = useTravel();
  const viewportRef = useRef<HTMLElement>(null);

  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [explored, setExplored] = useState(false);
  const selectedRef = useRef<string | null>(null);

  const accent = domain.accent;

  const initialFocus = useCallback((): [number, number] | null => {
    try {
      const id = sessionStorage.getItem(RETURN_KEY);
      if (!id) return null;
      sessionStorage.removeItem(RETURN_KEY);
      const spot = layout.spots.find((s) => s.clubId === id);
      return spot ? spotCenter(spot) : null;
    } catch {
      return null;
    }
  }, [layout.spots]);

  const cam = useCityCamera({
    viewportRef,
    world: layout.world,
    frame: layout.frame,
    focus: layout.focus,
    initialFocus,
    reduced: tier === "static",
    onFirstDrag: () => setExplored(true),
  });

  // Stable pieces of the camera. `cam` itself is a new object every render, so handlers depend on
  // these instead: otherwise every hover would hand all five buildings new props and re-render them.
  const { didDrag, ensureVisible } = cam;
  const camMV = useMemo(() => ({ x: cam.x, y: cam.y }), [cam.x, cam.y]);

  // Parallax: the planet moves far less than the city.
  const skyX = useTransform(cam.x, (v) => v * 0.12);
  const skyY = useTransform(cam.y, (v) => v * 0.12);

  const enter = useCallback(
    (clubId: string, el: Element) => {
      if (selectedRef.current || didDrag()) return;
      const club = clubs.find((c) => c.id === clubId);
      if (!club) return;
      const identity = identityFor(club, domain);
      const host = viewportRef.current;
      // Aim at the painted building, whichever element triggered this (mouse, keyboard twin, club index).
      const painted = host?.querySelector(`.bld[data-club="${clubId}"]`);
      const body = painted?.querySelector(".bld-body") ?? el.querySelector(".bld-body") ?? el;

      const go = () => {
        const r = body.getBoundingClientRect();
        selectedRef.current = clubId;
        setSelected(clubId);
        travelTo(`/club/${clubId}`, {
          origin: { x: r.left + r.width / 2, y: r.top + r.height * 0.55 },
          accent: identity.accent,
          label: club.name,
        });
      };

      // If the building is partly off screen, glide it into view first so the zoom aims at it.
      const r = body.getBoundingClientRect();
      const v = host?.getBoundingClientRect();
      const offscreen = !!v && (r.left < v.left || r.right > v.right || r.top < v.top || r.bottom > v.bottom);
      if (offscreen && tier !== "static") {
        ensureVisible(body, true);
        window.setTimeout(go, 680);
      } else {
        go();
      }
    },
    [clubs, domain, didDrag, ensureVisible, travelTo, tier],
  );

  // Only keyboard focus pans the camera. A mouse press also focuses the building, and panning
  // then would move it out from under the click (and away from the travel origin).
  const onFocusBuilding = useCallback(
    (_id: string, el: SVGGElement) => {
      let keyboard = true;
      try {
        keyboard = el.matches(":focus-visible");
      } catch {
        /* engines without :focus-visible: treat as keyboard */
      }
      if (keyboard) ensureVisible(el);
    },
    [ensureVisible],
  );

  const enterFromIndex = useCallback(
    (clubId: string) => {
      const el = viewportRef.current?.querySelector(`.bld[data-club="${clubId}"]`);
      if (el) enter(clubId, el);
    },
    [enter],
  );

  const dots = useMemo<MinimapDot[]>(
    () =>
      layout.spots.map((sp) => {
        const [x, y] = P(sp.gx + sp.w / 2, sp.gy + sp.d / 2, 0);
        const club = clubs.find((c) => c.id === sp.clubId);
        return { id: sp.clubId, x, y, accent: club ? identityFor(club, domain).accent : accent };
      }),
    [layout.spots, clubs, domain, accent],
  );

  const items = useMemo(() => clubs.filter((c) => layout.spots.some((s) => s.clubId === c.id)), [clubs, layout.spots]);

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={viewportRef}
        className="city-root relative h-dvh overflow-hidden"
        data-tier={tier}
        style={{ "--accent": accent, ...themeVars(layout.theme) } as CSSProperties}
        onPointerDown={cam.bind.onPointerDown}
        onWheel={cam.bind.onWheel}
      >
        {/* Sky: the world's planet, seen from above the city */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[66%] -translate-x-1/2">
          <motion.div className="will-change-transform" style={{ x: skyX, y: skyY }}>
            <motion.div
              className="relative h-[170vmin] w-[170vmin] rounded-full"
              style={{
                background: `radial-gradient(circle at 50% 12%, ${accent}40 0%, ${accent}14 26%, #0b0c0c 62%)`,
                boxShadow: `0 -30px 160px ${accent}22, inset 0 40px 120px ${accent}0f`,
              }}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.8, ease: EASE }}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundImage: planetSurface(domain.atmosphere, accent),
                  WebkitMaskImage: "radial-gradient(circle at 50% 8%, #000 0%, transparent 46%)",
                  maskImage: "radial-gradient(circle at 50% 8%, #000 0%, transparent 46%)",
                }}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* World: the city, panned by a transform only */}
        <motion.div className="city-stage absolute left-0 top-0 will-change-transform" style={{ x: cam.x, y: cam.y }}>
          {cam.scale > 0 && (
            <CityWorld
              layout={layout}
              domain={domain}
              clubs={clubs}
              scale={cam.scale}
              hovered={hovered}
              selected={selected}
              onHover={setHovered}
              onFocusBuilding={onFocusBuilding}
              onEnter={enter}
            />
          )}
        </motion.div>

        {/* Soft corner light so overlay text stays legible over any part of the city */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 0% 100%, rgba(11,12,12,0.92) 0%, transparent 70%), linear-gradient(to bottom, rgba(11,12,12,0.7) 0%, transparent 18%)",
          }}
        />

        {/* Title block */}
        <div className="pointer-events-none absolute bottom-8 left-5 z-20 md:bottom-10 md:left-12">
          <motion.p
            className="mb-2 text-sm text-bone/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.9 }}
          >
            {domain.tagline}
          </motion.p>
          <div className="overflow-hidden pb-[0.06em]">
            <motion.h1
              className="font-display text-[clamp(2.8rem,6vw,5.6rem)] font-semibold leading-[0.9] tracking-[-0.045em]"
              style={{ color: accent }}
              initial={{ y: "105%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1.1, delay: 0.5, ease: EASE }}
            >
              {domain.name}
            </motion.h1>
          </div>
          <motion.p
            className="mt-2 text-sm text-bone/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 1.1 }}
          >
            City of {items.length} clubs
          </motion.p>
          <motion.button
            type="button"
            data-nodrag
            onClick={(e) => travelTo("/universe", { origin: originOf(e), label: "Universe" })}
            className="pointer-events-auto mt-5 flex w-fit items-center gap-2 border-b border-bone/40 pb-1 text-sm transition-colors hover:border-bone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 1.3 }}
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to the universe
          </motion.button>
        </div>

        {/* Club index: a second way in, and it lights the matching building */}
        <motion.nav
          aria-label={`Clubs in the ${domain.name.toLowerCase()} city`}
          data-nodrag
          className="absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 lg:block xl:right-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 1.4 }}
        >
          <ul className="border-l border-line">
            {items.map((c, i) => {
              const on = hovered === c.id;
              const id = identityFor(c, domain);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onPointerEnter={() => setHovered(c.id)}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={() => setHovered(c.id)}
                    onBlur={() => setHovered(null)}
                    onClick={() => enterFromIndex(c.id)}
                    className="group flex w-44 items-baseline gap-3 py-2 pl-4 text-left transition-opacity"
                    style={{ opacity: hovered && !on ? 0.4 : 1 }}
                  >
                    <span className="text-[11px] tabular-nums tracking-[0.2em] text-ash">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex flex-col">
                      <span
                        className="font-display text-lg font-semibold tracking-tight transition-colors"
                        style={{ color: on ? id.accent : undefined }}
                      >
                        {c.name}
                      </span>
                      <span className="text-xs text-ash">{id.cityNote}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.nav>

        {/*
          Hint: fades away after the first drag/tap-drag. Anchored near the top on phones — the
          bottom of the screen is already the title block and its button there, and the two would
          overlap once this stopped being desktop-only.
        */}
        <motion.p
          className="pointer-events-none absolute left-1/2 top-24 z-20 -translate-x-1/2 px-6 text-center text-sm text-bone/50 md:bottom-10 md:top-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: explored ? 0 : 1 }}
          transition={{ duration: 0.8, delay: explored ? 0 : 2 }}
        >
          Drag to look around · tap a building to enter
        </motion.p>

        <div aria-hidden className="pointer-events-none absolute bottom-8 right-5 z-20 hidden md:bottom-10 md:right-12 md:block">
          <CityMinimap layout={layout} dots={dots} hovered={hovered} cam={camMV} scale={cam.scale} viewportRef={viewportRef} />
        </div>
      </section>
    </MotionConfig>
  );
}
