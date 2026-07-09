---
name: combobox
description: >
  Use when composing searchable dropdowns in Sapporta React code with Base UI
  Combobox primitives. Covers the `@sapporta/ui/combobox` re-export, shared
  Sapporta styles, typed lookup values, and remote lookup integration. Defer
  general Combobox API, composition, and accessibility guidance to Base UI.
---

# Combobox

Compose comboboxes with the Base UI primitives re-exported by Sapporta:

```tsx
import { Combobox, comboboxClassNames } from "@sapporta/ui/combobox";
import { cn } from "@sapporta/ui/cn";
```

Sapporta exposes the Base UI `Combobox` namespace and shared style tokens. It
does not provide the old ready-made `Combobox` field or `ComboboxList`.

Use the Base UI documentation as the canonical source for component anatomy,
props, TypeScript behavior, accessibility, composition patterns, and async
search:

- https://base-ui.com/react/components/combobox

Inspect the installed Base UI declarations when a project version differs
from the current documentation.

## Sapporta-specific rules

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

Reference implementations in the Sapporta monorepo:

- `packages/frontend/src/lookup/LookupPicker.tsx`
- `packages/frontend/src/table/filters/ConditionEditor.tsx`
- `packages/grid/src/column-preset/editors/LookupValueEditor.tsx`
