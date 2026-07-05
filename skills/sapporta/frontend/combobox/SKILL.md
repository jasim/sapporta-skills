---
name: combobox
description: >
  Use when a Sapporta React form field needs a searchable dropdown over an
  id-to-label map. Covers `Combobox` from `@sapporta/ui`, foreign-key pickers,
  tag selectors, and lists too long for a native `<select>`.
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
- `value` is a string id or `null`; `onChange` receives the picked string id or
  `null`.
- `options` is an id-to-label map. Build it from scoped rows or already-scoped
  parent data.
- Convert numeric ids at the submit boundary only if the API expects a number.
- Required-field validation lives outside `Combobox`.
- Use a native/select primitive for short static option sets.
- Do not populate options from raw SQL that can expose
  rows outside the current workspace/user boundary.
