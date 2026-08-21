---
name: linkedin-job-search
description: Collect LinkedIn job listings via the local TypeScript CLI, assess them against a natural-language prompt in this chat, and render a Markdown priority table. Use when the user asks to find LinkedIn jobs, scrape LinkedIn offers, or generate a job-search targets report.
---

# LinkedIn Job Search (Chat Agent Protocol)

You are the AI for this project. There is no external model API. Follow this protocol exactly.

## Inputs

- User natural-language prompt (required)
- Optional clarifications for ambiguous filters (location, seniority, limit)

## Hard rules

1. Never invent compensation. Copy LinkedIn's listed value or use `Not listed`.
2. Never automate credentials or bypass CAPTCHA/challenges.
3. Cap qualified rows at the search spec `limit` (max 50).
4. Preserve source facts from `raw-jobs.json`; only add fit score, decision, fit reason, and apply advice.
5. Distinguish collection warnings (extraction failures) from low-fit / rejected decisions.

## Protocol

### 1. Parse the prompt into a search spec

Write `examples/` or a temp JSON file matching `SearchSpecSchema`:

```json
{
  "prompt": "<user prompt>",
  "keywords": ["..."],
  "locations": ["..."],
  "workModes": ["remote"],
  "recencyDays": 14,
  "exclusions": ["junior", "intern"],
  "limit": 20
}
```

- `limit` must be an integer 1–50
- Keep exclusions in the spec for agent filtering; do not invent LinkedIn query params for them
- If location, seniority, or work mode is materially ambiguous, ask one clarifying question before collecting

### 2. Collect

From `repos/linkedin-scrapper`:

```bash
npm run collect -- --spec <path-to-search-spec.json>
```

- A headed Chromium window opens with persistent profile `.browser-profile/`
- If LinkedIn asks for login, tell the user to sign in manually and wait
- On challenge/CAPTCHA, stop and instruct the user to complete it manually, then re-run
- Output: `.runs/<run-id>/raw-jobs.json` and `manifest.json`

### 3. Assess every raw job

Read `raw-jobs.json`. For each job:

1. Reject if it fails exclusions or clearly mismatches the prompt
2. Otherwise mark `qualified` and assign `fitScore` 0–10
3. Write concise `fitReason` and `applyAdvice` grounded only in the prompt + listing text

Write `assessments.json`:

```json
{
  "assessments": [
    {
      "jobId": "123",
      "decision": "qualified",
      "fitScore": 9,
      "fitReason": "Strong Python + React + AI match",
      "applyAdvice": "Lead with RAG and bilingual client delivery."
    }
  ]
}
```

### 4. Render

```bash
npm run render -- --run <.runs/run-id> --assessments <assessments.json>
```

### 5. Return to the user

- Path to the Markdown report under `results/`
- Count of qualified vs rejected
- Any collection warnings
- Do not paste cookies, credentials, or raw HTML snapshots

## Dry-run (fixture / offline)

Without LinkedIn:

1. Use `examples/sample-search-spec.json` and `examples/sample-raw-jobs.json` as stand-ins
2. Author `examples/sample-assessments.json`
3. Place them in a fake run dir and run `npm run render`

Expected artifact sequence:

1. `search-spec.json`
2. `.runs/<id>/raw-jobs.json` + `manifest.json`
3. `assessments.json`
4. `results/YYYY-MM-DD-HHmm-<slug>.md`

## Report columns

`# | Role | Company | Location | Work Mode | Posted | Est. Comp | Fit | Apply Advice | URL`
