# Workout sessions local E2E runbook

## Prerequisites

1. `personal-api` on `feat/workout-program` with workout-program migrations applied
2. API on `http://localhost:3000` with `CORS_ORIGINS` including `http://localhost:5173`
3. Fitness Vite on `http://localhost:5173` with `VITE_API_BASE_URL=http://localhost:3000` (`feat/workout-sessions`)
4. Prefer a **fresh** user so first GET seeds the default program: `workout.user@example.com` / `password123`

## Start services

```bash
# Terminal A — API
cd repos/personal-api
npm run db:seed-admin   # if needed
npm run dev

# Terminal B — Fitness SPA
cd repos/fitness-nutrition-tracker
cp -n .env.example .env
npm run dev
```

## Provision workout user

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

## Playwright-cli happy path

App base path is `/fitness-nutrition-tracker/`. Re-snapshot after each navigation and substitute refs.

```bash
playwright-cli open "http://localhost:5173/fitness-nutrition-tracker/"
playwright-cli snapshot
# Expect login

playwright-cli fill <emailRef> "workout.user@example.com"
playwright-cli fill <passwordRef> "password123"
playwright-cli click <submitRef>
playwright-cli snapshot
# Expect app shell

# Settings — seeded program + edit
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/settings"
playwright-cli snapshot
# Expect "Programa de entrenamiento" and day "Empuje"
# Rename first exercise to "Press de banca (E2E)"
playwright-cli fill <exerciseNameRef> "Press de banca (E2E)"
playwright-cli click <saveProgramRef>
playwright-cli snapshot
playwright-cli reload
playwright-cli snapshot
# Assert renamed exercise still present

# Workout — Empuje → complete → Jalón
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/workout"
playwright-cli snapshot
# Expect Empuje and "Press de banca (E2E)"
playwright-cli click <completeSwitchRef>
playwright-cli snapshot
# Expect Jalón as current day
playwright-cli reload
playwright-cli snapshot
# Assert still Jalón

# Sticky incomplete — navigate away without completing; still Jalón
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/meals"
playwright-cli goto "http://localhost:5173/fitness-nutrition-tracker/workout"
playwright-cli snapshot
# Assert Jalón

# Optional API assert
# curl .../workout-program/current with user token → day.name === "Jalón"

# Complete Jalón → Pierna
playwright-cli click <completeSwitchRef>
playwright-cli snapshot
# Expect Pierna

# Date navigator must not mutate cursor
playwright-cli click <previousDayRef>
playwright-cli snapshot
playwright-cli click <nextDayRef>
playwright-cli snapshot
# Expect Pierna still

playwright-cli console
playwright-cli close
```

## Acceptance

- [ ] Login required
- [ ] Seeded program appears in Settings without prior PUT
- [ ] Exercise rename persists after reload
- [ ] Workout shows Empuje, then Jalón after complete + reload
- [ ] Without complete, current day stays sticky across navigation/reload
- [ ] Past day via date navigator does not change the program cursor
- [ ] No CORS errors in console for the happy path
