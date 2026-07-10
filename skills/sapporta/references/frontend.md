# Custom Frontend Views

Build screens under `packages/frontend/src/`: dashboards, import wizards,
multi-table forms, report pages, and custom table/grid workflows. Use public
exports from `@sapporta/frontend`, `@sapporta/shared`, `@sapporta/grid`,
`@sapporta/grid/column-preset`, and generic UI components from `@sapporta/ui`.
Prefer domain-aware components and hooks from `@sapporta/frontend` before
composing generic `@sapporta/ui` primitives. When exact declarations are
needed, inspect the app's installed packages.

Before creating an app-local field or picker, search for an existing pattern:

```bash
rg -n 'LookupPicker|useTableLookup|Combobox' packages/frontend/src
```

Docs:

- Frontend screens: https://sapporta.com/docs/subsystems/frontend-screens/
- Typed clients: https://sapporta.com/docs/subsystems/typed-api-clients/
- Table-aware grids: https://sapporta.com/docs/subsystems/grid/
- TGrid usage: https://sapporta.com/grid/docs/full/tgrid-usage/
- BaseGrid guide: https://sapporta.com/grid/docs/full/basegrid-guide/

## Routes And Navigation

Follow the current app convention. `packages/frontend/src/App.tsx` exports
`appNavigation`, `appHomeRoute`, `appPublicRoutes`, and
`appProtectedRoutes`. Add one file per screen, then add a route and, for
protected screens, a matching navigation item.

Add report screens to `appNavigation` so users can find them alongside table
and workflow pages. Put public routes in `appPublicRoutes` only when their data
is intentionally public.

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
`clientEditable: false`.

## Pickers And Primitives

- For ordinary searchable selection from a Sapporta table or foreign key, use
  `LookupPicker` with `useTableLookup` from `@sapporta/frontend/lookup`. It owns
  scoped remote search, selected-value loading, caching, clearing, disabled
  state, and shared styling. Do not compose Base UI or add an app-local picker
  for this standard case.
- Compose the Base UI `Combobox` primitives only when the interaction is not
  covered by `LookupPicker`. Use `Select` for short static choices -> read
  [combobox.md](combobox.md).
- Table/grid pages should preserve built-in search, filters, sort, pagination,
  CSV export, lookup labels, URL state, loading states, and error states unless
  the user explicitly asks for less -> read
  [table-grid.md](table-grid.md).
- Custom non-table grid screens should use BaseGrid from `@sapporta/grid` and
  ColumnPreset from `@sapporta/grid/column-preset`; follow the public BaseGrid
  lifecycle docs.

## Backend APIs

Keep typed API clients in `packages/frontend/src/api.ts`. Prefer a typed client
from the shared contract over hand-written `fetch("/api/foo")`.

Typed clients still call server code; they do not make a route auth-safe by
themselves. When adding a frontend call that mutates or reveals scoped data,
confirm the matching backend handler chooses the route's ability/data authority
and uses scoped row helpers.

Preserve server error details where the UI needs them. Use the project's
existing `ApiError` handling pattern instead of inventing a new error envelope.
