# User Management API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add server-enforced, application-scoped user and permission CRUD endpoints to `personal-api`.

**Architecture:** A `requireAppRole()` middleware reads the authenticated user's current membership from PostgreSQL for every protected request. The users module follows the established API module sequence—schemas, repository, service, controller, routes—and sanitizes every response. `READ_ONLY` users can read; `ADMIN` users can mutate.

**Tech Stack:** Express, TypeScript, Prisma, Zod, bcryptjs, Vitest/Supertest.

---

## Scope and dependencies

- **Depends on:** [01 — Application permissions foundation](01-application-permissions-foundation.md).
- **Unblocks:** [03 — React client foundation](03-react-client-foundation.md) and [04 — Dashboard and integration](04-dashboard-and-integration.md).
- **Does not include:** React UI, pagination, audit logs, password-reset emails, or management of the application registry itself.

## Files

- Create: `repos/personal-api/src/core/middleware/require-app-role.ts`
- Modify: `repos/personal-api/src/core/errors/app-error.ts`
- Create: `repos/personal-api/src/modules/users/users.schemas.ts`
- Create: `repos/personal-api/src/modules/users/users.repository.ts`
- Create: `repos/personal-api/src/modules/users/users.service.ts`
- Create: `repos/personal-api/src/modules/users/users.controller.ts`
- Create: `repos/personal-api/src/modules/users/users.routes.ts`
- Modify: `repos/personal-api/src/routes/v1/index.ts`
- Test: `repos/personal-api/tests/unit/require-app-role.middleware.test.ts`
- Test: `repos/personal-api/tests/integration/users.test.ts`

## API contract

All routes are mounted beneath `/api/v1/users` and use the application slug `user-management-app`.

| Endpoint | Minimum role | Purpose |
|---|---:|---|
| `GET /` | `READ_ONLY` | List safe user DTOs |
| `GET /:id` | `READ_ONLY` | Read one safe user DTO |
| `POST /` | `ADMIN` | Create an account and memberships |
| `PATCH /:id` | `ADMIN` | Update name, optional password, and replacement memberships |
| `DELETE /:id` | `ADMIN` | Permanently delete an account |

Create/update permission input:

```ts
{
  applicationSlug: 'user-management-app',
  role: 'READ_ONLY' | 'ADMIN'
}
```

Safe user response:

```ts
{
  id: string,
  email: string,
  name: string,
  createdAt: string,
  updatedAt: string,
  permissions: Array<{
    applicationSlug: string,
    role: 'READ_ONLY' | 'ADMIN'
  }>
}
```

### Task 1: Create persisted authorization middleware

- [x] **Step 1: Write middleware unit tests first.**

Cover all outcomes:

- no `req.user` → `401 UNAUTHORIZED`;
- no matching `user-management-app` membership → `403 FORBIDDEN`;
- `READ_ONLY` → allowed to read, denied from admin writes;
- `ADMIN` → allowed to read and write; and
- changing/removing a membership in the database changes the next request's result without waiting for JWT expiry.

- [x] **Step 2: Run the unit test and confirm failure.**

```bash
npm run test:unit -- require-app-role.middleware.test.ts
```

Expected: failure because the middleware does not exist.

- [x] **Step 3: Implement `requireAppRole(applicationSlug, minimumRole)`.**

The middleware must:

1. require the existing identity-based `authenticate` middleware first;
2. query `UserAppPermission` joined to `Application` using the user id and literal slug;
3. compare roles with `ADMIN` satisfying both levels and `READ_ONLY` satisfying only reads;
4. call `next(new ForbiddenError(...))` for missing/insufficient access; and
5. avoid JWT role claims or mutable module-level request state.

- [x] **Step 4: Verify the authorization tests.**

```bash
npm run test:unit -- require-app-role.middleware.test.ts
```

Expected: PASS.

### Task 2: Define strict inputs and repository operations

- [x] **Step 1: Write failing integration tests for input validation.**

Assert:

- invalid email/name/password produces the project's validation response;
- duplicate permission slugs are rejected;
- an unknown application slug is rejected;
- duplicate email returns `409`;
- unknown user id returns `404`; and
- response objects never contain `passwordHash` or refresh-token fields.

- [x] **Step 2: Implement Zod schemas.**

Use:

```ts
const permissionSchema = z.object({
  applicationSlug: z.string().min(1),
  role: z.enum(['READ_ONLY', 'ADMIN'])
});
```

Create requires `email`, `name`, `password` (8–128 characters), and `permissions`. Update permits `name`, optional replacement `password`, and optional replacement `permissions`. Add a `.superRefine()` issue for duplicate application slugs.

- [x] **Step 3: Implement repository methods.**

Create focused data functions to list/find sanitized users, resolve application slugs, create a user with memberships, replace memberships, and delete a user. Query memberships with their `Application` relation so the service need not perform repeated lookups.

### Task 3: Implement the user service and routes

- [x] **Step 1: Implement service invariants.**

Before a create/update transaction, resolve every requested application slug. Reject unknown slugs without a partial write. Inside a Prisma transaction:

- bcrypt-hash new/replacement passwords;
- create/update the user;
- replace memberships only when they are supplied; and
- return a safe DTO.

For deletion, reject self-deletion and deleting the final `ADMIN` member of `user-management-app`. Delete the `User` record only after these checks; Prisma cascades memberships and refresh tokens.

- [x] **Step 2: Add controller/routes using existing conventions.**

Use `asyncHandler`, `validateBody`, and `getValidated`. Mount routes in this order to avoid `/:id` ambiguity:

```ts
usersRouter.get('/', requireAppRole('user-management-app', 'READ_ONLY'), listUsers);
usersRouter.post('/', requireAppRole('user-management-app', 'ADMIN'), createUser);
usersRouter.get('/:id', requireAppRole('user-management-app', 'READ_ONLY'), getUser);
usersRouter.patch('/:id', requireAppRole('user-management-app', 'ADMIN'), updateUser);
usersRouter.delete('/:id', requireAppRole('user-management-app', 'ADMIN'), deleteUser);
```

Mount `usersRouter` in `src/routes/v1/index.ts`.

- [x] **Step 3: Expand integration coverage.**

Use `ADMIN`, `READ_ONLY`, and no-membership fixtures. Confirm read-only access to `GET`, `403` on mutations, full admin CRUD, permission replacement, cascade behavior after deletion, self-delete denial, and final-admin deletion denial.

- [x] **Step 4: Run focused verification.**

```bash
npm run lint
npm run build
npm run test:unit -- require-app-role.middleware.test.ts
npm run test:integration -- users.test.ts
```

Expected: PASS.

- [x] **Step 5: Commit.**

```bash
git add src/core src/modules/users src/routes/v1/index.ts tests
git commit -m "feat(api): add application-scoped user management"
```

## Review checklist

- Authorization is based on the database, not client state or JWT claims.
- A `READ_ONLY` member can never mutate through the API.
- Requests cannot write a partial permission set on an unknown slug or validation failure.
- User deletion revokes refresh tokens through the existing cascade.
- The system cannot lose its last administrator through the new endpoint.
