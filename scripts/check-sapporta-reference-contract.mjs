import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const skillRoot = resolve(import.meta.dirname, "..");
const sapportaRoot = resolve(
  process.argv.slice(2).find((arg) => !arg.startsWith("--")) ?? "../sapporta",
);
const shouldTypecheck = process.argv.includes("--typecheck");

const files = {
  forms: readSkill("references/app-building/frontend/forms.md"),
  simpleForm: readSkill(
    "references/app-building/frontend/form-template/SimpleTaskForm.tsx.example",
  ),
  largeForm: readSkill(
    "references/app-building/frontend/form-template/TaskForm.tsx",
  ),
  formExports: readSapporta("packages/frontend/src/form/index.ts"),
  queryExports: readSapporta("packages/frontend/src/table/query/index.ts"),
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
