---
name: user-code
description: >
  Use when the user wants backend workflow code to be easier to test, organize,
  or reason about. Covers TypeScript + Hono patterns for Sapporta domain
  services, modules, and logic that should stay independent of route adapters.
---

# User Code Patterns

Sapporta provides table and CRUD plumbing. Write reports, business logic,
workflows, and domain invariants as app code. Keep that code testable and
independent of Hono request objects.

Docs:

- Custom endpoints: https://sapporta.com/docs/subsystems/custom-api-endpoints/
- Auth and row security: https://sapporta.com/docs/reference/auth-and-row-security/
- LLM-assisted engineering: https://sapporta.com/docs/tools-and-operations/llm-assisted-engineering/

## Auth-Aware Workflow Code

Resolve auth in the route handler. Call the narrowest project
ability/data-authority helper once, pass a typed `{ db, auth }` context into
services/stores, and keep domain code independent of Hono.

Persistence code that touches scoped tables should use `scopedRows(db, auth,
table)` for ordinary CRUD and `auth.rowSecurity.forTable(table)` for custom
Drizzle queries, joins, transactions, aggregates, and multi-step writes.

Do not thread `workspace_id`, `workspaceId`, `scoped_to_user_id`, or
`scopedToUserId` through service inputs. Do not mutate by primary key alone,
fetch broadly and filter ownership in JavaScript, or let a client-provided
scope field decide row visibility.

When raw SQL is genuinely needed, keep it in the module's store layer rather
than in route or workflow code. Document why scoped helpers do not fit, and
preserve the same data-authority row predicate the corresponding scoped helper
would have applied.

## Routing

- Deep workflow failures that need specific HTTP statuses -> read
  [typed-errors/SKILL.md](typed-errors/SKILL.md)
