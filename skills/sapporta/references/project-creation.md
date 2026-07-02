# Project Creation

Use this workflow when the user asks to create, scaffold, initialize, start a
fresh Sapporta app, or build a new app using Sapporta.

Docs:

- Getting started: https://sapporta.com/docs/getting-started/
- CLI reference: https://sapporta.com/docs/reference/full/cli/

## Agent Workflow

1. Choose a kebab-case project directory name from the user's request. Ask only
   if an existing non-empty directory would be overwritten or reused.
2. Run the documented initializer. For ordinary projects, use the published
   package flow from the docs rather than hand-writing boilerplate.
3. If `SAPPORTA_DEV_MODE_PACKAGE_ROOT` is set or the user asks to use a
   `mise.toml` whose env sets it, read
   [project-creation-dev-mode.md](project-creation-dev-mode.md) and use the
   local framework-development path.
4. Enter the generated project directory. All subsequent commands run there.
5. Install dependencies if the initializer did not already install them.
6. Start `pnpm dev` in a persistent session. Reuse an existing server if one is
   already running.
7. Read the server output, identify the local URL, and verify the app in the
   browser when available.
8. If the user requested a specific app shape, make the first small schema/UI
   change and verify the watcher rebuilds.

Do not ask the user to run the initializer, dependency install, or dev server
manually. The agent runs setup commands, starts the dev server, and continues
inside the generated project.

## Validation

Confirm:

- project directory exists
- dependencies are installed
- `pnpm dev` starts successfully
- the dev server prints a usable local URL
- the app loads in the browser
- no visible compile/runtime errors appear
- backend/API routes are reachable if applicable

When reporting back, include the local URL and whether the dev server is still
running.

## Failure Handling

- If initialization fails, inspect the error and check the documented Sapporta
  initializer command before guessing.
- If install fails because of network or registry access, request the required
  permission/escalation.
- If a port is busy, use the next available port when supported or report the
  occupied port clearly.
- If generated code has TypeScript or build errors, fix the generated-project
  root cause before adding features.
