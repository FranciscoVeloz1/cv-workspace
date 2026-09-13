# 03 — Home Page Sections

Per-section spec for the single-scroll Home page (`src/pages/Home.tsx`). Section
order: Hero → Stats → About → Skills → Experience → Projects → Certificates →
Contact. Tokens resolve in [01-design-tokens.md](01-design-tokens.md); primitives
(`.btn`, `.badge`, `.section-header`, `.card`, `.icon-btn`, `.field`) in
[02-global-shell.md](02-global-shell.md).

Global section rules:

- Every `<section>` carries its anchor `id` and `aria-labelledby` pointing at its
  heading.
- Section padding: `var(--space-9) 0` desktop, `var(--space-8) 0` mobile.
- Alternating backgrounds: Hero/About/Experience/Contact on `--bg`;
  Skills/Certificates on `--bg-subtle`; Projects on `--bg`. The change is quiet —
  same text colors, no borders between sections.
- All data comes from `useResumeData()`. While `data` is null the section renders
  nothing (current behavior) — no skeletons, the JSON is bundled locally.

---

## 1. Hero (replaces `Showcase`)

Files: `src/components/Home/Hero.tsx` (renamed from `Showcase.tsx`),
`src/styles/Home/Hero.css`. Rendered inside `<main id='main-content'>`.

### 1.1 Layout

```
┌─────────────────────────────────────────────────────────┐
│  (o) avatar, 120px, accent ring                          │
│                                                          │
│  Hi, I'm                                                 │
│  Francisco Veloz          ← last name in accent          │
│  Senior Full-Stack Engineer | React, Node.js, Python…    │
│                                                          │
│  Full-stack engineer with 8+ years in technology…        │
│                                                          │
│  [ View my work ]  [ Get in touch ]                      │
│                                                          │
│  (GH) (LI) (YT) (globe)   ← icon buttons                 │
└─────────────────────────────────────────────────────────┘
```

Single column, left-aligned, `max-width: 720px`. Background: `--bg` plus
`--gradient-hero-wash` layered on the section. Padding-top: `var(--space-8)`
under the 72px nav; padding-bottom `var(--space-9)`.

### 1.2 Elements

| Element | Content source | Style |
|---------|---------------|-------|
| Avatar | `profile.profilePhoto`, `alt={profile.fullName}` | 120px circle, `object-fit: cover`, ring: `border: 4px solid var(--accent-bright)` + outer `box-shadow: 0 0 0 8px var(--accent-soft), var(--shadow-lg)` |
| Greeting | literal "Hi, I'm" | `--text-h3`, weight 500, `var(--text-secondary)` |
| Name | `profile.firstName` + `profile.lastName` (last in `.txt-accent`) | `--text-display`, weight 700, `var(--text)`, `letter-spacing: -0.02em`, `text-wrap: balance` |
| Headline | `profile.headline` | `--text-h3`, weight 500, `var(--accent-deep)` (dark: `var(--accent-bright)`); pipes in the string stay as-is |
| Summary | `profile.summary` (= `summary.short`) | `--text-body-lg`, `var(--text-secondary)`, `max-width: 60ch` |
| CTA row | — | flex, `gap: var(--space-4)`, `margin-top: var(--space-6)`; primary `.btn .btn-primary .btn-md` "View my work" → `#projects`; outline `.btn .btn-outline .btn-md` "Get in touch" → `#contact` |
| Social row | `socialNetworks` via `orderSocialNetworks()` | flex, `gap: var(--space-3)`, `margin-top: var(--space-6)`; `.icon-btn` per network using the Footer's `SOCIAL_ICON_MAP` (extract the map to `src/util/socialIcons.ts` and share it) |

Spacing stack (top→bottom margins between elements): avatar → greeting
`var(--space-6)`; greeting → name `var(--space-2)`; name → headline
`var(--space-3)`; headline → summary `var(--space-4)`.

### 1.3 The one authored moment

On first paint only: three groups (avatar; name block; CTA+social row) animate
`opacity: 0 → 1` and `translateY(12px) → 0`, 400ms `var(--ease-out)`, staggered
80ms, via a `hero-enter` class added on mount. Elements start visible in CSS
(`@starting-style`-free implementation: apply initial transforms only when
`hero-enter` is present) so no-JS or reduced-motion users never see hidden
content. `prefers-reduced-motion` neutralizes it via the existing global block.

### 1.4 Responsive

- ≤760px: avatar 96px; CTAs stack full-width (`flex-direction: column`,
  `align-items: stretch`); social row centers; text stays left-aligned (the
  current centered-everything mobile showcase goes away).

---

## 2. Stats strip (new component)

File: `src/components/Home/Stats.tsx`, `src/styles/Home/Stats.css`. Rendered as
the last block inside the Hero section (still above the fold on desktop).

### 2.1 Layout

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  8+          │  8           │  9           │  34          │
│  Years exp.  │  Projects    │  Certs       │  Technologies│
└──────────────┴──────────────┴──────────────┴──────────────┘
```

Four cells in a row, separated by `1px solid var(--border)` vertical dividers
(no card, no box — a quiet strip). `margin-top: var(--space-8)`,
`padding-top: var(--space-6)`, top divider `border-top: 1px solid var(--border)`.

### 2.2 Values (all derived at runtime, never hardcoded)

| Cell | Derivation |
|------|-----------|
| Years of experience | `new Date().getFullYear() - Math.min(...workExperience.map(e => parseInt(e.startDate)))`, rendered with `+` suffix. Earliest `startDate` is `2016-12` → renders "9+" today; it ages correctly on its own |
| Projects | `projects.length` |
| Certifications | `certifications.length` |
| Technologies | `skills.length` |

Labels: "Years of experience", "Projects shipped", "Certifications",
"Technologies".

### 2.3 Style

- Number: 32px / 700 / `var(--accent-strong)` / `font-variant-numeric: tabular-nums`.
- Label: `--text-small`, `var(--text-muted)`.
- Cell: `padding: 0 var(--space-6)`; first cell `padding-left: 0`.
- No counting animation.

### 2.4 Responsive

- ≤760px: 2×2 grid, `row-gap: var(--space-5)`; dividers become horizontal only
  between rows (or drop dividers entirely on mobile — simpler: drop them).

---

## 3. About Me (new component)

File: `src/components/Home/About.tsx`, `src/styles/Home/About.css`. `id="about"`.

### 3.1 Layout

```
About Me                    ← "Me" in accent
─────────────────────────
Full-stack software engineer with 8+ years of experience…
paragraphs with *highlighted phrases* in accent wash

Second paragraph…
```

Left-aligned, text column `max-width: 68ch`. `.section-header` with heading
`About <span class='txt-accent'>Me</span>`, no subtitle.

### 3.2 Content and highlighting

- Source: `summary.long`, split into paragraphs with the existing
  `splitParagraphs()` util (reuse from `src/util/text.ts`).
- Highlights: optional `summary.highlights: string[]` added to
  `src/data/index.json` (and `Summary` type in `src/types/resume.ts` extended
  with `highlights?: string[]`). Renderer wraps the first occurrence of each
  listed phrase in `<mark class='about-mark'>`.
- `.about-mark`: `background: var(--accent-soft); color: var(--accent-deep);
  border-radius: 4px; padding: 0 4px;` (no default mark styling).
- Fallback: when `highlights` is absent or a phrase is not found, paragraphs
  render plain. No error, no empty marks.
- Suggested initial highlights (to add to the data file): `"8+ years of
  experience"`, `"React, Node.js, Python"`, `"Dev Lead at PwC México"`,
  `"cutting daily inventory processing time by 88%"`.

---

## 4. Skills (new component)

File: `src/components/Home/Skills.tsx`, `src/styles/Home/Skills.css`.
`id="skills"`, background `--bg-subtle`.

### 4.1 Layout

```
Technologies I work with            ← "work with" in accent
─────────────────────────
LANGUAGES
[JavaScript] [TypeScript] [Python] …

FRONTEND
[React] [Next.js] …
```

`.section-header`: `Technologies I <span class='txt-accent'>work with</span>`.

### 4.2 Groups

- Group by `skill.category` (field already exists). Fixed display order and
  labels:

| `category` key | Label |
|----------------|-------|
| `languages` | Languages |
| `frontend` | Frontend |
| `backend` | Backend |
| `dataAndAI` | Data & AI |
| `devopsAndCloud` | DevOps & Cloud |
| `databases` | Databases |
| `other` | Other |

- Categories absent from data are skipped silently.
- Group label: `--text-small`, weight 600, `letter-spacing: 0.08em`,
  `text-transform: uppercase`, `var(--text-muted)`, `margin: var(--space-5) 0
  var(--space-3)`. (Uppercase is allowed here: it labels a group, not a heading.)
- Pills: `.badge`, `gap: var(--space-3)`, `flex-wrap: wrap`.
- All 34 skills render; no "show more".

---

## 5. Experience

Files: `src/components/Home/Experience.tsx`, `ExperienceItem.tsx`,
`src/styles/Home/Experience.css`, `ExperienceItem.css`. `id="experience"`.

### 5.1 Layout

```
Work experience               ← "experience" in accent
─────────────────────────
┌────────────────────────────────────────────────────┐
│ [logo] Dev Lead - Senior Associate        [pill: Jun 2025 - Present] │
│        PwC México · Guadalajara                    │
│        • responsibility one                        │
│        • responsibility two                        │
│        [React] [Node.js] [AWS]                     │
└────────────────────────────────────────────────────┘
   … 2 more cards …
              [ View all experiences ]
```

`.section-header`: `Work <span class='txt-accent'>experience</span>`. Cards stack
vertically, `gap: var(--space-5)`.

### 5.2 Experience card (`.card`, non-link → no hover lift)

| Element | Style |
|---------|-------|
| Logo | 56px square, `border-radius: var(--radius-md)`, `object-fit: contain`, `border: 1px solid var(--border)`, `background: var(--surface)`, padding 8px (logos are opaque PNGs; padding keeps them off the edge) |
| Position | `--text-h3`, weight 600, `var(--text)` |
| Company · location | `--text-ui`, `var(--text-secondary)`; separator `·` |
| Date pill | `.badge .badge-neutral`, pushed to the far right of the title row (`margin-left: auto`) |
| Responsibilities | `--text-body`, `var(--text-secondary)`; custom markers: each `li` gets `position: relative; padding-left: var(--space-4)` and an `li::before` 6px accent dot (`content: ''; position: absolute; left: 0; top: 0.65em; width: 6px; height: 6px; border-radius: 50%; background: var(--accent)`); item gap `var(--space-2)` |
| Skill pills | `.badge` row, `margin-top: var(--space-4)`, `gap: var(--space-2)` |
| Header row | flex, `align-items: center; gap: var(--space-4)` |

### 5.3 Show more / less

- Current behavior kept: first 3 of 9 entries, button toggles the rest.
- Button becomes `.btn .btn-ghost .btn-md`, centered, `margin-top:
  var(--space-6)`, labels "View all experiences" / "Show less" (rename from
  "Hide experiences").
- Expanding does not animate height; content simply renders (no layout-shift
  tricks needed below the fold).

### 5.4 Responsive

- ≤760px: header row wraps — logo + title block first, date pill drops to its
  own line under company (full-width row, left-aligned). No centered text
  (current mobile centering is removed).

---

## 6. Projects preview

Files: `src/components/Home/Projects.tsx`, `Card.tsx`,
`src/styles/Home/Projects.css`, `Card.css`. `id="projects"`.

### 6.1 Layout

```
Recent projects                          View all projects →
─────────────────────────
┌─────────┐ ┌─────────┐ ┌─────────┐
│ [img]   │ │ [img]   │ │ [img]   │
│ Title   │ │ Title   │ │ Title   │
│ desc…   │ │ desc…   │ │ desc…   │
│ [pills] │ │ [pills] │ │ [pills] │
└─────────┘ └─────────┘ └─────────┘
```

Header row: `.section-header` left (`Recent <span class='txt-accent'>projects</span>`,
margin-bottom 0), "View all projects" link right — `--text-ui`, weight 600,
`var(--accent-strong)`, trailing `fa-arrow-right` icon, hover `gap` grows 4px
(icon nudge, `--dur-fast`). Row: flex, `justify-content: space-between;
align-items: baseline; margin-bottom: var(--space-7)`.

Grid: `grid-template-columns: repeat(3, 1fr); gap: var(--space-5)`.
Shows the first **6** projects (up from 3 — the grid is the portfolio's core
content; 2 rows of 3).

### 6.2 Project card (`.card` + `.project-card`, whole card links to `/#/projects/:id`)

| Element | Style |
|---------|-------|
| Image | `aspect-ratio: 16 / 9; object-fit: cover; width: 100%`, top radii `var(--radius-lg) var(--radius-lg) 0 0`, card padding becomes 0 with content padded below (`padding: var(--space-5)` on the body div) |
| Title | `--text-h3`, 600, `var(--text)`; card hover turns it `var(--accent-strong)` |
| Date | `--text-badge`, `var(--text-muted)` |
| Description | `--text-small`, `var(--text-secondary)`, clamp 2 lines (`display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden`) |
| Skill pills | first 3 badges + `+N` neutral pill when more; `.badge` |
| Card hover | §5.5 lift + title color change |
| Focus | card `<a>` gets global `:focus-visible` ring |

The card is one `<Link>` wrapping image + body (no nested interactive elements,
so this is legal and accessible). Repo/demo links live on the detail page, not
the card.

### 6.3 Responsive

- ≤1080px: 2 columns. ≤760px: 1 column.

---

## 7. Certificates preview

Files: `src/components/Home/Certificate.tsx`, `CertificateItem.tsx`,
`src/styles/Home/Certificate.css`, `CertificateItem.css`. `id="certificates"`,
background `--bg-subtle`.

### 7.1 Layout

```
Licenses and certifications              View all →
─────────────────────────
┌──────────────────────────────────────────────────┐
│ [logo] Certificate name        Issuer · Date  ↗  │
├──────────────────────────────────────────────────┤
│ [logo] Certificate name        Issuer · Date  ↗  │
├──────────────────────────────────────────────────┤
│ [logo] Certificate name        Issuer · Date  ↗  │
└──────────────────────────────────────────────────┘
```

Header row identical in behavior to Projects (`Licenses and
<span class='txt-accent'>certifications</span>` + "View all certifications"
link). Shows first **4** certificates as horizontal rows — compact list, not a
card grid (the grid is reserved for projects; variety of rhythm keeps the page
from becoming "three identical card sections").

### 7.2 Certificate row (`.card` restyled as row, whole row links to `certificate.link`, external)

| Element | Style |
|---------|-------|
| Row | flex, `align-items: center; gap: var(--space-4); padding: var(--space-4) var(--space-5)`; rows separated by `gap: var(--space-3)` |
| Issuer logo | 48px square, contain, radius `--radius-sm`, border as Experience logo |
| Title | `--text-ui` + 1px (16px), weight 600, `var(--text)`; hover → `var(--accent-strong)` |
| Meta | `Issuer · Date`, `--text-small`, `var(--text-muted)` |
| Trailing icon | `fa-arrow-up-right-from-square`, 14px, `var(--text-muted)`; hover → `var(--accent-strong)`; `margin-left: auto` |
| Row hover | §5.5 lift |

Description text moves to the Certificates index page only (rows stay one line
where possible; title clamps at 2 lines on narrow screens).

### 7.3 Responsive

- ≤760px: logo 40px; meta wraps under title; trailing icon stays.

---

## 8. Contact

File: `src/components/Home/Form.tsx`, `src/styles/Home/Form.css`. `id="contact"`.
Keeps the Formspree endpoint (`https://formspree.io/f/mwkzrqzw`) and the
existing typed-error guard for Formspree responses.

### 8.1 Layout

```
            Get in touch
   Have a project or role in mind? …
   ─────────────────────────
            Name    [input]
            Email   [input]
            Message [textarea]
            [ Send message ]
            ✓ Thanks — I'll reply soon.
```

Centered column, `max-width: 640px; margin-inline: auto`.
`.section-header .section-header-center`: `Get in <span class='txt-accent'>touch</span>`
with subtitle "Have a project in mind or want to talk shop? My inbox is always
open."

### 8.2 Fields

- Three `.field` controls: **Name** (`name='name'`, text, required), **Email**
  (`name='email'`, email, required), **Message** (`name='message'`, textarea,
  6 rows, required). Labels always visible per §5.6 of the shell spec.
- Client validation: native `required` + `type='email'`; on invalid submit,
  mark fields `.field-error` and show the 13px danger message under each
  ("Please enter your name", "Please enter a valid email", "Please write a
  message").
- Submit: `.btn .btn-primary .btn-md`, full width on mobile, auto width
  (min 200px) centered on desktop.

### 8.3 Submission states (replaces the bare status string)

| State | UI |
|-------|-----|
| Idle | form enabled |
| Submitting | button loading variant (spinner + "Sending…"), `aria-busy`, fields disabled |
| Success | form replaced by inline panel: `.card` padding `var(--space-6)`, `fa-circle-check` 24px `var(--success)`, heading "Message sent" (`--text-h3`), body "Thanks for reaching out — I'll get back to you within a day or two." (`--text-body`, secondary), `role='status'` |
| Error | banner above form: `background: var(--danger-soft); color: var(--danger); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4)`, `role='alert'`, text from Formspree errors joined, fallback "Something went wrong — please try again or email me directly at {profile.email}" (email as `mailto` link) |

The existing `isFormspreeErrorResponse` type guard stays as-is (it already
narrows `unknown` correctly).

---

## 9. Home assembly (`src/pages/Home.tsx`)

```tsx
const Home = () => {
  useScroll()

  return (
    <>
      <Hero />
      <About />
      <Skills />
      <Experience />
      <Projects />
      <Certificate />
      <Form />
    </>
  )
}
```

`Stats` renders inside `Hero`. `Showcase.tsx/css` are deleted (git history keeps
them). `useScroll` keeps handling hash-scroll on route change; extend it to also
handle same-page anchor clicks from the Navbar if the current implementation
only runs on mount.

---

## Acceptance criteria

- [ ] All eight sections render in order with correct anchor ids and
      `aria-labelledby`.
- [ ] Hero matches §1: avatar ring, accent last name, both CTAs, four social
      icon buttons, single fade-up entrance that never hides content without JS.
- [ ] Stats derive from live data (verify by reading values off the built page
      against `src/data/index.json` counts: 8 projects, 9 certifications,
      34 skills, years from earliest `startDate`).
- [ ] About renders `summary.long` paragraphs at ≤68ch; highlights render as
      `.about-mark` when `summary.highlights` is present and disappear cleanly
      when removed.
- [ ] Skills groups match the §4.2 order/labels; empty categories absent from
      data do not render.
- [ ] Experience shows 3 cards, toggles to 9 and back, date pill right-aligned
      on desktop and wrapped on mobile.
- [ ] Projects preview shows 6 cards in 3/2/1 columns; whole card is one link;
      description clamps at 2 lines.
- [ ] Certificates preview shows 4 linked rows with external-link icon.
- [ ] Contact form shows all four submission states; error banner copy includes
      the direct email fallback; success panel replaces the form.
- [ ] Alternating `--bg` / `--bg-subtle` rhythm matches §Global rules.
- [ ] Verified at 1440px, 1080px, 375px in both themes; no horizontal overflow;
      `prefers-reduced-motion` produces a completely static page.
- [ ] `npm run build`, `npm run lint`, `npm run test:run` pass.
