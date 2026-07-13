# Local Env and Playwright E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Document and automate a local, separate-host happy path: provision a user via the API, log into the fitness app, mutate settings and daily records, reload, and confirm persistence — using `playwright-cli`.

**Architecture:** personal-api on `:3000` with Postgres; fitness Vite on its default port (typically `:5173`) with `VITE_API_BASE_URL=http://localhost:3000`; CORS allows the Vite origin. Playwright-cli drives the browser against the fitness origin only; API is exercised indirectly through the UI (plus one optional `curl` provisioning step).

**Tech Stack:** playwright-cli, Docker/Postgres or embedded DB scripts from personal-api, Vite, Express.

---

## Scope and dependencies

- **Depends on:** [02 — Fitness API module](02-fitness-api-module.md) and [04 — Login UI and data wiring](04-login-ui-and-data-wiring.md) implemented on their feature branches.
- **Unblocks:** merge confidence for both PRs.
- **Does not include:** CI GitHub Actions wiring (optional follow-up); production deploy.

## Files

- Modify: `repos/personal-api/.env.example` — document `CORS_ORIGINS` including fitness Vite origin
- Modify: `repos/fitness-nutrition-tracker/.env.example` — already has `VITE_API_BASE_URL` from spec 03; confirm
- Create: `repos/fitness-nutrition-tracker/scripts/e2e-local-playwright.md` **or** `docs/plans/fitness-app-backend/e2e-local-runbook.md` (prefer runbook next to these specs)
- Create: `docs/plans/fitness-app-backend/e2e-local-runbook.md` (this folder)
- Optional: `repos/fitness-nutrition-tracker/package.json` script `"e2e:local": "echo See docs/plans/fitness-app-backend/e2e-local-runbook.md"` — skip if noise; the runbook is the source of truth

## Local environment

### API (`repos/personal-api`)

```bash
# .env (example)
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/personal_api
JWT_ACCESS_SECRET=dev-access-secret-at-least-32-chars!!
JWT_REFRESH_SECRET=dev-refresh-secret-at-least-32-chars!
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

npm run db:up          # or docker compose up -d
npx prisma migrate deploy
npm run db:seed-admin  # creates UM admin
npm run dev
```

### Provision a fitness user (admin-created, no fitness Application row)

Using the seeded admin (or UM UI):

```bash
# Login as admin
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ADMIN_EMAIL","password":"ADMIN_PASSWORD"}'

# Create user (needs UM ADMIN). Body example:
curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"fitness.user@example.com",
    "name":"Fitness User",
    "password":"password123",
    "permissions":[
      {"applicationSlug":"user-management-app","role":"READ_ONLY"}
    ]
  }'
```

Note: UM permission is only required if using the users API to create the account. A user with **zero** permissions can still use fitness once created; creating via users API currently attaches at least one permission — that is fine. Alternatively insert a user via Prisma seed script for E2E only.

E2E credentials (document in runbook; use locals only):

- email: `fitness.user@example.com`
- password: `password123`

### Fitness app

```bash
cd repos/fitness-nutrition-tracker
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:3000
npm run dev
# Note the printed origin, usually http://localhost:5173/fitness-nutrition-tracker/
```

App `base` is `/fitness-nutrition-tracker/` — playwright must open that path, not bare `/`.

## Playwright-cli happy path (8C)

Install/check CLI:

```bash
npx --no-install playwright-cli --version || npm install -g @playwright/cli@latest
```

### Task 1: Write the runbook with exact commands

- [ ] **Step 1: Create `docs/plans/fitness-app-backend/e2e-local-runbook.md`** containing the env setup above plus the scripted flow below.

- [ ] **Step 2: Record the flow using playwright-cli** (adjust refs after each `snapshot`):

```bash
playwright-cli open "http://localhost:5173/fitness-nutrition-tracker/"
playwright-cli snapshot
# Expect redirect to login

playwright-cli snapshot
# fill email + password using refs from snapshot
playwright-cli fill <emailRef> "fitness.user@example.com"
playwright-cli fill <passwordRef> "password123"
playwright-cli click <submitRef>
playwright-cli snapshot
# Expect dashboard / app shell

# --- Settings ---
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/settings"
playwright-cli snapshot
# Change goal weight or a meal template name; save if required
# (use UI controls present after spec 04)

playwright-cli reload
playwright-cli snapshot
# Assert changed settings still visible (eval textContent)

# --- Meals ---
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/meals"
playwright-cli snapshot
# Mark breakfast as followed (or equivalent control)
playwright-cli reload
playwright-cli snapshot
# Assert breakfast status persisted

# --- Workout ---
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/workout"
playwright-cli snapshot
# Log a workout (category/type/duration)
playwright-cli reload
playwright-cli snapshot
# Assert workout fields persisted

# --- Weight ---
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/weight"
playwright-cli snapshot
# Enter weightKg
playwright-cli reload
playwright-cli snapshot
# Assert weight persisted

# --- Logout ---
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/settings"
playwright-cli snapshot
playwright-cli click <logoutRef>
playwright-cli snapshot
# Expect login page
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/"
playwright-cli snapshot
# Expect redirect to login again

# --- Re-login persistence ---
playwright-cli fill <emailRef> "fitness.user@example.com"
playwright-cli fill <passwordRef> "password123"
playwright-cli click <submitRef>
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/meals"
playwright-cli snapshot
# Assert earlier meal/workout/weight/settings still present

playwright-cli close
```

Because snapshot refs are dynamic, the runbook must instruct the agent to **re-snapshot and substitute refs** rather than hard-coding stale `eN` ids. Include `playwright-cli eval` assertions where stable, e.g.:

```bash
playwright-cli --raw eval "document.body.innerText.includes('Desayuno')"
```

### Task 2: CORS verification

- [ ] **Step 1: Confirm browser network calls from Vite origin succeed** (no CORS errors in `playwright-cli console`).

- [ ] **Step 2: Update `personal-api` `.env.example`:**

```bash
# Comma-separated browser origins allowed to call the API (credentials mode).
# Include the fitness Vite origin when developing the fitness SPA separately.
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

- [ ] **Step 3: If CORS fails, fix `getCorsOrigins()` usage / env and re-test — do not weaken auth.

### Task 3: Capture a green run

- [ ] **Step 1: Run the full flow once; fix flakiness (timing: wait for snapshot after navigation).**

- [ ] **Step 2: Commit docs on the workspace repo (and API `.env.example` on the API branch).**

Workspace:

```bash
cd /home/francisco/repos/cv-workspace
git add docs/plans/fitness-app-backend
git commit -m "$(cat <<'EOF'
docs: add fitness app backend integration specs and e2e runbook

EOF
)"
```

API branch (if `.env.example` changed):

```bash
cd repos/personal-api
git add .env.example
git commit -m "$(cat <<'EOF'
docs: document CORS origins for fitness Vite dev server

EOF
)"
```

## Acceptance checklist

- [ ] Fitness app on Vite host; API on `:3000`; no SPA hosting from API required
- [ ] Login → settings change survives reload
- [ ] Meal, workout, and weight mutations survive reload
- [ ] Logout blocks app; re-login restores API data
- [ ] `playwright-cli console` shows no CORS failures on API calls

## Verification commands (summary)

```bash
# terminals: API + fitness dev servers already running
playwright-cli open "http://localhost:5173/fitness-nutrition-tracker/login"
# …follow e2e-local-runbook.md…
playwright-cli close
```
