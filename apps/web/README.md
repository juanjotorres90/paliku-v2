# Paliku Web App

Next.js 16 App Router application with React 19, Tailwind CSS v4, and next-intl for internationalization.

## Development

```bash
# From repo root
pnpm dev

# Or just this app
turbo dev --filter=web
```

Server runs on `http://localhost:3000`.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm check-types  # TypeScript type checking
pnpm test         # Run Vitest tests
pnpm test:watch   # Run tests in watch mode
```

## Structure

```
app/
├── (app)/              # Authenticated routes (protected by proxy)
│   ├── page.tsx        # Home
│   ├── welcome/        # Post-registration success screen
│   ├── people/         # Find language partners
│   ├── chats/          # Messaging
│   ├── profile/        # User profile
│   └── settings/       # App settings
├── (auth)/             # Auth routes
│   ├── login/          # Sign in
│   ├── register/       # Sign up
│   └── auth/
│       ├── callback/   # OAuth callback handler
│       └── check-email/# Email verification prompt
├── lib/                # Utilities (api, redirect, etc.)
├── user-context.tsx    # User/settings provider
└── providers.tsx       # Theme + i18n providers
```

## Auth Flow

1. Unauthenticated users are redirected to `/login` by `proxy.ts`
2. After registration:
   - If email confirmation required → `/auth/check-email`
   - If no confirmation → auto-login → `/welcome`
3. Email callback lands on `/welcome?next=<destination>`
4. All redirects are sanitized via `getSafeRedirect()`

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3002
```

## Testing

Tests use Vitest + React Testing Library. Test files are colocated (`*.test.tsx`).

```bash
pnpm test           # Run once
pnpm test:watch     # Watch mode
```

Coverage includes:

- Auth flows (login, register, check-email, welcome)
- Page components
- User context and providers
- Utility functions
