-- JYC Universe — City Hall (admin) access.
-- Paste this into the Supabase SQL editor AFTER supabase/schema.sql. Safe to re-run.
--
-- What it does:
--   1. Creates public.admins: the allow-list. Being signed in is NOT enough; your user id must be a row here.
--   2. Grants the `authenticated` role the write privileges schema.sql revoked, and adds one
--      "admins write" policy per content table. RLS still denies everyone else.
--   3. Public read is untouched: anon keeps SELECT on everything, and nobody but an admin can write.
--
-- FIRST ADMIN (do this once):
--   Supabase dashboard -> Authentication -> Users -> "Add user" (email + password, auto-confirm).
--   Copy the new user's UUID, then run:
--       insert into public.admins (user_id, email, role) values ('<uuid>', '<email>', 'owner');
--   You can then sign in at /admin/login and add the rest of the team from the panel.

-- ---------------------------------------------------------------- the allow-list
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  -- 'owner' can manage other admins; 'editor' can only edit content.
  role       text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- An admin may read the admin list (the panel shows it). Nobody else can, not even signed-in users.
drop policy if exists "admins read" on public.admins;
create policy "admins read" on public.admins
  for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Only an owner may add or remove admins.
drop policy if exists "owners manage admins" on public.admins;
create policy "owners manage admins" on public.admins
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.role = 'owner'))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid() and a.role = 'owner'));

grant select, insert, update, delete on public.admins to authenticated;

-- A stable helper, so every policy below is one short line and the rule lives in one place.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------- write access for admins
do $$
declare t text;
begin
  foreach t in array array[
    'domains','collaborations','clubs','coordinators','achievements','gallery_items',
    'socials','club_identity','events','city_spots','about_entries','site_settings'
  ] loop
    -- schema.sql revoked these from `authenticated`; give them back, RLS still decides row by row.
    execute format('grant insert, update, delete on public.%I to authenticated', t);

    execute format('drop policy if exists "admins write" on public.%I', t);
    execute format(
      'create policy "admins write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t
    );
  end loop;
end $$;

-- Identity columns (coordinators, achievements, gallery_items, city_spots, about_entries) need their sequences.
grant usage, select on all sequences in schema public to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
