# CLI Server Access

Use this reference only for protected apps, non-default server URLs, remote
deployments, auth failures, or direct `curl` calls.

## What Needs A Token

Against a local development server, `pnpm exec sapporta endpoints list` and
`endpoints show "<METHOD> <path>"` need no token. Every other API-backed command
— `rows`, `sql`, `api`, `tables` — needs `SAPPORTA_API_TOKEN`. Against a
deployment, `endpoints` needs one too. Read schema from `endpoints`, not
`tables show`.

Why the split, and the policy that controls it:
https://sapporta.com/docs/guides/security/agent-access-and-scoped-tokens.md

Docs:

- Agent access: https://sapporta.com/docs/guides/security/agent-access-and-scoped-tokens.md
- CLI options: https://sapporta.com/docs/reference/cli/overview-and-global-options.md
- OpenAPI discovery: https://sapporta.com/docs/guides/discovery/openapi-and-endpoint-discovery.md
- Agent data console: https://sapporta.com/docs/guides/discovery/use-the-agent-data-console.md

## Agent Procedure

- API-backed CLI commands call the selected running app. Run them from inside
  the project, where the CLI resolves the app's port from `SAPPORTA_API_PORT` in
  `.env.development`. Pass `--api-url <url>` only to reach a different
  deployment.
- If a command fails with `APP_SERVER_UNREACHABLE`, follow the CLI message. It
  includes the resolved request URL and may mention sandbox network permission.
- Do not request a token for repository-only inspection or source changes.
- Do not request a token for endpoint discovery against a local development
  server; run `endpoints list` first and only ask if it fails.
- For live rows, runtime read-back, or discovery against a protected
  deployment, ask the user to open `/account/profile` in the intended
  workspace, create an agent access token, choose **Copy setup prompt**, and
  paste that prompt into the trusted coding-agent session opened at the project
  root.
- Only a signed-in person can create a token. On a freshly scaffolded app there
  is no user yet, so state plainly that data commands are unavailable until the
  user signs up and creates one. Do not create an account to work around this,
  and do not rebuild the CLI's job with hand-rolled sign-up calls, cookie jars,
  and fetch wrappers.
- Treat the setup prompt as secret-bearing. Reuse the project's existing mise,
  direnv, or dotenv tooling. If none exists, use a private gitignored wrapper;
  do not install a new environment manager for this purpose.
- Record the exact authenticated invocation in `AGENTS.md`, but never put the
  token there. Do not invent, transform, print, or store tokens in source,
  committed configuration, screenshots, shell history, or later task prompts.
- Verify a configured token with `pnpm exec sapporta api get '/api/auth-context'`.
  The reply names the user and workspace the token acts as. Do not verify with
  `endpoints list`, which answers without a credential on a local development
  server, and do not verify with `rows count`, which needs a table a fresh app
  does not have. Request network permission when the sandbox requires it.
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
