---
name: table-creation
description: >
  Create or modify database tables in Sapporta. Invoke for creating tables, renaming tables,
  defining schemas, adding columns, foreign keys, indexes, altering tables, or modeling data structures.
---

# Table Creation

## File Template

Every table is a TypeScript file in the project's `src/schema/` directory (e.g., `<project-dir>/src/schema/`):

```typescript
import { sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { table, text, money, timestamp } from "@sapporta/server/table";
import { Temporal } from "@sapporta/shared/temporal";

// Always export the raw Drizzle table so other schema files can reference its columns in .references()
export const ordersTable = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customer_name: text("customer_name").notNull(),
  status: text("status").notNull(),
  total: money("total").notNull().default(0),
  notes: text("notes"),
  created_at: timestamp("created_at").$defaultFn(() => Temporal.Now.instant()).notNull(),
  updated_at: timestamp("updated_at").$defaultFn(() => Temporal.Now.instant()).notNull(),
});

export const orders = table({
  drizzle: ordersTable,
  meta: {
    label: "Orders",
    selects: [
      {
        type: "select",
        column: "status",
        options: ["draft", "confirmed", "shipped", "delivered", "cancelled"],
      },
    ],
  },
});
```

## Row and Insert Types

When other code needs the TypeScript type of a table's row (e.g. a Hono handler staging records before insert, a report mapping query results), **derive it from the Drizzle table** — never hand-write a parallel `type FooRow = { ... }`. Hand-written row types drift silently when columns are added, renamed, or change nullability.

```typescript
import { ordersTable } from "./schema/orders.js";

type Order = typeof ordersTable.$inferSelect;        // row returned by .select()
type OrderInsert = typeof ordersTable.$inferInsert;  // payload for .insert().values(...)
```

- `$inferSelect` — every column present and typed per the schema. Use for values read from the DB.
- `$inferInsert` — optional wherever the DB will fill a value in: `.default()` / `.$defaultFn()` columns, autoincrement primary keys, and nullable columns. Everything else is required. Use for values about to be written.

Need a stricter shape than `$inferInsert` offers? Narrow with `Pick` / `Required` / `NonNullable` — don't hand-write a parallel type. Watch that `Required<>` strips `undefined` but keeps `null`, and is a no-op on columns that were already required.

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Table name (SQL) | Plural, snake_case | `order_items` |
| Column name | snake_case | `customer_name` |
| File name | Kebab-case `.ts` | `order-items.ts` |
| Export name | camelCase | `orderItems` |
| Drizzle variable | `{table}Table` | `orderItemsTable` |

## Primary Key

Every table must have: `id: integer("id").primaryKey({ autoIncrement: true })`

Never use composite keys, natural keys, or UUIDs as primary key. Always `integer("id").primaryKey({ autoIncrement: true })`.

## Column Types

Use the **Sapporta column factories** from `@sapporta/server/table` — not raw
Drizzle `real`/`text`/`integer` — for every semantic column. Each factory picks
the right SQLite storage type and stamps semantic metadata (`kind`,
`displayFormat`) in one move, so query/parse/display behavior falls out of the
column declaration with no second site that can drift.

| Factory (import) | SQLite storage | Query returns | Insert / update accepts | Use for |
|---|---|---|---|---|
| `money("col")` | `REAL` | `number` | `number` | money amounts — right-aligned, currency-formatted |
| `percentage("col")` | `REAL` | `number` | `number` | rates, percentages — percent-formatted |
| `number("col")` | `REAL` | `number` | `number` | any other numeric measure |
| `bool("col")` | `INTEGER 0/1` | `boolean` | `boolean` | true/false |
| `date("col")` | `TEXT` ISO `YYYY-MM-DD` | `Temporal.PlainDate` | `Temporal.PlainDate` *or* ISO string | calendar dates |
| `timestamp("col")` | `TEXT` canonical `YYYY-MM-DDTHH:mm:ssZ` | `Temporal.Instant` | `Temporal.Instant` *or* ISO string | points in time |
| `text("col")` | `TEXT` | `string` | `string` | free-form text, enum string columns |

Raw `integer("col").primaryKey({ autoIncrement: true })` from `drizzle-orm/sqlite-core`
is still used for primary keys and FKs (no semantic kind is needed — they're
relationships, not values).

**Money is REAL, not TEXT.** SQLite's REAL is double-precision float. For a
personal-scale ledger the precision is sufficient and the design simplification
is large: `ORDER BY amount`, `WHERE amount > 1000`, and `SUM(amount)` all
behave correctly with no per-column casting. Do not declare money columns with
raw `text()` — the query layer then has to re-parse strings on every compare.

**Dates and timestamps are Temporal, not `Date`.** Post-boundary, every date
is a `Temporal.PlainDate` and every timestamp a `Temporal.Instant`. Do not
reach for `Date`, `dayjs`, or `date-fns` — `Date`'s implicit-local-zone
behavior is exactly the trap these factories are designed to avoid. The
canonical TEXT form is owned by the factory; nothing above it handles strings.

**`displayFormat` is presentation, not semantics.** `money` and `percentage`
compare and sort the same as any other `number`. The only difference is how
they render. There is no `type: "money"` on `ColumnMeta` any more — the
factory has already stamped `displayFormat: "currency"`.

Deeper reading: `docs/DATA-TYPE-PRINCIPLES.md` in the Sapporta repo -- the full design rationale, including the
operator-applicability matrix and boundary-parse contract.

## Constraints

- `.notNull()` — default for required columns. Omit for truly optional fields.
- `.unique()` — for business identifiers (e.g., email, invoice number)
- `.default(value)` — for columns with defaults (e.g., `bool("active").default(true)`)
- `.$defaultFn(() => Temporal.Now.instant())` — for timestamps (JS-side default)

### Nullable numeric columns — three categories

**1. FK columns** (e.g. `parent_id`) — nullable because the relationship is optional. Auto-detected by `sapporta check` — no annotation needed.

```typescript
parent_id: integer("parent_id").references((): AnySQLiteColumn => accountsTable.id),
```

**2. Additive measures** (e.g. `debit`, `credit`) — values that participate in `SUM`/`AVG`. NULL breaks aggregation silently (`SUM(100, NULL)` = NULL, not 100). Must be `.notNull().default(0)`:

```typescript
// WRONG — nullable numerics corrupt aggregations
debit: money("debit"),

// CORRECT — default to 0 so SUM/AVG always work
debit: money("debit").notNull().default(0),
```

**3. Non-additive optionals** (e.g. `account_balance_assertion`) — NULL means "no value" and 0 means "value is zero". Mark with `additive: false` in column meta:

```typescript
account_balance_assertion: money("account_balance_assertion"),
```
```typescript
columns: {
  account_balance_assertion: { additive: false },
},
```

Ask: **could this column ever be aggregated?** If yes → `.notNull().default(0)`. If NULL is distinct from 0 → `additive: false`.

`sapporta check` flags nullable numerics that are not FK columns and not marked `additive: false`.

## Standard Columns

Every table should include:

```typescript
id: integer("id").primaryKey({ autoIncrement: true }),
created_at: timestamp("created_at").$defaultFn(() => Temporal.Now.instant()).notNull(),
updated_at: timestamp("updated_at").$defaultFn(() => Temporal.Now.instant()).notNull(),
```

## Foreign Keys

Import the **raw Drizzle table** (e.g. `ordersTable`), not the Sapporta `table()` wrapper. The wrapper types `drizzle` as generic `SQLiteTableWithColumns<any>`, which loses column type info and causes `.id` to not typecheck.

```typescript
import { ordersTable } from "./orders.js";

export const orderItemsTable = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  order_id: integer("order_id").notNull().references(() => ordersTable.id),
  product_name: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
});
```

- FK column naming: `{singular_referenced_table}_id` (e.g., `order_id`, `account_id`)
- Always use `.references(() => targetTable.id)`
- For cascade deletes: `.references(() => targetTable.id, { onDelete: "cascade" })`

For **self-referential FKs**, import `AnySQLiteColumn` and use a return-type annotation:

```typescript
import { type AnySQLiteColumn } from "drizzle-orm/sqlite-core";

parent_id: integer("parent_id").references((): AnySQLiteColumn => accountsTable.id),
```

## Enum Columns

SQLite has no native enum type. Use `text()` for the column and declare the allowed values in `meta.selects`:

```typescript
import { sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { table, text, timestamp } from "@sapporta/server/table";
import { Temporal } from "@sapporta/shared/temporal";

const orderStatusOptions = ["draft", "confirmed", "shipped", "delivered", "cancelled"];

export const ordersTable = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  status: text("status").notNull(),
  created_at: timestamp("created_at").$defaultFn(() => Temporal.Now.instant()).notNull(),
  updated_at: timestamp("updated_at").$defaultFn(() => Temporal.Now.instant()).notNull(),
});

export const orders = table({
  drizzle: ordersTable,
  meta: {
    label: "Orders",
    selects: [
      { type: "select", column: "status", options: orderStatusOptions },
    ],
  },
});
```

Rules: Values in `meta.selects.options` must match what is stored in the database. Validation is enforced at the application layer, not by database constraints. If the set of values grows over time or users can add values, use a FK to a reference table instead.

## Indexes

```typescript
import { sqliteTable, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { text } from "@sapporta/server/table";

export const orderItemsTable = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  order_id: integer("order_id").notNull(),
  sku: text("sku").notNull(),
}, (t) => [
  index("order_items_order_id_idx").on(t.order_id),
  uniqueIndex("order_items_sku_idx").on(t.sku),
]);
```

## Cross-Column Search

Opt a table into a `q=<term>` parameter on its list endpoint by declaring
`meta.search`:

```typescript
meta: {
  search: { columns: ["name", "notes"] },
}
```

Behavior:

- `GET /api/tables/<name>?q=cash` returns rows where **any** declared column
  matches `%cash%` (SQLite `LIKE`, case-insensitive for ASCII).
- The OR-group composes with `filter[col][op]=...` via AND — search narrows
  whatever filters are already applied.
- Empty or whitespace-only `q` is treated as absent — no predicate, all
  rows returned.
- The UI toolbar renders a search input **only** when `meta.search` is
  declared. A table without search config responds **400** to `?q=...`
  on purpose: silent match-everything would hide developer error.

### Which columns to declare

Pick columns a human would actually type against:

- **Good**: `name`, `title`, `description`, `notes`, `tags`, `sku`,
  `email`, `reference`. Free-text and human-readable identifiers.
- **Bad**: `id`, `parent_id`, numeric measures, booleans, timestamps.
  `LIKE` on non-text columns is rarely what the user means.
- **Enum / `meta.selects` columns**: usually belong in
  `filter[status][eq]=...`, not in search — put them there unless the user
  sometimes types partial enum values freely.

Keep the list short — every extra column is another `LIKE` in the OR
group, scanned on every query. 2-4 columns is the common case.

### When LIKE isn't enough

`meta.search` ships the scan-based LIKE path — fine for small and
medium tables. Large, search-heavy tables will later get an FTS5
(inverted-index) mode on the same `meta.search` field; it's a schema
upgrade, not a migration. Until then, don't hand-roll FTS5 outside
the framework.

## Sapporta Metadata

The `meta` object in `table()` controls UI behavior:

```typescript
meta: {
  label: "Order Items",                    // UI sidebar label

  selects: [                               // Dropdown columns
    { type: "select", column: "status", options: ["active", "inactive"] },
  ],

  immutable: true,                         // Append-only (no update/delete)

  search: {                                // Cross-column search (see above)
    columns: ["product", "notes"],
  },

  children: [                              // Has-many for nested grid display
    {
      table: "order_items",                // SQL name of child table
      foreignKey: "order_id",              // FK column in child table
      label: "Line Items",                 // Display label (optional)
      columns: ["product", "qty"],         // Columns to show (optional)
      defaultSort: "-created_at",          // Sort order (optional)
    },
  ],

  columns: {                               // Per-column display metadata
    total: { header: "Total Amount", width: 12 },
    quantity: { notes: "Actual amount in the food's serving_unit (e.g. 40 for 40gm)" },
    description: { maxWidth: 60 },         // Sizing: width, minWidth, maxWidth (char counts)
    internal_notes: { visuallyHidden: true },

    // Numeric ink — only for money/number columns. Zero/null stays neutral.
    // `money()` already stamps displayFormat: "currency" — no `type` needed.
    debit:   { tone: "positive" },         // always greens non-zero values
    credit:  { tone: "negative" },         // always reds non-zero values
    net:     { tone: "signed" },           // greens positives, reds negatives
    balance: { emphasize: true },          // fg ink + medium weight ("answer" column)
  },
}
```

Only include metadata fields you actually need. `label` is recommended for all tables.

### When to use `tone` and `emphasize`

Apply to a money/number column so the grid reads correctly at a glance:

- `tone: "positive"` — non-zero values in forest green. Use for columns that are always-positive by convention (debit, income, inflow).
- `tone: "negative"` — non-zero values in brick red. Use for always-positive columns that represent outflows (credit, expense, refund).
- `tone: "signed"` — greens positives, reds negatives, neutral at zero. Use for columns where the sign carries meaning (net, delta, p&l).
- `emphasize: true` — foreground ink at medium weight. Use for the "answer" column the reader's eye should land on (running balance, total, final amount).

These are display-only hints — the underlying values are stored verbatim and participate in aggregations normally.

## Relationship Patterns

- **One-to-many**: FK on the "many" side (e.g., `account_id` on `transactions` references `accounts`)
- **Many-to-many**: join table with two FKs (e.g., `product_tags` with `product_id` + `tag_id`)
- **Master-detail**: FK on detail table with `onDelete: "cascade"` so deleting the parent removes its children. Add `children` to the parent's `meta` for nested grid display in the UI.

## After Creating a Table

1. Run `sapporta meta schema sync` to apply the migration
2. Verify with `sapporta meta tables show <table_name>`

## Modifying Existing Tables

### Renaming UI-managed tables

Tables created through the browser UI are stored in `_sapporta_tables` metadata. Rename them with:

```bash
sapporta meta tables update <old_name> --data '{"name":"<new_name>"}'
# Optionally update label too:
sapporta meta tables update <old_name> --data '{"name":"<new_name>","label":"Display Label"}'
```

This atomically renames the SQLite table, updates all metadata rows, and fixes FK references.

### Modifying file-managed tables

Tables defined as TypeScript files in `src/schema/` are file-managed. To rename:

1. Change the `sqliteTable("old_name", ...)` first argument to the new name
2. Rename the file (e.g., `old-name.ts` → `new-name.ts`)
3. Update imports in any files that reference the old table
4. Run `sapporta meta schema sync` to apply the migration

## Reference Files

- [Full API Reference](references/full-api-reference.md) — Complete TypeScript interfaces
- [Worked Examples](references/examples.md) — Bookkeeping, orders, inventory
