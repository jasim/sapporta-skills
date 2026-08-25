# Days And Time Zones

Timestamps are stored in UTC. A day is a calendar day in the **active
workspace's** time zone, not the host's and not the reader's. Every operation
that turns a stored instant into a day — a report bucket, a range filter, a
grid cell, a baseline — resolves it against that one zone.

- Contract, accessors, and codecs:
  https://sapporta.com/docs/reference/server/days-and-time-zones.md
- Bounding a range and bucketing by day:
  https://sapporta.com/docs/guides/reports/group-and-filter-by-day.md
- Where the zone lives and who may change it:
  https://sapporta.com/docs/guides/security/workspaces-ownership-and-row-visibility.md

## Never Read The Host Clock

`Temporal.Now.timeZoneId()` and `Temporal.Now.plainDateISO()` with no argument
read the host's `TZ`. A report built on either returns different rows depending
on how the container was started. A framework test fails the build for any
reader of an ambient zone.

- Server: `workspaceTimeZone(auth)` from `@sapporta/server`. It throws for a
  request with no workspace — an anonymous public route, or one holding only
  `systemGlobalOnly` authority. Design for that rather than defaulting to UTC.
- Frontend: `appTimeZone()` from `@sapporta/frontend/platform`. A plain value,
  no hook, nothing async — it is published before any route renders.
- Inject a clock as `Temporal.Instant`, never as a `PlainDate`. An instant
  names a moment and carries no zone; the handler resolves the day.
- Pass the zone into a mapper as an argument, the same way `asOf` is passed. A
  mapper that reads an ambient zone makes the same rows produce two datasets.
- `deviceTimeZone()` has two legitimate callers: the sign-up request, and
  `pnpm seed`, which puts the seeded workspace on the seeding machine's zone.

## Bound A Range, Then Group

`resolveDateRangeQueryBounds(name, params, zone, now)` returns both shapes a
column can be compared against. Pick by column type, and do not mix them:

- `date` column -> `period.days`, inclusive on both ends.
- `timestamp` column -> `period.instants`, **half-open**: compare `>= from` and
  `< until`. An inclusive upper bound on a timestamp column drops its own last
  day, and a bound built from `23:59:59` loses an hour across a DST transition.

Group with `to_tz_date(column, :zone)`. Bound the range in `WHERE` first — the
function costs ~6µs a row. Never `CREATE INDEX` over it. A bare `sqlite3` shell
does not have it; `sapporta sql query` does, because it runs on the app's own
connection.

## On Screen

- Render `ReportTimeZoneNote` from `@sapporta/frontend/report` in the toolbar of
  any report whose numbers depend on the zone.
- Do not add a per-user or per-device zone preference. The framework ships an
  owner-only Workspace settings screen; the zone is a workspace fact.
- Do not pass a `zone` option to a date or timestamp column, and do not convert
  CSV export or clipboard copy to display text — both keep the stored UTC
  instant on purpose.

## Inspect The Application

```bash
rg -n "Temporal\.Now\.(timeZoneId|plainDateISO)\(\)" packages
rg -n "resolveDateRangeQueryBounds|to_tz_date" packages/api
```

The first command must return nothing outside a `Temporal.Now.plainDateISO(zone)`
call that names its zone.
