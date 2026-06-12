---
name: app-framework
description: >
  Use when the user wants to change a Sapporta application's code: define
  tables in TypeScript, add reports, add report links, build custom backend
  endpoints, share request/response contracts, build React views, handle auth
  row ownership, organize domain workflows, or validate app changes.
---

## Use When

Use this mode when the user wants to build or change how a Sapporta app
behaves. App code defines tables, report routes, frontend report pages,
backend workflows, and auth-aware data access. Read the narrow skill for the
specific thing the user wants to change.

## Where To Make Changes

Use the path that matches the application builder's goal:

- Define or change tables -> `packages/api/schema/`
- Add a report -> shared contract, backend route, frontend screen, navigation,
  and route tests
- Add a backend workflow or endpoint -> `packages/shared/src/contracts/` plus
  `packages/api/app/`
- Keep larger backend workflows readable -> `packages/api/modules/<domain>/`
- Add a custom page, form, or table/grid workflow -> `packages/frontend/src/`

## Before Writing Code

Before writing code, inspect the existing app:

```bash
pnpm exec sapporta tables
pnpm exec sapporta describe
```

Then change the narrowest part of the app:

- table changes -> `packages/api/schema/`
- report routes and screens -> `packages/shared/src/contracts/`,
  `packages/api/app/`, and `packages/frontend/src/`
- custom backend endpoints -> `packages/shared/src/contracts/` plus
  `packages/api/app/`
- substantial backend workflows -> `packages/api/modules/<domain>/`
- custom frontend views, including table/grid workflow pages ->
  `packages/frontend/src/`

After changes, validate the thing you touched. Use `sapporta check` for local
project consistency, `pnpm --filter ./packages/api db:generate` after table
definition changes, `pnpm --filter ./packages/api db:migrate` when the
generated migration must be applied, and
`sapporta describe "METHOD /api/path"` to confirm custom endpoints are visible
through OpenAPI. Run app tests when the project has relevant tests.

Prefer the project's existing style over introducing a parallel code shape.
Small apps can keep thin route files directly in `packages/api/app/`; larger
features should move workflow and persistence into domain modules. Do not create
custom code for behavior already covered by built-in table APIs or existing
domain endpoints unless the product workflow needs it.

## Built-In APIs Or Custom Code

Sapporta's built-in APIs cover ordinary table browsing and row creation/edits.
Build reports with the same contract, route, and frontend patterns used for
custom endpoints. Write custom app code when the product needs domain behavior:
reports, multi-table workflows, custom validation, file uploads, custom
response shapes, or business transactions.

Custom endpoints should use shared ts-rest contracts rather than inline route
schemas in `packages/api/app/`. The same contract drives request validation,
typed handler inputs, OpenAPI emission, `sapporta describe`, and typed frontend
client calls.

For larger features, keep route files thin. Put workflow orchestration in
services and database reads/writes in module `db/` stores under
`packages/api/modules/<domain>/`.

## Auth And Row Scope

In auth-enabled projects, resolve the current user and workspace before reading
or mutating scoped rows. Use Sapporta's row-scope metadata, row-access
predicates, guards, and workspace-safe table handlers instead of wiring
workspace filters by hand.

Application code should resolve auth at the route edge with the narrowest
ability/data-authority helper for the workflow, then use scoped row APIs or
row-security guards. Do not manually stamp or filter `workspace_id`,
`workspaceId`, `scoped_to_user_id`, or `scopedToUserId`. Do not mutate scoped
rows by primary key alone, insert `request.body` directly into scoped tables, or
fetch broadly and filter row ownership in JavaScript.

## Validation

Use the smallest validation loop that proves the change:

```bash
pnpm exec sapporta check
pnpm --filter ./packages/api db:generate
pnpm --filter ./packages/api db:migrate
pnpm exec sapporta describe "METHOD /api/path"
```

For frontend changes, also run the project's frontend checks or tests when
available. For native module failures, binding errors, or dev-server startup
failures, read troubleshooting before trying broad dependency changes.

## Read The Narrow Skill

- Tables, columns, relations, indexes, search config, schema migration -> read
  [../table-creation/SKILL.md](../table-creation/SKILL.md)
- Route-based reports, summaries, ledgers, route/result validation -> read
  [../report-creation/SKILL.md](../report-creation/SKILL.md)
- Row links, cell links, drill-through, cross-report navigation -> read
  [../report-linking/SKILL.md](../report-linking/SKILL.md)
- Domain endpoints, Hono sub-apps, `TsRestApi`, shared contracts, handlers,
  uploads, transactions, OpenAPI registration -> read
  [../app/SKILL.md](../app/SKILL.md)
- Custom React routes, dashboards, forms, table/grid views, `@sapporta/ui`,
  typed API client ->
  read [../frontend/SKILL.md](../frontend/SKILL.md)
- Domain services, module organization, testable TypeScript workflow code ->
  read [../user-code/SKILL.md](../user-code/SKILL.md)
- Deep workflow failures and typed HTTP status/body mapping -> read
  [../user-code/typed-errors/SKILL.md](../user-code/typed-errors/SKILL.md)
- Native module or `better-sqlite3` failures -> read
  [../troubleshooting/SKILL.md](../troubleshooting/SKILL.md)
