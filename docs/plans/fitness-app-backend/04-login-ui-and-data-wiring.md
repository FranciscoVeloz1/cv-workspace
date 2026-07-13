# Login UI and Data Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the fitness SPA online-only: users must log in before using the app shell; all feature hooks read/write through the API-backed repositories from spec 03.

**Architecture:** Add `/login` route, wrap the authenticated tree in `RequireAuth`, mount `AuthProvider` at the app root, and tune TanStack Query for network. Preserve existing feature UI, domain services, and Spanish copy. Match existing FitTrack visual language (tokens, layout) — no generic marketing redesign.

**Tech Stack:** React Router v7, React Hook Form + Zod, TanStack Query, existing shadcn/ui primitives.

---

## Scope and dependencies

- **Depends on:** [03 — Fitness auth and API client](03-fitness-auth-and-api-client.md).
- **Unblocks:** [05 — Local env and playwright E2E](05-local-env-and-playwright-e2e.md).
- **Does not include:** API schema/routes, playwright script authoring (spec 05), user-management UI changes (provisioning stays in UM app).

## Files

- Modify: `repos/fitness-nutrition-tracker/src/routes/paths.ts`
- Modify: `repos/fitness-nutrition-tracker/src/routes/router.tsx` (or equivalent router module)
- Create: `repos/fitness-nutrition-tracker/src/pages/login-page.tsx`
- Create: `repos/fitness-nutrition-tracker/src/auth/RequireAuth.tsx`
- Create: `repos/fitness-nutrition-tracker/src/features/auth/components/login-form.tsx`
- Modify: `repos/fitness-nutrition-tracker/src/providers/app-providers.tsx` (mount `AuthProvider`)
- Modify: `repos/fitness-nutrition-tracker/src/lib/query-client.ts` (network-friendly defaults)
- Modify: `repos/fitness-nutrition-tracker/src/components/layout/*` (logout control in settings or shell)
- Modify: hooks only if they assumed offline forever (`refetch` behavior) — prefer query-client defaults
- Optional: disable or gate backup import/export that writes only to local storage — either remove from settings or make “reset” call API clear; minimum: hide local-only backup actions that contradict API source of truth, or wire reset to API `clearAll` + default settings PUT

## Routes

```ts
export const ROUTES = {
  login: '/login',
  dashboard: '/',
  meals: '/meals',
  workout: '/workout',
  weight: '/weight',
  history: '/history',
  analytics: '/analytics',
  settings: '/settings',
} as const
```

Router structure:

```tsx
<AuthProvider>
  <Routes>
    <Route path={ROUTES.login} element={<LoginPage />} />
    <Route element={<RequireAuth />}>
      <Route element={<AppShell />}>
        {/* existing feature routes */}
      </Route>
    </Route>
  </Routes>
</AuthProvider>
```

### `RequireAuth`

- `status === 'bootstrapping'` → full-page loading state (existing spinner/skeleton).
- `status === 'anonymous'` → `<Navigate to={ROUTES.login} replace state={{ from }} />`.
- `status === 'authenticated'` → `<Outlet />`.

### Login page

- Intent: signed-in user reaches their cloud fitness data quickly; calm, dense form; Spanish labels consistent with the app.
- Fields: email, password; submit button; inline error from `ApiError.message`.
- On success: navigate to `state.from` or `ROUTES.dashboard`.
- If already authenticated: redirect to dashboard.
- States: default, submitting (disabled button), error, focus rings on inputs.

### Logout

- Add a logout action on the settings page (preferred) or shell menu.
- Calls `logout()` then navigates to `/login`.

### Query client

Update `src/lib/query-client.ts`:

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 30_000,
    },
  },
})
```

On logout, `queryClient.clear()` from AuthProvider or logout handler.

### Backup / local reset

- Settings backup export/import that only touches IndexedDB is misleading once API is source of truth.
- Minimum for this spec: hide or disable export/import/reset that only mutate local storage; keep a “Restablecer ajustes” that `PUT`s default settings via repository if product still needs reset.
- Document the choice in the commit body.

### Task 1: Paths + AuthProvider mount + RequireAuth

- [ ] **Step 1: Add `ROUTES.login` and `RequireAuth`.**

- [ ] **Step 2: Wrap providers** so `AuthProvider` wraps the router (or sits inside router with access to navigate — prefer outside router like UM app if that pattern exists; otherwise wrap in `app-providers.tsx`).

- [ ] **Step 3: Manually verify** unauthenticated visit to `/` redirects to `/login`.

### Task 2: Login form + page

- [ ] **Step 1: Build `login-form.tsx` with Zod:**

```ts
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
```

- [ ] **Step 2: Wire `login-page.tsx`** to `useAuth().login`, show API errors, handle redirect.

- [ ] **Step 3: Verify** wrong password shows error; correct password (user created via UM) enters dashboard and loads API default settings.

### Task 3: Logout + query invalidation + backup gating

- [ ] **Step 1: Add logout control.**

- [ ] **Step 2: Clear React Query cache on logout.**

- [ ] **Step 3: Gate or rewire backup controls** as specified above.

### Task 4: End-to-end manual check of feature writes

- [ ] **Step 1: With API + Vite running**, log meal / workout / weight for today; reload; confirm data returns from API.

- [ ] **Step 2: Change a meal template in settings; reload; confirm persistence.**

- [ ] **Step 3: Commit on `feat/personal-api-integration`.**

```bash
git add src/routes src/pages/login-page.tsx src/auth src/features/auth \
  src/providers src/lib/query-client.ts src/pages/settings-page.tsx \
  src/components/layout
git commit -m "$(cat <<'EOF'
feat: require login and wire fitness UI to personal-api

EOF
)"
```

## Verification

- Anonymous users never see the app shell.
- Authenticated users use API data only (empty history for new accounts).
- Logout returns to login and blocks shell routes.
- Existing feature pages still work for meals, workout, weight, settings.
