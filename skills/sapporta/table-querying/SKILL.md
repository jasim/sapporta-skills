---
name: table-querying
description: >
  Query the auto-generated table list endpoint `GET /api/tables/<name>` —
  filters, cross-column search, sort, and pagination. Invoke when composing
  URLs against `/api/tables/*` from curl, frontend code, or `src/app/`
  handlers, or when debugging 400 responses from the list endpoint.
---

# Table Querying

`GET /api/tables/<name>` is the auto-generated list endpoint for every
table. Its query grammar is strict — typos, unknown columns, unknown
ops, and out-of-range values return **400** via `QueryParseError`. There
is no silent-ignore fallback: `filter[naration]=foo` (typo) does **not**
return all rows, it 400s.

## Filters — `filter[col][op]=value`

Every filter must name an operator. `filter[col]=value` (no op) is a
**400**, not an implicit `eq`.

| op | meaning | example |
| --- | --- | --- |
| `eq`, `neq` | equal / not equal | `filter[status][eq]=active` |
| `gt`, `gte`, `lt`, `lte` | ordinal comparison | `filter[amount][gte]=100` |
| `in`, `nin` | CSV membership | `filter[id][in]=1,2,3` |
| `contains` | substring match | `filter[name][contains]=cash` |
| `startswith` | prefix match | `filter[name][startswith]=exp` |
| `endswith` | suffix match | `filter[name][endswith]=:groceries` |
| `is` | null check — value must be `null` or `notnull` | `filter[parent_id][is]=null` |

- `contains` / `startswith` / `endswith` escape `%` and `_` in the user
  value so they match literally. To pattern-match yourself, use the
  columns directly in `src/app/` code with Drizzle — not this endpoint.
- `like` is **not** an operator. Use `contains` / `startswith` /
  `endswith` instead. `filter[col][like]=foo%` returns 400.
- Multiple filters AND together: `filter[type][eq]=asset&filter[balance][gt]=0`.
- `in` / `nin` take a comma-separated list. Empty items 400.
- Values are strings in the URL; the server coerces per column type.

## Search — `q=<term>`

Requires `meta.search.columns` on the table (declared in the schema
file — see the `table-creation` skill). ANDs with any filters. 400 if
the table has no `meta.search`. Empty/whitespace `q` is treated as
absent.

## Sort — `sort=col,-col2`

CSV of column names. Leading `-` means descending. Unknown columns 400.

## Pagination — `page=N&limit=M`

`page` is 1-based; `limit` must be in `[1, 1000]` (default 50).
Non-integer or out-of-range values 400.

## Response shape

```json
{
  "data": [ { "id": 1, ... }, ... ],
  "meta": { "page": 1, "pages": 3, "total": 127, "limit": 50 }
}
```

Always read `body.data` — never treat the response as a bare array.

## Examples

```bash
# Exact match on an enum column
curl 'http://localhost:3000/api/tables/accounts?filter[account_type][eq]=Expense'

# Substring match on a text column (replaces the old `like` op)
curl 'http://localhost:3000/api/tables/accounts?filter[name][contains]=groceries'

# Prefix match — name starts with "expenses:"
curl 'http://localhost:3000/api/tables/accounts?filter[name][startswith]=expenses:'

# Compound filter + sort + page
curl 'http://localhost:3000/api/tables/journal_lines?filter[debit][gt]=0&sort=-created_at&page=2&limit=25'

# Null check
curl 'http://localhost:3000/api/tables/accounts?filter[parent_id][is]=null'

# Search (requires meta.search on the table) composed with a filter
curl 'http://localhost:3000/api/tables/accounts?q=cash&filter[account_type][eq]=Asset'
```

URL-encode `[` and `]` as `%5B` and `%5D` if your client doesn't accept
raw brackets (curl does).

## Error shape

Malformed queries return HTTP 400 with a JSON body:

```json
{ "error": "Unknown filter operator \"like\" on column \"name\"", "code": "unknown_op" }
```

Codes: `unknown_filter_shape`, `unknown_column`, `unknown_op`,
`bad_value`, `bad_limit`, `bad_page`, `no_search_config`,
`unknown_search_column`. Treat a 400 as a bug in the caller — never
catch-and-retry without the op, that just papers over the typo.

## Related

- **Declare a table's `meta.search`** to enable `?q=` — see
  [table-creation/SKILL.md](../table-creation/SKILL.md).
- **Insert rows** into a table — see
  [row-insertion/SKILL.md](../row-insertion/SKILL.md).
