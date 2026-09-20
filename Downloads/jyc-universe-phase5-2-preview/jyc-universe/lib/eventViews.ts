import { getClubs, getDomains, getEvents } from "./data";
import type { EventView } from "./events";
import { identityFor } from "./identity";
import type { Club, Domain, JycEvent } from "./types";

/**
 * Server-side lookups that join an event with its club's identity.
 * Async: the data source is Supabase, with a local fallback (lib/data.ts).
 */

const FALLBACK = identityFor({ id: "jyc", domain: "technical" }, { accent: "#ece7dc" });

function viewOf(event: JycEvent, clubs: Club[], domains: Domain[]): EventView {
  const club = clubs.find((c) => c.id === event.clubId);
  const domain = club ? domains.find((d) => d.id === club.domain) : undefined;
  return {
    event,
    clubName: club?.name ?? "JYC",
    identity: club && domain ? identityFor(club, domain) : FALLBACK,
  };
}

export async function getEventView(id: string): Promise<EventView | undefined> {
  const [events, clubs, domains] = await Promise.all([getEvents(), getClubs(), getDomains()]);
  const event = events.find((e) => e.id === id);
  return event ? viewOf(event, clubs, domains) : undefined;
}

export async function allEventViews(): Promise<EventView[]> {
  const [events, clubs, domains] = await Promise.all([getEvents(), getClubs(), getDomains()]);
  return events.map((e) => viewOf(e, clubs, domains));
}
