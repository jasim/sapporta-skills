---
name: troubleshooting
description: >
  Use when a Sapporta project fails during install, dev-server startup, tests,
  or CLI use because of native module binding errors, better-sqlite3 failures,
  "Could not locate the bindings file", or native addon issues.
---

# Sapporta Troubleshooting

## better-sqlite3 bindings missing

better-sqlite3 is a native Node addon compiled per platform and Node version. A stale or missing `.node` binary produces:

```
Could not locate the bindings file. Tried:
 …/better-sqlite3/build/better_sqlite3.node
 …/better-sqlite3/build/Debug/better_sqlite3.node
```

Typical triggers: Node version change, wiped `packages/api/node_modules`, or stale pnpm store entry.

**Fix:** run `pnpm rebuild better-sqlite3` in the app package that installed
better-sqlite3, usually the generated API package or the project root.

If `pnpm rebuild` doesn't work, find the installed better-sqlite3 package
directory from the error message or with Node package resolution, then rebuild
there:

```bash
npx --yes node-gyp rebuild --release
```

Run that command from the resolved better-sqlite3 package directory. Avoid
hard-coding a pnpm store path; the installed location depends on the package
manager layout and version.

If rebuild fails with missing build tools: `xcode-select --install` (macOS).
