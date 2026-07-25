import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  renderSkillEnvironment,
  rewriteDocumentationUrls,
} from "./render-skill-env.mjs";

const canonicalOrigin = "https://docs.example.com";

test("rewrites documentation URLs using configured origins", () => {
  assert.equal(
    rewriteDocumentationUrls(
      [
        "https://docs.example.com/docs/",
        "https://docs.example.com/grid/",
        "https://docs.example.com/docs/reference/schema/table-definitions/",
        "https://unrelated.example.com/docs/reference/",
      ].join("\n"),
      "http://127.0.0.1:4321",
      canonicalOrigin,
    ),
    [
      "http://127.0.0.1:4321/docs/llms.txt",
      "http://127.0.0.1:4321/grid/llms.txt",
      "http://127.0.0.1:4321/docs/reference/schema/table-definitions.md",
      "https://unrelated.example.com/docs/reference/",
    ].join("\n"),
  );
});

test("rewriting is stable when retrieval and canonical origins match", () => {
  const source = "https://docs.example.com/docs/getting-started/introduction/";
  const first = rewriteDocumentationUrls(
    source,
    canonicalOrigin,
    canonicalOrigin,
  );

  assert.equal(
    first,
    "https://docs.example.com/docs/getting-started/introduction.md",
  );
  assert.equal(
    rewriteDocumentationUrls(first, canonicalOrigin, canonicalOrigin),
    first,
  );
});

test("renders an installable skill directory without modifying its source", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "sapporta-skill-env-"));
  const sourceDir = path.join(root, "source", "sapporta");
  const outputRoot = path.join(root, "rendered");
  await mkdir(path.join(sourceDir, "references"), {
    recursive: true,
  });
  await writeFile(
    path.join(sourceDir, "SKILL.md"),
    "Docs: https://docs.example.com/docs/getting-started/introduction/\n",
  );
  await writeFile(
    path.join(sourceDir, "references", "guide.md"),
    "Grid: https://docs.example.com/grid/reference/base-grid/\n",
  );

  const result = await renderSkillEnvironment({
    sourceDir,
    outputRoot,
    docsOrigin: "http://127.0.0.1:4321",
    docsCanonicalOrigin: canonicalOrigin,
  });

  assert.equal(result.targetDir, path.join(outputRoot, "sapporta"));
  assert.equal(result.markdownFileCount, 2);
  assert.equal(result.replacementCount, 2);
  assert.equal(
    await readFile(path.join(sourceDir, "SKILL.md"), "utf8"),
    "Docs: https://docs.example.com/docs/getting-started/introduction/\n",
  );
  assert.equal(
    await readFile(path.join(result.targetDir, "SKILL.md"), "utf8"),
    "Docs: http://127.0.0.1:4321/docs/getting-started/introduction.md\n",
  );
});

test("rejects output inside the source skill", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "sapporta-skill-env-"));
  const sourceDir = path.join(root, "sapporta");
  await mkdir(sourceDir, { recursive: true });

  await assert.rejects(
    renderSkillEnvironment({
      sourceDir,
      outputRoot: sourceDir,
      docsOrigin: "http://127.0.0.1:4321",
      docsCanonicalOrigin: canonicalOrigin,
    }),
    /must not place generated files inside the source skill/,
  );
});
