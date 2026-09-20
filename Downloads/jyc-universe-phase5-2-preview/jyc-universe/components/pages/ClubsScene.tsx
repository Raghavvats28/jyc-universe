"use client";

import "./pages.css";
import Link from "next/link";
import { memo, useCallback, useState, type CSSProperties, type MouseEvent } from "react";
import { MotionConfig, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Motif from "@/components/club/Motif";
import { MaskLine } from "@/components/club/Reveal";
import { originOf, useTravel } from "@/components/TravelProvider";
import type { RowClub, WorldGroup } from "@/lib/archive";
import { EASE } from "@/lib/timing";

/**
 * Every club as one line of type, grouped by world. The name is set the way the club sets it
 * (case, tracking, solid or outlined). Hovering or focusing a row lights the name in its accent and fades that
 * club's motif in behind the page: ONE artwork layer at a time, so there is no cost for the other rows.
 * Touch has no hover, so nothing important lives there. Each row travelTo()s into the club space.
 */

const Row = memo(function Row({
  club,
  index,
  onEnter,
  onLeave,
  onOpen,
}: {
  club: RowClub;
  index: number;
  onEnter: (c: RowClub) => void;
  onLeave: (id: string) => void;
  onOpen: (c: RowClub, e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const name = club.titleCase === "lower" ? club.name.toLowerCase() : club.name.toUpperCase();
  const outline = club.titleStyle === "outline" ? "true" : undefined;
  const size = `clamp(2.8rem, min(${(112 / Math.max(club.name.length, 4)).toFixed(1)}vw, 11vw), 9.5rem)`;
  const type: CSSProperties = { fontSize: size, letterSpacing: club.tracking };

  return (
    <li className="border-b border-line">
      <Link
        href={`/club/${club.id}`}
        onClick={(e) => onOpen(club, e)}
        onMouseEnter={() => onEnter(club)}
        onMouseLeave={() => onLeave(club.id)}
        onFocus={() => onEnter(club)}
        onBlur={() => onLeave(club.id)}
        className="pg-row group relative flex items-end justify-between gap-6 py-4 md:py-6"
        style={{ "--a": club.accent } as CSSProperties}
      >
        <span className="relative block overflow-hidden pb-[0.06em]">
          <motion.span
            className="relative block font-display font-semibold leading-[0.95]"
            style={type}
            initial={{ y: "108%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "0px 0px -6% 0px" }}
            transition={{ duration: 1, delay: Math.min(index, 3) * 0.06, ease: EASE }}
          >
            <span className="pg-name" data-outline={outline}>
              {name}
            </span>
            <span aria-hidden className="pg-name-hot font-display" data-outline={outline} style={type}>
              {name}
            </span>
          </motion.span>
        </span>

        <span className="mb-2 flex shrink-0 items-end gap-4 text-right md:mb-4">
          <span className="hidden max-w-[16rem] text-sm leading-snug sm:block">
            <span className="block" style={{ color: club.accent }}>
              {club.note}
            </span>
            <span className="block text-ash">{club.tagline}</span>
          </span>
          <ArrowUpRight className="pg-arrow h-6 w-6 md:h-8 md:w-8" style={{ color: club.accent }} aria-hidden />
        </span>
      </Link>
    </li>
  );
});

export default function ClubsScene({ worlds }: { worlds: WorldGroup[] }) {
  const { travelTo } = useTravel();
  const [hot, setHot] = useState<RowClub | null>(null);

  const enter = useCallback((c: RowClub) => setHot(c), []);
  const leave = useCallback((id: string) => setHot((h) => (h?.id === id ? null : h)), []);
  const open = useCallback(
    (c: RowClub, e: MouseEvent<HTMLAnchorElement>) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      travelTo(`/club/${c.id}`, { origin: originOf(e), accent: c.accent, label: c.name });
    },
    [travelTo],
  );

  const total = worlds.reduce((n, w) => n + w.clubs.length, 0);
  let counter = 0;

  return (
    <MotionConfig reducedMotion="user">
      {/* The one artwork layer: a soft, masked motif of the hovered club. Decorative only. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{ opacity: hot ? 1 : 0, transition: "opacity 0.4s ease" }}>
        {hot && (
          <div
            key={hot.id}
            className="pg-motif absolute inset-0"
            style={{
              maskImage: "radial-gradient(ellipse at 70% 50%, #000 0%, transparent 72%)",
              WebkitMaskImage: "radial-gradient(ellipse at 70% 50%, #000 0%, transparent 72%)",
            }}
          >
            <Motif kind={hot.motif} accent={hot.accent} seed={hot.heroSeed} className="opacity-60" />
          </div>
        )}
      </div>

      <section className="relative z-10 px-5 pb-24 pt-28 md:px-12 md:pb-32 md:pt-36">
        <p className="mb-3 text-sm text-bone/60">{total} clubs across {worlds.length} worlds</p>
        <MaskLine className="mb-16 font-display text-[clamp(3rem,9vw,8rem)] font-semibold leading-[0.88] tracking-[-0.045em] md:mb-24" delay={0.2}>
          <h1>Clubs</h1>
        </MaskLine>

        {worlds.map((w) => (
          <section key={w.id} aria-label={`${w.name} clubs`} className="mb-16 md:mb-24">
            <motion.div
              className="mb-2 flex items-baseline gap-4 border-t pt-4 text-sm"
              style={{ borderColor: `${w.accent}66` }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: w.accent }} />
              <h2 className="font-display text-base font-semibold tracking-[0.3em]" style={{ color: w.accent }}>
                {w.name}
              </h2>
              <span className="hidden text-ash sm:inline">{w.tagline}</span>
              <span className="flex-1" />
              <button
                type="button"
                onClick={(e) => travelTo(`/domain/${w.id}`, { origin: originOf(e), accent: w.accent, label: w.name })}
                className="border-b border-bone/30 pb-0.5 text-bone/70 transition-colors hover:border-bone hover:text-bone"
              >
                Enter the world
              </button>
            </motion.div>

            {w.clubs.length === 0 ? (
              <p className="border-t border-line py-6 text-bone/60">Clubs coming soon.</p>
            ) : (
              <ul className="border-t border-line">
                {w.clubs.map((c) => (
                  <Row key={c.id} club={c} index={counter++ % 4} onEnter={enter} onLeave={leave} onOpen={open} />
                ))}
              </ul>
            )}
          </section>
        ))}
      </section>
    </MotionConfig>
  );
}
