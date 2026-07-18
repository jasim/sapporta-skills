# CLI Server Access

Use this reference only for protected apps, non-default server URLs, remote
deployments, auth failures, or direct `curl` calls.

Docs:

- Agent access: https://sapporta.com/docs/guides/security/agent-access-and-scoped-tokens/
- CLI options: https://sapporta.com/docs/reference/cli/overview-and-global-options/
- OpenAPI discovery: https://sapporta.com/docs/guides/discovery/openapi-and-endpoint-discovery/
- Agent data console: https://sapporta.com/docs/guides/discovery/use-the-agent-data-console/

## Agent Procedure

- API-backed CLI commands call the selected running app. Pass `--api-url <url>`
  for non-default servers; otherwise the CLI uses its documented default.
- If a command fails with `APP_SERVER_UNREACHABLE`, follow the CLI message. It
  includes the resolved request URL and may mention sandbox network permission.
- For protected data work, ask the user for an agent access token from the app's
  account profile screen while signed in to the target workspace. The raw token
  is shown once and should be passed with `--api-token <token>`.
- Do not invent, transform, print, or store tokens in the project repository.
- A token belongs to one user and one workspace. To work in another workspace,
  the user needs a token created while that workspace is active.
- When auth fails during data-console work, stop and tell the user the targeted
  API URL, the token-creation link, and to expose the new active-workspace token
  with `--api-token <token>`.
- Do not fall back to direct local SQLite/database access for workspace-user
  data answers or mutations unless the user explicitly asks for admin/debug
  inspection. If you do, state that it is local developer inspection, not
  workspace-user API behavior.

Token creation is in the browser-facing app at `/account/profile`, not
necessarily on the API origin. Prefer the app's configured public base URL when
available; otherwise derive the most likely local frontend URL from the dev
server output or environment.
