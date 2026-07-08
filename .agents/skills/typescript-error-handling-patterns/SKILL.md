---
name: typescript-error-handling-patterns
description: Master error handling patterns in TypeScript including typed custom errors, Result types, async/promise handling, Express middleware, and graceful degradation. Use when implementing error handling in TypeScript, Node.js, React, or when designing resilient APIs and improving application reliability.
---

# TypeScript Error Handling Patterns

Build resilient TypeScript applications with typed errors, explicit failure paths, and patterns that work across Node.js, browsers, and React.

## When to Use This Skill

- Implementing error handling in new TypeScript features
- Designing error-resilient REST or GraphQL APIs (Express, Fastify, etc.)
- Handling async/await and unhandled promise rejections
- Mapping domain errors to HTTP responses
- Adding React error boundaries or client-side failure UX
- Debugging production issues in Node.js or frontend code
- Implementing retry, circuit breaker, or fallback patterns

## Core Concepts

### 1. Error Handling Philosophies

**Exceptions vs Result types:**

- **Exceptions (`throw`/`try-catch`)**: Unexpected failures, HTTP middleware boundaries, framework integration
- **Result types (`Result<T, E>`)**: Expected failures (validation, parsing, business rules) where callers must handle failure
- **Discriminated unions**: Lightweight alternative to classes for domain errors

**When to use each:**

| Situation | Prefer |
|-----------|--------|
| Invalid user input, missing resource | Typed error class or Result |
| Network/DB failure at service boundary | Throw + wrap with `cause` |
| Parsing unknown external JSON | Result or Zod `.safeParse()` |
| Programming bug (impossible state) | Throw; fix the bug |
| React render failure | Error boundary (not try-catch) |

### 2. Error Categories

**Recoverable:** network timeouts, rate limits, invalid input, missing resources, stale cache

**Unrecoverable:** OOM, stack overflow, logic bugs — log, alert, fail fast; do not mask with generic catch-all

### 3. TypeScript-Specific Defaults

| Concern | Default | Alternatives |
|---------|---------|--------------|
| Validation errors | Zod `.safeParse()` | Valibot, io-ts |
| Result utilities | Hand-rolled `Result<T, E>` | `neverthrow`, `ts-results` |
| HTTP error mapping | Custom `AppError` + middleware | `@hapi/boom`, `http-errors` |
| Async handler wrapper | `asyncHandler` or Express 5 native | Fastify `setErrorHandler` |
| Client UI failures | React Error Boundary | `react-error-boundary` |

Prefer project conventions when they already exist.

## Detailed patterns and worked examples

Detailed pattern documentation lives in [references/details.md](references/details.md). Read that file when the navigation tier above is insufficient.

## Best Practices

1. **Fail fast**: Validate at boundaries (HTTP body, env vars, CLI args) with Zod or similar
2. **Preserve context**: Use `new Error("msg", { cause: err })`; attach `code`, `statusCode`, `details`
3. **Typed errors**: Extend `Error` with discriminant `code`; narrow with `instanceof` or type guards
4. **Handle at the right level**: Services throw domain errors; controllers/middleware map to HTTP
5. **Log once**: Log at the boundary that converts to a response — avoid log + rethrow duplicates
6. **Never swallow**: Empty `catch {}` blocks hide bugs; at minimum log and rethrow or return Result
7. **Async discipline**: Always `await` or `.catch()`; register `unhandledRejection` in Node entrypoints
8. **Safe narrowing**: Use `error instanceof Error` before reading `.message`; unknown catch type is `unknown`

```typescript
async function processOrder(orderId: string): Promise<Order> {
  if (!orderId) {
    throw new ValidationError("Order ID is required");
  }

  const order = await orderRepo.findById(orderId);
  if (!order) {
    throw new NotFoundError("Order", orderId);
  }

  try {
    const payment = await paymentService.charge(order.total);
    return orderRepo.complete(order.id, payment.id);
  } catch (err) {
    if (err instanceof ApplicationError) throw err;

    logger.error({ orderId, err }, "Payment failed");
    throw new ExternalServiceError("Payment processing failed", {
      service: "payment",
      orderId,
      cause: err,
    });
  }
}
```

## Common Pitfalls

- **Catching `any` or bare `catch` without narrowing**: Treat caught values as `unknown`
- **Empty catch blocks**: Silently swallowing errors
- **Logging and re-throwing at every layer**: Duplicate log noise
- **Unhandled promise rejections**: Missing `await` or `.catch()` in Express 4 handlers
- **Leaking stack traces**: Never send internal details to clients in production
- **`throw "string"`**: Always throw `Error` instances for stack traces
- **Result + throw mixing**: Pick a convention per layer (Result inside domain, throw at boundaries)
- **Ignoring Zod errors**: Map `ZodError` to `ValidationError` with field paths, not raw dumps

## Additional Resources

- Typed errors, Result types, async patterns, middleware: [references/details.md](references/details.md)
