---
name: combobox
description: >
  Use `Combobox` from `@sapporta/ui` when a form field needs a searchable
  dropdown over an id→label map — foreign-key pickers, tag selectors, any list
  too long for a native `<select>`. It is the same Popover + cmdk picker the
  grid's FK cell uses, exposed as a standalone click-to-open component with a
  plain `value`/`onChange` API.
---

# Combobox — searchable picker for id→label maps

`Combobox` is a Popover + cmdk Command recipe styled to match the rest of
`@sapporta/ui`. Reach for it whenever a plain `<select>` loses the user —
hundreds of accounts, a long tag list, anywhere search-as-you-type matters.

Never rebuild this from scratch with a `<select>` + `<datalist>` or a hand-
rolled popover. That is what this component exists to avoid.

## Props

- `value: number | null` — the currently selected id.
- `onChange: (value: number | null) => void` — fires with the picked id, or
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
import { useEffect, useState } from "react";
import { Combobox } from "@sapporta/ui";

export function AssignAccountForm() {
  const [accounts, setAccounts] = useState<Record<string, string>>({});
  const [accountId, setAccountId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/tables/accounts")
      .then((r) => r.json())
      .then((body: { data: Array<{ id: number; name: string }> }) => {
        setAccounts(Object.fromEntries(body.data.map((r) => [String(r.id), r.name])));
      });
  }, []);

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm">Account</span>
      <Combobox
        value={accountId}
        onChange={setAccountId}
        options={accounts}
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
  are strings; the component stringifies `value` internally for comparison.
- **Value is `number | null`.** The component coerces the picked key back to a
  number on pick. If your ids aren't numeric PKs, don't work around the
  coercion — raise it as a feature request instead.
- **Clearing returns `null`.** The list always shows a "Clear" row. If the
  field is required, validate `value !== null` before submit — `Combobox`
  itself never forces a choice.
- **Width comes from the trigger.** The popover adopts the trigger's width via
  `--radix-popover-trigger-width`. Set `className` on `<Combobox>`
  (e.g. `"w-64"`), not on the popover.
- **Don't use this for 2–5 fixed choices.** A plain `<select>` (or shadcn
  `Select`) is the right tool for short, static lists. `Combobox` earns its
  weight when search matters.
