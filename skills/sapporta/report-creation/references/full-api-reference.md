# Report Creation — Full API Reference

Source: report authoring types in the Sapporta core package, plus the shared report and metadata contracts consumed by app frontends.

## `report(definition: ReportDefinition): ReportDefinition`

Creates a report definition with type checking.

## ReportDefinition

```typescript
type ReportDefinition = {
  /** URL-safe identifier. Used in API routes: /api/reports/:name/results (GET) or /api/reports/:name/execute (POST) */
  name: string;
  /** Human-readable title */
  label: string;
  /** Parameter definitions */
  params: ReportParam[];
  /** Named SQL data sources */
  sources: Record<string, ReportSource>;
  /** The tree structure defining how to assemble query results */
  tree: ReportTreeNode;
};
```

## ReportParam

```typescript
type ParamType = "date" | "string" | "integer" | "float" | "daterange";

type ReportParam = {
  /** Bind variable name. Used as $name in SQL sources. Must be unique. */
  name: string;
  /** Data type. Scalar string inputs are parsed before SQL binding. */
  type: ParamType;
  /** If true, execution throws when this param is not supplied. */
  required: boolean;
  /** Used when the param is not supplied. Only relevant if required=false. */
  default?: unknown;
  /** Display label for the UI parameter form. Falls back to name if omitted. */
  label?: string;
  /** Table to look up options from. Renders a dropdown populated from the
   *  table's _lookup endpoint (display column as labels, PK as values). */
  lookup?: string;
  /** For daterange params: SQL bind name for the resolved start date. */
  fromBind?: string;
  /** For daterange params: SQL bind name for the resolved end date. */
  toBind?: string;
};
```

For `type: "daterange"`, declare distinct `fromBind` and `toBind` values and reference those names in SQL. The incoming parameter uses the report parameter name, while the SQL receives the two resolved date values.

## ReportSource

```typescript
type ReportSource = {
  /** Raw SQL query. Use $name for bind variables (params and parent binds).
   *  The engine converts $name to ? positional parameters for SQLite execution. */
  query: string;
};
```

Report sources are raw SQL declarations. In auth-enabled projects, source SQL
that reads scoped tables must not rely on client-supplied workspace or user
parameters. Keep `workspace_id` and `scoped_to_user_id` server-controlled, use
the project's auth-aware report execution pattern when available, and do not
ship reports over scoped tables if the active report route cannot enforce the
same row visibility as the table APIs.

## ColumnSchema

```typescript
interface ColumnSchema {
  name: string;
  label: string;
  kind?: "text" | "number" | "boolean" | "date" | "timestamp";
  displayFormat?: "currency" | "percentage";
  textDisplay?: "multiLine" | "markdown";

  // Sizing hints (character counts) — control CSS grid column widths
  width?: number;     // Fixed width
  minWidth?: number;  // Flexible with minimum
  maxWidth?: number;  // Flexible with maximum

  // DB-derived and UI metadata — all optional, default to inert values
  dataType?: string;
  primary?: boolean;
  isUnique?: boolean;
  notNull?: boolean;
  hasDefault?: boolean;
  foreignKey?: { table: string; column: string } | null;
  select?: { options: string[] } | null;
  visuallyHidden?: boolean;
  colorRule?: "positive" | "negative" | "signed";
  zeroDisplay?: "blank" | "dot";
  strong?: boolean;
  notes?: string;
  clientEditable?: boolean;
  links?: ReportLink[];
}
```

When authoring report columns, only `name` is required. The engine normalizes each report column to `ColumnSchema` and supplies a default `label` when omitted.

```typescript
type ReportColumn = Omit<ColumnSchema, "label"> & {
  label?: string;
  display?: (data: Record<string, unknown>) => string | number | null;
};
```

`display` is an authoring-time helper. The engine applies it before returning results, but the function itself is not sent to the client.

## ReportLink

```typescript
type ReportLink =
  | { kind: "table"; table: string; bind: LinkBind; label?: string; icon?: LinkIcon }
  | { kind: "report"; report: string; bind: LinkBind; label?: string; icon?: LinkIcon };

type LinkBind = Record<string, string>;
type LinkIcon = "drill-up" | "drill-into" | "report";
```

## ReportTreeNode

```typescript
type ReportTreeNode = {
  /** Name of the source in the report's sources map */
  source: string;
  /** Name for this tree level. Used as the key in the parent's children map. */
  levelName: string;
  /** Columns to extract from each source row into the output node */
  columns: ReportColumn[];

  // --- Parent-child binding ---

  /** How to pass values from the parent row into this node's SQL query */
  bind?:
    | Record<string, string>           // { sql_var: "$parent.col" }
    | ((parent: Record<string, unknown>, params: Record<string, unknown>) => Record<string, unknown>);

  /** Conditional execution. If returns false, the child is skipped. */
  when?: (parent: Record<string, unknown>) => boolean;

  /** If true, this child produces a single object (or null) instead of an array */
  singular?: boolean;

  // --- Post-processing ---

  /** Compute values on a parent node from its materialized children */
  rollup?: (children: Record<string, ReportOutputNode[]>) => Record<string, unknown>;

  /** Post-process assembled output nodes for this tree level */
  transform?: (nodes: ReportOutputNode[], context: TransformContext) => ReportOutputNode[];

  /** Sort specification. Applied after transform. */
  sort?: ReportSort[];

  /** Footer rows. Computed after all data nodes are finalized. */
  footer?: ReportFooter[];

  /** When true, this level's children start collapsed in UIs that honor it. */
  defaultCollapsed?: boolean;

  /** Child tree nodes. Processed in declaration order for each parent row. */
  children?: ReportTreeNode[];

  /** Row-level navigation metadata collected into ReportResult.levelLinks. */
  rowLinks?: ReportLink[];
};
```

## ReportSort

```typescript
type ReportSort = {
  /** Column key or rollup key to sort by */
  key: string;
  /** Sort direction. The TypeScript type requires an explicit value. */
  direction: "asc" | "desc";
};
```

## ReportFooter

```typescript
type ReportFooter = {
  /** Label for the footer row */
  label: string;
  /** Compute footer values from the assembled sibling nodes at this level */
  compute: (nodes: ReportOutputNode[]) => Record<string, unknown>;
};
```

## TransformContext

```typescript
type TransformContext = {
  /** The parent output node */
  parent: ReportOutputNode;
  /** Children of the parent processed before the current child, keyed by level name.
   *  Singular children: single ReportOutputNode or null.
   *  List children: ReportOutputNode[]. */
  siblings: Record<string, ReportOutputNode | ReportOutputNode[] | null>;
  /** The resolved global params */
  params: Record<string, unknown>;
  /** Full SQL rows, parallel to the nodes array passed to transform. */
  rawRows: Record<string, unknown>[];
};
```

## Output Types

### ReportOutputNode

```typescript
type ReportOutputNode = {
  /** Level name from the tree node definition */
  levelName: string;
  /** Column values extracted from the source row */
  columns: Record<string, unknown>;
  /** Values computed by the rollup function */
  rollup?: Record<string, unknown>;
  /** Materialized children, keyed by level name */
  children?: Record<string, ReportOutputNode[] | ReportOutputNode | null>;
  /** Footer rows for each child level, keyed by levelName */
  childFooterRows?: Record<string, ReportFooterRow[]>;
  /** Optional structural row marker for opening, closing, or subtotal rows. */
  kind?: "opening" | "closing" | "subtotal";
};
```

### ReportFooterRow

```typescript
type ReportFooterRow = {
  label: string;
  columns: Record<string, unknown>;
};
```

### ReportResult

```typescript
type ReportResult = {
  /** Report name */
  name: string;
  /** Report label */
  label: string;
  /** Parameter definitions (so the UI can render a form) */
  params: ReportParam[];
  /** Column definitions from the root tree level */
  columns: ColumnSchema[];
  /** Column definitions for each tree level, keyed by levelName */
  levelColumns: Record<string, ColumnSchema[]>;
  /** The assembled tree data */
  data: ReportOutputNode[];
  /** Per-level UI options, keyed by levelName. */
  levelOptions?: Record<string, { defaultCollapsed?: boolean }>;
  /** Per-level row navigation metadata, keyed by levelName. */
  levelLinks?: Record<string, ReportLink[]>;
  /** Root-level footer rows (e.g. "Grand Total") */
  footerRows?: ReportFooterRow[];
  /** Non-fatal errors collected during execution */
  errors?: { path: string; message: string }[];
  /** Optional summary stats in the wire schema. The built-in executeReport path does not populate this today. */
  stats?: SerializedReportStat[];
};
```

### SerializedReportStat

```typescript
type SerializedReportStat = {
  label: string;
  value: string;
  tone?: "fg" | "positive" | "negative" | "brand" | "muted";
  strong?: boolean;
};
```
