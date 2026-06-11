---
name: data-console
description: >
  Use when the user wants to inspect existing Sapporta data, answer questions
  from records, sample tables, run reports, insert or update rows, call existing
  endpoints with curl, or use `sapporta` CLI commands against a running app.
---

## Use When

Use this skill when the user wants to work with records in an existing Sapporta
app rather than change the app's code. The Sapporta CLI acts as a console over
the selected running app and database: it can discover endpoints, list tables,
sample data, run reports, insert, update, or delete rows through built-in row
commands, and run raw SQL only as a fallback.

Prefer the project-local command form:

```bash
pnpm exec sapporta ...
```

## Required Preflight

For API-backed CLI commands in an existing project, verify that the selected app
server is reachable. `check` and `init` are local commands; `describe` reads the
live OpenAPI document, and table/report/row commands talk to the app API.

```bash
pnpm exec sapporta describe
pnpm exec sapporta tables
```

If `sapporta describe` fails because the server is unreachable, stop and ask the
user to start the dev server, or ask for confirmation to start it yourself. If
the project uses a non-default port, set `SAPPORTA_API_URL` consistently or pass
`--api-url`. If the app is protected, set `SAPPORTA_API_TOKEN` or pass
`--api-token`.

For remote apps, protected apps, token failures, and custom-endpoint `curl`
patterns, read
[references/cli-server-access.md](references/cli-server-access.md) only when the
task needs that detail.

## Discover Before Acting

Start with discovery before composing requests or mutating data:

```bash
pnpm exec sapporta describe
pnpm exec sapporta describe "METHOD /api/path"
pnpm exec sapporta tables
pnpm exec sapporta tables show <name>
pnpm exec sapporta tables sample <name>
pnpm exec sapporta reports
pnpm exec sapporta reports show <report-name>
```

`sapporta describe` is the source of truth for endpoint schemas, including
built-ins and user-defined routes from `packages/api/app/`. The CLI cannot
invoke user-defined HTTP endpoints directly; after describing them, call those
routes with `curl` or another HTTP client against the selected app URL.

## Answer Data Questions

Prefer the highest-level app feature that answers the question:

1. Run a relevant existing report.
2. Query the built-in table list endpoint when filters/search/pagination fit.
3. Use read-only SQL through `sapporta db exec-sql` when no report or table
   endpoint answers the question cleanly.

When repeated ad-hoc SQL would be useful to users, suggest creating a report
instead of leaving the workflow as one-off SQL.

Report results back with enough provenance for the user to trust the answer:
name the report, table endpoint, domain endpoint, or SQL query path used. If a
number depends on a date parameter, filter, workspace, or row limit, state that
constraint. If the app does not expose the data needed to answer
cleanly, say so and choose the least invasive fallback.

## Change Data Safely

For data changes, use the highest fitting option:

1. Existing project/domain endpoint from `sapporta describe`
2. Built-in row commands: `sapporta rows insert/update/delete`
3. Existing reports or custom endpoints when they match the workflow
4. Raw SQL fallback after reading [../meta-sql/SKILL.md](../meta-sql/SKILL.md)

Raw SQL writes bypass application behavior and normal row-save validation, so
use them only when no endpoint, row command, or report fits.
In auth-enabled projects, raw SQL also bypasses normal row-access helpers; read
[../meta-sql/SKILL.md](../meta-sql/SKILL.md) before using it for scoped tables.

## Core CLI Commands

```bash
pnpm exec sapporta describe
pnpm exec sapporta describe "METHOD /api/path"
pnpm exec sapporta tables
pnpm exec sapporta tables show <name>
pnpm exec sapporta tables sample <name>
pnpm exec sapporta rows insert <table> --data '[{...}]'
pnpm exec sapporta reports
pnpm exec sapporta reports show <report-name>
pnpm exec sapporta reports run <report-name> --as_of_date 2026-05-25
pnpm exec sapporta db exec-sql "SELECT ..."
```

Commands with request bodies can accept `--input-body-json` with one JSON
object matching the endpoint input schema. Row and table mutation commands may
also expose route-specific shorthand such as `--data`.

## Data Safety Rules

- Accept user-provided data as-is; do not silently coerce business values.
- Do not fabricate foreign keys; look them up.
- Respect NOT NULL constraints.
- Omit generated columns such as `id`, `created_at`, and `updated_at`.
- In auth-enabled projects, omit system-managed `workspace_id`, `workspaceId`,
  `scoped_to_user_id`, and `scopedToUserId`.
- Do not use raw SQL to simulate another workspace/user's visibility; use an
  appropriate token, built-in endpoint, report, or scoped custom endpoint.
- Prefer built-in row commands for ordinary row creation because they run the
  app's normal save behavior.
- Keep writes scoped to the specific records the user asked to change.

## Read The Narrow Skill

- Insert rows or seed flat data -> read
  [../row-insertion/SKILL.md](../row-insertion/SKILL.md)
- Insert parent and child records atomically -> read
  [../master-detail-insertion/SKILL.md](../master-detail-insertion/SKILL.md)
- Run existing reports or answer data questions -> read
  [../report-execution/SKILL.md](../report-execution/SKILL.md)
- Compose `/api/tables/<name>` filters, search, sort, and pagination -> read
  [../table-querying/SKILL.md](../table-querying/SKILL.md)
- Raw SQL fallback reads or writes -> read
  [../meta-sql/SKILL.md](../meta-sql/SKILL.md)
