import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const skillRoot = resolve(import.meta.dirname, "..");
const sapportaRoot = resolve(process.argv[2] ?? "../sapporta");
const example = readFileSync(
  resolve(
    skillRoot,
    "skills/sapporta/references/app-building/frontend/form-template/SimpleTaskForm.tsx.example",
  ),
  "utf8",
);
const tscPath = join(sapportaRoot, "node_modules/.bin/tsc");

if (!existsSync(tscPath)) {
  throw new Error(
    `Could not find TypeScript at ${tscPath}. Install the Sapporta framework dependencies first.`,
  );
}

const tempDir = mkdtempSync(
  join(sapportaRoot, "packages/frontend/src/.skill-reference-"),
);
const examplePath = join(tempDir, "SimpleTaskForm.tsx");

try {
  writeFileSync(examplePath, example);
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
    process.exitCode = result.status ?? 1;
  } else {
    console.log("Compact form reference passes strict TypeScript checking.");
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
