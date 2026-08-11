# Table Querying

`GET /api/tables/<name>` is the built-in list endpoint for every table. Before
constructing a raw generated-table HTTP request, inspect the mounted operation:

```bash
pnpm exec sapporta endpoints show "GET /api/tables/tasks"
pnpm exec sapporta endpoints show "GET /api/tables/{tableName}/_count"
pnpm exec sapporta endpoints show "PUT /api/tables/tasks/{id}"
```

Use the intended method and mounted path. The result verifies the route,
request shape, auth boundary, and declared responses. Generated row updates use
`PUT /api/tables/<name>/<id>`, not `PATCH`.

Use the docs for the exact route, query grammar, operators, response envelope,
semantic values, and error codes:

- Table endpoints: https://sapporta.com/docs/reference/http/table-endpoints.md
- Generated table APIs: https://sapporta.com/docs/guides/generated-surfaces/generated-table-apis.md
- Count visible rows: https://sapporta.com/docs/guides/generated-surfaces/count-visible-rows.md
- Query syntax: https://sapporta.com/docs/reference/http/query-syntax.md
- CLI workflow: https://sapporta.com/docs/guides/discovery/use-the-sapporta-cli.md
- Table, row, and report commands: https://sapporta.com/docs/reference/cli/table-row-and-report-commands.md
- Search table rows and relationships: https://sapporta.com/docs/guides/model-data/search-indexes-and-display-metadata.md
- Contract helpers and wire types: https://sapporta.com/docs/reference/contracts/contract-helpers-and-wire-types.md
- Frontend table query options: https://sapporta.com/docs/reference/frontend/table-query-options.md
- Semantic value boundaries: https://sapporta.com/docs/reference/schema/semantic-value-boundaries.md
- Agent data console: https://sapporta.com/docs/guides/discovery/use-the-agent-data-console.md

## Agent Rules

- Prefer `rows list` and `rows count` for CLI table reads. Read their installed
  `--help` plus the CLI workflow before composing JSON `--where`; do not invent
  bracket-style CLI flags.
- Every filter must name an operator: `filter[col][op]=value`.
- Preserve repeated identical HTTP filter keys. They are ordered AND
  conditions, not indexed keys or an `in` list. JSON `--where` cannot express
  duplicate identical object keys; use direct HTTP or the documented generated
  frontend client when that query shape is required.
- The HTTP wire grammar is string-based. When frontend table code already has
  typed filter values, use `TypedFilterCondition` and `encodeTypedFilters()` at
  the URL/API boundary instead of downcasting state to raw strings early.
- In frontend code, use the documented table selection/page serializers and
  preserve `QueryParamRecord`; a plain `Record<string, string>` collapses
  repeated filters.
- When decoding URL filters inside table-aware frontend code, parse them
  against table metadata with `parseFiltersForTable()` so numbers, dates,
  timestamps, booleans, and lookup ids keep their table types.
- Use the query-syntax reference for the current defaults, bounds, supported
  operators, and stable failure codes. Treat a rejected query as a caller bug.
- Do not catch-and-retry by dropping the filter or operator; that can read or
  export a much larger result set.
- Built-in table routes apply row-access predicates.
  Do not add raw workspace filters to compensate; use endpoint filters for
  product-level criteria only.
- Search with `q=<term>` unless the table declares `search: false`. Search
  defaults to the current row's visible application columns; an explicitly
  configured relational plan may also match a parent through child rows.
- Always read the documented response envelope; do not assume the response is a
  bare array.
- Generated table bodies carry JSON primitives. Preserve select-backed text as
  strings, numbers and booleans as their JSON primitives, foreign keys as the
  target primary-key type, and dates/timestamps as canonical strings. Parse
  domain values only at the documented application boundary.
- URL-encode brackets if the client does not accept raw `[` and `]`.
- Use `rows count` for a filtered total or bounded one-column grouping. If the
  question needs joins, derived measures, or reusable business semantics, use a
  scoped report or app-owned read endpoint rather than SQL.

## Lookup Boundary

Do not expect the old `{ "data": { "123": "Acme" } }` map shape. Read the query
syntax reference before composing lookup parameters: selected-ID recovery and
search are disjoint modes and must not be mixed. Lookup values are strings or
numbers, matching the target table primary-key type. Preserve that type through
lookup caches, pickers, grid editors, and filters; only serialize values at the
HTTP boundary.
Frontend table-backed selectors should normally use `LookupPicker` and
`useTableLookup` from `@sapporta/frontend/lookup`. Specialized direct Base UI
consumers must also preserve the lookup value type.

For protected or non-local apps, read
[server-access.md](server-access.md)
first.
