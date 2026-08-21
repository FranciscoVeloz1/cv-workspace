# Frontend — Scaffold, auth, and shell

**Tipo:** UX/UI + Integration foundation  
**Depende de:** [`01-functional-domain-and-ownership.md`](01-functional-domain-and-ownership.md), [`06-backend-kanban-module.md`](06-backend-kanban-module.md), [`repos/finance-app/src/api/http.ts`](../../../repos/finance-app/src/api/http.ts) (pattern reference)  
**Implementa:** Complete Vite React app structure in `repos/kanban-dashboard`: JWT session, login, route guard, AppShell, BoardPage placeholder (three empty columns OK), design tokens, Vitest harness.  
**No incluye:** Full board DnD wiring (08), task/tag modals (09), Playwright E2E (10), finance domain code.

## Resultado

An authenticated SPA on a separate host talks to `personal-api` with the same JWT lifecycle as finance (access in memory, refresh in `sessionStorage` under `kanban:refresh:v1`). Unauthenticated users hit `/login`; authenticated users see a calm shell and a board placeholder. Lint, typecheck, and unit tests pass.

**Note:** The submodule may already contain a Vite starter with React Query and a Hello World route. Extend it to match this file map; do not leave the Hello World route as the product.

## Requirements

### Intent (interface-design)

- **Who:** One person at a desk managing personal tasks.
- **Verb:** See and move work across three columns.
- **Feel:** Calm index-card board on warm paper surfaces; one accent for primary actions and active drop target later — not a dense SaaS admin chrome.

### Auth

1. Login form: email + password → `POST /api/v1/auth/login`.
2. Access token in memory only; refresh token in `sessionStorage` key `kanban:refresh:v1`.
3. `GET /api/v1/auth/me` on bootstrap when refresh exists.
4. On 401 from API: single refresh retry, then session expired → login.
5. Logout clears tokens and returns to `/login`.
6. `RequireAuth` wraps protected routes.

### Routes

| Path | Access | Screen |
|------|--------|--------|
| `/login` | Public | LoginPage |
| `/` | Auth required | BoardPage (placeholder columns OK) |

### Visual tokens (roles)

| Token | Intent |
|-------|--------|
| `surface-base` | Page background (warm paper) |
| `surface-raised` | Cards, shell header |
| `surface-column` | Column well |
| `border-subtle` | Column/card edges |
| `text-primary` / `text-secondary` / `text-muted` | Hierarchy |
| `accent-primary` | Primary button, focus, later drop highlight |
| `focus-ring` | Keyboard focus |
| `semantic-danger` | Delete / destructive |

CSS variables in `src/index.css` (or a tokens module). No raw `gray-200` / hex scatter in components when a token exists.

## Architecture

```text
main.tsx → App.tsx
  QueryClientProvider
  BrowserRouter
  AuthProvider
    Routes: /login | RequireAuth → AppShell → BoardPage
```

Copy finance patterns for `http.ts` / `auth.ts` / session storage; point wrappers at `/api/v1/kanban` for later specs.

Persona: **frontend-developer** — folder structure, loading/empty/error readiness, braces, change-impact.

## Code to do

### Target tree

```text
repos/kanban-dashboard/
  .env.example
  package.json          # add zod, vitest, testing-library, playwright deps as needed
  vite.config.ts        # vitest config; base '/' unless deploy needs otherwise
  src/
    main.tsx
    App.tsx
    index.css
    vite-env.d.ts
    api/
      config.ts
      types.ts
      http.ts
      auth.ts
      kanban.ts         # stubs OK: listTasks/listTags throw or return empty until 08
      query-client.ts
    auth/
      session-storage.ts
      AuthProvider.tsx
      RequireAuth.tsx
    pages/
      LoginPage/index.tsx
      LoginPage/LoginPage.module.css
      BoardPage/index.tsx
      BoardPage/BoardPage.module.css
    components/
      layout/AppShell/index.tsx
      layout/AppShell/AppShell.module.css
    types/
      kanban.ts
    test/
      setup.ts
      api/http.test.ts
```

### Env

`.env.example`:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

Document SPA origin for CORS: `http://localhost:5173` (or whatever Vite prints). Add that origin to `repos/personal-api/.env` `CORS_ORIGINS` (finalize in runbook/spec 10).

### Session storage

```ts
const STORAGE_KEY = 'kanban:refresh:v1';
```

### App wiring (sketch)

```tsx
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route path="/" element={<BoardPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

### BoardPage placeholder

Render three column headings: Pending, In progress, Finished. Empty state copy is fine. No DnD required yet.

### Tasks

- [ ] **Step 1:** Align `package.json` scripts: `dev`, `build`, `lint`, `typecheck`, `test` (vitest). Add dependencies: `zod`, vitest, jsdom, Testing Library.
- [ ] **Step 2:** Implement auth + http + session mirroring finance; write `src/test/api/http.test.ts` for 401→refresh-once.
- [ ] **Step 3:** LoginPage, RequireAuth, AppShell (title “Kanban”, logout), BoardPage placeholder + tokens.
- [ ] **Step 4:** Verify:

```bash
cd repos/kanban-dashboard
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all PASS / exit 0.

## Testing

| Check | Expected |
|-------|----------|
| Unit: http refresh-once | Pass |
| Visit `/` logged out | Redirect `/login` |
| Login with provisioned user | Land on `/` with three column headings |
| Logout | Back to `/login` |

Manual login verification is enough for this spec; full Playwright in 10.

## Acceptance

- [ ] File map matches folder rule (`components/Name/index.tsx`, `pages/…`).
- [ ] JWT session key `kanban:refresh:v1`.
- [ ] Protected board; public login.
- [ ] Visual tokens defined; calm desk intent stated in CSS/comments or README of app.
- [ ] Lint / typecheck / test / build green.

## Playwright scenarios unlocked

- Unauthenticated `/` → `/login`.
- Login with fixture user (provisioning in 10).

## Impact

Using `localStorage` for access tokens would violate the finance auth pattern and increase XSS risk — keep access in memory. Wrong `VITE_API_BASE_URL` (including `/api/v1`) breaks all calls — origin only.
