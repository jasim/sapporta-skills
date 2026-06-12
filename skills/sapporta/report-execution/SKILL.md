---
name: report-execution
description: >
  Use when the user wants to run Sapporta report routes, see report output,
  check numbers, or answer questions from existing app data with report
  endpoints, table queries, or SQL inspection.
---

# Report Execution

Run reports by calling their API endpoints. Use `sapporta describe` to inspect
the endpoint shape, then call the route with `curl`, the app's typed client, or
another HTTP client. Do not use `sapporta reports`; report routes are described
through OpenAPI like other app endpoints.

## Decision: Report Route Or Ad-Hoc Query?

1. Use `pnpm exec sapporta describe` to inspect available routes.
2. If a report endpoint matches, inspect it with
   `pnpm exec sapporta describe "METHOD /api/reports/<path>"`.
3. Call the report route with `curl`, the app's typed client, or another HTTP
   client.
4. If no endpoint answers the question, use table queries or read-only SQL
   inspection.

## Running A Report Route

```bash
pnpm exec sapporta describe "GET /api/reports/trial-balance"

curl -fsS \
  -H "Authorization: Bearer ${SAPPORTA_API_TOKEN}" \
  "${SAPPORTA_API_URL:-http://localhost:3000}/api/reports/trial-balance?asOfDate=2026-06-12"
```

- Use the route schema from `sapporta describe` to choose query parameters or
  request body fields.
- Dates should use the route's documented shape. New date ranges usually use
  flat query fields such as `period_from`, `period_to`, or `period_relative`.
- For `POST` report routes, send JSON with `-H "Content-Type: application/json"`
  and `-d '{"field":"value"}'`.
- In protected apps, set `SAPPORTA_API_TOKEN`; the token selects the workspace.

Report responses should parse as `GridReportResult`. For data questions, cite
the report endpoint and parameters used, especially date range, workspace, or
filters.

## Ad-Hoc Queries

When no report route covers the question, use the highest-level available data
surface:

1. Built-in table list endpoints through `sapporta tables sample` or
   `/api/tables/<name>` filters.
2. Existing domain endpoints from `sapporta describe`.
3. Read-only SQL through `sapporta db exec-sql`.

```bash
pnpm exec sapporta db exec-sql "SELECT ..."
pnpm exec sapporta db exec-sql --input-body-json '{"sql": "SELECT ...", "limit": 100}'
```

`sapporta db exec-sql` is raw database access and can execute writes. For this
skill, use it only for inspection queries unless the user explicitly asks for a
data change. In auth-enabled projects it does not represent a workspace user's
route visibility unless the query explicitly follows the same server-side
row-security rules. Prefer report routes and table endpoints for user-facing
answers; use SQL inspection as admin/debug work and say so in the answer.

This skill is about reads. For mutations, use the relevant mutation skill
([row-insertion](../row-insertion/SKILL.md),
[master-detail-insertion](../master-detail-insertion/SKILL.md)) or the raw SQL
fallback only when the user explicitly asks for that kind of data change.

## When To Suggest A Report

If the user repeatedly asks for the same kind of summary, suggest creating a
route-based report endpoint and screen; see
[report-creation](../report-creation/SKILL.md).
