# MyBookshelf — Scaling Plan & Hand-off

This document is for the developer taking over MyBookshelf. It explains what the app is, what is already done, what is wrong, and every task still to do, in priority order.

## 0. How to read this document

- Tasks are numbered by priority group:
  - **P0** Security. Do these first; they are small.
  - **P1** Performance, so the app holds up with more users.
  - **P2** Developer tooling: README, hooks, AI skills, tests, CI.
  - **P3** In-app AI features.
  - **P4** Product growth.
- Each task has **Why**, **Where** (file:line), **How**, and **Done when**. Tick the checkbox when it is finished.
- File:line references are from commit `a4d7468` on `main` (2026-11-02). Lines may drift as code changes; search for the quoted text if a line moved.
- **Database rule:** never edit a migration that has already been applied. Always add a new file `supabase/migrations/0NN_short_name.sql` and write it idempotently (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`).

---

## 1. What the app is

MyBookshelf is a personal library and social reading app. Users can:
- catalogue books, entered by hand or found by ISBN through Open Library, with Google Books as fallback;
- organise them into collections and a wishlist;
- track reading with **journeys** (one per read or re-read), each made of **sessions** and **thoughts/notes**;
- write reviews and lend or borrow books with friends;
- post to a feed, send direct messages, join clubs, get notifications and view reading analytics.

**Stack:** Next.js 16 (App Router), React 19, TypeScript (strict), Supabase (Postgres, Auth, RLS, Storage), Tailwind with shadcn/ui (Radix), react-hook-form with zod 4, UploadThing for images and recharts. It is deployed on Vercel (`@vercel/analytics` is installed).

### Folder map

| Path | What it holds |
|---|---|
| `src/app/(auth)/` | Login and register pages (client components) |
| `src/app/dashboard/*` | Every app page: books, collections, wishlist, bookmarks, analytics, connections, discover, feed, friends, messages, search, settings, `users/[userId]` |
| `src/app/actions/*.ts` | **The backend.** 17 server-action files: book, journeys, reading-sessions, reviews, posts, social, connections, messaging, clubs, borrow, lending, collection, discover, search, analytics, notifications, settings |
| `src/app/api/` | `auth/register` (sign-up), `isbn` (book lookup), `uploadthing` (image upload) |
| `src/components/<domain>/` | UI for each feature; `src/components/ui/` holds the shadcn components |
| `src/hooks/` | `use-infinite-scroll`, `use-local-storage`, `use-selection`, `use-view-mode` |
| `src/lib/supabase/` | `server.ts` (`createClient`, `getUser`, `getUserWithProfile`), `client.ts` (browser client), `middleware.ts`, `database.types.ts` |
| `src/middleware.ts` | Refreshes the Supabase session and redirects signed-out users away from `/dashboard` |
| `supabase/migrations/` | 21 SQL files, numbered 000–019 |

**Environment variables in use:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `UPLOADTHING_TOKEN`.

---

## 2. What is already done

- All the features in §1 are built and work behind login.
- RLS is enabled on every table.
- Most `user_id` columns and main lookups are indexed. A GIN full-text index exists on `books`, though no code uses it yet.
- The reading journey system is in place: sessions, thoughts and reviews are linked to `journey_id` (migrations 016–019).
- Dashboard tabs have loading skeletons.
- ISBN lookup caches its responses for 24 hours.
- A cursor-based `src/hooks/use-infinite-scroll.ts` exists. Reuse it for pagination instead of writing a new one.

## 3. What is missing or wrong

| Area | Current state |
|---|---|
| README | A 13-byte stub (`# myBookshelf`) |
| Developer and AI docs | No CLAUDE.md, no `.env.example` |
| Tests | None. There is no framework, and `test/` holds only one image |
| CI | None (`.github/` does not exist) |
| Git hooks | None |
| Claude Code setup | Only a personal `settings.local.json`. The whole `/.claude` folder is git-ignored, so nothing can be shared |
| Security | 4 RLS holes and a filter-injection bug in search (see P0) |
| Performance | N+1 query loops, unbounded `select('*')`, unindexed `ILIKE` search, no caching, notifications polled every 60s |
| Database hygiene | Two migrations numbered `001`; `000_full_migration.sql` duplicates 001–005; DB types are hand-written and out of date |
| AI | None |

## 4. Owner checklist (decisions and access, not developer work)

- [ ] Give the developer access to the GitHub repo, the Supabase project (ref `vmujqkrlphpjzmokaqhh`, see `.vscode/mcp.json`), Vercel and UploadThing.
- [ ] Create a **Supabase dev or branch project** so migrations can be tested before production.
- [ ] Get an **Anthropic API key** for P3 and set a monthly spending limit.
- [ ] Decide the AI usage limit per user. 10 requests per day on the free tier is a suggested starting point.
- [ ] Approve applying the P0 migration to production once it has been tested on dev.
- [ ] Confirm the production database matches the migration files. P2-8 found signs of drift: `reading_journeys` was created by hand, never by a migration.

---

## P0 — Security (do first)

Put P0-1 to P0-4 into one migration: `supabase/migrations/020_security_fixes.sql`.

- [ ] **P0-1 Review privacy does nothing**
  - **Why:** the policy `"Anyone can view book reviews" ... USING (true)` was never dropped. Postgres ORs policies together, so the privacy policies added in `017` have no effect and every review is public.
  - **Where:** `supabase/migrations/001_social_features.sql:556`
  - **How:** `DROP POLICY IF EXISTS "Anyone can view book reviews" ON book_reviews;`
  - **Done when:** user B cannot read user A's private review, but can still read A's public ones.

- [ ] **P0-2 `journey_stats_view` exposes private data to signed-out users**
  - **Why:** the view is granted to `anon` and runs with its owner's rights, so it skips RLS and shows private journeys, reviews and ratings.
  - **Where:** `018_enhance_reading_sessions.sql:86`, `019_add_note_type_to_thoughts.sql:125`
  - **How:** `ALTER VIEW public.journey_stats_view SET (security_invoker = true);` and `REVOKE ALL ON public.journey_stats_view FROM anon;`
  - **Done when:** an anonymous select is refused, and owners still see their own stats.

- [ ] **P0-3 Any signed-in user can create a notification for any other user**
  - **Why:** the policy is `FOR INSERT WITH CHECK (true)`.
  - **Where:** `009_enhance_notifications.sql:14-16`
  - **How:** limit inserts to rows where `related_user_id = (select auth.uid())`. Alternatively, move notification creation into a `SECURITY DEFINER` SQL function and call it from actions such as `src/app/actions/borrow.ts:80`.
  - **Done when:** a third user cannot create a notification for someone else, and the app's own notifications (borrow, mentions, friend requests) still arrive.

- [ ] **P0-4 Conversations are open to anyone**
  - **Why:** anyone can insert a conversation (`WITH CHECK (true)`), and `conversation_participants` has no INSERT policy at all.
  - **Where:** `001_social_features.sql:598`
  - **How:** require the creator to be `auth.uid()`. Add a participants INSERT policy that allows only the conversation's creator, or a user adding themselves.
  - **Done when:** starting a DM still works, and adding yourself to someone else's conversation fails.

- [ ] **P0-5 Search input can change the database filter**
  - **Why:** user text is inserted straight into PostgREST `.or()` strings, so characters such as `,` `(` `)` can add filters or break the query.
  - **Where:**
    - free text: `src/app/actions/search.ts:28`, `clubs.ts:325`, `social.ts:341`, `social.ts:357`, `social.ts:585`, `discover.ts:72`, `discover.ts:191`, `discover.ts:196`, `book.ts:82`
    - IDs that come from the client: `social.ts:21`, `social.ts:287`, `social.ts:394`, `social.ts:431`
  - **How:** add one helper to `src/lib/utils.ts` that escapes or strips `, ( ) * % \` and use it on every free-text value. Check that IDs are UUIDs with zod (`z.uuid()`).
  - **Done when:** searching for `a,user_id.eq.x` returns ordinary results and no error.

- [ ] **P0-6 Confirm who can read profiles and books**
  - **Why:** in the migration files, RLS lets only the owner read profiles and books, yet people search and discover read other users' rows. Either the live database has extra policies (drift) or those features are quietly broken.
  - **Where:** `001_create_profiles.sql:25`, `002_create_books.sql:63`; the features at `social.ts:341` and `discover.ts:72`
  - **How:** list the live policies in the Supabase dashboard (or with `select * from pg_policies`). Write a migration so the files match the intended visibility, respecting each profile's privacy settings.
  - **Done when:** the files and the live database agree, and search and discover work for a normal user.

- [ ] **P0-7 Small API fixes**
  - **Where and how:**
    - `src/app/api/auth/register/route.ts`: the username is the email prefix plus `random(1000)`, which can collide. Append a short random ID or retry on a unique-constraint error, and stop returning raw error messages to the client.
    - `src/app/api/isbn/route.ts`: check that the ISBN is 10 or 13 digits (`X` allowed) before building outside URLs.
  - **Done when:** two sign-ups with the same email prefix both succeed, and an invalid ISBN returns 400.

---

## P1 — Performance

- [ ] **P1-1 Add missing indexes**
  - **Why:** RLS checks and joins on these columns scan whole tables.
  - **How:** create one migration, `021_indexes.sql`, using `CREATE INDEX IF NOT EXISTS`.
    - **Add:**
      - `wishlists(user_id)` and `wishlist_items(wishlist_id)`: these have none, and RLS uses both on every row;
      - `reading_sessions(book_id, user_id)`, `reading_thoughts(book_id, user_id)` and `reading_journeys(book_id, user_id, status)`;
      - `notifications(user_id, created_at DESC)`;
      - foreign keys: `activities.book_id`, `messages.sender_id`, `post_comments.user_id`, `posts.book_id`, `user_badges.badge_id`, `user_challenges.challenge_id`, `blocked_users.blocked_id`, `book_clubs.created_by`, `book_clubs.current_book_id`, `review_votes.user_id`, `transaction_reviews.reviewer_id`.
    - **Drop:**
      - `idx_follows_follower`, which duplicates the unique constraint;
      - low-value indexes on columns with few distinct values: `idx_reading_journeys_status`, `idx_reading_journeys_visibility`, `idx_posts_type`, `idx_notifications_category`, `idx_reading_thoughts_note_type`.
  - **Done when:** `EXPLAIN ANALYZE` on the main page queries shows index scans.

- [ ] **P1-2 Remove N+1 query loops**
  - **Why:** these loops run one query per row, so pages get slower as data grows.
  - **Where:**
    - `src/app/actions/messaging.ts:45` (3 queries per conversation), `:127` and `:479`;
    - `clubs.ts:334` (a member count per club) and `:533` (2 queries per challenge);
    - `social.ts:629`, which inserts mention notifications one at a time;
    - `src/components/reading/journey-timeline.tsx:66`, which runs one query per journey from the browser.
  - **How:** use Supabase embedded selects, e.g. `select('id, name, members:book_club_members(count)')`, or a SQL function called with `.rpc()`. Replace the mention loop with a single bulk `insert([...])`.
  - **Done when:** each page runs a fixed number of queries, whatever the number of rows.

- [ ] **P1-3 Paginate every list and select only needed columns**
  - **Where:**
    - unbounded loads: `src/app/dashboard/books/page.tsx:15`, `src/app/dashboard/page.tsx:24`, `src/app/dashboard/wishlist/page.tsx:15`, `src/app/actions/search.ts:21`;
    - list actions in `collection.ts`, `lending.ts`, `reading-sessions.ts`, `reviews.ts` and `settings.ts`;
    - about 45 uses of `select('*')`.
  - **How:** use `.range(from, to)` on the server and the existing `src/hooks/use-infinite-scroll.ts` on the client. Name the columns each query needs.
  - **Done when:** a user with 5,000 books loads the books page as fast as a user with 50.

- [ ] **P1-4 Do aggregation in SQL, not JavaScript**
  - **Where:** `src/app/actions/analytics.ts:14`, `:22` and `:40`; the genre list at `search.ts:107`, which loads every book to find distinct genres.
  - **How:** SQL views or functions that return totals and counts, called with `.rpc()`.
  - **Done when:** the analytics page fetches only aggregated rows.

- [ ] **P1-5 Indexed search**
  - **Why:** `ILIKE '%term%'` cannot use an index.
  - **How:** use the existing books full-text index (`002_create_books.sql:55`) through `.textSearch()`. Enable the `pg_trgm` extension and add trigram indexes on `profiles(username)` and `profiles(full_name)` for people search.
  - **Done when:** search queries show index scans in `EXPLAIN`.

- [ ] **P1-6 Lighten heavy triggers**
  - **Where:** `001_social_features.sql:697` (`update_profile_stats`), `:768` (`update_reputation_after_review`) and `007_fix_activity_trigger.sql` (`create_book_activity`).
  - **How:**
    - `update_profile_stats` counts all of a user's books on every insert. Increment or decrement instead; a bulk import of N books currently costs about N².
    - `create_book_activity` fires on every update. Change it to `AFTER UPDATE OF status` and compare with `IS DISTINCT FROM`; `!=` misses changes from NULL.
    - `update_reputation_after_review`: update the numbers incrementally instead of re-running AVG and COUNT.
  - **Done when:** importing 1,000 books takes seconds, not minutes.

- [ ] **P1-7 Make RLS policies cheaper**
  - **Why:** some policies run a subquery for every row.
  - **Where:** follow and friendship checks at `016_reading_journeys_system.sql:117-139`, `017_link_reviews_to_journeys.sql:85-111`, `008_create_posts.sql:53-106` and `011_advanced_social.sql:24-39`.
  - **How:**
    - Write `auth.uid()` as `(select auth.uid())` so Postgres evaluates it once per query.
    - Move the follow and friendship checks into `STABLE SECURITY DEFINER` helper functions such as `is_follower(a, b)` and `are_friends(a, b)`, backed by indexes.
  - **Done when:** feed and journey queries show no per-row subplans in `EXPLAIN`.

- [ ] **P1-8 Fewer auth round-trips, and caching**
  - **Why:** `getUser()` makes a network call, and it currently runs separately in the middleware, the layout, each page and each action.
  - **How:**
    - Wrap `getUser` and `getUserWithProfile` in `src/lib/supabase/server.ts` with `React.cache` so each request makes one call.
    - Use `revalidateTag` for shared data instead of only `revalidatePath`.
    - Rename `src/middleware.ts` to `src/proxy.ts`, the Next 16 convention.
  - **Done when:** a dashboard render makes one auth call.

- [ ] **P1-9 Realtime updates instead of polling**
  - **Why:** every open tab fetches notifications every 60s (`src/components/notifications/notification-bell.tsx:94`).
  - **How:** add a React hook `src/hooks/use-realtime-table.ts` that subscribes to Supabase realtime INSERTs on a table, filtered by `user_id`. Use it for notifications and for messages (`src/app/dashboard/messages`).
  - **Done when:** inserting a notification row makes the bell update without a refresh, and the polling interval is gone.

---

## P2 — Developer tooling (README, hooks, AI skills, tests, CI)

- [ ] **P2-1 README.md**
  - **Why:** the current README is a stub, so new contributors cannot set the project up.
  - **How:** cover what the app does, its features, the stack, and setup steps: create a Supabase project, fill in `.env.local` from `.env.example`, run the migrations in order, then `npm install` and `npm run dev`. Also include the scripts, the folder map from §1, contribution rules, and a link to this plan.
  - **Done when:** a new developer can run the app locally from the README alone.

- [ ] **P2-2 CLAUDE.md and `.env.example`**
  - **How:**
    - `CLAUDE.md` holds short repo rules for people and AI assistants:
      - the backend is the server actions in `src/app/actions/`;
      - use `createClient` from `src/lib/supabase/server.ts`;
      - never edit an applied migration;
      - always paginate lists and select explicit columns;
      - escape user input in `.or()`;
      - use the shadcn components in `src/components/ui`.
    - `.env.example` lists `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `UPLOADTHING_TOKEN`, plus `ANTHROPIC_API_KEY` once P3 starts. It contains no real values.
  - **Done when:** both files are committed.

- [ ] **P2-3 Claude Code hooks**
  - **Why:** these catch mistakes automatically when someone works on the repo with Claude Code.
  - **How:**
    1. In `.gitignore`, change the line `/.claude` to `.claude/settings.local.json`, so shared config is committed and personal settings stay private.
    2. Create `.claude/settings.json` with hooks that call small **Node** scripts in `.claude/hooks/`. Use Node rather than bash so the hooks also work on Windows:
       - **PreToolUse** on `Edit|Write`: block edits to existing `supabase/migrations/*.sql` files (new files are allowed) and to `.env*`.
       - **PreToolUse** on `Read|Bash`: block reading `.env` and `.env.local`.
       - **PostToolUse** on `Edit|Write` for `.ts`/`.tsx` files: run `eslint --fix` on that file.
       - **Stop**: run `tsc --noEmit` and send any errors back so they get fixed before the task ends.
  - **Done when:** asking Claude to edit `019_*.sql` is blocked, and editing a `.tsx` file triggers eslint.

- [ ] **P2-4 Claude Code skills (AI skillsets for the repo)**
  - **Why:** each skill teaches an AI assistant this repo's patterns, so its output matches the codebase.
  - **How:** create one folder per skill, `.claude/skills/<name>/SKILL.md`:
    - `add-migration`: picking the next number, idempotent SQL, indexing every foreign key, the RLS checklist, then regenerating types (P2-9).
    - `add-server-action`: the standard shape is zod validation, then `getUser()`, then explicit columns, then `.range()` pagination, then revalidation, then return `{ data, error }`.
    - `rls-review`: a policy checklist built from P0 and P1-7: no `USING (true)` on private data, no `WITH CHECK (true)` on inserts, views set to `security_invoker`, and `(select auth.uid())`.
    - `perf-audit`: grep recipes for `await` inside loops, `select('*')`, `ilike`, and foreign keys without indexes.
    - `add-ai-feature`: how P3 is wired: a server-only client, the usage limit and the result cache.
  - **Done when:** the skills show up in Claude Code for this repo, and using `add-migration` produces a file that follows the rules.

- [ ] **P2-5 Git hooks**
  - **How:** add `husky` and `lint-staged` as dev dependencies, plus the script `"typecheck": "tsc --noEmit"`.
    - pre-commit: `eslint --fix` on staged `.ts`/`.tsx` files;
    - pre-push: `npm run typecheck`.
  - **Done when:** a commit containing a lint error is blocked.

- [ ] **P2-6 Tests**
  - **How:** use Vitest for server actions and zod schemas, mocking the Supabase client. Add one Playwright smoke test: register, add a book by ISBN, start a journey, log a session. Add a `"test"` script.
  - **Done when:** `npm test` runs green locally and in CI.

- [ ] **P2-7 CI**
  - **How:** add `.github/workflows/ci.yml` that installs dependencies and runs lint, typecheck, tests and build on every pull request.
  - **Done when:** a pull request shows the checks, and a failing check blocks merging (enable branch protection on `main`).

- [ ] **P2-8 Migration hygiene**
  - **Why:** the files do not reliably rebuild the database. `000_full_migration.sql` duplicates 001–005 and fails if run with them; two files are numbered `001`; `016` drops a `reading_journeys` table that no migration ever created.
  - **How:**
    - Move `000_full_migration.sql` to `supabase/archive/`.
    - Renumber `001_social_features.sql` so it runs after `002`.
    - Adopt the Supabase CLI (`supabase migration new`, `supabase db diff`) and check that the live database equals the files.
    - Drop the unused PostGIS requirement (`001_social_features.sql:7`).
  - **Done when:** `supabase db reset` on a fresh project builds the full schema with no errors.

- [ ] **P2-9 Generate the database types**
  - **Why:** `src/lib/supabase/database.types.ts` is hand-written and covers only 6 tables, so most queries are untyped.
  - **How:** run `supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts`, save that command as an npm script (`db:types`), then fix the type errors it reveals.
  - **Done when:** the types cover every table and view, and typecheck passes.

- [ ] **P2-10 Split the large files**
  - **Why:** files of 600–900 lines are hard to review and edit safely.
  - **Where:**
    - actions: `src/app/actions/posts.ts` (921 lines), `journeys.ts` (777), `connections.ts` (665), `social.ts` (650), `book.ts` (618);
    - components: `src/components/reading/session-viewer.tsx` (586), `journey-card.tsx` (469).
  - **How:** split each file by sub-domain (e.g. `posts/comments.ts`, `posts/likes.ts`) without changing behaviour. Do this after P2-6, so the tests catch regressions.
  - **Done when:** no action file is over about 400 lines and the tests pass.

- [ ] **P2-11 Cleanup**
  - **Where and how:**
    - Remove `mongoose` and `bcryptjs` from `serverExternalPackages` in `next.config.mjs`; neither is installed.
    - Check whether `.npmrc`'s `legacy-peer-deps=true` is still needed, since it hides dependency conflicts.
  - **Done when:** the build is clean, with no leftover config.

---

## P3 — In-app AI (Claude API)

- [ ] **P3-1 Setup**
  - **How:**
    - Run `npm i @anthropic-ai/sdk` and create `src/lib/ai.ts`, a **server-only** client (`import "server-only"`) that reads `ANTHROPIC_API_KEY`.
    - Add a migration with two tables, both with owner-only RLS:
      - `ai_usage(user_id, feature, created_at)`, for limits;
      - `ai_insights(owner_id, kind, ref_id, content, created_at)`, for caching results.
    - Every AI action follows the same steps:
      1. check the user's daily limit;
      2. return the cached result if one exists;
      3. call the model;
      4. store the result and log the usage.
  - **Done when:** the key never appears in the browser bundle.

- [ ] **P3-2 Reading insights for a journey**
  - **How:** add an action in `src/app/actions/ai.ts` that summarises one journey's sessions and thoughts (`reading_sessions`, `reading_thoughts`) into themes, key quotes and takeaways. Add a button to `src/components/reading/journey-card.tsx`. Model: `claude-sonnet-5-5`.
  - **Done when:** the summary appears on the journey, and a second view loads from cache without a model call.

- [ ] **P3-3 Book recommendations from the shelf**
  - **How:** take the user's finished and highly rated books and suggest 5 new ones, each with a reason. Show them on `src/app/dashboard/discover`. Model: `claude-haiku-5-5`, with prompt caching on the shelf context.
  - **Done when:** the recommendations show, and going over the limit shows a friendly message instead of an error.

- [ ] **P3-4 Later ideas**
  - Automatic genre and tags when a book is added.
  - "Ask my notes": semantic search over thoughts using `pgvector` and embeddings.

---

## P4 — Product growth

- [ ] Goodreads / StoryGraph CSV import. This is the biggest lever for winning new users, because people can bring their existing library. It needs P1-6 first, or big imports will be slow.
- [ ] Public, shareable profile and shelf pages with Open Graph images, for search engines and social sharing.
- [ ] Realtime direct messages (using P1-9), web push notifications and an installable PWA.
- [ ] Reading streaks and a yearly reading challenge, built on the existing `reading_challenges` and `badges` tables.
- [ ] Error monitoring (e.g. Sentry) and product analytics events, to see what users actually do.

---

## 5. Suggested order of work

1. Owner checklist (§4).
2. **P0**, all of it.
3. Cheap safety net: P2-1, P2-2, P2-3, P2-5, P2-7.
4. Database foundation: P2-8, P2-9.
5. **P1**, all of it.
6. P2-4 skills (once the patterns above are settled), P2-6 tests, P2-10 splitting, P2-11 cleanup.
7. **P3**.
8. **P4**.

## 6. How to check each phase

- **Always:** `npm run lint`, `npm run typecheck` and `npm run build` must pass.
- **Database changes:** apply to the dev or branch project first. Run each task's "Done when" check with two test users, then apply to production.
- **Performance:** compare `EXPLAIN ANALYZE` output and the Supabase query performance report before and after.
- **Hooks:** an edit to an old migration through Claude is blocked; a commit with a lint error is blocked.
- **AI:** see the "Done when" lines in P3.
