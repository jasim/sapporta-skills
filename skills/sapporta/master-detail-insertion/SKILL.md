---
name: master-detail-insertion
description: >
  Insert parent + child records atomically. Invoke for creating orders with
  line items, journal entries with lines, invoices with details, or any
  parent-child pair.
---

# Master-Detail Insertion

## Command

```bash
sapporta tables add-row <parent_table> --data '{"field":"value","$details":{"table":"<child_table>","fk":"<fk_column>","rows":[...]}}'
```

Runs in a single transaction: inserts master -> gets its `id` -> backfills `fk` on each detail row -> inserts details. Rolls back on any failure.

## Critical Rule

**Do NOT include the FK column in the detail `rows`** -- it's backfilled automatically from the master's ID.

```bash
# WRONG: including order_id in detail rows
--data '{"customer_name":"Alice","$details":{"table":"order_items","fk":"order_id","rows":[{"order_id":1,"product":"Widget","quantity":3}]}}'

# CORRECT: omit order_id from rows
--data '{"customer_name":"Alice","$details":{"table":"order_items","fk":"order_id","rows":[{"product":"Widget","quantity":3}]}}'
```

## Before Inserting

1. **Describe both tables**: `sapporta meta tables show <table>`
2. **Identify the FK column** on the detail table (the column referencing the master table) -- use as `fk`
3. **Look up any other FKs** in either table

## Example

```bash
sapporta tables add-row orders --data '{"customer_name":"Alice","status":"draft","$details":{"table":"order_items","fk":"order_id","rows":[{"product_name":"Widget","quantity":3,"unit_price":"29.99"},{"product_name":"Gadget","quantity":1,"unit_price":"49.99"}]}}'
```

## Multi-Level Hierarchies

For 3+ levels (e.g., departments -> teams -> members), chain multiple commands: insert the first pair with master-detail, query the child IDs, then insert the next level with `tables add-row <table>`.
