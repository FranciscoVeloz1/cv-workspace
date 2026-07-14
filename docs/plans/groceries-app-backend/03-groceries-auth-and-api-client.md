# Groceries Auth and API Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `full-groceries-app` an optional JWT session against `personal-api` and typed groceries API helpers, exposing an `isGroceriesAdmin` capability from `/auth/me` without changing guest browse/cart/export behavior.

**Architecture:** Port the proven patterns from `repos/user-management-app` (`api/config`, `api/http`, `api/auth`, refresh-token-only localStorage, in-memory access token, `AuthProvider` with `authorizedRequest`). Guest users remain anonymous. When authenticated with `full-groceries-app` + `ADMIN`, set `isGroceriesAdmin: true` and bind groceries API session helpers. Specs 04–05 wire UI; this spec stops at client foundation.

**Tech Stack:** React 19, Vite, TypeScript. Add Vitest only if needed for `http.test.ts`; otherwise defer coverage to playwright in spec 06.

---

## Scope and dependencies

- **Depends on:** [02 — Groceries API module](02-groceries-api-module.md) contract available (API running locally or mocked).
- **Unblocks:** [04 — Admin gate and product CRUD UI](04-admin-gate-and-product-crud-ui.md).
- **Does not include:** Login page UI, product admin screens, priced shopping UI, or playwright E2E.

## Files

- Create: `repos/full-groceries-app/.env.example`
- Create: `repos/full-groceries-app/.env` (local only; do not commit)
- Modify: `repos/full-groceries-app/src/vite-env.d.ts` (add `VITE_API_BASE_URL` if file missing, create it)
- Create: `repos/full-groceries-app/src/api/config.ts`
- Create: `repos/full-groceries-app/src/api/types.ts`
- Create: `repos/full-groceries-app/src/api/http.ts`
- Create: `repos/full-groceries-app/src/api/auth.ts`
- Create: `repos/full-groceries-app/src/api/groceries.ts`
- Create: `repos/full-groceries-app/src/auth/session-storage.ts`
- Create: `repos/full-groceries-app/src/auth/AuthProvider.tsx`
- Create: `repos/full-groceries-app/src/auth/groceries-api-session.ts`
- Modify: `repos/full-groceries-app/src/main.tsx` (wrap tree in `AuthProvider` only — no route guards yet)
- Optional test: `repos/full-groceries-app/src/api/http.test.ts` (+ vitest config if added)

## Env contract

`.env.example`:

```bash
# Absolute API origin (no trailing slash). Auth/groceries clients prefix /api/v1.
VITE_API_BASE_URL=http://localhost:3000
```

`getApiBaseUrl()`:

- Require `import.meta.env.VITE_API_BASE_URL`
- Accept absolute `http`/`https` only
- Strip trailing slash
- Throw a clear Error if missing/invalid (same behavior as user-management-app)

## Auth session contract

- Persist **only** `refreshToken` under key `full-groceries:auth:v1` (JSON `{ refreshToken }`).
- Keep `accessToken` in React state / memory.
- On bootstrap: if refresh token exists → `POST /api/v1/auth/refresh` → `GET /api/v1/auth/me` → derive capabilities.
- `login(email, password)` → `POST /api/v1/auth/login` → persist refresh → set user + access → fetch `/me` if login payload lacks permissions → derive capabilities.
- `logout()` → `POST /api/v1/auth/logout` with refresh (ignore network errors after clear) → clear session + groceries API session.
- `authorizedRequest(path, options)` attaches Bearer; on `401` attempts one refresh then retries; on refresh failure clears session.

### Capability derivation

```ts
const GROCERIES_APP_SLUG = 'full-groceries-app'

function deriveIsGroceriesAdmin(
  permissions: Array<{ applicationSlug: string; role: 'READ_ONLY' | 'ADMIN' }>
): boolean {
  return permissions.some(
    (p) => p.applicationSlug === GROCERIES_APP_SLUG && p.role === 'ADMIN'
  )
}
```

`AuthContextValue`:

```ts
type AuthStatus = 'bootstrapping' | 'authenticated' | 'anonymous'

type AuthUser = {
  id: string
  email: string
  name: string
  permissions: Array<{ applicationSlug: string; role: 'READ_ONLY' | 'ADMIN' }>
}

type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  accessToken: string | null
  isGroceriesAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  authorizedRequest: <T>(
    path: string,
    options?: Omit<RequestOptions, 'accessToken'>
  ) => Promise<T>
}
```

Rules:

- `isGroceriesAdmin` is `false` when `status !== 'authenticated'`.
- Authenticated users **without** groceries ADMIN still get `status: 'authenticated'` and `isGroceriesAdmin: false` (guest feature set; optional “no access” message only in admin screens in spec 04).

## Groceries API session bridge

```ts
// src/auth/groceries-api-session.ts
type GroceriesApiSession = {
  userId: string
  request: AuthContextValue['authorizedRequest']
}

let session: GroceriesApiSession | null = null

export function setGroceriesApiSession(next: GroceriesApiSession | null): void {
  session = next
}

export function requireGroceriesApiSession(): GroceriesApiSession {
  if (!session) {
    throw new Error('Groceries API session is not available')
  }
  return session
}
```

`AuthProvider` calls `setGroceriesApiSession({ userId, request })` only when `isGroceriesAdmin`; otherwise `null`.

## Groceries API client

`src/api/groceries.ts` — paths relative to `getApiBaseUrl()`, always via `requireGroceriesApiSession().request`:

```ts
listProducts(category?: number) → GET /api/v1/groceries/products?category=
createProduct(body) → POST /api/v1/groceries/products
getProduct(id) → GET /api/v1/groceries/products/:id
updateProduct(id, body) → PATCH /api/v1/groceries/products/:id
deleteProduct(id) → DELETE /api/v1/groceries/products/:id

listTrips(status?: 'DRAFT' | 'COMPLETED') → GET /api/v1/groceries/trips?status=
createTrip(body) → POST /api/v1/groceries/trips
getTrip(id) → GET /api/v1/groceries/trips/:id
patchTrip(id, body) → PATCH /api/v1/groceries/trips/:id
replaceTripItems(id, body) → PUT /api/v1/groceries/trips/:id/items
completeTrip(id) → POST /api/v1/groceries/trips/:id/complete
deleteTrip(id) → DELETE /api/v1/groceries/trips/:id
```

Shared client types (mirror API DTOs from spec 02):

```ts
export type ApiProduct = {
  id: string
  name: string
  image: string
  category: number
  price: number
  createdAt: string
  updatedAt: string
}

export type ApiTripItem = {
  id: string
  productId: string | null
  name: string
  category: number
  quantity: number
  listPrice: number
  realPrice: number | null
  sortOrder: number
}

export type ApiTrip = {
  id: string
  status: 'DRAFT' | 'COMPLETED'
  notes: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  items: ApiTripItem[]
}
```

Do **not** change guest `Product` type (`id: number`) in `src/types.ts` in this spec.

### Task 1: Config + HTTP + auth API

- [ ] **Step 1: Add `.env.example` and `vite-env.d.ts`.**

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 2: Port `config.ts`, `http.ts`, `auth.ts`, `types.ts` from user-management-app.** Keep braces / explicit returns per workspace rules. Map API errors to a small `ApiError` class with `status` + `message` + optional `code`.

- [ ] **Step 3 (optional): Add Vitest + `http.test.ts`.** If skipped, document in commit body that playwright covers auth errors in spec 06.

### Task 2: Session storage + AuthProvider

- [ ] **Step 1: Implement `session-storage.ts`.**

```ts
const KEY = 'full-groceries:auth:v1'

export function readRefreshToken(): string | null { /* ... */ }
export function writeRefreshToken(token: string): void { /* ... */ }
export function clearRefreshToken(): void { /* ... */ }
```

- [ ] **Step 2: Implement `AuthProvider`** with bootstrap / login / logout / `authorizedRequest` / `isGroceriesAdmin` / `setGroceriesApiSession`.

- [ ] **Step 3: Wrap app in `main.tsx`.**

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
)
```

Guest UI must behave identically while `status` is `anonymous` or `bootstrapping` completes to anonymous (no blocking spinner on the whole app for guests — if bootstrap is slow, keep rendering guest shell; only show a brief opaque bootstrap if you already have a flash. Prefer: render guest UI during bootstrap; admin chrome appears after capabilities resolve).

### Task 3: groceries.ts client

- [ ] **Step 1: Implement wrappers** using `requireGroceriesApiSession().request`.

- [ ] **Step 2: Smoke manually** with API up + seeded admin:

```bash
# In browser console after temporary login helper, or via a tiny stub in README —
# preferred: wait for LoginPage in spec 04; for this task, add a temporary
# window.__loginForDev only in DEV if needed, remove before merge of spec 04.
```

Minimum automated check without UI: unit-test that `listProducts` builds path `/api/v1/groceries/products` when session is injected (optional). Otherwise verify types compile:

```bash
cd repos/full-groceries-app
npm run build
```

Expected: PASS (guest app still builds; AuthProvider does not require API at build time).

### Task 4: Commit

- [ ] **Step 1: Commit on `feat/groceries-admin`.**

```bash
git add .env.example src/api src/auth src/main.tsx src/vite-env.d.ts
git commit -m "$(cat <<'EOF'
feat: add personal-api auth client and groceries API wrappers

EOF
)"
```

Do not commit `.env`.

## Verification

- Anonymous load still shows categories/cart/export without calling the API.
- Login with groceries ADMIN sets `isGroceriesAdmin` true and enables groceries wrappers.
- Login without groceries ADMIN sets `isGroceriesAdmin` false; calling `listProducts` throws “session is not available”.
- Refresh survives reload for admins (refresh token stored).
