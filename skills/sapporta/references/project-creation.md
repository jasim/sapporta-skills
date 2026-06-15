# Project Creation

Create a new Sapporta project from scratch. Use this workflow when the user asks
to create, scaffold, initialize, start a fresh Sapporta app, or build a new app
using Sapporta.

## Trigger Phrases

- "create a new Sapporta project"
- "scaffold a Sapporta app"
- "start a fresh Sapporta app"
- "initialize a Sapporta project from scratch"
- "build a new app using Sapporta"

## Steps

### 1. Determine The Project Name

Convert the user's request into a kebab-case directory name.

- "calorie tracker" -> `calorie-tracker`
- "my invoicing app" -> `my-invoicing-app`

If the name is ambiguous, choose a reasonable kebab-case name. Only ask the user
if overwriting or reusing an existing directory would be risky (i.e. the
directory already exists and contains files).

### 2. Run The Initializer

```bash
pnpm dlx sapporta init <project-name>
```

This invokes the `sapporta` binary from the published `sapporta` package and is
the official Sapporta project initializer for creating a project from a
directory that may not already have Sapporta installed. Do not hand-write
boilerplate, copy templates, or guess at project structure. Always use the
initializer.

Framework authors sometimes create projects against a local Sapporta checkout
instead of the published package. If `SAPPORTA_DEV_MODE_PACKAGE_ROOT` is set
or the user asks to use a `mise.toml` whose `[env]` sets it, read
[project-creation-dev-mode.md](project-creation-dev-mode.md) and use that
local initializer path. This is an uncommon framework-development path; keep
the `pnpm dlx` flow above as the default for ordinary projects.

If Sapporta is already available in the current repo or project, this local form
is also valid:

```bash
pnpm exec sapporta init <project-name>
```

Do not use `pnpm exec sapporta init <project-name>` from an arbitrary parent
directory unless the `sapporta` binary is already locally available. If
`pnpm dlx` is not available or fails, fall back to:

```bash
npx sapporta init <project-name>
```

If neither works, check the error output. The initializer package name or
command may have changed; inspect the local repo or published package metadata
before guessing.

### 3. Enter The Project Directory

```bash
cd <project-name>
```

All subsequent commands run from inside this directory.

### 4. Install Dependencies

Check whether the initializer already installed dependencies by looking for
`node_modules/` or clear initializer output saying dependencies were installed.
A lockfile alone does not prove dependencies are installed.

If dependencies are not installed:

```bash
pnpm install
```

### 5. Start The Dev Server

```bash
pnpm dev
```

This is a long-running watch process. Start it in a persistent shell session and
keep it running while making changes. Do not block on it.

See [Dev Server Workflow](#dev-server-workflow) for details.

### 6. Verify The Project

After the dev server starts:

1. Read the dev server output and identify the local URL, usually
   `http://localhost:5173` or `http://localhost:3000`.
2. Open the URL in the in-app browser when available.
3. Verify:
   - The app loads.
   - There are no compile errors in the dev server output.
   - The generated UI is usable.
   - Backend/API routes are reachable if applicable.
4. Report the local URL to the user.

### 7. Continue Working Inside The Project

After initialization, all future edits, checks, and tests run from the new
project directory, not the parent directory where the agent started.

Do not ask the user to manually run `pnpm install`, `pnpm dev`, or the
initializer. When the user asks to create a new Sapporta project, the agent runs
the setup commands itself, starts the dev server, and continues working inside
the generated project.

## Dev Server Workflow

For generated Sapporta projects, `pnpm dev` is a long-running watch process.
Start it in a persistent shell session and keep it running while making changes.

After edits, allow the watcher a short delay (500ms to 1000ms) before validating
the app. Prefer reading the existing dev server output before starting another
server. If the server is already running, reuse it instead of starting a
duplicate.

When reporting back to the user, include the local URL and mention whether the
dev server is still running.

## After Creating A Project

Verify:

- Project directory exists.
- Dependencies are installed.
- `pnpm dev` starts successfully.
- The dev server prints a usable local URL.
- The app loads in the browser.
- There are no visible compile/runtime errors.
- If the user requested a specific app shape, make the first small schema/UI
  change and verify the watcher rebuilds successfully.

## If Setup Fails

- If `pnpm dlx sapporta init <name>` fails, inspect the error and check the
  currently documented Sapporta initializer command in the local repo, package
  scripts, or published package metadata before guessing.
- If `pnpm install` fails because of network or registry access, request
  permission or escalation if the environment requires it.
- If `pnpm dev` fails because a port is busy, use the next available port if
  supported, or report the occupied port clearly.
- If the generated project has TypeScript or build errors, fix the generated
  project root cause before adding new features.
