import type { AboutEntry, Achievement, Club, Coordinator, Domain, DomainId, GalleryItem, JycEvent } from "./types";

/**
 * LOCAL SAMPLE CONTENT. Pure data, no lookups, safe to import anywhere.
 *
 * This is the fallback the site uses when Supabase is not configured (see lib/data.ts) and the
 * source for supabase/seed.sql (regenerate with `npx tsx scripts/generate-seed.ts`).
 * Keep the shapes in lib/types.ts stable.
 *
 * NOTE: copy, club names (except the technical ones) and events below are PLACEHOLDERS.
 */

/* ---------- deterministic "dust" stars (rounded so server and client agree) ---------- */

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dust(seed: number, count = 9): Array<[number, number, number]> {
  const r = rng(seed);
  return Array.from({ length: count }, () => {
    const angle = r() * Math.PI * 2;
    const dist = 78 + r() * 88;
    return [
      Math.round(Math.cos(angle) * dist * 1.15),
      Math.round(Math.sin(angle) * dist * 0.8),
      Math.round((0.7 + r() * 1.1) * 10) / 10,
    ] as [number, number, number];
  });
}

/* ---------- domains ---------- */

export const domains: Domain[] = [
  {
    id: "technical",
    name: "TECHNICAL",
    tagline: "Where ideas get built",
    description:
      "Circuits, code and things that move. A city that never fully switches off, where a late-night idea becomes a working prototype.",
    accent: "#5fd4c4",
    atmosphere: "circuit",
    position: { x: 240, y: 250 },
    stars: [[-70, -30], [-20, -55], [40, -40], [75, 0], [20, 35], [-45, 45]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 4]],
    dust: dust(11),
    planetRadius: 26,
    tilt: -18,
  },
  {
    id: "music",
    name: "MUSIC",
    tagline: "Feel the frequency",
    description:
      "A district that runs on rhythm: rehearsal rooms, open stages and jam sessions that outlast the last bus home.",
    accent: "#f5a23a",
    atmosphere: "pulse",
    position: { x: 610, y: 120 },
    stars: [[-90, 10], [-45, -30], [0, 20], [45, -25], [90, 15], [0, -62]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [3, 5]],
    dust: dust(23),
    planetRadius: 28,
    tilt: 12,
  },
  {
    id: "dance",
    name: "DANCE",
    tagline: "Move the story",
    description:
      "Motion as language. Choreography, freestyle and fusion, from the first count to the final bow.",
    accent: "#ee5a7a",
    atmosphere: "flow",
    position: { x: 960, y: 280 },
    stars: [[-80, 30], [-50, -20], [-5, -50], [40, -30], [75, 10], [50, 50]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
    dust: dust(37),
    planetRadius: 26,
    tilt: -30,
  },
  {
    id: "sports",
    name: "SPORTS",
    tagline: "Play at full speed",
    description:
      "Teams, tournaments and early-morning practice. A world built around momentum, effort and the next match.",
    accent: "#b4dc4f",
    atmosphere: "dynamic",
    position: { x: 930, y: 545 },
    stars: [[-70, 40], [-30, 0], [10, -40], [60, -55], [30, 10], [70, 40]],
    links: [[0, 1], [1, 2], [2, 3], [1, 4], [4, 5], [2, 4]],
    dust: dust(41),
    planetRadius: 27,
    tilt: 24,
  },
  {
    id: "literary",
    name: "LITERARY",
    tagline: "Words with weight",
    description:
      "Debate, poetry, writing and the quiet thrill of the right sentence. Atmospheric, unhurried, full of margins.",
    accent: "#e8e0cc",
    atmosphere: "ink",
    position: { x: 585, y: 680 },
    stars: [[-70, -20], [-30, -40], [0, -15], [30, -40], [70, -20], [0, 40]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 4], [2, 5]],
    dust: dust(53),
    planetRadius: 25,
    tilt: -8,
  },
  {
    id: "cultural",
    name: "CULTURAL",
    tagline: "Roots, retold",
    description:
      "Theatre, art and traditions carried into new forms. A warm, heritage-rich quarter that keeps the campus story alive.",
    accent: "#d0603f",
    atmosphere: "heritage",
    position: { x: 265, y: 540 },
    stars: [[-60, 40], [-60, -10], [0, -50], [60, -10], [60, 40], [0, -10]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [1, 5], [3, 5]],
    dust: dust(67),
    planetRadius: 27,
    tilt: 16,
  },
];

/** Which worlds collaborate. Rendered as faint links between planets. */
export const collaborations: Array<[DomainId, DomainId]> = [
  ["technical", "music"],
  ["music", "dance"],
  ["dance", "sports"],
  ["dance", "cultural"],
  ["cultural", "literary"],
  ["technical", "literary"],
  ["technical", "cultural"],
];

/* ---------- clubs ---------- */

type ClubSeed = Pick<Club, "id" | "name" | "domain" | "tagline" | "description"> &
  Partial<Club>;

const club = (seed: ClubSeed): Club => ({
  coordinators: [],
  achievements: [],
  eventIds: [],
  gallery: [],
  socials: {},
  ...seed,
});

const TBA = "Description coming soon.";

/**
 * SAMPLE CONTENT for the Technical clubs so the club space can be seen end to end.
 * Everything below (descriptions, people, achievements, gallery, events) is a placeholder.
 * Replace it with real data; the UI needs no changes.
 */
const sampleTeam = (): Coordinator[] => [
  { name: "Name to be added", role: "Head coordinator" },
  { name: "Name to be added", role: "Co-coordinator" },
  { name: "Name to be added", role: "Technical lead" },
  { name: "Name to be added", role: "Design lead" },
];

const sampleAchievements = (): Achievement[] => [
  { year: 2026, title: "Sample: inter-college finalist", detail: "Replace with a real milestone from this club's story." },
  { year: 2026, title: "Sample: flagship workshop series", detail: "A line or two about what happened and who took part." },
  { year: 2025, title: "Sample: first campus showcase", detail: "Placeholder text. Add the real detail here." },
  { year: 2024, title: "Sample: club founded", detail: "Every timeline starts somewhere." },
];

/** Width x height hints give the gallery wall its varied rhythm. Empty src draws a placeholder tile. */
const sampleGallery = (): GalleryItem[] =>
  [
    [4, 5], [3, 2], [1, 1], [3, 4], [4, 3], [2, 3], [5, 4], [1, 1],
  ].map(([w, h], i) => ({ src: "", alt: `Placeholder photo ${i + 1}`, width: w * 100, height: h * 100 }));

export const clubs: Club[] = [
  // Technical
  club({
    id: "dice",
    name: "DICE",
    domain: "technical",
    tagline: "Roll the idea.",
    description:
      "Ideas go on the table, get tested against each other and come out as something real. A room for the curious, the stubborn and the slightly reckless.",
    coordinators: sampleTeam(),
    achievements: sampleAchievements(),
    eventIds: ["dice-roll-call", "dice-prototype-night", "dice-pitch-lab"],
    gallery: sampleGallery(),
  }),
  club({
    id: "dsc",
    name: "DSC",
    domain: "technical",
    tagline: "Learn it. Build it. Share it.",
    description:
      "A community of student developers who learn in public: study jams, shared projects and the kind of help that starts with 'let me show you'.",
    coordinators: sampleTeam(),
    achievements: sampleAchievements(),
    eventIds: ["dsc-study-jam", "dsc-community-meetup", "dsc-build-day"],
    gallery: sampleGallery(),
  }),
  club({
    id: "cice",
    name: "CICE",
    domain: "technical",
    tagline: "Signals, circuits, systems.",
    description:
      "Where electronics meets curiosity. Boards on the bench, oscilloscopes humming and a steady supply of things that blink, buzz or finally work.",
    coordinators: sampleTeam(),
    achievements: sampleAchievements(),
    eventIds: ["cice-circuit-clinic", "cice-solder-night"],
    gallery: sampleGallery(),
  }),
  club({
    id: "robotics",
    name: "Robotics",
    domain: "technical",
    tagline: "Machines that move.",
    description:
      "Motors, sensors and a workshop that never really closes. From line followers to arms that pick things up, this is where code learns to push back against gravity.",
    coordinators: sampleTeam(),
    achievements: sampleAchievements(),
    eventIds: ["robotics-line-sprint", "robotics-arm-workshop", "robotics-bot-battle"],
    gallery: sampleGallery(),
  }),
  club({
    id: "coding",
    name: "Coding",
    domain: "technical",
    tagline: "Ship it before sunrise.",
    description:
      "Late nights, strong opinions about tabs and spaces, and a lot of pull requests. Contests, hack nights and the quiet satisfaction of a green build.",
    coordinators: sampleTeam(),
    achievements: sampleAchievements(),
    eventIds: ["hack-the-night", "coding-code-relay", "coding-algo-league"],
    gallery: sampleGallery(),
  }),

  // PLACEHOLDER clubs for the other worlds: replace with the real JYC clubs.
  // Music: Band and Vocals were already here. Instrumentals and DJ are PLACEHOLDERS added so the Music
  // city has four buildings; rename or remove them (and their spot in lib/city.ts + identity in lib/identity.ts).
  // Taglines are placeholders too.
  club({ id: "band", name: "Band", domain: "music", tagline: "Loud, live, together.", description: TBA }),
  club({ id: "vocals", name: "Vocals", domain: "music", tagline: "Find your voice.", description: TBA, eventIds: ["open-mic-night"] }),
  club({ id: "instrumentals", name: "Instrumentals", domain: "music", tagline: "Strings, keys, brass and skins.", description: TBA }),
  club({ id: "dj", name: "DJ", domain: "music", tagline: "Blend the room.", description: TBA }),
  club({ id: "dance-crew", name: "Dance Crew", domain: "dance", tagline: "Dance club", description: TBA }),
  club({ id: "football", name: "Football", domain: "sports", tagline: "Sports club", description: TBA }),
  club({ id: "cricket", name: "Cricket", domain: "sports", tagline: "Sports club", description: TBA }),
  club({ id: "literary-society", name: "Literary Society", domain: "literary", tagline: "Literary club", description: TBA }),
  club({ id: "debate", name: "Debate", domain: "literary", tagline: "Literary club", description: TBA }),
  club({ id: "drama", name: "Drama", domain: "cultural", tagline: "Cultural club", description: TBA }),
  club({ id: "fine-arts", name: "Fine Arts", domain: "cultural", tagline: "Cultural club", description: TBA }),
];

/* ---------- events (SAMPLE data) ---------- */

const SAMPLE = "Sample event. Replace with real event data.";
const TBD = "To be announced";

const ev = (id: string, title: string, clubId: string, date: string, time: string): JycEvent => ({
  id,
  title,
  clubId,
  date,
  time,
  location: TBD,
  description: SAMPLE,
});

export const events: JycEvent[] = [
  // Upcoming and past are decided by date at render time, so these stay correct as time passes.
  ev("open-mic-night", "Open Mic Night", "vocals", "2026-10-18", "6:00 PM"),

  ev("dice-roll-call", "Roll Call", "dice", "2026-10-09", "5:00 PM"),
  ev("dice-prototype-night", "Prototype Night", "dice", "2026-04-12", "6:30 PM"),
  ev("dice-pitch-lab", "Pitch Lab", "dice", "2025-11-22", "4:00 PM"),

  ev("dsc-study-jam", "Study Jam", "dsc", "2026-10-15", "4:30 PM"),
  ev("dsc-community-meetup", "Community Meetup", "dsc", "2026-03-07", "5:00 PM"),
  ev("dsc-build-day", "Build Day", "dsc", "2025-09-27", "10:00 AM"),

  ev("cice-circuit-clinic", "Circuit Clinic", "cice", "2026-11-05", "3:00 PM"),
  ev("cice-solder-night", "Solder Night", "cice", "2026-02-19", "6:00 PM"),

  ev("robotics-line-sprint", "Line Follower Sprint", "robotics", "2026-10-25", "11:00 AM"),
  ev("robotics-arm-workshop", "Arm Build Workshop", "robotics", "2026-05-03", "10:00 AM"),
  ev("robotics-bot-battle", "Bot Battle", "robotics", "2025-10-11", "2:00 PM"),

  ev("hack-the-night", "Hack the Night", "coding", "2026-11-02", "9:00 PM"),
  ev("coding-code-relay", "Code Relay", "coding", "2026-03-21", "3:00 PM"),
  ev("coding-algo-league", "Algo League", "coding", "2025-12-06", "2:00 PM"),
];

/* ---------- about (PLACEHOLDER story for /about) ---------- */

/**
 * PLACEHOLDER. Replace the intro and every entry with the real JYC story; the page needs no changes.
 * Years are shown as large numerals, oldest first.
 */
export const aboutIntro =
  "Placeholder. One short paragraph on who Jaypee Youth Club is, what it exists for, and what a student gets from it.";

export const aboutStory: AboutEntry[] = [
  { year: 2016, title: "Sample: an idea in a corridor", detail: "Replace with how JYC actually began and who was in the room." },
  { year: 2018, title: "Sample: the club becomes official", detail: "A line or two on the first coordinators and the first event." },
  { year: 2020, title: "Sample: the first worlds take shape", detail: "Technical and Music grow into communities of their own." },
  { year: 2023, title: "Sample: the first inter-college fest", detail: "Placeholder text. Add the real detail here." },
  { year: 2025, title: "Sample: six worlds, one club", detail: "Technical, Music, Dance, Sports, Literary and Cultural under one roof." },
  { year: 2026, title: "Sample: the universe opens", detail: "This site: a place you travel through, not a page you scroll." },
];
