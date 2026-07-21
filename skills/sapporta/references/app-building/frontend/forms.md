# Domain Forms

Use TanStack Form for client form state. Use Sapporta's current public form,
lookup, generated-table, Grid reload, and error surfaces instead of rebuilding
those mechanics in application code. TanStack Query is an application choice;
the current generated project does not install it or mount a QueryClient by
default.

Public references:

- Generated record screens and forms: https://sapporta.com/docs/guides/generated-surfaces/record-screens-and-forms/
- Relationships and lookup behavior: https://sapporta.com/docs/guides/model-data/relationships-and-lookup-behavior/
- Table and column metadata: https://sapporta.com/docs/reference/schema/table-and-column-metadata/
- Semantic value boundaries: https://sapporta.com/docs/reference/schema/semantic-value-boundaries/

## Contents

- [Keep The Ownership Boundary](#keep-the-ownership-boundary)
- [Choose The Form Layer](#choose-the-form-layer)
- [Read The Structural Reference](#read-the-structural-reference)
- [Preserve The End-To-End Shape](#preserve-the-end-to-end-shape)
- [Compose Fields At Three Levels](#compose-fields-at-three-levels)
- [Load And Initialize Edit Forms](#load-and-initialize-edit-forms)
- [Choose The Mutation Boundary](#choose-the-mutation-boundary)
- [Handle Errors And Cache Effects](#handle-errors-and-cache-effects)
- [Link The Form To Application Routes](#link-the-form-to-application-routes)
- [Preserve Domain Types](#preserve-domain-types)
- [Continue To Specialized Guidance](#continue-to-specialized-guidance)
- [Validate The Workflow](#validate-the-workflow)

## Keep The Ownership Boundary

Keep these responsibilities separate:

- **Framework:** reusable form-field and request-error mechanics, table metadata,
  lookup behavior, generated table clients, table-query mechanics, create-draft
  parsing, and server-side row security. Use the public surface installed in the
  application. Do not copy a project-local error parser, query namespace, or
  table client into a new feature.
- **Generated project:** React boot and routing, the generated-table client,
  Grid session registry, and extension wiring in
  `packages/frontend/src/api.ts`. Extend those existing seams. Do not create a
  parallel API-client entrypoint for one form.
- **Application:** domain row and write types, browser-safe schemas, routes,
  route-parameter parsing, query and mutation composition, workflow requests,
  cache effects, navigation, formatting, content, and layout.
- **This skill:** structural guidance and reusable references. It owns no
  application module and contributes no runtime helper.

Do not predict framework exports from work in another branch or release. Check
the application's installed declarations and current public docs before using
an exact query, cache-key, or error API. Prefer a current public API over a new
application wrapper. Add a feature-local adapter only when it expresses a
domain decision or establishes a missing guarantee.

## Choose The Form Layer

Use the generated table route or `NewRecordPage` when one table owns the create
operation and the metadata-derived field order fits the workflow.

Compose a domain form when the workflow needs sections, route-derived defaults,
a different success destination, non-column inputs, a custom atomic endpoint,
or related-record editing. A domain form remains ordinary React code. It uses
TanStack Form with the framework and project seams above. Add a server-state
library only when the application needs and owns that caching model.

## Read The Structural Reference

For an ordinary one-table custom create or edit form, read
[form-template/SimpleTaskForm.tsx.example](form-template/SimpleTaskForm.tsx.example).
It shows current public metadata, lookup, generated-table, cancellation, form,
mutation, cache, and navigation APIs in one compact flow. Adapt its browser wire
schema, fields, routes, and cache scope to the application.

For a larger or multi-table workflow, also read
[form-template/TaskForm.tsx](form-template/TaskForm.tsx).

That file is deliberately rough structural guidance. It is not a copy-ready UI,
a todo-domain scaffold, or a list of framework exports. Its non-framework
module specifiers are visibly marked as application-owned placeholders and do
not resolve. Replace every task name, domain type, schema, route, query,
mutation, cache effect, error mapping, navigation decision, and layout with the
current application's implementation.

The larger reference assumes the application has deliberately installed and
mounted TanStack Query. Do not copy that dependency or provider into a
generated project for one form. Its query and cache calls illustrate ownership
boundaries for applications that already use that library.

The larger reference intentionally leaves its application-owned imports
unresolved. Find and reuse the corresponding framework, generated-project, and
application seams. Read the generated application's `CODING-PRINCIPLES.md` when
present.

Read
[form-template/route-wiring.tsx.example](form-template/route-wiring.tsx.example)
when the form needs app-owned list, detail, create, and edit routes.

Useful inspection commands:

```bash
rg -n "QueryClient|QueryClientProvider" packages/frontend/src
rg -n "createApiClient|getApiBase" packages/frontend/src/api.ts packages/frontend/src
rg -n "FormField|buildRecordFormFields|parseCreateDraft|LookupPicker" packages/frontend/src node_modules/@sapporta
```

## Preserve The End-To-End Shape

Keep the event path traceable:

```text
route or user input -> parsed form values -> workflow request -> I/O
                    -> typed result -> cache effects -> destination
```

Adapt these structural decisions when they fit the workflow:

- Dispatch create and edit modes before mounting mode-specific hooks. Invalid
  edit parameters never mount record queries, and create mode never runs edit
  queries.
- Keep create and edit loaders and mutations separate. Share the editor only
  after each mode can supply complete typed defaults and its own submit
  function.
- Use a discriminated union when create and edit values differ. Avoid
  correlated optional properties, placeholder edit values, and casts between
  modes.
- Load every dependency needed for edit defaults before mounting the editor.
  Key the editor to the record so a later refetch does not replace dirty input.
- Derive Sapporta field models once from schema and lookup stores. Let TanStack
  Form own values and validation.
- Transform and validate application values at the submit boundary. Use
  `parseCreateDraft` and the generated table API for ordinary one-table create
  operations. Use one typed application endpoint for a multi-table transaction.
- Let the selected server-state mechanism own request lifecycle and cache
  state. Let application code decide which Grid sessions or cache scopes to
  refresh and where success goes.

The number and arrangement of fields, queries, endpoints, sections, and
controls are application decisions. Do not preserve the reference's task UI.

## Compose Fields At Three Levels

Use the current public Sapporta form surface. The installed version may expose
primitives such as `NewRecordPage`, `FormField`, `buildRecordFormFields`,
`fieldModelForColumn`, `foreignKeyFieldModelForColumn`, `parseCreateDraft`,
`createTableRow`, and `updateTableRow`. Confirm exact declarations locally.

A domain form can mix three composition levels:

1. Use `FormField` when its metadata-derived control fits the interaction.
2. Use Sapporta field metadata with `@sapporta/ui` controls when the application
   needs different composition, labeling, validation timing, or layout.
3. Use an ordinary `form.Field` for workflow values that are not one table
   column or require a domain-specific control.

For a standard foreign key, use the framework lookup derived from the field
model or the current public table-lookup surface. Do not load a whole related
table into a local select. Use [pickers.md](pickers.md) for interactions beyond
the standard remote-search lookup.

Generated form metadata omits or constrains fields according to the installed
framework's table and column metadata. The server remains authoritative for
write policy, authorization, and scope.

## Load And Initialize Edit Forms

Use the installed framework's public generated-table client for record loading.
Pass an `AbortSignal` through `uiClient` fetch options, and apply filtering,
sorting, and pagination on the server. An application that already uses
TanStack Query can call the same public client inside its query functions.

The application chooses which record and related data the edit workflow needs.
Its query composition must reuse framework-owned clients. It must not introduce
another generic table HTTP client. Project-owned query keys should describe the
feature data they cache instead of copying a framework-internal key layout.

Load all data needed for defaults before initializing the form. Key the editor
to the loaded record, or use the current supported form identity mechanism.
Do not reset from background query data automatically. Reset only for an
explicit discard or a post-mutation workflow that calls for it.

## Choose The Mutation Boundary

Use the generated table API for an ordinary one-table operation. For creates,
decode application form values with `parseCreateDraft` before calling the
generated create operation. Keep update-value semantics explicit until the
application has a deliberate update transform.

Use one application-owned typed endpoint for a multi-table workflow. Extend the
generated project's existing `api.ts` wiring for its shared contract. The form's
mutation transforms domain values into that request; the server resolves auth,
applies row security, and owns the transaction.

Treat schemas, cache keys, routes, mutation functions, and formatting in the
compact reference as application examples. Replace them with the feature's
authoritative implementations. Do not treat them as framework exports.

## Handle Errors And Cache Effects

Use the installed framework's reusable form and request-error machinery. Map
domain-specific server fields to form fields in application code. Do not copy a
general `ApiError` body parser or parallel form-error type from an example.

Render client-validation and request-validation issues at the appropriate
field, keep a form-level fallback, clear stale mutation errors when editing
resumes, disable the submitting fieldset, and prevent an unhandled submit
rejection after rendering the failure inline.

Cache and Grid reload effects are application behavior. Call
`reloadTGridRows(tableName)` after generated-table mutations that affect a
mounted table Grid. Invalidate or update every affected application cache before
success navigation or closing a dialog. Reuse project query namespaces when
they exist.

## Link The Form To Application Routes

Declare custom form routes in `packages/frontend/src/App.tsx`. Keep the list or
workspace route in `appNavigation`. Keep create, edit, and individual record
routes contextual.

Use this route grammar for an app-owned detail workflow:

```text
/tasks              list or master-detail workspace
/tasks/new          create form
/tasks/:id          full detail
/tasks/:id/edit     edit form
```

Connect New to `/tasks/new`, detail Edit to `/tasks/:id/edit`, and successful
create or edit to `/tasks/:id` after cache effects. When the list already shows
a read preview, row activation commonly opens `/tasks/:id/edit`. Without that
preview, activation commonly opens `/tasks/:id`.

Use `/tasks/new?project_id=<id>` for project-context creation. Parse the search
value before using it as a default. The current generated framework routes
provide `/tables/:tableName` and `/tables/:tableName/new`; use app-owned routes
for custom detail and edit screens.

## Preserve Domain Types

Derive server database row types with `typeof table.$inferSelect` and insert
types with `typeof table.$inferInsert`. Keep those types in server and database
code. Semantic Drizzle values such as `date()` and `timestamp()` may be
Temporal objects in database code while generated HTTP responses use canonical
strings.

The frontend should consume browser-safe shared contract outputs or validate a
generated table response once into an explicit wire projection. Reuse shared
workflow-contract inputs and outputs for custom endpoints.

Do not use the generic generated-table row or a server `$inferSelect` type as
the browser domain model. Database insert types may include trusted fields that
browser forms cannot write; keep the browser write projection and server policy
authoritative.

Formatting is application behavior. Keep labels, status text, dates, currency,
and other presentation transforms beside the feature or in existing
application-wide formatters, not in a copied form template.

## Continue To Specialized Guidance

- For non-table items, multi-select, tags, grouping, or specialized popup and
  focus behavior, read [pickers.md](pickers.md).
- When the form contains a substantial editable or selectable collection, or
  stages several draft rows for one submit, read [grids.md](grids.md). Define
  validation, cancellation, conflict handling, authorization, and transaction
  behavior before choosing an editable Grid or temporary row model.

## Validate The Workflow

Run the frontend typecheck, tests, and build available in the application.
Exercise required, optional, defaulted, select, foreign-key, numeric, date,
timestamp, non-writable, and scope-managed fields. Verify loading,
cancellation, edit hydration, dirty-input preservation, server field details,
cache effects, authorization, and the success destination.
