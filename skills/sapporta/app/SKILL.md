---
name: app
description: >
  Use when the user wants to add or change Sapporta backend endpoints and
  product workflows. Covers `TsRestApi` routes in `packages/api/app/`, shared
  contracts, request validation, OpenAPI docs, typed clients, file uploads, and
  multi-table transactions.
---

# Application Endpoints

Put app-owned route entrypoints in `packages/api/app/`. Each typed route should
register a shared ts-rest contract with `TsRestApi`.

Use the public docs for exact contract syntax, handler arguments, multipart
uploads, response content types, OpenAPI behavior, and typed clients:

- Custom endpoints: https://sapporta.com/docs/subsystems/custom-api-endpoints/
- Typed clients: https://sapporta.com/docs/subsystems/typed-api-clients/
- OpenAPI discovery: https://sapporta.com/docs/subsystems/openapi-and-discovery/
- Auth and row security: https://sapporta.com/docs/reference/auth-and-row-security/

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

After creating a route file, mount it from `loadApp()` in `packages/api/app.ts`.
`app` is already scoped to `/api`, so contract paths should be bare app paths
like `/invoices/:id/void`, not `/api/invoices/:id/void`.

Verify the mounted route:

```bash
pnpm exec sapporta describe "METHOD /api/your/path"
```

## Auth Boundary

Resolve auth at the route edge with the narrowest data-authority helper that
fits the workflow. Then choose the highest-level data primitive that fits:

1. `scopedRows(db, auth, table)` for ordinary table work.
2. `auth.rowSecurity.forTable(table)` with Drizzle for joins, transactions,
   aggregates, multi-table state transitions, and domain invariants.
3. Raw SQL only when the scoped primitives do not fit.

Never manually stamp or filter `workspace_id`, `workspaceId`,
`scoped_to_user_id`, or `scopedToUserId`. Never mutate scoped rows by primary
key alone. Never insert `request.body` directly into scoped tables. Never fetch
broadly and filter row ownership in JavaScript.

## Backend Organization

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
every returned status in the contract. For errors raised deep in business logic,
read [../user-code/typed-errors/SKILL.md](../user-code/typed-errors/SKILL.md).

Unexpected errors should bubble to the app's default error handler. Use raw
`Response` returns only for deliberate escape hatches such as streaming,
downloads, custom headers, or response shapes that do not fit the normal
contract return.

## Validation

Run the narrowest proof:

```bash
pnpm exec sapporta describe "METHOD /api/your/path"
pnpm build
```

If `describe` says the route is not found, check `loadApp()` mounting and the
contract path before writing frontend code.

## Common Pitfalls

- File exists under `packages/api/app/` but is not mounted from `loadApp()`.
- Contract declared inline in `packages/api/app/`, so the frontend cannot import
  the same route shape.
- Contract path repeats `/api`.
- Multipart handler reads a file from `request.body` instead of `files`.
- Handler returns a status not declared in `responses`.
- Client sends scope fields or a full `request.body` directly into a scoped
  table write.
- Route updates/deletes a scoped row by primary key alone.
