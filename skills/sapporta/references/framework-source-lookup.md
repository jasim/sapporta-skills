# Read A Framework Symbol's Signature Or Behavior

Goal: learn what a `@sapporta/*` symbol is, where to import it from, and — only
when a signature cannot settle it — how it behaves.

## Start With The API Reference

Fetch the index and follow it. It carries every published symbol's exact
declaration, generated from the shipped declaration files:

```bash
curl -sL https://sapporta.com/api-reference/index.md
```

When you know a symbol's name but not its import path, fetch the symbol index
and search it:

```bash
curl -sL https://sapporta.com/api-reference/symbols.md
```

Import from the narrowest specifier the symbol index lists. A root barrel
re-exports its own subpaths, so `Badge` resolves from both `@sapporta/ui/badge`
and `@sapporta/ui`; use the narrower one.

Confirm the installed version matches the version the page states before relying
on a signature:

```bash
node -p "require('@sapporta/server/package.json').version"
```

If they differ, trust the installed package and fall back to the declaration
lookup below.

## Read Declarations Only For What A Signature Cannot Express

Drop to declarations when you need runtime behavior, defaults, or control flow —
not to discover that a symbol exists. Resolve from the workspace package that
declares the dependency:

```bash
PKG=$(dirname "$(node -p "require.resolve('@sapporta/server/package.json', { paths: ['packages/api'] })")")
rg -n "<symbol>" "$PKG/dist" --glob '*.d.ts'
```

| Package                                                | Resolve from        |
| ------------------------------------------------------ | ------------------- |
| `@sapporta/server`, `@sapporta/honest`                 | `packages/api`      |
| `@sapporta/frontend`, `@sapporta/ui`, `@sapporta/grid`  | `packages/frontend` |
| `@sapporta/shared`, `@sapporta/rest-core`              | either              |

## Rules

- Keep `--glob '*.d.ts'`. `dist/` also holds source maps with the whole source
  inlined.
- On `ERR_PACKAGE_PATH_NOT_EXPORTED`, resolve the bare name and cut at `dist/`.
- Never hand-write or glob a `node_modules` path. A generated project has no
  root `node_modules/@sapporta`, and `.pnpm/` directory names embed a
  peer-version hash that changes on reinstall.
- A file path is not an import specifier. `@sapporta/ui/badge` is published from
  `dist/ui/primitives/badge.d.ts`; importing the file path fails. Take
  specifiers from the API reference or the package's `exports` map, never from
  where a declaration happens to live.

Package layout and dependency ownership:
https://sapporta.com/docs/reference/project/project-files.md
