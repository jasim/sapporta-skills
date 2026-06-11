---
name: user-code
description: >
  Use when the user wants backend workflow code to be easier to test, organize,
  or reason about. Covers TypeScript + Hono patterns for Sapporta domain
  services, modules, and logic that should stay independent of route adapters.
---

# User Code Patterns

Sapporta generates plumbing (tables, CRUD, reports). Business logic,
workflows, and domain invariants are code you write — these patterns collect
the recurring craft decisions for that layer.

## Auth-Aware Workflow Code

Route adapters own auth resolution. They should call the narrowest project
ability/data-authority helper once, pass a typed `{ db, auth }` context into
services/stores, and keep domain code independent of Hono request objects.

Persistence code that touches scoped tables should use `scopedRows(db, auth,
table)` for ordinary CRUD and `auth.rowSecurity.forTable(table)` for custom
Drizzle queries, joins, transactions, aggregates, and multi-step writes. Do not
thread `workspace_id`, `workspaceId`, `scoped_to_user_id`, or `scopedToUserId`
through service inputs. Do not mutate by primary key alone, fetch broadly and
filter ownership in JavaScript, or let a client-provided scope field decide row
visibility.

Raw SQL belongs at the edge of a store only when the scoped helpers genuinely
do not fit. Document that reason next to the query and keep the same
data-authority row predicate the corresponding scoped helper would have applied.

## Routing

- **Raise deep-workflow failures as structured HTTP responses (422 / 502 / etc.)
  instead of bare 500s** → [typed-errors/SKILL.md](typed-errors/SKILL.md)
