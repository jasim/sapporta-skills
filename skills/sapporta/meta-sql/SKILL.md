---
name: meta-sql
description: >
  Use only when no Sapporta endpoint, built-in row command, table query, or
  report route covers the user's data task. Runs raw SQL directly against the
  app database with `sapporta db exec-sql "<sql>"`.
---

# Meta SQL — Fallback Direct SQL Access

This skill is a **fallback**. Reach for it only after confirming that no
endpoint, row command, report route, or table query covers the task:

1. Discovered project/domain endpoints (`sapporta describe`).
2. Built-in row CRUD (`sapporta rows insert/update/delete`).
3. Existing report/domain endpoints discovered with `sapporta describe`.

If one of the above fits, use it. Raw SQL is the last rung of the ladder.

## Auth And Row Scope

`sapporta db exec-sql` runs direct SQL against the app database. It does not go
through built-in table handlers, `scopedRows()`, route-edge ability/data
authority helpers, table save hooks, or row-security predicates.

In auth-enabled projects:

- Prefer report routes, table endpoints, row commands, or custom endpoints for
  user-facing reads and writes.
- Treat raw SQL results as database-admin inspection, not as the visibility a
  workspace user would see.
- Do not use raw SQL to compensate for missing auth filters in product code.
  Fix the table `rowScope`, report route, or endpoint instead.
- Never accept `workspace_id`, `workspaceId`, `scoped_to_user_id`, or
  `scopedToUserId` from a client payload and pass them through raw SQL.
- For emergency writes to scoped tables, explicitly document why no scoped API
  fits and verify the target rows belong to the intended workspace/user before
  executing.

## One Command, Auto-Dispatched

`sapporta db exec-sql` prepares the supplied SQL and asks better-sqlite3 whether
the statement returns rows:

- **Returns rows** (SELECT, WITH, PRAGMA, EXPLAIN) -> rows are returned, and
  `limit` applies.
- **No rows** (INSERT/UPDATE/DELETE/DDL) -> the statement runs. The current
  HTTP/CLI response returns the command result data, not write-count metadata.
  `dryRun` uses EXPLAIN QUERY PLAN to validate without executing.

```bash
# Read
sapporta db exec-sql "SELECT id, name FROM accounts WHERE type = 'asset'"

# Read with JSON (for a row cap)
sapporta db exec-sql --input-body-json '{"sql": "SELECT id, name FROM accounts", "limit": 50}'

# Write
sapporta db exec-sql --input-body-json '{"sql": "UPDATE accounts SET name = name WHERE id = 7"}'

# Dry-run a write
sapporta db exec-sql --input-body-json '{"sql": "DELETE FROM accounts WHERE id = 7", "dryRun": true}'
```

Prefer `--input-body-json` when you need `limit` or `dryRun`; positional is fine
for quick reads. Do not rely on request parameter binding for this command:
although the route schema advertises parameter input, the current handler passes
only the SQL string to the runner.

## Why It's A Fallback For Writes

Raw SQL bypasses Sapporta's validation and save pipeline. For mutations you are
on your own for:

- Auto-managed columns (`id`, `created_at`, `updated_at`) — no defaults filled in; `NOT NULL` on these will reject your insert.
- Auth-managed columns (`workspace_id`, `scoped_to_user_id`) — no trusted
  data-authority scope is stamped for you.
- Column defaults declared in the schema — not applied.
- Table-specific save hooks, derived fields, and cross-column validations — not run.
- Input coercion and type normalization — not performed.

For ordinary row creation in a known table, prefer
`sapporta rows insert <table> --data ...` because it runs the full save
pipeline.

## Limitations

- Treat the command as a one-statement escape hatch. Do not use it for
  `BEGIN; ...; COMMIT;` workflows. For atomic multi-step inserts, use
  [master-detail-insertion](../master-detail-insertion/SKILL.md) or app code.
- Dangerous statements (`DROP DATABASE`, `TRUNCATE`, `DROP SCHEMA`) are rejected.

## Input schema

Call `sapporta describe "POST /api/meta/sql"` for the route's advertised
input/response schemas, then follow the current behavior above for fields that
the handler actually uses.
