# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**MyBookshelf** is a single Next.js 16 app (not a monorepo) — a personal book lending management system. It uses Supabase for auth, database, and storage. No Docker, no Makefile, no monorepo. Uses `npm` as the package manager (`package-lock.json`).

### Running the app

- `npm run dev` starts the Next.js dev server on port 3000.
- The landing page (`/`), login (`/login`), and register (`/register`) pages render without Supabase credentials. All authenticated routes (under `/dashboard/*`) require a working Supabase connection.

### Environment variables

A `.env.local` file is needed with at minimum:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous/public key

Without real Supabase credentials, the app renders static pages but auth/data operations fail with "Failed to fetch".

### Lint

The `npm run lint` script (`next lint`) does **not** work in Next.js 16 — the `next lint` subcommand was removed. The `.eslintrc.json` (legacy format) is also incompatible with ESLint 9 (which requires flat config `eslint.config.js`). This is a pre-existing repo issue.

### Build

`npm run build` compiles successfully with Turbopack and performs TypeScript type checking.

### Database migrations

SQL migrations live in `supabase/migrations/`. There is no `supabase/config.toml`, so these are designed to run via Supabase SQL Editor (cloud-hosted), not via `supabase db push`.
