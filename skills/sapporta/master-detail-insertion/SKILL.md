---
name: master-detail-insertion
description: >
  Use when the user wants to add a parent record and child rows together in an
  existing Sapporta app, such as orders with line items, journal entries with
  lines, invoices with details, or any parent-child data entry.
---

# Master-Detail Insertion

## Scope & Safety

Only insert parent-child data when the user has asked for a data change in the current local Sapporta project. Inspect both table schemas first, stay within the requested tables, and never fabricate values, credentials, or foreign keys.

## Command

```bash
sapporta rows insert <parent_table> --data '{"field":"value","$details":{"table":"<child_table>","fk":"<fk_column>","rows":[...]}}'
```

Runs in a single transaction: inserts master -> gets its `id` -> backfills `fk` on each detail row -> inserts details. Rolls back on any failure.

In auth-enabled projects, trusted scope fields are propagated by the server for
both master and detail rows. Do not include `workspace_id`, `workspaceId`,
`scoped_to_user_id`, or `scopedToUserId`; do not include server-managed
references marked `clientCanSet: false`.

## Critical Rule

**Do NOT include the FK column in the detail `rows`** -- it's backfilled automatically from the master's ID.

```bash
# WRONG: including order_id in detail rows
--data '{"customer_name":"Alice","$details":{"table":"order_items","fk":"order_id","rows":[{"order_id":1,"product":"Widget","quantity":3}]}}'

# CORRECT: omit order_id from rows
--data '{"customer_name":"Alice","$details":{"table":"order_items","fk":"order_id","rows":[{"product":"Widget","quantity":3}]}}'
```

## Before Inserting

1. **Describe both tables**: `sapporta tables show <table>`
2. **Identify the FK column** on the detail table (the column referencing the master table) -- use as `fk`
3. **Look up any other FKs** in either table

## Example

```bash
sapporta rows insert orders --data '{"customer_name":"Alice","status":"draft","$details":{"table":"order_items","fk":"order_id","rows":[{"product_name":"Widget","quantity":3,"unit_price":"29.99"},{"product_name":"Gadget","quantity":1,"unit_price":"49.99"}]}}'
```

## Multi-Level Hierarchies

For 3+ levels (e.g., departments -> teams -> members), chain multiple commands: insert the first pair with master-detail, query the child IDs, then insert the next level with `rows insert <table>`.
