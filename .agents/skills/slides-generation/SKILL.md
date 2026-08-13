---
name: slides-generation
description: Create educational vertical TikTok slide decks as validated JSON for the local Reveal.js previewer. Use when the user asks for TikTok slides, vertical presentations, Reveal.js education decks, or agent-generated teaching slides.
---

# Slides Generation

Generate educational presentations as **validated JSON**, never as freeform JSX/HTML/MDX.

## Required workflow

1. Clarify the teaching goal, audience, and language.
2. Outline 6–8 slides with **one idea per slide**.
3. Choose only allowed `type` values from the schema.
4. Write `public/presentations/<kebab-name>.json` (or run `npm run slides -- init <kebab-name>` and edit).
5. Validate:
   ```bash
   npm run slides -- validate public/presentations/<kebab-name>.json
   ```
6. Preview:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/?presentation=<kebab-name>`.
7. Fix validation errors by field path until exit code is `0`.

## Allowed slide types

| type         | Purpose              |
| ------------ | -------------------- |
| `cover`      | Hook + title         |
| `keyPoint`   | Single concept       |
| `steps`      | 2–5 ordered tips     |
| `comparison` | Left vs right        |
| `process`    | 3–6 stages           |
| `stat`       | Big number + caption |
| `quote`      | Short memorable line |
| `cta`        | Final action         |
| `image`      | Full-bleed visual    |

## Content rules

- One idea per slide; keep titles and bodies short.
- Prefer contrast-friendly theme defaults from the sample deck.
- End with a `cta` slide when possible.
- Respect safe zones (theme `safeZone`); do not invent absolute CSS.
- Light inline markdown only in text fields: `` `code` ``, `**bold**`, `*italic*`.
- Put multi-line snippets in optional `code: { language, source }` (max 400 chars, 8 non-empty lines). Languages: `csharp`, `javascript`, `typescript`, `python`, `json`, `text`.
- **Never** put fenced markdown code blocks in `body`.
- **Never** emit HTML, JSX, MDX, inline scripts, or unknown properties.
- **Never** invent slide types outside the schema.
- Names must be kebab-case: `ai-prompting-basics`.

## References

- Schema: `src/domain/presentation-schema.ts`
- Sample: `public/presentations/sample-ai-basics.json`
- Prompt starter: `examples/agent-prompt.md`
- Human docs: `README.md`
