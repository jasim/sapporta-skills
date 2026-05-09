# Report Creation — Worked Examples

## Trial Balance

Single-level report showing all accounts with their total debits and credits, plus a grand total footer.

```typescript
import { report } from "@sapporta/server/report";

export default report({
  name: "trial-balance",
  label: "Trial Balance",

  params: [
    { name: "as_of_date", type: "date", required: true, label: "As of Date" },
  ],

  sources: {
    accounts: {
      query: `
        SELECT
          a.id,
          a.name,
          a.account_type,
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

  tree: {
    source: "accounts",
    levelName: "account",
    columns: [
      { name: "name", header: "Account" },
      { name: "account_type", header: "Type" },
      { name: "total_debit", header: "Debit", format: "currency" },
      { name: "total_credit", header: "Credit", format: "currency" },
    ],
    footer: [
      {
        label: "Grand Total",
        compute: (nodes) => ({
          total_debit: nodes.reduce(
            (sum, n) => sum + (Number(n.columns.total_debit) || 0), 0,
          ),
          total_credit: nodes.reduce(
            (sum, n) => sum + (Number(n.columns.total_credit) || 0), 0,
          ),
        }),
      },
    ],
  },
});
```

## General Ledger

Two-level report: accounts at the top level, transactions as children. Includes rollup for totals and transform for running balance.

```typescript
import { report } from "@sapporta/server/report";

export default report({
  name: "general-ledger",
  label: "General Ledger",

  params: [
    { name: "start_date", type: "date", required: true, label: "Start Date" },
    { name: "end_date", type: "date", required: true, label: "End Date" },
  ],

  sources: {
    accounts: {
      query: `
        SELECT a.id, a.name, a.account_type
        FROM accounts a
        WHERE EXISTS (
          SELECT 1 FROM journal_lines jl
          JOIN journal_entries je ON je.id = jl.journal_entry_id
          WHERE jl.account_id = a.id
            AND je.date BETWEEN $start_date AND $end_date
        )
        ORDER BY a.name
      `,
    },
    // NOTE: $account_id comes from bind below — it MUST appear in the WHERE clause
    // or this query will return ALL transactions regardless of parent account
    transactions: {
      query: `
        SELECT
          je.date,
          je.description,
          je.reference,
          jl.debit,
          jl.credit,
          jl.memo
        FROM journal_lines jl
        JOIN journal_entries je ON je.id = jl.journal_entry_id
        WHERE jl.account_id = $account_id
          AND je.date BETWEEN $start_date AND $end_date
        ORDER BY je.date, je.id
      `,
    },
  },

  tree: {
    source: "accounts",
    levelName: "account",
    columns: [
      { name: "name", header: "Account" },
      { name: "account_type", header: "Type" },
    ],

    // Compute totals from child transactions
    rollup: (children) => {
      const txns = children.transaction || [];
      return {
        total_debit: txns.reduce((s, n) => s + (Number(n.columns.debit) || 0), 0),
        total_credit: txns.reduce((s, n) => s + (Number(n.columns.credit) || 0), 0),
      };
    },

    children: [
      {
        source: "transactions",
        levelName: "transaction",
        columns: [
          { name: "date", header: "Date", format: "date" },
          { name: "description", header: "Description" },
          { name: "reference", header: "Ref" },
          { name: "debit", header: "Debit", format: "currency" },
          { name: "credit", header: "Credit", format: "currency" },
          { name: "running_balance", header: "Balance", format: "currency" },
          { name: "memo", header: "Memo" },
        ],

        // Bind parent account ID into the child query
        bind: { account_id: "$parent.id" },

        // Sort by date ascending
        sort: [{ key: "date", direction: "asc" }],

        // Add running balance via transform
        transform: (nodes) => {
          let balance = 0;
          return nodes.map((node) => {
            balance += (Number(node.columns.debit) || 0) - (Number(node.columns.credit) || 0);
            return {
              ...node,
              columns: { ...node.columns, running_balance: balance },
            };
          });
        },
      },
    ],
  },
});
```

## Parameterized Report with Lookup and Optional Filter

Report with a lookup dropdown, date range, and optional text filter.

```typescript
import { report } from "@sapporta/server/report";

export default report({
  name: "account-activity",
  label: "Account Activity Summary",

  params: [
    { name: "start_date", type: "date", required: true, label: "Start Date" },
    { name: "end_date", type: "date", required: true, label: "End Date" },
    // lookup renders a dropdown populated from the accounts table
    { name: "account_id", type: "integer", required: true, label: "Account", lookup: "accounts" },
    {
      name: "account_type",
      type: "string",
      required: false,
      default: null,
      label: "Account Type (optional)",
    },
  ],

  sources: {
    summary: {
      query: `
        SELECT
          a.name,
          a.account_type,
          COUNT(jl.id) AS transaction_count,
          COALESCE(SUM(jl.debit), 0) AS total_debit,
          COALESCE(SUM(jl.credit), 0) AS total_credit,
          COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0) AS net
        FROM accounts a
        LEFT JOIN journal_lines jl ON jl.account_id = a.id
        LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id
          AND je.date BETWEEN $start_date AND $end_date
        WHERE ($account_type IS NULL OR a.account_type = $account_type)
        GROUP BY a.id, a.name, a.account_type
        HAVING COUNT(jl.id) > 0
        ORDER BY a.name
      `,
    },
  },

  tree: {
    source: "summary",
    levelName: "account",
    columns: [
      { name: "name", header: "Account" },
      { name: "account_type", header: "Type" },
      { name: "transaction_count", header: "# Transactions", format: "integer" },
      { name: "total_debit", header: "Total Debit", format: "currency" },
      { name: "total_credit", header: "Total Credit", format: "currency" },
      { name: "net", header: "Net", format: "currency" },
    ],
    footer: [
      {
        label: "Totals",
        compute: (nodes) => ({
          transaction_count: nodes.reduce(
            (s, n) => s + (Number(n.columns.transaction_count) || 0), 0,
          ),
          total_debit: nodes.reduce(
            (s, n) => s + (Number(n.columns.total_debit) || 0), 0,
          ),
          total_credit: nodes.reduce(
            (s, n) => s + (Number(n.columns.total_credit) || 0), 0,
          ),
          net: nodes.reduce(
            (s, n) => s + (Number(n.columns.net) || 0), 0,
          ),
        }),
      },
    ],
  },
});
```
