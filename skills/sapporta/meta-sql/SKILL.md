---
name: meta-sql
description: >
  Use only when no Sapporta endpoint, built-in row command, table query, action,
  or report covers the user's data task. Runs raw SQL directly against the app
  database with `sapporta db exec-sql "<sql>"`.
---

# Meta SQL — Fallback Direct SQL Access

This skill is a **fallback**. Reach for it only after confirming that no
endpoint, row command, report, or table query covers the task:

1. Discovered project/domain endpoints (`sapporta describe`).
2. Built-in row CRUD (`sapporta rows insert/update/delete`).
3. Built-in reports (`sapporta reports run ...`).

If one of the above fits, use it. Raw SQL is the last rung of the ladder.

## One command, auto-dispatched

`sapporta db exec-sql` accepts any single statement. The runner asks better-sqlite3 whether the prepared statement returns rows:

- **Returns rows** (SELECT, WITH, PRAGMA, EXPLAIN) → rows are returned, `limit` applies.
- **No rows** (INSERT/UPDATE/DELETE/DDL) → statement runs, response reports `rowCount`; `dryRun` uses EXPLAIN QUERY PLAN to validate without executing.

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

Prefer `--input-body-json` when you need `limit` or `dryRun`; positional is fine for quick reads.

## Why it's a fallback for writes

Raw SQL bypasses Sapporta's validation and save pipeline. For mutations you are on your own for:

- Auto-managed columns (`id`, `created_at`, `updated_at`) — no defaults filled in; `NOT NULL` on these will reject your insert.
- Column defaults declared in the schema — not applied.
- Table-specific save hooks, derived fields, and cross-column validations — not run.
- Input coercion and type normalization — not performed.

For ordinary row creation in a known table, prefer `sapporta rows insert <table> --data ...` — it runs the full save pipeline.

## Limitations

- Single statement only — no multi-statement transactions (`BEGIN; ...; COMMIT;`). For atomic multi-step inserts, use [master-detail-insertion](../master-detail-insertion/SKILL.md).
- Dangerous statements (`DROP DATABASE`, `TRUNCATE`, `DROP SCHEMA`) are rejected.

## Input schema

Call `sapporta describe "POST /api/meta/sql"` for the exact input/response schemas.
