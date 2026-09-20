import type { DomainId } from "@/lib/types";

/**
 * Every editable table, described once.
 *
 * The admin panel has no per-table pages: one set of routes (`/admin/[resource]`, `/new`, `/[id]`)
 * reads these definitions and builds the list, the form, the validation and the save. Adding a new
 * editable table later means adding an entry here, not writing another screen.
 */

export type FieldType =
  | "text"
  | "slug"
  | "textarea"
  | "number"
  | "date"
  | "colour"
  | "select"
  | "checkbox"
  | "json"
  | "ref";

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Shown under the input. Say what the value does, not what the field is called. */
  help?: string;
  placeholder?: string;
  options?: readonly string[];
  /** For `ref`: which resource this points at. */
  refResource?: "domains" | "clubs";
  /** Default for a new row. */
  initial?: string | number | boolean;
  /** Full width in the two-column form grid. */
  wide?: boolean;
}

export interface Resource {
  /** URL segment and lookup key. */
  key: string;
  table: string;
  /** Sidebar/heading label, singular and plural. */
  one: string;
  many: string;
  blurb: string;
  /**
   * 'text'  — the id is a slug the editor types (domains, clubs, events). It is part of a public URL.
   * 'identity' — the database generates a bigint id; the editor never sees it.
   */
  idKind: "text" | "identity";
  /** Column shown as the row title in the list. */
  titleColumn: string;
  /** Extra columns shown as the row's subtitle, joined with a dot. */
  subtitleColumns?: readonly string[];
  /** Default ordering. */
  orderBy: { column: string; ascending?: boolean };
  /** If set, the list gets a filter dropdown on this foreign key. */
  scope?: { column: string; resource: "domains" | "clubs"; label: string };
  fields: readonly Field[];
  /** Shown on the dashboard. */
  icon: string;
}

const ATMOSPHERES = ["circuit", "pulse", "flow", "heritage", "dynamic", "ink"] as const;
const MOTIFS = ["pips", "mesh", "rings", "gears", "code", "waves"] as const;
const SILHOUETTES = [
  "die",
  "twin",
  "tiered",
  "workshop",
  "spire",
  "stage",
  "studio",
  "hall",
  "vinyl",
] as const;

export const RESOURCES: readonly Resource[] = [
  {
    key: "domains",
    table: "domains",
    one: "Domain",
    many: "Domains",
    blurb: "The worlds of the universe. Their position here is their position on the constellation map.",
    idKind: "text",
    titleColumn: "name",
    subtitleColumns: ["id", "tagline"],
    orderBy: { column: "sort" },
    icon: "⌘",
    fields: [
      {
        name: "id",
        label: "Slug",
        type: "slug",
        required: true,
        help: "Lives in the URL: /domain/technical. Lowercase, no spaces. Changing it breaks existing links.",
        placeholder: "technical",
      },
      { name: "name", label: "Name", type: "text", required: true, placeholder: "Technical" },
      { name: "tagline", label: "Tagline", type: "text", required: true, help: "One line, shown under the name on arrival." },
      { name: "description", label: "Description", type: "textarea", required: true, wide: true },
      {
        name: "accent",
        label: "Accent colour",
        type: "colour",
        required: true,
        initial: "#5fd4c4",
        help: "Six-digit hex. Colours this world's planet, its clubs and its share cards.",
      },
      {
        name: "atmosphere",
        label: "Atmosphere",
        type: "select",
        required: true,
        options: ATMOSPHERES,
        initial: "circuit",
        help: "The ambient texture drawn behind the planet.",
      },
      { name: "pos_x", label: "Map X", type: "number", required: true, initial: 600, help: "Constellation map is 1200 wide." },
      { name: "pos_y", label: "Map Y", type: "number", required: true, initial: 400, help: "Constellation map is 800 tall." },
      { name: "planet_radius", label: "Planet radius", type: "number", initial: 26 },
      { name: "tilt", label: "Ring tilt", type: "number", initial: 0, help: "Degrees." },
      {
        name: "stars",
        label: "Stars",
        type: "json",
        wide: true,
        initial: "[]",
        help: "Offsets from the planet centre: [[dx, dy], ...]",
      },
      {
        name: "links",
        label: "Constellation links",
        type: "json",
        wide: true,
        initial: "[]",
        help: "Pairs of star positions to join: [[0, 1], [1, 2], ...]",
      },
      {
        name: "dust",
        label: "Dust",
        type: "json",
        wide: true,
        initial: "[]",
        help: "Faint ambient specks: [[dx, dy, radius], ...]",
      },
      { name: "sort", label: "Order", type: "number", initial: 0 },
    ],
  },

  {
    key: "clubs",
    table: "clubs",
    one: "Club",
    many: "Clubs",
    blurb: "Every club. Each one gets its own space at /club/[slug] and a building in its world's city.",
    idKind: "text",
    titleColumn: "name",
    subtitleColumns: ["id", "domain_id"],
    orderBy: { column: "sort" },
    scope: { column: "domain_id", resource: "domains", label: "World" },
    icon: "◇",
    fields: [
      {
        name: "id",
        label: "Slug",
        type: "slug",
        required: true,
        help: "Lives in the URL: /club/dice. Lowercase, no spaces.",
        placeholder: "dice",
      },
      { name: "domain_id", label: "World", type: "ref", refResource: "domains", required: true },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "tagline", label: "Tagline", type: "text", help: "One line. Shown on the city callout and the club hero." },
      { name: "description", label: "Description", type: "textarea", wide: true },
      { name: "sort", label: "Order", type: "number", initial: 0, help: "Order inside its world. Also the building number in the city." },
    ],
  },

  {
    key: "events",
    table: "events",
    one: "Event",
    many: "Events",
    blurb: "Upcoming events are lights on the time arc; past ones become the trail behind it.",
    idKind: "text",
    titleColumn: "title",
    subtitleColumns: ["date", "club_id"],
    orderBy: { column: "date", ascending: false },
    scope: { column: "club_id", resource: "clubs", label: "Club" },
    icon: "◷",
    fields: [
      {
        name: "id",
        label: "Slug",
        type: "slug",
        required: true,
        help: "Lives in the URL: /events/open-mic-night.",
        placeholder: "open-mic-night",
      },
      { name: "club_id", label: "Club", type: "ref", refResource: "clubs", required: true },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "date", label: "Date", type: "date", required: true, help: "Decides whether it is upcoming or past." },
      { name: "time", label: "Time", type: "text", initial: "To be announced", placeholder: "6:00 PM" },
      { name: "location", label: "Location", type: "text", initial: "To be announced" },
      { name: "description", label: "Description", type: "textarea", wide: true },
      {
        name: "poster",
        label: "Poster URL",
        type: "text",
        wide: true,
        help: "A public Supabase Storage URL. Leave empty and a poster is generated from the club's motif.",
      },
      { name: "registration_url", label: "Registration link", type: "text", wide: true },
    ],
  },

  {
    key: "members",
    table: "coordinators",
    one: "Member",
    many: "Members",
    blurb: "Coordinators, shown as portraits on a club's Team floor.",
    idKind: "identity",
    titleColumn: "name",
    subtitleColumns: ["role", "club_id"],
    orderBy: { column: "sort" },
    scope: { column: "club_id", resource: "clubs", label: "Club" },
    icon: "☗",
    fields: [
      { name: "club_id", label: "Club", type: "ref", refResource: "clubs", required: true },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "role", label: "Role", type: "text", required: true, placeholder: "Coordinator" },
      {
        name: "photo",
        label: "Photo URL",
        type: "text",
        wide: true,
        help: "Public Supabase Storage URL. Empty draws a stylised silhouette instead.",
      },
      { name: "sort", label: "Order", type: "number", initial: 0 },
    ],
  },

  {
    key: "gallery",
    table: "gallery_items",
    one: "Photo",
    many: "Gallery",
    blurb: "Photos for a club's wall, and for the shared archive at /gallery.",
    idKind: "identity",
    titleColumn: "alt",
    subtitleColumns: ["club_id"],
    orderBy: { column: "sort" },
    scope: { column: "club_id", resource: "clubs", label: "Club" },
    icon: "▤",
    fields: [
      { name: "club_id", label: "Club", type: "ref", refResource: "clubs", required: true },
      { name: "src", label: "Image URL", type: "text", wide: true, help: "Public Supabase Storage URL. Empty draws the club's motif." },
      { name: "alt", label: "Description", type: "text", wide: true, required: true, help: "What is in the photo. Read aloud by screen readers." },
      { name: "width", label: "Width", type: "number", help: "Real pixels. Given with height, the wall reserves the exact space and nothing shifts." },
      { name: "height", label: "Height", type: "number" },
      { name: "sort", label: "Order", type: "number", initial: 0 },
    ],
  },

  {
    key: "achievements",
    table: "achievements",
    one: "Achievement",
    many: "Achievements",
    blurb: "Milestones on a club's timeline floor.",
    idKind: "identity",
    titleColumn: "title",
    subtitleColumns: ["year", "club_id"],
    orderBy: { column: "sort" },
    scope: { column: "club_id", resource: "clubs", label: "Club" },
    icon: "✦",
    fields: [
      { name: "club_id", label: "Club", type: "ref", refResource: "clubs", required: true },
      { name: "year", label: "Year", type: "number", required: true, initial: new Date().getFullYear() },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "detail", label: "Detail", type: "textarea", wide: true },
      { name: "sort", label: "Order", type: "number", initial: 0 },
    ],
  },

  {
    key: "city-map",
    table: "city_spots",
    one: "Building",
    many: "City Map",
    blurb:
      "Where each club's building stands. A world with rows here uses them instead of the built-in layout; the theme and set dressing stay in the code.",
    idKind: "identity",
    titleColumn: "club_id",
    subtitleColumns: ["silhouette", "domain_id"],
    orderBy: { column: "id" },
    scope: { column: "domain_id", resource: "domains", label: "World" },
    icon: "⌗",
    fields: [
      { name: "domain_id", label: "World", type: "ref", refResource: "domains", required: true },
      { name: "club_id", label: "Club", type: "ref", refResource: "clubs", required: true },
      {
        name: "silhouette",
        label: "Shape",
        type: "select",
        options: SILHOUETTES,
        required: true,
        initial: "tiered",
        help: "Which building drawing to use. Only these nine exist.",
      },
      { name: "gx", label: "Grid X", type: "number", required: true, initial: 1, help: "Island is 16 cells across (12 in the smaller worlds)." },
      { name: "gy", label: "Grid Y", type: "number", required: true, initial: 1 },
      { name: "w", label: "Width", type: "number", required: true, initial: 4.6, help: "In cells." },
      { name: "d", label: "Depth", type: "number", required: true, initial: 4.6 },
      { name: "height", label: "Height", type: "number", required: true, initial: 200, help: "Pixels. Also where the camera looks when someone enters." },
    ],
  },

  {
    key: "identity",
    table: "club_identity",
    one: "Club identity",
    many: "Club identity",
    blurb: "A club's own colour and motif. Without a row here the club inherits its world's look.",
    idKind: "text",
    titleColumn: "club_id",
    subtitleColumns: ["motif", "accent"],
    orderBy: { column: "club_id" },
    icon: "◐",
    fields: [
      { name: "club_id", label: "Club", type: "ref", refResource: "clubs", required: true, help: "Also the primary key: one row per club." },
      { name: "accent", label: "Accent colour", type: "colour", required: true, initial: "#5fd4c4" },
      { name: "motif", label: "Motif", type: "select", options: MOTIFS, required: true, initial: "rings" },
      { name: "title_case", label: "Title case", type: "select", options: ["upper", "lower"], initial: "upper" },
      { name: "title_style", label: "Title style", type: "select", options: ["solid", "outline"], initial: "solid" },
      { name: "tracking", label: "Letter spacing", type: "text", initial: "-0.04em" },
      { name: "cursor", label: "Typewriter cursor", type: "checkbox", help: "Types the tagline out, letter by letter, in the club hero." },
      { name: "city_note", label: "City label", type: "text", initial: "Club", help: "The small word under the building in the city." },
      { name: "hero_seed", label: "Hero seed", type: "number", help: "Changes the random arrangement of the hero motif." },
    ],
  },

  {
    key: "socials",
    table: "socials",
    one: "Socials",
    many: "Socials",
    blurb: "The links on a club's Connect floor.",
    idKind: "text",
    titleColumn: "club_id",
    subtitleColumns: ["email"],
    orderBy: { column: "club_id" },
    icon: "⌁",
    fields: [
      { name: "club_id", label: "Club", type: "ref", refResource: "clubs", required: true, help: "One row per club." },
      { name: "instagram", label: "Instagram", type: "text", wide: true },
      { name: "linkedin", label: "LinkedIn", type: "text", wide: true },
      { name: "email", label: "Email", type: "text", wide: true },
      { name: "website", label: "Website", type: "text", wide: true },
    ],
  },

  {
    key: "story",
    table: "about_entries",
    one: "Story entry",
    many: "Story",
    blurb: "The timeline on /about, oldest first.",
    idKind: "identity",
    titleColumn: "title",
    subtitleColumns: ["year"],
    orderBy: { column: "year" },
    icon: "❧",
    fields: [
      { name: "year", label: "Year", type: "number", required: true, initial: new Date().getFullYear() },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "detail", label: "Detail", type: "textarea", wide: true },
      { name: "sort", label: "Order", type: "number", initial: 0 },
    ],
  },

  {
    key: "collaborations",
    table: "collaborations",
    one: "Collaboration",
    many: "Collaborations",
    blurb: "Faint threads drawn between two worlds that work together.",
    idKind: "text",
    titleColumn: "domain_a",
    subtitleColumns: ["domain_b"],
    orderBy: { column: "sort" },
    icon: "∞",
    fields: [
      { name: "domain_a", label: "World", type: "ref", refResource: "domains", required: true },
      { name: "domain_b", label: "Joined to", type: "ref", refResource: "domains", required: true },
      { name: "sort", label: "Order", type: "number", initial: 0 },
    ],
  },

  {
    key: "settings",
    table: "site_settings",
    one: "Setting",
    many: "Settings",
    blurb: "Loose values that would otherwise be hard-coded. `about_intro` is the paragraph at the top of /about.",
    idKind: "text",
    titleColumn: "key",
    subtitleColumns: ["value"],
    orderBy: { column: "key" },
    icon: "⚙",
    fields: [
      { name: "key", label: "Key", type: "slug", required: true, placeholder: "about_intro" },
      { name: "value", label: "Value", type: "textarea", required: true, wide: true },
    ],
  },
] as const;

export const resourceOf = (key: string): Resource | undefined => RESOURCES.find((r) => r.key === key);

/** The primary key column. Composite keys (collaborations) are handled by the actions directly. */
export function primaryKeyOf(r: Resource): string {
  if (r.idKind === "identity") return "id";
  switch (r.table) {
    case "club_identity":
    case "socials":
      return "club_id";
    case "site_settings":
      return "key";
    default:
      return "id";
  }
}

/** Sidebar order. `null` is a divider. */
export const NAV: ReadonlyArray<string | null> = [
  "domains",
  "clubs",
  "events",
  null,
  "members",
  "achievements",
  "gallery",
  null,
  "city-map",
  "identity",
  "socials",
  "collaborations",
  null,
  "story",
  "settings",
];

export type { DomainId };
