# Create CV — Reference

Detailed mapping between `template-cv.md` placeholders and `repos/resume-data-source/index.json` fields.

## JSON schema overview

```
profile          → contact header
summary          → short, long (rewrite per role)
skills[]         → id, name, category
workExperience[] → position, company, employmentType, startDate, endDate,
                   duration, location, responsibilities[], skills[] (IDs)
projects[]       → id, name, date, link, repo, skills[] (IDs), description
education[]      → degree, institution, duration, location
certifications[] → name, issuer, date, link, description (omit desc in CV)
achievements[]   → title, description[], date, link
languages[]      → language, proficiency
socialNetworks[] → platform, link
```

## Skill categories

| `category` value | Display label |
| --- | --- |
| `languages` | Languages |
| `frontend` | Frontend |
| `backend` | Backend |
| `dataAndAI` | Data & AI |
| `devopsAndCloud` | DevOps & Cloud |
| `databases` | Databases |
| `other` | Other |

## Placeholder → JSON mapping

| Template placeholder | JSON path | Output notes |
| --- | --- | --- |
| `{{profile.fullName}}` | `profile.fullName` | H1, name only |
| `{{profile.headline}}` | `profile.headline` | Rewrite for target role |
| `{{profile.location}}` | `profile.location` | |
| `{{profile.phone}}` | `profile.phone` | |
| `{{profile.email}}` | `profile.email` | `[email](mailto:email)` |
| `{{profile.website}}` | `profile.website` | `[Portfolio](url)` with full URL in href |
| `{{socialNetworks[platform=LinkedIn].link}}` | `socialNetworks[]` | `[LinkedIn](url)` |
| `{{socialNetworks[platform=GitHub].link}}` | `socialNetworks[]` | `[GitHub](url)` |
| `{{summary.long}}` | `summary.long` | Rewrite; use `summary.short` for compact variants |
| `{{skills[category=X].name, joined}}` | `skills[]` | Filter by category, comma-join names |
| `{{workExperience[].position}}` | `workExperience[].position` | H3 |
| `{{workExperience[].company}}` | `workExperience[].company` | Bold |
| `{{workExperience[].employmentType?}}` | `workExperience[].employmentType` | Only Contract/Freelance |
| `{{workExperience[].location}}` | `workExperience[].location` | |
| `{{workExperience[].duration}}` | `workExperience[].duration` | Pre-formatted in JSON |
| `{{workExperience[].responsibilities[]}}` | `workExperience[].responsibilities` | Select + reorder per JD |
| `{{projects[].name}}` | `projects[].name` | H3 |
| `{{projects[].skills -> skills.name, joined}}` | `projects[].skills` IDs → `skills[].name` | |
| `{{projects[].description}}` | `projects[].description` | |
| `{{projects[].repo}}` | `projects[].repo` | `[GitHub](url)` |
| `{{education[].degree}}` | `education[].degree` | H3 |
| `{{education[].institution}}` | `education[].institution` | Bold |
| `{{education[].location}}` | `education[].location` | |
| `{{education[].duration}}` | `education[].duration` | |
| `{{certifications[].name}}` | `certifications[].name` | Bold |
| `{{certifications[].issuer}}` | `certifications[].issuer` | |
| `{{certifications[].date}}` | `certifications[].date` | |
| `{{achievements[].title}}` | `achievements[].title` | Bold |
| `{{achievements[].date}}` | `achievements[].date` | |
| `{{achievements[].description[0]}}` | `achievements[].description[0]` | One line max |
| `{{languages[].language}}` | `languages[].language` | Bold label |
| `{{languages[].proficiency}}` | `languages[].proficiency` | |

## Resolving skill IDs

`workExperience[].skills` and `projects[].skills` contain numeric IDs. Resolve:

```javascript
const skillMap = Object.fromEntries(data.skills.map(s => [s.id, s.name]));
const names = entry.skills.map(id => skillMap[id]).filter(Boolean);
```

## URL link format

Render URLs as markdown links — platform/name as link text, full URL from JSON in `href`:

| Field | Markdown output |
| --- | --- |
| Email | `[franciscoveloz245@gmail.com](mailto:franciscoveloz245@gmail.com)` |
| LinkedIn | `[LinkedIn](https://www.linkedin.com/in/franciscoveloz/)` |
| GitHub | `[GitHub](https://github.com/FranciscoVeloz1)` |
| Portfolio | `[Portfolio](https://franciscoveloz1.github.io/portfolio/)` |
| Project repo | `[GitHub](https://github.com/FranciscoVeloz1/react-node-template)` |

Use the full URL from `index.json` in the href (keep `https://`). ATS parsers extract both link text and URL from markdown.

## Job-requirements → content matrix

When parsing a JD, map requirements to data sections:

| JD signal | Action |
| --- | --- |
| Required tech stack | Prioritize in skills + reorder bullets mentioning those techs |
| Leadership / mentoring | Lead with Dev Lead bullets; include mentor bullets |
| Cloud / DevOps | Surface `devopsAndCloud` skills; highlight deployment/infra bullets |
| AI / ML / LLM | Surface `dataAndAI` skills; highlight AI project + PwC AI bullets |
| Data engineering | Highlight Databricks/PySpark/blockchain pipeline bullets |
| Mobile | Highlight React Native roles (Setenal) and mobile projects |
| Years of experience | Adjust summary opening; trim older roles if over 2 pages |
| Specific certifications | Match against `certifications[]`; include only if listed in JSON |

## Filename examples

Output directory: `repos/cv-generator/cv-md-files/`

| Target role | Filename |
| --- | --- |
| Senior Full-Stack Engineer | `cv-md-files/francisco-veloz-senior-fullstack.md` |
| AI Engineer | `cv-md-files/francisco-veloz-ai-engineer.md` |
| Data Engineer | `cv-md-files/francisco-veloz-data-engineer.md` |
| Dev Lead | `cv-md-files/francisco-veloz-dev-lead.md` |

## Fields to exclude from CV output

| Field | Reason |
| --- | --- |
| `profile.profilePhoto` | Images break ATS |
| `*.logo` | Images break ATS |
| `*.image` | Images break ATS |
| `*.video` | Not relevant in resume text |
| `certifications[].description` | Too long; name/issuer/date suffices |
| `startDate` / `endDate` | Use pre-formatted `duration` instead |
