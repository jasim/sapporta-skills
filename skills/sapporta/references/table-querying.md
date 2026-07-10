# Table Querying

`GET /api/tables/<name>` is the built-in list endpoint for every table. Use the
docs for the exact query grammar, operators, response envelope, and error
codes:

- Generated table APIs: https://sapporta.com/docs/subsystems/generated-table-apis/
- Filter syntax: https://sapporta.com/docs/reference/filter-syntax/
- Agent data console recipes: https://sapporta.com/docs/tools-and-operations/agent-data-console-recipes/

## Agent Rules

- Every filter must name an operator: `filter[col][op]=value`.
- The HTTP wire grammar is string-based. When frontend table code already has
  typed filter values, use `TypedFilterCondition` and `encodeTypedFilters()` at
  the URL/API boundary instead of downcasting state to raw strings early.
- When decoding URL filters inside table-aware frontend code, parse them
  against table metadata with `parseFiltersForTable()` so numbers, dates,
  timestamps, booleans, and lookup ids keep their table types.
- Unknown columns, unsupported operators, malformed values, bad limits/pages,
  and search on tables without search config return 400. Treat a 400 as a bug
  in the caller.
- Do not catch-and-retry by dropping the filter or operator; that can read or
  export a much larger result set.
- Built-in table routes apply row-access predicates.
  Do not add raw workspace filters to compensate; use endpoint filters for
  product-level criteria only.
- Search with `q=<term>` only when the table declares `meta.search`.
- Always read the documented response envelope; do not assume the response is a
  bare array.
- URL-encode brackets if the client does not accept raw `[` and `]`.

## Lookup Responses

`GET /api/tables/<name>/lookup` returns:

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
[cli-server-access.md](cli-server-access.md)
first.
