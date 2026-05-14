---
name: sapporta
description: >
  Use for Sapporta projects: schema-as-code tables, auto-generated CRUD,
  hierarchical reports, Hono sub-apps in `src/app/`, frontend views, data
  insertion, CLI workflows, and native-module troubleshooting.
---

# Sapporta

Sapporta is a TypeScript library for database-backed applications. Domain code
lives in `src/app/`; schemas live in `src/schema/`; shared ts-rest contracts live
in `shared/src/contracts/`. Prefer the project-local CLI:

```bash
pnpm exec sapporta ...
```

## Non-Negotiables

- Work only in the local Sapporta project rooted at `cwd` or the nearest `sapporta.json`.
- Treat https://github.com/jasim/sapporta and the checked-in Sapporta dependency as the framework/CLI provenance anchor.
- Every route is mounted under `/api/...`. Any bare or root `/<name>/...` paths will 404.
- The CLI cannot invoke user-defined HTTP endpoints; call those with localhost `curl`.
- All Sapporta CLI commands require network permission because the CLI does
  almost everything by talking to the local dev server, whose liveness is
  verified in preflight.
- Use `sapporta describe` to see the application's existing endpoints; prefer them over writing new code.

## Required Preflight

Before any `pnpm exec sapporta ...` or `sapporta ...` command in an existing
project, verify the dev server. This `curl` request requires network permission
to succeed:

```bash
curl -fsS "${SAPPORTA_API_URL:-http://localhost:3000}/api/openapi.json" >/dev/null
```

If the probe fails, stop. Tell the user the Sapporta dev server is required and ask them to start `pnpm dev`, or ask for confirmation to start it yourself. If using a non-default port, set `PORT` for the dev server and consistently set `SAPPORTA_API_URL` or pass `--api-url`.

Then discover the project:

```bash
pnpm exec sapporta meta tables
pnpm exec sapporta describe
```

Drill into relevant endpoints before composing requests:

```bash
pnpm exec sapporta describe "METHOD /api/path"
```

`sapporta describe` is the source of truth for endpoint schemas, including built-ins and user-defined routes from `src/app/`.

## Mutation Ladder

For data changes, use the highest fitting option:

1. Existing project/domain endpoint from `sapporta describe`
2. Built-in table CRUD: `sapporta tables add-row/update/delete`
3. Built-in reports/actions
4. Raw SQL fallback: read [meta-sql/SKILL.md](meta-sql/SKILL.md) first

## Routing

### Schema & Data

- Tables, columns, modeling, schema sync, search config -> read
  [table-creation/SKILL.md](table-creation/SKILL.md)
- Table list API, filters, sort, pagination, search, 400s from `/api/tables/*`
  -> read [table-querying/SKILL.md](table-querying/SKILL.md)
- Insert rows or seed flat data -> read
  [row-insertion/SKILL.md](row-insertion/SKILL.md)
- Insert parent and children atomically -> read
  [master-detail-insertion/SKILL.md](master-detail-insertion/SKILL.md)
- Raw SQL reads or writes when no endpoint, CRUD, or report fits -> read
  [meta-sql/SKILL.md](meta-sql/SKILL.md)

### App Code

- Hono sub-apps, ts-rest contracts, handlers, uploads, DB access, OpenAPI
  registration -> read [app/SKILL.md](app/SKILL.md)
- Typed workflow errors and HTTP status mapping -> read
  [user-code/SKILL.md](user-code/SKILL.md)

### Frontend

- Custom React views using `@sapporta/ui` -> read
  [frontend/SKILL.md](frontend/SKILL.md)

### Reports

- Create reports -> read [report-creation/SKILL.md](report-creation/SKILL.md)
- Report links and drill-through -> read
  [report-linking/SKILL.md](report-linking/SKILL.md)
- Run reports or ad-hoc report queries -> read
  [report-execution/SKILL.md](report-execution/SKILL.md)

### Troubleshooting

- Native module errors, `better-sqlite3` binding failures -> read
  [troubleshooting/SKILL.md](troubleshooting/SKILL.md)

## Core Commands

```bash
pnpm exec sapporta describe
pnpm exec sapporta describe "METHOD /api/path"
pnpm exec sapporta meta tables
pnpm exec sapporta meta tables show <name>
pnpm exec sapporta meta tables sample <name>
pnpm exec sapporta tables add-row <table> --data '[{...}]'
pnpm exec sapporta reports
pnpm exec sapporta reports run <name> --data '{...}'
pnpm exec sapporta meta schema sync
```

Any command can accept `--json` with one JSON object matching its input schema.

## Data Rules

- Accept data as-is; do not coerce types.
- Do not fabricate foreign keys; look them up.
- Respect NOT NULL constraints.
- Omit generated columns such as `id`, `created_at`, and `updated_at`.
- Tables are schema-as-code TypeScript files; apply changes with
  `sapporta meta schema sync`.
