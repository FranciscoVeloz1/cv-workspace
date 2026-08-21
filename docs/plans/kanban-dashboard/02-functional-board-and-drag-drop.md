# Board and drag-drop (functional)

**Tipo:** Functional  
**Depende de:** [`01-functional-domain-and-ownership.md`](01-functional-domain-and-ownership.md)  
**Implementa:** Behavioral rules for the three-column board: what appears on a card, how status changes via drop or keyboard, empty columns, sort order, and persistence after reload.  
**No incluye:** React components, HTML5 DnD APIs, endpoints, SQL, fixtures, or visual tokens.

## Resultado

A clear contract for “the board works”: three columns always present; cards show title, optional tag, optional deadline, and checklist progress; moving a card between columns updates status only; order within a column is by creation time descending; empty columns remain valid drop targets.

## Requirements

### Layout

1. The board always shows exactly three columns, left to right: **Pending**, **In progress**, **Finished**.
2. Each column lists only tasks whose status matches that column.
3. An empty column still renders (empty state + drop target). It is never omitted.

### Card contents (roles)

| Role | Shown when | Notes |
|------|------------|-------|
| **Task title** | Always | Primary text on the card |
| **Tag label** | Task has a tag | Name of the owner’s tag |
| **Deadline** | Task has a deadline | Calendar date; overdue is a display role only |
| **Checklist progress** | Checklist length ≥ 1 | Format `done/total` (e.g. `1/3`) |
| **Empty column** | No tasks in that status | Guide that cards can be dropped or created |

### Drag and drop

1. The owner can drag a card and drop it onto a **column** (including empty columns).
2. Dropping onto a column sets task status to that column’s status.
3. Dropping onto the same column is a no-op (status unchanged).
4. Within-column reorder is **out of scope**. Cards in a column sort by `createdAt` descending (newest first).
5. Status after a successful move must persist across full page reload.

### Keyboard move

1. Each card exposes accessible actions to move to each of the other two columns (e.g. “Move to In progress”, “Move to Finished”).
2. Keyboard move has the same persistence and status semantics as drag-and-drop.
3. Focus remains usable after move (no focus trap; card remains findable in the new column by title).

### Loading and failure (behavioral)

1. While board data is loading, the user sees a loading state, not a false empty board.
2. If board data fails to load, the user sees an error state with a way to retry (exact UI owned by UX/integration specs).
3. If a move fails after optimistic feedback, the card returns to its previous column.

## Architecture

Columns are a client-side grouping of a flat task list by `status`. Source of truth for status is the persisted task. Move = status update. Sort = `createdAt` desc, never a stored rank in v1.

```text
GET tasks (flat)
  → group by status
  → Pending | In progress | Finished
Move → update status → regroup
```

## Code to do

No application code here. Schema enum: [05](05-backend-database-and-migrations.md). `PATCH` status: [06](06-backend-kanban-module.md). Board UI: [08](08-frontend-board-and-drag-drop.md).

## Testing

Conceptual scenarios for later specs:

1. Three columns visible with zero tasks.
2. Create task → appears in Pending.
3. Move to In progress → still there after reload.
4. Move to Finished → still there after reload.
5. Keyboard move mirrors drag.

## Acceptance

- [ ] Exactly three fixed columns with English labels from [01](01-functional-domain-and-ownership.md).
- [ ] Card shows title; tag/deadline/checklist progress only when present.
- [ ] Drop on column changes status only; no within-column reorder.
- [ ] Empty column is a valid drop target.
- [ ] Status survives reload.
- [ ] Keyboard path exists for every card.

## Playwright scenarios unlocked

- Board shows three columns after login.
- Card appears in Pending after create (create owned by 03/09).
- Drag or keyboard move Pending → In progress → Finished; reload preserves Finished.
- Empty board after delete shows empty columns (delete owned by 03/09).

## Impact

Adding within-column reorder requires a `sortOrder` field and invalidates this sort rule. Using a DnD library is explicitly out of v1; HTML5 + keyboard are enough.
