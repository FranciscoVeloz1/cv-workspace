# Workout Checkout UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace free-form-only workout logging with a daily checkout that shows the prescribed program day and advances to the next day only when the user marks the session complete.

**Architecture:** Workout page loads `useCurrentWorkoutSession` + `useDailyRecord(selectedDate)` + stats range in parallel. When `selectedDate === today`, focal UI is the current program day (read-only exercise list) + “Completé el entrenamiento” switch/button wired to `useCompleteWorkoutSession`. Past dates show the daily-record snapshot (if any). Completion runs in the event handler — not a `useEffect`. Optional duration/intensity/notes stay secondary so they do not overpower the checkout control.

**Tech Stack:** React 19, TanStack Query, shadcn Switch/Button, existing `DateNavigator`, `ErrorState`, `CardSkeleton`, sonner toasts.

---

## Scope and dependencies

- **Depends on:** [03 — Workout API client](03-workout-api-client.md); Settings editor ([04](04-program-settings-editor.md)) is optional for this page but useful for E2E.
- **Unblocks:** [06 — Workout E2E](06-workout-e2e.md).
- **Does not include:** Per-exercise checkboxes; cursor rollback on uncheck.

## Files

- Create: `repos/fitness-nutrition-tracker/src/features/workout/components/current-session-card.tsx`
- Create: `repos/fitness-nutrition-tracker/src/features/workout/components/workout-session-snapshot.tsx`
- Modify: `repos/fitness-nutrition-tracker/src/pages/workout-page.tsx`
- Modify: `repos/fitness-nutrition-tracker/src/features/workout/components/workout-form.tsx` (retain as optional details panel OR retire free-form primary path — prefer: secondary “Detalles” for duration/intensity/notes used on complete, not a parallel free-form completed switch that bypasses progression)
- Modify as needed for snapshot display: `repos/fitness-nutrition-tracker/src/features/history/components/day-detail-panel.tsx`
- Confirm dashboard/stats still use `workout.completed` ([`repos/fitness-nutrition-tracker/src/services/dashboard.ts`](../../../repos/fitness-nutrition-tracker/src/services/dashboard.ts) — no change if field remains).

## Product rules on the page

| Selected date | Show | Mutations allowed |
|---------------|------|-------------------|
| Today | `/current` day name + exercises + complete control | `POST complete` (and optional details fields) |
| Past / future | Snapshot from `dailyRecord.workout` if present; else empty state “Sin entrenamiento registrado” | Do **not** call complete for non-today (disable control). Free-form PUT is out of preferred path; if kept, do not present it as “advance program”. |

**Uncheck:** There is no “uncomplete + roll back” control on the current session. If today's daily record already shows `completed: true` for this session, show completed state; repeated complete is safe (idempotent).

### Task 1: Presentational components

- [ ] **Step 1: `current-session-card.tsx`**

```tsx
interface CurrentSessionCardProps {
  day: WorkoutProgramDay
  dayIndex: number
  dayCount: number
  completedToday: boolean
  isCompleting: boolean
  durationMinutes: number
  intensity: WorkoutIntensity
  notes: string
  onDurationChange: (value: number) => void
  onIntensityChange: (value: WorkoutIntensity) => void
  onNotesChange: (value: string) => void
  onCompleteChange: (completed: boolean) => void
}

export function CurrentSessionCard(props: CurrentSessionCardProps) {
  // Focal: day.name + "Día {dayIndex+1} de {dayCount}"
  // List exercises: name — sets x reps (muted notes)
  // If isRest: copy "Día de descanso — márcalo completado para avanzar"
  // Primary: Switch "Completé el entrenamiento" checked={completedToday}
  //   onCheckedChange: only call onCompleteChange(true) when turning ON
  //   turning OFF: toast.info('El progreso del programa no retrocede al desmarcar') — do not call API rollback
  // Secondary fields: duration, intensity, notes (collapsed details or below)
}
```

Exercise list markup example:

```tsx
<ul className="space-y-2">
  {day.exercises.map((exercise) => {
    return (
      <li key={exercise.id} className="flex items-baseline justify-between gap-3 border-b border-border/50 py-2 last:border-0">
        <span className="font-medium">{exercise.name}</span>
        <span className="text-muted-foreground text-sm tabular-nums">
          {exercise.sets} × {exercise.reps}
        </span>
      </li>
    )
  })}
</ul>
```

Empty exercises + not rest: show muted “Sin ejercicios configurados. Edítalos en Ajustes.”

- [ ] **Step 2: `workout-session-snapshot.tsx`** for past days.

```tsx
export function WorkoutSessionSnapshot({ workout }: { workout: WorkoutEntry }) {
  // Show dayName ?? type, completed badge, optional exercises snapshot, duration/intensity
}
```

### Task 2: Wire Workout page

- [ ] **Step 1: Rewrite `workout-page.tsx` data loading.**

```tsx
export default function WorkoutPage() {
  const selectedDate = useUiStore((state) => state.selectedDate)
  const setSelectedDate = useUiStore((state) => state.setSelectedDate)
  const today = todayKey()
  const isToday = selectedDate === today

  const currentQuery = useCurrentWorkoutSession()
  const recordQuery = useDailyRecord(selectedDate)
  const rangeStart = shiftDateKey(today, -(STATS_WINDOW_DAYS - 1))
  const rangeQuery = useDailyRecordsRange(rangeStart, today)
  const programQuery = useWorkoutProgram() // dayCount for "Día X de Y"
  const completeSession = useCompleteWorkoutSession()

  // Local UI state for optional details (duration/intensity/notes) — not derived via effect from complete
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [intensity, setIntensity] = useState<WorkoutIntensity>('moderate')
  const [notes, setNotes] = useState('')

  const handleCompleteChange = (completed: boolean): void => {
    if (!completed) {
      toast.message('El progreso del programa no retrocede al desmarcar')
      return
    }
    completeSession.mutate(
      {
        date: today,
        durationMinutes,
        intensity,
        notes: notes.trim() ? notes.trim() : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Entrenamiento completado — siguiente rutina lista')
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Error desconocido'
          toast.error('No se pudo completar el entrenamiento', { description: message })
        },
      },
    )
  }

  const completedToday = Boolean(recordQuery.data?.workout?.completed) && isToday
  // Prefer: if lastCompletedDate === today from current.progress, treat as completed

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Entrenamiento"
        description="Sigue la rutina del día y márcala cuando la completes."
        action={<DateNavigator date={selectedDate} onChange={setSelectedDate} />}
      />

      {(currentQuery.isPending || recordQuery.isPending) && isToday ? <CardSkeleton /> : null}
      {isToday && currentQuery.isError ? (
        <ErrorState
          message={currentQuery.error instanceof Error ? currentQuery.error.message : undefined}
          onRetry={() => {
            void currentQuery.refetch()
          }}
        />
      ) : null}

      {isToday && currentQuery.data && programQuery.data ? (
        <CurrentSessionCard
          day={currentQuery.data.day}
          dayIndex={currentQuery.data.dayIndex}
          dayCount={programQuery.data.days.length}
          completedToday={
            completedToday || currentQuery.data.progress.lastCompletedDate === today
          }
          isCompleting={completeSession.isPending}
          durationMinutes={durationMinutes}
          intensity={intensity}
          notes={notes}
          onDurationChange={setDurationMinutes}
          onIntensityChange={setIntensity}
          onNotesChange={setNotes}
          onCompleteChange={handleCompleteChange}
        />
      ) : null}

      {!isToday ? (
        recordQuery.isPending ? (
          <CardSkeleton />
        ) : recordQuery.data?.workout ? (
          <WorkoutSessionSnapshot workout={recordQuery.data.workout} />
        ) : (
          <p className="text-muted-foreground text-sm">Sin entrenamiento registrado este día.</p>
        )
      ) : null}

      {rangeQuery.data ? <WorkoutStats summary={computeWorkoutSummary(rangeQuery.data)} /> : null}
    </div>
  )
}
```

Do **not** await queries sequentially in an effect; hooks fire in parallel.

After a successful complete, React Query cache updates should make `CurrentSessionCard` show the **next** day on the next render (same today date).

### Task 3: History display polish

- [ ] **Step 1: In `day-detail-panel.tsx`**, if `workout.exercises?.length`, list them under the existing workout summary line; keep `type` / `dayName` as title.

### Task 4: Verify + commit

- [ ] **Step 1: Manual checks**

1. Fresh user: Workout shows Empuje + exercises.
2. Complete → toast; UI shows Jalón without changing the calendar date.
3. Navigate to yesterday → empty or old snapshot; cursor unchanged when returning to today.
4. Leave incomplete overnight (simulate by not completing): still Empuje (or current) next calendar day.
5. Dashboard still counts `workout.completed` for today after complete.

- [ ] **Step 2: Build**

```bash
cd repos/fitness-nutrition-tracker
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/features/workout src/pages/workout-page.tsx src/features/history
git commit -m "$(cat <<'EOF'
feat: show current workout session and completion checkout

EOF
)"
```

## Impact

| Edge case | Behavior |
|-----------|----------|
| Double-click complete | Mutation pending disables control; server idempotent by date |
| Uncheck switch | Message only; no rollback API |
| Viewing today after complete | Shows next program day; daily record still has today's completed snapshot via `useDailyRecord(today)` |
| Program edited in Settings mid-day | Invalidate/refetch current; may change exercises under same index |
| Offline complete | Toast error; no optimistic cursor advance (avoid desync) |

## Verification

- Focal hierarchy: day name → list → completion control → secondary details → stats.
- Loading / error / empty past-day states exist.
- Keyboard: Switch and buttons focusable; no div-onClick for primary actions.
