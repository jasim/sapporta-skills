# CLI Server Access

Use this reference only when the task involves a protected app, a non-default
server URL, a remote deployment, auth failures, or direct `curl` calls.

## Target The App

API-backed CLI commands call the selected running app:

```bash
export SAPPORTA_API_URL="http://localhost:3000"
pnpm exec sapporta describe
```

If a command fails with `APP_SERVER_UNREACHABLE`, follow the CLI message. It
includes the resolved request URL and tells whether to check the app server or
rerun with network permission in a sandboxed coding-agent environment.

If `SAPPORTA_API_URL` is unset, the CLI uses `http://localhost:3000`. For a
single command, pass `--api-url`; command flags override environment variables.

For creating a new Sapporta project from scratch, use the main project creation
workflow instead of this server-access reference.

Token creation is in the browser-facing app at `/account/profile`, not
necessarily on the API origin. Prefer `SAPPORTA_PUBLIC_BASE_URL` from the
environment or `.env.development`; otherwise use `FRONTEND_DEV_PORT` with
`http://localhost`, same-origin `SAPPORTA_API_URL`, or the default
`http://localhost:5173`. Example:
`http://localhost:5173/account/profile`.

## Authenticate Protected Apps

Protected data-management work needs an agent access token created from the
app's account profile screen while signed in to the target workspace. The raw
token is shown once. Use it as `SAPPORTA_API_TOKEN`:

```bash
export SAPPORTA_API_URL="https://app.example.com"
export SAPPORTA_API_TOKEN="spat_..."

pnpm exec sapporta describe
pnpm exec sapporta tables
```

For one command, pass `--api-token`. Do not invent, transform, print, or store
tokens in the project repository.

## Workspace Scope

An agent token belongs to one user and one workspace. Ordinary data commands do
not send a workspace id; the token selects the workspace. If the user asks for a
different workspace, they need a token created while that workspace is active.

## Custom Endpoints

Use `sapporta describe` to inspect custom endpoints, then call them with `curl`
or another HTTP client:

```bash
pnpm exec sapporta describe "POST /api/invoices/void"

curl -fsS \
  -H "Authorization: Bearer ${SAPPORTA_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"reason":"duplicate"}' \
  "${SAPPORTA_API_URL}/api/invoices/123/void"
```

The CLI can call built-in table, row, SQL, and metadata commands. Reports are
app-owned routes, so inspect them with `sapporta describe` and call them with
`curl` or another HTTP client. The CLI does not directly invoke arbitrary
user-defined endpoints.

## Auth Failures

- `unauthenticated`: set or replace `SAPPORTA_API_TOKEN`.
- `token_expired`: ask the user to create a replacement token.
- `token_revoked`: stop using that token.
- `workspace_required`: the token no longer maps to a valid workspace
  membership.
- `forbidden`: the user or token cannot perform that action.

When one of these appears during data-console work, stop and tell the user the
targeted API URL, the `/account/profile` token-creation link, and to expose the
new active-workspace token as `SAPPORTA_API_TOKEN`.

Fix auth failures before composing more table, report route, SQL, or custom
endpoint requests. Do not fall back to direct local SQLite/database access for
workspace-user data answers or mutations unless the user explicitly asks for
admin/debug inspection; if you do so, state that it is local developer
inspection, not workspace-user API behavior.
