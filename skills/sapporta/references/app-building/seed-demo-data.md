# Seed Demo Data

Fill a development database with realistic sample data so the app can be
demonstrated and its screens judged against real content.

The scaffold owns this. Write rows in `packages/api/seed.ts` and run
`pnpm seed`. Do not build a seeding mechanism of your own.

- Seeding, script runtime, and the permission that guards them:
  https://sapporta.com/docs/guides/operations/sample-data-and-scripts.md
- Environment settings the run reads:
  https://sapporta.com/docs/reference/project/environment-variables.md

## What Not To Do

- Never sign in over HTTP to seed. No cookie jar, no `fetch` wrapper, no calls
  to `/api/auth-context` or `/api/auth/sign-up/email`. A script runs on the same
  machine as the database; no server needs to be running.
- Never ask for an agent access token. Only a signed-in person can create one,
  and a freshly scaffolded app has no account yet. Tokens are for an existing
  app's live data; see [../data-console/guide.md](../data-console/guide.md).
- Never write seed rows with raw SQL. `INSERT` skips validation, column
  defaults, and ownership stamping.
- Never call `openScriptRuntime()` from a route, from middleware, or from
  anything they reach. A served request already carries the row access it
  earned, at `c.get("auth")`.

## Which Runtime

- `pnpm seed` / sample data -> `openSeedRuntime(account)` from
  `./seed-runtime.js`. Creates the account on the first run, signs in after.
- A nightly job, one-off import, or maintenance task -> `openScriptRuntime({
  email, password })` from `./script-runtime.js`. Signs in and creates nothing.

Both return `{ workspace, rows, db, auth, close }`. Seed plain rows through
`rows(table)`. When the change is more than a row — a total derived across
tables, a transition that writes an event beside it — call the domain workflow
with `{ db: demo.db, auth: demo.auth }`, the same pair a route passes it.

## Rules For The Run

- Apply migrations before seeding. Seeding writes rows; it does not create
  tables.
- `.env.development` must set `SAPPORTA_ALLOW_SAMPLE_DATA_SEEDING=true` and
  `NODE_ENV` must not be `production`. Never carry that setting into a
  deployment: the password is in the source.
- Keep the run idempotent. Guard each write with a count so a second `pnpm seed`
  does not duplicate rows.
- Create parent rows first and take foreign keys from the returned row. Never
  write a literal id.
- Omit `id`, `created_at`, `updated_at`, `workspace_id`, and
  `scoped_to_user_id`. They are generated or stamped, and supplying them is
  rejected.
- Use column names exactly as the schema declares them, and write values in the
  type the column expects.
- The seeded workspace keeps the time zone of the machine that ran the seed, so
  seeded timestamps read on the local clock. An owner changes it at
  `/workspace/settings`; see [days-and-time-zones.md](days-and-time-zones.md).
- Verify by signing in as the demo account and opening the pages that show the
  seeded data.

## Reference Data

For rows that belong to the application rather than to a person — currencies,
categories, country codes — define the table with a system-wide row scope and
seed it the same way. Such rows carry no workspace or user.
