# Tags (functional)

**Tipo:** Functional  
**Depende de:** [`01-functional-domain-and-ownership.md`](01-functional-domain-and-ownership.md)  
**Implementa:** Per-user tag catalog rules: create via modal, unique names, attach one tag to a task, delete tag leaves tasks untagged.  
**No incluye:** React components, HTTP paths, Prisma constraints syntax, color pickers, or multi-tag.

## Resultado

A contract for tags as a small personal vocabulary: each owner has a list of named tags; names are unique per owner; tasks may reference zero or one tag; deleting a tag does not delete tasks.

## Requirements

### Tag properties

1. A tag has a **name** (required, non-empty after trim).
2. Names are unique **per owner** (case-sensitive uniqueness as stored; UI should not encourage duplicates).
3. Tags have no color, icon, or description in v1.

### Create tag

1. A dedicated “Add tag” modal collects the name and saves.
2. Successful create makes the tag available in the task form tag select.
3. Duplicate name for the same owner is rejected with a clear validation/conflict message.
4. Cancel leaves the tag list unchanged.

### Attach to task

1. Task form offers an optional single-select of the owner’s tags (plus “none”).
2. A task never has more than one tag.
3. Changing or clearing the tag on edit updates the card’s tag label.

### Delete tag

1. Owner can delete a tag they own.
2. After delete, any tasks that referenced that tag become **untagged** (no tag label on cards).
3. Tasks themselves remain on the board with the same status.

### Isolation

1. Tag lists never include another user’s tags.
2. A task cannot be assigned a tag owned by another user (rejected as invalid).

## Architecture

Tags are a flat per-user list. Tasks hold an optional reference. Delete tag → clear references (SetNull semantics at persistence layer). No join table; no multi-tag.

```text
Owner → Tags
Task.tag? → Tag (same Owner)
Delete Tag → Task.tag = none
```

## Code to do

No application code here. Schema unique + SetNull: [05](05-backend-database-and-migrations.md). Tag API: [06](06-backend-kanban-module.md). Tag modal + select: [09](09-frontend-task-and-tag-modals.md). Card tag label: [08](08-frontend-board-and-drag-drop.md).

## Testing

Conceptual scenarios:

1. Create tag “Work” → appears in task form.
2. Create second “Work” → rejected.
3. Assign tag to task → card shows label.
4. Delete tag → task remains, label gone.
5. User B never sees User A’s tags.

## Acceptance

- [ ] Tags are per-user with unique names.
- [ ] Create via modal; optional single tag on tasks.
- [ ] Delete tag untags tasks without deleting them.
- [ ] No colors / multi-tag in v1.
- [ ] Cross-user tag attach is invalid.

## Playwright scenarios unlocked

- Create a tag in the tag modal before creating a task.
- Task form can select that tag.
- Isolation: User B’s board does not show User A’s tags or tagged cards (with [10](10-integration-e2e-and-runbook.md)).

## Impact

Adding tag colors or multi-tag requires schema and UI revision. Soft-delete of tags is not required; hard delete + SetNull is the v1 path.
