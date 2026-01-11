# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Requirements

- Node.js >=24
- pnpm 10.24.0
- Bun (for `apps/api` dev/build)

## Commands

From repo root:

```sh
pnpm install          # Install workspace dependencies
pnpm dev              # Run all apps in dev mode (web:3000, docs:3001, api:3002)
pnpm build            # Build all apps and packages
pnpm lint             # ESLint across repo
pnpm check-types      # Type checks (Next typegen + tsc)
pnpm format           # Prettier with Tailwind class sorting
```

Targeted runs with Turbo filters:

```sh
turbo dev --filter=web              # Dev only web app
turbo dev --filter=docs             # Dev only docs app
turbo build --filter=@repo/ui       # Build only UI package
pnpm -C apps/api dev                # Dev only API
pnpm -C apps/api build              # Build only API
pnpm -C packages/ui dev:styles      # Watch mode for UI CSS
```

## Architecture

This is a Turborepo monorepo with two Next.js 16 apps, a Bun/Hono API, and
shared packages.

### Workspaces

- `apps/web` - Main Next.js App Router app (port 3000)
- `apps/docs` - Documentation Next.js App Router app (port 3001)
- `apps/api` - Bun + Hono API (port 3002)
- `packages/ui` - Shared React component library (`@repo/ui`)
- `packages/validators` - Shared Zod schemas (`@repo/validators`)
- `packages/db` - Supabase/Postgres SQL artifacts (`@repo/db`)
- `packages/tailwind-config` - Shared Tailwind v4 CSS tokens and PostCSS config
- `packages/eslint-config` - Shared ESLint configs (base, next-js, react-internal)
- `packages/typescript-config` - Shared tsconfig files

### UI Package (`@repo/ui`)

Components use shadcn/ui patterns with Radix UI primitives and `class-variance-authority` for variants.

Import patterns:
- `@repo/ui/components/button` → `packages/ui/src/components/button.tsx`
- `@repo/ui/lib/utils` → `packages/ui/src/lib/utils.ts`
- `@repo/ui/hooks/*` → `packages/ui/src/hooks/*.ts`
- `@repo/ui/globals.css` → shared global styles (import in app `globals.css`)
- `@repo/ui/styles.css` → built CSS output

Generate new components: `pnpm -C packages/ui generate:component`

### Styling

Tailwind v4 with CSS-first configuration. Design tokens defined in:
- `packages/tailwind-config/shared-styles.css` - shared theme tokens
- `packages/ui/src/styles/globals.css` - component library styles with CSS variables for theming

Each app declares its own Tailwind `@source` in `apps/*/app/globals.css` to
scope scanning to that app.

Dark mode: class-based (`.dark` selector), managed via `next-themes`.

## Conventions

- Use Conventional Commits: `feat(scope):`, `fix(scope):`, `refactor(scope):`
- Lowercase filenames for components, PascalCase exports
- Colocate tests as `*.test.ts(x)` (Vitest preferred, not yet configured)
- Do not commit `dist/` or `.next/` directories
