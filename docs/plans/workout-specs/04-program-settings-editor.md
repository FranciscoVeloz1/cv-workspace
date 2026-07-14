# Program Settings Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the athlete edit the seeded workout program in Settings — day names, rest flags, exercise content, and order — and persist via `PUT /workout-program`.

**Architecture:** Follow meals settings craft: section on Settings page, RHF + Zod form, mutation hook from spec 03, Spanish copy, FitTrack `glass-panel` / shadcn controls. Intent: “Athlete tunes their cycle calmly — dense list, clear save, no dashboard chrome.”

**Tech Stack:** React 19, RHF, Zod, TanStack Query, existing UI primitives (`Button`, `Input`, `Label`, `Switch`).

---

## Scope and dependencies

- **Depends on:** [03 — Workout API client](03-workout-api-client.md).
- **Unblocks:** [06 — Workout E2E](06-workout-e2e.md) (edit path).
- **Does not include:** Workout page checkout UI (spec 05).

## Files

- Create: `repos/fitness-nutrition-tracker/src/features/settings/components/workout-program-form.tsx`
- Modify: `repos/fitness-nutrition-tracker/src/pages/settings-page.tsx`

Keep FitTrack `features/settings/components/` layout (do not invent a new top-level `components/WorkoutProgramForm/` tree unless the repo already requires it).

## UI contract

Settings page gains a section after meal templates:

- Title: **Programa de entrenamiento**
- Description: **Define los días y ejercicios. El orden determina qué rutina aparece después de marcar un entrenamiento como completado.**
- Per day card:
  - Name input
  - Rest switch (`isRest`) — when on, hide/clear exercise editors (send `exercises: []`)
  - Optional category select (default `strength` / `rest` when toggled)
  - Exercise rows: name, sets (number), reps (text), remove button
  - Add exercise / move day up-down / remove day (cannot remove last day)
- Global: Add day, Save button (`Guardar programa`)
- States: loading skeleton while `useWorkoutProgram` pending; `ErrorState` + retry; save pending disables submit; validation errors under fields; success toast `Programa actualizado`; error toast with `error.message` (narrow `unknown` if needed).

### Task 1: Form schema and component

- [ ] **Step 1: Create `workout-program-form.tsx`** with Zod + RHF.

```ts
const exerciseSchema = z.object({
  name: z.string().min(1, 'Obligatorio').max(80),
  sets: z.coerce.number().int().min(0).max(50),
  reps: z.string().min(1, 'Obligatorio').max(30),
  notes: z.string().max(200).optional(),
})

const daySchema = z
  .object({
    name: z.string().min(1, 'Obligatorio').max(60),
    isRest: z.boolean(),
    category: z.enum(WORKOUT_CATEGORIES).nullable().optional(),
    exercises: z.array(exerciseSchema),
  })
  .superRefine((day, ctx) => {
    if (!day.isRest && day.exercises.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Añade al menos un ejercicio o marca descanso',
        path: ['exercises'],
      })
    }
  })

const workoutProgramFormSchema = z.object({
  name: z.string().min(1).max(80),
  days: z.array(daySchema).min(1, 'Necesitas al menos un día'),
})

type WorkoutProgramFormValues = z.infer<typeof workoutProgramFormSchema>
```

Map API program → form defaults (drop server `id`/`position` for PUT body — order in array becomes position server-side).

```tsx
export function WorkoutProgramForm({ program }: { program: WorkoutProgram }) {
  const updateProgram = useUpdateWorkoutProgram()
  const form = useForm<WorkoutProgramFormValues>({
    resolver: zodResolver(workoutProgramFormSchema),
    defaultValues: mapProgramToForm(program),
  })

  useEffect(() => {
    form.reset(mapProgramToForm(program))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program.id, program.updatedAt])

  const handleSubmit = (values: WorkoutProgramFormValues): void => {
    updateProgram.mutate(
      {
        name: values.name,
        days: values.days.map((day) => {
          return {
            name: day.name,
            isRest: day.isRest,
            category: day.isRest ? 'rest' : (day.category ?? 'strength'),
            exercises: day.isRest
              ? []
              : day.exercises.map((exercise) => {
                  return {
                    name: exercise.name,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    ...(exercise.notes ? { notes: exercise.notes } : {}),
                  }
                }),
          }
        }),
      },
      {
        onSuccess: () => {
          toast.success('Programa actualizado')
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Error desconocido'
          toast.error('No se pudo guardar el programa', { description: message })
        },
      },
    )
  }

  // Render: program name, days map with move up/down, exercise editors, submit Button
}
```

Reorder helpers (pure, can live in the same file or `src/utils/` if reused):

```ts
function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) {
    return items
  }
  const next = items.slice()
  const [item] = next.splice(from, 1)
  if (!item) {
    return items
  }
  next.splice(to, 0, item)
  return next
}
```

Use `form.setValue('days', moveItem(days, index, index - 1), { shouldDirty: true })` for reorder. Buttons type=`button` for reorder/add/remove; only Save submits.

Minimum hit target ~44px for icon reorder buttons (padding). Prefer semantic `<button>` over clickable divs.

### Task 2: Wire Settings page

- [ ] **Step 1: Update `settings-page.tsx`.**

Fetch program with `useWorkoutProgram()` in parallel with existing `useSettings()` (both hooks at top — React Query runs them concurrently).

```tsx
const { data: settings, isPending, isError, error, refetch } = useSettings()
const {
  data: program,
  isPending: isProgramPending,
  isError: isProgramError,
  error: programError,
  refetch: refetchProgram,
} = useWorkoutProgram()

// In JSX, after MealTemplatesForm section:
<section className="space-y-3">
  <SectionHeader
    title="Programa de entrenamiento"
    description="Define los días y ejercicios. El orden determina la siguiente rutina al completar un entrenamiento."
  />
  {isProgramPending ? <CardSkeleton /> : null}
  {isProgramError ? (
    <ErrorState
      message={programError instanceof Error ? programError.message : undefined}
      onRetry={() => {
        void refetchProgram()
      }}
    />
  ) : null}
  {program ? <WorkoutProgramForm program={program} /> : null}
</section>
```

Match existing SectionHeader / card spacing on the page; do not introduce a new visual theme.

### Task 3: Verify manually + commit

- [ ] **Step 1: With API running**, open Settings, confirm seeded days appear, rename an exercise, reorder a day, save, reload — values persist.
- [ ] **Step 2: Lint/build.**

```bash
cd repos/fitness-nutrition-tracker
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/features/settings/components/workout-program-form.tsx src/pages/settings-page.tsx
git commit -m "$(cat <<'EOF'
feat: add workout program editor on settings

EOF
)"
```

## Impact

| Edge case | Behavior |
|-----------|----------|
| Toggle rest with exercises present | Clear exercises on submit (and ideally in UI when switching on) |
| Remove last day | Disabled / blocked by Zod `min(1)` |
| Save while offline / 401 | Toast error; session refresh handled by existing HTTP client |
| Cursor was mid-program | PUT clamp is server-side; editor does not show raw index |

## Verification

- Seeded program loads without a prior PUT.
- Edits survive reload.
- Loading / error / pending save states present.
- Mobile: day cards stack; controls remain tappable.
