# TypeScript Patterns for Express APIs

## Express Request Augmentation

Declare custom properties once; avoid `req as Foo` casts in handlers.

```typescript
// src/types/express.d.ts
import type { AuthUser } from './auth.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
```

For per-route validated data, use a generic middleware (below) or namespace specific routers.

## Generic Validation Middleware

```typescript
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { z } from 'zod';

type RequestSource = 'body' | 'query' | 'params';

export function validate<T extends z.ZodType>(
  schema: T,
  source: RequestSource = 'body'
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(422).json({
        error: 'ValidationError',
        message: 'Request validation failed',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    res.locals.validated = result.data;
    next();
  };
}

// Typed accessor in controllers
import type { z } from 'zod';

export function getValidated<T extends z.ZodType>(res: Response): z.infer<T> {
  return res.locals.validated as z.infer<T>;
}
```

Usage:

```typescript
router.post('/', validate(createUserSchema), asyncHandler(async (req, res) => {
  const input = getValidated<typeof createUserSchema>(res);
  const user = await userService.create(input);
  res.status(201).json(user);
}));
```

## Schema-First Types (Zod)

```typescript
// src/schemas/user.schema.ts
import { z } from 'zod';

export const userStatusSchema = z.enum(['active', 'inactive', 'suspended']);

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8),
  status: userStatusSchema.default('active'),
});

export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .partial();

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  status: userStatusSchema.optional(),
  search: z.string().optional(),
});

// Infer — single source of truth
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
```

## Typed Service Layer

```typescript
// src/types/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

// src/services/user.service.ts
import type { CreateUserInput, UpdateUserInput, ListUsersQuery } from '../schemas/user.schema.js';
import type { PaginatedResult } from '../types/pagination.js';
import type { User } from '../types/user.js';

export interface UserService {
  list(query: ListUsersQuery): Promise<PaginatedResult<User>>;
  getById(id: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, input: UpdateUserInput): Promise<User>;
  delete(id: string): Promise<void>;
}
```

## Shared Generic Types

```typescript
// src/types/pagination.ts
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const pages = Math.ceil(total / pageSize);
  return {
    items,
    total,
    page,
    pageSize,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
}
```

## Environment Variables

Validate at startup — fail fast before accepting traffic.

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  JWT_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
```

## Typed Error Classes

```typescript
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = code;
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
```

## Async Handler (Typed)

```typescript
import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const asyncHandler =
  (fn: AsyncRequestHandler): RequestHandler =>
  (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
```

## GraphQL Codegen

Generate resolver types from schema — avoid hand-written resolver signatures.

```yaml
# codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'src/graphql/**/*.graphql',
  generates: {
    'src/graphql/generated/types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        contextType: '../context#GraphQLContext',
        mappers: {
          User: '../types/user#User',
        },
      },
    },
  },
};

export default config;
```

```typescript
// src/graphql/context.ts
import type { AuthUser } from '../types/auth.js';
import type { Loaders } from './loaders.js';

export interface GraphQLContext {
  user: AuthUser | null;
  loaders: Loaders;
}
```

```typescript
// src/graphql/resolvers/user.resolvers.ts
import type { Resolvers } from '../generated/types.js';

export const userResolvers: Resolvers = {
  Query: {
    user: async (_parent, { id }, ctx) => {
      return ctx.loaders.user.load(id);
    },
  },
  User: {
    orders: async (parent, _args, ctx) => {
      return ctx.loaders.ordersByUser.load(parent.id);
    },
  },
};
```

## OpenAPI from Zod

```typescript
import { createDocument } from 'zod-openapi';
import { createUserSchema } from '../schemas/user.schema.js';

export const openApiDocument = createDocument({
  openapi: '3.1.0',
  info: { title: 'My API', version: '1.0.0' },
  paths: {
    '/api/users': {
      post: {
        requestBody: {
          content: { 'application/json': { schema: createUserSchema } },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
  },
});
```

## Testing with Supertest

```typescript
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../app.js';
import type { User } from '../types/user.js';

describe('POST /api/users', () => {
  it('creates a user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'a@b.com', name: 'Test', password: 'password1' })
      .expect(201);

    const body = res.body as User;
    expect(body.email).toBe('a@b.com');
  });
});
```

## Naming Conventions

| Layer | Convention | Example |
|-------|------------|---------|
| Files | kebab-case | `user.service.ts` |
| Types/Interfaces | PascalCase | `CreateUserInput` |
| Zod schemas | camelCase + `Schema` suffix | `createUserSchema` |
| Route files | `*.routes.ts` | `users.routes.ts` |
| JSON API fields | snake_case or camelCase — pick one, stay consistent | `created_at` or `createdAt` |
