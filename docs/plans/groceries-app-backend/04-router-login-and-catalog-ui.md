# Router, Login, and Catalog UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hand-rolled `useState` navigation in `full-groceries-app` with `react-router`, add a login gate, and load categories/products from `personal-api` (backend source of truth). Keep the shopping cart local.

**Architecture:** `BrowserRouter` with `basename={import.meta.env.BASE_URL}`, `RequireAuth` for catalog/cart, public `/login`. Catalog pages use TanStack Query hooks from spec 03. Users need `groceries-app` READ_ONLY+ membership to browse (API enforces; UI may show a clear error if authenticated but forbidden). Remove runtime JSON / static category map. Cart stays React state with UUID product ids.

**Tech Stack:** React 19, react-router-dom v7, TanStack Query, Vite, playwright-cli (verification).

---

## Scope and dependencies

- **Depends on:** [03 — Auth and API client](03-groceries-auth-and-api-client.md).
- **Unblocks:** [05 — Admin product CRUD UI](05-admin-product-crud-ui.md), [06 — Groceries E2E](06-groceries-e2e.md).
- **Does not include:** Admin product mutations UI, trip/history UI, category admin screens, cart persistence to API.

## Files

- Modify: `repos/full-groceries-app/src/main.tsx`
- Modify: `repos/full-groceries-app/src/App.tsx` — routes only
- Create: `repos/full-groceries-app/src/auth/RequireAuth.tsx`
- Create: `repos/full-groceries-app/src/pages/LoginPage.tsx`
- Create: `repos/full-groceries-app/src/pages/ForbiddenPage.tsx`
- Modify: `repos/full-groceries-app/src/pages/CategoriesPage.tsx`
- Modify: `repos/full-groceries-app/src/pages/ProductListPage.tsx`
- Modify: `repos/full-groceries-app/src/pages/CartPage.tsx`
- Modify: `repos/full-groceries-app/src/hooks/useCart.ts` — string product ids
- Modify: `repos/full-groceries-app/src/components/*` for `Link` / `useNavigate`
- Create: cart provider if needed so cart survives route changes
- Delete runtime use of `data/products.json`, `src/data/categories.ts`, JSON-based `useProducts` / `useCategories`

## Route map

| Path | Guard | Page |
| --- | --- | --- |
| `/login` | public (redirect to `/` if authenticated) | `LoginPage` |
| `/` | `RequireAuth` | `CategoriesPage` |
| `/products/:categoryId` | `RequireAuth` | `ProductListPage` |
| `/cart` | `RequireAuth` | `CartPage` |
| `/forbidden` | `RequireAuth` | `ForbiddenPage` (prep for admin) |

`RequireAuth`: `bootstrapping` → loading; `anonymous` → `/login`; else `<Outlet />`.

## Login UI

- Email + password → `login()`; navigate to `/` on success.
- Show `ApiError.message` on failure.
- Spanish copy consistent with Mandado UI.

## Catalog UI (API source of truth)

### CategoriesPage

- `useCategoriesQuery()` — loading / error / empty.
- Navigate to `/products/${category.id}` (UUID).
- Cart badge from local cart.
- If query returns 403, show message that groceries access is required.

### ProductListPage

- `categoryId` from `useParams()`; `useProductsQuery({ categoryId })`.
- Client-side search on loaded products.
- Add to cart with API product shape.
- Custom Extras lines: local-only; gate when category **name** is `Extras` (not Int `5`).

### CartPage

- Existing qty / remove / clear / export / import.
- String ids; bump grocery-list schema version if needed.

## Remove JSON runtime

Stop bundling/using `data/products.json` and `src/data/categories.ts` in the SPA. Keep JSON on disk only as API seed input.

### Task 1: Router + guards + login

- [ ] Implement `RequireAuth`, `LoginPage`, `ForbiddenPage`, routes.
- [ ] Smoke: anonymous `/` → `/login`.

### Task 2: Wire catalog to API

- [ ] Rewrite categories + product list pages.
- [ ] Update cart + export utils for string ids.
- [ ] Remove JSON/static category runtime sources.
- [ ] `npm run lint && npx tsc -b --noEmit && npm run build`.

### Task 3: Playwright E2E for this spec

Prerequisites: API migrated + `db:seed-groceries`; SPA env; CORS; user with `groceries-app` READ_ONLY:

- email: `groceries.user@example.com` / `password123`

```bash
playwright-cli open "http://localhost:5173/full-groceries-app/"
playwright-cli snapshot
playwright-cli fill <emailRef> "groceries.user@example.com"
playwright-cli fill <passwordRef> "password123"
playwright-cli click <submitRef>
playwright-cli snapshot
# Expect API category names

playwright-cli click <comidaCategoryRef>
playwright-cli snapshot
# Expect products

# Anonymous deep link redirects to login
playwright-cli open "http://localhost:5173/full-groceries-app/login"
# logout then open /products/<uuid> → login
```

### Task 4: Commit

```bash
git add .
git commit -m "$(cat <<'EOF'
feat: route Mandado app with login and API-backed catalog

EOF
)"
```

## Verification / E2E (this spec)

- [ ] Unauthenticated users redirected to `/login`.
- [ ] Authenticated groceries READ_ONLY sees categories/products from API (not JSON).
- [ ] Local cart works across routes.
- [ ] Playwright-cli path above passes.
- [ ] `npm run build` succeeds.
