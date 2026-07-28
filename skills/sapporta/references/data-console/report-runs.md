# Report Execution

Run reports by calling their API endpoints. Use
`pnpm exec sapporta endpoints list` and `pnpm exec sapporta endpoints show` to
inspect the endpoint shape, then call the route with `sapporta api`, `curl`,
the app's typed client, or another HTTP client. Do not use `sapporta reports`;
report routes are described through OpenAPI like other app endpoints.

Docs:

- Reports: https://sapporta.com/docs/guides/reports/route-based-reports/
- Report datasets: https://sapporta.com/docs/guides/reports/report-datasets-and-formatting/
- OpenAPI discovery: https://sapporta.com/docs/guides/discovery/openapi-and-endpoint-discovery/
- Agent data console: https://sapporta.com/docs/guides/discovery/use-the-agent-data-console/

## Decision: Report Route Or Ad-Hoc Query?

1. Use `pnpm exec sapporta endpoints list` to inspect available routes.
2. If a report endpoint matches, inspect it with
   `pnpm exec sapporta endpoints show "METHOD /api/reports/<path>"`.
3. Call the report route with `sapporta api get/post`, `curl`, the app's typed
   client, or another HTTP client.
4. If no endpoint answers a one-table question, use `rows count` or a bounded
   table query when those surfaces preserve its meaning.
5. For joins, derived measures, or a repeated advanced query, route the work to
   an app-owned scoped report/read endpoint.
6. Use read-only SQL only for explicitly authorized administration or
   debugging, not as workspace-user query behavior.

Use the route schema from `endpoints show` to choose query parameters or
request body fields. For a protected app, follow
[server-access.md](server-access.md); the configured token selects the
workspace.

For data questions, cite the report endpoint and parameters used, especially
date range, workspace, filters, and row limits. If no report route covers a
repeated summary, suggest creating a route-based report endpoint and screen.

This workflow is about reads. For mutations, use [row-insertion](row-writes.md),
[master-detail-insertion](master-detail-writes.md), a custom
domain endpoint, or the raw SQL fallback only when the user explicitly asks for
that kind of data change.
