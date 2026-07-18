# Report Creation

Build reports as app-owned API routes that return grid-renderable data, plus
React screens that display them. Choose the URL, parameters, permission check,
query, screen route, navigation entry, and validation loop for the report.

Use public docs for exact `GridDataset` shape, report contracts, scoped report
data, frontend renderers, date range helpers, and examples:

- Reports guide: https://sapporta.com/docs/guides/reports/route-based-reports/
- Report datasets: https://sapporta.com/docs/guides/reports/report-datasets-and-formatting/
- Report routes: https://sapporta.com/docs/reference/reports/report-routes-and-registration/
- Grid result shape: https://sapporta.com/docs/reference/reports/grid-dataset/
- Scoped report data: https://sapporta.com/docs/reference/reports/scoped-report-helpers/

## Contents

- [Workflow](#workflow)
- [Report Slice Organization](#report-slice-organization)
- [Auth And Data Scope](#auth-and-data-scope)
- [Mapper Rules](#mapper-rules)
- [Frontend Rules](#frontend-rules)
- [Validation](#validation)
- [Example Reference Files](#example-reference-files)
- [References](#references)

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

## Report Slice Organization

Treat each report as a vertical slice by default. Follow the app's existing
route, navigation, and file naming conventions, but keep report-specific
decisions with the report instead of hiding them behind broad shared dispatch.

Backend:
- Put each report in its own backend module, commonly under
  `packages/api/app/reports/` when the app groups reports there.
- The module owns its `TsRestApi`, one `api.register(...)`, contract key, auth
  subject, request params, read/query orchestration, local source row types, and
  pure row-to-`GridDataset` mapper.
- For multiple reports, keep the report route entrypoint as a thin aggregator
  that imports report modules and mounts them.
- Share broad report infrastructure only: auth/scope helpers, row helpers,
  generic grid columns, date/parameter helpers, footer/flat-result/sum helpers,
  and result-shape utilities.
- Put reusable query or domain logic in a domain store/service or a narrowly
  named report-family helper after two or more reports already use the same
  concept. Do not centralize unrelated report SQL, mappers, or string-dispatch
  just because the files look similar.

Frontend:
- Put each report screen in its own component near the app's existing report
  routes, commonly under `packages/frontend/src/reports/`.
- The screen owns its component state, URL/search-param handling, toolbar
  controls, loading/error/result rendering, and the typed API call for that
  report.
- If the app uses a report registry for navigation/routes, keep it metadata
  oriented: report id, label, component, route path, and other navigation data.
- Build routes and navigation from the app's existing routing pattern. Preserve
  existing report URLs unless the user explicitly asks to change them.
- Avoid generic `reportId` switches and central fetch functions that erase the
  typed report contract. A shared request helper is fine when it accepts a typed
  endpoint or caller and does not become the place where report behavior is
  dispatched by string id.

Shared frontend helpers should be mechanics only: date defaults, date inputs,
run/loading/error handling, and common grid/error body rendering. Report
selection controls are a product decision; add them when they make the workflow
clear, not as a substitute for route-level navigation.

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
  behavior; read [report-linking.md](report-linking.md).
- For `GridDatasetColumn` width hints, use the canonical [Column sizing](https://sapporta.com/docs/reference/column-sizing/) reference.

## Frontend Rules

Render normal report results with the report components. Do not copy report-grid
internals. When the screen owns its own row shape, loading behavior, hierarchy,
editing rules, side panels, or toolbar behavior, read the custom grid docs:

- TGrid usage: https://sapporta.com/docs/reference/frontend/tgrid/
- BaseGrid guide: https://sapporta.com/grid/reference/base-grid/

## Validation

Use the smallest loop that proves the report:

```bash
pnpm exec sapporta endpoints show "GET /api/reports/<name>"
pnpm exec sapporta api get /api/reports/<name> --query '{"...":"..."}'
```

For protected apps, pass `--api-token <token>`. Parse successful responses with
`gridDatasetSchema` in route tests and unit-test pure mappers for hierarchy,
rollups, hidden IDs, and totals.

## Example Reference Files

When creating a report from scratch, adapt these reference files instead of
expecting them to exist in every generated project:

- [Sample report contract](sample-report-contract.ts.example)
- [Sample report API route](sample-report-api.ts.example)
- [Sample report React screen](sample-report-screen.tsx.example)
- [Report parameter helper](report-params.ts.example)
- [Report dataset loading helper](use-report-dataset.ts.example)

Copy only the pieces the project needs. The examples are not scaffolded into new
Sapporta projects by default.

## References

- [Report Linking](report-linking.md)
- [Canonical report docs](report-full-api-reference.md)
- [Canonical report examples](report-examples.md)
