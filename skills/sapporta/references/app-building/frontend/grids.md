# Table And Grid Views

Read [views.md](views.md) first. Use this file as a routing page. Canonical
Sapporta documentation owns exact props, runtime APIs, interaction semantics,
examples, and invariants:

- Grid-first record workflows:
  https://sapporta.com/docs/guides/generated-surfaces/grid-first-record-workflows.md
- Table-aware Grids and master-detail:
  https://sapporta.com/docs/guides/generated-surfaces/table-aware-grids-and-customization.md
- TGrid reference:
  https://sapporta.com/docs/reference/frontend/tgrid.md
- Grid interaction reference:
  https://sapporta.com/grid/reference/interactions.md
- GridCore reference:
  https://sapporta.com/grid/reference/grid-core.md
- Choose a Grid layer:
  https://sapporta.com/grid/start/choose-a-grid-layer.md
- Filtering, sorting, search, and pagination:
  https://sapporta.com/docs/guides/generated-surfaces/filtering-sorting-search-and-pagination.md
- Hierarchical Grids:
  https://sapporta.com/grid/guides/hierarchical-grids.md
- Advanced rows and drafts:
  https://sapporta.com/grid/guides/advanced-rows.md

Read the table-aware guide, TGrid reference, and interaction reference before
implementing row selection, active-row context, row activation, or
master-detail behavior.

## Choose The Grid Layer

- Use the generated table surface for ordinary persisted-record CRUD.
- Use `SchemaTableGridView` or TGrid when registered Sapporta tables own the
  records and the application needs tailored columns, query context,
  hierarchy, interaction, navigation, or surrounding layout.
- Use GridCore with ColumnPreset when the application owns temporary rows, a
  composite draft, a calculated projection, or a custom data source.
- Preserve search, filters, sort, pagination, CSV export, lookup labels, URL
  state, loading, and errors unless the product requirement changes them.

## Choose The Interaction

- Use row-list interaction when arrow keys move between whole rows.
  `ROW_PRIMARY_MASTER_DETAIL` keeps Enter for hierarchy expansion.
  `ROW_PRIMARY_MASTER_DETAIL_WITH_ACTIVATION` uses Enter and double-click for
  one semantic action and keeps left/right expansion.
- Use `ROW_MULTISELECT_LIST` for independent bulk operation targets.
- Use cell-grid interaction for cell focus, range selection, copy, inline
  editing, or cell activation. Choose the matching public preset before adding
  custom cells.
- Active-row state identifies one current record. Row selection identifies
  operation targets. Cell selection identifies a copy or editing range. Do not
  mirror any of these into parallel React state.

## Route Master-Detail Correctly

Use the active-row subscription or React hook to render a detail panel or a
foreign-key-constrained related Grid. Use the row-activation event for a
repeatable action such as opening edit, running a named command, or moving
focus into an already mounted detail Grid.

Narrow the active row's kind before treating it as a persisted data record.
Render detail loading, empty, missing, and error states inside the detail
region. Cancel or supersede requests as the active master changes.

`SchemaTableGridView` accepts an interaction but does not expose active-row or
activation props. Use `useSchemaTableGrid()` when the application needs its
session, then render `TGrid` in the application-owned composition.

## Preserve Runtime And Server Boundaries

- Grid owns stable row identity, focus, editing state, selection, hierarchy,
  displayed drafts, and runtime subscriptions.
- Application services and save handlers own domain validation, persistence,
  conflicts, cache effects, and workflow transactions.
- `fixedFilters`, hidden columns, and client selection are product constraints.
  Backend routes and generated table APIs own authorization and row scope.
- Before staging a batch, define validation timing, cancel/discard behavior,
  conflict policy, authorization, transaction scope, and partial-failure rules.

## Validate The Workflow

Run the frontend checks and exercise keyboard and pointer input, active-row
changes, repeat activation, selection, hierarchy expansion, loading and empty
states, query constraints, persistence failures, and authorization. Confirm
that Enter is assigned to either activation or expansion, not both.
