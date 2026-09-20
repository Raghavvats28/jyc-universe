"use client";

import { motion } from "framer-motion";
import { EASE } from "@/lib/timing";
import type { ClubIdentity } from "@/lib/identity";
import type { Club } from "@/lib/types";
import { FloorHead, MaskLine } from "../Reveal";

/**
 * Floor 2: achievements as a timeline. Years are oversized outlined numerals,
 * the line draws itself segment by segment as each entry scrolls into view.
 */
export default function MilestonesFloor({ club, identity }: { club: Club; identity: ClubIdentity }) {
  const a = identity.accent;
  const items = [...club.achievements].sort((x, y) => y.year - x.year);

  return (
    <section id="floor-achievements" aria-label="Achievements" tabIndex={-1} className="outline-none relative px-5 py-24 md:px-12 md:py-40">
      <FloorHead mark="2" name="Achievements" note={items.length ? `${items.length} milestones` : undefined} accent={a} />

      <div className="grid gap-12 xl:grid-cols-[minmax(0,22rem)_1fr] xl:gap-20">
        <div className="xl:sticky xl:top-32 xl:self-start">
          <MaskLine className="font-display text-[clamp(2.6rem,6vw,5.5rem)] font-semibold leading-[0.9] tracking-[-0.04em]">
            A short
            <br />
            <span style={{ color: a }}>history</span>
          </MaskLine>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-bone/60">Milestones, newest first.</p>
        </div>

        {items.length === 0 ? (
          <p className="text-bone/60">Achievements will appear here.</p>
        ) : (
          <ol className="relative md:grid md:grid-cols-[auto_1.5rem_minmax(0,1fr)] md:gap-x-8 md:gap-y-16">
            {items.map((m, i) => {
              const first = i === 0 || items[i - 1].year !== m.year;
              const last = i === items.length - 1;
              return (
                <li key={`${m.year}-${m.title}`} role="listitem" className="relative grid grid-cols-[1.5rem_1fr] gap-x-5 pb-12 md:contents">
                  {/* Year: shown on the first entry of each year */}
                  <div className="col-start-2 row-start-1 md:col-start-1 md:row-auto">
                    {first && (
                      <span className="club-outline block font-display text-[clamp(3.4rem,8vw,6.2rem)] font-semibold leading-[0.85] tracking-[-0.05em] md:whitespace-nowrap md:text-[clamp(3rem,6vw,5.6rem)] md:text-right">
                        {m.year}
                      </span>
                    )}
                  </div>

                  {/* The spine: a dot and a line segment that draws downward */}
                  <div className="relative col-start-1 row-span-2 row-start-1 md:col-start-2 md:row-auto">
                    <span className="absolute left-1/2 top-3 h-2.5 w-2.5 -translate-x-1/2 rounded-full" style={{ background: a }} />
                    {!last && (
                      <motion.span
                        aria-hidden
                        className="absolute left-1/2 top-6 h-[calc(100%+3rem)] w-px origin-top md:h-[calc(100%+4rem)]"
                        style={{ background: `${a}66`, x: "-50%" }}
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
                    <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight md:text-4xl">{m.title}</h3>
                    {m.detail && <p className="mt-3 max-w-lg leading-relaxed text-bone/60">{m.detail}</p>}
                  </motion.div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
