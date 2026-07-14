# Workout Sessions E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the workout program seed → Settings edit → Workout checkout → cursor advance → sticky incomplete day path end-to-end on local FitTrack + personal-api.

**Architecture:** Same separate-hosts setup as [`docs/plans/fitness-app-backend/05-local-env-and-playwright-e2e.md`](../fitness-app-backend/05-local-env-and-playwright-e2e.md) / [`e2e-local-runbook.md`](../fitness-app-backend/e2e-local-runbook.md). Playwright-cli drives the browser; API progression is asserted through UI labels after reload.

**Tech Stack:** Playwright-cli, Vite fitness SPA, personal-api + Postgres.

---

## Scope and dependencies

- **Depends on:** [01](01-workout-program-schema.md)–[05](05-workout-checkout-ui.md) implemented on branches `feat/workout-program` and `feat/workout-sessions`.
- **Unblocks:** Merge confidence / release checklist.
- **Does not include:** Automated CI Playwright job (manual runbook is enough for v1 unless CI already exists).

## Files

- Create: `docs/plans/workout-specs/e2e-local-runbook.md`
- Modify (optional cross-link): `docs/plans/workout-specs/README.md` — already links this spec

## Prerequisites

1. personal-api on `feat/workout-program` with workout migrations applied
2. API at `http://localhost:3000` with `CORS_ORIGINS` including the Vite origin
3. fitness-nutrition-tracker on `feat/workout-sessions` with `VITE_API_BASE_URL=http://localhost:3000`
4. Provisioned user (fresh preferred so seed is first GET): `workout.user@example.com` / `password123`

### Task 1: Start services

- [ ] **Step 1: API**

```bash
cd repos/personal-api
# ensure DATABASE_URL + migrations including add_workout_program_tables
npm run db:seed-admin   # if needed
npm run dev
```

- [ ] **Step 2: Fitness SPA**

```bash
cd repos/fitness-nutrition-tracker
cp -n .env.example .env
# VITE_API_BASE_URL=http://localhost:3000
npm run dev
```

- [ ] **Step 3: Provision user** (admin login + create user) — same pattern as fitness runbook; use a **new** email if an old user already has mid-progress.

```bash
ACCESS=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | python3 -c 'import sys,json; print(json.load(sys.stdin)["accessToken"])')

curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"workout.user@example.com",
    "name":"Workout User",
    "password":"password123",
    "permissions":[{"applicationSlug":"user-management-app","role":"READ_ONLY"}]
  }'
```

### Task 2: Write runbook `e2e-local-runbook.md`

- [ ] **Step 1: Create `docs/plans/workout-specs/e2e-local-runbook.md`** with the script below (refs substituted after each snapshot).

```markdown
# Workout sessions local E2E runbook

## Happy path

App base path is `/fitness-nutrition-tracker/` (adjust if Vite base differs).

\`\`\`bash
playwright-cli open "http://localhost:5173/fitness-nutrition-tracker/"
playwright-cli snapshot
# Expect login

playwright-cli fill <emailRef> "workout.user@example.com"
playwright-cli fill <passwordRef> "password123"
playwright-cli click <submitRef>
playwright-cli snapshot

# --- Settings: seed visible + edit one exercise ---
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/settings"
playwright-cli snapshot
# Expect "Programa de entrenamiento" and day "Empuje"
# Change first exercise name to "Press de banca (E2E)"
playwright-cli fill <exerciseNameRef> "Press de banca (E2E)"
playwright-cli click <saveProgramRef>
playwright-cli snapshot
playwright-cli reload
playwright-cli snapshot
# Assert renamed exercise still present

# --- Workout: current = Empuje, complete advances ---
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/workout"
playwright-cli snapshot
# Expect day title Empuje and "Press de banca (E2E)"
playwright-cli click <completeSwitchRef>
playwright-cli snapshot
# Expect toast / Jalón as current day title
playwright-cli reload
playwright-cli snapshot
# Assert still Jalón (cursor persisted)

# --- Sticky incomplete: do NOT complete Jalón; simulate next day via API date is calendar-only ---
# Client rule: without complete, /current stays Jalón across reloads on a later real day.
# For same-session verification: navigate away and back; still Jalón.
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/meals"
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/workout"
playwright-cli snapshot
# Assert Jalón still shown

# Optional API assert (cursor not advanced without complete):
curl -s http://localhost:3000/api/v1/users/$USER_ID/fitness/workout-program/current \
  -H "Authorization: Bearer $USER_ACCESS" | python3 -m json.tool
# day.name === Jalón

# Complete Jalón → Pierna
playwright-cli click <completeSwitchRef>
playwright-cli snapshot
# Expect Pierna

# Past date: open yesterday on DateNavigator — no cursor change when returning to today
playwright-cli click <previousDayRef>
playwright-cli snapshot
playwright-cli click <nextDayRef>   # back to today
playwright-cli snapshot
# Expect Pierna still

playwright-cli console
playwright-cli close
\`\`\`

## Acceptance checklist

- [ ] Login required
- [ ] Seeded program appears in Settings without prior PUT
- [ ] Exercise rename persists after reload
- [ ] Workout shows Empuje then Jalón after complete + reload
- [ ] Without complete, current day remains sticky across navigation/reload
- [ ] Date navigator past day does not mutate cursor
- [ ] No CORS / 4xx flood in console for happy path
```

- [ ] **Step 2: Execute the runbook once** and fix product bugs if acceptance fails (implementation, not this doc — unless the runbook instructions were wrong).

### Task 3: Commit docs

- [ ] **Step 1: Commit runbook** (from `cv-workspace` or wherever docs live).

```bash
cd /home/francisco/repos/cv-workspace
git add docs/plans/workout-specs/e2e-local-runbook.md docs/plans/workout-specs/06-workout-e2e.md
git commit -m "$(cat <<'EOF'
docs: add workout sessions E2E runbook

EOF
)"
```

(Only commit if the user has asked for commits of docs in this repo; for agentic workers implementing the *application* branches, keep the runbook file in the workspace docs tree as authored by this plan. If docs are already present from the planning pass, skip duplicate commits.)

## Impact

| Risk | Mitigation |
|------|------------|
| Reusing an old user with mid-progress | Provision fresh email |
| Complete switch location changes | Re-snapshot after UI tweaks |
| Vite base path differs | Confirm `import.meta.env.BASE_URL` / vite `base` |

## Verification

All acceptance checkboxes in the runbook pass on a clean user.
