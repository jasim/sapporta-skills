# Table Creation — Worked Examples

All examples use the Sapporta column factories (`money`, `date`, `timestamp`,
`bool`, `text`) from `@sapporta/server/table`. See SKILL.md §"Column Types"
for what each factory returns at query time.

## Double-Entry Bookkeeping

### accounts.ts — Chart of Accounts (self-referential hierarchy)

```typescript
import { sqliteTable, integer, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { table, text, timestamp } from "@sapporta/server/table";
import { Temporal } from "@sapporta/shared/temporal";

const accountTypeOptions = ["Asset", "Liability", "Equity", "Revenue", "Expense"];

export const accountsTable = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
    selects: [
      { type: "select", column: "account_type", options: accountTypeOptions },
    ],
    // `?q=<term>` on the accounts list endpoint ORs LIKE across
    // name + code. UI toolbar surfaces a search input when this is set.
    // Omit if a table isn't worth searching — ?q= 400s without it.
    search: { columns: ["name", "code"] },
  },
});
```

### journal-entries.ts — Immutable journal entries

```typescript
import { sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { table, text, date, timestamp } from "@sapporta/server/table";
import { Temporal } from "@sapporta/shared/temporal";

export const journalEntriesTable = sqliteTable("journal_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
    immutable: true,
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
    immutable: true,
    columns: {
      // tone greens debits / reds credits so the grid reads the accounting
      // convention at a glance — zero stays neutral either way. No `type`
      // needed — `money()` already stamped displayFormat: "currency".
      debit: { tone: "positive" },
      credit: { tone: "negative" },
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

## Inventory Management

### products.ts — Demonstrates `unique()` and boolean defaults

```typescript
import { sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { table, text, money, bool, timestamp } from "@sapporta/server/table";
import { Temporal } from "@sapporta/shared/temporal";

export const productsTable = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
    search: { columns: ["name", "sku"] },
    columns: {
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
journal-lines).
