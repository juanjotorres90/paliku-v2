# Architecture (paliku-v2)

## High-level components

- `apps/web`: Next.js App Router UI (React client components today).
- `apps/api`: Bun server running a Hono API.
- Supabase: Auth + PostgREST + Storage (source of truth for data).
- Shared code:
  - `packages/validators`: Zod schemas shared by web + API.
  - `packages/ui`: shared UI components + Tailwind v4 styles.
  - `packages/db`: SQL artifacts for Supabase (schema/RLS/policies).

## Runtime data flow

**Web -> API -> Supabase**

- The web app talks to the API over HTTP (`NEXT_PUBLIC_API_URL`), using `credentials: "include"` so the browser sends auth cookies.
- The API talks to Supabase using:
  - Supabase Auth REST endpoints (`/auth/v1/*`) for signup/login/refresh/user lookup.
  - PostgREST (`/rest/v1/*`) for database reads/writes, authorized via the user access token.
  - Storage (`/storage/v1/*`) for avatar upload, authorized via the user access token.

This keeps the browser ignorant of refresh tokens (httpOnly cookies) while still letting Supabase RLS enforce authorization at the data layer.

## Auth + session lifecycle

### Cookie strategy

- API sets httpOnly cookies:
  - `sb-<projectRef>-access-token`
  - `sb-<projectRef>-refresh-token`
- API accepts auth via either:
  - `Authorization: Bearer <token>` header, or
  - `sb-<projectRef>-access-token` cookie

### Flows

- **Register**
  - `POST /auth/register` validates with `@repo/validators/auth`.
  - API calls Supabase `/auth/v1/signup` with PKCE.
  - If email confirmation is required, Supabase emails the user and redirects back to `GET /auth/callback`.
- **Email callback**
  - `GET /auth/callback` exchanges the auth code for tokens via Supabase `/auth/v1/token?grant_type=pkce`.
  - API sets cookies and redirects back to `webOrigin + next`.
- **Login**
  - `POST /auth/login` uses Supabase password grant to get tokens and sets cookies.
- **Refresh**
  - `POST /auth/refresh` uses the refresh token cookie to obtain fresh tokens and update cookies.
- **Signout**
  - `POST /auth/signout` clears cookies.

### Deployment assumption (important)

This cookie-based approach works best when **web and API are same-site** (e.g. `app.example.com` + `api.example.com`), so `SameSite=Lax` cookies are sent on API fetches.

If you deploy the API on a different registrable domain (e.g. `example.com` + `fly.dev`), you’ll need a different session strategy (typically `SameSite=None; Secure` + CSRF defenses, or bearer tokens from the client).

## Database model (current)

Initial schema focuses on **profiles**:

- `public.profiles` (see `packages/db/sql/001_profiles.sql`)
  - Public-safe fields only (no email).
  - RLS: public can read `is_public=true`; owners can read/write their own row.
- Trigger on signup auto-creates a profile row (see `packages/db/sql/002_profiles_on_signup.sql`).
- Avatars:
  - `avatar_url` column (see `packages/db/sql/003_profiles_avatar_url.sql`)
  - Storage RLS policies for an `avatars` bucket (see `packages/db/sql/004_storage_avatars_policies.sql`)

User settings are stored separately:

- `public.user_settings` (see `packages/db/sql/005_user_settings.sql`)
  - Stores theme and locale (language preference).
  - RLS: owners can read/write their own row.
- Signup trigger also creates `user_settings` (see `packages/db/sql/006_user_settings_on_signup.sql`).
