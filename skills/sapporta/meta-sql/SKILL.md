---
name: meta-sql
description: >
  Use only when no Sapporta endpoint, built-in row command, table query, or
  report route covers the user's data task. Runs raw SQL directly against the
  app database with `sapporta db exec-sql "<sql>"`.
---

# Meta SQL Fallback

Use raw SQL only after confirming no higher-level surface fits:

1. Report route or existing read/domain endpoint.
2. Built-in table query.
3. Built-in row command for ordinary mutations.
4. Custom product/domain endpoint for business actions.
5. SQL fallback.

Docs:

- Agent data console: https://sapporta.com/docs/tools-and-operations/agent-data-console/
- Agent data console recipes: https://sapporta.com/docs/tools-and-operations/agent-data-console-recipes/
- Auth and row security: https://sapporta.com/docs/reference/auth-and-row-security/

## Auth And Row Scope

`sapporta db exec-sql` runs direct SQL against the app database. It does not go
through generated table handlers, `scopedRows()`, route-edge ability/data
authority helpers, table save hooks, or row-security predicates.

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

Use `pnpm exec sapporta db exec-sql` for quick read-only inspection. Use the
documented JSON body form when you need fields such as `limit` or `dryRun`.

For risky maintenance SQL, dry-run first when supported. Treat the command as a
one-statement escape hatch. Do not use it for manual transaction scripts; write
app code or use a supported row/master-detail command.

Raw SQL writes bypass validation, save hooks, default handling, trusted
ownership stamping, and scoped row helpers. Use them only when the user
explicitly requested maintenance/debug SQL and safer surfaces do not fit.
