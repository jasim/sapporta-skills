# Table Definition Examples

To discover table-definition patterns, use the complete two-table tutorial and
the canonical references below. When `packages/api/schema/` contains only
project-authentication tables, take the fresh-app branch in
[create.md](create.md) before using these examples.

Use the canonical documentation:

- Complete starter schema: https://sapporta.com/docs/getting-started/define-projects-and-tasks/
- Tables, columns, and schema metadata: https://sapporta.com/docs/guides/model-data/tables-columns-and-schema-metadata/
- Search table rows and relationships: https://sapporta.com/docs/guides/model-data/search-indexes-and-display-metadata/
- Relationships and lookup behavior: https://sapporta.com/docs/guides/model-data/relationships-and-lookup-behavior/
- Schema changes and migrations: https://sapporta.com/docs/guides/model-data/schema-changes-and-migrations/
- Table definitions reference: https://sapporta.com/docs/reference/schema/table-definitions/
- Table and column metadata reference: https://sapporta.com/docs/reference/schema/table-and-column-metadata/
- Table validation reference: https://sapporta.com/docs/reference/schema/table-validation/
- Semantic value boundaries: https://sapporta.com/docs/reference/schema/semantic-value-boundaries/

Agent reminder: adapt examples to the current app's wrapper/import style, add
required `rowLabelColumns`, declare `rowScope`, and verify relationships with a
relationship inventory before generating a migration.
