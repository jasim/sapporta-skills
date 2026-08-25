# Parent-Detail Transactions

<!-- vendored-from: https://sapporta.com/docs/guides/app-owned-features/parent-detail-transactions.md -->

Vendored copy of the canonical parent-detail recipe. Use it directly; do not
fetch the upstream page to obtain this code.

A parent-detail create is one domain operation. It validates referenced rows,
creates the parent, authors each detail's parent key on the server, and commits
every write or none of them. Resolve authentication and ability at the route
edge before calling this workflow.

## Guard Every Table In The Transaction

Create one row-security guard for every participating table. Scope
referenced-row reads in SQL. Pass parent keys and other trusted fields through
`serverValues`; never copy ownership or parent keys from client input.

`forTable()` takes the table definition (`parents`); Drizzle statements take the
Drizzle table (`parentsTable`). Those are two different exports.

```ts
import { eq } from "drizzle-orm";

const parentAccess = auth.rowSecurity.forTable(parents);
const detailAccess = auth.rowSecurity.forTable(details);
const referencedAccess = auth.rowSecurity.forTable(referencedRows);

const result = db.transaction((tx) => {
  const referenced = tx
    .select({ id: referencedRowsTable.id })
    .from(referencedRowsTable)
    .where(
      referencedAccess.ownedRows(
        eq(referencedRowsTable.id, input.referenced_id),
      ),
    )
    .get();

  if (!referenced) throw new ReferencedRowNotFoundError();

  const parentValues = parentAccess.insertValuesSync(tx, input.parent);
  const parent = tx
    .insert(parentsTable)
    .values(parentValues as typeof parentsTable.$inferInsert)
    .returning({ id: parentsTable.id })
    .get();

  const insertedDetails = input.details.map((detail) => {
    const detailValues = detailAccess.insertValuesSync(tx, detail, {
      serverValues: { parent_id: parent.id },
    });

    return tx
      .insert(detailsTable)
      .values(detailValues as typeof detailsTable.$inferInsert)
      .returning()
      .get();
  });

  return { parent, details: insertedDetails };
});
```

`insertValuesSync()` rejects caller ownership fields and server-managed
references, merges trusted `serverValues`, validates final foreign-key
visibility, and stamps request ownership. It prepares values for Drizzle; the
workflow still executes each insert and returns the result.

## Declare The Child Key Server-Owned

The detail row's parent key is authored on the server. Declaring that in table
metadata is what turns a caller who submits it into a refusal:

```ts
// On the detail table: either declaration removes the key from the insert shape.
references: { parent_id: { apiSettable: false } }
columns: { parent_id: { apiWritable: false } }
```

With the declaration, a request carrying `parent_id` answers `422
VALIDATION_FAILED` naming that column, and writes nothing. Without it, the same
request answers `201` and the server's parent key silently replaces the value
the caller sent. The row is correct either way, and the caller is told nothing
about the value it lost.

This is also what the generated master-with-`$details` create branch relies on,
so a table that declares `meta.children` should declare the child key
non-writable on the same pass.

The default `better-sqlite3` transaction callback is synchronous. Keep database
reads, writes, and synchronous row-security preparation inside it. Perform mail,
storage, network, and other awaited effects after commit. Leave the callback
synchronous: marking it `async` or awaiting work inside it breaks the
all-or-nothing guarantee.

## Prove All-Or-Nothing Behavior

Use an isolated fixture and verify:

- a valid parent and every detail commit together;
- an invisible referenced row follows the declared concealed-not-found branch;
- caller-supplied ownership fields are rejected;
- a caller-supplied parent key is refused with `422` where the detail table
  declares that reference `apiSettable: false`, and is silently replaced by the
  server's parent key where it does not;
- a failure on any detail insert leaves no parent or earlier detail rows; and
- returned IDs and server-authored values match authoritative read-back.

When the contract declares the concealed-not-found branch as an expected
non-2xx outcome, read [typed-errors.md](typed-errors.md) before implementing
`ReferencedRowNotFoundError` and the handler that translates it.

## Canonical Docs

Fetch these with `curl -sL` only when you need behavior beyond the recipe above:

- https://sapporta.com/docs/guides/app-owned-features/parent-detail-transactions.md
- https://sapporta.com/docs/guides/app-owned-features/domain-workflows-and-transactions.md
- https://sapporta.com/docs/reference/server/row-scoped-data-helpers.md
