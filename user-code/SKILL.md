---
name: user-code
description: >
  Patterns for the domain code you write in a Sapporta project — general
  TypeScript + Hono best practice, bundled so you get them by default. Not
  Sapporta-specific.
---

# User Code Patterns

Sapporta generates plumbing (tables, CRUD, reports). Business logic,
workflows, and domain invariants are code you write — these patterns collect
the recurring craft decisions for that layer.

## Routing

- **Raise deep-workflow failures as structured HTTP responses (422 / 502 / etc.)
  instead of bare 500s** → [typed-errors/SKILL.md](typed-errors/SKILL.md)
