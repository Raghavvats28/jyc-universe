"use client";

import dynamic from "next/dynamic";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { EventView } from "@/lib/events";
import EventList from "./EventList";

/**
 * The event universe is loaded on demand: only screens 900px and wider ever download it (SVG + stylesheet).
 * Phones get the simple list, then the detail page.
 */
const EventUniverse = dynamic(() => import("./EventUniverse"), { ssr: false, loading: () => null });

export default function EventsScene({ views, todayISO }: { views: EventView[]; todayISO: string }) {
  const wide = useMediaQuery("(min-width: 900px)");

  // Wait for the screen size so phones never mount the universe and desktops never flash the list.
  if (wide === null) {
    return (
      <section className="min-h-dvh">
        <h1 className="sr-only">Events</h1>
      </section>
    );
  }

  return wide ? <EventUniverse views={views} todayISO={todayISO} /> : <EventList views={views} todayISO={todayISO} />;
}
