-- 009: User languages table
-- Stores per-user language pairs (speaks / learning) with proficiency level.

create table if not exists public.user_languages (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  language_code text not null,
  level text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_languages_kind_valid
    check (kind in ('speaks', 'learning')),
  constraint user_languages_level_valid
    check (level in ('beginner', 'intermediate', 'advanced', 'native')),
  constraint user_languages_language_code_length
    check (char_length(language_code) between 2 and 32),
  constraint user_languages_unique
    unique (user_id, kind, language_code)
);

drop trigger if exists set_user_languages_updated_at on public.user_languages;
create trigger set_user_languages_updated_at
before update on public.user_languages
for each row
execute procedure public.set_updated_at();

alter table public.user_languages enable row level security;

-- Public can read languages for public profiles; owners can read their own.
create policy "user_languages_select_public_or_owner"
on public.user_languages
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = user_languages.user_id
      and (p.is_public = true or auth.uid() = p.id)
  )
);

create policy "user_languages_insert_owner"
on public.user_languages
for insert
with check (auth.uid() = user_id);

create policy "user_languages_update_owner"
on public.user_languages
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_languages_delete_owner"
on public.user_languages
for delete
using (auth.uid() = user_id);

grant select on public.user_languages to anon, authenticated;
grant insert, update, delete on public.user_languages to authenticated;

-- Note: queries filtered by user_id use the leading column of
-- user_languages_unique (user_id, kind, language_code) — no extra index needed.

create index if not exists user_languages_kind_code_idx
  on public.user_languages (kind, language_code);
