# Groceries E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Document and automate a local, separate-host verification path that proves (1) guests still browse/cart/export without API dependency and (2) groceries ADMIN can login, manage products, complete a priced shopping session, and see history — using `playwright-cli`.

**Architecture:** personal-api on `:3000` with Postgres; full-groceries Vite with `base: '/full-groceries-app/'` and `VITE_API_BASE_URL=http://localhost:3000`; CORS allows the Vite origin. Playwright drives the groceries origin; API is exercised via UI (plus curl seed/provision).

**Tech Stack:** playwright-cli, personal-api Docker/Postgres or embedded DB, Vite, Express.

---

## Scope and dependencies

- **Depends on:** [02 — Groceries API module](02-groceries-api-module.md) and [05 — Priced shopping and history UI](05-priced-shopping-and-history-ui.md) on their feature branches.
- **Unblocks:** merge confidence for both PRs.
- **Does not include:** CI GitHub Actions wiring (optional follow-up); production Railway/Pages deploy changes.

## Files

- Modify: `repos/personal-api/.env.example` — document `CORS_ORIGINS` including groceries Vite origin
- Modify: `repos/full-groceries-app/.env.example` — confirm `VITE_API_BASE_URL` from spec 03
- Create: `docs/plans/groceries-app-backend/e2e-local-runbook.md` (companion runbook)
- Optional: note in `repos/full-groceries-app/README.md` linking to this folder for local admin setup

## Local environment

### API (`repos/personal-api`)

```bash
# .env (example)
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://personal_api:personal_api@localhost:5432/personal_api
JWT_ACCESS_SECRET=dev-access-secret-at-least-32-chars!!
JWT_REFRESH_SECRET=dev-refresh-secret-at-least-32-chars!
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password123
ADMIN_NAME=Admin

npm run db:up   # or docker compose up -d
npx prisma migrate deploy
npm run db:seed-admin
npm run db:seed-groceries
npm run dev
```

### Groceries SPA

```bash
cd repos/full-groceries-app
cp -n .env.example .env
# VITE_API_BASE_URL=http://localhost:3000
npm run dev
# App URL: http://localhost:5173/full-groceries-app/
```

E2E admin credentials (locals only; same as seed-admin):

- email: value of `ADMIN_EMAIL`
- password: value of `ADMIN_PASSWORD`

Ensure seed-admin also grants `full-groceries-app` ADMIN (spec 01).

### Task 1: Write runbook + CORS docs

- [ ] **Step 1: Create [e2e-local-runbook.md](e2e-local-runbook.md)** with start commands and playwright flow below.

- [ ] **Step 2: Update `personal-api/.env.example` `CORS_ORIGINS` comment** to mention groceries Vite origin (`http://localhost:5173`).

### Task 2: Guest regression (playwright-cli)

- [ ] **Step 1: Record guest flow** (no login):

```bash
playwright-cli open "http://localhost:5173/full-groceries-app/"
playwright-cli snapshot
# Select a category → add a product → open cart
# Export Excel (click) — expect download or no crash
# Expect: no login required
```

Acceptance:

- App shell loads with categories.
- Cart updates.
- Export control still present for anonymous users.

### Task 3: Admin happy path (playwright-cli)

- [ ] **Step 1: Login as groceries admin.**

```bash
playwright-cli open "http://localhost:5173/full-groceries-app/"
playwright-cli snapshot
# Click Admin → login form
playwright-cli fill <emailRef> "$ADMIN_EMAIL"
playwright-cli fill <passwordRef> "$ADMIN_PASSWORD"
playwright-cli click <submitRef>
playwright-cli snapshot
# Expect admin products (or admin shell)
```

- [ ] **Step 2: Product CRUD smoke.**

```bash
# Create product with unique name e.g. E2E Jabón
# Snapshot list includes it
# Delete or leave for trip
```

- [ ] **Step 3: Priced shopping + complete.**

```bash
# Navigate Shopping
# Add from catalog or create draft from cart
# Set Precio Real on at least one line
# Save draft → Complete mandado
# Navigate History → open trip → see real price
```

- [ ] **Step 4: Logout and confirm guest mode.**

```bash
# Logout
# Confirm Admin CTA shows Login again
# Confirm Categories still use guest catalog
```

### Task 4: Commit docs

- [ ] **Step 1: Commit on feature branches in the main repo directories (no worktrees).**

API CORS example change → commit inside `repos/personal-api` on `feat/groceries-api`.

Runbook / E2E spec live in workspace `docs/plans/groceries-app-backend/` — commit from the parent `cv-workspace` repo when documenting:

```bash
cd /home/francisco/repos/cv-workspace
git add docs/plans/groceries-app-backend
git commit -m "$(cat <<'EOF'
docs: add groceries app backend integration specs

EOF
)"
```

(When implementing features, also commit the CORS change inside `repos/personal-api` on `feat/groceries-api`.)

## Verification checklist

- Guest anonymous happy path green.
- Admin login → CRUD → priced complete → history green.
- CORS does not block SPA origin.
- App base path `/full-groceries-app/` used in all playwright URLs.
