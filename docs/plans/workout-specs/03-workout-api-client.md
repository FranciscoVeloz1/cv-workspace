# Workout API Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire FitTrack to the workout-program endpoints with typed DTOs, HTTP helpers, a thin repository, and TanStack Query hooks that invalidate the right caches after complete/update.

**Architecture:** Mirror existing fitness settings/daily-record patterns: `api/fitness.ts` + repository using `requireFitnessApiSession` + hooks + `queryKeys`. Types live under `src/types/`. No UI in this spec. Prefer parallel independent queries at the call site (spec 05); hooks themselves stay small.

**Tech Stack:** TypeScript, Vite/React, TanStack Query, existing `AuthorizedRequest` / `ApiError`.

---

## Scope and dependencies

- **Depends on:** [02 — Workout program API](02-workout-program-api.md) available on local API (or mocked contract-compatible).
- **Unblocks:** [04 — Program settings editor](04-program-settings-editor.md), [05 — Workout checkout UI](05-workout-checkout-ui.md).
- **Does not include:** Settings editor UI or Workout page redesign.

## Files

- Create: `repos/fitness-nutrition-tracker/src/types/workout-program.ts`
- Modify: `repos/fitness-nutrition-tracker/src/types/workout.ts`
- Modify: `repos/fitness-nutrition-tracker/src/api/fitness.ts`
- Create: `repos/fitness-nutrition-tracker/src/storage/repositories/workout-program-repository.ts`
- Modify: `repos/fitness-nutrition-tracker/src/lib/query-keys.ts`
- Create: `repos/fitness-nutrition-tracker/src/hooks/use-workout-program.ts`
- Modify: `repos/fitness-nutrition-tracker/src/services/backup-schema.ts` (only if workout entry Zod must accept new optional snapshot fields for backup import/export)

## Types

- [ ] **Step 1: Create `src/types/workout-program.ts`.**

```ts
import type { WorkoutCategory } from '@/types/workout'

export interface WorkoutProgramExercise {
  id: string
  position: number
  name: string
  sets: number
  reps: string
  notes?: string
}

export interface WorkoutProgramDay {
  id: string
  position: number
  name: string
  isRest: boolean
  category: WorkoutCategory | null
  exercises: WorkoutProgramExercise[]
}

export interface WorkoutProgramProgress {
  currentDayIndex: number
  lastCompletedDate: string | null
}

export interface WorkoutProgram {
  id: string
  name: string
  days: WorkoutProgramDay[]
  progress: WorkoutProgramProgress
  createdAt: string
  updatedAt: string
}

export interface WorkoutProgramExerciseInput {
  name: string
  sets: number
  reps: string
  notes?: string
}

export interface WorkoutProgramDayInput {
  name: string
  isRest: boolean
  category?: WorkoutCategory | null
  exercises: WorkoutProgramExerciseInput[]
}

export interface PutWorkoutProgramInput {
  name: string
  days: WorkoutProgramDayInput[]
}

export interface CurrentWorkoutSession {
  dayIndex: number
  day: WorkoutProgramDay
  progress: WorkoutProgramProgress
}

export interface CompleteWorkoutSessionInput {
  date: string
  durationMinutes?: number
  intensity?: 'low' | 'moderate' | 'high'
  notes?: string
}

export interface CompleteWorkoutSessionResult {
  program: WorkoutProgram
  dailyRecord: import('@/types/daily-record').DailyRecord
  current: CurrentWorkoutSession
}
```

- [ ] **Step 2: Extend `WorkoutEntry` in `src/types/workout.ts`.**

```ts
export interface WorkoutExerciseSnapshot {
  name: string
  sets: number
  reps: string
  notes?: string
}

export interface WorkoutEntry {
  completed: boolean
  category: WorkoutCategory
  type: string
  durationMinutes: number
  intensity: WorkoutIntensity
  notes?: string
  programDayId?: string
  dayName?: string
  exercises?: WorkoutExerciseSnapshot[]
}
```

If `backup-schema.ts` validates workouts with Zod, add the same optional fields there so import/export does not strip snapshots.

### Task 1: API client methods

- [ ] **Step 1: Extend `src/api/fitness.ts`.**

```ts
import type {
  CompleteWorkoutSessionInput,
  CompleteWorkoutSessionResult,
  CurrentWorkoutSession,
  PutWorkoutProgramInput,
  WorkoutProgram,
} from '@/types/workout-program'

type WorkoutProgramEnvelope = { program: WorkoutProgram }
type CurrentWorkoutEnvelope = { current: CurrentWorkoutSession }

export async function getWorkoutProgram(
  userId: string,
  authorizedRequest: AuthorizedRequest,
): Promise<WorkoutProgram> {
  const result = await authorizedRequest<WorkoutProgramEnvelope>(
    `/api/v1/users/${userId}/fitness/workout-program`,
  )
  return result.program
}

export async function putWorkoutProgram(
  userId: string,
  body: PutWorkoutProgramInput,
  authorizedRequest: AuthorizedRequest,
): Promise<WorkoutProgram> {
  const result = await authorizedRequest<WorkoutProgramEnvelope>(
    `/api/v1/users/${userId}/fitness/workout-program`,
    { method: 'PUT', body },
  )
  return result.program
}

export async function getCurrentWorkoutSession(
  userId: string,
  authorizedRequest: AuthorizedRequest,
): Promise<CurrentWorkoutSession> {
  const result = await authorizedRequest<CurrentWorkoutEnvelope>(
    `/api/v1/users/${userId}/fitness/workout-program/current`,
  )
  return result.current
}

export async function completeWorkoutSession(
  userId: string,
  body: CompleteWorkoutSessionInput,
  authorizedRequest: AuthorizedRequest,
): Promise<CompleteWorkoutSessionResult> {
  return authorizedRequest<CompleteWorkoutSessionResult>(
    `/api/v1/users/${userId}/fitness/workout-program/complete`,
    { method: 'POST', body },
  )
}
```

Use braced function bodies and explicit returns per workspace brace rule when editing surrounding code.

### Task 2: Repository

- [ ] **Step 1: Create `workout-program-repository.ts`.**

```ts
import * as fitnessApi from '@/api/fitness'
import { requireFitnessApiSession } from '@/api/fitness-session'
import type {
  CompleteWorkoutSessionInput,
  CompleteWorkoutSessionResult,
  CurrentWorkoutSession,
  PutWorkoutProgramInput,
  WorkoutProgram,
} from '@/types/workout-program'

export class WorkoutProgramRepository {
  async get(): Promise<WorkoutProgram> {
    const { userId, request } = requireFitnessApiSession()
    return fitnessApi.getWorkoutProgram(userId, request)
  }

  async save(input: PutWorkoutProgramInput): Promise<WorkoutProgram> {
    const { userId, request } = requireFitnessApiSession()
    return fitnessApi.putWorkoutProgram(userId, input, request)
  }

  async getCurrent(): Promise<CurrentWorkoutSession> {
    const { userId, request } = requireFitnessApiSession()
    return fitnessApi.getCurrentWorkoutSession(userId, request)
  }

  async complete(input: CompleteWorkoutSessionInput): Promise<CompleteWorkoutSessionResult> {
    const { userId, request } = requireFitnessApiSession()
    return fitnessApi.completeWorkoutSession(userId, input, request)
  }
}

export const workoutProgramRepository = new WorkoutProgramRepository()
```

### Task 3: Query keys and hooks

- [ ] **Step 1: Extend `query-keys.ts`.**

```ts
export const queryKeys = {
  settings: () => ['settings'] as const,
  dailyRecord: (date: DateKey) => ['dailyRecord', date] as const,
  dailyRecordsRange: (start: DateKey, end: DateKey) =>
    ['dailyRecords', 'range', start, end] as const,
  dailyRecordsAll: () => ['dailyRecords', 'all'] as const,
  dashboardSummary: () => ['dashboardSummary'] as const,
  workoutProgram: () => ['workoutProgram'] as const,
  currentWorkoutSession: () => ['currentWorkoutSession'] as const,
}
```

- [ ] **Step 2: Create `hooks/use-workout-program.ts`.**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { workoutProgramRepository } from '@/storage/repositories/workout-program-repository'
import { invalidateDayRelatedQueries } from '@/hooks/use-daily-record'
import { queryKeys } from '@/lib/query-keys'
import type {
  CompleteWorkoutSessionInput,
  PutWorkoutProgramInput,
} from '@/types/workout-program'

export function useWorkoutProgram() {
  return useQuery({
    queryKey: queryKeys.workoutProgram(),
    queryFn: () => workoutProgramRepository.get(),
  })
}

export function useCurrentWorkoutSession() {
  return useQuery({
    queryKey: queryKeys.currentWorkoutSession(),
    queryFn: () => workoutProgramRepository.getCurrent(),
  })
}

export function useUpdateWorkoutProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PutWorkoutProgramInput) => workoutProgramRepository.save(input),
    onSuccess: (program) => {
      queryClient.setQueryData(queryKeys.workoutProgram(), program)
      void queryClient.invalidateQueries({ queryKey: queryKeys.currentWorkoutSession() })
    },
  })
}

export function useCompleteWorkoutSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CompleteWorkoutSessionInput) =>
      workoutProgramRepository.complete(input),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.workoutProgram(), result.program)
      queryClient.setQueryData(queryKeys.currentWorkoutSession(), result.current)
      queryClient.setQueryData(queryKeys.dailyRecord(result.dailyRecord.date), result.dailyRecord)
      invalidateDayRelatedQueries(queryClient, result.dailyRecord.date)
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary() })
    },
  })
}
```

### Task 4: Manual / typecheck verification

- [ ] **Step 1: Run typecheck/lint.**

```bash
cd repos/fitness-nutrition-tracker
npm run build
```

Expected: PASS (no UI consumers yet is fine; exports compile).

- [ ] **Step 2: Commit on `feat/workout-sessions`.**

```bash
git add src/types/workout-program.ts src/types/workout.ts src/api/fitness.ts \
  src/storage/repositories/workout-program-repository.ts src/lib/query-keys.ts \
  src/hooks/use-workout-program.ts src/services/backup-schema.ts
git commit -m "$(cat <<'EOF'
feat: add workout program API client and query hooks

EOF
)"
```

## Impact

| Concern | Mitigation |
|---------|------------|
| Completing must refresh dashboard streaks | Invalidate `dashboardSummary` + day queries |
| Program PUT changes `/current` day identity | Invalidate `currentWorkoutSession` |
| Errors | Let `ApiError` propagate; UI specs toast/`ErrorState` |

## Verification

- Methods hit correct paths and unwrap envelopes like settings.
- Complete mutation updates program, current, and daily-record caches.
- Types accept legacy workout entries without `exercises`.
