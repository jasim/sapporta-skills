# Table And Grid Views

Read the surface decision in [views.md](views.md) before using this reference.
For exact props, runtime APIs, interaction configs, and examples, use the public
docs:

- Grid-first record workflows: https://sapporta.com/docs/guides/generated-surfaces/grid-first-record-workflows/
- Table-aware grids: https://sapporta.com/docs/guides/generated-surfaces/table-aware-grids-and-customization/
- Filtering, sorting, search, and pagination: https://sapporta.com/docs/guides/generated-surfaces/filtering-sorting-search-and-pagination/
- TGrid reference: https://sapporta.com/docs/reference/frontend/tgrid/
- Grid core model: https://sapporta.com/grid/guides/core-model/
- Choose a Grid layer: https://sapporta.com/grid/start/choose-a-grid-layer/
- Interactions: https://sapporta.com/grid/reference/interactions/
- Keyboard and selection: https://sapporta.com/grid/guides/keyboard-and-selection/
- BaseGrid reference: https://sapporta.com/grid/reference/base-grid/
- ColumnPreset reference: https://sapporta.com/grid/reference/column-preset/
- Hierarchical grids: https://sapporta.com/grid/guides/hierarchical-grids/
- Advanced rows and drafts: https://sapporta.com/grid/guides/advanced-rows/

## Contents

- [Surface Decision](#surface-decision)
- [Interaction Decision](#interaction-decision)
- [Master-Detail Decision](#master-detail-decision)
- [Active Row And Row Activation APIs](#active-row-and-row-activation-apis)
- [Relationship Context](#relationship-context)
- [Staged Batch Decision](#staged-batch-decision)
- [Runtime And Persistence Boundary](#runtime-and-persistence-boundary)
- [Auth And Data](#auth-and-data)
- [Agent Pitfalls](#agent-pitfalls)

## Surface Decision

1. Use the generated table surface when its standard presentation fits either
   an application workflow or Manage Data.
2. Use `SchemaTableGridView` or TGrid for tailored application lists when
   persisted Sapporta tables own the records. Customize columns, relationship
   context, query defaults, interaction, navigation, hierarchy, or actions
   without rebuilding table clients and metadata behavior.
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

Use row-list interaction when keyboard navigation should move between whole
rows. The active row supplies application context. The React view decides how
to use that context. Set table columns to `edit: "none"`. Row-list has no
active cell, cell range, or cell editor:

- `ROW_PRIMARY_MASTER_DETAIL` for full-row navigation with the active row as
  the single operation target. Enter retains its hierarchy-expansion behavior.
- `ROW_PRIMARY_MASTER_DETAIL_WITH_ACTIVATION` for the same row navigation plus
  semantic activation on Enter and double-click. Left and right retain
  hierarchy expansion. The preset creates no detail view or layout.
- `ROW_MULTISELECT_LIST` for command-oriented worklists and bulk operations.

Use cell-grid interaction when cell behavior is intentional. A read-only Grid
can still use cell-grid mode when a title cell or action cell must respond to
click, Enter, Space, or double-click:

- `CELL_EDITING_GRID` for spreadsheet-style editing and keyboard entry.
- `CELL_GRID_WITH_ACTIVE_ROW` for read-only cell navigation and activation when
  the active row should follow the cell cursor.
- `CELL_GRID_WITH_INDEPENDENT_ROW_SELECTION` for editable cells plus bulk row
  selection.
- `CELL_PRIMARY_WITH_SIDE_PANEL_ROW` when the active cell's row should also be
  the single row operation target. The preset creates no panel.
- `CELL_PRIMARY_WITH_SELECTED_SIDE_PANEL_ROW` when row operation selection
  should remain independent of the active cell. The preset creates no panel.

Cell selection owns focus, ranges, copying, and spreadsheet editing. Row
selection identifies records for delete, bulk actions, and cross-level
operations. Active-row state carries the current row context. Read both values
through `GridLevelRuntime` or its React hooks. Use
`runtime.rowOperations.selectedDataTargets()` for commands that intentionally
span expanded paths.

## Master-Detail Decision

A master-detail surface keeps one collection visible while one active record
supplies adjacent context. Use it when row-by-row browsing is a normal user
path and the adjacent context helps the user interpret or choose the next
record. Typical contexts include a task description, a person's assignments,
an order summary, record history, or calculated status.

Keep the collection self-contained or open a separate detail route when the
context is rarely consulted, needs most of the viewport, requires a long
workflow, or makes sequential browsing harder. Use independent row selection
for bulk work. Active-row context identifies one current record; it is not a
multi-record selection model.

Choose the detail surface from the value it contains:

- Use an information panel for identity, narrative text, status, ownership,
  small relationship summaries, history, and contextual actions for one row.
- Use another Grid for a repeatable related collection that users compare,
  sort, filter, navigate, or activate. Constrain it with the active master's
  foreign key.
- Combine a compact information panel and a related Grid when both remain
  useful during sequential browsing. Keep one clear primary action.

Active-row movement updates the preview. Row activation advances the workflow:

- When the preview already provides the read view, activation commonly opens
  the record's edit or named action route.
- When a related Grid is the next work surface, activation moves keyboard focus
  into that Grid. Its active row can drive another preview, and its activation
  can open the related record's edit route.
- Enter and double-click should run the same semantic action. Gesture-specific
  behavior creates two workflows for one command.

Render loading, empty, error, and missing-row states inside the detail region.
Cancel or supersede detail requests as the active master changes. Keep the
master cursor usable while the detail region loads.

## Active Row And Row Activation APIs

Active-row change and row activation are separate signals:

- Active-row state changes when the row cursor moves, the configured cell-grid
  projection moves, the row disappears, or its displayed values change. It may
  be null.
- Row activation is a repeatable semantic event. It runs after a configured
  Enter, click, or double-click gesture successfully resolves an active row.
  Activating the same row twice produces two events.

TGrid provides the typed application adapter:

- `useTGridActiveRow(session)` returns React state. Render the detail region
  directly from this value instead of copying it into local state.
- `session.activeRow()` and `session.subscribeActiveRow(listener)` expose the
  same identity-stable state outside React.
- `<TGrid onRowActivate={handler}>` and
  `session.onRowActivate(handler)` expose configured activation events. The
  event contains `activeRow` and `trigger`. Check `activeRow.kind === "data"`
  before treating `activeRow.values` as a complete persisted record.

Configure the interaction on the TGrid definition:

The fragment below assumes application-owned `levels`, `navigate`, and preview
components.

```tsx
import {
  TGrid,
  defineTGrid,
  useTGridActiveRow,
  useTGridSession,
} from "@sapporta/frontend";
import { ROW_PRIMARY_MASTER_DETAIL_WITH_ACTIVATION } from "@sapporta/grid";

const definition = defineTGrid<RowsByLevel>({
  rootLevel: "tasks",
  interaction: ROW_PRIMARY_MASTER_DETAIL_WITH_ACTIVATION,
  levels,
});

function TaskBrowser() {
  const session = useTGridSession(definition);
  const activeRow = useTGridActiveRow(session);
  if (!session) return <LoadingState />;

  const task =
    activeRow?.kind === "data" && activeRow.levelId === "tasks"
      ? activeRow.values
      : null;

  return (
    <div className="master-detail">
      <TGrid
        session={session}
        onRowActivate={({ activeRow: activated }) => {
          if (activated.kind === "data" && activated.levelId === "tasks") {
            navigate(`/tasks/${activated.values.id}/edit`);
          }
        }}
      />
      <TaskPreview task={task} />
    </div>
  );
}
```

`SchemaTableGridView` accepts the interaction configuration but does not expose
the active-row hook or activation callback as component props. Use
`useSchemaTableGrid(...)` when a schema-derived composite view needs its
session, then read that session with `useTGridActiveRow` and render `TGrid` in
the application-owned layout.

BaseGrid provides the framework-level state and event surfaces:

- `useGridActiveRow(runtime)` adapts the current `GridActiveRow` to React.
- `runtime.activeRow()` and `runtime.subscribeActiveRow(listener)` expose the
  grid-wide state.
- `runtime.on("rowActivated", handler)` receives activation events.
- `RuntimeArgs.on.rowActivated` installs the same listener before the root
  source is acquired.

Create a React-owned BaseGrid runtime with the activation preset and subscribe
to its event for navigation or focus transfer:

```tsx
function BaseGridScreen() {
  const runtime = useGridRuntimeEffect(
    () =>
      createGridRuntime({
        schema,
        dataSource,
        interaction: ROW_PRIMARY_MASTER_DETAIL_WITH_ACTIVATION,
      }),
    [schema, dataSource],
  );
  return runtime ? <BaseMasterDetail runtime={runtime} /> : <LoadingState />;
}

function BaseMasterDetail({ runtime }: { runtime: GridRuntime }) {
  const activeRow = useGridActiveRow(runtime);

  useEffect(
    () =>
      runtime.on("rowActivated", ({ activeRow: activated }) => {
        if (activated.row.kind === "data") {
          openRecord(activated.row.columns.id);
        }
      }),
    [runtime],
  );

  return <RecordPreview row={activeRow?.row ?? null} />;
}
```

An enabled Enter activation runs before hierarchy expansion. The
`ROW_PRIMARY_MASTER_DETAIL` preset uses Enter for expansion. The
`ROW_PRIMARY_MASTER_DETAIL_WITH_ACTIVATION` preset reserves Enter for row
activation and uses left and right for expansion. A custom
`GridInteractionConfig.activeRow.activation.startsOn` list may also enable
single-click activation.

Column `activation.startsOn` gestures are cell-grid input. Use it when one cell owns
the action. Use row activation when the whole row owns the action.

To move from an activated master into an already mounted row-list detail Grid,
use `cursorManagerFor(detailRuntime)` from `@sapporta/grid/advanced` and move
the row cursor to a current displayed detail row. That command queues focus for
the detail Grid. If detail rows are still loading, retain a pending focus intent
and fulfill it after the detail source publishes a focusable row.

```ts
const firstDetailRow = detailRuntime.root
  .displayedRows()
  .rows.find((row) => row.kind === "data");

if (firstDetailRow) {
  cursorManagerFor(detailRuntime).moveRowCursorTo({
    path: detailRuntime.root.path,
    rowId: firstDetailRow.id,
  });
}
```

## Relationship Context

Constrain a detail page's related Grid with a fixed foreign-key condition:

```ts
query: {
  owner: "host",
  urlSync: true,
  fixedFilters: [eqCondition("project_id", projectId)],
}
```

Import `eqCondition` from `@sapporta/shared/filter`. `fixedFilters` apply to row
fetches and CSV exports but do not appear as editable filter state; use
`initialFilters` when users may remove the condition.

For expandable master-detail data, declare the relationship on the child level:

```ts
parent: { level: "projects", foreignKey: "project_id" }
```

TGrid derives the path-local parent equality filter. Keep both mechanisms as
product constraints; server row scope remains the authorization boundary.

## Staged Batch Decision

Before choosing an editable Grid or temporary in-memory table for a staged
batch, define the workflow boundary:

- whether edits are validated per cell, per row, and again as a complete batch;
- what cancel, discard, row removal, retry, and navigation-away do to drafts;
- how stale source rows and concurrent changes are detected and resolved;
- which permissions and row-scope rules apply to every participating row; and
- whether one server transaction commits the whole batch or the workflow
  deliberately permits and reports partial success.

Use a table-aware Grid when persisted Sapporta rows own the workflow and its
metadata behavior. Use BaseGrid draft or phantom rows when the application owns
a composite, not-yet-persisted batch. In either case, keep the final validation,
conflict policy, and transaction boundary in an app-owned save handler or typed
endpoint rather than in cell renderers.

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
- Match column activation to the interaction mode. Row-list clicks move the row
  cursor; cell `startsOn` gestures require cell-grid mode unless a custom
  renderer exposes an explicit `CellActivationButton` or link.
- For bulk actions, read selected rows through public runtime/session APIs
  rather than controller internals or parallel React selection state.
- If exact helper behavior is unclear, inspect the installed package in the app
  before writing code.
