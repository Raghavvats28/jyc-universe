# Handoff prompts (each one is sized for about 12 minutes)

How to use: start a NEW chat, attach the latest project zip, paste ONE prompt below. Do them in order.
Every prompt ends by asking for a zip and the NEXT prompt, so the chain continues.

Order: 2B-1 -> 2B-2 -> 2C -> 3A -> 3B -> 3C -> 3D -> 4A -> 4B

---

## PROMPT 2B-1: Verify and fix (run this FIRST, no new features)

```
I'm building the JYC (Jaypee Youth Club) website as an immersive "universe" experience. Project attached as a zip.
Stack: Next.js 14 App Router, React, TypeScript, Tailwind, Framer Motion, Lucide. No new libraries.
Read README.md first. Do NOT redesign or rebuild anything. TIMEBOX: about 12 minutes. If you run short, stop and list what is left.

TASK: make the current Phase 2 code build cleanly and behave correctly. No new features.
1. Run npm install, npx tsc --noEmit, npm run build. Fix every type error and lint/build error. Keep fixes minimal.
2. Check these specific risk points and fix if wrong:
   - components/city/useCityCamera.ts: drag vs click on buildings, clamping, resize handling
   - components/city/CityScene.tsx: travelTo() origin lands on the clicked building; sessionStorage return focus works
   - components/club/floors/MilestonesFloor.tsx: grid layout on mobile and md, timeline line alignment
   - components/club/Elevator.tsx: active floor tracking, hidden below lg
   - Framer Motion usage (x: "-50%", MotionConfig reducedMotion) compiles and behaves
3. Manually test and describe results: /domain/technical on desktop (hover, drag, click DICE, back to city), phone width (list, tap, club page), prefers-reduced-motion on.
4. Confirm public/jyc-logo.png exists; if not, tell me where to put it.
Rules: animate only transform/opacity, no heavy WebGL, no generic SaaS cards.
OUTPUT: list of fixes made, the complete changed files, a zip of the project, then the next prompt (2B-2) from PHASES.md.
```

---

## PROMPT 2B-2: Polish the Technical city and club space

```
JYC universe project attached (Phase 2 building cleanly). Read README.md. Do NOT rebuild. TIMEBOX: about 12 minutes.
Rules: SVG + CSS transforms only, animate transform/opacity only, respect prefers-reduced-motion, no new libraries.

Polish, in this priority order (stop when time is up):
1. City: on building hover show a small flat callout (club name, one-line tagline, "Enter") near the building. CSS-driven.
2. City: tiny minimap (bottom-right, ~120px SVG) with the island, 5 building dots and the current viewport rectangle. It must not re-render the city.
3. City: tablet (md, touch) check: drag works, tap enters, nothing is hover-only.
4. Club space: one small signature interaction per club from lib/identity.ts:
   DICE pips react to pointer (translate only); Coding cursor types the tagline once; Robotics gears rotate slowly;
   CICE radar sweep; DSC mesh nodes brighten near the pointer. All off for reduced motion.
5. Accessibility: focus order, visible focus rings on buildings and floors, aria labels.
6. Performance review of /domain/technical and /club/dice, fix cheap wins.
OUTPUT: complete changed files, zip, then the next prompt (2C) from PHASES.md.
```

---

## PROMPT 2C: Second city (ONE world only)

Fill in the REAL club names before pasting.

```
JYC universe project attached. Read README.md, lib/iso.ts, lib/city.ts, components/city/*. Do NOT rebuild. TIMEBOX: about 12 minutes.
Build a city for ONE more world: MUSIC (accent #f5a23a, atmosphere "pulse"). Reuse the isometric engine and Building/Ground/Scenery structure.
Clubs (replace with real ones): Band, Vocals, <add more>.
1. Add the layout to lib/city.ts (getCity('music')). Add new silhouettes to the Silhouette union and components/city/buildings
   (e.g. "stage" with a speaker stack and lit marquee, "studio" with a round soundproof drum and waveform windows).
   Each has a unique silhouette, lit windows, hover state, small details.
2. Warm amber lights, one tiny EQ-bar animation (transform scaleY, off for lite/static tiers). No neon overload.
3. Let the city components take a theme (accent, ground tint, gradients) instead of hardcoded teal, without changing how Technical looks.
4. Add identities for these clubs in lib/identity.ts (accent, motif, title treatment). Add a "waves" motif if needed.
5. Phones keep the simple club list.
OUTPUT: complete changed/new files, zip, then the next prompt (3A) from PHASES.md.
```

---

## PROMPT 3A: Events universe (/events and event detail)

```
JYC universe project attached. Read README.md and lib/data.ts. Do NOT rebuild. TIMEBOX: about 12 minutes.
Replace the /events holding scene with an "event universe": events as temporary glowing objects, not a list.
1. /events: dark scene, each upcoming event is a glowing orb/portal on a timeline arc (soonest nearest). Hover shows title/date.
   Past events collapse into a dim trail. SVG + CSS only, transform/opacity only.
2. /events/[id]: cinematic detail using travelTo() with the orb as origin. Show EVENT NAME, DATE, TIME, LOCATION, DESCRIPTION,
   POSTER (reuse components/club/Poster.tsx), REGISTRATION link, SHARE (Web Share API with copy-link fallback).
3. generateStaticParams from lib/data.ts events. Keep upcoming/past via lib/dates.ts + hooks/useToday.ts.
4. Link posters in the club space to /events/[id].
5. Phone: simple list, then detail.
OUTPUT: complete files, zip, then the next prompt (3B) from PHASES.md.
```

---

## PROMPT 3B: Gallery, Clubs index and About

```
JYC universe project attached. Read README.md. Do NOT rebuild. TIMEBOX: about 12 minutes.
Replace three holding scenes:
1. /gallery "visual archive": photo wall of every club's gallery items (lib/data.ts), minimal filter by world, CSS-column masonry,
   curtain reveal like components/club/floors/GalleryFloor.tsx, click opens a full-screen viewer (arrows / Esc). Empty src draws the motif tile.
2. /clubs: all clubs as typographic rows grouped by world (huge names, world accent, hover shows the club motif),
   each row travelTo()s into the club space.
3. /about: the JYC story as a timeline. Data in lib/data.ts (placeholder entries), replaceable.
4. Update MenuOverlay notes ("Opening soon") accordingly.
Rules: transform/opacity only, lazy-load images, no layout shift (width/height).
OUTPUT: complete files, zip, then the next prompt (3C) from PHASES.md.
```

---

## PROMPT 3C: Supabase data layer

```
JYC universe project attached. Read README.md, lib/types.ts, lib/data.ts, lib/city.ts, lib/identity.ts. Do NOT change any UI. TIMEBOX: about 12 minutes.
Move content to Supabase behind the SAME lookup functions.
1. Add @supabase/supabase-js (the one allowed new dependency). lib/supabase.ts server client from env vars, documented in .env.example.
2. supabase/schema.sql: domains, clubs, coordinators, achievements, events, gallery_items, socials, club_identity, city_spots.
   RLS: public read, no public write.
3. supabase/seed script inserting the current lib/data.ts content.
4. Make lib/data.ts lookups async where needed with a fallback to local sample data when env vars are missing,
   so the site still runs without Supabase. Update server pages to await. Client components keep receiving plain serializable props.
5. Keep generateStaticParams working; add revalidate = 300.
OUTPUT: complete changed files, numbered setup steps, zip, then the next prompt (3D) from PHASES.md.
```

---

## PROMPT 3D: Real content, images and launch polish

```
JYC universe project attached. Read README.md. Do NOT rebuild. TIMEBOX: about 12 minutes.
1. Image pipeline: next/image with width/height, remote patterns in next.config.mjs for the Supabase storage domain.
   Replace plain <img> in Poster, TeamFloor, GalleryFloor.
2. SEO: metadata, Open Graph image, sitemap.xml, robots.txt, per-club and per-event titles.
3. Global not-found and error scenes in the universe style.
4. Loading state for route transitions that fits travelTo().
5. Final performance checklist: bundle size per route, list anything over budget, fix cheap wins.
OUTPUT: complete files, zip, then the next prompt (4A) from PHASES.md.
```

---

## PROMPT 4A: Eagle assets (Phase 4, part 1)

```
JYC universe project attached. Read README.md and lib/timing.ts. Touch nothing else. TIMEBOX: about 12 minutes.
Prepare the eagle for the logo intro WITHOUT heavy 3D.
1. Optimised asset: an SVG with separable parts (body, two wings, tail, head) so wings flap with CSS transform, OR a small WebP/PNG sprite.
   Majestic, elegant, controlled. Not cartoonish, not gaming-style, not realistic 3D. Under 60KB.
2. components/intro/Eagle.tsx with phases: flying, gliding, landing, perched. Flight path as a cubic curve in viewport units,
   Framer Motion, transform/opacity only. Wing flap slows as it lands.
3. Feather particles: max 8, transform/opacity; lite tier gets none.
4. Reduced motion: skip flight, show the perched eagle.
5. Do not modify LogoIntro yet. Add a preview route /dev/eagle to inspect the phases.
OUTPUT: complete files, zip, then the next prompt (4B) from PHASES.md.
```

---

## PROMPT 4B: Eagle integration into the logo intro

```
JYC universe project attached (with components/intro/Eagle.tsx). Read README.md, lib/timing.ts, components/intro/LogoIntro.tsx.
Never redraw public/jyc-logo.png. TIMEBOX: about 12 minutes.
Integrate the eagle in the gap between logoIn and ringsIn (see the comment in lib/timing.ts):
dark -> stars -> logo fades in -> pause -> eagle enters from off screen -> flies toward the logo, slowing -> lands on/above the logo
-> small feather/body settle -> subtle camera push-in -> universe forms (existing rings/seeds) -> Enter JYC.
1. Shift the INTRO timings in lib/timing.ts; keep everything driven from that file.
2. First-time visitors see it; returning visitors (sessionStorage) get a short version. A Skip button is always visible.
3. lite tier: shorter flight, no particles. static tier: no flight, perched eagle only.
4. Verify no layout shift or jank: only transform/opacity animated, eagle asset preloaded, intro JS not blocking first paint.
OUTPUT: complete changed files, zip. Then tell me the project is feature-complete and give a final QA checklist.
```
