---
name: table-creation
description: >
  Use when the user wants to define or change Sapporta database tables in
  TypeScript. Covers table modeling, creating or renaming tables, columns,
  foreign keys, indexes, search config, display metadata, and Drizzle
  migration workflow.
---

# Table Creation

Table schema work belongs in `packages/api/schema/`. Inspect existing schema
files before adding a new pattern.

Use the public docs for column factories, metadata fields, row-scope reference,
filter/search behavior, relationship metadata, and migration details:

- Data modeling: https://sapporta.com/docs/subsystems/data-modeling/
- Table definitions: https://sapporta.com/docs/reference/table-definitions/
- Schema metadata: https://sapporta.com/docs/reference/full/schema-metadata/
- Schema and migrations: https://sapporta.com/docs/reference/full/schema-and-migrations/
- Auth and row security: https://sapporta.com/docs/reference/auth-and-row-security/

## Authoring Rules

- Export the raw Drizzle table so other schema files can reference its columns
  in `.references()`.
- Export the Sapporta table wrapper used by the current app. Follow the local
  project style and current docs; do not introduce an older wrapper form into a
  newer app.
- Derive row and insert types from Drizzle with `$inferSelect` and
  `$inferInsert`; do not hand-write parallel row types.
- Use Sapporta semantic column factories for values when available. Use raw
  Drizzle columns for primary keys, foreign keys, and unsupported edge cases.
- Use Temporal for date/time defaults and app-level date work. Do not use
  `Date`, `dayjs`, or `date-fns`.
- Keep table and column names in the app's established convention, normally SQL
  `snake_case`, kebab-case filenames, and camelCase exports.

## Auth Row Scope

Auth-enabled projects must declare `meta.rowScope` on every table and include
the required scope columns:

- `workspaceUserScoped` -> `workspace_id` and `scoped_to_user_id`
- `workspaceGlobal` -> `workspace_id`
- `systemGlobal` -> no workspace predicate

Do not infer scope from column presence. Scope columns are system-managed;
clients must not submit or edit `workspace_id`, `workspaceId`,
`scoped_to_user_id`, or `scopedToUserId`. Hide scope columns from generated
screens.

Use Drizzle `.references()` wherever possible. Use metadata references only
when a relationship cannot be proven from Drizzle metadata or needs additional
server-managed policy.

## Relationship Inventory

Before finishing schema work, make a relationship pass:

1. List every FK as `source_table.source_fk -> target_table.id`.
2. Confirm the source column uses `.references()` unless there is a documented
   reason it cannot.
3. Add `meta.children` on the target table when users need to inspect, create,
   or navigate source rows from the target row.
4. Include multiple child entries when a parent has multiple useful collections.
5. Choose human-facing child labels, compact columns, and stable child sort when
   order matters.
6. For self-FKs, avoid recursive `children` unless the UI path is proven; use a
   report for hierarchy views when needed.
7. For join tables, add children from both endpoint tables when both browsing
   directions matter.

## Numeric And Search Pitfalls

- Additive numeric fields should be non-null with a default. Use nullable
  numeric fields only when `null` has domain meaning, and mark the metadata
  accordingly.
- Search config should name text fields a human would type against. Do not add
  IDs, numeric measures, booleans, timestamps, or enum fields just to make the
  toolbar appear.
- For enum-like fields, use the documented select metadata unless the app needs
  a reference table.

## Migration And Validation Loop

After table changes:

```bash
pnpm --filter ./packages/api db:generate --name <change_name>
pnpm --filter ./packages/api db:migrate
pnpm --filter ./packages/api db:check
pnpm exec sapporta tables show <table_name>
```

Review generated SQL before applying it. The server validates table definitions
at startup and does not apply migrations automatically.

## Reference Files

These files intentionally point to canonical docs instead of carrying API
reference copies:

- [Canonical table docs](references/full-api-reference.md)
- [Canonical table examples](references/examples.md)
