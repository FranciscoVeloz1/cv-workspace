# Preview chrome and PDF

**Tipo:** UX/UI  
**Depende de:** [`04-home-catalog.md`](04-home-catalog.md), [`05-cv-document-template.md`](05-cv-document-template.md)  
**Implementa:** PreviewPage studio toolbar, A4 preview scale, Download PDF (`window.print`), print CSS that hides chrome, document title `{fullName} – CV`, loading/error/not-found states.  
**No incluye:** Playwright (07), Home catalog changes except reuse of `StatusState` and `Link`.

## Resultado

`/?resume=francisco-veloz` shows a studio toolbar (back, source title, Download PDF) and a scaled A4 `CvDocument`. Download PDF calls `window.print()`. Print output contains only the sheet at scale 1, A4 pages, selectable text. Invalid slugs show not-found with a link back to the catalog. No PDF npm package.

## Requirements

### Intent

- **Who:** Francisco checking the sheet before sending it.
- **Verb:** Confirm content, download PDF.
- **Feel:** Light table, paper in the middle, tools on a thin bar. The sheet is larger than the chrome.

### Toolbar copy (exact)

| Control | Copy / behavior |
|---------|-----------------|
| Back | `Back to sources` — `Link` to `/` (no search). Visible text + `aria-label="Back to sources"` |
| Source title | Catalog `title` for the slug when catalog is ready; while loading show the raw slug |
| Primary button | `Download PDF` — `type="button"` |
| Disabled Download | Disabled when view-model is not ready (loading or error) |

### Document title

When Preview has a ready view-model, set `document.title` to `${cv.fullName} – CV`. Restore `CV Generator` on unmount (Home / leave Preview). Implement in `usePrintCv` or a small `useDocumentTitle(title: string | null)` in `hooks/`. Title is what browsers suggest as the PDF filename.

### Loading / error / not-found (Preview)

Reuse `StatusState`.

| State | Title | Body | Action |
|-------|-------|------|--------|
| loading | `Loading resume` | `Please wait.` | none |
| `ResumeNotFoundError` | `Resume not found` | Spec 01 message | Link `Back to sources` (render as `action` or extra `Link`) |
| `ResumeValidationError` | `Invalid resume file` | Spec 01 message | Back link |
| `ResumeNetworkError` / other | `Could not load resume` | `getErrorMessage(error)` | Try again (`reload` from `useResumeSource`) |
| `CatalogLoadError` on preview | `Catalog unavailable` | Spec 01 catalog message | Try again |

`useResumeSource` must expose `reload`.

Not-found is **not** a blank sheet. Do not call `print` when not ready.

### AppChrome

```ts
type AppChromeProps = {
  backTo: string
  backLabel: string
  sourceTitle: string
  onDownload: () => void
  downloadDisabled: boolean
  children: ReactNode
}
```

- Header `role="banner"`: flex row, space-between, align center, padding `12px var(--chrome-gap)`, background `--studio-raised`, border-bottom `1px solid var(--studio-border)`, position sticky top 0, z-index `--z-toolbar`, shadow `--studio-shadow`.
- Left: back `Link`.
- Center: `p` source title, `--chrome-meta`, muted, one line ellipsis.
- Right: `DownloadPdfButton`.
- `children` is the main preview stage (`role="main"`).

Hit targets ≥ 44px for back and download.

### DownloadPdfButton

```ts
type DownloadPdfButtonProps = {
  onClick: () => void
  disabled: boolean
}
```

Native `<button>`. Background `--studio-accent`, color `--studio-on-accent`, radius `--chrome-radius`, min-height `--chrome-hit`, padding `0 16px`. Hover `--studio-accent-hover`. Disabled opacity 0.5.

### `usePrintCv`

```ts
export function usePrintCv(): { printCv: () => void } {
  const printCv = () => {
    window.print()
  }
  return { printCv }
}
```

No `useEffect`. Click handler only (vercel: interaction logic in event handlers).

### `useA4PreviewScale`

Scale the sheet to fit the **stage** (viewport minus toolbar), not the window as a whole.

Algorithm:

1. Measure stage element (`ResizeObserver`).
2. Natural sheet width = `210mm` in CSS pixels: `const naturalWidth = pageEl.getBoundingClientRect().width` **after** layout at scale 1, or compute `210 * (96 / 25.4)` ≈ `793.7`.
3. Available = stage clientWidth minus `32px` padding, and clientHeight minus `32px`.
4. `scale = min(availableW / naturalWidth, availableH / naturalHeight, 1)` where `naturalHeight` is the **first page** `297mm` in px (`1122.5`). Do not shrink below `0.25`. Allow scale `< 1` only; never upscale above 1.
5. Apply `transform: scale(var)` on a wrapper around `CvDocument`, `transform-origin: top center`.
6. Wrapper outer height/width must account for the scaled size so the stage can scroll if the **unscaled** document is taller than one page: measure the article’s scrollHeight, multiply by scale, set wrapper height to `scrollHeight * scale`.

Print: the scale wrapper must **not** apply transform (see print CSS). The sheet prints at 1:1.

`prefers-reduced-motion` does not affect scale (it is layout, not animation). Do not animate scale.

### Print CSS (append to `src/index.css`)

```css
@media print {
  body {
    background: #ffffff;
  }

  .no-print {
    display: none !important;
  }

  .preview-scale {
    transform: none !important;
    width: auto !important;
    height: auto !important;
  }

  .cv-page {
    box-shadow: none !important;
    width: 210mm;
    min-height: 297mm;
  }

  @page {
    size: A4;
    margin: 0;
  }
}
```

Add class `no-print` to `AppChrome` header. Add class `preview-scale` to the scale wrapper. Add class `cv-page` on the document page div (already in spec 05 — if the CSS module hashes the class, **also** set a global `cv-page` className on that div: `className={`${styles.page} cv-page`}` so print CSS can target it). Same for `preview-scale` as a global class on the wrapper.

Do not use `display:none` on `CvDocument`.

### PreviewPage wiring

```tsx
export function PreviewPage({ slug }: PreviewPageProps) {
  const { status, catalog, viewModel, error, reload } = useResumeSource(slug)
  const { printCv } = usePrintCv()
  const sourceTitle = catalog?.resumes.find((entry) => {
    return entry.slug === slug
  })?.title ?? slug

  useDocumentTitle(
    status === 'ready' && viewModel ? `${viewModel.fullName} – CV` : null
  )

  let body: ReactNode = null
  if (status === 'loading') {
    body = <StatusState tone='info' title='Loading resume' body='Please wait.' />
  } else if (status === 'error') {
    body = <PreviewError error={error} onRetry={reload} />
  } else if (viewModel) {
    body = (
      <A4Stage>
        <CvDocument cv={viewModel} />
      </A4Stage>
    )
  }

  return (
    <AppChrome
      backTo='/'
      backLabel='Back to sources'
      sourceTitle={sourceTitle}
      onDownload={printCv}
      downloadDisabled={status !== 'ready'}
    >
      {body}
    </AppChrome>
  )
}
```

`PreviewError` is `src/components/PreviewError/index.tsx` (named export). Do not define it inside `PreviewPage`.

```tsx
import { Link } from 'react-router-dom'
import {
  CatalogLoadError,
  ResumeNetworkError,
  ResumeNotFoundError,
  ResumeValidationError,
  getErrorMessage
} from '../../utils/errors'
import { StatusState } from '../StatusState'

type PreviewErrorProps = {
  error: unknown
  onRetry: () => void
}

export function PreviewError({ error, onRetry }: PreviewErrorProps) {
  if (error instanceof ResumeNotFoundError) {
    return (
      <StatusState
        tone='error'
        title='Resume not found'
        body={getErrorMessage(error)}
        action={{ label: 'Back to sources', href: '/' }}
      />
    )
  }
  if (error instanceof ResumeValidationError) {
    return (
      <StatusState
        tone='error'
        title='Invalid resume file'
        body={getErrorMessage(error)}
        action={{ label: 'Back to sources', href: '/' }}
      />
    )
  }
  if (error instanceof CatalogLoadError) {
    return (
      <StatusState
        tone='error'
        title='Catalog unavailable'
        body={getErrorMessage(error)}
        action={{ label: 'Try again', onClick: onRetry }}
      />
    )
  }
  if (error instanceof ResumeNetworkError) {
    return (
      <StatusState
        tone='error'
        title='Could not load resume'
        body={getErrorMessage(error)}
        action={{ label: 'Try again', onClick: onRetry }}
      />
    )
  }
  return (
    <StatusState
      tone='error'
      title='Could not load resume'
      body={getErrorMessage(error)}
      action={{ label: 'Try again', onClick: onRetry }}
    />
  )
}
```

Extend `StatusState` `action` from spec 04:

```ts
action?: {
  label: string
  onClick?: () => void
  href?: string
}
```

If `href` is set, render React Router `Link` with that label (used for Back to sources). If `onClick` is set, render `<button type="button">`. Do not set both on one action.

`A4Stage` is `src/components/A4Stage/index.tsx`:

```tsx
import { useRef, type ReactNode } from 'react'
import { useA4PreviewScale } from '../../hooks/useA4PreviewScale'
import styles from './A4Stage.module.css'

type A4StageProps = {
  children: ReactNode
}

export function A4Stage({ children }: A4StageProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const scale = useA4PreviewScale(stageRef, sheetRef)

  return (
    <div className={styles.stage} ref={stageRef}>
      <div
        className={`preview-scale ${styles.scale}`}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center'
        }}
      >
        <div ref={sheetRef}>{children}</div>
      </div>
    </div>
  )
}
```

Stage CSS: `flex: 1`, `overflow: auto`, `padding: 16px`, display flex, justify center. Scale wrapper class `preview-scale` is required for print CSS.

`useDocumentTitle` — `src/hooks/useDocumentTitle.ts`:

```ts
import { useEffect } from 'react'

const DEFAULT_TITLE = 'CV Generator'

export function useDocumentTitle(title: string | null): void {
  useEffect(() => {
    const previous = document.title
    if (title !== null) {
      document.title = title
    }
    return () => {
      document.title = previous.length > 0 ? previous : DEFAULT_TITLE
    }
  }, [title])
}
```

`src/utils/a4Scale.ts`:

```ts
export function computeA4Scale(
  stage: { width: number; height: number },
  sheet: { width: number; height: number }
): number {
  const pad = 32
  const availableW = Math.max(stage.width - pad, 1)
  const availableH = Math.max(stage.height - pad, 1)
  const raw = Math.min(availableW / sheet.width, availableH / sheet.height, 1)
  return Math.max(raw, 0.25)
}
```

`useA4PreviewScale(stageRef, sheetRef)`: `ResizeObserver` on both elements; `getBoundingClientRect()`; pass into `computeA4Scale`; default scale `1` before measure.

Keep `A4Stage` as a folder component. Do not define it inside `PreviewPage`.

### `useResumeSource` shape

Use `ResumeSourceState` from spec 03 (`src/hooks/useResumeSource.ts`). Do not rename `viewModel`, `reload`, or `status`. Catalog then resume remains sequential (allowlist).

## Architecture

```text
PreviewPage
  useResumeSource(slug)
  usePrintCv
  useDocumentTitle
  AppChrome (no-print)
    A4Stage (preview-scale)
      CvDocument
```

## Code to do

### Files

- Modify: `src/pages/PreviewPage/index.tsx`
- Modify: `src/pages/PreviewPage/PreviewPage.module.css`
- Modify: `src/pages/PreviewPage/PreviewPage.test.tsx` (create)
- Modify: `src/components/CvDocument/CvDocument.module.css` (add global `cv-page` class alongside module class)
- Modify: `src/index.css` (print block)
- Modify: `src/hooks/useResumeSource.ts` (`reload`, viewModel)
- Create: `src/components/AppChrome/index.tsx` (+ css + test)
- Create: `src/components/DownloadPdfButton/index.tsx` (+ css + test)
- Create: `src/components/A4Stage/index.tsx` (+ css + test)
- Create: `src/components/PreviewError/index.tsx`
- Create: `src/utils/a4Scale.ts`
- Create: `src/utils/a4Scale.test.ts`
- Create: `src/hooks/usePrintCv.ts`
- Create: `src/hooks/usePrintCv.test.ts`
- Create: `src/hooks/useDocumentTitle.ts`
- Create: `src/hooks/useA4PreviewScale.ts`
- Create: `src/hooks/useA4PreviewScale.test.ts`

### Tests

`usePrintCv.test.ts`:

```ts
it('calls window.print', () => {
  const print = vi.fn()
  window.print = print
  const { result } = renderHook(() => {
    return usePrintCv()
  })
  result.current.printCv()
  expect(print).toHaveBeenCalledTimes(1)
})
```

`DownloadPdfButton.test.tsx`: click calls `onClick`; disabled button does not.

`PreviewPage.test.tsx`:

1. Mock `loadCatalog` + `loadResume` for `francisco-veloz` using the minimal fixture → heading name from view-model, button `Download PDF` enabled.
2. Click Download → `window.print` spy.
3. Mock `ResumeNotFoundError` → `Resume not found`, no print button enabled (`disabled`).
4. Empty query is not this page (App test already).

`useA4PreviewScale.test.ts`: with a fake ResizeObserver (polyfill in test if jsdom lacks it), wrapping a 794×1123 box in a 400×600 stage yields scale `< 1`. If jsdom measurement is unreliable, unit-test a **pure** `computeA4Scale(stage: { width: number; height: number }, sheet: { width: number; height: number }): number` in `src/utils/a4Scale.ts`:

```ts
export function computeA4Scale(
  stage: { width: number; height: number },
  sheet: { width: number; height: number }
): number {
  const pad = 32
  const availableW = Math.max(stage.width - pad, 1)
  const availableH = Math.max(stage.height - pad, 1)
  const raw = Math.min(availableW / sheet.width, availableH / sheet.height, 1)
  return Math.max(raw, 0.25)
}
```

Hook applies that helper. Test the helper thoroughly; hook test optional.

### Tasks

- [ ] **Step 1: Write failing tests** (`computeA4Scale`, `usePrintCv`, PreviewPage print spy).
- [ ] **Step 2: Run; expect FAIL.**
- [ ] **Step 3: Implement chrome, scale, print CSS, PreviewPage.**
- [ ] **Step 4: `npm test && npm run lint && npm run build` PASS.**
- [ ] **Step 5: Manual print check** — Chrome → Download PDF → destination Save as PDF → one or more A4 pages, no toolbar, fonts readable. Commit only if asked.

## Testing

| Check | Expected |
|-------|----------|
| Ready preview | Name from JSON, Download enabled |
| Download click | `window.print` once |
| Not found | Exact title, Download disabled |
| `computeA4Scale` | Never > 1, never < 0.25 |
| Print CSS | `.no-print` hidden (assert class present on header) |

## Acceptance

- [ ] Toolbar is `no-print`; sheet prints.
- [ ] `@page { size: A4; margin: 0 }`.
- [ ] `document.title` set for filename hint.
- [ ] No pdf/html2canvas/jspdf dependency in `package.json`.
- [ ] Scale never applied in print.
- [ ] Lint/test/build green.

## Playwright scenarios unlocked

Full flow in spec 07: Home → card → preview name → click Download PDF → print mocked.

## Impact

Leaving `transform: scale` on in print shrinks the CV to a postage stamp. The global class `preview-scale { transform: none }` is mandatory. Calling `print()` from a `useEffect` on mount would spam dialogs — keep it in the click handler. Sticky toolbar can overlap the sheet on short viewports; stage must be `overflow: auto` below the toolbar, not under it (`flex column` on a full-height shell: header then `flex: 1` stage).
