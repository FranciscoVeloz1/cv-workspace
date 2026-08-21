# Integration — E2E and runbook

**Tipo:** Integration  
**Depende de:** [`06-backend-kanban-module.md`](06-backend-kanban-module.md), [`07-frontend-scaffold-auth-and-shell.md`](07-frontend-scaffold-auth-and-shell.md), [`08-frontend-board-and-drag-drop.md`](08-frontend-board-and-drag-drop.md), [`09-frontend-task-and-tag-modals.md`](09-frontend-task-and-tag-modals.md), [`e2e-local-runbook.md`](e2e-local-runbook.md)  
**Implementa:** Playwright happy-path spec in `repos/kanban-dashboard/e2e/kanban-happy-path.spec.ts`, `npm run test:e2e` script, CORS/env documentation, and the local runbook.  
**No incluye:** Production deploy, CI GitHub Actions wiring (optional follow-up), redesign of board UX.

## Resultado

A developer can start Postgres + `personal-api` + `kanban-dashboard`, provision admin and users A/B, run Playwright, and verify: login, tag create, task create with optionals, column moves with reload persistence, edit/checklist/delete, isolation for user B, and unauthenticated redirect.

## Requirements

1. Committed Playwright test uses `getByRole` / accessible names — not CSS class selectors.
2. Two users: A (full happy path) and B (isolation only).
3. Runbook documents exact env vars, ports, seed, and cleanup.
4. `playwright-cli` may be used for exploration; the committed `*.spec.ts` is the source of truth.

## Architecture

```text
┌──────────────────┐   CORS + JWT   ┌──────────────────┐
│ kanban-dashboard │ ─────────────► │ personal-api     │
│ :5173            │                │ :3000            │
└──────────────────┘                └────────┬─────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │ PostgreSQL :5432 │
                                    └──────────────────┘
```

## Code to do

### Files

- Create: `repos/kanban-dashboard/e2e/kanban-happy-path.spec.ts`
- Create: `repos/kanban-dashboard/playwright.config.ts`
- Modify: `repos/kanban-dashboard/package.json` — `"test:e2e": "playwright test e2e/kanban-happy-path.spec.ts"`
- Modify: `repos/personal-api/.env.example` — document `CORS_ORIGINS` including SPA origin
- Confirm: `repos/kanban-dashboard/.env.example` has `VITE_API_BASE_URL=http://localhost:3000`
- Finalize: `docs/plans/kanban-dashboard/e2e-local-runbook.md`

### Fixture users (concrete — integration lane only)

| Variable | Value |
|----------|-------|
| `ADMIN_EMAIL` | `admin@example.com` |
| `ADMIN_PASSWORD` | local admin password (≥8 chars as required by API) |
| `ADMIN_NAME` | `Initial Admin` |
| `KANBAN_USER_A_EMAIL` | `kanban.a@example.com` |
| `KANBAN_USER_A_PASSWORD` | `KanbanTest1!` |
| `KANBAN_USER_A_NAME` | `Kanban User A` |
| `KANBAN_USER_B_EMAIL` | `kanban.b@example.com` |
| `KANBAN_USER_B_PASSWORD` | `KanbanTest2!` |
| `KANBAN_USER_B_NAME` | `Kanban User B` |

User UUIDs are **runtime** from login → `/api/v1/auth/me`. Do not hardcode user ids in the registry.

Create users via admin JWT:

```bash
# After seed-admin and admin login → ACCESS token
curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"kanban.a@example.com",
    "name":"Kanban User A",
    "password":"KanbanTest1!",
    "role":"READ_ONLY"
  }'
```

Repeat for user B with B credentials. If `409`, login with fixture password and verify email/name; do not auto-delete.

### Playwright flow (must implement)

```ts
import { test, expect } from '@playwright/test';

test.describe('kanban happy path', () => {
  test('A: tag, task, move, edit, delete; B: isolation; guest redirect', async ({ page }) => {
    // 1. Unauthenticated
    await page.goto('/');
    await expect(page).toHaveURL(/login/);

    // 2. Login as A
    await page.getByLabel(/email/i).fill('kanban.a@example.com');
    await page.getByLabel(/password/i).fill('KanbanTest1!');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page.getByRole('region', { name: /pending/i })).toBeVisible();

    // 3. Create tag
    await page.getByRole('button', { name: /add tag/i }).click();
    await page.getByRole('dialog', { name: /add tag/i }).getByLabel(/name/i).fill('Work');
    await page.getByRole('button', { name: /save|create/i }).click();

    // 4. Create task with optionals
    await page.getByRole('button', { name: /add task/i }).click();
    const taskDialog = page.getByRole('dialog', { name: /add task|new task/i });
    await taskDialog.getByLabel(/title/i).fill('Write specs');
    await taskDialog.getByLabel(/description/i).fill('Kanban catalog');
    await taskDialog.getByLabel(/tag/i).selectOption({ label: 'Work' });
    await taskDialog.getByLabel(/deadline/i).fill('2026-08-25');
    await taskDialog.getByRole('button', { name: /add item|add checklist/i }).click();
    await taskDialog.getByLabel(/checklist|item/i).first().fill('Draft README');
    await taskDialog.getByRole('button', { name: /save|create/i }).click();

    // 5. Card in Pending
    const pending = page.getByRole('region', { name: /pending/i });
    await expect(pending.getByText('Write specs')).toBeVisible();
    await expect(pending.getByText('Work')).toBeVisible();

    // 6. Move to In progress then Finished (keyboard preferred for stability)
    const card = pending.getByRole('button', { name: /write specs/i });
    await card.getByRole('button', { name: /move to in progress/i }).click();
    await expect(page.getByRole('region', { name: /in progress/i }).getByText('Write specs')).toBeVisible();
    await page
      .getByRole('region', { name: /in progress/i })
      .getByRole('button', { name: /write specs/i })
      .getByRole('button', { name: /move to finished/i })
      .click();
    await expect(page.getByRole('region', { name: /finished/i }).getByText('Write specs')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('region', { name: /finished/i }).getByText('Write specs')).toBeVisible();

    // 7. Edit + checklist + delete
    await page.getByRole('region', { name: /finished/i }).getByText('Write specs').click();
    const editDialog = page.getByRole('dialog', { name: /edit task/i });
    await editDialog.getByLabel(/title/i).fill('Write specs v2');
    await editDialog.getByRole('checkbox').first().check();
    await editDialog.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Write specs v2')).toBeVisible();

    await page.getByText('Write specs v2').click();
    await page.getByRole('dialog').getByRole('button', { name: /delete/i }).click();
    await page.getByRole('dialog', { name: /confirm/i }).getByRole('button', { name: /delete|confirm/i }).click();
    await expect(page.getByText('Write specs v2')).toHaveCount(0);

    // 8. Isolation as B — seed one task for A via API before this step OR recreate briefly:
    // Prefer API seed of A's task then login B and assert absence (see runbook).
    await page.getByRole('button', { name: /log out|sign out/i }).click();
    await page.getByLabel(/email/i).fill('kanban.b@example.com');
    await page.getByLabel(/password/i).fill('KanbanTest2!');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page.getByText('Write specs')).toHaveCount(0);
    await expect(page.getByText('Work')).toHaveCount(0);
  });
});
```

Adjust accessible names to match the labels actually shipped in 07–09; keep role-based queries. If isolation needs a surviving A task, the runbook’s API seed step creates one after A’s delete (or run isolation before delete — either order is fine if documented).

**Recommended isolation order (runbook + final test):** after A creates tag+task and moves to Finished, open a second browser context as B and assert A’s title is absent; then return to A for edit/delete. Prefer two contexts over re-login when simpler:

```ts
const b = await browser.newPage();
// login B … expect no "Write specs"
```

### playwright.config.ts (minimal)

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: process.env.KANBAN_SPA_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry'
  }
});
```

### Tasks

- [ ] **Step 1:** Write runbook ([e2e-local-runbook.md](e2e-local-runbook.md)) with env, provision, start commands.
- [ ] **Step 2:** Add Playwright config + happy-path spec + `test:e2e` script.
- [ ] **Step 3:** Align accessible names in UI with the test (or update test to match UI — one source of truth).
- [ ] **Step 4:** Run:

```bash
# terminals: API + SPA already up per runbook
cd repos/kanban-dashboard
npx playwright install chromium
npm run test:e2e
```

Expected: PASS.

## Testing

| Scenario | Expected |
|----------|----------|
| Guest `/` | Redirect login |
| A happy path | Tag, task, moves, reload, edit, delete |
| B isolation | No A data |
| CORS misconfig | Documented failure mode in runbook |

## Acceptance

- [ ] Runbook is reproducible on a clean machine with Docker Postgres + both apps.
- [ ] `npm run test:e2e` is green against local stack.
- [ ] Isolation covered.
- [ ] No CSS-selector-only assertions for primary flow.

## Playwright scenarios unlocked

This spec **is** the Playwright suite. Scenarios unlocked by 02–04 and 08–09 are assembled here.

## Impact

Hardcoding user UUIDs breaks when DB is reset — use emails/passwords only. Skipping CORS update causes browser failures that look like auth bugs.
