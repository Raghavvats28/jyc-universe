"use client";

import "./pages.css";
import { MotionConfig, motion } from "framer-motion";
import { FloorHead, MaskLine } from "@/components/club/Reveal";
import { originOf, useTravel } from "@/components/TravelProvider";
import type { AboutEntry } from "@/lib/types";
import { EASE } from "@/lib/timing";

/**
 * The JYC story as a timeline, oldest first. Years are oversized outlined numerals, the spine draws
 * itself segment by segment as each beat scrolls into view (transform only). The content is data
 * (`aboutStory` in lib/sample.ts, or the about_entries table), so replacing the placeholders needs no change here.
 */
export default function AboutScene({ intro, story }: { intro: string; story: AboutEntry[] }) {
  const { travelTo } = useTravel();
  const items = [...story].sort((a, b) => a.year - b.year);
  const accent = "#ece7dc";

  return (
    <MotionConfig reducedMotion="user">
      <section className="px-5 pb-16 pt-28 md:px-12 md:pt-36">
        <FloorHead mark="J" name="The story" note={items.length ? `${items[0].year} to ${items[items.length - 1].year}` : undefined} accent={accent} />

        <div className="grid gap-12 xl:grid-cols-[minmax(0,26rem)_1fr] xl:gap-24">
          <div className="xl:sticky xl:top-32 xl:self-start">
            <MaskLine className="font-display text-[clamp(3.2rem,7.5vw,7rem)] font-semibold leading-[0.88] tracking-[-0.045em]" delay={0.2}>
              <h1>About</h1>
            </MaskLine>
            <motion.p
              className="mt-8 max-w-sm leading-relaxed text-bone/70"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.8, ease: EASE }}
            >
              {intro}
            </motion.p>
          </div>

          {items.length === 0 ? (
            <p className="text-bone/60">The story will appear here.</p>
          ) : (
            <ol className="relative md:grid md:grid-cols-[auto_1.5rem_minmax(0,1fr)] md:gap-x-8 md:gap-y-16">
              {items.map((m, i) => {
                const first = i === 0 || items[i - 1].year !== m.year;
                const last = i === items.length - 1;
                return (
                  <li key={`${m.year}-${m.title}`} className="relative grid grid-cols-[1.5rem_1fr] gap-x-5 pb-12 md:contents">
                    <div className="col-start-2 row-start-1 md:col-start-1 md:row-auto">
                      {first && (
                        <span className="pg-year block font-display text-[clamp(3.4rem,8vw,6.2rem)] font-semibold leading-[0.85] tracking-[-0.05em] md:whitespace-nowrap md:text-[clamp(3rem,6vw,5.6rem)] md:text-right">
                          {m.year}
                        </span>
                      )}
                    </div>

                    <div className="relative col-start-1 row-span-2 row-start-1 md:col-start-2 md:row-auto">
                      <span className="absolute left-1/2 top-3 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-bone" />
                      {!last && (
                        <motion.span
                          aria-hidden
                          className="absolute left-1/2 top-6 h-[calc(100%+3rem)] w-px origin-top bg-bone/30 md:h-[calc(100%+4rem)]"
                          style={{ x: "-50%" }}
                          initial={{ scaleY: 0 }}
                          whileInView={{ scaleY: 1 }}
                          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
                          transition={{ duration: 1.1, ease: EASE }}
                        />
                      )}
                    </div>

                    <motion.div
                      className="col-start-2 row-start-2 pt-1 md:col-start-3 md:row-auto"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
                      transition={{ duration: 0.9, ease: EASE }}
                    >
                      <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight md:text-4xl">{m.title}</h2>
                      {m.detail && <p className="mt-3 max-w-lg leading-relaxed text-bone/60">{m.detail}</p>}
                    </motion.div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      <section className="px-5 pb-24 md:px-12 md:pb-32">
        <button
          type="button"
          onClick={(e) => travelTo("/universe", { origin: originOf(e), label: "Universe" })}
          className="border-b border-bone/40 pb-1 text-sm transition-colors hover:border-bone"
        >
          Step into the universe
        </button>
      </section>
    </MotionConfig>
  );
}
