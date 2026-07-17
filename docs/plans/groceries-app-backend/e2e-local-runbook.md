# Mandado (full-groceries-app) ↔ personal-api local E2E runbook

## Prerequisites

1. Branch `feat/groceries-api` built **from scratch** on `main` (Category FK tables; no Int `category` column)
2. API on `http://localhost:3000` with `CORS_ORIGINS` including `http://localhost:5173`
3. SPA Vite on `http://localhost:5173` with `VITE_API_BASE_URL=http://localhost:3000`
4. `npm run db:seed-admin` (Application `groceries-app` exists)
5. `npm run db:seed-groceries`
6. Users with `groceries-app` membership:
   - `groceries.user@example.com` / `password123` (READ_ONLY)
   - `groceries.admin@example.com` / `password123` (ADMIN)

## Start services (worktrees)

```bash
# Terminal A — API worktree
cd repos/personal-api/.worktrees/feat-groceries-api
node scripts/start-embedded-db.mjs --migrate --detach   # if Postgres not already up
npm run db:seed-admin
npm run db:seed-groceries
npm run dev

# Terminal B — SPA worktree
cd repos/full-groceries-app/.worktrees/feat-personal-api-integration
cp -n .env.example .env
npm run dev
```

App base path: `/full-groceries-app/` → `http://localhost:5173/full-groceries-app/`.

## Provision users

```bash
# Source ADMIN_EMAIL / ADMIN_PASSWORD from personal-api .env
ACCESS=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["accessToken"])')

curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"groceries.user@example.com",
    "name":"Groceries User",
    "password":"password123",
    "permissions":[{"applicationSlug":"groceries-app","role":"READ_ONLY"}]
  }'

curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"groceries.admin@example.com",
    "name":"Groceries Admin",
    "password":"password123",
    "permissions":[{"applicationSlug":"groceries-app","role":"ADMIN"}]
  }'
```

Ignore conflict if users already exist.

## Sanity curl

```bash
USER_ACCESS=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"groceries.user@example.com","password":"password123"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["accessToken"])')

curl -s http://localhost:3000/api/v1/groceries/categories \
  -H "Authorization: Bearer $USER_ACCESS" | python3 -m json.tool

curl -s "http://localhost:3000/api/v1/groceries/products" \
  -H "Authorization: Bearer $USER_ACCESS" | python3 -c \
  'import sys,json; p=json.load(sys.stdin)["products"][0]; assert "categoryId" in p and isinstance(p["category"], dict)'
```

Expect five categories and products with `categoryId` + nested `category` (never Int `category`).

## Playwright-cli happy path

Verified locally with `playwright-cli` against the worktrees above. Prefer **role / accessible name** selectors (stable across runs).

```bash
playwright-cli open "http://localhost:5173/full-groceries-app/"
# Redirects to /login

playwright-cli fill "Correo" "groceries.user@example.com"   # or textbox ref from snapshot
playwright-cli fill "Contraseña" "password123"
playwright-cli click "Iniciar sesión"
# Expect categories: Limpieza personal, Limpieza global, Mascotas, Comida, Extras

playwright-cli click "🍎 Comida"
# URL includes category UUID …1114; products like Aceite, Agua, …

playwright-cli click "Add Aceite to cart"
playwright-cli click "Open cart"
# Expect Carrito with Aceite line; local only (no trips API)

# --- ADMIN icon CRUD ---
playwright-cli open "http://localhost:5173/full-groceries-app/login"
playwright-cli fill "Correo" "groceries.admin@example.com"
playwright-cli fill "Contraseña" "password123"
playwright-cli click "Iniciar sesión"
playwright-cli click "Administrar productos"   # aria-label / link name
playwright-cli click "Agregar producto"        # Plus icon
# Dialog "Nuevo producto"
playwright-cli fill "Nombre" "E2E Detergente"
playwright-cli fill "Precio" "45"
playwright-cli select "Categoría" "Limpieza global"
playwright-cli click "Guardar producto"
# Row "E2E Detergente" appears in admin list

# --- READ_ONLY forbidden ---
playwright-cli open "http://localhost:5173/full-groceries-app/login"
playwright-cli fill "Correo" "groceries.user@example.com"
playwright-cli fill "Contraseña" "password123"
playwright-cli click "Iniciar sesión"
playwright-cli goto "http://localhost:5173/full-groceries-app/admin/products"
# Expect /forbidden (Acceso restringido); no Administrar productos link when browsing as READ_ONLY
```

## Pass criteria

- Catalog comes from API with `categoryId` FK (not bundled JSON).
- Cart remains local.
- groceries-app ADMIN can CRUD via icon actions (`aria-label`s); READ_ONLY cannot open admin.
- No Int `category` in API responses.

## Backend regression

```bash
cd repos/personal-api/.worktrees/feat-groceries-api
npm run test:integration -- tests/integration/groceries-schema.test.ts tests/integration/groceries.test.ts
```

## SPA regression

```bash
cd repos/full-groceries-app/.worktrees/feat-personal-api-integration
npm test
npm run build
```
