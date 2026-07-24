# Table Querying

`GET /api/tables/<name>` is the built-in list endpoint for every table. Before
constructing a raw generated-table HTTP request, inspect the mounted operation:

```bash
pnpm exec sapporta endpoints show "GET /api/tables/tasks"
pnpm exec sapporta endpoints show "PUT /api/tables/tasks/{id}"
```

Use the intended method and mounted path. The result verifies the route,
request shape, auth boundary, and declared responses. Generated row updates use
`PUT /api/tables/<name>/<id>`, not `PATCH`.

Use the docs for the exact route, query grammar, operators, response envelope,
semantic values, and error codes:

- Table endpoints: https://sapporta.com/docs/reference/http/table-endpoints/
- Generated table APIs: https://sapporta.com/docs/guides/generated-surfaces/generated-table-apis/
- Query syntax: https://sapporta.com/docs/reference/http/query-syntax/
- Search table rows and relationships: https://sapporta.com/docs/guides/model-data/search-indexes-and-display-metadata/
- Semantic value boundaries: https://sapporta.com/docs/reference/schema/semantic-value-boundaries/
- Agent data console: https://sapporta.com/docs/guides/discovery/use-the-agent-data-console/

## Agent Rules

- Every filter must name an operator: `filter[col][op]=value`.
- The HTTP wire grammar is string-based. When frontend table code already has
  typed filter values, use `TypedFilterCondition` and `encodeTypedFilters()` at
  the URL/API boundary instead of downcasting state to raw strings early.
- When decoding URL filters inside table-aware frontend code, parse them
  against table metadata with `parseFiltersForTable()` so numbers, dates,
  timestamps, booleans, and lookup ids keep their table types.
- Unknown columns, unsupported operators, malformed values, bad limits/pages,
  and search on tables with `search: false` return 400. Treat a 400 as a bug in
  the caller.
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

## Lookup Responses

`GET /api/tables/<name>/_lookup` returns:

```json
{
  "entries": [{ "value": 123, "label": "Acme" }]
}
```

Do not expect the old `{ "data": { "123": "Acme" } }` map shape. Lookup values
are strings or numbers, matching the target table primary-key type. Preserve
that type through lookup caches, pickers, grid editors, and filters; only
serialize values when building the HTTP query, such as `ids=123,456`.
Frontend table-backed selectors should normally use `LookupPicker` and
`useTableLookup` from `@sapporta/frontend/lookup`. Specialized direct Base UI
consumers must also preserve the lookup value type.

For protected or non-local apps, read
[server-access.md](server-access.md)
first.
