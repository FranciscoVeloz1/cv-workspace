# Brainstorming: personal-api — Shared Platform REST API

**Date:** 2026-07-04  
**Persona:** backend-developer  
**Status:** Brainstorming complete — ready for implementation planning

---

## 1. Context and goals

### What we are building

A **TypeScript + Express REST API** that serves as the **common entry point for multiple frontend projects**. One deployed instance, shared users, one PostgreSQL database. Routes are grouped by domain so each project can grow its own module without forking the API.

### First implementation goal (v1 tracer bullet)

Ship a **fully scaffolded API** with all boilerplate in place, plus:

- Authentication (register, login, refresh, logout, me)
- Health/ping endpoints
- A demonstration of **anonymous guest access** (read-only, mocked data)
- PostgreSQL connection
- Railway deployment configuration

This is not a throwaway prototype — it is production-structured code with minimal domain logic.

### Workspace context explored

Existing backends in this workspace informed the recommendations:

| Project | Patterns observed |
|---------|-------------------|
| `repos/react-node-template/backend/` | Express, JWT (`jsonwebtoken`), bcrypt, Zod validation, MySQL via `mysql2`, flat `controllers/routes/middlewares` layout |
| `repos/car-history-app/backend/` | Layered architecture: `domain/`, `repositories/`, `infrastructure/database/`, raw SQL migrations |
| `repos/NexaRize-Electric-car/backend/` | Simple ping route pattern |

**Project location:** `personal-api/` at the workspace root (currently an empty folder).

**Skills and standards applied:**

- `.agents/skills/node-express-api-design-principles/SKILL.md`
- `.agents/skills/typescript-error-handling-patterns/SKILL.md`
- `.agents/skills/pragmatic-programmer/SKILL.md`
- `.agents/personas/backend-developer.md`

---

## 2. Decisions locked in during this session

### Q: How should this API relate to different projects?

**Answer: A — Shared platform**

- One deployed API instance serves all frontends
- Shared user base across projects
- One PostgreSQL database
- Routes grouped by domain (e.g. `/api/v1/groceries/*`, `/api/v1/car-history/*`)

### Q: Which SQL database?

**Answer: PostgreSQL**

- Railway has first-class PostgreSQL support with `DATABASE_URL` injection
- JSON columns for flexible metadata when needed
- Strong ecosystem with Prisma/Drizzle

### Q: What should "guest users" mean?

**Answer: Anonymous access with limited actions**

- No account or token required
- Read-only access
- Returns **mocked/fixture data** (not real DB rows)
- Stricter rate limits than authenticated routes

### Q: Where does the project live?

**Answer: `personal-api/`** at the workspace root.

### Stack summary

| Layer | Choice |
|-------|--------|
| Language | TypeScript (strict mode) |
| HTTP framework | Express |
| Validation | Zod (`z.infer` for types — no duplicate interfaces) |
| ORM | Prisma (recommended) |
| Database | PostgreSQL |
| Auth | JWT access + refresh tokens |
| Logging | pino |
| Security | helmet, cors, express-rate-limit |
| Testing | vitest + supertest |
| Deployment | Railway |
| Build | `tsx` (dev) / `tsc` (prod) |

---

## 3. Architecture approaches compared

Three approaches were evaluated for a shared platform API.

### Approach A: Modular monolith (recommended)

Each future project domain becomes a self-contained module under `src/modules/`. Shared cross-cutting concerns live in `src/core/`. One deploy, one database, clear boundaries.

**Pros:**

- Clear domain boundaries without operational overhead
- Easy to add new project modules without touching existing ones
- Can extract a module into a microservice later if needed
- Single Railway deployment keeps costs and complexity low

**Cons:**

- Requires discipline to keep modules decoupled
- All modules share the same deployment cycle

**Verdict: Use this.**

### Approach B: Flat MVC (controllers / routes / services)

Single flat tree of controllers, routes, and services — similar to `react-node-template`.

**Pros:**

- Simple to start
- Familiar pattern from existing workspace projects

**Cons:**

- Gets tangled as multiple project domains grow
- Hard to see ownership boundaries
- Cross-domain imports become tempting

**Verdict: Avoid as the primary structure for a multi-project platform.**

### Approach C: Microservices per project

Separate API service per frontend project, potentially sharing an auth service.

**Pros:**

- Maximum isolation between projects
- Independent deploy cycles

**Cons:**

- Overkill for v1
- Multiple Railway services = higher cost and ops burden
- Shared users/auth becomes its own distributed problem

**Verdict: Defer until a module genuinely needs independent scaling or deployment.**

---

## 4. High-level architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontends                            │
│   Project A SPA    Project B SPA    Anonymous client        │
└──────────┬─────────────────┬─────────────────┬──────────────┘
           │ Bearer JWT      │ Bearer JWT      │ no token
           ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    personal-api (Express)                    │
│  Global middleware: helmet, cors, rateLimit, pino logger     │
│  /api/v1 router                                              │
│    ├── core middleware (errorHandler, validate, auth)         │
│    ├── auth module                                            │
│    ├── health module                                          │
│    └── future modules (groceries, car-history, ...)          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  PostgreSQL (Railway)  │
              │  users, refresh_tokens │
              └────────────────────────┘
```

---

## 5. Recommended folder structure

```
personal-api/
├── src/
│   ├── app.ts                    # Express app, global middleware, mount routers
│   ├── server.ts                 # Bootstrap, graceful shutdown, DB connect
│   ├── config/
│   │   └── env.ts                # Zod-validated env (fail fast at startup)
│   ├── core/                     # Cross-cutting, no business domain
│   │   ├── middleware/
│   │   │   ├── error-handler.ts
│   │   │   ├── validate.ts       # Generic Zod query/body middleware
│   │   │   ├── authenticate.ts   # Required JWT
│   │   │   ├── optional-auth.ts  # Sets req.user if token present
│   │   │   └── rate-limit.ts     # Stricter limiter for public routes
│   │   ├── errors/
│   │   │   └── app-error.ts
│   │   └── lib/
│   │       ├── async-handler.ts
│   │       └── logger.ts         # pino
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   └── auth.schemas.ts   # z.infer types — no duplicate interfaces
│   │   ├── health/
│   │   │   ├── health.routes.ts  # GET /ping, GET /health (DB probe)
│   │   │   └── health.controller.ts
│   │   └── _template/            # Copy-paste starter for new domains
│   │       └── README.md
│   ├── routes/
│   │   └── v1/index.ts           # Mounts all module routers under /api/v1
│   ├── db/
│   │   └── client.ts             # Prisma client singleton
│   ├── mocks/                    # Static fixtures for anonymous read-only routes
│   │   └── index.ts
│   └── types/
│       └── express.d.ts          # Augment Request: user?, validated?
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── integration/
│   └── unit/
├── .env.example
├── railway.toml
├── package.json
└── tsconfig.json                 # strict, NodeNext
```

### Why this layout

- **`core/`** holds infrastructure that every module needs but no module owns
- **`modules/`** gives each project domain a home with its own routes, controller, service, repository, and schemas
- **`routes/v1/`** is the single versioned entry point — add `v2/` when breaking changes are needed
- **`mocks/`** centralizes fixture data for anonymous guest responses (DRY)
- **`modules/_template/`** documents how to add a new project domain

### Layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| Routes | HTTP wiring, middleware composition, no business logic |
| Controller | Parse request, call service, send response (thin) |
| Service | Business rules, orchestration, mock-vs-real decision for guests |
| Repository | Database access only |
| Schemas | Zod validation + `z.infer` types |

---

## 6. Route conventions

URL versioning from day one. All endpoints under `/api/v1`.

### v1 endpoints

```
GET  /api/v1/health/ping          # Liveness — no DB check
GET  /api/v1/health               # Readiness — includes DB connectivity

POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me              # Requires authentication

GET  /api/v1/demo/items           # Guest demo — mock data if anonymous, real if authenticated
```

### Future domain examples

```
GET  /api/v1/groceries/items      # optionalAuth → mock if anonymous
GET  /api/v1/groceries/items/:id  # authenticated → real DB
```

### HTTP semantics

- Plural nouns for collections (`/users`, not `/user`)
- GET is safe and idempotent
- POST for creation and non-idempotent actions (login, refresh)
- 401 for missing/invalid auth; 403 for valid auth but insufficient permissions
- 422 for validation errors with field-level details

---

## 7. Authentication design

### Recommended: JWT access token + refresh token

Best fit for a shared platform serving multiple SPAs/mobile clients over REST.

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Access token | JWT, short-lived (~15 min) | Stateless verification; works across multiple frontends |
| Refresh token | Opaque string, hashed in DB, rotated on use | Revocable sessions; safer than long-lived JWT |
| Password hashing | bcrypt (cost factor 12) | Industry standard; matches existing workspace patterns |
| Transport | `Authorization: Bearer <token>` | Standard for REST + SPA/mobile |
| Guest/anonymous | No token; `optionalAuth` middleware | Public routes return mock data; protected routes return 401 |
| Roles (v1) | `USER` and `ADMIN` enum | Enough for platform; expand later |

### Auth flow

```
1. POST /auth/login { email, password }
   → verify bcrypt hash
   → issue accessToken (JWT) + refreshToken (opaque)
   → store refreshToken hash in DB

2. GET /resource  Authorization: Bearer <accessToken>
   → verify JWT signature + expiry
   → attach req.user

3. POST /auth/refresh { refreshToken }
   → validate hash in DB, check expiry
   → rotate: invalidate old, issue new pair

4. GET /public/items  (no Authorization header)
   → optionalAuth: no req.user
   → service returns data from mocks/
```

### Middleware matrix

| Middleware | Behavior | Used on |
|------------|----------|---------|
| `authenticate` | Requires valid JWT; 401 if missing/invalid | `/auth/me`, mutating domain routes |
| `optionalAuthenticate` | Sets `req.user` if token valid; continues without user otherwise | Public read routes with guest support |
| `authorize(...roles)` | Requires `req.user.role` in allowed roles; 403 otherwise | Admin-only routes |

### Guest / anonymous pattern

For routes that support both guest and authenticated access:

```typescript
// In service layer (pseudocode)
async function getItems(user: AuthUser | undefined) {
  if (!user) {
    return mockItems; // read-only fixtures from src/mocks/
  }
  return itemRepository.findAll(user.id);
}
```

Public routes get a **stricter rate limit** (e.g. 30 req/min vs 100 req/min for authenticated).

### Explicitly out of scope for v1

- OAuth / social login (Google, GitHub)
- Email verification
- Password reset flow
- API keys for service-to-service auth
- Multi-tenant row isolation (not needed until unrelated orgs share data)

---

## 8. Data layer: Prisma + PostgreSQL

### Why Prisma over alternatives

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Prisma** | Schema-as-code, typed client, migrations, great Railway DX | Heavier than raw SQL | **Recommended for greenfield** |
| Drizzle | Lightweight, SQL-like, good TypeScript | Less tooling than Prisma | Good alternative if Prisma feels heavy |
| Raw SQL + migrations | Full control (used in car-history-app) | More boilerplate, no auto-generated types | Better for complex SQL-heavy domains |

Prisma is reversible — swap to Drizzle later without changing route/service boundaries if repositories are kept thin.

### v1 database schema

```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  passwordHash  String
  name          String
  role          Role           @default(USER)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  tokenHash String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

enum Role {
  USER
  ADMIN
}
```

---

## 9. Error handling and API contract

### Standard error response shape

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [
    { "path": ["email"], "message": "Invalid email" }
  ],
  "timestamp": "2026-07-04T20:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

### Rules

- `AppError` class with `code`, `statusCode`, optional `details`
- Central `errorHandler` middleware registered **last**
- `asyncHandler` wrapper on all async route handlers (Express 4)
- Zod validation failures → 422 with field-level `details`
- No stack traces in production JSON responses
- Log once at the boundary (pino), do not log-and-rethrow at every layer

### Status code mapping

| Code | When |
|------|------|
| 200 | Successful GET/PATCH/PUT |
| 201 | Successful POST (creation) |
| 204 | Successful DELETE |
| 400 | Malformed request |
| 401 | Missing or invalid auth token |
| 403 | Valid token, insufficient permissions |
| 404 | Resource not found |
| 422 | Validation failed |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

---

## 10. Security checklist (v1)

- [ ] `helmet` for HTTP security headers
- [ ] CORS configured with explicit `CORS_ORIGINS` env var
- [ ] Body size limit (`express.json({ limit: '1mb' })`)
- [ ] Rate limiting globally + stricter on public routes
- [ ] Env vars validated at startup with Zod (fail fast)
- [ ] Passwords never returned in responses
- [ ] Refresh tokens stored as hashes, not plaintext
- [ ] `x-powered-by` disabled
- [ ] Input validation on every write endpoint

---

## 11. v1 scope

### In scope

- Project scaffold in `personal-api/`
- Env validation (Zod), logger (pino), security middleware
- PostgreSQL + Prisma schema + migrations
- Auth module: register, login, refresh, logout, me
- Health module: `GET /ping`, `GET /health` (DB connectivity)
- Demo mock route: `GET /api/v1/demo/items` (anonymous → mock, authenticated → placeholder)
- Rate limiting: global + stricter on public routes
- Tests: auth happy path, 401, validation failure (vitest + supertest)
- Railway config: `railway.toml`, healthcheck on `/api/v1/health/ping`
- `.env.example` with all required variables documented

### Out of scope (deferred)

- Real domain modules (groceries, car-history, etc.)
- OAuth, email verification, password reset
- OpenAPI/Swagger generation (v2: `@asteasolutions/zod-to-openapi`)
- Redis-backed rate limiting (in-memory OK for single Railway instance)
- GraphQL
- Background jobs / queues

---

## 12. Railway deployment

### Build and start

```bash
npm run build    # tsc → dist/
npm start        # node dist/server.js
```

### Healthcheck

```
GET /api/v1/health/ping   # liveness (no DB)
GET /api/v1/health        # readiness (includes DB ping)
```

### Required environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (Railway injects this) |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing/deriving refresh tokens |
| `NODE_ENV` | `production` / `development` / `test` |
| `PORT` | Server port (Railway sets this) |
| `CORS_ORIGINS` | Comma-separated allowed origins |

### Migrations on deploy

Run `prisma migrate deploy` in the Railway deploy hook or as part of the start script before the server boots.

---

## 13. Testing strategy (v1)

| Test type | Tool | What to cover |
|-----------|------|---------------|
| Integration | supertest + vitest | Auth register/login/refresh/logout, ping, health, 401, 422 validation |
| Unit | vitest | Auth service logic, token rotation, mock-vs-real guest decision |

Minimum v1 test cases:

1. `GET /api/v1/health/ping` → 200
2. `POST /api/v1/auth/register` with valid body → 201
3. `POST /api/v1/auth/register` with invalid email → 422
4. `POST /api/v1/auth/login` → 200 with tokens
5. `GET /api/v1/auth/me` without token → 401
6. `GET /api/v1/auth/me` with valid token → 200
7. `GET /api/v1/demo/items` without token → 200 with mock data

---

## 14. Pragmatic quick diagnostic

Target score: **10/10**

| Principle | How this design addresses it |
|-----------|------------------------------|
| DRY | Zod schemas as single source of truth; mock data centralized in `mocks/` |
| Orthogonality | Route → controller → service → repository; auth decoupled from domain modules |
| Tracer bullet | v1 = auth + ping + one mock demo route, fully deployable end-to-end |
| Design by contract | Consistent error JSON, versioned `/api/v1` prefix |
| Reversibility | Prisma and JWT swappable behind repository/service interfaces |
| No broken windows | Strict TS, validated env, tests from day one |

---

## 15. Reversibility notes

Decisions that are easy to change later:

- **Prisma → Drizzle or raw SQL:** Repository layer absorbs the swap
- **In-memory rate limit → Redis:** Middleware interface stays the same
- **Add OpenAPI:** Schemas already in Zod; generate docs in v2
- **Extract a module to microservice:** Modular monolith boundaries make this feasible

Decisions that are harder to reverse:

- **Shared platform vs per-project fork:** Changing later means data migration and client updates
- **JWT vs session cookies:** Switching auth transport affects all clients

---

## 16. Open questions for implementation

These can be decided during implementation without blocking the scaffold:

1. **Access token TTL:** 15 minutes is the default recommendation; adjust based on UX needs
2. **Refresh token TTL:** 7 days is a common default
3. **Demo module name:** `demo` vs `public` vs project-specific name for the mock route
4. **Admin seed user:** Whether to include a CLI seed script for an initial admin account

---

## 17. Next steps

1. Review this document and confirm or adjust any decisions
2. Write an implementation plan (task breakdown with file-level detail)
3. Scaffold `personal-api/` following the folder structure above
4. Implement the v1 tracer bullet: auth + ping + demo mock route
5. Deploy to Railway and verify healthcheck + auth flow
