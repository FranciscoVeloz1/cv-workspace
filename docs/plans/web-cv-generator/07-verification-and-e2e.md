# Verification and E2E

**Tipo:** Integration  
**Depende de:** [`06-preview-chrome-and-pdf.md`](06-preview-chrome-and-pdf.md)  
**Implementa:** Playwright suite and npm scripts in `repos/personal-projects/web-cv-generator`; `sync-resume` smoke; runbook [e2e-local-runbook.md](e2e-local-runbook.md).  
**No incluye:** New visual tokens, extra CV sections, PDF libraries, GitHub Actions unless already trivial to add — **do not** add CI in this spec.

## Resultado

`npm test` (Vitest) and `npm run test:e2e` (Playwright) pass locally. E2E covers home catalog, source selection via click and via URL, Francisco name on the sheet, Download PDF calling `window.print`, not-found slug, and invalid slug that must not request a traversal path. `sync-resume` exits 0 when resume-data-source is present.

## Requirements

### Playwright version and scripts

Add `@playwright/test` `^1.55.1` as a devDependency.

```json
{
  "test:e2e": "playwright test",
  "test:e2e:install": "playwright install chromium"
}
```

`playwright.config.ts` at the app root:

- `testDir`: `e2e`
- `fullyParallel`: true
- `forbidOnly`: `!!process.env.CI`
- `retries`: 0 locally
- `use.baseURL`: `http://127.0.0.1:5173/web-cv-generator/`
- `webServer.command`: `npm run dev -- --host 127.0.0.1 --port 5173`
- `webServer.url`: `http://127.0.0.1:5173/web-cv-generator/`
- `webServer.reuseExistingServer`: `!process.env.CI`
- browser: Chromium only
- `trace`: `on-first-retry`

Because Vite `base` is `/web-cv-generator/`, Playwright paths are relative to `baseURL` (e.g. `page.goto('./')` or `page.goto('http://127.0.0.1:5173/web-cv-generator/')`).

### Fixture data

Use the real `public/resumes/catalog.json` and `francisco-veloz.json` for happy path. Do not mock those in E2E.

For not-found, use slug `not-a-real-source` (valid kebab, absent from catalog).

For traversal, use `page.goto('./?resume=../resume-data-source')` or `./?resume=foo.json`. Expect not-found UI and that the network log has **no** request whose URL contains `..`.

### Print spy

```ts
await page.addInitScript(() => {
  window.__printCalls = 0
  window.print = () => {
    window.__printCalls += 1
  }
})
```

Declare in `e2e/global.d.ts` or use `page.evaluate`. After click:

```ts
const calls = await page.evaluate(() => {
  return window.__printCalls
})
expect(calls).toBe(1)
```

Init script must run before navigation.

### Scenarios (mandatory)

1. **Home lists the default source**  
   `goto('./')` → heading `Resume sources` → link/button name `Francisco Veloz`.

2. **Click source opens preview**  
   Click that link → URL contains `resume=francisco-veloz` → `h1` matches `/Francisco/` → button `Download PDF` enabled.

3. **Direct URL**  
   `goto('./?resume=francisco-veloz')` → same name and Download button.

4. **Download PDF**  
   On preview, click `Download PDF` → `__printCalls === 1`.

5. **Not found**  
   `goto('./?resume=not-a-real-source')` → text `Resume not found` (heading or status) → Download disabled or absent.

6. **Invalid slug, no traversal fetch**  
   Listen `page.on('request')`. `goto('./?resume=../etc')`. Assert not-found. Assert no request URL includes `..` or `//etc`.

7. **Back to sources**  
   From preview, click `Back to sources` → heading `Resume sources`.

### Vitest regression (must still pass)

Run the full unit suite. No deletions of spec 03–06 tests.

### `sync-resume` smoke

```bash
npm run sync-resume
```

Expected: stdout contains `Copied` and `public/resumes/francisco-veloz.json` exists. Then `npx vitest run src/utils/resumeSchema.test.ts` still passes (file still parses). If resume-data-source is missing, the script exits 1 — document that in the runbook; E2E does not require re-syncing if the JSON is already in `public/`.

### Manual checks (runbook)

- Desktop 1440px and 900px: sheet scaled, toolbar usable.
- Print dialog: Save as PDF, no toolbar, A4, multi-page for Francisco.
- Keyboard: tab from back → title is not a trap → Download.

## Architecture

Playwright talks to Vite dev server. No API. Tests live in `e2e/*.spec.ts`, not under `src/` (Vitest jsdom must not pick them up). Exclude `e2e` from ESLint if Playwright globals conflict, or add Playwright to ESLint ignores:

`eslint.config.js` `globalIgnores(['dist', 'e2e', 'playwright-report', 'test-results'])`.

## Code to do

### Files

- Create: `playwright.config.ts`
- Create: `e2e/cv-generator.spec.ts`
- Create: `e2e/tsconfig.json` only if needed; prefer Playwright defaults
- Modify: `package.json` (scripts + `@playwright/test`)
- Modify: `eslint.config.js` ignores
- Modify: `.gitignore` (already has playwright-report in spec 03)

### `e2e/cv-generator.spec.ts`

```ts
import { expect, test, type Page } from '@playwright/test'

async function mockPrint(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(window, '__printCalls', {
      writable: true,
      value: 0
    })
    window.print = () => {
      window.__printCalls = Number(window.__printCalls) + 1
    }
  })
}

test.describe('web CV generator', () => {
  test('home lists Francisco Veloz', async ({ page }) => {
    await page.goto('./')
    await expect(page.getByRole('heading', { name: 'Resume sources' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Francisco Veloz' })).toBeVisible()
  })

  test('clicking a source opens the preview', async ({ page }) => {
    await mockPrint(page)
    await page.goto('./')
    await page.getByRole('link', { name: 'Francisco Veloz' }).click()
    await expect(page).toHaveURL(/resume=francisco-veloz/)
    await expect(page.getByRole('heading', { level: 1, name: /Francisco/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeEnabled()
  })

  test('direct resume URL renders the sheet', async ({ page }) => {
    await page.goto('./?resume=francisco-veloz')
    await expect(page.getByRole('heading', { level: 1, name: /Francisco/ })).toBeVisible()
  })

  test('download PDF calls print', async ({ page }) => {
    await mockPrint(page)
    await page.goto('./?resume=francisco-veloz')
    await page.getByRole('button', { name: 'Download PDF' }).click()
    const calls = await page.evaluate(() => {
      return window.__printCalls as number
    })
    expect(calls).toBe(1)
  })

  test('unknown slug shows not found', async ({ page }) => {
    await page.goto('./?resume=not-a-real-source')
    await expect(page.getByText('Resume not found')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeDisabled()
  })

  test('invalid slug does not fetch a traversal path', async ({ page }) => {
    const urls: string[] = []
    page.on('request', (request) => {
      urls.push(request.url())
    })
    await page.goto('./?resume=../etc')
    await expect(page.getByText('Resume not found')).toBeVisible()
    const suspicious = urls.filter((url) => {
      return url.includes('..') || url.includes('etc.json')
    })
    expect(suspicious).toEqual([])
  })

  test('back to sources returns home', async ({ page }) => {
    await page.goto('./?resume=francisco-veloz')
    await page.getByRole('link', { name: 'Back to sources' }).click()
    await expect(page.getByRole('heading', { name: 'Resume sources' })).toBeVisible()
  })
})
```

Add a `e2e/window.d.ts`:

```ts
export {}

declare global {
  interface Window {
    __printCalls?: number
  }
}
```

### Tasks

- [ ] **Step 1: Add Playwright config and failing spec** (app already implemented through 06).
- [ ] **Step 2: `npx playwright install chromium` then `npm run test:e2e`.** First run may FAIL if selectors differ (e.g. name heading includes full name `Francisco González Veloz` — `/Francisco/` still matches).
- [ ] **Step 3: Fix selectors only if the UI copy from specs 04–06 was implemented exactly; do not invent new copy.**
- [ ] **Step 4: Run the full gate:**

```bash
cd repos/personal-projects/web-cv-generator
npm run sync-resume
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Expected: all exit 0.

- [ ] **Step 5: Manual print + keyboard from the runbook.** Commit only if asked.

## Testing

The scenarios above are the tests. Unit tests from 03–06 remain required.

## Acceptance

- [ ] All seven Playwright tests pass on Chromium.
- [ ] Traversal slug does not request `..`.
- [ ] Print is mocked; no system dialog blocks CI.
- [ ] `npm run build` still exits 0.
- [ ] Runbook commands work on a clean checkout (after `npm install` and Playwright browser install).

## Playwright scenarios unlocked

This spec **is** the Playwright suite. No further specs.

## Impact

`baseURL` without `/web-cv-generator/` will 404 the SPA and every test. Mocking `window.print` only after `goto` is too late — use `addInitScript`. Francisco’s `h1` is CSS-uppercased; accessible name may still be mixed-case DOM text (`Francisco González Veloz`). Match `/Francisco/`. If Download stays disabled, the E2E failure means `useResumeSource` never reached `ready` — check Vite static serving of `public/resumes/*.json` under the base path.
