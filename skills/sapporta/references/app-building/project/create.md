# Create A Sapporta Project

Use this reference when the requested Sapporta application does not exist.
After scaffolding, continue with [../guide.md](../guide.md) inside the generated
project.

Public references:

- Create a project: https://sapporta.com/docs/getting-started/create-a-project/
- Tour the generated project: https://sapporta.com/docs/getting-started/tour-the-generated-project/
- Define projects and tasks: https://sapporta.com/docs/getting-started/define-projects-and-tasks/
- Generated project layout: https://sapporta.com/docs/reference/project/generated-project-layout/

## Contents

- [Resolve The Target](#resolve-the-target)
- [Run The Versioned Scaffold](#run-the-versioned-scaffold)
- [Inspect The Generated Project](#inspect-the-generated-project)
- [Build The First Connected Slice](#build-the-first-connected-slice)
- [Link Lists, Details, And Forms](#link-lists-details-and-forms)
- [Validate The Project](#validate-the-project)

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

## Run The Versioned Scaffold

Use the version-pinned command from the public create-project guide. The current
documented command is:

```bash
pnpm dlx sapporta@0.2.6 init <app-name>
```

Run it from the intended parent directory. Do not run a separate `pnpm install`,
auth migration, `git init`, or initial commit after a successful scaffold; the
initializer already owns those steps.

The install may request approval to build `better-sqlite3` and `esbuild`.
Approve both when the user authorized a working local project. If the command
fails, inspect the reported setup step. Retry the complete init command after
fixing the cause because the target is published only after staged setup
succeeds.

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

The generated app starts with authentication tables and a welcome surface. Use
the fresh-app branch in [../tables/create.md](../tables/create.md) for the first
domain tables. Model the actors, resources, relationships, workflows, access,
and expected failures before adapting the starter schema.

## Build The First Connected Slice

The canonical projects/tasks example is the starter for a relationship-backed
application. It demonstrates raw Drizzle tables, wrapped Sapporta definitions,
`workspaceGlobal` scope, semantic columns, server `Temporal` defaults, exported
server row types, a task-to-project foreign key, and project `meta.children`.
Read the complete example through [../tables/create.md](../tables/create.md).

The relationship has two parts:

```text
tasks.project_id -> projects.id       database integrity and lookup source
projects.meta.children -> tasks       generated reverse navigation
```

The task form derives its project picker from the `project_id` foreign key and
the project's `rowLabelColumns`. Use
`foreignKeyFieldModelForColumn(fields, "project_id")` with `LookupPicker`.
Do not load the complete projects table into a local select.

Use the generated list and `NewRecordPage` when one table owns the operation
and metadata-derived order fits. Build a custom domain form when the workflow
needs route-derived defaults, custom sections, a custom success destination,
edit loading, non-column inputs, or one multi-table transaction. Read
[../frontend/forms.md](../frontend/forms.md) before implementing it.

Reusable custom-form references:

- [SimpleTaskForm.tsx.example](../frontend/form-template/SimpleTaskForm.tsx.example)
  shows one-table create and edit with a project lookup.
- [TaskForm.tsx](../frontend/form-template/TaskForm.tsx) shows a larger
  structural create/edit flow with explicit application-owned seams.
- [route-wiring.tsx.example](../frontend/form-template/route-wiring.tsx.example)
  connects the list, form, detail, and navigation routes.

## Link Lists, Details, And Forms

Use app-owned routes for a custom workflow:

```text
/tasks              list or master-detail workspace
/tasks/new          create form
/tasks/:id          full detail
/tasks/:id/edit     edit form
```

Connect the surfaces deliberately:

- The list's New action opens `/tasks/new`.
- Row activation opens `/tasks/:id/edit` when the list already renders the read
  preview. It opens `/tasks/:id` when the list has no preview.
- The detail's Edit action opens `/tasks/:id/edit`.
- Create and edit success open `/tasks/:id` after affected caches are
  invalidated.
- Cancel returns to the prior detail or list without saving.
- A project-context action may open `/tasks/new?project_id=<id>`; parse the
  search value before using it as a form default.
- Only the list or workspace belongs in `appNavigation`. Forms and individual
  records remain contextual routes.

The current generated framework routes provide `/tables/:tableName` and
`/tables/:tableName/new`. They do not provide generated detail or edit routes.
Do not point a custom workflow at `/tables/tasks/:id` or
`/tables/tasks/:id/edit`. Declare app-owned routes until the installed package
exposes those routes.

## Validate The Project

After adding the first domain tables:

```bash
pnpm --filter ./packages/api db:generate --name add_projects_and_tasks
# Review the generated SQL before continuing.
pnpm --filter ./packages/api db:migrate
pnpm --filter ./packages/api db:check
pnpm build
pnpm dev
```

Inspect the running surfaces with:

```bash
pnpm exec sapporta tables show projects
pnpm exec sapporta tables show tasks
pnpm exec sapporta endpoints list
```

Exercise signup and verification when the application has no local account.
Verify project lookup labels, contextual defaults, create and edit success
destinations, list refresh, master-detail activation, row scope, empty states,
and form failures.
