-- Phase 1: profiles (public-safe fields only)
-- This table intentionally avoids private fields (email/phone/birthday).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  bio text not null default '',
  location text not null default '',
  intents text[] not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) between 2 and 50),
  constraint profiles_bio_length check (char_length(bio) <= 500),
  constraint profiles_location_length check (char_length(location) <= 120),
  constraint profiles_intents_nonempty check (coalesce(array_length(intents, 1), 0) >= 1),
  constraint profiles_intents_allowed check (
    intents <@ array['practice','friends','date']::text[]
  )
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

alter table public.profiles enable row level security;

-- Public (anon/authenticated): read only if is_public = true.
-- Owner (authenticated): read their own row even if is_public = false.
create policy "profiles_select_public_or_owner"
on public.profiles
for select
using (is_public = true or auth.uid() = id);

-- Owner only writes.
create policy "profiles_insert_owner"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_update_owner"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

