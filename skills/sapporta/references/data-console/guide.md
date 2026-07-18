# Data Console

Use this workflow when the user wants to work with records in an existing Sapporta
app rather than change the app's code. Prefer the project-local command form:

```bash
pnpm exec sapporta ...
```

Use docs for CLI grammar, target selection, token setup, table/query syntax, and
recipes:

- Agent data console: https://sapporta.com/docs/guides/discovery/use-the-agent-data-console/
- CLI workflow: https://sapporta.com/docs/guides/discovery/use-the-sapporta-cli/
- Agent access: https://sapporta.com/docs/guides/security/agent-access-and-scoped-tokens/
- CLI commands: https://sapporta.com/docs/reference/cli/overview-and-global-options/

## Contents

- [Required Preflight](#required-preflight)
- [Discover Before Acting](#discover-before-acting)
- [Answer Data Questions](#answer-data-questions)
- [Change Data Safely](#change-data-safely)
- [Data Safety Rules](#data-safety-rules)
- [Read The Narrow Reference](#read-the-narrow-reference)

## Required Preflight

For API-backed CLI commands, verify the selected app server is reachable:

```bash
pnpm exec sapporta endpoints list
pnpm exec sapporta tables list
```

If a command fails with `APP_SERVER_UNREACHABLE`, follow the CLI message before
diagnosing app, auth, or schema behavior. If the project uses a non-default API
port, pass `--api-url <url>`.

If a protected data command returns `unauthenticated`, `token_expired`,
`token_revoked`, or `workspace_required`, read
[server-access.md](server-access.md), stop data
work, and ask the user to create or replace the agent access token. Do not
silently bypass protected app APIs with direct SQLite or local database access
for workspace-user answers or mutations.

## Discover Before Acting

Start with discovery before composing requests or mutating data:

```bash
pnpm exec sapporta endpoints list
pnpm exec sapporta endpoints show "METHOD /api/path"
pnpm exec sapporta tables list
pnpm exec sapporta tables show <name>
pnpm exec sapporta tables sample <name>
```

The CLI can inspect app-owned routes with `endpoints list` and
`endpoints show`, and can invoke arbitrary endpoints with
`api get/post/put/delete`. Use `curl` or a typed client when that is more
convenient for the route.

## Answer Data Questions

Prefer the highest-level app feature that answers the question:

1. Existing report endpoint.
2. Built-in table list endpoint when filters/search/pagination fit.
3. Existing domain endpoint when it exposes the needed read.
4. Read-only SQL through `sapporta sql query` when no report or endpoint
   answers the question cleanly.

Report results back with provenance: name the report, table endpoint, domain
endpoint, or SQL path used. State date parameters, filters, workspace, and row
limits that affect the answer. If repeated ad-hoc SQL would be useful to users,
suggest creating a route-based report.

## Change Data Safely

Only mutate data when the user asked for a data change. Use the highest fitting
option:

1. Existing custom product/domain endpoint from `sapporta endpoints list/show`.
2. Built-in row commands: `sapporta rows create/update/delete`.
3. Raw SQL fallback after reading [sql-fallback.md](sql-fallback.md).

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
- Omit system-managed `workspace_id`, `workspaceId`,
  `scoped_to_user_id`, and `scopedToUserId`.
- Do not use raw SQL to simulate another workspace/user's visibility.
- Prefer built-in row commands for ordinary row creation because they run the
  app's normal save behavior.
- Keep writes scoped to the specific records the user asked to change.

## Read The Narrow Reference

- Insert rows or seed flat data -> read
  [row-writes.md](row-writes.md)
- Insert parent and child records atomically -> read
  [master-detail-writes.md](master-detail-writes.md)
- Call existing report routes or answer data questions -> read
  [report-runs.md](report-runs.md)
- Call generated table HTTP routes or compose their filters, search, sort, and
  pagination -> read
  [table-queries.md](table-queries.md)
- Raw SQL fallback reads or writes -> read
  [sql-fallback.md](sql-fallback.md)
