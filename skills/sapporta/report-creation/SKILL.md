---
name: report-creation
description: >
  Use when the user wants to create or change Sapporta reports. Covers
  route-based report APIs, shared report contracts, GridDataset mappers, report
  screens, summaries, financial statements, trial balances, ledgers, and
  route/dataset validation.
---

# Report Creation

Build a report as an API route that returns grid-renderable data, plus a React
screen that displays it. Choose the URL, parameters, permission check, query,
screen route, and navigation entry for the report you are adding.

Use this shape:

1. Define a shared route contract in `packages/shared/src/contracts/`.
2. Implement a thin `TsRestApi` handler under `packages/api/app/`.
3. Put query logic in a domain store/service when it is more than trivial.
4. Map rows to `GridDataset` in a pure function.
5. Build a React screen under `packages/frontend/src/` and render
   `ReportGridDataset`.

Do not create report files in `packages/api/reports/`, use `report({...})`, or
run `sapporta reports`. Put report work in the shared contract, API route, and
frontend screen instead.

## Report Module Organization

Treat one report as one backend module. Keep the report's `api.register(...)`,
report-specific row types, read/query orchestration, and `GridDataset`
mapper together in one `.ts` file unless the query or shared domain logic is
large enough to move into a store/service.

For multiple reports, keep `packages/api/app/reports.ts` as a thin aggregator
that imports and mounts individual report modules, such as:

- `packages/api/app/reports/trial-balance.ts`
- `packages/api/app/reports/balance-sheet.ts`
- `packages/api/app/reports/account-ledger.ts`

Do not collect many unrelated report queries, row types, handlers, and mappers
in one large `reports.ts`. Shared contract routers and frontend clients may
still aggregate reports when that keeps client usage simple.

## Backend Contract

Declare reports as normal ts-rest routes. Prefer `GET` query parameters for
simple report inputs and `POST` bodies for larger filters.

```ts
import { z } from "zod";
import { initContract } from "@sapporta/rest-core";
import { gridDatasetSchema } from "@sapporta/shared/grid-dataset";
import { errorBodySchema } from "@sapporta/shared/contracts";

const c = initContract();

export const trialBalanceRoute = c.query({
  method: "GET",
  path: "/reports/trial-balance",
  summary: "Trial Balance",
  metadata: { tags: ["reports"] },
  query: z.object({
    asOfDate: z.string(),
  }),
  responses: {
    200: gridDatasetSchema,
    400: errorBodySchema,
    403: errorBodySchema,
  },
});
```

Re-export the contract through `packages/shared/src/contracts/index.ts` and add
a typed frontend client in `packages/frontend/src/api.ts`.

## Backend Handler

Resolve auth and request input at the route edge, read rows with scoped data
access, and return a plain object satisfying `GridDataset`.

```ts
import { sql } from "drizzle-orm";
import { TsRestApi, type SapportaEnv } from "@sapporta/server";
import type { GridDataset } from "@sapporta/shared/grid-dataset";
import { accounts, journals, journalEntries } from "../schema/index";
import { trialBalanceRoute } from "my-app-shared/contracts";

const api = new TsRestApi<SapportaEnv>();

api.register("trialBalance", trialBalanceRoute, async ({ c, request }) => {
  const db = c.get("db");
  const auth = c.get("auth");
  auth.requireCan("read", "reports:trial-balance");

  const rows = await db
    .select({
      accountId: accounts.drizzle.id,
      account: accounts.drizzle.name,
      debit: sql<number>`max(coalesce(sum(${journalEntries.drizzle.debit}), 0) - coalesce(sum(${journalEntries.drizzle.credit}), 0), 0)`,
      credit: sql<number>`max(coalesce(sum(${journalEntries.drizzle.credit}), 0) - coalesce(sum(${journalEntries.drizzle.debit}), 0), 0)`,
    })
    .from(accounts.drizzle)
    .leftJoin(
      journalEntries.drizzle,
      sql`${journalEntries.drizzle.accountId} = ${accounts.drizzle.id}`,
    )
    .leftJoin(
      journals.drizzle,
      sql`${journals.drizzle.id} = ${journalEntries.drizzle.journalId}`,
    )
    .where(sql`${journals.drizzle.date} <= ${request.query.asOfDate}`)
    .groupBy(accounts.drizzle.id, accounts.drizzle.name)
    .all();

  return { status: 200, body: toTrialBalanceResult(rows) };
});

export default api;

function toTrialBalanceResult(
  rows: {
    accountId: number;
    account: string;
    debit: number;
    credit: number;
  }[],
): GridDataset {
  return {
    name: "trial-balance",
    label: "Trial Balance",
    rootLevel: "account",
    levels: {
      account: {
        columns: [
          { id: "accountId", label: "Account ID", kind: "text", visuallyHidden: true },
          { id: "account", label: "Account", kind: "text" },
          {
            id: "debit",
            label: "Debit",
            kind: "number",
            displayFormat: "currency",
            zeroDisplay: "blank",
          },
          {
            id: "credit",
            label: "Credit",
            kind: "number",
            displayFormat: "currency",
            zeroDisplay: "blank",
          },
        ],
        childLevels: [],
      },
    },
    nodes: rows.map((row) => ({
      rowKey: String(row.accountId),
      levelName: "account",
      columns: row,
    })),
    footerRows: [
      {
        rowKey: "grand-total",
        columns: {
          account: "Grand Total",
          debit: rows.reduce((sum, row) => sum + row.debit, 0),
          credit: rows.reduce((sum, row) => sum + row.credit, 0),
        },
      },
    ],
  };
}
```

For auth-enabled projects, do not accept `workspace_id`, `workspaceId`,
`scoped_to_user_id`, or `scopedToUserId` from the client. Use the route's auth
context plus `scopedRows()` or `auth.rowSecurity.forTable(table)` in Drizzle
queries. For raw SQL, make visible base tables explicit with CTEs before
composing the report query.

## Grid Result Shape

The shared response type lives at `@sapporta/shared/grid-dataset`.

`GridDataset` contains:

- `name` and `label` for the dataset.
- `rootLevel`, the level rendered at the root.
- `levels`, keyed by each node level name.
- `nodes`, an array of dataset nodes.
- optional `footerRows`, `totalCount`, `stats`, and `errors`.

`GridDataset` is the response format rendered by `ReportGridDataset`. Keep
querying, permissions, route state, and navigation in the surrounding route and
screen code.

Declare hidden identifiers when the frontend needs them for links:

```ts
const columns = [
  { id: "accountId", label: "Account ID", kind: "text", visuallyHidden: true },
  { id: "name", label: "Account", kind: "text" },
  { id: "balance", label: "Balance", kind: "number", displayFormat: "currency" },
];
```

## Hierarchical Results

Return parent nodes with child groups. Keep the mapper pure so it can be tested
without a database.

```ts
function toBalanceSheetResult(
  sections: { section: string }[],
  accounts: { section: string; account: string; balance: number }[],
): GridDataset {
  const nodes = sections.map((section) => {
    const childRows = accounts.filter((row) => row.section === section.section);
    const sectionTotal = childRows.reduce((sum, row) => sum + row.balance, 0);

    return {
      rowKey: section.section,
      levelName: "section",
      columns: { section: section.section },
      rollup: { sectionTotal },
      children: {
        account: childRows.map((row) => ({
          rowKey: row.account,
          levelName: "account",
          columns: { account: row.account, balance: row.balance },
        })),
      },
    };
  });

  return {
    name: "balance-sheet",
    label: "Balance Sheet",
    rootLevel: "section",
    levels: {
      section: {
        columns: [
          { id: "section", label: "Section", kind: "text" },
          { id: "sectionTotal", label: "Total", kind: "number", displayFormat: "currency" },
        ],
        childLevels: ["account"],
      },
      account: {
        columns: [
          { id: "account", label: "Account", kind: "text" },
          { id: "balance", label: "Balance", kind: "number", displayFormat: "currency" },
        ],
        childLevels: [],
      },
    },
    nodes,
  };
}
```

Use `rollup` for parent totals, `footerRows` for top-level synthetic totals,
`childFooterRows` for child-level totals, and node `kind` for opening,
closing, or subtotal rows.

## Date Ranges

Use the shared flat URL shape:

- `period_relative=30d`
- `period_from=2026-01-01&period_to=2026-01-31`

Resolve bounds once at the API boundary:

```ts
import { resolveDateRangeQueryBounds } from "@sapporta/shared";

const period = resolveDateRangeQueryBounds("period", request.query);
```

`from` and `to` are ISO date strings or `null`; `null` means unbounded.

## Frontend Screen

Render report results in a report screen. Keep query state, navigation, and
link behavior in that screen.

Use the report component for normal reports. Do not copy report grid internals
to build a different grid-like screen. When a screen owns its own row shape,
loading behavior, hierarchy, editing rules, side panels, or toolbar behavior,
read the frontend custom-grid guidance and
`docs/BASEGRID-GUIDE.md#build-a-custom-grid-screen`.

```tsx
import { useEffect, useState } from "react";
import { ReportGridDataset, ReportScreenFrame } from "@sapporta/frontend/report";
import type { GridDataset } from "@sapporta/shared/grid-dataset";
import { reportsApi } from "../api";

export function TrialBalanceReport() {
  const [dataset, setDataset] = useState<GridDataset | null>(null);

  useEffect(() => {
    void reportsApi
      .trialBalance({ query: { asOfDate: "2026-06-12" } })
      .then(setDataset);
  }, []);

  return (
    <ReportScreenFrame title="Trial Balance">
      {dataset ? <ReportGridDataset dataset={dataset} /> : null}
    </ReportScreenFrame>
  );
}
```

Add the screen to the app's React Router routes and navigation.

## Validation

Use the smallest loop that proves the report:

```bash
pnpm exec sapporta describe "GET /api/reports/trial-balance"
curl -fsS "${SAPPORTA_API_URL:-http://localhost:3000}/api/reports/trial-balance?asOfDate=2026-06-12"
```

Also add route tests that parse the response with `gridDatasetSchema` and
unit tests for pure row-to-dataset mappers when the report has hierarchy,
rollups, or non-trivial totals.

## References

- [Report Linking](../report-linking/SKILL.md) - frontend link resolvers for
  row, cell, and footer navigation.
- [Full API Reference](references/full-api-reference.md) - `GridDataset`
  and report renderer types.
- [Worked Examples](references/examples.md) - route-based report examples.
