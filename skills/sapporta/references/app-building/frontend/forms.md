# Domain Forms

Use this file as a routing page. Canonical Sapporta documentation owns exact
exports, behavior, examples, and invariants:

Generated projects install TanStack Query and TanStack Form. They mount one
QueryClient and keep its application-wide policy in the workspace-owned
`packages/frontend/src/query-client.ts` file.

- Custom forms and cached table reads:
  https://sapporta.com/docs/guides/app-owned-features/custom-forms-and-table-queries.md
- Custom forms and validation:
  https://sapporta.com/docs/guides/app-owned-features/custom-forms-and-validation.md
- Table lookups and record ids:
  https://sapporta.com/docs/reference/frontend/lookups.md
- Generated record surfaces and form helpers:
  https://sapporta.com/docs/reference/frontend/generated-record-surfaces.md
- Table query options:
  https://sapporta.com/docs/reference/frontend/table-query-options.md
- Generated record screens and forms:
  https://sapporta.com/docs/guides/generated-surfaces/record-screens-and-forms.md
- Relationships and lookup behavior:
  https://sapporta.com/docs/guides/model-data/relationships-and-lookup-behavior.md
- Serialization and API errors:
  https://sapporta.com/docs/reference/contracts/serialization-and-api-errors.md

Read the custom-forms guide and both frontend references before implementing a
custom form. Confirm exact declarations against the application's installed
Sapporta version.

## Choose The Form Boundary

- Use the generated table route or `NewRecordPage` for an ordinary one-table
  create whose metadata-derived order fits the workflow.
- Compose a domain form when the workflow needs sections, route defaults,
  non-column inputs, a different destination, or application-specific layout.
- Use one app-owned typed endpoint when the submit changes several tables or
  performs a named domain action. The server owns authorization and the
  transaction.
- Read [pickers.md](pickers.md) for a picker beyond the standard scoped lookup.
- Read "Stage Multi-Row Drafts In A Grid" below when the workflow collects
  repeating rows rather than a fixed set of fields.

## Stage Multi-Row Drafts In A Grid

Stage repeating draft rows — invoice lines, a roster, a bill of materials — in a
Grid over an application-owned in-memory source. Do not hand-build a stack of
Add/Edit/Delete rows, and do not keep the rows in `useState`.

- Rows want columns, keyboard navigation, or per-row state -> compose GridCore
  with ColumnPreset; read [grids.md](grids.md).
- Short repeating group of ordinary inputs -> TanStack Form `mode="array"`.

Keep staged rows in the Grid runtime. The surrounding form owns header fields,
submit state, and submit errors.

Then choose where the draft becomes persistent shape. Post it to one app-owned
typed endpoint when the save spans several tables, needs one transaction, or
encodes a domain rule, and put the draft row type in the shared contract. Read
[../backend/parent-detail-transactions.md](../backend/parent-detail-transactions.md).

Pattern and trade-offs:
https://sapporta.com/docs/guides/app-owned-features/staged-multi-row-drafts.md

## Picker Policy

Every choice control must be searchable and keyboard-operable. Do not use a
native HTML `<select>` or BaseUI's `<Select>` component in application-owned 
forms, filters, or report controls.

- For a single record from a Sapporta table or foreign-key column, use
  `LookupPicker` with the field's `LookupCapabilities` or `useTableLookup()`.
  It preserves scoped remote search, selected-label loading, typed IDs, cache
  behavior, and shared styling. Do not fetch a whole table merely to turn its
  rows into local options.
- For a static enum, status, priority, or other non-table option set, compose
  the Base UI `Combobox` with Sapporta's `comboboxClassNames` tokens. It must
  expose text input and filtered keyboard navigation. Read [pickers.md](pickers.md)
  before composing it.
- For a specialized item model, grouping, multi-select, tags, or embedded-grid
  editor, use the same Base UI `Combobox` primitives; do not add a new
  application-local Select wrapper.

Before completing a form, audit every choice control against this policy,
including toolbar and report filters that launch or constrain the workflow.

## Type The Form Instance

Call `useForm` inside one hook per form and name that hook's return type. Child
components declare their `form` prop with that name.

```ts
type MealForm = ReturnType<typeof useMealDraftForm>;
```

`ReturnType<typeof useForm<MealDraft>>` does not resolve, and every `form.Field`
render prop under it degrades to an implicit `any`. Keep validators and the
submit handler inside the hook so they stay part of the type.

## Map Submit Errors

- Map server field issues inside `onSubmit`: catch the rejection, convert it,
  and call `formApi.setErrorMap({ onSubmit: { form, fields } })`.
- Never put the write in `validators.onSubmitAsync`. It has already changed the
  database by the time validation reports a failure.
- Clear a stale submit error with one form-level `listeners.onChange`, not from
  every field's `onChange`.
- A Standard Schema validator checks the schema's input type and discards
  transformed output. Parse again inside `onSubmit` when the schema coerces or
  transforms.
- Where fields come from table metadata, `parseCreateDraft()` already reports
  required and invalid columns. Do not restate them in a second schema.

## Follow TanStack Form's Idioms

Sapporta does not wrap TanStack Form. The custom-forms-and-validation guide
listed above names the idioms this codebase relies on — `useSelector` over the
deprecated `useStore`, persistent `isDirty`, `revalidateLogic()`,
`onSubmitInvalid`, `formOptions()`, `aria-disabled` submit. Confirm each against
the library's own guides:

```bash
curl -sL https://tanstack.com/form/latest/docs/framework/react/guides/[guide].md
```

`basic-concepts`, `validation`, `submission-handling`, `reactivity`,
`listeners`, `linked-fields`, `arrays`, `dynamic-validation`,
`focus-management`, `form-composition`.

## Preserve These Boundaries

- Reuse the generated TanStack Query provider and workspace-owned
  `packages/frontend/src/query-client.ts`. Use
  `tableRecordQueryOptions()` and `tableRecordsPageQueryOptions()` with
  `tableQueryKeys` for generated table reads.
- Read the table-query-options reference before building generated table
  selection, page, or cache state. Reuse `buildTableSelectionQuery()`,
  `buildTableRowsQuery()`, `fetchTableRow()`, and `fetchTableRows()` where their
  documented lifecycle fits; do not replace their lossless repeated-filter
  handling with a `Record<string, string>` or an application-local table client.
- Use TanStack Form for draft values, dirty state, local validation, submit
  errors, and pending state.
- Derive standard table fields from Sapporta metadata. Do not recreate a
  generic form-field, lookup, table-client, query-key, or API-error layer in the
  application.
- Type a row the form loads as a shared-package row projection parsed through
  `decodeRow`, never `$inferSelect`; read
  [row-projections.md](row-projections.md).
- Parse route identity before mounting mode-specific hooks. Load complete edit
  defaults before mounting the editor, key it to the record, and do not replace
  dirty values from a background refetch.
- Use `parseCreateDraft()` for ordinary creates. Keep update transforms
  explicit because omission has different create and patch meanings.
- Use `FormSubmissionError`, `fieldIssuesForSubmissionError()`, and
  `firstFormErrorMessage()` for local and API field issues. Keep a form-level
  fallback and consume a rendered submit rejection.
- Invalidate every affected TanStack Query scope before navigating or closing.
  For ordinary table mutations, invalidate
  `tableQueryKeys.table(tableName)` and call `reloadTGridRows(tableName)` for
  each affected mounted TGrid. These are separate effects.
- Treat client metadata, hidden fields, fixed filters, query keys, and form
  validation as presentation and request-shaping tools. The server remains the
  write-policy, row-scope, validation, and authorization boundary.

## Inspect The Application

```bash
sed -n '1,160p' packages/frontend/src/query-client.ts
rg -n "tableRecordQueryOptions|tableRecordsPageQueryOptions|tableQueryKeys" packages/frontend/src
rg -n "FormField|buildRecordFormFields|parseCreateDraft|LookupPicker" packages/frontend/src
rg -n "createApiClient|getApiBase" packages/frontend/src/api.ts packages/frontend/src
```

For the framework's own declarations, resolve the package first; read
[../../framework-source-lookup.md](../../framework-source-lookup.md).

The local files under `form-template/` are secondary structural examples. Use
them only after reading the public guide. Adapt domain names, schemas, routes,
cache effects, error mapping, and layout; do not treat application-placeholder
imports as framework exports.

## Validate The Workflow

Ideally in a separate agent/subagent/thread/coding agent task, run
`pnpm typecheck`, then the application's tests and build. Exercise loading,
cancellation, create and edit initialization, dirty-value preservation, required
and optional values, static-combobox and foreign-key lookup fields, server field
issues, query invalidation, Grid reload, authorization, and success navigation.
