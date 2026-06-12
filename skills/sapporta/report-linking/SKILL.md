---
name: report-linking
description: >
  Use when the user wants report rows, cells, or footer rows to navigate
  somewhere useful. Covers Sapporta `ReportGridResult` link resolvers,
  drill-up, drill-into, cross-report links, IDs, foreign keys, and explorable
  summary rows.
---

# Report Linking

Reports are more useful when the user can jump from a row or cell into the
underlying data. Add links in the report screen by passing resolver functions
to `ReportGridResult`. Do not put link metadata in `GridReportResult`.

The backend should include hidden identifiers in `node.columns` when the screen
needs them for navigation:

```ts
const levelColumns = {
  account: [
    { name: "accountId", label: "Account ID", visuallyHidden: true },
    { name: "name", label: "Account" },
    { name: "balance", label: "Balance", kind: "number", displayFormat: "currency" },
  ],
};
```

## Link Resolver Shape

```ts
type ReportGridLink = {
  label: string;
  href: string;
  kind?: "drill-down" | "record" | "route" | "external";
  icon?: "drill-up" | "drill-into" | "report" | "external";
  target?: "_self" | "_blank";
};
```

`ReportGridResult` accepts resolvers keyed by report level name:

```tsx
<ReportGridResult
  result={result}
  links={{
    account: {
      row: ({ node }) => [
        {
          label: "Open account",
          href: `/tables/accounts/${node.columns.accountId}`,
          kind: "record",
          icon: "drill-up",
        },
      ],
      cell: {
        name: ({ node }) => [
          {
            label: "Open ledger",
            href: `/reports/account-ledger?accountId=${node.columns.accountId}`,
            kind: "route",
            icon: "drill-into",
          },
        ],
      },
      footer: () => [
        {
          label: "Open total detail",
          href: "/reports/trial-balance/detail",
          kind: "route",
          icon: "report",
        },
      ],
    },
  }}
/>
```

Footer resolvers apply to the whole footer row. They are not per-cell footer
resolvers.

## Resolver Context

Row and cell resolvers receive:

- `result` - the full `GridReportResult`.
- `node` - the current `GridReportNode`.
- `levelName` - the current level.
- `input` - optional screen context from `linkContext`.
- `ancestors` - parent nodes for nested report rows.
- `column` and `value` - only for cell resolvers.

Footer resolvers receive `result`, `footerRow`, and `input`.

Pass current query state through `linkContext` when a link needs date range or
filter values:

```tsx
<ReportGridResult
  result={result}
  linkContext={{ input }}
  links={{
    line: {
      row: ({ node, input }) => [
        {
          label: "Open journal entry",
          href: `/tables/journal_entries/${node.columns.journalEntryId}?from=${input.periodFrom}`,
          kind: "record",
        },
      ],
    },
  }}
/>
```

## Patterns

- **FK drill-up:** link a row or FK cell to `/tables/<table>/<id>`.
- **Master to children drill-into:** link to a filtered table route or detail
  report route.
- **Cross-report:** build an href to another app report route and include the
  target route's query parameters.
- **External:** use `target: "_blank"` and `kind: "external"` only for
  intentionally external destinations.

## Checklist

- [ ] Every identifier used by a resolver is present in `node.columns`; use
  `visuallyHidden: true` for helper IDs that should not display.
- [ ] Links preserve the current report's relevant date range, workspace-safe
  filters, and query state when drilling into another screen.
- [ ] Resolvers check optional values before returning links for synthetic rows
  such as opening, closing, subtotal, or footer rows.
- [ ] Link targets enforce their own authorization. Do not treat hidden IDs or
  URL filters as authorization.
- [ ] The report screen is exercised in the browser when links are non-trivial.

## Related

- [report-creation](../report-creation/SKILL.md) - include hidden IDs while
  shaping `GridReportResult`.
- Point report links to the same user-facing destinations as table row and FK
  links where practical.
