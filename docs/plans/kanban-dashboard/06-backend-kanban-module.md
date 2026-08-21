# Backend — Kanban API module

**Tipo:** Backend  
**Depende de:** [`05-backend-database-and-migrations.md`](05-backend-database-and-migrations.md), [`01-functional-domain-and-ownership.md`](01-functional-domain-and-ownership.md)–[`04-functional-tags.md`](04-functional-tags.md), [`repos/personal-api/src/modules/_template/README.md`](../../../repos/personal-api/src/modules/_template/README.md)  
**Implementa:** Vertical module `src/modules/kanban/` in `repos/personal-api`, mount at `/api/v1/kanban`, Zod validation, ownership via `req.user.id`, integration tests.  
**No incluye:** SPA, Playwright, Prisma model design (owned by 05), public registration, Application permissions.

## Resultado

Authenticated clients can CRUD their own tags and tasks under `/api/v1/kanban`. Controllers are thin; repository always filters by `userId`; foreign ids belonging to other users return 404; validation failures return 422; missing token returns 401. Replace or rewrite any empty stubs in `src/modules/kanban/` and ensure `src/routes/v1/index.ts` mounts the real router.

## Requirements

- Every route uses `authenticate`.
- Owner id is always `req.user.id` (finance `requireUserId` pattern), not URL `:userId`.
- List endpoints return only the caller’s rows.
- Create task defaults `status` to `PENDING` and `checklist` to `[]` when omitted.
- `tagId` on create/patch must reference a tag owned by the same user or fail validation (422).
- Delete tag returns 204 and tasks lose the tag (DB SetNull).
- Response shapes are stable for the SPA (spec 07–09).

## Architecture

```text
routes → controller (asyncHandler) → service → repository (Prisma)
              ↑
         Zod validate middleware
```

Mount:

```ts
v1Router.use('/kanban', kanbanRouter);
```

Persona: **backend-developer** — Zod + `z.infer`, thin controllers, typed domain errors, braces, change-impact.

## Code to do

### Files

```text
repos/personal-api/src/modules/kanban/
  kanban.schemas.ts
  kanban.repository.ts
  kanban.service.ts
  kanban.controller.ts
  kanban.routes.ts
  kanban.errors.ts
```

- Modify: `repos/personal-api/src/routes/v1/index.ts`
- Test: `repos/personal-api/tests/integration/kanban.test.ts`

### API contract

Base: `/api/v1/kanban`  
Auth header: `Authorization: Bearer <accessToken>`

| Method | Path | Purpose | Success |
|--------|------|---------|---------|
| GET | `/tags` | List own tags | 200 `{ tags: Tag[] }` |
| POST | `/tags` | Create tag | 201 `{ tag: Tag }` |
| DELETE | `/tags/:tagId` | Delete own tag | 204 |
| GET | `/tasks` | List own tasks (flat, newest first) | 200 `{ tasks: Task[] }` |
| POST | `/tasks` | Create task | 201 `{ task: Task }` |
| GET | `/tasks/:taskId` | Get one own task | 200 `{ task: Task }` |
| PATCH | `/tasks/:taskId` | Partial update | 200 `{ task: Task }` |
| DELETE | `/tasks/:taskId` | Delete own task | 204 |

#### Tag

```ts
type Tag = {
  id: string;
  name: string;
  createdAt: string; // ISO
};
```

POST body:

```ts
{ name: string } // trim, min 1, max 64
```

#### Task

```ts
type ChecklistItem = {
  id: string; // uuid
  text: string;
  done: boolean;
};

type Task = {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
  tagId: string | null;
  tag: { id: string; name: string } | null;
  deadline: string | null; // YYYY-MM-DD
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
};
```

POST body:

```ts
{
  title: string;
  description: string;
  tagId?: string | null;
  deadline?: string | null; // YYYY-MM-DD
  checklist?: Array<{ id?: string; text: string; done?: boolean }>;
}
```

PATCH body (all optional; at least one field required):

```ts
{
  title?: string;
  description?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
  tagId?: string | null;
  deadline?: string | null;
  checklist?: ChecklistItem[];
}
```

On create, if checklist items omit `id`, the service assigns UUIDs. Default `done: false`.

#### Errors

| Condition | Status | Notes |
|-----------|--------|-------|
| No/invalid access token | 401 | Existing auth middleware |
| Validation failure | 422 | Field errors via existing validate middleware |
| Tag/task not found or other user | 404 | Same message as missing |
| Duplicate tag name for user | 409 or 422 | Prefer map unique violation to conflict/validation consistently with other modules |

### Zod sketches (`kanban.schemas.ts`)

```ts
import { z } from 'zod';

export const kanbanTaskStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'FINISHED']);

export const checklistItemSchema = z.object({
  id: z.string().uuid(),
  text: z.string().trim().min(1).max(500),
  done: z.boolean()
});

export const createTagBodySchema = z.object({
  name: z.string().trim().min(1).max(64)
});

export const createTaskBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  tagId: z.string().uuid().nullable().optional(),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  checklist: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        text: z.string().trim().min(1).max(500),
        done: z.boolean().optional()
      })
    )
    .optional()
});

export const patchTaskBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(5000).optional(),
    status: kanbanTaskStatusSchema.optional(),
    tagId: z.string().uuid().nullable().optional(),
    deadline: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
    checklist: z.array(checklistItemSchema).optional()
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field is required'
  });

export type CreateTagBody = z.infer<typeof createTagBodySchema>;
export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;
export type PatchTaskBody = z.infer<typeof patchTaskBodySchema>;
```

### Controller ownership helper

```ts
function requireUserId(req: Request): string {
  if (!req.user) {
    throw new UnauthorizedError('Missing access token');
  }
  return req.user.id;
}
```

### Routes sketch

```ts
export const kanbanRouter = Router();
kanbanRouter.use(authenticate);

kanbanRouter.get('/tags', kanbanController.listTags);
kanbanRouter.post('/tags', validateBody(createTagBodySchema), kanbanController.createTag);
kanbanRouter.delete('/tags/:tagId', validateParams(tagIdParamSchema), kanbanController.deleteTag);

kanbanRouter.get('/tasks', kanbanController.listTasks);
kanbanRouter.post('/tasks', validateBody(createTaskBodySchema), kanbanController.createTask);
kanbanRouter.get('/tasks/:taskId', validateParams(taskIdParamSchema), kanbanController.getTask);
kanbanRouter.patch(
  '/tasks/:taskId',
  validateParams(taskIdParamSchema),
  validateBody(patchTaskBodySchema),
  kanbanController.patchTask
);
kanbanRouter.delete('/tasks/:taskId', validateParams(taskIdParamSchema), kanbanController.deleteTask);
```

### Tasks

#### Task 1: Failing integration tests

- [ ] **Step 1: Create** `tests/integration/kanban.test.ts` covering at least:

1. Unauthenticated GET `/api/v1/kanban/tasks` → 401.
2. User A creates tag + task → 201; list returns them.
3. PATCH status `IN_PROGRESS` → 200; GET shows new status.
4. User B with A’s `taskId` GET/PATCH/DELETE → 404.
5. User B cannot use A’s `tagId` on create task → 422.
6. Duplicate tag name → 409 or 422.
7. DELETE tag → 204; A’s task still listed with `tagId: null`.
8. POST task without title → 422.

- [ ] **Step 2: Run**

```bash
cd repos/personal-api
npm run test:integration -- kanban.test.ts
```

Expected: FAIL until module is implemented (or FAIL on missing routes).

#### Task 2: Implement module

- [ ] Implement schemas → repository → service → controller → routes.
- [ ] Map deadline `YYYY-MM-DD` ↔ `Date` at UTC midnight in service/repository.
- [ ] Include `tag: { id, name } | null` on task responses (join or second query).
- [ ] Order `listTasks` by `createdAt` desc.
- [ ] Mount in `v1/index.ts`.

#### Task 3: Pass tests

```bash
npm run test:integration -- kanban.test.ts
npm run lint
npm run build
```

Expected: PASS.

## Testing

| Case | Expected |
|------|----------|
| No Bearer | 401 |
| Cross-user id | 404 |
| Invalid body | 422 |
| Happy CRUD tags/tasks | 2xx as table |
| Isolation A/B | B never sees A’s rows in list |

## Acceptance

- [ ] All routes in the contract exist and are authenticated.
- [ ] Ownership filter on every repository call.
- [ ] Zod types via `z.infer` (no duplicate interfaces).
- [ ] Integration tests include A/B isolation and 401/422.
- [ ] Stubs replaced; `v1/index.ts` mounts working router.

## Playwright scenarios unlocked

- Login then API-backed board reads/writes (specs 07–10).
- Isolation login as B after A’s mutations ([10](10-integration-e2e-and-runbook.md)).

## Impact

Mounting under `/users/:userId/kanban` would diverge from finance-style SPA clients and this contract — do not. Logging other-user existence via 403 would weaken privacy; keep 404.
