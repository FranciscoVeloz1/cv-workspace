# Fitness Database Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PostgreSQL tables for per-user fitness settings and daily records in `personal-api`, owned by existing `User` rows with cascade delete.

**Architecture:** Two Prisma models store nested meal/workout/weight payloads as JSON columns validated later at the HTTP boundary. Settings are 1:1 with `User`; daily records are 1:N with a unique `(userId, date)` constraint. No new `Application` slug.

**Tech Stack:** Prisma 6, PostgreSQL, TypeScript.

---

## Scope and dependencies

- **Depends on:** none (assumes current `User` / auth schema on `main`).
- **Unblocks:** [02 — Fitness API module](02-fitness-api-module.md).
- **Does not include:** HTTP routes, middleware, or fitness SPA changes.

## Files

- Modify: `repos/personal-api/prisma/schema.prisma`
- Create: `repos/personal-api/prisma/migrations/<timestamp>_add_fitness_tables/migration.sql`
- Modify: `repos/personal-api/tests/helpers/setup.ts` (cleanup order if needed)

## Data contract

```prisma
model FitnessSettings {
  userId         String   @id
  mealTemplates  Json
  goalWeightKg   Float?
  weightUnit     String   @default("kg")
  theme          String   @default("dark")
  schemaVersion  Int      @default(1)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model FitnessDailyRecord {
  id        String   @id @default(uuid())
  userId    String
  date      String
  meals     Json
  workout   Json?
  weight    Json?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@index([userId, date])
}
```

Add to `User`:

```prisma
fitnessSettings    FitnessSettings?
fitnessDailyRecords FitnessDailyRecord[]
```

JSON shapes (enforced in spec 02 Zod, not in SQL):

- `mealTemplates`: `Array<{ slot, name, time }>` — five slots matching the fitness app.
- `meals`: `Array<MealLog>`.
- `workout`: `WorkoutEntry | null`.
- `weight`: `WeightEntry | null`.
- `date`: `yyyy-MM-dd`.

Default settings values (used when the API lazily creates a row in spec 02):

```ts
const DEFAULT_MEAL_TEMPLATES = [
  { slot: 'breakfast', name: 'Desayuno', time: '07:30' },
  { slot: 'morningSnack', name: 'Colación matutina', time: '10:00' },
  { slot: 'lunch', name: 'Almuerzo', time: '13:00' },
  { slot: 'afternoonSnack', name: 'Colación de la tarde', time: '16:30' },
  { slot: 'dinner', name: 'Cena', time: '20:00' }
];

const DEFAULT_SETTINGS = {
  mealTemplates: DEFAULT_MEAL_TEMPLATES,
  weightUnit: 'kg',
  theme: 'dark',
  schemaVersion: 1
};
```

### Task 1: Write a schema smoke test that fails

- [ ] **Step 1: Add a focused unit/integration assertion that Prisma exposes the new models.**

Create `repos/personal-api/tests/integration/fitness-schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getPrisma } from '../../src/db/client.js';
import { createUserWithPermission } from '../helpers/user-fixtures.js';

describe('fitness schema', () => {
  it('persists settings and a daily record for a user', async () => {
    const prisma = getPrisma();
    const user = await createUserWithPermission({
      email: 'fitness-schema@example.com',
      password: 'password123',
      name: 'Fitness Schema',
      role: 'READ_ONLY'
    });

    await prisma.fitnessSettings.create({
      data: {
        userId: user.id,
        mealTemplates: [
          { slot: 'breakfast', name: 'Desayuno', time: '07:30' },
          { slot: 'morningSnack', name: 'Colación matutina', time: '10:00' },
          { slot: 'lunch', name: 'Almuerzo', time: '13:00' },
          { slot: 'afternoonSnack', name: 'Colación de la tarde', time: '16:30' },
          { slot: 'dinner', name: 'Cena', time: '20:00' }
        ],
        weightUnit: 'kg',
        theme: 'dark',
        schemaVersion: 1
      }
    });

    await prisma.fitnessDailyRecord.create({
      data: {
        userId: user.id,
        date: '2026-07-10',
        meals: [
          {
            slot: 'breakfast',
            name: 'Desayuno',
            time: '07:30',
            status: 'followed'
          }
        ],
        notes: 'schema smoke'
      }
    });

    const settings = await prisma.fitnessSettings.findUniqueOrThrow({
      where: { userId: user.id }
    });
    const record = await prisma.fitnessDailyRecord.findUniqueOrThrow({
      where: {
        userId_date: { userId: user.id, date: '2026-07-10' }
      }
    });

    expect(settings.weightUnit).toBe('kg');
    expect(record.notes).toBe('schema smoke');
  });

  it('cascades fitness rows when the user is deleted', async () => {
    const prisma = getPrisma();
    const user = await createUserWithPermission({
      email: 'fitness-cascade@example.com',
      password: 'password123',
      name: 'Fitness Cascade',
      role: 'READ_ONLY'
    });

    await prisma.fitnessSettings.create({
      data: {
        userId: user.id,
        mealTemplates: [],
        weightUnit: 'kg',
        theme: 'dark',
        schemaVersion: 1
      }
    });

    await prisma.user.delete({ where: { id: user.id } });

    expect(
      await prisma.fitnessSettings.findUnique({ where: { userId: user.id } })
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails.**

```bash
cd repos/personal-api
npm run test:integration -- fitness-schema.test.ts
```

Expected: FAIL because `fitnessSettings` / `fitnessDailyRecord` do not exist on the Prisma client.

### Task 2: Update schema and migrate

- [ ] **Step 1: Edit `prisma/schema.prisma`.**

Add `FitnessSettings` and `FitnessDailyRecord` exactly as in the data contract. Wire both relations on `User`.

- [ ] **Step 2: Generate a reviewable migration.**

```bash
npm run db:migrate -- --name add_fitness_tables
```

Do not use `db push` for this change. Inspect the SQL: create tables, FKs with `ON DELETE CASCADE`, unique `(userId, date)`, index on `(userId, date)`.

- [ ] **Step 3: Update test DB cleanup if needed.**

In `tests/helpers/setup.ts`, ensure fitness tables are cleared (cascade from user delete is enough if tests always delete users; otherwise delete `FitnessDailyRecord` then `FitnessSettings` before users).

- [ ] **Step 4: Regenerate client and re-run the schema tests.**

```bash
npx prisma generate
npm run test:integration -- fitness-schema.test.ts
```

Expected: PASS.

### Task 3: Commit

- [ ] **Step 1: Commit on `feat/fitness-nutrition-api`.**

```bash
git add prisma/schema.prisma prisma/migrations tests/integration/fitness-schema.test.ts tests/helpers/setup.ts
git commit -m "$(cat <<'EOF'
feat: add fitness settings and daily record tables

EOF
)"
```

## Verification

- Migration applies cleanly on empty and existing DBs.
- Deleting a `User` removes their fitness rows.
- Duplicate `(userId, date)` inserts fail at the DB layer.
