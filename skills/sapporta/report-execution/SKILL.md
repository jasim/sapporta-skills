---
name: report-execution
description: >
  Use when the user wants to run Sapporta reports, see report output, check
  numbers, or answer questions from existing app data with reports, table
  queries, or SQL inspection.
---

# Report Execution

## Decision: existing report or ad-hoc query?

1. **Check for an existing report** -- `sapporta reports`
2. If a match exists, **execute it** with parameters.
3. If not, **run SQL inspection** -- `sapporta db exec-sql "SELECT ..."`.

## Running an existing report

```bash
# 1. List reports
sapporta reports
# 2. Inspect params
sapporta reports show <report-name>
# 3. Execute
sapporta reports run <report-name> --as_of_date 2024-12-31
```

- Required params must be included; optional params use defaults.
- Dates as ISO strings (`"2024-12-31"`).
- In auth-enabled projects, the built-in report route authenticates the
  request, but report SQL must still be written or wrapped to preserve the
  same workspace/user visibility as the table APIs.

## Ad-hoc queries

When no report covers the question, use `SELECT` or `WITH` SQL against the current local Sapporta project:

```bash
sapporta db exec-sql "SELECT ..."
# or, to pass a row cap:
sapporta db exec-sql --input-body-json '{"sql": "SELECT ...", "limit": 100}'
```

`sapporta db exec-sql` is raw database access and can execute writes. For this
skill, use it only for inspection queries unless the user explicitly asks for a
data change. In auth-enabled projects it does not represent a workspace user's
table/report visibility unless the query explicitly follows the same
server-side row-security rules. Prefer existing reports and table endpoints for
user-facing answers; use SQL inspection as admin/debug work and say so in the
answer.

This skill is about reads. For mutations, use the relevant mutation skill (e.g. [row-insertion](../row-insertion/SKILL.md), [master-detail-insertion](../master-detail-insertion/SKILL.md)) or the raw SQL fallback only when the user has explicitly asked for that kind of data change.

## When to suggest a report

If the user repeatedly asks for the same kind of summary, suggest creating a report definition -- see [report-creation](../report-creation/SKILL.md).
