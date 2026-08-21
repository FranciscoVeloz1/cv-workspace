# LinkedIn Job Agent

Agent-operated LinkedIn job collector and Markdown reporter for the Cursor chat agent.

The chat agent interprets your natural-language prompt, drives collection, scores listings, and writes apply advice. This package provides deterministic collection and rendering tools only — no external model API keys.

## Setup

```bash
cd repos/linkedin-scrapper
npm install
npx playwright install chromium
```

## Chat usage

Ask the agent something like:

> Find senior fullstack AI roles (Python + React), LATAM/Americas remote, top 20.

The agent should follow [`.agents/skills/linkedin-job-search/SKILL.md`](.agents/skills/linkedin-job-search/SKILL.md):

1. Build a search spec JSON (`limit` 1–50)
2. Run `npm run collect -- --spec <spec.json>` (manual LinkedIn login if needed)
3. Assess `raw-jobs.json` → write `assessments.json`
4. Run `npm run render -- --run <.runs/id> --assessments <assessments.json>`
5. Return the Markdown path under `results/`

## Commands

| Command | Purpose |
| --- | --- |
| `npm run collect -- --spec <file>` | Collect jobs via headed Playwright |
| `npm run collect -- --spec <file> --run-dir <.runs/id>` | Resume/write into a specific run dir |
| `npm run render -- --run <.runs/id> --assessments <file>` | Validate assessments and write Markdown |
| `npm test` | Unit + fixture tests (no live LinkedIn) |
| `npm run typecheck` | Strict TypeScript check |

## Outputs

- `.browser-profile/` — persistent Chromium profile (gitignored)
- `.runs/<run-id>/raw-jobs.json` — collected listings
- `.runs/<run-id>/manifest.json` — prompt, counts, warnings
- `.runs/<run-id>/checkpoint.json` — resume state
- `.runs/<run-id>/diagnostics/` — redacted failure snapshots only
- `results/YYYY-MM-DD-HHmm-<slug>.md` — final report

## Report columns

`# | Role | Company | Location | Work Mode | Posted | Est. Comp | Fit | Apply Advice | URL`

Compensation is copied only when LinkedIn lists it; otherwise the cell is `Not listed`.

## Login tips

Google may block OAuth inside automation browsers (`This browser or app may not be secure`). Prefer one of:

1. **LinkedIn email + password** in the opened window (not “Continue with Google”)
2. System browser launch (auto-detects Brave/Chrome via `LINKEDIN_BROWSER_EXECUTABLE` if needed)
3. Complete any LinkedIn challenge manually; never automate CAPTCHA bypass

- Manual LinkedIn login only
- No credential automation, CAPTCHA bypass, or aggressive crawling
- Conservative randomized pacing between page loads
- Browser profile, run artifacts, and diagnostics are gitignored
- Final Markdown reports in `results/` are normal project files

## Offline dry-run

```bash
mkdir -p .runs/sample-dry-run
cp examples/sample-raw-jobs.json .runs/sample-dry-run/raw-jobs.json
cp examples/sample-manifest.json .runs/sample-dry-run/manifest.json
npm run render -- --run .runs/sample-dry-run --assessments examples/sample-assessments.json
```

## Manual smoke-test checklist

1. `npx playwright install chromium`
2. Create a one-result search spec (`limit: 1`)
3. `npm run collect -- --spec <spec.json>` and sign in manually if prompted
4. Confirm one search card and one detail page are collected
5. Write assessments and run `npm run render`
6. Confirm report has no invented compensation
7. Confirm `.browser-profile/` and `.runs/` remain untracked
8. `npm test && npm run typecheck`

### Smoke findings (2026-07-24)

- Chromium install and persistent `.browser-profile/` launch succeeded.
- Guest (logged-out) LinkedIn search HTML uses slug URLs and `data-entity-urn`; extractors handle both guest and authenticated layouts.
- One-job live collect succeeded: search card + detail → `raw-jobs.json` with `compensation: "Not listed"` when salary absent.
- Render produced `results/…-smoke-test-one-ai-engineer-remote-role.md` with expanded columns.
- `.browser-profile/` and `.runs/` are gitignored; final Markdown reports under `results/` are kept.
- For richer authenticated layouts and session reuse, sign in manually in the headed browser on first run.
