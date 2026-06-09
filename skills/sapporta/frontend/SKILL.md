---
name: frontend
description: >
  Use when the user wants to build custom React views in a Sapporta project
  under `packages/frontend/src/`. Covers custom routes, forms, dashboards, wizards,
  table/grid views using Sapporta primitives, `@sapporta/ui` components, and
  typed API client calls.
---

# Custom Frontend Views

Build the app's own screens under `packages/frontend/src/`: dashboards, import
wizards, multi-table forms, and custom table/grid workflows. Use the installed
Sapporta packages for exact props and exports:
`packages/frontend/node_modules/@sapporta/frontend`,
`packages/frontend/node_modules/@sapporta/ui`, and
`packages/frontend/node_modules/@sapporta/shared`.

In auth-enabled apps, let the existing app boot load the session and
`/api/auth-context` before rendering screens that need tables or reports.
Non-owner workspace users should not see owner-only table, report, or metadata
links. Forms must omit system-managed scope fields and columns marked
`clientEditable: false`.

Follow the current app convention: `packages/frontend/src/App.tsx` exports
`appNavigation`, `appHomeRoute`, and `appRoutes`. Add one file per screen, then
add a route and a matching navigation item:

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

export const appRoutes = <Route path="imports" element={<Imports />} />;
```

`AppShell` receives `navigation={appNavigation}`. Tables and reports appear
automatically when `showFrameworkNavigation` is true. Do not use older
`sidebarContent`, `AppSidebar`, `SidebarNavItem`, or `SidebarSectionLabel`
patterns.

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

Don't write `fetch("/api/foo")` by hand. The typed client exists
precisely so request and response shapes are checked against the
contract at compile time. Hand-rolled fetches re-introduce the drift
the shared package was built to prevent.
