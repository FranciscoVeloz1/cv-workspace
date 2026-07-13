# Fitness API Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose authenticated CRUD for fitness settings and daily records under `/api/v1/users/:userId/fitness`, scoped to the caller (or a user-management admin).

**Architecture:** New `fitness` module follows schemas → repository → service → controller → routes. `authenticate` plus `requireSelfOrUmAdmin` gate every route. Nested JSON is validated with Zod (shapes aligned with the fitness app). Mount the fitness router **before** the generic users router so `:userId/fitness` is not swallowed by `/:id`.

**Tech Stack:** Express, Zod, Prisma, Vitest, Supertest.

---

## Scope and dependencies

- **Depends on:** [01 — Fitness database schema](01-fitness-database-schema.md).
- **Unblocks:** [03 — Fitness auth and API client](03-fitness-auth-and-api-client.md), [05 — Local env and playwright E2E](05-local-env-and-playwright-e2e.md).
- **Does not include:** Fitness SPA UI, CORS env docs (spec 05), or a new Application slug.

## Files

- Create: `repos/personal-api/src/core/middleware/require-self-or-um-admin.ts`
- Create: `repos/personal-api/src/modules/fitness/fitness.defaults.ts`
- Create: `repos/personal-api/src/modules/fitness/fitness.schemas.ts`
- Create: `repos/personal-api/src/modules/fitness/fitness.repository.ts`
- Create: `repos/personal-api/src/modules/fitness/fitness.service.ts`
- Create: `repos/personal-api/src/modules/fitness/fitness.controller.ts`
- Create: `repos/personal-api/src/modules/fitness/fitness.routes.ts`
- Modify: `repos/personal-api/src/routes/v1/index.ts`
- Test: `repos/personal-api/tests/unit/require-self-or-um-admin.middleware.test.ts`
- Test: `repos/personal-api/tests/integration/fitness.test.ts`

## API contract

Base path: `/api/v1/users/:userId/fitness`  
Auth: `Authorization: Bearer <accessToken>` on every route.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/settings` | Return settings; create defaults if missing |
| PUT | `/settings` | Replace settings |
| GET | `/daily-records?from=yyyy-MM-dd&to=yyyy-MM-dd` | Inclusive range list |
| GET | `/daily-records/:date` | One day (`404` if missing) |
| PUT | `/daily-records/:date` | Upsert full day |
| DELETE | `/daily-records/:date` | Delete day (`204`) |

### Authorization

`requireSelfOrUmAdmin`:

1. No `req.user` → `401 UNAUTHORIZED`
2. `req.params.userId === req.user.id` → allow
3. Else if caller has `user-management-app` + `ADMIN` → allow
4. Else → `403 FORBIDDEN`

Any authenticated user (with or without UM membership) may access **their own** fitness data.

### Response shapes

Settings:

```ts
{
  settings: {
    mealTemplates: Array<{
      slot: 'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner'
      name: string
      time: string // HH:mm
    }>
    goalWeightKg?: number
    weightUnit: 'kg' | 'lb'
    theme: 'dark' | 'light' | 'system'
    schemaVersion: number
  }
}
```

Daily record:

```ts
{
  dailyRecord: {
    date: string // yyyy-MM-dd
    meals: Array<{
      slot: string
      name: string
      time: string
      status: 'pending' | 'followed' | 'modified' | 'skipped'
      actualDescription?: string
      notes?: string
      estimatedCalories?: number
    }>
    workout?: {
      completed: boolean
      category: 'cardio' | 'strength' | 'stretching' | 'mixed' | 'rest'
      type: string
      durationMinutes: number
      intensity: 'low' | 'moderate' | 'high'
      notes?: string
    }
    weight?: {
      weightKg: number
      bodyFatPct?: number
      muscleMassPct?: number
      waistCm?: number
      notes?: string
    }
    notes?: string
    createdAt: string // ISO
    updatedAt: string // ISO
  }
}
```

List:

```ts
{ dailyRecords: Array</* same as dailyRecord above */> }
```

PUT settings body = settings object (not wrapped).  
PUT daily-records body:

```ts
{
  meals: /* required, length 5, one per slot */,
  workout?: /* ... */,
  weight?: /* ... */,
  notes?: string
}
```

Server sets `date` from the URL and manages `createdAt` / `updatedAt`.

### Mount order

```ts
// repos/personal-api/src/routes/v1/index.ts
import { fitnessRouter } from '../../modules/fitness/fitness.routes.js';

v1Router.use('/health', healthRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/demo', demoRouter);
v1Router.use('/users/:userId/fitness', fitnessRouter);
v1Router.use('/users', usersRouter);
```

```ts
// fitness.routes.ts
export const fitnessRouter = Router({ mergeParams: true });
fitnessRouter.use(authenticate);
fitnessRouter.use(requireSelfOrUmAdmin);
```

### Task 1: Ownership middleware (TDD)

- [ ] **Step 1: Write unit tests.**

`tests/unit/require-self-or-um-admin.middleware.test.ts` must cover:

- missing `req.user` → `UnauthorizedError`
- `userId` matches `req.user.id` → `next()` with no DB role check required for self
- different `userId`, no UM ADMIN → `ForbiddenError`
- different `userId`, UM ADMIN membership → `next()`
- different `userId`, UM READ_ONLY only → `ForbiddenError`

- [ ] **Step 2: Run tests — expect FAIL.**

```bash
cd repos/personal-api
npm run test:unit -- require-self-or-um-admin.middleware.test.ts
```

- [ ] **Step 3: Implement middleware.**

```ts
// require-self-or-um-admin.ts — behavior summary
export async function requireSelfOrUmAdmin(req, _res, next) {
  if (!req.user) {
    next(new UnauthorizedError('Missing access token'));
    return;
  }
  if (req.params.userId === req.user.id) {
    next();
    return;
  }
  const membership = await prisma.userAppPermission.findFirst({
    where: {
      userId: req.user.id,
      role: 'ADMIN',
      application: { slug: 'user-management-app' }
    }
  });
  if (!membership) {
    next(new ForbiddenError('Cannot access another user fitness data'));
    return;
  }
  next();
}
```

- [ ] **Step 4: Re-run unit tests — expect PASS.**

### Task 2: Zod schemas and defaults

- [ ] **Step 1: Add `fitness.defaults.ts`** with `DEFAULT_MEAL_TEMPLATES` and `createDefaultSettings()` matching the fitness app (`schemaVersion: 1`, `weightUnit: 'kg'`, `theme: 'dark'`).

- [ ] **Step 2: Add `fitness.schemas.ts`** with Zod schemas equivalent to the fitness backup schemas (`mealTemplates`, settings, meal logs, workout, weight, date key, range query). Export `z.infer` types. Validate PUT daily body requires exactly one meal per slot in `MEAL_SLOTS` order (or unordered but complete unique slots — prefer **exactly the five slots, unique**).

### Task 3: Repository + service + controller + routes (TDD via integration)

- [ ] **Step 1: Write integration tests first.**

`tests/integration/fitness.test.ts` scenarios:

1. Unauthenticated GET settings → `401`
2. User A token + User B `userId` → `403`
3. User A GET own settings (empty DB) → `200` with defaults persisted
4. User A PUT settings → `200`; GET returns updated values
5. User A PUT daily-records/`2026-07-10` → `200`; GET one → match; GET range → includes
6. Invalid body (bad slot / missing meals) → `422`
7. GET missing date → `404`
8. DELETE day → `204`; subsequent GET → `404`
9. UM ADMIN can GET another user's settings → `200`
10. User with **no** UM permission can still GET/PUT **own** fitness data → `200`

Use `createUserWithPermission` for UM users; for “no UM permission” create a bare `prisma.user` with password hash only (no `UserAppPermission` row), then login via `POST /api/v1/auth/login`.

- [ ] **Step 2: Run integration tests — expect FAIL.**

```bash
npm run test:integration -- fitness.test.ts
```

- [ ] **Step 3: Implement repository.**

Prisma-only access: `getSettings`, `upsertSettings`, `listDailyRecords(userId, from, to)`, `getDailyRecord`, `upsertDailyRecord`, `deleteDailyRecord`. Map `DateTime` → ISO strings in the service layer, not the repository (or consistently in a mapper).

- [ ] **Step 4: Implement service.**

- `getSettings`: if missing, create defaults and return.
- `putSettings`: replace row.
- `listDailyRecords`: require `from <= to`; return ascending by date.
- `getDailyRecord`: throw `NotFoundError` if missing.
- `putDailyRecord`: upsert; on create set both timestamps; on update preserve `createdAt`.
- `deleteDailyRecord`: throw `NotFoundError` if missing, else delete.

- [ ] **Step 5: Implement thin controllers + routes** with `validateBody` / `validateQuery` (use existing validate middleware patterns), `asyncHandler`, and mount in `v1/index.ts`.

- [ ] **Step 6: Re-run integration tests — expect PASS.**

```bash
npm run test:integration -- fitness.test.ts
npm test
```

### Task 4: Commit

- [ ] **Step 1: Commit on `feat/fitness-nutrition-api`.**

```bash
git add src/core/middleware/require-self-or-um-admin.ts \
  src/modules/fitness \
  src/routes/v1/index.ts \
  tests/unit/require-self-or-um-admin.middleware.test.ts \
  tests/integration/fitness.test.ts
git commit -m "$(cat <<'EOF'
feat: add user-scoped fitness settings and daily-record API

EOF
)"
```

## Verification

- Self access works without any Application membership.
- Cross-user access only for UM ADMIN.
- Defaults created once on first GET settings.
- Range query is inclusive and ordered.
