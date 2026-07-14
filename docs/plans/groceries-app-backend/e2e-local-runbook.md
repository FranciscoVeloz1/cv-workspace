# Groceries ↔ personal-api local E2E runbook

## Prerequisites

1. Postgres with migrations from `feat/groceries-api` applied
2. API on `http://localhost:3000` with `CORS_ORIGINS` including `http://localhost:5173`
3. Groceries Vite on `http://localhost:5173` with `VITE_API_BASE_URL=http://localhost:3000`
4. Seeded bootstrap admin with **both** `user-management-app` and `groceries-app` `ADMIN`
5. `npm run db:seed-groceries` completed at least once

## Start services

Work in the main repo directories on the feature branches (`feat/groceries-api`, `feat/groceries-rework`) — not worktrees.

```bash
# Terminal A — API (repos/personal-api on feat/groceries-api)
cd repos/personal-api
# if using docker:
# docker compose up -d
npx prisma migrate deploy
npm run db:seed-admin
npm run db:seed-groceries
npm run dev

# Terminal B — Groceries SPA (repos/groceries-app on feat/groceries-rework)
cd repos/groceries-app
cp -n .env.example .env
npm run dev
```

## SPA routes (after groceries-app-rework)

Navigation is URL-based (`react-router`). App base path remains `/groceries-app/`.

| Path | Access |
|------|--------|
| `/` | Public — categories |
| `/products/:categoryId` | Public — product list |
| `/cart` | Public — cart (state survives navigation via `CartProvider`) |
| `/login` | Public — admin login |
| `/admin` | Redirects to `/admin/products` |
| `/admin/products` | Admin only — product CRUD |
| `/admin/shopping` | Admin only — priced shopping draft |
| `/admin/history` | Admin only — completed trips list |
| `/admin/history/:tripId` | Admin only — deep link to a trip detail |
| `/forbidden` | Authenticated non-admin |

Unauthenticated visits to `/admin/*` redirect to `/login`. Authenticated users without `groceries-app` ADMIN redirect to `/forbidden`.

## Credentials

Use the same values as `ADMIN_EMAIL` / `ADMIN_PASSWORD` from personal-api `.env`.

Example locals:

- email: `admin@example.com`
- password: `password123`

## Playwright-cli

Install/check:

```bash
npx --no-install playwright-cli --version || npm install -g @playwright/cli@latest
```

App base path is `/groceries-app/`. Re-snapshot after each navigation and substitute refs from `snapshot` output.

### A) Guest regression (no login)

```bash
playwright-cli open "http://localhost:5173/groceries-app/"
playwright-cli snapshot
# Expect categories — no forced login

# Open a category (use ref from snapshot)
playwright-cli click <categoryRef>
playwright-cli snapshot

# Add a product to cart
playwright-cli click <addToCartRef>
playwright-cli snapshot

# Open cart
playwright-cli click <cartBadgeRef>
playwright-cli snapshot
# Expect Export Excel / Export JSON controls present

playwright-cli click <exportExcelRef>
# Expect download or success without auth errors
```

### B) Admin happy path

```bash
playwright-cli open "http://localhost:5173/groceries-app/"
playwright-cli snapshot

# Open Admin / Login (or navigate directly)
playwright-cli open "http://localhost:5173/groceries-app/login"
# OR: playwright-cli click <adminEntryRef>
playwright-cli snapshot

playwright-cli fill <emailRef> "admin@example.com"
playwright-cli fill <passwordRef> "password123"
playwright-cli click <submitRef>
playwright-cli snapshot
# Expect redirect to /admin/products

# --- Products ---
# Create a product named "E2E Test Item" (category + price)
playwright-cli snapshot
# Confirm it appears in the list

# --- Shopping ---
# NavLink "Compra" → /admin/shopping
playwright-cli click <adminShoppingNavRef>
playwright-cli snapshot
# Add from catalog OR start from cart
# Fill Precio Real on one line
playwright-cli fill <realPriceRef> "42.5"
playwright-cli click <saveDraftRef>
playwright-cli snapshot
playwright-cli click <completeTripRef>
playwright-cli snapshot
# Confirm dialog if present, accept — expect navigate to /admin/history/:tripId

# --- History ---
# NavLink "Historial" → /admin/history (or land on deep link after complete)
playwright-cli click <adminHistoryNavRef>
playwright-cli snapshot
# Open the completed trip
playwright-cli click <tripRowRef>
playwright-cli snapshot
# Expect read-only Precio Real 42.5

# --- Protected redirects ---
# Logged out: open /admin/products → expect /login
# Non-admin: open /admin/products → expect /forbidden

# --- Logout ---
playwright-cli click <logoutRef>
playwright-cli snapshot
# Expect guest categories at /
```

## API smoke (optional)

```bash
ACCESS=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["accessToken"])')

curl -s http://localhost:3000/api/v1/groceries/products \
  -H "Authorization: Bearer $ACCESS" | python3 -m json.tool | head
```

Expect `200` and a `products` array.

Unauthenticated:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/v1/groceries/products
```

Expect `401`.

## Failure triage

| Symptom | Check |
|---------|-------|
| SPA CORS errors | `CORS_ORIGINS` includes exact Vite origin |
| Login succeeds but no admin UI | `groceries-app` ADMIN membership missing — re-run `db:seed-admin` after spec 01 changes |
| Empty admin catalog | Run `db:seed-groceries` |
| Playwright 404 on `/` | Use `/groceries-app/` base path |
| Guest export broken | Spec 04/05 regressions — CartPage guest controls must remain |
