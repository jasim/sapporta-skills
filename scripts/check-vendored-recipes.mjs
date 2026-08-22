import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

// Some reference files vendor a canonical code recipe so an agent can copy it
// without a network round-trip. This check keeps each vendored copy honest:
// every fenced code block in the file must still appear verbatim in the
// upstream doc named by its `vendored-from` marker.

const skillRoot = resolve(import.meta.dirname, "..");
const VENDOR_MARKER = /<!--\s*vendored-from:\s*(\S+)\s*-->/;
const CODE_BLOCK = /^```[^\n]*\n([\s\S]*?)^```/gm;

const vendored = [];

for (const file of walk(skillRoot)) {
  if (!file.endsWith(".md")) continue;
  const source = readFileSync(file, "utf8");
  const marker = source.match(VENDOR_MARKER);
  if (!marker) continue;
  vendored.push({
    path: relative(skillRoot, file),
    url: marker[1],
    blocks: [...source.matchAll(CODE_BLOCK)].map((match) => match[1]),
  });
}

const failures = [];

console.log(`Checking ${vendored.length} vendored recipe file(s)...`);

for (const recipe of vendored) {
  if (recipe.blocks.length === 0) {
    failures.push(`${recipe.path} has a vendored-from marker but no code block`);
    continue;
  }

  const upstream = await fetchText(recipe.url);
  if (typeof upstream !== "string") {
    failures.push(`${recipe.path}: could not fetch ${recipe.url} — ${upstream.error}`);
    continue;
  }

  for (const [index, block] of recipe.blocks.entries()) {
    if (!upstream.includes(block)) {
      failures.push(
        `${recipe.path} code block ${index + 1} no longer matches ${recipe.url} — re-sync the vendored copy`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error("Vendored recipe check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  const blocks = vendored.reduce((total, recipe) => total + recipe.blocks.length, 0);
  console.log(`All ${blocks} vendored code block(s) match their upstream docs.`);
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.isFile()) yield path;
  }
}

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    if (response.status !== 200) return { error: `responded ${response.status}` };
    return await response.text();
  } catch (error) {
    return { error: `network error (${error.cause?.code ?? error.name})` };
  }
}
