---
name: frontend
description: >
  Use when the user wants to build custom React views in a Sapporta project
  under `packages/frontend/src/`. Covers custom routes, forms, dashboards, wizards,
  `@sapporta/ui` components, and typed API client calls.
---

# Custom Frontend Views

The project template wires `TableRoute` and `ReportRoute` under
`packages/frontend/src/App.tsx`. For everything else — domain dashboards, import
wizards, forms that span multiple tables — add your own route and render it
with the same primitives `@sapporta/ui` uses.

Auth-enabled frontends load session and `/api/auth-context` before Sapporta
metadata. Non-owner workspace users may enter built-in product routes, but
owner-only navigation for tables, reports, and metadata should be hidden.
Built-in and custom forms must omit system-managed scope fields and columns
marked `clientEditable: false`.

Follow the convention the template ships: `packages/frontend/src/Welcome.tsx` is a
working example of a custom view, imported in `App.tsx` and linked from
`Sidebar.tsx`. Add new views the same way — one file per view at
`packages/frontend/src/<Name>.tsx`, wired into `App.tsx` as a sibling route and into
`Sidebar.tsx` as a sibling nav entry:

```tsx
// packages/frontend/src/App.tsx
<Route path="imports" element={<Imports />} />
```

## Primitives

- **`Combobox` — searchable picker for id→label maps (FK selects, tag pickers,
  any list too long for a native `<select>`)** → [combobox/SKILL.md](combobox/SKILL.md)

## Calling backend APIs from custom views

The typed client lives in `packages/frontend/src/api.ts`. The project template keeps this
file small; read it as the canonical wiring:

```ts
// packages/frontend/src/api.ts
import { createApiClient } from "@sapporta/shared/client";
import { getApiBase } from "@sapporta/ui";
import { helloContract } from "__SLUG__-shared";

export const customApi = createApiClient(helloContract, { baseUrl: getApiBase });
```

`getApiBase` is passed as a function, not a string — the typed-client
factory expects a getter so the base is resolved at call time.

Each contract method becomes a client method that returns the 2xx body
on success or throws on non-2xx:

```ts
import { customApi } from "./api";
const { message } = await customApi.hello();
```

### Errors

Import `ApiError` from `@sapporta/shared/client` and discriminate with
`instanceof`. The error's `body` carries the server's typed error
payload; `status` carries the HTTP status. Never reinterpret it —
report it verbatim. The canonical pattern is the `useEffect` block in
`packages/frontend/src/Welcome.tsx` (loading → ok → error states):

```tsx
import { ApiError } from "@sapporta/shared/client";

customApi.hello().then(
  (body) => setHello({ kind: "ok", message: body.message }),
  (err: unknown) => {
    if (err instanceof ApiError) {
      setHello({ kind: "error", status: err.status, body: err.body });
    } else {
      setHello({ kind: "error", status: 0, body: err });
    }
  },
);
```

### Adding a new endpoint

Three touchpoints, in order: declare the contract in
`packages/shared/src/contracts/<feature>.ts` (and re-export from
`packages/shared/src/contracts/index.ts`), register the handler in
`packages/api/app/<feature>.ts` (and mount it in `loadApp()`), then add one
entry to `packages/frontend/src/api.ts` so a typed client method exists for it.

### Anti-pattern

Don't write `fetch("/api/foo")` by hand. The typed client exists
precisely so request and response shapes are checked against the
contract at compile time. Hand-rolled fetches re-introduce the drift
the shared package was built to prevent.
