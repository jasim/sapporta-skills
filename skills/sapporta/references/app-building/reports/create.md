# Report Creation

Start with the actor's operational question. Define the report's inclusion and
exclusion rules, row or summary grain, parameters, authorization boundary, and
drill-down destination before choosing its route or result shape. Reuse the
accepted product model and the application's existing report language.

Then build the report as an app-owned API route that returns grid-renderable
data, plus a React screen that displays it. Choose the URL, parameters,
permission check, query, screen route, navigation entry, and validation loop for
the report.

Use public docs for exact `GridDataset` shape, report contracts, scoped report
data, frontend renderers, date range helpers, and examples:

- Reports guide: https://sapporta.com/docs/guides/reports/route-based-reports.md
- Report datasets: https://sapporta.com/docs/guides/reports/report-datasets-and-formatting.md
- Report routes: https://sapporta.com/docs/reference/reports/report-routes-and-registration.md
- Grid result shape: https://sapporta.com/docs/reference/reports/grid-dataset.md
- Scoped report data: https://sapporta.com/docs/reference/reports/scoped-report-helpers.md
- Row-scoped data helpers: https://sapporta.com/docs/reference/server/row-scoped-data-helpers.md
- Agent access: https://sapporta.com/docs/guides/security/agent-access-and-scoped-tokens.md

## Contents

- [Workflow](#workflow)
- [Report Slice Organization](#report-slice-organization)
- [Auth And Data Scope](#auth-and-data-scope)
- [Mapper Rules](#mapper-rules)
- [Frontend Rules](#frontend-rules)
- [Record-Level Linking Completion Gate](#record-level-linking-completion-gate)
- [Validation](#validation)
- [Example Reference Files](#example-reference-files)
- [References](#references)

## Workflow

Use this shape:

1. Define a shared route contract in `packages/shared/src/contracts/`.
2. Implement a thin `TsRestApi` handler under `packages/api/app/`.
3. Mount the report sub-app with `route()` and merge its contracts into OpenAPI
   with `extend()`.
4. Put query logic in a domain store/service when it is more than trivial.
5. Map rows to `GridDataset` in a pure function.
6. Build a React screen under `packages/frontend/src/`.
7. Add the screen to React Router and navigation.
8. For a record-level report, complete the mandatory linking gate below before
   considering the slice done.
9. Add route tests and mapper tests when hierarchy, rollups, links, or totals
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
  that imports report modules, mounts their Hono handlers with `route()`, and
  merges their registered contracts with `extend()`.
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

Read the row-scoped data-helper reference before choosing the query primitive.
Use its bounded reads, pages, scans, and counts when they fit. For joins and
aggregates, build scoped Drizzle predicates with one guard per participating
table. Do not route an advanced report to raw SQL merely because a generated
table query is too small for it.

Do not accept `workspace_id`, `workspaceId`, `scoped_to_user_id`, or
`scopedToUserId` from the client as report filters. The route's auth context
owns data authority.

## Mapper Rules

- Keep the row-to-`GridDataset` mapper pure and testable without a database.
- Include hidden IDs in columns when links need them (`visuallyHidden: true`).
- Use rollups and footers intentionally; tests should assert totals and
  hierarchy when they matter.
- Declare drill-down links in the mapper by default: `links` on
  `GridDataset` columns and `rowLinks` on levels, using the shared
  `NavLink` type. Use frontend resolver functions only when a link needs
  runtime screen state; read [linking.md](linking.md).
- Keep summary cards out of `GridDataset`. The current schema contains levels,
  nodes, and optional footer rows. Pass `ReportSummaryStats` a separate
  `ReportStat[]` value in the screen or declare a custom response envelope when
  summary values must cross the API boundary.
- For `GridDatasetColumn` width hints, use the canonical [Column sizing](https://sapporta.com/docs/reference/column-sizing.md) reference.

## Frontend Rules

Render normal report results with the report components. Do not copy report-grid
internals. When the screen owns its own row shape, loading behavior, hierarchy,
editing rules, side panels, or toolbar behavior, read the custom grid docs:

- TGrid usage: https://sapporta.com/docs/reference/frontend/tgrid.md
- GridCore guide: https://sapporta.com/grid/reference/grid-core.md

## Record-Level Linking Completion Gate

Complete [Report Linking](linking.md) before finishing any report that exposes
durable records. A report is record-level when a displayed value represents a
record a user would reasonably inspect, edit, or use as a starting point for
related work. Summary-only reports need links only when drill-down is useful.

The report should preserve the identity needed for its intended drill-downs and
make those paths available in the UI — declaratively in the `GridDataset`
mapper by default, with frontend resolvers for runtime-state cases. Verify that
links work for the report's relevant row types and that their targets enforce
authorization.

## Validation

Use the smallest loop that proves the report:

```bash
pnpm exec sapporta endpoints show "GET /api/reports/<name>"
pnpm exec sapporta api get /api/reports/<name> --query '{"...":"..."}'
```

For protected runtime checks, follow the agent-access guide and use the
project's private CLI environment. Parse successful responses with
`gridDatasetSchema` in route tests and unit-test pure mappers for hierarchy,
rollups, hidden IDs, and totals.

## Example Reference Files

When creating a report from scratch, adapt these reference files instead of
expecting them to exist in every generated project:

- [Sample report contract](sample-contract.ts.example)
- [Sample report API route](sample-api.ts.example)
- [Sample report React screen](sample-screen.tsx.example)
- [Report parameter helper](params.ts.example)
- [Report dataset loading helper](use-dataset.ts.example)

Copy only the pieces the project needs. The examples are not scaffolded into new
Sapporta projects by default.

## References

- [Report Linking](linking.md)
- [Canonical report docs](api-reference.md)
- [Canonical report examples](examples.md)
