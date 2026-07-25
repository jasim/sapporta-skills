#!/usr/bin/env node
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEFAULT_SOURCE_DIR = fileURLToPath(
  new URL("../skills/sapporta", import.meta.url),
);

export async function renderSkillEnvironment({
  sourceDir = DEFAULT_SOURCE_DIR,
  outputRoot,
  docsOrigin,
  docsCanonicalOrigin,
}) {
  const normalizedDocsOrigin = readOrigin(docsOrigin, "SAPPORTA_DOCS_ORIGIN");
  const normalizedCanonicalOrigin = readOrigin(
    docsCanonicalOrigin,
    "SAPPORTA_DOCS_CANONICAL_ORIGIN",
  );
  const normalizedSource = path.resolve(sourceDir);
  const normalizedOutputRoot = readAbsolutePath(
    outputRoot,
    "SAPPORTA_SKILL_OUTPUT",
  );
  const targetDir = path.join(normalizedOutputRoot, "sapporta");

  if (
    targetDir === normalizedSource ||
    targetDir.startsWith(`${normalizedSource}${path.sep}`)
  ) {
    throw new Error(
      "SAPPORTA_SKILL_OUTPUT must not place generated files inside the source skill",
    );
  }

  await mkdir(normalizedOutputRoot, { recursive: true });
  await rm(targetDir, { recursive: true, force: true });
  await cp(normalizedSource, targetDir, { recursive: true });

  const markdownFiles = await findMarkdownFiles(targetDir);
  let replacements = 0;
  for (const file of markdownFiles) {
    const source = await readFile(file, "utf8");
    const rendered = rewriteDocumentationUrls(
      source,
      normalizedDocsOrigin,
      normalizedCanonicalOrigin,
    );
    if (rendered === source) continue;
    replacements += countDocumentationUrls(source, normalizedCanonicalOrigin);
    await writeFile(file, rendered);
  }

  for (const file of markdownFiles) {
    const rendered = await readFile(file, "utf8");
    const secondRender = rewriteDocumentationUrls(
      rendered,
      normalizedDocsOrigin,
      normalizedCanonicalOrigin,
    );
    if (secondRender !== rendered) {
      throw new Error(
        `Generated skill contains an unstable documentation URL: ${file}`,
      );
    }
  }

  return {
    targetDir,
    markdownFileCount: markdownFiles.length,
    replacementCount: replacements,
  };
}

export function rewriteDocumentationUrls(
  markdown,
  docsOrigin,
  docsCanonicalOrigin,
) {
  const normalizedDocsOrigin = readOrigin(docsOrigin, "SAPPORTA_DOCS_ORIGIN");
  const normalizedCanonicalOrigin = readOrigin(
    docsCanonicalOrigin,
    "SAPPORTA_DOCS_CANONICAL_ORIGIN",
  );
  const documentationUrl = documentationUrlPattern(normalizedCanonicalOrigin);

  return markdown.replace(documentationUrl, (sourceUrl) => {
    const url = new URL(sourceUrl);
    const pathName = url.pathname;
    if (pathName === "/docs/" || pathName === "/docs") {
      return `${normalizedDocsOrigin}/docs/llms.txt`;
    }
    if (pathName === "/grid/" || pathName === "/grid") {
      return `${normalizedDocsOrigin}/grid/llms.txt`;
    }
    if (
      pathName.endsWith(".md") ||
      pathName.endsWith("/llms.txt") ||
      pathName.endsWith("/llms-full.txt")
    ) {
      return `${normalizedDocsOrigin}${pathName}`;
    }
    return `${normalizedDocsOrigin}${pathName.replace(/\/+$/, "")}.md`;
  });
}

async function findMarkdownFiles(directory) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findMarkdownFiles(file)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(file);
    }
  }
  return files.sort();
}

function documentationUrlPattern(canonicalOrigin) {
  return new RegExp(
    `${escapeRegExp(canonicalOrigin)}/(?:docs|grid)/[A-Za-z0-9_./-]*`,
    "g",
  );
}

function countDocumentationUrls(value, canonicalOrigin) {
  return [...value.matchAll(documentationUrlPattern(canonicalOrigin))].length;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readOrigin(value, name) {
  if (!value) throw new Error(`${name} is required`);

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute HTTP(S) origin`);
  }
  if (
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error(`${name} must be an absolute HTTP(S) origin`);
  }
  return parsed.origin;
}

function readAbsolutePath(value, name) {
  if (!value) throw new Error(`${name} is required`);
  if (!path.isAbsolute(value)) {
    throw new Error(`${name} must be an absolute filesystem path`);
  }
  return path.normalize(value);
}

async function main() {
  const result = await renderSkillEnvironment({
    docsOrigin: process.env.SAPPORTA_DOCS_ORIGIN,
    docsCanonicalOrigin: process.env.SAPPORTA_DOCS_CANONICAL_ORIGIN,
    outputRoot: process.env.SAPPORTA_SKILL_OUTPUT,
  });
  console.log(
    `Rendered ${result.markdownFileCount} skill files with ${result.replacementCount} configured documentation links at ${result.targetDir}`,
  );
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
