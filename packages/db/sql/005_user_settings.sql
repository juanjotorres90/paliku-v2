-- Table for user app preferences (theme, locale)
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'system',
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_theme_valid
    check (theme in ('system', 'light', 'dark')),
  constraint user_settings_locale_valid
    check (locale in ('en', 'es', 'ca', 'ru', 'de', 'fr', 'it', 'pt'))
);

-- Enable RLS
alter table public.user_settings enable row level security;

-- Owner-only policies
create policy "user_settings_select_owner"
on public.user_settings for select using (auth.uid() = user_id);

create policy "user_settings_update_owner"
on public.user_settings for update using (auth.uid() = user_id);

create policy "user_settings_insert_owner"
on public.user_settings for insert with check (auth.uid() = user_id);

grant select, insert, update on public.user_settings to authenticated;

-- Indexes
create index if not exists user_settings_theme_idx on public.user_settings (theme);
create index if not exists user_settings_locale_idx on public.user_settings (locale);
