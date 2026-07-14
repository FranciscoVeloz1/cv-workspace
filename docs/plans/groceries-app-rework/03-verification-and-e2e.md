# 03 — Verification and E2E

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Confirm the reworked `groceries-app` builds, lints, tests, and behaves correctly end-to-end with `personal-api` running (no backend changes). Update the e2e runbook with the new route paths.

**Prerequisite:** Specs 01 and 02 complete.

---

## Task 1: Automated checks

- [ ] **Step 1: Build, lint, test**

Run:
```bash
cd repos/groceries-app && npm run build && npm run lint && npm run test
```
Expected: all three green. `npm run test` runs the `RequireAdmin` suite (4 passing).

- [ ] **Step 2: Commit if anything was tweaked**

If verification surfaced fixes, commit them:
```bash
git add -A
git commit -m "chore(groceries-app): verification fixes"
```
Otherwise skip.

---

## Task 2: Manual smoke against live servers

`personal-api` is unchanged, so the existing admin user (with `groceries-app` `ADMIN` permission) still works.

- [ ] **Step 1: Start the backend**

Run: `cd repos/personal-api && node scripts/start-embedded-db.mjs --detach && npm run dev` (in one terminal)
Expected: API listening on its configured origin; embedded Postgres running.

- [ ] **Step 2: Start the frontend**

Run: `cd repos/groceries-app && npm run dev` (in another terminal)
Expected: Vite dev server at the configured origin (base `/groceries-app/`).

- [ ] **Step 3: Guest flows**

Open the app in a browser and verify:
- `/` renders `CategoriesPage` with the category grid and an "Admin" link.
- Clicking a category navigates to `/products/:categoryId` and shows products.
- Adding products updates the cart badge; clicking the badge opens `/cart`.
- Direct URL `/cart` works; back button returns to the previous page.
- Cart survives navigation: add items, go to `/`, return to `/cart` — items persist (proves `CartProvider` works).

- [ ] **Step 4: Protected route redirect (anonymous)**

While logged out, open `/admin/products` directly.
Expected: redirected to `/login`.

- [ ] **Step 5: Login as admin**

On `/login`, sign in with the seeded admin credentials.
Expected: redirected to `/admin/products`; `AdminNav` shows Productos/Compra/Historial with the active link styled.

- [ ] **Step 6: Admin navigation + deep links**

- Click "Compra" → `/admin/shopping` loads the draft (or empty state).
- Click "Historial" → `/admin/history` lists completed trips.
- Open a trip, copy its id, then open `/admin/history/<id>` directly.
Expected: the detail view for that trip opens (proves `useParams` deep link works).

- [ ] **Step 7: Cart → shopping flow**

Go to `/cart` with items in it; click "Iniciar mandado (precios reales)".
Expected: a draft is created from the cart, the cart is cleared, and the app navigates to `/admin/shopping` with the items preloaded.

- [ ] **Step 8: Non-admin forbidden**

Log in as a user who is authenticated but not a `groceries-app` admin (or temporarily revoke the permission in the DB).
Expected: visiting `/admin/products` redirects to `/forbidden`; `/forbidden` shows the restricted-access page with a link back to `/`.

- [ ] **Step 9: Logout**

From an admin page, click "Salir" in `AdminNav`.
Expected: session cleared and redirected to `/`.

---

## Task 3: Update the e2e runbook

**Files:**
- Modify: `docs/plans/groceries-app-backend/e2e-local-runbook.md`

- [ ] **Step 1: Update route paths in the runbook**

The app no longer uses in-app view state; routes are real URLs. Update any references to "admin panel", "products page", "shopping", "history" to the new paths:
- Admin login: `/login`
- Products admin: `/admin/products`
- Shopping: `/admin/shopping`
- History: `/admin/history` and `/admin/history/:tripId`
- Forbidden: `/forbidden`

Add a note that the cart now persists across navigation via `CartProvider`, and that protected routes redirect anonymous users to `/login` and non-admins to `/forbidden`.

- [ ] **Step 2: Commit**

```bash
git add docs/plans/groceries-app-backend/e2e-local-runbook.md
git commit -m "docs(groceries): update e2e runbook with reworked route paths"
```

---

## Task 4: Finishing

- [ ] **Step 1: Use superpowers:finishing-a-development-branch**

Follow the `finishing-a-development-branch` skill to decide merge / PR / cleanup for the `feat/groceries-rework` branch. Confirm the branch builds cleanly and all tasks above are checked off before requesting review.
