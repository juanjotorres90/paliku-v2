# `api` (Hono + Bun)

## Dev

From repo root:

```sh
pnpm dev
```

Or just this app:

```sh
pnpm -C apps/api dev
```

Server runs on `http://localhost:3002`.

## Build

```sh
pnpm -C apps/api build
```

Build output goes to `apps/api/dist`.

## Env

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `API_URL` (public API origin, e.g. `http://localhost:3002`)
- `CORS_ORIGIN` (default `http://localhost:3000`)
- `COOKIE_DOMAIN` (optional, for sharing auth cookies across subdomains)
