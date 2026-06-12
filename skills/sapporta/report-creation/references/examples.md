# Route-Based Report Examples

These examples show report contracts, handlers, pure mappers, and frontend
screens. Keep real app code aligned with the project's existing module layout.

## Trial Balance

Shared contract:

```ts
import { z } from "zod";
import { initContract } from "@sapporta/rest-core";
import { gridReportResultSchema } from "@sapporta/shared/report-grid";
import { errorBodySchema } from "@sapporta/shared/contracts";

const c = initContract();

export const reportsContract = c.router({
  trialBalance: c.query({
    method: "GET",
    path: "/reports/trial-balance",
    query: z.object({ asOfDate: z.string() }),
    responses: {
      200: gridReportResultSchema,
      400: errorBodySchema,
      403: errorBodySchema,
    },
  }),
});
```

Backend handler:

```ts
import { TsRestApi, type SapportaEnv } from "@sapporta/server";
import { reportsContract } from "my-app-shared/contracts";

const api = new TsRestApi<SapportaEnv>();

api.register("trialBalance", reportsContract.trialBalance, async ({ c, request }) => {
  const auth = c.get("auth");
  auth.requireCan("read", "reports:trial-balance");

  const rows = await readTrialBalanceRows({
    db: c.get("db"),
    auth,
    asOfDate: request.query.asOfDate,
  });

  return { status: 200, body: toTrialBalanceResult(rows) };
});

export default api;
```

Pure mapper:

```ts
import type { GridReportResult } from "@sapporta/shared/report-grid";

type TrialBalanceRow = {
  accountId: number;
  account: string;
  debit: number;
  credit: number;
};

export function toTrialBalanceResult(rows: TrialBalanceRow[]): GridReportResult {
  const levelColumns = {
    account: [
      { name: "accountId", label: "Account ID", visuallyHidden: true },
      { name: "account", label: "Account" },
      { name: "debit", label: "Debit", kind: "number", displayFormat: "currency" },
      { name: "credit", label: "Credit", kind: "number", displayFormat: "currency" },
    ],
  };

  return {
    name: "trial-balance",
    label: "Trial Balance",
    columns: levelColumns.account,
    levelColumns,
    data: rows.map((row) => ({ levelName: "account", columns: row })),
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

Frontend screen:

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
      {result ? (
        <ReportGridResult
          result={result}
          links={{
            account: {
              cell: {
                account: ({ node }) => [
                  {
                    label: "Open ledger",
                    href: `/reports/account-ledger?accountId=${node.columns.accountId}`,
                    kind: "route",
                    icon: "drill-into",
                  },
                ],
              },
            },
          }}
        />
      ) : null}
    </ReportScreenFrame>
  );
}
```

## Account Ledger

Use a top-level account row with child line rows when the report needs a
running balance.

```ts
type AccountRow = {
  accountId: number;
  account: string;
  openingBalance: number;
};

type LedgerLineRow = {
  accountId: number;
  journalEntryId: number;
  date: string;
  memo: string | null;
  debit: number;
  credit: number;
};

export function toAccountLedgerResult(
  account: AccountRow,
  lines: LedgerLineRow[],
): GridReportResult {
  const levelColumns = {
    account: [
      { name: "accountId", label: "Account ID", visuallyHidden: true },
      { name: "account", label: "Account" },
      { name: "balance", label: "Balance", kind: "number", displayFormat: "currency" },
    ],
    line: [
      { name: "journalEntryId", label: "Journal Entry ID", visuallyHidden: true },
      { name: "date", label: "Date", kind: "date" },
      { name: "memo", label: "Memo" },
      { name: "debit", label: "Debit", kind: "number", displayFormat: "currency" },
      { name: "credit", label: "Credit", kind: "number", displayFormat: "currency" },
      { name: "balance", label: "Balance", kind: "number", displayFormat: "currency" },
    ],
  };

  let balance = account.openingBalance;
  const lineNodes = lines.map((line) => {
    balance += line.debit - line.credit;
    return {
      levelName: "line",
      columns: { ...line, balance },
    };
  });

  return {
    name: "account-ledger",
    label: "Account Ledger",
    columns: levelColumns.account,
    levelColumns,
    data: [
      {
        levelName: "account",
        columns: { accountId: account.accountId, account: account.account },
        rollup: { balance },
        children: {
          line: [
            {
              levelName: "line",
              kind: "opening",
              columns: { memo: "Opening balance", balance: account.openingBalance },
            },
            ...lineNodes,
          ],
        },
      },
    ],
  };
}
```

## Route Test

```ts
import { gridReportResultSchema } from "@sapporta/shared/report-grid";

it("returns a grid report result", async () => {
  const response = await app.request(
    "/api/reports/trial-balance?asOfDate=2026-06-12",
  );

  expect(response.status).toBe(200);
  const body = gridReportResultSchema.parse(await response.json());
  expect(body.name).toBe("trial-balance");
});
```
