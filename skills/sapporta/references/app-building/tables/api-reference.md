# Table Definition Reference

Use the canonical documentation for table-definition API details.

Use the canonical documentation:

- Table definitions: https://sapporta.com/docs/reference/schema/table-definitions.md
- Table and column metadata: https://sapporta.com/docs/reference/schema/table-and-column-metadata.md
- Tables, columns, and schema metadata: https://sapporta.com/docs/guides/model-data/tables-columns-and-schema-metadata.md
- Search table rows and relationships: https://sapporta.com/docs/guides/model-data/search-indexes-and-display-metadata.md
- Relationships and lookup behavior: https://sapporta.com/docs/guides/model-data/relationships-and-lookup-behavior.md
- Auth and row security: https://sapporta.com/docs/reference/server/auth-and-row-security.md

Agent reminder: keep schema edits in `packages/api/schema/`, derive row types
from Drizzle exports, declare row scope explicitly, and hide system-managed
scope fields from generated screens.
