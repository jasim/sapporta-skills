# Project Creation Dev Mode

Use this only when `SAPPORTA_DEV_MODE_PACKAGE_ROOT` is already set in the
environment, or when the user asks to use a `mise.toml` whose `[env]` section
sets it. That variable means the user is a Sapporta framework author testing a
local framework checkout, not a normal app builder using the published npm
package.

## Why This Exists

Do not run `pnpm dlx sapporta init <project-name>` in dev mode. `pnpm dlx`
downloads the latest published `sapporta` package and runs that package's
initializer templates, while `SAPPORTA_DEV_MODE_PACKAGE_ROOT` makes the created
project depend on the local framework checkout. Mixing a registry initializer
with local framework packages can generate code that does not match the local
framework API.

## Initializer Command

Resolve the local initializer from the framework checkout:

```bash
node "$SAPPORTA_DEV_MODE_PACKAGE_ROOT/packages/core/bin/sapporta.mjs" init <project-name>
```

If the value comes from `mise.toml`, export or prefix the command with that same
value, for example:

```bash
SAPPORTA_DEV_MODE_PACKAGE_ROOT=/path/to/sapporta node /path/to/sapporta/packages/core/bin/sapporta.mjs init <project-name>
```

Before running it, check that the file exists. If it does not, inspect the local
checkout for `sapporta.mjs` and report the mismatch instead of falling back to
`pnpm dlx`.

Keep `SAPPORTA_DEV_MODE_PACKAGE_ROOT` in the environment for the initializer,
dependency install, build, and dev server commands so generated package links
and runtime behavior all point at the same local Sapporta checkout.
