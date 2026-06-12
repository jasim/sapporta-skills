---
name: app
description: >
  Use when the user wants to add or change Sapporta backend endpoints and
  product workflows. Covers `TsRestApi` routes in `packages/api/app/`, shared
  contracts, request validation, OpenAPI docs, typed clients, file uploads, and
  multi-table transactions.
---

# Application code (`packages/api/app/`)

Put domain routes in `packages/api/app/`. Each route file should
default-export a `TsRestApi` instance with ts-rest contracts registered on it.
Routes in this folder are served under `/api/`; report endpoints use the same
pattern as other product routes.

## Why contracts (and not plain Hono)?

A route declared with `api.register(id, contract, handler)` does four
things from one declaration:

1. **Request validation.** Path params, query, headers, and body are
   Zod-parsed before the handler runs. Failures return `400` with Zod
   issue details — you never write that code.
2. **Typed handler.** `request.params`, `request.query`,
   `request.body` are the inferred output of the schemas. No `c.req.valid(...)` ceremony, no casts.
3. **OpenAPI emission.** The same `AppRoute` object is walked by
   `@sapporta/rest-open-api` into the served spec — so `sapporta describe`
   and `/api/openapi.json` report the route's exact API shape with no extra
   annotations.
4. **Typed frontend client.** The same `AppRoute` becomes a typed client
   method via `createApiClient(contract, { baseUrl })` in
   `packages/frontend/src/api.ts`. Request and response shapes can never drift
   between client and server because there is one declaration.

Use `api.register(...)` for typed product routes. Use plain `api.get(...)` or
middleware only for cases that do not fit a shared contract; see "Escape
hatches" below.

## Auth Boundary

Product routes should resolve auth at the route edge with
the narrowest data-authority helper that fits the workflow, such as
`projectAuth.requireAuthorizedWorkspaceUserData(c, requirement)`,
`projectAuth.requireAuthorizedWorkspaceData(c, requirement)`, or
`projectAuth.requireAuthorizedSystemData(c, requirement)`. Ability checks decide
whether the feature may run; data authority decides which trusted row facts
database helpers may use. Once auth is resolved, use the highest fitting
data-access primitive:

1. **Default:** `scopedRows(db, auth, table)` for ordinary table work:
   `.list(...)`, `.get(...)`, `.create(...)`, `.update(...)`, `.delete(...)`,
   `.lookup(...)`, `.count(...)`, and `.exportRows(...)`.
2. **Advanced:** `auth.rowSecurity.forTable(table)` with Drizzle for joins,
   transactions, aggregates, multi-table state transitions, custom SQL, or
   domain invariants that `scopedRows()` cannot express.
3. **Escape hatch:** raw SQL / `better-sqlite3` prepared statements only when
   the above primitives genuinely do not fit. Keep raw SQL in the module's
   `db/` folder and add a short justification explaining why `scopedRows()` or
   `rowSecurity.forTable()` does not fit.

Never manually stamp or filter `workspace_id`, `workspaceId`,
`scoped_to_user_id`, or `scopedToUserId`. Never mutate scoped rows by primary
key alone. Never insert `request.body` directly into scoped tables. Never fetch
broadly and filter row ownership in JavaScript.

## Mounting: don't forget this step

After creating a route file, wire it from `loadApp()` in `packages/api/app.ts`:

```typescript
import type { SapportaEnv, TsRestApi } from "@sapporta/server";
import bankApp from "./app/bank.js";

export function loadApp(app: TsRestApi<SapportaEnv>, _options: LoadAppOptions) {
  app.route("/", bankApp);
}
```

`app` here is already scoped to `/api`, so `app.route("/", bankApp)` serves
bankApp's `path: "/transfers"` at `/api/transfers`. Do not repeat `/api` in
your route paths.

If a route is not mounted, it will not appear in `sapporta describe`. After
creating or modifying a route, confirm with:

```bash
sapporta describe "METHOD /api/your/path"
```

## Where contracts live

Put contracts in the app's shared workspace package, under
`packages/shared/src/contracts/` — one file per feature, re-exported from
`packages/shared/src/contracts/index.ts`. Put handlers in `packages/api/app/`.
Use the same contract for the backend handler and frontend client so request
and response shapes stay in sync.

The trio for any feature `<feature>`:

- `packages/shared/src/contracts/<feature>.ts` — the `c.router({...})` declaration.
- `packages/api/app/<feature>.ts` — the handler, registered against the
  contract.
- `packages/frontend/src/api.ts` — one entry adding the contract to the typed
  client.

In `packages/frontend/src/api.ts`, follow the app's client pattern:

```typescript
import { createApiClient } from "@sapporta/shared/client";
import { getApiBase } from "@sapporta/frontend/platform";
import { accountsContract } from "__SLUG__-shared";

export const accountsApi = createApiClient(accountsContract, {
  baseUrl: getApiBase,
});
```

Keep the shared package browser-safe: no React, Hono, Drizzle, better-sqlite3,
I/O, HTTP handlers, or database access. See `packages/shared/AGENTS.md` when
you need the exact dependency boundary.

## Backend organization

Sapporta keeps route apps under `packages/api/app/`, but substantial backend code should
be organized as a vertical-slice modular monolith. Group by semantic domain,
bounded context, or feature module first; use technical folders only as leaves
inside that domain.

Avoid root-level horizontal MVC:

```text
packages/api/models/
packages/api/controllers/
packages/api/services/
packages/api/views/
```

Prefer domain modules:

```text
packages/api/modules/
  orders/
    db/
      order-store.ts
    services/
      create-order.ts
      fulfill-order.ts
    routes/
      orders.ts
  billing/
    db/
      invoice-store.ts
    services/
      create-invoice.ts
      record-payment.ts
    routes/
      invoices.ts
  projects/
    db/
      project-store.ts
    services/
      assign-task.ts
    routes/
      projects.ts
```

Nested domains are fine when a subdomain is tightly coupled to a parent domain;
apply the same rule recursively:

```text
packages/api/modules/
  commerce/
    orders/
      db/
      services/
      routes/
    inventory/
      db/
      services/
      routes/
    billing/
      db/
      services/
      routes/
```

Small apps may keep a thin route file directly in `packages/api/app/`. Larger
features should put domain code in `packages/api/modules/<domain>/`.
`packages/api/app/*.ts` can be thin route entrypoints importing module routes,
or `packages/api/app.ts` can mount route apps exported from modules, depending
on the project's existing style.

```text
packages/api/app/orders.ts
packages/api/modules/orders/routes/orders.ts
packages/api/modules/orders/services/create-order.ts
packages/api/modules/orders/services/fulfill-order.ts
packages/api/modules/orders/db/order-store.ts
```

Do not pile parser, workflow, and database logic directly into `packages/api/app/`.

## Data-access layer

The old prepared-statement style had one useful property: database code stayed
in one place. Preserve that property with Sapporta primitives.

- Route files are adapters: resolve auth, read `c.get("db")`, call a service,
  and return the typed response.
- Services orchestrate domain workflows and call the module store.
- Keep database reads and writes in `db/` modules.
- Store functions accept `db` plus `auth`, or a small typed context object such
  as `{ db, auth }`.
- Store functions use `scopedRows()` for ordinary table operations.
- Store functions use `auth.rowSecurity.forTable(table)` for custom Drizzle
  workflows.
- Raw SQL stays inside `db/` modules, never in routes, parsers, or business
  workflow files.

An order workflow should look roughly like:

```text
packages/api/modules/orders/
  db/
    order-store.ts          # scopedRows / rowSecurity / rare raw SQL
  services/
    create-order.ts         # workflow orchestration
    fulfill-order.ts        # workflow orchestration
  routes/
    orders.ts               # TsRestApi route adapter
```

Route responsibility:

```typescript
const auth = projectAuth.requireAuthorizedWorkspaceUserData(c, {
  action: "create",
  subject: "orders",
});
const result = await createOrder({
  db: c.get("db"),
  auth,
  input: request.body,
});
```

Service responsibility: validate domain workflow inputs, coordinate multi-step
work, and call the module store. Store responsibility: all database reads and
writes. Prefer Sapporta scoped APIs.

## Minimal GET route

```typescript
// packages/shared/src/contracts/hello.ts
import { z } from "zod";
import { initContract } from "@sapporta/rest-core";

const c = initContract();

export const helloContract = c.router({
  hello: c.query({
    method: "GET",
    path: "/hello",
    summary: "Say hello",
    query: z.object({ name: z.string().default("world") }),
    responses: {
      200: z.object({ message: z.string() }),
    },
  }),
});
```

```typescript
// packages/api/app/hello.ts
import { TsRestApi, type SapportaEnv } from "@sapporta/server";
import { helloContract } from "__SLUG__-shared";

const api = new TsRestApi<SapportaEnv>();

api.register("hello", helloContract.hello, ({ request }) => ({
  status: 200,
  body: { message: `Hello, ${request.query.name}` },
}));

export default api;
```

Re-export `helloContract` from `packages/shared/src/contracts/index.ts` so
`__SLUG__-shared` picks it up:

```typescript
// packages/shared/src/contracts/index.ts
export { helloContract } from "./hello.js";
```

Notes:
- `c.query()` is for GETs (no body). `c.mutation()` is for POST/PUT/PATCH/DELETE (body allowed).
- `request.query.name` is already `string` — the default kicked in at parse time.
- The handler returns `{ status, body }`. The adapter serializes it based on the declared response content type (defaults to JSON).
- `async` is optional — use it when the handler awaits scoped row operations,
  transactions, file I/O, or external HTTP.

## POST with JSON body

```typescript
// packages/shared/src/contracts/accounts.ts
import { z } from "zod";
import { initContract } from "@sapporta/rest-core";

const c = initContract();

export const accountsContract = c.router({
  createAccount: c.mutation({
    method: "POST",
    path: "/accounts",
    summary: "Create an account",
    body: z.object({
      name: z.string().min(1),
      type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
    }),
    responses: {
      200: z.object({ id: z.number(), name: z.string() }),
      409: z.object({ error: z.string() }),
    },
  }),
});
```

```typescript
// packages/api/app/accounts.ts
import { scopedRows, TsRestApi, type SapportaEnv } from "@sapporta/server";
import { accountsContract } from "__SLUG__-shared";
import { projectAuth } from "../project-auth/index.js";
import { accounts } from "../schema/accounts.js";

const api = new TsRestApi<SapportaEnv>();

api.register("createAccount", accountsContract.createAccount, async ({ c, request }) => {
  const auth = projectAuth.requireAuthorizedWorkspaceData(c, {
    action: "create",
    subject: "accounts",
  });
  const rows = scopedRows(c.get("db"), auth, accounts);

  const created = (await rows.create(request.body)) as { id: number; name: string };
  return { status: 200, body: { id: created.id, name: created.name } };
});

export default api;
```

Each `status` you return must be declared in `responses` — TypeScript
enforces this. If you genuinely need to return a status that isn't part
of the API contract, see the `Response` escape hatch below.

Response contracts are enforced at author time and used for OpenAPI output.
The adapter intentionally does not validate response bodies again at runtime,
so return the declared shape from the handler or service boundary.

For uniqueness checks or other domain rules, keep the query inside the same
row-security boundary, preferably in a module store. Do not replace
`rows.create(...)` with a direct scoped-table insert.

## Path params

Declare them with `:name` in `path` and describe them with `pathParams`.
The contract goes in `packages/shared/src/contracts/accounts.ts` alongside
sibling routes; the handler in `packages/api/app/accounts.ts`:

```typescript
// packages/shared/src/contracts/accounts.ts (extending the router)
getAccount: c.query({
  method: "GET",
  path: "/accounts/:id",
  pathParams: z.object({ id: z.coerce.number().int() }),
  responses: {
    200: accountSchema,
    404: z.object({ error: z.string() }),
  },
}),
```

```typescript
// packages/api/app/accounts.ts
api.register("getAccount", accountsContract.getAccount, async ({ c, request }) => {
  const auth = projectAuth.requireAuthorizedWorkspaceData(c, {
    action: "read",
    subject: "accounts",
  });
  const rows = scopedRows(c.get("db"), auth, accounts);

  const row = await rows.get(request.params.id);
  return { status: 200, body: row };
});
```

`z.coerce.number()` is the standard trick for turning the `string` path
segment into a number at parse time.

## File uploads (`multipart/form-data`)

ts-rest declares `File` fields in the contract body (so clients know to
send `FormData`) but intentionally strips them from the inferred
**server** body type. Sapporta's adapter provides uploaded files on a
separate, typed `files` argument on the handler:

```typescript
// packages/shared/src/contracts/import.ts
import { z } from "zod";
import { initContract } from "@sapporta/rest-core";

const c = initContract();

export const importContract = c.router({
  uploadStatement: c.mutation({
    method: "POST",
    path: "/import/upload",
    summary: "Upload a bank statement",
    contentType: "multipart/form-data",
    body: z.object({
      file: z.instanceof(File),
      description: z.string().optional(),
    }),
    responses: {
      200: z.object({ rows: z.number() }),
    },
  }),
});
```

```typescript
// packages/api/app/import.ts
import { TsRestApi, type SapportaEnv } from "@sapporta/server";
import { importContract } from "__SLUG__-shared";

const api = new TsRestApi<SapportaEnv>();

api.register("uploadStatement", importContract.uploadStatement, async ({ c, request, files }) => {
  // `files.file` is guaranteed present — the Zod z.instanceof(File) check
  // already ran and 400'd any missing/non-File upload.
  const file = files.file as File;
  const rows = await importBuffer(Buffer.from(await file.arrayBuffer()));

  // Non-File fields (e.g. description) arrive on request.body as normal.
  console.log(request.body.description);

  return { status: 200, body: { rows } };
});
```

Key points:
- Set `contentType: "multipart/form-data"` on the contract.
- Declare each file field with `z.instanceof(File)` so the adapter runs a presence/type check and the OpenAPI spec marks the field required.
- Read file values off `files`, not `request.body` — the ts-rest inferred body type hides them.
- Multi-file uploads: declare a field as `z.array(z.instanceof(File))` and read `files.fieldName` as `File[]`.
- `request.body` still carries the non-File fields, validated against the schema.

## Handler arg: `{ c, request, files }`

```typescript
(args: {
  c: Context<SapportaEnv>;            // the Hono Context
  request: ServerInferRequest<Route>; // typed params/query/headers/body
  files: Record<string, File | File[]>; // populated only for multipart; {} otherwise
})
```

- `c.get("db")` — Drizzle `BetterSQLite3Database` (schema-aware queries).

Sapporta middleware injects the database — no setup needed. Product code should
normally pass `c.get("db")` plus route-edge auth into services/stores. Do not
pass the raw SQLite handle into domain services by default.

## DB calls

Sapporta's scoped row APIs and row-security helpers are async:

- `await rows.list(...)`
- `await rows.get(...)`
- `await rows.create(...)`
- `await rows.update(...)`
- `await rows.delete(...)`
- `await guard.insertValues(...)`
- `await guard.patchValues(...)`
- `await guard.insertManyValues(...)`

Raw `better-sqlite3` is synchronous, but raw prepared statements are an escape
hatch, not the default data-access style.

## Transactions

Try `scopedRows()` first. When a multi-step write needs custom persistence,
use Drizzle transactions with one row-security guard per scoped table:

```typescript
api.register("createInvoice", contract.createInvoice, async ({ c, request }) => {
  const db = c.get("db");
  const auth = projectAuth.requireAuthorizedWorkspaceUserData(c, {
    action: "create",
    subject: "invoice_workflow",
  });
  const invoiceGuard = auth.rowSecurity.forTable(invoices);
  const lineGuard = auth.rowSecurity.forTable(invoiceLines);

  const created = await db.transaction(async (tx) => {
    const invoice = await tx
      .insert(invoicesTable)
      .values(await invoiceGuard.insertValues(tx, request.body.invoice))
      .returning()
      .get();

    const lines = await lineGuard.insertManyValues(tx, request.body.lines, {
      serverValues: () => ({ invoice_id: invoice.id }),
    });

    await tx.insert(invoiceLinesTable).values(lines);
    return { invoice, lines };
  });

  return { status: 201, body: { data: created } };
});
```

`insertValues()` and `insertManyValues()` reject client-managed scope fields,
merge trusted server values, validate visible FKs, and stamp the authenticated
data-authority scope. Updates and deletes must include `guard.ownedRows(...)`
in their `where(...)`; primary key alone is not authorization.

Raw `sqlite.transaction(...)` is only for the justified raw-SQL escape hatch and
belongs in a `modules/<domain>/db/` file.

## Error handling

Return a typed `{ status, body }`. Declare the error statuses in
`responses` so the shape is typed and documented:

```typescript
responses: {
  200: resultSchema,
  404: z.object({ error: z.string() }),
  422: z.object({ error: z.string(), field: z.string() }),
},
```

For errors raised deep in business logic (not directly in the handler),
read [../user-code/typed-errors/SKILL.md](../user-code/typed-errors/SKILL.md).

Zod validation errors on request input are handled by the adapter and
returned as `400` with `{ error, code: "BAD_REQUEST", details: [...] }` —
you don't write that code.

## Escape hatches (rare)

**Return a raw `Response` from a handler.** For streamed downloads,
custom headers, or non-declared statuses:

```typescript
api.register("exportCsv", exportCsv, ({ c }) => {
  return c.body(streamCsv(), 200, { "Content-Type": "text/csv" });
});
```

The declared `{ status, body }` shape is still enforced by TypeScript at
author time for ordinary returns; this escape hatch lets you deliberately
return a raw Hono response.

**Plain Hono routes.** `TsRestApi` IS a Hono instance, so
`api.get("/healthz", ...)` works — but such routes do **not** appear in
the OpenAPI spec. Use only for things genuinely outside the contract
story (health checks, static redirects).

**Response content types other than JSON.** Declare with
`c.otherResponse({ contentType: "text/csv", body: z.string() })`:

```typescript
responses: {
  200: c.otherResponse({ contentType: "text/csv", body: z.string() }),
},
```

The adapter sets the right `Content-Type` header automatically.

## Verify the loop

The author-time equivalent of running the code is:

```bash
sapporta describe "METHOD /api/your/path"
```

If the route is mounted, the contract is loaded, and the schemas are
well-formed, `describe` prints request + response shapes with all
`$ref`s inlined. If it says "not found" or shows the wrong schema, fix
it before writing client code.

## Common pitfalls

- **Forgot to mount.** File in `packages/api/app/` alone is not enough — add `app.route("/", yourApp)` in `loadApp()`.
- **Contract declared inline in `packages/api/app/`.** The frontend can't import it from there. Move it to `packages/shared/src/contracts/<feature>.ts`, re-export from `packages/shared/src/contracts/index.ts`, and import from `__SLUG__-shared` on both sides.
- **Repeated `/api` prefix.** `app` is already scoped; use bare paths in contracts.
- **Reading `request.body.file` for multipart.** ts-rest strips File fields — use `files` instead.
- **Returning an undeclared status.** TypeScript will reject it; add the status to `responses` or use the `Response` escape hatch.

## Anti-patterns

Do not:

- Create `prepareStatements()` for scoped product tables unless raw SQL has
  been justified.
- Pass `c.get("sqlite")` into import/domain services by default.
- Hand-code `workspace_id = ?` or `scoped_to_user_id = ?`.
- Insert `request.body` directly into scoped tables.
- Update/delete by primary key alone.
- Mix parser, route, workflow, and SQL code in one file.
- Create root-level `models/`, `controllers/`, `services/`, `views/`, or `css/`
  folders under `packages/api/`.

## Keep handler files thin

Prefer: contract + handler body that does routing, validation branching,
and the final response. Move parsing, workflow logic, and persistence into
`packages/api/modules/<domain>/` so the `packages/api/app/` file reads as an
endpoint map. See [../user-code/SKILL.md](../user-code/SKILL.md) for patterns
that keep domain code testable and independent of Hono.
