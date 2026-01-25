# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Paliku-v2 is a Turborepo monorepo with Next.js 16, React 19, and a Bun/Hono API,
using TypeScript and Tailwind CSS v4. The monorepo contains three applications
(web, docs, api) and shared packages for UI components, validators, and configs.

**Requirements**: Node.js >=24, pnpm 10.24.0, Bun (for `apps/api`)

## Common Commands

```bash
# Development (starts web:3000, docs:3001, api:3002)
pnpm dev              # or: turbo dev

# Build all apps and packages
pnpm build            # or: turbo build

# Lint all code
pnpm lint             # or: turbo lint

# Type check all packages
pnpm check-types      # or: turbo run check-types

# Format code
pnpm format

# Run on specific app only
turbo dev --filter=web
turbo build --filter=docs
pnpm -C apps/api dev
pnpm -C apps/api build

# Generate new UI component (in @repo/ui package)
cd packages/ui && pnpm generate:component
```

## Monorepo Architecture

### Structure

```
apps/
├── web/          # Main web app (port 3000)
├── docs/         # Documentation app (port 3001)
└── api/          # Bun + Hono API (port 3002)
packages/
├── ui/           # Shared React component library
├── validators/   # Shared Zod schemas
├── db/           # Supabase/Postgres SQL artifacts
├── i18n/         # Internationalization (next-intl messages + utilities)
├── tailwind-config/  # Shared Tailwind v4 configuration
├── eslint-config/     # Shared ESLint flat configs
└── typescript-config/ # Shared TypeScript configs
```

### Package Dependencies

- Internal packages use `workspace:*` protocol
- Apps consume `@repo/ui` for shared components
- Web and API consume `@repo/validators` for shared Zod schemas
- All packages consume shared configs (`@repo/eslint-config`, `@repo/typescript-config`, `@repo/tailwind-config`)

### TypeScript Configuration

- Base config: `@repo/typescript-config/base.json` - strict mode, ES2022, NodeNext module resolution
- Next.js config: extends base, adds Next.js plugin, ESNext modules, Bundler resolution
- All tsconfigs extend from shared configs

### UI Package Structure

- Components export from `src/*.tsx` via package exports
- Build process: compile styles with Tailwind CLI, then TypeScript compile
- Uses Tailwind v4 `@theme` and `@utility` directives with `ui:` prefix for component-scoped styles
- Dark mode variants handled automatically via `.dark` class

## Styling Conventions

- Tailwind CSS v4 with PostCSS
- Components use `@utility ui:` prefix for component-scoped styles
- Shared theme defined in `@repo/tailwind-config`
- Dark mode supported via `.dark` class on container
- Each app declares `@source` in `apps/*/app/globals.css` to scope Tailwind scanning

## Build System (Turborepo)

- Task dependencies defined in `turbo.json`
- Build tasks depend on upstream `^build`
- Development tasks run with `persistent: true` and caching disabled
- Outputs cached: `dist/**`, `.next/**` (excluding cache)

## Component Patterns

- React 19 with `JSX.Element` return types
- Explicit `className?: string` props for styling extension
- Components marked `"use client"` where needed
- TypeScript interfaces for props

## Testing

Vitest is configured for the web app with React Testing Library:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for specific app
pnpm -C apps/web test
```

Tests are colocated with source files (`*.test.tsx`). The web app has comprehensive coverage for:

- Auth flows (login, register, check-email)
- User context and providers
- Page components (home, people, chats, profile, settings, welcome)
- Utility functions (redirect sanitization)

## Internationalization (i18n)

The `@repo/i18n` package provides translations via `next-intl`:

- Locale files: `packages/i18n/src/messages/{en,es,fr,de,it,pt,ru,ca}.json`
- Namespaces: `common`, `auth`, `nav`, `settings`, `profile`, `pages`, `validation`, `api.errors`
- Usage: `const t = useTranslations("namespace")` in client components
- Middleware handles locale detection and cookie persistence
