# Report Linking

Reports are more useful when the user can jump from a row, cell, or total into
the underlying data. Add links in the report screen by passing cell resolver
functions to `ReportGridDataset`. Do not put link metadata in `GridDataset`.

Use the current public types from `@sapporta/frontend/report`:
`ReportCellLink`, `ReportCellLinkContext`, and `ReportCellLinkResolvers`.
Do not use the removed grid-link type family.

Use docs for exact resolver and link type shapes:

- Reports: https://sapporta.com/docs/guides/reports/route-based-reports/
- Report datasets: https://sapporta.com/docs/guides/reports/report-datasets-and-formatting/
- Grid result shape: https://sapporta.com/docs/reference/reports/grid-dataset/

## Agent Workflow

- Treat this as a required completion task for every record-level report; see
  [the report-creation linking gate](create.md#record-level-linking-completion-gate).
- Include hidden identifiers in backend `node.columns` when the screen needs
  them for navigation.
- Add `visuallyHidden: true` to helper ID columns that should not display.
- Keep link resolution in the frontend because route state and navigation
  policy live there.
- Pass current query state through `linkContext` when a link needs date range or
  filter values.
- Check optional values before returning links for synthetic cells such as
  opening, closing, subtotal, or footer totals.
- Exercise non-trivial links in the browser.

When this is one workstream within a larger feature, strongly prefer a bounded
subagent or separate Codex task for the linking work. Give it the stable report
route, backend row shape, report screen, intended destinations, and the
completion-gate acceptance criteria. The task should return the hidden-ID,
resolver, and browser-validation changes for the owning feature task to
integrate; do not let it independently broaden the report's product scope.

## Link Patterns

- FK drill-up -> `/tables/<table>/<id>`
- Master to children drill-into -> filtered table route or detail report route
- Cross-report -> another report route with the target query parameters
- External -> `target: "_blank"` only for deliberately external destinations

Every link target must enforce its own authorization. Hidden IDs and URL filters
are not authorization.

## Related

- [report-creation](create.md) - include hidden IDs while
  shaping `GridDataset`.
