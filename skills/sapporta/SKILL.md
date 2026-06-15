---
name: sapporta
description: >
  Use when the user is working in a Sapporta project or asks to change tables,
  add reports, add endpoints, build frontend views, organize backend workflows,
  inspect data, enter records, call report routes, create a new Sapporta project
  from scratch, troubleshoot better-sqlite3, or use the `sapporta` CLI. Start
  here to choose between changing the app's code and working with records.
---

## What Sapporta Gives The App Builder

Sapporta is a TypeScript library for database-backed apps. A Sapporta project
gives the application builder:

- TypeScript files for defining database tables, columns, relationships,
  display metadata, search behavior, and row ownership.
- Built-in table APIs for listing, filtering, creating, updating, and deleting
  records.
- Route-based report APIs and React report screens for ledgers, summaries,
  statements, and structured data views.
- Custom endpoints for product workflows that need business rules, file
  uploads, atomic database changes, or custom response shapes.
- Custom React views that fit alongside the built-in admin UI.
- An OpenAPI document that `sapporta describe`, the frontend client, and API
  tooling use to see the current app.

The usual places to work are:

- `packages/api/schema/` for table definitions.
- `packages/shared/src/contracts/`, `packages/api/app/`, and
  `packages/frontend/src/` for report routes and screens.
- `packages/api/app/` for custom backend endpoints.
- `packages/shared/src/contracts/` for request/response contracts shared by
  backend, OpenAPI, and frontend code.
- `packages/frontend/src/` for custom React pages.

Prefer the project-local CLI:

```bash
pnpm exec sapporta ...
```

The CLI is both a discovery tool and a data console for a selected running app.
It can inspect endpoints, list and describe tables, sample rows,
insert/update/delete rows, execute raw SQL fallback commands, and run checks.

For protected or non-local apps, keep the top-level context small and read the
CLI access details only when needed:
[data-console/references/cli-server-access.md](data-console/references/cli-server-access.md).

## Choose The Right Mode

Decide what the user is trying to do before loading detailed context.

- The user wants to build or change app behavior: tables, reports, links,
  custom endpoints, shared contracts, frontend views, auth-aware workflows, or
  validation loops -> read
  [app-framework/SKILL.md](app-framework/SKILL.md).
- The user wants to inspect, query, insert, update, report on, validate, or
  answer questions from records already in the app -> read
  [data-console/SKILL.md](data-console/SKILL.md).

Some tasks touch both: build a report route and screen with `app-framework`,
then call the report endpoint and inspect numbers with `data-console`.

## Rules That Prevent Wrong Work

- Work in the local Sapporta project rooted at `cwd` or the nearest
  `sapporta.json`.
- Framework table/meta APIs and custom app APIs, including report routes, are
  served under `/api/...`; health checks and frontend/static routes can live
  outside `/api`.
- Prefer `pnpm exec sapporta ...` over a global `sapporta` binary.
- Use `sapporta describe` to discover existing endpoints before adding code or
  composing requests.
- For API-backed commands, set `SAPPORTA_API_URL` when the app is not on
  `http://localhost:3000`; set `SAPPORTA_API_TOKEN` when the app is protected.
- The CLI cannot invoke user-defined HTTP endpoints directly; call them with
  `curl` or another HTTP client against the selected app URL.
- Apply auth scope on the server. Built-in endpoints apply row visibility;
  custom code must choose the route's ability/data authority and then use
  scoped row helpers; raw SQL bypasses those helpers and is only a fallback.
- Raw SQL is a fallback, not the default mutation path.

## Creating New Projects

When the user asks to create or scaffold a new Sapporta project, follow
[references/project-creation.md](references/project-creation.md).

## Direct Dispatch

- Create, scaffold, or initialize a new Sapporta project from scratch -> read
  [references/project-creation.md](references/project-creation.md)
- Define/change tables, domain code, reports, report links, frontend routes,
  custom endpoints, auth-scoped workflows -> read
  [app-framework/SKILL.md](app-framework/SKILL.md)
- Existing records, business questions, table samples, report output, built-in
  row commands, SQL fallback -> read
  [data-console/SKILL.md](data-console/SKILL.md)
- Native module binding failures, `better-sqlite3`, install/dev-server errors
  -> read [troubleshooting/SKILL.md](troubleshooting/SKILL.md)

## Specific Task Skills

### App-Building Tasks

- Tables, columns, relations, indexes, search config, and generated schema
  metadata -> read
  [table-creation/SKILL.md](table-creation/SKILL.md)
- Route-based reports, summaries, ledgers, route/result validation -> read
  [report-creation/SKILL.md](report-creation/SKILL.md)
- Row links, cell links, drill-through, cross-report navigation -> read
  [report-linking/SKILL.md](report-linking/SKILL.md)
- Hono sub-apps, `TsRestApi`, ts-rest contracts, route handlers, uploads,
  atomic database changes, OpenAPI registration -> read [app/SKILL.md](app/SKILL.md)
- Custom React routes, dashboards, forms, table/grid views, `@sapporta/ui`,
  typed API client ->
  read [frontend/SKILL.md](frontend/SKILL.md)
- Domain services, module organization, testable TypeScript workflow code ->
  read [user-code/SKILL.md](user-code/SKILL.md)
- Deep workflow failures, typed HTTP errors, status/body mapping -> read
  [user-code/typed-errors/SKILL.md](user-code/typed-errors/SKILL.md)

### Existing Data Tasks

- Insert rows, seed data, built-in row commands -> read
  [row-insertion/SKILL.md](row-insertion/SKILL.md)
- Atomic parent-child data entry, detail rows, line items -> read
  [master-detail-insertion/SKILL.md](master-detail-insertion/SKILL.md)
- Call report routes, inspect report output, answer data questions -> read
  [report-execution/SKILL.md](report-execution/SKILL.md)
- Compose `/api/tables/<name>` URLs, filters, search, sort, pagination -> read
  [table-querying/SKILL.md](table-querying/SKILL.md)
- Raw SQL fallback when no endpoint, CRUD, or report route fits -> read
  [meta-sql/SKILL.md](meta-sql/SKILL.md)
