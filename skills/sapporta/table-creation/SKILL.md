---
name: table-creation
description: >
  Use when the user wants to define or change Sapporta database tables in
  TypeScript. Covers table modeling, creating or renaming tables, columns,
  foreign keys, indexes, search config, display metadata, and Drizzle
  migration workflow.
---

# Table Creation

## File Template

Every table is a TypeScript file in the project's `packages/api/schema/` directory (e.g., `<project-dir>/packages/api/schema/`):

```typescript
import { sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { table, text, money, timestamp } from "@sapporta/server/table";
import { Temporal } from "@sapporta/shared/temporal";

// Always export the raw Drizzle table so other schema files can reference its columns in .references()
export const ordersTable = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspace_id: text("workspace_id").notNull(),
  scoped_to_user_id: text("scoped_to_user_id").notNull(),
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
    rowScope: "workspaceUserScoped",
    selects: [
      {
        type: "select",
        column: "status",
        options: ["draft", "confirmed", "shipped", "delivered", "cancelled"],
      },
    ],
    columns: {
      workspace_id: { visuallyHidden: true },
      scoped_to_user_id: { visuallyHidden: true },
    },
  },
});
```

## Auth Row Scope

Auth-enabled projects must declare `meta.rowScope` on every table:

- `workspaceUserScoped` requires `workspace_id` and `scoped_to_user_id`.
- `workspaceGlobal` requires `workspace_id`.
- `systemGlobal` is for installation-wide reference data and has no workspace
  predicate.

Do not infer row scope from column presence. Declare it explicitly. Scope
columns are system-managed; clients must not submit or edit `workspace_id`,
`workspaceId`, `scoped_to_user_id`, or `scopedToUserId`. Use Drizzle
`.references()` wherever possible and `meta.references` only when a relationship
cannot be proven from Drizzle metadata.

If the table has `workspace_id` or `scoped_to_user_id`, hide them from generated
CRUD screens:

```typescript
columns: {
  workspace_id: { visuallyHidden: true },
  scoped_to_user_id: { visuallyHidden: true },
},
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

These names are conventions for readable app code and generated UI output; they
are not enforced by Sapporta.

| Thing | Convention | Example |
|-------|-----------|---------|
| Table name (SQL) | Plural, snake_case | `order_items` |
| Column name | snake_case | `customer_name` |
| File name | Kebab-case `.ts` | `order-items.ts` |
| Export name | camelCase | `orderItems` |
| Drizzle variable | `{table}Table` | `orderItemsTable` |

## Primary Key

Most app tables should use a single primary key. The default pattern is:

```typescript
id: integer("id").primaryKey({ autoIncrement: true })
```

Sapporta also supports non-integer primary keys when the domain needs them
(for example UUID or text IDs). Use the integer `id` pattern unless the app has
a concrete reason to expose a different stable identifier as the primary key.

## Column Types

Prefer the **Sapporta column factories** from `@sapporta/server/table` for
semantic columns. Each factory picks the right SQLite storage type and stamps
semantic metadata (`kind`, `displayFormat`) in one move, so query, parse, and
display behavior follows the column declaration. Raw Drizzle columns still
work, but Sapporta has to infer their kind from storage metadata, so use them
mainly for primary keys, foreign keys, or columns with no Sapporta semantic
factory.

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

**`textDisplay` is presentation, not semantics.** Use it only on `text()`
columns when the UI should treat the value as longer-form text. Supported
values are `"multiLine"` and `"markdown"`. It does not change storage,
validation, filtering, sorting, or query behavior.

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

Auth-enabled tables also need the scope columns required by their
`meta.rowScope`: `workspace_id` for workspace-scoped tables, plus
`scoped_to_user_id` for `workspaceUserScoped` tables.

## Foreign Keys

Import the **raw Drizzle table** (e.g. `ordersTable`), not the Sapporta `table()` wrapper. The wrapper types `drizzle` as generic `SQLiteTableWithColumns<any>`, which loses column type info and causes `.id` to not typecheck.

```typescript
import { ordersTable } from "./orders.js";

export const orderItemsTable = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspace_id: text("workspace_id").notNull(),
  scoped_to_user_id: text("scoped_to_user_id").notNull(),
  order_id: integer("order_id").notNull().references(() => ordersTable.id),
  product_name: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
});
```

- FK column naming: `{singular_referenced_table}_id` (e.g., `order_id`, `account_id`)
- Always use `.references(() => targetTable.id)`
- For cascade deletes: `.references(() => targetTable.id, { onDelete: "cascade" })`
- After adding every FK, decide whether the referenced table should declare the
  inverse `meta.children` entry. Sapporta intentionally does not infer children
  from FKs; encode target -> source navigation explicitly when users need it.

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
  workspace_id: text("workspace_id").notNull(),
  scoped_to_user_id: text("scoped_to_user_id").notNull(),
  status: text("status").notNull(),
  created_at: timestamp("created_at").$defaultFn(() => Temporal.Now.instant()).notNull(),
  updated_at: timestamp("updated_at").$defaultFn(() => Temporal.Now.instant()).notNull(),
});

export const orders = table({
  drizzle: ordersTable,
  meta: {
    label: "Orders",
    rowScope: "workspaceUserScoped",
    selects: [
      { type: "select", column: "status", options: orderStatusOptions },
    ],
    columns: {
      workspace_id: { visuallyHidden: true },
      scoped_to_user_id: { visuallyHidden: true },
    },
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
  workspace_id: text("workspace_id").notNull(),
  scoped_to_user_id: text("scoped_to_user_id").notNull(),
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
Sapporta.

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
    total: { label: "Total Amount", width: 12 },
    quantity: { notes: "Actual amount in the food's serving_unit (e.g. 40 for 40gm)" },
    description: { textDisplay: "multiLine", maxWidth: 60 },
    body: { textDisplay: "markdown" },
    internal_notes: { visuallyHidden: true },

    // Numeric ink — only for money/number columns. Zero/null stays neutral.
    // `money()` already stamps displayFormat: "currency" — no `type` needed.
    debit:   { colorRule: "positive" },    // always greens non-zero values
    credit:  { colorRule: "negative" },    // always reds non-zero values
    net:     { colorRule: "signed" },      // greens positives, reds negatives
    balance: { strong: true },             // medium-weight answer column
  },
}
```

Only include metadata fields you actually need. `label` is recommended for all tables.

### When to use `textDisplay`

Use `textDisplay` on text columns whose values are naturally longer than
one line:

- `textDisplay: "multiLine"` — default for long plain text such as
  `description`, `notes`, `memo`, `comments`, `instructions`, `address`,
  `reason`, and `summary`.
- `textDisplay: "markdown"` — use only when users are expected to author
  formatted markdown, such as `body`, `content`, `article`, `post`,
  `template`, or `message`.

Do not add `textDisplay` for short labels, names, codes, SKUs, email or
reference fields, enum/select columns, or other one-line text identifiers.

### When to use `colorRule`, `zeroDisplay`, and `strong`

Apply to a money/number column so the grid reads correctly at a glance:

- `colorRule: "positive"` — non-zero values use positive coloring. Use for columns that are always-positive by convention (debit, income, inflow).
- `colorRule: "negative"` — non-zero values use negative coloring. Use for always-positive columns that represent outflows (credit, expense, refund).
- `colorRule: "signed"` — positives and negatives color by sign. Use for columns where the sign carries meaning (net, delta, p&l).
- `zeroDisplay: "blank"` or `"dot"` — changes how numeric zero values render without changing the stored value.
- `strong: true` — medium-weight foreground ink. Use for the answer column the reader's eye should land on (running balance, total, final amount).

These are display-only hints — the underlying values are stored verbatim and participate in aggregations normally.

## Relationship Patterns

- Think of each relationship in two directions: the FK gives `source -> target`
  navigation; `target.meta.children` opts into `target -> source` navigation.
- **Many-to-one / drill-up**: put the FK on the source table with
  `.references(() => targetTable.id)`. Sapporta renders that FK as a lookup
  field and a drill-up link from the source row to the target row.
- **One-to-many / drill-into**: add `children` to the referenced table's
  `meta` for each inbound FK whose source rows users need to inspect, create,
  or navigate from the target row. This powers nested grids, drill-into links,
  and master-detail create payloads.
- **Self hierarchy**: use a nullable self-FK such as `parent_id` for drill-up
  and filtering. Avoid a self `children` entry unless you have verified the
  target UI handles the recursive shape; use a report for recursive hierarchy
  views.
- **Many-to-many**: use a join table with two FKs. Add `children` from each
  endpoint table to the join table when users should browse assignments from
  either side. Do not model endpoint tables as direct children of each other
  unless there is a real FK between them.
- **Master-detail**: FK on detail table with `onDelete: "cascade"` so deleting
  the parent removes its children. Add `children` to the parent's `meta` for
  nested grid display and atomic parent + detail insertion.

### Relationship Inventory Checklist

Before finishing table schema work, make a relationship pass over every table:

1. List every FK as `source_table.source_fk -> target_table.id`.
2. For each FK, confirm the source column uses `.references()` and follows
   `{singular_target}_id` naming unless the domain needs a clearer role name.
3. Add `meta.children` on the target table when users need to inspect, create,
   or navigate source rows from a target row. Prefer explicit children for
   user-visible relationships, including history, assignments, and audit/detail
   rows, not only cascade-owned details.
4. Include multiple child entries when a parent has multiple useful collections
   (for example, `authors -> books` and `authors -> quotes`).
5. For each child entry, choose human-facing `label`, compact `columns`, and a
   stable `defaultSort` when insertion order or date order is more useful than
   primary-key order.
6. For self-FKs, do not add self `children`; document or build a report for the
   hierarchy if users need parent -> descendant browsing.
7. For join tables, add children from both endpoint tables to the join table
   when both browsing directions matter.

## After Creating a Table

1. In the app's API package, run the generated Drizzle migration flow:
   `pnpm --filter <api-package> db:generate`, then
   `pnpm --filter <api-package> db:migrate`.
2. Run `sapporta check` to validate table definitions that Sapporta can check.
3. Verify with `sapporta tables show <table_name>`.

## Modifying Existing Tables

Tables defined as TypeScript files in `packages/api/schema/` are changed in
code and migrated with Drizzle. To rename a table:

1. Change the `sqliteTable("old_name", ...)` first argument to the new name
2. Rename the file (e.g., `old-name.ts` → `new-name.ts`)
3. Update imports in any files that reference the old table
4. Generate and apply the Drizzle migration from the app's API package
5. Verify with `sapporta tables show <new_name>`

## Reference Files

- [Full API Reference](references/full-api-reference.md) — Complete TypeScript interfaces
- [Worked Examples](references/examples.md) — Bookkeeping, orders, inventory
