import { getClubs, getDomains } from "./data";
import { identityFor, type MotifKind } from "./identity";
import type { DomainId, GalleryItem } from "./types";

/**
 * Server-side joins for the gallery and clubs pages. Plain serializable data out,
 * so the client scenes never import lib/data.ts. Async because the lookups read Supabase (with a local fallback).
 */

export interface ArchiveTile {
  /** Unique across the archive. */
  id: string;
  clubId: string;
  clubName: string;
  domainId: DomainId;
  accent: string;
  motif: MotifKind;
  item: GalleryItem;
  /** Position inside its own club's gallery (seeds the placeholder artwork). */
  index: number;
}

export interface WorldChip {
  id: DomainId;
  name: string;
  accent: string;
  count: number;
}

/** Every club's gallery items, interleaved club by club so neighbouring tiles differ. */
export async function archiveTiles(): Promise<ArchiveTile[]> {
  const [clubs, domains] = await Promise.all([getClubs(), getDomains()]);
  const per = clubs
    .filter((c) => c.gallery.length > 0)
    .map((c) => {
      const d = domains.find((x) => x.id === c.domain);
      const id = d ? identityFor(c, d) : undefined;
      return c.gallery.map<ArchiveTile>((item, index) => ({
        id: `${c.id}-${index}`,
        clubId: c.id,
        clubName: c.name,
        domainId: c.domain,
        accent: id?.accent ?? "#ece7dc",
        motif: id?.motif ?? "mesh",
        item,
        index,
      }));
    });

  const out: ArchiveTile[] = [];
  const longest = Math.max(0, ...per.map((l) => l.length));
  for (let i = 0; i < longest; i++) for (const l of per) if (l[i]) out.push(l[i]);
  return out;
}

export async function archiveWorlds(tiles: ArchiveTile[]): Promise<WorldChip[]> {
  const domains = await getDomains();
  return domains.map((d) => ({
    id: d.id,
    name: d.name,
    accent: d.accent,
    count: tiles.filter((t) => t.domainId === d.id).length,
  }));
}

export interface RowClub {
  id: string;
  name: string;
  tagline: string;
  note: string;
  accent: string;
  motif: MotifKind;
  titleCase: "upper" | "lower";
  titleStyle: "solid" | "outline";
  tracking: string;
  heroSeed: number;
}

export interface WorldGroup {
  id: DomainId;
  name: string;
  tagline: string;
  accent: string;
  clubs: RowClub[];
}

/** All clubs grouped by world, in the order the worlds appear on the map. */
export async function clubsByWorld(): Promise<WorldGroup[]> {
  const [domains, clubs] = await Promise.all([getDomains(), getClubs()]);
  return domains.map((d) => ({
    id: d.id,
    name: d.name,
    tagline: d.tagline,
    accent: d.accent,
    clubs: clubs.filter((c) => c.domain === d.id).map((c) => {
      const id = identityFor(c, d);
      return {
        id: c.id,
        name: c.name,
        tagline: c.tagline,
        note: id.cityNote,
        accent: id.accent,
        motif: id.motif,
        titleCase: id.titleCase,
        titleStyle: id.titleStyle,
        tracking: id.tracking,
        heroSeed: id.heroSeed ?? 3,
      };
    }),
  }));
}
