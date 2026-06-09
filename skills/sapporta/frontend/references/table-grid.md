# Table And Grid Views

Use Sapporta's public table primitives from `@sapporta/frontend`. If the
project source is not available, inspect the installed package declarations in
`node_modules/@sapporta/frontend`.

## Decision Path

1. `SchemaTableGridView` for a schema table rendered at an app-owned route.
2. `buildSchemaTGridConfig` + `defineTGrid` when the schema graph is right but
   the page changes columns, renderers, editors, query defaults, row clients,
   interaction, or app services.
3. `defineTGrid` directly when the page owns row shapes or level graph.
4. `useTGridSession`, `TGrid`, `TableToolbar`, `Pagination`,
   `useTableGridUrlState`, `useTableToolbarProps`, `useTablePaginationProps`,
   and `TableGridSurface` only for a custom visible surface.

Preserve search, filters, sort, pagination, CSV export, lookup labels, URL
state, loading states, and error states unless the user asks for less.

## Standard Schema Route

`SchemaTableGridView` keeps schema-derived columns, nested rows, default row
transport, save behavior, toolbar, pagination, URL sync, loading/error states,
lookup labels, and CSV export.

```tsx
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SchemaTableGridView, useSchemaStore } from "@sapporta/frontend";

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

`route` is always `{ path, searchParams, navigate }`; do not pass separate
`searchParams`, `navigate`, or `routePath` props to `TableGridView`.

## Schema-Derived Customization

Use `buildSchemaTGridConfig` when the schema graph is right but one level needs
custom columns, query defaults, row transport, or services. Current helper
shape:

```ts
buildSchemaTGridConfig({
  source: { rootTableName, tablesByName },
  rootRows,
  relatedRows,
});
```

```tsx
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  TableGridView,
  buildSchemaTGridConfig,
  defineTGrid,
  useTGridCell,
  useSchemaStore,
  type SchemaTableRowsByLevel,
} from "@sapporta/frontend";
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
    });

    config.levels.invoices.columns = (columns) => [
      columns.table("customer_id", { header: "Customer" }),
      columns.table("invoice_date", { header: "Date", editable: false }),
      columns.table("status", {
        header: "Payment",
        renderCell: PaymentStatusCell,
        readsRowFields: ["status"],
        invalidatedBy: ["status"],
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

Use `fixedFilters` for enforced constraints hidden from toolbar editing. Use
`initialFilters` for editable defaults. Use the table name for `registerAs`
when global create/save flows should reload this mounted grid; omit it when the
custom page should not join that reload bridge.

## Fully Custom TGrid

Use `defineTGrid` directly when the page has typed rows, custom children,
client columns, app services, or save behavior that calls app APIs. Keep
rendering and saving in the definition; let `TableGridView` keep the standard
table affordances.

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

Real routes still provide schemas, router state, and services before rendering
`TableGridView`.

## Query Ownership

Each level can have `query.owner`.

- `host`: the page owns visible controls for that level.
- `source`: expansion context loads rows for that level.

Root levels default to `host`; child levels default to `source`.

Query options: `pageSize`, `initialPage`, `initialSort`, `initialFilters`,
`initialSearch`, `fixedFilters`, `urlSync`.

URL helpers: `buildTableSearchParams`, `parseTableSearchParams`,
`useTableGridUrlState`, `tableGridUrlForQueryState`.

## Custom Toolbar, Pagination, Or Shell

`TableGridView` accepts `toolbar` and `pagination` overrides. Pass
`toolbar={false}` or `pagination={false}` only when the product explicitly does
not want those controls.

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

For custom surfaces, compose the advanced exports listed in the decision path.

## Schema Metadata

Grid primitives read `table.label`, column labels, `table.search.columns`,
`table.children`, child `foreignKey`, child `columns`, and child `defaultSort`.
