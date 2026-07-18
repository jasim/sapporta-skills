# Table And Grid Views

Treat Grid as the default record-workflow surface. For exact props, runtime
APIs, interaction configs, and examples, use the public docs:

- Grid-first record workflows: https://sapporta.com/docs/guides/generated-surfaces/grid-first-record-workflows/
- Table-aware grids: https://sapporta.com/docs/guides/generated-surfaces/table-aware-grids-and-customization/
- Grid core model: https://sapporta.com/grid/guides/core-model/
- Choose a Grid layer: https://sapporta.com/grid/start/choose-a-grid-layer/
- Interactions: https://sapporta.com/grid/reference/interactions/
- Keyboard and selection: https://sapporta.com/grid/guides/keyboard-and-selection/
- BaseGrid reference: https://sapporta.com/grid/reference/base-grid/
- ColumnPreset reference: https://sapporta.com/grid/reference/column-preset/
- Hierarchical grids: https://sapporta.com/grid/guides/hierarchical-grids/
- Advanced rows and drafts: https://sapporta.com/grid/guides/advanced-rows/

## Surface Decision

1. Use the generated table surface for ordinary editable table work.
2. Use `SchemaTableGridView` or TGrid when persisted Sapporta tables own the
   records, relationships, row queries, or saves. Customize its columns,
   renderers, editors, hierarchy, query defaults, interaction, and services.
3. Use BaseGrid with ColumnPreset when the application owns temporary draft
   rows, a composite workflow model, a report-like projection, or a custom data
   source.
4. Use raw BaseGrid columns or lower-level runtime/session primitives only for
   behavior ColumnPreset or TGrid does not model.
5. Use conventional controls for compact headers, singleton values, and
   specialized panels around the Grid.

Preserve search, filters, sort, pagination, CSV export, lookup labels, URL
state, loading states, and error states unless the user asks for less.

## Interaction Decision

Choose the interaction preset before adding custom cells or toolbar commands:

- `CELL_EDITING_GRID` for spreadsheet-style editing and keyboard entry.
- `CELL_GRID_WITH_INDEPENDENT_ROW_SELECTION` for editable cells plus bulk row
  selection.
- `CELL_PRIMARY_WITH_SIDE_PANEL_ROW` for a detail panel that follows the cursor.
- `CELL_PRIMARY_WITH_SELECTED_SIDE_PANEL_ROW` for an independently pinned
  detail row.
- `ROW_PRIMARY_MASTER_DETAIL` for row-first hierarchy and master-detail
  navigation.
- `ROW_MULTISELECT_LIST` for command-oriented worklists and bulk operations.

Cell selection owns focus, ranges, copying, and spreadsheet editing. Row
selection identifies records for panels, master-detail context, delete, bulk
actions, and cross-level operations. Read active-row and selected-row state
through `GridLevelRuntime` or its React hooks. Use
`runtime.rowOperations.selectedDataTargets()` for commands that intentionally
span expanded paths.

## Runtime And Persistence Boundary

Grid owns stable row identity, focus, editing state, selection, hierarchy,
draft display, and runtime subscriptions. Use path-local `writeCell`,
`applyChanges`, `createRow`, `removeRow`, and draft operations for the visible
workflow.

Application services and save handlers own validation, persistence, conflicts,
authorization, and workflow transactions. BaseGrid phantom rows and inline
writes can keep a temporary multi-line draft stable; the final composite submit
remains an app-owned domain operation. Custom renderers and activations may
open panels, dialogs, or app commands, but they should not own persistence
rules.

## Auth And Data

Schema grid primitives should load rows through built-in table APIs so
row-access predicates are applied server-side. Custom row sources, save
handlers, and app services must call scoped backend endpoints.

`fixedFilters`, hidden columns, and client-only checks are product constraints,
not authorization. Do not use scope fields in frontend filters to enforce auth.

## Agent Pitfalls

- Do not copy report-grid internals for ordinary report screens; render report
  datasets with report components.
- Create React-owned BaseGrid runtimes with `useGridRuntimeEffect`, and render
  only after a runtime exists.
- Use ColumnPreset for standard text, number, date, boolean, select, lookup, and
  row-selection columns before writing custom renderers or editors.
- For bulk actions, read selected rows through public runtime/session APIs
  rather than controller internals or parallel React selection state.
- If exact helper behavior is unclear, inspect the installed package in the app
  before writing code.
