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

## Routing

- **Raise deep-workflow failures as structured HTTP responses (422 / 502 / etc.)
  instead of bare 500s** → [typed-errors/SKILL.md](typed-errors/SKILL.md)
