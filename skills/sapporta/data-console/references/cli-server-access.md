# CLI Server Access

Use this reference only when the task involves a protected app, a non-default
server URL, a remote deployment, auth failures, or direct `curl` calls.

## Target The App

API-backed CLI commands call the selected running app:

```bash
export SAPPORTA_API_URL="http://localhost:3000"
pnpm exec sapporta describe
```

If `SAPPORTA_API_URL` is unset, the CLI uses `http://localhost:3000`. For a
single command, pass `--api-url`; command flags override environment variables.

Local commands do not need a server:

```bash
pnpm exec sapporta check
pnpm exec sapporta init my-app
```

## Authenticate Protected Apps

Protected apps need an agent access token created from the app's account profile
screen. The raw token is shown once. Use it as `SAPPORTA_API_TOKEN`:

```bash
export SAPPORTA_API_URL="https://app.example.com"
export SAPPORTA_API_TOKEN="spat_..."

pnpm exec sapporta describe
pnpm exec sapporta tables
pnpm exec sapporta reports
```

For one command, pass `--api-token`. Do not invent, transform, or store tokens
in the project repository.

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

The CLI can call built-in table, report, row, SQL, and metadata commands. It
does not directly invoke arbitrary user-defined endpoints.

## Auth Failures

- `unauthenticated`: set or replace `SAPPORTA_API_TOKEN`.
- `token_expired`: ask the user to create a replacement token.
- `token_revoked`: stop using that token.
- `workspace_required`: the token no longer maps to a valid workspace
  membership.
- `forbidden`: the user or token cannot perform that action.

Fix auth failures before composing more table, report, SQL, or custom endpoint
requests.
