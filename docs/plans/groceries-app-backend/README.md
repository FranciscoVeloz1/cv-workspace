# Groceries App Backend Integration Specifications

These specifications split the Full Groceries App ↔ `personal-api` integration into small, independently reviewable implementation units.

Both apps stay on **separate hosts**. The API does **not** host the groceries SPA. Guests keep today’s static client-only behavior. Administrators with `full-groceries-app` `ADMIN` unlock product CRUD, an in-app **Precio Real** shopping session, and grocery history via the API.

## Execution order

1. [01 — Groceries database schema](01-groceries-database-schema.md)
   - Prisma models, migration, Application + product seed from `products.json`.
2. [02 — Groceries API module](02-groceries-api-module.md)
   - `ADMIN`-gated CRUD under `/api/v1/groceries` for products and trips.
3. [03 — Groceries auth and API client](03-groceries-auth-and-api-client.md)
   - Env, JWT session, HTTP client, groceries API wrappers, admin capability flag.
4. [04 — Admin gate and product CRUD UI](04-admin-gate-and-product-crud-ui.md)
   - Optional login, admin shell, product catalog admin; guest path untouched.
5. [05 — Priced shopping and history UI](05-priced-shopping-and-history-ui.md)
   - Excel-equivalent Precio Real session, draft/complete trip, history screens.
6. [06 — Groceries E2E](06-groceries-e2e.md)
   - Guest regression + admin happy path; see also [e2e-local-runbook.md](e2e-local-runbook.md).

## Fixed decisions

- Backend: `repos/personal-api` — new `groceries` module (schemas → repository → service → controller → routes).
- Frontend: `repos/full-groceries-app` — GitHub Pages guest app; API only when groceries admin.
- Auth: existing JWT login/refresh/`/auth/me`. Application slug **`full-groceries-app`**. Admin = `UserAppPermission.role === ADMIN` for that slug.
- Guest / non-admin: static `data/products.json`, in-memory cart, Excel/JSON export — **no required login**.
- Admin unlock: product CRUD against DB, in-app Precio Real shopping session, grocery history.
- Catalog: **global** `GroceryProduct` rows (not per-user); mutated only by groceries `ADMIN`.
- Categories: keep ints `1–5` from `src/data/categories.ts`; no Category CRUD in v1.
- Seed: Application upsert + products from `repos/full-groceries-app/data/products.json` (new UUID PKs; do not reuse numeric JSON ids as PKs).
- Client patterns: mirror user-management / fitness — `VITE_API_BASE_URL`, refresh token in localStorage, access token in memory, `AuthProvider`.
- Feature branches: `feat/groceries-api` (`personal-api`), `feat/groceries-admin` (`full-groceries-app`).
- Local: API `http://localhost:3000`, Vite with `base: '/full-groceries-app/'`, `VITE_API_BASE_URL=http://localhost:3000`.
- **Working directories:** implement and commit only in the main submodule paths `repos/personal-api` and `repos/full-groceries-app`. Do **not** use git worktrees, isolated checkouts, or `.worktrees/` paths.

## Review contract

Each specification has:

- a limited file boundary;
- test-first acceptance criteria;
- a standalone commit boundary; and
- explicit dependency and verification requirements.

Do not begin a later specification until its listed dependency is merged or otherwise available in the working branch.

## Branch setup (before Task 1 of spec 01 / 03)

Create feature branches **in place** under the repo directories below (not worktrees):

```bash
cd repos/personal-api
git checkout main && git pull
git checkout -b feat/groceries-api

cd ../full-groceries-app
git checkout main && git pull
git checkout -b feat/groceries-admin
```

All later `cd repos/personal-api` / `cd repos/full-groceries-app` commands in these specs mean those same directories on the feature branches above.
## Spec coverage map

| Requirement | Spec |
|-------------|------|
| DB + migrations for product list | 01 |
| Product list CRUD API | 02 |
| Cart → real prices in frontend (Excel-like) | 05 (+ trip APIs in 02) |
| History of groceries done | 02 + 05 |
| Admin-only full features | 02 gate + 03/04 capability |
| Non-admin current behavior | README + 04 + 06 regression |
