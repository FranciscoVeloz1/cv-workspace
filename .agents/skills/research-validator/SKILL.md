---
name: research-validator
description: >-
  Fact-checks a research project's findings against the cited sources and
  writes 02-validation.md. Run only when the user invokes /research-validator
  or explicitly names this skill.
disable-model-invocation: true
icon: shield
color: orange
---

# Research Validator

Step 3 of 4. Independent pass over **researcher** output. Gate before **research-redactor**.

| Step | Skill | Writes |
|------|-------|--------|
| 1 | research-planner | `00-plan.md`, empty `findings/q0N-*.md` |
| 2 | researcher | filled findings |
| 3 | **research-validator** (this) | `02-validation.md` |
| 4 | research-redactor | `03-report.md` |

**Do not edit findings files.** Do not write `03-report.md`. Do not start redaction against unresolved issues.

Treat this as adversarial, not confirmatory. Re-fetch sources. Do not trust the researcher's paraphrase.

## Instructions

1. If the user did not name a project, look under `research/` and use the one they mean. If several exist, ask.
2. Require `00-plan.md` and findings with content. If findings are still empty scaffolds, stop and point them to `/researcher`.
3. Read `00-plan.md` for source policy — you need it to judge whether a cited source *qualifies*, not only whether it exists.
4. Check every `[S#]`-tagged claim. Full re-fetch for numbers, dates, surprises, convenient claims, and anything a conclusion would lean on. Every other claim gets at least a pass.
5. If something feels off, run an independent search — do not only re-read the cited URL.
6. Write `research/<project-slug>/02-validation.md` with the template below.

### Per claim

1. **Fetch the URL.** Read what it actually says.
2. **Support.** A real source can still fail to support the attached claim (wrong metric, smaller effect, missing figure).
3. **Reachable.** Dead link, 404, or a citation with no real page is a serious finding. Flag it plainly.
4. **Policy.** Check primary/secondary labels and whether a low-quality source slipped through.
5. **Corroboration.** If the file implies a claim is well-established, or a pivotal claim has one source when two were expected, check that.
6. **Conflicts.** Re-read both sources if a claim reconciles them — they may agree where the file says they conflict, or the reverse.
7. **Cross-file.** Look for contradictions between findings files.

### Categories

- **Verified** — source checked, supports the claim as stated
- **Partially supported** — supports part of the claim but overstates, understates, or misattributes
- **Unsupported** — cited source does not contain this claim
- **Contradicted** — the source, or another you found, disagrees
- **Unreachable** — dead link, paywall, removed page; needs a replacement source
- **Policy mismatch** — real and supportive, but fails the project's source-quality bar

Notes must say what the source actually says versus what was claimed. "Unsupported" alone is not enough to fix.

## `02-validation.md`

```markdown
# Validation Report: <project title>

## Summary
<X of Y claims verified, Z issues found across N findings files. One-line overall
readiness assessment.>

## q01: <question>

| Claim | Source | Result | Note |
|-------|--------|--------|------|
| <short paraphrase of the claim> | S1 | Verified | — |
| <short paraphrase> | S2 | Unsupported | Source discusses X but never states the
figure claimed; likely conflated with a different metric. |

### Issues requiring rework
- <Specific, actionable description of what needs fixing and why>

## q02: <question>
...

## Cross-question issues
<Any contradictions or inconsistencies found between findings files, not caught
within a single file>

## Recommendation
<One of: "Ready for redaction as-is." / "Ready for redaction once the following are
fixed: ..." / "Needs another research pass on q0N before proceeding.">
```

Fixes belong in a follow-up `/researcher` pass, then re-run this skill. Do not paper over issues by editing findings here.

## Hand off

- **Ready for redaction as-is** → tell the user `/research-redactor` can run next.
- **Not ready** → say what is blocking and how much rework (a few claims vs redo a whole question). Do not proceed to redaction while issues are unresolved.
