# Master-Detail Insertion

Only insert parent-child data when the user has asked for a data change. Inspect
both table schemas first, identify the detail FK, and never fabricate values,
credentials, or foreign keys.

Docs:

- Agent data console recipes: https://sapporta.com/docs/tools-and-operations/agent-data-console-recipes/
- Generated table APIs: https://sapporta.com/docs/subsystems/generated-table-apis/
- Schema metadata: https://sapporta.com/docs/reference/full/schema-metadata/

## Workflow

1. Inspect both tables with `pnpm exec sapporta tables show <table>`.
2. Confirm the parent `meta.children` relationship when you expect generated
   request schemas to expose the child branch.
3. Identify the detail table FK column that references the parent.
4. Resolve any other FKs from visible app data.
5. Insert the parent with `$details` through
   `pnpm exec sapporta rows create <parent_table> --values '<json>'`.

The row create path inserts the parent, reads its primary key, backfills the
detail FK on each child row, inserts details in one transaction, and rolls back
on failure.

Critical rule: do not include the parent FK column in detail rows. The server
backfills it from the inserted parent.

Trusted scope fields are propagated by the server for
both parent and detail rows. Do not include `workspace_id`, `workspaceId`,
`scoped_to_user_id`, `scopedToUserId`, or server-managed references marked
`clientCanSet: false`.

For three or more hierarchy levels, chain commands: insert the first pair,
query the visible child IDs, then insert the next level.
