# Performance checklist (end of Phase 3D)

`npm run build` could not be run where this was written (no network, so no `node_modules`). The
numbers below are **budgets and a static read of what each route pulls in**, not measured output.
Run this once locally and fill in the right-hand column:

```bash
npm install && npx tsc --noEmit && npm run build
# then: ANALYZE the "First Load JS" column next build prints per route
```

## Budgets

| Scope | Budget | Why |
| --- | --- | --- |
| Shared chunk (every route) | **≤ 110 kB** gzip | React + Next + the always-on scene chrome |
| A content route (`/clubs`, `/about`, `/events`) | **≤ 160 kB** first load | Type and CSS, one small scene |
| A heavy scene route (`/domain/[id]`, `/club/[id]`, `/gallery`) | **≤ 210 kB** first load | SVG city / masonry wall / viewer |
| Any single route | **≤ 240 kB** first load | Above this, phones on 4G feel it |
| Largest image request | **≤ 250 kB** | Enforced by the optimiser + `sizes` now |

## What each route carries

Always on (in the shared chunk, because they live in `app/layout.tsx`):
`StarField`, `TravelProvider`, `Hud`, `SceneFrame`, `MenuOverlay`, `SiteProvider` — all client, all
importing `framer-motion`. **This is the single biggest line item in the whole project** and it is
paid on every route, including `/robots.txt`-adjacent static pages.

| Route | Heaviest client code | Status |
| --- | --- | --- |
| `/` | `LogoIntro` | fine |
| `/universe` | `Constellation` / `MobileUniverse` | fine |
| `/domain/[id]` | city engine (`CityScene`, `buildings`, `musicBuildings`, `useCityCamera`) ≈ **58 kB of source** | `next/dynamic`, but now loads for every screen size — see Phase 3F below |
| `/club/[id]` | six floors + `Motif` + `Signature` | **watch** — all six floors are in one chunk |
| `/events` | `EventUniverse` (15 kB source) | already `next/dynamic`, ≥900px only |
| `/events/[id]` | `EventDetail` | fine |
| `/gallery` | `GalleryScene` (14 kB source, viewer + focus trap) | **watch** |
| `/clubs`, `/about` | `ClubsScene`, `AboutScene` | fine |

## Over budget / at risk

1. **`framer-motion` in the shared chunk (≈ 34–40 kB gzip).** Every route pays for it because the
   layout chrome uses it. `optimizePackageImports` (added to `next.config.mjs` this phase) trims the
   barrel, but the real fix is to move `Hud`/`MenuOverlay`'s few animations to CSS and leave
   `framer-motion` to the scenes. **Not done here — it touches components this phase was told not to
   rebuild.** Expected saving: 20–30 kB on every route.
2. **`/club/[id]` ships all six floors eagerly.** `GalleryFloor` and `MilestonesFloor` are below the
   fold on every screen. `next/dynamic` on those two, with the existing aspect-ratio boxes as the
   placeholder, would cut the route without any visible change. Expected saving: 8–14 kB.
3. **`GalleryFloor`'s curtain is a `motion.div` per tile.** A wall of 30 photos mounts 30 Framer
   nodes for one `scaleY`. A CSS `@keyframes` + `IntersectionObserver` (or `animation-timeline`
   where supported) does the same thing for free.
4. **`lib/sample.ts` (13 kB) is imported by `lib/data.ts`.** It is server-only today — confirm it
   never reaches a client chunk once Supabase is live (`next build` output, look for it in any
   `static/chunks/app/**`). If it does, gate it behind `supabaseConfigured()` at module level.

## Cheap wins applied this phase

- **`next/image` everywhere photos appear** (`Poster`, `TeamFloor`, `GalleryFloor`, `GalleryScene`)
  via `components/ui/SceneImage.tsx`: AVIF/WebP, correct `sizes` per layout so a phone fetches a
  ~400px file instead of the 2 MB original, lazy by default, `priority` only on the lead poster and
  the open viewer image. Boxes already reserved their space, so CLS stays at 0.
- **`deviceSizes`/`imageSizes` narrowed** to the widths the layouts actually request — fewer variants
  generated, better cache hit rate.
- **`minimumCacheTTL: 86400`** so the optimiser stops re-fetching from Supabase on every cold hit.
- **`optimizePackageImports`** for `framer-motion` and `lucide-react`.
- **`loading.tsx` per heavy segment** — not a size win, but it removes the blank-screen stall after
  `travelTo()` on a cold route, which is what the stall actually feels like.


## Phase 3F: the city on phones (trade-off, made on purpose)

Domain pages used to gate the illustrated city behind `md:` (768px+); phones got a plain planet
and tappable club list instead. That's gone now — every screen size gets the same city, because the
camera in `useCityCamera.ts` was already pointer-based and handled touch drag correctly (it uses a
larger movement threshold before a tap becomes a pan, specifically so it works on touch), so the old
gate was stricter than the code underneath it needed.

**What this costs:** the city bundle (`CityScene`, `buildings.tsx`, `musicBuildings.tsx`,
`useCityCamera.ts`, `city.css`, ≈58 kB of source) now downloads on phones too, on every domain page,
since all six worlds have a city as of Phase 3E. That is a straightforward regression against the
"phones never fetch it" line this file had before — accepted because seeing and entering the actual
city was asked for directly.

**What keeps it from being worse than it has to be:**
- Still `next/dynamic`, so it only loads when a domain page is actually visited, not on every route.
- Phones automatically get the `lite` motion tier (`hooks/useMotionTier.ts`), which was already true
  before this change — ambient loops (traffic, beacons, radar, the drone) turn off there regardless
  of which screen loads the city.
- The camera's minimum fit scale dropped from 0.6 to 0.34 (`useCityCamera.ts`) so a narrow phone
  viewport shows most of the island without constant panning, instead of rendering at a scale tuned
  for tablets and up.

## Still to verify locally

- [ ] `npm run build` completes; no route over its budget above
- [ ] `/sitemap.xml` lists every club, event and world
- [ ] `/robots.txt` points at the absolute sitemap URL (needs `NEXT_PUBLIC_SITE_URL` in prod)
- [ ] Share a `/club/dice` and an `/events/*` link — the generated card is the club's accent
- [ ] Lighthouse on `/gallery` (phone): LCP < 2.5 s, CLS 0
