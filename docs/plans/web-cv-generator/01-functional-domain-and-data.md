# Domain and data

**Tipo:** Functional  
**Depende de:** [`README.md`](README.md), [`repos/personal-projects/resume-data-source/README.md`](../../../repos/personal-projects/resume-data-source/README.md), [`repos/utils/slides-generator/README.md`](../../../repos/utils/slides-generator/README.md)  
**Implementa:** Shared vocabulary, URL contract, catalog/resume schema, view-model mapping, allowlist rules, and typed error names that every later web-cv-generator spec must obey.  
**No incluye:** Vite, React, CSS, Zod source files, Playwright, or the Olivia pixel layout (those live in 02–07). This spec is the data law; it does not create files under `src/`.

## Resultado

A single functional contract defining Source, Catalog, Slug, Resume JSON, View-model, Preview, and Download PDF; how `?resume=` selects a file; which JSON fields appear on the sheet; and how load failures are named. Later specs resolve ambiguity by referring here.

## Requirements

### Vocabulary

| Term | Definition |
|------|------------|
| **Source** | One resume JSON file under `public/resumes/<slug>.json`. The source of truth for one preview. Many sources exist; one is active. |
| **Catalog** | The allowlist of sources: `public/resumes/catalog.json`. Home renders this list. Fetch of a resume JSON is legal only when its slug appears here. |
| **Slug** | Kebab-case identifier: one or more lowercase alphanumeric segments joined by single hyphens. Pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Examples: `francisco-veloz`, `olivia-sanchez`. Rejected: `../x`, `Foo`, `a.json`, `a_b`, empty string. |
| **Resume JSON** | An object matching resume-data-source `index.json` (profile, summary, workExperience, education, skills, plus unused collections). |
| **View-model** | `CvViewModel`: the only shape `CvDocument` may read. Produced by `toCvViewModel`. Skill ids, logos, and unused collections are gone. |
| **Home** | The catalog screen. Shown when the `resume` query param is absent or empty. |
| **Preview** | The A4 sheet plus studio toolbar. Shown when `resume` is a non-empty string. |
| **Download PDF** | User action that prints the sheet via `window.print()`. The browser “Save as PDF” dialog is the save step. Not a blob download, not a rasterizer. |
| **Studio chrome** | Toolbar, catalog cards, status screens. Not part of the printed page. |

### URL contract

Mirrors slides-generator `/?presentation=<name>`:

| Location search | Behavior |
|-----------------|----------|
| no `resume` key | Home |
| `resume` missing value or `resume=` | Home |
| `resume=<valid-slug-in-catalog>` | Preview that source |
| `resume=<valid-slug-not-in-catalog>` | Preview route, **not-found** (do not fetch a guessed path) |
| `resume=<invalid-slug>` | Preview route, **not-found** (do not fetch; do not interpolate the raw string into a URL path) |

Query parsing uses the standard `URLSearchParams` `resume` key (first value if repeated). Other keys are ignored.

Changing source: Home card click or equivalent link sets `?resume=<slug>` with `replace: false` (back button returns to Home). A “Back to catalog” control on Preview removes the param (navigate to `/` with no search).

Vite `base` is `/web-cv-generator/`. Public files are requested as:

```text
{BASE_URL}resumes/catalog.json
{BASE_URL}resumes/{slug}.json
```

`BASE_URL` is `import.meta.env.BASE_URL` (always begins and, except `/`, the catalog fetch must join without double slashes). Implement join in spec 03 as a pure helper `publicUrl(relativePath: string): string`.

### Catalog schema

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

| Field | Rules |
|-------|--------|
| `resumes` | Required array. Empty array is valid (Home empty state). |
| `slug` | Required. Must match the Slug pattern. Duplicates are invalid (catalog parse fails). |
| `title` | Required non-empty string after trim. Shown on the card heading. |
| `subtitle` | Required non-empty string after trim. One-line description on the card. |

No `file` field. The file name is always `${slug}.json`. Catalog entries must not contain `/`, `.`, or `..`.

Default v1 catalog contains exactly one entry: `francisco-veloz` / `Francisco Veloz` / `Default full-stack CV`. Additional JSON files may be added later by editing catalog + adding a file; the app must not scan the directory at runtime.

### Resume JSON schema (normative)

This is the contract `resumeSchema` in spec 03 must encode. Extra unknown keys are **stripped or kept**; they must not fail parse (`passthrough` or equivalent). Missing unused collections default to `[]`.

**profile** (required object):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `firstName` | string | yes | May be empty; view-model does not use it if `fullName` is set |
| `lastName` | string | yes | Same |
| `fullName` | string | yes | After trim must be length ≥ 1 or parse fails |
| `headline` | string | yes | May be empty; view-model omits title line if empty |
| `email` | string | yes | May be empty; omitted from contact join |
| `phone` | string | yes | May be empty |
| `location` | string | yes | May be empty |
| `website` | string | yes | May be empty |
| `profilePhoto` | string | yes | Ignored by renderer |

**summary** (required object):

| Field | Type | Required |
|-------|------|----------|
| `short` | string | yes (may be empty) |
| `long` | string | yes (may be empty) |
| `highlights` | `string[]` | no; default `[]`; ignored by renderer |

At least one of `short` or `long` should be non-empty for a useful CV; both empty is valid JSON and the Summary section is omitted.

**workExperience** (required array; default `[]` if you choose to default — spec 03 requires the key to be present as an array):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `position` | string | yes | |
| `company` | string | yes | |
| `employmentType` | string | yes | Ignored by renderer |
| `startDate` | string | yes | `YYYY-MM`; ignored by renderer (display uses `duration`) |
| `endDate` | `string \| null` | yes | `null` means current |
| `duration` | string | yes | Display date range, e.g. `Jun 2025 - Present` |
| `location` | string | yes | Ignored by renderer in v1 |
| `logo` | string | yes | Ignored |
| `responsibilities` | `string[]` | yes | Bullet list; empty array → heading only |
| `skills` | `number[]` | yes | Skill ids; ignored by renderer |

**education** (required array):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `degree` | string | yes | |
| `institution` | string | yes | |
| `duration` | string | yes | |
| `location` | string | yes | Ignored in v1 |
| `logo` | string | yes | Ignored |

No GPA or major fields exist in this schema. Do not invent them.

**skills** (required array):

| Field | Type | Required |
|-------|------|----------|
| `id` | number | yes |
| `name` | string | yes |
| `category` | string | yes; ignored by renderer in v1 |

**Unused collections** — required keys, default `[]`, ignored by renderer:

`projects`, `certifications`, `achievements`, `languages`, `socialNetworks`

Each unused collection may be an array of objects with unknown shape (`z.array(z.unknown())` or `z.array(z.record(z.string(), z.unknown()))`). Parse must succeed for the real `resume-data-source/index.json`.

### View-model mapping

`toCvViewModel(resume: Resume): CvViewModel`

```ts
type CvContactPart = string

type CvExperienceItem = {
  heading: string
  dates: string
  bullets: string[]
}

type CvEducationItem = {
  heading: string
  institution: string
  dates: string
}

type CvViewModel = {
  fullName: string
  headline: string | null
  contactLine: string | null
  summary: string | null
  experience: CvExperienceItem[]
  education: CvEducationItem[]
  skillNames: string[]
}
```

Mapping rules (exact):

1. `fullName` = `profile.fullName.trim()`.
2. `headline` = trimmed `profile.headline`, or `null` if empty.
3. `contactLine` = non-empty trimmed values among `[email, phone, location, website]` joined with ` | `. If none, `null`.
4. `summary` = trimmed `summary.long` if length ≥ 1, else trimmed `summary.short` if length ≥ 1, else `null`.
5. Each experience item: `heading` = `${position.trim()}, ${company.trim()}` (always include the comma+space even if one side is empty after trim — if both empty, `heading` is `", "` and the item still renders; tests use non-empty fixtures). `dates` = `duration.trim()`. `bullets` = `responsibilities` mapped with trim, dropping empty strings.
6. Each education item: `heading` = `degree.trim()`, `institution` = `institution.trim()`, `dates` = `duration.trim()`.
7. `skillNames` = `skills[].name` trimmed, dropping empty names, **preserving JSON order**. Category is not used. Do not sort. Do not de-duplicate.

Section omission (renderer, spec 05):

| Section | Omit when |
|---------|-----------|
| Summary | `summary === null` |
| Work experience | `experience.length === 0` |
| Education | `education.length === 0` |
| Key skills | `skillNames.length === 0` |

Header (name) always renders.

### Allowlist and fetch security

1. Parse catalog first (or reuse an in-memory catalog from Home).
2. If slug fails the Slug pattern → `ResumeNotFoundError` (do not fetch).
3. If slug is valid but not in `catalog.resumes[].slug` → `ResumeNotFoundError` (do not fetch).
4. Only then `GET {BASE_URL}resumes/{slug}.json`.
5. Never concatenate unsanitized user input into a path that contains `/` or `.`.
6. HTTP 404 after an allowlisted fetch → `ResumeNotFoundError` (catalog listed a missing file).
7. Network failure (TypeError / failed fetch) → `ResumeNetworkError`.
8. HTTP not OK other than 404 → `ResumeNetworkError` with status in `details`.
9. JSON parse failure or Zod failure → `ResumeValidationError` with issue paths.
10. Catalog fetch/parse failure → `CatalogLoadError`. Do not then fetch resume files.

Do not fetch `https://` resume URLs in v1. Do not read `resume-data-source` over the network.

### Typed errors (names are stable)

All extend a shared `ApplicationError` (`code`, `details`, `cause`). User-facing `message` is English and safe to show.

| Class | `code` | When | User-facing message (exact) |
|-------|--------|------|-----------------------------|
| `CatalogLoadError` | `CATALOG_LOAD` | Catalog HTTP/parse/Zod fail | `Could not load the resume catalog.` |
| `ResumeNotFoundError` | `RESUME_NOT_FOUND` | Bad slug, unknown slug, or allowlisted 404 | `That resume source was not found.` |
| `ResumeValidationError` | `RESUME_VALIDATION` | JSON/Zod fail on a resume file | `That resume file is not valid.` |
| `ResumeNetworkError` | `RESUME_NETWORK` | Network or non-404 HTTP error | `Could not load that resume. Check your connection and try again.` |

`ResumeValidationError.details.issues` is `string[]` of Zod paths (e.g. `profile.fullName`). Do not dump raw Zod objects into the UI. `getErrorMessage(unknown)` uses `instanceof Error` before `.message`.

### Default source

- File: `public/resumes/francisco-veloz.json`
- Produced/updated by `npm run sync-resume` from
  `repos/personal-projects/resume-data-source/index.json`
- Must remain valid against the schema above (the live file includes `summary.highlights` and unused collections)

Realistic ranges (for overflow and tests):

| Collection | Minimum fixture | Typical (Francisco) | Design for |
|------------|-----------------|---------------------|------------|
| workExperience | 1 | 9 | 12+ items, multi-page |
| education | 0–1 | 1 | 3 items |
| skills | 0–3 | 34 | 40 names, three columns |
| responsibilities per job | 1 | 4–7 | 10 bullets |

### Out of scope (v1)

In-app editing; accounts; backend; remote JSON URLs; rendering projects, certifications, achievements, languages, social networks, logos, or profile photo; GPA/major fields; skill category grouping; html2canvas / jsPDF / `@react-pdf/renderer`; silent PDF download without the print dialog; directory listing of `public/resumes`; git submodule registration.

## Architecture

```text
Catalog (allowlist)
  └── Source slug ──► Resume JSON ──► toCvViewModel ──► CvViewModel
                                              │
                                              └── CvDocument (sheet)
```

Home reads Catalog only. Preview reads Catalog (allowlist) then Resume JSON then view-model.

## Code to do

No application code in this spec. Types, Zod, and fetch: [03](03-frontend-scaffold-and-routing.md). Catalog UI: [04](04-home-catalog.md). Sheet: [05](05-cv-document-template.md). Print: [06](06-preview-chrome-and-pdf.md). E2E: [07](07-verification-and-e2e.md).

## Testing

Conceptual cases later specs must cover:

- Valid slug in catalog loads.
- Invalid slug never hits the network.
- Unknown slug never hits `resumes/unknown.json`.
- Duplicate catalog slugs fail catalog parse.
- `endDate: null` still parses.
- `highlights` optional.
- Empty `workExperience` omits the section after mapping.
- Contact join skips empty fields.
- Summary prefers `long` over `short`.

## Acceptance

- [ ] Vocabulary and URL table are unambiguous (Home vs Preview).
- [ ] Slug pattern and allowlist rules forbid path traversal.
- [ ] Resume field list matches resume-data-source README plus `highlights` optional.
- [ ] View-model mapping is complete for the five sheet sections.
- [ ] Error class names and user-facing messages are exact.
- [ ] v1 non-goals listed.

## Playwright scenarios unlocked

None in this spec. Named later: home with no param; `?resume=francisco-veloz`; `?resume=not-a-source`; `?resume=../etc`.

## Impact

Fetching `public/resumes/${rawQuery}.json` without an allowlist would let a crafted query request unexpected static files. Always validate slug shape, then membership, then fetch. Rendering unused collections would overflow the Olivia template and fight the pinned screenshot. Keeping them in the schema still lets `sync-resume` succeed.
