"use client";

import { useCallback, useMemo, useState, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { originOf, useTravel } from "@/components/TravelProvider";
import { useToday } from "@/hooks/useToday";
import { dayOf, monthOf, splitEvents, whenLabel } from "@/lib/dates";
import type { EventView } from "@/lib/events";
import { centerOf, rememberOrb } from "./orbOrigin";

/**
 * Phones: no scene, just a list. Upcoming events first (soonest on top), each with a small
 * lit dot in its club's colour; past events are folded away under one toggle.
 * Tapping a row travels into /events/[id] from that row's dot.
 */
export default function EventList({ views, todayISO }: { views: EventView[]; todayISO: string }) {
  const { travelTo } = useTravel();
  const today = useToday(todayISO);
  const [showPast, setShowPast] = useState(false);

  const byId = useMemo(() => new Map(views.map((v) => [v.event.id, v])), [views]);
  const { upcoming, past } = useMemo(() => splitEvents(views.map((v) => v.event), today), [views, today]);

  const open = useCallback(
    (v: EventView, e: MouseEvent<HTMLButtonElement>) => {
      const dot = e.currentTarget.querySelector("[data-orb]");
      const origin = dot ? centerOf(dot) : originOf(e);
      rememberOrb(v.event.id, origin);
      travelTo(`/events/${v.event.id}`, { origin, accent: v.identity.accent, label: v.event.title });
    },
    [travelTo],
  );

  const row = (id: string, isPast: boolean, i: number) => {
    const v = byId.get(id);
    if (!v) return null;
    const { event, clubName, identity } = v;
    const a = identity.accent;
    return (
      <motion.li
        key={id}
        className="border-b border-line"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 + Math.min(i, 8) * 0.07, duration: 0.6 }}
      >
        <button
          type="button"
          onClick={(e) => open(v, e)}
          className={`flex w-full items-center gap-4 py-5 text-left active:opacity-60 ${isPast ? "opacity-60" : ""}`}
        >
          <span
            data-orb
            aria-hidden
            className="h-3 w-3 shrink-0 rounded-full"
            style={{
              background: a,
              boxShadow: isPast ? "none" : `0 0 14px 3px ${a}88, 0 0 34px 8px ${a}33`,
              opacity: isPast ? 0.5 : 1,
            }}
          />
          <span className="w-12 shrink-0 leading-none">
            <span className="block font-display text-3xl font-semibold tracking-tight">{dayOf(event.date)}</span>
            <span className="mt-1 block text-[11px] font-medium tracking-[0.2em] text-bone/60">{monthOf(event.date)}</span>
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-display text-2xl font-semibold leading-tight tracking-tight">{event.title}</span>
            <span className="text-sm text-ash">
              <span style={{ color: a }}>{clubName}</span> · {event.time}
              {!isPast && <> · {whenLabel(event.date, today)}</>}
            </span>
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-bone/50" aria-hidden />
        </button>
      </motion.li>
    );
  };

  return (
    <section className="px-5 pb-20 pt-28">
      <p className="mb-2 text-sm text-bone/60">Event universe</p>
      <h1 className="font-display text-[clamp(3rem,16vw,6rem)] font-semibold leading-[0.9] tracking-[-0.04em]">Events</h1>
      <p className="mt-4 max-w-xs text-sm leading-relaxed text-bone/65">
        Lights that switch on for a few days. Soonest first.
      </p>

      <h2 className="mb-2 mt-10 flex items-baseline gap-3 text-sm text-bone/70">
        Upcoming <span className="text-ash">{upcoming.length}</span>
      </h2>
      {upcoming.length === 0 ? (
        <p className="border-t border-line pt-5 text-bone/60">Nothing is lit right now. Check back soon.</p>
      ) : (
        <ul className="border-t border-line">{upcoming.map((e, i) => row(e.id, false, i))}</ul>
      )}

      {past.length > 0 && (
        <div className="mt-10">
          <button
            type="button"
            onClick={() => setShowPast((s) => !s)}
            aria-expanded={showPast}
            aria-controls="past-events"
            className="flex w-full items-center justify-between border-y border-line py-4 text-sm text-bone/70"
          >
            <span className="flex items-baseline gap-3">
              Past <span className="text-ash">{past.length}</span>
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showPast ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {showPast && (
            <ul id="past-events" className="border-b border-line">
              {past.map((e, i) => row(e.id, true, i))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
