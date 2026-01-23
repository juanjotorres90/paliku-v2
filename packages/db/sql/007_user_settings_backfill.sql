-- Backfill user_settings for existing users
insert into public.user_settings (user_id, theme, locale)
select u.id, 'system', 'en'
from auth.users u
left join public.user_settings s on s.user_id = u.id
where s.user_id is null;
