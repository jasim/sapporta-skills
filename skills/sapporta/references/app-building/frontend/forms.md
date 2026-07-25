# Domain Forms

Use this file as a routing page. Canonical Sapporta documentation owns exact
exports, behavior, examples, and invariants:

Generated projects install TanStack Query and TanStack Form. They mount one
QueryClient and keep its application-wide policy in the workspace-owned
`packages/frontend/src/query-client.ts` file.

- Custom forms and cached table reads:
  https://sapporta.com/docs/guides/app-owned-features/custom-forms-and-table-queries/
- Generated record surfaces and form helpers:
  https://sapporta.com/docs/reference/frontend/generated-record-surfaces/
- Table query options:
  https://sapporta.com/docs/reference/frontend/table-query-options/
- Generated record screens and forms:
  https://sapporta.com/docs/guides/generated-surfaces/record-screens-and-forms/
- Relationships and lookup behavior:
  https://sapporta.com/docs/guides/model-data/relationships-and-lookup-behavior/
- Serialization and API errors:
  https://sapporta.com/docs/reference/contracts/serialization-and-api-errors/

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
- Read [grids.md](grids.md) when the form contains a substantial collection or
  a staged multi-row draft.

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

## Preserve These Boundaries

- Reuse the generated TanStack Query provider and workspace-owned
  `packages/frontend/src/query-client.ts`. Use
  `tableRecordQueryOptions()` and `tableRecordsPageQueryOptions()` with
  `tableQueryKeys` for generated table reads.
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
rg -n "FormField|buildRecordFormFields|parseCreateDraft|LookupPicker" packages/frontend/src node_modules/@sapporta
rg -n "createApiClient|getApiBase" packages/frontend/src/api.ts packages/frontend/src
```

The local files under `form-template/` are secondary structural examples. Use
them only after reading the public guide. Adapt domain names, schemas, routes,
cache effects, error mapping, and layout; do not treat application-placeholder
imports as framework exports.

## Validate The Workflow

Ideally in a separate agent/subagent/thread/coding agent task, run the
application's frontend typecheck, tests, and build. Exercise loading,
cancellation, create and edit initialization, dirty-value preservation, required
and optional values, static-combobox and foreign-key lookup fields, server field
issues, query invalidation, Grid reload, authorization, and success navigation.
