# REST API Best Practices (TypeScript, Node.js & Express)

## URL Structure

### Resource Naming

```
# Good - Plural nouns
GET /api/users
GET /api/orders
GET /api/products

# Bad - Verbs or mixed conventions
GET /api/getUser
GET /api/user  (inconsistent singular)
POST /api/createOrder
```

### Nested Resources

```
# Shallow nesting (preferred)
GET /api/users/:id/orders
GET /api/orders/:id

# Deep nesting (avoid)
GET /api/users/:id/orders/:orderId/items/:itemId/reviews
# Better:
GET /api/order-items/:id/reviews
```

## HTTP Methods and Status Codes

### GET - Retrieve Resources

```
GET /api/users              → 200 OK (with list)
GET /api/users/:id          → 200 OK or 404 Not Found
GET /api/users?page=2       → 200 OK (paginated)
```

### POST - Create Resources

```
POST /api/users
  Body: {"name": "John", "email": "john@example.com"}
  → 201 Created
  Location: /api/users/123
  Body: {"id": "123", "name": "John", ...}

POST /api/users (validation error)
  → 422 Unprocessable Entity
  Body: {"error": "ValidationError", "details": [...]}
```

### PUT - Replace Resources

```
PUT /api/users/:id
  Body: {complete user object}
  → 200 OK (updated)
  → 404 Not Found (doesn't exist)

# Must include ALL fields
```

### PATCH - Partial Update

```
PATCH /api/users/:id
  Body: {"name": "Jane"}  (only changed fields)
  → 200 OK
  → 404 Not Found
```

### DELETE - Remove Resources

```
DELETE /api/users/:id
  → 204 No Content (deleted)
  → 404 Not Found
  → 409 Conflict (can't delete due to references)
```

## Filtering, Sorting, and Searching

### Query Parameters

```
# Filtering
GET /api/users?status=active
GET /api/users?role=admin&status=active

# Sorting
GET /api/users?sort=created_at
GET /api/users?sort=-created_at  (descending)
GET /api/users?sort=name,created_at

# Searching
GET /api/users?search=john
GET /api/users?q=john

# Field selection (sparse fieldsets)
GET /api/users?fields=id,name,email
```

## Pagination Patterns

### Offset-Based Pagination

```
GET /api/users?page=2&page_size=20

Response:
{
  "items": [...],
  "page": 2,
  "page_size": 20,
  "total": 150,
  "pages": 8,
  "has_next": true,
  "has_prev": true
}
```

### Cursor-Based Pagination (for large datasets)

```
GET /api/users?limit=20&cursor=eyJpZCI6MTIzfQ

Response:
{
  "items": [...],
  "next_cursor": "eyJpZCI6MTQzfQ",
  "has_more": true
}
```

### Link Header Pagination (RESTful)

```
GET /api/users?page=2

Response Headers:
Link: <https://api.example.com/users?page=3>; rel="next",
      <https://api.example.com/users?page=1>; rel="prev",
      <https://api.example.com/users?page=1>; rel="first",
      <https://api.example.com/users?page=8>; rel="last"
```

```typescript
import { Response } from 'express';

function setPaginationLinks(res: Response, baseUrl: string, page: number, pages: number) {
  const links = [
    page < pages && `<${baseUrl}?page=${page + 1}>; rel="next"`,
    page > 1 && `<${baseUrl}?page=${page - 1}>; rel="prev"`,
    `<${baseUrl}?page=1>; rel="first"`,
    `<${baseUrl}?page=${pages}>; rel="last"`,
  ].filter(Boolean);
  res.set('Link', links.join(', '));
}
```

## Versioning Strategies

### URL Versioning (Recommended)

```
/api/v1/users
/api/v2/users

Pros: Clear, easy to route
Cons: Multiple URLs for same resource
```

```typescript
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);
```

### Header Versioning

```
GET /api/users
Accept: application/vnd.api+json; version=2

Pros: Clean URLs
Cons: Less visible, harder to test
```

### Query Parameter

```
GET /api/users?version=2

Pros: Easy to test
Cons: Optional parameter can be forgotten
```

## Rate Limiting

### Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 742
X-RateLimit-Reset: 1640000000

Response when limited:
429 Too Many Requests
Retry-After: 3600
```

### Implementation Pattern

```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).set('Retry-After', '60').json({
      error: 'TooManyRequests',
      message: 'Rate limit exceeded',
    });
  },
});

app.use('/api/', apiLimiter);
```

For distributed deployments, use `rate-limit-redis` with a shared Redis store.

## Authentication and Authorization

### Bearer Token

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

401 Unauthorized - Missing/invalid token
403 Forbidden - Valid token, insufficient permissions
```

```typescript
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { AuthUser, Role } from '../types/auth.js';
import { env } from '../config/env.js';

// Augment Express.Request in src/types/express.d.ts:
// interface Request { user?: AuthUser }

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
  }
  try {
    req.user = jwt.verify(header.slice(7), env.JWT_SECRET) as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
}

export function authorize(...roles: Role[]): RequestHandler {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions' });
    }
    next();
  };
}
```

### API Keys

```
X-API-Key: your-api-key-here
```

## Error Response Format

### Consistent Structure

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "value": "not-an-email"
    }
  ],
  "timestamp": "2025-10-16T12:00:00Z",
  "path": "/api/users"
}
```

### Status Code Guidelines

- `200 OK`: Successful GET, PATCH, PUT
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Malformed request
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource doesn't exist
- `409 Conflict`: State conflict (duplicate email, etc.)
- `422 Unprocessable Entity`: Validation errors
- `429 Too Many Requests`: Rate limited
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Temporary downtime

## Caching

### Cache Headers

```
# Client caching
Cache-Control: public, max-age=3600

# No caching
Cache-Control: no-cache, no-store, must-revalidate

# Conditional requests
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"
→ 304 Not Modified
```

```typescript
import etag from 'etag';

router.get('/:id', async (req, res) => {
  const user = await fetchUser(req.params.id);
  const body = JSON.stringify(user);
  if (req.headers['if-none-match'] === etag(body)) {
    return res.status(304).end();
  }
  res.set('ETag', etag(body)).json(user);
});
```

## Bulk Operations

### Batch Endpoints

```
POST /api/users/batch
{
  "items": [
    {"name": "User1", "email": "user1@example.com"},
    {"name": "User2", "email": "user2@example.com"}
  ]
}

Response:
{
  "results": [
    {"id": "1", "status": "created"},
    {"id": null, "status": "failed", "error": "Email already exists"}
  ]
}
```

## Idempotency

### Idempotency Keys

```
POST /api/orders
Idempotency-Key: unique-key-123

If duplicate request:
→ 200 OK (return cached response)
```

```typescript
const idempotencyCache = new Map<string, { status: number; body: unknown }>();

function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['idempotency-key'] as string | undefined;
  if (!key || req.method !== 'POST') return next();

  const cached = idempotencyCache.get(key);
  if (cached) return res.status(cached.status).json(cached.body);

  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    idempotencyCache.set(key, { status: res.statusCode, body });
    return originalJson(body);
  };
  next();
}
```

For production, store idempotency keys in Redis with TTL.

## CORS Configuration

```typescript
import cors from 'cors';

app.use(
  cors({
    origin: ['https://example.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  })
);
```

## Security Middleware

```typescript
import helmet from 'helmet';

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.disable('x-powered-by');
```

## Documentation with OpenAPI

Prefer generating OpenAPI from Zod schemas (types stay in sync):

```typescript
import { createDocument } from 'zod-openapi';
import swaggerUi from 'swagger-ui-express';
import { createUserSchema, userResponseSchema } from '../schemas/user.schema.js';

const openApiDocument = createDocument({
  openapi: '3.1.0',
  info: { title: 'My API', version: '1.0.0' },
  paths: {
    '/api/users/{userId}': {
      get: {
        summary: 'Get user by ID',
        tags: ['Users'],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'User details', content: { 'application/json': { schema: userResponseSchema } } },
          '404': { description: 'User not found' },
        },
      },
    },
    '/api/users': {
      post: {
        requestBody: { content: { 'application/json': { schema: createUserSchema } } },
        responses: { '201': { description: 'Created' } },
      },
    },
  },
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
```

Alternative: `tsoa` decorators generate both routes and OpenAPI from TypeScript controllers.

## Health and Monitoring Endpoints

```typescript
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: process.env.npm_package_version,
    timestamp: new Date().toISOString(),
  });
});

router.get('/health/detailed', async (_req, res) => {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);
  const healthy = database && redis;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    checks: { database, redis },
  });
});
```

## Graceful Shutdown

```typescript
const server = app.listen(PORT);

process.on('SIGTERM', () => {
  server.close(() => {
    db.disconnect().then(() => process.exit(0));
  });
});
```
