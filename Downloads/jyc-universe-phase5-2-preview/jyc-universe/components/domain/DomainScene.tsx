"use client";

import type { CSSProperties } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { originOf, useTravel } from "@/components/TravelProvider";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { planetSurface } from "@/lib/atmosphere";
import type { CityLayout } from "@/lib/city";
import { identityFor } from "@/lib/identity";
import { EASE } from "@/lib/timing";
import type { Club, Domain } from "@/lib/types";

/**
 * The city is loaded on demand: only desktop/tablet-width screens that have a city for
 * this world ever download it (SVG + its stylesheet). Phones never do.
 */
const CityScene = dynamic(() => import("@/components/city/CityScene"), { ssr: false, loading: () => null });

/**
 * Arrival scene for a world.
 *  - Worlds with a city (Technical) on md+ screens: the illustrated city.
 *  - Everything else (other worlds, and phones): the planet, the story and the club list.
 *    On phones the list is tappable and leads straight into the club space.
 */
export default function DomainScene({ domain, clubs, city }: { domain: Domain; clubs: Club[]; city?: CityLayout }) {
  const { travelTo } = useTravel();
  const wide = useMediaQuery("(min-width: 768px)");
  const { accent } = domain;
  const title = domain.name;

  if (city) {
    // Wait for the screen size so phones never mount the city and desktops never flash the list.
    if (wide === null) {
      return (
        <section className="min-h-dvh">
          <h1 className="sr-only">{title}</h1>
        </section>
      );
    }
    if (wide) return <CityScene domain={domain} clubs={clubs} layout={city} />;
  }

  const open = Boolean(city);

  return (
    <section
      className="relative flex min-h-dvh flex-col overflow-hidden px-5 pb-10 pt-28 md:px-12 md:pb-14"
      style={{ "--accent": accent } as CSSProperties}
    >
      {/* The planet: static CSS only (gradient + surface texture + shadow) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[30vmin] top-24 h-[85vmin] w-[85vmin] md:-right-[18vmin] md:top-1/2 md:h-[96vmin] md:w-[96vmin] md:-translate-y-1/2"
      >
        <motion.div
          className="relative h-full w-full rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 28%, ${accent}66 0%, ${accent}22 30%, #0b0c0c 70%)`,
            boxShadow: `0 0 180px ${accent}1f, inset -40px -30px 120px rgba(0,0,0,0.75)`,
          }}
          initial={{ opacity: 0, scale: 1.22 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: EASE }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundImage: planetSurface(domain.atmosphere, accent),
              WebkitMaskImage: "radial-gradient(circle at 30% 30%, #000 0%, transparent 72%)",
              maskImage: "radial-gradient(circle at 30% 30%, #000 0%, transparent 72%)",
            }}
          />
        </motion.div>
      </div>

      <div className="relative z-10 mt-auto grid gap-10 md:grid-cols-[1fr_26rem] md:items-end md:gap-14">
        <div>
          <p className="mb-3 text-sm text-bone/60">{domain.tagline}</p>

          <div className="overflow-hidden pb-[0.06em]">
            <motion.h1
              className="font-display text-[clamp(3.4rem,14vw,14rem)] font-semibold leading-[0.88] tracking-[-0.045em]"
              style={{ color: accent }}
              initial={{ y: "105%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1.1, delay: 0.45, ease: EASE }}
            >
              {title}
            </motion.h1>
          </div>

          <motion.p
            className="mt-6 max-w-md leading-relaxed text-bone/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 1.1 }}
          >
            {domain.description}
          </motion.p>

          <motion.button
            type="button"
            onClick={(e) => travelTo("/universe", { origin: originOf(e), label: "Universe" })}
            className="mt-8 w-fit border-b border-bone/40 pb-1 text-sm transition-colors hover:border-bone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 1.3 }}
          >
            Back to the universe
          </motion.button>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 1.2 }}>
          <h2 className="mb-3 text-sm text-bone/60">Clubs in this city</h2>
          <ul className="border-t border-line">
            {clubs.map((c) => {
              const id = identityFor(c, domain);
              const row = (
                <>
                  <span className="font-display text-2xl font-medium tracking-tight md:text-3xl">{c.name}</span>
                  <span className="text-sm text-ash">{open ? id.cityNote : c.tagline}</span>
                </>
              );
              return (
                <li key={c.id} className="border-b border-line">
                  {open ? (
                    <button
                      type="button"
                      className="flex w-full items-baseline justify-between gap-4 py-3.5 text-left transition-opacity active:opacity-60"
                      onClick={(e) => travelTo(`/club/${c.id}`, { origin: originOf(e), accent: id.accent, label: c.name })}
                    >
                      {row}
                    </button>
                  ) : (
                    <div className="flex items-baseline justify-between gap-4 py-3.5">{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-ash">{open ? "Tap a club to step inside." : "The city map and club spaces open soon."}</p>
        </motion.div>
      </div>
    </section>
  );
}
