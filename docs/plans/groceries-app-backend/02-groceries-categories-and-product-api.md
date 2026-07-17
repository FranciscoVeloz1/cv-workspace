# Groceries API Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `personal-api` groceries HTTP module from scratch under `/api/v1/groceries`: list categories, product CRUD, and trips — all using `categoryId` and Application-scoped `groceries-app` permissions.

**Architecture:** New module `schemas → repository → service → controller → routes`. Gate with `authenticate` plus per-route `requireAppRole('groceries-app', 'READ_ONLY' | 'ADMIN')`. Seed Application slug `groceries-app` via admin seed / fixtures. Nested `category` on product responses for SPA convenience.

**Tech Stack:** Express, Zod, Prisma, Vitest, Supertest.

---

## Scope and dependencies

- **Depends on:** [01 — Groceries database schema](01-groceries-category-schema.md).
- **Unblocks:** [03 — Auth and API client](03-groceries-auth-and-api-client.md), [06 — Groceries E2E](06-groceries-e2e.md).
- **Does not include:** SPA changes or category write endpoints.
- **Obsolete:** Any prior groceries module that used Int `category`, a single router-level `requireAppRole(..., 'ADMIN')` blocking all GETs, or missing `/categories`.

## Files

- Create: `repos/personal-api/src/modules/groceries/groceries.schemas.ts`
- Create: `repos/personal-api/src/modules/groceries/groceries.repository.ts`
- Create: `repos/personal-api/src/modules/groceries/groceries.service.ts`
- Create: `repos/personal-api/src/modules/groceries/groceries.controller.ts`
- Create: `repos/personal-api/src/modules/groceries/groceries.routes.ts`
- Modify: `repos/personal-api/src/routes/v1/index.ts` — mount `v1Router.use('/groceries', groceriesRouter)`
- Create: `repos/personal-api/scripts/seed-groceries.mjs` + `package.json` script `db:seed-groceries`
- Modify: `repos/personal-api/scripts/seed-admin.mjs` — ensure Application `groceries-app` exists (and optionally grant admin groceries ADMIN)
- Create: `repos/personal-api/tests/integration/groceries.test.ts`
- Optional: `repos/personal-api/README.md` — document groceries endpoints

## API contract

Base path: `/api/v1/groceries`  
Auth: `Authorization: Bearer <accessToken>` on every route.

Application slug: **`groceries-app`**.

| Method | Path | Min role | Purpose |
| --- | --- | --- | --- |
| GET | `/categories` | READ_ONLY | List categories by `sortOrder` |
| GET | `/products?categoryId=` | READ_ONLY | List products |
| POST | `/products` | ADMIN | Create product |
| GET | `/products/:id` | READ_ONLY | Get product |
| PATCH | `/products/:id` | ADMIN | Patch product |
| DELETE | `/products/:id` | ADMIN | Delete product (`204`) |
| GET | `/trips?status=` | READ_ONLY | List **own** trips |
| POST | `/trips` | ADMIN | Create trip |
| GET | `/trips/:id` | READ_ONLY | Get own trip |
| PATCH | `/trips/:id` | ADMIN | Patch notes |
| PUT | `/trips/:id/items` | ADMIN | Replace items |
| POST | `/trips/:id/complete` | ADMIN | Complete trip |
| DELETE | `/trips/:id` | ADMIN | Delete trip (`204`) |

Trips are user-scoped (404 if not owner). Completed trips cannot be modified (`409 CONFLICT`). SPA does not call trips in this plan set; keep the API for a later cart→trips plan.

### Response shapes

Categories `200`:

```ts
{
  categories: Array<{ id: string; name: string; sortOrder: number }>
}
```

Product (create/get/list item):

```ts
{
  id: string
  name: string
  image: string
  categoryId: string
  category: { id: string; name: string; sortOrder: number }
  price: number
  createdAt: string // ISO
  updatedAt: string // ISO
}
```

List products: `{ products: Product[] }`. Single: `{ product: Product }`.

Create product body:

```ts
{
  name: string // 1..200 trimmed
  image?: string // max 500, default ""
  categoryId: string // uuid, must exist
  price: number // finite >= 0
}
```

Unknown `categoryId` → **`400 VALIDATION_ERROR`**.

Trip item input uses `categoryId` (uuid), not Int. Trip responses include items with `categoryId`.

### Zod

```ts
import { z } from 'zod';

const categoryIdSchema = z.string().uuid();
const moneySchema = z.number().finite().min(0);

export const createProductBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  image: z.string().max(500).optional().default(''),
  categoryId: categoryIdSchema,
  price: moneySchema
});

export const patchProductBodySchema = createProductBodySchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field is required'
  });

export const listProductsQuerySchema = z.object({
  categoryId: z.string().uuid().optional()
});

export const tripItemInputSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(200),
  categoryId: categoryIdSchema,
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

export const listTripsQuerySchema = z.object({
  status: z.enum(['DRAFT', 'COMPLETED']).optional()
});

export const idParamSchema = z.object({
  id: z.string().uuid()
});
```

### Routes pattern

```ts
groceriesRouter.use(authenticate);

groceriesRouter.get(
  '/categories',
  requireAppRole('groceries-app', 'READ_ONLY'),
  listCategories
);

groceriesRouter.get(
  '/products',
  requireAppRole('groceries-app', 'READ_ONLY'),
  validateQuery(listProductsQuerySchema),
  listProducts
);

groceriesRouter.post(
  '/products',
  requireAppRole('groceries-app', 'ADMIN'),
  validateBody(createProductBodySchema),
  createProduct
);
// ... same pattern for remaining routes
```

Do **not** apply a single router-level ADMIN gate that blocks READ_ONLY from listing products.

### Seed scripts

**`seed-admin.mjs`:** upsert Application `{ slug: 'groceries-app', name: 'Groceries App' }` alongside any existing apps; grant the seeded admin user `ADMIN` on `groceries-app`.

**`seed-groceries.mjs`:**

- Default JSON path: `repos/full-groceries-app/data/products.json` (legacy Int `category` 1–5 in file is OK for seed input only).
- Map Int → category via `sortOrder === category` (or accept `categoryId` if present).
- Skip if products already exist.
- `npm run db:seed-groceries`.

### Task 1: Failing integration tests

- [ ] **Step 1: Create `tests/integration/groceries.test.ts`.**

Helpers: `createGroceriesUser(email, role: 'READ_ONLY' | 'ADMIN')` via `createUserWithPermission({ applicationSlug: 'groceries-app', role })`.

Cover at least:

1. Unauthenticated `GET /products` → 401  
2. User **without** groceries membership → 403  
3. READ_ONLY lists categories (length 5, ordered)  
4. ADMIN creates product with `categoryId`; response has nested `category`  
5. READ_ONLY cannot POST product → 403  
6. Filter `GET /products?categoryId=`  
7. Unknown `categoryId` on create → 400  
8. ADMIN trip create / replace items / complete / delete (user-scoped); other user gets 404  

- [ ] **Step 2: Run — expect FAIL** (module missing).

```bash
cd repos/personal-api
npm run test:integration -- groceries.test.ts
```

### Task 2: Implement module

- [ ] **Step 1: Implement schemas, repository, service, controller, routes.**
- [ ] **Step 2: Mount router in `src/routes/v1/index.ts`.**
- [ ] **Step 3: Seed scripts + package.json.**
- [ ] **Step 4: Re-run tests.**

```bash
npm run test:integration -- groceries.test.ts
npm run test:integration -- groceries-schema.test.ts
```

Expected: PASS.

### Task 3: Commit

```bash
git add src/modules/groceries src/routes/v1/index.ts scripts tests/integration/groceries.test.ts package.json README.md
git commit -m "$(cat <<'EOF'
feat: add groceries API with categories and categoryId products

EOF
)"
```

## Verification / E2E (this spec)

- [ ] READ_ONLY can list categories and products; cannot mutate.
- [ ] ADMIN full product CRUD; nested category on responses.
- [ ] Trips user-scoped; completed trips immutable.
- [ ] Unauthenticated → 401; no membership → 403.
- [ ] No Int `category` in request/response bodies.

```bash
cd repos/personal-api
npm run test:integration -- groceries.test.ts
```
