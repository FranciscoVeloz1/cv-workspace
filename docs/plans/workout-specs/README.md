# Workout Sessions Specifications (Approach B)

These specifications split workout programs and daily session checkout for FitTrack (`fitness-nutrition-tracker`) ↔ `personal-api` into independently reviewable implementation units.

**Personas:** Implement backend units as backend-developer (thin controllers, Zod + `z.infer`, service-owned progression, braces, change-impact). Implement frontend units as frontend-developer (FitTrack tokens/patterns, loading/empty/error states, parallel queries, braces, change-impact).

## Execution order

1. [01 — Workout program schema](01-workout-program-schema.md)
   - Prisma models and migration for program, days, exercises, and progress cursor.
2. [02 — Workout program API](02-workout-program-api.md)
   - Seed, CRUD, `/current`, `/complete` with transactional advance + daily-record snapshot.
3. [03 — Workout API client](03-workout-api-client.md)
   - Types, fitness HTTP methods, TanStack Query hooks and keys in the SPA.
4. [04 — Program settings editor](04-program-settings-editor.md)
   - Settings UI to edit days and exercises (content + order).
5. [05 — Workout checkout UI](05-workout-checkout-ui.md)
   - Workout page: current session display + single completion control; past-day snapshots.
6. [06 — Workout E2E](06-workout-e2e.md)
   - Playwright-cli happy path for seed → edit → complete → advance → sticky cursor.
   - Runbook: [e2e-local-runbook.md](e2e-local-runbook.md).

## Fixed decisions

- **Approach B:** Normalized Prisma tables (`FitnessWorkoutProgram`, `FitnessWorkoutDay`, `FitnessWorkoutExercise`, `FitnessWorkoutProgress`). Not stored only as settings JSON.
- **Seeded default** on first `GET /workout-program`: Push / Pull / Legs / Rest (Spanish labels + sample exercises). Then fully editable.
- User can **add/remove/reorder days** and **edit exercise content and order** (`name`, `sets`, `reps`, optional `notes`).
- Daily checkout is **one** control (“Completé el entrenamiento”), not per-exercise checkboxes.
- Progress cursor (`currentDayIndex`) advances **only** inside `POST .../workout-program/complete`. Calendar date change without completion keeps the same prescribed day.
- **Uncheck does not roll back** the cursor. Marking a daily record incomplete via PUT must not undo progress.
- Raw `PUT /daily-records/:date` must **not** advance the cursor (prevents client cheating).
- Complete is **idempotent per date**: same `date` twice does not double-advance.
- Uncheck/rollback, set logging, multiple programs per user, offline queue, and weight progression are out of scope for v1.
- REST base: `/api/v1/users/:userId/fitness/...` with existing `authenticate` + `requireSelfOrUmAdmin`.
- Feature branches: `feat/workout-program` (`personal-api`), `feat/workout-sessions` (`fitness-nutrition-tracker`).

## Review contract

Each specification has:

- a limited file boundary;
- test-first acceptance criteria (or explicit UI verification for UI-only specs);
- a standalone commit boundary; and
- explicit dependency and verification requirements.

Do not begin a later specification until its listed dependency is merged or otherwise available in the working branch.

## Branch setup (before Task 1 of spec 01 / 03)

```bash
cd repos/personal-api
git checkout main && git pull
git checkout -b feat/workout-program

cd ../fitness-nutrition-tracker
git checkout main && git pull
git checkout -b feat/workout-sessions
```

## Related

Prior fitness backend integration: [`docs/plans/fitness-app-backend/`](../fitness-app-backend/README.md).
