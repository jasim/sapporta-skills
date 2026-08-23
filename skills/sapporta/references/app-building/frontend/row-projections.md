# Row Projections

The generated `/api/tables/:tableName` routes are name-generic: one route family
serves every table and returns `Row`, an alias for `Record<string, unknown>`.
Declare the columns each screen reads as a zod schema — a row projection — and
check it from `packages/api`, so a renamed or retyped column fails a test rather
than a loaded screen.

- Writing and checking a projection:
  https://sapporta.com/docs/guides/app-owned-features/cached-table-reads-and-refresh.md
- Why wire shapes live in the shared package:
  https://sapporta.com/docs/guides/app-owned-features/shared-contracts-and-request-validation.md
- Server row aliases and their Temporal types:
  https://sapporta.com/docs/reference/schema/table-definitions.md

## Reuse Before Declaring

An app-owned endpoint for the same feature usually already exports the row's
shape. Two schemas for one row drift apart.

```bash
rg -n "z.object|\.extend\(" packages/shared/src/contracts
```

## Declare It In The Shared Package

One file per feature under `packages/shared/src/contracts/`, re-exported from
that directory's `index.ts`. Under `packages/frontend/src/` the API package
cannot check it.

```ts
// packages/shared/src/contracts/task-rows.ts
/** The `tasks` columns the task editor reads. */
export const taskRowSchema = z.object({
  id: z.number(),
  title: z.string(),
  project_id: z.number().nullable(),
  due_date: z.string().nullable(),
});

export type TaskRow = z.output<typeof taskRowSchema>;
```

Pass it to the query builder through `decodeRow`:

```ts
const decodeTask = (row: Row): TaskRow => taskRowSchema.parse(row);
```

List only the columns the screen reads; omit `workspace_id`,
`scoped_to_user_id`, and audit timestamps it does not display. Adding a table
column then does not require changing an existing projection. Keep SQL column
names, and convert to a camelCase view model in a separate frontend-package
function.

## Declare Date And Timestamp Columns As Strings

The routes serialize `date()` to `"2026-04-18"` and `timestamp()` to
`"2026-04-18T09:30:00Z"`. Declare both `z.string()`.

This is why `$inferSelect` and `$inferInsert` must never reach
`packages/frontend`: they type the hydrated Drizzle row, where those columns are
`Temporal.PlainDate` and `Temporal.Instant`. They are server types, and the
import would pull Drizzle and `@sapporta/server` toward the browser.

## Check Each Projection With A Test

`packages/api` is the only package that depends on both the schema and the
shared package, so put one test per projected table there. Read the row through
the path the generated route uses, so the test compares the projection against
the serialized wire row rather than the Drizzle row. Renaming `title` to `label`
must fail it.

```ts
// packages/api/schema/tasks.test.ts
import { taskRowSchema } from "task-app-shared";

it("matches the columns the task editor reads", () => {
  expect(taskRowSchema.safeParse(readSampleTaskRow()).success).toBe(true);
});
```

Run it with the application's tests, alongside `pnpm typecheck` and
`pnpm build`. The runtime `decodeRow` parse is a loud failure for an unexpected
response, not drift protection: it reports a mismatch only on a loaded screen.

## Inspect The Application

```bash
rg -n "decodeRow" packages/frontend/src
rg -n "z.object" packages/shared/src/contracts
rg -n "\$inferSelect" packages/frontend/src
```

The third command must return nothing. Where it returns a match, replace that
import with a projection.
