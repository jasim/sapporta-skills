---
name: frontend
description: >
  Use when the user wants to build custom React views in a Sapporta project
  under `packages/frontend/src/`. Covers custom routes, forms, dashboards, wizards,
  table/grid views using Sapporta primitives, `@sapporta/ui` components, and
  typed API client calls.
---

# Custom Frontend Views

Build screens under `packages/frontend/src/`: dashboards, import wizards,
multi-table forms, report pages, and custom table/grid workflows. Use public
exports from `@sapporta/frontend`, `@sapporta/ui`, and `@sapporta/shared`;
when local app declarations are needed, inspect the app's `packages/frontend`
workspace.

In auth-enabled apps, let the existing app boot load the session and
`/api/auth-context` before rendering screens that need scoped tables or report
routes. Non-owner workspace users should not see owner-only table, report, or
metadata links. Forms must omit system-managed scope fields and columns marked
`clientEditable: false`.

Client code does not enforce row ownership. Do not add hidden
`workspace_id`, `workspaceId`, `scoped_to_user_id`, or `scopedToUserId` inputs,
and do not rely on `fixedFilters` or URL params as authorization. Use built-in
table routes or typed custom endpoints whose server handlers resolve auth and
apply `scopedRows()` or `rowSecurity`.

Follow the current app convention: `packages/frontend/src/App.tsx` exports
`appNavigation`, `appHomeRoute`, `appPublicRoutes`, and `appProtectedRoutes`.
Add one file per screen, then add a route and, for protected screens, a
matching navigation item:

```tsx
import { Route, Navigate } from "react-router-dom";
import type { Navigation } from "@sapporta/frontend/shell";
import { Upload } from "lucide-react";
import { Imports } from "./Imports";

const importsPath = "/imports";

export const appNavigation: Navigation = [
  {
    label: "Workflows",
    items: [{ label: "Imports", to: importsPath, icon: Upload }],
  },
];

export const appHomeRoute = (
  <Route index element={<Navigate to={importsPath} replace />} />
);

export const appPublicRoutes = (
  <>
    {/* Public pages go here only when their data is intentionally public. */}
  </>
);

export const appProtectedRoutes = (
  <>
    <Route path="imports" element={<Imports />} />
  </>
);
```

`AppShell` receives `navigation={appNavigation}`. Add report screens to the
`Navigation` array so users can find them alongside table and workflow pages.
Keep app navigation there instead of wiring legacy sidebar components by hand.

## Primitives

- **`Combobox` — searchable picker for id-to-label maps (FK selects, tag pickers,
  any list too long for a native `<select>`)** → [combobox/SKILL.md](combobox/SKILL.md)
- **Table/grid pages** — preserve built-in table affordances by composing
  Sapporta table primitives instead of a bespoke `<table>` with local `fetch`
  state. For custom table/grid routes, read
  [references/table-grid.md](references/table-grid.md).

## Backend APIs

Keep the app's typed API clients in `packages/frontend/src/api.ts`:

```ts
import { createApiClient } from "@sapporta/shared/client";
import { getApiBase } from "@sapporta/frontend/platform";
import { helloContract } from "__SLUG__-shared";

export const customApi = createApiClient(helloContract, { baseUrl: getApiBase });
```

Pass `getApiBase` itself, not `getApiBase()`. Contract methods return the 2xx
body and throw `ApiError` on non-2xx. Preserve `ApiError.status` and
`ApiError.body` so the screen can show the server's actual error. Use the
existing `readApiError()` pattern from `Welcome.tsx`, or `instanceof ApiError`
when package identity is reliable.

Three touchpoints, in order: declare the contract in
`packages/shared/src/contracts/<feature>.ts` (and re-export from
`packages/shared/src/contracts/index.ts`), register the handler in
`packages/api/app/<feature>.ts` (and mount it in `loadApp()`), then add one
entry to `packages/frontend/src/api.ts` so a typed client method exists for it.

For custom app endpoints, prefer the typed client over hand-written
`fetch("/api/foo")`. The typed client keeps request and response shapes checked
against the contract at compile time. Use lower-level fetch only for platform
plumbing or an endpoint that intentionally has no shared contract.

Typed clients still call server code; they do not make a route auth-safe by
themselves. When adding a frontend call that mutates or reveals scoped data,
confirm the matching backend handler chooses the route's ability/data authority
and uses scoped row helpers.
