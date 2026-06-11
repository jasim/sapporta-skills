---
name: combobox
description: >
  Use when a Sapporta React form field needs a searchable dropdown over an
  id-to-label map. Covers `Combobox` from `@sapporta/ui`, foreign-key pickers,
  tag selectors, and lists too long for a native `<select>`.
---

# Combobox

Use Sapporta's `Combobox` when the user needs to pick one value from a list and
search would improve the flow: foreign keys, accounts, customers, tags, users,
or any long/changing option set. Prefer it over a hand-rolled popover/list or
plain HTML `<select>` when its shape fits. Custom components are fine only when
`Combobox` cannot express the needed behavior.

```tsx
import { useState } from "react";
import { Combobox } from "@sapporta/ui";

export function AccountPicker({
  accounts,
}: {
  accounts: Array<{ id: string | number; name: string }>;
}) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const accountsById = Object.fromEntries(
    accounts.map((account) => [String(account.id), account.name]),
  );

  return (
    <Combobox
      value={accountId}
      onChange={setAccountId}
      options={accountsById}
      placeholder="Choose an account..."
      className="w-64"
    />
  );
}
```

Use the `Combobox` export from `@sapporta/ui`; when exact declarations are
needed, inspect the generated app's installed `@sapporta/ui` package from its
`packages/frontend` workspace.

Facts:

- `value: string | null`; `onChange` receives the picked string id or `null`.
- Source option rows from the page's existing data path: built-in table APIs,
  a typed app endpoint, or already-loaded parent data.
- In auth-enabled apps, source options through scoped APIs or already-scoped
  parent data. Do not populate a picker from raw SQL that can expose rows from
  another workspace/user.
- `options: Record<string, string>`; build with
  `Object.fromEntries(rows.map((r) => [String(r.id), r.label]))`.
- Convert numeric ids at the boundary. Parse only if the submit API needs a
  number.
- Clearing returns `null`; required fields validate outside `Combobox`.
- `className` applies to the trigger button and controls popover width.
- Use plain `<select>` or shadcn `Select` for short static option sets.
