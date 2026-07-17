# Groceries Database Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add groceries PostgreSQL tables to `personal-api` from scratch: `GroceryCategory` plus products and trips that reference categories by UUID FK.

**Architecture:** Categories are first-class rows with unique Spanish names and `sortOrder`. Products and trip items store `categoryId` only — **never** an Int category column. The migration creates empty product/trip tables and inserts the five Mandado seed categories. No HTTP changes in this spec.

**Tech Stack:** Prisma 6, PostgreSQL, TypeScript, Vitest.

---

## Scope and dependencies

- **Depends on:** `personal-api` `main` (User, fitness tables present; **no** groceries models).
- **Unblocks:** [02 — Groceries API module](02-groceries-categories-and-product-api.md).
- **Does not include:** HTTP routes, seed-groceries product script, SPA changes, or category CRUD endpoints.
- **Obsolete:** Any prior migration that used `GroceryProduct.category Int` or Int→FK backfill. Do not reintroduce that path.

## Files

- Modify: `repos/personal-api/prisma/schema.prisma`
- Create: `repos/personal-api/prisma/migrations/<timestamp>_add_groceries_tables/migration.sql`
- Modify: `repos/personal-api/tests/helpers/setup.ts` (cleanup order if needed)
- Create: `repos/personal-api/tests/integration/groceries-schema.test.ts`

## Data contract

Add to `User`:

```prisma
groceryTrips GroceryTrip[]
```

```prisma
enum GroceryTripStatus {
  DRAFT
  COMPLETED
}

model GroceryCategory {
  id        String             @id @default(uuid())
  name      String             @unique
  sortOrder Int                @default(0)
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt
  products  GroceryProduct[]
  tripItems GroceryTripItem[]

  @@index([sortOrder])
}

model GroceryProduct {
  id         String            @id @default(uuid())
  name       String
  image      String            @default("")
  categoryId String
  price      Float
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt
  category   GroceryCategory   @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  tripItems  GroceryTripItem[]

  @@index([categoryId])
  @@index([name])
}

model GroceryTrip {
  id          String            @id @default(uuid())
  userId      String
  status      GroceryTripStatus @default(DRAFT)
  notes       String?
  completedAt DateTime?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  items       GroceryTripItem[]

  @@index([userId, status])
  @@index([userId, completedAt])
}

model GroceryTripItem {
  id         String          @id @default(uuid())
  tripId     String
  productId  String?
  name       String
  categoryId String
  quantity   Int
  listPrice  Float
  realPrice  Float?
  sortOrder  Int             @default(0)
  trip       GroceryTrip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  product    GroceryProduct? @relation(fields: [productId], references: [id], onDelete: SetNull)
  category   GroceryCategory @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  @@index([tripId])
  @@index([categoryId])
}
```

### Seeded categories (migration must insert these)

| `name` | `sortOrder` |
| --- | --- |
| Limpieza personal | 1 |
| Limpieza global | 2 |
| Mascotas | 3 |
| Comida | 4 |
| Extras | 5 |

Use fixed UUIDs in the migration SQL so tests and seed scripts can rely on stable ids:

```sql
-- Fixed category ids (use these exact values)
-- sortOrder 1: 11111111-1111-4111-8111-111111111101  Limpieza personal
-- sortOrder 2: 11111111-1111-4111-8111-111111111102  Limpieza global
-- sortOrder 3: 11111111-1111-4111-8111-111111111103  Mascotas
-- sortOrder 4: 11111111-1111-4111-8111-111111111104  Comida
-- sortOrder 5: 11111111-1111-4111-8111-111111111105  Extras
```

`ON DELETE RESTRICT` on category FKs prevents deleting a category that still has products or trip items.

### Migration SQL outline

1. Create enum `GroceryTripStatus`.
2. Create `GroceryCategory`; `INSERT` five seed rows with fixed UUIDs above.
3. Create `GroceryProduct` with `categoryId` NOT NULL + FK + indexes (no Int column).
4. Create `GroceryTrip` + FK to `User` CASCADE.
5. Create `GroceryTripItem` with `categoryId` NOT NULL + FKs.

### Task 1: Write a schema smoke test that fails

- [ ] **Step 1: Create `repos/personal-api/tests/integration/groceries-schema.test.ts`.**

```ts
import { describe, expect, it } from 'vitest';
import { getPrisma } from '../../src/db/client.js';
import { createUserWithPermission } from '../helpers/user-fixtures.js';

describe('groceries schema', () => {
  it('has five seeded categories with Mandado names', async () => {
    const prisma = getPrisma();
    const categories = await prisma.groceryCategory.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    expect(categories.map((c) => c.name)).toEqual([
      'Limpieza personal',
      'Limpieza global',
      'Mascotas',
      'Comida',
      'Extras'
    ]);
    expect(categories.map((c) => c.sortOrder)).toEqual([1, 2, 3, 4, 5]);
  });

  it('creates a product with categoryId FK', async () => {
    const prisma = getPrisma();
    const category = await prisma.groceryCategory.findFirstOrThrow({
      where: { sortOrder: 4 }
    });

    const product = await prisma.groceryProduct.create({
      data: {
        name: 'Schema milk',
        image: '',
        categoryId: category.id,
        price: 25
      }
    });

    const loaded = await prisma.groceryProduct.findUniqueOrThrow({
      where: { id: product.id },
      include: { category: true }
    });

    expect(loaded.categoryId).toBe(category.id);
    expect(loaded.category.name).toBe('Comida');
  });

  it('cascades trips when the user is deleted', async () => {
    const prisma = getPrisma();
    const user = await createUserWithPermission({
      email: 'groceries-cascade@example.com',
      password: 'password123',
      name: 'Groceries Cascade',
      applicationSlug: 'groceries-app',
      role: 'ADMIN'
    });

    const category = await prisma.groceryCategory.findFirstOrThrow({
      where: { sortOrder: 1 }
    });

    const trip = await prisma.groceryTrip.create({
      data: {
        userId: user.id,
        items: {
          create: [
            {
              name: 'Soap',
              categoryId: category.id,
              quantity: 1,
              listPrice: 10
            }
          ]
        }
      }
    });

    await prisma.user.delete({ where: { id: user.id } });

    expect(await prisma.groceryTrip.findUnique({ where: { id: trip.id } })).toBeNull();
  });

  it('rejects deleting a category that still has products', async () => {
    const prisma = getPrisma();
    const category = await prisma.groceryCategory.findFirstOrThrow({
      where: { sortOrder: 2 }
    });

    await prisma.groceryProduct.create({
      data: {
        name: 'Schema detergent',
        image: '',
        categoryId: category.id,
        price: 40
      }
    });

    await expect(
      prisma.groceryCategory.delete({ where: { id: category.id } })
    ).rejects.toThrow();
  });
});
```

Ensure `createUserWithPermission` can upsert Application `groceries-app` (extend `tests/helpers/user-fixtures.ts` slug map if missing). Clean up products created in tests so seed categories remain.

- [ ] **Step 2: Run the test and confirm it fails.**

```bash
cd repos/personal-api
npm run test:integration -- groceries-schema.test.ts
```

Expected: FAIL because `groceryCategory` / `groceryProduct` do not exist on the Prisma client.

### Task 2: Update schema and migrate

- [ ] **Step 1: Edit `prisma/schema.prisma`** with the models above. Wire `groceryTrips` on `User`.

- [ ] **Step 2: Generate a reviewable migration.**

```bash
npm run db:migrate -- --name add_groceries_tables
```

Do not use `db push`. Hand-edit SQL to insert the five seed categories with the fixed UUIDs. Confirm there is **no** `category INTEGER` column anywhere.

- [ ] **Step 3: Update test DB cleanup** in `tests/helpers/setup.ts` — delete trip items → trips → products before users; **do not** delete seed categories between tests.

- [ ] **Step 4: Regenerate client and re-run schema tests.**

```bash
npx prisma generate
npm run test:integration -- groceries-schema.test.ts
```

Expected: PASS.

### Task 3: Commit

- [ ] **Step 1: Commit on `feat/groceries-api`.**

```bash
git add prisma/schema.prisma prisma/migrations tests/integration/groceries-schema.test.ts tests/helpers/setup.ts tests/helpers/user-fixtures.ts
git commit -m "$(cat <<'EOF'
feat: add groceries tables with GroceryCategory FK

EOF
)"
```

## Verification / E2E (this spec)

- [ ] Migration applies on empty DB from `main`.
- [ ] Five categories exist after migrate; products/trips empty until seed/API.
- [ ] `npm run test:integration -- groceries-schema.test.ts` passes.
- [ ] No HTTP/route files changed in this commit.
- [ ] Schema has zero Int `category` fields.

```bash
cd repos/personal-api
npx prisma migrate deploy
npm run test:integration -- groceries-schema.test.ts
```
