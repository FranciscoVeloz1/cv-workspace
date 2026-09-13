# Portfolio Redesign — Spec Index

Complete design specification for the full redesign of the personal portfolio at
`repos/personal-projects/portfolio` (Vite + React 18 + react-router-dom 7, plain CSS
with custom properties, Poppins, Font Awesome 6.2.0, deployed to GitHub Pages via
HashRouter).

## Vision

A clean, calm, light-first personal portfolio. White canvas, deep-navy ink, one blue
accent family reused from the current brand (`#24bdff` / `#0d8cff` / `#0075e2`). The
design follows the reference screenshot's structure (left-aligned hero with circular
avatar, accent name, pill badges, stats strip) with the green accent swapped for the
brand blue. No scroll-reveal animations, no parallax, no gimmicks. The content leads;
the interface recedes.

Impeccable mode for this surface: **Experience** (portfolio/showcase), executed under
the user's brief: simple, sweet, clean, great UX. Where category defaults conflict
with the brief, the brief wins.

## Design principles

1. **Light first.** Light theme is the default for every visitor. Dark navy remains
   available as a toggle, refined to the same token system.
2. **One accent, used sparingly.** Blue marks the name, links, key phrases, primary
   buttons, and nothing else. Everything else is navy-ink and neutrals.
3. **Whitespace is the layout.** 96px section rhythm, 1080px container, generous line
   height. Sections separate by space and a alternating subtle background, not by
   boxes and borders.
4. **Still, not static.** Motion is limited to hover/focus feedback (150–250ms
   ease-out, transform/opacity/shadow only) and one authored moment: the hero content
   fade-up on first load. `prefers-reduced-motion` disables all of it.
5. **Every state exists.** Hover, focus-visible, active, disabled, loading, empty,
   and error are specified for every interactive element.
6. **Accessible by default.** Contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text
   and UI boundaries; visible focus rings; semantic HTML; keyboard-complete.

## Reference image notes

What we take from the reference screenshot:

- Left-aligned hero: circular avatar with accent ring, greeting line, name with
  accent-colored last name, role subtitle, short paragraph, filled + outline CTA
  pair, row of circular social icon buttons.
- Stats strip: four number + label pairs in a row.
- "About Me" section heading with the second word in accent color; body paragraphs
  with key phrases highlighted in accent.
- "Technologies I work with" skill pills.
- Top navbar: brand left, text links center, filled CTA button right.

What we deliberately do **not** take:

- The green accent (replaced by the brand blue scale).
- Any heavy entrance animation. Ours loads still, except the single hero fade-up.

## Information architecture

Routes (unchanged, HashRouter):

| Route | Page | Purpose |
|-------|------|---------|
| `/#/` | Home | Single-scroll page: Hero, Stats, About, Skills, Experience, Projects preview, Certificates preview, Contact |
| `/#/projects` | Projects index | Full grid of all 8 projects |
| `/#/projects/:id` | Project detail | Video, description, badges, demo/repo links |
| `/#/certificates` | Certificates index | All 9 certifications |

Home section order and anchor ids (used by navbar links):

1. Hero (`#main-content`, top of page)
2. Stats strip (part of hero section)
3. About Me (`#about`)
4. Skills (`#skills`)
5. Experience (`#experience`)
6. Projects preview (`#projects`)
7. Certificates preview (`#certificates`)
8. Contact (`#contact`)

Navbar anchors scroll to section ids on Home. From inner pages, navbar links navigate
to `/#/` plus the anchor (HashRouter: `/` then `document.getElementById` scroll via
the existing `useScroll` hook pattern).

## Data contract (no breaking changes)

All content comes from `src/data/index.json` (synced from resume-data-source by
`scripts/sync-resume-data.ts`) through `ResumeDataContext`. Current shape in
`src/types/resume.ts` stays valid. Two additive, optional extensions are specified:

| Addition | Type | Used by | Fallback when absent |
|----------|------|---------|----------------------|
| `summary.highlights` | `string[]` | About Me keyword highlighting | Plain paragraphs, no marks |
| `summary.short` | existing | Hero paragraph | — (already present) |

Everything else (stats numbers, skill groups, card content) derives from existing
fields at runtime: `projects.length`, `certifications.length`, `skills.length`,
earliest `workExperience[].startDate`, `skill.category`.

## Scope

In scope:

- New design token system (`vars.css` replaced), light default theme, dark alternate.
- Restyle and restructure of all Home sections, Navbar, Footer, shared primitives.
- Restyle of Projects index, Project detail, Certificates index pages.
- Font loading update in `index.html` (Poppins 400/500/600/700, drop Open Sans).
- Theme bootstrap script in `index.html` (default flips to light).
- New components: `Stats`, `Skills`, `About`, shared `Button`/`Badge`/`SectionHeader`.
  All under the existing `src/components/` layout per react-folder-structure rule.

Out of scope (non-goals):

- No new runtime dependencies. No Tailwind, no animation library, no icon library
  (Font Awesome 6.2.0 already loaded covers all icons).
- No content/schema breakage: `sync-resume-data.ts` keeps working; the two data
  additions are optional and backward compatible.
- No routing changes, no new pages.
- No scroll-reveal/parallax/animated counters. No gradient text. No glassmorphism.
- No CMS, backend, or form-provider change (Formspree endpoint stays).

## Spec files

| File | Contents |
|------|----------|
| [01-design-tokens.md](01-design-tokens.md) | Color, typography, spacing, radius, shadow, motion, breakpoint, z-index tokens; light + dark values; `vars.css` migration table; copy-paste-ready CSS |
| [02-global-shell.md](02-global-shell.md) | Theme system, global base styles, container, Navbar, Footer, and shared primitives (Button, Badge/Pill, SectionHeader, Card, IconButton, Input) with full state matrices |
| [03-home-sections.md](03-home-sections.md) | Hero, Stats, About, Skills, Experience, Projects preview, Certificates preview, Contact — layout, exact styles, content mapping, states, responsive behavior |
| [04-inner-pages.md](04-inner-pages.md) | Projects index, Project detail, Certificates index specs |

## How to read these specs

- Every value is exact. If a spec says `padding: 24px`, it is not a suggestion.
- Token references (e.g. `--accent-strong`) resolve in
  [01-design-tokens.md](01-design-tokens.md). Do not introduce raw hex values in
  component CSS; use tokens only.
- Each spec ends with **Acceptance criteria**. Implementation is done only when every
  box checks, `npm run build` and `npm run lint` pass, and the page is verified at
  1440px, 1080px, and 375px viewports in both themes.
- Conventions: block bodies and explicit returns in all TS/TSX; components live in
  `components/Name/`; no barrel-file-only imports that break tree-shaking.
