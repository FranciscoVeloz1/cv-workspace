# Workout Program Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PostgreSQL tables for a per-user workout program (days + exercises) and a progress cursor that later APIs will advance only on session completion.

**Architecture:** Normalized Prisma models under the existing fitness domain. One program per user (`userId` unique). Ordered days and exercises via `position` columns with unique composite indexes. Progress is 1:1 with the user and points at the active day index. Cascade deletes follow `User` → program → days → exercises.

**Tech Stack:** Prisma 6, PostgreSQL, TypeScript, Vitest.

---

## Scope and dependencies

- **Depends on:** existing `User` + fitness tables on `main` ([fitness-app-backend 01](../fitness-app-backend/01-fitness-database-schema.md)).
- **Unblocks:** [02 — Workout program API](02-workout-program-api.md).
- **Does not include:** HTTP routes, seed defaults in service code, or SPA changes.

## Files

- Modify: `repos/personal-api/prisma/schema.prisma`
- Create: `repos/personal-api/prisma/migrations/<timestamp>_add_workout_program_tables/migration.sql`
- Modify: `repos/personal-api/tests/helpers/setup.ts`
- Create: `repos/personal-api/tests/integration/workout-program-schema.test.ts`

## Data contract

```prisma
model FitnessWorkoutProgram {
  id        String               @id @default(uuid())
  userId    String               @unique
  name      String
  createdAt DateTime             @default(now())
  updatedAt DateTime             @updatedAt
  user      User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  days      FitnessWorkoutDay[]
  progress  FitnessWorkoutProgress?
}

model FitnessWorkoutDay {
  id         String                   @id @default(uuid())
  programId  String
  position   Int
  name       String
  isRest     Boolean                  @default(false)
  category   String?
  createdAt  DateTime                 @default(now())
  updatedAt  DateTime                 @updatedAt
  program    FitnessWorkoutProgram    @relation(fields: [programId], references: [id], onDelete: Cascade)
  exercises  FitnessWorkoutExercise[]

  @@unique([programId, position])
  @@index([programId])
}

model FitnessWorkoutExercise {
  id        String            @id @default(uuid())
  dayId     String
  position  Int
  name      String
  sets      Int
  reps      String
  notes     String?
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt
  day       FitnessWorkoutDay @relation(fields: [dayId], references: [id], onDelete: Cascade)

  @@unique([dayId, position])
  @@index([dayId])
}

model FitnessWorkoutProgress {
  userId            String                 @id
  programId         String                 @unique
  currentDayIndex   Int                    @default(0)
  lastCompletedDate String?
  createdAt         DateTime               @default(now())
  updatedAt         DateTime               @updatedAt
  user              User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  program           FitnessWorkoutProgram  @relation(fields: [programId], references: [id], onDelete: Cascade)
}
```

Add to `User`:

```prisma
fitnessWorkoutProgram  FitnessWorkoutProgram?
fitnessWorkoutProgress FitnessWorkoutProgress?
```

### Field notes

| Field | Rule |
|-------|------|
| `FitnessWorkoutDay.position` | 0-based order within the program; contiguous preferred, uniqueness enforced |
| `FitnessWorkoutDay.isRest` | When `true`, exercises array may be empty |
| `FitnessWorkoutDay.category` | Optional string; API will constrain to workout categories (`strength`, `rest`, etc.) |
| `FitnessWorkoutExercise.reps` | String (e.g. `"8-12"`, `"10"`) — not a single int — supports ranges |
| `FitnessWorkoutExercise.sets` | Non-negative int at API layer; schema stores `Int` |
| `FitnessWorkoutProgress.currentDayIndex` | Index into ordered days (`0 .. dayCount-1`); API clamps after edits |
| `FitnessWorkoutProgress.lastCompletedDate` | `yyyy-MM-DD` or null; used for complete idempotency in spec 02 |

`FitnessDailyRecord.workout` JSON remains the historical session snapshot store; no new FK from daily records to program days in v1.

### Task 1: Write a schema smoke test that fails

- [ ] **Step 1: Create `repos/personal-api/tests/integration/workout-program-schema.test.ts`.**

```ts
import { describe, expect, it } from 'vitest';
import { getPrisma } from '../../src/db/client.js';
import { createUserWithPermission } from '../helpers/user-fixtures.js';

describe('workout program schema', () => {
  it('persists program days, exercises, and progress for a user', async () => {
    const prisma = getPrisma();
    const user = await createUserWithPermission({
      email: 'workout-schema@example.com',
      password: 'password123',
      name: 'Workout Schema',
      role: 'READ_ONLY'
    });

    const program = await prisma.fitnessWorkoutProgram.create({
      data: {
        userId: user.id,
        name: 'Programa por defecto',
        days: {
          create: [
            {
              position: 0,
              name: 'Empuje',
              isRest: false,
              category: 'strength',
              exercises: {
                create: [
                  {
                    position: 0,
                    name: 'Press de banca',
                    sets: 3,
                    reps: '8-10',
                    notes: null
                  }
                ]
              }
            },
            {
              position: 1,
              name: 'Descanso',
              isRest: true,
              category: 'rest',
              exercises: { create: [] }
            }
          ]
        }
      },
      include: { days: { include: { exercises: true }, orderBy: { position: 'asc' } } }
    });

    await prisma.fitnessWorkoutProgress.create({
      data: {
        userId: user.id,
        programId: program.id,
        currentDayIndex: 0,
        lastCompletedDate: null
      }
    });

    const loaded = await prisma.fitnessWorkoutProgram.findUniqueOrThrow({
      where: { userId: user.id },
      include: {
        days: { include: { exercises: true }, orderBy: { position: 'asc' } },
        progress: true
      }
    });

    expect(loaded.days).toHaveLength(2);
    expect(loaded.days[0]?.exercises[0]?.name).toBe('Press de banca');
    expect(loaded.progress?.currentDayIndex).toBe(0);
  });

  it('enforces unique (programId, position) on days', async () => {
    const prisma = getPrisma();
    const user = await createUserWithPermission({
      email: 'workout-day-unique@example.com',
      password: 'password123',
      name: 'Workout Day Unique',
      role: 'READ_ONLY'
    });

    const program = await prisma.fitnessWorkoutProgram.create({
      data: {
        userId: user.id,
        name: 'Programa',
        days: {
          create: [{ position: 0, name: 'A', isRest: false }]
        }
      }
    });

    await expect(
      prisma.fitnessWorkoutDay.create({
        data: {
          programId: program.id,
          position: 0,
          name: 'Duplicate',
          isRest: false
        }
      })
    ).rejects.toThrow();
  });

  it('cascades workout program rows when the user is deleted', async () => {
    const prisma = getPrisma();
    const user = await createUserWithPermission({
      email: 'workout-cascade@example.com',
      password: 'password123',
      name: 'Workout Cascade',
      role: 'READ_ONLY'
    });

    const program = await prisma.fitnessWorkoutProgram.create({
      data: {
        userId: user.id,
        name: 'Programa',
        days: {
          create: [
            {
              position: 0,
              name: 'Empuje',
              isRest: false,
              exercises: {
                create: [{ position: 0, name: 'Press', sets: 3, reps: '10' }]
              }
            }
          ]
        }
      }
    });

    await prisma.fitnessWorkoutProgress.create({
      data: {
        userId: user.id,
        programId: program.id,
        currentDayIndex: 0
      }
    });

    await prisma.user.delete({ where: { id: user.id } });

    expect(
      await prisma.fitnessWorkoutProgram.findUnique({ where: { userId: user.id } })
    ).toBeNull();
    expect(
      await prisma.fitnessWorkoutProgress.findUnique({ where: { userId: user.id } })
    ).toBeNull();
    expect(await prisma.fitnessWorkoutDay.count({ where: { programId: program.id } })).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails.**

```bash
cd repos/personal-api
npm run test:integration -- workout-program-schema.test.ts
```

Expected: FAIL because `fitnessWorkoutProgram` / related models do not exist on the Prisma client.

### Task 2: Update schema and migrate

- [ ] **Step 1: Edit `prisma/schema.prisma`.**

Add the four models exactly as in the data contract. Wire `fitnessWorkoutProgram` and `fitnessWorkoutProgress` on `User`.

- [ ] **Step 2: Generate a reviewable migration.**

```bash
npm run db:migrate -- --name add_workout_program_tables
```

Do not use `db push` for this change. Inspect the SQL: create tables, FKs with `ON DELETE CASCADE`, unique `(programId, position)`, unique `(dayId, position)`, unique `FitnessWorkoutProgram.userId`, unique `FitnessWorkoutProgress.programId`.

- [ ] **Step 3: Update test DB cleanup.**

In `tests/helpers/setup.ts`, delete workout tables before users (order matters if cascade is not enough during cleanup):

```ts
beforeEach(async () => {
  const prisma = getPrisma();
  await prisma.refreshToken.deleteMany();
  await prisma.fitnessWorkoutExercise.deleteMany();
  await prisma.fitnessWorkoutDay.deleteMany();
  await prisma.fitnessWorkoutProgress.deleteMany();
  await prisma.fitnessWorkoutProgram.deleteMany();
  await prisma.fitnessDailyRecord.deleteMany();
  await prisma.fitnessSettings.deleteMany();
  await prisma.userAppPermission.deleteMany();
  await prisma.application.deleteMany();
  await prisma.user.deleteMany();
});
```

- [ ] **Step 4: Regenerate client and re-run the schema tests.**

```bash
npx prisma generate
npm run test:integration -- workout-program-schema.test.ts
```

Expected: PASS.

### Task 3: Commit

- [ ] **Step 1: Commit on `feat/workout-program`.**

```bash
git add prisma/schema.prisma prisma/migrations tests/integration/workout-program-schema.test.ts tests/helpers/setup.ts
git commit -m "$(cat <<'EOF'
feat: add workout program, day, exercise, and progress tables

EOF
)"
```

## Verification

- Migration applies cleanly on empty and existing DBs.
- Deleting a `User` removes program, days, exercises, and progress.
- Duplicate `(programId, position)` or `(dayId, position)` inserts fail at the DB layer.
- One program per user (`userId` unique) is enforced.
