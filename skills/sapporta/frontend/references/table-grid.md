# Table And Grid Views

Use Sapporta table primitives from `@sapporta/frontend`. In an app, inspect
`packages/frontend/node_modules/@sapporta/frontend` for exact props and types.

## Choose The Surface

1. `SchemaTableGridView` for a schema table on one of the app's routes.
2. `buildSchemaTGridConfig` + `defineTGrid` when the table relationships are
   right but the page needs different columns, renderers, editors, query
   defaults, row transport, interaction, or services.
3. `defineTGrid` directly when the page owns row shapes or the level graph.
4. `useTGridSession`, `TGrid`, `TableToolbar`, `Pagination`,
   `useTableGridUrlState`, `useTableToolbarProps`, `useTablePaginationProps`,
   and `TableGridSurface` only when the visible surface itself is custom.

Preserve search, filters, sort, pagination, CSV export, lookup labels, URL
state, loading states, and error states unless the user asks for less.

In auth-enabled apps, schema grid primitives should load rows through the
built-in table APIs so row-access predicates are applied server-side. Custom
row sources, save handlers, and app services must call scoped backend
endpoints; `fixedFilters`, hidden columns, and client-only checks are product
constraints, not authorization.

## Standard Schema Route

Use the loaded schema metadata to find the table the page renders. `table` is a
`TableSchema`; build `tablesByName` from the same `useSchemaStore` tables array.

```tsx
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SchemaTableGridView } from "@sapporta/frontend";
import { useSchemaStore } from "@sapporta/frontend/schema";

export function InvoicesGridRoute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const table = useSchemaStore((s) =>
    s.tables.find((candidate) => candidate.name === "invoices"),
  );
  const tables = useSchemaStore((s) => s.tables);
  const tablesByName = useMemo(
    () => Object.fromEntries(tables.map((schema) => [schema.name, schema])),
    [tables],
  );

  if (!table) return null;

  return (
    <SchemaTableGridView
      source={{ table, tablesByName }}
      route={{ path: "/invoices", searchParams, navigate }}
      registerAs="invoices"
      onNewRecord={() => navigate("/invoices/new")}
    />
  );
}
```

`SchemaTableGridView` keeps schema columns, nested rows, row loading/saving,
toolbar, pagination, URL sync, lookup labels, loading/error states, and CSV
export. `route` is always `{ path, searchParams, navigate }`; do not pass
separate `searchParams`, `navigate`, or `routePath` props.

## Schema-Derived Customization

Use `buildSchemaTGridConfig` when the page still uses the schema graph but
needs page-specific behavior.

```tsx
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  TableGridView,
  buildSchemaTGridConfig,
  defineTGrid,
  useTGridCell,
  type SchemaTableRowsByLevel,
} from "@sapporta/frontend";
import { useSchemaStore } from "@sapporta/frontend/schema";
import { eqCondition } from "@sapporta/shared/filter";

function PaymentStatusCell() {
  const cell = useTGridCell<SchemaTableRowsByLevel, unknown, "invoices">(
    "invoices",
  );
  return <span>{String(cell.row.status ?? "")}</span>;
}

export function DraftInvoicesGridRoute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const table = useSchemaStore((s) =>
    s.tables.find((candidate) => candidate.name === "invoices"),
  );
  const tables = useSchemaStore((s) => s.tables);

  const definition = useMemo(() => {
    if (!table) return null;
    const tablesByName = Object.fromEntries(
      tables.map((schema) => [schema.name, schema]),
    );
    const config = buildSchemaTGridConfig({
      source: { rootTableName: "invoices", tablesByName },
      rootRows: {
        fixedFilters: [eqCondition("status", "draft")],
        initialSort: [{ colId: "invoice_date", direction: "desc" }],
      },
      relatedRows: { pageSize: 50 },
    });

    config.levels.invoices.columns = (columns) => [
      columns.table("customer_id", { header: "Customer" }),
      columns.table("invoice_date", { header: "Date", editable: false }),
      columns.table("status", {
        header: "Payment",
        renderCell: PaymentStatusCell,
      }),
      columns.remainingTable({
        exclude: ["id", "customer_id", "invoice_date", "status"],
      }),
    ];

    return defineTGrid<SchemaTableRowsByLevel>(config);
  }, [table, tables]);

  if (!table || !definition) return null;

  return (
    <TableGridView<SchemaTableRowsByLevel>
      definition={definition}
      table={table}
      route={{ path: "/draft-invoices", searchParams, navigate }}
      registerAs="invoices"
    />
  );
}
```

Use `fixedFilters` for constraints the user should not edit in the toolbar. Use
`initialFilters` for editable defaults. Use the table name for `registerAs`
when create/save actions elsewhere should reload this grid. Omit `registerAs`
when the custom page should stay independent. `relatedRows` applies to
expansion-loaded child rows; omit it when child defaults are fine.
Do not include `workspace_id` or `scoped_to_user_id` in `fixedFilters` to
enforce auth; the server must own data-authority scope.

## Interaction Presets

TGrid definitions accept an optional `interaction` from `@sapporta/grid`.
Use it when the page needs different keyboard, focus, row-highlight, cell
selection, or row-selection behavior. If omitted, Sapporta uses
`CELL_EDITING_GRID`.

```tsx
import {
  ROW_PRIMARY_MASTER_DETAIL,
  type GridInteractionConfig,
} from "@sapporta/grid";

const definition = defineTGrid<SchemaTableRowsByLevel>({
  ...config,
  interaction: ROW_PRIMARY_MASTER_DETAIL,
});
```

Choose from the existing presets before composing your own:

| Desired UX | Preset | Behavior |
| --- | --- | --- |
| Editable spreadsheet | `CELL_EDITING_GRID` | Default. Active cell plus Shift+Arrow cell range selection. |
| Editable spreadsheet without cell ranges | `CELL_EDITING_NO_SELECTION_GRID` | Active cell and editing remain, but Shift+Arrow moves without selecting cells. |
| Editable spreadsheet with row highlight | `CELL_GRID_WITH_ACTIVE_ROW` | Active row derives from the active cell; no row selection. |
| Editable spreadsheet with independent row selection | `CELL_GRID_WITH_INDEPENDENT_ROW_SELECTION` | Cell cursor remains primary; selected rows are independent operation targets. |
| Editable spreadsheet with detail panel following the cursor row | `CELL_PRIMARY_WITH_SIDE_PANEL_ROW` | Row selection follows the active cell's row; Space does not pin a different row. |
| Editable spreadsheet with independently pinned detail row | `CELL_PRIMARY_WITH_SELECTED_SIDE_PANEL_ROW` | Space toggles the active cell's row as the selected detail target. |
| Master-detail row list | `ROW_PRIMARY_MASTER_DETAIL` | No active cell and no cell selection. Arrow keys move the row cursor; selection follows the active row. Use for row highlight only. |
| Multi-select row list | `ROW_MULTISELECT_LIST` | No active cell. Arrow keys move the row cursor; Shift+Arrow extends row selection; Space toggles the active row. |

Use `ROW_PRIMARY_MASTER_DETAIL` when the user asks for a table grid with row
highlighting and no cell-based selection. Use `CELL_GRID_WITH_ACTIVE_ROW` when
they still need cell editing or cell keyboard focus but also need row highlight.
For bulk actions, read selected rows from the grid runtime (`selectedRowsFor`
or `selectedRowIds`) instead of reading controller internals.

The presets are ordinary `GridInteractionConfig` values, not special runtime
cases. For a custom pattern, compose a concrete value and use
`satisfies GridInteractionConfig`:

```tsx
import { type GridInteractionConfig } from "@sapporta/grid";

const ROW_LIST_WITH_SINGLE_PINNED_SELECTION = {
  mode: "row-list",
  activeCell: { kind: "none" },
  selectedCells: { kind: "none" },
  activeRow: {
    kind: "from-row-cursor",
    keyboard: {
      arrows: "move-active-row",
      shiftArrows: "move-active-row",
      expansion: "left-right-enter",
    },
  },
  selectedRows: {
    kind: "enabled",
    mode: "single",
    sync: { kind: "independent" },
    keyboard: { space: "toggle-active-row" },
  },
} satisfies GridInteractionConfig;
```

Valid configs use one of two modes:

- `cell-grid`: `activeCell` is enabled; `selectedCells` may be `range` or
  `none`; `activeRow` may derive from the active cell; `selectedRows` may be
  disabled, follow the active row, or be independent.
- `row-list`: `activeCell` and `selectedCells` must both be `none`; the row
  cursor owns keyboard movement; row selection may follow the active row or be
  independent.

If the visible surface itself is custom and needs checkbox selection chrome,
inspect `@sapporta/grid/column-preset` for the lower-level column preset APIs.

## Custom Rows Or Saves

Use `defineTGrid` directly when the page has typed rows, custom children,
client columns, app services, or save behavior that calls app APIs. Define row
types from the data returned by that page's row source.

```tsx
import {
  defineTGrid,
  useTGridCell,
  type TGridCellWriteContext,
} from "@sapporta/frontend";

type InvoiceRow = {
  id: string;
  due_date: string | null;
  status: "draft" | "sent" | "paid";
};

type InvoiceItemRow = {
  id: string;
  item_id: string | null;
  quantity: number;
  balance_stock: number | null;
};

type RowsByLevel = {
  invoices: InvoiceRow;
  "invoices.items": InvoiceItemRow;
};

type AppServices = {
  stockAvailable(input: {
    lineId: string;
    itemId: string | null;
    quantity: number;
  }): Promise<{ available: boolean; balanceStock: number }>;
};

function OverdueDaysCell() {
  const cell = useTGridCell<RowsByLevel, AppServices, "invoices">("invoices");
  return <span>{cell.row.due_date ?? ""}</span>;
}

async function saveQuantity(
  ctx: TGridCellWriteContext<
    RowsByLevel,
    AppServices,
    "invoices.items",
    "quantity"
  >,
) {
  const result = await ctx.appServices.stockAvailable({
    lineId: ctx.row.id,
    itemId: ctx.row.item_id,
    quantity: ctx.value,
  });
  return {
    kind: "patch" as const,
    patch: {
      quantity: result.available ? ctx.value : ctx.row.quantity,
      balance_stock: result.balanceStock,
    },
  };
}
```

Pass concrete `services` to `TableGridView` when `AppServices` is not
`unknown`; those methods become available as `ctx.appServices`. Keep rendering
and saving in the grid definition, and let `TableGridView` keep the standard
table affordances.
Custom save services must omit scope fields from payloads and let the backend
handler stamp or guard scope through Sapporta auth helpers.

## Query, Toolbar, Pagination

Each level can set `query.owner`: `host` for visible controls, `source` for
expansion-loaded rows. Root defaults to `host`; children default to `source`.

Query options: `pageSize`, `initialPage`, `initialSort`, `initialFilters`,
`initialSearch`, `fixedFilters`, `urlSync`.

URL helpers: `buildTableSearchParams`, `parseTableSearchParams`,
`useTableGridUrlState`, `tableGridUrlForQueryState`.

`TableGridView` accepts `toolbar` and `pagination` overrides. Use
`toolbar={false}` or `pagination={false}` only when the product explicitly
does not want those controls.

```tsx
<TableGridView
  definition={definition}
  table={table}
  route={{ path: "/draft-invoices", searchParams, navigate }}
  toolbar={({ props, session }) => (
    <MyToolbar {...props} onRefresh={() => session.reloadRows()} />
  )}
  pagination={({ props }) => <MyPagination {...props} compact />}
/>
```

Schema grid primitives read `table.label`, column labels,
`table.search.columns`, `table.children`, child `foreignKey`, child `columns`,
and child `defaultSort`.
