---
name: create-cv
description: Generates a tailored, ATS-optimized resume markdown file from job requirements using repos/resume-data-source/index.json and repos/cv-generator/resources/template-cv.md. Use when the user asks to create, generate, tailor, or write a CV/resume for a specific job, role, or job description.
---

# Create CV

Generate a job-targeted resume as a **finished markdown file** — not a filled template skeleton.

## Input / Output

| | |
| --- | --- |
| **Input** | Job requirements: job description, role title, required skills, company context, or user-stated targeting notes |
| **Data source** | `repos/resume-data-source/index.json` (single source of truth — never invent experience) |
| **Structure source** | `repos/cv-generator/resources/template-cv.md` (read-only skeleton — do not overwrite) |
| **Output** | `repos/repos/cv-generator/cv-md-files/<firstname>-<lastname>-<target-role>.md` |

Example output path: `repos/cv-generator/cv-md-files/francisco-veloz-senior-fullstack.md`

After saving, optionally run `npm run convert` inside `repos/cv-generator/` to produce a PDF in `results/`. The markdown file is the primary deliverable.

## Workflow

Copy and track progress:

```
CV Generation Progress:
- [ ] Step 1: Parse job requirements
- [ ] Step 2: Read resume data
- [ ] Step 3: Define positioning
- [ ] Step 4: Select and rank content
- [ ] Step 5: Write tailored sections
- [ ] Step 6: Assemble markdown file
- [ ] Step 7: Validate output
- [ ] Step 8: Save to repos/cv-generator/cv-md-files/
```

### Step 1: Parse job requirements

Extract from the user's input:

- **Role title** — used in headline, summary, and filename
- **Must-have skills** — keywords to mirror in skills + bullets
- **Nice-to-have skills** — include only if present in `index.json`
- **Seniority level** — drives page length (1 vs 2 pages) and depth
- **Domain focus** — e.g. AI, data engineering, full-stack, mobile, DevOps
- **Exact terminology** — note how the JD spells technologies ("React.js" vs "React", "CI/CD", etc.)

If requirements are vague, infer a reasonable target role from the strongest matching experience in `index.json` and state your assumption in the response.

### Step 2: Read resume data

Read `repos/resume-data-source/index.json` completely before writing anything.

Key sections:

- `profile` — contact header
- `summary.short` / `summary.long` — starting point for tailored summary (rewrite, do not copy verbatim unless it already fits)
- `skills[]` — each skill has `id`, `name`, `category`
- `workExperience[]` — `position`, `company`, `employmentType`, `duration`, `location`, `responsibilities[]`, `skills[]` (IDs)
- `projects[]` — `name`, `description`, `repo`, `skills[]` (IDs)
- `education[]`, `certifications[]`, `achievements[]`, `languages[]`
- `socialNetworks[]` — filter by `platform` (`LinkedIn`, `GitHub`, etc.)

**Never use** `profilePhoto`, `logo`, `image`, or `video` fields.

For skill ID resolution: match `workExperience[].skills` and `projects[].skills` IDs against `skills[].id` to get names.

### Step 3: Define positioning

Choose **one** dominant professional identity that best matches the job requirements AND is supported by real data.

Examples: Senior Full-Stack Engineer, AI Engineer, Data Engineer, DevOps Engineer, Tech Lead.

Every section must reinforce this identity. Cut anything that competes with it.

Rewrite `profile.headline` to align with the target role while staying truthful.

### Step 4: Select and rank content

Apply these limits:

| Section | Rule |
| --- | --- |
| **Length** | 1 page for junior/mid; 2 pages max for senior/lead |
| **Work experience** | Most recent first. Keep all relevant roles; trim older/irrelevant to 2–3 bullets or omit. Non-software roles only if they support the narrative (1–2 bullets max). |
| **Bullets per role** | Current/relevant roles: 4–7. Older roles: 2–3. |
| **Projects** | 3–5 max. Pick by technical complexity, impact, and JD keyword overlap. |
| **Certifications** | Relevant + recognized only. Name, issuer, date — no descriptions. |
| **Achievements** | Include only if they support positioning; omit section if empty. |
| **Skills categories** | Drop entire categories with no relevant skills. Reorder skills within each category: JD-relevant first. |
| **Empty sections** | Remove the section heading entirely — never leave a blank section. |

**Employment type:** show `Contract` or `Freelance` in the role line; omit `Full-time`.

**Bullet selection:** pick `responsibilities[]` entries that match the JD. Reorder so the strongest match comes first. Light rewriting is allowed to mirror JD keywords — never fabricate experience.

### Step 5: Write tailored sections

Follow the structure in `template-cv.md`. Heading levels are fixed:

- **H1** — name only (`profile.fullName`)
- **H2** — section titles (Professional Summary, Technical Skills, …)
- **H3** — individual jobs, projects, degrees

#### Header

```markdown
# Francisco González Veloz

Senior Full-Stack Engineer | React, Node.js, Python & AI

Guadalajara, Jalisco, México | +52 474 130 9933 | [franciscoveloz245@gmail.com](mailto:franciscoveloz245@gmail.com) | [LinkedIn](https://www.linkedin.com/in/franciscoveloz/) | [GitHub](https://github.com/FranciscoVeloz1) | [Portfolio](https://franciscoveloz1.github.io/portfolio/)
```

Rules:
- One contact line, pipe-separated
- Email, LinkedIn, GitHub, and Portfolio as markdown links — platform/name as link text, full URL in `href`
- Use `[LinkedIn](url)`, `[GitHub](url)`, `[Portfolio](url)`, `[email](mailto:email)` — never bare URLs or unlinked labels

#### Professional Summary

Write 3–4 sentences tailored to the JD:
1. Role + years of experience + core stack matching the job
2. Current/recent scope that proves seniority or specialization
3. One measurable achievement from `index.json` if available
4. Optional: leadership or domain fit if the JD asks for it

Use `summary.long` as raw material — rewrite, do not paste unchanged unless it already fits.

#### Technical Skills

One comma-separated line per category (only include categories with relevant skills):

```markdown
## Technical Skills

- **Languages:** TypeScript, JavaScript, Python, SQL
- **Frontend:** React, Next.js, React Native
- **Backend:** Node.js, Express, REST APIs
```

Group using `skills[].category`: `languages`, `frontend`, `backend`, `dataAndAI`, `devopsAndCloud`, `databases`, `other`.

Display label for `dataAndAI`: **Data & AI**.

Prioritize JD keywords. Include only skills the candidate actually has in `index.json`.

#### Work Experience

```markdown
### Dev Lead - Senior Associate

**PwC México** | Guadalajara, Jalisco, México | Jun 2025 - Present

- Led end-to-end full-stack delivery across React microservices, Node.js/Python services, and PySpark data pipelines
```

Rules:
- `###` for job title
- Next line: `**Company** | [EmploymentType if Contract/Freelance |] Location | Duration`
- Bullets: **action verb + what you built + technologies + measurable outcome**
- Present tense for current role; past tense for previous roles
- Start with Led, Built, Designed, Automated, Reduced, Architected, Delivered, Integrated, Mentored
- Never start with "Responsible for" or "Helped with"
- Weave JD keywords into bullets naturally — do not keyword-stuff

#### Selected Projects

```markdown
### React & Node.js REST API Template

**Technologies:** React, Node.js, TypeScript, Express

Production-ready monorepo template with JWT authentication, Zod validation, and scalable REST APIs. ([GitHub](https://github.com/FranciscoVeloz1/react-node-template))
```

#### Education, Certifications, Achievements, Languages

Follow template format. Keep certifications to name | issuer | date. Achievements: one line with title, date, and first description item.

### Step 6: Assemble markdown file

Build the complete file with this section order:

1. Professional Summary
2. Technical Skills
3. Work Experience
4. Selected Projects
5. Education
6. Certifications (if any selected)
7. Achievements (if any selected)
8. Languages

Use `---` horizontal rule only after the header block (matching the template).

**Do not** include HTML comments, placeholder syntax (`{{...}}`), or template instructions in the output file.

### Step 7: Validate output

Before saving, verify:

- [ ] Every fact comes from `index.json` — nothing invented
- [ ] Headline and summary match the target role
- [ ] JD keywords appear in both Technical Skills and experience bullets
- [ ] No images, tables, columns, or multi-column layouts
- [ ] H1 = name only; standard section names unchanged
- [ ] URLs are markdown links with full `href` (LinkedIn, GitHub, Portfolio, email, project repos)
- [ ] Dates use `Month Year - Month Year` or `Month Year - Present`
- [ ] No generic AI phrases ("innovative solutions", "cutting-edge", "dynamic professional", "results-driven")
- [ ] No empty sections
- [ ] File reads as a finished resume, not a template
- [ ] Estimated length: 1 page (mid) or ≤2 pages (senior)

### Step 8: Save

Write the file to:

```
repos/cv-generator/cv-md-files/<firstname>-<lastname>-<target-role>.md
```

- Lowercase, hyphen-separated
- `<firstname>` and `<lastname>` from `profile.firstName` and `profile.lastName`
- `<target-role>` from the parsed job title, shortened (e.g. `senior-fullstack`, `data-engineer`, `ai-engineer`)

Tell the user the saved path. Offer to run `npm run convert` if they want a PDF.

## Writing rules (quick reference)

**Strong bullet:**
> Automated order-intake workflows with Node.js and React, cutting daily manual processing time by 70%

**Weak bullet:**
> Responsible for developing innovative solutions using cutting-edge technologies

**Banned phrases:** innovative solutions, robust systems, cutting-edge technologies, dynamic professional, results-driven, passionate about technology

**ATS checklist:** technical depth · business impact · leadership · scalability · production experience · clear specialization · measurable outcomes

## Additional resources

- Full placeholder-to-JSON mapping: [reference.md](reference.md)
- Cursor rule (auto-attached in repos/cv-generator): `.cursor/rules/cv-generation.mdc`
