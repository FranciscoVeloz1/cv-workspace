# Design tokens and surfaces

**Tipo:** UX/UI  
**Depende de:** [`01-functional-domain-and-data.md`](01-functional-domain-and-data.md), [`repos/personal-projects/web-cv-generator/image.png`](../../../repos/personal-projects/web-cv-generator/image.png)  
**Implementa:** Token table and copy-paste CSS custom properties for studio chrome and the A4 sheet. Spec 03 places them in `src/index.css`. Specs 04–06 consume tokens only — no raw hex in component CSS except the 1px hairline exception below.  
**No incluye:** React components, routing, print JS, or Playwright.

## Resultado

Two visual worlds, one token file: a cool print-studio chrome (Operate) and a pinned Olivia A4 sheet. Implementers can copy the CSS in this spec into `src/index.css` without inventing colors or type.

## Requirements

### Intent

- **Who:** Francisco at a desk, about to send a PDF to a recruiter.
- **Verb:** Pick a source, confirm the sheet, print.
- **Feel:** Quiet print studio. Cool gray wall, white paper, pale steel rails. Not a SaaS dashboard, not Canva editor chrome, not a two-column sidebar CV.

### Surfaces

| Surface | Mode | Authority |
|---------|------|-----------|
| Home catalog, preview toolbar, status screens | Operate | This spec’s studio tokens |
| A4 sheet (screen preview and print) | Pinned artifact | `image.png` + sheet tokens here |

Do not theme the sheet with studio accent buttons. Do not put studio wall color inside `.cv-sheet`.

### Color strategy

Restrained: neutrals plus one cool steel accent used as **section rails on the sheet** and **primary button in chrome**. Light only. No dark theme in v1.

### Token tables

All values are CSS custom properties on `:root`. Components reference `var(--token)`. Do not scatter hex in `*.module.css` except `1px` hairlines paired with a `--*border*` color.

#### Studio (chrome)

| Token | Value | Usage |
|-------|-------|-------|
| `--studio-wall` | `#e4ebf1` | Page background behind catalog and preview |
| `--studio-raised` | `#ffffff` | Toolbar, catalog cards |
| `--studio-raised-hover` | `#f7fafc` | Card hover fill |
| `--studio-border` | `#c5d2de` | Card and toolbar edge |
| `--studio-ink` | `#172033` | Chrome headings, primary text |
| `--studio-ink-muted` | `#5b6b7c` | Subtitles, meta |
| `--studio-accent` | `#3d5a73` | Primary button fill (Download PDF) |
| `--studio-accent-hover` | `#31485c` | Primary button hover |
| `--studio-on-accent` | `#ffffff` | Text on primary button |
| `--studio-danger` | `#8b2942` | Error titles (not for the sheet) |
| `--studio-focus` | `#2f6f9f` | Focus ring color |
| `--studio-shadow` | `0 10px 30px rgba(23, 32, 51, 0.08)` | Raised toolbar and cards |

Contrast checkpoints (studio):

- `--studio-ink` on `--studio-wall`: ≥ 10:1
- `--studio-ink-muted` on `--studio-wall`: ≥ 4.5:1
- `--studio-on-accent` on `--studio-accent`: ≥ 4.5:1
- `--studio-danger` on `--studio-wall`: ≥ 4.5:1

#### Sheet (Olivia)

| Token | Value | Usage |
|-------|-------|-------|
| `--sheet-paper` | `#ffffff` | A4 background |
| `--sheet-ink` | `#1a1a1a` | Name, headings, bullets |
| `--sheet-ink-body` | `#333333` | Summary and bullet text |
| `--sheet-ink-muted` | `#4a4a4a` | Contact line |
| `--sheet-rule` | `#d8d8d8` | Hairline under header |
| `--sheet-rail` | `#d5e3ee` | Full-width section bars (SUMMARY, etc.) |
| `--sheet-rail-ink` | `#1a1a1a` | Section label on the rail |

Contrast checkpoints (sheet):

- `--sheet-ink` on `--sheet-paper`: ≥ 14:1
- `--sheet-ink-body` on `--sheet-paper`: ≥ 12:1
- `--sheet-ink-muted` on `--sheet-paper`: ≥ 7:1
- `--sheet-rail-ink` on `--sheet-rail`: ≥ 10:1

`--sheet-rail` is a background, not text. Do not use it for body copy.

### Typography

Google Fonts (load in `index.html`, spec 03):

```
Montserrat: 600, 700
Source Sans 3: 400, 600, 700
```

| Token | Value | Usage |
|-------|-------|-------|
| `--font-display` | `"Montserrat", "Helvetica Neue", Arial, sans-serif` | Name, section labels |
| `--font-body` | `"Source Sans 3", "Helvetica Neue", Arial, sans-serif` | Chrome UI and sheet body |
| `--font-chrome` | `var(--font-body)` | Toolbar and catalog |

Sheet type scale (print and screen at scale 1). Use these on the sheet only:

| Token | Value | Usage |
|-------|-------|-------|
| `--sheet-name-size` | `28pt` | Full name, uppercase, tracking |
| `--sheet-name-weight` | `700` | |
| `--sheet-name-tracking` | `0.12em` | |
| `--sheet-headline-size` | `12pt` | Job title under the name |
| `--sheet-headline-weight` | `600` | |
| `--sheet-contact-size` | `9.5pt` | Contact line |
| `--sheet-rail-size` | `10.5pt` | Section labels, uppercase |
| `--sheet-rail-tracking` | `0.08em` | |
| `--sheet-rail-weight` | `700` | |
| `--sheet-item-size` | `10.5pt` | Experience/education heading + dates |
| `--sheet-item-weight` | `700` | |
| `--sheet-body-size` | `10pt` | Summary, bullets, institution, skills |
| `--sheet-body-line` | `1.35` | Body and bullets |
| `--sheet-section-gap` | `10pt` | Space before a rail |
| `--sheet-rail-pad-y` | `5pt` | Vertical padding inside rail |
| `--sheet-rail-pad-x` | `10pt` | Horizontal padding inside rail |

Chrome type scale:

| Token | Value | Usage |
|-------|-------|-------|
| `--chrome-title` | `1.25rem` / weight 650 | Page title “Resume sources” |
| `--chrome-body` | `1rem` / weight 400 | Card subtitle, status copy |
| `--chrome-button` | `0.9375rem` / weight 600 | Buttons |
| `--chrome-meta` | `0.8125rem` / weight 400 | Toolbar source name |

### A4 geometry

| Token | Value | Usage |
|-------|-------|-------|
| `--a4-width` | `210mm` | Sheet width |
| `--a4-height` | `297mm` | One page min-height |
| `--a4-pad-top` | `16mm` | Inner top |
| `--a4-pad-x` | `18mm` | Inner left/right |
| `--a4-pad-bottom` | `16mm` | Inner bottom |
| `--a4-shadow` | `0 12px 40px rgba(23, 32, 51, 0.18)` | Screen-only drop shadow; **none in print** |

A page is a block `.cv-page`: width `var(--a4-width)`, `min-height: var(--a4-height)`, background `--sheet-paper`. Content flows; additional pages are created by CSS fragmentation (`break-after` / print pagination), not by JS measuring in v1. Spec 06 requires `break-inside: avoid` on experience, education, and skill items.

### Spacing, radius, motion (chrome only)

| Token | Value | Usage |
|-------|-------|-------|
| `--chrome-gap` | `16px` | Toolbar padding, card grid gap |
| `--chrome-radius` | `10px` | Cards and buttons |
| `--chrome-hit` | `44px` | Min height for buttons and card click targets |
| `--motion-fast` | `160ms` | Hover/focus on chrome |
| `--motion-ease` | `ease-out` | |

Sheet: **no motion**. No hover effects on bullets or rails. `prefers-reduced-motion: reduce` sets chrome transitions to `0ms`.

### Z-index

| Token | Value | Usage |
|-------|-------|-------|
| `--z-toolbar` | `20` | Preview toolbar |
| `--z-sheet` | `1` | Scaled sheet |

### Focus

Chrome interactive elements: `outline: 2px solid var(--studio-focus); outline-offset: 2px` on `:focus-visible`. Do not remove outlines. Sheet is not interactive (no buttons inside `CvDocument`).

### State matrix (chrome)

Every interactive chrome control implements:

| State | Treatment |
|-------|-----------|
| default | Token fills as in component specs 04 and 06 |
| hover | `--studio-raised-hover` on cards; `--studio-accent-hover` on primary button |
| focus-visible | Focus ring above |
| active | Translate Y `1px` on buttons only |
| disabled | Opacity `0.5`, `cursor: not-allowed`, no hover |
| loading | StatusState; primary button `aria-busy` if print is in flight (print is sync; no spinner required on the button) |
| empty | StatusState copy in spec 04 |
| error | StatusState with `--studio-danger` title |

### Copy-paste CSS (place in `src/index.css` in spec 03)

```css
:root {
  --studio-wall: #e4ebf1;
  --studio-raised: #ffffff;
  --studio-raised-hover: #f7fafc;
  --studio-border: #c5d2de;
  --studio-ink: #172033;
  --studio-ink-muted: #5b6b7c;
  --studio-accent: #3d5a73;
  --studio-accent-hover: #31485c;
  --studio-on-accent: #ffffff;
  --studio-danger: #8b2942;
  --studio-focus: #2f6f9f;
  --studio-shadow: 0 10px 30px rgba(23, 32, 51, 0.08);

  --sheet-paper: #ffffff;
  --sheet-ink: #1a1a1a;
  --sheet-ink-body: #333333;
  --sheet-ink-muted: #4a4a4a;
  --sheet-rule: #d8d8d8;
  --sheet-rail: #d5e3ee;
  --sheet-rail-ink: #1a1a1a;

  --font-display: "Montserrat", "Helvetica Neue", Arial, sans-serif;
  --font-body: "Source Sans 3", "Helvetica Neue", Arial, sans-serif;
  --font-chrome: var(--font-body);

  --sheet-name-size: 28pt;
  --sheet-name-weight: 700;
  --sheet-name-tracking: 0.12em;
  --sheet-headline-size: 12pt;
  --sheet-headline-weight: 600;
  --sheet-contact-size: 9.5pt;
  --sheet-rail-size: 10.5pt;
  --sheet-rail-tracking: 0.08em;
  --sheet-rail-weight: 700;
  --sheet-item-size: 10.5pt;
  --sheet-item-weight: 700;
  --sheet-body-size: 10pt;
  --sheet-body-line: 1.35;
  --sheet-section-gap: 10pt;
  --sheet-rail-pad-y: 5pt;
  --sheet-rail-pad-x: 10pt;

  --a4-width: 210mm;
  --a4-height: 297mm;
  --a4-pad-top: 16mm;
  --a4-pad-x: 18mm;
  --a4-pad-bottom: 16mm;
  --a4-shadow: 0 12px 40px rgba(23, 32, 51, 0.18);

  --chrome-gap: 16px;
  --chrome-radius: 10px;
  --chrome-hit: 44px;
  --motion-fast: 160ms;
  --motion-ease: ease-out;
  --z-toolbar: 20;
  --z-sheet: 1;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  min-height: 100%;
}

body {
  font-family: var(--font-chrome);
  background: var(--studio-wall);
  color: var(--studio-ink);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0ms !important;
    transition-duration: 0ms !important;
  }
}
```

Print rules that hide chrome and size pages belong in spec 06 (`src/index.css` `@media print` block plus `CvDocument` module). Spec 03 may include the `:root` and body rules only.

### Anti-goals

- Inter, generic gray-200/700 scales, terracotta + cream “AI dashboard”, neon dark mode.
- Gradient text, glassmorphism, scroll-reveal on the sheet.
- Binding the sheet type to `--chrome-title`.

## Architecture

Tokens live only in `src/index.css`. CSS Modules in components reference `var(--…)`. Fonts load from Google Fonts in `index.html` (preconnect + stylesheet). `image.png` stays in the app repo as visual authority; do not bundle it into the UI.

## Code to do

No React in this spec. Spec 03 pastes the CSS block into `src/index.css` and the font links into `index.html`. Specs 04–06 must not introduce new color literals.

## Testing

Visual, not unit: after 04–06, squint-compare the sheet to `image.png` at 100% scale (name centered, pale rails, three-column skills). Chrome sits on `--studio-wall`.

## Acceptance

- [ ] Every token in the tables exists in `:root` with the listed value.
- [ ] Sheet and studio palettes are distinct (wall ≠ paper).
- [ ] Contrast checkpoints hold.
- [ ] Reduced-motion kills chrome transitions.
- [ ] No dark theme variables.

## Playwright scenarios unlocked

None. Visual checks are manual in 07 plus screenshot of the preview page.

## Impact

Using `--studio-accent` for section rails would dirty the pinned Olivia sheet. Using `--sheet-rail` for the Download button would wash out chrome. Keep the two palettes separate. `pt` on the sheet tracks print; do not convert sheet type to `rem` (viewport scaling is a transform in spec 06, not a type resize).
