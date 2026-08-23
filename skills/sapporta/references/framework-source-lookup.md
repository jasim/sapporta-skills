# Read A Framework Symbol's Real Signature

Use this when the docs do not settle an exact signature and you need the
installed declarations.

## Resolve The Package, Then Grep It

Resolve from the workspace package that declares the dependency:

```bash
PKG=$(dirname "$(node -p "require.resolve('@sapporta/server/package.json', { paths: ['packages/api'] })")")
rg -n "<symbol>" "$PKG/dist" --glob '*.d.ts'
```

| Package                                             | Resolve from        |
| --------------------------------------------------- | ------------------- |
| `@sapporta/server`, `@sapporta/honest`              | `packages/api`      |
| `@sapporta/frontend`, `@sapporta/ui`, `@sapporta/grid` | `packages/frontend` |
| `@sapporta/shared`, `@sapporta/rest-core`           | either              |

## Rules

- Keep `--glob '*.d.ts'`. `dist/` also holds source maps with the whole source
  inlined.
- Grep first, read the `exports` map afterwards. The map gives import
  specifiers, not declaration sites.
- On `ERR_PACKAGE_PATH_NOT_EXPORTED`, resolve the bare name and cut at `dist/`.
- Never hand-write or glob a `node_modules` path. A generated project has no
  root `node_modules/@sapporta`, and `.pnpm/` directory names embed a
  peer-version hash that changes on reinstall.

Package layout and dependency ownership:
https://sapporta.com/docs/reference/project/generated-project-layout.md
