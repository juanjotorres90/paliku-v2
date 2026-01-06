# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Paliku-v2 is a Turborepo monorepo with Next.js 16 and React 19, using TypeScript and Tailwind CSS v4. The monorepo contains two applications (web, docs) and shared packages for UI components and configurations.

**Requirements**: Node.js >=24, pnpm 10.24.0

## Common Commands

```bash
# Development (starts both apps: web on port 3000, docs on port 3001)
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

# Generate new UI component (in @repo/ui package)
cd packages/ui && pnpm generate:component
```

## Monorepo Architecture

### Structure
```
apps/
├── web/          # Main web app (port 3000)
└── docs/         # Documentation app (port 3001)
packages/
├── ui/           # Shared React component library
├── tailwind-config/  # Shared Tailwind v4 configuration
├── eslint-config/     # Shared ESLint flat configs
└── typescript-config/ # Shared TypeScript configs
```

### Package Dependencies

- Internal packages use `workspace:*` protocol
- Apps consume `@repo/ui` for shared components
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

No testing framework is currently configured. When adding tests, prefer Vitest for compatibility with Turborepo and modern tooling.
