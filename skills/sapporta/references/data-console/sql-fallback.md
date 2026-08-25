# Meta SQL Fallback

Use raw SQL only after confirming no higher-level surface fits:

1. Report route or existing read/domain endpoint.
2. Built-in `rows count` or table query.
3. Built-in row command for ordinary mutations.
4. Scoped custom report/read endpoint for advanced queries.
5. Custom product/domain endpoint for business actions.
6. SQL fallback.

Docs:

- Agent data console: https://sapporta.com/docs/guides/discovery/use-the-agent-data-console.md
- SQL commands: https://sapporta.com/docs/reference/cli/api-and-sql-commands.md
- Auth and row security: https://sapporta.com/docs/reference/server/auth-and-row-security.md

## Auth And Row Scope

`sapporta sql query` and `sapporta sql execute` run SQL against the app
database through the app API. They do not go through generated table handlers,
`scopedRows()`, route-edge ability/data authority helpers, table save hooks, or
row-security predicates.

- Prefer report routes, table endpoints, row commands, or custom endpoints for
  user-facing reads and writes.
- Treat raw SQL results as database-admin inspection, not workspace-user route
  visibility.
- Do not use raw SQL to compensate for missing auth filters in product code.
- Never accept client-provided `workspace_id`, `workspaceId`,
  `scoped_to_user_id`, or `scopedToUserId` and pass them through raw SQL.
- For emergency writes to scoped tables, document why no scoped API fits and
  verify the target rows belong to the intended workspace/user before executing.

## Command Use

Use `pnpm exec sapporta sql query "<sql>"` for quick read-only inspection. Use
`--params '<json-array>'` for bound parameters and `--limit <number>` for row
limits.

`to_tz_date(column, :zone)` is available here, because the command runs on the
app's own connection; a bare `sqlite3` shell reports `unknown function`. Never
`CREATE INDEX` over it — the framework refuses, and accepting it would leave the
database file writable only by a process that registered the same function.

For risky maintenance SQL, use
`pnpm exec sapporta sql execute "<sql>" --dry-run` first. Treat the command as
a one-statement escape hatch. Do not use it for manual transaction scripts;
write app code or use a supported row/master-detail command.

Raw SQL writes bypass validation, save hooks, default handling, trusted
ownership stamping, and scoped row helpers. Use them only when the user
explicitly requested maintenance/debug SQL and safer surfaces do not fit.
