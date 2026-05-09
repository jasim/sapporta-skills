---
name: report-linking
description: >
  Add row- and cell-level navigation (drill-up, drill-into, cross-report)
  to Sapporta reports via `rowLinks` and `column.links`. Invoke whenever a
  report surfaces IDs, FKs, or summary rows a user would want to explore —
  this is usually a big quality-of-life win and easy to miss.
---

# Report Linking

Reports are far more useful when the user can jump from a row into the underlying data. Sapporta has two declarative hooks for this:

| Hook | Declared on | Rendered as |
|------|-------------|-------------|
| `rowLinks` | a `ReportTreeNode` | right-click **context menu** items on every data row at that level |
| `column.links` | a `ColumnSchema` inside `columns[]` | a **hover chip** on that cell; also mirrored into the row context menu for discoverability |

Both use the same `ReportLink` shape. Add them whenever a report exposes an entity key (account id, txn id, report period, etc.) — the user should almost always be able to drill through.

## The ReportLink shape

```typescript
type ReportLink =
  | { kind: "table";  table: string;  bind: LinkBind; label?: string; icon?: LinkIcon }
  | { kind: "report"; report: string; bind: LinkBind; label?: string; icon?: LinkIcon };

type LinkBind = Record<string, string>;           // target-key → source-column-on-row
type LinkIcon = "drill-up" | "drill-into" | "report";
```

- **`kind: "table"`** — navigates to `/tables/<table>` with each `bind` entry encoded as an equality filter. Use for drilling to the source row (FK drill-up) or a filtered collection (master → children drill-into).
- **`kind: "report"`** — navigates to `/reports/<report>` with each `bind` entry set as a URL param. Use for cross-report drill-through (summary → detail).
- **`bind`** maps **target key → source column name on the current row**. Parallels `ReportTreeNode.bind`'s static-map form. The source column must appear in the level's `columns[]` — otherwise the value isn't in the row and the link resolves to null.
- **`label`** is the menu/chip title. Defaults to `Open in <table>` or `Open report: <report>`.
- **`icon`** is a visual hint only: `drill-up` (→ single row), `drill-into` (→ filtered list), `report` (→ another report). Omit it and the UI picks a sensible default from `kind`.

## Resolvability rules

A link is skipped (not rendered) for a row when:

- any `bind` source column on the row is `null` or `undefined`, or
- the row is structural (`kind: "opening" | "closing" | "subtotal"`) or a footer row — these never render row links even if `rowLinks` is declared.

This means you can declare links optimistically on levels with mixed rows; the engine only resolves them where the data supports it.

## Worked example — a ledger with both kinds

```typescript
tree: {
  source: "accounts",
  levelName: "account",
  columns: [
    { name: "id" },                                    // needed so bind has `id` on the row
    {
      name: "name",
      header: "Account",
      links: [
        // Cell-level: chip next to the account name → jumps to the account row.
        { kind: "table", table: "accounts", bind: { id: "id" }, icon: "drill-up" },
      ],
    },
    { name: "balance", header: "Balance", kind: "number", displayFormat: "currency" },
  ],

  // Row-level: right-click → opens the ledger report scoped to this account.
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
        { name: "id" },
        { name: "journal_entry_id" },
        { name: "date", header: "Date", kind: "date" },
        { name: "memo", header: "Memo" },
        { name: "amount", header: "Amount", kind: "number", displayFormat: "currency" },
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

1. `{ name: "id" }` and `{ name: "journal_entry_id" }` are declared with **no `header`**. They're needed as bind sources but not shown as columns — this is the standard pattern for compute- or link-only columns.
2. The child level has its own `rowLinks`. Every tree level is independent.

## Patterns

- **FK drill-up** (most common): `{ kind: "table", table: "<fk-target>", bind: { id: "<fk-column>" }, icon: "drill-up" }`. Declared on either `rowLinks` or the FK column's `links`.
- **Master → children drill-into**: `{ kind: "table", table: "<child>", bind: { <fk>: "id" }, icon: "drill-into" }` — opens the child table filtered to the parent.
- **Cross-report**: `{ kind: "report", report: "<name>", bind: { <param>: "<col>" }, icon: "drill-into" }` — the target report's param names must match the bind keys.

## Checklist before shipping a report

- [ ] Every FK-like column has either a `column.links` chip or a row-level `rowLinks` entry pointing at the referenced row.
- [ ] Any row whose identity maps to another report has a `rowLinks: [{ kind: "report", ... }]`.
- [ ] All columns named in `bind` source positions are declared in `columns[]` (add header-less entries for ones that shouldn't render).
- [ ] For levels containing synthetic rows (opening/closing balances, subtotals), the report `transform` sets `kind: "opening" | "closing" | "subtotal"` on those nodes so row links are auto-suppressed.
- [ ] `sapporta check` passes.

## Related

- [report-creation](../report-creation/SKILL.md) — authoring reports. Declare links at the same time you declare columns.
- Tables get `rowLinks` auto-synthesized from their `children` and FK columns (see `extractSchemas` in `packages/core/src/schema/extract.ts`), so the same mental model carries over to the table grids.
