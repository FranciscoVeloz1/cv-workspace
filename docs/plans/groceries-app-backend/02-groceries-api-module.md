# Groceries API Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose `ADMIN`-gated CRUD for the global grocery catalog and the caller’s grocery trips under `/api/v1/groceries`.

**Architecture:** New `groceries` module follows schemas → repository → service → controller → routes. Every route uses `authenticate` plus `requireAppRole('full-groceries-app', 'ADMIN')`. Trips are always scoped to `req.user.id` (no cross-user trip access in v1). Mount at `/groceries` on the v1 router.

**Tech Stack:** Express, Zod, Prisma, Vitest, Supertest.

---

## Scope and dependencies

- **Depends on:** [01 — Groceries database schema](01-groceries-database-schema.md).
- **Unblocks:** [03 — Groceries auth and API client](03-groceries-auth-and-api-client.md), [06 — Groceries E2E](06-groceries-e2e.md).
- **Does not include:** Groceries SPA UI, CORS env docs (spec 06).

## Files

- Create: `repos/personal-api/src/modules/groceries/groceries.schemas.ts`
- Create: `repos/personal-api/src/modules/groceries/groceries.repository.ts`
- Create: `repos/personal-api/src/modules/groceries/groceries.service.ts`
- Create: `repos/personal-api/src/modules/groceries/groceries.controller.ts`
- Create: `repos/personal-api/src/modules/groceries/groceries.routes.ts`
- Modify: `repos/personal-api/src/routes/v1/index.ts`
- Test: `repos/personal-api/tests/integration/groceries.test.ts`

## API contract

Base path: `/api/v1/groceries`  
Auth: `Authorization: Bearer <accessToken>` on every route.  
Gate: `requireAppRole('full-groceries-app', 'ADMIN')`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/products` | List products (`?category=` optional filter) |
| POST | `/products` | Create product |
| GET | `/products/:id` | Get one (`404` if missing) |
| PATCH | `/products/:id` | Partial update |
| DELETE | `/products/:id` | Delete (`204`) |
| GET | `/trips` | List caller’s trips (`?status=DRAFT\|COMPLETED` optional) |
| POST | `/trips` | Create DRAFT trip with initial items |
| GET | `/trips/:id` | Get own trip + items (`404` if missing or not owned) |
| PATCH | `/trips/:id` | Update `notes` only while DRAFT (or allow notes on COMPLETED — prefer **notes any status; status changes only via complete**) |
| PUT | `/trips/:id/items` | Replace all items (DRAFT only) |
| POST | `/trips/:id/complete` | Mark COMPLETED, set `completedAt` (DRAFT only) |
| DELETE | `/trips/:id` | Delete own trip (`204`; allow DRAFT and COMPLETED) |

### Authorization failure modes

1. No Bearer → `401 UNAUTHORIZED`
2. Authenticated without `full-groceries-app` ADMIN → `403 FORBIDDEN`
3. Trip `userId !== req.user.id` → treat as `404 NotFoundError` (do not leak existence)

### Response shapes

Product:

```ts
{
  product: {
    id: string
    name: string
    image: string
    category: number // 1..5
    price: number
    createdAt: string // ISO
    updatedAt: string // ISO
  }
}
```

List products:

```ts
{ products: Array</* product fields */> }
```

Trip item:

```ts
{
  id: string
  productId: string | null
  name: string
  category: number
  quantity: number
  listPrice: number
  realPrice: number | null
  sortOrder: number
}
```

Trip:

```ts
{
  trip: {
    id: string
    status: 'DRAFT' | 'COMPLETED'
    notes: string | null
    completedAt: string | null
    createdAt: string
    updatedAt: string
    items: Array</* trip item */>
  }
}
```

List trips:

```ts
{ trips: Array</* trip with items */> }
```

### Request bodies

`POST /products`:

```ts
{ name: string; image?: string; category: number; price: number }
```

`PATCH /products/:id` — all fields optional; at least one required:

```ts
{ name?: string; image?: string; category?: number; price?: number }
```

`POST /trips`:

```ts
{
  notes?: string
  items: Array<{
    productId?: string | null
    name: string
    category: number
    quantity: number
    listPrice: number
    realPrice?: number | null
    sortOrder?: number
  }>
}
```

Empty `items` array is allowed (create empty draft).

`PATCH /trips/:id`:

```ts
{ notes?: string | null }
```

`PUT /trips/:id/items`:

```ts
{
  items: Array<{
    productId?: string | null
    name: string
    category: number
    quantity: number // int >= 1
    listPrice: number // >= 0
    realPrice?: number | null // >= 0 when set
    sortOrder?: number
  }>
}
```

Server replaces **all** items in a transaction (delete existing + createMany). Reject if trip is `COMPLETED` with `409 ConflictError` (or `422` — prefer **`ConflictError` / 409**).

`POST /trips/:id/complete`: no body. Sets `status: COMPLETED`, `completedAt: now()`. Reject if already completed (`409`).

### Zod rules (`groceries.schemas.ts`)

```ts
const categorySchema = z.number().int().min(1).max(5);
const moneySchema = z.number().finite().min(0);

export const createProductBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  image: z.string().max(500).optional().default(''),
  category: categorySchema,
  price: moneySchema
});

export const patchProductBodySchema = createProductBodySchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field is required'
  });

export const tripItemInputSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(200),
  category: categorySchema,
  quantity: z.number().int().min(1).max(9999),
  listPrice: moneySchema,
  realPrice: moneySchema.nullable().optional(),
  sortOrder: z.number().int().min(0).optional()
});

export const createTripBodySchema = z.object({
  notes: z.string().max(2000).nullable().optional(),
  items: z.array(tripItemInputSchema)
});

export const replaceTripItemsBodySchema = z.object({
  items: z.array(tripItemInputSchema)
});

export const patchTripBodySchema = z.object({
  notes: z.string().max(2000).nullable().optional()
});

export const listProductsQuerySchema = z.object({
  category: categorySchema.optional()
});

export const listTripsQuerySchema = z.object({
  status: z.enum(['DRAFT', 'COMPLETED']).optional()
});

export const idParamSchema = z.object({
  id: z.string().uuid()
});
```

Export `z.infer` types for each schema. Do not duplicate TypeScript interfaces.

### Mount

```ts
// repos/personal-api/src/routes/v1/index.ts
import { groceriesRouter } from '../../modules/groceries/groceries.routes.js';

v1Router.use('/health', healthRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/demo', demoRouter);
v1Router.use('/groceries', groceriesRouter);
v1Router.use('/users/:userId/fitness', fitnessRouter);
v1Router.use('/users', usersRouter);
```

```ts
// groceries.routes.ts
export const groceriesRouter = Router();
groceriesRouter.use(authenticate);
groceriesRouter.use(requireAppRole('full-groceries-app', 'ADMIN'));
// wire validate + controllers
```

---

### Task 1: Write integration tests first (expect FAIL)

- [ ] **Step 1: Create `tests/integration/groceries.test.ts`.**

Helper: create groceries admin via `createUserWithPermission({ applicationSlug: 'full-groceries-app', role: 'ADMIN', ... })`, login, use access token. Create a second user with only `user-management-app` `READ_ONLY` (or no groceries permission) for forbidden cases.

Scenarios:

1. Unauthenticated `GET /products` → `401`
2. User without groceries ADMIN → `403`
3. Admin `POST /products` → `201` `{ product }`; `GET /products` includes it; `GET /products/:id` → `200`
4. Admin `PATCH /products/:id` → `200`; `DELETE` → `204`; subsequent GET → `404`
5. Invalid body (category `0`, empty name) → `422`
6. Admin `POST /trips` with two items → `201`; `GET /trips?status=DRAFT` includes it
7. Admin `PUT /trips/:id/items` updates `realPrice` → `200`
8. Admin `POST /trips/:id/complete` → `200` status `COMPLETED` + `completedAt` set
9. `PUT .../items` on completed trip → `409`
10. Another groceries admin cannot `GET /trips/:id` owned by someone else → `404`
11. Admin `DELETE /trips/:id` → `204`

- [ ] **Step 2: Run tests — expect FAIL.**

```bash
cd repos/personal-api
npm run test:integration -- groceries.test.ts
```

### Task 2: Implement module layers

- [ ] **Step 1: Add Zod schemas** in `groceries.schemas.ts` as above.

- [ ] **Step 2: Implement repository (Prisma only).**

```ts
export const groceriesRepository = {
  listProducts(category?: number) { /* findMany orderBy name */ },
  getProduct(id: string) { /* findUnique */ },
  createProduct(data) { /* create */ },
  updateProduct(id, data) { /* update */ },
  deleteProduct(id) { /* delete; throw if missing via service */ },
  listTrips(userId: string, status?: 'DRAFT' | 'COMPLETED') {
    /* findMany include items orderBy createdAt desc; items by sortOrder asc */
  },
  getTrip(id: string) { /* findUnique include items */ },
  createTrip(userId, notes, items) { /* create nested items */ },
  updateTripNotes(id, notes) { /* update */ },
  replaceTripItems(tripId, items) {
    /* $transaction: deleteMany items, createMany */
  },
  completeTrip(id, completedAt: Date) { /* update status + completedAt */ },
  deleteTrip(id) { /* delete */ }
};
```

- [ ] **Step 3: Implement service.**

Map Prisma rows → API DTOs (ISO dates). Throw `NotFoundError`, `ConflictError`, `ValidationError` as needed. On product create/update, no ownership check. On trip operations:

```ts
async function requireOwnTrip(tripId: string, userId: string) {
  const trip = await groceriesRepository.getTrip(tripId);
  if (!trip || trip.userId !== userId) {
    throw new NotFoundError('Trip not found');
  }
  return trip;
}
```

Before `replaceTripItems` / `complete`: if `status === 'COMPLETED'` throw `ConflictError`.

When `productId` is provided on item inputs, optionally verify product exists (`404`/`422` if missing — prefer **422 validation** “Unknown productId”).

- [ ] **Step 4: Controllers + routes.**

Thin `asyncHandler` wrappers; `getValidated` for body/params/query; status codes: create `201`, delete `204`, else `200`.

- [ ] **Step 5: Mount router in `v1/index.ts`.**

- [ ] **Step 6: Re-run integration tests — expect PASS.**

```bash
npm run test:integration -- groceries.test.ts
npm test
```

### Task 3: Commit

- [ ] **Step 1: Commit on `feat/groceries-api`.**

```bash
git add src/modules/groceries src/routes/v1/index.ts tests/integration/groceries.test.ts
git commit -m "$(cat <<'EOF'
feat: add groceries product and trip API module

EOF
)"
```

## Verification

- Only `full-groceries-app` ADMIN can call any groceries route.
- Guests / non-admins never use these endpoints (SPA keep static path — specs 04–06).
- Trip isolation by `userId` returns `404` for foreign ids.
- Completing a trip locks item replacement.
- Product delete does not fail when referenced by trip items (`ON DELETE SET NULL` from schema 01).
