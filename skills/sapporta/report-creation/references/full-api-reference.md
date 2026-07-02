# Route-Based Report API Reference

Use this reference when a report needs exact shared dataset and renderer types.

## Backend Route Contract

Declare report routes with `@sapporta/rest-core` contracts. Use
`gridDatasetSchema` for the success response.

```ts
import { z } from "zod";
import { initContract } from "@sapporta/rest-core";
import { gridDatasetSchema } from "@sapporta/shared/grid-dataset";
import { errorBodySchema } from "@sapporta/shared/contracts";

const c = initContract();

export const reportRoute = c.query({
  method: "GET",
  path: "/reports/example",
  query: z.object({ asOfDate: z.string() }),
  responses: {
    200: gridDatasetSchema,
    400: errorBodySchema,
    403: errorBodySchema,
  },
});
```

## `GridDataset`

```ts
type GridDataset = {
  name: string;
  label: string;
  rootLevel: string;
  levels: Record<string, GridDatasetLevel>;
  nodes: GridDatasetNode[];
  totalCount?: number;
  footerRows?: GridDatasetFooterRow[];
  errors?: { path: string; message: string }[];
  stats?: GridDatasetStat[];
};
```

`rootLevel` names the level rendered at the root. `levels` must include entries
for every `GridDatasetNode.levelName` used in `nodes` or nested `children`.

## `GridDatasetLevel`

```ts
type GridDatasetLevel = {
  label?: string;
  columns: GridDatasetColumn[];
  childLevels: string[];
  defaultCollapsed?: boolean;
};
```

## `GridDatasetColumn`

```ts
type GridDatasetColumn = {
  id: string;
  label: string;
  kind: "text" | "number" | "boolean" | "date" | "timestamp";
  displayFormat?: "currency" | "percentage";
  textDisplay?: "multiLine" | "markdown";
  visuallyHidden?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  colorRule?: "positive" | "negative" | "signed";
  zeroDisplay?: "blank" | "dot";
  strong?: boolean;
  notes?: string;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
};
```

Use `visuallyHidden: true` for IDs or helper fields that link resolvers need but
users should not see as normal columns.

## `GridDatasetNode`

```ts
type GridDatasetNode = {
  rowKey: string;
  levelName: string;
  columns: Record<string, unknown>;
  rollup?: Record<string, unknown>;
  children?: Record<string, GridDatasetNode[]>;
  childFooterRows?: Record<string, GridDatasetFooterRow[]>;
  kind?: "opening" | "closing" | "subtotal";
};
```

`columns` holds source row values. `rollup` holds computed values for the same
display row. The renderer reads `node.columns[column.id]` first and then falls
back to `node.rollup?.[column.id]`.

`children` is keyed by child level name. `childFooterRows` is keyed the same
way and renders after that child group.

## `GridDatasetFooterRow`

```ts
type GridDatasetFooterRow = {
  rowKey: string;
  columns: Record<string, unknown>;
};
```

Top-level footer rows live on `GridDataset.footerRows`. Child group footers
live on `GridDatasetNode.childFooterRows`.

## `GridDatasetStat`

```ts
type GridDatasetStat = {
  label: string;
  value: string;
  tone?: "fg" | "positive" | "negative" | "brand" | "muted";
  strong?: boolean;
};
```

Use stats for compact summary values that sit outside the grid.

## Frontend Renderer

```tsx
import {
  ReportGridDataset,
  ReportScreenFrame,
  ReportToolbar,
  ReportRunButton,
  DateRangeField,
  EntitySelectField,
  buildSearchParams,
  createSnapshotUrl,
  useUrlQueryState,
} from "@sapporta/frontend/report";
```

`ReportGridDataset` props:

```ts
type ReportGridDatasetProps<TInput = unknown> = {
  dataset: GridDataset;
  links?: ReportGridLinkResolvers<TInput>;
  linkContext?: { input: TInput };
};
```

## Link Resolvers

```ts
type ReportGridLink = {
  label: string;
  href: string;
  kind?: "drill-down" | "record" | "route" | "external";
  icon?: "drill-up" | "drill-into" | "report" | "external";
  target?: "_self" | "_blank";
};

type ReportGridLinkResolvers<TInput = unknown> = Record<
  string,
  {
    row?: (context: ReportGridLinkContext<TInput>) => ReportGridLink[];
    cell?: Record<
      string,
      (context: ReportGridLinkContext<TInput>) => ReportGridLink[]
    >;
    footer?: (context: ReportGridFooterLinkContext<TInput>) => ReportGridLink[];
  }
>;
```

Row and cell resolvers receive `dataset`, `node`, `levelName`, optional
`input`, `ancestors`, and, for cell resolvers, `column` and `value`. Footer
resolvers receive `dataset`, `footerRow`, and optional `input`.

Links are frontend-only. Do not put link metadata in `GridDataset`.

## Validation

- `pnpm exec sapporta describe "GET /api/reports/<name>"` confirms OpenAPI
  discovery for the route.
- Route tests should parse successful responses with `gridDatasetSchema`.
- Mapper tests should assert hierarchy, rollups, footers, and hidden IDs.
