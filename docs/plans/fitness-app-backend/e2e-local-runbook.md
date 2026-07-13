# Fitness ↔ personal-api local E2E runbook

## Prerequisites

1. Embedded Postgres (or Docker) with migrations applied on `feat/fitness-nutrition-api`
2. API on `http://localhost:3000` with `CORS_ORIGINS` including `http://localhost:5173`
3. Fitness Vite on `http://localhost:5173` with `VITE_API_BASE_URL=http://localhost:3000`
4. Provisioned user: `fitness.user@example.com` / `password123`

## Start services

```bash
# Terminal A — API worktree
cd repos/personal-api/.worktrees/feat-fitness-nutrition-api
node scripts/start-embedded-db.mjs --migrate   # if not already running
npm run db:seed-admin
npm run dev

# Terminal B — Fitness worktree
cd ~/.config/superpowers/worktrees/fitness-nutrition-tracker/feat-personal-api-integration
cp -n .env.example .env
npm run dev
```

## Provision fitness user

```bash
ACCESS=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | python3 -c 'import sys,json; print(json.load(sys.stdin)["accessToken"])')

curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"fitness.user@example.com",
    "name":"Fitness User",
    "password":"password123",
    "permissions":[{"applicationSlug":"user-management-app","role":"READ_ONLY"}]
  }'
```

## Playwright-cli happy path

App base path is `/fitness-nutrition-tracker/`. Re-snapshot after each navigation and substitute refs.

```bash
playwright-cli open "http://localhost:5173/fitness-nutrition-tracker/"
playwright-cli snapshot
# Expect login

playwright-cli fill <emailRef> "fitness.user@example.com"
playwright-cli fill <passwordRef> "password123"
playwright-cli click <submitRef>
playwright-cli snapshot
# Expect app shell

# Settings
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/settings"
playwright-cli snapshot
# Change a meal template name / goal weight and save if needed
playwright-cli reload
playwright-cli snapshot

# Meals
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/meals"
playwright-cli snapshot
# Mark breakfast followed
playwright-cli reload
playwright-cli snapshot

# Workout
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/workout"
playwright-cli snapshot
# Log workout
playwright-cli reload
playwright-cli snapshot

# Weight
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/weight"
playwright-cli snapshot
# Enter weight
playwright-cli reload
playwright-cli snapshot

# Logout + re-login persistence
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/settings"
playwright-cli snapshot
playwright-cli click <logoutRef>
playwright-cli snapshot
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/"
playwright-cli snapshot
# Expect login again
playwright-cli fill <emailRef> "fitness.user@example.com"
playwright-cli fill <passwordRef> "password123"
playwright-cli click <submitRef>
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/meals"
playwright-cli snapshot
# Assert prior data still present

playwright-cli console
playwright-cli close
```

## Acceptance

- [ ] Login required
- [ ] Settings / meals / workout / weight survive reload
- [ ] Logout blocks shell; re-login restores API data
- [ ] No CORS errors in console
