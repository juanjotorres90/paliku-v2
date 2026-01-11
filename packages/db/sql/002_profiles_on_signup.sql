-- Phase 1: auto-create profile rows on signup
-- Requires `public.profiles` (see `001_profiles.sql`).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  name text;
begin
  name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'User'
  );

  if char_length(name) < 2 then
    name := 'User';
  end if;

  if char_length(name) > 50 then
    name := left(name, 50);
  end if;

  insert into public.profiles (id, display_name, intents)
  values (new.id, name, array['practice']::text[])
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

