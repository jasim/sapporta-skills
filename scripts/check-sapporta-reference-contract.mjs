import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const skillRoot = resolve(import.meta.dirname, "..");
const sapportaRoot = resolve(
  process.argv.slice(2).find((arg) => !arg.startsWith("--")) ?? "../sapporta",
);
const shouldTypecheck = process.argv.includes("--typecheck");

const files = {
  dispatch: readSkill("SKILL.md"),
  appGuide: readSkill("references/app-building/guide.md"),
  productSlice: readSkill("references/app-building/product-slice.md"),
  projectCreate: readSkill("references/app-building/project/create.md"),
  backendEndpoints: readSkill(
    "references/app-building/backend/endpoints.md",
  ),
  backendDomain: readSkill(
    "references/app-building/backend/domain-code.md",
  ),
  reportCreate: readSkill("references/app-building/reports/create.md"),
  reportLinking: readSkill("references/app-building/reports/linking.md"),
  frontendViews: readSkill("references/app-building/frontend/views.md"),
  forms: readSkill("references/app-building/frontend/forms.md"),
  dataConsole: readSkill("references/data-console/guide.md"),
  tableQueries: readSkill("references/data-console/table-queries.md"),
  reportRuns: readSkill("references/data-console/report-runs.md"),
  sqlFallback: readSkill("references/data-console/sql-fallback.md"),
  serverAccess: readSkill("references/data-console/server-access.md"),
  simpleForm: readSkill(
    "references/app-building/frontend/form-template/SimpleTaskForm.tsx.example",
  ),
  largeForm: readSkill(
    "references/app-building/frontend/form-template/TaskForm.tsx",
  ),
  formExports: readSapporta("packages/frontend/src/form/index.ts"),
  frontendTableExports: readSapporta("packages/frontend/src/table/index.ts"),
  frontendRows: readSapporta("packages/frontend/src/table/api/rows.ts"),
  queryExports: readSapporta("packages/frontend/src/table/query/index.ts"),
  sharedQueryParams: readSapporta("packages/shared/src/query-params.ts"),
  sharedApiClient: readSapporta("packages/shared/src/client/api-client.ts"),
  scopedRows: readSapporta("packages/core/src/rows/scoped-rows.ts"),
  tableRowScan: readSapporta("packages/core/src/rows/table-row-scan.ts"),
  tableQueryResolvers: readSapporta("packages/core/src/api/table-query.ts"),
  coreExports: readSapporta("packages/core/src/index.ts"),
  cliRegistry: readSapporta("packages/core/src/cli/commands/registry.ts"),
  cliClient: readSapporta("packages/core/src/cli/client/app-client.ts"),
  generatedAgents: readSapporta("packages/core/src/templates/AGENTS.md"),
  generatedMain: readSapporta(
    "packages/core/src/templates/packages/frontend/src/main.tsx",
  ),
  generatedQueryClient: readSapporta(
    "packages/core/src/templates/packages/frontend/src/query-client.ts",
  ),
  scaffoldManifest: readSapporta(
    "packages/core/src/cli/init-project/scaffold-manifest.ts",
  ),
};

const failures = [];

requireAll("skill dispatch", files.dispatch, [
  "app-building/product-slice.md",
  "Every new",
  "application and behavioral change uses the proportional product-model",
]);
requireAll("application-building guide", files.appGuide, [
  "[product-model and coherent-slice workflow](product-slice.md)",
  "After inspecting the project, read [product-slice.md](product-slice.md)",
]);
requireAll("common product-slice workflow", files.productSlice, [
  "**New application:**",
  "**New feature:**",
  "**Fine-grained behavior or UI adjustment:**",
  "Inspect every boundary, but change only the ones required by the outcome.",
  "active-row movement from passive viewport scrolling",
]);
requireAll("project-creation handoff", files.projectCreate, [
  "Project creation ends after the generated workspace",
  "[../product-slice.md](../product-slice.md)",
]);
forbidAll("project-creation workflow", files.projectCreate, [
  "## Build The First Connected Slice",
  "## Link Lists, Details, And Forms",
]);
requireAll("frontend route workflow", files.frontendViews, [
  "/<resources>/:id",
  "After create or edit, invalidate affected caches before opening detail.",
  "Do not assume generated detail or edit routes exist.",
  "table-query-options reference",
  "QueryParamRecord",
]);

requireAll("backend endpoint routing", files.backendEndpoints, [
  "reference/server/row-scoped-data-helpers.md",
  "reference before implementing a bounded read",
  "`findMany()`",
  "`page()`",
  "`scan()`",
  "`count()`/`countBy()`",
  "only an HTTP adapter",
  "scanTableRows()",
  "ownedRows(...)",
]);
requireAll("backend domain routing", files.backendDomain, [
  "reference/server/row-scoped-data-helpers.md",
  "construct Drizzle predicates directly",
  "do not manufacture HTTP query grammar",
]);
requireAll("report query routing", files.reportCreate, [
  "reference/server/row-scoped-data-helpers.md",
  "one guard per participating",
  "Do not route an advanced report to raw SQL",
]);
requireAll("report link routing", files.reportLinking, [
  "verified app-owned detail route",
  "becomes an equality filter on the",
  "does not imply a generated frontend",
]);
forbidAll("report link routing", files.reportLinking, [
  "/tables/<table>/<id>",
]);

requireAll("data-console query routing", files.dataConsole, [
  "`rows count`",
  "app-owned scoped report or read endpoint",
  "explicitly authorized administration or debugging",
]);
requireAll("table query routing", files.tableQueries, [
  "reference/cli/table-row-and-report-commands.md",
  "JSON `--where`",
  "Preserve repeated identical HTTP filter keys",
  "JSON `--where` cannot express",
  "QueryParamRecord",
  "disjoint modes",
  "scoped report or app-owned read endpoint rather than SQL",
]);
requireAll("report execution routing", files.reportRuns, [
  "`rows count`",
  "app-owned scoped report/read endpoint",
  "not as workspace-user query behavior",
]);
requireAll("SQL fallback routing", files.sqlFallback, [
  "Built-in `rows count` or table query",
  "Scoped custom report/read endpoint",
  "SQL fallback",
]);
requireAll("protected server access", files.serverAccess, [
  "Copy setup prompt",
  "secret-bearing",
  "private gitignored wrapper",
  "exact authenticated invocation in `AGENTS.md`",
  "never put the",
  "`pnpm exec sapporta endpoints list`",
  "`SAPPORTA_API_URL` and `SAPPORTA_API_TOKEN`",
]);
forbidAll("protected server access", files.serverAccess, [
  "should be passed with `--api-token <token>`",
]);

requireAll("form guidance", files.forms, [
  "Generated projects install TanStack Query",
  "packages/frontend/src/query-client.ts",
  "tableRecordQueryOptions",
  "tableRecordsPageQueryOptions",
  "tableQueryKeys.table",
  "FormSubmissionError",
  "fieldIssuesForSubmissionError",
  "firstFormErrorMessage",
  "reloadTGridRows",
  "table-query-options reference",
  "buildTableSelectionQuery()",
  "buildTableRowsQuery()",
  "fetchTableRow()",
  "fetchTableRows()",
  "Record<string, string>",
]);
forbidAll("form guidance", files.forms, [
  "does not install it or mount a QueryClient",
  "a generated Sapporta project does not include it by default",
  "Add a server-state library only",
]);

for (const [label, source] of [
  ["compact form reference", files.simpleForm],
  ["large form reference", files.largeForm],
]) {
  requireAll(label, source, [
    "useForm",
    "useMutation",
    "useQuery",
    "useQueryClient",
    "tableRecordQueryOptions",
    "tableQueryKeys.table",
    "FormSubmissionError",
    "apiProblemFromBody",
    "fieldIssuesForSubmissionError",
    "firstFormErrorMessage",
    "reloadTGridRows",
  ]);
  forbidAll(label, source, [
    "useEffect",
    "uiClient.getRow",
    "class TaskFormError",
    "editTaskQuery",
    "invalidateAfterTaskCreate",
    "invalidateAfterTaskUpdate",
  ]);
}

requireAll("framework form exports", files.formExports, [
  "FormSubmissionError",
  "fieldIssuesForSubmissionError",
  "firstFormErrorMessage",
]);
requireAll("framework query exports", files.queryExports, [
  "export const tableQueryKeys",
  "export function tableRecordQueryOptions",
  "export function tableRecordsPageQueryOptions",
]);
requireAll("framework table exports", files.frontendTableExports, [
  'export * from "./api/rows"',
  'export * from "./query"',
]);
requireAll("framework table read helpers", files.frontendRows, [
  "export function buildTableSelectionQuery",
  "export function buildTableRowsQuery",
  "export async function fetchTableRows",
  "export async function fetchTableRow",
  "type QueryParamRecord",
  "appendQueryParam",
]);
requireAll("shared lossless query parameters", files.sharedQueryParams, [
  "export type QueryParamValue = string | readonly string[]",
  "export type QueryParamRecord",
  "export function appendQueryParam",
  "export function queryParamRecordToSearchParams",
  "export function isQueryParamRecord",
  "export function hasRepeatedQueryParams",
]);
requireAll("typed client repeated-query transport", files.sharedApiClient, [
  "pathWithLosslessRepeatedQueryParams",
  "queryParamRecordToSearchParams",
  "hasRepeatedQueryParams",
]);
requireAll("framework scoped row surface", files.scopedRows, [
  "findMany(input: FindManyRowsInput)",
  "page(input?: PageRowsInput)",
  "scan(input?: RowsQuery)",
  "lookup(input?: LookupRowsInput<TTable>)",
  "count(input?: CountRowsInput)",
  "countBy(input: CountRowsByInput<TTable>)",
  "ids: readonly RecordId[]",
  "search?: never",
  "ids?: never",
]);
requireAll("raw table scan surface", files.tableRowScan, [
  "export interface TableRowScanInput",
  "export function scanTableRows",
  "There is deliberately no application batch-size input",
]);
requireAll("generated table query resolvers", files.tableQueryResolvers, [
  "export function resolvePageQuery",
  "export function resolveExportQuery",
  "export function resolveLookupQuery",
  "export function resolveCountQuery",
  "Readonly<QueryParamRecord>",
]);
requireAll("public server exports", files.coreExports, [
  "FindManyRowsInput",
  "LookupRowsByIdInput",
  "LookupRowsBySearchInput",
  "PageRowsResult",
  "scanTableRows",
  "resolveCountQuery",
  "resolveExportQuery",
  "resolveLookupQuery",
  "resolvePageQuery",
]);
requireAll("CLI table query commands", files.cliRegistry, [
  'name: ["rows", "list"]',
  'name: ["rows", "count"]',
  'flag: "--where <json>"',
  'flag: "--group-by <column>"',
]);
requireAll("CLI where adapter", files.cliClient, [
  "whereObjectToFilterParams",
  "filter[${column}][${operator}]",
  "filterValueToString",
]);
forbidAll(
  "backend switchboard",
  [files.backendEndpoints, files.backendDomain, files.reportCreate].join("\n"),
  [
    "tableHttpQuery",
    "rows.list(",
    "batchSize",
    "guard.read(",
    "guard.update(",
    "guard.delete(",
  ],
);
requireAll("generated Query provider", files.generatedMain, [
  "QueryClientProvider",
  'import { queryClient } from "./query-client"',
]);
requireAll("generated QueryClient seam", files.generatedQueryClient, [
  "new QueryClient",
  "export const queryClient",
]);
requireAll("scaffold ownership", files.scaffoldManifest, [
  'scaffoldFile("packages/frontend/src/query-client.ts", "workspace")',
]);
requireAll("generated agent guidance", files.generatedAgents, [
  "TanStack Form",
  "TanStack Query",
  "tableRecordQueryOptions",
  "tableRecordsPageQueryOptions",
  "tableQueryKeys",
  "reloadTGridRows",
  "Base UI",
]);

if (shouldTypecheck && failures.length === 0) typecheckCompactReference();

if (failures.length > 0) {
  console.error("Sapporta reference contract check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Sapporta skill references match the framework contract.");
}

function readSkill(path) {
  return readFileSync(resolve(skillRoot, "skills/sapporta", path), "utf8");
}

function readSapporta(path) {
  try {
    return readFileSync(resolve(sapportaRoot, path), "utf8");
  } catch (error) {
    throw new Error(
      `Could not read ${path} from Sapporta source at ${sapportaRoot}`,
      { cause: error },
    );
  }
}

function requireAll(label, source, fragments) {
  for (const fragment of fragments) {
    if (!source.includes(fragment)) {
      failures.push(`${label} is missing ${JSON.stringify(fragment)}`);
    }
  }
}

function forbidAll(label, source, fragments) {
  for (const fragment of fragments) {
    if (source.includes(fragment)) {
      failures.push(`${label} still contains ${JSON.stringify(fragment)}`);
    }
  }
}

function typecheckCompactReference() {
  const tempDir = mkdtempSync(
    join(sapportaRoot, "packages/frontend/src/.skill-reference-"),
  );
  const examplePath = join(tempDir, "SimpleTaskForm.tsx");
  const tscPath = join(sapportaRoot, "node_modules/.bin/tsc");

  try {
    writeFileSync(examplePath, files.simpleForm);
    const result = spawnSync(
      tscPath,
      [
        "--noEmit",
        "--ignoreConfig",
        "--strict",
        "--jsx",
        "react-jsx",
        "--module",
        "ESNext",
        "--target",
        "ES2022",
        "--moduleResolution",
        "Bundler",
        "--skipLibCheck",
        examplePath,
      ],
      { cwd: sapportaRoot, encoding: "utf8" },
    );

    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.status !== 0) {
      failures.push("compact form reference failed strict TypeScript checking");
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}
