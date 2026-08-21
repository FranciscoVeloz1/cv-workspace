# Backend — Database and migrations

**Tipo:** Backend  
**Depende de:** [`01-functional-domain-and-ownership.md`](01-functional-domain-and-ownership.md), [`02-functional-board-and-drag-drop.md`](02-functional-board-and-drag-drop.md), [`03-functional-tasks-and-checklist.md`](03-functional-tasks-and-checklist.md), [`04-functional-tags.md`](04-functional-tags.md)  
**Implementa:** Prisma models `KanbanTag` and `KanbanTask`, enum `KanbanTaskStatus`, relations on `User`, append-only migration, schema smoke tests, and test cleanup order in `repos/personal-api`.  
**No incluye:** HTTP routes, Zod request schemas, SPA, fixtures with login emails for E2E, or commits unless requested.

## Resultado

PostgreSQL stores per-user tags and tasks with cascade on user delete, SetNull on tag delete, unique tag names per user, and checklist as JSON. Prisma client exposes the models. A smoke integration test proves create/read/cascade/SetNull.

## Requirements

- Models match functional vocabulary from specs 01–04.
- `checklist` defaults to `[]` when omitted at insert time (application or DB default).
- `deadline` is optional date-only (UTC midnight of `YYYY-MM-DD`).
- Indexes support listing by `(userId, status)`.
- No `Application` / permission tables for kanban.

## Architecture

```text
User 1─* KanbanTag
User 1─* KanbanTask
KanbanTag 0─* KanbanTask (optional FK, onDelete SetNull)
KanbanTask.checklist : Json (ChecklistItem[])
```

Persona: implement as **backend-developer** (Prisma only in this spec; thin module comes in 06).

## Code to do

### Files

- Modify: `repos/personal-api/prisma/schema.prisma`
- Create: `repos/personal-api/prisma/migrations/<timestamp>_add_kanban_tables/migration.sql`
- Create: `repos/personal-api/tests/integration/kanban-schema.test.ts`
- Modify: `repos/personal-api/tests/helpers/setup.ts` — delete kanban rows before users (tasks then tags)

### Data contract

Add to `schema.prisma`:

```prisma
enum KanbanTaskStatus {
  PENDING
  IN_PROGRESS
  FINISHED
}

model KanbanTag {
  id        String       @id @default(uuid())
  userId    String
  name      String
  createdAt DateTime     @default(now())
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks     KanbanTask[]

  @@unique([userId, name])
  @@index([userId])
}

model KanbanTask {
  id          String           @id @default(uuid())
  userId      String
  title       String
  description String
  status      KanbanTaskStatus @default(PENDING)
  tagId       String?
  deadline    DateTime?
  checklist   Json
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  tag         KanbanTag?       @relation(fields: [tagId], references: [id], onDelete: SetNull)

  @@index([userId, status])
}
```

On `User`, add:

```prisma
kanbanTags  KanbanTag[]
kanbanTasks KanbanTask[]
```

Checklist JSON shape (enforced in spec 06 Zod, not SQL):

```ts
type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};
```

### Tasks

#### Task 1: Write failing schema smoke test

- [ ] **Step 1: Create** `repos/personal-api/tests/integration/kanban-schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getPrisma } from '../../src/db/client.js';
import { createUserWithPermission } from '../helpers/user-fixtures.js';

describe('kanban schema', () => {
  it('persists a tag and task for a user', async () => {
    const prisma = getPrisma();
    const user = await createUserWithPermission({
      email: 'kanban-schema@example.com',
      password: 'password123',
      name: 'Kanban Schema',
      role: 'READ_ONLY'
    });

    const tag = await prisma.kanbanTag.create({
      data: { userId: user.id, name: 'Work' }
    });

    const task = await prisma.kanbanTask.create({
      data: {
        userId: user.id,
        title: 'Ship specs',
        description: 'Write kanban catalog',
        status: 'PENDING',
        tagId: tag.id,
        deadline: new Date('2026-08-21T00:00:00.000Z'),
        checklist: [{ id: 'c1', text: 'Draft README', done: true }]
      }
    });

    expect(task.status).toBe('PENDING');
    expect(task.tagId).toBe(tag.id);
    expect(Array.isArray(task.checklist)).toBe(true);
  });

  it('cascades kanban rows when the user is deleted', async () => {
    const prisma = getPrisma();
    const user = await createUserWithPermission({
      email: 'kanban-cascade@example.com',
      password: 'password123',
      name: 'Kanban Cascade',
      role: 'READ_ONLY'
    });

    await prisma.kanbanTag.create({
      data: { userId: user.id, name: 'Temp' }
    });
    await prisma.kanbanTask.create({
      data: {
        userId: user.id,
        title: 'Temp',
        description: 'x',
        checklist: []
      }
    });

    await prisma.user.delete({ where: { id: user.id } });

    expect(await prisma.kanbanTag.count({ where: { userId: user.id } })).toBe(0);
    expect(await prisma.kanbanTask.count({ where: { userId: user.id } })).toBe(0);
  });

  it('setNulls task.tagId when tag is deleted', async () => {
    const prisma = getPrisma();
    const user = await createUserWithPermission({
      email: 'kanban-setnull@example.com',
      password: 'password123',
      name: 'Kanban SetNull',
      role: 'READ_ONLY'
    });

    const tag = await prisma.kanbanTag.create({
      data: { userId: user.id, name: 'SoonGone' }
    });
    const task = await prisma.kanbanTask.create({
      data: {
        userId: user.id,
        title: 'Keep me',
        description: 'untagged after',
        tagId: tag.id,
        checklist: []
      }
    });

    await prisma.kanbanTag.delete({ where: { id: tag.id } });

    const reloaded = await prisma.kanbanTask.findUniqueOrThrow({
      where: { id: task.id }
    });
    expect(reloaded.tagId).toBeNull();
  });

  it('rejects duplicate tag names for the same user', async () => {
    const prisma = getPrisma();
    const user = await createUserWithPermission({
      email: 'kanban-dup-tag@example.com',
      password: 'password123',
      name: 'Kanban Dup',
      role: 'READ_ONLY'
    });

    await prisma.kanbanTag.create({
      data: { userId: user.id, name: 'Work' }
    });

    await expect(
      prisma.kanbanTag.create({
        data: { userId: user.id, name: 'Work' }
      })
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run and confirm fail**

```bash
cd repos/personal-api
npm run test:integration -- kanban-schema.test.ts
```

Expected: FAIL — `kanbanTag` / `kanbanTask` missing on Prisma client.

#### Task 2: Schema + migration

- [ ] **Step 1:** Edit `prisma/schema.prisma` with the models above.
- [ ] **Step 2:** Create migration (do not use `db push` for the deliverable):

```bash
npm run db:migrate -- --name add_kanban_tables
```

Inspect SQL: tables, enum, `ON DELETE CASCADE` for user FKs, `ON DELETE SET NULL` for `tagId`, unique `(userId, name)`, index `(userId, status)`.

- [ ] **Step 3:** Update `tests/helpers/setup.ts` cleanup **before** `user.deleteMany()`:

```ts
await prisma.kanbanTask.deleteMany();
await prisma.kanbanTag.deleteMany();
```

- [ ] **Step 4:** Regenerate and pass tests:

```bash
npx prisma generate
npm run test:integration -- kanban-schema.test.ts
```

Expected: PASS.

#### Task 3: Commit (only if user asked)

```bash
git add prisma/schema.prisma prisma/migrations tests/integration/kanban-schema.test.ts tests/helpers/setup.ts
git commit -m "$(cat <<'EOF'
feat: add kanban tag and task tables

EOF
)"
```

## Testing

| Command | Expected |
|---------|----------|
| `npm run test:integration -- kanban-schema.test.ts` | PASS after migration |
| Duplicate `(userId, name)` | DB unique violation |
| Delete user | Zero leftover kanban rows |
| Delete tag | Task remains; `tagId` null |

## Acceptance

- [ ] Models and enum match the data contract.
- [ ] Migration is append-only and reviewable.
- [ ] Smoke tests cover persist, cascade, SetNull, unique name.
- [ ] Cleanup order includes kanban tables.

## Playwright scenarios unlocked

None directly. Enables API module ([06](06-backend-kanban-module.md)) which E2E depends on.

## Impact

Changing checklist to a child table breaks this JSON contract. Using `Float` or string status without enum breaks type safety. Existing empty stub files under `src/modules/kanban/` are irrelevant until spec 06; do not put schema logic there.
