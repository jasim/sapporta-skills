# Project Creation Dev Mode

Use this only for Sapporta framework-development work when
`SAPPORTA_DEV_MODE_PACKAGE_ROOT` is set or the user explicitly asks to create a
project from a local Sapporta checkout.

This is agent-operational guidance, not public product reference.

## Rules

- Treat the environment value as the source of truth for the local Sapporta
  checkout.
- Use the local initializer path from that checkout instead of the registry
  initializer.
- Do not silently fall back to `pnpm dlx` or `npx` when the user requested local
  dev mode; that would test the published package instead of the local checkout.
- After generation, run the same install, dev-server, and browser verification
  loop as the normal project-creation workflow.
- If the local initializer path is missing, inspect the local Sapporta checkout
  before guessing a replacement path.
