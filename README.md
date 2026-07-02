# Sapporta Codex Skills

Operational skills for agents working inside Sapporta projects.

The skills in `skills/sapporta` tell an agent when to choose a workflow, which
project files to inspect or edit, which auth and row-scope rules are
non-negotiable, and which validation loop proves a change. They are not the
Sapporta API reference.

Use the public documentation for product explanations, API shapes, CLI grammar,
TypeScript reference, and worked examples:

- Sapporta docs: https://sapporta.com/docs/
- LLM-assisted engineering: https://sapporta.com/docs/tools-and-operations/llm-assisted-engineering/
- API and tooling choices: https://sapporta.com/docs/tools-and-operations/choose-apis-and-tools/
- Reference index: https://sapporta.com/docs/reference/

The main skill is in [`skills/sapporta/SKILL.md`](skills/sapporta/SKILL.md).
Supporting skills are grouped under `skills/sapporta/` by operational area, such
as `table-creation`, `app`, `frontend`, `data-console`, and `report-creation`.

Keep future skill changes concise and agent-facing. Link to the docs when a task
needs detailed Sapporta API behavior.
