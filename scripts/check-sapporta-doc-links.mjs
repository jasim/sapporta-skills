import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

// Verifies every sapporta.com link in the repository is agent-friendly and
// live: doc links must use the markdown form (trailing `.md`, not a
// slash-terminated HTML route), and each unique URL must respond 200.

const skillRoot = resolve(import.meta.dirname, "..");
const CONCURRENCY = 8;
const URL_PATTERN = /https?:\/\/sapporta\.com(\/[^\s)"'`<>\]#?]+)?/g;

const linkSites = new Map(); // url -> [relative file paths]

for (const file of walk(skillRoot)) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(URL_PATTERN)) {
    const url = match[0];
    // `https://sapporta.com/docs/[path].md` and friends are instructional
    // placeholders showing the URL shape, not links to fetch.
    if (url.includes("[")) continue;
    if (!linkSites.has(url)) linkSites.set(url, []);
    linkSites.get(url).push(relative(skillRoot, file));
  }
}

const failures = [];

for (const [url, files] of linkSites) {
  const path = new URL(url).pathname;
  if (path !== "/" && path !== "" && !path.endsWith(".md")) {
    failures.push(
      `${url} is not a markdown link (append .md) — referenced in ${files.join(", ")}`,
    );
  }
}

const urls = [...linkSites.keys()];
console.log(`Checking ${urls.length} unique sapporta.com links...`);
await inBatches(urls, CONCURRENCY, async (url) => {
  const status = await fetchStatus(url);
  if (status !== 200) {
    failures.push(
      `${url} responded ${status} — referenced in ${linkSites.get(url).join(", ")}`,
    );
  }
});

if (failures.length > 0) {
  console.error("Sapporta documentation link check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`All ${urls.length} sapporta.com links are markdown-form and live.`);
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.isFile()) yield path;
  }
}

async function fetchStatus(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    return response.status;
  } catch (error) {
    return `network error (${error.cause?.code ?? error.name})`;
  }
}

async function inBatches(items, size, task) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (queue.length > 0) await task(queue.shift());
    }),
  );
}
