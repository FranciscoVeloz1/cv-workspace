# 01 — Frontend Folder Structure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Restructure `repos/groceries-app/src` to the workspace React folder standard, add `react-router-dom` + vitest/@testing-library, and keep build/lint green. No routing logic in this spec — only structure + tooling.

**Scope:** Frontend only. No `personal-api`, no auth/permission changes.

---

## Target layout (after this spec)

```
src/
  main.tsx
  App.tsx
  index.css
  vite-env.d.ts
  components/
    AdminNav/index.tsx + AdminNav.module.css
    CartBadge/index.tsx + CartBadge.module.css
    CategoryCard/index.tsx + CategoryCard.module.css
    ProductCard/index.tsx + ProductCard.module.css
    SearchBar/index.tsx + SearchBar.module.css
  pages/
    *.tsx + *.module.css            (pages stay flat — matches car-history-app)
  hooks/
  utils/
  types/
    domain.ts                       (moved from src/types.ts)
  auth/
  api/
  data/                             (repo-root data/ stays put)
  test/
    setup.ts
  config/                           (router added in spec 02)
```

---

## Task 1: Add dependencies and scripts

**Files:**
- Modify: `repos/groceries-app/package.json`

- [ ] **Step 1: Add deps + scripts**

Edit `package.json`. Under `dependencies` add `react-router-dom`. Under `devDependencies` add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`. Under `scripts` add `test` and `test:watch`.

Versions must match `repos/user-management-app/package.json` exactly (react-router-dom `^7.6.2`, vitest `^3.2.4`, `@testing-library/jest-dom` `^6.9.1`, `@testing-library/react` `^16.3.0`, `@testing-library/user-event` `^14.6.1`). Pin `jsdom` to whatever `user-management-app` pins — read that file first and copy the version.

Final `scripts`:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 2: Install**

Run: `cd repos/groceries-app && npm install`
Expected: install succeeds, `node_modules/react-router-dom` exists.

- [ ] **Step 3: Commit**

```bash
git add repos/groceries-app/package.json repos/groceries-app/package-lock.json
git commit -m "chore(groceries-app): add react-router-dom and vitest tooling"
```

---

## Task 2: Configure vitest

**Files:**
- Modify: `repos/groceries-app/vite.config.ts`
- Modify: `repos/groceries-app/tsconfig.app.json`
- Create: `repos/groceries-app/src/test/setup.ts`

- [ ] **Step 1: Switch vite config to vitest/config + add test block**

Replace `repos/groceries-app/vite.config.ts` with:

```ts
import { defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

export default defineConfig({
  base: '/groceries-app/',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: {
      VITE_API_BASE_URL: 'http://localhost:3000'
    }
  }
})
```

- [ ] **Step 2: Exclude test files from the build tsconfig**

In `repos/groceries-app/tsconfig.app.json`, add an `exclude` so `tsc -b` (the `build` script) does not compile vitest test files. The final file:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "esnext",
    "types": ["vite/client"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "resolveJsonModule": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "data"],
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/test"]
}
```

- [ ] **Step 3: Create test setup**

Create `repos/groceries-app/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Verify build still passes**

Run: `cd repos/groceries-app && npm run build`
Expected: `tsc -b` and `vite build` succeed (no test files exist yet, but the config is valid).

- [ ] **Step 5: Commit**

```bash
git add repos/groceries-app/vite.config.ts repos/groceries-app/tsconfig.app.json repos/groceries-app/src/test/setup.ts
git commit -m "chore(groceries-app): configure vitest with jsdom and test setup"
```

---

## Task 3: Move flat components into folders

**Files (move each `<Name>.tsx` + `<Name>.module.css` pair into `components/<Name>/`, rename the tsx to `index.tsx`):**
- `components/AdminNav.tsx` → `components/AdminNav/index.tsx` (+ `AdminNav.module.css`)
- `components/CartBadge.tsx` → `components/CartBadge/index.tsx` (+ `CartBadge.module.css`)
- `components/CategoryCard.tsx` → `components/CategoryCard/index.tsx` (+ `CategoryCard.module.css`)
- `components/ProductCard.tsx` → `components/ProductCard/index.tsx` (+ `ProductCard.module.css`)
- `components/SearchBar.tsx` → `components/SearchBar/index.tsx` (+ `SearchBar.module.css`)

- [ ] **Step 1: Move each component file pair**

For each of the five components: move the `.tsx` file to `components/<Name>/index.tsx` and the `.module.css` file to `components/<Name>/<Name>.module.css`. Use `git mv` so history is preserved:

```bash
cd repos/groceries-app/src/components
git mkdir AdminNav
git mv AdminNav.tsx AdminNav/index.tsx
git mv AdminNav.module.css AdminNav/AdminNav.module.css
# repeat for CartBadge, CategoryCard, ProductCard, SearchBar
```

(If `git mv` complains about the directory, create it first with `mkdir AdminNav`.)

- [ ] **Step 2: Fix the CSS import path inside each moved component**

Each component imports its CSS with a relative path like `from './AdminNav.module.css'`. After the move, `index.tsx` is in the same folder as the CSS, so `from './AdminNav.module.css'` still resolves. Verify no path change is needed — the import stays `from './<Name>.module.css'`.

- [ ] **Step 3: Update every importer to import by folder**

Search the codebase for imports of these components and change them to folder imports. Before: `import { AdminNav } from '../components/AdminNav'`. After: `import { AdminNav } from '../components/AdminNav'` — folder import resolves to `index.tsx`, so the import path is **unchanged**. Confirm by grepping:

Run: `cd repos/groceries-app && rg "from '.*components/(AdminNav|CartBadge|CategoryCard|ProductCard|SearchBar)'"`
Expected: all import specifiers point at the folder (no `/index` and no `.tsx` extension). No edits needed unless an import used a `.tsx` extension or `/index` suffix — fix those to the bare folder path.

- [ ] **Step 4: Verify build + lint**

Run: `cd repos/groceries-app && npm run build && npm run lint`
Expected: both green.

- [ ] **Step 5: Commit**

```bash
git add repos/groceries-app/src/components
git commit -m "refactor(groceries-app): move flat components into per-component folders"
```

---

## Task 4: Move shared types into `types/`

**Files:**
- Move: `repos/groceries-app/src/types.ts` → `repos/groceries-app/src/types/domain.ts`
- Modify: every file that imports from `../types` or `./types`

- [ ] **Step 1: Move the file**

```bash
cd repos/groceries-app/src
mkdir -p types
git mv types.ts types/domain.ts
```

- [ ] **Step 2: Update imports**

Find all imports of `../types` or `./types` and change them to `../types/domain` / `./types/domain`:

Run: `cd repos/groceries-app && rg "from '.*types'"` then update each hit to point at `types/domain`. Example:
- `import type { Product } from '../types';` → `import type { Product } from '../types/domain';`
- `import type { CategoryId } from '../types';` → `import type { CategoryId } from '../types/domain';`

- [ ] **Step 3: Verify build + lint**

Run: `cd repos/groceries-app && npm run build && npm run lint`
Expected: both green.

- [ ] **Step 4: Commit**

```bash
git add repos/groceries-app/src
git commit -m "refactor(groceries-app): move shared types into types/domain"
```

---

## Task 5: Final verification

- [ ] **Step 1: Build, lint, and (empty) test run**

Run:
```bash
cd repos/groceries-app && npm run build && npm run lint && npm run test
```
Expected: `vitest run` reports "No test files found" (or passes with zero tests) — that is fine; spec 02 adds the first test. Build and lint are green.

- [ ] **Step 2: Commit if anything changed**

If the final verification surfaced any formatting/import fixes, commit them:
```bash
git add -A
git commit -m "chore(groceries-app): finalize folder restructure"
```
Otherwise skip.
