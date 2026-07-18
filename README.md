# Sapporta Codex Skills

Operational guidance for agents working inside existing Sapporta applications.

The skill in `skills/sapporta` tells an agent when to choose a workflow, which
application files to inspect or edit, which auth and row-scope rules are
non-negotiable, and which validation loop proves a change. Sapporta is the
reusable framework and library; a Sapporta application is a downstream product
project that depends on it and contains its own schema, workflows, UI, and data.

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
