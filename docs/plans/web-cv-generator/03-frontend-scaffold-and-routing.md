# Frontend scaffold and routing

**Tipo:** UX/UI  
**Depende de:** [`01-functional-domain-and-data.md`](01-functional-domain-and-data.md), [`02-design-tokens-and-surfaces.md`](02-design-tokens-and-surfaces.md), [`repos/productive-apps/user-management-app/package.json`](../../../repos/productive-apps/user-management-app/package.json), [`repos/personal-projects/screen-recorder/package.json`](../../../repos/personal-projects/screen-recorder/package.json)  
**Implementa:** Complete Vite React app skeleton in `repos/personal-projects/web-cv-generator`: config, tokens CSS, Router, Zod schemas, slug/publicUrl helpers, catalog + resume loaders, error types, HomePage and PreviewPage **placeholders**, `sync-resume` script, Vitest harness. Keep `image.png` in the folder.  
**No incluye:** Catalog card layout (04), Olivia `CvDocument` (05), print/scale (06), Playwright (07).

## Resultado

`npm run dev` serves `http://localhost:5173/web-cv-generator/`. No `resume` param shows a Home placeholder heading `Resume sources`. `?resume=francisco-veloz` shows a Preview placeholder heading `CV preview` and the slug. Catalog and resume JSON parse through Zod. Invalid slugs do not fetch. Lint, typecheck, unit tests, and build pass.

## Requirements

### Intent

Scaffold is correct and boring. Visual craft for Home and the sheet comes in 04–06. Tokens from spec 02 must already be in `src/index.css`.

### Stack and versions

Copy from user-management-app unless noted:

| Package | Version |
|---------|---------|
| `react` / `react-dom` | `^19.2.4` |
| `react-router-dom` | `^7.6.2` |
| `zod` | `^3.24.2` |
| `vite` | `^8.0.4` |
| `@vitejs/plugin-react` | `^6.0.1` |
| `typescript` | `~5.8.3` (user-management-app; do not jump to TS 6 unless that repo has moved) |
| `vitest` | `^3.2.4` |
| `@testing-library/react` | `^16.3.0` |
| `@testing-library/jest-dom` | `^6.9.1` |
| `@testing-library/user-event` | `^14.6.1` |
| `jsdom` | `^26.1.0` |
| ESLint 9 stack | same versions as user-management-app |
| `prettier` | `^3.6.2` |
| `@types/node` | `^22.15.21` |

Do not add TanStack Query, Tailwind, or a PDF library.

### Scripts

```json
{
  "dev": "vite",
  "typecheck": "tsc --noEmit -p tsconfig.app.json",
  "build": "npm run typecheck && vite build",
  "lint": "eslint .",
  "format": "prettier --write .",
  "test": "vitest run",
  "test:watch": "vitest",
  "sync-resume": "node scripts/sync-resume.mjs"
}
```

### Vite base

```ts
base: '/web-cv-generator/'
```

### Routing

`BrowserRouter` basename = `import.meta.env.BASE_URL` with trailing slash stripped except `/`.

Single route `/`. `App` reads `useSearchParams()`:

- missing/empty `resume` → `<HomePage />`
- otherwise → `<PreviewPage slug={resume} />`

Catch-all `*` → `<Navigate to="/" replace />`.

### Placeholder copy (exact)

HomePage `h1`: `Resume sources`  
PreviewPage `h1`: `CV preview`  
PreviewPage must also expose the slug in a `data-slug` attribute on a `p` or `span` for tests.

### Prettier

Copy `repos/productive-apps/user-management-app/.prettierrc.json` verbatim:

```json
{
  "trailingComma": "none",
  "tabWidth": 2,
  "semi": false,
  "singleQuote": true,
  "jsxSingleQuote": true,
  "printWidth": 115
}
```

All TS/TSX: braces on `if`/`for`/`while`, explicit `return` in arrow functions.

## Architecture

```text
main.tsx
  BrowserRouter basename
    App
      useSearchParams
        HomePage | PreviewPage
hooks: useResumeCatalog, useResumeSource
utils: publicUrl, slug, resumeSchema, catalogSchema, toCvViewModel, errors
```

`App.tsx` composes only. No fetch in `App.tsx`.

## Code to do

### Target tree

```text
repos/personal-projects/web-cv-generator/
  image.png                          # keep
  index.html
  package.json
  package-lock.json
  vite.config.ts
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  eslint.config.js
  .prettierrc.json
  .gitignore
  scripts/sync-resume.mjs
  public/resumes/catalog.json
  public/resumes/francisco-veloz.json
  src/main.tsx
  src/App.tsx
  src/App.test.tsx
  src/index.css
  src/vite-env.d.ts

  src/pages/HomePage/index.tsx
  src/pages/HomePage/HomePage.module.css
  src/pages/PreviewPage/index.tsx
  src/pages/PreviewPage/PreviewPage.module.css
  src/hooks/useResumeCatalog.ts
  src/hooks/useResumeSource.ts
  src/utils/publicUrl.ts
  src/utils/slug.ts
  src/utils/errors.ts
  src/utils/catalogSchema.ts
  src/utils/resumeSchema.ts
  src/utils/toCvViewModel.ts
  src/utils/loadCatalog.ts
  src/utils/loadResume.ts
  src/types/catalog.ts
  src/types/resume.ts
  src/types/cvViewModel.ts
  src/test/setup.ts
  src/test/fixtures/minimal-resume.json
  src/utils/publicUrl.test.ts
  src/utils/slug.test.ts
  src/utils/catalogSchema.test.ts
  src/utils/resumeSchema.test.ts
  src/utils/toCvViewModel.test.ts
  src/utils/loadResume.test.ts
```

Copy `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.js`, and `src/test/setup.ts` from user-management-app. In `tsconfig.app.json` keep tests excluded from the app project; Vitest uses `vite.config.ts`.

### `.gitignore`

```
node_modules
dist
.DS_Store
*.local
playwright-report
test-results
```

Do not ignore `public/resumes/*.json`.

### `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CV Generator</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Source+Sans+3:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### `vite.config.ts`

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/web-cv-generator/',
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react'
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  }
})
```

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

`package.json` `name` is `web-cv-generator`, `"private": true`, `"type": "module"`. Dependencies and versions from the table above.

### `scripts/sync-resume.mjs`

```js
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const source = path.resolve(here, '../../resume-data-source/index.json')
const destDir = path.resolve(here, '../public/resumes')
const dest = path.join(destDir, 'francisco-veloz.json')

if (!fs.existsSync(source)) {
  console.error(`Missing source: ${source}`)
  process.exit(1)
}

fs.mkdirSync(destDir, { recursive: true })
fs.copyFileSync(source, dest)
console.log(`Copied ${source} -> ${dest}`)
```

After first `npm run sync-resume`, commit `public/resumes/francisco-veloz.json` when the user asks to commit. For local implementation, running the script is enough; if the sibling repo is missing, copy `index.json` manually once and still keep the script.

### `public/resumes/catalog.json`

```json
{
  "resumes": [
    {
      "slug": "francisco-veloz",
      "title": "Francisco Veloz",
      "subtitle": "Default full-stack CV"
    }
  ]
}
```

### Types

`src/types/catalog.ts`:

```ts
export type { Catalog } from '../utils/catalogSchema'
```

Add `export type Catalog = z.infer<typeof catalogSchema>` at the bottom of `catalogSchema.ts`. Do not keep a second hand-written `Catalog` interface.
`src/types/cvViewModel.ts`:

```ts
export type CvExperienceItem = {
  heading: string
  dates: string
  bullets: string[]
}

export type CvEducationItem = {
  heading: string
  institution: string
  dates: string
}

export type CvViewModel = {
  fullName: string
  headline: string | null
  contactLine: string | null
  summary: string | null
  experience: CvExperienceItem[]
  education: CvEducationItem[]
  skillNames: string[]
}
```

`src/types/resume.ts`:

```ts
export type { Resume } from '../utils/resumeSchema'
```

`resumeSchema.ts` must `export type Resume = z.infer<typeof resumeSchema>`. Do not hand-write a parallel `Resume` interface.

### Errors — `src/utils/errors.ts`

```ts
export class ApplicationError extends Error {
  readonly timestamp = new Date().toISOString()

  constructor(
    message: string,
    readonly code: string,
    readonly details?: Record<string, unknown>,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = this.constructor.name
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export class CatalogLoadError extends ApplicationError {
  constructor(details?: Record<string, unknown>, options?: ErrorOptions) {
    super('Could not load the resume catalog.', 'CATALOG_LOAD', details, options)
  }
}

export class ResumeNotFoundError extends ApplicationError {
  constructor(details?: Record<string, unknown>) {
    super('That resume source was not found.', 'RESUME_NOT_FOUND', details)
  }
}

export class ResumeValidationError extends ApplicationError {
  constructor(issues: string[]) {
    super('That resume file is not valid.', 'RESUME_VALIDATION', { issues })
  }
}

export class ResumeNetworkError extends ApplicationError {
  constructor(details?: Record<string, unknown>, options?: ErrorOptions) {
    super(
      'Could not load that resume. Check your connection and try again.',
      'RESUME_NETWORK',
      details,
      options
    )
  }
}

export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Something went wrong.'
}
```

### `src/utils/publicUrl.ts`

```ts
export function publicUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL
  const trimmed = relativePath.replace(/^\//, '')
  if (base.endsWith('/')) {
    return `${base}${trimmed}`
  }
  return `${base}/${trimmed}`
}
```

### `src/utils/slug.ts`

```ts
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isResumeSlug(value: string): boolean {
  return SLUG_PATTERN.test(value)
}
```

### Catalog Zod

```ts
import { z } from 'zod'

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const catalogSchema = z
  .object({
    resumes: z.array(
      z.object({
        slug: slugSchema,
        title: z.string().trim().min(1),
        subtitle: z.string().trim().min(1)
      })
    )
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>()
    data.resumes.forEach((entry, index) => {
      if (seen.has(entry.slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Duplicate slug',
          path: ['resumes', index, 'slug']
        })
      }
      seen.add(entry.slug)
    })
  })

export type Catalog = z.infer<typeof catalogSchema>
```

### Resume Zod — `src/utils/resumeSchema.ts`

```ts
import { z } from 'zod'

const workExperienceSchema = z
  .object({
    position: z.string(),
    company: z.string(),
    employmentType: z.string(),
    startDate: z.string(),
    endDate: z.union([z.string(), z.null()]),
    duration: z.string(),
    location: z.string(),
    logo: z.string(),
    responsibilities: z.array(z.string()),
    skills: z.array(z.number())
  })
  .passthrough()

const educationSchema = z
  .object({
    degree: z.string(),
    institution: z.string(),
    duration: z.string(),
    location: z.string(),
    logo: z.string()
  })
  .passthrough()

const skillSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    category: z.string()
  })
  .passthrough()

export const resumeSchema = z
  .object({
    profile: z
      .object({
        firstName: z.string(),
        lastName: z.string(),
        fullName: z.string().trim().min(1),
        headline: z.string(),
        email: z.string(),
        phone: z.string(),
        location: z.string(),
        website: z.string(),
        profilePhoto: z.string()
      })
      .passthrough(),
    summary: z
      .object({
        short: z.string(),
        long: z.string(),
        highlights: z.array(z.string()).optional()
      })
      .passthrough(),
    workExperience: z.array(workExperienceSchema),
    education: z.array(educationSchema),
    skills: z.array(skillSchema),
    projects: z.array(z.unknown()),
    certifications: z.array(z.unknown()),
    achievements: z.array(z.unknown()),
    languages: z.array(z.unknown()),
    socialNetworks: z.array(z.unknown())
  })
  .passthrough()

export type Resume = z.infer<typeof resumeSchema>
```

`src/test/fixtures/minimal-resume.json`:

```json
{
  "profile": {
    "firstName": "Ada",
    "lastName": "Lovelace",
    "fullName": "Ada Lovelace",
    "headline": "Analyst",
    "email": "ada@example.com",
    "phone": "",
    "location": "London",
    "website": "",
    "profilePhoto": ""
  },
  "summary": {
    "short": "Short blurb.",
    "long": "Longer summary that must win."
  },
  "workExperience": [
    {
      "position": "Analyst",
      "company": "Analytical Engine Co",
      "employmentType": "Full-time",
      "startDate": "2020-01",
      "endDate": null,
      "duration": "Jan 2020 - Present",
      "location": "London",
      "logo": "",
      "responsibilities": ["Wrote notes on the engine."],
      "skills": [1]
    }
  ],
  "education": [
    {
      "degree": "Mathematics",
      "institution": "Home study",
      "duration": "1830 - 1835",
      "location": "London",
      "logo": ""
    }
  ],
  "projects": [],
  "certifications": [],
  "achievements": [],
  "languages": [],
  "socialNetworks": [],
  "skills": [
    { "id": 1, "name": "Mathematics", "category": "other" },
    { "id": 2, "name": "Writing", "category": "other" }
  ]
}
```

### `toCvViewModel` — `src/utils/toCvViewModel.ts`

```ts
import type { CvViewModel } from '../types/cvViewModel'
import type { Resume } from './resumeSchema'

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return null
  }
  return trimmed
}

export function toCvViewModel(resume: Resume): CvViewModel {
  const contactParts = [resume.profile.email, resume.profile.phone, resume.profile.location, resume.profile.website]
    .map((part) => {
      return part.trim()
    })
    .filter((part) => {
      return part.length > 0
    })

  const longSummary = emptyToNull(resume.summary.long)
  const shortSummary = emptyToNull(resume.summary.short)

  return {
    fullName: resume.profile.fullName.trim(),
    headline: emptyToNull(resume.profile.headline),
    contactLine: contactParts.length > 0 ? contactParts.join(' | ') : null,
    summary: longSummary !== null ? longSummary : shortSummary,
    experience: resume.workExperience.map((job) => {
      return {
        heading: `${job.position.trim()}, ${job.company.trim()}`,
        dates: job.duration.trim(),
        bullets: job.responsibilities
          .map((item) => {
            return item.trim()
          })
          .filter((item) => {
            return item.length > 0
          })
      }
    }),
    education: resume.education.map((item) => {
      return {
        heading: item.degree.trim(),
        institution: item.institution.trim(),
        dates: item.duration.trim()
      }
    }),
    skillNames: resume.skills
      .map((skill) => {
        return skill.name.trim()
      })
      .filter((name) => {
        return name.length > 0
      })
  }
}
```

### Loaders — `src/utils/loadCatalog.ts` and `src/utils/loadResume.ts`

```ts
import { catalogSchema } from './catalogSchema'
import { CatalogLoadError } from './errors'
import { publicUrl } from './publicUrl'
import type { Catalog } from '../types/catalog'

function issuePaths(error: { issues: { path: (string | number)[] }[] }): string[] {
  return error.issues.map((issue) => {
    return issue.path.join('.')
  })
}

export async function loadCatalog(): Promise<Catalog> {
  let response: Response
  try {
    response = await fetch(publicUrl('resumes/catalog.json'))
  } catch (error: unknown) {
    throw new CatalogLoadError(undefined, { cause: error instanceof Error ? error : undefined })
  }

  if (!response.ok) {
    throw new CatalogLoadError({ status: response.status })
  }

  let json: unknown
  try {
    json = await response.json()
  } catch (error: unknown) {
    throw new CatalogLoadError(undefined, { cause: error instanceof Error ? error : undefined })
  }

  const parsed = catalogSchema.safeParse(json)
  if (!parsed.success) {
    throw new CatalogLoadError({ issues: issuePaths(parsed.error) })
  }

  return parsed.data
}
```

```ts
import type { Catalog } from '../types/catalog'
import { ResumeNetworkError, ResumeNotFoundError, ResumeValidationError } from './errors'
import { publicUrl } from './publicUrl'
import { resumeSchema, type Resume } from './resumeSchema'
import { isResumeSlug } from './slug'

export async function loadResume(slug: string, catalog: Catalog): Promise<Resume> {
  if (!isResumeSlug(slug)) {
    throw new ResumeNotFoundError({ slug })
  }

  const allowed = catalog.resumes.some((entry) => {
    return entry.slug === slug
  })
  if (!allowed) {
    throw new ResumeNotFoundError({ slug })
  }

  let response: Response
  try {
    response = await fetch(publicUrl(`resumes/${slug}.json`))
  } catch (error: unknown) {
    throw new ResumeNetworkError(undefined, { cause: error instanceof Error ? error : undefined })
  }

  if (response.status === 404) {
    throw new ResumeNotFoundError({ slug, status: 404 })
  }
  if (!response.ok) {
    throw new ResumeNetworkError({ status: response.status })
  }

  let json: unknown
  try {
    json = await response.json()
  } catch {
    throw new ResumeValidationError(['$'])
  }

  const parsed = resumeSchema.safeParse(json)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => {
      return issue.path.join('.')
    })
    throw new ResumeValidationError(issues)
  }

  return parsed.data
}
```

### Hooks

`src/hooks/useResumeCatalog.ts` — spec 04 adds `reload`; include it now so 04 does not reshape the type:

```ts
import { useCallback, useEffect, useState } from 'react'
import type { Catalog } from '../types/catalog'
import { loadCatalog } from '../utils/loadCatalog'

export type CatalogState = {
  status: 'loading' | 'ready' | 'error'
  catalog?: Catalog
  error?: unknown
  reload: () => void
}

export function useResumeCatalog(): CatalogState {
  const [loadCount, setLoadCount] = useState(0)
  const [status, setStatus] = useState<CatalogState['status']>('loading')
  const [catalog, setCatalog] = useState<Catalog | undefined>(undefined)
  const [error, setError] = useState<unknown>(undefined)

  const reload = useCallback(() => {
    setLoadCount((count) => {
      return count + 1
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setError(undefined)

    void loadCatalog()
      .then((data) => {
        if (cancelled) {
          return
        }
        setCatalog(data)
        setStatus('ready')
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return
        }
        setError(caught)
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [loadCount])

  return { status, catalog, error, reload }
}
```

`src/hooks/useResumeSource.ts`:

```ts
import { useCallback, useEffect, useState } from 'react'
import type { Catalog } from '../types/catalog'
import type { CvViewModel } from '../types/cvViewModel'
import { loadCatalog } from '../utils/loadCatalog'
import { loadResume } from '../utils/loadResume'
import type { Resume } from '../utils/resumeSchema'
import { toCvViewModel } from '../utils/toCvViewModel'

export type ResumeSourceState = {
  status: 'loading' | 'ready' | 'error'
  catalog?: Catalog
  resume?: Resume
  viewModel?: CvViewModel
  error?: unknown
  reload: () => void
}

export function useResumeSource(slug: string): ResumeSourceState {
  const [loadCount, setLoadCount] = useState(0)
  const [status, setStatus] = useState<ResumeSourceState['status']>('loading')
  const [catalog, setCatalog] = useState<Catalog | undefined>(undefined)
  const [resume, setResume] = useState<Resume | undefined>(undefined)
  const [viewModel, setViewModel] = useState<CvViewModel | undefined>(undefined)
  const [error, setError] = useState<unknown>(undefined)

  const reload = useCallback(() => {
    setLoadCount((count) => {
      return count + 1
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setError(undefined)
    setResume(undefined)
    setViewModel(undefined)

    void loadCatalog()
      .then((loadedCatalog) => {
        if (cancelled) {
          return Promise.resolve()
        }
        setCatalog(loadedCatalog)
        return loadResume(slug, loadedCatalog).then((loadedResume) => {
          if (cancelled) {
            return
          }
          setResume(loadedResume)
          setViewModel(toCvViewModel(loadedResume))
          setStatus('ready')
        })
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return
        }
        setError(caught)
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [slug, loadCount])

  return { status, catalog, resume, viewModel, error, reload }
}
```

PreviewPage in this spec may ignore `viewModel`; spec 06 renders it. Do not fetch resume JSON in parallel with catalog (allowlist needs the catalog first).

### Pages (placeholders)

```tsx
export function HomePage() {
  return (
    <main>
      <h1>Resume sources</h1>
    </main>
  )
}
```

```tsx
type PreviewPageProps = {
  slug: string
}

export function PreviewPage({ slug }: PreviewPageProps) {
  return (
    <main>
      <h1>CV preview</h1>
      <p data-slug={slug}>{slug}</p>
    </main>
  )
}
```

### `App.tsx`

```tsx
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { PreviewPage } from './pages/PreviewPage'

export function App() {
  return (
    <Routes>
      <Route path='/' element={<RootScreen />} />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}

function RootScreen() {
  const [params] = useSearchParams()
  const resume = params.get('resume')

  if (resume === null || resume === '') {
    return <HomePage />
  }

  return <PreviewPage slug={resume} />
}
```

`RootScreen` is in `App.tsx` but is not a nested file component used as a reusable export — keep it **module-level** in `App.tsx` (not inside `App`). Do not define components inside `App`.

### `main.tsx`

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import './index.css'

function getRouterBasename(): string {
  const base = import.meta.env.BASE_URL
  if (base === '/') {
    return '/'
  }
  return base.replace(/\/$/, '')
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter basename={getRouterBasename()}>
      <App />
    </BrowserRouter>
  </StrictMode>
)
```

### `src/index.css`

Paste the `:root` + reset + body + reduced-motion block from spec 02.

### `src/App.test.tsx`

Use `MemoryRouter` with `basename='/web-cv-generator'` **or** `initialEntries` that match how tests set basename. Simplest: wrap with `<MemoryRouter initialEntries={['/']}>` and in tests mock nothing if basename is `/` in Vitest.

Vitest does not set `import.meta.env.BASE_URL` to the Vite base unless configured. Set in `vite.config.ts` `test.env` **or** assert without depending on fetch:

```ts
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('shows the catalog heading when resume is absent', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: 'Resume sources' })).toBeInTheDocument()
  })

  it('shows preview when resume query is set', () => {
    render(
      <MemoryRouter initialEntries={['/?resume=francisco-veloz']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: 'CV preview' })).toBeInTheDocument()
    expect(screen.getByText('francisco-veloz')).toBeInTheDocument()
  })

  it('treats empty resume as home', () => {
    render(
      <MemoryRouter initialEntries={['/?resume=']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: 'Resume sources' })).toBeInTheDocument()
  })
})
```

If `MemoryRouter` without basename fails because `App` expects a parent router only — this is correct: tests wrap `App`, not `main.tsx`.

### Tasks

- [ ] **Step 1: Write failing tests** for `isResumeSlug`, `catalogSchema` duplicate slugs, `resumeSchema` `endDate: null`, `toCvViewModel` contact join and summary preference, `loadResume` not fetching on invalid slug (mock `fetch`).

```ts
it('rejects path-like slugs', () => {
  expect(isResumeSlug('../etc')).toBe(false)
  expect(isResumeSlug('foo.json')).toBe(false)
  expect(isResumeSlug('francisco-veloz')).toBe(true)
})
```

```ts
it('does not call fetch when the slug is not in the catalog', async () => {
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  const catalog = { resumes: [{ slug: 'francisco-veloz', title: 'F', subtitle: 'S' }] }
  await expect(loadResume('olivia-sanchez', catalog)).rejects.toBeInstanceOf(ResumeNotFoundError)
  expect(fetchMock).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run tests; expect FAIL** (modules missing).

```bash
cd repos/personal-projects/web-cv-generator
npm test -- src/utils/slug.test.ts
```

Expected: FAIL (file or function missing).

- [ ] **Step 3: Scaffold Vite + implement utils/hooks/placeholders** as in this spec. Run `npm install`. Run `npm run sync-resume`.

- [ ] **Step 4: Run tests; expect PASS.**

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Expected: all exit 0.

- [ ] **Step 5: Commit only if the user asked.**

## Testing

| Check | Expected |
|-------|----------|
| `isResumeSlug` | true for kebab; false for `../x`, `Foo`, `a.json` |
| catalog duplicate slugs | `safeParse` fail |
| minimal resume fixture | parse success |
| Francisco synced JSON | parse success after `sync-resume` |
| `toCvViewModel` | long summary wins; empty email dropped from contact |
| `loadResume` unknown slug | no `fetch` |
| App `/` | heading Resume sources |
| App `/?resume=francisco-veloz` | heading CV preview |

## Acceptance

- [ ] File map matches the folder rule (`pages/Name/index.tsx`).
- [ ] `base` is `/web-cv-generator/`.
- [ ] Query param routing matches spec 01.
- [ ] Zod + allowlist implemented; invalid slug does not fetch.
- [ ] Spec 02 tokens in `src/index.css`; fonts in `index.html`.
- [ ] `sync-resume` copies resume-data-source `index.json`.
- [ ] Lint, typecheck, test, build green.
- [ ] `image.png` still present.

## Playwright scenarios unlocked

Home vs preview query (automated in spec 07). Manual: open `/web-cv-generator/` and `/web-cv-generator/?resume=francisco-veloz`.

## Impact

Wrong `base` breaks GitHub Pages and static JSON URLs. Skipping the catalog allowlist turns `?resume=` into a static-file oracle. Defining components inside `App` remounts Home/Preview every render and will break later fetch state — keep `RootScreen` at module scope. `verbatimModuleSyntax` requires `import type` for type-only imports.
