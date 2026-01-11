# `@repo/db`

This package stores database artifacts meant to be applied to Supabase/Postgres.

## Phase 1 schema (profiles)

- SQL: `packages/db/sql/001_profiles.sql`
- SQL: `packages/db/sql/002_profiles_on_signup.sql`
- Apply it in Supabase (SQL Editor) or via your preferred migration workflow.

## Phase 2 (avatars)

- SQL: `packages/db/sql/003_profiles_avatar_url.sql` (adds `avatar_url` column to profiles)
- SQL: `packages/db/sql/004_storage_avatars_policies.sql` (storage RLS for avatars bucket)
- Before applying `004`: create a public bucket named `avatars` in Supabase Storage dashboard.
