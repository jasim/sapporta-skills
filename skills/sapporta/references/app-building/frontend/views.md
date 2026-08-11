# Custom Frontend Views

Build screens under `packages/frontend/src/`: dashboards, import wizards,
report pages, and custom table/grid workflows. Use public
exports from `@sapporta/frontend`, `@sapporta/shared`, `@sapporta/grid`,
`@sapporta/grid/column-preset`, and generic UI components from `@sapporta/ui`.
Prefer domain-aware components and hooks from `@sapporta/frontend` before
composing generic `@sapporta/ui` primitives. When exact declarations are
needed, inspect the app's installed packages.

Form work has a separate first read. Use [forms.md](forms.md) before choosing
fields, form state, persistence, pickers, or an embedded Grid. It covers direct
TanStack Form composition with `NewRecordPage`, `FormField`,
`buildRecordFormFields`, field-model lookup functions, `parseCreateDraft`, the
generated Sapporta table API, and the generated project's TanStack Query
integration.

Before creating an app-local field or picker, search for the public form and
lookup surface:

```bash
rg -n 'NewRecordPage|FormField|buildRecordFormFields|fieldModelForColumn|foreignKeyFieldModelForColumn|parseCreateDraft|LookupPicker|useTableLookup' packages/frontend/src
```

Docs:

- Frontend screens: https://sapporta.com/docs/guides/app-owned-features/custom-frontend-routes-and-screens.md
- Custom forms and cached table reads: https://sapporta.com/docs/guides/app-owned-features/custom-forms-and-table-queries.md
- Table query options: https://sapporta.com/docs/reference/frontend/table-query-options.md
- Typed clients: https://sapporta.com/docs/guides/app-owned-features/typed-api-clients.md
- Grid-first record workflows: https://sapporta.com/docs/guides/generated-surfaces/grid-first-record-workflows.md
- Grid core model: https://sapporta.com/grid/guides/core-model.md
- Choose a Grid layer: https://sapporta.com/grid/start/choose-a-grid-layer.md
- Interactions: https://sapporta.com/grid/reference/interactions.md
- Keyboard and selection: https://sapporta.com/grid/guides/keyboard-and-selection.md

## Record Workflow Surfaces

Apply the application grammar in [../guide.md](../guide.md). For each tabular
list or related-record collection, read [grids.md](grids.md) before choosing the
Grid layer, interaction, query context, or columns.

## Routes And Navigation

Follow the current app convention. `packages/frontend/src/App.tsx` exports
`appNavigation`, `appHomeRoute`, `appPublicRoutes`, and
`appProtectedRoutes`. Add one file per screen, then add its route.

Give every screen a browser tab title so history entries and open tabs stay
readable. Pass `title` to `AppPage` or `PageHeader` — that sets the tab title
too. If the screen renders its own chrome, call `usePageTitle("...")` from
`@sapporta/frontend/shell`.

Read [../workflow-shell.md](../workflow-shell.md) before changing
`appNavigation`, the protected home page, `showFrameworkNavigation`, or an
Advanced/Admin page. Add a protected page to `appNavigation` only when users
routinely start or resume work there. Keep create, edit, detail, and
supporting-resource pages contextual unless they are genuine starting points;
put specialist reports, tools, and maintenance pages under Advanced. Put public
routes in `appPublicRoutes` only when their data is intentionally public. For
connected list, detail, create, and edit routes, adapt
[form-template/route-wiring.tsx.example](form-template/route-wiring.tsx.example).

For an app-owned resource workflow, connect these route roles deliberately:

```text
/<resources>              list or master-detail workspace
/<resources>/new          create form
/<resources>/:id          full detail
/<resources>/:id/edit     edit form
```

- Open the create route from the list or contextual parent action.
- Open edit on row activation when the workspace already shows a read preview;
  otherwise open full detail.
- Open edit from the detail action.
- After create or edit, invalidate affected caches before opening detail.
- Return from cancel to the prior detail or list without saving.
- Parse and validate route or search identity before using it as a form default.
- Add only pages where users routinely begin or resume work to `appNavigation`.

Generated framework routes provide `/tables/:tableName` and
`/tables/:tableName/new`. Do not assume generated detail or edit routes exist.
Use app-owned routes until the installed Sapporta version exposes the needed
surface.

## Auth Boundaries

Let the existing app boot load the session and
`/api/auth-context` before rendering screens that need scoped tables or report
routes. Non-owner workspace users should not see owner-only table, report, or
metadata links.

Client code does not enforce row ownership. Do not add hidden `workspace_id`,
`workspaceId`, `scoped_to_user_id`, or `scopedToUserId` inputs, and do not rely
on `fixedFilters` or URL params as authorization. Use built-in table routes or
typed custom endpoints whose server handlers resolve auth and apply
`scopedRows()` or `rowSecurity`.

Forms must omit system-managed scope fields and columns marked
`apiWritable: false`. This metadata shapes generated clients and forms. The
server applies the authoritative write policy.

## Pickers And Primitives

- For ordinary searchable selection from a Sapporta table or foreign key, use
  `LookupPicker` with `useTableLookup` from `@sapporta/frontend/lookup`. It owns
  scoped remote search, selected-value loading, caching, clearing, disabled
  state, and shared styling. Do not compose Base UI or add an app-local picker
  for this standard case.
- Compose the Base UI `Combobox` primitives only when the interaction is not
  covered by `LookupPicker`, including all static choices. Do not use native
  HTML `<select>` or the BaseUI `Select` component -> read
  [pickers.md](pickers.md).
- Table/grid pages should preserve built-in search, filters, sort, pagination,
  CSV export, lookup labels, URL state, loading states, and error states unless
  the user explicitly asks for less -> read
  [grids.md](grids.md).
- Use ColumnPreset before authoring a custom BaseGrid column. Keep application
  validation, persistence, conflicts, and workflow transactions in save
  handlers, services, and endpoints rather than cell renderers.

## Backend APIs

Keep typed API clients in `packages/frontend/src/api.ts`. Prefer a typed client
from the shared contract over hand-written `fetch("/api/foo")`.

For generated table reads, first use the public fetch functions, selection/page
serializers, TanStack Query option builders, and cache keys documented in the
table-query-options reference. Preserve `QueryParamRecord` through the client
boundary so repeated same-key filters are not collapsed. Keep app-owned endpoint
clients in `packages/frontend/src/api.ts`.

Typed clients still call server code; they do not make a route auth-safe by
themselves. When adding a frontend call that mutates or reveals scoped data,
confirm the matching backend handler chooses the route's ability/data authority
and uses scoped row helpers.

Preserve server error details where the UI needs them. Use the project's
existing `ApiError` handling pattern instead of inventing a new error envelope.
