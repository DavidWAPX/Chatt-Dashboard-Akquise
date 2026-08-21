-- ===========================================================================
-- Remote Chatter Dashboard — initial schema
--
-- Im SQL-Editor des Supabase-Projekts einmal komplett ausführen. Legt genau
-- das an, was die App benutzt: Profile, Einträge, Rechte. Keine Gruppen, keine
-- Kennzahlen, die es in der Oberfläche nicht mehr gibt.
-- ===========================================================================

-- Roles --------------------------------------------------------------------
create type user_role as enum ('user', 'admin');
create type platform  as enum ('tiktok', 'instagram', 'facebook');

-- User profile (1:1 with auth.users) ---------------------------------------
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  name       text not null,
  role       user_role not null default 'user',
  created_at timestamptz not null default now()
);

-- Daily entries ------------------------------------------------------------
create table entries (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references profiles(id) on delete cascade,
  entry_date      date not null,
  platform        platform not null,
  first_messages  integer not null default 0 check (first_messages  >= 0),
  replies         integer not null default 0 check (replies         >= 0),
  appointments    integer not null default 0 check (appointments    >= 0),
  -- Freitexte: welcher Opener lief, wonach gesucht wurde, was auffiel.
  used_opener     text    not null default '',
  search_terms    text    not null default '',
  notes           text    not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- One entry per user, date and platform. Saving is an upsert on this key,
  -- so correcting today's numbers never creates a duplicate row.
  unique (profile_id, entry_date, platform)
);

create index entries_profile_date_idx on entries (profile_id, entry_date desc);

-- updated_at trigger -------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger entries_set_updated_at
  before update on entries
  for each row execute function set_updated_at();

-- ===========================================================================
-- Row Level Security
-- ===========================================================================

-- security definer so the policies on `profiles` do not recurse into themselves
create or replace function is_admin()
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

alter table profiles      enable row level security;
alter table entries       enable row level security;

-- profiles: everyone reads their own row, admins read all, only admins write
create policy profiles_select_own on profiles
  for select using (id = auth.uid() or is_admin());

create policy profiles_insert_admin on profiles
  for insert with check (is_admin());

create policy profiles_update_admin on profiles
  for update using (is_admin()) with check (is_admin());

create policy profiles_delete_admin on profiles
  for delete using (is_admin());

-- entries: a user only ever touches their own rows.
-- Admins read everything but never write someone else's entries.
create policy entries_select on entries
  for select using (profile_id = auth.uid() or is_admin());

create policy entries_insert_own on entries
  for insert with check (profile_id = auth.uid());

create policy entries_update_own on entries
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy entries_delete_own on entries
  for delete using (profile_id = auth.uid());
