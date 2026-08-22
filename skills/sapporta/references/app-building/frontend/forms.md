# Domain Forms

Use this file as a routing page. Canonical Sapporta documentation owns exact
exports, behavior, examples, and invariants:

Generated projects install TanStack Query and TanStack Form. They mount one
QueryClient and keep its application-wide policy in the workspace-owned
`packages/frontend/src/query-client.ts` file.

- Custom forms and cached table reads:
  https://sapporta.com/docs/guides/app-owned-features/custom-forms-and-table-queries.md
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

Some workflows collect a repeating structure that no single stored table
matches: an invoice's lines, a shift roster, a bill of materials, a batch of
readings. The draft lives only in the browser, carries its own row shape, and
is transformed on save — often across several tables, or into one named domain
action. It is a logical representation of a domain concept, not a view of a
table.

Stage that draft in a Grid. Do not hand-build a stack of rows with Add, Edit,
and Delete buttons, and do not keep the rows in `useState`. Read
[grids.md](grids.md), then compose GridCore with ColumnPreset over an
application-owned in-memory source. Its draft and phantom-row APIs already own
row identity, insertion, cell editing, and per-row failure state:

- Choose a Grid layer: https://sapporta.com/grid/start/choose-a-grid-layer.md
- Phantom rows and inserts:
  https://sapporta.com/grid/guides/advanced-rows/phantom-rows-and-inserts.md
- In-memory and REST data sources:
  https://sapporta.com/grid/reference/data-sources/in-memory-and-rest-sources.md

Use TanStack Form's `mode="array"` fields instead when the collection is a
short repeating group of ordinary inputs. Reach for a Grid once the rows want
columns, keyboard navigation, or per-row state.

The surrounding form still owns the header fields, submit state, and submit
errors. Keep staged rows in the Grid runtime; do not mirror them into form
state.

Then decide where the draft becomes persistent shape. The screen can map rows
to table writes at submit, or post the draft to one app-owned typed endpoint
that owns the transform and the transaction. Prefer the endpoint when the save
spans several tables, needs one transaction, or encodes a domain rule; put the
draft row type in the shared contract so both sides agree. Read
[../backend/parent-detail-transactions.md](../backend/parent-detail-transactions.md).

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

## Name The Form Instance's Type

Call `useForm` inside one concrete hook per form, and name that hook's return
type. Child components declare their `form` prop with that name:

```tsx
function useMealDraftForm(
  defaults: MealDraft,
  onSubmit: (value: MealDraft) => Promise<void>,
) {
  return useForm({
    defaultValues: defaults,
    onSubmit: ({ value }) => onSubmit(value),
  });
}

type MealForm = ReturnType<typeof useMealDraftForm>;

function ItemRow({ form, index }: { form: MealForm; index: number }) {
  return (
    <form.Field name={`items[${index}].quantity`}>
      {(quantityField) => (
        <Input
          value={quantityField.state.value}
          onChange={(event) => quantityField.handleChange(event.target.value)}
        />
      )}
    </form.Field>
  );
}
```

The hook is the only practical name. `useForm` has twelve type parameters and
no defaults, so `ReturnType<typeof useForm<MealDraft>>` fails to resolve and
every `form.Field` render prop under it becomes an implicit `any`.
`ReactFormExtendedApi` takes the same twelve arguments.

Keep `useForm` to one call per form. Validators and the submit handler belong
inside the hook so they stay part of the type.

For a form split across many levels, `createFormHook`'s `withForm` types each
piece from its own `defaultValues`. Do not set that up only to name a form
type.

## Validate The Draft And Map Submit Errors

TanStack Form accepts a Standard Schema (Zod, Valibot, ArkType) directly as a
validator, and form-level issues propagate to the named fields:

```ts
validators: { onChange: taskFormSchema }
```

It validates the schema's *input* type and discards transformed output, so a
schema that coerces or transforms must still be parsed inside `onSubmit` to get
the written value. Where fields come from table metadata, `parseCreateDraft()`
already reports required and invalid columns; do not restate those rules in a
second schema.

Server field issues arrive only after the write is attempted, so map them
inside `onSubmit`: catch the rejection, convert it, and call
`formApi.setErrorMap({ onSubmit: { form, fields } })`. Do not move the write
into `validators.onSubmitAsync` — a validator that writes has already changed
the database by the time validation "fails". Reserve `onSubmitAsync` for a
read-only pre-write check such as a remote uniqueness probe.

Clear a stale submit error once with a form-level listener, instead of calling
`setErrorMap` from every field's `onChange`:

```ts
listeners: {
  onChange: ({ formApi }) => {
    if (formApi.state.errorMap.onSubmit) {
      formApi.setErrorMap({ onSubmit: undefined });
    }
  },
}
```

## Follow The Library's Idioms

Sapporta does not wrap TanStack Form, so the library's own documentation stays
authoritative. Confirm each of these there rather than expanding it here:

- Read reactive form state with `useSelector(form.store, selector)` in
  component logic and `form.Subscribe` in JSX. `useStore` is deprecated. Never
  omit the selector.
- `isDirty` is persistent: a field edited and then restored to its loaded value
  stays dirty. Use `!isDefaultValue` for a "changed since saved" prompt.
- Reset or revalidate a dependent picker with field `listeners.onChange` and
  `validators.onChangeListenTo`, not a `useEffect`.
- `validationLogic: revalidateLogic()` validates on submit first and live after
  the first submit, which suits create and edit screens.
- Focus the first invalid control from `onSubmitInvalid`.
- Share create and edit defaults with `formOptions()`.
- Prefer `aria-disabled` over `disabled` on the submit button, and gate on
  `!canSubmit || isPristine` where an untouched submit is meaningless.

The guides live under
https://tanstack.com/form/latest/docs/framework/react/guides/ — `basic-concepts`,
`validation`, `submission-handling`, `reactivity`, `listeners`, `linked-fields`,
`arrays`, `dynamic-validation`, `focus-management`, `form-composition`. Append
`.md` to fetch the markdown with `curl`.

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

For the framework's own definitions, resolve the package and grep it:

```bash
PKG=$(dirname "$(node -p "require.resolve('@sapporta/frontend/package.json', { paths: ['packages/frontend'] })")")
rg -n "FormField|buildRecordFormFields|parseCreateDraft|LookupPicker" "$PKG/dist" --glob '*.d.ts'
```

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
