# Groceries Auth and API Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `full-groceries-app` a JWT session against `personal-api` and TanStack Query hooks that read categories/products from `/api/v1/groceries/*`.

**Architecture:** Mirror fitness / user-management patterns: `api/config`, `api/http`, `api/auth`, refresh-token-only `localStorage`, in-memory access token, `AuthProvider` with `authorizedRequest`. `/me` returns `permissions[]` (Application model on `main`). Derive `isGroceriesAdmin` from `groceries-app` + `ADMIN`. Add `@tanstack/react-query` and `react-router-dom` as dependencies (router wiring in spec 04). Read-only groceries client + query hooks only — mutations in spec 05.

**Tech Stack:** React 19, Vite, TypeScript, TanStack Query, Vitest, react-router-dom (dep only).

---

## Scope and dependencies

- **Depends on:** [02 — Groceries API module](02-groceries-categories-and-product-api.md).
- **Unblocks:** [04 — Router, login, and catalog UI](04-router-login-and-catalog-ui.md).
- **Does not include:** Login page UI, route guards, replacing JSON in pages, admin mutations, or Playwright browser E2E (Vitest only in this spec).

## Files

- Create: `repos/full-groceries-app/.env.example`
- Create: `repos/full-groceries-app/.env` (local only; do not commit)
- Create: `repos/full-groceries-app/src/vite-env.d.ts` — `VITE_API_BASE_URL`
- Create: `repos/full-groceries-app/src/api/config.ts`
- Create: `repos/full-groceries-app/src/api/types.ts`
- Create: `repos/full-groceries-app/src/api/http.ts`
- Create: `repos/full-groceries-app/src/api/auth.ts`
- Create: `repos/full-groceries-app/src/api/groceries.ts`
- Create: `repos/full-groceries-app/src/api/query-keys.ts`
- Create: `repos/full-groceries-app/src/api/groceries-session.ts`
- Create: `repos/full-groceries-app/src/auth/session-storage.ts`
- Create: `repos/full-groceries-app/src/auth/AuthProvider.tsx`
- Create: `repos/full-groceries-app/src/auth/useAuth.ts`
- Create: `repos/full-groceries-app/src/hooks/useCategoriesQuery.ts`
- Create: `repos/full-groceries-app/src/hooks/useProductsQuery.ts`
- Create: `repos/full-groceries-app/src/test/setup.ts`
- Create: `repos/full-groceries-app/src/api/http.test.ts`
- Modify: `repos/full-groceries-app/package.json` — deps + `test` script
- Modify: `repos/full-groceries-app/vite.config.ts` — vitest block
- Modify: `repos/full-groceries-app/src/types.ts` — UUID product / category shapes

## Env contract

```bash
# .env.example
VITE_API_BASE_URL=http://localhost:3000
```

`getApiBaseUrl()` must require the env var; accept absolute `http`/`https`; strip trailing slash.

## Auth types (Application permissions)

```ts
// src/api/types.ts
export const GROCERIES_APP_SLUG = 'groceries-app' as const

export type PermissionRole = 'READ_ONLY' | 'ADMIN'

export type AppPermission = {
  applicationId: string
  applicationSlug: string
  role: PermissionRole
}

export type AuthUser = {
  id: string
  email: string
  name: string
  permissions: AppPermission[]
}

export type LoginRequest = { email: string; password: string }

export type LoginResponse = {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

export type RefreshRequest = { refreshToken: string }

export type RefreshResponse = {
  accessToken: string
  refreshToken: string
}

export type MeResponse = { user: AuthUser }

export type ApiErrorBody = {
  error: string
  message: string
  details?: unknown
}

export type GroceryCategory = {
  id: string
  name: string
  sortOrder: number
}

export type GroceryProduct = {
  id: string
  name: string
  image: string
  categoryId: string
  category: GroceryCategory
  price: number
  createdAt: string
  updatedAt: string
}
```

Helper:

```ts
export function hasGroceriesRole(
  user: AuthUser | null,
  minimum: PermissionRole
): boolean {
  if (!user) return false
  const rank = { READ_ONLY: 1, ADMIN: 2 } as const
  const membership = user.permissions.find(
    (p) => p.applicationSlug === GROCERIES_APP_SLUG
  )
  if (!membership) return false
  return rank[membership.role] >= rank[minimum]
}
```

## Auth session contract

- Persist **only** `refreshToken` under key `mandado:auth:v1` (JSON `{ refreshToken }`).
- Keep `accessToken` in memory.
- Bootstrap: refresh → `GET /api/v1/auth/me`.
- `login` / `logout` / `authorizedRequest` with one refresh retry on 401 (same as fitness).

```ts
type AuthStatus = 'bootstrapping' | 'authenticated' | 'anonymous'

type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  accessToken: string | null
  isGroceriesAdmin: boolean // hasGroceriesRole(user, 'ADMIN')
  canBrowseGroceries: boolean // hasGroceriesRole(user, 'READ_ONLY')
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  authorizedRequest: <T>(
    path: string,
    options?: Omit<RequestOptions, 'accessToken'>
  ) => Promise<T>
}
```

## Groceries API client (read-only in this spec)

```ts
listCategories(request) → GET /api/v1/groceries/categories
listProducts(request, opts?: { categoryId?: string }) → GET /api/v1/groceries/products
getProduct(request, id) → GET /api/v1/groceries/products/:id
```

Session bridge `setGroceriesApiSession` / `requireGroceriesApiSession` (pattern from fitness).

## Query keys and hooks

```ts
export const groceryKeys = {
  all: ['groceries'] as const,
  categories: () => [...groceryKeys.all, 'categories'] as const,
  products: (categoryId?: string) =>
    [...groceryKeys.all, 'products', categoryId ?? 'all'] as const,
  product: (id: string) => [...groceryKeys.all, 'product', id] as const
}
```

`useCategoriesQuery` / `useProductsQuery({ categoryId? })` — enabled when `status === 'authenticated' && canBrowseGroceries`.

## Domain types prep

```ts
export type Product = {
  id: string
  name: string
  image: string
  categoryId: string
  price: number
}

export type Category = {
  id: string
  name: string
  sortOrder: number
}
```

`npm run build` / `tsc -b` must pass at end of this spec.

### Task 1: Dependencies + Vitest

```bash
cd repos/full-groceries-app
npm install react-router-dom @tanstack/react-query
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

Add `"test": "vitest run"`, `"test:watch": "vitest"`. Configure Vitest in `vite.config.ts`.

### Task 2: Config, HTTP, auth (TDD)

- [ ] **Step 1: Failing `src/api/http.test.ts`** — Content-Type, Bearer, `ApiError` mapping, network error.
- [ ] **Step 2: Implement `config`, `http`, `auth`, `types`.**
- [ ] **Step 3:** `npm test -- src/api/http.test.ts` → PASS.

### Task 3: Session + AuthProvider + groceries hooks

- [ ] **Step 1: `session-storage.ts` for `mandado:auth:v1`.**
- [ ] **Step 2: `AuthProvider` + `useAuth` with permissions helpers and session bridge.**
- [ ] **Step 3: `groceries.ts`, query keys, read hooks.**
- [ ] **Step 4: Wire `QueryClientProvider` + `AuthProvider` in `main.tsx`.**
- [ ] **Step 5:** `npm run lint && npx tsc -b --noEmit && npm test`.

### Task 4: Commit

```bash
git add .
git commit -m "$(cat <<'EOF'
feat: add personal-api auth client and groceries query hooks

EOF
)"
```

## Verification / E2E (this spec)

- [ ] Vitest `http.test.ts` passes.
- [ ] Browser E2E out of scope (specs 04 / 06).
- [ ] Optional curl login + `/me` shows `permissions` including `groceries-app` for a provisioned user.
