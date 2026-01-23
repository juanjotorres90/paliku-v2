-- Modify handle_new_user() to also create user_settings with locale
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  name text;
  user_locale text;
begin
  -- Extract display name
  name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'User'
  );
  if char_length(name) < 2 then name := 'User'; end if;
  if char_length(name) > 50 then name := left(name, 50); end if;

  -- Extract locale (default 'en')
  user_locale := new.raw_user_meta_data->>'locale';
  if user_locale is null or user_locale = '' then user_locale := 'en'; end if;
  if user_locale not in ('en', 'es', 'ca', 'ru', 'de', 'fr', 'it', 'pt') then user_locale := 'en'; end if;

  -- Insert profile (public-safe fields only)
  insert into public.profiles (id, display_name, intents)
  values (new.id, name, array['practice']::text[])
  on conflict (id) do nothing;

  -- Insert user_settings (source of truth for locale going forward)
  insert into public.user_settings (user_id, theme, locale)
  values (new.id, 'system', user_locale)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users for each row
execute procedure public.handle_new_user();
