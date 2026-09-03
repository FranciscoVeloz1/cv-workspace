---
name: research-redactor
description: >-
  Writes the final cited report from validated research findings into
  03-report.md. Run only when the user invokes /research-redactor
  or explicitly names this skill.
disable-model-invocation: true
icon: rocket
color: green
---

# Research Redactor

Step 4 of 4. Last step. Synthesis and writing only — **no new facts**.

| Step | Skill | Writes |
|------|-------|--------|
| 1 | research-planner | `00-plan.md`, empty `findings/q0N-*.md` |
| 2 | researcher | filled findings |
| 3 | research-validator | `02-validation.md` |
| 4 | **research-redactor** (this) | `03-report.md` |

A claim that is not in the findings files belongs in Limitations, not in the report body. Synthesis (connections, weighing, a reasoned conclusion) is in scope. New evidence is not.

## Instructions

1. If the user did not name a project, look under `research/` and use the one they mean. If several exist, ask.
2. Read, in order:
   - `00-plan.md` — objective, audience, outline
   - `02-validation.md` — **required**. If missing, stop and point them to `/research-validator`. Do not report from unvalidated findings.
   - all files in `findings/`
3. Honor the validation recommendation before writing:
   - Minor, isolated flagged claims → proceed; exclude those claims and note them in Limitations.
   - A sub-question substantially unsupported, or overall “hold off” / “needs another research pass” → **stop**. Tell the user what is blocking. Do not patch a thin section into a finished-looking report.
4. Write `research/<project-slug>/03-report.md`. Use the plan outline as a start; restructure if the findings fit together differently.

### What to include

- **Verified** — include normally.
- **Partially supported** — include only with the correction or caveat from the validation report. Do not upgrade it to a clean statement.
- **Unsupported, Contradicted, Unreachable, Policy mismatch** — omit from the body; note the exclusion in Limitations (what could not be confirmed).
- Whole-question rework recommended → that section is a stated gap (“still pending revalidation”), not a thin leftover.

### Citations

Keep citations. Do not strip them for readability. Renumber `[S#]` tags from all findings files into one sequence (`[1]`, `[2]`, …) with a matching Sources list. A reader must be able to trace any claim.

### Writing

- New prose, not copy-paste of findings sentences with numbers swapped.
- Match audience in the plan (technical vs general).
- Quotations rare, short, marked as quotations.
- Blend sub-questions into sections where they connect. Do not force one findings file per section.

In Synthesis / Conclusion, separate what sources report from what you infer (“the available evidence suggests…”).

## `03-report.md`

```markdown
# <Title>

## Executive Summary
<A few sentences: what was asked, what was found, what the overall answer is.>

## Introduction
<Objective and scope, briefly — enough for someone with no context on the project.>

## <Section per sub-question or logical grouping>
<Synthesized prose, not a bullet dump of the findings file. Weave claims from
possibly multiple sub-questions together where they inform the same point.>

## Synthesis / Conclusion
<Draw the threads together. This is the one place genuine synthesis belongs —
weighing findings against each other, noting what they collectively suggest.
Distinguish clearly between what sources report and what you're concluding
from them, e.g. "the available evidence suggests..." rather than stating an
inference as if it were itself a sourced fact.>

## Limitations & Open Questions
<Everything carried over from findings files' "Open gaps" sections, plus
anything excluded here due to failed validation. Be specific, not just
"some limitations apply.">

## Sources
<Consolidated, deduplicated bibliography built from every findings file's
Sources section, renumbered for the report.>
```

## After

Point the user at `03-report.md` and say whether it is fully clean or clean-with-noted-exclusions. A follow-up question belongs in a new `/research-planner` round — do not patch new research in here.
