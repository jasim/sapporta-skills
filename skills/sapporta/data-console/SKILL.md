---
name: data-console
description: >
  Use when the user wants to inspect existing Sapporta data, answer questions
  from records, sample tables, call report routes, insert or update rows, call
  existing endpoints with curl, or use `sapporta` CLI commands against a
  running app.
---

# Data Console

Use this skill when the user wants to work with records in an existing Sapporta
app rather than change the app's code. Prefer the project-local command form:

```bash
pnpm exec sapporta ...
```

Use docs for CLI grammar, target selection, token setup, table/query syntax, and
recipes:

- Agent data console: https://sapporta.com/docs/tools-and-operations/agent-data-console/
- Agent data console recipes: https://sapporta.com/docs/tools-and-operations/agent-data-console-recipes/
- Agent access: https://sapporta.com/docs/tools-and-operations/agent-access/
- CLI reference: https://sapporta.com/docs/reference/cli/

## Required Preflight

For API-backed CLI commands, verify the selected app server is reachable:

```bash
pnpm exec sapporta describe
pnpm exec sapporta tables
```

If a command fails with `APP_SERVER_UNREACHABLE`, follow the CLI message before
diagnosing app, auth, or schema behavior. If the project uses a non-default API
port, set `SAPPORTA_API_URL` or pass `--api-url`.

If a protected data command returns `unauthenticated`, `token_expired`,
`token_revoked`, or `workspace_required`, read
[references/cli-server-access.md](references/cli-server-access.md), stop data
work, and ask the user to create or replace the agent access token. Do not
silently bypass protected app APIs with direct SQLite or local database access
for workspace-user answers or mutations.

## Discover Before Acting

Start with discovery before composing requests or mutating data:

```bash
pnpm exec sapporta describe
pnpm exec sapporta describe "METHOD /api/path"
pnpm exec sapporta tables
pnpm exec sapporta tables show <name>
pnpm exec sapporta tables sample <name>
```

The CLI can inspect app-owned routes with `describe`, but it does not invoke
arbitrary user-defined endpoints. Call those routes with `curl`, a typed client,
or another HTTP client against the selected app URL.

## Answer Data Questions

Prefer the highest-level app feature that answers the question:

1. Existing report endpoint.
2. Built-in table list endpoint when filters/search/pagination fit.
3. Existing domain endpoint when it exposes the needed read.
4. Read-only SQL through `sapporta db exec-sql` when no report or endpoint
   answers the question cleanly.

Report results back with provenance: name the report, table endpoint, domain
endpoint, or SQL path used. State date parameters, filters, workspace, and row
limits that affect the answer. If repeated ad-hoc SQL would be useful to users,
suggest creating a route-based report.

## Change Data Safely

Only mutate data when the user asked for a data change. Use the highest fitting
option:

1. Existing custom product/domain endpoint from `sapporta describe`.
2. Built-in row commands: `sapporta rows insert/update/delete`.
3. Raw SQL fallback after reading [../meta-sql/SKILL.md](../meta-sql/SKILL.md).

Do not recommend reports as mutation surfaces unless the app deliberately
defines a mutating route.

Direct local database inspection is acceptable for app-development or debugging
tasks where you are acting as a developer with repository access. For
data-console answers, treat the running app API as the user's workspace boundary
unless the user explicitly asks for admin/debug inspection.

## Data Safety Rules

- Accept user-provided data as-is; do not silently coerce business values.
- Do not fabricate foreign keys; resolve them from visible app data.
- Respect NOT NULL constraints.
- Omit generated columns such as `id`, `created_at`, and `updated_at`.
- In auth-enabled projects, omit system-managed `workspace_id`, `workspaceId`,
  `scoped_to_user_id`, and `scopedToUserId`.
- Do not use raw SQL to simulate another workspace/user's visibility.
- Prefer built-in row commands for ordinary row creation because they run the
  app's normal save behavior.
- Keep writes scoped to the specific records the user asked to change.

## Read The Narrow Skill

- Insert rows or seed flat data -> read
  [../row-insertion/SKILL.md](../row-insertion/SKILL.md)
- Insert parent and child records atomically -> read
  [../master-detail-insertion/SKILL.md](../master-detail-insertion/SKILL.md)
- Call existing report routes or answer data questions -> read
  [../report-execution/SKILL.md](../report-execution/SKILL.md)
- Compose `/api/tables/<name>` filters, search, sort, pagination -> read
  [../table-querying/SKILL.md](../table-querying/SKILL.md)
- Raw SQL fallback reads or writes -> read
  [../meta-sql/SKILL.md](../meta-sql/SKILL.md)
