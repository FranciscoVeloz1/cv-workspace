---
name: research-planner
description: >-
  Scopes a deep multi-source research project into a plan file and empty
  findings files on disk. Run only when the user invokes /research-planner
  or explicitly names this skill.
disable-model-invocation: true
icon: book-open
color: cyan
---

# Research Planner

Step 1 of 4. Later skills consume these files as written, so follow the contract exactly.

| Step | Skill | Writes |
|------|-------|--------|
| 1 | **research-planner** (this) | `00-plan.md`, empty `findings/q0N-*.md` |
| 2 | researcher | filled findings |
| 3 | research-validator | `02-validation.md` |
| 4 | research-redactor | `03-report.md` |

**Stop here.** Do not search sources, fill findings, or start the next skill.

## Instructions

1. If there is no topic, ask for topic, audience, and any bounds (time, place, industry). If the prompt already has those, proceed and put your interpretation in the plan so it can be corrected.
2. Only ask when the topic is too open to decompose (e.g. "research climate change" with no other context). Prefer the AskQuestion tool when available.
3. If `research/<project-slug>/` already exists, ask before overwriting.
4. Decompose into **4–8** sub-questions. Each becomes one findings file. Each must be:
   - Answerable from sources (not opinion; synthesis is for research-redactor)
   - Roughly independent of the others
   - Mid-sized: a paragraph to a page of findings — not "the history of X", not one vote count
   - Include **at least one** question that could contradict the likely narrative
5. Write the default source policy into the plan (below). Name a go-to source type per question when obvious (EU Official Journal, 10-Ks, etc.).
6. Create the files with the templates below. Findings stay empty scaffolds — no guessed answers.
7. Summarize the plan in chat, invite changes to scope or questions, and say the next step is **researcher** on `research/<project-slug>/`, one question at a time.

### Default source policy

Prioritize official/primary sources (government, filings, company docs, peer-reviewed papers, original datasets). Reputable secondary sources (established news, industry research firms, recognized publications) for corroboration and context. Exclude unattributed blogs, content farms, forums, and unsourced pages. **No invented data or citations.**

## File contract

Workspace root:

```
research/<project-slug>/
├── 00-plan.md
└── findings/
    ├── q01-<slug>.md
    └── ...
```

Slug: lowercase, hyphens, no spaces. Do not create `02-validation.md` or `03-report.md`.

## `00-plan.md`

```markdown
# Research Plan: <Title>

## Objective
<1-3 sentences: what this research is for and what decision or output it supports>

## Scope
**In scope:** <bullets>
**Out of scope:** <bullets>

## Source policy
Prioritize official/primary sources. Reputable secondary sources allowed for corroboration
and context. Exclude unattributed or unverifiable sources. No invented data or citations
anywhere in this project.

## Sub-questions

| # | Question | Suggested source types | Status |
|---|----------|------------------------|--------|
| q01 | <question> | <e.g. official filings, industry reports> | Not started |
| q02 | ... | ... | Not started |

## Report outline
<A rough sketch of how the final report will be organized — usually one section per
sub-question plus an intro/synthesis, but adjust if some sub-questions naturally combine>

1. Introduction
2. <section mapped to q01/q02>
3. <section mapped to q03>
4. ...
5. Synthesis / conclusion
6. Sources
```

## Findings scaffold

One file per sub-question: `research/<project-slug>/findings/q0N-<slug>.md`

```markdown
# q0N: <question>

**Status:** not started
**Source types to prioritize:** <from the plan>

## Findings

<researcher fills this in with sourced claims>

## Sources

<researcher fills this in — full citation list for everything used above>

## Open gaps / uncertainty

<researcher notes anything it couldn't confirm or where sources conflict>
```

## Example

Topic: "should we adopt a 4-day work week"

- q01 outcomes companies report (productivity, retention, revenue)
- q02 major trials/studies and their limits
- q03 implementation models
- q04 legal/contractual constraints in our jurisdiction
- q05 critics and how proponents respond

Bad: "everything about 4-day weeks."
