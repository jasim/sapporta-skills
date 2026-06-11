# Table Creation — Worked Examples

All examples use the Sapporta column factories (`money`, `date`, `timestamp`,
`bool`, `text`) from `@sapporta/server/table`. See SKILL.md §"Column Types"
for what each factory returns at query time.

The examples model user-owned tables in an auth-enabled project, so each table
uses `meta.rowScope: "workspaceUserScoped"` and includes both `workspace_id`
and `scoped_to_user_id`. Sapporta manages those columns; keep them out of
insert/update payloads and hide them from generated CRUD screens with
`meta.columns`.

## Double-Entry Bookkeeping

### accounts.ts — Chart of Accounts (self-referential hierarchy)

```typescript
import { sqliteTable, integer, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { table, text, timestamp } from "@sapporta/server/table";
import { Temporal } from "@sapporta/shared/temporal";

const accountTypeOptions = ["Asset", "Liability", "Equity", "Revenue", "Expense"];

export const accountsTable = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspace_id: text("workspace_id").notNull(),
  scoped_to_user_id: text("scoped_to_user_id").notNull(),
  name: text("name").notNull(),
  account_type: text("account_type").notNull(),
  parent_id: integer("parent_id").references((): AnySQLiteColumn => accountsTable.id),
  code: text("code").unique(),
  created_at: timestamp("created_at").$defaultFn(() => Temporal.Now.instant()).notNull(),
  updated_at: timestamp("updated_at").$defaultFn(() => Temporal.Now.instant()).notNull(),
});

export const accounts = table({
  drizzle: accountsTable,
  meta: {
    label: "Accounts",
    rowScope: "workspaceUserScoped",
    selects: [
      { type: "select", column: "account_type", options: accountTypeOptions },
    ],
    // `?q=<term>` on the accounts list endpoint ORs LIKE across
    // name + code. UI toolbar surfaces a search input when this is set.
    // Omit if a table isn't worth searching — ?q= 400s without it.
    search: { columns: ["name", "code"] },
    children: [
      {
        table: "journal_lines",
        foreignKey: "account_id",
        label: "Journal Lines",
        columns: ["debit", "credit", "memo"],
      },
    ],
    columns: {
      workspace_id: { visuallyHidden: true },
      scoped_to_user_id: { visuallyHidden: true },
    },
  },
});
```

Do not add a self `children` entry for `accounts.parent_id`. The FK gives
account rows drill-up behavior to their parent, but recursive table-child graphs
are not supported by the schema-driven grid. Use a report when the app needs an
expandable account hierarchy.

### journal-entries.ts — Immutable journal entries

```typescript
import { sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { table, text, date, timestamp } from "@sapporta/server/table";
import { Temporal } from "@sapporta/shared/temporal";

export const journalEntriesTable = sqliteTable("journal_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspace_id: text("workspace_id").notNull(),
  scoped_to_user_id: text("scoped_to_user_id").notNull(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  reference: text("reference"),
  created_at: timestamp("created_at").$defaultFn(() => Temporal.Now.instant()).notNull(),
  updated_at: timestamp("updated_at").$defaultFn(() => Temporal.Now.instant()).notNull(),
});

export const journalEntries = table({
  drizzle: journalEntriesTable,
  meta: {
    label: "Journal Entries",
    rowScope: "workspaceUserScoped",
    immutable: true,
    columns: {
      workspace_id: { visuallyHidden: true },
      scoped_to_user_id: { visuallyHidden: true },
      description: { textPresentation: "multiLine" },
    },
    children: [
      {
        table: "journal_lines",
        foreignKey: "journal_entry_id",
        label: "Lines",
      },
    ],
  },
});
```

### journal-lines.ts — Immutable debit/credit lines

```typescript
import { sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { table, text, money, timestamp } from "@sapporta/server/table";
import { Temporal } from "@sapporta/shared/temporal";
import { journalEntriesTable } from "./journal-entries.js";
import { accountsTable } from "./accounts.js";

export const journalLinesTable = sqliteTable("journal_lines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspace_id: text("workspace_id").notNull(),
  scoped_to_user_id: text("scoped_to_user_id").notNull(),
  journal_entry_id: integer("journal_entry_id")
    .notNull()
    .references(() => journalEntriesTable.id, { onDelete: "cascade" }),
  account_id: integer("account_id")
    .notNull()
    .references(() => accountsTable.id),
  debit: money("debit").notNull().default(0),
  credit: money("credit").notNull().default(0),
  memo: text("memo"),
  created_at: timestamp("created_at").$defaultFn(() => Temporal.Now.instant()).notNull(),
  updated_at: timestamp("updated_at").$defaultFn(() => Temporal.Now.instant()).notNull(),
});

export const journalLines = table({
  drizzle: journalLinesTable,
  meta: {
    label: "Journal Lines",
    rowScope: "workspaceUserScoped",
    immutable: true,
    columns: {
      workspace_id: { visuallyHidden: true },
      scoped_to_user_id: { visuallyHidden: true },
      // tone greens debits / reds credits so the grid reads the accounting
      // convention at a glance — zero stays neutral either way. No `type`
      // needed — `money()` already stamped displayFormat: "currency".
      debit: { tone: "positive" },
      credit: { tone: "negative" },
      memo: { textPresentation: "multiLine" },
    },
  },
});
```

## Order Management

The order/order-items pattern follows the same master-detail structure as
journal-entries/journal-lines above — a text status column with `meta.selects`
on the parent, `onDelete: "cascade"` on the child FK, `children` in parent
meta for nested grid, and `money()` on price columns. See the bookkeeping
examples for the full pattern.

Add `children` for inbound FKs even when the child is not cascade-owned by the
parent. For example, `journal_lines.account_id -> accounts.id` is not owned by
`accounts`, but account rows should expose journal lines because users review
activity from the account.

## Inventory Management

### products.ts — Demonstrates `unique()` and boolean defaults

```typescript
import { sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { table, text, money, bool, timestamp } from "@sapporta/server/table";
import { Temporal } from "@sapporta/shared/temporal";

export const productsTable = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspace_id: text("workspace_id").notNull(),
  scoped_to_user_id: text("scoped_to_user_id").notNull(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  unit_cost: money("unit_cost"),
  active: bool("active").notNull().default(true),
  created_at: timestamp("created_at").$defaultFn(() => Temporal.Now.instant()).notNull(),
  updated_at: timestamp("updated_at").$defaultFn(() => Temporal.Now.instant()).notNull(),
});

export const products = table({
  drizzle: productsTable,
  meta: {
    label: "Products",
    rowScope: "workspaceUserScoped",
    search: { columns: ["name", "sku"] },
    columns: {
      workspace_id: { visuallyHidden: true },
      scoped_to_user_id: { visuallyHidden: true },
      unit_cost: {
        additive: false,
        notes: "Cost per unit from supplier, excluding tax",
      },
    },
  },
});
```

The warehouses and stock-movements tables follow the same patterns —
warehouses is a simple reference table (like accounts without the self-ref
FK), and stock-movements combines multiple FKs (product_id + warehouse_id), a
text status column with `meta.selects`, and `immutable: true` (like
journal-lines). Products and warehouses should both declare `children` pointing
to `stock_movements` if users should browse movement history from either side.
