import type { ClubIdentity } from "./identity";

export type DomainId =
  | "technical"
  | "music"
  | "dance"
  | "cultural"
  | "sports"
  | "literary";

/** Drives the surface texture of a domain's planet (see lib/atmosphere.ts). */
export type Atmosphere = "circuit" | "pulse" | "flow" | "heritage" | "dynamic" | "ink";

export interface Coordinator {
  name: string;
  role: string;
  photo?: string;
}

export interface Achievement {
  year: number;
  title: string;
  detail?: string;
}

export interface GalleryItem {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface Socials {
  instagram?: string;
  linkedin?: string;
  email?: string;
  website?: string;
}

export interface Club {
  id: string;
  name: string;
  domain: DomainId;
  tagline: string;
  description: string;
  coordinators: Coordinator[];
  achievements: Achievement[];
  eventIds: string[];
  gallery: GalleryItem[];
  socials: Socials;
  /**
   * Visual identity from the club_identity table. Set by the server lookups in lib/data.ts so client
   * components can keep calling identityFor(club, domain). Absent: identityFor uses the built-in table.
   */
  identity?: ClubIdentity;
}

export interface Domain {
  id: DomainId;
  name: string;
  tagline: string;
  description: string;
  /** Six-digit hex only – used with alpha suffixes in gradients. */
  accent: string;
  atmosphere: Atmosphere;
  /** Position on the universe map (viewBox 1200 x 800). */
  position: { x: number; y: number };
  /** Star offsets relative to the domain centre. */
  stars: Array<[number, number]>;
  /** Pairs of star indexes joined by a constellation line. */
  links: Array<[number, number]>;
  /** Small ambient stars that react when the domain is hovered: [x, y, radius]. */
  dust: Array<[number, number, number]>;
  planetRadius: number;
  /** Ring tilt in degrees. */
  tilt: number;
}

export interface JycEvent {
  id: string;
  title: string;
  clubId: string;
  /** ISO date, e.g. 2026-10-18 */
  date: string;
  time: string;
  location: string;
  description: string;
  poster?: string;
  registrationUrl?: string;
}

/** One beat in the JYC story on /about. */
export interface AboutEntry {
  year: number;
  title: string;
  detail?: string;
}

/**
 * The small, serializable slice of site content that persistent client chrome needs
 * (HUD label, menu, universe map, intro). Built on the server in app/layout.tsx and handed
 * to components/SiteProvider.tsx.
 */
export interface SiteIndex {
  domains: Domain[];
  collaborations: Array<[DomainId, DomainId]>;
  clubs: Array<{ id: string; name: string; domain: DomainId }>;
  events: Array<{ id: string; title: string; clubId: string }>;
}
