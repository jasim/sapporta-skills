# Seed Demo Data

Fill a development database with realistic sample data so the app can be
demonstrated and its screens can be judged against real content.

Write demo data in `packages/api/seed.ts` and run it with `pnpm seed`. Both
ship with the scaffold. Do not build a seeding mechanism of your own.

## What Not To Do

Never sign in over HTTP to seed. Do not write a cookie jar, a `fetch` wrapper,
or calls to `/api/auth/sign-up/email`. Seeding runs on the same machine as the
database, so no server needs to be running and no credential is needed.

Never ask for an agent access token to seed. A token can only be created by a
signed-in person in the browser, and a newly scaffolded app has no account yet.
Tokens are for reading and writing an existing app's live data, which is a
different task; see [../data-console/guide.md](../data-console/guide.md).

Never write seed rows with raw SQL. Raw `INSERT` skips validation, column
defaults, and ownership stamping, which makes seeded rows the only rows in the
app that never passed the app's own rules.

## Workflow

1. Confirm the tables exist and the migration has been applied. Seeding writes
   rows; it does not create or alter tables.
2. Open `packages/api/seed.ts`.
3. Import each table from `./schema/`, then write rows with
   `rows(table).create({ ... })`.
4. Run `pnpm seed` from the project root.
5. Verify by signing in to the app as the demo account and opening the pages
   that show the seeded data.

## Writing The Rows

Open the app with `openScriptRuntime()`, act as the demo account with
`asDevelopmentAccount()`, and pass a table definition to `demo.rows()` to get
that table's row operations:

```ts
import { openScriptRuntime } from "./script-runtime.js";
import { authors } from "./schema/authors.js";
import { books } from "./schema/books.js";

const DEMO_ACCOUNT = {
  name: "Demo User",
  email: "demo@example.com",
  password: "demo-password",
};

const script = await openScriptRuntime();
const demo = await script.asDevelopmentAccount(DEMO_ACCOUNT, {
  rows: "workspace-wide",
});

const herbert = await demo.rows(authors).create({ name: "Frank Herbert" });
await demo.rows(books).create({
  author_id: herbert.id,
  title: "Dune",
  published_on: "1965-08-01",
});

console.log(`Seeded. Sign in as ${DEMO_ACCOUNT.email} / ${DEMO_ACCOUNT.password}`);
script.close();
```

State the `rows` scope deliberately. Ask for `"workspace-wide"` when seeding,
because demo data is about the whole workspace. Ask for `"account-only"` in a
script that touches one person's records and nobody else's.

Rules for the values:

- Create parent rows before the rows that reference them, and take foreign keys
  from the returned row as `herbert.id` does above. Never write a literal id.
- Omit `id`, `created_at`, `updated_at`, and any other generated column.
- Omit `workspace_id`, `workspaceId`, `scoped_to_user_id`, and
  `scopedToUserId`. These are stamped from the demo account, and supplying them
  is rejected.
- Include every NOT NULL column the server does not generate.
- Use column names exactly as the schema declares them, normally `snake_case`.
- Write values in the type the column expects. Do not coerce `"yes"` to `true`
  or `"$95k"` to `95000`.

`create` also accepts an array and returns the stored rows in order, which is
shorter for a batch that nothing else references:

```ts
await demo.rows(books).create([
  { author_id: herbert.id, title: "Dune", published_on: "1965-08-01" },
  { author_id: herbert.id, title: "Dune Messiah", published_on: "1969-10-01" },
]);
```

Prefer an existing domain endpoint's service function over `demo.rows(table)`
when one owns the business rule being demonstrated, such as a booking workflow
that derives totals. Import the service and call it with `demo.auth`, which is
the same value a route handler reads from `c.get("auth")`, so seeded data
matches what the feature produces.

## Re-Running

`pnpm seed` is expected to be safe to run again. The demo account and its
workspace are reused when they already exist. Keep the row writes idempotent
too, either by checking for existing rows first and returning early:

```ts
if ((await demo.rows(books).count()) > 0) {
  console.log("Already seeded.");
  script.close();
  process.exit(0);
}
```

or by making each write conditional on the row being absent. Do not leave a
seed script that fails on its second run.

## What The Scaffold Provides

`openScriptRuntime()` in `packages/api/script-runtime.ts` opens the app with no
server. It goes through `openProjectRuntime()` in `packages/api/runtime.ts`,
which `boot.ts` uses too, so a script behaves the way the running app does.
Scripts do not send email unless you pass `{ sendMail: true }`.

`script.asDevelopmentAccount(account, { rows })` creates the account and its
first workspace on the first run and reuses them afterwards, then returns an
actor bound to that account. The account is vouched for when it is created, so
it can sign in under any email-verification setting. This refuses to run with
`NODE_ENV=production`.

`script.as(email, { rows })` acts as an account that already exists. Use it for
a backfill, an import, or a scheduled job. Add such a script as
`packages/api/<name>.ts` with a `package.json` entry next to `seed`, pointing at
`dist/<name>.js`.

Name the workspace with `{ workspace: "<id-or-slug>" }` when the account belongs
to more than one. Without it the actor works in the first workspace the account
joined, which is not necessarily the one a browser shows that person.

Never import `@sapporta/server/script` outside `packages/api/script-runtime.ts`.
A route, a middleware, or anything they reach already carries the row access it
earned, at `c.get("auth")`. `pnpm test` in the project fails and names the file
if that boundary is crossed.

## Reference Data

For rows that belong to the application rather than to a person — currencies,
categories, country codes — define the table with a system-wide row scope and
seed it the same way. Such rows carry no workspace or user, so they are visible
to every account and are seeded once.
