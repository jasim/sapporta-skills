# Sapporta Codex Skills

Sapporta is a TypeScript library and application framework for building database-backed apps. It gives projects a schema-as-code data layer, auto-generated CRUD endpoints, hierarchical reports, and a place for product-specific domain code as Hono/ts-rest sub-apps.

This repository contains agentic skills for working inside Sapporta projects. The skills teach the coding agent Sapporta conventions, CLI commands, project layout, and implementation patterns for common tasks such as:

- Discovering tables and endpoints.
- Creating and modifying schema-as-code tables.
- Inserting and querying data safely.
- Writing Hono/ts-rest application endpoints.
- Building custom frontend views.
- Creating, linking, and running reports.
- Troubleshooting common native-module and SQLite issues.

The main skill is in [`skills/sapporta/SKILL.md`](skills/sapporta/SKILL.md). Supporting skills are grouped under `skills/sapporta/` by area, such as `table-creation`, `app`, `frontend`, and `report-creation`.

## Installation

Install the skill with the `skills` CLI:

```bash
npx skills add https://github.com/jasim/sapporta-skills --skill sapporta
```

The skill should appear as `sapporta` and will be invoked when you work in a Sapporta project or ask about Sapporta tables, reports, endpoints, frontend views, or CLI workflows.
