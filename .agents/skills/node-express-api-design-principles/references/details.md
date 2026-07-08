# node-express-api-design-principles — detailed patterns and worked examples (TypeScript)

## REST API Design Patterns

### Pattern 1: Resource Collection Design

```typescript
// Good: Resource-oriented endpoints
GET    /api/users              // List users (with pagination)
POST   /api/users              // Create user
GET    /api/users/:id          // Get specific user
PUT    /api/users/:id          // Replace user
PATCH  /api/users/:id          // Update user fields
DELETE /api/users/:id          // Delete user

// Nested resources
GET    /api/users/:id/orders   // Get user's orders
POST   /api/users/:id/orders   // Create order for user

// Bad: Action-oriented endpoints (avoid)
POST   /api/createUser
POST   /api/getUserById
POST   /api/deleteUser
```

### Pattern 2: Pagination and Filtering

```typescript
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  search: z.string().optional(),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  const pages = Math.ceil(total / pageSize);
  return {
    items,
    total,
    page,
    page_size: pageSize,
    pages,
    has_next: page < pages,
    has_prev: page > 1,
  };
}

// Validation middleware — see typescript-patterns.md for full generic version
export function validateQuery<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
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

// Route handler — types inferred from schema, no casts on req
export async function listUsers(req: Request, res: Response) {
  const { page, page_size, status, search } = res.locals.validated as PaginationParams;
  const query = buildQuery({ status, search });
  const total = await countUsers(query);
  const offset = (page - 1) * page_size;
  const users = await fetchUsers(query, { limit: page_size, offset });
  res.json(buildPaginatedResponse(users, total, page, page_size));
}
```

### Pattern 3: Error Handling and Status Codes

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = code;
  }
}

export const notFound = (resource: string, id: string) =>
  new AppError(404, 'NotFound', `${resource} not found`, { id });

export const validationError = (errors: Array<{ field: string; message: string }>) =>
  new AppError(422, 'ValidationError', 'Request validation failed', { errors });

// Global error handler middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      details: err.details,
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  console.error(err);
  res.status(500).json({
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    path: req.path,
  });
}

// Async handler wrapper (Express 4)
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Usage
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await fetchUser(req.params.id);
    if (!user) throw notFound('User', req.params.id);
    res.json(user);
  })
);
```

### Pattern 4: HATEOAS (Hypermedia as the Engine of Application State)

```typescript
interface UserLinks {
  self: { href: string };
  orders: { href: string };
  update: { href: string; method: 'PATCH' };
  delete: { href: string; method: 'DELETE' };
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
  _links: UserLinks;
}

function toUserResponse(user: User, baseUrl: string): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    _links: {
      self: { href: `${baseUrl}/api/users/${user.id}` },
      orders: { href: `${baseUrl}/api/users/${user.id}/orders` },
      update: { href: `${baseUrl}/api/users/${user.id}`, method: 'PATCH' },
      delete: { href: `${baseUrl}/api/users/${user.id}`, method: 'DELETE' },
    },
  };
}
```

### Pattern 5: Router Composition and Versioning

```typescript
import express from 'express';
import { usersRouter } from './routes/v1/users.routes';

const v1Router = express.Router();
v1Router.use('/users', usersRouter);

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/api/v1', v1Router);
app.use(errorHandler);
```

## GraphQL Design Patterns

### Pattern 1: Schema Design

See [graphql-schema-design.md](graphql-schema-design.md) for full schema examples. GraphQL schemas are language-agnostic.

### Pattern 2: Resolver Design (Apollo Server + Codegen)

Use `@graphql-codegen/cli` to generate `Resolvers` types. See [typescript-patterns.md](typescript-patterns.md).

```typescript
import { GraphQLError } from 'graphql';
import type { Resolvers } from '../generated/types.js';
import type { GraphQLContext } from '../context.js';

export const resolvers: Resolvers = {
  Query: {
    user: async (_parent, { id }, _ctx) => {
      return fetchUserById(id);
    },

    users: async (_parent, { first = 20, after, search }) => {
      const offset = after ? decodeCursor(after) : 0;
      const users = await fetchUsers({ limit: first + 1, offset, search });
      const hasNextPage = users.length > first;
      const nodes = hasNextPage ? users.slice(0, first) : users;

      const edges = nodes.map((user, i) => ({
        node: user,
        cursor: encodeCursor(offset + i),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: offset > 0,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges.at(-1)?.cursor ?? null,
        },
        totalCount: await countUsers({ search }),
      };
    },
  },

  User: {
    orders: async (user, { first = 20 }, ctx: GraphQLContext) => {
      const orders = await ctx.loaders.ordersByUser.load(user.id);
      return paginateOrders(orders, first);
    },
  },

  Mutation: {
    createUser: async (_parent, { input }) => {
      try {
        validateUserInput(input);
        const user = await createUser({
          email: input.email,
          name: input.name,
          password: await hashPassword(input.password),
        });
        return { user, errors: [] };
      } catch (err) {
        if (err instanceof ValidationError) {
          return { user: null, errors: [{ field: err.field, message: err.message }] };
        }
        throw new GraphQLError('Failed to create user');
      }
    },
  },
};
```

### Pattern 3: DataLoader (N+1 Problem Prevention)

```typescript
import DataLoader from 'dataloader';

export function createLoaders() {
  return {
    user: new DataLoader<string, User | null>(async (userIds) => {
      const users = await fetchUsersByIds([...userIds]);
      const userMap = new Map(users.map((u) => [u.id, u]));
      return userIds.map((id) => userMap.get(id) ?? null);
    }),

    ordersByUser: new DataLoader<string, Order[]>(async (userIds) => {
      const orders = await fetchOrdersByUserIds([...userIds]);
      const ordersByUser = new Map<string, Order[]>();
      for (const order of orders) {
        const list = ordersByUser.get(order.userId) ?? [];
        list.push(order);
        ordersByUser.set(order.userId, list);
      }
      return userIds.map((id) => ordersByUser.get(id) ?? []);
    }),
  };
}

// Apollo Server context — new loaders per request
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => ({
    user: await authenticate(req),
    loaders: createLoaders(),
  }),
});
```
