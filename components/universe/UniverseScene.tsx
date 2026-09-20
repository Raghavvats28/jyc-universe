"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { MotionConfig, motion } from "framer-motion";
import { useSite } from "@/components/SiteProvider";
import { originOf, useTravel } from "@/components/TravelProvider";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import UniverseMap, { titleCase, type UniverseView } from "./UniverseMap";
import ViewToggle from "./ViewToggle";

const VIEW_KEY = "jyc-universe-view";

/** Phone preview panel: what hover shows on desktop, plus the way in. */
function WorldPreview({ id, className = "mt-3 w-full max-w-[26rem]" }: { id: string | null; className?: string }) {
  const { getDomain } = useSite();
  const { travelTo } = useTravel();
  const domain = id ? getDomain(id) : undefined;

  return (
    <div className={`min-h-[5.5rem] border-t border-line pt-4 ${className}`} aria-live="polite">
      {domain ? (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold tracking-tight">{titleCase(domain.name)}</p>
            <p className="mt-0.5 text-sm text-bone/60">{domain.tagline}</p>
          </div>
          <button
            type="button"
            onClick={(e: MouseEvent) =>
              travelTo(`/domain/${domain.id}`, { origin: originOf(e), accent: domain.accent, label: domain.name })
            }
            className="min-h-11 shrink-0 border px-5 text-[11px] font-medium tracking-[0.24em] text-bone"
            style={{ borderColor: domain.accent }}
            aria-label={`Enter ${titleCase(domain.name)}`}
          >
            Enter
          </button>
        </div>
      ) : (
        <p className="text-sm text-bone/50">Tap a constellation to preview it.</p>
      )}
    </div>
  );
}

export default function UniverseScene() {
  // null until mounted, then true on tablets and desktops. Only the layout in use is ever rendered.
  const wide = useMediaQuery("(min-width: 768px)");
  // Touch-first devices (phones, iPads): a tap previews, a second tap enters. Also true before mount.
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  // Remember the last view, so coming back from a world lands on the same map. Read up front (not
  // in an effect) so a saved 3D view never flashes 2D and animates over. Safe for hydration: the
  // map itself only renders after mount, once `wide` is known, and nothing before it uses the view.
  const [view, setView] = useState<UniverseView>(() => {
    if (typeof window === "undefined") return "2d";
    try {
      const saved = window.localStorage.getItem(VIEW_KEY);
      return saved === "3d" ? "3d" : "2d";
    } catch {
      return "2d"; // storage blocked: the default view is fine
    }
  });
  const [selected, setSelected] = useState<string | null>(null);

  const changeView = useCallback((next: UniverseView) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  // A tap-preview belongs to one layout: rotating the device starts clean.
  useEffect(() => {
    setSelected(null);
  }, [wide]);

  return (
    <MotionConfig reducedMotion="user">
    <section className="relative min-h-dvh">
      <h1 className="sr-only">The JYC universe</h1>

      {/* Desktop and tablet: the full map */}
      {wide === true && (
        <div className="relative h-dvh">
          <UniverseMap
            layout="wide"
            view={view}
            selected={selected}
            onSelect={setSelected}
            className="absolute inset-0 overflow-hidden"
          />

          <motion.div
            className="absolute right-10 top-24 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2 }}
          >
            <ViewToggle view={view} onChange={changeView} />
          </motion.div>

          {canHover === false ? (
            // iPad and landscape phones: the wide map, with the phone preview panel.
            <div className="absolute bottom-6 left-6 z-10 w-[min(22rem,42vw)] sm:bottom-10 sm:left-12">
              <WorldPreview id={selected} className="w-full" />
            </div>
          ) : (
            <motion.div
              className="pointer-events-none absolute bottom-10 left-12 hidden max-w-[17rem] [@media(min-height:560px)]:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 2.2 }}
            >
              <p className="font-display text-3xl font-semibold leading-tight tracking-tight">Choose a world.</p>
              <p className="mt-2 text-sm leading-relaxed text-bone/60">
                Hover a constellation to see what lives there, click to travel.
              </p>
            </motion.div>
          )}

          <motion.div
            className="pointer-events-none absolute bottom-10 right-12 hidden items-center [@media(min-height:560px)]:flex gap-3 text-sm text-bone/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2.4 }}
          >
            <svg width="36" height="2" aria-hidden>
              <line x1="0" y1="1" x2="36" y2="1" stroke="#ece7dc" strokeOpacity="0.5" strokeDasharray="3 5" />
            </svg>
            Worlds that work together
          </motion.div>
        </div>
      )}

      {/* Phones: the same map, laid out for a portrait screen */}
      {wide === false && (
        <div className="flex min-h-dvh flex-col items-center px-4 pb-12 pt-24">
          <p className="mb-1 text-sm text-bone/60">Jaypee Youth Club</p>
          <p className="mb-4 font-display text-2xl font-semibold tracking-tight">Pick a world to enter.</p>
          <ViewToggle view={view} onChange={changeView} />
          <UniverseMap
            layout="tall"
            view={view}
            selected={selected}
            onSelect={setSelected}
            className="relative mt-2 aspect-[2/3] w-full max-w-[26rem]"
          />
          <WorldPreview id={selected} />
        </div>
      )}
    </section>
    </MotionConfig>
  );
}
