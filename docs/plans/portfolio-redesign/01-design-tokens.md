# 01 — Design Tokens

Single source of truth for every visual value in the redesign. Component CSS must
reference these tokens only — no raw hex, px, or ms literals outside `vars.css`
(exception: the 1px hairline borders, which always pair with a `--border*` color).

All tokens are CSS custom properties on `:root` (light theme, default). Dark theme
overrides live under `body.theme-dark`. No JavaScript may read or set individual
token values; the theme switch flips one body class.

---

## 1. Color

### 1.1 Accent scale (brand blue, reused from current palette)

| Token | Light value | Dark value | Usage |
|-------|-------------|------------|-------|
| `--accent-deep` | `#0059b3` | `#bfe9ff` | Text on `--accent-soft` surfaces (badges, marks, chips) |
| `--accent-strong` | `#0075e2` | `#24bdff` | Primary buttons, links, accent keywords in headings |
| `--accent-strong-hover` | `#0062c0` | `#4ecbff` | Hover state for filled primary elements |
| `--accent` | `#0d8cff` | `#0d8cff` | Secondary accent: icons, link hover, decorative details |
| `--accent-bright` | `#24bdff` | `#7fdcff` | Decorative only: avatar ring, gradient stops. Never text on light backgrounds |
| `--accent-soft` | `#e3f3ff` | `rgba(36, 189, 255, 0.14)` | Pill/badge backgrounds, keyword highlight wash, selected states |
| `--accent-soft-strong` | `#cbe7ff` | `rgba(36, 189, 255, 0.24)` | Hover of `--accent-soft` surfaces |
| `--accent-ink` | `#1721a6` | `#8b95ff` | Deep accent: gradient end stops, dark-surface accents |

Contrast checkpoints (light theme, computed against the paired background):

- `--accent-strong` `#0075e2` on `#ffffff`: 4.6:1 — AA for normal text.
- `--accent-deep` `#0059b3` on `--accent-soft` `#e3f3ff`: 5.3:1 — AA for badge text.
- `--accent-bright` `#24bdff` on `#ffffff`: 2.4:1 — **decorative only, never text**.
- `--text-on-accent` `#ffffff` on `--accent-strong` `#0075e2`: 4.6:1 — AA.

### 1.2 Neutrals (navy-tinted, never pure gray)

| Token | Light value | Dark value | Usage |
|-------|-------------|------------|-------|
| `--bg` | `#ffffff` | `#090d40` | Page background |
| `--bg-subtle` | `#f6f9fc` | `#0d1449` | Alternating section background (Skills, Certificates) |
| `--surface` | `#ffffff` | `#111a5c` | Cards, inputs, raised panels |
| `--border` | `#e3eaf2` | `#26307a` | Hairline borders, dividers |
| `--border-strong` | `#c9d6e4` | `#35418f` | Input borders, emphasized outlines |
| `--text` | `#17203a` | `#f4f6ff` | Headings and body text |
| `--text-secondary` | `#4f5d7a` | `#c3cbe8` | Subtitles, descriptions, meta |
| `--text-muted` | `#66738e` | `#97a0c9` | Dates, captions, placeholders (min size 13px) |
| `--text-on-accent` | `#ffffff` | `#06122e` | Text on filled accent surfaces |
| `--navy` | `#0c1259` | `#06082b` | Footer band background |

Contrast checkpoints (light): `--text` on `--bg` 14.8:1; `--text-secondary` on
`--bg` 7.0:1; `--text-muted` on `--bg` 4.8:1. All pass AA for their stated uses.

### 1.3 Semantic

| Token | Light value | Dark value | Usage |
|-------|-------------|------------|-------|
| `--danger` | `#d40202` | `#ff6b6b` | Error text and icons |
| `--danger-soft` | `#fdecec` | `rgba(238, 44, 44, 0.16)` | Error banner/field background |
| `--success` | `#0b8a5f` | `#3ddc97` | Success text and icons |
| `--success-soft` | `#e6f6ef` | `rgba(61, 220, 151, 0.14)` | Success panel background |
| `--focus-ring` | `#0075e2` | `#24bdff` | `:focus-visible` outline color |

### 1.4 Gradients (only two allowed)

| Token | Value | Usage |
|-------|-------|-------|
| `--gradient-accent` | `linear-gradient(135deg, #0d8cff 0%, #1721a6 100%)` | Hero avatar ring backdrop, primary button hover sheen (dark theme: `#24bdff` → `#0d8cff`) |
| `--gradient-hero-wash` | `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(13, 140, 255, 0.08), transparent 70%)` | Hero section background wash. Dark: `rgba(36, 189, 255, 0.10)` |

No other gradients. No gradient text anywhere.

---

## 2. Typography

### 2.1 Font family

```css
--font-sans: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

One family for everything. `index.html` loads
`Poppins:wght@400;500;600;700&display=swap`; Open Sans is removed (unused after
redesign, saves one request + download).

### 2.2 Scale (desktop / mobile ≤760px)

| Token | Desktop | Mobile | Weight | Line height | Letter spacing | Usage |
|-------|---------|--------|--------|-------------|----------------|-------|
| `--text-display` | `48px` | `34px` | 700 | 1.15 | `-0.02em` | Hero name only |
| `--text-h1` | `36px` | `28px` | 700 | 1.2 | `-0.01em` | Inner page titles |
| `--text-h2` | `30px` | `26px` | 700 | 1.25 | `-0.01em` | Section headings |
| `--text-h3` | `20px` | `18px` | 600 | 1.3 | `0` | Card titles, sub-headings |
| `--text-body-lg` | `17px` | `16px` | 400 | 1.7 | `0` | Hero summary, About paragraphs |
| `--text-body` | `16px` | `16px` | 400 | 1.7 | `0` | Default body |
| `--text-ui` | `15px` | `15px` | 500 | 1.4 | `0` | Buttons, nav links, labels |
| `--text-small` | `14px` | `14px` | 500 | 1.5 | `0` | Meta, dates, secondary info |
| `--text-badge` | `13px` | `13px` | 500 | 1 | `0.01em` | Pills, badges, tags |

Implement as paired custom properties, e.g. `--text-display: 48px;` plus a
`@media (max-width: 760px)` override in `vars.css` (see §9).

### 2.3 Rules

- Body paragraph measure: `max-width: 68ch` on long-form text (About, Project
  description).
- Headings use `text-wrap: balance`.
- Numerals in the stats strip use `font-variant-numeric: tabular-nums`.
- No text below 13px. No uppercase eyebrow/kicker labels above headings.

---

## 3. Spacing

4px base scale:

```css
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
--space-5: 24px;  --space-6: 32px;  --space-7: 48px;  --space-8: 64px;
--space-9: 96px;
```

Layout rhythm:

| Context | Value |
|---------|-------|
| Section padding block (desktop) | `--space-9` (96px) |
| Section padding block (mobile) | `--space-8` (64px) |
| Section header margin-bottom | `--space-7` (48px) |
| Card padding | `--space-5` (24px) |
| Card grid gap | `--space-5` (24px) |
| Inline pill gap | `--space-3` (12px) |
| Heading → first paragraph | `--space-4` (16px) |
| Paragraph → paragraph | `--space-4` (16px) |

More space above a heading than below it, always.

---

## 4. Radius

```css
--radius-sm: 8px;    /* inputs, small tags */
--radius-md: 12px;   /* buttons, small cards, logos */
--radius-lg: 16px;   /* cards, panels */
--radius-pill: 999px;/* pills, badges, avatar ring, icon buttons */
```

---

## 5. Shadows

Navy-tinted, always with vertical offset + soft blur (no zero-offset halos, no hard
offset blocks):

| Token | Light value | Dark value | Usage |
|-------|-------------|------------|-------|
| `--shadow-sm` | `0 1px 2px rgba(12, 18, 89, 0.07)` | `0 1px 2px rgba(0, 0, 0, 0.45)` | Card resting state |
| `--shadow-md` | `0 4px 12px rgba(12, 18, 89, 0.08)` | `0 4px 12px rgba(0, 0, 0, 0.5)` | Sticky navbar, dropdowns |
| `--shadow-lg` | `0 12px 32px rgba(12, 18, 89, 0.12)` | `0 12px 32px rgba(0, 0, 0, 0.55)` | Card hover, hero avatar |

---

## 6. Motion

```css
--dur-fast: 150ms;
--dur-med: 250ms;
--ease-out: cubic-bezier(0.16, 1, 0.3, 1); /* exponential ease-out */
```

Rules:

- Allowed properties: `transform`, `opacity`, `box-shadow`, `background-color`,
  `border-color`, `color`.
- Hover lift: `translateY(-2px)` with `--shadow-sm` → `--shadow-lg`, `--dur-med`.
- Button press: `translateY(0)` on `:active`, `--dur-fast`.
- The only entrance animation in the whole site: hero content `fade-up`
  (`opacity 0 → 1`, `translateY(12px) → 0`, 400ms `--ease-out`, staggered 80ms
  across 3 groups max), runs once on first paint.
- The existing `@media (prefers-reduced-motion: reduce)` block in
  `MediaQueries.css` stays and must neutralize all of the above.

---

## 7. Breakpoints and layout

```css
--bp-mobile: 760px;
--bp-desktop: 1080px;
```

- Container: `max-width: 1080px; margin-inline: auto; padding-inline: 24px;`
  (replaces the current `width: 56%`).
- Only two media queries: `max-width: 1080px` (tablet adjustments) and
  `max-width: 760px` (mobile). The current 1632px breakpoint is deleted.
- Mobile gutters stay 24px.

---

## 8. Z-index

```css
--z-nav: 100;
--z-mobile-menu: 150;
--z-skip-link: 200;
```

Nothing else gets a z-index above 10.

---

## 9. Copy-paste-ready `vars.css`

This block replaces the entire current content of `src/styles/vars.css`:

```css
:root {
  /* Accent (brand blue) */
  --accent-deep: #0059b3;
  --accent-strong: #0075e2;
  --accent-strong-hover: #0062c0;
  --accent: #0d8cff;
  --accent-bright: #24bdff;
  --accent-soft: #e3f3ff;
  --accent-soft-strong: #cbe7ff;
  --accent-ink: #1721a6;

  /* Neutrals */
  --bg: #ffffff;
  --bg-subtle: #f6f9fc;
  --surface: #ffffff;
  --border: #e3eaf2;
  --border-strong: #c9d6e4;
  --text: #17203a;
  --text-secondary: #4f5d7a;
  --text-muted: #66738e;
  --text-on-accent: #ffffff;
  --navy: #0c1259;

  /* Semantic */
  --danger: #d40202;
  --danger-soft: #fdecec;
  --success: #0b8a5f;
  --success-soft: #e6f6ef;
  --focus-ring: #0075e2;

  /* Gradients */
  --gradient-accent: linear-gradient(135deg, #0d8cff 0%, #1721a6 100%);
  --gradient-hero-wash: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(13, 140, 255, 0.08), transparent 70%);

  /* Typography */
  --font-sans: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --text-display: 48px;
  --text-h1: 36px;
  --text-h2: 30px;
  --text-h3: 20px;
  --text-body-lg: 17px;
  --text-body: 16px;
  --text-ui: 15px;
  --text-small: 14px;
  --text-badge: 13px;

  /* Spacing */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;
  --space-9: 96px;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(12, 18, 89, 0.07);
  --shadow-md: 0 4px 12px rgba(12, 18, 89, 0.08);
  --shadow-lg: 0 12px 32px rgba(12, 18, 89, 0.12);

  /* Motion */
  --dur-fast: 150ms;
  --dur-med: 250ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);

  /* Z-index */
  --z-nav: 100;
  --z-mobile-menu: 150;
  --z-skip-link: 200;
}

body.theme-dark {
  --accent-deep: #bfe9ff;
  --accent-strong: #24bdff;
  --accent-strong-hover: #4ecbff;
  --accent: #0d8cff;
  --accent-bright: #7fdcff;
  --accent-soft: rgba(36, 189, 255, 0.14);
  --accent-soft-strong: rgba(36, 189, 255, 0.24);
  --accent-ink: #8b95ff;

  --bg: #090d40;
  --bg-subtle: #0d1449;
  --surface: #111a5c;
  --border: #26307a;
  --border-strong: #35418f;
  --text: #f4f6ff;
  --text-secondary: #c3cbe8;
  --text-muted: #97a0c9;
  --text-on-accent: #06122e;
  --navy: #06082b;

  --danger: #ff6b6b;
  --danger-soft: rgba(238, 44, 44, 0.16);
  --success: #3ddc97;
  --success-soft: rgba(61, 220, 151, 0.14);
  --focus-ring: #24bdff;

  --gradient-accent: linear-gradient(135deg, #24bdff 0%, #0d8cff 100%);
  --gradient-hero-wash: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(36, 189, 255, 0.10), transparent 70%);

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.45);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.55);
}

@media (max-width: 760px) {
  :root {
    --text-display: 34px;
    --text-h1: 28px;
    --text-h2: 26px;
    --text-h3: 18px;
    --text-body-lg: 16px;
  }
}
```

---

## 10. Migration table (old `vars.css` → new)

| Old token | Old value | New token | Notes |
|-----------|-----------|-----------|-------|
| `--primary` | `#24bdff` | `--accent-strong` | Text/action usages move to `--accent-strong`; decorative ring usages move to `--accent-bright` |
| `--dark-primary` | `#1721a6` | `--accent-ink` | |
| `--very-dark-primary` | `#0c1259` | `--navy` | Was also (ab)used as light-theme surface; those usages move to `--surface` |
| `--secondary` | `#cfcfcf` | `--border-strong` | |
| `--light-secondary` | `#eff1f2` | `--bg-subtle` | |
| `--very-light-secondary` | `#cfcfcf` | `--text-secondary` | Was (ab)used as body text color |
| `--background` | `#090d40` | `--bg` | Dark value becomes the `body.theme-dark` override |
| `--info` | `#0d8cff` | `--accent` | |
| `--dark-info` | `#0075e2` | `--accent-strong` | |
| `--danger` | `#ee2c2c` | `--danger` (`#d40202`) | Darkened for 4.5:1 text contrast on light bg |
| `--dark-danger` | `#d40202` | `--danger` | Merged into one token |
| `--white` | `#f7f7f7` | `--text` (dark theme) | |
| `--gray` | `#eee` | `--border` | |
| `--dark` | `#06082b` | `--navy` (dark theme) | |
| `--xs`…`--xl4` | 12–32px | `--text-*` scale | Named scale replaces size-number vars |

`.white-theme-variables` (in `styles.css`) is deleted. Light is `:root`; dark is
`body.theme-dark`. Every component stylesheet that references old token names must be
updated in the same pass — the build has no runtime fallback for missing variables.

---

## Acceptance criteria

- [ ] `vars.css` contains exactly the §9 block (light `:root`, `body.theme-dark`,
      mobile type overrides) and nothing else.
- [ ] No component stylesheet contains a raw hex color, raw px font-size, or raw ms
      duration after migration (1px borders and the §9 file itself excepted).
- [ ] Light theme is the default render with no `localStorage` entry.
- [ ] All contrast pairs in §1.1/§1.2 meet the stated ratios (verify with a contrast
      checker on the built page).
- [ ] `grep -r "white-theme-variables" src/` returns nothing.
- [ ] `grep -rE "var\(--(primary|dark-primary|very-dark-primary|secondary|light-secondary|very-light-secondary|background|info|dark-info|dark-danger|white|gray|dark|xs|sm|md|lg|xl[0-9]?)\)" src/` returns nothing.
