# Application Endpoints

Put app-owned route entrypoints in `packages/api/app/`. Each typed route should
register a shared ts-rest contract with `TsRestApi`.

Use the public docs for exact contract syntax, handler arguments, multipart
uploads, response content types, OpenAPI behavior, and typed clients:

- Custom endpoints: https://sapporta.com/docs/guides/app-owned-features/custom-api-endpoints.md
- Domain workflows and transactions: https://sapporta.com/docs/guides/app-owned-features/domain-workflows-and-transactions.md
- Typed clients: https://sapporta.com/docs/guides/app-owned-features/typed-api-clients.md
- Errors and endpoint patterns: https://sapporta.com/docs/guides/app-owned-features/errors-uploads-and-endpoint-patterns.md
- Serialization and API errors: https://sapporta.com/docs/reference/contracts/serialization-and-api-errors.md
- OpenAPI discovery: https://sapporta.com/docs/reference/http/openapi.md
- Auth and row security: https://sapporta.com/docs/reference/server/auth-and-row-security.md
- Row-scoped data helpers: https://sapporta.com/docs/reference/server/row-scoped-data-helpers.md
- Search table rows and relationships: https://sapporta.com/docs/guides/model-data/search-indexes-and-display-metadata.md

## Contents

- [File Placement](#file-placement)
- [Auth Boundary](#auth-boundary)
- [Atomic Multi-Table Writes](#atomic-multi-table-writes)
- [Backend Organization](#backend-organization)
- [Error Handling](#error-handling)
- [Validation](#validation)
- [Common Pitfalls](#common-pitfalls)
- [Related Reading](#related-reading)

## File Placement

Use this trio for a feature `<feature>`:

- `packages/shared/src/contracts/<feature>.ts` for the contract.
- `packages/api/app/<feature>.ts` for the route adapter.
- `packages/frontend/src/api.ts` for a typed browser client when the frontend
  calls the route.

Re-export shared contracts from `packages/shared/src/contracts/index.ts`. Keep
the shared package browser-safe: contracts, Zod schemas, wire types, constants,
pure serializers only. No React, Hono, Drizzle, database handles, file I/O, or
route handlers.

After creating a route file, mount and extend it from `loadApp()` in
`packages/api/app.ts`. `app.route("/", featureApi)` mounts the Hono runtime
handlers. `app.extend(featureApi)` adds the sub-app's registered contracts to
the combined OpenAPI document. A `route()` call alone does not add those
contracts to `app.docEmitters`.

`app` is already scoped to `/api`, so contract paths should be bare app paths
like `/invoices/:id/void`, not `/api/invoices/:id/void`.

```ts
app.route("/", invoiceApi);
app.extend(invoiceApi);
```

Verify the mounted route:

```bash
pnpm exec sapporta endpoints show "METHOD /api/your/path"
```

## Auth Boundary

Resolve auth at the route edge with the narrowest data-authority helper that
fits the workflow.

### Default Data Primitive

Use the highest-level primitive that fits:

1. Standard CRUD for one table -> use the generated table API and surfaces; do
   not create an app-owned CRUD endpoint.
2. Ordinary app-owned work on one table -> use
   `scopedRows(db, auth, table, { searchPlan: catalog.searchPlanFor(table.sqlName) })`.
3. Joins, aggregates, transactions, or multi-table state transitions -> use
   `auth.rowSecurity.forTable(table)` with Drizzle, creating a guard for every
   scoped table touched.
4. Raw SQL -> only when these primitives cannot express the query. Keep it in a
   store/db module, document why, and establish a named scoped base set for each
   scoped table before joining, aggregating, or writing.

Read the row-scoped data-helper reference before implementing a bounded read,
page, complete scan, lookup, count, or custom generated-table adapter. Prefer
`findMany()` when no total is needed, `page()` for page metadata, `scan()` for a
complete sequential selection, and `count()`/`countBy()` for aggregates; use
the reference for current inputs and bounds. Domain code builds Drizzle
expressions; only an HTTP adapter should translate canonical table query strings
through the documented named query resolvers.

Treat `scanTableRows()` as an unscoped storage primitive. Prefer
`scopedRows().scan()`; when raw scanning is deliberate, compose the table
guard's `ownedRows(...)` predicate explicitly.

Never manually stamp or filter `workspace_id`, `workspaceId`,
`scoped_to_user_id`, or `scopedToUserId`. In particular, do not extract a
workspace or user-scope value from `auth` or the request and write your own
scope predicate as a substitute for `scopedRows()` or `rowSecurity`. Never
mutate scoped rows by primary key alone, insert `request.body` directly into
scoped tables, or fetch broadly and filter row ownership in JavaScript.

## Atomic Multi-Table Writes

For a custom endpoint that creates or changes a parent plus details, line
items, history, or another related table, first inspect the app for an existing
local pattern:

```bash
rg -n 'db\.transaction|rowSecurity\.forTable|insertValuesSync|serverValues' packages/api
```

Use one `auth.rowSecurity.forTable(...)` guard per participating table. Scope
reads in SQL, prepare transaction writes with `insertValuesSync(tx, ...)`, and
pass parent keys or other server-authored references through `serverValues`.
The default Sapporta SQLite transaction callback is synchronous; do not mark it
`async` or await work inside it.

If the app has no local example, follow
[parent-detail-transactions.md](parent-detail-transactions.md). It vendors the
canonical recipe in full, so the code needs no doc fetch.

## Backend Organization

Read [domain-code.md](domain-code.md) when workflow orchestration, invariants,
or persistence logic moves outside a thin route adapter. If an expected failure
can originate in that deeper code, also read [typed-errors.md](typed-errors.md)
before implementing the handler.

Keep route files thin:

- Route adapters resolve auth, read `c.get("db")`, call a service, and return
  the typed response.
- Services orchestrate domain workflows.
- Store/db modules own database reads and writes.
- Store functions accept `db` plus `auth`, or a small typed context such as
  `{ db, auth }`.
- Raw SQL stays inside `db/` modules with a short justification.

Small apps may keep a thin route file directly in `packages/api/app/`. Larger
features should use domain modules under `packages/api/modules/<domain>/`, for
example:

```text
packages/api/modules/orders/
  db/order-store.ts
  services/create-order.ts
  services/fulfill-order.ts
  routes/orders.ts
```

Do not pile parser, workflow, and database logic directly into
`packages/api/app/`. Do not create root-level `models/`, `controllers/`,
`services/`, `views/`, or `css/` folders under `packages/api/`.

## Error Handling

Return declared `{ status, body }` responses for expected failures. Declare
every returned status in the contract.

If the contract declares an expected non-2xx response that a service, store, or
other code below the route adapter can raise, read
[typed-errors.md](typed-errors.md) before implementing the handler. This route
is mandatory for that task shape. Catch the workflow error family once at the
route edge, map it to a declared status and stable body, and let unexpected
errors reach the default error handler.

Unexpected errors should bubble to the app's default error handler. Use raw
`Response` returns only for deliberate escape hatches such as streaming,
downloads, custom headers, or response shapes that do not fit the normal
contract return.

## Validation

Run the narrowest proof:

```bash
pnpm exec sapporta endpoints show "METHOD /api/your/path"
pnpm build
```

If `endpoints show` says the route is not found, check `loadApp()` mounting
and the contract path before writing frontend code.

For every expected failure, verify:

- the shared contract declares the status and response schema;
- the route edge contains exactly one mapping for the workflow error family;
- the response body is stable and matches the declared schema;
- a frontend action catches and handles `ApiError` when the screen exposes the
  operation; and
- focused checks cover one success response and each expected failure branch.

## Common Pitfalls

- File exists under `packages/api/app/` but is not mounted from `loadApp()`.
- Sub-app is mounted with `route()` but is not merged with `extend()`, so the
  handler works at runtime but is absent from OpenAPI and CLI discovery.
- Contract declared inline in `packages/api/app/`, so the frontend cannot import
  the same route shape.
- Contract path repeats `/api`.
- Multipart handler reads a file from `request.body` instead of `files`.
- Handler returns a status not declared in `responses`.
- Service-level expected failures bypass the typed-error route or are caught in
  multiple layers.
- Client sends scope fields or a full `request.body` directly into a scoped
  table write.
- Route updates/deletes a scoped row by primary key alone.

## Related Reading

- Endpoint runs a domain workflow — orchestration across services, a multi-step
  state transition, or a transaction:
  https://sapporta.com/docs/guides/app-owned-features/domain-workflows-and-transactions.md
- Endpoint reads or writes data — confirm every response and write is scoped to
  the authenticated user and workspace:
  https://sapporta.com/docs/reference/server/row-scoped-data-helpers.md
