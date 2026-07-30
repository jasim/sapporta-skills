# Application-Building Workflow

Use this mode when the user wants to build or change how a Sapporta app behaves.
Establish the project context, complete the common
[product-model and coherent-slice workflow](product-slice.md), then read the
narrow reference for the specific thing being changed.

## Choose The Execution Model

Run a focused vertical slice in one execution context.

Use staged orchestration for a program of work: multiple workstreams, material
discovery, cross-cutting dependencies, or delivery risk that one context cannot
reliably preserve the product brief, decision log, and acceptance evidence. A
cross-stack slice remains one workstream when its outcome and ownership are
coherent.

The root owns scope, product decisions, dependency sequencing, shared contracts,
integration, and release acceptance. Delegate bounded work packages with
explicit inputs, ownership, dependencies, and exit criteria. Use the lightest
delivery model and rebaseline when discovery changes scope. Infer the model from
the request and repository; do not ask the user to choose the process.

## Inspect The Existing Application

When the requested application does not exist yet, start with
[project/create.md](project/create.md). Run its scaffold workflow before using
the existing-project inspection steps below.

Inspect the existing app before mapping the model to implementation:

```bash
rg --files packages/api/schema
```

Also inspect relevant contracts, routes, migrations, frontend navigation, and
access helpers. When the app server is already running, inspect mounted surfaces
with `pnpm exec sapporta tables list` and
`pnpm exec sapporta endpoints list`.

To discover how to define application tables, continue with
[tables/create.md](tables/create.md). It points to local conventions and the
canonical starter pattern.

If `packages/api/schema/` has no domain tables and its definitions only support
project authentication, take the fresh-app branch in
[tables/create.md](tables/create.md) before inspecting framework internals or
test fixtures. That reference owns the starter-schema workflow.

Prefer the project's existing style. Do not create custom code for behavior
already covered by built-in table APIs or an existing domain endpoint unless the
product workflow actually needs custom behavior.

## Complete The Common Product Slice

After inspecting the project, read [product-slice.md](product-slice.md). Use
its full new-application pass or proportional model-delta/interaction pass
before choosing tables, endpoints, reports, forms, or Grid implementation.

The common workflow owns application grammar, coherent slice boundaries, and
user-outcome acceptance. The narrow references below own Sapporta-specific
implementation details.

## Where To Work

- Tables -> `packages/api/schema/`
- Reports -> shared contract, backend route, frontend screen, navigation, tests
- Backend workflows/endpoints -> `packages/shared/src/contracts/` plus
  `packages/api/app/`
- Larger backend workflows -> `packages/api/modules/<domain>/`
- Custom pages, forms, table/grid workflows -> `packages/frontend/src/`

Docs:

- Develop with a coding agent: https://sapporta.com/docs/guides/discovery/develop-with-a-coding-agent/
- Generated project layout: https://sapporta.com/docs/reference/project/generated-project-layout/
- Tables, columns, and schema metadata: https://sapporta.com/docs/guides/model-data/tables-columns-and-schema-metadata/
- Custom endpoints: https://sapporta.com/docs/guides/app-owned-features/custom-api-endpoints/
- Route-based reports: https://sapporta.com/docs/guides/reports/route-based-reports/
- Frontend screens: https://sapporta.com/docs/guides/app-owned-features/custom-frontend-routes-and-screens/

## Built-In APIs Or Custom Code

Use built-in table APIs for ordinary list, get, create, update, delete, lookup,
count, and export behavior. Build custom app code for reports, multi-table
workflows, custom validation, file uploads, custom response shapes, and business
transactions.

Custom endpoints should use shared ts-rest contracts. The same contract drives
request validation, typed handler inputs, OpenAPI emission,
`sapporta endpoints show`, and typed frontend clients.

For larger features, keep route files thin. Put workflow orchestration in
services and database reads/writes in module `db/` stores under
`packages/api/modules/<domain>/`.

## Auth And Row Scope

Resolve auth at the route edge with the narrowest ability/data-authority helper
for the workflow. Then use `scopedRows()` or `auth.rowSecurity.forTable(table)`.

Do not manually stamp or filter `workspace_id`, `workspaceId`,
`scoped_to_user_id`, or `scopedToUserId`. Do not mutate scoped rows by primary
key alone, insert `request.body` directly into scoped tables, or fetch broadly
and filter row ownership in JavaScript.

Docs:

- Authentication and abilities: https://sapporta.com/docs/guides/security/authentication-and-abilities/
- Auth and row security: https://sapporta.com/docs/reference/server/auth-and-row-security/

## Validation

Use the smallest loop that proves the change:

```bash
pnpm --filter ./packages/api db:generate --name <change_name>
# Review the generated SQL before continuing.
pnpm --filter ./packages/api db:migrate
pnpm --filter ./packages/api db:check
pnpm dev
pnpm exec sapporta endpoints show "METHOD /api/path"
```

For frontend changes, run the project's frontend checks or tests when available.
For native module failures, binding errors, or dev-server startup failures, read
troubleshooting before trying broad dependency changes.

## Read The Narrow Reference

- New Sapporta project, generated workspace, or first connected application
  surface -> read [project/create.md](project/create.md)
- Main sidebar, protected home page, Advanced/Admin page, framework navigation,
  or placement of a feature that changes the normal user path -> read
  [workflow-shell.md](workflow-shell.md)
- Tables, columns, relations, indexes, search config, schema migration, custom
  table validation, semantic values -> read [tables/create.md](tables/create.md)
- Route-based reports, summaries, ledgers, route/result validation -> read
  [reports/create.md](reports/create.md)
- Cell links, drill-through, cross-report navigation -> read
  [reports/linking.md](reports/linking.md)
- Domain endpoints, `TsRestApi`, shared contracts, handlers, uploads,
  transactions, OpenAPI registration -> read [backend/endpoints.md](backend/endpoints.md)
- Custom create or edit forms, domain mutation pages, form dialogs or drawers,
  and record-entry workflows -> read [frontend/forms.md](frontend/forms.md)
  first, then follow its conditional picker or Grid routes
- Custom React routes, dashboards, table/grid views, master-detail screens,
  side panels, row selection, custom cells, typed API clients -> read
  [frontend/views.md](frontend/views.md), then [frontend/grids.md](frontend/grids.md)
- Domain services, module organization, testable TypeScript workflow code ->
  read [backend/domain-code.md](backend/domain-code.md)
- Expected non-2xx failures raised below a route adapter -> read
  [backend/typed-errors.md](backend/typed-errors.md) before implementing the handler
- Native module or `better-sqlite3` failures -> read
  [../operations/troubleshooting.md](../operations/troubleshooting.md)
