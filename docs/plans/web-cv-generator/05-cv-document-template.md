# CV document template

**Tipo:** UX/UI  
**Depende de:** [`03-frontend-scaffold-and-routing.md`](03-frontend-scaffold-and-routing.md), [`02-design-tokens-and-surfaces.md`](02-design-tokens-and-surfaces.md), [`repos/personal-projects/web-cv-generator/image.png`](../../../repos/personal-projects/web-cv-generator/image.png)  
**Implementa:** Olivia-template React document: `CvDocument`, `CvHeader`, `CvSection`, `CvExperienceItem`, `CvEducationItem`, `CvSkillsGrid`. View-model only. No toolbar, no scale, no print JS.  
**No incluye:** Preview chrome, `window.print`, Home, Playwright.

## Resultado

Given a `CvViewModel`, `CvDocument` renders a white A4-width article that matches `image.png`: centered uppercase name, headline, hairline, contact line, pale-steel section rails, experience and education rows (title left, dates right), disc bullets, three-column skills. Empty sections omitted. Francisco’s 9 jobs flow taller than one page (`min-height` one A4, height grows; print pagination in spec 06).

## Requirements

### Visual authority

Match `image.png`. If this spec and the screenshot disagree on structure, the screenshot wins for alignment and hierarchy; token values in spec 02 still win for color/type numbers.

Structure from the screenshot (top to bottom):

1. Centered name, uppercase, wide tracking
2. Centered headline
3. Centered hairline
4. Centered contact `email | phone | location`
5. Rail `SUMMARY` + paragraph
6. Rail `WORK EXPERIENCE` + jobs
7. Rail `EDUCATION` + schools
8. Rail `KEY SKILLS` + three columns of bullets

Do not add a photo, logos, skill bars, or a left sidebar.

### Section labels (exact, uppercase via CSS)

| id | Label |
|----|-------|
| summary | `Summary` |
| experience | `Work Experience` |
| education | `Education` |
| skills | `Key Skills` |

CSS `text-transform: uppercase` on the rail label. Do not pre-uppercase in JSX except tests that use `/summary/i`.

### Component contracts

`CvDocument` props:

```ts
type CvDocumentProps = {
  cv: CvViewModel
}
```

Root: `<article class={sheet} aria-label="Curriculum vitae">` containing one `<div class={page}>` (additional CSS pages in print come from fragmentation; v1 is one flowing `.cv-page`).

`CvHeader` props: `fullName`, `headline`, `contactLine`.

`CvSection` props: `title: string`, `children: ReactNode`. Renders a `<section>` with a rail heading (`h2`) then body.

`CvExperienceItem` props: `CvExperienceItem` type from spec 01.

`CvEducationItem` props: `CvEducationItem` type.

`CvSkillsGrid` props: `{ names: string[] }`.

### Layout rules (sheet)

`.cv-page`:

- width `var(--a4-width)`
- min-height `var(--a4-height)`
- background `var(--sheet-paper)`
- padding: `var(--a4-pad-top) var(--a4-pad-x) var(--a4-pad-bottom)`
- color `var(--sheet-ink)`
- font-family `var(--font-body)`
- box-shadow `var(--a4-shadow)` on screen (spec 06 removes in print)

Name (`h1`):

- font-family `var(--font-display)`
- font-size `var(--sheet-name-size)`
- font-weight `var(--sheet-name-weight)`
- letter-spacing `var(--sheet-name-tracking)`
- text-transform `uppercase`
- text-align `center`
- margin `0 0 4pt`

Headline (`p`):

- text-align `center`
- font-size `var(--sheet-headline-size)`
- font-weight `var(--sheet-headline-weight)`
- margin `0 0 10pt`
- omit element if `headline === null`

Hairline: `hr` height 0, border-top `1px solid var(--sheet-rule)`, margin `0 auto 10pt`, width `100%`

Contact (`p`):

- text-align `center`
- font-size `var(--sheet-contact-size)`
- color `var(--sheet-ink-muted)`
- margin `0 0 14pt`
- omit if `contactLine === null`

Rail `h2`:

- background `var(--sheet-rail)`
- color `var(--sheet-rail-ink)`
- font-family `var(--font-display)`
- font-size `var(--sheet-rail-size)`
- font-weight `var(--sheet-rail-weight)`
- letter-spacing `var(--sheet-rail-tracking)`
- text-transform `uppercase`
- padding `var(--sheet-rail-pad-y) var(--sheet-rail-pad-x)`
- margin `var(--sheet-section-gap) -0pt 8pt`
- width `100%` of the content box (full inner width)

Experience row:

- display flex; justify space-between; align baseline; gap 12pt
- heading: `h3`, size `--sheet-item-size`, weight `--sheet-item-weight`, margin 0
- dates: `p` or `time`, same size/weight, white-space nowrap, padding-left 8pt
- `ul` margin `4pt 0 10pt`, padding-left `16pt`, list-style disc
- `li` color `--sheet-ink-body`, size `--sheet-body-size`, line-height `--sheet-body-line`
- `break-inside: avoid` on the whole item (heading + list)

Education:

- same title/date row as experience
- institution as a `p` under the heading, size `--sheet-body-size`, weight 400, margin `0 0 2pt`
- no extra bullets (schema has none)

Skills:

- `ul` with `columns: 3`, `column-gap: 18pt`, list-style disc, padding-left `16pt`
- `break-inside: avoid` on `li`
- names in JSON order, no sort

Summary body: one `p`, `--sheet-ink-body`, `--sheet-body-size`, `--sheet-body-line`.

### Omission

Follow spec 01 section omission. Do not render an empty rail.

### Accessibility

- One `h1` (name)
- Section `h2` (rails)
- Job/degree `h3`
- Lists are real `ul`/`li`
- Document is not a landmark competing with Home; `article` + `aria-label`

### Anti-goals

Do not use canvas, SVG text, or tables for the whole layout. A flex row for title/dates is required. Do not hyphenate the name.

## Architecture

```text
CvDocument
  .cv-page
    CvHeader
    CvSection Summary?     → p
    CvSection Experience?  → CvExperienceItem[]
    CvSection Education?   → CvEducationItem[]
    CvSection Skills?      → CvSkillsGrid
```

`toCvViewModel` already exists (spec 03). This spec only renders.

## Code to do

### Files

- Create: `src/components/CvDocument/index.tsx`
- Create: `src/components/CvDocument/CvDocument.module.css`
- Create: `src/components/CvDocument/CvDocument.test.tsx`
- Create: `src/components/CvHeader/index.tsx`
- Create: `src/components/CvHeader/CvHeader.module.css`
- Create: `src/components/CvSection/index.tsx`
- Create: `src/components/CvSection/CvSection.module.css`
- Create: `src/components/CvExperienceItem/index.tsx`
- Create: `src/components/CvExperienceItem/CvExperienceItem.module.css`
- Create: `src/components/CvEducationItem/index.tsx`
- Create: `src/components/CvEducationItem/CvEducationItem.module.css`
- Create: `src/components/CvSkillsGrid/index.tsx`
- Create: `src/components/CvSkillsGrid/CvSkillsGrid.module.css`
- Create: `src/test/fixtures/olivia-view-model.ts`

Do not put CSS in `index.css` for these rules except tokens. Sheet shadow may live on `.page` in the document module.

### Olivia fixture (`src/test/fixtures/olivia-view-model.ts`)

Use this exact fixture so tests do not depend on Francisco’s live JSON:

```ts
import type { CvViewModel } from '../../types/cvViewModel'

export const oliviaViewModel: CvViewModel = {
  fullName: 'Olivia Sanchez',
  headline: 'Administrative Manager',
  contactLine: 'hello@reallygreatsite.com | 123-456-7890 | 123 Anywhere St, Any City',
  summary:
    'Detail-oriented administrative professional with over three years of experience providing comprehensive support to executive teams and office operations.',
  experience: [
    {
      heading: 'Administrative Assistant, Arowwai Industries',
      dates: 'Oct 2023 - Present',
      bullets: [
        'Managed executive calendars, schedule meetings, and coordinate travel arrangements.'
      ]
    },
    {
      heading: 'Office Coordinator, Borcelle',
      dates: 'Jan 2022 - Sept 2023',
      bullets: ['Provided administrative support to a team of 20+ employees.']
    }
  ],
  education: [
    {
      heading: 'Bachelor of Business Administration',
      institution: 'University of Business Excellence',
      dates: 'Jan 2019 - Feb 2021'
    }
  ],
  skillNames: [
    'Client Acquisition',
    'B2B Sales',
    'Negotiation',
    'Negotiation Skills',
    'Problem-Solving',
    'Time Management',
    'Relationship Management',
    'Market Analysis'
  ]
}
```

### `CvDocument`

```tsx
import { CvEducationItem } from '../CvEducationItem'
import { CvExperienceItem } from '../CvExperienceItem'
import { CvHeader } from '../CvHeader'
import { CvSection } from '../CvSection'
import { CvSkillsGrid } from '../CvSkillsGrid'
import type { CvViewModel } from '../../types/cvViewModel'
import styles from './CvDocument.module.css'

type CvDocumentProps = {
  cv: CvViewModel
}

export function CvDocument({ cv }: CvDocumentProps) {
  return (
    <article className={styles.sheet} aria-label='Curriculum vitae'>
      <div className={styles.page}>
        <CvHeader fullName={cv.fullName} headline={cv.headline} contactLine={cv.contactLine} />
        {cv.summary !== null ? (
          <CvSection title='Summary'>
            <p className={styles.summary}>{cv.summary}</p>
          </CvSection>
        ) : null}
        {cv.experience.length > 0 ? (
          <CvSection title='Work Experience'>
            {cv.experience.map((item) => {
              return (
                <CvExperienceItem
                  key={`${item.heading}-${item.dates}`}
                  heading={item.heading}
                  dates={item.dates}
                  bullets={item.bullets}
                />
              )
            })}
          </CvSection>
        ) : null}
        {cv.education.length > 0 ? (
          <CvSection title='Education'>
            {cv.education.map((item) => {
              return (
                <CvEducationItem
                  key={`${item.heading}-${item.dates}`}
                  heading={item.heading}
                  institution={item.institution}
                  dates={item.dates}
                />
              )
            })}
          </CvSection>
        ) : null}
        {cv.skillNames.length > 0 ? (
          <CvSection title='Key Skills'>
            <CvSkillsGrid names={cv.skillNames} />
          </CvSection>
        ) : null}
      </div>
    </article>
  )
}
```

Keys: if two jobs share heading+dates, append index. Prefer `key={`${item.heading}-${item.dates}-${index}`}` with the map index to be safe.

### CSS Modules (normative snippets)

`CvDocument.module.css`:

```css
.sheet {
  color: var(--sheet-ink);
}

.page {
  width: var(--a4-width);
  min-height: var(--a4-height);
  background: var(--sheet-paper);
  padding: var(--a4-pad-top) var(--a4-pad-x) var(--a4-pad-bottom);
  box-shadow: var(--a4-shadow);
}

.summary {
  margin: 0;
  color: var(--sheet-ink-body);
  font-size: var(--sheet-body-size);
  line-height: var(--sheet-body-line);
}
```

`CvHeader.module.css`: implement name/headline/rule/contact rules from Layout rules.

`CvSection.module.css`: rail `h2` rules.

`CvExperienceItem.module.css`: flex header row + avoid break:

```css
.item {
  break-inside: avoid;
  page-break-inside: avoid;
}
```

`CvSkillsGrid.module.css`:

```css
.list {
  columns: 3;
  column-gap: 18pt;
  margin: 0;
  padding-left: 16pt;
}

.list li {
  break-inside: avoid;
  font-size: var(--sheet-body-size);
  color: var(--sheet-ink-body);
  line-height: var(--sheet-body-line);
}
```

### Tasks

- [ ] **Step 1: Failing `CvDocument.test.tsx`**

```tsx
render(<CvDocument cv={oliviaViewModel} />)
expect(screen.getByRole('heading', { level: 1, name: 'Olivia Sanchez' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: /summary/i })).toBeInTheDocument()
expect(screen.getByText(/Arowwai Industries/)).toBeInTheDocument()
expect(screen.getByText('University of Business Excellence')).toBeInTheDocument()
expect(screen.getByText('Client Acquisition')).toBeInTheDocument()
```

Empty sections:

```tsx
const empty: CvViewModel = {
  fullName: 'Ada Lovelace',
  headline: null,
  contactLine: null,
  summary: null,
  experience: [],
  education: [],
  skillNames: []
}
render(<CvDocument cv={empty} />)
expect(screen.queryByRole('heading', { name: /summary/i })).not.toBeInTheDocument()
expect(screen.getByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument()
```

- [ ] **Step 2: Run test; expect FAIL**

```bash
cd repos/personal-projects/web-cv-generator
npm test -- src/components/CvDocument/CvDocument.test.tsx
```

- [ ] **Step 3: Implement the component tree + CSS.** Do not wire into PreviewPage yet (spec 06). Export `CvDocument` for tests.

- [ ] **Step 4: Tests PASS.** Also render the synced Francisco JSON:

```tsx
import franciscoJson from '../../../public/resumes/francisco-veloz.json'
import { resumeSchema } from '../../utils/resumeSchema'
import { toCvViewModel } from '../../utils/toCvViewModel'

const francisco = resumeSchema.parse(franciscoJson)
render(<CvDocument cv={toCvViewModel(francisco)} />)
expect(screen.getByRole('heading', { level: 1, name: /Francisco/ })).toBeInTheDocument()
expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThanOrEqual(
  francisco.workExperience.length
)
```

`h3` count is experience + education headings. Assert experience items via job company strings or `getAllByRole('heading', { level: 3 })` length === `workExperience.length + education.length`.

- [ ] **Step 5: Commit only if asked.**

## Testing

| Check | Expected |
|-------|----------|
| Olivia fixture | Name, four rails, a job, a school, a skill |
| Empty optional sections | Only `h1` |
| Francisco JSON | Parses and renders all jobs (count experience headings = `workExperience.length`) |
| Skills order | First skill name in JSON is first list item |

## Acceptance

- [ ] Folder-per-component with named exports.
- [ ] Tokens only; no raw hex in modules.
- [ ] Screenshot structure matched (centered header, rails, 3-col skills).
- [ ] `break-inside: avoid` on items.
- [ ] Tests green.

## Playwright scenarios unlocked

Preview showing name `Francisco González Veloz` (spec 06/07).

## Impact

Hard-coding Francisco copy in `CvDocument` would break the multi-source requirement. Always render from `CvViewModel`. Using `columns: 3` on a 1–2 skill list still works; do not special-case column count. Long unbreakable headings may overflow the date column — allow the heading to wrap; dates stay nowrap.
