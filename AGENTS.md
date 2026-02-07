# Repository Guidelines

## Project Structure & Module Organization
- `n8n_workflow_*.json` stores the main n8n workflows.
- `agents/` contains domain prompt specs (e.g., `agents/agent_EXECUCAO_FISCAL.md`).
- `test_cases/` holds FIRAC cases, reports, and the test runner.
- `scripts/` contains workflow validators and utilities.
- `knowledge_base/` is curated legal references (summulas, temas, mappings).
- `docs/` and `README.md` are the primary project docs and plans.
- `agent-ui/` and `agent-os/` are standalone subprojects with their own READMEs.
- `archive/` keeps legacy workflow exports.

## Build, Test, and Development Commands
- `node scripts/validators/validate_workflow.js n8n_workflow_v5.1_improved_prompts.json` validates JSON, code nodes, and graph wiring.
- `node scripts/validators/test_scenarios.js n8n_workflow_v5.1_improved_prompts.json` runs scenario checks.
- `cd test_cases; $env:WEBHOOK_URL="https://YOUR-N8N.app.n8n.cloud/webhook-test/lex-intelligentia-agentes"; node run_production_tests.js` executes webhook tests.
- `cd agent-ui; pnpm install; pnpm dev` runs the UI; `pnpm validate` runs lint/format/typecheck.

## Coding Style & Naming Conventions
- Use 2-space indentation for JSON/JS/TS files; keep Markdown headings in sentence case.
- Serena uses Black + Ruff with 140-char lines (see `serena/pyproject.toml`).
- Agent files: `agents/agent_<DOMAIN>.md` with uppercase domain names.
- Test cases: `test_cases/<domain>/caso_##_<slug>.json` and `caso_id` like `bancario_01`.
- Workflow files: `n8n_workflow_<name>_vX.Y.json`; update `README.md`/`CLAUDE.md` when versions change.

## Testing Guidelines
- Test cases follow FIRAC fields (`fatos`, `questoes`, `pedidos`, etc.) with `score_minimo` typically 70+.
- Use the curl/PowerShell examples in `test_cases/README.md` for single-case checks.
- Store notable runs as reports under `test_cases/test_results/`.

## Commit & Pull Request Guidelines
- Commits follow the existing Conventional Commits pattern: `feat(scope): ...`, `fix(agents): ...`, `docs: ...`, `refactor: ...`.
- PRs should list affected workflows/agents, link test evidence, and call out any n8n credential or env var changes.

## Security & Configuration
- Never commit secrets; use `.env.keys.template` as the template.
- Follow `docs/guides/credentials-setup.md` for n8n credentials and `migrations/init_db_audit_logs.sql` for audit logging schema.
