# Kanban E2E local runbook

Local, separate-host happy path for `kanban-dashboard` ↔ `personal-api`. Use with [10-integration-e2e-and-runbook.md](10-integration-e2e-and-runbook.md).

## Topology

| Service | URL |
|---------|-----|
| API health | `http://localhost:3000/api/v1/health/ping` |
| API auth | `http://localhost:3000/api/v1/auth/*` |
| API kanban | `http://localhost:3000/api/v1/kanban/*` |
| SPA | `http://localhost:5173/` (adjust if Vite picks another port) |
| SPA login | `http://localhost:5173/login` |

## Prerequisites

- Node.js matching each repo’s engines
- Docker (or equivalent) for PostgreSQL
- Feature branches: `feat/kanban-api` on `personal-api`, `feat/kanban-dashboard` on `kanban-dashboard`
- Specs 05–09 implemented and migrated

## 1. API environment

`repos/personal-api/.env` (example):

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/personal_api
JWT_ACCESS_SECRET=dev-access-secret-at-least-32-chars!!
JWT_REFRESH_SECRET=dev-refresh-secret-at-least-32-chars!
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Do not commit secrets. Ensure `.env.example` documents `CORS_ORIGINS` including the SPA origin.

Start DB + migrate + admin seed:

```bash
cd repos/personal-api
npm run db:up          # or: docker compose up -d
npx prisma migrate deploy
export ADMIN_EMAIL=admin@example.com
export ADMIN_PASSWORD='AdminTest1!'
export ADMIN_NAME='Initial Admin'
npm run db:seed-admin
npm run dev
```

Verify:

```bash
curl -s http://localhost:3000/api/v1/health/ping
```

## 2. Provision users A and B

```bash
ACCESS=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"AdminTest1!"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["accessToken"])')

curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"kanban.a@example.com",
    "name":"Kanban User A",
    "password":"KanbanTest1!",
    "role":"READ_ONLY"
  }'

curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"kanban.b@example.com",
    "name":"Kanban User B",
    "password":"KanbanTest2!",
    "role":"READ_ONLY"
  }'
```

On `409 Conflict`: login as that email with the fixture password and confirm `/api/v1/auth/me` email/name. If credentials differ, stop and recreate manually — do not auto-delete unknown accounts.

Optional: resolve A’s id at runtime:

```bash
A_ACCESS=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"kanban.a@example.com","password":"KanbanTest1!"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["accessToken"])')

curl -s http://localhost:3000/api/v1/auth/me -H "Authorization: Bearer $A_ACCESS"
```

## 3. SPA environment

```bash
cd repos/kanban-dashboard
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:3000
npm install
npm run dev
```

Note the printed origin. If not `:5173`, update `CORS_ORIGINS` and `KANBAN_SPA_URL` / Playwright `baseURL`.

## 4. Manual smoke (optional)

1. Open SPA → redirected to login.
2. Login as A → three columns.
3. Add tag “Work”.
4. Add task with title, description, tag, deadline, one checklist item → Pending.
5. Move to In progress, then Finished; reload; still Finished.
6. Edit title; save; delete with confirm.
7. Logout; login as B → no A data.

## 5. Playwright

```bash
cd repos/kanban-dashboard
npx playwright install chromium
KANBAN_SPA_URL=http://localhost:5173 npm run test:e2e
```

Expected: all tests PASS.

Exploratory (optional):

```bash
npx --yes @playwright/cli@latest open http://localhost:5173/login
# snapshot / fill / click using refs — not a substitute for the committed spec
```

## 6. Cleanup

- Stop Vite and API processes.
- Optional DB wipe for a clean re-run: drop/recreate DB or delete fixture users via admin tools.
- Do not commit `.env` or access tokens.

## Expected failures

| Symptom | Likely cause |
|---------|----------------|
| Browser CORS error | SPA origin missing from `CORS_ORIGINS` |
| Login 401 | Wrong fixture password or user not created |
| Empty board after create | API not running / wrong `VITE_API_BASE_URL` (must be origin only) |
| 404 on other user’s id in API tests | Correct isolation — do not “fix” to 200 |
| Playwright can’t find “Add tag” | Accessible name mismatch — align UI label and test |

## Credentials summary (local only)

| Actor | Email | Password |
|-------|-------|----------|
| Admin | `admin@example.com` | `AdminTest1!` |
| User A | `kanban.a@example.com` | `KanbanTest1!` |
| User B | `kanban.b@example.com` | `KanbanTest2!` |
