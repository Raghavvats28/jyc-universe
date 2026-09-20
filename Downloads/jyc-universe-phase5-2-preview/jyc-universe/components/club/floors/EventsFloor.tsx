"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { centerOf, rememberOrb } from "@/components/events/orbOrigin";
import { useTravel } from "@/components/TravelProvider";
import type { ClubIdentity } from "@/lib/identity";
import type { Club, JycEvent } from "@/lib/types";
import Poster from "../Poster";
import { FloorHead, MaskLine, Reveal } from "../Reveal";

/**
 * A poster that is a link to /events/[id]. A real link (middle-click, copy link and screen readers work);
 * a plain click travels there with the poster as the camera origin.
 */
function PosterLink({ event, accent, children }: { event: JycEvent; accent: string; children: ReactNode }) {
  const { travelTo } = useTravel();
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const origin = centerOf(e.currentTarget);
    rememberOrb(event.id, origin);
    travelTo(`/events/${event.id}`, { origin, accent, label: event.title });
  };
  return (
    <Link
      href={`/events/${event.id}`}
      onClick={onClick}
      className="group block transition-transform duration-500 ease-out hover:-translate-y-1 focus-visible:-translate-y-1"
    >
      {children}
    </Link>
  );
}

/**
 * Floor 3: events as posters on a wall. Upcoming posters are large and lit,
 * past posters are smaller and dimmed. Both strips scroll sideways on small screens.
 */
export default function EventsFloor({
  club,
  identity,
  upcoming,
  past,
}: {
  club: Club;
  identity: ClubIdentity;
  upcoming: JycEvent[];
  past: JycEvent[];
}) {
  const a = identity.accent;
  const total = upcoming.length + past.length;

  return (
    <section id="floor-events" aria-label="Events" tabIndex={-1} className="outline-none relative py-24 md:py-40">
      <div className="px-5 md:px-12">
        <FloorHead mark="3" name="Events" note={total ? `${total} on the wall` : undefined} accent={a} />
        <MaskLine className="mb-14 font-display text-[clamp(2.6rem,7vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.04em] md:mb-20">
          What&apos;s
          <br />
          <span style={{ color: a }}>on the wall</span>
        </MaskLine>
      </div>

      {/* Upcoming */}
      <div className="px-5 md:px-12">
        <Reveal>
          <h3 className="mb-5 flex items-baseline gap-3 text-sm text-bone/70">
            Upcoming <span className="text-ash">{upcoming.length}</span>
          </h3>
        </Reveal>
      </div>
      {upcoming.length === 0 ? (
        <p className="px-5 text-bone/60 md:px-12">Nothing scheduled right now. Check back soon.</p>
      ) : (
        <ul className="no-scrollbar flex snap-x gap-4 overflow-x-auto px-5 pb-2 md:gap-6 md:px-12">
          {upcoming.map((e, i) => (
            <li key={e.id} className={i % 2 === 1 ? "md:mt-10" : ""}>
              <Reveal delay={i * 0.08}>
                <PosterLink event={e} accent={a}>
                  <Poster event={e} clubName={club.name} identity={identity} size="lead" linked />
                </PosterLink>
              </Reveal>
            </li>
          ))}
        </ul>
      )}

      {/* Past */}
      {past.length > 0 && (
        <>
          <div className="mt-20 px-5 md:mt-28 md:px-12">
            <Reveal>
              <h3 className="mb-5 flex items-baseline gap-3 text-sm text-bone/70">
                Past <span className="text-ash">{past.length}</span>
              </h3>
            </Reveal>
          </div>
          <ul className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-5 pb-2 md:gap-4 md:px-12">
            {past.map((e, i) => (
              <li key={e.id}>
                <Reveal delay={i * 0.06} y={18}>
                  <PosterLink event={e} accent={a}>
                    <Poster event={e} clubName={club.name} identity={identity} size="small" past linked />
                  </PosterLink>
                </Reveal>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
