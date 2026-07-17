# Table And Grid Views

Use Sapporta table primitives before building a bespoke grid. For exact props,
types, interaction configs, and examples, use the public docs:

- Table-aware grids: https://sapporta.com/docs/subsystems/grid/
- TGrid usage: https://sapporta.com/grid/docs/full/tgrid-usage/
- BaseGrid guide: https://sapporta.com/grid/docs/full/basegrid-guide/
- BaseGrid API: https://sapporta.com/grid/docs/full/basegrid-api/
- BaseGrid interactions: https://sapporta.com/grid/docs/full/basegrid-interactions/

## Surface Decision

1. Use `SchemaTableGridView` for a schema table on one of the app's routes.
2. Use schema-derived TGrid config when the table relationships are right but
   the page needs different columns, renderers, editors, query defaults, row
   transport, interaction, or services.
3. Use `defineTGrid` directly when the page owns row shapes or level graph.
4. Use lower-level TGrid session/surface primitives only when the visible
   surface itself is custom.
5. Use BaseGrid when the data is not table-shaped and the screen owns loading,
   hierarchy, editing, side panels, or toolbar behavior.

Preserve search, filters, sort, pagination, CSV export, lookup labels, URL
state, loading states, and error states unless the user asks for less.

## Auth And Data

Schema grid primitives should load rows through built-in table APIs so
row-access predicates are applied server-side. Custom row sources, save
handlers, and app services must call scoped backend endpoints.

`fixedFilters`, hidden columns, and client-only checks are product constraints,
not authorization. Do not use scope fields in frontend filters to enforce auth.

## Agent Pitfalls

- Do not copy report-grid internals for ordinary report screens; render report
  datasets with report components.
- Create React-owned BaseGrid runtimes with the documented lifecycle hook, and
  render only after a runtime exists.
- For bulk actions, read selected rows through public runtime/session APIs
  rather than controller internals.
- If exact helper behavior is unclear, inspect the installed package in the app
  before writing code.
