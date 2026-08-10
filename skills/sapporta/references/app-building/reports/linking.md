# Report Linking

Reports are more useful when the user can jump from a row, cell, or total into
the underlying data. Sapporta renders links from two sources, in this order of
preference:

1. **Declarative links** carried by the data: `links` on a `GridDataset`
   column and `rowLinks` on a `GridDataset` level, using the shared
   `NavLink` type from `@sapporta/shared/contracts`. Declare these in the
   backend mapper that builds the `GridDataset`. This is the default choice —
   the frontend resolves and renders them with no screen code.
2. **App resolver functions** passed to `ReportGridDataset` via the `links`
   prop (`ReportCellLinkResolvers`): per-level `cell` resolvers and a
   per-level `row` resolver. Use these only when a link needs frontend
   runtime state — the current date range or filter values from
   `linkContext.input`, conditional destinations, or app-owned detail routes
   with non-trivial construction. A resolver declared for a column takes
   full control of that column: declarative links on it are ignored.

Use the current public types: `NavLink` (`@sapporta/shared/contracts`) for
declarative links; `ReportCellLink`, `ReportCellLinkContext`,
`ReportRowLinkContext`, and `ReportCellLinkResolvers`
(`@sapporta/frontend/report`) for resolvers. Do not use older removed
grid-link type families. Resolver-returned links are
`{ label, href, icon?, target? }` — set `icon` when the default (`external`
for hrefs that leave the app, `drill-into` otherwise) doesn't fit, e.g. a
resolver linking to a report route should say `icon: "report"`.

## Declarative `NavLink`

```ts
// On a GridDataset column: cells of this column link out.
{ id: "customer", label: "Customer", kind: "text",
  links: [
    { kind: "table", table: "invoices",
      bind: { customer_id: "customer_id" }, label: "Open invoices" },
  ] }

// On a GridDataset level: row-level related data, shown in the row's
// right-click context menu.
rowLinks: [
  { kind: "report", report: "customer-statement",
    bind: { customer_id: "customer_id" }, label: "Customer statement" },
]
```

- `kind: "table"` — each `bind` entry becomes an equality filter on the
  destination table: `bind: { customer_id: "customer_id" }` means "filter the
  destination's `customer_id` column by this row's `customer_id` value".
  Composite binds produce multiple filters.
- `kind: "report"` — `report` is the report route (`"aging"` resolves to
  `/reports/aging`; an absolute path like `"/finance/aging"` is kept as-is);
  each `bind` entry becomes a query parameter.
- `kind: "url"` — arbitrary destination; `{column}` placeholders in `href`
  are substituted with URL-encoded row values, `bind` entries append query
  parameters. External (`scheme://`) URLs default to a new tab.
- `label`, `icon` (`drill-up` | `drill-into` | `report` | `external`), and
  `target` are optional presentation hints.

Resolution rules the mapper can rely on:

- `bind` sources read from the node's `columns` values, including
  `visuallyHidden: true` helper ID columns. Include the identifiers the
  drill-down needs in `node.columns` and hide them.
- Bind sources and url `{column}` placeholders must name columns declared on
  the link's level. Unknown names fail loudly when the grid binds the
  dataset (the counterpart of the boot-time check on table-declared links),
  so a typo can't silently produce a link that never appears.
- A link only resolves when every bound source value is present — rows with
  NULL sources simply don't offer the link. No guard code needed.
- Synthetic rows (`kind: "opening" | "closing" | "subtotal"`) and footer rows
  never resolve declarative links.
- The first resolvable link on a column is the cell's primary link (rendered
  as an anchor, opened with Enter). All resolvable cell links plus the
  level's row links appear in the row's right-click context menu.

## Agent Workflow

- Treat this as a required completion task for every record-level report; see
  [the report-creation linking gate](create.md#record-level-linking-completion-gate).
- Declare links in the backend `GridDataset` mapper by default; add frontend
  resolvers only for the runtime-state cases above.
- Include hidden identifiers in backend `node.columns` when navigation needs
  them, with `visuallyHidden: true`.
- Pass current query state through `linkContext` when a link needs date range
  or filter values — that is a resolver case.
- Exercise non-trivial links in the browser.

When this is one workstream within a larger feature, strongly prefer a bounded
subagent or separate coding agent thread/task for the linking work. Give it the
stable report route, backend row shape, report screen, intended destinations,
and the completion-gate acceptance criteria. The task should return the
hidden-ID, link-declaration/resolver, and browser-validation changes for the
owning feature task to integrate; do not let it independently broaden the
report's product scope.

## Choose Domain-Aware Destinations

Pick destinations from the user's workflow, not from what is mechanically
linkable. For each report, ask: when a user sees this number or name, what do
they do next? Link exactly that.

- FK-like cell (customer, account, order) -> the filtered table view of that
  entity's records, or a verified app-owned detail route
- Aggregate cell (total, count, balance) -> the filtered table or detail
  report listing the rows behind the number
- Master row -> its children (`drill-into`), its entity statement or
  activity report (`kind: "report"`)
- Cross-report -> another report route carrying the identifying parameters
- External systems (payment processor dashboard, tracking page) ->
  `kind: "url"` with `target: "_blank"`

Do not attach links to every column. One primary link per key column plus a
small set of row links keeps the grid scannable; the context menu carries the
long tail.

The generated single-row HTTP endpoint does not imply a generated frontend
detail route. Inspect the installed app's routes before emitting a record link.

Every link target must enforce its own authorization. Hidden IDs and URL
filters are not authorization.

## Related

- [report-creation](create.md) - include hidden IDs while
  shaping `GridDataset`.
- [table linking](../tables/create.md#table-and-row-linking) - the same
  `NavLink` vocabulary on table metadata: FK drill-up and child drill-into
  links are derived automatically; declare additional `links` / `rowLinks`
  for domain workflows.
