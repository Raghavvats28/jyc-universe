"use client";

import "./events.css";
import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { MotionConfig, motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Poster from "@/components/club/Poster";
import { originOf, useTravel } from "@/components/TravelProvider";
import { useMotionTier } from "@/hooks/useMotionTier";
import { useToday } from "@/hooks/useToday";
import { fullDate, whenLabel } from "@/lib/dates";
import type { EventView } from "@/lib/events";
import { EASE } from "@/lib/timing";
import { centerOf, takeOrb } from "./orbOrigin";
import ShareButton from "./ShareButton";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Event page. A big portal in the club's colour grows out of the orb that was clicked
 * (its screen position was remembered by the scene / list / poster), then the facts arrive:
 * name, date, time, location, description, poster, registration, share.
 * Transform and opacity only; the loops are `full` tier only.
 */
export default function EventDetail({ view, todayISO }: { view: EventView; todayISO: string }) {
  const { event, clubName, identity } = view;
  const a = identity.accent;
  const { travelTo } = useTravel();
  const tier = useMotionTier();
  const today = useToday(todayISO);
  const past = event.date < today;
  const landRef = useRef<HTMLDivElement>(null);

  // Point the portal's starting position at the orb that was clicked, then let it grow.
  useIsoLayoutEffect(() => {
    const el = landRef.current;
    if (!el) return;
    const from = takeOrb(event.id);
    if (from) {
      const c = centerOf(el);
      el.style.setProperty("--fx", `${Math.round(from.x - c.x)}px`);
      el.style.setProperty("--fy", `${Math.round(from.y - c.y)}px`);
    }
    el.setAttribute("data-land", "");
  }, [event.id]);

  const facts: Array<[string, string]> = [
    ["Date", fullDate(event.date)],
    ["Time", event.time],
    ["Location", event.location],
  ];

  return (
    <MotionConfig reducedMotion="user">
      <article className="ev-detail relative overflow-hidden" data-tier={tier} style={{ "--a": a } as CSSProperties}>
        {/* The portal: static gradients + three thin rings. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[44vmin] top-[6vh] z-0 h-[90vmin] w-[90vmin] lg:-right-[12vmin] lg:top-1/2 lg:h-[108vmin] lg:w-[108vmin] lg:-translate-y-1/2"
        >
          <div ref={landRef} className="ev-land absolute inset-0">
            <div className="ev-breathe absolute inset-0">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle at 36% 32%, #ffffffd0 0%, ${a} 8%, ${a}a0 22%, ${a}38 44%, ${a}10 60%, transparent 71%)`,
                }}
              />
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 200" fill="none" stroke={a}>
                <circle className="ev-spin" cx="100" cy="100" r="80" strokeOpacity="0.5" strokeDasharray="1 5" />
                <circle className="ev-spin-rev" cx="100" cy="100" r="92" strokeOpacity="0.35" strokeDasharray="10 16" />
                <circle cx="100" cy="100" r="68" strokeOpacity="0.22" />
              </svg>
            </div>
          </div>
        </div>

        <section className="relative z-10 grid min-h-dvh content-end gap-12 px-5 pb-16 pt-28 md:px-12 md:pb-20 lg:grid-cols-[minmax(0,1.1fr)_auto] lg:items-end lg:gap-20">
          <div>
            <motion.button
              type="button"
              onClick={(e) => travelTo("/events", { origin: originOf(e), label: "Events" })}
              className="mb-10 flex items-center gap-2 text-sm text-bone/70 transition-colors hover:text-bone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All events
            </motion.button>

            <motion.p
              className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <button
                type="button"
                onClick={(e) => travelTo(`/club/${event.clubId}`, { origin: originOf(e), accent: a, label: clubName })}
                className="border-b pb-0.5 font-medium tracking-wide"
                style={{ color: a, borderColor: `${a}66` }}
              >
                {clubName}
              </button>
              <span className="text-bone/60">{past ? "Past event" : whenLabel(event.date, today)}</span>
            </motion.p>

            <div className="overflow-hidden pb-[0.08em]">
              <motion.h1
                className="font-display text-[clamp(2.8rem,9vw,8rem)] font-semibold leading-[0.92] tracking-[-0.04em]"
                initial={{ y: "108%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.1, delay: 0.55, ease: EASE }}
              >
                {event.title}
              </motion.h1>
            </div>

            <motion.dl
              className="mt-10 grid max-w-2xl gap-6 border-t border-line pt-6 sm:grid-cols-3"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.05, ease: EASE }}
            >
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.24em] text-ash">{k}</dt>
                  <dd className="mt-2 font-display text-xl leading-snug">{v}</dd>
                </div>
              ))}
            </motion.dl>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.2, ease: EASE }}
            >
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-bone/75">{event.description}</p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                {event.registrationUrl && !past ? (
                  <a
                    href={event.registrationUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-void transition-opacity hover:opacity-90"
                    style={{ background: a }}
                  >
                    Register
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <span className="border px-5 py-3 text-sm text-ash" style={{ borderColor: `${a}33` }}>
                    {past ? "Registration is closed" : "Registration link coming soon"}
                  </span>
                )}
                <ShareButton title={event.title} text={`${event.title} · ${fullDate(event.date)} · ${event.time} · ${clubName}`} accent={a} />
              </div>
            </motion.div>
          </div>

          <motion.div
            className="justify-self-start lg:justify-self-end"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.95, ease: EASE }}
          >
            <Poster event={event} clubName={clubName} identity={identity} size="lead" past={past} />
          </motion.div>
        </section>

        <nav aria-label="More" className="relative z-10 flex flex-wrap gap-x-10 gap-y-4 px-5 pb-16 text-sm md:px-12">
          <button
            type="button"
            onClick={(e) => travelTo(`/club/${event.clubId}`, { origin: originOf(e), accent: a, label: clubName })}
            className="border-b border-bone/40 pb-1 transition-colors hover:border-bone"
          >
            More from {clubName}
          </button>
          <button
            type="button"
            onClick={(e) => travelTo("/events", { origin: originOf(e), label: "Events" })}
            className="border-b border-bone/40 pb-1 transition-colors hover:border-bone"
          >
            Back to the event universe
          </button>
        </nav>
      </article>
    </MotionConfig>
  );
}
