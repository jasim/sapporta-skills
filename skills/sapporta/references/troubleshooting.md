# Sapporta Troubleshooting

Use public troubleshooting docs for known fixes:

- Troubleshooting guide: https://sapporta.com/docs/tools-and-operations/troubleshooting/
- Troubleshooting reference: https://sapporta.com/docs/reference/troubleshooting/

## Native SQLite Binding Triage

Trigger: startup, tests, or CLI fail with missing native addon output such as
`Could not locate the bindings file` for `better-sqlite3`.

Concise recovery direction:

1. Rebuild `better-sqlite3` in the app package that installed it, usually the
   generated API package or project root.
2. If rebuild fails with missing macOS build tools, install the command line
   tools.
3. Avoid hard-coding pnpm store paths; installed locations vary by package
   manager layout and version.
4. If the docs do not cover the observed failure, inspect the actual error
   output before changing Node, package manager, or dependency versions.

Typical causes include a Node version change, wiped package `node_modules`, or
a stale package-manager store entry.
