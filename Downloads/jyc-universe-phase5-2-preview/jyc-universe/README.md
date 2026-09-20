# JYC Universe

Jaypee Youth Club as a place you travel through, not a page you scroll.

```
JYC universe → constellation map → world → city → club building → club space
```

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

**Add the logo:** copy the real file to `public/jyc-logo.png` (square works best).
Until it exists, a plain "JYC" wordmark is shown. The logo is never redrawn or restyled.

## What exists now

| Route | What it is |
| --- | --- |
| `/` | Opening: dark, stars, logo, wordmark, orbits, six world seeds, **Enter JYC** |
| `/universe` | Interactive constellation map (phones get a simplified list) |
| `/domain/technical` | **Technical city**: isometric SVG island, 5 clickable buildings, drag to pan (tablet/desktop). Phones get the arrival page with a tappable club list |
| `/domain/music` | **Music city (phase 2C)**: same engine, amber theme, 4 buildings (stage, studio, hall, vinyl). Phones get the club list |
| `/domain/[other]` | Arrival scene: planet, story, club list (no city yet) |
| `/club/[id]` | **Club space**, laid out as the floors of the club's building (About, Team, Achievements, Events, Gallery, Connect) |
| `/events` | **Event universe (phase 3A)**: upcoming events are glowing lights on a time arc (soonest nearest), past events a dim trail. Under 900px wide: a simple list |
| `/events/[id]` | **Event page (phase 3A)**: a portal grows out of the clicked light; name, date, time, location, description, poster, registration, share |
| `/gallery` | **Visual archive (phase 3B)**: every club's gallery on one masonry wall, filter by world, full-screen viewer |
| `/clubs` | **Clubs index (phase 3B)**: every club as a line of type grouped by world; hover shows its motif |
| `/about` | **The JYC story (phase 3B)**: a timeline, content in `lib/sample.ts` or the `about_entries` table (placeholder) |

Events: club-space posters and the event universe both `travelTo()` into `/events/[id]`, with the clicked orb/poster as the camera origin.

Journey: universe, Technical planet, city, click a building (camera zooms into THAT building), club space, "Back to Technical city" (camera looks at the building you just left).

Eagle: intentionally not built yet.

## How the camera works

Every cross-scene move goes through `travelTo()` in `components/TravelProvider.tsx`:
scene pushes in toward the click, stars streak away from it, a circle grows from the
click point carrying the destination name, the route swaps underneath, then it settles in.
Only `transform` and `opacity` are animated. Reduced motion falls back to a plain route change.

## Performance notes

- One canvas for all stars: 160 (desktop) / 70 (lite), ~30fps idle, paused in background tabs, DPR capped.
- Constellation is a single SVG; hover is CSS driven (`app/globals.css`), no per-frame JS except desktop pointer parallax.
- Planets are pure CSS gradients, no images.
- Phones/touch/low-end devices get the `lite` tier (`hooks/useMotionTier.ts`).
- No 3D dependency yet. When Phase 2 needs any, load it with `next/dynamic` on the city route only.

## Content

Content is served by async lookups in `lib/data.ts`, typed by `lib/types.ts`.
With Supabase env vars set it comes from the database (see **Phase 3C** below); without them the site runs on the
local sample content in `lib/sample.ts`, so `npm install && npm run dev` still works with no setup.
Club names other than the technical ones, plus all descriptions and events, are **placeholders**.

## Phase 2 file map

```
lib/iso.ts                 isometric projection, face matrices, window/code-line/cylinder generators
lib/city.ts                city layout data (which club sits where). Serializable, DB-ready
lib/identity.ts            per-club accent, motif, title treatment
lib/gear.ts                gear outline path
lib/dates.ts               YYYY-MM-DD helpers, upcoming/past split
hooks/useMediaQuery.ts     null until mounted, then true/false
hooks/useToday.ts          build date on server, visitor's date after mount
components/city/           CityScene (route entry), CityWorld, Ground, Scenery, Building, buildings (5 silhouettes),
                           parts, CityDefs, useCityCamera, city.css
components/club/           ClubScene, Elevator, Motif, Poster, Reveal, club.css, floors/{Lobby,TeamFloor,
                           MilestonesFloor,EventsFloor,GalleryFloor,ConnectFloor}
app/club/[id]/page.tsx     static club routes
```

Changed: `lib/data.ts` (sample Technical content, eventsOf, neighboursOf; content later moved to `lib/sample.ts` in 3C), `components/domain/DomainScene.tsx`,
`app/domain/[id]/page.tsx`, `components/Hud.tsx` (location label for clubs).

### Performance notes for the city
- One SVG, sized in real pixels, panned with a transform only. No canvas, no WebGL, no filters.
- Hover re-renders only the two affected buildings (memoised); all hover styling is CSS.
- Ambient loops (traffic, beacons, radar, robot arm, drone) are CSS transform/opacity, tiny, and switched off for `lite` and `static` tiers.
- The city JS + CSS load only on md+ screens via `next/dynamic`. Phones never download them.
- Club/city CSS is route-local (imported by the scene component), so it does not bloat other routes.

### 2B-2 polish
- `city/Callout.tsx`: hover callout (name, tagline, Enter) in a layer above all buildings; opacity and transform only.
- `city/CityMinimap.tsx`: 120px island map. Writes one `transform` attribute from the camera's motion values; no React state while panning.
- `city/Building.tsx`: painted buildings are `aria-hidden`; `BuildingFocus` twins sit after them in club-number order and carry the link role, label and a dashed focus ring.
- `club/Signature.tsx` + `club.css`: one signature interaction per motif in the club hero (DICE pips drift, DSC nodes swell near the pointer, CICE radar sweep, Robotics gears, Coding types its tagline). `full` tier only.
- Floors are labelled `tabIndex={-1}` sections; the elevator moves keyboard focus with the scroll (`goToFloor`).

## Sample content

Technical club descriptions, people ("Name to be added"), achievements ("Sample: ..."), events and the gallery are
**placeholders** in `lib/sample.ts`. An empty gallery `src` draws a generated tile from the club's motif.

## Phase 3A (Event universe)

```
lib/events.ts                     EventView type + time-arc geometry (arcPoint, orbLayout, trailLayout). Pure, no data imports
lib/eventViews.ts                 server lookups: event + club name + club identity (swap for Supabase later)
lib/dates.ts                      + fullDate, daysBetween, whenLabel
components/events/EventsScene.tsx route entry: >= 900px loads EventUniverse via next/dynamic, otherwise EventList
components/events/EventUniverse.tsx  the scene (one SVG). Lights + trail are memoised; hover is one state string
components/events/EventList.tsx   phone list, past events folded under one toggle
components/events/EventDetail.tsx /events/[id]: portal landing, facts, poster, register, share
components/events/ShareButton.tsx Web Share API, falls back to clipboard, then a hidden textarea
components/events/orbOrigin.ts    remembers the clicked orb's screen position (sessionStorage) for the landing
components/events/events.css      route-local CSS. transform + opacity only, loops on the `full` tier only
app/events/page.tsx, app/events/[id]/page.tsx   static routes, generateStaticParams from lib/data.ts events
```

Changed: `components/club/Poster.tsx` (`linked` prop, avoids a nested link), `components/club/floors/EventsFloor.tsx`
(posters link to `/events/[id]`), `components/Hud.tsx` (location label), `components/MenuOverlay.tsx` (Events no longer
"Opening soon"). The `app/[section]` holding scene was removed in 3B.

How it behaves:
- Time runs along one arc. Upcoming events are sorted by `lib/dates.ts` `splitEvents` using the visitor's date (`useToday`).
  Size, brightness and spacing follow simple perspective. Each light uses its club's accent.
  Up to 10 lights and 12 trail dots are drawn; the rest are counted, not drawn.
- Mouse: hover or keyboard focus shows a plate (club, title, date, time, days away); click or Enter travels in.
- Touch (`hover: none`): first tap shows the plate, second tap travels. Tapping empty space clears it.
- The portal on the event page starts at the clicked orb's position and grows into place (CSS animation, `--fx/--fy`
  set before it starts). No stored position (direct visit, refresh) means it just grows in place.
- Static export note: "today" on a statically built page is the build date; the client corrects it on mount.
- The scene breakpoint is 900px, not 768px: below that the scene is drawn too small to read, so tablets in portrait get the list.

## Phase 3B (Gallery, Clubs, About)

```
lib/archive.ts                     server joins: archiveTiles() (all club galleries, interleaved), archiveWorlds(), clubsByWorld()
lib/data.ts                        + aboutIntro, aboutStory (PLACEHOLDERS, replace with the real story)
lib/types.ts                       + AboutEntry
components/pages/GalleryScene.tsx  wall (CSS columns) + filter + Viewer (Esc, arrows, swipe, focus trap, focus returns to the tile)
components/pages/ClubsScene.tsx    typographic rows; ONE motif layer for the hovered/focused row
components/pages/AboutScene.tsx    timeline, oldest first
components/pages/pages.css         route-local (clubs + about)
app/gallery|clubs|about/page.tsx   static routes
```

Removed: `app/[section]/page.tsx` and `components/SectionScene.tsx` (all four holding scenes are real pages now).
Changed: `components/MenuOverlay.tsx` (no more "Opening soon" notes), `components/club/floors/GalleryFloor.tsx`
(`break-inside-avoid` so a tile can never split across two columns).

Notes:
- Gallery photos are lazy, `decoding="async"` and carry `width`/`height`; tiles reserve their space with `aspect-ratio`,
  so nothing shifts. The viewer image is eager and its neighbours are preloaded. Empty `src` draws the club's motif.
- Right now only the five Technical clubs have gallery items (placeholders), so the other worlds show "No photos yet".
- Clubs rows use each club's identity (case, tracking, solid or outlined). Colour changes are an opacity crossfade of a
  second copy of the name, so nothing but transform/opacity animates. Touch has no hover, and nothing depends on it.
- The About story is sorted by year; add or reorder entries in `lib/sample.ts` (or the `about_entries` table) only.

## Phase 3C (Supabase data layer)

```
lib/supabase.ts                server client from env vars; null when unset. Queries go through Next's data cache (300s)
lib/data.ts                    async lookups: getDomains/getDomain, getClubs/getClub/clubsOf, getEvents/getEvent/eventsOf,
                               neighboursOf, getCity, getAbout, getSiteIndex. SERVER ONLY. One snapshot per request
lib/sample.ts                  the local sample content (was lib/data.ts). Fallback + seed source
lib/archive.ts, lib/eventViews.ts   server joins, now async
components/SiteProvider.tsx    tiny client context (domains, collaborations, club/event labels) fed by app/layout.tsx
supabase/schema.sql            tables + RLS (public read, no public write)
supabase/seed.sql              GENERATED from lib/sample.ts by `npm run seed:generate`. Placeholder content
.env.example                   SUPABASE_URL, SUPABASE_ANON_KEY
```

Behaviour:
- **No env vars:** local sample content. **Env vars, empty `domains`:** sample content + a console warning (seed not run).
  **Env vars, query fails:** the build/render throws, so a running site keeps its last good pages instead of publishing placeholders.
- Routes are static with `revalidate = 300`. `dynamicParams` is now `true`: a club/event/world added in Supabase
  after a build is rendered on first visit (then cached) instead of 404-ing. `generateStaticParams` still pre-renders what exists.
- A club's events are the `events` rows with its `club_id`, newest first (this replaces the hand-kept `eventIds` list).
- `club_identity` rows are attached to each club (`Club.identity`); `identityFor()` prefers it, then the built-in table
  in `lib/identity.ts`, then the world default. Client components did not change how they call it.
- `city_spots` rows replace a world's building positions. Theme, dressing and avenues remain in `lib/city.ts` (design),
  so a world still needs a layout there to have a city. `getCity` moved to `lib/data.ts` (async); `getStaticCity` in
  `lib/city.ts` is the client-safe sync layout.
- Extra tables beyond the nine asked for: `collaborations`, `about_entries`, `site_settings` (about intro), so nothing stays hard-coded.
- Client components that used to import `lib/data.ts` (HUD, menu, universe map, intro) now read `useSite()`. No markup or styling changed.


## Phase 3D (Images, SEO, error/loading scenes)

```
next.config.mjs                images.remotePatterns for Supabase Storage (wildcard + the project host from env),
                               AVIF/WebP, narrowed deviceSizes, 1-day optimiser cache, optimizePackageImports
components/ui/SceneImage.tsx   the one image component: next/image with `sizes` per layout, width/height when the
                               record has them, `fill` otherwise. Falls back to `unoptimized` for any src that is
                               not a configured host, so a bad URL in Supabase can never take a page down
lib/seo.ts                     SITE_NAME/DESCRIPTION, siteUrl() (NEXT_PUBLIC_SITE_URL -> VERCEL_URL -> localhost)
lib/og.tsx                     ogScene(): the share card, drawn in the universe style with next/og. No network fonts
app/opengraph-image.tsx        default card
app/{club,events,domain}/[id]/opengraph-image.tsx   per-club / per-event / per-world cards in that thing's accent
app/sitemap.ts, app/robots.ts  /sitemap.xml from the live data, /robots.txt
app/not-found.tsx              404 as "nothing orbits here", with four ways back
app/error.tsx, app/global-error.tsx   route boundary + a self-styled last resort if the layout itself dies
components/TravelLoading.tsx   rings breathing out of the centre, under travelTo()'s cover
app/loading.tsx + per-segment loading.tsx for club, events, domain, gallery
PERFORMANCE.md                 per-route budgets, what is over, what was fixed cheaply
```

Changed: `app/layout.tsx` (metadataBase, title template, Open Graph, Twitter, robots, icons),
`app/club/[id]/page.tsx`, `app/events/[id]/page.tsx`, `app/domain/[id]/page.tsx` (canonical + OG per page),
`components/club/Poster.tsx`, `components/club/floors/TeamFloor.tsx`,
`components/club/floors/GalleryFloor.tsx`, `components/pages/GalleryScene.tsx` (plain `<img>` -> `SceneImage`),
`app/globals.css` (`.tl-*` loading keyframes only).

Set `NEXT_PUBLIC_SITE_URL=https://your-domain` in production, or Open Graph URLs and the sitemap
point at localhost.


## Phase 3E (four more cities, richer opening)

**Cities for the four smaller worlds.** `dance`, `sports`, `literary` and `cultural` now have real
cities, built from silhouettes that already exist (`stage`, `hall`, `tiered`, `twin`, `workshop`) so
**no new drawing code ships**. They are deliberately lighter than Technical and Music, which are
untouched: a 12-cell island instead of 16, one avenue instead of a crossroads, about a third of the
trees, and two buildings each (Dance has one club, so it gets one building and an open floor).
Each has its own theme in `lib/city.ts`: Dance magenta, Sports floodlight green, Literary brass and
paper, Cultural indigo and marigold. Adding them was data only — `lib/city.ts` and nothing else.

**Opening scene.** `components/intro/LogoIntro.tsx` now forms the actual constellation map out of the
dark before the rings appear: each world's star cluster, its links, its dust and the dashed threads
between collaborating worlds, all from the same data `/universe` uses. Seeds got a soft halo. The
whole constellation layer drifts slowly (`.intro-drift` in `app/globals.css`, one CSS transform on
one `<g>`, off for reduced motion), so the background is never completely still.

**Logo.** `public/jyc-logo.png` is a 512px crop taken from the screenshot you sent, so it is a bit
soft. Drop the original file over it when you have it; nothing else needs to change.


## Phase 5 (City Hall — the admin panel)

Content is edited in the browser at **`/admin`**. Nothing in `lib/sample.ts` or any other file needs
to be touched to add a club, move a building or post an event.

```
supabase/migrations/0001_admin_writes.sql   admins allow-list + write policies. Run AFTER schema.sql
middleware.ts                  first gate: no session cookie, no /admin
lib/admin/cookie.ts            the cookie name, alone, so the edge middleware can read it
lib/admin/session.ts           sign-in, refresh, the allow-list check, the admin's database client
lib/admin/resources.ts         EVERY editable table described once: fields, types, help text, ordering
lib/admin/actions.ts           all writes, as Server Actions. Validation, friendly errors, revalidate
lib/admin/query.ts             uncached reads for the panel (an editor must see the true state)
app/admin/*                    layout/shell, login, dashboard, administrators
app/admin/[resource]/*         ONE list + new + edit screen that serves all twelve tables
components/admin/*             Sidebar, Form, DeleteButton, Notices, ScopeFilter
app/admin/admin.css            route-local. Quiet and dense: a tool, not a scene
```

**Setup, once:**
1. Run `supabase/schema.sql`, then `supabase/migrations/0001_admin_writes.sql`.
2. Supabase → Authentication → Users → Add user (email, password, auto-confirm).
3. `insert into public.admins (user_id, email, role) values ('<that uuid>', '<email>', 'owner');`
4. Sign in at `/admin/login`. Add the rest of the team from the Administrators page.

**Security shape.** Three independent checks, and the app server holds no privileged key:
the middleware looks for a session cookie; the admin layout verifies the session against the
`admins` table; and Postgres re-checks `is_admin()` through RLS on every single row. The session
lives in one httpOnly cookie, so page scripts cannot read it. There is **no service-role key
anywhere in this project** — a total compromise of the app still cannot write past RLS.

**Editable now:** Domains, Clubs, Events, Members (coordinators), Achievements, Gallery, City Map,
Club identity, Socials, Collaborations, Story (/about) and Settings. Deleting a world or a club
cascades to everything inside it, and the confirmation says so.

**Deliberately not in the panel:** creating login accounts (that needs a service-role key), and the
city *theme*, set dressing and avenues, which are design and stay in `lib/city.ts`. City Map moves
buildings within a layout that already exists.

### Route groups

Public pages moved into `app/(site)/` with their own layout carrying the star field, HUD, menu and
travelling camera. The root layout is now just `<html>`, fonts and metadata, so `/admin` loads none
of the universe chrome. Route groups do not appear in URLs — every public path is unchanged.


## Phase 5.1 (Logo as a sun, entry gate)

**Logo.** `public/jyc-logo.png` is now a true circle (transparent corners, not a square crop with
beige bleed at the edges). `components/LogoMark.tsx` dresses it as a sun: an amber corona, two thin
orbit rings, and three small planets that circle it (`.logo-*` in `app/globals.css`, transform/opacity
only, off for reduced motion). The badge artwork itself is untouched — only the frame around it
changed. Replace `public/jyc-logo.png` with the real file whenever you have it; the sun dressing
keeps working the same way.

**Entry gate.** The opening screen now has a small "Administrator sign in" link under "Enter JYC",
going to `/admin/login`. There is deliberately **no shortcut password baked into the page** — a
fixed password in client code is readable by anyone who opens dev tools, which would make the whole
RLS-backed access model in Phase 5 pointless. Signing in there is the same real Supabase check as
before: email + password, checked against the `admins` table. Create an account named however you
like (`raghav@yourdomain.com`, etc.) the way Phase 5's README section describes, and that becomes
your admin login — "Enter JYC" continues to lead every visitor into the public universe as it always
did.


## Phase 5.2 (Preview mode — the admin panel with no database)

`/admin` no longer requires Supabase to open. With no `SUPABASE_URL` / `SUPABASE_ANON_KEY` set, the
whole panel is available with **no sign-in**, showing the site's own built-in sample content
(`lib/sample.ts`, `lib/identity.ts`, `lib/city.ts`) reshaped into the same rows the real tables would
hold (`lib/admin/preview.ts`). Every list, every Add/Edit form and every field works exactly as it
will once connected — nothing is a simplified mock. The one difference: Save and Delete validate the
form, then say plainly "nothing was stored" instead of writing anywhere, because there is genuinely
nowhere to write to yet. A second, in-memory fake database was deliberately not built — it would be
more code, and it would quietly lose people's work the moment the server restarted, which is worse
than being honest that nothing persists yet.

```
lib/admin/configured.ts   the one check ("is a database wired up?"), with no imports, so both the
                          edge middleware and the server-only session code can read it the same way
lib/admin/preview.ts      the local sample content reshaped into the same rows Supabase would hold
```

Changed: `lib/admin/query.ts` and `lib/admin/actions.ts` (branch to preview reads/no-op writes when
`adminConfigured()` is false), `middleware.ts` (skips the sign-in gate entirely in preview mode),
`app/admin/layout.tsx` (drops the old "No database connected" block screen for an open panel with a
banner instead), `app/admin/login/page.tsx` (redirects to `/admin` — nothing to sign into yet),
`app/admin/admins/page.tsx` (explains itself instead of erroring, since there is nowhere to store an
admin list without a database).

**Turning preview mode off** happens automatically: set the two env vars, run both SQL files, and
the exact same screens start reading and writing the real database — see the Phase 5 section above
for the full setup. Nothing about the panel's code path changes; only which data it points at does.

## Roadmap

- **Phase 2:** illustrated 2.5D city per world (SVG, one world first: Technical), clickable buildings, building → club transition, club space (about, team, achievements timeline, events, gallery, socials, contact).
- **Phase 3:** events as glowing objects + event detail, gallery wall, achievements timeline, Supabase.
- **Phase 4:** eagle fly-in and landing on the logo.

## Phase 2C (Music city)

- `lib/city.ts`: `CityTheme` (TECHNICAL_THEME, MUSIC_THEME), `themeVars()`, `CityDressing` (trees, pad, yard, islets), `getCity('music')`.
- `components/city/musicBuildings.tsx`: Stage (Band), Studio (Vocals), Hall (Instrumentals), Vinyl (DJ). Registered in `buildings.tsx`.
- `city.css`: teal literals replaced by `--t-*` variables (defaults = Technical). One animation added: `.eq-bar` (scaleY), off for lite/static/reduced motion.
- `lib/identity.ts`: identities for band, vocals, instrumentals, dj; new `waves` motif (`club/Motif.tsx`), `heroSeed`.
- `instrumentals` and `dj` clubs in `lib/data.ts` are PLACEHOLDERS. Replace with the real clubs.
- Verified without `npm run build` (no network where this was written): Technical's SVG markup is byte-identical to before
  except one unused `jc-stage` gradient in defs, and its CSS is identical once the `--t-*` variables are substituted.
  Music was rendered and inspected in Chromium (all four buildings, hover, EQ animation, motion tiers). Run
  `npx tsc --noEmit && npm run build` once locally to be sure.
