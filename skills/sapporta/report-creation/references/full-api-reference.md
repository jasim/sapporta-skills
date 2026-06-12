# Route-Based Report API Reference

Use this reference when a report needs exact shared result and renderer types.

## Backend Route Contract

Declare report routes with `@sapporta/rest-core` contracts. Use
`gridReportResultSchema` for the success response.

```ts
import { z } from "zod";
import { initContract } from "@sapporta/rest-core";
import { gridReportResultSchema } from "@sapporta/shared/report-grid";
import { errorBodySchema } from "@sapporta/shared/contracts";

const c = initContract();

export const reportRoute = c.query({
  method: "GET",
  path: "/reports/example",
  query: z.object({ asOfDate: z.string() }),
  responses: {
    200: gridReportResultSchema,
    400: errorBodySchema,
    403: errorBodySchema,
  },
});
```

## `GridReportResult`

```ts
type GridReportResult = {
  name: string;
  label: string;
  columns: GridColumn[];
  levelColumns: Record<string, GridColumn[]>;
  data: GridReportNode[];
  levelOptions?: Record<string, { defaultCollapsed?: boolean }>;
  footerRows?: GridFooterRow[];
  errors?: { path: string; message: string }[];
  stats?: GridReportStat[];
};
```

`columns` is the top-level grid's columns. `levelColumns` must include entries
for every `GridReportNode.levelName` used in `data` or nested `children`.

## `GridColumn`

```ts
type GridColumn = {
  name: string;
  label: string;
  kind?: "text" | "number" | "boolean" | "date" | "timestamp";
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
  clientEditable?: boolean;
};
```

Use `visuallyHidden: true` for IDs or helper fields that link resolvers need but
users should not see as normal columns.

## `GridReportNode`

```ts
type GridReportNode = {
  levelName: string;
  columns: Record<string, unknown>;
  rollup?: Record<string, unknown>;
  children?: Record<string, GridReportNode[] | GridReportNode | null>;
  childFooterRows?: Record<string, GridFooterRow[]>;
  kind?: "opening" | "closing" | "subtotal";
};
```

`columns` holds source row values. `rollup` holds computed values for the same
display row. The renderer reads `node.columns[column.name]` first and then
falls back to `node.rollup?.[column.name]`.

`children` is keyed by child level name. `childFooterRows` is keyed the same
way and renders after that child group.

## `GridFooterRow`

```ts
type GridFooterRow = {
  label: string;
  columns: Record<string, unknown>;
};
```

Top-level footer rows live on `GridReportResult.footerRows`. Child group
footers live on `GridReportNode.childFooterRows`.

## `GridReportStat`

```ts
type GridReportStat = {
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
  ReportGridResult,
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

`ReportGridResult` props:

```ts
type ReportGridResultProps<TInput = unknown> = {
  result: GridReportResult;
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

Links are frontend-only. Do not put link metadata in `GridReportResult`.

## Validation

- `pnpm exec sapporta describe "GET /api/reports/<name>"` confirms OpenAPI
  discovery for the route.
- Route tests should parse successful responses with `gridReportResultSchema`.
- Mapper tests should assert hierarchy, rollups, footers, and hidden IDs.
