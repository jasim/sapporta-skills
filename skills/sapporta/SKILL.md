---
name: sapporta
description: >
  Use when the user is working in a Sapporta project or asks to change tables,
  add reports, add endpoints, build frontend views, organize backend workflows,
  inspect data, enter records, call report routes, create a new Sapporta project
  from scratch, troubleshoot better-sqlite3, or use the `sapporta` CLI. Start
  here to choose between changing the app's code and working with records.
---

# Sapporta Agent Dispatch

Sapporta skills are operating instructions. Use public docs for product
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
  validation loops -> read [app-framework/SKILL.md](app-framework/SKILL.md).
- Inspect, query, insert, update, validate, or answer questions from records
  already in the app -> read [data-console/SKILL.md](data-console/SKILL.md).
- Create or scaffold a new Sapporta project -> read
  [references/project-creation.md](references/project-creation.md).
- Native module binding failures, `better-sqlite3`, install/dev-server errors
  -> read [troubleshooting/SKILL.md](troubleshooting/SKILL.md).

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
- For API-backed data commands, set `SAPPORTA_API_URL` when the app API is not
  on `http://localhost:3000`; set `SAPPORTA_API_TOKEN` when the app is
  protected. If auth fails, read the CLI access reference before continuing.
- The CLI can inspect app-owned routes with `describe`, but it does not invoke
  arbitrary user-defined HTTP endpoints. Call those routes with `curl`, a typed
  client, or another HTTP client.
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
  metadata -> read [table-creation/SKILL.md](table-creation/SKILL.md)
- Route-based reports, summaries, ledgers, route/result validation -> read
  [report-creation/SKILL.md](report-creation/SKILL.md)
- Row links, cell links, drill-through, cross-report navigation -> read
  [report-linking/SKILL.md](report-linking/SKILL.md)
- Hono sub-apps, `TsRestApi`, ts-rest contracts, route handlers, uploads,
  transactions, OpenAPI registration -> read [app/SKILL.md](app/SKILL.md)
- Custom React routes, dashboards, forms, table/grid views, typed API client ->
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
