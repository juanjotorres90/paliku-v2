-- Track whether the user has seen the first-login welcome screen.
alter table public.user_settings
add column if not exists welcome_seen boolean not null default false;

-- Existing users have already "logged in for the first time" before this flag existed.
update public.user_settings
set welcome_seen = true
where welcome_seen = false;
