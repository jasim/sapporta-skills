# Application-Building Workflow

Use this mode when the user wants to build or change how a Sapporta app behaves.
Read the narrow reference for the specific thing being changed.

## Terms

- **Actor:** a person, role, or external system that uses or affects the app.
- **Outcome:** a result an actor wants, such as assigning work, completing an
  order, or finding overdue accounts.
- **Domain resource:** a durable business object with identity and a lifecycle.
  A resource may have stored data, relationships, views, and actions.
- **Primary resource:** a resource from which users regularly begin work. It
  normally needs list, detail, navigation, and change surfaces.
- **Supporting resource:** a resource used within another resource or workflow.
  Keep it contextual unless users need to work with it independently.
- **Event:** a durable record of something that happened. Events are normally
  inspected rather than edited.
- **Workflow:** a user goal expressed as a named action, such as `Create task`,
  `Assign order`, or `Approve invoice`. It may read or change several resources.
- **Invariant:** a rule that must remain true throughout a workflow, including
  validation, authorization, ownership, and transaction rules.
- **Surface:** a coherent UI context such as a page, Grid, detail panel, form,
  dialog, drawer, or composite workspace. A surface is smaller and more general
  than a screen or route.
- **Vertical slice:** one complete outcome implemented across data, backend
  behavior, UI, access control, failure handling, and tests.

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

## Model The Application First

Start with actors and outcomes, not Sapporta primitives. Infer the product model
required by those outcomes:

- actors, outcomes, and operational questions;
- MVP scope and consequential assumptions;
- primary resources, supporting resources, events, and implementation details;
- attributes, relationships, ownership, state, and lifecycle; and
- workflows: entry context, required information, named action, invariants,
  authorization, success, expected failures, and next destination.

Present the inferred model and consequential assumptions before committing to
an implementation shape. Ask only about unresolved decisions that materially
affect scope, authorization, lifecycle, or data integrity. For a small change
whose model is already established, state any consequential assumption briefly
and keep the design pass proportional to the request.

Inspect the existing application before finalizing this model. Reuse its domain
language, schema, contracts, routes, and access model. Avoid speculative
abstractions.

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

## Use The Default Application Grammar

Design surfaces around workflows. Give each primary resource a useful list,
detail view, and named change actions when its lifecycle permits them. Combine
these elements when a workflow needs shared context: it may use one form,
several connected pages, or a composite workspace containing a Grid,
active-record detail, related rows, and contextual actions. Keep supporting
resources inside the workflow unless users regularly begin work with them.

Build an interconnected resource-and-workflow application:

- **List:** use a Sapporta Grid for substantial tabular collections, including
  primary or supporting resource lists and related records. Use row-list
  interaction when keyboard navigation should move between whole rows. Wire an
  active-row reaction when sequential browsing benefits from immediate related
  context. The React view owns that context and its layout. Use a read-only cell-grid preset
  when title cells or other cell surfaces activate navigation.
  Preserve filtering, search, sorting, pagination, lookup labels, URL state,
  and record navigation. Use a simpler surface for compact, sparse, or
  card-shaped information.
- **Detail:** combine identity, state, ownership, relationships, history, and
  available actions. Show tabular related records in foreign-key-constrained
  Grids and link them to their own details.
- **Mutation:** expose deliberate, named actions such as `Create task`, `Assign`,
  or `Complete`. Default to a form: a page for substantial work, a dialog or
  drawer for short contextual work, and quick-add only for frequent, low-risk,
  few-field creation. Keep browsing read-only until an action begins. Treat
  events as history by default; record corrections through an explicit workflow
  instead of ordinary editing when the domain requires an audit trail.
- **Navigation:** promote places where users begin work, then connect resources
  through relationships and contextual actions. Do not create a top-level item
  for every table.
- **Reports:** define the operational question and inclusion rule first. Use a
  report Grid for tabular record inspection or a summary for comparison, with
  drill-down to the underlying resources.

A Grid is an application primitive, not a synonym for **Manage Data**. Treat
Manage Data as the administrative surface for direct table inspection, import
correction, append-a-row, and cell editing. Enable cell-grid interaction in an
application only for deliberate cell focus, activation, or inline editing.
Authorize Manage Data separately when its direct access is more powerful than
normal workflows.

Choose Sapporta primitives from the interaction requirements. Use a Grid when
users need to compare, filter, search, navigate, select, or edit substantial
tabular data. Use active-row context for master-detail browsing and independent
row selection for bulk or multi-record operations. Use a form for deliberate
record changes.

For each master-detail surface, decide the detail value and the activation
destination separately. The detail value may be an information panel or a
foreign-key-constrained Grid. Row movement updates that value. Row activation
may open an edit or named action route, or move keyboard focus into a related
Grid. Read [frontend/grids.md](frontend/grids.md) for this decision and the
active-row APIs.

Before choosing an editable Grid or temporary in-memory table for a staged
batch, define which rows are committed together, validation timing, cancellation
and discard behavior, stale-data or conflict handling, authorization, and
whether failure rolls back the whole batch or permits explicit partial success.

Translate the product model in this order:

```text
intent -> scope -> domain model -> resources -> workflows and invariants
       -> lists, details, navigation, and reports -> mutation UX -> access
       -> Sapporta tables, operations, endpoints, reports, and views
```

Map the accepted design to Sapporta tables and metadata, built-in operations,
custom Hono endpoints, reports, React views, and row security. Implement the
smallest coherent vertical slice. Each slice should deliver one usable outcome
across model, validation, operation, interface, access, and tests.
Review the result through a user's path, including relationships, deliberate
mutation, empty and failure states, authorization, and the next useful action.
Refine the product model when later slices reveal additional requirements.

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
