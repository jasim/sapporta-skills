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
- Agent workflow overview: https://sapporta.com/docs/tools-and-operations/llm-assisted-engineering/
- API/tool choice guide: https://sapporta.com/docs/tools-and-operations/choose-apis-and-tools/
- Reference index: https://sapporta.com/docs/reference/

Prefer the project-local CLI:

```bash
pnpm exec sapporta ...
```

## Choose The Right Mode

Decide whether the user wants to change app code or operate on existing data.

- Build or change app behavior: tables, reports, report links, custom
  endpoints, shared contracts, frontend views, auth-aware workflows, or
  validation loops -> read [app-framework.md](references/app-framework.md).
- Inspect, query, insert, update, validate, or answer questions from records
  already in the app -> read [data-console.md](references/data-console.md).
- Native module binding failures, `better-sqlite3`, install/dev-server errors
  -> read [troubleshooting.md](references/troubleshooting.md).

Some tasks touch both modes: build a report route and screen with
`app-framework`, then call the report endpoint and inspect the numbers with
`data-console`.

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
  [table-creation.md](references/table-creation.md). It routes to the canonical
  worked schema example and exact references.
- For API-backed data commands, pass `--api-url <url>` when the app API is not
  on `http://localhost:3000`; pass `--api-token <token>` when the app is
  protected. If auth fails, read the CLI access reference before continuing.
- The CLI can inspect app-owned routes with `endpoints list` and
  `endpoints show`, and can invoke app endpoints with
  `api get/post/put/delete`. Use `curl` or a typed client when that is more
  convenient for the route.
- Apply auth scope on the server. Built-in endpoints apply row visibility;
  custom code must choose route-edge ability/data authority and use scoped row
  helpers.
- Raw SQL is a fallback. In app code, contain it in store/db modules with a
  justification. In data-console work, treat it as admin/debug inspection unless
  the user explicitly asked for maintenance SQL.

Reference docs:

- CLI: https://sapporta.com/docs/reference/cli/
- Agent data console: https://sapporta.com/docs/tools-and-operations/agent-data-console/
- OpenAPI discovery: https://sapporta.com/docs/subsystems/openapi-and-discovery/
- Auth and row security: https://sapporta.com/docs/reference/auth-and-row-security/

## Direct Dispatch

### App-Building Tasks

- Tables, columns, relations, indexes, search config, and generated schema
  metadata, including the first application tables -> read
  [table-creation.md](references/table-creation.md)
- Route-based reports, summaries, ledgers, route/result validation -> read
  [report-creation.md](references/report-creation.md)
- Cell links, drill-through, cross-report navigation -> read
  [report-linking.md](references/report-linking.md)
- Hono sub-apps, `TsRestApi`, ts-rest contracts, route handlers, uploads,
  transactions, atomic parent-detail or line-item writes, OpenAPI registration
  -> read [app-endpoints.md](references/app-endpoints.md)
- Custom React routes, dashboards, forms, table/grid views, typed API client ->
  read [frontend.md](references/frontend.md)
- Domain services, module organization, testable TypeScript workflow code ->
  read [user-code.md](references/user-code.md)
- Deep workflow failures, typed HTTP errors, status/body mapping -> read
  [typed-errors.md](references/typed-errors.md)

### Existing Data Tasks

- Insert rows, seed data, built-in row commands -> read
  [row-insertion.md](references/row-insertion.md)
- Atomic parent-child data entry, detail rows, line items -> read
  [master-detail-insertion.md](references/master-detail-insertion.md)
- Call report routes, inspect report output, answer data questions -> read
  [report-execution.md](references/report-execution.md)
- Compose `/api/tables/<name>` URLs, filters, search, sort, pagination -> read
  [table-querying.md](references/table-querying.md)
- Raw SQL fallback when no endpoint, CRUD, or report route fits -> read
  [meta-sql.md](references/meta-sql.md)
