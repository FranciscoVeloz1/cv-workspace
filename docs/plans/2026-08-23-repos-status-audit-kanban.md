# Repos status audit and kanban tasks

**Goal:** Record each nested repo's health (README, purpose, production readiness, leftovers) in its README status line and in a kanban card tagged `projects`, without changing any non-README files inside `repos/*`.

**Architecture:** Execution is two write surfaces only: (1) `README.md` in each nested repo (create if missing); (2) kanban via `repos/kanban-cli/kanban` (create tag `projects`, then one task per folder). This plan lives at `docs/superpowers/plans/2026-08-23-repos-status-audit-kanban.md`. Do not edit source, CI, package.json, or other docs inside the nested repos.

**Tech stack:** Markdown READMEs; `repos/kanban-cli` against personal-api (`KANBAN_API_URL` in `repos/kanban-cli/.env`); description max 5000 chars. CLI has no checklist flags — pending work is markdown `- [ ]` inside `--description`.

## Global constraints

- Nested repos: README.md only. No source, tests, CI, or package.json edits.
- Do not commit unless the user later asks. Nested git repos will show dirty READMEs.
- Do not `kanban login` as the agent. If stderr is `Not logged in`, stop and ask the user to log in in their terminal.
- Tag name is exactly `projects`. Create it only if `list-tags` does not already contain it.
- Task title is exactly `Repo: <folder-name>` (folder name from `repos/`).
- Do not invent extra kanban fields. No `--deadline` unless asked.
- `/loop` is not part of this work. This is a one-shot audit. Do not arm a sleep timer.

## Status rubric

- **draft** — missing or template README, purpose unclear, or leftover scaffold
- **in progress** — purpose is clear, but tests, CI, deploy, or docs are still incomplete
- **production ready** — purpose is clear, runnable/deployed or complete as a data/CLI artifact, with real docs (license gaps may remain on the checklist)

## README change

Insert after the H1:

```markdown
## Status

- **Stage:** draft
- **Audited:** 2026-08-23
```

## Catalog (actual `repos/` folder names)

### draft

- `Mettaton-compiler` — Arduino/Mettaton uploader tree with a 1-line README and leftover `ejs-nodejs-template` package name. Pending: rewrite README for the real tool; document or drop vendored Arduino binaries; tests; CI; license.
- `React-Next-Dashboard` — stock create-next-app README; product purpose unclear. Pending: real README; decide keep vs archive; tests; CI.
- `Smart-house` — 2-line README; Johnny-Five + Express house controller. Pending: setup README (serial port, MySQL); `.env.example`; tests; CI; license.
- `boda-app` — no root README; workspaces `api`/`app` plus `bodaDB.sql`. Pending: root README (wedding guest app); env example; tests; CI.
- `cv-generator` — no README; `md-to-pdf` converter; npm test is a stub. Pending: README for convert paths; real tests; CI.
- `greed-island-card-api` — 2-line README; Puppeteer script; has a LICENSE file. Pending: document scrape vs `index.json`; tests; CI; ToS/legal note.
- `js-arrays-methods` — no README; `book.md` / `libro.md` notes. Pending: README stating this is a notes/book repo, not a library.
- `mettaton-v2` — 2-line README; TypeScript compiler to Arduino (`example.mtt`). Pending: language/CLI usage docs; tests; CI; license.
- `nexa-components-test` — stock Vite README. Pending: README that it is a harness for NexaRize-Components, or archive.
- `react-node-template` — 2-line README; React + Node workspaces. Pending: template usage (clone, rename, env); tests; CI.

### in progress

- `NexaRize-Components` — React utils README exists; no tests/CI/license. Pending: tests; CI; license; npm publish decision.
- `NexaRize-Electric-car` — EV experiment README; no tests/CI. Pending: tests; CI; license; hardware runbook.
- `arqueologIA-api` — strong API README; no tests/CI. Pending: tests; CI; license; production deploy.
- `car-history-app` — clear README + `deploy.yml`; no tests. Pending: tests; license; confirm deploy.
- `fitness-nutrition-tracker` — rich README + deploy; no tests. Pending: unit/e2e tests; license.
- `groceries-app` — static Mandado app; Pages deploy; no tests. Pending: tests; license; document vs `full-groceries-app`.
- `heic-to-png` — CLI README + tests; no CI. Pending: CI; license; publish decision.
- `job-scraper-cli` — CLI README + tests; no CI. Pending: CI; license.
- `kanban-cli` — documented CLI + tests; no CI. Pending: CI; license.
- `mintel` — IoT landing README; no tests/CI. Pending: tests; CI; license; live URL if any.
- `pdf-to-png` — CLI README + tests; no CI. Pending: CI; license.
- `rn-speed-art` — RN component library README; no tests/CI. Pending: tests; CI; license; npm publish status.
- `slides-generator` — strong README + tests; no CI. Pending: CI; license; optional Pages deploy.
- `user-management-app` — SPA README + tests; no CI. Pending: CI; license; deploy or document API-hosted path only.

### production ready

- `finance-app` — SPA + personal-api; tests; e2e; GitHub Pages. Pending: LICENSE; keep API CORS/secrets in sync.
- `full-groceries-app` — live Pages; tests; personal-api. Pending: LICENSE; align README title ("Mandado App") with folder name.
- `kanban-dashboard` — Pages deploy; unit + e2e. Pending: LICENSE.
- `personal-api` — CI, Railway, tests, solid README. Pending: LICENSE; keep `CORS_ORIGINS` current.
- `portfolio` — Pages deploy; tests; thin README. Pending: LICENSE; expand setup/deploy in README (status block only this pass).
- `recipe-app` — complete meal-plan dataset README. Pending: LICENSE.
- `resume-data-source` — resume JSON source of truth README. Pending: LICENSE.
- `screen-recorder` — live Pages; tests. Pending: LICENSE.

## Verification

```bash
python3 - <<'PY'
from pathlib import Path
root = Path('repos')
missing = []
for d in sorted(p for p in root.iterdir() if p.is_dir()):
    r = d / 'README.md'
    if not r.is_file() or '## Status' not in r.read_text(encoding='utf-8', errors='replace'):
        missing.append(d.name)
print('missing_status', missing or 'none')
PY

repos/kanban-cli/kanban list-tags
repos/kanban-cli/kanban list-tasks
```

Expect tag `projects` and 32 titles `Repo: <folder>`. Spot-check one draft, one in progress, one production ready with `show-task`.

Do not commit. Do not start `/loop`.
