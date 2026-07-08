---
name: combobox
description: >
  Use when a Sapporta React form field needs a searchable dropdown over an
  array of typed values and labels. Covers `Combobox` from `@sapporta/ui`,
  foreign-key pickers, tag selectors, and lists too long for a native
  `<select>`.
---

# Combobox

Use Sapporta's `Combobox` when the user needs to pick one value from a list and
search improves the flow: foreign keys, accounts, customers, tags, users, or
any long/changing option set. Prefer it over a hand-rolled popover/list when
its shape fits.

Docs:

- Frontend screens: https://sapporta.com/docs/subsystems/frontend-screens/

Agent reminders:

- Use the `Combobox` export from `@sapporta/ui`.
- `value` is a string id, numeric id, or `null`; `onChange` receives the picked
  value with the same string/number type or `null`.
- `options` is an array of `{ id, label }` objects, not an id-to-label map.
  Build it from lookup entries or already-scoped parent data.
- Preserve numeric ids when the underlying table stores numeric keys. Convert
  to strings only at a boundary that explicitly expects text.
- Clearing the picker passes `null`; do not use an empty string as the clear
  sentinel.
- Required-field validation lives outside `Combobox`.
- Use a native/select primitive for short static option sets.
- Do not populate options from raw SQL that can expose
  rows outside the current workspace/user boundary.

Typical lookup shape:

```tsx
const options = lookupEntries.map((entry) => ({
  id: entry.value,
  label: entry.label,
}));

<Combobox value={customerId} onChange={setCustomerId} options={options} />
```
