# People Page Implementation Plan (Backend → Frontend)

This plan assumes:

- Request/accept connection flow (not “instant connect”)
- Languages are real data (user-configured), not placeholders
- Cursor pagination (keyset) is acceptable (no total pages)

---

## Product Surface (what `/people` ships)

### Tabs

- **Discover**: Browse public profiles, filter/search, send connection request.
- **Requests**: Incoming/outgoing pending requests, accept/decline/cancel.
- **My Partners**: Accepted connections.

### Actions

- **Connect** (Discover): creates an outgoing request.
- **Accept / Decline** (Requests): responds to incoming request.
- **Cancel** (Requests → outgoing): cancels your pending request.
- **View Profile**: goes to `/people/[id]` (public profile detail).

---

## Data Model (Supabase / `packages/db/sql`)

### 1) `public.user_languages`

Purpose: store per-user language pairs shown on People cards and used by filters.

Model choices:

- Use stable string codes that match `packages/i18n/src/messages/*/languages.*` keys (`english`, `spanish`, `japanese`, `mandarin`, …).
- Split into two “kinds”: `speaks` and `learning`.
- Store a `level` for both kinds (so you can show “English (advanced)” under speaks, etc.).

Draft migration (`packages/db/sql/009_user_languages.sql`):

```sql
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

-- Public can read languages for public profiles; owners can read their own languages.
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

create index if not exists user_languages_user_id_idx
  on public.user_languages (user_id);

create index if not exists user_languages_kind_code_idx
  on public.user_languages (kind, language_code);
```

### 2) `public.partner_relationships`

Purpose: represent connection requests + accepted partnerships.

Design goals:

- One row per pair (enforced via `(user_a, user_b)` unique).
- Stable request id for API routes (use `id uuid`).
- “Cancel” and “Decline” can be implemented as **delete** for MVP (keeps schema + RLS simpler and allows re-requests).

Draft migration (`packages/db/sql/010_partner_relationships.sql`):

```sql
create table if not exists public.partner_relationships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  requested_by uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_relationships_users_distinct check (user_a <> user_b),
  -- Enforce ordered pair so uniqueness works reliably.
  constraint partner_relationships_ordered check (user_a < user_b),
  constraint partner_relationships_requested_by_valid check (requested_by in (user_a, user_b)),
  constraint partner_relationships_status_valid check (status in ('pending', 'accepted', 'blocked')),
  constraint partner_relationships_unique unique (user_a, user_b)
);

drop trigger if exists set_partner_relationships_updated_at on public.partner_relationships;
create trigger set_partner_relationships_updated_at
before update on public.partner_relationships
for each row
execute procedure public.set_updated_at();

alter table public.partner_relationships enable row level security;

-- Participants can read.
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

-- The non-requester can accept a pending request.
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

grant select, insert, update, delete on public.partner_relationships to authenticated;

create index if not exists partner_relationships_user_a_idx
  on public.partner_relationships (user_a);
create index if not exists partner_relationships_user_b_idx
  on public.partner_relationships (user_b);
create index if not exists partner_relationships_status_idx
  on public.partner_relationships (status);
create index if not exists partner_relationships_requested_by_idx
  on public.partner_relationships (requested_by);
```

---

## API Design (Hono / `apps/api`)

### Module layout

Add `apps/api/src/modules/people/` mirroring existing modules:

- `domain/` types (DTO-ish shapes for cards, requests, cursor)
- `application/` use-cases + ports (repos)
- `infrastructure/` Supabase/PostgREST repos
- `http/` routes + route tests

Wire-up:

- Instantiate repos in `apps/api/src/server/createApp.ts`
- Mount router in `apps/api/src/http/app.ts` at `/people`

### Endpoints

#### `GET /people` (Discover)

Query params:

- `q?: string` (matches `display_name`, `location`, optional `bio`)
- `native?: LanguageCode` (interpreted as: `speaks` + `level=native`)
- `learning?: LanguageCode`
- `learningLevel?: Proficiency` (applies to `learning`; optional)
- `cursor?: string` (base64url encoding of `updatedAt::id`)
- `limit?: number` (default 24, max 50)

Response:

```ts
{
  items: PersonCard[];
  nextCursor: string | null;
}
```

`PersonCard` should include enough to render the grid:

- `id`, `displayName`, `location`, `bio`, `avatarUrl`, `updatedAt`
- `speaks: { languageCode; level }[]`
- `learning: { languageCode; level }[]`

Filtering implementation (scalable without “fetch all matching ids”):

- If language filters are present, query `profiles` with an **inner join** to `user_languages` to restrict rows, then fetch full languages for the returned ids.
  - Supabase/PostgREST select example:
    - `select=id,display_name,bio,location,avatar_url,updated_at,user_languages!inner(id)`
    - plus filters like `user_languages.kind=eq.speaks&user_languages.language_code=eq.english&user_languages.level=eq.native`
- In parallel:
  - `GET /rest/v1/user_languages?user_id=in.(...)` to hydrate full `speaks/learning` arrays for each profile.

#### `GET /people/requests`

Query params:

- `dir: incoming | outgoing`
- Optional cursor pagination (same cursor scheme) if the list can be long.

Response (MVP):

```ts
{
  items: ConnectionRequestItem[];
  nextCursor: string | null;
}
```

Where each item includes:

- `id` (relationship row id)
- `direction` (`incoming`/`outgoing`)
- `createdAt`
- `other: PersonCard` (renderable card summary)

#### `POST /people/:id/connect`

Behavior:

- Computes ordered pair `(user_a, user_b)` from `(me, other)`
- Inserts into `partner_relationships` with `requested_by=me`, `status=pending`

Errors:

- `400` if `:id === me`
- `409` if relationship already exists (`pending/accepted/blocked`)

#### `POST /people/requests/:requestId/respond`

Body:

- `{ action: "accept" | "decline" }`

Behavior:

- `accept`: patch `status=accepted` (only responder per RLS)
- `decline`: delete row (only responder needs permission; add a delete policy for responder on pending rows if you want decline-as-delete)

Note: if you want decline-as-delete, add another delete policy:

```sql
create policy "partner_relationships_delete_responder_decline"
on public.partner_relationships
for delete
using (status = 'pending' and auth.uid() in (user_a, user_b) and auth.uid() <> requested_by);
```

#### `DELETE /people/requests/:requestId` (Cancel outgoing)

Behavior:

- Deletes pending row (requester-only per RLS)

#### `GET /people/partners`

Response:

- List of `PersonCard` for accepted relationships (other user for each row).

### Cursor pagination (keyset)

Ordering:

- Always order by `updated_at desc, id desc` (stable tie-break).

Cursor encoding:

- `cursor = base64url(`${updatedAt}::${id}`)`

Query for “next page”:

- `or=(updated_at.lt.<ts>,and(updated_at.eq.<ts>,id.lt.<id>))`

Implementation detail:

- Keep cursor parsing/formatting in `domain/cursor.ts` so both repos and routes use the same logic.

### Error i18n

If you introduce people-specific errors, extend:

- `apps/api/src/http/utils/error-i18n.ts` (`ErrorKey` union + `ERROR_FALLBACKS`)
- `packages/i18n/src/messages/*` under `api.errors.people.*`

If you want to avoid new translations initially:

- reuse existing keys (`api.errors.request.invalid_request`, `api.errors.upstream.database_error`, etc.)

---

## Shared Validation (`packages/validators`)

Add `packages/validators/src/people.ts`:

- `LanguageCodeSchema` (enum of supported language keys)
- `ProficiencySchema` (`beginner|intermediate|advanced|native`)
- `UserLanguageSchema` (`{ kind, languageCode, level }`)
- `PersonCardSchema`
- `PeopleListResponseSchema`
- `ConnectRequestSchema`, `RespondRequestSchema`

If profile settings will edit languages in the same form, also add:

- `ProfileLanguagesUpsertSchema` (`speaks[]`, `learning[]`, max counts, etc.)

Export via `packages/validators/src/index.ts`.

---

## Frontend (Next.js / `apps/web`)

### 1) Make language data editable (so People isn’t empty)

Update `apps/web/app/(app)/profile/settings/page.tsx`:

- Add a **Languages** section:
  - Speaks: repeatable rows of `{ languageCode, level }`
  - Learning: repeatable rows of `{ languageCode, level }`
  - Limit to e.g. 3 each (enforced by Zod + UI)
- Use the `languages` i18n namespace for display labels.
- Persist via new API endpoints (either under `/profile/*` or `/people/*`), ideally a single “replace” call to avoid complicated diffing.

Translations:

- Add keys to `packages/i18n/src/messages/*` in `profile.*` for the new section (labels, add/remove, validation copy).

### 2) Implement `/people` as a real client-driven page

Refactor `apps/web/app/(app)/people/page.tsx` into:

- A server wrapper (optional) for layout shell, then:
- A client component (recommended) for state + fetching:
  - Search input (debounced)
  - Filters
  - Tabs
  - Infinite list (“Load more”) using cursor pagination

Fetching strategy:

- Add a small `apps/web/app/(app)/people/api.ts` that calls `apiFetchWithRefresh` and Zod-parses responses.
- Add SWR (if not yet in repo) and use:
  - `useSWRInfinite` for Discover pagination
  - `useSWR` for Requests/Partners (or `useSWRInfinite` there too)
- On mutations (connect/accept/decline/cancel): call endpoint then `mutate()` the affected caches.

Pagination UI:

- Replace “Page X of Y” with:
  - `Load more` button, or
  - Infinite scroll sentinel + fallback button.

### 3) Implement `/people/[id]`

Create `apps/web/app/(app)/people/[id]/page.tsx`:

- Fetch profile detail (public-safe fields + languages)
- Show “Connect” / “Requested” / “Accept” CTAs based on relationship state (v1 can be minimal: always show Connect and handle 409 gracefully).

---

## Testing

### API (`apps/api`)

- `apps/api/src/modules/people/http/routes.test.ts`
  - Discover query validation
  - Connect request happy path + 409 on duplicate
  - Requests listing (incoming/outgoing) shape
  - Accept/decline/cancel authorization constraints (mock repos or run against route with stubs like existing profile tests)

### Web (`apps/web`)

- Update `apps/web/app/(app)/people/page.test.tsx` to:
  - Mock fetch/SWR and assert real rendering from API results
  - Assert connect → mutation calls correct endpoint and updates UI
- Add tests for:
  - Tab switching behavior
  - Query param syncing (if you store filters in URL)

---

## Milestones (recommended execution order)

1. **DB**: add `user_languages` + `partner_relationships` + RLS + indexes.
2. **Validators**: `people.ts` schemas (and profile languages schema if needed).
3. **API**: implement `/people` discover + requests + partners + connect/respond/cancel.
4. **Profile settings**: add Languages section + persistence endpoints.
5. **People page**: convert to client, wire Discover + Requests + Partners with cursor pagination.
6. **People detail**: `/people/[id]`.
7. **Tests + polish**: add/adjust tests, then run `pnpm lint`, `pnpm check-types`, `pnpm test`.

---

## Open Questions (small but important)

- Do we want “decline” to be **delete** (simpler, re-request allowed) or persisted status (richer history, more RLS complexity)?
- Should “Native Language” filter strictly mean `speaks.level = native`, or “speaks.languageCode regardless of level”?
- Do we want relationship state on Discover cards in v1 (requires joining relationships per card), or is optimistic + 409 handling sufficient initially?
