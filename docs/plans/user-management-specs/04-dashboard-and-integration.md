# Dashboard and Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the accessible, permission-aware user-management dashboard, operational documentation, and end-to-end verification.

**Architecture:** Feature components compose the authenticated client foundation and the `/users` REST API. The dashboard renders capability-specific controls from the current membership: `READ_ONLY` can inspect users; `ADMIN` can create, update, assign the current application's role, and permanently delete users. Server authorization remains the source of truth for every mutation.

**Tech Stack:** React, React Router, CSS custom properties, Vitest/React Testing Library, Express E2E test suite.

---

## Scope and dependencies

- **Depends on:** [02 — User management API](02-user-management-api.md) and [03 — React client foundation](03-react-client-foundation.md).
- **Completes:** the first release.
- **Does not include:** app-registry administration, bulk operations, audit history, pagination, external identity providers, or multi-application UI controls.

## Files

- Create: `repos/user-management-app/src/components/layout/AppShell.tsx`
- Create: `repos/user-management-app/src/components/layout/AppShell.css`
- Create: `repos/user-management-app/src/features/auth/LoginPage.tsx`
- Create: `repos/user-management-app/src/features/users/UsersPage.tsx`
- Create: `repos/user-management-app/src/features/users/UserTable.tsx`
- Create: `repos/user-management-app/src/features/users/UserForm.tsx`
- Create: `repos/user-management-app/src/features/users/PermissionEditor.tsx`
- Create: `repos/user-management-app/src/features/users/DeleteUserDialog.tsx`
- Create: `repos/user-management-app/src/features/users/users.test.tsx`
- Create: `repos/user-management-app/src/styles/{tokens,global}.css`
- Create: `repos/user-management-app/README.md`
- Modify: `repos/personal-api/README.md`
- Modify: `repos/personal-api/.env.example`
- Modify: `repos/personal-api/tests/e2e/api.e2e.test.ts`

## UI intent

- **User:** an operations administrator who must quickly find a person and change access with confidence.
- **Task:** inspect and administer users and their `user-management-app` role.
- **Feel:** calm, precise, and auditable—not a generic card-heavy dashboard.
- **Focal element:** the users table, with its search and primary action immediately adjacent.
- **Direction:** a dense 4px-grid tool interface, quiet layered surfaces, a single restrained accent, explicit four-level text hierarchy, and status color used only to communicate permission level.

### Task 1: Establish the shell and login experience

- [x] **Step 1: Write failing route tests.**

Cover anonymous redirect to `/login`, valid login navigation to the users screen, invalid credential message, pending submit state, logout, and a forbidden state for an authenticated user without `user-management-app` membership.

- [x] **Step 2: Implement the visual token layer.**

Use CSS custom properties rather than scattered literal colors. Define semantic page, surface, border, text, accent, success, warning, and destructive tokens. Include a 4px spacing scale, small/medium/large radius scale, focus-ring token, and `prefers-reduced-motion` behavior.

- [x] **Step 3: Build login and application shell.**

The login form requires visible labels, email/password autocomplete attributes, inline error text connected through `aria-describedby`, a disabled pending submit button, and a user-safe error message. The shell includes a skip link, signed-in identity, role label, and logout button.

- [x] **Step 4: Verify the focused auth UI.**

```bash
npm test -- --run src/features/auth
```

Expected: PASS.

### Task 2: Implement user list and role-aware controls

- [x] **Step 1: Write failing users-screen tests.**

Cover loading, empty, error, populated, search-filtered, and unauthorized states. Assert that a `READ_ONLY` membership can view users but sees no create, edit, or delete controls; assert that an `ADMIN` membership sees those controls.

- [x] **Step 2: Build the users list.**

Fetch list data when the route enters, then revalidate after a successful mutation. Derive search filtering in render from the query—do not mirror filtered users in state. Include a table caption, sortable-looking headings only if sorting is actually implemented, and text labels for role status.

- [x] **Step 3: Validate visual/accessibility requirements.**

Use a responsive table wrapper for narrow viewports, maintain keyboard focus visibility, and use semantic buttons/links. Ensure action targets are at least 44px and no important state is conveyed by color alone.

### Task 3: Implement create, edit, membership, and deletion flows

- [x] **Step 1: Write failing mutation tests.**

Test:

- ADMIN creates a user with `READ_ONLY` access;
- ADMIN edits name/password and replaces role;
- client-side invalid fields block submission;
- API validation errors show field-level feedback;
- duplicate submit is disabled while pending;
- hard-delete requires confirmation;
- successful mutation refreshes table data; and
- API `403` changes the UI into a user-safe forbidden/error state.

- [x] **Step 2: Implement `UserForm` and `PermissionEditor`.**

Use one form for create/edit. It exposes the single registered app (`user-management-app`) and an accessible `READ_ONLY`/`ADMIN` control. New passwords are optional during edit and mandatory during create. Keep password values local to the form and clear them after successful submission.

- [x] **Step 3: Implement deletion confirmation.**

Use a native `<dialog>` or an installed accessible dialog primitive. The confirmation must name the target user, return focus to the initiating control after close, disable while pending, and render a server rejection message (for self/final-admin protection) without claiming success.

- [x] **Step 4: Verify the complete client.**

```bash
npm run lint
npm run typecheck
npm test -- --run src/features/users/users.test.tsx
npm run build
```

Expected: PASS.

### Task 4: Document operation and verify end-to-end behavior

- [x] **Step 1: Add API E2E coverage.**

Extend `personal-api`'s local E2E flow to seed an admin, authenticate, create a `READ_ONLY` user, verify read success/write denial, update role, delete the user, then verify the deleted user cannot call `/auth/me`.

- [x] **Step 2: Document operator setup.**

In both READMEs, include:

```bash
# API
npm run db:migrate
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret123 ADMIN_NAME='Initial Admin' npm run db:seed-admin

# Client
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:3000
npm install
npm run dev
```

Document the required client origin in `CORS_ORIGINS`, that public registration is intentionally disabled, and that the initial application list contains only `user-management-app`.

- [x] **Step 3: Run release verification.**

From `repos/personal-api`:

```bash
npm run lint
npm run build
npm test
npm run test:e2e:local
```

From `repos/user-management-app`:

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
```

Expected: every command exits successfully.

- [x] **Step 4: Perform manual browser validation.**

Verify admin and read-only login, no-membership forbidden screen, create/edit/delete, post-change refresh, logout, slow/error responses, mobile-width table behavior, and production CORS.

- [x] **Step 5: Commit.**

```bash
git add repos/personal-api repos/user-management-app
git commit -m "feat(web): deliver user management dashboard"
```

## Impact and review checklist

- Public registration is intentionally gone; integrations must call administrator-managed endpoints instead.
- Hard deletion permanently removes accounts, refresh tokens, and memberships.
- Existing access tokens may remain syntactically valid until expiry, but database-backed application authorization blocks protected calls immediately after membership removal/deletion.
- Confirm the API's production `CORS_ORIGINS` contains the deployed client origin before launch.
- Review desktop and mobile states for loading, empty, error, forbidden, focus, disabled, and pending mutations.
