# Production readiness (small social platform baseline)

## What’s already solid

- Clean module boundaries in `apps/api` (domain/application/adapters).
- Shared validation via `@repo/validators` with tests.
- Supabase RLS-first approach in `packages/db/sql`.
- CI pipeline exists (`.github/workflows/ci.yml`).

## Production blockers fixed in this pass

- **Session refresh**: added `POST /auth/refresh` and a web-side fetch wrapper to refresh + retry once on `401`.
- **Deploy port**: API now honors `PORT` (defaults to `3002`).
- **CI reliability**: GitHub Actions uses stable `actions/*@v4` pins.

## Remaining “P0” items to decide (architecture-level)

1. **Deployment topology for cookies**
   - Recommended: `web` and `api` on subdomains of the same apex domain.
   - If not possible, switch to an explicit CSRF strategy or a token-in-client strategy.
2. **Migration workflow**
   - Today `packages/db/sql/*.sql` is manual.
   - Pick a workflow (Supabase CLI migrations, or a lightweight SQL deploy pipeline) and make it repeatable.
3. **Abuse controls**
   - Add rate limiting for `register/login/refresh` and upload endpoints.
   - Add request/body size limits (esp. uploads) and basic bot protections.

## Recommended baseline config

### Required env vars

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### Strongly recommended in production

- `API_URL` (public origin used in email callback links)
- `NEXT_PUBLIC_API_URL` (web -> API origin)
- `CORS_ORIGIN` (comma-separated allowed web origins)
- `COOKIE_DOMAIN` (set explicitly if provider domains make auto-derivation invalid)

### Optional / advanced

- `SUPABASE_JWT_AUD`
- `SUPABASE_JWT_ALGS`
- `SUPABASE_JWT_SECRET` (self-hosted / HS256 setups)

## Next hardening steps (high leverage)

- Add structured request logging + request IDs in `apps/api`.
- Add rate limiting middleware for auth + uploads.
- Add a `/health` endpoint and wire it to your hosting health checks.
- Ensure `apps/web` has security headers (`next.config.js` `headers()` is usually enough).
- Add a minimal runbook: deploy steps, env var matrix, and rollback steps.
