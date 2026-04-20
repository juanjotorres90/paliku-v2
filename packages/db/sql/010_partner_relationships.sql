-- 010: Partner relationships table
-- Represents connection requests and accepted partnerships between users.
-- One row per pair, enforced via ordered (user_a < user_b) unique constraint.

create table if not exists public.partner_relationships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  requested_by uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_relationships_users_distinct check (user_a <> user_b),
  constraint partner_relationships_ordered check (user_a < user_b),
  constraint partner_relationships_requested_by_valid check (requested_by in (user_a, user_b)),
  constraint partner_relationships_status_valid check (status in ('pending', 'accepted', 'blocked', 'declined')),
  constraint partner_relationships_unique unique (user_a, user_b)
);

drop trigger if exists set_partner_relationships_updated_at on public.partner_relationships;
create trigger set_partner_relationships_updated_at
before update on public.partner_relationships
for each row
execute procedure public.set_updated_at();

alter table public.partner_relationships enable row level security;

-- Participants can read their own relationships.
create policy "partner_relationships_select_participants"
on public.partner_relationships
for select
using (auth.uid() = user_a or auth.uid() = user_b);

-- Requester can create a pending request row.
create policy "partner_relationships_insert_requester"
on public.partner_relationships
for insert
with check (
  auth.uid() = requested_by
  and auth.uid() in (user_a, user_b)
  and status = 'pending'
);

-- The non-requester (responder) can accept a pending request.
create policy "partner_relationships_update_responder_accept"
on public.partner_relationships
for update
using (
  status = 'pending'
  and auth.uid() in (user_a, user_b)
  and auth.uid() <> requested_by
)
with check (
  status = 'accepted'
  and auth.uid() in (user_a, user_b)
  and auth.uid() <> requested_by
);

-- The non-requester (responder) can decline a pending request.
create policy "partner_relationships_update_responder_decline"
on public.partner_relationships
for update
using (
  status = 'pending'
  and auth.uid() in (user_a, user_b)
  and auth.uid() <> requested_by
)
with check (
  status = 'declined'
  and auth.uid() in (user_a, user_b)
  and auth.uid() <> requested_by
);

-- Either participant can block.
create policy "partner_relationships_update_participant_block"
on public.partner_relationships
for update
using (auth.uid() in (user_a, user_b))
with check (status = 'blocked' and auth.uid() in (user_a, user_b));

-- Requester can cancel a pending request (delete).
create policy "partner_relationships_delete_requester_cancel"
on public.partner_relationships
for delete
using (status = 'pending' and auth.uid() = requested_by);

-- Either participant can delete a declined relationship (allows re-request).
create policy "partner_relationships_delete_declined"
on public.partner_relationships
for delete
using (status = 'declined' and auth.uid() in (user_a, user_b));

grant select, insert, update, delete on public.partner_relationships to authenticated;

create index if not exists partner_relationships_user_a_idx
  on public.partner_relationships (user_a);
create index if not exists partner_relationships_user_b_idx
  on public.partner_relationships (user_b);
create index if not exists partner_relationships_status_idx
  on public.partner_relationships (status);
create index if not exists partner_relationships_requested_by_idx
  on public.partner_relationships (requested_by);
