# paliku-v2

Paliku-v2 is a Turborepo monorepo with two Next.js apps, a Bun/Hono API, and
shared packages for UI, validators, and tooling.

## Requirements

- Node >=24
- pnpm 10.24.0
- Bun (for `apps/api` dev/build)

## Apps

- `apps/web` - Next.js App Router app (port 3000)
- `apps/docs` - Next.js App Router app (port 3001)
- `apps/api` - Bun + Hono API (port 3002)

## Packages

- `packages/ui` - shared React component library + global styles
- `packages/validators` - shared Zod schemas (API + web)
- `packages/db` - Supabase/Postgres SQL artifacts
- `packages/tailwind-config` - shared Tailwind v4 tokens + PostCSS config
- `packages/eslint-config`, `packages/typescript-config` - shared tooling

## Commands

From repo root:

```sh
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm check-types
pnpm format
```

Targeted runs:

```sh
turbo dev --filter=web
turbo dev --filter=docs
pnpm -C apps/api dev
pnpm -C apps/api build
pnpm -C packages/ui dev:styles
```

## Styling

Apps import `apps/*/app/globals.css`, which in turn imports
`@repo/ui/globals.css`. Each app declares its own `@source` so Tailwind only
scans that app, while `@repo/ui` declares sources for shared components.

## API

See `apps/api/README.md` for environment variables and local dev details.
