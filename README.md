# Sapporta Codex Skills

Operational guidance for agents creating or extending Sapporta applications.

The skill in `skills/sapporta` tells an agent how to scaffold a project, when to
choose each application workflow, which files to inspect or edit, which auth and
row-scope rules are non-negotiable, and which validation loop proves a change.
Sapporta is the reusable framework and library; a Sapporta application is a
downstream product project that depends on it and contains its own schema,
workflows, UI, and data.

Use the public documentation for product explanations, API shapes, CLI grammar,
TypeScript reference, and worked examples:

- Sapporta docs: https://sapporta.com/docs/
- Develop with a coding agent: https://sapporta.com/docs/guides/discovery/develop-with-a-coding-agent/
- Choose an application interface: https://sapporta.com/docs/guides/discovery/choose-an-application-interface/
- Reference index: https://sapporta.com/docs/reference/

The discoverable skill is in
[`skills/sapporta/SKILL.md`](skills/sapporta/SKILL.md). Supporting workflows are
ordinary files under `skills/sapporta/references/`, loaded only after the root
skill selects the relevant operational area.

Keep future skill changes concise and agent-facing. Link to the docs when a task
needs detailed Sapporta API behavior.

## Validate framework references

When the Sapporta framework checkout is available beside this repository, run:

```bash
node scripts/check-sapporta-reference-contract.mjs ../sapporta
```

The check keeps the form guidance and examples aligned with the framework's
public TanStack Form and Query exports, generated QueryClient seam, cache/Grid
effects, and generated agent instructions. CI checks the same contract against
the framework's `main` branch and strictly typechecks the compact form example.
After installing and building the adjacent framework checkout, run the same
typecheck locally with `--typecheck`.
