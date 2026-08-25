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
`typeof table.$inferInsert` aliases from the schema module for server use. After
the table is registered, read [frontend/forms.md](../frontend/forms.md) for the
metadata-driven form workflow.

When the schema directory contains only project-authentication tables, treat
the project as a fresh app. Read the complete starter pattern before framework
source, internal fixtures, or generated declarations. Then adapt the pattern to
the requested domain.

Use the public docs for column factories, metadata fields, row-scope reference,
filter/search behavior, relationship metadata, and migration details:

- Tables, columns, and schema metadata: https://sapporta.com/docs/guides/model-data/tables-columns-and-schema-metadata.md
- Table definitions: https://sapporta.com/docs/reference/schema/table-definitions.md
- Table and column metadata: https://sapporta.com/docs/reference/schema/table-and-column-metadata.md
- Search table rows and relationships: https://sapporta.com/docs/guides/model-data/search-indexes-and-display-metadata.md
- Table validation: https://sapporta.com/docs/reference/schema/table-validation.md
- Semantic value boundaries: https://sapporta.com/docs/reference/schema/semantic-value-boundaries.md
- Relationships and lookup behavior: https://sapporta.com/docs/guides/model-data/relationships-and-lookup-behavior.md
- Schema changes and migrations: https://sapporta.com/docs/guides/model-data/schema-changes-and-migrations.md
- Auth and row security: https://sapporta.com/docs/reference/server/auth-and-row-security.md

## Canonical Starter Pattern

To discover how Sapporta application tables are defined, start with the
canonical [Tables, columns, and schema metadata](https://sapporta.com/docs/guides/model-data/tables-columns-and-schema-metadata.md)
guide. Its complete parent/child starter demonstrates:

- raw Drizzle tables and exported Sapporta wrappers;
- semantic text, date, and timestamp columns;
- primary keys, foreign keys, indexes, and cascade behavior;
- select metadata, search, row labels, child metadata, and row scope;
- Temporal timestamp defaults; and
- the named migration, SQL review, migrate, and check loop.

Use that example as the starter pattern, then rename and adapt the tables, columns,
scope, relationships, and metadata to the user's domain. For an exact option or
type, follow its links to the table-definition and metadata references above.
Do not copy the example's project/task domain into an unrelated app.

The generated application layout is documented at
https://sapporta.com/docs/reference/project/generated-project-layout.md when the
package responsibilities or extension points are unclear.

## Minimum `sapportaTable` Metadata

Start every application table wrapper with explicit product metadata:

```ts
meta: {
  label: "...",
  rowScope: "workspaceUserScoped",
  rowLabelColumns: ["display_name"],
},
```

`rowLabelColumns` must be non-empty, name columns on the raw Drizzle table, and
form a meaningful label in lookups and references. Use a human-facing value such
as `name`, `title`, `number`, or a combination such as `first_name` and
`last_name`; do not use an opaque primary key merely to satisfy the requirement.

Default to `workspaceUserScoped`: it is the strictest workspace boundary and
prevents other workspace members from seeing a row unless the product explicitly
allows it. It requires both `workspace_id` and `scoped_to_user_id`. Use
`workspaceGlobal` only after confirming that every authorized member of the
workspace should be able to access every row; use `systemGlobal` only when the
data deliberately has no workspace boundary.

Keep a pure join table contextual rather than treating it as an independently
named resource. If it needs a direct screen or lookup, add a meaningful,
displayable domain value and use that as its row label instead of the join row's
primary key.

## Authoring Rules

- Export the raw Drizzle table so other schema files can reference its columns
  in `.references()`.
- Export the Sapporta table wrapper used by the current app. Follow the local
  project style and current docs; do not introduce an older wrapper form into a
  newer app.
- Before generating a migration, confirm each `sapportaTable()` has explicit
  `label`, `rowScope`, and non-empty, human-meaningful `rowLabelColumns`.
  Start with `workspaceUserScoped`; document why any broader scope is required.
  Keep pure join tables contextual unless they gain a displayable domain label.
- Export row and insert aliases from the raw table definition:
  `export type Project = typeof projectsTable.$inferSelect` and
  `export type NewProject = typeof projectsTable.$inferInsert`. These are server
  types: reuse them in `packages/api` domain code, and never import them into
  `packages/frontend`, where a `date()` column resolves to Temporal rather than
  the string the generated routes return. Frontend code types a row with a
  projection; read
  [../frontend/row-projections.md](../frontend/row-projections.md).
- Use Sapporta semantic column factories for values when available. Use raw
  Drizzle columns for primary keys, foreign keys, and unsupported edge cases.
  Each factory preserves its column-name literal, so a row read through
  `TableRow`/`scopedRows()` keeps each column's own type. `pnpm typecheck`
  (`tsc --noEmit`) is what reports a mismatch; `vite build` erases types without
  checking them.
- When a table declares `meta.children`, declare the child's foreign key
  non-writable on the same pass — `references: { fk: { apiSettable: false } }`
  on the child, or `columns: { fk: { apiWritable: false } }`. Without it a
  `$details` row carrying that key is accepted and the value is silently
  replaced by the created master's key.
- Use Temporal for date/time defaults and app-level date work. Do not use
  `Date`, `dayjs`, or `date-fns`. A day is a calendar day in the workspace's
  zone; read [../days-and-time-zones.md](../days-and-time-zones.md) before
  writing day arithmetic.
- Keep table and column names in the app's established convention, normally SQL
  `snake_case`, kebab-case filenames, and camelCase exports.

## Column Sizing

For table `width`, `minWidth`, or `maxWidth`, use the canonical [Column sizing](https://sapporta.com/docs/reference/column-sizing.md) reference.

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

## Table And Row Linking

Sapporta derives navigation links from the relationship metadata above and
renders them in the table grid without extra code:

- Every FK column gets a drill-up link to the referenced table's rows (the
  cell shows a trailing link adornment; Enter opens it on read-only cells).
- Every `meta.children` entry gets a row-level drill-into link ("Open Line
  Items") offered in the row's right-click context menu.

So the relationship pass above is also the linking pass: declaring
`.references()` and `meta.children` correctly is what produces useful default
navigation.

On top of the derived links, declare domain links with the shared
`NavLink` type (`@sapporta/shared/contracts`):

```ts
meta: {
  // ...
  columns: {
    customer_id: {
      links: [
        { kind: "report", report: "customer-statement",
          bind: { customer_id: "customer_id" }, label: "Customer statement" },
      ],
    },
  },
  rowLinks: [
    { kind: "table", table: "payments",
      bind: { invoice_id: "id" }, label: "Payments received" },
    { kind: "url", href: "https://dashboard.stripe.com/invoices/{stripe_id}",
      label: "Open in Stripe", target: "_blank" },
  ],
},
```

`bind` maps the destination's filter/parameter names to source columns on the
current row (`{ destination: source }`). Schema extraction validates links:
unknown source columns (in binds or url `{column}` placeholders), unknown
destination tables, and unknown destination columns fail at boot, not
silently in the UI. A link only resolves on rows
where every bound value is present, so nullable FKs need no guarding.

Column `links` surface on the cell (first resolvable link is primary) and in
the context menu; `rowLinks` surface in the row's context menu after the
cell's own links. The same declarations flow through the schema metadata API,
so report screens and custom views can reuse them.

Declare links domain-aware: for each table, ask what a user looking at this
row does next in their workflow — settle an invoice, review an account's
ledger, check a shipment's tracking — and link exactly those destinations.
Do not add links whose destination the user cannot act on, and rely on the
derived FK/children links instead of restating them. The linking reference
for reports, [reports/linking.md](../reports/linking.md), documents the full
`NavLink` vocabulary (`table` | `report` | `url`, labels, icons, targets).

## Search Behavior

Leave search unset by default, and retain an existing `search: "allColumns"`
unless requirements say otherwise. Unset search is equivalent to
`"allColumns"` and is the right behavior for most tables; it searches the
visible application values of the current row without walking into has-many
children.

Customize search only when the product requires a different discovery surface.
When searching a parent should also return it for a match in a child collection,
read the canonical [Search table rows and relationships](https://sapporta.com/docs/guides/model-data/search-indexes-and-display-metadata.md)
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
[table-validation reference](https://sapporta.com/docs/reference/schema/table-validation.md)
before defining `meta.validation`. Confirm create, partial-update, nullable,
defaulted, client-editable, and server-managed field behavior. Keep conversion
or normalization outside validation unless the save path explicitly consumes
the transformed result.

When app-owned code reads or writes generated table values, duplicates a
generated form, or introduces a select-backed domain type, read the
[semantic-value boundary reference](https://sapporta.com/docs/reference/schema/semantic-value-boundaries.md).
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
