# Frontend — Board UI and drag-drop

**Tipo:** UX/UI  
**Depende de:** [`02-functional-board-and-drag-drop.md`](02-functional-board-and-drag-drop.md), [`07-frontend-scaffold-auth-and-shell.md`](07-frontend-scaffold-auth-and-shell.md), [`06-backend-kanban-module.md`](06-backend-kanban-module.md)  
**Implementa:** Board components and hooks that load tasks/tags in parallel, render three columns and cards, HTML5 column drop + keyboard move → `PATCH` status, loading/empty/error states.  
**No incluye:** Task/tag create modals (09), Playwright (10), `@dnd-kit` or other DnD libraries, within-column reorder.

## Resultado

Authenticated users see their live board. Cards show title, optional tag, optional deadline (with overdue role when applicable), and checklist progress. Dragging a card onto a column or using “Move to …” updates status via API and survives reload. Empty columns remain drop targets.

## Requirements

### Data loading

1. Fetch tasks and tags **in parallel** (no waterfall).
2. Group tasks by `status` in the client; sort each column by `createdAt` descending.
3. States: loading skeleton/placeholder; empty board (three empty columns); recoverable error with retry.

### Card roles (from 02)

- Title (button or focusable control that will open edit modal in 09 — can be a stub handler until 09).
- Tag label when `tag` present.
- Deadline when present; **overdue** style when deadline &lt; today and status ≠ `FINISHED`.
- Checklist progress `done/total` when checklist length ≥ 1.

### Drag and drop

1. Card is `draggable`.
2. Column is a drop zone (`ondragover` preventDefault + `ondrop`).
3. On drop: if status differs, optimistic update then `PATCH /api/v1/kanban/tasks/:id` with `{ status }`; on failure revert.
4. Use `accent-primary` (or dedicated drop token) for active drop target highlight.
5. No within-column reorder UI.

### Keyboard

Each card exposes menu or buttons: Move to Pending / In progress / Finished (omit current). Same mutation path as drop.

### Accessibility

- Columns: `role="region"` or list semantics with accessible names matching column labels.
- Cards: keyboard focusable; drag is supplementary to keyboard.
- Hit targets ~44px for move controls.

## Architecture

```text
BoardPage
  useKanbanBoard() → { tasks, tags, isLoading, error, moveTask }
  KanbanBoard
    KanbanColumn × 3
      TaskCard × n
```

Query keys:

```ts
['kanban', 'tasks']
['kanban', 'tags']
```

Invalidate `['kanban', 'tasks']` after successful status patch (or setQueryData for optimistic).

Persona: **frontend-developer** — parallel queries (vercel CRITICAL), states, braces.

## Code to do

### Files

```text
repos/kanban-dashboard/src/
  hooks/useKanbanBoard.ts
  hooks/useKanbanBoard.test.ts
  components/board/KanbanBoard/index.tsx
  components/board/KanbanBoard/KanbanBoard.module.css
  components/board/KanbanColumn/index.tsx
  components/board/KanbanColumn/KanbanColumn.module.css
  components/board/TaskCard/index.tsx
  components/board/TaskCard/TaskCard.module.css
  api/kanban.ts          # listTasks, listTags, patchTask
  pages/BoardPage/index.tsx  # wire hook + board
  utils/group-tasks.ts
  utils/group-tasks.test.ts
  utils/deadline.ts      # isOverdue(deadline, today)
  utils/deadline.test.ts
```

### API client sketch

```ts
export async function listTasks(http: HttpClient): Promise<{ tasks: Task[] }> {
  return http.request('/api/v1/kanban/tasks');
}

export async function patchTask(
  http: HttpClient,
  taskId: string,
  body: { status?: TaskStatus; /* … */ }
): Promise<{ task: Task }> {
  return http.request(`/api/v1/kanban/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}
```

### Hook sketch

```ts
export function useKanbanBoard() {
  const tasksQuery = useQuery({ queryKey: ['kanban', 'tasks'], queryFn: … });
  const tagsQuery = useQuery({ queryKey: ['kanban', 'tags'], queryFn: … });
  // both start immediately — no await chaining
  const moveTask = useMutation({ … });
  return { … };
}
```

### Tasks

- [ ] **Step 1:** Unit tests for `group-tasks` and `isOverdue` (fail first).
- [ ] **Step 2:** Implement utils + `api/kanban.ts` list/patch.
- [ ] **Step 3:** Components + hook; wire BoardPage.
- [ ] **Step 4:** Component/hook tests for grouping and move mutation call.
- [ ] **Step 5:** Verify:

```bash
cd repos/kanban-dashboard
npm test
npm run lint
npm run typecheck
```

Expected: PASS.

## Testing

| Case | Expected |
|------|----------|
| `groupTasks([])` | Three empty arrays |
| Overdue pending task | `isOverdue` true |
| Drop to Finished | `patchTask` called with `FINISHED` |
| Parallel queries | Both queryFns registered without sequential await |

## Acceptance

- [ ] Three live columns from API data.
- [ ] HTML5 DnD + keyboard move without third-party DnD lib.
- [ ] Optimistic move with revert on error.
- [ ] Loading / empty / error states present.
- [ ] Card roles match functional 02.
- [ ] No within-column reorder.

## Playwright scenarios unlocked

- After create (09), card in Pending; drag/keyboard to In progress then Finished; reload still Finished.

## Impact

Fetching tags only after tasks resolve creates a waterfall — forbidden. Omitting keyboard move fails a11y and functional 02.
