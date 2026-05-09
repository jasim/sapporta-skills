# Table Creation — Full API Reference

Source: `packages/core/src/table.ts`

## `table(options: TableOptions): TableDef`

Creates a Sapporta table definition wrapping a Drizzle sqliteTable.

## TableOptions

```typescript
interface TableOptions {
  /** The Drizzle sqliteTable definition */
  drizzle: SQLiteTableWithColumns<any>;
  /** Optional sapporta metadata */
  meta?: SapportaMeta;
}
```

## TableDef

```typescript
interface TableDef {
  /** The Drizzle SQLite table object */
  drizzle: SQLiteTableWithColumns<any>;
  /** SQL table name extracted from the Drizzle table */
  sqlName: string;
  /** Sapporta metadata */
  meta: SapportaMeta;
}
```

## SapportaMeta

```typescript
interface SapportaMeta {
  /** Display label for the table in UI sidebar */
  label?: string;

  /** Select/enum column definitions — renders as dropdowns in UI */
  selects?: SelectMeta[];

  /** Whether records are immutable (disables update/delete — append-only) */
  immutable?: boolean;

  /** User-provided Zod validation schema (overrides auto-inferred from Drizzle) */
  validation?: z.ZodObject<any>;

  /** Custom save function (overrides default insert/update) */
  save?: (record: Record<string, unknown>, db: any) => Promise<any>;

  /** Has-many child relationships for nested grid display */
  children?: ChildMeta[];

  /** Per-column metadata keyed by column name */
  columns?: Record<string, ColumnMeta>;

  /** Cross-column search configuration. When set, the list endpoint
   *  accepts ?q=<term> and OR-s a case-insensitive LIKE match across
   *  the declared columns. The UI toolbar renders a search input only
   *  when this is declared. Omit for tables that are not worth
   *  searching — ?q= against such a table returns 400. */
  search?: SearchMeta;
}
```

## SelectMeta

```typescript
interface SelectMeta {
  type: "select";
  /** Column name this select applies to */
  column: string;
  /** Allowed option values */
  options: string[];
}
```

## SearchMeta

```typescript
interface SearchMeta {
  /** Column names matched by the `q` query parameter. Each column is
   *  matched with LIKE '%q%' and the results OR-ed. Must reference
   *  existing columns on the same table — sapporta-check flags
   *  missing columns as a dev-time misconfiguration. */
  columns: string[];
}
```

Pick text columns a user would type against (name, title, notes, sku,
email). Skip IDs, numbers, timestamps, and enum columns that already
have `meta.selects` dropdowns. Keep the list short — every extra
column is another LIKE in the OR group.

## ChildMeta

```typescript
interface ChildMeta {
  /** SQL name of the child table */
  table: string;
  /** FK column in the child table that references this parent's PK */
  foreignKey: string;
  /** Display label (defaults to child table's label) */
  label?: string;
  /** Columns to show in nested grid (defaults to all non-PK, non-FK, non-timestamp cols) */
  columns?: string[];
  /** Default sort: "column" or "-column" for desc (defaults to PK asc) */
  defaultSort?: string;
  /** Width hint in approximate character count */
  width?: number;
}
```

## Column factories

Import from `@sapporta/server/table`. Each factory picks storage + stamps
`kind` (and `displayFormat` for money/percentage) in one declaration site.

| Factory | Storage | Query returns | Insert / update accepts |
|---|---|---|---|
| `money(name)` | `REAL` | `number` | `number` |
| `percentage(name)` | `REAL` | `number` | `number` |
| `number(name)` | `REAL` | `number` | `number` |
| `bool(name)` | `INTEGER 0/1` | `boolean` | `boolean` |
| `date(name)` | `TEXT` ISO `YYYY-MM-DD` | `Temporal.PlainDate` | `Temporal.PlainDate` *or* ISO string |
| `timestamp(name)` | `TEXT` `YYYY-MM-DDTHH:mm:ssZ` | `Temporal.Instant` | `Temporal.Instant` *or* ISO string |
| `text(name)` | `TEXT` | `string` | `string` |

Primary keys and FKs are raw `integer("id")` from `drizzle-orm/sqlite-core` —
relationships, not values, don't need a `kind`.

See [DATA-TYPE-PRINCIPLES.md](../../../../docs/DATA-TYPE-PRINCIPLES.md) for the
full rationale.

## ColumnMeta

```typescript
interface ColumnMeta {
  /** Semantic value kind — stamped by the column factory (`money`/`date`/...).
   *  You normally don't set this by hand; the factory does it. */
  kind?: "text" | "number" | "boolean" | "date" | "timestamp";
  /** Presentation hint on top of `kind: "number"`. Stamped automatically by
   *  `money()` (→ "currency") and `percentage()` (→ "percentage"). Does NOT
   *  participate in query semantics — money compares the same as any other
   *  number. You normally don't set this by hand. */
  displayFormat?: "currency" | "percentage";
  /** Custom column header for display */
  header?: string;
  /** Hide column from grid and drawer (auto-set for created_at/updated_at) */
  visuallyHidden?: boolean;
  /** Fixed width in approximate character count */
  width?: number;
  /** Minimum width in approximate character count (flexible with floor) */
  minWidth?: number;
  /** Maximum width in approximate character count (flexible with cap) */
  maxWidth?: number;
  /** Set to false for nullable numeric columns where NULL is semantically distinct
      from 0 (e.g. an optional assertion value). Suppresses the nullable-numeric
      checker warning. */
  additive?: boolean;
  /** Numeric-ink hint for money/number columns.
   *    "positive" — always greens non-zero values (debit, income, inflow)
   *    "negative" — always reds non-zero values  (credit, expense, refund)
   *    "signed"   — greens values > 0, reds values < 0 (net, delta, p&l)
   *  Zero / null stays neutral in all variants. */
  tone?: "positive" | "negative" | "signed";
  /** When true, non-zero values in money/number columns render in foreground
   *  ink at medium weight — marks the column as the reader's "answer"
   *  (running balance, total, final amount). Overrides `tone`. */
  emphasize?: boolean;
  /** Freeform notes describing the column's meaning, conventions, or formula */
  notes?: string;
}
```

There is **no** `type: "money"` field. `money()` already stamps
`displayFormat: "currency"`; downstream consumers read that, not a separate
meta override.

AI tools should read `notes` when generating code that references the column, and should write `notes` when the column has non-obvious semantics (domain meaning, units, conventions, or formulas).
