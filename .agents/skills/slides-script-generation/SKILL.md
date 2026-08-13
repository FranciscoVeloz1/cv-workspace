---
name: slides-script-generation
description: Generate educational vertical-video narration scripts for this repository from clear topic, audience, and language inputs. Use when creating or revising files in examples/scripts, drafting TikTok lesson scripts, or adapting the current slide types, media, and code-block options into a script.
---

# Slides Script Generation

Generate the human-readable Markdown script that guides a vertical educational
deck. Write scripts to `examples/scripts/<kebab-name>.md`; do not emit
presentation JSON, JSX, HTML, or MDX in script mode.

## Input contract

Accept either a natural-language request or this named-field format:

```text
Topic: <lesson topic>
Audience: <intended viewer>
Language: <en|es|other supported language code>
Goal: <learning outcome>
Tone: <voice and formality>
Duration: <target speaking duration>
Slide count: <number>
Deck name: <kebab-case name>
Call to action: <desired final action>
Visual/media preference: <none|suggestions|provided assets>
Code preference: <none|inline|short snippet>
```

`Topic`, `Audience`, and `Language` are required. Ask for missing required
values before writing. The other fields are optional:

- Default to a clear, approachable tone.
- Default to 45–60 seconds.
- Default to six slides; prefer six to eight.
- Infer `Deck name` from the topic, then validate it as kebab-case.
- State inferred assumptions in the script metadata.
- Keep the requested language for both on-screen text and narration.

Example:

```text
Generate a script with:
- Topic: qué es una API
- Audience: personas que empiezan a programar
- Language: es
- Goal: explain the request/response idea
- Tone: claro, cercano y directo
- Duration: 45–60 segundos
- Slide count: 6
- Deck name: que-es-una-api
- Visual/media preference: use one image slide if a real asset is available
- Code preference: one short JavaScript snippet
```

## Required workflow

1. Read `src/domain/presentation-schema.ts`, `README.md`, and the current
   files in `examples/scripts/` before choosing a structure. The schema is the
   source of truth; do not rely on a stale list of options.
2. Normalize the request to the input contract and resolve missing required
   values.
3. Outline one teachable idea per slide. Start with `cover` and end with
   `cta` when a meaningful next action exists.
4. Map each slide to a current schema `type` and its corresponding content
   shape.
5. Write `examples/scripts/<kebab-name>.md` using the output format below.
6. Run the verification checklist before reporting completion.

## Current project options

Use only types present in the current schema. At this revision they are:

- `cover`: hook and lesson promise.
- `keyPoint`: one concept with a concise explanation.
- `steps`: 2–5 ordered items.
- `comparison`: two labeled sides with 1–4 points each.
- `process`: 3–6 ordered stages.
- `stat`: a meaningful number, caption, and optional source.
- `quote`: a short attributed quote and optional role.
- `cta`: final action.
- `image`: full-bleed visual; `media` is required.

Every current slide type accepts optional `media` and `code` fields. Use them
only when they improve the lesson:

- `media.src` must be a local public path beginning with `/` or an `https://`
  URL. Include accurate `alt` text and required attribution. Use an existing
  asset in `public/media/` when possible.
- Do not invent a URL, attribution, source, quote, or asset. If only a visual
  idea is available, label it as a suggestion instead of presenting it as a
  valid `src`. Use `image` only when a real media source is available or ask
  for one.
- `code.language` must be one of `csharp`, `javascript`, `typescript`,
  `python`, `json`, or `text`.
- `code.source` is at most 400 characters and 8 non-empty lines.
- Keep code out of narration and body copy. Represent a snippet in its own
  `Código sugerido`/`Suggested code` section so it can later map to `code`.
- Inline Markdown is limited to `` `code` ``, `**bold**`, and `*italic*`.
  Never put fenced code blocks in a slide body.
- An icon or visual cue may be mentioned as prose, but never treat it as an
  unsupported JSON property.

If the schema or README gains a new type or field, inspect and use it only
after confirming its constraints in the current files.

## Output format

Follow the existing `examples/scripts/*.md` pattern. Localize labels to the
requested language:

```text
# Guion: <lesson title>

Tono: <tone>. Audiencia: <audience>. Duración aproximada: <duration>.
Objetivo: <goal, when provided>.

---

**Slide 1 — <label>** (`cover`)
Texto en pantalla: <short readable copy>
Voz en off: <natural narration>
Visual/media: <optional real asset details or clearly labeled suggestion>

**Slide 2 — <label>** (`keyPoint`)
Texto en pantalla: <short readable copy>
Voz en off: <natural narration>

...

**Slide 6 — <closing label>** (`cta`)
Texto en pantalla: <short readable copy>
Voz en off: <closing narration>
Acción: <call to action>

---

Preview: `http://localhost:5173/?presentation=<kebab-name>`
```

Use the equivalent `Script`, `On-screen text`, `Voiceover`, and `Action`
labels for English or another requested language. Include a visual/media line
only when the request or chosen type needs it. Include a
`Código sugerido`/`Suggested code` section only when a short snippet supports
the teaching goal.

## Content constraints

- Keep titles and on-screen copy short enough for the current schema limits.
- Make narration conversational and consistent with the audience.
- Use `steps`, `process`, `comparison`, `stat`, `quote`, `image`, and `code`
  only when their structure clarifies the lesson.
- Keep the script within 1–24 slides, with six to eight preferred.
- Preserve safe-zone awareness; do not prescribe absolute CSS.
- Do not add arbitrary fields to the eventual presentation model.
- Do not convert the script to JSON unless the user explicitly requests a
  presentation deck as a second output.

## Verification checklist

Before reporting completion, verify:

- The file is `examples/scripts/<kebab-name>.md` with no path or extension in
  the name input.
- Topic, audience, language, and any assumptions are represented.
- The file has localized metadata, a separator, slide sections, and a preview
  URL.
- Every slide has a current schema type and one clear idea.
- `cover` is first and `cta` is last when a next action is appropriate.
- Each slide has on-screen copy and narration; `cta` also has an action.
- `steps`, `comparison`, and `process` use valid item counts.
- `image` has real media details; media has valid source, alt text, and credit
  when required.
- Code snippets use an allowed language and stay within the 400-character and
  8 non-empty-line limits.
- No unsupported types, JSON properties, JSX, HTML, MDX, fake sources, or
  fabricated media data were emitted.

The CLI validator applies to JSON decks, not Markdown scripts. Run
`npm run slides -- validate <file>` only when the user separately requests
JSON output.
