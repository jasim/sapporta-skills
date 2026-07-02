---
name: report-execution
description: >
  Use when the user wants to run Sapporta report routes, see report output,
  check numbers, or answer questions from existing app data with report
  endpoints, table queries, or SQL inspection.
---

# Report Execution

Run reports by calling their API endpoints. Use `pnpm exec sapporta describe`
to inspect the endpoint shape, then call the route with `curl`, the app's typed
client, or another HTTP client. Do not use `sapporta reports`; report routes
are described through OpenAPI like other app endpoints.

Docs:

- Reports: https://sapporta.com/docs/subsystems/reports/
- Report datasets: https://sapporta.com/docs/reference/report-datasets/
- OpenAPI discovery: https://sapporta.com/docs/subsystems/openapi-and-discovery/
- Agent data console: https://sapporta.com/docs/tools-and-operations/agent-data-console/

## Decision: Report Route Or Ad-Hoc Query?

1. Use `pnpm exec sapporta describe` to inspect available routes.
2. If a report endpoint matches, inspect it with
   `pnpm exec sapporta describe "METHOD /api/reports/<path>"`.
3. Call the report route with `curl`, the app's typed client, or another HTTP
   client.
4. If no endpoint answers the question, use table queries or read-only SQL
   inspection.

Use the route schema from `describe` to choose query parameters or request body
fields. In protected apps, set `SAPPORTA_API_TOKEN`; the token selects the
workspace.

For data questions, cite the report endpoint and parameters used, especially
date range, workspace, filters, and row limits. If no report route covers a
repeated summary, suggest creating a route-based report endpoint and screen.

This skill is about reads. For mutations, use [row-insertion](../row-insertion/SKILL.md),
[master-detail-insertion](../master-detail-insertion/SKILL.md), a custom
domain endpoint, or the raw SQL fallback only when the user explicitly asks for
that kind of data change.
