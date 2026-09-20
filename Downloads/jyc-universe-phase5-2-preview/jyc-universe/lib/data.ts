import * as React from "react";
import { getStaticCity, type CityLayout, type CitySpot, type Silhouette } from "./city";
import type { ClubIdentity, MotifKind } from "./identity";
import * as sample from "./sample";
import { getSupabase } from "./supabase";
import type {
  AboutEntry,
  Atmosphere,
  Club,
  Domain,
  DomainId,
  JycEvent,
  SiteIndex,
} from "./types";

/**
 * All site content, behind async lookups. SERVER ONLY (it reads Supabase); client components get
 * plain serializable props from server pages, or the small SiteIndex from app/layout.tsx.
 *
 *   Supabase env vars set  -> content comes from the database (supabase/schema.sql).
 *   env vars missing       -> the local sample content in lib/sample.ts, so the site runs with no setup.
 *   configured but a query fails -> this THROWS. On a running site Next then keeps serving the last good page
 *                             instead of silently publishing placeholder text; at build time it fails loudly.
 *   configured but domains is empty (schema run, seed not) -> sample content plus a console warning.
 *
 * One snapshot (all tables, fetched in parallel) is built per request and reused by every lookup below.
 * Queries go through Next's data cache (lib/supabase.ts), so the database is hit at most once per 5 minutes.
 */

interface Content {
  domains: Domain[];
  collaborations: Array<[DomainId, DomainId]>;
  clubs: Club[];
  events: JycEvent[];
  about: { intro: string; story: AboutEntry[] };
  /** City spots by world. Only worlds that have rows; others use the built-in layout. */
  citySpots: Partial<Record<DomainId, CitySpot[]>>;
}

const SAMPLE: Content = {
  domains: sample.domains,
  collaborations: sample.collaborations,
  clubs: sample.clubs,
  events: sample.events,
  about: { intro: sample.aboutIntro, story: sample.aboutStory },
  citySpots: {},
};

/* ---------- row shapes (what supabase/schema.sql returns) ---------- */

interface DomainRow {
  id: string; name: string; tagline: string; description: string; accent: string; atmosphere: string;
  pos_x: number; pos_y: number; stars: Array<[number, number]>; links: Array<[number, number]>;
  dust: Array<[number, number, number]>; planet_radius: number; tilt: number;
}
interface CollabRow { domain_a: string; domain_b: string }
interface ClubRow { id: string; domain_id: string; name: string; tagline: string; description: string }
interface CoordinatorRow { club_id: string; name: string; role: string; photo: string | null }
interface AchievementRow { club_id: string; year: number; title: string; detail: string | null }
interface GalleryRow { club_id: string; src: string; alt: string; width: number | null; height: number | null }
interface SocialRow { club_id: string; instagram: string | null; linkedin: string | null; email: string | null; website: string | null }
interface IdentityRow {
  club_id: string; accent: string; motif: string; title_case: string; title_style: string;
  tracking: string; cursor: boolean; city_note: string; hero_seed: number | null;
}
interface EventRow {
  id: string; club_id: string; title: string; date: string; time: string; location: string;
  description: string; poster: string | null; registration_url: string | null;
}
interface SpotRow { domain_id: string; club_id: string; silhouette: string; gx: number; gy: number; w: number; d: number; height: number }
interface AboutRow { year: number; title: string; detail: string | null }
interface SettingRow { key: string; value: string }

/** null (SQL) -> undefined (our types), and drop keys that are empty. */
const opt = <T,>(v: T | null | undefined): T | undefined => (v === null || v === undefined || (v as unknown) === "" ? undefined : v);

function groupBy<T extends { club_id: string }>(rows: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const list = m.get(r.club_id);
    if (list) list.push(r);
    else m.set(r.club_id, [r]);
  }
  return m;
}

async function loadFromSupabase(): Promise<Content | null> {
  const sb = getSupabase();
  if (!sb) return null;

  // Every list is ordered in SQL, so the site shows rows in the order the `sort` columns say.
  const [dom, col, clb, crd, ach, gal, soc, idn, evt, spt, abt, set] = await Promise.all([
    sb.from("domains").select("*").order("sort").order("id"),
    sb.from("collaborations").select("*").order("sort"),
    sb.from("clubs").select("*").order("sort").order("id"),
    sb.from("coordinators").select("*").order("sort").order("id"),
    sb.from("achievements").select("*").order("sort").order("id"),
    sb.from("gallery_items").select("*").order("sort").order("id"),
    sb.from("socials").select("*"),
    sb.from("club_identity").select("*"),
    sb.from("events").select("*").order("date", { ascending: false }).order("id"),
    sb.from("city_spots").select("*").order("id"),
    sb.from("about_entries").select("*").order("sort").order("id"),
    sb.from("site_settings").select("*"),
  ]);

  const all = { dom, col, clb, crd, ach, gal, soc, idn, evt, spt, abt, set };
  for (const [name, r] of Object.entries(all)) {
    if (r.error) throw new Error(`Supabase query failed on "${name}": ${r.error.message}`);
  }

  const domainRows = (dom.data ?? []) as DomainRow[];
  if (domainRows.length === 0) {
    console.warn("[jyc] Supabase is configured but `domains` is empty. Run supabase/seed.sql. Using local sample content.");
    return null;
  }

  const coordinators = groupBy((crd.data ?? []) as CoordinatorRow[]);
  const achievements = groupBy((ach.data ?? []) as AchievementRow[]);
  const gallery = groupBy((gal.data ?? []) as GalleryRow[]);
  const socials = new Map(((soc.data ?? []) as SocialRow[]).map((r) => [r.club_id, r]));
  const identities = new Map(((idn.data ?? []) as IdentityRow[]).map((r) => [r.club_id, r]));

  const events: JycEvent[] = ((evt.data ?? []) as EventRow[]).map((e) => ({
    id: e.id,
    title: e.title,
    clubId: e.club_id,
    date: String(e.date).slice(0, 10),
    time: e.time,
    location: e.location,
    description: e.description,
    poster: opt(e.poster),
    registrationUrl: opt(e.registration_url),
  }));
  // Rows arrive newest first, which is the order a club's events are shown in.
  const eventIdsByClub = new Map<string, string[]>();
  for (const e of events) eventIdsByClub.set(e.clubId, [...(eventIdsByClub.get(e.clubId) ?? []), e.id]);

  const clubs: Club[] = ((clb.data ?? []) as ClubRow[]).map((c) => {
    const s = socials.get(c.id);
    const i = identities.get(c.id);
    const identity: ClubIdentity | undefined = i
      ? {
          accent: i.accent,
          motif: i.motif as MotifKind,
          titleCase: i.title_case === "lower" ? "lower" : "upper",
          titleStyle: i.title_style === "outline" ? "outline" : "solid",
          tracking: i.tracking,
          cursor: i.cursor || undefined,
          cityNote: i.city_note,
          heroSeed: opt(i.hero_seed),
        }
      : undefined;
    return {
      id: c.id,
      name: c.name,
      domain: c.domain_id as DomainId,
      tagline: c.tagline,
      description: c.description,
      coordinators: (coordinators.get(c.id) ?? []).map((p) => ({ name: p.name, role: p.role, photo: opt(p.photo) })),
      achievements: (achievements.get(c.id) ?? []).map((a) => ({ year: a.year, title: a.title, detail: opt(a.detail) })),
      eventIds: eventIdsByClub.get(c.id) ?? [],
      gallery: (gallery.get(c.id) ?? []).map((g) => ({ src: g.src, alt: g.alt, width: opt(g.width), height: opt(g.height) })),
      socials: s
        ? { instagram: opt(s.instagram), linkedin: opt(s.linkedin), email: opt(s.email), website: opt(s.website) }
        : {},
      ...(identity ? { identity } : {}),
    };
  });

  const citySpots: Content["citySpots"] = {};
  for (const r of (spt.data ?? []) as SpotRow[]) {
    const id = r.domain_id as DomainId;
    (citySpots[id] ??= []).push({
      clubId: r.club_id,
      silhouette: r.silhouette as Silhouette,
      gx: Number(r.gx),
      gy: Number(r.gy),
      w: Number(r.w),
      d: Number(r.d),
      height: Number(r.height),
    });
  }

  const intro = ((set.data ?? []) as SettingRow[]).find((r) => r.key === "about_intro")?.value;

  return {
    domains: domainRows.map((d) => ({
      id: d.id as DomainId,
      name: d.name,
      tagline: d.tagline,
      description: d.description,
      accent: d.accent,
      atmosphere: d.atmosphere as Atmosphere,
      position: { x: d.pos_x, y: d.pos_y },
      stars: d.stars,
      links: d.links,
      dust: d.dust,
      planetRadius: Number(d.planet_radius),
      tilt: Number(d.tilt),
    })),
    collaborations: ((col.data ?? []) as CollabRow[]).map((c) => [c.domain_a as DomainId, c.domain_b as DomainId]),
    clubs,
    events,
    about: {
      intro: intro ?? sample.aboutIntro,
      story: ((abt.data ?? []) as AboutRow[]).map((a) => ({ year: a.year, title: a.title, detail: opt(a.detail) })),
    },
    citySpots,
  };
}

/**
 * React's request-scoped `cache` (available in the App Router server runtime). Read off the namespace so it
 * type-checks regardless of which @types/react flavour is installed; falls back to no memoisation.
 */
const memoize: <R>(fn: () => Promise<R>) => () => Promise<R> =
  (React as unknown as { cache?: <R>(fn: () => Promise<R>) => () => Promise<R> }).cache ?? ((fn) => fn);

/** One snapshot per request, shared by every lookup. */
const content = memoize(async (): Promise<Content> => (await loadFromSupabase()) ?? SAMPLE);

/* ---------- lookups (same names as before, now async) ---------- */

export const getDomains = async (): Promise<Domain[]> => (await content()).domains;
export const getCollaborations = async (): Promise<Array<[DomainId, DomainId]>> => (await content()).collaborations;
export const getClubs = async (): Promise<Club[]> => (await content()).clubs;
export const getEvents = async (): Promise<JycEvent[]> => (await content()).events;

export const getDomain = async (id: string): Promise<Domain | undefined> =>
  (await content()).domains.find((d) => d.id === id);

export const clubsOf = async (domainId: DomainId): Promise<Club[]> =>
  (await content()).clubs.filter((c) => c.domain === domainId);

export const getClub = async (id: string): Promise<Club | undefined> =>
  (await content()).clubs.find((c) => c.id === id);

export const getEvent = async (id: string): Promise<JycEvent | undefined> =>
  (await content()).events.find((e) => e.id === id);

/** Events of a club, resolved from its eventIds (newest first when they come from the database). */
export const eventsOf = async (clubId: string): Promise<JycEvent[]> => {
  const { clubs, events } = await content();
  const c = clubs.find((x) => x.id === clubId);
  if (!c) return [];
  return c.eventIds.map((id) => events.find((e) => e.id === id)).filter((e): e is JycEvent => Boolean(e));
};

/** The clubs before and after this one in its world (wraps around). */
export const neighboursOf = async (clubId: string): Promise<{ prev?: Club; next?: Club }> => {
  const { clubs } = await content();
  const c = clubs.find((x) => x.id === clubId);
  if (!c) return {};
  const list = clubs.filter((x) => x.domain === c.domain);
  const i = list.findIndex((x) => x.id === clubId);
  if (list.length < 2) return {};
  return { prev: list[(i - 1 + list.length) % list.length], next: list[(i + 1) % list.length] };
};

/** The /about intro and timeline. */
export const getAbout = async (): Promise<{ intro: string; story: AboutEntry[] }> => (await content()).about;

/**
 * A world's city layout, or undefined if that world has no city. The built-in layout (lib/city.ts) supplies
 * theme, dressing and avenues; building positions come from the city_spots table when it has rows for the world.
 */
export const getCity = async (id: DomainId): Promise<CityLayout | undefined> => {
  const base = getStaticCity(id);
  if (!base) return undefined;
  const spots = (await content()).citySpots[id];
  return spots && spots.length > 0 ? { ...base, spots } : base;
};

/** What the persistent client chrome (HUD, menu, map, intro) needs. Built once in app/layout.tsx. */
export const getSiteIndex = async (): Promise<SiteIndex> => {
  const c = await content();
  return {
    domains: c.domains,
    collaborations: c.collaborations,
    clubs: c.clubs.map(({ id, name, domain }) => ({ id, name, domain })),
    events: c.events.map(({ id, title, clubId }) => ({ id, title, clubId })),
  };
};
