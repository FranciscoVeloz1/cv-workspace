# Web CV Generator — E2E local runbook

Local happy path for `repos/personal-projects/web-cv-generator`. Use with
[07-verification-and-e2e.md](07-verification-and-e2e.md).

## Topology

| Service | URL |
|---------|-----|
| Vite SPA | `http://127.0.0.1:5173/web-cv-generator/` |
| Home | `http://127.0.0.1:5173/web-cv-generator/` |
| Default preview | `http://127.0.0.1:5173/web-cv-generator/?resume=francisco-veloz` |
| Catalog JSON | `http://127.0.0.1:5173/web-cv-generator/resumes/catalog.json` |
| Resume JSON | `http://127.0.0.1:5173/web-cv-generator/resumes/francisco-veloz.json` |

No backend. No CORS. No `.env`.

## Prerequisites

- Node.js 20+
- npm 9+
- Specs 03–06 implemented
- Sibling data: `repos/personal-projects/resume-data-source/index.json` (for `sync-resume`)
- Feature branch: `feat/web-cv-generator` on the parent workspace

## 1. Install

```bash
cd repos/personal-projects/web-cv-generator
npm install
npx playwright install chromium
```

## 2. Sync default JSON

```bash
npm run sync-resume
```

Expected stdout: a `Copied … -> …/public/resumes/francisco-veloz.json` line.

If the script exits 1 (`Missing source`), copy
`repos/personal-projects/resume-data-source/index.json` to
`public/resumes/francisco-veloz.json` manually. `catalog.json` must already list
`francisco-veloz`.

Verify static files after `npm run dev`:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5173/web-cv-generator/resumes/catalog.json
```

Expected: `200`. If this is `404`, the Vite `base` or `public/` folder is wrong — do
not debug React until this is `200`.

## 3. Unit gate

```bash
npm run lint
npm run typecheck
npm test
```

Expected: exit 0.

## 4. Dev server (manual)

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

1. `http://127.0.0.1:5173/web-cv-generator/` — heading `Resume sources`, card
   `Francisco Veloz`.
2. Click the card — URL has `resume=francisco-veloz`, sheet name contains
   Francisco, toolbar `Download PDF`.
3. Click `Download PDF` — print dialog. Destination **Save as PDF**. Confirm:
   - no toolbar on the page
   - A4
   - selectable text
   - more than one page for the full Francisco JSON
4. `http://127.0.0.1:5173/web-cv-generator/?resume=not-a-real-source` — `Resume not found`.
5. Keyboard: Tab to `Back to sources`, Tab to `Download PDF`, Enter prints.

Viewports: 1440×900 and 390×844. Sheet must scale down on the small viewport;
toolbar remains usable (44px hits).

## 5. Playwright

Playwright starts its own `npm run dev` via `webServer` unless a server is already
running on 5173 (`reuseExistingServer`).

```bash
cd repos/personal-projects/web-cv-generator
npm run test:e2e
```

Expected: all tests in `e2e/cv-generator.spec.ts` pass.

If port 5173 is taken by a broken instance, stop it or Playwright will reuse it
and fail opaquely.

## 6. Production build

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

`preview` also uses `base: /web-cv-generator/`. Open
`http://127.0.0.1:4173/web-cv-generator/`. Repeat the manual smoke from section 4
(print included).

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Home is blank at `/` | Missing basename; app is at `/web-cv-generator/` |
| Catalog 404 | File not in `public/resumes/` or wrong `base` |
| Download disabled forever | Zod parse fail on Francisco JSON — run `sync-resume`, check console |
| Print includes toolbar | Missing `no-print` on `AppChrome` header |
| Printed CV tiny | `preview-scale` transform not disabled in `@media print` |
| E2E timeout on webServer | Dev command not using port 5173; or `baseURL` missing the subpath |
| Traversal test fails | `loadResume` fetched before slug/allowlist checks |

## Out of this runbook

GitHub Pages deploy, submodule registration, CI workflow files, silent PDF
download without the print dialog.
