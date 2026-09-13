# Home catalog

**Tipo:** UX/UI  
**Depende de:** [`03-frontend-scaffold-and-routing.md`](03-frontend-scaffold-and-routing.md), [`02-design-tokens-and-surfaces.md`](02-design-tokens-and-surfaces.md)  
**Implementa:** Home catalog UI in `repos/personal-projects/web-cv-generator`: `HomePage`, `SourceCard`, `StatusState`, catalog loading/empty/error. Clicking a source navigates to `/?resume=<slug>`.  
**No incluye:** A4 sheet, print, Preview toolbar (06), Playwright (07). PreviewPage stays a placeholder until 05–06.

## Resultado

Opening `/` (no query) shows a studio-wall page titled `Resume sources`, a short lede, and one card per catalog entry. Keyboard users can tab to each card and activate with Enter/Space. Loading, empty, and error states use `StatusState`. Cards never fetch resume JSON (catalog only).

## Requirements

### Intent

- **Who:** Francisco choosing which tailored JSON to print.
- **Verb:** Scan sources, pick one.
- **Feel:** Print-shop counter. Paper cards on a cool wall. No table, no data grid, no search in v1 (one-to-few sources).

### Copy (exact)

| Element | Copy |
|---------|------|
| Document title (Home) | `CV Generator` (leave `index.html` default; spec 06 changes it on Preview) |
| `h1` | `Resume sources` |
| Lede | `Choose a JSON source of truth. The preview matches the printed page.` |
| Empty title | `No resume sources yet` |
| Empty body | `Add an entry to public/resumes/catalog.json and a matching JSON file.` |
| Error title | `Catalog unavailable` |
| Error body | Use `getErrorMessage(error)` (catalog message from spec 01) |
| Error retry button | `Try again` |
| Card accessible name | `{title}` (the catalog title) |
| Card subtitle | catalog `subtitle` |

### Layout

- Max width `720px`, centered, padding `var(--chrome-gap)` (24px equivalent: use `--chrome-gap` and an extra `32px` top padding on `<main>`).
- `h1` then lede (`p` with `--studio-ink-muted`).
- Card list: vertical stack, gap `var(--chrome-gap)`. Not a 3-column marketing grid.
- Each `SourceCard` is a `<a href="?resume={slug}">` (React Router `Link` to `/?resume=${slug}`) styled as a raised paper card. Do not use `<div onClick>`.
- Card min-height `var(--chrome-hit)`; padding `16px 20px`; radius `--chrome-radius`; border `1px solid var(--studio-border)`; background `--studio-raised`; shadow `--studio-shadow`.
- Hover: `--studio-raised-hover`.
- Focus-visible: studio focus ring.
- Title: `--studio-ink`, 1.125rem, weight 650.
- Subtitle: `--studio-ink-muted`, 0.9375rem.

### StatusState

Shared component used on Home (this spec) and Preview (06).

Props:

```ts
type StatusStateProps = {
  title: string
  body: string
  tone: 'info' | 'error'
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
}
```

If `action.href` is set, render a React Router `Link`. If `action.onClick` is set, render `<button type="button">`. Do not set both. Spec 06 uses `href: '/'` for not-found.

- `role="status"` when `tone='info'`; `role="alert"` when `tone='error'`.
- Loading: `tone='info'`, title `Loading resume sources`, body `Please wait.`, no action. Home passes this while `status === 'loading'`.
- Error: `tone='error'`, title color `--studio-danger`, action retries by calling `reload` from `useResumeCatalog` (already in spec 03).

### Loading

While catalog status is `loading`, do not flash empty. Show `StatusState` loading. No skeleton cards required in v1.

### Empty

`catalog.resumes.length === 0` → empty StatusState. Valid parse, zero entries.

### Error

`status === 'error'` → error StatusState + Try again.

### Data

Home uses `useResumeCatalog` only. Do not call `loadResume`.

## Architecture

```text
HomePage
  useResumeCatalog
  StatusState (loading | empty | error)
  <ul> SourceCard[]
```

`SourceCard` is presentational: `slug`, `title`, `subtitle`.

## Code to do

### Files

- Modify: `src/pages/HomePage/index.tsx`
- Modify: `src/pages/HomePage/HomePage.module.css`
- Modify: `src/hooks/useResumeCatalog.ts` (only if reload is missing)
- Create: `src/components/SourceCard/index.tsx`
- Create: `src/components/SourceCard/SourceCard.module.css`
- Create: `src/components/SourceCard/SourceCard.test.tsx`
- Create: `src/components/StatusState/index.tsx`
- Create: `src/components/StatusState/StatusState.module.css`
- Create: `src/components/StatusState/StatusState.test.tsx`
- Modify: `src/pages/HomePage/HomePage.test.tsx` (create)

### `useResumeCatalog` reload

Spec 03 already returns `{ status, catalog, error, reload }`. Do not replace that hook with a different type. HomePage only consumes it.

### SourceCard

```tsx
import { Link } from 'react-router-dom'
import styles from './SourceCard.module.css'

type SourceCardProps = {
  slug: string
  title: string
  subtitle: string
}

export function SourceCard({ slug, title, subtitle }: SourceCardProps) {
  return (
    <li>
      <Link className={styles.card} to={`/?resume=${slug}`}>
        <span className={styles.title}>{title}</span>
        <span className={styles.subtitle}>{subtitle}</span>
      </Link>
    </li>
  )
}
```

Use `to={{ pathname: '/', search: `?resume=${slug}` }}` if that plays nicer with basename. The resolved URL must include `resume=<slug>`.

### HomePage

```tsx
export function HomePage() {
  const { status, catalog, error, reload } = useResumeCatalog()

  return (
    <main className={styles.page}>
      <h1>Resume sources</h1>
      <p className={styles.lede}>
        Choose a JSON source of truth. The preview matches the printed page.
      </p>
      {status === 'loading' ? (
        <StatusState tone='info' title='Loading resume sources' body='Please wait.' />
      ) : null}
      {status === 'error' ? (
        <StatusState
          tone='error'
          title='Catalog unavailable'
          body={getErrorMessage(error)}
          action={{ label: 'Try again', onClick: reload }}
        />
      ) : null}
      {status === 'ready' && catalog.resumes.length === 0 ? (
        <StatusState
          tone='info'
          title='No resume sources yet'
          body='Add an entry to public/resumes/catalog.json and a matching JSON file.'
        />
      ) : null}
      {status === 'ready' && catalog.resumes.length > 0 ? (
        <ul className={styles.list}>
          {catalog.resumes.map((entry) => {
            return (
              <SourceCard
                key={entry.slug}
                slug={entry.slug}
                title={entry.title}
                subtitle={entry.subtitle}
              />
            )
          })}
        </ul>
      ) : null}
    </main>
  )
}
```

Use explicit ternaries (not `count && <el>`). List is `ul` / `li`. `SourceCard` wraps `li`.

### Tasks

- [ ] **Step 1: Failing tests**

`SourceCard.test.tsx`: render with `MemoryRouter`, expect a link whose `href` contains `resume=francisco-veloz`.

`HomePage.test.tsx`: mock `useResumeCatalog` **or** mock `loadCatalog`:

1. ready with one entry → heading + link named `Francisco Veloz`
2. ready empty → `No resume sources yet`
3. error → `Catalog unavailable` + `Try again`
4. loading → `Loading resume sources`

Prefer mocking `loadCatalog` in the hook’s module so the hook stays real:

```ts
vi.mock('../../utils/loadCatalog', () => {
  return {
    loadCatalog: vi.fn()
  }
})
```

- [ ] **Step 2: Run tests; expect FAIL**

```bash
cd repos/personal-projects/web-cv-generator
npm test -- src/pages/HomePage/HomePage.test.tsx
```

- [ ] **Step 3: Implement components and CSS Modules** using only spec 02 tokens.

- [ ] **Step 4: Tests PASS.** `npm run lint && npm test && npm run build`

- [ ] **Step 5: Commit only if asked.**

## Testing

| Check | Expected |
|-------|----------|
| Ready catalog | Card link to `?resume=francisco-veloz` |
| Empty | Empty copy exact |
| Error | Alert + Try again calls `loadCatalog` again |
| Loading | Loading copy; no empty flash |
| Keyboard | Tab to link, Enter navigates (RTL user-event) |

## Acceptance

- [ ] Home uses semantic list + `Link`, not div click.
- [ ] Copy matches the table.
- [ ] Hit target ≥ 44px.
- [ ] Tokens only in CSS Modules.
- [ ] No resume JSON fetch on Home.
- [ ] Lint/test/build green.

## Playwright scenarios unlocked

Home lists Francisco card; click opens preview query (wired in 07 after Preview exists).

## Impact

Fetching every resume JSON on Home would waterfall (vercel 1.x) and slow the picker. Catalog-only is enough. `reload` must ignore stale in-flight responses or Try again during a slow fetch can show the old error after a success.
