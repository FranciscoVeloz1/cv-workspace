---
name: node-express-api-design-principles
description: Master REST and GraphQL API design principles for TypeScript, Node.js, and Express to build intuitive, scalable, and maintainable APIs. Use when designing new Express APIs in TypeScript, reviewing API specifications, establishing API standards, or implementing typed REST/GraphQL endpoints.
---

# TypeScript, Node.js & Express API Design Principles

Master REST and GraphQL API design principles to build intuitive, scalable, and maintainable APIs with **TypeScript**, Node.js, and Express.

All examples, templates, and patterns in this skill use **TypeScript** (`.ts`). Do not default to plain JavaScript unless the project explicitly requires it.

## When to Use This Skill

- Designing new REST or GraphQL APIs with Express in TypeScript
- Refactoring existing Node.js APIs for better usability and type safety
- Establishing API design standards for your team
- Reviewing API specifications before implementation
- Migrating between API paradigms (REST to GraphQL, etc.)
- Creating developer-friendly API documentation
- Optimizing APIs for specific use cases (mobile, third-party integrations)

## Stack Defaults

| Concern | Default choice | Alternatives |
|---------|----------------|--------------|
| Language | **TypeScript** (strict) | — |
| HTTP framework | Express + `@types/express` | Fastify, Hono, Koa |
| Validation | Zod (`z.infer<typeof schema>`) | Joi, typia |
| OpenAPI docs | `tsoa` or `@asteasolutions/zod-to-openapi` | swagger-jsdoc |
| GraphQL types | `@graphql-codegen/cli` | manual resolver types |
| GraphQL server | Apollo Server + `@apollo/server` | graphql-yoga, Mercurius |
| N+1 prevention | DataLoader | Prisma `include`, batch queries |
| Auth | JWT middleware | Passport.js, session cookies |
| Build | `tsx` (dev) / `tsc` (prod) | ts-node, esbuild |

Prefer these defaults unless the project already uses something else.

## TypeScript Conventions

### Project setup

```
src/
├── app.ts
├── server.ts
├── types/
│   ├── express.d.ts        # Augment Express Request
│   └── index.ts            # Shared domain types
├── routes/
├── controllers/
├── services/
├── middleware/
└── schemas/                # Zod schemas → infer types with z.infer
```

### Strict compiler options

Enable at minimum: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` (when feasible).

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
    "rootDir": "src"
  },
  "include": ["src"]
}
```

### Type flow (schema → handler → response)

1. Define Zod schemas in `schemas/`
2. Export types with `type CreateUserInput = z.infer<typeof createUserSchema>`
3. Type service functions with those inferred types
4. Use typed middleware to attach validated data to `req` (no `as` casts)

See [references/typescript-patterns.md](references/typescript-patterns.md) for Express augmentation, generic validation middleware, env validation, and GraphQL codegen.

## Core Concepts

### 1. RESTful Design Principles

**Resource-Oriented Architecture**

- Resources are nouns (users, orders, products), not verbs
- Use HTTP methods for actions (GET, POST, PUT, PATCH, DELETE)
- URLs represent resource hierarchies
- Consistent naming conventions

**HTTP Methods Semantics:**

- `GET`: Retrieve resources (idempotent, safe)
- `POST`: Create new resources
- `PUT`: Replace entire resource (idempotent)
- `PATCH`: Partial resource updates
- `DELETE`: Remove resources (idempotent)

### 2. Express Project Structure

```
src/
├── app.ts                 # Express app, global middleware
├── server.ts              # HTTP server bootstrap
├── routes/
│   ├── index.ts           # Mount versioned routers
│   └── v1/
│       └── users.routes.ts
├── controllers/           # Request handlers (thin)
├── services/              # Business logic (fully typed)
├── middleware/
│   ├── errorHandler.ts
│   ├── validate.ts
│   └── rateLimiter.ts
├── schemas/               # Zod schemas
└── types/
    └── express.d.ts       # Request augmentation
```

Keep route handlers thin: validate → call service → send response. Put business logic in typed services.

### 3. GraphQL Design Principles

**Schema-First Development**

- Types define your domain model
- Generate TypeScript types with `@graphql-codegen/cli`
- Queries for reading data
- Mutations for modifying data
- Subscriptions for real-time updates

**Query Structure:**

- Clients request exactly what they need
- Single endpoint, multiple operations
- Strongly typed schema and resolvers
- Introspection built-in

### 4. API Versioning Strategies

**URL Versioning:**

```
/api/v1/users
/api/v2/users
```

Mount versioned routers in Express:

```typescript
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);
```

## Detailed patterns and worked examples

- REST/GraphQL patterns: [references/details.md](references/details.md)
- TypeScript patterns: [references/typescript-patterns.md](references/typescript-patterns.md)

Read those files when the navigation tier above is insufficient.

## Best Practices

### REST APIs (Express + TypeScript)

1. **Consistent Naming**: Use plural nouns for collections (`/users`, not `/user`)
2. **Stateless**: Each request contains all necessary information (JWT, API key)
3. **Use HTTP Status Codes Correctly**: 2xx success, 4xx client errors, 5xx server errors
4. **Version Your API**: Plan for breaking changes from day one
5. **Pagination**: Always paginate large collections
6. **Rate Limiting**: Use `express-rate-limit` or Redis-backed limiters
7. **Documentation**: Generate OpenAPI from Zod (`zod-to-openapi`) or use `tsoa`
8. **Centralized Error Handling**: One `errorHandler` middleware, custom `AppError` class
9. **Async Errors**: Wrap handlers with `asyncHandler` or use Express 5 native async support
10. **Security Middleware**: `helmet`, CORS, body size limits, input validation on every write endpoint
11. **Infer, Don't Duplicate**: Use `z.infer` for request/response types — never maintain parallel interfaces
12. **Augment Express**: Extend `Request` via `express.d.ts` for `user`, `validated`, etc.

### GraphQL APIs (Apollo Server + TypeScript)

1. **Schema First**: Design schema before writing resolvers
2. **Codegen**: Generate `Resolvers`, `Query`, `Mutation` types from schema
3. **Avoid N+1**: Use DataLoader for efficient data fetching
4. **Input Validation**: Validate at schema and resolver levels (Zod in resolvers)
5. **Error Handling**: Return structured errors in mutation payloads
6. **Pagination**: Use cursor-based pagination (Relay spec)
7. **Deprecation**: Use `@deprecated` directive for gradual migration
8. **Context Factory**: Typed `Context` with per-request DataLoaders and auth

## Common Pitfalls

- **Over-fetching/Under-fetching (REST)**: Fixed in GraphQL but requires DataLoaders
- **Breaking Changes**: Version APIs or use deprecation strategies
- **Inconsistent Error Formats**: Standardize error responses via middleware
- **Missing Rate Limits**: APIs without limits are vulnerable to abuse
- **Poor Documentation**: Undocumented APIs frustrate developers
- **Ignoring HTTP Semantics**: POST for idempotent operations breaks expectations
- **Tight Coupling**: API structure shouldn't mirror database schema
- **Unhandled Promise Rejections**: Always catch async errors in Express 4 handlers
- **Blocking the Event Loop**: Offload CPU-heavy work to worker threads or queues
- **Leaking Stack Traces**: Never send internal error details to clients in production
- **Duplicate Types**: Maintaining separate interfaces alongside Zod schemas — use `z.infer`
- **Unsafe Casts**: Using `as any` or `req as Foo` instead of proper Request augmentation
- **Untyped `req.body`**: Always validate and narrow before use

## Additional Resources

- TypeScript patterns: [references/typescript-patterns.md](references/typescript-patterns.md)
- REST patterns and Express examples: [references/details.md](references/details.md)
- REST best practices: [references/rest-best-practices.md](references/rest-best-practices.md)
- GraphQL schema design: [references/graphql-schema-design.md](references/graphql-schema-design.md)
- Pre-implementation checklist: [assets/api-design-checklist.md](assets/api-design-checklist.md)
- Starter template: [assets/rest-api-template.ts](assets/rest-api-template.ts)
