---
name: report-execution
description: >
  Run existing reports or answer data questions via ad-hoc SQL queries.
  Use when the user wants to see report output, check numbers, or query
  data that may or may not have a pre-built report.
---

# Report Execution

## Decision: existing report or ad-hoc query?

1. **Check for an existing report** -- `sapporta reports`
2. If a match exists, **execute it** with parameters.
3. If not, **run read-only ad-hoc SQL** -- `sapporta meta sql "SELECT ..."`.

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

## Ad-hoc queries

When no report covers the question, use read-only SQL (`SELECT` or `WITH`) against the current local Sapporta project:

```bash
sapporta meta sql "SELECT ..."
# or, to pass params + a row cap:
sapporta meta sql --json '{"sql": "SELECT ...", "params": [...], "limit": 100}'
```

This skill is about reads. For mutations, use the relevant mutation skill (e.g. [row-insertion](../row-insertion/SKILL.md), [master-detail-insertion](../master-detail-insertion/SKILL.md)) or the raw SQL fallback only when the user has explicitly asked for that kind of data change.

## When to suggest a report

If the user repeatedly asks for the same kind of summary, suggest creating a report definition -- see [report-creation](../report-creation/SKILL.md).
