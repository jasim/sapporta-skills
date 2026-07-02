# Table Definition Reference

Do not maintain a second table-definition API reference in this skill.

Use the canonical documentation:

- Table definitions: https://sapporta.com/docs/reference/table-definitions/
- Schema metadata: https://sapporta.com/docs/reference/full/schema-metadata/
- Data modeling guide: https://sapporta.com/docs/subsystems/data-modeling/
- Auth and row security: https://sapporta.com/docs/reference/auth-and-row-security/

Agent reminder: keep schema edits in `packages/api/schema/`, derive row types
from Drizzle exports, declare row scope explicitly, and hide system-managed
scope fields from generated screens.
