---
name: md-to-pdf
description: Converts a markdown file to PDF with repos/utils/cv-generator (md-to-pdf / Puppeteer, A4, shared stylesheet). Use when the user shares a .md path and wants a PDF, or asks to convert markdown to PDF, print md as pdf, or reuse cv-generator conversion for any document.
---

# md-to-pdf

Turn **one markdown file** into a PDF with `repos/utils/cv-generator`. Same engine as CV export (`md-to-pdf`, Chromium, A4, compact Helvetica CSS). Not limited to resumes.

Do not generate or rewrite the markdown. Do not use pandoc, wkhtmltopdf, Playwright PDF, or a one-off Puppeteer script. Do not run bare `npm run convert` for a single arbitrary path (that converts **all** of `cv-md-files/`).

CV **content** is a different skill (`create-cv`). This skill only renders an existing `.md`.

## Inputs

Resolve from the user message. `input` is required.

| Input | Default | Maps to |
|-------|---------|---------|
| `input` | none — ask if missing | first arg to `node index.js` |
| `output` | sibling of `input`, same basename, `.pdf` | second arg; omit to use default |

If the user names several markdown files, run the converter **once per file**. Do not invent paths.

## Invoke

Workspace: `/home/francisco/repos/cv-workspace`. Converter: `repos/utils/cv-generator`.

```bash
cd repos/utils/cv-generator
npm install
node index.js /absolute/path/to/file.md
```

Explicit output:

```bash
node index.js /absolute/path/to/file.md /absolute/path/to/file.pdf
```

Pass **absolute** paths. Relative args resolve from the process cwd (`repos/utils/cv-generator` if you `cd` there), not the markdown’s folder.

Shell needs **`all`** (Chromium). Node 18+. `npm install` only when `node_modules` is missing. Do not commit `node_modules`, `results/`, or generated PDFs unless the user asked.

`index.js` remaps an empty sandbox `PUPPETEER_CACHE_DIR` to `$HOME/.cache/puppeteer` when Chrome already lives there. If stdout still says `Could not find Chrome`, install once from `repos/utils/cv-generator`:

```bash
npx puppeteer browsers install chrome
```

Success: stdout contains `Done: <outputPath>` and that file exists. Failure: `Conversion failed:` + message; do not retry with a different PDF stack.

No-arg `node index.js` / `npm run convert` = batch `cv-md-files/*.md` → `results/*.pdf`. Use only when the user asked to convert the CV folder.

## Output

Reply with the PDF path (and size if cheap). Do not dump binary. Do not open a browser unless the user asked to preview.

## Do not

- Copy the source into `cv-md-files/` to “reuse” batch mode
- Change converter CSS/`pdf_options` unless the user asked to restyle
- Treat this as resume writing, ATS tailoring, or `resume-data-source` work
