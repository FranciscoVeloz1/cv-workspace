# Application Permissions Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `personal-api`'s global role with persisted, application-scoped `READ_ONLY` and `ADMIN` memberships, and provide a secure first-administrator bootstrap.

**Architecture:** Prisma owns the application registry and user membership data. JWTs carry only immutable identity claims, while `GET /auth/me` reads and returns persisted application memberships. The migration preserves existing accounts by mapping legacy `ADMIN` and `USER` roles to `ADMIN` and `READ_ONLY` access for the seeded `user-management-app`.

**Tech Stack:** Prisma, PostgreSQL, Express, TypeScript, bcryptjs, Vitest/Supertest.

---

## Scope and dependencies

- **Depends on:** none.
- **Unblocks:** [02 — User management API](02-user-management-api.md).
- **Does not include:** HTTP user CRUD, client code, or route authorization middleware.

## Files

- Modify: `repos/personal-api/prisma/schema.prisma`
- Create: `repos/personal-api/prisma/migrations/<timestamp>_add_application_permissions/migration.sql`
- Create: `repos/personal-api/scripts/seed-admin.mjs`
- Modify: `repos/personal-api/package.json`
- Modify: `repos/personal-api/src/modules/auth/auth.routes.ts`
- Modify: `repos/personal-api/src/modules/auth/auth.schemas.ts`
- Modify: `repos/personal-api/src/modules/auth/auth.repository.ts`
- Modify: `repos/personal-api/src/modules/auth/auth.service.ts`
- Modify: `repos/personal-api/src/modules/auth/auth.controller.ts`
- Modify: `repos/personal-api/src/core/lib/token.ts`
- Modify: `repos/personal-api/src/core/middleware/authenticate.ts`
- Modify: `repos/personal-api/src/types/express.d.ts`
- Modify: `repos/personal-api/tests/helpers/setup.ts`
- Test: `repos/personal-api/tests/integration/auth.test.ts`

## Data contract

```prisma
enum PermissionRole {
  READ_ONLY
  ADMIN
}

model Application {
  id          String              @id @default(uuid())
  slug        String              @unique
  name        String
  permissions UserAppPermission[]
}

model UserAppPermission {
  userId        String
  applicationId String
  role          PermissionRole
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@id([userId, applicationId])
}
```

`User.role` and the legacy `Role` enum are removed. `User` retains its existing `RefreshToken[]` relation; `RefreshToken.user` remains `onDelete: Cascade`.

### Task 1: Establish the failing authentication/membership contract

- [x] **Step 1: Add integration tests for permission-aware authenticated identity.**

Add tests that create a user and `user-management-app` membership directly through Prisma fixtures, call `GET /api/v1/auth/me`, and assert the sanitized user response includes:

```ts
expect(response.body.user).toEqual({
  id: expect.any(String),
  email: 'admin@example.com',
  name: 'Admin User',
  permissions: [
    { applicationSlug: 'user-management-app', role: 'ADMIN' }
  ]
});
```

Add a second user with `READ_ONLY` membership and assert the role is serialized exactly. Assert password hashes and refresh-token fields are absent.

- [x] **Step 2: Run the focused tests and confirm failure.**

Run from `repos/personal-api`:

```bash
npm run test:integration -- auth.test.ts
```

Expected: failure because the schema and current `/auth/me` response contain only the global `role`.

### Task 2: Migrate to the application membership schema

- [x] **Step 1: Update `prisma/schema.prisma`.**

Add `PermissionRole`, `Application`, and `UserAppPermission`; remove `Role` and `User.role`; add `permissions UserAppPermission[]` to `User`.

- [x] **Step 2: Generate a reviewable SQL migration.**

Run:

```bash
npm run db:migrate -- --name add_application_permissions
```

Then inspect the generated migration and make it preserve data in this order:

1. create the application and membership structures;
2. insert `('user-management-app', 'User Management')` once;
3. insert one membership per existing user, mapping `ADMIN → ADMIN` and `USER → READ_ONLY`;
4. add the new foreign-key constraints;
5. drop the legacy `role` column and enum only after the copy succeeds.

Do not use `db push` for this production-facing schema change.

- [x] **Step 3: Update test cleanup.**

Delete `UserAppPermission` and `Application` records during test setup before deleting users, respecting foreign-key order.

- [x] **Step 4: Generate Prisma and run the focused contract tests.**

Run:

```bash
npm run db:generate
npm run test:integration -- auth.test.ts
```

Expected: Prisma generation succeeds. The response tests fail until the next task updates auth serialization.

### Task 3: Harden the authentication contract

- [x] **Step 1: Remove public registration.**

Remove the `POST /auth/register` route, its controller/service/repository create path, and its Zod schema/export. Add an integration test that confirms it returns `404`.

- [x] **Step 2: Serialize current memberships from `GET /auth/me`.**

Update the authentication repository's current-user lookup to join memberships and their application. Return only:

```ts
{
  id: user.id,
  email: user.email,
  name: user.name,
  permissions: user.permissions.map((permission) => {
    return {
      applicationSlug: permission.application.slug,
      role: permission.role
    };
  })
}
```

Update `AuthUser`, JWT claims, and `authenticate` so they contain `id`, `email`, and `name` only. Do not serialize mutable membership data into a JWT.

- [x] **Step 3: Verify the auth contract.**

```bash
npm run test:unit -- auth.service.test.ts
npm run test:integration -- auth.test.ts
```

Expected: login, refresh rotation, logout, and the added membership response tests pass; registration is no longer public.

### Task 4: Add the first-administrator seed command

- [x] **Step 1: Add `scripts/seed-admin.mjs`.**

Read and validate `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME`. Reject missing values and passwords shorter than eight characters. Upsert the seeded application, bcrypt-hash the supplied password, upsert the user by email, and create/update its `ADMIN` membership in one transaction.

The script must:

- print the created/updated email and application slug only;
- never log the password or password hash;
- safely run more than once; and
- disconnect Prisma in a `finally` block.

- [x] **Step 2: Register the command.**

Add this script to `repos/personal-api/package.json`:

```json
"db:seed-admin": "node scripts/seed-admin.mjs"
```

- [x] **Step 3: Manually verify idempotency against a local database.**

Run twice with the same variables:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret123 ADMIN_NAME='Initial Admin' npm run db:seed-admin
```

Expected: one user, one `user-management-app` record, and one `ADMIN` membership; the second invocation updates rather than duplicates records.

### Task 5: Verify and commit

- [x] **Step 1: Run regression checks.**

```bash
npm run lint
npm run build
npm run test:unit
npm run test:integration
```

Expected: all checks pass.

- [x] **Step 2: Commit the foundation.**

```bash
git add prisma scripts/seed-admin.mjs package.json tests
git commit -m "feat(api): add application-scoped permission data"
```

## Review checklist

- Existing `ADMIN` accounts become administrators of `user-management-app`.
- Existing `USER` accounts become read-only members of the same app.
- Re-running the seed command does not create duplicates.
- No sensitive credentials are logged.
- User deletion will cascade memberships and refresh tokens once the API exposes deletion.
