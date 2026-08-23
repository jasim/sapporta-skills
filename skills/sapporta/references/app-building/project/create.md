# Create A Sapporta Project

Use this reference when the requested Sapporta application does not exist.
After scaffolding, continue with [../guide.md](../guide.md) inside the generated
project.

Public references:

- Create a project: https://sapporta.com/docs/getting-started/create-a-project.md
- Tour the generated project: https://sapporta.com/docs/getting-started/tour-the-generated-project.md
- Tables, columns, and schema metadata: https://sapporta.com/docs/guides/model-data/tables-columns-and-schema-metadata.md
- Generated project layout: https://sapporta.com/docs/reference/project/generated-project-layout.md

## Contents

- [Resolve The Target](#resolve-the-target)
- [Confirm pnpm 11 Or Later](#confirm-pnpm-11-or-later)
- [Run The Documented Scaffold Command](#run-the-documented-scaffold-command)
- [Inspect The Generated Project](#inspect-the-generated-project)
- [Continue Through The Common Workflow](#continue-through-the-common-workflow)

## Resolve The Target

Resolve an explicit parent directory and project name. The parent must exist and
the target path must not exist. Do not pre-create the target directory; the
Sapporta initializer rejects an existing path.

If the current directory or an ancestor already contains `sapporta.json`, treat
it as an existing application unless the user explicitly requested a separate
project. Do not scaffold a nested application as an implementation shortcut.

The initializer performs consequential setup in one operation. It creates a
pnpm workspace, resolves and installs dependencies, verifies native SQLite
bindings, generates and applies the initial auth migration, initializes Git,
and creates the initial commit. Run it only when the user requested project
creation, and use the environment's network and filesystem approval mechanism.

## Confirm pnpm 11 Or Later

Run `pnpm --version` before scaffolding. On anything older than 11, tell the
user to upgrade with `corepack use pnpm@11` and stop; do not work around the
check. `sapporta init` refuses to run otherwise:
https://sapporta.com/docs/getting-started/create-a-project.md

## Run The Documented Scaffold Command

Run the init command from the create-project guide
(https://sapporta.com/docs/getting-started/create-a-project.md), which always
carries the current Sapporta version.

Run it from the intended parent directory. Do not run a separate `pnpm install`,
auth migration, `git init`, or initial commit after a successful scaffold; the
initializer already owns those steps.

The install may request approval to build `better-sqlite3` and `esbuild`.
Approve both when the user authorized a working local project. If the command
fails, inspect the reported setup step. Retry the complete init command after
fixing the cause because the target is published only after staged setup
succeeds.

## Read The Project's Ports

Every project gets its own development ports, so no port number is shared
between projects. Take them from the table `sapporta init` prints when it
finishes, from the same table `pnpm dev` prints when it starts, or from
`SAPPORTA_API_PORT` and `SAPPORTA_FRONTEND_PORT` in `.env.development`. Give the
user the App URL to open, and use the API URL for direct HTTP calls.

## Inspect The Generated Project

Change into the generated root and read these files before editing:

```text
README.md
AGENTS.md
CODING-PRINCIPLES.md
VISUAL-DESIGN-GUIDELINES.md
sapporta.json
```

Inspect the extension points:

```text
packages/api/schema/          Drizzle tables and Sapporta metadata
packages/api/migrations/      Reviewed generated SQL
packages/api/app.ts           Mounted app-owned Hono routes
packages/api/authz/           Abilities and request authority
packages/shared/src/          Browser-safe contracts and wire types
packages/frontend/src/App.tsx App navigation and routes
```

The generated app starts with authentication tables and a placeholder home page
at `/`. Use the fresh-app branch in [../tables/create.md](../tables/create.md)
for the first domain tables after completing the common product workflow. Treat
the generated table list and home page as scaffolding. Before accepting the first connected
product page, read [../workflow-shell.md](../workflow-shell.md).

## Continue Through The Common Workflow

Project creation ends after the generated workspace and its extension points
are available and inspected. Continue with [../guide.md](../guide.md), then read
[../product-slice.md](../product-slice.md) and use its full new-application
design pass before choosing the first implementation branch.

Use [../tables/create.md](../tables/create.md) for the first domain tables.
Follow the guide's conditional routes for endpoints, reports, forms, views, and
Grids. Those references own the implementation and validation loops for the
accepted first slice.
