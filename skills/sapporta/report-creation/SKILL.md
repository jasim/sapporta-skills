---
name: report-creation
description: >
  Use when the user wants to create or change Sapporta reports. Covers
  route-based report APIs, shared report contracts, GridDataset mappers, report
  screens, summaries, financial statements, trial balances, ledgers, and
  route/dataset validation.
---

# Report Creation

Build reports as app-owned API routes that return grid-renderable data, plus
React screens that display them. Choose the URL, parameters, permission check,
query, screen route, navigation entry, and validation loop for the report.

Use public docs for exact `GridDataset` shape, report contracts, scoped report
data, frontend renderers, date range helpers, and examples:

- Reports guide: https://sapporta.com/docs/subsystems/reports/
- Report datasets: https://sapporta.com/docs/reference/report-datasets/
- Route-based reports: https://sapporta.com/docs/reference/full/reports/route-based-reports/
- Grid result shape: https://sapporta.com/docs/reference/full/reports/grid-result-shape/
- Scoped report data: https://sapporta.com/docs/reference/full/reports/scoped-report-data/

## Workflow

Use this shape:

1. Define a shared route contract in `packages/shared/src/contracts/`.
2. Implement a thin `TsRestApi` handler under `packages/api/app/`.
3. Put query logic in a domain store/service when it is more than trivial.
4. Map rows to `GridDataset` in a pure function.
5. Build a React screen under `packages/frontend/src/`.
6. Add the screen to React Router and navigation.
7. Add route tests and mapper tests when hierarchy, rollups, links, or totals
   are non-trivial.

Do not create report files in `packages/api/reports/`, use `report({...})`, or
run `sapporta reports`. Route-based reports are normal app routes and should be
discoverable through OpenAPI.

## Module Organization

Treat one report as one backend module. Keep the report's `api.register(...)`,
report-specific row types, read/query orchestration, and `GridDataset` mapper
together in one file unless the query or shared domain logic is large enough to
move into a store/service.

For multiple reports, keep `packages/api/app/reports.ts` as a thin aggregator
that imports and mounts individual report modules. Do not collect many
unrelated report queries, row types, handlers, and mappers in one large file.

## Auth And Data Scope

Resolve auth and request input at the route edge. Use `scopedRows()` or
`auth.rowSecurity.forTable(table)` for visible base rows before joining,
aggregating, or mapping results. For raw SQL, make visible base tables explicit
with CTEs or guarded row sets before composing the report query.

Do not accept `workspace_id`, `workspaceId`, `scoped_to_user_id`, or
`scopedToUserId` from the client as report filters. The route's auth context
owns data authority.

## Mapper Rules

- Keep the row-to-`GridDataset` mapper pure and testable without a database.
- Include hidden IDs in columns when frontend links need them.
- Use rollups and footers intentionally; tests should assert totals and
  hierarchy when they matter.
- Keep links out of the backend result. Report links are frontend resolver
  behavior; read [../report-linking/SKILL.md](../report-linking/SKILL.md).

## Frontend Rules

Render normal report results with the report components. Do not copy report-grid
internals. When the screen owns its own row shape, loading behavior, hierarchy,
editing rules, side panels, or toolbar behavior, read the custom grid docs:

- TGrid usage: https://sapporta.com/grid/docs/full/tgrid-usage/
- BaseGrid guide: https://sapporta.com/grid/docs/full/basegrid-guide/

## Validation

Use the smallest loop that proves the report:

```bash
pnpm exec sapporta describe "GET /api/reports/<name>"
curl -fsS "${SAPPORTA_API_URL:-http://localhost:3000}/api/reports/<name>?..."
```

For protected apps, include the bearer token. Parse successful responses with
`gridDatasetSchema` in route tests and unit-test pure mappers for hierarchy,
rollups, hidden IDs, and totals.

## References

- [Report Linking](../report-linking/SKILL.md)
- [Canonical report docs](references/full-api-reference.md)
- [Canonical report examples](references/examples.md)
