---
name: troubleshooting
description: >
  Troubleshoot common Sapporta development errors. Use this skill whenever you encounter native module binding errors, better-sqlite3 failures, or "Could not locate the bindings file" messages during development, testing, or server startup. Also use it when `pnpm install` or `pnpm dev` fails with native addon errors.
---

# Sapporta Troubleshooting

## better-sqlite3 bindings missing

better-sqlite3 is a native Node addon compiled per platform and Node version. A stale or missing `.node` binary produces:

```
Could not locate the bindings file. Tried:
 …/better-sqlite3/build/better_sqlite3.node
 …/better-sqlite3/build/Debug/better_sqlite3.node
```

Typical triggers: Node version change, wiped `node_modules`, or stale pnpm store entry.

**Fix:** `pnpm rebuild better-sqlite3` from the project root.

If `pnpm rebuild` doesn't work, build directly inside the package:

```bash
cd node_modules/.pnpm/better-sqlite3@<version>/node_modules/better-sqlite3 && npx --yes node-gyp rebuild --release
```

Replace `<version>` with the version from the error message (e.g. `12.8.0`).

If rebuild fails with missing build tools: `xcode-select --install` (macOS).
