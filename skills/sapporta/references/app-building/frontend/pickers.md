# Searchable Pickers

Choose the highest-level existing abstraction before composing primitives.

## Contents

- [Use LookupPicker For Table Records](#use-lookuppicker-for-table-records)
- [Compose Base UI For Specialized Interactions](#compose-base-ui-for-specialized-interactions)

## Use LookupPicker For Table Records

For an ordinary single-value picker over a Sapporta table or foreign key, use
the public lookup module:

```tsx
import { LookupPicker, useTableLookup } from "@sapporta/frontend/lookup";

const accountLookup = useTableLookup("accounts");

<LookupPicker<number>
  id="account-id"
  lookup={accountLookup}
  value={accountId}
  onChange={setAccountId}
  placeholder="Select account..."
  disabled={disabled}
  className="w-full"
/>
```

Match the generic and state type to the target table's primary key. Preserve a
numeric id as a number. Convert only at an explicit text boundary such as URL
or legacy form state:

```tsx
<LookupPicker<number>
  lookup={accountLookup}
  value={accountId === null ? null : Number(accountId)}
  onChange={(id) => setAccountId(id === null ? null : String(id))}
/>
```

`LookupPicker` already handles scoped remote search through
`LookupCapabilities`, selected-label loading outside the current search page,
lookup cache subscriptions, typed string/number ids, `null` clearing, disabled
state and entries, equality, keys, and shared styling. It also accepts
`allowClear`, `searchLimit`, `id`, and `className`.

If the caller already has `LookupCapabilities`, pass it directly. Otherwise,
use `useTableLookup(tableName)` instead of fetching a large table list solely
to construct picker options. Do not introduce an app-local `*Picker` around
Base UI for behavior `LookupPicker` already provides. If a domain wrapper is
genuinely useful, implement it in terms of `LookupPicker`.

`LookupPicker` remains the app-facing table lookup control. When an old
application-local combobox selects table records, migrate it to `LookupPicker`;
do not copy the `LookupPicker` implementation or materialize a table into local
options.

For short static option sets, use the Base UI `Combobox` with the shared
Sapporta style tokens. It gives users searchable, keyboard-operable choices and
is the required replacement for native HTML `<select>` and the removed
Sapporta `Select` component.

## Compose Base UI For Specialized Interactions

Compose primitives for static option sets and behavior outside `LookupPicker`:
non-table item models, custom rendering or grouping, multi-select or tags,
embedded grid editors, and special trigger, focus, popup, or layout semantics.

Import the Base UI primitives and shared Sapporta styles from focused exports:

```tsx
import { Combobox, comboboxClassNames } from "@sapporta/ui/combobox";
import { cn } from "@sapporta/ui/cn";
```

Sapporta exposes the Base UI `Combobox` namespace and shared style tokens.

Use the Base UI documentation as the canonical source for component anatomy,
props, TypeScript behavior, accessibility, composition patterns, and async
search:

- https://base-ui.com/react/components/combobox

Inspect the installed Base UI declarations when a project version differs
from the current documentation.

### Sapporta-specific composition rules

- Apply the matching `comboboxClassNames` token to each primitive. The map
  provides `inputGroup`, `input`, `action`, `trigger`, `positioner`, `popup`,
  `empty`, `list`, `item`, and `itemIndicator`. Merge consumer-specific layout
  classes with `cn()`.
- Keep `LookupEntry` objects as `items` and as the Base UI selected value.
  Translate at the domain boundary with `pickedEntry?.value ?? null`.
- Preserve numeric lookup ids as numbers. Use `lookupValueEquals()` for item
  equality and `lookupValueKey()` for React keys.
- Pass `filter={null}` when a lookup or server performs the search. Update the
  remote query for the `"input-change"` reason and clear it after selection or
  other input-reset events.
- Keep the selected lookup entry in the available items while remote results
  change. Forward `entry.disabled` to `Combobox.Item`.
- Populate lookup items through scoped table or lookup APIs. Client filters
  and raw SQL do not establish workspace or user authorization.
- For static items, provide an input, popup, empty state, filtered list,
  selected-value equality, and visible selection indicator. Preserve the
  static domain value at the boundary rather than converting it to labels.

Use these Sapporta monorepo implementations according to their role:

- `packages/frontend/src/lookup/LookupPicker.tsx` is the public reusable
  abstraction. Import it; do not copy it into an app.
- `packages/frontend/src/table/filters/ConditionEditor.tsx` directly composes
  Base UI for a specialized column picker.
- `packages/grid/src/column-preset/editors/LookupValueEditor.tsx` directly
  composes Base UI for embedded grid focus and popup behavior.
