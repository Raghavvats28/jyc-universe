import { fullDate } from "@/lib/dates";
import { getEventView } from "@/lib/eventViews";
import { ogScene, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const alt = "An event in the JYC universe";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Event cards lead with the date, because that is what a share is usually about. */
export default async function Image({ params }: { params: { id: string } }) {
  const view = await getEventView(params.id);
  if (!view) return ogScene({ title: "JYC", accent: "#ece7dc" });
  const { event, clubName, identity } = view;
  return ogScene({
    kicker: clubName,
    title: event.title,
    sub: `${fullDate(event.date)} · ${event.time} · ${event.location}`,
    accent: identity.accent,
  });
}
