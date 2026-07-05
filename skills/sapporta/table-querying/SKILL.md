---
name: table-querying
description: >
  Use when the user needs to query or compose URLs for Sapporta table list
  APIs, `GET /api/tables/<name>`, with filters, cross-column search, sort, and
  pagination. Applies to curl, frontend code, backend handlers, and 400
  debugging.
---

# Table Querying

`GET /api/tables/<name>` is the built-in list endpoint for every table. Use the
docs for the exact query grammar, operators, response envelope, and error
codes:

- Generated table APIs: https://sapporta.com/docs/subsystems/generated-table-apis/
- Filter syntax: https://sapporta.com/docs/reference/filter-syntax/
- Agent data console recipes: https://sapporta.com/docs/tools-and-operations/agent-data-console-recipes/

## Agent Rules

- Every filter must name an operator: `filter[col][op]=value`.
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

For protected or non-local apps, read
[../data-console/references/cli-server-access.md](../data-console/references/cli-server-access.md)
first.
