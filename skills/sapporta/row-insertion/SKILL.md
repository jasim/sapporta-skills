---
name: row-insertion
description: >
  Insert rows into Sapporta tables. Invoke for adding data, seeding tables,
  populating records, or entering individual rows.
---

# Row Insertion

## Scope & Safety

Only insert or change data when the user has asked for a data change in the current local Sapporta project. Inspect the table schema first, stay within the requested tables, and never fabricate values, credentials, or foreign keys.

## Command

```
sapporta tables add-row <table_name> --data '<json>'
```

`--data` accepts a single JSON object or a JSON array for multiple rows.

## Before Inserting

1. **Describe the table**: `sapporta meta tables show <table_name>`
2. **Sample existing data**: `sapporta meta tables sample <table_name>`
3. **Look up FK values**: `sapporta meta sql --json '{"sql": "SELECT id, name FROM referenced_table"}'`

## Lookup-or-Create Pattern

When inserting rows that reference other tables, or when records may already exist:

```bash
# Step 1: Check if record exists
sapporta meta sql "SELECT id, name FROM customers WHERE name = 'Alice'"

# Step 2: If not found, insert it
sapporta tables add-row customers --data '{"name": "Alice", "email": "alice@example.com"}'

# Step 3: Use the ID (from step 1 or 2) in the dependent insert
sapporta tables add-row orders --data '{"customer_id": 7, "status": "draft"}'
```

This is especially important for FK columns — always resolve IDs from existing data before inserting.

## Data Rules

- **No coercion** — provide the exact type the column expects:
  - Text: `"value"` | Integer: `42` | Numeric/decimal: `"99.50"` (string for precision) | Boolean: `true`/`false` | Timestamp: `"2024-01-15T10:30:00Z"`
- **No FK fabrication** — always look up foreign key IDs, never guess
- **Respect NOT NULL** — include all required columns; omit `id`, `created_at`, `updated_at` (auto-generated)
- **Use snake_case** — column names must match schema output exactly (`customer_name`, not `customerName`)
