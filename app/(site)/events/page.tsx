import type { Metadata } from "next";
import EventsScene from "@/components/events/EventsScene";
import { allEventViews } from "@/lib/eventViews";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Events | JYC",
  description: "Upcoming JYC events as lights on a timeline, and the trail of what has passed.",
};

export default async function EventsPage() {
  return (
    <EventsScene
      views={await allEventViews()}
      // Rendered with the build-time date; the client corrects it to the visitor's real date on mount.
      todayISO={new Date().toISOString().slice(0, 10)}
    />
  );
}
