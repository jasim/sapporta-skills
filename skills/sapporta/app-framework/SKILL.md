---
name: app-framework
description: >
  Use when the user wants to change a Sapporta application's code: define
  tables in TypeScript, add reports, add report links, build custom backend
  endpoints, share request/response contracts, build React views, handle auth
  row ownership, organize domain workflows, or validate app changes.
---

# App Framework Workflow

Use this mode when the user wants to build or change how a Sapporta app behaves.
Read the narrow skill for the specific thing being changed.

## Where To Work

- Tables -> `packages/api/schema/`
- Reports -> shared contract, backend route, frontend screen, navigation, tests
- Backend workflows/endpoints -> `packages/shared/src/contracts/` plus
  `packages/api/app/`
- Larger backend workflows -> `packages/api/modules/<domain>/`
- Custom pages, forms, table/grid workflows -> `packages/frontend/src/`

Docs:

- LLM-assisted engineering: https://sapporta.com/docs/tools-and-operations/llm-assisted-engineering/
- Data modeling: https://sapporta.com/docs/subsystems/data-modeling/
- Custom endpoints: https://sapporta.com/docs/subsystems/custom-api-endpoints/
- Reports: https://sapporta.com/docs/subsystems/reports/
- Frontend screens: https://sapporta.com/docs/subsystems/frontend-screens/

## Before Writing Code

Inspect the existing app before editing:

```bash
pnpm exec sapporta tables
pnpm exec sapporta describe
```

Prefer the project's existing style. Do not create custom code for behavior
already covered by built-in table APIs or an existing domain endpoint unless the
product workflow actually needs custom behavior.

## Built-In APIs Or Custom Code

Use built-in table APIs for ordinary list, get, create, update, delete, lookup,
count, and export behavior. Build custom app code for reports, multi-table
workflows, custom validation, file uploads, custom response shapes, and business
transactions.

Custom endpoints should use shared ts-rest contracts. The same contract drives
request validation, typed handler inputs, OpenAPI emission, `sapporta describe`,
and typed frontend clients.

For larger features, keep route files thin. Put workflow orchestration in
services and database reads/writes in module `db/` stores under
`packages/api/modules/<domain>/`.

## Auth And Row Scope

Resolve auth at the route edge with the narrowest ability/data-authority helper
for the workflow. Then use `scopedRows()` or `auth.rowSecurity.forTable(table)`.

Do not manually stamp or filter `workspace_id`, `workspaceId`,
`scoped_to_user_id`, or `scopedToUserId`. Do not mutate scoped rows by primary
key alone, insert `request.body` directly into scoped tables, or fetch broadly
and filter row ownership in JavaScript.

Docs:

- Authorization: https://sapporta.com/docs/subsystems/authorization/
- Auth and row security: https://sapporta.com/docs/reference/auth-and-row-security/

## Validation

Use the smallest loop that proves the change:

```bash
pnpm --filter ./packages/api db:generate
pnpm --filter ./packages/api db:migrate
pnpm dev
pnpm exec sapporta describe "METHOD /api/path"
```

For frontend changes, run the project's frontend checks or tests when available.
For native module failures, binding errors, or dev-server startup failures, read
troubleshooting before trying broad dependency changes.

## Read The Narrow Skill

- Tables, columns, relations, indexes, search config, schema migration -> read
  [../table-creation/SKILL.md](../table-creation/SKILL.md)
- Route-based reports, summaries, ledgers, route/result validation -> read
  [../report-creation/SKILL.md](../report-creation/SKILL.md)
- Cell links, drill-through, cross-report navigation -> read
  [../report-linking/SKILL.md](../report-linking/SKILL.md)
- Domain endpoints, `TsRestApi`, shared contracts, handlers, uploads,
  transactions, OpenAPI registration -> read [../app/SKILL.md](../app/SKILL.md)
- Custom React routes, dashboards, forms, table/grid views, typed API clients ->
  read [../frontend/SKILL.md](../frontend/SKILL.md)
- Domain services, module organization, testable TypeScript workflow code ->
  read [../user-code/SKILL.md](../user-code/SKILL.md)
- Deep workflow failures and typed HTTP status/body mapping -> read
  [../user-code/typed-errors/SKILL.md](../user-code/typed-errors/SKILL.md)
- Native module or `better-sqlite3` failures -> read
  [../troubleshooting/SKILL.md](../troubleshooting/SKILL.md)
