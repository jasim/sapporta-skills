---
name: combobox
description: >
  Use when a Sapporta React form field needs a searchable dropdown over an
  id-to-label map. Covers `Combobox` from `@sapporta/ui`, foreign-key pickers,
  tag selectors, and lists too long for a native `<select>`.
---

# Combobox — searchable picker for id-to-label maps

Use `Combobox` from `@sapporta/ui` when a form needs a searchable picker over
an id-to-label map: foreign keys, tags, or any list too long for a short static
`<select>`.

If the project source is not available, inspect the installed package
declarations in `node_modules/@sapporta/ui`.

## Props

- `value: string | null` — the currently selected id.
- `onChange: (value: string | null) => void` — fires with the picked id, or
  `null` when the user picks "Clear".
- `options: Record<string, string>` — id-as-string → display label. Same shape
  the grid's FK cell editor uses, so an options object built for one works
  for the other.
- `placeholder?: string` — shown on the trigger when `value` is `null`.
  Defaults to `"Select…"`.
- `disabled?: boolean`
- `className?: string` — applied to the trigger `<Button>`. Use it to set width.

## Typical use

```tsx
import { useState } from "react";
import { Combobox } from "@sapporta/ui";

export function AssignAccountForm({
  accountsById,
}: {
  accountsById: Record<string, string>;
}) {
  const [accountId, setAccountId] = useState<string | null>(null);

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm">Account</span>
      <Combobox
        value={accountId}
        onChange={setAccountId}
        options={accountsById}
        placeholder="Choose an account…"
        className="w-64"
      />
    </label>
  );
}
```

## Gotchas

- **`options` is `Record<string, string>`, not `Array<{id, label}>`.** Build it
  once with `Object.fromEntries(rows.map(r => [String(r.id), r.label]))`. Keys
  and `value` are strings.
- **Value is `string | null`.** Convert numeric primary keys at the boundary
  with `String(id)` and parse only if the submit API needs a number.
- **Clearing returns `null`.** The list always shows a "Clear" row. If the
  field is required, validate `value !== null` before submit — `Combobox`
  itself never forces a choice.
- **Width comes from the trigger.** The popover adopts the trigger's width via
  `--radix-popover-trigger-width`. Set `className` on `<Combobox>`
  (e.g. `"w-64"`), not on the popover.
- **Don't use this for 2–5 fixed choices.** A plain `<select>` (or shadcn
  `Select`) is the right tool for short, static lists. `Combobox` earns its
  weight when search matters.
