-- JYC Universe: content schema.
-- Run once in the Supabase SQL editor (or `supabase db push`). Safe to re-run: everything is `if not exists`.
-- Shapes mirror lib/types.ts. Row order the site shows comes from the `sort` columns.
--
-- Access: public READ, no public write. Content is edited in the dashboard or with the service role.

-- ---------------------------------------------------------------- domains (the six worlds)
create table if not exists public.domains (
  id            text primary key,                       -- 'technical', 'music', ...
  name          text not null,
  tagline       text not null,
  description   text not null,
  accent        text not null check (accent ~ '^#[0-9a-fA-F]{6}$'),
  atmosphere    text not null check (atmosphere in ('circuit','pulse','flow','heritage','dynamic','ink')),
  pos_x         integer not null,                       -- universe map, viewBox 1200 x 800
  pos_y         integer not null,
  stars         jsonb not null default '[]',            -- [[dx, dy], ...]
  links         jsonb not null default '[]',            -- [[starIndex, starIndex], ...]
  dust          jsonb not null default '[]',            -- [[dx, dy, radius], ...]
  planet_radius numeric not null default 26,
  tilt          numeric not null default 0,
  sort          integer not null default 0
);

-- Which worlds collaborate (faint links between planets).
create table if not exists public.collaborations (
  domain_a text not null references public.domains(id) on delete cascade,
  domain_b text not null references public.domains(id) on delete cascade,
  sort     integer not null default 0,
  primary key (domain_a, domain_b)
);

-- ---------------------------------------------------------------- clubs
create table if not exists public.clubs (
  id          text primary key,                         -- slug, used in /club/[id]
  domain_id   text not null references public.domains(id) on delete cascade,
  name        text not null,
  tagline     text not null default '',
  description text not null default '',
  sort        integer not null default 0                -- order inside its world (also building numbering)
);
create index if not exists clubs_domain_idx on public.clubs (domain_id, sort);

create table if not exists public.coordinators (
  id      bigint generated always as identity primary key,
  club_id text not null references public.clubs(id) on delete cascade,
  sort    integer not null default 0,
  name    text not null,
  role    text not null,
  photo   text
);
create index if not exists coordinators_club_idx on public.coordinators (club_id, sort);

create table if not exists public.achievements (
  id      bigint generated always as identity primary key,
  club_id text not null references public.clubs(id) on delete cascade,
  sort    integer not null default 0,
  year    integer not null,
  title   text not null,
  detail  text
);
create index if not exists achievements_club_idx on public.achievements (club_id, sort);

-- Empty src draws a generated tile from the club's motif. width/height give the wall its rhythm.
create table if not exists public.gallery_items (
  id      bigint generated always as identity primary key,
  club_id text not null references public.clubs(id) on delete cascade,
  sort    integer not null default 0,
  src     text not null default '',
  alt     text not null default '',
  width   integer,
  height  integer
);
create index if not exists gallery_items_club_idx on public.gallery_items (club_id, sort);

create table if not exists public.socials (
  club_id   text primary key references public.clubs(id) on delete cascade,
  instagram text,
  linkedin  text,
  email     text,
  website   text
);

-- Visual identity of a club (colour, motif, title treatment). See lib/identity.ts.
create table if not exists public.club_identity (
  club_id     text primary key references public.clubs(id) on delete cascade,
  accent      text not null check (accent ~ '^#[0-9a-fA-F]{6}$'),
  motif       text not null check (motif in ('pips','mesh','rings','gears','code','waves')),
  title_case  text not null default 'upper' check (title_case in ('upper','lower')),
  title_style text not null default 'solid' check (title_style in ('solid','outline')),
  tracking    text not null default '-0.04em',
  cursor      boolean not null default false,
  city_note   text not null default 'Club',
  hero_seed   integer
);

-- ---------------------------------------------------------------- events
-- The club page lists a club's events (newest first) straight from club_id.
create table if not exists public.events (
  id               text primary key,                    -- slug, used in /events/[id]
  club_id          text not null references public.clubs(id) on delete cascade,
  title            text not null,
  date             date not null,
  time             text not null default 'To be announced',
  location         text not null default 'To be announced',
  description      text not null default '',
  poster           text,
  registration_url text
);
create index if not exists events_club_idx on public.events (club_id, date desc);

-- ---------------------------------------------------------------- cities
-- Which club's building sits where. Theme, set dressing and avenues stay in lib/city.ts (they are design).
-- A world with rows here uses them instead of the built-in spots. A world needs a layout in lib/city.ts to have a city.
create table if not exists public.city_spots (
  id         bigint generated always as identity primary key,
  domain_id  text not null references public.domains(id) on delete cascade,
  club_id    text not null references public.clubs(id) on delete cascade,
  silhouette text not null check (silhouette in ('die','twin','tiered','workshop','spire','stage','studio','hall','vinyl')),
  gx         numeric not null,
  gy         numeric not null,
  w          numeric not null,
  d          numeric not null,
  height     integer not null,
  unique (domain_id, club_id)
);

-- ---------------------------------------------------------------- /about
create table if not exists public.about_entries (
  id     bigint generated always as identity primary key,
  year   integer not null,
  title  text not null,
  detail text,
  sort   integer not null default 0
);

-- Loose single values. Currently: 'about_intro'.
create table if not exists public.site_settings (
  key   text primary key,
  value text not null
);

-- ---------------------------------------------------------------- row level security
-- Enabled on every table. One SELECT policy for the public roles, and no INSERT/UPDATE/DELETE policy,
-- so writes through the API are denied. The revoke is a second lock. The SQL editor and the
-- service role bypass RLS, which is how content gets edited.
do $$
declare t text;
begin
  foreach t in array array[
    'domains','collaborations','clubs','coordinators','achievements','gallery_items',
    'socials','club_identity','events','city_spots','about_entries','site_settings'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
  end loop;
end $$;
