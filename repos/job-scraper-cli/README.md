# job-scraper-cli

Personal CLI that pulls **public** remote job feeds (no login), ranks them against skills in [`repos/resume-data-source/index.json`](../resume-data-source/index.json), and prints a short list. Playwright runs only when a source returns zero jobs.

## Sites (v1)

- [Himalayas](https://himalayas.app) JSON search (`react`, `typescript`, `node`, `python`)
- [Remotive](https://remotive.com) `software-development` API — credit Remotive; do not republish their listings to other boards; few GETs per day
- [Remote OK](https://remoteok.com) public API — credit Remote OK and keep original job URLs
- [We Work Remotely](https://weworkremotely.com) programming RSS
- [Hacker News Who’s Hiring](https://news.ycombinator.com) via Algolia

LinkedIn is **out of scope**. Do not scrape or automate it.

## Requirements

- Node.js 22+
- Resume JSON at `repos/resume-data-source/index.json` (override with `--resume` or `JOB_SCRAPER_RESUME_PATH`)
- Optional browser fallback: `npx playwright install chromium`

## Usage

```bash
npm install
npx tsx src/main.ts --no-browser --limit 5
npx tsx src/main.ts --json --limit 20
npx tsx src/main.ts --resume ../resume-data-source/index.json --min-score 2
```

Flags:

- `--resume <path>` — resume `index.json`
- `--limit <n>` — max printed jobs (default 20)
- `--min-score <n>` — drop jobs below this score (default 1)
- `--json` — ranked JSON (`source` is the board name)
- `--no-browser` — skip Playwright even if a source is empty
- `-h` / `--help`

Filters: drop US-only location and “authorized to work in the United States”. Prefer remote / Americas / contractor (contractor boosts score; it is not required). Keep software-ish titles or skill overlap with the resume.

## Scripts

```bash
npm test
npm run typecheck
npm run lint
```
