# Admin Gate and Product CRUD UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional admin login entry and product catalog CRUD for groceries ADMIN users, while leaving guest browse/cart/Excel/JSON behavior unchanged.

**Architecture:** Keep the existing view state machine in `App.tsx` for guests. Add admin views (`login`, `admin-products`, and stubs/nav for shopping/history used in spec 05). Admin product data comes from the API (`string` UUID ids). Guest product lists continue to use static `data/products.json` (`number` ids) via `useProducts`. No React Router required unless adding it is smaller — prefer extending the existing `View` union to avoid a dependency.

**Tech Stack:** React 19, existing CSS modules style, AuthProvider from spec 03.

---

## Scope and dependencies

- **Depends on:** [03 — Groceries auth and API client](03-groceries-auth-and-api-client.md).
- **Unblocks:** [05 — Priced shopping and history UI](05-priced-shopping-and-history-ui.md).
- **Does not include:** Precio Real trip UI, history detail, or playwright E2E.

## Files

- Modify: `repos/full-groceries-app/src/App.tsx`
- Create: `repos/full-groceries-app/src/pages/LoginPage.tsx`
- Create: `repos/full-groceries-app/src/pages/LoginPage.module.css`
- Create: `repos/full-groceries-app/src/pages/AdminProductsPage.tsx`
- Create: `repos/full-groceries-app/src/pages/AdminProductsPage.module.css`
- Create: `repos/full-groceries-app/src/components/AdminNav/index.tsx` (or `AdminNav.tsx` + css — match project: existing components are flat `components/Name.tsx`; prefer **`components/AdminNav.tsx` + `AdminNav.module.css`** to match current layout, not force the standard folder layout unless migrating)
- Create: `repos/full-groceries-app/src/hooks/useAdminProducts.ts`
- Modify: `repos/full-groceries-app/src/pages/CategoriesPage.tsx` (discreet Admin / Login control)
- Modify: `repos/full-groceries-app/src/types.ts` **only if** sharing a narrow admin view union type elsewhere (prefer keep view types in `App.tsx`)

## View union extension

```ts
type View =
  | { page: 'categories' }
  | { page: 'products'; categoryId: number }
  | { page: 'cart' }
  | { page: 'login' }
  | { page: 'admin-products' }
  | { page: 'admin-shopping' } // shell navigation only in this spec; full UI in 05
  | { page: 'admin-history' }  // shell navigation only in this spec; full UI in 05
```

### Guest guarantees (regression)

While `!isGroceriesAdmin`:

- Categories → products → cart flow identical.
- Export Excel / Export JSON / Import JSON still work.
- No network calls to `/api/v1/groceries/*`.
- Cart remains in-memory `useCart`.

### Admin entry points

On `CategoriesPage` (footer or header secondary control):

- If `status === 'anonymous'`: button/link **“Admin”** → `setView({ page: 'login' })`.
- If `authenticated && isGroceriesAdmin`: show **AdminNav** (Products | Shopping | History | Logout) and optional “Catalog (live)” label.
- If `authenticated && !isGroceriesAdmin`: show short message + Logout; do not expose CRUD.

### Login page

- Intent: admin reaches catalog tools quickly; calm, dense form; Spanish labels OK if the rest of the app is Spanish — match existing UI language (app mix of Spanish product names / English chrome — keep login in Spanish: “Correo”, “Contraseña”, “Entrar”).
- Fields: email, password; submit; inline error from `ApiError.message`.
- On success:
  - if `isGroceriesAdmin` → `admin-products`
  - else → show inline “No tienes permiso de administrador” and stay/return to categories with logout available
- If already groceries admin: redirect to `admin-products`.
- States: default, submitting (disabled button), error, focus rings.

### AdminNav

Links/buttons that call `setView` for admin pages + Logout (`await logout()` then `categories`).

### Admin products page

- Load via `useAdminProducts` → `listProducts()`.
- Loading / empty / error states.
- Table or card list: name, category label (from `categories.ts`), list price, image filename.
- Create form: name, category select (1–5), price, image (optional string).
- Edit: inline or modal — PATCH on save.
- Delete: confirm then DELETE; refresh list.
- Back control to categories (guest browse still available using static JSON).

```ts
// hooks/useAdminProducts.ts
export function useAdminProducts() {
  // isGroceriesAdmin guard: if false, expose error/empty and no fetches
  // load on mount when admin
  // create / update / remove methods calling api/groceries
  // use functional setState; brace style
}
```

Map API products to UI; category labels:

```ts
import { categories } from '../data/categories'
categories[product.category as CategoryId]
```

### Task 1: Login page + App wiring

- [ ] **Step 1: Implement `LoginPage`** with email/password form calling `login` from `useAuth()` (export `useAuth` from AuthProvider).

- [ ] **Step 2: Extend `App.tsx` View union** and render branches for `login` / `admin-products` / placeholders for shopping & history (`<p>Coming in next task</p>` or minimal shell with AdminNav only).

- [ ] **Step 3: Add Admin entry** on `CategoriesPage`.

- [ ] **Step 4: Manual verify guest path** — open app without login; browse; cart; export still works.

### Task 2: Admin products CRUD

- [ ] **Step 1: Implement `useAdminProducts` + `AdminProductsPage`.**

- [ ] **Step 2: Wire AdminNav** Products active state.

- [ ] **Step 3: Manual verify with API** — seed admin + products; login; create/edit/delete one product; reload page; list persists.

```bash
# API: migrated + seeded
# SPA:
cd repos/full-groceries-app
cp -n .env.example .env
npm run dev
# Open http://localhost:5173/full-groceries-app/
```

- [ ] **Step 4: Confirm guest still uses static JSON** — logout; products on category pages still from `useProducts` / JSON (counts may differ from DB — that is expected).

### Task 3: Commit

- [ ] **Step 1: Commit on `feat/groceries-admin`.**

```bash
git add src/App.tsx src/pages/LoginPage.tsx src/pages/LoginPage.module.css \
  src/pages/AdminProductsPage.tsx src/pages/AdminProductsPage.module.css \
  src/pages/CategoriesPage.tsx src/components/AdminNav.tsx \
  src/components/AdminNav.module.css src/hooks/useAdminProducts.ts
git commit -m "$(cat <<'EOF'
feat: add admin login and product catalog CRUD UI

EOF
)"
```

## Verification

- Guest-only session never hits groceries API.
- Groceries ADMIN can CRUD products.
- Non-admin authenticated user cannot open a working CRUD page (redirect or disabled empty state).
- Logout returns to pure guest behavior.
