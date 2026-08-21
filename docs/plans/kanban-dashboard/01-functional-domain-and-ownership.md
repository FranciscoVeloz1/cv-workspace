# Domain and ownership

**Tipo:** Functional  
**Depende de:** [`README.md`](README.md), [`repos/personal-api/README.md`](../../../repos/personal-api/README.md)  
**Implementa:** Shared vocabulary, ownership/isolation rules, status enum mapping, and out-of-scope list that every later kanban spec must obey.  
**No incluye:** Endpoints, SQL, Prisma, React, Express, components, fixtures, visual design, or HTTP contracts.

## Resultado

A single functional contract defining what Board, Column, Card/Task, Tag, Checklist item, Deadline, and Owner mean; who owns data; how the three columns map to status; and what “optional” means. Later specs resolve ambiguity by referring here.

## Requirements

### Vocabulary

| Term | Definition |
|------|------------|
| **Board** | The authenticated user’s personal kanban view: exactly three columns. One board per user; no named boards. |
| **Column** | A fixed status lane: Pending, In progress, or Finished. Columns are not user-created entities. |
| **Card / Task** | A work item shown as a card in one column. Same entity; “card” is the UI surface, “task” is the domain record. |
| **Tag** | An optional label owned by the same user, attached to at most one tag per task. |
| **Checklist item** | A sub-step of a task: text plus done flag. Lives on the task, not as a separate owned resource. |
| **Deadline** | Optional calendar date (`YYYY-MM-DD`) for when the task should be done. Display-only overdue styling; no auto-status change. |
| **Owner** | The authenticated user who created the tag or task. Sole reader and writer of that row. |

### Status enum mapping

| Status value | Column label |
|--------------|--------------|
| `PENDING` | Pending |
| `IN_PROGRESS` | In progress |
| `FINISHED` | Finished |

New tasks start in `PENDING`. Status changes only when the owner moves the card (drag/drop or keyboard) or explicitly edits status via the task form if exposed; the primary path is column move.

### Ownership and privacy

1. Every tag and every task belongs to **exactly one** user (`userId`).
2. No read or write may access another user’s tags or tasks, even if the caller has global `ADMIN`.
3. Users are **provisioned by an administrator** (existing `POST /api/v1/users` + seed admin). Public registration and password recovery are out of product scope for this plan.
4. Deleting a user cascades delete of that user’s tags and tasks (persistence rule owned by schema/API specs).
5. Deleting a tag must not delete tasks; tasks become untagged.

### Optional fields

| Field | Optional means |
|-------|----------------|
| Tag | Task may have zero or one tag. |
| Deadline | Task may omit a date; null/absent is valid. |
| Checklist | Task may have an empty list; empty is equivalent to “no checklist content.” |

Title and description are **required** (non-empty after trim). Description minimum length is 1 character.

### Isolation scenarios (conceptual)

- User A’s board never shows User B’s cards or tags.
- Looking up a foreign task/tag id behaves as “not found,” not “forbidden with leak.”
- Logging out ends access to the board; unauthenticated callers cannot list or mutate.

### Out of scope (v1)

Teams, sharing, comments, attachments, assignees, custom columns, multiple boards, tag colors, multi-tag, public registration, offline write queue, within-column reorder, third-party drag libraries.

## Architecture

Conceptual only: one Owner → many Tags; one Owner → many Tasks; Task optionally references one Tag; Task embeds zero or more Checklist items. Columns are a projection of task status, not stored column rows.

```text
Owner
  ├── Tags (name unique per owner)
  └── Tasks (status ∈ {PENDING, IN_PROGRESS, FINISHED})
        ├── optional Tag ref
        ├── optional Deadline
        └── Checklist items (embedded)
```

## Code to do

No application code in this spec. Persistence: [05](05-backend-database-and-migrations.md). HTTP: [06](06-backend-kanban-module.md). SPA shell: [07](07-frontend-scaffold-auth-and-shell.md). Board UX: [08](08-frontend-board-and-drag-drop.md). Modals: [09](09-frontend-task-and-tag-modals.md). E2E: [10](10-integration-e2e-and-runbook.md).

## Testing

No executable tests. Acceptance is documentary: later specs cite this vocabulary and do not contradict ownership or column mapping.

## Acceptance

- [ ] Status ↔ column labels match the table above.
- [ ] Ownership rules forbid cross-user access for global ADMIN.
- [ ] Optional tag/deadline/checklist meanings are explicit.
- [ ] Out-of-scope list matches the README fixed decisions.

## Playwright scenarios unlocked

None directly. Isolation and admin-provisioned login are prerequisites for scenarios in [10](10-integration-e2e-and-runbook.md).

## Impact

Changing ownership to allow ADMIN cross-read would invalidate API tests and E2E isolation. Adding custom columns would invalidate board and schema specs. Keep this document as the single vocabulary source.
