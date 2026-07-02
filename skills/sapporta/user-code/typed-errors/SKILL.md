---
name: typed-errors
description: >
  Use when backend workflow code needs to return a specific actionable HTTP
  error instead of collapsing to a 500. Defines domain error subclasses with
  status/body data and dispatches them at the HTTP edge.
---

# Typed Domain Errors

Use typed domain errors when workflow facts raised deep in service code should
return actionable non-500 responses. Simple checks directly inside a handler can
return declared `{ status, body }` values instead.

Docs:

- Custom endpoint errors: https://sapporta.com/docs/subsystems/custom-api-endpoints/#errors

## Pattern

1. Define one abstract error base per workflow family, near the code that raises
   the errors. The base carries HTTP status and a payload method.
2. Raise concrete subclasses at the point where the failure is first known.
3. Catch the family once at the route edge, return `{ status, body }`, and
   rethrow everything else to the default 500 path.

Wrap the whole async handler body when adapter-stage parsing/extraction can
raise the same family. Each returned status must be declared in the shared
contract's `responses`.

## Status Semantics

- `422` -> request parsed, but the workflow cannot accept what the server
  derived or validated.
- `502` -> an upstream service failed or returned unusable data.
- `400` / `404` -> usually return directly in the handler for one-off checks,
  unless the failure is naturally raised deep inside the workflow.

## Conventions

- One base per workflow family, not a shared cross-module `ApiError`.
- Keep the base module-private unless another module also catches or raises it.
- Set `this.name` in subclasses for useful logs.
- Use snake_case payload keys to match wire conventions.
