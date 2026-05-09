---
name: app
description: >
  Write the project's core application code — domain endpoints, business
  workflows, multi-table transactions — as `TsRestApi` sub-apps in
  `src/app/`. This is where the user's product logic lives. Covers route
  declaration, handler shape, file uploads, and how the single contract
  drives both request validation and OpenAPI docs.
---

# Application code (`src/app/`)

`src/app/` is where the project's domain code lives. Each `.ts` file
default-exports a `TsRestApi` instance — Sapporta's Hono sub-app with
ts-rest contracts wired in. These sub-apps are peers of the framework's
auto-generated CRUD and report endpoints; the same Hono tree serves all
of them under `/api/`.

## Why contracts (and not plain Hono)?

A route declared with `api.register(id, contract, handler)` does four
things from one declaration:

1. **Request validation.** Path params, query, headers, and body are
   Zod-parsed before the handler runs. Failures return `400` with Zod
   issue details — you never write that code.
2. **Typed handler.** `request.params`, `request.query`,
   `request.body` are the inferred output of the schemas. No `c.req.valid(...)` ceremony, no casts.
3. **OpenAPI emission.** The same `AppRoute` object is walked by
   `@ts-rest/open-api` into the served spec — so `sapporta describe` and
   `/api/openapi.json` report the route's exact surface with no extra
   annotations.
4. **Typed frontend client.** The same `AppRoute` becomes a typed client
   method via `createApiClient(contract)` in `frontend/src/api.ts`.
   Request and response shapes can never drift between client and server
   because there is one declaration.

`TsRestApi` IS a Hono app (it extends `Hono`), so plain `api.get(...)`
and middleware (`api.use(...)`) remain available for the rare cases that
fall outside ts-rest — see "Escape hatches" below.

## Mounting: don't forget this step

The scaffold's `boot.ts` ships two calls that turn a sub-app into a
discoverable route. You don't edit `boot.ts`; you edit `loadApp()` in
`src/app.ts`. The two calls are:

- `app.route("/api", apiApp)` in `boot.ts` — makes the `TsRestApi`
  reachable at runtime under `/api/*`.
- `mountOpenApi(app, sapporta, apiApp)` in `boot.ts` — pulls `apiApp`'s
  contracts into `/api/openapi.json` so `sapporta describe` can see
  them.

`loadApp()` is the single place where project sub-apps are wired onto
that `apiApp`:

```typescript
import type { ProjectDbConnection, SapportaEnv, TsRestApi } from "@sapporta/server";
import bankApp from "./app/bank.js";

export function loadApp(app: TsRestApi<SapportaEnv>, _conn: ProjectDbConnection) {
  app.route("/", bankApp);
}
```

`app` here is already scoped to `/api`, so `app.route("/", bankApp)`
serves bankApp's `path: "/transfers"` at `/api/transfers`. Do not repeat
`/api` in your route paths.

An unmounted sub-app silently does nothing — it won't appear in
`/api/openapi.json` or `sapporta describe`. After creating or
modifying a file, confirm with:

```bash
sapporta describe "METHOD /api/your/path"
```

## Where contracts live

Contracts live in the `__SLUG__-shared` workspace package, under
`shared/src/contracts/` — one file per feature, re-exported from
`shared/src/contracts/index.ts`, which `shared/src/index.ts` re-exports
in turn. Handlers live in `src/app/`. The contract file is the single
source of truth for the wire shape — the server registers a handler
against it, and the frontend builds a typed client from the same
export.

The trio for any feature `<feature>`:

- `shared/src/contracts/<feature>.ts` — the `c.router({...})` declaration.
- `src/app/<feature>.ts` — the handler, registered against the
  contract.
- `frontend/src/api.ts` — one entry adding the contract to the typed
  client.

Grouping contracts in `shared/src/contracts/` (rather than mixing them
with other shared helpers) mirrors Sapporta's own
`packages/shared/src/contracts/` layout: the directory's purpose is
obvious at a glance.

Shared is a leaf package — no React, Hono, Drizzle, or better-sqlite3
imports. Only `zod` and `@ts-rest/core` are allowed runtime deps. See
`shared/CLAUDE.md` for the full constraints.

## Minimal GET route

```typescript
// shared/src/contracts/hello.ts
import { z } from "zod";
import { initContract } from "@ts-rest/core";

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
// src/app/hello.ts
import { TsRestApi, type SapportaEnv } from "@sapporta/server";
import { helloContract } from "__SLUG__-shared";

const api = new TsRestApi<SapportaEnv>();

api.register("hello", helloContract.hello, ({ request }) => ({
  status: 200,
  body: { message: `Hello, ${request.query.name}` },
}));

export default api;
```

Re-export `helloContract` from `shared/src/contracts/index.ts` so
`__SLUG__-shared` picks it up:

```typescript
// shared/src/contracts/index.ts
export { helloContract } from "./hello.js";
```

Notes:
- `c.query()` is for GETs (no body). `c.mutation()` is for POST/PUT/PATCH/DELETE (body allowed).
- `request.query.name` is already `string` — the default kicked in at parse time.
- The handler returns `{ status, body }`. The adapter serializes it based on the declared response content type (defaults to JSON).
- `async` is optional — only use it when the handler actually awaits.

## POST with JSON body

```typescript
// shared/src/contracts/accounts.ts
import { z } from "zod";
import { initContract } from "@ts-rest/core";

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
// src/app/accounts.ts
import { TsRestApi, type SapportaEnv } from "@sapporta/server";
import { accountsContract } from "__SLUG__-shared";

const api = new TsRestApi<SapportaEnv>();

api.register("createAccount", accountsContract.createAccount, ({ c, request }) => {
  const db = c.get("db");
  const existing = db
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.name, request.body.name))
    .get();
  if (existing) return { status: 409, body: { error: "name taken" } };

  const row = db.insert(accountsTable).values(request.body).returning().get();
  return { status: 200, body: { id: row.id, name: row.name } };
});

export default api;
```

Each `status` you return must be declared in `responses` — TypeScript
enforces this. If you genuinely need to return a status that isn't part
of the API surface, see the `Response` escape hatch below.

## Path params

Declare them with `:name` in `path` and describe them with `pathParams`.
The contract goes in `shared/src/contracts/accounts.ts` alongside
sibling routes; the handler in `src/app/accounts.ts`:

```typescript
// shared/src/contracts/accounts.ts (extending the router)
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
// src/app/accounts.ts
api.register("getAccount", accountsContract.getAccount, ({ c, request }) => {
  const row = c.get("db")
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.id, request.params.id))
    .get();
  return row
    ? { status: 200, body: row }
    : { status: 404, body: { error: "not found" } };
});
```

`z.coerce.number()` is the standard trick for turning the `string` path
segment into a number at parse time.

## File uploads (`multipart/form-data`)

ts-rest declares `File` fields in the contract body (so clients know to
send `FormData`) but intentionally strips them from the inferred
**server** body type. Sapporta's adapter surfaces uploaded files on a
separate, typed `files` argument on the handler:

```typescript
// shared/src/contracts/import.ts
import { z } from "zod";
import { initContract } from "@ts-rest/core";

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
// src/app/import.ts
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
- `c.get("sqlite")` — raw `better-sqlite3` `Database` (prepared statements, `sqlite.transaction(...)`).

Both are injected by framework middleware — no setup needed.

## Synchronous DB

`better-sqlite3` is synchronous. Drizzle calls return values directly —
do not `await` them:

- `.get()` — single row or `undefined`
- `.all()` — array of rows
- `.run()` — execute without return value
- `.returning().get() / .all()` — insert/update and return rows

Handlers only need `async` when they do real async work (file I/O,
external HTTP).

## Transactions

Multi-step writes that must succeed or fail together belong in a
`sqlite.transaction(...)`:

```typescript
api.register("postEntry", postEntry, ({ c, request }) => {
  const db = c.get("db");
  const sqlite = c.get("sqlite");

  const run = sqlite.transaction(() => {
    const entry = db.insert(entriesTable).values(/*...*/).returning().get();
    db.insert(linesTable).values(request.body.lines.map((l) => ({
      entry_id: entry.id, ...l,
    }))).run();
    return entry;
  });

  return { status: 200, body: run() };
});
```

Single statements are already atomic — don't wrap them.

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
author time; this only relaxes runtime.

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

- **Forgot to mount.** File in `src/app/` alone is not enough — add `app.route("/", yourApp)` in `loadApp()`.
- **Contract declared inline in `src/app/`.** The frontend can't import it from there. Move it to `shared/src/contracts/<feature>.ts`, re-export from `shared/src/contracts/index.ts`, and import from `__SLUG__-shared` on both sides.
- **Repeated `/api` prefix.** `app` is already scoped; use bare paths in contracts.
- **Reading `request.body.file` for multipart.** ts-rest strips File fields — use `files` instead.
- **Returning an undeclared status.** TypeScript will reject it; add the status to `responses` or use the `Response` escape hatch.
- **`await`-ing synchronous Drizzle calls.** They return values directly; awaiting makes the type a `Promise` that never resolves to anything useful.

## Keep handler files thin

Prefer: contract + handler body that does routing, validation branching,
and the final write. Move categorization, parsing, and workflow logic
into sibling files (e.g. `src/categorizer/`, `src/import/`) so the
`src/app/` file reads as an endpoint map. See
[../user-code/SKILL.md](../user-code/SKILL.md) for patterns that keep
domain code testable and independent of Hono.
