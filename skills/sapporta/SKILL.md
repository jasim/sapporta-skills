---
name: sapporta
description: >
  Use only when the current workspace is an existing Sapporta application and
  the user wants to define or change application tables, reports, report links,
  backend endpoints, domain workflows, React views, auth or row ownership,
  application records, report execution, or project-local Sapporta CLI
  operations.
---

# Sapporta Agent Dispatch

Sapporta is the reusable framework and library; a Sapporta application is a
downstream product project that depends on it and contains its own schema,
workflows, UI, and data.

This skill provides operating instructions. Use public docs for product
explanations, API shapes, CLI grammar, and reference details:

- Docs: https://sapporta.com/docs/
- Agent workflow overview: https://sapporta.com/docs/guides/discovery/develop-with-a-coding-agent/
- API/tool choice guide: https://sapporta.com/docs/guides/discovery/choose-an-application-interface/
- Reference index: https://sapporta.com/docs/reference/

Prefer the project-local CLI:

```bash
pnpm exec sapporta ...
```

## Choose The Right Mode

Decide whether the user wants to change app code or operate on existing data.

- Build or change app behavior: tables, reports, report links, custom
  endpoints, shared contracts, frontend views, auth-aware workflows, or
  validation loops -> read [app-building/guide.md](references/app-building/guide.md).
- Inspect, query, insert, update, validate, or answer questions from records
  already in the app -> read [data-console/guide.md](references/data-console/guide.md).
- Native module binding failures, `better-sqlite3`, install/dev-server errors
  -> read [operations/troubleshooting.md](references/operations/troubleshooting.md).

Some tasks touch both modes: build a report route and screen with the
`app-building` guide, then call the report endpoint and inspect the numbers
with the `data-console` guide.

## Rules That Prevent Wrong Work

- Work in the local Sapporta project rooted at `cwd` or the nearest
  `sapporta.json`.
- Framework table/meta APIs and app-owned API routes are served under `/api`.
  Contract paths should not repeat the `/api` prefix. Health checks and
  frontend/static routes may be outside `/api` when the app deliberately mounts
  them there.
- For app-development work, inspect local contracts, route files, schema,
  migrations, and local database state as needed; do not block on an agent token
  unless the task is explicitly API-backed data work.
- To discover how to define application tables, follow
  [app-building/tables/create.md](references/app-building/tables/create.md). It routes to the canonical
  worked schema example and exact references.
- When `packages/api/schema/` contains only project-authentication tables, treat
  the project as a fresh app. Read the complete starter schema through
  [app-building/tables/create.md](references/app-building/tables/create.md) before inspecting framework
  source, internal fixtures, or generated declarations.
- For API-backed data commands, pass `--api-url <url>` when the app API is not
  on `http://localhost:3000`; pass `--api-token <token>` when the app is
  protected. If auth fails, read the CLI access reference before continuing.
- The CLI can inspect mounted routes with `endpoints list` and `endpoints show`,
  and can invoke app endpoints with
  `api get/post/put/delete`. Use `curl` or a typed client when that is more
  convenient for the route.
- Before constructing a raw generated-table HTTP request, read
  [data-console/table-queries.md](references/data-console/table-queries.md) and inspect the intended
  method and path with `endpoints show`. Generated row updates use `PUT`, not
  `PATCH`.
- Apply auth scope on the server. Built-in endpoints apply row visibility;
  custom code must choose route-edge ability/data authority and use scoped row
  helpers.
- Raw SQL is a fallback. In app code, contain it in store/db modules with a
  justification. In data-console work, treat it as admin/debug inspection unless
  the user explicitly asked for maintenance SQL.

Reference docs:

- CLI: https://sapporta.com/docs/reference/cli/overview-and-global-options/
- Agent data console: https://sapporta.com/docs/guides/discovery/use-the-agent-data-console/
- OpenAPI discovery: https://sapporta.com/docs/guides/discovery/openapi-and-endpoint-discovery/
- Auth and row security: https://sapporta.com/docs/reference/server/auth-and-row-security/

## Direct Dispatch

For app-building work, use `app-building/guide.md` as the mode entrypoint, then use
the matching narrow reference below. Endpoint work starts with
`backend/endpoints.md`; add `backend/domain-code.md` for service organization and make
`backend/typed-errors.md` the mandatory next read when a declared failure can originate
below the route adapter.

### App-Building Tasks

- Tables, columns, relations, indexes, search config, generated schema metadata,
  custom table validation, and semantic table values, including the first
  application tables -> read
  [app-building/tables/create.md](references/app-building/tables/create.md)
- Route-based reports, summaries, ledgers, route/result validation -> read
  [app-building/reports/create.md](references/app-building/reports/create.md)
- Cell links, drill-through, cross-report navigation -> read
  [app-building/reports/linking.md](references/app-building/reports/linking.md)
- Hono sub-apps, `TsRestApi`, ts-rest contracts, route handlers, uploads,
  transactions, atomic parent-detail or line-item writes, OpenAPI registration
  -> read [app-building/backend/endpoints.md](references/app-building/backend/endpoints.md), then follow its
  conditional routes to service organization or typed errors
- Custom React routes, dashboards, forms, record workflows, table/grid views,
  master-detail screens, side panels, row selection, custom cells, or typed API
  clients -> read [app-building/frontend/views.md](references/app-building/frontend/views.md), then
  [app-building/frontend/grids.md](references/app-building/frontend/grids.md) for Grid work
- Domain services, module organization, testable TypeScript workflow code
  outside an endpoint change ->
  read [app-building/backend/domain-code.md](references/app-building/backend/domain-code.md)
- A contract declares an expected non-2xx outcome that a service or store can
  raise below the route adapter -> read
  [app-building/backend/typed-errors.md](references/app-building/backend/typed-errors.md) before implementing the handler

### Existing Data Tasks

- Insert rows, seed data, built-in row commands -> read
  [data-console/row-writes.md](references/data-console/row-writes.md)
- Atomic parent-child data entry, detail rows, line items -> read
  [data-console/master-detail-writes.md](references/data-console/master-detail-writes.md)
- Call report routes, inspect report output, answer data questions -> read
  [data-console/report-runs.md](references/data-console/report-runs.md)
- Compose `/api/tables/<name>` URLs, filters, search, sort, pagination -> read
  [data-console/table-queries.md](references/data-console/table-queries.md)
- Raw SQL fallback when no endpoint, CRUD, or report route fits -> read
  [data-console/sql-fallback.md](references/data-console/sql-fallback.md)
