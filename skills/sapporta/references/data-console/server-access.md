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
- Do not request a token for repository-only inspection or source changes.
- For protected endpoint discovery, live rows, or runtime read-back, ask the
  user to open `/account/profile` in the intended workspace, create an agent
  access token, choose **Copy setup prompt**, and paste that prompt into the
  trusted coding-agent session opened at the project root.
- Treat the setup prompt as secret-bearing. Reuse the project's existing mise,
  direnv, or dotenv tooling. If none exists, use a private gitignored wrapper;
  do not install a new environment manager for this purpose.
- Record the exact authenticated invocation in `AGENTS.md`, but never put the
  token there. Do not invent, transform, print, or store tokens in source,
  committed configuration, screenshots, shell history, or later task prompts.
- Verify the configured connection with the harmless read-only command
  `pnpm exec sapporta endpoints list`; request network permission when the
  sandbox requires it.
- A token belongs to one user and one workspace. To work in another workspace,
  the user needs a token created while that workspace is active.
- When auth fails during data-console work, stop and tell the user the targeted
  API URL and token-creation link, then repeat the setup-prompt workflow for the
  intended workspace. Manual `SAPPORTA_API_URL` and `SAPPORTA_API_TOKEN`
  configuration remains the fallback.
- Do not fall back to direct local SQLite/database access for workspace-user
  data answers or mutations unless the user explicitly asks for admin/debug
  inspection. If you do, state that it is local developer inspection, not
  workspace-user API behavior.

Token creation is in the browser-facing app at `/account/profile`, not
necessarily on the API origin. Prefer the app's configured public base URL when
available; otherwise derive the most likely local frontend URL from the dev
server output or environment.
