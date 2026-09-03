---
name: job-scraper-cli
description: Runs repos/utils/job-scraper-cli against public remote job feeds, ranks listings against resume-data-source skills, and writes a full markdown proposal document of matching positions. Use when the user asks to scrape jobs, find contractor or remote roles, generate a job-search report, or produce proposed job positions from job-scraper-cli.
---

# job-scraper-cli

Search **public** remote job feeds with `repos/utils/job-scraper-cli` and **bring as output a full document with the proposal job positions**. Do not scrape or automate LinkedIn. Do not call board APIs with ad-hoc `curl`/`fetch` — run this CLI.

Candidate default (Mexico-based, US contractor search): remote / Americas, software roles, prefer contractor; drop US-only location and “authorized to work in the United States”. The CLI already applies those filters and scores skill overlap (+1 contractor).

## Inputs

Resolve from the user message. Unspecified → defaults.

| Input | Default | Maps to |
|-------|---------|---------|
| `limit` | `15` | `--limit` |
| `min-score` | `2` | `--min-score` |
| `resume` | CLI default (`repos/personal-projects/resume-data-source/index.json` from this package) | `--resume` |
| `browser` | `false` | omit Playwright; pass `--no-browser` |
| `title-keywords` | none | post-filter JSON: title or tags must match at least one (case-insensitive) |
| `exclude-companies` | none | post-filter JSON: drop exact/substring company names |
| `must-have-skills` | none | post-filter JSON: `matched` must include all of these (resume skill names) |
| `top-picks` | `3` | first N remaining rows after sort (already score-desc) |
| `excerpt-chars` | `400` | trim `job.description` in the document |
| `output-path` | `repos/utils/job-scraper-cli/proposals/YYYY-MM-DD-job-proposals.md` (today’s date, local) | write the document; also paste it in the reply |

If the user names a role (“staff frontend”, “Python backend”), put those words in `title-keywords`. If they name companies to skip, use `exclude-companies`.

## Invoke

From `repos/utils/job-scraper-cli` (workspace: `/home/francisco/repos/cv-workspace/repos/utils/job-scraper-cli`):

```bash
npm install
npx tsx src/main.ts --json --no-browser --limit 15 --min-score 2
```

Add `--resume <path>` only when `resume` is not the default. Omit `--no-browser` only when `browser` is true **and** a source came back empty (stderr `no jobs returned`). Prefer `--no-browser` for agent runs.

Shell needs **network** (`full_network` or `all`). Node 22+.

Capture **stdout** as ranked JSON. **stderr** is source failures / empty sources — put it in the document appendix, do not treat as fatal unless stdout is empty / exit `1` (`No matching jobs`).

JSON rows:

```ts
{ job: { id, source, title, company, url, location, employment, description, tags, salary }, score: number, matched: string[] }
```

`source`: `himalayas` | `remotive` | `remoteok` | `wwr` | `hn` | `jobicy` | `getonbrd`. `salary` may be `null`.

After JSON: apply `title-keywords`, `exclude-companies`, `must-have-skills`. Do not re-rank except stable keep of CLI order.

If `npm install` is missing `node_modules`, install once. Do not commit `node_modules`, `.env`, or proposal files.

## Output document

Write `output-path` (create `proposals/` if needed). Reply with the **full markdown document** (not a summary). Do not commit that file. Remotive listings: personal use only; do not republish to other boards. Keep original job URLs. Credit Remotive, Remote OK, Jobicy (canonical URL), Himalayas, and Get on Board in the header.

Use this shape:

```markdown
# Job position proposals — YYYY-MM-DD

Candidate: Mexico-based software contractor targeting **US companies**, **remote / Americas**, **US-like pay**. Not LATAM staffing mills.

Search: `--limit <n> --min-score <n>` | resume: `<path>` | browser: off/on
Optional filters: title-keywords / exclude-companies / must-have-skills (or “none”)

Sources: Himalayas, Remotive, Remote OK, We Work Remotely, HN Who’s Hiring, Jobicy, Get on Board.
Credits: Remotive; Remote OK (keep original URLs); Jobicy (canonical URL). LinkedIn is out of scope.

## Top picks

1. **<title>** @ <company> — score <n> — [apply](<url>)
   Why: <1–2 sentences from matched skills, contractor/remote fit, salary if present>
2. …
3. …

## All proposed positions

### 1. <title> @ <company>

- Score: `<n>` · Source: `<source>` · [Listing](<url>)
- Location: … · Employment: …
- Salary: … (or “not listed”)
- Matched skills: …
- Tags: …
- Why propose: …
- Watch-outs: visa/US-only leftovers, recruiter spam, unpaid trial, “LATAM rates”, onsite, etc. “None noted” if clean.
- Excerpt: <trimmed description>

### 2. …

## Run notes

- Jobs in JSON: <n> · After optional filters: <n>
- stderr (source errors / empty sources): <paste or “none”>
```

Fill every listed job (up to `limit` after filters). Inventing jobs is forbidden. If a field is empty, write `—`.

## Do not

- LinkedIn scrape, login, or automation
- Credentials in the document or git (no `.env`)
- Commit `proposals/` or republish Remotive copy
- Change CLI filter/score code unless the user asked to change the scraper
