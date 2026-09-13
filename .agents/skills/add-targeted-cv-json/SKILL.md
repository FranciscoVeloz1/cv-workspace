---
name: add-targeted-cv-json
description: Use when the user pastes a job description, job posting, vacancy, or target role and wants a new tailored CV JSON, resume source, or catalog card in web-cv-generator. Also use when adding a job-specific variant of resume-data-source without changing the default Francisco sync.
---

# Add targeted CV JSON

Turn **one job description** into **one new resume JSON** for `repos/personal-projects/web-cv-generator`. Facts come only from `repos/personal-projects/resume-data-source/index.json`. The printed sheet reads that JSON via the catalog allowlist.

This is not markdown CV generation (`md-to-pdf`). This is not `npm run sync-resume` (that overwrites the default source).

## Paths

| Role | Path |
|------|------|
| Fact source (read-only) | `repos/personal-projects/resume-data-source/index.json` |
| New CV file | `repos/personal-projects/web-cv-generator/public/resumes/<slug>.json` |
| Catalog | `repos/personal-projects/web-cv-generator/public/resumes/catalog.json` |
| Schema | `repos/personal-projects/web-cv-generator/src/utils/resumeSchema.ts` |
| Slug pattern | `^[a-z0-9]+(?:-[a-z0-9]+)*$` |

Do not write `resume-data-source/index.json`. Do not overwrite `public/resumes/francisco-veloz.json`. Do not invent a `file` field in the catalog (filename is always `<slug>.json`).

## Inputs

Resolve from the user message. Ask only if the job text is missing.

| Input | Required | Default |
|-------|----------|---------|
| Job description | yes | none — title-only is allowed; a URL must be fetched first |
| Slug | no | `francisco-veloz-<role-kebab>` (company token if needed for uniqueness) |
| Catalog title | no | `Francisco Veloz` |
| Catalog subtitle | no | one line: role plus company or focus, e.g. `Staff frontend — Acme` |

If the chosen slug already exists in `catalog.json`, append `-2`, `-3`, … Do not replace that entry.

## Workflow

```
Task Progress:
- [ ] 1. Read index.json (facts) and catalog.json (slugs)
- [ ] 2. Deep-copy index.json; do not build a new object from scratch
- [ ] 3. Tailor copy (headline, summary, skill order, experience bullets / optional job drop)
- [ ] 4. Write public/resumes/<slug>.json (2-space JSON, trailing newline)
- [ ] 5. Append catalog.json entry; keep francisco-veloz first
- [ ] 6. Parse both files; reply with slug, preview URL, and honest gaps
```

### 1. Read

Read the live `index.json` and `catalog.json` every run. Do not reuse a remembered resume. If the user gave a posting URL, fetch it before tailoring.

### 2. Copy

Start from a deep copy of `index.json`. Keep every required key: `profile`, `summary`, `workExperience`, `education`, `skills`, `projects`, `certifications`, `achievements`, `languages`, `socialNetworks`.

**Locked (copy unchanged):** `profile.firstName`, `lastName`, `fullName`, `email`, `phone`, `location`, `website`, `profilePhoto`. Job `company`, `position`, `startDate`, `endDate`, `duration`, `employmentType`. Skill `id` / `name` / `category` pairs. Education rows unless the user asked to drop them. Unused collections: keep the source arrays (filter projects only if the user asked; never invent entries).

### 3. Tailor

Allowed edits, using only facts already in the copy:

- `profile.headline` — retarget to the role; do not claim stacks or seniority the source does not support.
- `summary.short`, `summary.long`, `summary.highlights` — rewrite from existing jobs, skills, and metrics. `long` is what the sheet prints.
- `skills` — reorder so job-matched names come first; drop names with no relevance. Do not add skills. Do not rename. Do not change ids. Sheet order is JSON order.
- `workExperience` — keep reverse-chronological order. Reorder or drop **bullets** inside a job. Drop a whole job only when it hurts the target (weak fit, space). Do not reorder jobs out of date order. Do not add bullets, employers, titles, dates, or metrics.

If the posting needs something the source does not have, omit it. List those gaps in the **chat reply**, not as fake JSON.

### 4. Write the CV file

Pretty-print JSON, indent 2, Unix newline at EOF. Path: `public/resumes/<slug>.json`.

### 5. Catalog

Append (do not prepend):

```json
{
  "slug": "francisco-veloz-staff-frontend",
  "title": "Francisco Veloz",
  "subtitle": "Staff frontend — Acme"
}
```

`slug` must match the file basename (no `.json`). Duplicate slugs fail catalog parse. `title` and `subtitle` must be non-empty after trim.

### 6. Validate and report

From `repos/personal-projects/web-cv-generator`, `JSON.parse` both files. Check: slug regex, catalog lists the slug, resume has the required keys and arrays, `profile.fullName` non-empty, each `endDate` is `string` or `null`. Then:

```bash
npx vitest run src/utils/resumeSchema.test.ts src/utils/catalogSchema.test.ts
```

Reply with:

- slug
- preview path: `/web-cv-generator/?resume=<slug>`
- what changed vs the default CV (headline, skills order, jobs kept/dropped)
- gaps vs the posting (honest misses)

Do not commit unless asked. Do not add GitHub Actions. Do not run `sync-resume`.

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Invent jobs, dates, or metrics | Delete them. Only source facts. |
| Overwrite `francisco-veloz.json` | New slug file only. |
| Edit `resume-data-source/index.json` | Read-only. |
| Write JSON under `src/` or repo root | Only `public/resumes/`. |
| Skip `catalog.json` | Sheet 404s; Home will not list it. |
| Put default entry second | Keep `francisco-veloz` first. |
| Claim a skill not in `skills[]` | Drop the claim. |
| Hand-build JSON and drop unused keys | Deep-copy first. |
| Use `sync-resume` for this variant | That copies the untailored source onto the default slug. |
