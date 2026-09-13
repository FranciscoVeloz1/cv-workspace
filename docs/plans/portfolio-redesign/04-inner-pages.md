# 04 — Inner Pages

Specs for the three non-Home routes: Projects index (`/#/projects`), Project
detail (`/#/projects/:id`), Certificates index (`/#/certificates`). Tokens in
[01-design-tokens.md](01-design-tokens.md); primitives in
[02-global-shell.md](02-global-shell.md); card/row patterns in
[03-home-sections.md](03-home-sections.md).

Shared page rules:

- Page header: `--text-h1` title with one `.txt-accent` keyword, optional
  `--text-body` subtitle in `var(--text-secondary)`, block margin-bottom
  `var(--space-7)`. Padding-top `var(--space-8)` under the sticky nav.
- Background: `--bg` for all inner pages (no alternating sections here).
- `useScroll()` stays on every page (scroll restore on route change).
- Empty data renders nothing (JSON is bundled; no skeletons).

---

## 1. Projects index (`src/pages/Projects/Projects.tsx`)

### 1.1 Layout

```
Francisco's projects
All 8 projects — code, demos, and write-ups.
─────────────────────────
┌─────────┐ ┌─────────┐ ┌─────────┐
│ cards…  │ │         │ │         │
└─────────┘ └─────────┘ └─────────┘
```

- Title: `Francisco's <span class='txt-accent'>projects</span>`
  (`profile.firstName`, existing fallback "Francisco").
- Subtitle: "All {projects.length} projects — code, demos, and write-ups."
  (count interpolated).
- Grid: same `.project-card` component and grid as the Home preview
  (3 / 2 / 1 columns at desktop / ≤1080px / ≤760px), rendering **all**
  projects, no slicing.
- The current `:last-child` centering rule for odd rows is kept only for the
  2-column breakpoint: last odd card spans `grid-column: 1 / -1` with
  `max-width: 560px; justify-self: center`. At 3 columns an 8-item grid leaves
  two cells — acceptable, no centering hack there.

### 1.2 Back navigation

- Top of page, above the title: `.btn .btn-ghost .btn-sm` "← Back home"
  (`fa-arrow-left` icon) linking to `/`. Same treatment on all inner pages.

---

## 2. Project detail (`src/pages/Projects/Project.tsx`)

### 2.1 Layout

```
← Back to projects

Jun 2024                              ← date, muted
Project Title                         ← h1
[ ▶ Live demo ]  [ GH Repository ]    ← buttons (conditional)

┌────────────────────────────────────┐
│            video embed             │
└────────────────────────────────────┘

Description paragraphs…

[pill] [pill] [pill]
```

Single column, `max-width: 860px` (wider than text measure because of the
video; description paragraphs keep their own `max-width: 68ch`).

### 2.2 Elements

| Element | Style |
|---------|-------|
| Back link | `.btn .btn-ghost .btn-sm` "Back to projects" → `/#/projects`, `margin-bottom: var(--space-6)` |
| Date | `--text-small`, `var(--text-muted)` |
| Title | `--text-h1`, weight 700, `var(--text)`, `text-wrap: balance`, `margin: var(--space-2) 0 var(--space-5)` |
| Action row | flex, `gap: var(--space-3)`, `margin-bottom: var(--space-7)`; Live demo = `.btn .btn-primary .btn-md` with `fa-play`; Repository = `.btn .btn-outline .btn-md` with `fa-github`. Each renders only when `project.demo` / `project.git` is non-empty (current conditional logic kept). Both `target='_blank' rel='noreferrer'` |
| Video | existing `Video.tsx` embed; container gets `border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border); box-shadow: var(--shadow-sm)`; keeps 16:9 responsive behavior |
| Description | `splitParagraphs(project.description)` → `<p>` stack, `--text-body`, `var(--text-secondary)`, `max-width: 68ch`, `gap: var(--space-4)`, `margin-top: var(--space-7)` |
| Badges | `.badge` row, `gap: var(--space-2)`, `flex-wrap: wrap`, `margin-top: var(--space-6)`; renders only when `project.badges.length > 0` (current logic kept) |

### 2.3 Not-found state

Current "Project not found." plain text becomes: `.section-header
.section-header-center` with title `Project <span class='txt-accent'>not
found</span>`, subtitle "This project doesn't exist or was removed.", and a
`.btn .btn-primary .btn-md` "Back to projects". Centered vertically with
`padding: var(--space-9) 0`.

### 2.4 Responsive

- ≤760px: action buttons stack full-width; video keeps 16:9 at 100% width
  (replaces the fixed 260px height rule).

---

## 3. Certificates index (`src/pages/Certificates/index.tsx`)

### 3.1 Layout

```
← Back home

Licenses and certifications
All 9 credentials, newest first.
─────────────────────────
┌──────────────────────────────────────────────────┐
│ [logo] Certificate name        Issuer · Date  ↗  │
│        2-line description…                        │
├──────────────────────────────────────────────────┤
│ … all 9 rows …                                   │
└──────────────────────────────────────────────────┘
```

- Title: `Licenses and <span class='txt-accent'>certifications</span>`;
  subtitle "All {certificates.length} credentials." (count interpolated).
- Rows: the same linked row pattern as the Home preview
  ([03-home-sections.md](03-home-sections.md) §7.2), with one addition — the
  certificate `description` renders under the title/meta block:
  `--text-small`, `var(--text-secondary)`, clamp 2 lines, `margin-top:
  var(--space-2)`.
- All 9 certificates render; no slicing, no pagination.
- Sort: data order is already newest-first; do not re-sort client-side.

### 3.2 Responsive

- ≤760px: same row adjustments as the Home preview (40px logo, meta wraps,
  description clamp holds).

---

## Acceptance criteria

- [ ] Projects index renders all 8 projects in the shared card grid with the
      interpolated count subtitle and working back link.
- [ ] Project detail renders conditionally: no demo button when `demo` is
      null/empty, no repository button when `git` is empty, no badge row when
      `badges` is empty (verify against a project missing each field).
- [ ] Project detail not-found state matches §2.3 and links back to
      `/#/projects`.
- [ ] Video embed keeps 16:9 at every viewport with the rounded, bordered
      frame.
- [ ] Certificates index renders all 9 rows with descriptions, external-link
      icons, and the interpolated count subtitle.
- [ ] All three pages verified at 1440px, 1080px, 375px in both themes.
- [ ] `npm run build`, `npm run lint`, `npm run test:run` pass.
