# React Client Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the standalone `user-management-app` Vite SPA with validated runtime configuration, typed API communication, and resilient API-authenticated sessions.

**Architecture:** The SPA keeps short-lived access tokens in memory and persists only a versioned refresh token for session restoration. An `AuthProvider` refreshes on startup, loads `/auth/me`, and exposes derived capability flags. Route guards improve the user experience but all permission enforcement remains in `personal-api`.

**Tech Stack:** Vite, React, TypeScript, React Router, Vitest, React Testing Library, ESLint, Prettier.

---

## Scope and dependencies

- **Depends on:** [01 — Application permissions foundation](01-application-permissions-foundation.md) and [02 — User management API](02-user-management-api.md).
- **Unblocks:** [04 — Dashboard and integration](04-dashboard-and-integration.md).
- **Does not include:** user-management UI components or any user CRUD screen.

## Files

- Create: `repos/user-management-app/package.json`
- Create: `repos/user-management-app/vite.config.ts`
- Create: `repos/user-management-app/tsconfig.json`
- Create: `repos/user-management-app/tsconfig.app.json`
- Create: `repos/user-management-app/eslint.config.js`
- Create: `repos/user-management-app/.prettierrc.json`
- Create: `repos/user-management-app/.env.example`
- Create: `repos/user-management-app/src/main.tsx`
- Create: `repos/user-management-app/src/App.tsx`
- Create: `repos/user-management-app/src/api/{config,http,auth,users,types}.ts`
- Create: `repos/user-management-app/src/auth/{session-storage,AuthProvider,RequirePermission}.tsx`
- Create: `repos/user-management-app/src/test/setup.ts`
- Test: `repos/user-management-app/src/App.test.tsx`
- Test: `repos/user-management-app/src/api/http.test.ts`
- Test: `repos/user-management-app/src/auth/AuthProvider.test.tsx`

### Task 1: Scaffold a testable Vite project

- [x] **Step 1: Write a failing shell test.**

```tsx
render(<App />);
expect(
  screen.getByRole('heading', { name: /user management/i })
).toBeInTheDocument();
```

- [x] **Step 2: Create project configuration.**

Use the workspace's npm, Prettier, and strict TypeScript conventions. Adopt the newer `screen-recorder` pattern for Vitest + React Testing Library + ESLint 9 flat config, while using `portfolio` as the component/styles folder convention.

Provide scripts:

```json
{
  "dev": "vite",
  "typecheck": "tsc --noEmit",
  "build": "npm run typecheck && vite build",
  "lint": "eslint .",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [x] **Step 3: Add validated API configuration.**

Create `.env.example`:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

`api/config.ts` must normalize the URL and throw a descriptive error at startup if `VITE_API_BASE_URL` is absent or invalid.

- [x] **Step 4: Run foundation checks.**

```bash
npm install
npm run typecheck
npm test -- --run src/App.test.tsx
```

Expected: PASS.

### Task 2: Build the typed HTTP boundary

- [x] **Step 1: Write failing HTTP tests.**

Cover JSON success, non-JSON success, API errors in the existing `{ error, message, details }` shape, malformed responses, and network failures. The error type must expose a status code and a user-safe message without leaking raw unknown values.

- [x] **Step 2: Implement shared types and `request()`.**

Use explicit DTOs for `AuthUser`, `AppPermission`, login, refresh, and user routes. `request()` must:

- add JSON content headers only when a body exists;
- add the current bearer token only when supplied;
- safely parse JSON;
- map non-2xx responses to an `ApiError`; and
- narrow caught values before accessing `.message`.

Do not add a generic data-fetching library in this foundation.

- [x] **Step 3: Verify the API boundary.**

```bash
npm test -- --run src/api/http.test.ts
```

Expected: PASS.

### Task 3: Implement the authentication lifecycle and route guard

- [x] **Step 1: Write failing session tests.**

Test successful login; page reload with refresh token; refresh-token rotation; failed refresh; logout; and derived permission behavior for `ADMIN`, `READ_ONLY`, and no membership.

- [x] **Step 2: Add minimal session storage.**

Persist only the refresh token under a versioned key such as `user-management:session:v1`. Wrap browser storage access in `try/catch`; if unavailable, continue with an in-memory session and show no false logged-in state.

- [x] **Step 3: Implement `AuthProvider`.**

At startup, if a refresh token exists, call `POST /api/v1/auth/refresh`, retain the new access token in memory, persist the rotated refresh token, then call `GET /api/v1/auth/me`. On any refresh failure, clear session state. A request receiving `401` may retry exactly once after refresh; never create a refresh loop.

- [x] **Step 4: Implement `RequirePermission`.**

Use `user-management-app` membership from `/auth/me` to derive:

```ts
const canReadUsers = permission?.role === 'READ_ONLY' || permission?.role === 'ADMIN';
const canManageUsers = permission?.role === 'ADMIN';
```

Redirect anonymous visitors to `/login`; render a forbidden route state for authenticated users without access; do not attempt to guard API security in the browser.

- [x] **Step 5: Verify and commit.**

```bash
npm run lint
npm run typecheck
npm test -- --run src/api/http.test.ts src/auth/AuthProvider.test.tsx
git add .
git commit -m "feat(web): add authenticated client foundation"
```

## Review checklist

- Access tokens never enter localStorage/sessionStorage.
- Refresh rotation is preserved after login and startup restore.
- Every failure path clears stale session state and presents a recoverable UI route.
- The client neither trusts JWT role claims nor assumes UI guards authorize the API.
