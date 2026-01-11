# Repository Guidelines

## Project Structure & Module Organization

- `apps/web`: Next.js App Router app (dev on `:3000`).
- `apps/docs`: Next.js App Router app (dev on `:3001`).
- `apps/api`: Bun + Hono API (dev on `:3002`).
- `packages/ui`: shared React component library.
  - Source: `packages/ui/src/*.tsx`
  - Built output (generated): `packages/ui/dist/**`
  - Shared styles entrypoint: `@repo/ui/styles.css`
- `packages/validators`: shared Zod schemas.
- `packages/db`: Supabase/Postgres SQL artifacts.
- `packages/tailwind-config`: shared Tailwind v4 CSS tokens + PostCSS config (`@repo/tailwind-config/postcss`).
- `packages/eslint-config`, `packages/typescript-config`: shared tooling configs.
- Monorepo tooling: `pnpm-workspace.yaml` + `turbo.json`.

## Build, Test, and Development Commands

Requirements: Node `>=24`, `pnpm@10.24.0`, and Bun (for `apps/api`).

From repo root:

- `pnpm install`: install workspace deps.
- `pnpm dev`: run dev tasks via Turbo (starts web/docs/api).
- `pnpm build`: build all apps/packages.
- `pnpm lint`: run ESLint across the repo.
- `pnpm check-types`: run type checks (Next typegen + `tsc`).
- `pnpm format`: run Prettier (includes Tailwind class sorting).

Targeted runs:

- `turbo dev --filter=web` / `turbo dev --filter=docs`
- `turbo build --filter=@repo/ui`
- `pnpm -C apps/api dev` / `pnpm -C apps/api build`
- `pnpm -C packages/ui dev:styles`: rebuild UI CSS in watch mode.

## Coding Style & Naming Conventions

- TypeScript everywhere; prefer simple, typed functional components.
- `@repo/ui` exports `packages/ui/src/<file>.tsx` as `@repo/ui/<file>` (lowercase filenames, PascalCase components).
- Tailwind v4: UI utilities are prefixed (`ui:*`). Variant order must follow the prefix (e.g. `ui:dark:*`, `ui:hover:*`, `ui:group-hover:*`).
- Formatting/linting: rely on `pnpm format` + `pnpm lint` (don’t hand-format).

## Testing Guidelines

No test framework is configured yet (no `test` scripts, no coverage gates). If you add tests, colocate them (`*.test.ts(x)`) and wire a package-level test script; Vitest is the preferred default.

## Commit & Pull Request Guidelines

- Use Conventional Commits with scopes (seen in history): `feat(scope): ...`, `fix(scope): ...`, `refactor(scope): ...` (e.g. `fix(card): correct href`).
- PRs should include: a short description, linked issue(s), screenshots for UI/theme changes, and the commands you ran (`pnpm lint`, `pnpm check-types`, `pnpm build`).
- Avoid committing generated build artifacts (`**/dist/**`, `**/.next/**`); they’re produced by Turbo tasks.

## Agent Notes (Optional)

Before running tests/tasks, run `npm run` once to discover available scripts, then choose the narrowest command (often a Turbo `--filter`).
