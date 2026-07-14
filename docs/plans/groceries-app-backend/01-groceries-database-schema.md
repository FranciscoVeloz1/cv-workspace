# Groceries Database Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PostgreSQL tables for a global grocery product catalog and per-user grocery trips (draft + completed) in `personal-api`, plus seed the `full-groceries-app` Application and initial products from the SPA’s static JSON.

**Architecture:** Three Prisma models — `GroceryProduct` (global catalog), `GroceryTrip` (owned by `User`), `GroceryTripItem` (line items with list price and optional real price). Soft coupling: trip items may omit `productId` for custom/Extras rows. Cascade delete trip items with trip; cascade trips with user. Product delete sets item `productId` to null (`onDelete: SetNull`).

**Tech Stack:** Prisma 6, PostgreSQL, TypeScript, Node seed script.

---

## Scope and dependencies

- **Depends on:** none (assumes current `User` / `Application` / auth schema on `main`).
- **Unblocks:** [02 — Groceries API module](02-groceries-api-module.md).
- **Does not include:** HTTP routes, middleware, or groceries SPA changes.

## Files

- Modify: `repos/personal-api/prisma/schema.prisma`
- Create: `repos/personal-api/prisma/migrations/<timestamp>_add_groceries_tables/migration.sql`
- Create: `repos/personal-api/scripts/seed-groceries.mjs`
- Modify: `repos/personal-api/package.json` (add `db:seed-groceries`)
- Modify: `repos/personal-api/scripts/seed-admin.mjs` **or** rely on groceries seed to upsert Application + ADMIN grant for bootstrap admin (prefer **extend seed-admin** to also upsert `full-groceries-app` and grant `ADMIN` to the same bootstrap user — groceries product seed stays in `seed-groceries.mjs`)
- Modify: `repos/personal-api/tests/helpers/setup.ts` (cleanup order if needed)
- Test: `repos/personal-api/tests/integration/groceries-schema.test.ts`
- Read-only source for seed data: `repos/full-groceries-app/data/products.json`

## Data contract

```prisma
enum GroceryTripStatus {
  DRAFT
  COMPLETED
}

model GroceryProduct {
  id        String   @id @default(uuid())
  name      String
  image     String   @default("")
  category  Int
  price     Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  tripItems GroceryTripItem[]

  @@index([category])
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
  id        String          @id @default(uuid())
  tripId    String
  productId String?
  name      String
  category  Int
  quantity  Int
  listPrice Float
  realPrice Float?
  sortOrder Int             @default(0)
  trip      GroceryTrip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  product   GroceryProduct? @relation(fields: [productId], references: [id], onDelete: SetNull)

  @@index([tripId])
}
```

Add to `User`:

```prisma
groceryTrips GroceryTrip[]
```

### Category ints (document only; not a DB enum)

| Id | Name (SPA) |
|----|------------|
| 1 | Limpieza personal |
| 2 | Limpieza global |
| 3 | Mascotas |
| 4 | Comida |
| 5 | Extras |

### Seed contracts

**Application** (in `seed-admin.mjs` after UM upsert, or a shared helper):

```js
const GROCERIES_SLUG = 'full-groceries-app';
const GROCERIES_NAME = 'Full Groceries App';
// upsert Application
// upsert UserAppPermission ADMIN for the same ADMIN_EMAIL user
```

**Products** (`scripts/seed-groceries.mjs`):

- Read `../full-groceries-app/data/products.json` when that path exists relative to `repos/personal-api` (sibling under `repos/`); otherwise accept `GROCERIES_PRODUCTS_JSON` as an absolute path env override (e.g. CI).
- Idempotent: if `GroceryProduct` count already `>` 0, skip insert (log and exit 0) **or** upsert by `(name, category)` — prefer **skip when any products exist** for v1 simplicity.
- Map each JSON row `{ name, image, category, price }` → create (ignore numeric `id`; use UUID).
- Validate `category` in `1..5`, `price >= 0`, `name` non-empty; skip or throw on invalid rows (prefer throw on first invalid).

---

### Task 1: Write a schema smoke test that fails

- [ ] **Step 1: Add integration assertions that Prisma exposes the new models.**

Create `repos/personal-api/tests/integration/groceries-schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getPrisma } from '../../src/db/client.js';
import { createUserWithPermission } from '../helpers/user-fixtures.js';

describe('groceries schema', () => {
  it('persists a product, trip, and trip item for a user', async () => {
    const prisma = getPrisma();
    const user = await createUserWithPermission({
      email: 'groceries-schema@example.com',
      password: 'password123',
      name: 'Groceries Schema',
      role: 'ADMIN',
      applicationSlug: 'full-groceries-app'
    });

    const product = await prisma.groceryProduct.create({
      data: {
        name: 'Jabón De Manos',
        image: 'jabon_manos.webp',
        category: 1,
        price: 50
      }
    });

    const trip = await prisma.groceryTrip.create({
      data: {
        userId: user.id,
        status: 'DRAFT',
        items: {
          create: [
            {
              productId: product.id,
              name: product.name,
              category: product.category,
              quantity: 2,
              listPrice: product.price,
              realPrice: null,
              sortOrder: 0
            },
            {
              productId: null,
              name: 'Artículo custom',
              category: 5,
              quantity: 1,
              listPrice: 10,
              realPrice: 12.5,
              sortOrder: 1
            }
          ]
        }
      },
      include: { items: true }
    });

    expect(product.category).toBe(1);
    expect(trip.items).toHaveLength(2);
    expect(trip.items.find((i) => i.productId === null)?.realPrice).toBe(12.5);
  });

  it('cascades trips when the user is deleted and nulls productId when product is deleted', async () => {
    const prisma = getPrisma();
    const user = await createUserWithPermission({
      email: 'groceries-cascade@example.com',
      password: 'password123',
      name: 'Groceries Cascade',
      role: 'ADMIN',
      applicationSlug: 'full-groceries-app'
    });

    const product = await prisma.groceryProduct.create({
      data: {
        name: 'Cascade Product',
        image: '',
        category: 4,
        price: 1
      }
    });

    const trip = await prisma.groceryTrip.create({
      data: {
        userId: user.id,
        status: 'COMPLETED',
        completedAt: new Date(),
        items: {
          create: [
            {
              productId: product.id,
              name: product.name,
              category: 4,
              quantity: 1,
              listPrice: 1,
              realPrice: 1.2,
              sortOrder: 0
            }
          ]
        }
      }
    });

    await prisma.groceryProduct.delete({ where: { id: product.id } });
    const item = await prisma.groceryTripItem.findFirstOrThrow({
      where: { tripId: trip.id }
    });
    expect(item.productId).toBeNull();

    await prisma.user.delete({ where: { id: user.id } });
    expect(await prisma.groceryTrip.findUnique({ where: { id: trip.id } })).toBeNull();
    expect(
      await prisma.groceryTripItem.findFirst({ where: { tripId: trip.id } })
    ).toBeNull();
  });
});
```

If `createUserWithPermission` does not yet accept `applicationSlug`, extend the helper in this task to upsert the given Application slug (default remain `user-management-app` for existing tests).

- [ ] **Step 2: Run the test and confirm it fails.**

```bash
cd repos/personal-api
npm run test:integration -- groceries-schema.test.ts
```

Expected: FAIL because `groceryProduct` / `groceryTrip` / `groceryTripItem` do not exist on the Prisma client.

### Task 2: Update schema and migrate

- [ ] **Step 1: Edit `prisma/schema.prisma`.**

Add `GroceryTripStatus`, `GroceryProduct`, `GroceryTrip`, `GroceryTripItem` exactly as in the data contract. Wire `groceryTrips` on `User`.

- [ ] **Step 2: Generate a reviewable migration.**

```bash
npm run db:migrate -- --name add_groceries_tables
```

Do not use `db push` for this change. Inspect the SQL: create enum/tables, FKs (`ON DELETE CASCADE` for trip→user and items→trip; `ON DELETE SET NULL` for items→product), indexes.

- [ ] **Step 3: Update test DB cleanup if needed.**

In `tests/helpers/setup.ts`, delete in order if cascading from users is insufficient:

1. `GroceryTripItem` (or rely on trip cascade)
2. `GroceryTrip`
3. `GroceryProduct`
4. then existing user/application cleanup

- [ ] **Step 4: Regenerate client and re-run the schema tests.**

```bash
npx prisma generate
npm run test:integration -- groceries-schema.test.ts
```

Expected: PASS.

### Task 3: Seed Application + products

- [ ] **Step 1: Extend `scripts/seed-admin.mjs`.**

After seeding `user-management-app`, also upsert `full-groceries-app` / `Full Groceries App` and grant the same bootstrap user `ADMIN` on that application. Log both slugs.

- [ ] **Step 2: Create `scripts/seed-groceries.mjs`.**

```js
// Pseudocode contract — implement fully in the script
// 1. load DATABASE_URL / .env like seed-admin.mjs
// 2. resolve products JSON path
// 3. if (await prisma.groceryProduct.count()) > 0 → log skip and exit 0
// 4. createMany from mapped rows
// 5. console.log(`Seeded ${n} grocery products`)
```

- [ ] **Step 3: Wire npm script.**

```json
"db:seed-groceries": "node scripts/seed-groceries.mjs"
```

- [ ] **Step 4: Run seeds against a migrated DB.**

```bash
npm run db:seed-admin
npm run db:seed-groceries
```

Expected: Application membership exists; product count matches JSON length (~146).

### Task 4: Commit

- [ ] **Step 1: Commit on `feat/groceries-api`.**

```bash
git add prisma/schema.prisma prisma/migrations \
  scripts/seed-admin.mjs scripts/seed-groceries.mjs package.json \
  tests/integration/groceries-schema.test.ts tests/helpers
git commit -m "$(cat <<'EOF'
feat: add groceries product and trip tables

EOF
)"
```

## Verification

- Migration applies cleanly on empty and existing DBs.
- Deleting a `User` removes their trips and items.
- Deleting a `GroceryProduct` keeps trip items with `productId = null`.
- `db:seed-admin` grants groceries ADMIN; `db:seed-groceries` is idempotent on second run.
