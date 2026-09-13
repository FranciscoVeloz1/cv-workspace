# 02 — Global Shell: Theme, Base Styles, Navbar, Footer, Primitives

Covers everything shared across pages: the theme system, global CSS, the layout
container, Navbar, Footer, and the reusable primitives every section composes.
Token names referenced here resolve in [01-design-tokens.md](01-design-tokens.md).

---

## 1. Theme system

### 1.1 Behavior

- **Light is the default.** With no stored preference, the site renders light.
- The toggle in the Navbar switches theme and persists to
  `localStorage.setItem('theme', 'dark' | 'light')`.
- Stored value `'dark'` → dark; anything else (including legacy `'white'`) → light.
- Theme applies via a single class on `<body>`: `theme-dark`. Light needs no class.

### 1.2 Changes to `src/App.tsx`

- `type Theme = 'light' | 'dark'` (rename `'white'` → `'light'`).
- Lazy initial state: `localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'`
  (keep the existing try/catch; fallback `'light'`).
- Effect: `document.body.classList.toggle('theme-dark', theme === 'dark')`.
- `Navbar` prop `theme` and `onToggleTheme` signatures unchanged.

### 1.3 Changes to `index.html` bootstrap script

Replace the existing inline script's default so first paint matches React state
(no flash of dark on first visit):

```html
<script>
  try {
    var theme = localStorage.getItem('theme') || 'light'
    document.body.classList.toggle('theme-dark', theme === 'dark')
  } catch {}
</script>
```

The script stays in `<body>` before `/src/main.tsx`, synchronous, exactly as the
current one — only the default and class name change.

### 1.4 Font loading change in `index.html`

- Replace the two Google Fonts links with one:
  `https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap`
- Delete the Open Sans link. Keep all preconnect/dns-prefetch hints and the
  Font Awesome stylesheet untouched.

---

## 2. Global base styles (`src/styles/styles.css`)

Replace file content with:

```css
@import './vars.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  scroll-padding-top: 88px; /* sticky nav height + breathing room for anchor jumps */
}

body {
  font-family: var(--font-sans);
  font-size: var(--text-body);
  line-height: 1.7;
  color: var(--text);
  background-color: var(--bg);
  transition: background-color var(--dur-med) var(--ease-out),
    color var(--dur-med) var(--ease-out);
}

:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

::selection {
  background: var(--accent-soft);
  color: var(--navy);
}

body.theme-dark ::selection {
  background: var(--accent-soft);
  color: var(--text);
}

input, textarea {
  caret-color: var(--accent-strong);
}

a {
  color: var(--accent-strong);
  text-decoration: none;
  text-underline-offset: 4px;
  transition: color var(--dur-fast) var(--ease-out);
}

a:hover {
  color: var(--accent);
}

ul {
  list-style: none;
}

img {
  display: block;
  max-width: 100%;
}

.container {
  max-width: 1080px;
  margin-inline: auto;
  padding-inline: 24px;
}

.skip-link {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: var(--z-skip-link);
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-size: var(--text-ui);
  font-weight: 600;
  color: var(--text-on-accent);
  background: var(--accent-strong);
  transform: translateY(-200%);
  transition: transform var(--dur-fast) var(--ease-out);
}

.skip-link:focus {
  transform: translateY(0);
}

/* Utility kept for inline accent spans inside headings */
.txt-accent {
  color: var(--accent-strong);
}
```

Notes:

- `.txt-primary` is renamed `.txt-accent`; update all usages
  (`Navbar`, `Showcase`, `Projects`, `Certificate`, pages).
- `scroll-padding-top` makes navbar anchor links land below the sticky bar.
- The old `.container { width: 56% }` and the 1632px media query are deleted.
- `MediaQueries.css` keeps only the `prefers-reduced-motion` block; all other
  responsive rules move next to their component stylesheets (see §7).

---

## 3. Navbar

File: `src/components/Navbar.tsx` + `src/styles/Navbar.css`.

### 3.1 Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  Francisco Veloz        About  Experience  Projects  Contact     │
│  (brand, left)                (links, center)   [toggle] [CTA]   │
└──────────────────────────────────────────────────────────────────┘
```

- Brand: `{profile.firstName} {profile.lastName}`, last name wrapped in
  `.txt-accent`. Links to `/`.
- Links (anchor scroll on Home): About `#about`, Experience `#experience`,
  Projects `#projects`, Certificates `#certificates`, Contact `#contact`.
  Certificates is included; on inner pages links go to `/#…` equivalents.
- Right side: theme toggle IconButton + CTA Button (primary, size sm):
  label "Hire me", `href="mailto:{profile.email}"`.
- Social links move out of the Navbar into the Hero and Footer (they are
  currently duplicated in the Navbar menu; remove them there).

### 3.2 Bar styling

| Property | Value |
|----------|-------|
| Position | `sticky; top: 0; z-index: var(--z-nav)` |
| Height | 72px |
| Background | `color-mix(in srgb, var(--bg) 85%, transparent)` with `backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px)` — functional (readability over scrolling content), not decoration |
| Border | `border-bottom: 1px solid var(--border)` |
| Shadow | `--shadow-md` only after `window.scrollY > 8` (class `nav-scrolled`, toggled by the existing scroll listener pattern; no shadow at top) |
| Layout | flex, `align-items: center; justify-content: space-between; gap: var(--space-5)` |

The backdrop blur is the one allowed blur in the design; it exists so 72px of
sticky chrome never obscures content.

### 3.3 Element styling

| Element | Spec |
|---------|------|
| Brand (`.nav-brand`) | `--text-ui` + 3px (18px), weight 600, `color: var(--text)`; hover: no color change, `opacity: 0.75` |
| Nav link | `--text-ui` (15px), weight 500, `color: var(--text-secondary)`, padding `8px 12px`, radius `--radius-sm` |
| Nav link hover | `color: var(--accent-strong); background: var(--accent-soft)` |
| Nav link active (section in view) | `color: var(--accent-strong)` + 2px bottom border `var(--accent-strong)` with `text-underline-offset` replaced by `border-bottom` on the `<a>`; tracked via `IntersectionObserver` on section ids, one observer in `Navbar` |
| CTA | Button primary sm (see §5.1) |
| Theme toggle | IconButton (§5.4), sun icon shown in dark theme, moon in light (icon indicates where you go), `aria-label="Switch to dark theme"` / `"Switch to light theme"` |

### 3.4 Mobile (≤760px)

- Bar keeps brand left; right side shows theme toggle + hamburger IconButton
  (`fa-bars` / `fa-xmark` when open), `aria-expanded`, `aria-controls="nav-menu"`.
- CTA "Hire me" hides into the menu.
- Menu: absolutely positioned panel under the bar, full width, `background:
  var(--surface)`, `border-bottom: 1px solid var(--border)`, `box-shadow:
  var(--shadow-md)`, vertical list of links with 16px padding rows.
- Open/close: `opacity` + `translateY(-8px)` transition `--dur-fast`; panel is
  `visibility: hidden` when closed (not `display: none`, so transition runs).
- Menu closes on link click and on `Escape`.

### 3.5 States matrix

| State | Bar | Link | CTA | Toggle |
|-------|-----|------|-----|--------|
| Default | transparent-ish bg, hairline | secondary text | primary | border icon |
| Scrolled >8px | + `--shadow-md` | — | — | — |
| Hover | — | accent text + soft bg | §5.1 | §5.4 |
| Focus-visible | — | global ring | global ring | global ring |
| Active section | — | accent + underline | — | — |

---

## 4. Footer

File: `src/components/Footer.tsx` + `src/styles/Footer.css`.

### 4.1 Structure

```
┌────────────────────────────────────────────────────────────────┐
│  navy band (--navy)                                            │
│  Francisco Veloz          About / Experience / Projects / …    │
│  Senior Full-Stack Engineer   [GH] [LI] [YT] [mail]            │
│  ──────────────────────────────────────────────────────────    │
│  © 2026 Francisco González Veloz · Guadalajara, México         │
└────────────────────────────────────────────────────────────────┘
```

- Three columns on desktop: (1) brand + headline, (2) quick anchor links
  (same set as Navbar), (3) social IconButtons + email link. Stacks vertically
  on mobile, centered.
- Bottom row: hairline divider (`1px solid rgba(255,255,255,0.12)`), copyright
  line with `profile.fullName` and `profile.location`.

### 4.2 Styling

| Element | Spec |
|---------|------|
| Band | `background: var(--navy)`, padding `var(--space-8) 0 var(--space-6)` |
| Brand | 18px / 600, `#ffffff`; last name `var(--accent-bright)` |
| Headline | `--text-small`, `color: #c3cbe8`, max 40ch |
| Quick link | `--text-ui`, `#c3cbe8`; hover `#ffffff` |
| Social IconButton | dark variant (§5.4) |
| Email link | `--text-ui`, `#ffffff`, envelope icon, `mailto:` |
| Copyright | `--text-small`, `#97a0c9` |
| Divider | `border-top: 1px solid rgba(255, 255, 255, 0.12)`, margin `var(--space-6) 0 var(--space-5)` |

The navy band is identical in both themes (it is brand chrome, not surface).

---

## 5. Shared primitives

New files under `src/components/` per the react-folder-structure rule
(`Button/index.tsx` + colocated CSS, or plain CSS classes in
`src/styles/primitives.css` — pick plain CSS classes; the project styles via
class names today, so primitives ship as global classes: `.btn`, `.badge`,
`.section-header`, `.card`, `.icon-btn`, `.field`).

### 5.1 Button (`.btn`)

| Variant | Background | Text | Border | Hover | Active |
|---------|-----------|------|--------|-------|--------|
| `.btn-primary` | `var(--accent-strong)` | `var(--text-on-accent)` | none | `var(--accent-strong-hover)` + `translateY(-1px)` + `--shadow-md` | `translateY(0)`, shadow `--shadow-sm` |
| `.btn-outline` | transparent | `var(--accent-strong)` | `1.5px solid var(--accent-strong)` | `background: var(--accent-soft)` | `background: var(--accent-soft-strong)` |
| `.btn-ghost` | transparent | `var(--text-secondary)` | none | `color: var(--accent-strong); background: var(--accent-soft)` | — |

Shared: `display: inline-flex; align-items: center; gap: var(--space-2);
font-size: var(--text-ui); font-weight: 600; border-radius: var(--radius-md);
transition: all var(--dur-fast) var(--ease-out); cursor: pointer`.

Sizes: `.btn-sm` = `padding: 8px 16px` (navbar CTA); `.btn-md` =
`padding: 12px 24px` (hero, forms, default).

Disabled: `opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none`.
Loading: replace label with `fa-circle-notch fa-spin` + label text, `disabled`
+ `aria-busy="true"`.

Rendered as `<a>` for navigation, `<button type="button|submit">` for actions.
Never `<div onClick>`.

### 5.2 Badge / Pill (`.badge`)

| Property | Value |
|----------|-------|
| Background | `var(--accent-soft)` |
| Text | `var(--accent-deep)`, `--text-badge` (13px), weight 500 |
| Padding | `6px 12px` |
| Radius | `var(--radius-pill)` |
| Hover (when inside a link/card that links) | `background: var(--accent-soft-strong)` |

Replaces the current `Badge.tsx` styling and `skillBadgeClass.ts` per-category
color classes (deleted — one calm pill style for all skills; grouping, not color,
carries the category now).

Variant `.badge-neutral` for date/meta pills: `background: var(--bg-subtle)`,
`color: var(--text-secondary)`, `border: 1px solid var(--border)`.

### 5.3 SectionHeader (`.section-header`)

```
<h2 class="section-header">About <span class="txt-accent">Me</span></h2>
<p class="section-subtitle">…optional one-line subtitle…</p>
```

- H2: `--text-h2`, weight 700, `color: var(--text)`, `text-wrap: balance`;
  exactly one keyword span in `.txt-accent` per heading (mirrors the reference).
- Optional subtitle: `--text-body`, `var(--text-secondary)`, `margin-top:
  var(--space-3)`, `max-width: 60ch`.
- Block margin-bottom: `var(--space-7)`.
- Alignment: left by default; `.section-header-center` centers (Contact only).
- No kicker/eyebrow labels. No section numbers.

### 5.4 IconButton (`.icon-btn`)

| Property | Value |
|----------|-------|
| Size | 40px circle (`width/height: 40px`, `border-radius: var(--radius-pill)`) |
| Border | `1px solid var(--border-strong)` |
| Icon | 16px Font Awesome, `color: var(--text-secondary)` |
| Hover | `border-color: var(--accent-strong); color: var(--accent-strong); background: var(--accent-soft); translateY(-1px)` |
| Dark/footer variant `.icon-btn-on-dark` | border `rgba(255,255,255,0.24)`, icon `#c3cbe8`; hover border `var(--accent-bright)`, icon `#ffffff`, bg `rgba(255,255,255,0.08)` |

Always a real `<a>` or `<button>` with an `aria-label` (icon-only).

### 5.5 Card (`.card`)

| Property | Value |
|----------|-------|
| Background | `var(--surface)` |
| Border | `1px solid var(--border)` |
| Radius | `var(--radius-lg)` |
| Shadow | `--shadow-sm` |
| Padding | `var(--space-5)` |
| Hover (only when the whole card is a link) | `translateY(-2px)` + `--shadow-lg` + `border-color: var(--border-strong)`, `--dur-med` |

Cards never nest. Non-link cards (Experience items) keep the resting state at all
times — no hover lift without a destination.

### 5.6 Field (`.field` — input + textarea)

| State | Border | Background | Other |
|-------|--------|-----------|-------|
| Default | `1px solid var(--border-strong)` | `var(--surface)` | radius `--radius-sm`, padding `12px 16px`, `--text-body`, `color: var(--text)` |
| Hover | `var(--accent)` | — | — |
| Focus | `var(--accent-strong)` | — | + `box-shadow: 0 0 0 3px var(--accent-soft)` (replaces default outline for fields) |
| Error | `var(--danger)` | `var(--danger-soft)` | + error message below: 13px `var(--danger)` |
| Disabled | `var(--border)` | `var(--bg-subtle)` | `cursor: not-allowed` |

Labels: `--text-small`, weight 500, `color: var(--text)`, `margin-bottom:
var(--space-2)`, always visible above the field (no placeholder-only labels).
Placeholders: `color: var(--text-muted)`.

---

## 6. Layout assembly (`src/components/Layout.tsx`)

- The `.container` wrapper currently wraps Navbar + children only; Footer sits
  outside (full-width navy band). Keep that asymmetry: Navbar and page content
  inside `.container`, Footer full width.
- Keep the skip link as the first child, unchanged behavior, restyled per §2.

---

## 7. Responsive strategy

- Each component stylesheet owns its own `@media (max-width: 1080px)` and
  `@media (max-width: 760px)` blocks, colocated after the base rules.
  `MediaQueries.css` is reduced to the `prefers-reduced-motion` block only and
  is renamed `a11y.css` (update the import in `styles.css`).
- Desktop-first base, two max-width steps. No device-specific tweaks beyond
  the two breakpoints.

---

## Acceptance criteria

- [ ] First visit (empty localStorage) renders light theme with zero flash of dark.
- [ ] Toggle persists across reload in both directions; legacy `'white'` value
      renders light.
- [ ] Navbar is sticky, 72px, blurred bg, shadow appears only after scroll;
      all five anchor links scroll to sections with 88px offset; active section
      underlines while scrolling.
- [ ] Mobile menu opens/closes with transition, closes on link click and Escape,
      traps no focus, and passes keyboard-only navigation.
- [ ] Footer renders the navy band identically in both themes with working
      social/mail links.
- [ ] Every primitive above is used by at least one section (no dead CSS) and
      shows all states from its matrix.
- [ ] `grep -r "txt-primary" src/` returns nothing (renamed to `.txt-accent`).
- [ ] `grep -rn "skillBadgeClass" src/` returns nothing.
- [ ] `npm run build` and `npm run lint` pass.
