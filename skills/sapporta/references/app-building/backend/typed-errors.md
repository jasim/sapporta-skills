# Typed Domain Errors

If a contract declares an expected non-2xx response that can be raised below
the route adapter, use typed domain errors before implementing the handler.
Simple checks directly inside a handler can return declared `{ status, body }`
values instead.

Docs:

- Errors and endpoint patterns: https://sapporta.com/docs/guides/app-owned-features/errors-uploads-and-endpoint-patterns/
- Serialization and API errors: https://sapporta.com/docs/reference/contracts/serialization-and-api-errors/

## Pattern

1. Define one abstract error base per workflow family, near the code that raises
   the errors. The base carries HTTP status and a payload method.
2. Raise concrete subclasses at the point where the failure is first known.
3. Catch the family once at the route edge, return a declared `{ status, body }`
   with a stable payload, and rethrow everything else to the default 500 path.

Wrap the whole async handler body when adapter-stage parsing/extraction can
raise the same family. Each returned status must be declared in the shared
contract's `responses`.

## Status Semantics

- `409` -> the request is valid, but the resource is in a conflicting state.
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
- When a frontend action exposes the operation, catch `ApiError` and handle the
  declared status/body instead of replacing it with an unrelated envelope.
- Test one success result and every declared workflow failure that the service
  can raise.
