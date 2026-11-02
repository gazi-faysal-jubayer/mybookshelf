# myBookshelf

A personal library and social reading app. Catalogue your books, track every read with reading journeys, write reviews, lend books to friends, and share what you're reading.

## Features

- **Library**: add books by hand or by ISBN lookup (Open Library, with Google Books as fallback). Organise them into collections, a wishlist and bookmarks.
- **Reading journeys**: each read or re-read of a book is a journey, made of reading sessions and notes ("thoughts"), and ends with a review.
- **Analytics**: reading stats and charts.
- **Lending and borrowing**: lend books to friends and handle borrow requests.
- **Social**: friends and follows, profiles, a feed with posts, comments and @mentions, direct messages, book clubs and notifications.
- **Discover and search**: find books and readers.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Supabase (Postgres, Auth, Row Level Security, Storage) · Tailwind CSS with shadcn/ui · react-hook-form and zod · UploadThing (image uploads) · recharts · deployed on Vercel

## Getting started

### 1. Prerequisites

- Node.js 20 or later and npm
- A [Supabase](https://supabase.com) project
- An [UploadThing](https://uploadthing.com) app, needed for cover and avatar uploads

### 2. Install

```bash
git clone https://github.com/gazi-faysal-jubayer/mybookshelf.git
cd mybookshelf
npm install
```

### 3. Environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
UPLOADTHING_TOKEN=<your-uploadthing-token>
```

### 4. Database

Run the SQL files in `supabase/migrations/` in your Supabase project, using the SQL editor or the Supabase CLI, in this order:

1. `001_create_profiles.sql`, then `002` to `005`
2. `001_social_features.sql`. It changes the tables created by `002`, so it has to run after them.
3. `006` to `019`, in number order

Skip `000_full_migration.sql`. It repeats `001` to `005` and fails if you run it alongside them.

> Known issue: the migration files may not exactly match the production database. See P0-6 and P2-8 in the [scaling plan](docs/SCALING_PLAN.md).

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000 and register an account.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |

## Project structure

| Path | What it holds |
|---|---|
| `src/app/(auth)/` | Login and register pages |
| `src/app/dashboard/` | All app pages (books, collections, feed, messages, …) |
| `src/app/actions/` | **The backend.** Server actions, one file per domain (book, journeys, posts, messaging, …) |
| `src/app/api/` | Sign-up, ISBN lookup and UploadThing routes |
| `src/components/<feature>/` | UI components per feature; `src/components/ui/` holds the shadcn components |
| `src/hooks/` | Shared React hooks (`use-infinite-scroll`, `use-selection`, …) |
| `src/lib/supabase/` | Supabase clients for server and browser, plus database types |
| `src/middleware.ts` | Keeps the session fresh and protects `/dashboard` |
| `supabase/migrations/` | Database schema, RLS policies and triggers |

## Contributing

- Put backend logic in a server action in `src/app/actions/`, using `createClient` from `src/lib/supabase/server.ts`.
- Never edit a migration that has already been applied. Add a new `supabase/migrations/0NN_name.sql` instead.
- Paginate list queries and select only the columns you need.
- Run `npm run lint` and `npm run build` before you open a pull request.

## Roadmap

[docs/SCALING_PLAN.md](docs/SCALING_PLAN.md) lists the known problems and the prioritised work: security fixes, performance, tooling, AI features and growth.

## License

GPL-3.0. See [LICENSE](LICENSE).
