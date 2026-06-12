---
name: report-creation
description: >
  Use when the user wants to create or change Sapporta reports. Covers
  route-based report APIs, shared report contracts, GridReportResult mappers,
  report screens, summaries, financial statements, trial balances, ledgers, and
  route/result validation.
---

# Report Creation

Build a report as an API route that returns grid-renderable data, plus a React
screen that displays it. Choose the URL, parameters, permission check, query,
screen route, and navigation entry for the report you are adding.

Use this shape:

1. Define a shared route contract in `packages/shared/src/contracts/`.
2. Implement a thin `TsRestApi` handler under `packages/api/app/`.
3. Put query logic in a domain store/service when it is more than trivial.
4. Map rows to `GridReportResult` in a pure function.
5. Build a React screen under `packages/frontend/src/` and render
   `ReportGridResult`.

Do not create report files in `packages/api/reports/`, use `report({...})`, or
run `sapporta reports`. Put report work in the shared contract, API route, and
frontend screen instead.

## Backend Contract

Declare reports as normal ts-rest routes. Prefer `GET` query parameters for
simple report inputs and `POST` bodies for larger filters.

```ts
import { z } from "zod";
import { initContract } from "@sapporta/rest-core";
import { gridReportResultSchema } from "@sapporta/shared/report-grid";
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
    200: gridReportResultSchema,
    400: errorBodySchema,
    403: errorBodySchema,
  },
});
```

Re-export the contract through `packages/shared/src/contracts/index.ts` and add
a typed frontend client in `packages/frontend/src/api.ts`.

## Backend Handler

Resolve auth and request input at the route edge, read rows with scoped data
access, and return a plain object satisfying `GridReportResult`.

```ts
import { sql } from "drizzle-orm";
import { TsRestApi, type SapportaEnv } from "@sapporta/server";
import type { GridReportResult } from "@sapporta/shared/report-grid";
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
): GridReportResult {
  const levelColumns = {
    account: [
      { name: "accountId", label: "Account ID", visuallyHidden: true },
      { name: "account", label: "Account" },
      {
        name: "debit",
        label: "Debit",
        kind: "number",
        displayFormat: "currency",
        zeroDisplay: "blank",
      },
      {
        name: "credit",
        label: "Credit",
        kind: "number",
        displayFormat: "currency",
        zeroDisplay: "blank",
      },
    ],
  };

  return {
    name: "trial-balance",
    label: "Trial Balance",
    columns: levelColumns.account,
    levelColumns,
    data: rows.map((row) => ({
      levelName: "account",
      columns: row,
    })),
    footerRows: [
      {
        label: "Grand Total",
        columns: {
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

The shared response type lives at `@sapporta/shared/report-grid`.

`GridReportResult` contains:

- `name` and `label` for the dataset.
- `columns` for the top-level grid.
- `levelColumns` keyed by each node level name.
- `data`, an array of `GridReportNode`.
- optional `footerRows`, `levelOptions`, `stats`, and `errors`.

`GridReportResult` is the response format rendered by `ReportGridResult`. Keep
querying, permissions, route state, and navigation in the surrounding route and
screen code.

Declare hidden identifiers when the frontend needs them for links:

```ts
const levelColumns = {
  account: [
    { name: "accountId", label: "Account ID", visuallyHidden: true },
    { name: "name", label: "Account" },
    { name: "balance", label: "Balance", kind: "number", displayFormat: "currency" },
  ],
};
```

## Hierarchical Results

Return parent nodes with child groups. Keep the mapper pure so it can be tested
without a database.

```ts
function toBalanceSheetResult(
  sections: { section: string }[],
  accounts: { section: string; account: string; balance: number }[],
): GridReportResult {
  const levelColumns = {
    section: [
      { name: "section", label: "Section" },
      { name: "sectionTotal", label: "Total", kind: "number", displayFormat: "currency" },
    ],
    account: [
      { name: "account", label: "Account" },
      { name: "balance", label: "Balance", kind: "number", displayFormat: "currency" },
    ],
  };

  const data = sections.map((section) => {
    const childRows = accounts.filter((row) => row.section === section.section);
    const sectionTotal = childRows.reduce((sum, row) => sum + row.balance, 0);

    return {
      levelName: "section",
      columns: { section: section.section },
      rollup: { sectionTotal },
      children: {
        account: childRows.map((row) => ({
          levelName: "account",
          columns: { account: row.account, balance: row.balance },
        })),
      },
    };
  });

  return {
    name: "balance-sheet",
    label: "Balance Sheet",
    columns: levelColumns.section,
    levelColumns,
    data,
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

```tsx
import { useEffect, useState } from "react";
import { ReportGridResult, ReportScreenFrame } from "@sapporta/frontend/report";
import type { GridReportResult } from "@sapporta/shared/report-grid";
import { reportsApi } from "../api";

export function TrialBalanceReport() {
  const [result, setResult] = useState<GridReportResult | null>(null);

  useEffect(() => {
    void reportsApi
      .trialBalance({ query: { asOfDate: "2026-06-12" } })
      .then(setResult);
  }, []);

  return (
    <ReportScreenFrame title="Trial Balance">
      {result ? <ReportGridResult result={result} /> : null}
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
pnpm exec sapporta check
```

Also add route tests that parse the response with `gridReportResultSchema` and
unit tests for pure row-to-result mappers when the report has hierarchy,
rollups, or non-trivial totals.

## References

- [Report Linking](../report-linking/SKILL.md) - frontend link resolvers for
  row, cell, and footer navigation.
- [Full API Reference](references/full-api-reference.md) - `GridReportResult`
  and report renderer types.
- [Worked Examples](references/examples.md) - route-based report examples.
