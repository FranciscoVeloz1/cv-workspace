# Groceries Full-Stack E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Document and automate a local, separate-host happy path for Mandado ↔ personal-api: provision users with `groceries-app` membership, seed catalog (Category FK from scratch), login, browse API catalog, use local cart, and ADMIN product CRUD — using `playwright-cli`.

**Architecture:** personal-api on `:3000`; full-groceries-app Vite with `base: '/full-groceries-app/'` and `VITE_API_BASE_URL=http://localhost:3000`; CORS allows the Vite origin.

**Tech Stack:** playwright-cli, personal-api migrate/seed scripts, Vite, Express.

---

## Scope and dependencies

- **Depends on:** [01](01-groceries-category-schema.md)–[05](05-admin-product-crud-ui.md) on `feat/groceries-api` / `feat/personal-api-integration`.
- **Unblocks:** merge confidence for both PRs.
- **Does not include:** CI wiring; trip/history UI; production deploy.

## Files

- Modify: `repos/personal-api/.env.example` — `CORS_ORIGINS` includes `http://localhost:5173`
- Confirm: `repos/full-groceries-app/.env.example` has `VITE_API_BASE_URL`
- Finalize: `docs/plans/groceries-app-backend/e2e-local-runbook.md`

## Local environment

### API

```bash
cd repos/personal-api  # feat/groceries-api
npx prisma migrate deploy
npm run db:seed-admin      # creates groceries-app Application + admin membership
npm run db:seed-groceries  # maps JSON Int categories → categoryId via sortOrder
npm run dev
```

### Provision users (Application permissions)

```bash
ACCESS=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["accessToken"])')

curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"groceries.user@example.com",
    "name":"Groceries User",
    "password":"password123",
    "permissions":[{"applicationSlug":"groceries-app","role":"READ_ONLY"}]
  }'

curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"groceries.admin@example.com",
    "name":"Groceries Admin",
    "password":"password123",
    "permissions":[{"applicationSlug":"groceries-app","role":"ADMIN"}]
  }'
```

| Persona | Email | Password | groceries-app role |
| --- | --- | --- | --- |
| Shopper | `groceries.user@example.com` | `password123` | READ_ONLY |
| Admin | `groceries.admin@example.com` | `password123` | ADMIN |

### SPA

```bash
cd repos/full-groceries-app
cp -n .env.example .env
npm run dev
# http://localhost:5173/full-groceries-app/
```

### Task 1–3

- [ ] Finalize runbook refs after one recorded playwright-cli pass.
- [ ] Run full happy path in [e2e-local-runbook.md](e2e-local-runbook.md).
- [ ] Commit runbook / `.env.example` tweaks.

## Verification / E2E (this spec)

- [ ] Categories seeded in migration; products from `db:seed-groceries`.
- [ ] Browse + local cart + ADMIN icon CRUD + READ_ONLY forbidden.
- [ ] Backend + SPA regression commands in runbook pass.
