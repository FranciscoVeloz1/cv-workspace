# Workout Program API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose authenticated workout-program CRUD, current-session resolution, and completion-gated progression under `/api/v1/users/:userId/fitness`, with seed defaults and transactional advance rules owned by the service layer.

**Architecture:** Extend the existing `fitness` module (schemas → repository → service → controller → routes). Progression advances **only** inside `completeWorkoutSession`. Daily-record PUT must never bump `currentDayIndex`. Seed on first GET (like settings). Zod validates all write bodies; export types via `z.infer`.

**Tech Stack:** Express, Zod, Prisma, Vitest, Supertest.

---

## Scope and dependencies

- **Depends on:** [01 — Workout program schema](01-workout-program-schema.md).
- **Unblocks:** [03 — Workout API client](03-workout-api-client.md), [06 — Workout E2E](06-workout-e2e.md).
- **Does not include:** Fitness SPA UI.

## Files

- Modify: `repos/personal-api/src/modules/fitness/fitness.defaults.ts`
- Modify: `repos/personal-api/src/modules/fitness/fitness.schemas.ts`
- Modify: `repos/personal-api/src/modules/fitness/fitness.repository.ts`
- Modify: `repos/personal-api/src/modules/fitness/fitness.service.ts`
- Modify: `repos/personal-api/src/modules/fitness/fitness.controller.ts`
- Modify: `repos/personal-api/src/modules/fitness/fitness.routes.ts`
- Create: `repos/personal-api/tests/integration/workout-program.test.ts`

Optional split if files grow unwieldy (still same module folder): `workout-program.defaults.ts` / repository helpers — prefer extending existing fitness files unless they exceed maintainability.

## API contract

Base path: `/api/v1/users/:userId/fitness`  
Auth: `Authorization: Bearer <accessToken>` on every route (existing `authenticate` + `requireSelfOrUmAdmin`).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/workout-program` | Return program + ordered days/exercises; seed defaults + progress if missing |
| PUT | `/workout-program` | Full replace of name + days (+ nested exercises); clamp progress index |
| GET | `/workout-program/current` | Day at `currentDayIndex` including exercises + progress metadata |
| POST | `/workout-program/complete` | Complete session for `date`: snapshot daily workout + advance cursor (idempotent per date) |

### Authorization

Unchanged: self or `user-management-app` `ADMIN`.

### Response shapes

Program:

```ts
{
  program: {
    id: string
    name: string
    days: Array<{
      id: string
      position: number
      name: string
      isRest: boolean
      category: 'cardio' | 'strength' | 'stretching' | 'mixed' | 'rest' | null
      exercises: Array<{
        id: string
        position: number
        name: string
        sets: number
        reps: string
        notes?: string
      }>
    }>
    progress: {
      currentDayIndex: number
      lastCompletedDate: string | null // yyyy-MM-dd
    }
    createdAt: string // ISO
    updatedAt: string // ISO
  }
}
```

Current session:

```ts
{
  current: {
    dayIndex: number
    day: {
      id: string
      position: number
      name: string
      isRest: boolean
      category: 'cardio' | 'strength' | 'stretching' | 'mixed' | 'rest' | null
      exercises: Array<{
        id: string
        position: number
        name: string
        sets: number
        reps: string
        notes?: string
      }>
    }
    progress: {
      currentDayIndex: number
      lastCompletedDate: string | null
    }
  }
}
```

Complete request body:

```ts
{
  date: string // yyyy-MM-dd
  durationMinutes?: number // default 0 if omitted
  intensity?: 'low' | 'moderate' | 'high' // default 'moderate'
  notes?: string
}
```

Complete response:

```ts
{
  program: /* same as GET program after advance */,
  dailyRecord: /* daily record DTO for that date */,
  current: /* same shape as GET /current after advance */
}
```

PUT `/workout-program` body (not wrapped):

```ts
{
  name: string
  days: Array<{
    name: string
    isRest: boolean
    category?: 'cardio' | 'strength' | 'stretching' | 'mixed' | 'rest' | null
    exercises: Array<{
      name: string
      sets: number
      reps: string
      notes?: string
    }> // order = position; empty allowed when isRest
  }> // order = position; min length 1
}
```

Server assigns new day/exercise ids on full replace. Clamp: if `currentDayIndex >= days.length`, set to `days.length - 1`. Do **not** reset `lastCompletedDate` or force index to `0` on ordinary edits.

### Workout snapshot on daily records

Extend `workoutEntrySchema` so complete can write a structured snapshot while remaining backward compatible with legacy free-form entries:

```ts
export const workoutExerciseSnapshotSchema = z.object({
  name: z.string().min(1).max(200),
  sets: z.number().int().nonnegative(),
  reps: z.string().min(1).max(50),
  notes: z.string().max(1000).optional()
});

export const workoutEntrySchema = z.object({
  completed: z.boolean(),
  category: z.enum(['cardio', 'strength', 'stretching', 'mixed', 'rest']),
  type: z.string().min(1).max(200),
  durationMinutes: z.number().nonnegative(),
  intensity: z.enum(['low', 'moderate', 'high']),
  notes: z.string().max(1000).optional(),
  programDayId: z.string().uuid().optional(),
  dayName: z.string().min(1).max(200).optional(),
  exercises: z.array(workoutExerciseSnapshotSchema).optional()
});
```

**Critical rule:** `putDailyRecord` in the service continues to upsert the JSON blob only. It must **not** read or write `FitnessWorkoutProgress`.

### Complete transaction (service contract)

Inside one Prisma `$transaction`:

1. Ensure program + progress exist (or throw `NotFoundError` if missing — prefer auto-seed call path first).
2. If `progress.lastCompletedDate === input.date`, skip advance; return current program + existing daily record + current session (idempotent).
3. Load day at `progress.currentDayIndex` (ordered by `position`).
4. Upsert `FitnessDailyRecord` for `date`:
   - If no record exists, seed meals from settings defaults (reuse existing get-or-create meal seeding pattern from daily record flows — or require meals array from templates via `createDefaultSettings().mealTemplates` mapped to pending logs). Prefer: load settings (seed if needed), build pending meal logs, then upsert with workout snapshot.
   - Workout field:

```ts
{
  completed: true,
  category: day.category ?? (day.isRest ? 'rest' : 'strength'),
  type: day.name,
  durationMinutes: input.durationMinutes ?? 0,
  intensity: input.intensity ?? 'moderate',
  notes: input.notes,
  programDayId: day.id,
  dayName: day.name,
  exercises: day.exercises
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((ex) => ({
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      ...(ex.notes ? { notes: ex.notes } : {})
    }))
}
```

5. Set `lastCompletedDate = input.date`.
6. Set `currentDayIndex = (currentDayIndex + 1) % dayCount`.

### Seed defaults

In `fitness.defaults.ts` (or workout defaults helper):

```ts
export function createDefaultWorkoutProgram() {
  return {
    name: 'Programa por defecto',
    days: [
      {
        name: 'Empuje',
        isRest: false,
        category: 'strength' as const,
        exercises: [
          { name: 'Press de banca', sets: 3, reps: '8-10' },
          { name: 'Press militar', sets: 3, reps: '8-10' },
          { name: 'Fondos', sets: 3, reps: '8-12' },
          { name: 'Extensiones de tríceps', sets: 3, reps: '10-12' }
        ]
      },
      {
        name: 'Jalón',
        isRest: false,
        category: 'strength' as const,
        exercises: [
          { name: 'Dominadas asistidas / jalón al pecho', sets: 3, reps: '8-10' },
          { name: 'Remo con barra', sets: 3, reps: '8-10' },
          { name: 'Curl de bíceps', sets: 3, reps: '10-12' },
          { name: 'Face pulls', sets: 3, reps: '12-15' }
        ]
      },
      {
        name: 'Pierna',
        isRest: false,
        category: 'strength' as const,
        exercises: [
          { name: 'Sentadilla', sets: 3, reps: '6-10' },
          { name: 'Peso muerto rumano', sets: 3, reps: '8-10' },
          { name: 'Prensa de piernas', sets: 3, reps: '10-12' },
          { name: 'Elevación de gemelos', sets: 3, reps: '12-15' }
        ]
      },
      {
        name: 'Descanso',
        isRest: true,
        category: 'rest' as const,
        exercises: [] as Array<{ name: string; sets: number; reps: string }>
      }
    ]
  };
}
```

`getWorkoutProgram(userId)`: if missing, create program + nested days/exercises + progress `{ currentDayIndex: 0, lastCompletedDate: null }` in a transaction, then return DTO.

### Routes wiring

```ts
// fitness.routes.ts — add after existing settings/daily-records routes
fitnessRouter.get('/workout-program', getWorkoutProgram);
fitnessRouter.put(
  '/workout-program',
  validateBody(putWorkoutProgramSchema),
  putWorkoutProgram
);
fitnessRouter.get('/workout-program/current', getCurrentWorkoutSession);
fitnessRouter.post(
  '/workout-program/complete',
  validateBody(completeWorkoutSessionSchema),
  completeWorkoutSession
);
```

Register `/workout-program/current` and `/workout-program/complete` **before** any param route that could shadow them (no `:id` today, but keep static paths explicit).

### Task 1: Write failing integration tests

- [ ] **Step 1: Create `repos/personal-api/tests/integration/workout-program.test.ts`.**

Cover at minimum:

1. Unauthenticated GET `/workout-program` → `401`
2. User A token + User B `userId` → `403`
3. First GET own `/workout-program` → `200`, seeded 4 days (Empuje/Jalón/Pierna/Descanso), progress index `0`, persisted on second GET
4. GET `/workout-program/current` → Empuje day with exercises
5. PUT reorder / rename a day + swap exercise order → `200`; GET matches; `currentDayIndex` unchanged if still in range
6. PUT with 1 day while index was `3` → clamped to `0`
7. POST complete `{ date: '2026-07-13' }` → daily record workout `completed: true`, snapshot exercises present; progress index `1`; `/current` is Jalón
8. POST complete same date again → index still `1` (no double advance)
9. Without completing, “next calendar day” is a client concern — assert `/current` still Jalón until another complete
10. PUT daily-record with `workout.completed: true` alone → progress index **unchanged**
11. Invalid PUT body (empty `days`, missing exercise name) → `422`
12. UM ADMIN can GET another user's program → `200`

Use existing helpers (`createUserWithPermission`, login, app + Supertest) matching `tests/integration/fitness.test.ts` style.

Example assertions for complete:

```ts
const completeRes = await request(app)
  .post(`/api/v1/users/${user.id}/fitness/workout-program/complete`)
  .set('Authorization', `Bearer ${accessToken}`)
  .send({ date: '2026-07-13', durationMinutes: 45, intensity: 'moderate' });

expect(completeRes.status).toBe(200);
expect(completeRes.body.program.progress.currentDayIndex).toBe(1);
expect(completeRes.body.program.progress.lastCompletedDate).toBe('2026-07-13');
expect(completeRes.body.dailyRecord.workout.completed).toBe(true);
expect(completeRes.body.dailyRecord.workout.dayName).toBe('Empuje');
expect(completeRes.body.dailyRecord.workout.exercises?.length).toBeGreaterThan(0);
expect(completeRes.body.current.day.name).toBe('Jalón');
```

- [ ] **Step 2: Run tests — expect FAIL.**

```bash
cd repos/personal-api
npm run test:integration -- workout-program.test.ts
```

Expected: FAIL (404 / missing routes).

### Task 2: Schemas and defaults

- [ ] **Step 1: Add seed helper** `createDefaultWorkoutProgram()` as above.
- [ ] **Step 2: Add Zod schemas** `workoutExerciseInputSchema`, `workoutDayInputSchema`, `putWorkoutProgramSchema`, `completeWorkoutSessionSchema`; extend `workoutEntrySchema` with optional snapshot fields. Export `z.infer` types. No parallel hand-written interfaces.

```ts
export const putWorkoutProgramSchema = z
  .object({
    name: z.string().min(1).max(200),
    days: z
      .array(
        z.object({
          name: z.string().min(1).max(200),
          isRest: z.boolean(),
          category: z
            .enum(['cardio', 'strength', 'stretching', 'mixed', 'rest'])
            .nullable()
            .optional(),
          exercises: z.array(
            z.object({
              name: z.string().min(1).max(200),
              sets: z.number().int().nonnegative(),
              reps: z.string().min(1).max(50),
              notes: z.string().max(1000).optional()
            })
          )
        })
      )
      .min(1)
  })
  .strict();

export const completeWorkoutSessionSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    durationMinutes: z.number().nonnegative().optional(),
    intensity: z.enum(['low', 'moderate', 'high']).optional(),
    notes: z.string().max(1000).optional()
  })
  .strict();
```

### Task 3: Repository + service + controller + routes

- [ ] **Step 1: Repository methods** — `getProgramWithTree`, `createProgramFromDefaults`, `replaceProgramDays`, `getProgress`, `upsertProgress`, helpers for transactional complete (or keep transaction in service calling prisma via repository).
- [ ] **Step 2: Service methods** — `getWorkoutProgram`, `putWorkoutProgram`, `getCurrentWorkoutSession`, `completeWorkoutSession` implementing seed, clamp, idempotent complete, snapshot rules above. Keep handlers thin.
- [ ] **Step 3: Controllers** — map to `{ program }`, `{ current }`, or complete envelope; wrap async via existing patterns.
- [ ] **Step 4: Wire routes** with `validateBody`.
- [ ] **Step 5: Re-run integration tests — expect PASS.**

```bash
npm run test:integration -- workout-program.test.ts
npm run test:integration -- fitness.test.ts
```

Expected: both PASS (existing fitness regression + new workout tests). Confirm extended `workoutEntrySchema` still accepts legacy payloads from `fitness.test.ts`.

### Task 4: Commit

- [ ] **Step 1: Commit on `feat/workout-program`.**

```bash
git add src/modules/fitness tests/integration/workout-program.test.ts
git commit -m "$(cat <<'EOF'
feat: add workout program API with completion-gated progression

EOF
)"
```

## Impact

| Edge case | Expected |
|-----------|----------|
| Complete twice same date | No second advance |
| Complete on rest day | Still advances; snapshot `category: rest`, empty exercises |
| PUT daily-record `completed: true` | History only; cursor unchanged |
| Shrink program under cursor | Index clamped on PUT |
| Concurrent completes (same date) | Prefer transactional idempotency on `lastCompletedDate`; last writer wins for workout JSON |
| Missing meals on first complete | Seed pending meals from settings templates before upsert |

## Verification

- Seed appears once and is stable across GETs.
- Cursor advances only via `/complete`.
- Legacy daily-record workouts still validate.
- Auth matrix matches existing fitness routes.
