# Product

<!-- impeccable:product-schema 1 -->

> Inferred from `docs/plans/web-cv-generator` (README + spec 01). User asked to execute those specs; no extra interview round.

## Platform

web

## Stack

delegated from spec: Vite 8 + React 19 + TypeScript + CSS Modules + `react-router-dom` ^7.6.2 + Zod ^3.24.2 + Vitest + Playwright. Vite `base` `/web-cv-generator/`. No Next.js, no Tailwind, no PDF npm library.

## Users

Francisco (or anyone with a matching JSON file) at a desk, about to send a CV PDF to a recruiter. One person, one source of truth, one export.

## Product Purpose

Quiet print-studio tool. Pick an allowlisted resume JSON, preview it on an A4 sheet that matches the Olivia template, download a selectable-text PDF via the browser print dialog.

Success: the sheet on screen is the sheet that prints; the recruiter can select text in the PDF.

## Positioning

Preview HTML *is* the print document. No html2canvas, jsPDF, or `@react-pdf/renderer`. Catalog slugs are the only legal fetch keys. Neighboring resume sites that rasterize or fetch remote URLs cannot copy this contract.

## Operating Context

- App root: `repos/personal-projects/web-cv-generator`
- Data sibling: `repos/personal-projects/resume-data-source/index.json` via `npm run sync-resume`
- Query-param source selection, same idea as slides-generator `?presentation=`
- Visual authority for the sheet: `image.png` in this folder
- Production URL shape: `https://<host>/web-cv-generator/?resume=francisco-veloz`

## Capabilities and Constraints

Terminology (stable): Source, Catalog, Slug, Resume JSON, View-model, Home, Preview, Download PDF, Studio chrome.

URL: `/` with optional `?resume=<slug>`. Empty or missing `resume` → Home. Non-empty → Preview (including not-found). Unknown paths redirect to `/`.

Slug: `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Fetch only after catalog membership. Never interpolate raw query into a path.

Sheet fields: header, summary, experience, education, skills. Not rendered in v1: projects, certifications, achievements, languages, socialNetworks, logos, photo, skill categories.

Errors (exact user copy):

- `Could not load the resume catalog.`
- `That resume source was not found.`
- `That resume file is not valid.`
- `Could not load that resume. Check your connection and try again.`

Out of scope v1: in-app editor, accounts, backend, remote JSON URLs, silent PDF download, directory listing of `public/resumes`.

## Brand Commitments

- Product name in the browser title: `CV Generator`
- Button label: `Download PDF`
- Home heading: `Resume sources`
- Preview heading (scaffold): `CV preview`
- Language: English UI
- Pinned sheet look: Olivia template; do not invent a second resume layout
- Studio chrome recedes; the white A4 sheet is the product

## Evidence on Hand

- Live resume JSON: `repos/personal-projects/resume-data-source/index.json` (9 jobs, 34 skills, `endDate: null` on current role, `summary.highlights` present)
- Pinned screenshot: `image.png`
- Specs: `docs/plans/web-cv-generator/01`–`07`

Do not fabricate testimonials, employer quotes, or extra CV sections.

## Product Principles

1. The sheet is the product. Chrome exists to pick a source and print.
2. One layout for screen and PDF.
3. Allowlisted local JSON only.
4. Same schema as resume-data-source; renderer maps five sections.
5. Every state exists: loading, empty, error, not-found, default, hover, focus, disabled.

## Accessibility & Inclusion

Keyboard-complete chrome. Contrast AA for chrome and body text on the sheet. Minimum 44px hit targets on chrome controls. Sheet itself is not interactive. `prefers-reduced-motion: reduce` kills chrome transitions. No dark theme in v1.
