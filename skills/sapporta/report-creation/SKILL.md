---
name: report-creation
description: >
  Use when the user wants to create or change Sapporta reports. Covers report
  definitions, summaries, financial statements, trial balances, ledgers,
  structured data views, and `sapporta check` validation.
---

# Report Creation

Reports are declarative: SQL data sources + a tree structure that assembles results into hierarchical output.

> **Also read [report-linking](../report-linking/SKILL.md).** Reports that expose entity IDs, FKs, or summary rows should almost always declare `rowLinks` and/or per-column `links` so users can drill through. It's a huge quality-of-life win and easy to forget — treat it as part of authoring, not a follow-up.

## File Location

`<project-dir>/packages/api/reports/<name>.ts` — export a report definition from each file. The usual template is `export default report({...})`; named exports that are report definitions are also loaded.

## File Template

```typescript
import { report } from "@sapporta/server/report";

export default report({
  name: "trial-balance",       // URL-safe identifier
  label: "Trial Balance",      // Human-readable title

  // User-supplied parameters (rendered as UI form)
  // Fields: name, type ("date"|"string"|"integer"|"float"|"daterange"),
  // required, default?, label?, lookup?, fromBind?, toBind?
  params: [
    { name: "as_of_date", type: "date", required: true, label: "As of Date" },
  ],

  // Named SQL data sources — use $param_name for bind variables
  sources: {
    accounts: {
      query: `
        SELECT
          a.id, a.name, a.account_type,
          COALESCE(SUM(jl.debit), 0) AS total_debit,
          COALESCE(SUM(jl.credit), 0) AS total_credit
        FROM accounts a
        LEFT JOIN journal_lines jl ON jl.account_id = a.id
        LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id
          AND je.date <= $as_of_date
        GROUP BY a.id, a.name, a.account_type
        HAVING COALESCE(SUM(jl.debit), 0) != 0
            OR COALESCE(SUM(jl.credit), 0) != 0
        ORDER BY a.name
      `,
    },
  },

  // Tree structure — assembles query results into hierarchy
  tree: {
    source: "accounts",       // references a key in sources
    levelName: "account",     // key for this level in parent's children map
    columns: [
      { name: "name", label: "Account" },
      { name: "account_type", label: "Type" },
      { name: "total_debit", label: "Debit", kind: "number", displayFormat: "currency" },
      { name: "total_credit", label: "Credit", kind: "number", displayFormat: "currency" },
    ],
    footer: [
      {
        label: "Grand Total",
        compute: (nodes) => ({
          total_debit: nodes.reduce((s, n) => s + (Number(n.columns.total_debit) || 0), 0),
          total_credit: nodes.reduce((s, n) => s + (Number(n.columns.total_credit) || 0), 0),
        }),
      },
    ],
  },
});
```

## Parameters

Each param becomes a form field in the UI and a `$name` bind variable in SQL sources.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Bind variable name. Used as `$name` in SQL sources. Must be unique. |
| `type` | `"date" \| "string" \| "integer" \| "float" \| "daterange"` | Data type. Scalar string inputs are parsed before SQL binding. |
| `required` | `boolean` | If true, execution throws when this param is not supplied. |
| `default?` | `unknown` | Used when the param is not supplied. Only relevant if `required: false`. |
| `label?` | `string` | Display label for the UI parameter form. Falls back to `name` if omitted. |
| `lookup?` | `string` | Table name. Renders a dropdown populated from the table's `_lookup` endpoint — shows the table's display column as labels, submits the row's primary key as the value. |
| `fromBind?` | `string` | Required for `type: "daterange"`. SQL bind name for the resolved start date. |
| `toBind?` | `string` | Required for `type: "daterange"`. SQL bind name for the resolved end date. |

### Lookup params

When a param references a row in another table, set `lookup` to the table name. The UI renders a dropdown instead of a text input:

```typescript
params: [
  // Date param — renders as date picker
  { name: "as_of_date", type: "date", required: true, label: "As of Date" },
  // Lookup param — renders as dropdown with account names
  { name: "account_id", type: "integer", required: true, label: "Account", lookup: "accounts" },
  // Optional string param with default
  { name: "account_type", type: "string", required: false, default: null, label: "Account Type" },
]
```

The display value shown in the dropdown is controlled by the target table's `meta.rowLabelColumns` — an array of column names whose values are concatenated with a space (or heuristic: first text column that isn't a PK or FK).

### Date range params

Use `type: "daterange"` when the UI should capture a period as one parameter while SQL receives separate lower and upper bounds:

```typescript
params: [
  {
    name: "period",
    type: "daterange",
    required: false,
    label: "Period",
    fromBind: "start_date",
    toBind: "end_date",
    default: { type: "all_time" },
  },
],
sources: {
  entries: {
    query: `
      SELECT *
      FROM journal_entries
      WHERE ($start_date IS NULL OR date >= $start_date)
        AND ($end_date IS NULL OR date <= $end_date)
    `,
  },
},
```

## Sources

Use `$name` syntax for bind variables (params and parent binds). The engine converts `$name` variables to `?` positional parameters for SQLite execution.

### Auth and scoped tables

Report sources are SQL. In auth-enabled projects, do not expose
`workspace_id`, `workspaceId`, `scoped_to_user_id`, or `scopedToUserId` as
report parameters and do not trust client-supplied scope values. A report that
reads scoped tables must preserve the same workspace/user visibility as the
table APIs. Use the project's auth-aware report execution pattern when
available; if the project version only supports plain SQL sources, do not ship
reports over scoped tables until the report route applies server-side row
security for those sources.

Lookups declared with `param.lookup` should point at scoped tables normally;
the lookup endpoint applies the active user's visibility. Do not replace lookup
visibility with raw SQL that lists IDs from other workspaces.

### Bind variable syntax

SQLite does not need type casts — all parameters are bound directly. Most aggregation functions (`SUM`, `AVG`, `COUNT`) handle type coercion automatically.

```sql
COALESCE(SUM(amount), 0) AS total
```

**Optional parameter pattern:**

```sql
-- Works: SQLite handles NULL comparison without casts
WHERE ($account_type IS NULL OR a.account_type = $account_type)

-- Works: date comparison with ISO 8601 text strings
WHERE ($start_date IS NULL OR je.date >= $start_date)
```

If you need explicit type conversion, use SQLite's `CAST()`:

```sql
CAST(amount AS REAL)   -- convert text to floating-point
CAST(count AS INTEGER) -- convert to integer
```

However, explicit casts are rarely needed — SQLite's type affinity handles most cases automatically.

## Tree Structure

### Core fields

| Field | Type | Description |
|-------|------|-------------|
| `source` | `string` | Name of source in `sources` map |
| `levelName` | `string` | Key for this level in parent's children map |
| `columns` | `ColumnSchema[]` | Fields from SQL result to include in output |
| `children` | `ReportTreeNode[]` | Child nodes (processed per parent row) |

### Columns

Only declared columns appear in `node.columns` and in the report's emitted column metadata. Omitted `label` values are filled from the column name, so use `visuallyHidden: true` for helper values that must be present for links or transforms but should not be displayed.

```typescript
columns: [
  { name: "name", label: "Account Name" },
  { name: "amount", label: "Amount", kind: "number", displayFormat: "currency" },
  // Sizing: width (fixed), minWidth, maxWidth (in character counts)
  { name: "memo", label: "Memo", minWidth: 20, maxWidth: 60 },
  { name: "account_id", visuallyHidden: true },
]
```

### Parent-child binding

Bind passes values from a parent row into the child source's SQL query as parameters. **The child source query MUST reference bind keys as `$key` in its WHERE clause** — otherwise the bind values are ignored and the child query returns unfiltered results for every parent row.

```typescript
// Object form — $parent.col references parent row columns
bind: { account_id: "$parent.id" },

// Function form
bind: (parent, params) => ({ account_id: parent.id, start_date: params.start_date }),
```

**CRITICAL:** The child source SQL must filter using the bind key. Without it, every parent gets the same unfiltered child rows:

```typescript
// WRONG — bind provides account_id but the query doesn't use it
//         Every account will show ALL journal lines, not just its own
sources: {
  lines: {
    query: `SELECT * FROM journal_lines WHERE date >= $start_date`,
  },
},
children: [{
  source: "lines",
  bind: { account_id: "$parent.id" },  // ← this does nothing without $account_id in the query!
}]

// CORRECT — query filters by $account_id so each parent gets only its own children
sources: {
  lines: {
    query: `SELECT * FROM journal_lines WHERE account_id = $account_id AND date >= $start_date`,
  },
},
children: [{
  source: "lines",
  bind: { account_id: "$parent.id" },  // ← now $account_id in the query gets this value
}]
```

### Conditional execution and singular children

```typescript
when: (parent) => parent.account_type === "Asset",  // skip child based on parent
singular: true,  // child produces one result (or null) instead of array
```

## Post-Processing

### Rollup — compute values on parent from its children

```typescript
rollup: (children) => {
  const lines = children.line || [];
  return {
    total_debit: lines.reduce((s, n) => s + (Number(n.columns.debit) || 0), 0),
    total_credit: lines.reduce((s, n) => s + (Number(n.columns.credit) || 0), 0),
  };
},
```

Rollup values appear in `node.rollup` (separate from `node.columns`).

### Transform — post-process assembled nodes

```typescript
transform: (nodes, { parent, siblings, params }) => {
  let balance = 0;
  return nodes.map(node => {
    balance += (Number(node.columns.debit) || 0) - (Number(node.columns.credit) || 0);
    return { ...node, columns: { ...node.columns, running_balance: balance } };
  });
},
```

### Sort

```typescript
sort: [{ key: "date", direction: "asc" }, { key: "name", direction: "asc" }],
```

### Footer — synthetic rows after all data nodes

```typescript
footer: [
  {
    label: "Grand Total",
    compute: (nodes) => ({
      total_debit: nodes.reduce((s, n) => s + (Number(n.columns.total_debit) || 0), 0),
    }),
  },
],
```

## Critical: Column Declaration Rules

The engine only copies declared SQL fields into `node.columns`. Transforms receive `context.rawRows`, so they can read undeclared SQL fields, but any value that should appear in output columns, rollups, footers, links, or UI metadata must be declared in `columns[]`.

### Rollup and footer keys must be declared in `columns[]`

```typescript
// WRONG — rollup produces "total" but columns[] doesn't declare it
columns: [{ name: "section", label: "Section" }],
rollup: (children) => ({ total: children.items.reduce(...) }),

// CORRECT — "total" is declared in columns[]
columns: [
  { name: "section", label: "Section" },
  { name: "total", label: "Total", kind: "number", displayFormat: "currency" },
],
```

The same applies to footer `compute` — returned keys must match declared column names.

### Transform needs columns declared too

If your transform needs SQL fields only for computation, prefer `context.rawRows`. If a computed value should be returned in `node.columns`, declare it:

```typescript
columns: [
  { name: "id", visuallyHidden: true }, // needed for links but not displayed
  { name: "name", label: "Account" },
  { name: "running_balance", label: "Balance", kind: "number", displayFormat: "currency" },
],
```

## Validation

After creating or modifying any report:

```bash
sapporta check
```

Validates report definitions and can check SQL planning when a database is available. It also validates source references and rollup/footer keys vs declared columns. Fix all issues before considering work complete.

## Row & Cell Linking

Reports can attach navigation metadata to rows (`rowLinks` on a tree node) and cells (`links` on a column). The report engine returns these as `levelLinks` and column `links` so report UIs can navigate to tables or other reports. **Almost every non-trivial report should declare some.** See [report-linking](../report-linking/SKILL.md) for the full guide.

## Reference Files

- [Report Linking](../report-linking/SKILL.md) — `rowLinks` and `column.links` for drill-through navigation
- [Full API Reference](references/full-api-reference.md) — Complete TypeScript types
- [Worked Examples](references/examples.md) — Trial balance, general ledger, parameterized reports
