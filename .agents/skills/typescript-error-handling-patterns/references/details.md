# typescript-error-handling-patterns — detailed patterns and worked examples

## Custom Error Hierarchy

```typescript
export class ApplicationError extends Error {
  readonly timestamp = new Date().toISOString();

  constructor(
    message: string,
    readonly code: string,
    readonly statusCode: number = 500,
    readonly details?: Record<string, unknown>,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, id: string) {
    super(`${resource} not found`, "NOT_FOUND", 404, { resource, id });
  }
}

export class ExternalServiceError extends ApplicationError {
  constructor(
    message: string,
    opts: { service: string; cause?: unknown } & Record<string, unknown>,
  ) {
    const { service, cause, ...details } = opts;
    super(message, "EXTERNAL_SERVICE_ERROR", 502, { service, ...details }, {
      cause: cause instanceof Error ? cause : undefined,
    });
  }
}
```

**Type guard for narrowing:**

```typescript
export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}
```

## Result Type Pattern

Hand-rolled Result keeps dependencies minimal. Use libraries like `neverthrow` when the project already depends on them.

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

function parseJSON<T>(json: string): Result<T, SyntaxError> {
  try {
    return Ok(JSON.parse(json) as T);
  } catch (error) {
    return Err(error as SyntaxError);
  }
}

function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  return result.ok ? Ok(fn(result.value)) : result;
}

function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}

// Usage
const result = parseJSON<User>(userJson);
if (result.ok) {
  console.log(result.value.name);
} else {
  console.error("Parse failed:", result.error.message);
}
```

**Discriminated union alternative (no classes):**

```typescript
type DomainError =
  | { type: "NOT_FOUND"; resource: string; id: string }
  | { type: "VALIDATION"; field: string; message: string };

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: DomainError };
```

## Zod Validation at Boundaries

```typescript
import { z, ZodError } from "zod";

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  age: z.number().int().min(18),
});

function formatZodError(error: ZodError): ValidationError {
  const details = error.errors.map((e) => ({
    path: e.path.join("."),
    message: e.message,
  }));
  return new ValidationError("Validation failed", { fields: details });
}

function parseCreateUser(input: unknown): Result<z.infer<typeof CreateUserSchema>, ValidationError> {
  const result = CreateUserSchema.safeParse(input);
  return result.success ? Ok(result.data) : Err(formatZodError(result.error));
}
```

## Async and Promise Handling

```typescript
async function fetchUserOrders(userId: string): Promise<Order[]> {
  try {
    const user = await getUser(userId);
    return await getOrders(user.id);
  } catch (error) {
    if (error instanceof NotFoundError) return [];
    if (error instanceof NetworkError) return retryFetchOrders(userId);
    throw error;
  }
}

// Prefer async/await over long .then() chains for readability
async function fetchData(url: string): Promise<Data> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new NetworkError(`HTTP ${response.status}`, { url });
  }
  return response.json() as Promise<Data>;
}
```

**Node.js entrypoint — catch unhandled rejections:**

```typescript
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
  // In production: consider graceful shutdown after alerting
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Uncaught exception");
  process.exit(1);
});
```

## Express Error Middleware

```typescript
import type { Request, Response, NextFunction } from "express";

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (isApplicationError(err)) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  logger.error({ err }, "Unhandled error");
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : getErrorMessage(err);

  res.status(500).json({ error: { code: "INTERNAL_ERROR", message } });
}

// Route usage
app.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await userService.getUser(req.params.id);
    res.json(user);
  }),
);
```

## Error Aggregation

Collect multiple validation errors instead of failing on the first.

```typescript
class ErrorCollector {
  private errors: Error[] = [];

  add(error: Error): void {
    this.errors.push(error);
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  throw(): never {
    if (this.errors.length === 1) throw this.errors[0];
    throw new AggregateError(this.errors, `${this.errors.length} errors occurred`);
  }
}

function validateUser(data: unknown): User {
  const errors = new ErrorCollector();
  const parsed = CreateUserSchema.safeParse(data);

  if (!parsed.success) {
    for (const issue of parsed.error.errors) {
      errors.add(new ValidationError(issue.message, { path: issue.path }));
    }
  }

  if (errors.hasErrors()) errors.throw();
  return parsed.data!;
}
```

## Retry with Exponential Backoff

```typescript
type RetryOptions = {
  maxAttempts?: number;
  backoffMs?: number;
  backoffFactor?: number;
  retryOn?: (error: unknown) => boolean;
};

async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    backoffMs = 200,
    backoffFactor = 2,
    retryOn = () => true,
  } = opts;

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts - 1 || !retryOn(error)) throw error;
      await new Promise((r) => setTimeout(r, backoffMs * backoffFactor ** attempt));
    }
  }
  throw lastError;
}

// Usage
const data = await withRetry(() => fetch(url).then((r) => r.json()), {
  maxAttempts: 3,
  retryOn: (e) => e instanceof NetworkError,
});
```

## Circuit Breaker

```typescript
enum CircuitState {
  Closed = "closed",
  Open = "open",
  HalfOpen = "half_open",
}

class CircuitBreaker {
  private state = CircuitState.Closed;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;

  constructor(
    private failureThreshold = 5,
    private timeoutMs = 60_000,
    private successThreshold = 2,
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.Open) {
      if (Date.now() - this.lastFailureTime > this.timeoutMs) {
        this.state = CircuitState.HalfOpen;
        this.successCount = 0;
      } else {
        throw new ApplicationError("Circuit breaker is open", "CIRCUIT_OPEN", 503);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === CircuitState.HalfOpen) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.Closed;
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.Open;
    }
  }
}
```

## Graceful Degradation

```typescript
async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  onPrimaryError?: (error: unknown) => void,
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    onPrimaryError?.(error);
    return fallback();
  }
}

// Usage
const profile = await withFallback(
  () => cache.getProfile(userId),
  () => db.getProfile(userId),
  (err) => logger.warn({ userId, err }, "Cache miss or failure"),
);
```

## React Error Boundaries

Try-catch does not catch render errors. Use an error boundary:

```tsx
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { fallback: ReactNode; children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error({ error, componentStack: info.componentStack }, "Render error");
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
```

For async errors in effects or event handlers, handle locally — boundaries only catch render/lifecycle errors.

## Resource Cleanup

Use `try/finally` or `using` (Explicit Resource Management, TS 5.2+):

```typescript
async function withTransaction<T>(
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  const tx = await db.beginTransaction();
  try {
    const result = await fn(tx);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}
```

```typescript
// TS 5.2+ using declaration
async function readConfig(path: string) {
  await using file = await openFile(path);
  return file.readText();
}
```

## Mapping Errors to HTTP Status

| Error type | Status | Code example |
|------------|--------|--------------|
| ValidationError | 400 | `VALIDATION_ERROR` |
| Unauthorized | 401 | `UNAUTHORIZED` |
| Forbidden | 403 | `FORBIDDEN` |
| NotFoundError | 404 | `NOT_FOUND` |
| Conflict | 409 | `CONFLICT` |
| Rate limit | 429 | `RATE_LIMITED` |
| ExternalServiceError | 502 | `EXTERNAL_SERVICE_ERROR` |
| Unknown | 500 | `INTERNAL_ERROR` |

Keep a single mapping function in middleware; do not scatter status logic across controllers.
