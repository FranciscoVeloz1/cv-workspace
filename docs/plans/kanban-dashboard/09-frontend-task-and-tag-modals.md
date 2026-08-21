# Frontend — Task and tag modals

**Tipo:** UX/UI  
**Depende de:** [`03-functional-tasks-and-checklist.md`](03-functional-tasks-and-checklist.md), [`04-functional-tags.md`](04-functional-tags.md), [`07-frontend-scaffold-auth-and-shell.md`](07-frontend-scaffold-auth-and-shell.md), [`08-frontend-board-and-drag-drop.md`](08-frontend-board-and-drag-drop.md), [`06-backend-kanban-module.md`](06-backend-kanban-module.md)  
**Implementa:** `TaskFormDialog`, `TagFormDialog`, `ConfirmDialog`; create/edit/delete mutations; tag select on task form; wire card click and board “Add” actions.  
**No incluye:** Playwright suite (10), board DnD (already 08), tag colors.

## Resultado

Users can create tags, create tasks (title, description, optional tag/deadline/checklist), edit by opening a card, toggle checklist items via edit save, and delete tasks after confirm. Mutations invalidate TanStack Query keys and update the board.

## Requirements

### TagFormDialog

1. Fields: name (required).
2. Submit → `POST /api/v1/kanban/tags`; invalidate `['kanban','tags']`.
3. Show API validation/conflict errors on the name field.
4. Accessible dialog: `role="dialog"`, labelled title “Add tag”, Escape closes, focus trap or return focus to opener.

### TaskFormDialog

1. Modes: **create** and **edit** (same component).
2. Fields: title, description, tag select (none + owner tags), deadline (`type="date"`), checklist editor (add row, remove row, checkbox done).
3. Create → `POST /api/v1/kanban/tasks`; edit → `PATCH …/tasks/:id`.
4. Delete control in edit mode opens ConfirmDialog; confirm → `DELETE …/tasks/:id`.
5. Invalidate `['kanban','tags']` only when tags change; always invalidate `['kanban','tasks']` after task mutations.
6. Client-side required checks for title/description before submit; map 422 to fields when possible.

### ConfirmDialog

Reusable: title, message, confirm (danger), cancel. Used for task delete (and optionally tag delete if exposed).

### Entry points

| Control | Action |
|---------|--------|
| “Add tag” in shell or board header | Open TagFormDialog |
| “Add task” | Open TaskFormDialog create |
| Activate card | Open TaskFormDialog edit |

### Content roles

- Dialog title, primary save, cancel, delete.
- Field errors, submit loading (disabled save while pending).
- Checklist empty hint.

## Architecture

```text
AppShell / BoardPage
  → TagFormDialog
  → TaskFormDialog → ConfirmDialog
  → useMutation → api/kanban.ts → invalidate queries
```

Persona: **frontend-developer** — dialog a11y, form states, braces.

## Code to do

### Files

```text
repos/kanban-dashboard/src/
  components/forms/TaskFormDialog/index.tsx
  components/forms/TaskFormDialog/TaskFormDialog.module.css
  components/forms/TaskFormDialog/TaskFormDialog.test.tsx
  components/forms/TagFormDialog/index.tsx
  components/forms/TagFormDialog/TagFormDialog.module.css
  components/forms/TagFormDialog/TagFormDialog.test.tsx
  components/forms/ConfirmDialog/index.tsx
  components/forms/ConfirmDialog/ConfirmDialog.module.css
  api/kanban.ts   # createTag, deleteTag?, createTask, patchTask, deleteTask
  pages/BoardPage/index.tsx  # wire dialogs + card onOpen
  components/layout/AppShell/index.tsx  # Add tag / Add task buttons if placed here
```

### API additions

```ts
export async function createTag(http: HttpClient, body: { name: string }) { … }
export async function createTask(http: HttpClient, body: CreateTaskBody) { … }
export async function deleteTask(http: HttpClient, taskId: string) { … }
// deleteTag optional in UI v1; if exposed, call DELETE /tags/:id and invalidate both keys
```

### Checklist editor UX

- “Add item” appends `{ id: crypto.randomUUID(), text: '', done: false }` locally; block submit if any item has empty text.
- Remove button per row.
- Done checkbox toggles local state; persisted on Save.

### Tasks

- [ ] **Step 1:** Failing tests for TaskFormDialog validation (empty title) and ConfirmDialog confirm callback.
- [ ] **Step 2:** Implement dialogs + API methods.
- [ ] **Step 3:** Wire BoardPage / AppShell entry points; card opens edit.
- [ ] **Step 4:** Verify:

```bash
cd repos/kanban-dashboard
npm test
npm run lint
npm run typecheck
npm run build
```

Expected: PASS.

## Testing

| Case | Expected |
|------|----------|
| Submit create with empty title | No POST; field error |
| Create tag then open task form | Tag in select |
| Edit save | PATCH called; dialog closes |
| Confirm delete | DELETE called; card gone after invalidate |
| Cancel confirm | No DELETE |

## Acceptance

- [ ] Tag and task modals match functional 03–04 fields.
- [ ] Same dialog for create and edit.
- [ ] Delete requires confirm.
- [ ] Query invalidation keeps board in sync.
- [ ] Accessible dialog names and focus behavior.
- [ ] No multi-tag or color UI.

## Playwright scenarios unlocked

- Create tag → create task with all optional fields → card shows roles.
- Edit title; toggle checklist via edit; delete task; empty board.
- Full happy path assembly in [10](10-integration-e2e-and-runbook.md).

## Impact

Autosaving every checklist toggle without Save increases API chatter — v1 saves on dialog submit only. Skipping ConfirmDialog for delete risks accidental loss.
