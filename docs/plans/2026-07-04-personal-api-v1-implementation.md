# personal-api v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a production-structured TypeScript/Express shared platform API in `personal-api/` with JWT auth, health/ping endpoints, anonymous guest demo route, PostgreSQL via Prisma, and Railway deployment config.

**Architecture:** Modular monolith — each domain lives under `src/modules/`, shared infrastructure under `src/core/`. Thin controllers call typed services backed by repositories. Zod schemas are the single source of truth for validation and types. JWT access tokens (15 min) plus hashed refresh tokens (7 days) in PostgreSQL.

**Tech Stack:** TypeScript (strict, NodeNext), Express 4, Zod, Prisma, PostgreSQL, bcrypt, jsonwebtoken, pino, helmet, cors, express-rate-limit, vitest, supertest, tsx, Railway

**Spec reference:** [docs/brainstorming/2026-07-04-personal-api-shared-platform.md](../brainstorming/2026-07-04-personal-api-shared-platform.md)

---

## File map

All paths relative to `personal-api/` unless noted.

| File | Responsibility |
|------|----------------|
| `package.json` | Dependencies, scripts (`dev`, `build`, `start`, `test`, `migrate`) |
| `tsconfig.json` | Strict TS, NodeNext module resolution |
| `vitest.config.ts` | Test runner, setup file, path aliases |
| `.env.example` | Documented env vars for local + Railway |
| `docker-compose.yml` | Local PostgreSQL for dev/test |
| `railway.toml` | Build/start commands, healthcheck path |
| `prisma/schema.prisma` | User, RefreshToken, Role enum |
| `src/config/env.ts` | Zod-validated env — fail fast at startup |
| `src/types/express.d.ts` | Augment `Request` with `user`, `validated` |
| `src/core/errors/app-error.ts` | Typed HTTP errors with `code`, `statusCode`, `details` |
| `src/core/lib/async-handler.ts` | Wrap async route handlers for Express 4 |
| `src/core/lib/logger.ts` | pino logger singleton |
| `src/core/lib/token.ts` | JWT sign/verify, refresh token generate/hash |
| `src/core/middleware/error-handler.ts` | Central error → JSON mapper |
| `src/core/middleware/validate.ts` | Generic Zod body/query/param middleware |
| `src/core/middleware/authenticate.ts` | Required JWT — 401 on failure |
| `src/core/middleware/optional-auth.ts` | Attach `req.user` when token present |
| `src/core/middleware/rate-limit.ts` | Global + public route limiters |
| `src/db/client.ts` | Prisma client singleton |
| `src/mocks/index.ts` | Static fixtures for anonymous guest responses |
| `src/modules/health/health.routes.ts` | GET `/ping`, GET `/` (readiness) |
| `src/modules/health/health.controller.ts` | Liveness + DB probe handlers |
| `src/modules/auth/auth.schemas.ts` | Register/login/refresh Zod schemas |
| `src/modules/auth/auth.repository.ts` | User + refresh token DB access |
| `src/modules/auth/auth.service.ts` | Register, login, refresh, logout, me |
| `src/modules/auth/auth.controller.ts` | Thin HTTP handlers |
| `src/modules/auth/auth.routes.ts` | Auth route wiring |
| `src/modules/demo/demo.service.ts` | Mock vs authenticated item logic |
| `src/modules/demo/demo.controller.ts` | Demo HTTP handler |
| `src/modules/demo/demo.routes.ts` | GET `/items` with optionalAuth + public rate limit |
| `src/modules/_template/README.md` | How to add a new domain module |
| `src/routes/v1/index.ts` | Mount all module routers under `/api/v1` |
| `src/app.ts` | Express app, global middleware, mount v1 router |
| `src/server.ts` | Bootstrap, graceful shutdown, unhandled rejection handlers |
| `tests/helpers/setup.ts` | Load test env, connect DB, cleanup between tests |
| `tests/helpers/test-app.ts` | Export configured app for supertest |
| `tests/integration/health.test.ts` | Ping + readiness tests |
| `tests/integration/auth.test.ts` | Full auth flow tests |
| `tests/integration/demo.test.ts` | Guest mock + authenticated demo tests |
| `tests/unit/demo.service.test.ts` | Mock-vs-real unit test |

---

## Prerequisites

Before Task 1, ensure:

- Node.js 20+ installed
- Docker available (for local PostgreSQL via `docker-compose.yml`)
- Working directory: `/home/francisco/repos/cv-workspace/personal-api`

---

### Task 1: Project scaffold

**Files:**
- Create: `personal-api/package.json`
- Create: `personal-api/tsconfig.json`
- Create: `personal-api/.gitignore`
- Create: `personal-api/docker-compose.yml`

- [x] **Step 1: Create package.json**

```json
{
  "name": "personal-api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:push": "prisma db push"
  },
  "dependencies": {
    "@prisma/client": "^6.9.0",
    "bcryptjs": "^3.0.2",
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "express-rate-limit": "^7.5.0",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.2",
    "pino": "^9.7.0",
    "pino-http": "^10.4.0",
    "zod": "^3.25.67"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.18",
    "@types/express": "^4.17.22",
    "@types/jsonwebtoken": "^9.0.9",
    "@types/node": "^22.15.29",
    "@types/supertest": "^6.0.3",
    "prisma": "^6.9.0",
    "supertest": "^7.1.1",
    "tsx": "^4.19.4",
    "typescript": "^5.8.3",
    "vitest": "^3.2.4"
  }
}
```

- [x] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [x] **Step 3: Create .gitignore**

```
node_modules/
dist/
.env
.env.local
*.log
coverage/
```

- [x] **Step 4: Create docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: personal_api
      POSTGRES_PASSWORD: personal_api
      POSTGRES_DB: personal_api
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

- [x] **Step 5: Install dependencies**

Run: `cd personal-api && npm install`
Expected: `node_modules/` created, no errors

- [x] **Step 6: Commit**

```bash
git add personal-api/package.json personal-api/tsconfig.json personal-api/.gitignore personal-api/docker-compose.yml personal-api/package-lock.json
git commit -m "chore(personal-api): scaffold project with dependencies and docker-compose"
```

---

### Task 2: Environment config

**Files:**
- Create: `personal-api/src/config/env.ts`
- Create: `personal-api/.env.example`
- Create: `personal-api/.env` (local only, not committed)

- [x] **Step 1: Write env.ts**

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function loadEnv(): Env {
  if (cached) {
    return cached;
  }
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment: ${formatted}`);
  }
  cached = result.data;
  return cached;
}

export function getCorsOrigins(): string[] {
  return loadEnv().CORS_ORIGINS.split(',').map((origin) => origin.trim());
}
```

- [x] **Step 2: Create .env.example**

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://personal_api:personal_api@localhost:5432/personal_api
JWT_ACCESS_SECRET=change-me-to-a-random-string-at-least-32-chars
JWT_REFRESH_SECRET=change-me-to-another-random-string-at-least-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

- [x] **Step 3: Copy .env.example to .env for local dev**

Run: `cp personal-api/.env.example personal-api/.env`
Edit secrets to unique random strings (32+ chars each).

- [x] **Step 4: Commit**

```bash
git add personal-api/src/config/env.ts personal-api/.env.example
git commit -m "feat(personal-api): add Zod-validated environment config"
```

---

### Task 3: Core errors and utilities

**Files:**
- Create: `personal-api/src/core/errors/app-error.ts`
- Create: `personal-api/src/core/lib/async-handler.ts`
- Create: `personal-api/src/core/lib/logger.ts`
- Create: `personal-api/src/types/express.d.ts`

- [x] **Step 1: Write app-error.ts**

```typescript
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = code;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(409, 'CONFLICT', message);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Request validation failed', details?: unknown) {
    super(422, 'VALIDATION_ERROR', message, details);
  }
}
```

- [x] **Step 2: Write async-handler.ts**

```typescript
import type { NextFunction, Request, Response } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export function asyncHandler(fn: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void fn(req, res, next).catch(next);
  };
}
```

- [x] **Step 3: Write logger.ts**

```typescript
import pino from 'pino';
import { loadEnv } from '../../config/env.js';

export const logger = pino({
  level: loadEnv().NODE_ENV === 'production' ? 'info' : 'debug',
});
```

- [x] **Step 4: Write express.d.ts**

```typescript
import type { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
    interface Locals {
      validated?: unknown;
    }
  }
}

export {};
```

- [x] **Step 5: Commit**

```bash
git add personal-api/src/core/errors/app-error.ts personal-api/src/core/lib/async-handler.ts personal-api/src/core/lib/logger.ts personal-api/src/types/express.d.ts
git commit -m "feat(personal-api): add core errors, async handler, logger, and Express types"
```

---

### Task 4: Prisma schema and database client

**Files:**
- Create: `personal-api/prisma/schema.prisma`
- Create: `personal-api/src/db/client.ts`

- [x] **Step 1: Start PostgreSQL**

Run: `cd personal-api && docker compose up -d`
Expected: postgres container running on port 5432

- [x] **Step 2: Write prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

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
```

- [x] **Step 3: Run initial migration**

Run: `cd personal-api && npx prisma migrate dev --name init`
Expected: Migration created, Prisma client generated

- [x] **Step 4: Write db/client.ts**

```typescript
import { PrismaClient } from '@prisma/client';
import { loadEnv } from '../config/env.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: loadEnv().NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (loadEnv().NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

- [x] **Step 5: Commit**

```bash
git add personal-api/prisma/ personal-api/src/db/client.ts
git commit -m "feat(personal-api): add Prisma schema with User and RefreshToken models"
```

---

### Task 5: Error handler and validate middleware

**Files:**
- Create: `personal-api/src/core/middleware/error-handler.ts`
- Create: `personal-api/src/core/middleware/validate.ts`
- Create: `personal-api/tests/unit/validate.middleware.test.ts`

- [x] **Step 1: Write the failing validate middleware test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from '../../src/core/middleware/validate.js';

describe('validateBody', () => {
  it('calls next and sets res.locals.validated on valid body', () => {
    const schema = z.object({ email: z.string().email() });
    const middleware = validateBody(schema);
    const req = { body: { email: 'test@example.com' } } as Request;
    const res = { locals: {} } as Response;
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.locals.validated).toEqual({ email: 'test@example.com' });
  });

  it('returns 422 on invalid body', () => {
    const schema = z.object({ email: z.string().email() });
    const middleware = validateBody(schema);
    const req = { body: { email: 'not-an-email' }, path: '/test' } as Request;
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = { locals: {}, status } as unknown as Response;
    const next = vi.fn();

    middleware(req, res, next);

    expect(status).toHaveBeenCalledWith(422);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'VALIDATION_ERROR' }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `cd personal-api && npx vitest run tests/unit/validate.middleware.test.ts`
Expected: FAIL — module not found

- [x] **Step 3: Write validate.ts**

```typescript
import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

function formatValidationResponse(req: Request, issues: unknown) {
  return {
    error: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    details: issues,
    timestamp: new Date().toISOString(),
    path: req.path,
  };
}

export function validateBody<T extends ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(422).json(formatValidationResponse(req, result.error.issues));
      return;
    }
    res.locals.validated = result.data;
    next();
  };
}

export function getValidated<T>(res: Response): T {
  return res.locals.validated as T;
}
```

- [x] **Step 4: Write error-handler.ts**

```typescript
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { logger } from '../lib/logger.js';
import { loadEnv } from '../../config/env.js';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      details: err.details,
      timestamp: new Date().toISOString(),
      path: req.path,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err.issues,
      timestamp: new Date().toISOString(),
      path: req.path,
    });
    return;
  }

  logger.error({ err, path: req.path }, 'Unhandled error');

  const message =
    loadEnv().NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err instanceof Error
        ? err.message
        : 'An unexpected error occurred';

  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message,
    timestamp: new Date().toISOString(),
    path: req.path,
  });
}
```

- [x] **Step 5: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    setupFiles: ['./tests/helpers/setup.ts'],
    testTimeout: 30000,
  },
});
```

- [x] **Step 6: Run test to verify it passes**

Run: `cd personal-api && npx vitest run tests/unit/validate.middleware.test.ts`
Expected: PASS (setup.ts can be a stub for now — create empty file if needed)

- [x] **Step 7: Commit**

```bash
git add personal-api/src/core/middleware/ personal-api/tests/unit/validate.middleware.test.ts personal-api/vitest.config.ts
git commit -m "feat(personal-api): add error handler and Zod validate middleware"
```

---

### Task 6: Token utilities

**Files:**
- Create: `personal-api/src/core/lib/token.ts`
- Create: `personal-api/tests/unit/token.test.ts`

- [x] **Step 1: Write failing token tests**

```typescript
import { describe, it, expect } from 'vitest';
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../../src/core/lib/token.js';
import type { AuthUser } from '../../src/types/express.js';

const testUser: AuthUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
};

describe('token utilities', () => {
  it('signs and verifies access token', () => {
    const token = signAccessToken(testUser);
    const payload = verifyAccessToken(token);
    expect(payload.id).toBe(testUser.id);
    expect(payload.email).toBe(testUser.email);
  });

  it('generates refresh token and consistent hash', () => {
    const raw = generateRefreshToken();
    expect(raw.length).toBeGreaterThan(20);
    const hash1 = hashRefreshToken(raw);
    const hash2 = hashRefreshToken(raw);
    expect(hash1).toBe(hash2);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `cd personal-api && npx vitest run tests/unit/token.test.ts`
Expected: FAIL

- [x] **Step 3: Write token.ts**

```typescript
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { loadEnv } from '../../config/env.js';
import type { AuthUser } from '../../types/express.js';
import { UnauthorizedError } from '../errors/app-error.js';

export interface AccessTokenPayload {
  id: string;
  email: string;
  name: string;
  role: AuthUser['role'];
}

export function signAccessToken(user: AuthUser): string {
  const env = loadEnv();
  const payload: AccessTokenPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, loadEnv().JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto
    .createHmac('sha256', loadEnv().JWT_REFRESH_SECRET)
    .update(token)
    .digest('hex');
}

export function getRefreshTokenExpiry(): Date {
  const days = 7;
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return expires;
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `cd personal-api && DATABASE_URL=postgresql://personal_api:personal_api@localhost:5432/personal_api JWT_ACCESS_SECRET=test-access-secret-minimum-32-characters JWT_REFRESH_SECRET=test-refresh-secret-minimum-32-chars npx vitest run tests/unit/token.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add personal-api/src/core/lib/token.ts personal-api/tests/unit/token.test.ts
git commit -m "feat(personal-api): add JWT access and refresh token utilities"
```

---

### Task 7: Auth middleware

**Files:**
- Create: `personal-api/src/core/middleware/authenticate.ts`
- Create: `personal-api/src/core/middleware/optional-auth.ts`

- [x] **Step 1: Write authenticate.ts**

```typescript
import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/app-error.js';
import { verifyAccessToken } from '../lib/token.js';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing access token'));
    return;
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
    next();
  } catch (err) {
    next(err);
  }
}
```

- [x] **Step 2: Write optional-auth.ts**

```typescript
import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../lib/token.js';

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    // Invalid token on optional route — treat as anonymous
  }
  next();
}
```

- [x] **Step 3: Commit**

```bash
git add personal-api/src/core/middleware/authenticate.ts personal-api/src/core/middleware/optional-auth.ts
git commit -m "feat(personal-api): add authenticate and optionalAuth middleware"
```

---

### Task 8: Rate limiting middleware

**Files:**
- Create: `personal-api/src/core/middleware/rate-limit.ts`

- [x] **Step 1: Write rate-limit.ts**

```typescript
import rateLimit from 'express-rate-limit';

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).set('Retry-After', '60').json({
      error: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded',
      timestamp: new Date().toISOString(),
    });
  },
});

export const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).set('Retry-After', '60').json({
      error: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded for public routes',
      timestamp: new Date().toISOString(),
    });
  },
});
```

- [x] **Step 2: Commit**

```bash
git add personal-api/src/core/middleware/rate-limit.ts
git commit -m "feat(personal-api): add global and public rate limiters"
```

---

### Task 9: Health module (TDD)

**Files:**
- Create: `personal-api/src/modules/health/health.controller.ts`
- Create: `personal-api/src/modules/health/health.routes.ts`
- Create: `personal-api/tests/helpers/setup.ts`
- Create: `personal-api/tests/helpers/test-app.ts`
- Create: `personal-api/tests/integration/health.test.ts`

- [x] **Step 1: Write test helpers**

`tests/helpers/setup.ts`:

```typescript
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../../src/db/client.js';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ??
    'postgresql://personal_api:personal_api@localhost:5432/personal_api';
  process.env.JWT_ACCESS_SECRET =
    process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-minimum-32-characters';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-minimum-32-chars';
  process.env.CORS_ORIGINS = 'http://localhost:5173';
  await prisma.$connect();
});

beforeEach(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

`tests/helpers/test-app.ts`:

```typescript
import { createApp } from '../../src/app.js';

export function getTestApp() {
  return createApp();
}
```

- [x] **Step 2: Write failing health integration test**

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../helpers/test-app.js';

describe('health endpoints', () => {
  it('GET /api/v1/health/ping returns 200 with status ok', async () => {
    const app = getTestApp();
    const res = await request(app).get('/api/v1/health/ping');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /api/v1/health returns 200 when database is connected', async () => {
    const app = getTestApp();
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });
});
```

- [x] **Step 3: Run test to verify it fails**

Run: `cd personal-api && npx vitest run tests/integration/health.test.ts`
Expected: FAIL — `createApp` not found

- [x] **Step 4: Write health.controller.ts**

```typescript
import type { Request, Response } from 'express';
import { prisma } from '../../db/client.js';
import { asyncHandler } from '../../core/lib/async-handler.js';

export const ping = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

export const readiness = asyncHandler(async (_req: Request, res: Response) => {
  await prisma.$queryRaw`SELECT 1`;
  res.status(200).json({ status: 'ok', database: 'connected' });
});
```

- [x] **Step 5: Write health.routes.ts**

```typescript
import { Router } from 'express';
import { ping, readiness } from './health.controller.js';

export const healthRouter = Router();

healthRouter.get('/ping', ping);
healthRouter.get('/', readiness);
```

- [x] **Step 6: Write minimal app.ts and v1 router (enough for health tests)**

`src/routes/v1/index.ts`:

```typescript
import { Router } from 'express';
import { healthRouter } from '../../modules/health/health.routes.js';

export const v1Router = Router();

v1Router.use('/health', healthRouter);
```

`src/app.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { getCorsOrigins, loadEnv } from './config/env.js';
import { errorHandler } from './core/middleware/error-handler.js';
import { globalRateLimiter } from './core/middleware/rate-limit.js';
import { logger } from './core/lib/logger.js';
import { v1Router } from './routes/v1/index.js';

export function createApp() {
  loadEnv();
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: getCorsOrigins(), credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));
  app.use(globalRateLimiter);
  app.use('/api/v1', v1Router);
  app.use(errorHandler);
  return app;
}
```

- [x] **Step 7: Run test to verify it passes**

Run: `cd personal-api && npx vitest run tests/integration/health.test.ts`
Expected: PASS

- [x] **Step 8: Commit**

```bash
git add personal-api/src/modules/health/ personal-api/src/routes/ personal-api/src/app.ts personal-api/tests/
git commit -m "feat(personal-api): add health ping and readiness endpoints with tests"
```

---

### Task 10: Auth module — schemas and repository

**Files:**
- Create: `personal-api/src/modules/auth/auth.schemas.ts`
- Create: `personal-api/src/modules/auth/auth.repository.ts`

- [x] **Step 1: Write auth.schemas.ts**

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
```

- [x] **Step 2: Write auth.repository.ts**

```typescript
import type { User, Role } from '@prisma/client';
import { prisma } from '../../db/client.js';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  name: string;
  role?: Role;
}

export const authRepository = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({ data });
  },

  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  },

  async findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  },

  async deleteRefreshToken(tokenHash: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  },

  async deleteAllRefreshTokensForUser(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },
};
```

- [x] **Step 3: Commit**

```bash
git add personal-api/src/modules/auth/auth.schemas.ts personal-api/src/modules/auth/auth.repository.ts
git commit -m "feat(personal-api): add auth schemas and repository"
```

---

### Task 11: Auth module — service

**Files:**
- Create: `personal-api/src/modules/auth/auth.service.ts`
- Create: `personal-api/tests/unit/auth.service.test.ts`

- [x] **Step 1: Write failing auth service unit test**

```typescript
import { describe, it, expect } from 'vitest';
import { authService } from '../../src/modules/auth/auth.service.js';

describe('authService.register', () => {
  it('creates a user and returns tokens', async () => {
    const result = await authService.register({
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
    });
    expect(result.user.email).toBe('newuser@example.com');
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it('throws ConflictError for duplicate email', async () => {
    await authService.register({
      email: 'dup@example.com',
      password: 'password123',
      name: 'First',
    });
    await expect(
      authService.register({
        email: 'dup@example.com',
        password: 'password123',
        name: 'Second',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `cd personal-api && npx vitest run tests/unit/auth.service.test.ts`
Expected: FAIL

- [x] **Step 3: Write auth.service.ts**

```typescript
import bcrypt from 'bcryptjs';
import type { AuthUser } from '../../types/express.js';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../core/errors/app-error.js';
import {
  generateRefreshToken,
  getRefreshTokenExpiry,
  hashRefreshToken,
  signAccessToken,
} from '../../core/lib/token.js';
import { authRepository } from './auth.repository.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

const BCRYPT_ROUNDS = 12;

function toAuthUser(user: {
  id: string;
  email: string;
  name: string;
  role: AuthUser['role'];
}): AuthUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

function publicUser(user: AuthUser) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

async function issueTokenPair(user: AuthUser) {
  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  await authRepository.saveRefreshToken(user.id, tokenHash, getRefreshTokenExpiry());
  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await authRepository.create({
      email: input.email,
      passwordHash,
      name: input.name,
    });
    const authUser = toAuthUser(user);
    const tokens = await issueTokenPair(authUser);
    return { user: publicUser(authUser), ...tokens };
  },

  async login(input: LoginInput) {
    const user = await authRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }
    const authUser = toAuthUser(user);
    const tokens = await issueTokenPair(authUser);
    return { user: publicUser(authUser), ...tokens };
  },

  async refresh(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await authRepository.findRefreshToken(tokenHash);
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    await authRepository.deleteRefreshToken(tokenHash);
    const authUser = toAuthUser(stored.user);
    const tokens = await issueTokenPair(authUser);
    return tokens;
  },

  async logout(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);
    await authRepository.deleteRefreshToken(tokenHash);
  },

  async me(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return publicUser(toAuthUser(user));
  },
};
```

- [x] **Step 4: Run test to verify it passes**

Run: `cd personal-api && npx vitest run tests/unit/auth.service.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add personal-api/src/modules/auth/auth.service.ts personal-api/tests/unit/auth.service.test.ts
git commit -m "feat(personal-api): add auth service with register, login, refresh, logout, me"
```

---

### Task 12: Auth module — controller and routes

**Files:**
- Create: `personal-api/src/modules/auth/auth.controller.ts`
- Create: `personal-api/src/modules/auth/auth.routes.ts`
- Modify: `personal-api/src/routes/v1/index.ts`

- [x] **Step 1: Write auth.controller.ts**

```typescript
import type { Request, Response } from 'express';
import { asyncHandler } from '../../core/lib/async-handler.js';
import { getValidated } from '../../core/middleware/validate.js';
import { UnauthorizedError } from '../../core/errors/app-error.js';
import { authService } from './auth.service.js';
import type {
  LoginInput,
  LogoutInput,
  RefreshInput,
  RegisterInput,
} from './auth.schemas.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = getValidated<RegisterInput>(res);
  const result = await authService.register(input);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = getValidated<LoginInput>(res);
  const result = await authService.login(input);
  res.status(200).json(result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const input = getValidated<RefreshInput>(res);
  const tokens = await authService.refresh(input.refreshToken);
  res.status(200).json(tokens);
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  const input = getValidated<LogoutInput>(res);
  await authService.logout(input.refreshToken);
  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('Missing access token');
  }
  const user = await authService.me(req.user.id);
  res.status(200).json({ user });
});
```

- [x] **Step 2: Write auth.routes.ts**

```typescript
import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { validateBody } from '../../core/middleware/validate.js';
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
} from './auth.schemas.js';
import { login, logout, me, refresh, register } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), register);
authRouter.post('/login', validateBody(loginSchema), login);
authRouter.post('/refresh', validateBody(refreshSchema), refresh);
authRouter.post('/logout', validateBody(logoutSchema), logout);
authRouter.get('/me', authenticate, me);
```

- [x] **Step 3: Mount auth router in v1/index.ts**

Add to `src/routes/v1/index.ts`:

```typescript
import { authRouter } from '../../modules/auth/auth.routes.js';

// inside v1Router setup:
v1Router.use('/auth', authRouter);
```

- [x] **Step 4: Commit**

```bash
git add personal-api/src/modules/auth/auth.controller.ts personal-api/src/modules/auth/auth.routes.ts personal-api/src/routes/v1/index.ts
git commit -m "feat(personal-api): wire auth controller and routes"
```

---

### Task 13: Auth integration tests

**Files:**
- Create: `personal-api/tests/integration/auth.test.ts`

- [x] **Step 1: Write auth integration tests**

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../helpers/test-app.js';

describe('auth endpoints', () => {
  const app = getTestApp();

  it('POST /api/v1/auth/register with valid body returns 201', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'register@example.com',
      password: 'password123',
      name: 'Register Test',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('register@example.com');
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  it('POST /api/v1/auth/register with invalid email returns 422', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      password: 'password123',
      name: 'Bad Email',
    });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/login returns 200 with tokens', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'login@example.com',
      password: 'password123',
      name: 'Login Test',
    });
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it('GET /api/v1/auth/me without token returns 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/auth/me with valid token returns 200', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send({
      email: 'me@example.com',
      password: 'password123',
      name: 'Me Test',
    });
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@example.com');
  });

  it('POST /api/v1/auth/refresh rotates tokens', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send({
      email: 'refresh@example.com',
      password: 'password123',
      name: 'Refresh Test',
    });
    const res = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: registerRes.body.refreshToken,
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.refreshToken).not.toBe(registerRes.body.refreshToken);
  });

  it('POST /api/v1/auth/logout returns 204', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send({
      email: 'logout@example.com',
      password: 'password123',
      name: 'Logout Test',
    });
    const res = await request(app).post('/api/v1/auth/logout').send({
      refreshToken: registerRes.body.refreshToken,
    });
    expect(res.status).toBe(204);
  });
});
```

- [x] **Step 2: Run tests**

Run: `cd personal-api && npx vitest run tests/integration/auth.test.ts`
Expected: All PASS

- [x] **Step 3: Commit**

```bash
git add personal-api/tests/integration/auth.test.ts
git commit -m "test(personal-api): add auth integration tests"
```

---

### Task 14: Demo module — guest mock pattern

**Files:**
- Create: `personal-api/src/mocks/index.ts`
- Create: `personal-api/src/modules/demo/demo.service.ts`
- Create: `personal-api/src/modules/demo/demo.controller.ts`
- Create: `personal-api/src/modules/demo/demo.routes.ts`
- Create: `personal-api/tests/integration/demo.test.ts`
- Create: `personal-api/tests/unit/demo.service.test.ts`
- Modify: `personal-api/src/routes/v1/index.ts`

- [x] **Step 1: Write mocks/index.ts**

```typescript
export interface DemoItem {
  id: string;
  name: string;
  description: string;
}

export const mockDemoItems: DemoItem[] = [
  {
    id: 'mock-1',
    name: 'Sample Item A',
    description: 'Mock data for anonymous guests',
  },
  {
    id: 'mock-2',
    name: 'Sample Item B',
    description: 'Read-only preview content',
  },
];
```

- [x] **Step 2: Write failing demo service unit test**

```typescript
import { describe, it, expect } from 'vitest';
import { demoService } from '../../src/modules/demo/demo.service.js';

describe('demoService.getItems', () => {
  it('returns mock items for anonymous user', async () => {
    const items = await demoService.getItems(undefined);
    expect(items.source).toBe('mock');
    expect(items.items.length).toBeGreaterThan(0);
    expect(items.items[0]?.id).toMatch(/^mock-/);
  });

  it('returns authenticated source for logged-in user', async () => {
    const items = await demoService.getItems({
      id: 'user-1',
      email: 'u@example.com',
      name: 'User',
      role: 'USER',
    });
    expect(items.source).toBe('authenticated');
    expect(items.items).toEqual([]);
  });
});
```

- [x] **Step 3: Run test to verify it fails**

Run: `cd personal-api && npx vitest run tests/unit/demo.service.test.ts`
Expected: FAIL

- [x] **Step 4: Write demo.service.ts**

```typescript
import { mockDemoItems } from '../../mocks/index.js';
import type { AuthUser } from '../../types/express.js';

export const demoService = {
  async getItems(user: AuthUser | undefined) {
    if (!user) {
      return { source: 'mock' as const, items: mockDemoItems };
    }
    return { source: 'authenticated' as const, items: [] };
  },
};
```

- [x] **Step 5: Write demo.controller.ts and demo.routes.ts**

`demo.controller.ts`:

```typescript
import type { Request, Response } from 'express';
import { asyncHandler } from '../../core/lib/async-handler.js';
import { demoService } from './demo.service.js';

export const getItems = asyncHandler(async (req: Request, res: Response) => {
  const result = await demoService.getItems(req.user);
  res.status(200).json(result);
});
```

`demo.routes.ts`:

```typescript
import { Router } from 'express';
import { optionalAuth } from '../../core/middleware/optional-auth.js';
import { publicRateLimiter } from '../../core/middleware/rate-limit.js';
import { getItems } from './demo.controller.js';

export const demoRouter = Router();

demoRouter.get('/items', publicRateLimiter, optionalAuth, getItems);
```

- [x] **Step 6: Mount demo router in v1/index.ts**

```typescript
import { demoRouter } from '../../modules/demo/demo.routes.js';

v1Router.use('/demo', demoRouter);
```

- [x] **Step 7: Write demo integration test**

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../helpers/test-app.js';

describe('demo endpoints', () => {
  const app = getTestApp();

  it('GET /api/v1/demo/items without token returns mock data', async () => {
    const res = await request(app).get('/api/v1/demo/items');
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('mock');
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/demo/items with token returns authenticated source', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send({
      email: 'demo@example.com',
      password: 'password123',
      name: 'Demo User',
    });
    const res = await request(app)
      .get('/api/v1/demo/items')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('authenticated');
  });
});
```

- [x] **Step 8: Run all tests**

Run: `cd personal-api && npx vitest run`
Expected: All PASS

- [x] **Step 9: Commit**

```bash
git add personal-api/src/mocks/ personal-api/src/modules/demo/ personal-api/tests/integration/demo.test.ts personal-api/tests/unit/demo.service.test.ts personal-api/src/routes/v1/index.ts
git commit -m "feat(personal-api): add demo module with anonymous mock guest pattern"
```

---

### Task 15: Server bootstrap and graceful shutdown

**Files:**
- Create: `personal-api/src/server.ts`

- [x] **Step 1: Write server.ts**

```typescript
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { logger } from './core/lib/logger.js';
import { prisma } from './db/client.js';

async function main() {
  const env = loadEnv();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'Server started');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
    process.exit(1);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
```

- [x] **Step 2: Verify dev server starts**

Run: `cd personal-api && npm run dev`
Expected: `Server started` on port 3000

Run in another terminal:
```bash
curl http://localhost:3000/api/v1/health/ping
```
Expected: `{"status":"ok"}`

- [x] **Step 3: Commit**

```bash
git add personal-api/src/server.ts
git commit -m "feat(personal-api): add server bootstrap with graceful shutdown"
```

---

### Task 16: Railway deployment config

**Files:**
- Create: `personal-api/railway.toml`
- Modify: `personal-api/package.json` (add start script with migrate)

- [x] **Step 1: Write railway.toml**

```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build && npx prisma generate"

[deploy]
startCommand = "npx prisma migrate deploy && node dist/server.js"
healthcheckPath = "/api/v1/health/ping"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

- [x] **Step 2: Verify production build**

Run: `cd personal-api && npm run build`
Expected: `dist/` folder created with no TypeScript errors

- [x] **Step 3: Commit**

```bash
git add personal-api/railway.toml
git commit -m "chore(personal-api): add Railway deployment configuration"
```

---

### Task 17: Module template and README

**Files:**
- Create: `personal-api/src/modules/_template/README.md`
- Create: `personal-api/README.md`

- [x] **Step 1: Write module template README**

```markdown
# Adding a new domain module

1. Create `src/modules/<name>/` with:
   - `<name>.schemas.ts` — Zod schemas, export types via `z.infer`
   - `<name>.repository.ts` — Prisma DB access only
   - `<name>.service.ts` — Business logic; use `mocks/` for anonymous guest data
   - `<name>.controller.ts` — Thin handlers using `asyncHandler`
   - `<name>.routes.ts` — Wire middleware: `optionalAuth` or `authenticate`, rate limiters

2. Mount in `src/routes/v1/index.ts`:
   ```typescript
   v1Router.use('/<name>', <name>Router);
   ```

3. Add integration tests in `tests/integration/<name>.test.ts`

4. For guest-accessible read routes:
   - Use `publicRateLimiter` + `optionalAuth`
   - In service: `if (!user) return mocks; else return repository`
```

- [x] **Step 2: Write project README.md**

Include: purpose, prerequisites, local setup (`docker compose up`, `cp .env.example .env`, `npm run db:migrate`, `npm run dev`), test command, env var table, endpoint list, Railway deploy steps.

- [x] **Step 3: Commit**

```bash
git add personal-api/README.md personal-api/src/modules/_template/README.md
git commit -m "docs(personal-api): add README and module template guide"
```

---

### Task 18: Final verification

- [x] **Step 1: Run full test suite**

Run: `cd personal-api && npx vitest run`
Expected: All tests PASS

- [x] **Step 2: Run TypeScript build**

Run: `cd personal-api && npm run build`
Expected: No errors

- [x] **Step 3: Manual smoke test**

```bash
# Register
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke@example.com","password":"password123","name":"Smoke Test"}'

# Guest demo
curl -s http://localhost:3000/api/v1/demo/items

# Health
curl -s http://localhost:3000/api/v1/health
```

Expected: 201 register, 200 mock demo items, 200 health with database connected

- [x] **Step 4: Final commit if any fixes were needed**

```bash
git add -A personal-api/
git commit -m "chore(personal-api): v1 tracer bullet complete"
```

---

### Task 19: Create GitHub repo and push via SSH

**Prerequisites:**
- Task 18 complete (all code committed locally)
- `gh auth status` shows logged-in account (`FranciscoVeloz1`) with **Git operations protocol: ssh**
- SSH key loaded (`ssh -T git@github.com` succeeds)

**Files:**
- Create: `personal-api/.git/` (standalone repo — independent from `cv-workspace`)
- Remote: `git@github.com:FranciscoVeloz1/personal-api.git`

> **Note:** `personal-api/` lives inside `cv-workspace/` but gets its **own git repository** so it can deploy to Railway independently. Do not push from the `cv-workspace` root for this project.

- [x] **Step 1: Verify gh auth uses SSH**

Run: `gh auth status`
Expected output includes:
```
github.com
  ✓ Logged in to github.com account FranciscoVeloz1
  - Git operations protocol: ssh
```

If protocol shows `https`, switch it:
```bash
gh config set git_protocol ssh
```

- [x] **Step 2: Verify SSH key works with GitHub**

Run: `ssh -T git@github.com`
Expected: `Hi FranciscoVeloz1! You've successfully authenticated...`

- [x] **Step 3: Initialize standalone git repo in personal-api**

Run:
```bash
cd personal-api
git init -b main
git add .
git status
```

Expected: all project files staged; `.env` must **not** appear (covered by `.gitignore`)

- [x] **Step 4: Create initial commit (if not already committed in Task 18)**

Run:
```bash
git commit -m "$(cat <<'EOF'
feat: personal-api v1 — shared platform REST API

Express + TypeScript modular monolith with JWT auth, health endpoints,
anonymous guest demo route, Prisma/PostgreSQL, and Railway config.
EOF
)"
```

- [x] **Step 5: Create GitHub repo and push via SSH**

Run:
```bash
cd personal-api
gh repo create personal-api \
  --private \
  --description "Shared platform REST API — Express, TypeScript, PostgreSQL, JWT auth" \
  --source=. \
  --remote=origin \
  --push
```

Flags explained:
- `--private` — private repo (use `--public` if you prefer open source)
- `--source=.` — use current directory as the local repo
- `--remote=origin` — set `origin` remote automatically
- `--push` — push `main` branch after creation

Expected output:
```
✓ Created repository FranciscoVeloz1/personal-api on GitHub
✓ Added remote git@github.com:FranciscoVeloz1/personal-api.git
✓ Pushed commits to git@github.com:FranciscoVeloz1/personal-api.git
```

- [x] **Step 6: Verify remote uses SSH (not HTTPS)**

Run:
```bash
cd personal-api
git remote -v
```

Expected:
```
origin  git@github.com:FranciscoVeloz1/personal-api.git (fetch)
origin  git@github.com:FranciscoVeloz1/personal-api.git (push)
```

If remote shows HTTPS, fix and re-push:
```bash
git remote set-url origin git@github.com:FranciscoVeloz1/personal-api.git
git push -u origin main
```

- [x] **Step 7: Verify repo on GitHub**

Run:
```bash
gh repo view FranciscoVeloz1/personal-api --json name,url,visibility,defaultBranchRef --jq '{name, url, visibility, branch: .defaultBranchRef.name}'
```

Expected:
```json
{
  "branch": "main",
  "name": "personal-api",
  "url": "https://github.com/FranciscoVeloz1/personal-api",
  "visibility": "PRIVATE"
}
```

- [x] **Step 8: (Optional) Connect Railway to GitHub repo**

In Railway dashboard:
1. New Project → Deploy from GitHub repo
2. Select `FranciscoVeloz1/personal-api`
3. Add PostgreSQL plugin (Railway injects `DATABASE_URL`)
4. Set env vars: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGINS`
5. Deploy — Railway runs `prisma migrate deploy && node dist/server.js` per `railway.toml`

Or via CLI (if Railway CLI installed):
```bash
cd personal-api
railway login
railway init
railway add --database postgres
railway up
```

---

## Spec coverage self-review

| Spec requirement | Task |
|------------------|------|
| Modular monolith folder structure | Tasks 1, 9, 12, 14, 17 |
| PostgreSQL + Prisma schema | Task 4 |
| Env validation (Zod) | Task 2 |
| JWT access + refresh auth | Tasks 6, 7, 10, 11, 12, 13 |
| Health ping + DB readiness | Task 9 |
| Anonymous guest mock demo route | Task 14 |
| Rate limiting (global + public) | Tasks 8, 14 |
| Error handler + consistent JSON | Task 5 |
| Security (helmet, cors, body limit) | Task 9 |
| Tests (7 minimum cases from spec) | Tasks 9, 13, 14, 18 |
| Railway config + healthcheck | Task 16 |
| `.env.example` | Task 2 |
| Module template for future domains | Task 17 |
| GitHub repo created and pushed via SSH | Task 19 |

**Gaps:** None — all v1 spec items mapped to tasks.

**Placeholder scan:** No TBD/TODO/implement-later steps.

**Type consistency:** `AuthUser`, `RegisterInput`, `LoginInput`, token functions, and middleware signatures are defined before use in later tasks.

---

## Execution handoff

Plan complete and saved to `docs/plans/2026-07-04-personal-api-v1-implementation.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
