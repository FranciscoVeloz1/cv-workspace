/**
 * Production-ready REST API template using Express + TypeScript + Zod.
 * Includes pagination, filtering, error handling, and typed patterns.
 *
 * Companion types file (create alongside):
 *   src/types/express.d.ts — augment Express.Request with `user?: AuthUser`
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';

// --- Schemas (single source of truth) ---

export const userStatusSchema = z.enum(['active', 'inactive', 'suspended']);
export type UserStatus = z.infer<typeof userStatusSchema>;

export const userBaseSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  status: userStatusSchema.default('active'),
});

export const userCreateSchema = userBaseSchema.extend({
  password: z.string().min(8),
});

export const userUpdateSchema = userBaseSchema.partial();

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  status: userStatusSchema.optional(),
  search: z.string().optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

// --- Domain types ---

export interface User {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// --- Error handling ---

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

function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
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
  console.error(err);
  res.status(500).json({
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    path: req.path,
  });
}

type AsyncRequestHandler = (req: Request, res: Response) => Promise<void>;

const asyncHandler =
  (fn: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void fn(req, res).catch(next);
  };

function validateQuery<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(422).json({
        error: 'ValidationError',
        message: 'Request validation failed',
        details: result.error.issues,
      });
      return;
    }
    res.locals.validated = result.data;
    next();
  };
}

function getValidated<T>(res: Response): T {
  return res.locals.validated as T;
}

// --- Mock data helpers ---

function mockUser(id: string, overrides: Partial<User> = {}): User {
  const now = new Date().toISOString();
  return {
    id,
    email: `user${id}@example.com`,
    name: `User ${id}`,
    status: 'active',
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

// --- Router ---

const usersRouter = express.Router();

usersRouter.get(
  '/',
  validateQuery(listUsersQuerySchema),
  asyncHandler(async (_req, res) => {
    const { page, page_size } = getValidated<ListUsersQuery>(res);
    const total = 100;
    const start = (page - 1) * page_size;
    const items = Array.from({ length: Math.min(page_size, total - start) }, (_, i) =>
      mockUser(String(start + i + 1))
    );

    const response: PaginatedResponse<User> = {
      items,
      total,
      page,
      page_size,
      pages: Math.ceil(total / page_size),
    };
    res.json(response);
  })
);

usersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const result = userCreateSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(422, 'ValidationError', 'Request validation failed', {
        errors: result.error.issues,
      });
    }
    const input: UserCreateInput = result.data;
    const user = mockUser('123', {
      email: input.email,
      name: input.name,
      status: input.status,
    });
    res.status(201).location(`/api/users/${user.id}`).json(user);
  })
);

usersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    if (req.params.id === '999') {
      throw new AppError(404, 'NotFound', 'User not found', { id: req.params.id });
    }
    res.json(mockUser(req.params.id));
  })
);

usersRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    if (req.params.id === '999') {
      throw new AppError(404, 'NotFound', 'User not found', { id: req.params.id });
    }
    const result = userUpdateSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(422, 'ValidationError', 'Request validation failed', {
        errors: result.error.issues,
      });
    }
    const user = mockUser(req.params.id, result.data);
    user.updated_at = new Date().toISOString();
    res.json(user);
  })
);

usersRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (req.params.id === '999') {
      throw new AppError(404, 'NotFound', 'User not found', { id: req.params.id });
    }
    res.status(204).end();
  })
);

// --- App ---

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json({ limit: '1mb' }));
app.disable('x-powered-by');

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/users', usersRouter);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;
const server = app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

export { app };
