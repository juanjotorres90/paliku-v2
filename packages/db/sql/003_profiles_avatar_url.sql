-- Phase 2: add avatar_url to public.profiles

alter table public.profiles add column if not exists avatar_url text;
