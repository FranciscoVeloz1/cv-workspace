# Tasks and checklist (functional)

**Tipo:** Functional  
**Depende de:** [`01-functional-domain-and-ownership.md`](01-functional-domain-and-ownership.md)  
**Implementa:** Rules for creating, editing, and deleting tasks; modal fields; checklist behavior; deadline rules.  
**No incluye:** React dialogs, Zod schemas, Prisma JSON shape details beyond conceptual checklist items, HTTP paths, or fixtures.

## Resultado

A contract for the task lifecycle: required title and description; optional single tag, deadline, and checklist; same modal for create and edit; delete requires confirmation; checklist items can be added, removed, and toggled; card shows checklist progress when items exist.

## Requirements

### Create task

1. Opening “Add task” presents a modal with fields:
   - **Title** — required, non-empty after trim.
   - **Description** — required, minimum length 1 after trim.
   - **Tag** — optional; choose from the owner’s tags or leave unset.
   - **Deadline** — optional; calendar date `YYYY-MM-DD` or empty.
   - **Checklist** — optional; zero or more items, each with text (required when present) and done flag (default false).
2. Successful create places the task in **Pending**.
3. Cancel / dismiss without save leaves the board unchanged.
4. Invalid submit does not create a task; field-level errors are shown for title/description (and for checklist item text if empty when added).

### Edit task

1. Activating a card (click / keyboard) opens the **same** modal prefilled with current values.
2. Saving updates the task; column membership follows current status (edit does not force Pending unless status is edited via board move).
3. Changing tag, deadline, or checklist updates what the card shows after save.

### Delete task

1. Delete is available from the edit modal (or equivalent explicit control).
2. Delete requires a confirmation step (“confirm delete”).
3. Confirmed delete removes the card from the board permanently for that owner.

### Checklist

1. A checklist item is `{ text, done }` conceptually; persistence assigns a stable `id` per item.
2. Owner can add an item, remove an item, and toggle `done`.
3. Card progress role: `count(done) / count(all)` when `all ≥ 1`.
4. Empty checklist: no progress role on the card.

### Deadline

1. Stored and displayed as calendar date `YYYY-MM-DD` (no timezone shift in product meaning).
2. If deadline is before “today” (local calendar of the viewer) and status is not Finished, the card may show an **overdue** display role. Overdue does **not** auto-move status.
3. Clearing deadline is allowed on edit.

### Validation summary

| Field | Rule |
|-------|------|
| Title | Required, trim, length ≥ 1 |
| Description | Required, trim, length ≥ 1 |
| Tag | Optional; if set, must be an existing tag of the same owner |
| Deadline | Optional; if set, must be valid `YYYY-MM-DD` |
| Checklist item text | Required when the item exists; trim length ≥ 1 |

## Architecture

Task is the aggregate root for checklist and optional tag reference. Modal is the only create/edit surface in v1. Board move (spec 02) is the primary status change path; edit modal may leave status unchanged.

## Code to do

No application code here. Persistence of checklist JSON and dates: [05](05-backend-database-and-migrations.md). Task CRUD API: [06](06-backend-kanban-module.md). Modals UI: [09](09-frontend-task-and-tag-modals.md). Card display: [08](08-frontend-board-and-drag-drop.md).

## Testing

Conceptual scenarios:

1. Create with only title + description → Pending card.
2. Create with tag, deadline, one checklist item → card shows all three roles.
3. Edit title → card updates.
4. Toggle checklist → progress updates.
5. Delete with confirm → card gone; cancel confirm → card remains.
6. Reject create with empty title.

## Acceptance

- [ ] Create modal fields match the list above.
- [ ] Same modal for edit; delete requires confirm.
- [ ] New tasks start Pending.
- [ ] Checklist add/remove/toggle and progress rules hold.
- [ ] Deadline is calendar-only; overdue is display-only.
- [ ] Tag is at most one and optional.

## Playwright scenarios unlocked

- Create tag then create task with title, description, tag, deadline, one checklist item.
- Card in Pending shows tag, deadline, checklist progress.
- Edit title; toggle checklist; delete task; board empty again.

## Impact

Splitting checklist into a child table would change schema and API. Auto-finishing on overdue would contradict this spec — do not add without revising 01–02.
