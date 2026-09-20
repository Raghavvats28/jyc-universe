import type { Club, Domain } from "./types";

/**
 * A club's visual identity. It drives the club space (colour, motif, title treatment)
 * and the way its building is lit in the city.
 *
 * Kept separate from lib/data.ts so content (text, people, events) and presentation
 * stay independent. It lives in the club_identity table when Supabase is on (lib/data.ts attaches it to each club).
 */

export type MotifKind = "pips" | "mesh" | "rings" | "gears" | "code" | "waves";

export interface ClubIdentity {
  /** Six-digit hex. Used with alpha suffixes. */
  accent: string;
  motif: MotifKind;
  /** How the giant club name is set. */
  titleCase: "upper" | "lower";
  titleStyle: "solid" | "outline";
  /** Tailwind-free letter-spacing value, e.g. "-0.05em". */
  tracking: string;
  /** Adds a blinking terminal cursor after the name. */
  cursor?: boolean;
  /** Short line under the name in the city index. */
  cityNote: string;
  /** Seed for the hero artwork, so two clubs sharing a motif do not share a picture. Default 3. */
  heroSeed?: number;
}

/** Built-in identities: the fallback when a club has none from the database, and the seed source. */
export const identities: Record<string, ClubIdentity> = {
  dice: {
    accent: "#5fd4c4",
    motif: "pips",
    titleCase: "upper",
    titleStyle: "solid",
    tracking: "-0.055em",
    cityNote: "The die",
  },
  dsc: {
    accent: "#9cc9e6",
    motif: "mesh",
    titleCase: "upper",
    titleStyle: "outline",
    tracking: "-0.03em",
    cityNote: "Twin towers",
  },
  cice: {
    accent: "#7fdcae",
    motif: "rings",
    titleCase: "upper",
    titleStyle: "solid",
    tracking: "-0.04em",
    cityNote: "The radar tower",
  },
  robotics: {
    accent: "#f0a24a",
    motif: "gears",
    titleCase: "upper",
    titleStyle: "solid",
    tracking: "-0.05em",
    cityNote: "The workshop",
  },
  coding: {
    accent: "#c4e26e",
    motif: "code",
    titleCase: "lower",
    titleStyle: "solid",
    tracking: "-0.045em",
    cursor: true,
    cityNote: "The code tower",
  },

  // Music: one warm family, four different ambers. Two clubs share the "waves" motif, told apart
  // by their hero seed and by how the name is set.
  band: {
    accent: "#f5a23a",
    motif: "waves",
    titleCase: "upper",
    titleStyle: "solid",
    tracking: "-0.055em",
    cityNote: "The stage",
  },
  vocals: {
    accent: "#ff9d6c",
    motif: "waves",
    titleCase: "lower",
    titleStyle: "solid",
    tracking: "-0.05em",
    cityNote: "The studio",
    heroSeed: 8,
  },
  instrumentals: {
    accent: "#e07f3a",
    motif: "rings",
    titleCase: "upper",
    titleStyle: "outline",
    tracking: "-0.025em",
    cityNote: "The concert hall",
    heroSeed: 5,
  },
  dj: {
    accent: "#ffd166",
    motif: "waves",
    titleCase: "upper",
    titleStyle: "solid",
    tracking: "-0.07em",
    cityNote: "The record",
    heroSeed: 14,
  },
};

/** Clubs without a bespoke identity inherit their world's accent and a neutral motif. */
export function identityFor(
  club: Pick<Club, "id" | "domain"> & { identity?: ClubIdentity },
  domain: Pick<Domain, "accent">,
): ClubIdentity {
  return (
    club.identity ??
    identities[club.id] ?? {
      accent: domain.accent,
      motif: "mesh",
      titleCase: "upper",
      titleStyle: "solid",
      tracking: "-0.04em",
      cityNote: "Club",
    }
  );
}
