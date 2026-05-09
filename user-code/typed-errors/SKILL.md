---
name: typed-errors
description: >
  Make each domain failure its own error subclass that owns its HTTP status and
  JSON body, and dispatch them with a single shim at the HTTP edge. Use when
  deep workflow code needs to signal a specific failure a caller can act on
  (data-consistency violation, upstream dependency down, unprocessable input)
  instead of collapsing to a 500.
---

# Typed Domain Errors

Hono turns any uncaught `Error` into 500 + stack trace. Right for server faults
— wrong for *workflow facts* a caller could act on. Each such fact deserves
its own status and JSON shape; none should look like a crash.

**The core move**: the error class *is* the HTTP response. It carries the
status, it carries the payload, and a single shim at the HTTP edge translates
it to the wire. Handler code never rebuilds the payload, and never re-derives
it from flags threaded up the stack.

## The pattern

Three touchpoints — define, raise, catch — each with one home.

### 1. Define — an abstract base per family

One base per workflow family, co-located with the code that raises. It declares
the two things that define an HTTP response:

```typescript
// src/<domain>/errors.ts
export abstract class ApiWorkflowError extends Error {
  abstract readonly status: number;
  abstract toPayload(): Record<string, unknown>;
}
```

A concrete subclass fills both in, carrying whatever data the payload needs:

```typescript
export class DataConsistencyError extends ApiWorkflowError {
  readonly status = 422;
  constructor(
    readonly computed: number,
    readonly expected: number,
    readonly tolerance: number,
  ) {
    const diff = Math.abs(computed - expected);
    super(`Computed ${computed} ≠ expected ${expected} (Δ${diff}, tol ${tolerance})`);
    this.name = "DataConsistencyError";
  }
  toPayload() {
    return {
      error: "data_consistency",
      message: this.message,
      computed: this.computed,
      expected: this.expected,
      difference: Math.abs(this.computed - this.expected),
      tolerance: this.tolerance,
    };
  }
}
```

### 2. Raise — at the point of knowledge

Throw on the line where the failure is first known — not later, where it
happens to be convenient to handle. Threading a boolean up the stack for the
handler to re-check is the anti-pattern this pattern exists to kill.

### 3. Catch — one shim per handler family

A single shim catches the base class, returns a `{ status, body }` reply,
and re-throws anything else to Hono's default 500 path. The handler
itself uses `api.register(name, route, handler)` and returns
`{ status, body }` directly:

```typescript
// src/app/<domain>-handlers.ts
import { ApiWorkflowError } from "../<domain>/errors.js";

api.register("postEntry", postEntryContract.postEntry, async ({ request, c }) => {
  try {
    const input = await extractInput(request.body);   // adapter-stage subclass
    const result = await runWorkflow(argsFrom(request.body, input), c.get("db"));
    return { status: 200, body: result };
  } catch (err) {
    if (err instanceof ApiWorkflowError) {
      return { status: err.status, body: err.toPayload() } as never;
    }
    throw err;
  }
});
```

Wrap the **whole** async body, not just the workflow call. Adapter steps
before the workflow — parsing, extraction, fetching — should raise from
the same family and be caught by the same handler-level `try`.

Each `err.status` returned must be declared in the contract's
`responses` (e.g. `{ 200: ..., 422: ..., 502: ... }`); the cast to
`never` is the documented escape hatch for the union the contract
declares but TypeScript can't narrow `err.status` against. If the
generic-helper form is preferred, write a thin shim per handler family
that pattern-matches on the concrete error class (so the return type
narrows to a known status) instead of a one-size-fits-all generic.

## Status semantics

- **422** — request was well-formed, but what the server derived doesn't hold
  up: data-consistency violations, input that parsed but yielded nothing
  usable, required-but-derived values missing.
- **502** — an upstream we call out to (LLM, external API) failed or returned
  garbage. Our server is fine; its dependency isn't.
- **400 / 404** — for one-off checks *inside a handler*, plain
  `return { status: 404, body: { error: "..." } }` is still the default
  (see `app/SKILL.md`) — but only if `404` is declared in the contract's
  `responses`. Otherwise reach for the `Response` escape hatch.
  Typed errors earn their weight only when the check lives deep inside
  a workflow the handler can't see into.

## Scoping

- **One base per family, not a shared cross-module `ApiError`.** A shared base
  couples modules that should stay independent.
- **Re-export from a package root** only when another module also catches or
  raises the class. Otherwise keep it module-private.

## Conventions

- **Set `this.name`** in the subclass constructor — it's what shows up in logs
  and `JSON.stringify(err)`.
- **Snake_case payload keys** (`computed_final`, not `computedFinal`) to match
  the wire convention.
