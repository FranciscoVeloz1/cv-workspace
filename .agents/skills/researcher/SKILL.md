---
name: researcher
description: >-
  Fills a planned research project's findings files from sources actually
  retrieved in this session. Run only when the user invokes /researcher
  or explicitly names this skill.
disable-model-invocation: true
icon: beaker
color: blue
---

# Researcher

Step 2 of 4. Picks up `research/<project-slug>/` from **research-planner**. Hands off to **research-validator**.

| Step | Skill | Writes |
|------|-------|--------|
| 1 | research-planner | `00-plan.md`, empty `findings/q0N-*.md` |
| 2 | **researcher** (this) | filled findings |
| 3 | research-validator | `02-validation.md` |
| 4 | research-redactor | `03-report.md` |

**Stop here.** Do not write `02-validation.md` or `03-report.md`. Do not validate your own work.

## Core rule

Every factual claim must trace to a source you **retrieved with a search or fetch tool in this session**. Not training recall, not a plausible figure, not "probably true." If you cannot confirm it, put it in Open gaps — do not invent a number or a citation.

Never add a source you did not fetch or see in search results. A citation to a real document you did not check is still a fabricated source.

## Instructions

1. If the user did not name a project, look under `research/` and use the one they mean. If several exist, ask. If there is no `00-plan.md`, stop and point them to `/research-planner`.
2. Read `00-plan.md`: objective, scope, source policy, per-question source types.
3. Work the questions they specified (a number, "all", or nothing → next file still **not started**, in plan order).
4. For each question, search then write the findings file. Then update status.

### Per question

1. **Search.** Start broad, then specific (numbers, dates, names, counter-arguments). A typical planned question needs **3–8** searches; more if it is broad or contested.
2. **Source policy.** Official/primary first (government, filings, company docs, original studies, datasets). Reputable secondary (established news, industry research, peer-reviewed coverage) for corroboration and context. Skip unattributed blogs, content farms, forums, unsourced pages.
3. **Fetch the page** before citing a figure, date, or quote. Snippets are not enough.
4. **Corroborate** pivotal, surprising, or contested claims with a second independent source — or say you could not.
5. **Look for disconfirming evidence**, especially if the plan wrote the question as a counter-case.
6. **Report conflicts.** If two credible sources disagree, state both. Do not pick a winner silently.

### Write-up

Keep the scaffold headings. Fill Findings, Sources, and Open gaps. Paraphrase; do not paste source sentences. Mark each source **(primary)** or **(secondary)**. If evidence is thin, say so in the claim itself, not only in Open gaps.

Use `[S1]`, `[S2]` inline, keyed to Sources:

```markdown
## Findings

The company's Q3 filing reported a 12% year-over-year revenue increase [S1].
Independent analysis attributed most of this growth to expansion in the
EU market rather than the US market, where growth was flat [S2]. Note:
[S2] is a secondary analyst source rather than the company's own breakdown,
since the filing itself doesn't segment revenue by region.

## Sources

[S1] "Q3 2026 Form 10-Q" — Company Investor Relations (primary), filed
Oct 2026. https://example.com/10q. Accessed 2026-08-29.
[S2] "Company X's regional growth story" — Reuters (secondary), Aug 2026.
https://example.com/article. Accessed 2026-08-29.
```

Open gaps is not a failure: unconfirmed figures, questions that should be split, irreconcilable conflicts, expected material you could not find after a real search.

### Status

Findings file: `**Status:** researched — pending validation`

Also update the matching row in `00-plan.md`'s sub-question table.

## Hand off

Tell the user which questions are done and that the next step is `/research-validator`. Do not start validation in this pass.
