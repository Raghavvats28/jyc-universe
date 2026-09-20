import { centerOf } from "./iso";
import type { DomainId } from "./types";

/**
 * Layout of a domain's city. Pure data (numbers and strings) so it can be passed
 * from a server component to a client component and later loaded from a database.
 *
 * Grid units are isometric cells (see lib/iso.ts). Each building occupies a "plot".
 * The drawing code for a silhouette lives in components/city/buildings.
 */

export type Silhouette =
  // Technical
  | "die"
  | "twin"
  | "tiered"
  | "workshop"
  | "spire"
  // Music
  | "stage"
  | "studio"
  | "hall"
  | "vinyl";

/** A colour pair/triple for a gradient, top to bottom. */
type Duo = readonly [string, string];

/**
 * Everything colour-related about a city, as plain strings (serializable, DB-ready).
 * The gradients in CityDefs and the CSS variables in city.css (`--t-*`) both read from it,
 * so a world's look is data. The Technical values below are the original hardcoded ones.
 */
export interface CityTheme {
  /** Structural lines, grid, rings, beam, glow (the colour that used to be hardcoded teal). */
  line: string;
  /** Lit windows: the main warm light, and the second (paler) light. */
  warm: string;
  cool: string;
  /** Masts, poles, cables. */
  mast: string;
  /** The darkest tone: sign plates, doorways. */
  deep: string;
  /** Ground pieces: avenue asphalt, building pads, the plaza top. */
  road: string;
  plot: string;
  plaza: string;
  /** Building surfaces. */
  wall: { left: Duo; right: Duo; top: Duo; roof: Duo; glass: Duo; cyl: readonly [string, string, string] };
  /** Island body. `under*` fade to transparent. */
  ground: { top: Duo; slabL: Duo; slabR: Duo; underL: Duo; underR: Duo };
}

export const TECHNICAL_THEME: CityTheme = {
  line: "#5fd4c4",
  warm: "#f4e7b6",
  cool: "#8fe6d8",
  mast: "#71827e",
  deep: "#0a1211",
  road: "#080d0d",
  plot: "#15201e",
  plaza: "#26403b",
  wall: {
    left: ["#1f2e2b", "#0f1918"],
    right: ["#152220", "#0a1211"],
    top: ["#33463f", "#233530"],
    roof: ["#2a3b37", "#3a4f47"],
    glass: ["#1d3b3a", "#0f2120"],
    cyl: ["#2a3d39", "#182623", "#0a1211"],
  },
  ground: {
    top: ["#111c1a", "#0d1514"],
    slabL: ["#1b2a27", "#0d1514"],
    slabR: ["#121d1b", "#090f0e"],
    underL: ["#16221f", "#0b1110"],
    underR: ["#0e1614", "#0b1110"],
  },
};

/** Warm amber on brown-black: sodium light, stage light, not neon. */
export const MUSIC_THEME: CityTheme = {
  line: "#f5a23a",
  warm: "#ffcf8a",
  cool: "#f6dcc0",
  mast: "#8a7a6a",
  deep: "#0d0907",
  road: "#0b0806",
  plot: "#1d1712",
  plaza: "#43342a",
  wall: {
    left: ["#2e2620", "#171210"],
    right: ["#1f1915", "#0e0a09"],
    top: ["#4a3d33", "#33291f"],
    roof: ["#3d3229", "#54463a"],
    glass: ["#3a2a1a", "#1d140b"],
    cyl: ["#3d3229", "#241c17", "#0e0a09"],
  },
  ground: {
    top: ["#1a1512", "#12100d"],
    slabL: ["#2a221c", "#12100d"],
    slabR: ["#1c1611", "#0b0908"],
    underL: ["#221b16", "#0e0b09"],
    underR: ["#15100d", "#0e0b09"],
  },
};


/* --------------------------------------------------------------------------
   The four smaller worlds.

   Deliberately lighter than Technical and Music: same island, same engine, same
   silhouettes — only the theme, two or three buildings, and thinner dressing change.
   No new building shapes. A world with fewer clubs should feel like a quieter town,
   not an empty version of the big city.
-------------------------------------------------------------------------- */

/** DANCE: magenta stage wash on plum-black. */
export const DANCE_THEME: CityTheme = {
  line: "#e0559b",
  warm: "#ffd0e6",
  cool: "#f0a8cf",
  mast: "#7d6472",
  deep: "#0e070b",
  road: "#0b0709",
  plot: "#1e141a",
  plaza: "#432a38",
  wall: {
    left: ["#2d2029", "#171016"],
    right: ["#1f1620", "#0e0a0e"],
    top: ["#48343f", "#332430"],
    roof: ["#3c2b35", "#523a49"],
    glass: ["#3a1d2e", "#1d0f18"],
    cyl: ["#3c2b35", "#241a20", "#0e0a0e"],
  },
  ground: {
    top: ["#191216", "#121013"],
    slabL: ["#291d24", "#121013"],
    slabR: ["#1b1318", "#0b090a"],
    underL: ["#221820", "#0e0b0d"],
    underR: ["#150f12", "#0e0b0d"],
  },
};

/** SPORTS: floodlight green on a cold night field. */
export const SPORTS_THEME: CityTheme = {
  line: "#68d96a",
  warm: "#eaffd6",
  cool: "#b4eda0",
  mast: "#6c7a68",
  deep: "#070e08",
  road: "#060b07",
  plot: "#141d15",
  plaza: "#2a4229",
  wall: {
    left: ["#212e22", "#101812"],
    right: ["#17211a", "#0a110c"],
    top: ["#35463a", "#24352a"],
    roof: ["#2c3b30", "#3c4f40"],
    glass: ["#1f3b25", "#10210f"],
    cyl: ["#2c3b30", "#1a2620", "#0a110c"],
  },
  ground: {
    top: ["#121c15", "#0e1510"],
    slabL: ["#1c2a1f", "#0e1510"],
    slabR: ["#131d16", "#090f0b"],
    underL: ["#17221a", "#0b110d"],
    underR: ["#0f1611", "#0b110d"],
  },
};

/** LITERARY: lamp-lit paper, ink and old brass. */
export const LITERARY_THEME: CityTheme = {
  line: "#c9a227",
  warm: "#f6e6b4",
  cool: "#ded1a6",
  mast: "#7d7560",
  deep: "#0c0a06",
  road: "#0a0806",
  plot: "#1b1811",
  plaza: "#3d3626",
  wall: {
    left: ["#2b271d", "#161410",],
    right: ["#1d1a14", "#0d0b08"],
    top: ["#453f31", "#302b20"],
    roof: ["#393327", "#4e4636"],
    glass: ["#332b16", "#1a160b"],
    cyl: ["#393327", "#221e16", "#0d0b08"],
  },
  ground: {
    top: ["#181510", "#11100c"],
    slabL: ["#272219", "#11100c"],
    slabR: ["#1a1712", "#0a0908"],
    underL: ["#201c15", "#0d0b09"],
    underR: ["#14110d", "#0d0b09"],
  },
};

/** CULTURAL: indigo and marigold, festival light. */
export const CULTURAL_THEME: CityTheme = {
  line: "#7c6ef0",
  warm: "#ffd9a0",
  cool: "#c3bafb",
  mast: "#6a6885",
  deep: "#080813",
  road: "#07070f",
  plot: "#15151f",
  plaza: "#2e2c4a",
  wall: {
    left: ["#23223a", "#121222"],
    right: ["#191828", "#0b0b15"],
    top: ["#38365a", "#272545"],
    roof: ["#2f2d4c", "#413e63"],
    glass: ["#232048", "#121026"],
    cyl: ["#2f2d4c", "#1c1b30", "#0b0b15"],
  },
  ground: {
    top: ["#13131f", "#0f0f18"],
    slabL: ["#1e1e30", "#0f0f18"],
    slabR: ["#141420", "#0a0a10"],
    underL: ["#191927", "#0c0c14"],
    underR: ["#101019", "#0c0c14"],
  },
};

/** The CSS custom properties city.css reads (`--t-*`). Set them on the scene's root element. */
export function themeVars(t: CityTheme): Record<string, string> {
  return {
    "--t-line": t.line,
    "--t-warm": t.warm,
    "--t-cool": t.cool,
    "--t-mast": t.mast,
    "--t-deep": t.deep,
    "--t-road": t.road,
    "--t-plot": t.plot,
    "--t-plaza": t.plaza,
  };
}

/** Small floating islands that fill the edges of the world. Which one sits where is per city. */
export type IsletKind = "dish" | "pylon" | "cube" | "pad" | "speaker" | "mic";

/**
 * World-specific set dressing on the main island. Data, so the drawing code stays generic.
 * Technical's values are exactly what used to be hardcoded in Ground.tsx and Scenery.tsx.
 */
export interface CityDressing {
  /** Tree positions in grid cells, and their shape. */
  trees: Array<[number, number]>;
  treeKind: "cone" | "round";
  /** A painted pad on the ground. `drone` parks a drone above it. */
  pad?: { gx: number; gy: number; mark: "h" | "note"; drone?: boolean };
  /** A fenced yard: fence rectangle [gx0, gy0, gx1, gy1] and blocks [gx, gy, w, d, height]. */
  yard?: { fence: [number, number, number, number]; blocks: Array<[number, number, number, number, number]> };
  /** What sits on each of the eight edge islets (index order, see Scenery.tsx). */
  islets: IsletKind[];
}

export interface CitySpot {
  clubId: string;
  silhouette: Silhouette;
  /** Plot rectangle in grid cells. */
  gx: number;
  gy: number;
  w: number;
  d: number;
  /** Total height in px, used for hover/hit areas and the camera target. */
  height: number;
}

export interface CityLayout {
  domain: DomainId;
  /** Grid is size x size cells. */
  size: number;
  /** Avenues: a strip `width` cells wide centred on `at`, running along `axis`. */
  avenues: Array<{ axis: "x" | "y"; at: number; width: number }>;
  spots: CitySpot[];
  /** World bounds in screen px (the pannable area). */
  world: { minX: number; minY: number; width: number; height: number };
  /** The framing that must fit on screen at the default camera. */
  frame: { width: number; height: number };
  /** Where the camera starts, in world px. */
  focus: [number, number];
  theme: CityTheme;
  dressing: CityDressing;
}

/** sessionStorage key: the club page writes it, the city reads it to look at the building you just left. */
export const RETURN_KEY = "jyc:from-club";

const technical: CityLayout = {
  domain: "technical",
  size: 16,
  avenues: [
    { axis: "x", at: 8, width: 2 },
    { axis: "y", at: 8, width: 2 },
  ],
  spots: [
    { clubId: "coding", silhouette: "spire", gx: 4.4, gy: 0.6, w: 2.6, d: 2.6, height: 360 },
    { clubId: "robotics", silhouette: "workshop", gx: 0.8, gy: 3.6, w: 4.6, d: 3.2, height: 190 },
    { clubId: "dsc", silhouette: "twin", gx: 9.6, gy: 1.0, w: 5.8, d: 2.6, height: 300 },
    { clubId: "cice", silhouette: "tiered", gx: 1.3, gy: 9.7, w: 4.6, d: 4.6, height: 290 },
    { clubId: "dice", silhouette: "die", gx: 10.2, gy: 10.0, w: 4.6, d: 4.6, height: 190 },
  ],
  world: { minX: -1240, minY: -330, width: 2480, height: 1340 },
  frame: { width: 1460, height: 1000 },
  focus: [0, 330],
  theme: TECHNICAL_THEME,
  dressing: {
    trees: [
      [0.9, 0.9], [1.7, 1.6], [2.5, 0.9], [3.3, 1.8], [1.2, 2.5], [2.2, 2.7],
      [14.6, 4.8], [15.2, 5.6], [14.5, 6.4], [15.2, 4.2],
      [6.3, 10.6], [6.4, 12.0], [6.3, 13.4], [6.5, 14.8],
      [15.4, 10.4], [15.3, 11.8], [15.5, 13.2], [15.2, 14.6], [11, 15.4], [12.6, 15.5],
    ],
    treeKind: "cone",
    pad: { gx: 3.4, gy: 15.2, mark: "h", drone: true },
    yard: {
      fence: [9.9, 4.4, 13.9, 6.1],
      blocks: [
        [10.2, 4.75, 0.9, 0.9, 26],
        [11.5, 4.75, 0.9, 0.9, 19],
        [12.8, 4.75, 0.75, 0.9, 26],
      ],
    },
    islets: ["dish", "pylon", "cube", "pylon", "cube", "pad", "cube", "dish"],
  },
};

/**
 * MUSIC. Same island and avenues as Technical, four buildings:
 *   band          stage        back right   (fly tower, deck, speaker stacks, lit marquee)
 *   vocals        studio       back left    (round soundproof drum, waveform windows)
 *   instrumentals hall         front left   (concert hall, a row of organ pipes on the roof)
 *   dj            vinyl        front right  (a record: round, low, grooved top, tonearm)
 * Club order here does not matter; numbering follows lib/data.ts.
 */
const music: CityLayout = {
  domain: "music",
  size: 16,
  avenues: [
    { axis: "x", at: 8, width: 2 },
    { axis: "y", at: 8, width: 2 },
  ],
  spots: [
    { clubId: "band", silhouette: "stage", gx: 9.2, gy: 0.9, w: 6.0, d: 4.4, height: 250 },
    { clubId: "vocals", silhouette: "studio", gx: 0.9, gy: 1.5, w: 5.2, d: 5.0, height: 215 },
    { clubId: "instrumentals", silhouette: "hall", gx: 1.0, gy: 9.6, w: 5.2, d: 5.0, height: 250 },
    { clubId: "dj", silhouette: "vinyl", gx: 10.2, gy: 10.0, w: 4.6, d: 4.6, height: 135 },
  ],
  world: { minX: -1240, minY: -330, width: 2480, height: 1340 },
  frame: { width: 1460, height: 1000 },
  focus: [0, 330],
  theme: MUSIC_THEME,
  dressing: {
    // A hedge of round trees along the back edge, a few by the front lawns, a small grove beside the stage.
    trees: [
      [0.6, 0.7], [1.6, 0.55], [2.7, 0.6], [3.8, 0.55], [4.9, 0.6], [6.1, 0.7],
      [6.5, 2.4], [6.6, 3.9], [6.5, 5.3],
      [9.5, 6.2], [10.5, 6.45],
      [15.5, 1.6], [15.5, 3.2], [15.6, 4.9],
      [6.6, 10.8], [6.6, 12.4], [6.5, 14.0],
      [15.5, 11.0], [15.5, 12.6], [15.5, 14.2],
      [9.6, 15.4], [2.2, 15.5], [4.6, 15.5],
    ],
    treeKind: "round",
    // A painted busking circle in the stage's forecourt, and a fenced yard of flight cases beside it.
    pad: { gx: 12.3, gy: 6.1, mark: "note" },
    yard: {
      fence: [13.7, 5.7, 15.7, 6.9],
      blocks: [
        [13.95, 5.95, 0.55, 0.5, 14],
        [14.65, 5.95, 0.55, 0.5, 22],
        [14.95, 6.4, 0.5, 0.4, 10],
      ],
    },
    islets: ["mic", "speaker", "cube", "speaker", "speaker", "pad", "cube", "mic"],
  },
};


/* --------------------------------------------------------------------------
   DANCE / SPORTS / LITERARY / CULTURAL

   Each is built from silhouettes that already exist, so no new drawing code ships:
     stage / hall / studio / tiered / workshop / twin / die / vinyl / spire.
   They use a SMALLER island (12 cells instead of 16), one avenue instead of a
   crossroads, and about a third of Technical's trees. The result reads as a town
   square rather than a district — lighter to look at and lighter to render, while
   Technical and Music stay exactly as they were.
-------------------------------------------------------------------------- */

/** Shared geometry for the four small worlds: same camera, same bounds, smaller grid. */
const SMALL = {
  size: 12,
  avenues: [{ axis: "y" as const, at: 6, width: 2 }],
  world: { minX: -1100, minY: -300, width: 2200, height: 1200 },
  frame: { width: 1320, height: 920 },
  focus: [0, 300] as [number, number],
};

/** DANCE: one club, so one building with real presence and a wide open floor in front of it. */
const dance: CityLayout = {
  domain: "dance",
  ...SMALL,
  spots: [{ clubId: "dance-crew", silhouette: "stage", gx: 3.4, gy: 2.4, w: 6.0, d: 4.4, height: 250 }],
  theme: DANCE_THEME,
  dressing: {
    trees: [
      [0.7, 0.8], [1.8, 0.6], [2.9, 0.75],
      [0.8, 8.6], [0.8, 10.0], [2.2, 11.3],
      [11.2, 2.0], [11.3, 3.6], [11.2, 8.4], [11.3, 10.0],
    ],
    treeKind: "round",
    // The rehearsal circle: the floor the crew actually uses, in front of the stage.
    pad: { gx: 4.6, gy: 8.0, mark: "note" },
    islets: ["speaker", "pad", "cube", "speaker", "pad", "cube", "speaker", "pad"],
  },
};

/** SPORTS: the ground (tiered stands) and the pavilion (hall), facing each other across the avenue. */
const sports: CityLayout = {
  domain: "sports",
  ...SMALL,
  spots: [
    { clubId: "football", silhouette: "tiered", gx: 0.9, gy: 1.2, w: 4.6, d: 4.6, height: 260 },
    { clubId: "cricket", silhouette: "hall", gx: 6.6, gy: 6.4, w: 4.6, d: 4.4, height: 210 },
  ],
  theme: SPORTS_THEME,
  dressing: {
    trees: [
      [6.6, 0.8], [7.8, 0.7], [9.0, 0.8], [10.2, 0.7], [11.3, 0.9],
      [0.8, 7.0], [0.8, 8.6], [0.9, 10.2], [2.4, 11.4],
    ],
    treeKind: "cone",
    // The landing/warm-up square between the two grounds.
    pad: { gx: 8.6, gy: 2.4, mark: "h" },
    yard: {
      fence: [1.0, 6.6, 4.4, 8.0],
      blocks: [
        [1.3, 6.9, 0.8, 0.8, 22],
        [2.4, 6.9, 0.8, 0.8, 16],
        [3.4, 6.95, 0.7, 0.75, 22],
      ],
    },
    islets: ["pylon", "pad", "cube", "pylon", "pad", "cube", "pylon", "pad"],
  },
};

/** LITERARY: the society's reading hall and the debate chamber (twin towers, two sides of an argument). */
const literary: CityLayout = {
  domain: "literary",
  ...SMALL,
  spots: [
    { clubId: "literary-society", silhouette: "hall", gx: 0.9, gy: 1.6, w: 5.0, d: 4.6, height: 235 },
    { clubId: "debate", silhouette: "twin", gx: 6.8, gy: 6.6, w: 4.6, d: 2.6, height: 290 },
  ],
  theme: LITERARY_THEME,
  dressing: {
    trees: [
      [6.8, 0.9], [8.0, 0.75], [9.2, 0.9], [10.4, 0.8], [11.3, 1.8],
      [0.8, 7.2], [0.8, 8.8], [0.9, 10.4], [2.6, 11.4], [4.2, 11.4],
    ],
    treeKind: "round",
    islets: ["cube", "dish", "pad", "cube", "dish", "pad", "cube", "dish"],
  },
};

/** CULTURAL: the drama stage and the fine-arts workshop, with a courtyard between them. */
const cultural: CityLayout = {
  domain: "cultural",
  ...SMALL,
  spots: [
    { clubId: "drama", silhouette: "stage", gx: 6.4, gy: 1.0, w: 5.4, d: 4.0, height: 245 },
    { clubId: "fine-arts", silhouette: "workshop", gx: 0.9, gy: 7.0, w: 4.6, d: 3.2, height: 190 },
  ],
  theme: CULTURAL_THEME,
  dressing: {
    trees: [
      [0.8, 0.9], [1.9, 0.7], [3.0, 0.9], [1.4, 2.2],
      [11.2, 6.6], [11.3, 8.2], [11.2, 9.8], [9.6, 11.3], [7.8, 11.4],
    ],
    treeKind: "cone",
    // The courtyard where the two clubs meet: processions start here.
    pad: { gx: 6.6, gy: 7.4, mark: "note" },
    islets: ["dish", "speaker", "cube", "pad", "dish", "speaker", "cube", "pad"],
  },
};

const cities: Partial<Record<DomainId, CityLayout>> = { technical, music, dance, sports, literary, cultural };

/**
 * The built-in layout of a world's city (theme, dressing, avenues, spots), or undefined if it has none.
 * Client-safe and synchronous. Server pages use the async `getCity` in lib/data.ts instead, which
 * replaces `spots` with rows from the city_spots table when they exist.
 */
export const getStaticCity = (id: DomainId): CityLayout | undefined => cities[id];

/** Screen-space centre of a building (world px), used to point the camera and the zoom at it. */
export function spotCenter(spot: CitySpot): [number, number] {
  const [x, y] = centerOf(spot.gx, spot.gy, spot.w, spot.d, spot.height * 0.45);
  return [x, y];
}

/** Painter's order: back to front. */
export const byDepth = (spots: CitySpot[]): CitySpot[] =>
  [...spots].sort((a, b) => a.gx + a.w + a.gy + a.d - (b.gx + b.w + b.gy + b.d));
