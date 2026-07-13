# Fitness Auth and API Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `fitness-nutrition-tracker` a JWT session against `personal-api` and replace local storage repositories with HTTP repositories that call `/api/v1/users/:userId/fitness`.

**Architecture:** Mirror the proven patterns in `repos/user-management-app` (`api/config`, `api/http`, `api/auth`, refresh-token-only `localStorage`, in-memory access token, `AuthProvider` with `authorizedRequest`). Keep existing domain types and TanStack Query keys; swap repository implementations so hooks keep calling `settingsRepository` / `dailyRecordsRepository` (or thin API facades with the same method names).

**Tech Stack:** React 19, Vite, TypeScript, TanStack Query, Vitest (if present) / component tests as available.

---

## Scope and dependencies

- **Depends on:** [02 — Fitness API module](02-fitness-api-module.md) contract available (API running locally or mocked in unit tests).
- **Unblocks:** [04 — Login UI and data wiring](04-login-ui-and-data-wiring.md).
- **Does not include:** Login page UI, route guards, or playwright E2E (specs 04–05).

## Files

- Create: `repos/fitness-nutrition-tracker/.env.example`
- Create: `repos/fitness-nutrition-tracker/.env` (local only; do not commit secrets)
- Modify: `repos/fitness-nutrition-tracker/src/vite-env.d.ts` (add `VITE_API_BASE_URL`)
- Create: `repos/fitness-nutrition-tracker/src/api/config.ts`
- Create: `repos/fitness-nutrition-tracker/src/api/types.ts`
- Create: `repos/fitness-nutrition-tracker/src/api/http.ts`
- Create: `repos/fitness-nutrition-tracker/src/api/auth.ts`
- Create: `repos/fitness-nutrition-tracker/src/api/fitness.ts`
- Create: `repos/fitness-nutrition-tracker/src/auth/session-storage.ts`
- Create: `repos/fitness-nutrition-tracker/src/auth/AuthProvider.tsx`
- Create: `repos/fitness-nutrition-tracker/src/auth/clear-local-fitness-data.ts`
- Modify: `repos/fitness-nutrition-tracker/src/storage/repositories/settings-repository.ts`
- Modify: `repos/fitness-nutrition-tracker/src/storage/repositories/daily-records-repository.ts`
- Test: `repos/fitness-nutrition-tracker/src/api/http.test.ts` (add Vitest if the app has no test runner yet — prefer Vite + vitest matching UM app; if adding Vitest is too heavy, cover via playwright in spec 05 and keep this module thin)

## Env contract

`.env.example`:

```bash
# Absolute API origin (no trailing slash). Paths are prefixed with /api/v1 in clients.
VITE_API_BASE_URL=http://localhost:3000
```

`getApiBaseUrl()` must match user-management-app behavior: require the env var; accept absolute `http`/`https`; strip trailing slash.

## Auth session contract

- Persist **only** `refreshToken` under key `fittrack:auth:v1` (JSON `{ refreshToken }`).
- Keep `accessToken` in React state / memory.
- On bootstrap: if refresh token exists → `POST /api/v1/auth/refresh` → `GET /api/v1/auth/me`.
- `login(email, password)` → `POST /api/v1/auth/login` → persist refresh → set user + access token → **clear local fitness domain data** (IndexedDB `fittrack-db` + `fittrack:` localStorage keys except auth + theme).
- `logout()` → `POST /api/v1/auth/logout` with refresh token (ignore network errors after clear) → clear session.
- `authorizedRequest(path, options)` attaches Bearer token; on `401` attempts one refresh then retries; on refresh failure clears session.

`AuthContextValue` (fitness-specific; no UM capability flags required):

```ts
type AuthStatus = 'bootstrapping' | 'authenticated' | 'anonymous'

type AuthContextValue = {
  status: AuthStatus
  user: { id: string; email: string; name: string } | null
  accessToken: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  authorizedRequest: <T>(path: string, options?: Omit<RequestOptions, 'accessToken'>) => Promise<T>
}
```

## Fitness API client

`src/api/fitness.ts` — all paths relative to `API_BASE_URL`:

```ts
getSettings(userId) → GET /api/v1/users/${userId}/fitness/settings
putSettings(userId, settings) → PUT .../settings
listDailyRecords(userId, from, to) → GET .../daily-records?from=&to=
getDailyRecord(userId, date) → GET .../daily-records/${date}
putDailyRecord(userId, date, body) → PUT .../daily-records/${date}
deleteDailyRecord(userId, date) → DELETE .../daily-records/${date}
```

Each function takes `authorizedRequest` (or access token) as injected dependency from AuthProvider callers / repository layer.

## Repository swap

Keep public method names used by hooks/services:

**SettingsRepository**

- `get()` → API getSettings for `user.id`; map `{ settings }` → `AppSettings`
- `save(settings)` / `update(patch)` / `reset()` → PUT via API
- Throw a typed error if called while anonymous (should not happen once guards exist)

**DailyRecordsRepository**

- `get(date)` → GET one; on `404` return `undefined`
- `save(record)` → PUT body without relying on client timestamps for authority (send meals/workout/weight/notes; use response as stored record)
- `delete(date)` → DELETE
- `listRange(start, end)` → GET range
- `listAll()` → `listRange('2000-01-01', '2100-12-31')` (or document a dedicated API later — YAGNI)
- `clearAll()` → list range then delete each (used by backup reset); or no-op + throw “use API” — prefer implement via list+delete for Settings backup reset compatibility

Repositories must obtain `userId` + `authorizedRequest` from a small module-level setter or React-free auth bridge set by `AuthProvider` on login (avoid importing React into repositories). Pattern:

```ts
// src/api/fitness-session.ts
let session: { userId: string; request: AuthContextValue['authorizedRequest'] } | null = null

export function setFitnessApiSession(next: typeof session) {
  session = next
}

export function requireFitnessApiSession() {
  if (!session) {
    throw new Error('Fitness API session is not available')
  }
  return session
}
```

`AuthProvider` calls `setFitnessApiSession` when authenticated and `null` when anonymous.

### Task 1: Config + HTTP + auth API (TDD if Vitest available)

- [ ] **Step 1: Add `.env.example` and `vite-env.d.ts` typing.**

- [ ] **Step 2: Port `config.ts` / `http.ts` / `auth.ts` / `types.ts` from user-management-app**, dropping UM-only types. Paths:

  - login: `POST /api/v1/auth/login`
  - refresh: `POST /api/v1/auth/refresh`
  - logout: `POST /api/v1/auth/logout`
  - me: `GET /api/v1/auth/me`

- [ ] **Step 3: Unit-test `http.ts` request header + error mapping** (copy/adapt UM `http.test.ts` if Vitest is added). If Vitest is not added in this spec, skip and rely on manual + playwright verification — note that choice in the commit message.

### Task 2: Session storage + AuthProvider

- [ ] **Step 1: Implement `session-storage.ts`** (`readRefreshToken` / `writeRefreshToken` / `clearRefreshToken`).

- [ ] **Step 2: Implement `clear-local-fitness-data.ts`.**

```ts
export async function clearLocalFitnessDomainData(): Promise<void> {
  // 1. indexedDB.deleteDatabase('fittrack-db')
  // 2. remove localStorage keys starting with 'fittrack:' except 'fittrack:auth:v1'
  // 3. do NOT remove 'fittrack-theme' (next-themes)
}
```

- [ ] **Step 3: Implement `AuthProvider`** with bootstrap, login (clear local data after successful login), logout, refresh-on-401, and `setFitnessApiSession`.

### Task 3: fitness.ts + repository implementations

- [ ] **Step 1: Implement `api/fitness.ts` wrappers.**

- [ ] **Step 2: Rewrite `SettingsRepository` and `DailyRecordsRepository` bodies to call the API via `requireFitnessApiSession()`.** Keep class exports and singleton instances so hooks do not change imports yet.

- [ ] **Step 3: Smoke-check with a temporary authenticated call** (or unit test with mocked `fetch`): get settings returns defaults from API for a fresh user.

### Task 4: Commit

- [ ] **Step 1: Commit on `feat/personal-api-integration`.**

```bash
git add .env.example src/api src/auth src/storage/repositories src/vite-env.d.ts
git commit -m "$(cat <<'EOF'
feat: add personal-api auth client and fitness repositories

EOF
)"
```

Do not commit `.env`.

## Verification

- Misconfigured `VITE_API_BASE_URL` fails at module load with a clear message.
- Refresh token survives reload; access token does not appear in `localStorage`.
- Login clears IndexedDB domain data.
- Repository methods hit `/users/:userId/fitness/...` with Bearer auth.
