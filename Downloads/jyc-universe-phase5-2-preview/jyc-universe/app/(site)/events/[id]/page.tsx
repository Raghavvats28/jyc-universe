import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetail from "@/components/events/EventDetail";
import { getEvents } from "@/lib/data";
import { getEventView } from "@/lib/eventViews";
import { fullDate } from "@/lib/dates";

export const revalidate = 300;
// Events added in the database after a build are rendered on first visit instead of a 404.
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getEvents()).map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const v = await getEventView(params.id);
  if (!v) return { title: "Event not found" };
  const { event, clubName } = v;
  const title = `${event.title} · ${clubName}`;
  const description = `${fullDate(event.date)} · ${event.time} · ${event.location}. ${event.description}`;
  return {
    title,
    description,
    alternates: { canonical: `/events/${event.id}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/events/${event.id}`,
      // Crawlers read this as the date the thing happens.
      publishedTime: new Date(`${event.date}T00:00:00Z`).toISOString(),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const view = await getEventView(params.id);
  if (!view) notFound();
  return (
    <EventDetail
      view={view}
      // Rendered with the build-time date; the client corrects it to the visitor's real date on mount.
      todayISO={new Date().toISOString().slice(0, 10)}
    />
  );
}
