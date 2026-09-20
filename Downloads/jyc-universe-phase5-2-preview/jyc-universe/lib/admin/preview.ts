import { getStaticCity } from "@/lib/city";
import { identities } from "@/lib/identity";
import { clubs, collaborations, domains, events, aboutIntro, aboutStory } from "@/lib/sample";
import type { DomainId } from "@/lib/types";
import type { Row } from "./query";
import type { Resource } from "./resources";

/**
 * Preview mode: the admin panel with no database.
 *
 * Every table the panel edits is reconstructed here from the same local content the public site
 * falls back to (`lib/sample.ts`, `lib/identity.ts`, `lib/city.ts`) so a person setting up the
 * project can see the real shape of their content and try the screens before wiring up Supabase.
 *
 * It is intentionally read-only: `previewSave()` below never touches these arrays. Rebuilding a
 * second, in-memory database that pretends to persist would be more code, not less, and it would
 * quietly lose people's work the moment the server restarts. Being honest that nothing is saved yet
 * is the simpler and safer choice.
 */

function domainOf(id: DomainId) {
  return domains.find((d) => d.id === id);
}

function buildRows(table: string): Row[] {
  switch (table) {
    case "domains":
      return domains.map((d, i) => ({
        id: d.id,
        name: d.name,
        tagline: d.tagline,
        description: d.description,
        accent: d.accent,
        atmosphere: d.atmosphere,
        pos_x: d.position.x,
        pos_y: d.position.y,
        stars: d.stars,
        links: d.links,
        dust: d.dust,
        planet_radius: d.planetRadius,
        tilt: d.tilt,
        sort: i,
      }));

    case "collaborations":
      return collaborations.map(([a, b], i) => ({ domain_a: a, domain_b: b, sort: i }));

    case "clubs":
      return clubs.map((c, i) => ({
        id: c.id,
        domain_id: c.domain,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        sort: i,
      }));

    case "events":
      return events.map((e) => ({
        id: e.id,
        club_id: e.clubId,
        title: e.title,
        date: e.date,
        time: e.time,
        location: e.location,
        description: e.description,
        poster: e.poster ?? "",
        registration_url: e.registrationUrl ?? "",
      }));

    case "coordinators":
      return clubs.flatMap((c) =>
        c.coordinators.map((p, i) => ({
          id: `${c.id}-${i}`,
          club_id: c.id,
          sort: i,
          name: p.name,
          role: p.role,
          photo: p.photo ?? "",
        })),
      );

    case "achievements":
      return clubs.flatMap((c) =>
        c.achievements.map((a, i) => ({
          id: `${c.id}-${i}`,
          club_id: c.id,
          sort: i,
          year: a.year,
          title: a.title,
          detail: a.detail ?? "",
        })),
      );

    case "gallery_items":
      return clubs.flatMap((c) =>
        c.gallery.map((g, i) => ({
          id: `${c.id}-${i}`,
          club_id: c.id,
          sort: i,
          src: g.src,
          alt: g.alt,
          width: g.width ?? null,
          height: g.height ?? null,
        })),
      );

    case "socials":
      return clubs.map((c) => ({
        club_id: c.id,
        instagram: c.socials.instagram ?? "",
        linkedin: c.socials.linkedin ?? "",
        email: c.socials.email ?? "",
        website: c.socials.website ?? "",
      }));

    case "club_identity":
      return clubs
        .filter((c) => identities[c.id])
        .map((c) => {
          const idn = identities[c.id];
          return {
            club_id: c.id,
            accent: idn.accent,
            motif: idn.motif,
            title_case: idn.titleCase,
            title_style: idn.titleStyle,
            tracking: idn.tracking,
            cursor: Boolean(idn.cursor),
            city_note: idn.cityNote,
            hero_seed: idn.heroSeed ?? null,
          };
        });

    case "city_spots":
      return domains.flatMap((d) => {
        const city = getStaticCity(d.id);
        if (!city) return [];
        return city.spots.map((s) => ({
          id: `${d.id}-${s.clubId}`,
          domain_id: d.id,
          club_id: s.clubId,
          silhouette: s.silhouette,
          gx: s.gx,
          gy: s.gy,
          w: s.w,
          d: s.d,
          height: s.height,
        }));
      });

    case "about_entries":
      return aboutStory.map((a, i) => ({ id: String(i), year: a.year, title: a.title, detail: a.detail ?? "", sort: i }));

    case "site_settings":
      return [{ key: "about_intro", value: aboutIntro }];

    default:
      return [];
  }
}

export function previewConfigured(): boolean {
  return true;
}

export async function previewList(resource: Resource, scopeValue?: string): Promise<Row[]> {
  let rows = buildRows(resource.table);
  if (resource.scope && scopeValue) rows = rows.filter((r) => r[resource.scope!.column] === scopeValue);
  return rows;
}

export async function previewGet(resource: Resource, id: string): Promise<Row | null> {
  if (resource.table === "collaborations") {
    const [a, b] = id.split("~");
    return buildRows(resource.table).find((r) => r.domain_a === a && r.domain_b === b) ?? null;
  }
  const pk = resource.idKind === "identity" ? "id" : resource.table === "site_settings" ? "key" : resource.table === "club_identity" || resource.table === "socials" ? "club_id" : "id";
  return buildRows(resource.table).find((r) => String(r[pk]) === id) ?? null;
}

export async function previewRefOptions(): Promise<{
  domains: Array<{ id: string; label: string }>;
  clubs: Array<{ id: string; label: string }>;
}> {
  return {
    domains: domains.map((d) => ({ id: d.id, label: `${d.name} (${d.id})` })),
    clubs: clubs.map((c) => ({ id: c.id, label: `${c.domain} · ${c.name} (${c.id})` })),
  };
}

export async function previewCounts(tables: readonly string[]): Promise<Record<string, number>> {
  return Object.fromEntries(tables.map((t) => [t, buildRows(t).length]));
}
