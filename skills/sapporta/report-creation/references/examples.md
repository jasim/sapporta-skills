# Route-Based Report Examples

These examples show report contracts, handlers, pure mappers, and frontend
screens. Keep real app code aligned with the project's existing module layout.

## Trial Balance

Shared contract:

```ts
import { z } from "zod";
import { initContract } from "@sapporta/rest-core";
import { gridDatasetSchema } from "@sapporta/shared/grid-dataset";
import { errorBodySchema } from "@sapporta/shared/contracts";

const c = initContract();

export const reportsContract = c.router({
  trialBalance: c.query({
    method: "GET",
    path: "/reports/trial-balance",
    query: z.object({ asOfDate: z.string() }),
    responses: {
      200: gridDatasetSchema,
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
import type { GridDataset } from "@sapporta/shared/grid-dataset";

type TrialBalanceRow = {
  accountId: number;
  account: string;
  debit: number;
  credit: number;
};

export function toTrialBalanceResult(rows: TrialBalanceRow[]): GridDataset {
  return {
    name: "trial-balance",
    label: "Trial Balance",
    rootLevel: "account",
    levels: {
      account: {
        columns: [
          { id: "accountId", label: "Account ID", kind: "text", visuallyHidden: true },
          { id: "account", label: "Account", kind: "text" },
          { id: "debit", label: "Debit", kind: "number", displayFormat: "currency" },
          { id: "credit", label: "Credit", kind: "number", displayFormat: "currency" },
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

Frontend screen:

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
      {dataset ? (
        <ReportGridDataset
          dataset={dataset}
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
import type { GridDataset } from "@sapporta/shared/grid-dataset";

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
): GridDataset {
  let balance = account.openingBalance;
  const lineNodes = lines.map((line) => {
    balance += line.debit - line.credit;
    return {
      rowKey: String(line.journalEntryId),
      levelName: "line",
      columns: { ...line, balance },
    };
  });

  return {
    name: "account-ledger",
    label: "Account Ledger",
    rootLevel: "account",
    levels: {
      account: {
        columns: [
          { id: "accountId", label: "Account ID", kind: "text", visuallyHidden: true },
          { id: "account", label: "Account", kind: "text" },
          { id: "balance", label: "Balance", kind: "number", displayFormat: "currency" },
        ],
        childLevels: ["line"],
      },
      line: {
        columns: [
          { id: "journalEntryId", label: "Journal Entry ID", kind: "text", visuallyHidden: true },
          { id: "date", label: "Date", kind: "date" },
          { id: "memo", label: "Memo", kind: "text" },
          { id: "debit", label: "Debit", kind: "number", displayFormat: "currency" },
          { id: "credit", label: "Credit", kind: "number", displayFormat: "currency" },
          { id: "balance", label: "Balance", kind: "number", displayFormat: "currency" },
        ],
        childLevels: [],
      },
    },
    nodes: [
      {
        rowKey: String(account.accountId),
        levelName: "account",
        columns: { accountId: account.accountId, account: account.account },
        rollup: { balance },
        children: {
          line: [
            {
              rowKey: "opening",
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
import { gridDatasetSchema } from "@sapporta/shared/grid-dataset";

it("returns a grid dataset", async () => {
  const response = await app.request(
    "/api/reports/trial-balance?asOfDate=2026-06-12",
  );

  expect(response.status).toBe(200);
  const body = gridDatasetSchema.parse(await response.json());
  expect(body.name).toBe("trial-balance");
});
```
