# Fitness App Backend Integration Specifications

These specifications split the fitness ↔ `personal-api` integration into small, independently reviewable implementation units.

Both apps stay on **separate hosts**. The API does **not** host the fitness SPA. Users are provisioned only by administrators via the existing user-management flow. Any authenticated user may use fitness endpoints for **their own** data (no new `Application` slug).

## Execution order

1. [01 — Fitness database schema](01-fitness-database-schema.md)
   - Adds Prisma models and a migration for per-user settings and daily records.
2. [02 — Fitness API module](02-fitness-api-module.md)
   - Ownership middleware and CRUD under `/api/v1/users/:userId/fitness`.
3. [03 — Fitness auth and API client](03-fitness-auth-and-api-client.md)
   - Env, JWT session, HTTP client, and API-backed repositories in the fitness SPA.
4. [04 — Login UI and data wiring](04-login-ui-and-data-wiring.md)
   - Login page, route guards, hook wiring, discard local IndexedDB domain data.
5. [05 — Local env and playwright E2E](05-local-env-and-playwright-e2e.md)
   - CORS/env for separate hosts and a full happy-path playwright-cli script.

## Fixed decisions

- Full CRUD for settings and daily records (meals, workout, weight, notes).
- Online-only after login; no offline write queue.
- Discard device-local domain data on login; API is the source of truth.
- Any authenticated user can access fitness resources for `userId === me`; `user-management-app` `ADMIN` may access any user.
- No fitness-specific `Application` / `UserAppPermission` row.
- REST shape: `/api/v1/users/:userId/fitness/...`.
- Feature branches: `feat/fitness-nutrition-api` (`personal-api`), `feat/personal-api-integration` (`fitness-nutrition-tracker`).
- Local: API `http://localhost:3000`, fitness Vite, `VITE_API_BASE_URL=http://localhost:3000`.

## Review contract

Each specification has:

- a limited file boundary;
- test-first acceptance criteria;
- a standalone commit boundary; and
- explicit dependency and verification requirements.

Do not begin a later specification until its listed dependency is merged or otherwise available in the working branch.

## Branch setup (before Task 1 of spec 01 / 03)

```bash
cd repos/personal-api
git checkout main && git pull
git checkout -b feat/fitness-nutrition-api

cd ../fitness-nutrition-tracker
git checkout main && git pull
git checkout -b feat/personal-api-integration
```
