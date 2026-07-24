# Table Creation

Translate an accepted product model into tables; do not derive the product model
from a requested table or form shape.

Table schema work belongs in `packages/api/schema/`. Inspect existing schema
files before adding a new pattern:

```bash
rg --files packages/api/schema
```

Use local application schemas for project conventions. To discover how to
define application tables from the canonical starter pattern, use the guide
below.

Define the raw Drizzle table and its inferred row types before building a
custom frontend form. Export `typeof table.$inferSelect` and
`typeof table.$inferInsert` aliases from the schema module. After the table is
registered, read [frontend/forms.md](../frontend/forms.md) for the
metadata-driven form workflow and the frontend type-only boundary.

When the schema directory contains only project-authentication tables, treat
the project as a fresh app. Read the complete starter pattern before framework
source, internal fixtures, or generated declarations. Then adapt the pattern to
the requested domain.

Use the public docs for column factories, metadata fields, row-scope reference,
filter/search behavior, relationship metadata, and migration details:

- Tables, columns, and schema metadata: https://sapporta.com/docs/guides/model-data/tables-columns-and-schema-metadata/
- Table definitions: https://sapporta.com/docs/reference/schema/table-definitions/
- Table and column metadata: https://sapporta.com/docs/reference/schema/table-and-column-metadata/
- Search table rows and relationships: https://sapporta.com/docs/guides/model-data/search-indexes-and-display-metadata/
- Table validation: https://sapporta.com/docs/reference/schema/table-validation/
- Semantic value boundaries: https://sapporta.com/docs/reference/schema/semantic-value-boundaries/
- Relationships and lookup behavior: https://sapporta.com/docs/guides/model-data/relationships-and-lookup-behavior/
- Schema changes and migrations: https://sapporta.com/docs/guides/model-data/schema-changes-and-migrations/
- Auth and row security: https://sapporta.com/docs/reference/server/auth-and-row-security/

## Canonical Starter Pattern

To discover how Sapporta application tables are defined, start with the
canonical [Define projects and tasks](https://sapporta.com/docs/getting-started/define-projects-and-tasks/)
worked example. It demonstrates, in one place:

- raw Drizzle tables and exported Sapporta wrappers;
- semantic text, date, and timestamp columns;
- primary keys, foreign keys, indexes, and cascade behavior;
- select metadata, search, row labels, child metadata, and row scope;
- Temporal timestamp defaults; and
- the named migration, SQL review, migrate, and check loop.

Use that page as the starter pattern, then rename and adapt the tables, columns,
scope, relationships, and metadata to the user's domain. For an exact option or
type, follow its links to the table-definition and metadata references above.
Do not copy the tutorial's task-management domain into an unrelated app.

The generated application layout is documented at
https://sapporta.com/docs/reference/project/generated-project-layout/ when the
package responsibilities or extension points are unclear.

## Authoring Rules

- Export the raw Drizzle table so other schema files can reference its columns
  in `.references()`.
- Export the Sapporta table wrapper used by the current app. Follow the local
  project style and current docs; do not introduce an older wrapper form into a
  newer app.
- Export row and insert aliases from the raw table definition:
  `export type Project = typeof projectsTable.$inferSelect` and
  `export type NewProject = typeof projectsTable.$inferInsert`. Server and
  frontend domain code must reuse these aliases. Do not use the generic
  Sapporta `Row` type as a domain model or hand-write a parallel frontend
  interface.
- Use Sapporta semantic column factories for values when available. Use raw
  Drizzle columns for primary keys, foreign keys, and unsupported edge cases.
- Use Temporal for date/time defaults and app-level date work. Do not use
  `Date`, `dayjs`, or `date-fns`.
- Keep table and column names in the app's established convention, normally SQL
  `snake_case`, kebab-case filenames, and camelCase exports.

## Column Sizing

For table `width`, `minWidth`, or `maxWidth`, use the canonical [Column sizing](https://sapporta.com/docs/reference/column-sizing/) reference.

## Auth Row Scope

Projects must declare `meta.rowScope` on every table and include
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
8. Identify parent resources whose useful discovery text lives in child
   collections—for example, a book found by a quote, an order found by a line
   description, or a case found by a note. Treat these as candidates for
   explicit relational search.

## Search Behavior

Leave search unset by default, and retain an existing `search: "allColumns"`
unless requirements say otherwise. Unset search is equivalent to
`"allColumns"` and is the right behavior for most tables; it searches the
visible application values of the current row without walking into has-many
children.

Customize search only when the product requires a different discovery surface.
When searching a parent should also return it for a match in a child collection,
read the canonical [Search table rows and relationships](https://sapporta.com/docs/guides/model-data/search-indexes-and-display-metadata/)
guide before editing metadata. It owns the recursive `search.children` shape,
field-selection rules, authorization behavior, relationship index guidance, and
the boundary between generated relational search and app-owned full-text search.
Do not infer child traversal merely because `meta.children` exists.

## Numeric And Enum Pitfalls

- Additive numeric fields should be non-null with a default. Use nullable
  numeric fields only when `null` has domain meaning, and mark the metadata
  accordingly.
- For enum-like fields, use the documented select metadata unless the app needs
  a reference table.

## Validation And Semantic Values

When generated CRUD needs constraints beyond the semantic column kind, read the
[table-validation reference](https://sapporta.com/docs/reference/schema/table-validation/)
before defining `meta.validation`. Confirm create, partial-update, nullable,
defaulted, client-editable, and server-managed field behavior. Keep conversion
or normalization outside validation unless the save path explicitly consumes
the transformed result.

When app-owned code reads or writes generated table values, duplicates a
generated form, or introduces a select-backed domain type, read the
[semantic-value boundary reference](https://sapporta.com/docs/reference/schema/semantic-value-boundaries/).
Keep select-backed text values as strings across form, wire, runtime, and
database boundaries. Parse and serialize other semantic kinds at the documented
boundary instead of inventing a second conversion path.

## Migration And Validation Loop

After table changes:

```bash
pnpm --filter ./packages/api db:generate --name <change_name>
# Review the generated SQL before continuing.
pnpm --filter ./packages/api db:migrate
pnpm --filter ./packages/api db:check
pnpm exec sapporta tables show <table_name>
```

The server validates table definitions at startup and does not apply migrations
automatically.

## Reference Files

These files intentionally point to canonical docs instead of carrying API
reference copies:

- [Canonical table docs](api-reference.md)
- [Canonical table examples](examples.md)
