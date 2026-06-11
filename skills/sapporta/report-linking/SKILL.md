---
name: report-linking
description: >
  Use when the user wants report rows or cells to navigate somewhere useful.
  Covers Sapporta `rowLinks`, `column.links`, drill-up, drill-into,
  cross-report links, IDs, foreign keys, and explorable summary rows.
---

# Report Linking

Reports are far more useful when the user can jump from a row into the underlying data. Sapporta has two declarative hooks for this:

| Hook | Declared on | Returned as |
|------|-------------|-------------|
| `rowLinks` | a `ReportTreeNode` | `ReportResult.levelLinks[levelName]` |
| `column.links` | a report column inside `columns[]` | `ReportResult.levelColumns[levelName][].links` |

Both use the same `ReportLink` shape. Add them whenever a report exposes an entity key (account id, txn id, report period, etc.) so report UIs and clients have enough metadata to drill through. The current engine serializes this metadata; do not assume a particular visual control unless the app's report UI implements it.

In auth-enabled projects, links should only target rows visible through the same
active workspace boundary. Prefer FK-backed or explicit reference metadata so
table drill-through and lookup visibility stay consistent.

## The ReportLink shape

```typescript
type ReportLink =
  | { kind: "table";  table: string;  bind: LinkBind; label?: string; icon?: LinkIcon }
  | { kind: "report"; report: string; bind: LinkBind; label?: string; icon?: LinkIcon };

type LinkBind = Record<string, string>;           // target-key -> source-column-on-row
type LinkIcon = "drill-up" | "drill-into" | "report";
```

- **`kind: "table"`** — targets `/tables/<table>` with each `bind` entry encoded as an equality filter. Use for drilling to the source row (FK drill-up) or a filtered collection (master -> children drill-into).
- **`kind: "report"`** — targets `/reports/<report>` with each `bind` entry set as a URL param. Use for cross-report drill-through (summary -> detail).
- **`bind`** maps **target key -> source column name on the current row**. Parallels `ReportTreeNode.bind`'s static-map form. The source column must appear in the level's `columns[]` — otherwise the value isn't in the row and the link resolves to null.
- **`label`** is the display text a UI can use for the link.
- **`icon`** is a visual hint only: `drill-up` (single row), `drill-into` (filtered list), `report` (another report).

## Resolvability rules

For a link to resolve for a row, every `bind` source column must be present in
that row's `columns` object and have a usable value. Declare helper IDs in
`columns[]`; use `visuallyHidden: true` when the value is needed for navigation
but should not be displayed. Structural row behavior is UI-specific, so do not
depend on automatic suppression for opening, closing, subtotal, or footer rows
unless your app's report renderer implements it.

## Worked example — a ledger with both kinds

```typescript
tree: {
  source: "accounts",
  levelName: "account",
  columns: [
    { name: "id", visuallyHidden: true },              // needed so bind has `id` on the row
    {
      name: "name",
      label: "Account",
      links: [
        // Cell-level metadata: jumps to the account row when the UI supports it.
        { kind: "table", table: "accounts", bind: { id: "id" }, icon: "drill-up" },
      ],
    },
    { name: "balance", label: "Balance", kind: "number", displayFormat: "currency" },
  ],

  // Row-level metadata: opens the ledger report scoped to this account.
  rowLinks: [
    {
      kind: "report",
      report: "account-ledger",
      bind: { account_id: "id" },
      label: "View ledger",
      icon: "drill-into",
    },
  ],

  children: [
    {
      source: "lines",
      levelName: "line",
      columns: [
        { name: "id", visuallyHidden: true },
        { name: "journal_entry_id", visuallyHidden: true },
        { name: "date", label: "Date", kind: "date" },
        { name: "memo", label: "Memo" },
        { name: "amount", label: "Amount", kind: "number", displayFormat: "currency" },
      ],
      // Each line row can jump to its journal entry.
      rowLinks: [
        { kind: "table", table: "journal_entries", bind: { id: "journal_entry_id" }, icon: "drill-up" },
      ],
    },
  ],
},
```

Two things to notice:

1. `{ name: "id", visuallyHidden: true }` and `{ name: "journal_entry_id", visuallyHidden: true }` are declared because link binds need those values on the row, while `visuallyHidden` tells supporting UIs not to display them as normal columns.
2. The child level has its own `rowLinks`. Every tree level is independent.

## Patterns

- **FK drill-up** (most common): `{ kind: "table", table: "<fk-target>", bind: { id: "<fk-column>" }, icon: "drill-up" }`. Declared on either `rowLinks` or the FK column's `links`.
- **Master -> children drill-into**: `{ kind: "table", table: "<child>", bind: { <fk>: "id" }, icon: "drill-into" }` — opens the child table filtered to the parent.
- **Cross-report**: `{ kind: "report", report: "<name>", bind: { <param>: "<col>" }, icon: "drill-into" }` — the target report's param names must match the bind keys.

## Checklist before shipping a report

- [ ] Every FK-like column has either `column.links` metadata or a row-level `rowLinks` entry pointing at the referenced row.
- [ ] Any row whose identity maps to another report has a `rowLinks: [{ kind: "report", ... }]`.
- [ ] All columns named in `bind` source positions are declared in `columns[]` (add `visuallyHidden: true` for helper values that should not display).
- [ ] For levels containing synthetic rows (opening/closing balances, subtotals), verify the app's report UI handles row links correctly for those node kinds.
- [ ] `sapporta check` passes.

## Related

- [report-creation](../report-creation/SKILL.md) — authoring reports. Declare links at the same time you declare columns.
- Table grids also use row and FK relationships for navigation, so report links
  should follow the same user-facing navigation model.
