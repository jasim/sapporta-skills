# Row Insertion

Only insert or change data when the user has asked for a data change. Inspect
the table schema first, stay within the requested tables, and never fabricate
values, credentials, or foreign keys.

Docs:

- Agent data console: https://sapporta.com/docs/guides/discovery/use-the-agent-data-console/
- Generated table APIs: https://sapporta.com/docs/guides/generated-surfaces/generated-table-apis/
- CLI row commands: https://sapporta.com/docs/reference/cli/table-row-and-report-commands/

## Workflow

1. Inspect the table with `pnpm exec sapporta tables show <table>`.
2. Sample visible data with `pnpm exec sapporta tables sample <table>`.
3. Resolve foreign keys from visible app data. Prefer table samples, table
   filters, lookup routes, or existing domain endpoints; use SQL only as a
   fallback/admin inspection tool.
4. Insert with `pnpm exec sapporta rows create <table> --values '<json>'`.
5. Verify with a table query, sample, or row get.

`--values` accepts a single JSON object or an array. Use column names exactly
as the schema exposes them, normally `snake_case`.

## Data Rules

- Provide the exact business values the user requested; do not silently coerce
  meaning.
- Omit generated columns such as `id`, `created_at`, and `updated_at`.
- Omit `workspace_id`, `workspaceId`,
  `scoped_to_user_id`, and `scopedToUserId`.
- Include required NOT NULL columns that the server will not generate.
- Never guess FK ids. If a referenced row does not exist and creating it is
  required, insert that row first through row commands or a domain endpoint.
- Prefer row commands over raw SQL because they run server validation, defaults,
  trusted ownership stamping, and visible-FK checks.
