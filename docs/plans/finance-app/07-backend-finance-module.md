# Módulo backend Finance

**Tipo:** Backend  
**Depende de:** [`06-backend-database-and-migrations.md`](06-backend-database-and-migrations.md), [`01-functional-domain-and-rules.md`](01-functional-domain-and-rules.md)–[`05-functional-credit-and-savings.md`](05-functional-credit-and-savings.md), [`docs/architecture/finance-app/architecture.md`](../../architecture/finance-app/architecture.md)  
**Implementa:** Estructura vertical `src/modules/finance/` en `repos/personal-api`, montaje en `/api/v1/finance`, capas route/controller/schema/repository/service, defaults por usuario, handlers delgados, tipos vía `z.infer`, repositorio Prisma exclusivo para persistencia.  
**No incluye:** Implementación completa de cálculos/propagación (`08`), contratos HTTP detallados y matriz de errores (`09`), SPA, fixtures de integración, commits.

## Resultado

El módulo `finance` existe como unidad vertical en `personal-api`: router montado bajo `/api/v1/finance`, todas las rutas protegidas con `authenticate` y ownership estricto, controladores delgados, validación Zod en boundary, repositorio que encapsula Prisma con filtro `userId` obligatorio, servicio que orquesta casos de uso y delega matemática a `finance.calculations.ts` / `finance.projection.ts` (`08`). Los defaults MVP (Mandado, Salidas, Extras, retiro $6,250) viven en `finance.defaults.ts` y se aplican por usuario al provisionar el dominio financiero.

## Contratos de entrada y salida

### Entradas

| Entrada | Proveedor |
|---------|-----------|
| Modelos Prisma `Finance*` | Spec `06` |
| Reglas funcionales | Specs `01`–`05` |
| Patrón de módulo | `repos/personal-api/src/modules/_template/README.md`, módulos `fitness` / `groceries` |
| Auth JWT | `authenticate` middleware existente |

### Salidas (árbol de archivos)

```text
repos/personal-api/src/modules/finance/
  finance.routes.ts
  finance.controller.ts
  finance.schemas.ts
  finance.repository.ts
  finance.service.ts
  finance.calculations.ts      # delegación pura; implementación en 08
  finance.projection.ts        # delegación pura; implementación en 08
  finance.defaults.ts
  finance.errors.ts
  index.ts                     # re-export router (opcional)
```

Modificar:

```text
repos/personal-api/src/routes/v1/index.ts
```

Tests:

```text
repos/personal-api/tests/unit/finance.schemas.test.ts
repos/personal-api/tests/integration/finance-module.test.ts
```

### Montaje v1

```typescript
// repos/personal-api/src/routes/v1/index.ts
import { financeRouter } from '../../modules/finance/finance.routes.js';

v1Router.use('/finance', financeRouter);
```

```typescript
// finance.routes.ts
import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { financeController } from './finance.controller.js';

export const financeRouter = Router();
financeRouter.use(authenticate);
// sub-rutas registradas en Tareas; handlers vía controller + asyncHandler
```

**Base path:** `/api/v1/finance`  
**Auth:** `Authorization: Bearer <accessToken>` en todas las rutas.  
**Prohibido:** `optionalAuth` en datos financieros.

### Decisión de autorización Finance (MVP)

Todas las rutas de `/api/v1/finance` aplican `authenticate` y después ownership
por `req.user!.id`; el router Finance no usa `requireRole` para recursos Finance
propios. Por ello un usuario con rol global `READ_ONLY` puede crear, editar y
cancelar sus propios periodos, cuentas, ítems, transacciones, reglas y
presupuestos Finance.

Una referencia a datos de otro dueño siempre resuelve `404 NOT_FOUND`, incluso
para un usuario `ADMIN`; `ADMIN` no tiene bypass de ownership Finance. Esta es una
excepción deliberada del módulo Finance: no cambia el RBAC de `/api/v1/users` ni
de módulos globales, que conservan sus propias decisiones y pueden usar
`requireRole`.

> **Nota de implementación:** la excepción `READ_ONLY` self-owned requiere
> actualizar o documentar el middleware/policy del módulo Finance durante su
> implementación, sin cambiar globalmente los módulos existentes. Esta tarea
> solo corrige la especificación y no muta código de middleware o policy.

### Capas y responsabilidades

| Capa | Archivo | Responsabilidad | Prohibido |
|------|---------|-----------------|-----------|
| Routes | `finance.routes.ts` | Middleware, wiring HTTP | Lógica de negocio, Prisma |
| Controller | `finance.controller.ts` | Parse params, llamar service, mapear status | SQL, reglas de cálculo |
| Schemas | `finance.schemas.ts` | Zod input/output; `export type X = z.infer<typeof xSchema>` | Prisma |
| Repository | `finance.repository.ts` | Queries Prisma con `userId` | Reglas de negocio |
| Service | `finance.service.ts` | Casos de uso, transacciones, ownership | SQL directo |
| Calculations | `finance.calculations.ts` | Funciones puras | I/O |
| Projection | `finance.projection.ts` | Simulación/propagación pura | I/O |
| Defaults | `finance.defaults.ts` | Constantes y seed por usuario | HTTP |
| Errors | `finance.errors.ts` | Clases/códigos de dominio | — |

### Handlers delgados (patrón controller)

```typescript
import { asyncHandler } from '../../core/async-handler.js';
import { validateBody, validateQuery, getValidated } from '../../core/validation.js';

export const financeController = {
  listPeriods: asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const query = getValidated(req, listPeriodsQuerySchema);
    const result = await financeService.listPeriods(userId, query);
    res.json(result);
  }),
  // ... un handler por operación HTTP; sin try/catch manual salvo traducción de FinanceError
};
```

### Schemas Zod y `z.infer`

Convenciones en `finance.schemas.ts`:

```typescript
import { z } from 'zod';

/** Fecha calendario sin zona horaria */
export const calendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Dinero: string decimal con 2 decimales en JSON API */
export const moneySchema = z
  .string()
  .regex(/^\d+\.\d{2}$/, 'amount must have exactly 2 decimal places');

export const createAccountBodySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['DEBIT', 'CASH', 'CREDIT', 'SAVINGS', 'OTHER']),
  initialBalance: moneySchema,
  creditLimit: moneySchema.optional(),
  openingDebt: moneySchema.optional(),
  statementDay: z.number().int().min(1).max(31).optional(),
  paymentDay: z.number().int().min(1).max(31).optional(),
  includeInProjections: z.boolean().default(true),
  startsOn: calendarDateSchema,
}).strict();

export type CreateAccountBody = z.infer<typeof createAccountBodySchema>;
```

**Reglas:**

- Tipos exportados solo vía `z.infer<typeof schema>`.
- Enums de Prisma reflejados como `z.enum([...])` con los mismos literales.
- Montos de entrada en JSON como **string con exactamente dos decimales**
  (`"2000.00"`) para evitar `Float` en wire format; conversión a `Decimal` en
  repository.
- Respuestas serializan `Decimal` → string con 2 decimales.
- `moneySchema` no acepta signo, enteros ni una o más de dos posiciones
  decimales. Los derivados que puedan ser negativos se modelan aparte en `09`.
- `creditLimit` es opcional en el parseo estructural; si una cuenta `CREDIT`
  carece de límite, el service emite la regla de negocio explícita
  `400 FINANCE_VALIDATION` después del parseo.
- `createAccountBodySchema` usa `.strict()` y rechaza toda clave desconocida.
  La misma regla aplica a cada schema de body de escritura declarado para
  `POST`/`PATCH` en este módulo: periodo, cuenta, categoría, ítem planeado,
  transacción, regla recurrente, presupuesto, visibilidad y proyección. En
  updates parciales, aplicar `.partial()` antes de `.strict()`; no abrir el
  objeto para aceptar aliases o campos futuros silenciosamente.

### Repository Prisma (contrato)

Toda función recibe `userId: string` como primer argumento (salvo helpers internos):

```typescript
export const financeRepository = {
  findAccountById(userId: string, accountId: string) {
    return prisma.financeAccount.findFirst({
      where: { id: accountId, userId },
    });
  },

  createPeriod(userId: string, data: { year: number; month: number; label?: string }) {
    return prisma.financePeriod.create({
      data: { userId, ...data },
    });
  },

  // Transacción DB para realizar ítem planeado (PlanItem + Transaction)
  async realizePlanItem(userId: string, planItemId: string, txData: RealizePlanItemData) {
    return prisma.$transaction(async (tx) => {
      // 1. Verificar ownership planItem, period, accounts
      // 2. Crear FinanceTransaction
      // 3. Actualizar FinancePlanItem status REALIZED + transactionId + planItemId en tx
      // 4. Retornar entidades
    });
  },
};
```

**Invariantes repository:**

- `findFirst({ where: { id, userId } })` — nunca `findUnique` sin `userId`.
- Writes incluyen `userId` en `data`.
- Joins validan que FKs pertenezcan al mismo `userId` (defensa en profundidad).
- Ninguna capa Finance sustituye el `userId` del JWT por privilegios de rol; no
  existe bypass para `ADMIN`.

### Service (casos de uso MVP)

Orquestación sin Prisma directo (solo vía repository):

| Método service | Descripción |
|----------------|-------------|
| `ensureFinanceBootstrap(userId)` | Categorías base + cuentas sugeridas si vacío |
| `createPeriod(userId, input)` | Periodo + defaults + ítems desde reglas vigentes |
| `duplicatePeriodStructure(userId, sourcePeriodId, targetYear, targetMonth)` | Regenera planeados; no copia realizados (`02`) |
| `listAccounts` / `createAccount` / `updateAccount` / `deactivateAccount` | CRUD cuentas (`03`) |
| `listCategories` / `createCategory` / `deactivateCategory` | CRUD categorías (`03`) |
| `listPlanItems` / `createPlanItem` / `updatePlanItem` / `cancelPlanItem` | Ítems planeados |
| `listTransactions` / `createTransaction` / `updateTransaction` | Libro de movimientos |
| `getPeriodSummary(userId, periodId)` | Agregado delegando a `calculations` |
| `previewProjection(userId, input)` | Delega a `projection.preview` (`08`) |
| `confirmPropagation(userId, input)` | Transacción + incremento `version` |

### Defaults por usuario (`finance.defaults.ts`)

```typescript
import { Decimal } from '@prisma/client/runtime/library';

export const FINANCE_DEFAULT_AMOUNTS = {
  groceriesPerTrip: new Decimal('2000.00'),
  groceriesTripsPerMonth: 3,
  groceriesMonthlyLimit: new Decimal('6000.00'),
  outingsPerTrip: new Decimal('500.00'),
  outingsPerMonth: 4,
  outingsMonthlyLimit: new Decimal('2000.00'),
  extrasMonthlyLimit: new Decimal('1400.00'),
  cashWithdrawal: new Decimal('6250.00'),
} as const;

export const SYSTEM_CATEGORY_DEFS = [
  { group: 'MONTHLY_SERVICES', name: 'Servicios', sortOrder: 1 },
  { group: 'GROCERIES', name: 'Mandado', sortOrder: 2 },
  { group: 'OUTINGS', name: 'Salidas', sortOrder: 3 },
  { group: 'EXTRAS', name: 'Extras', sortOrder: 4 },
  { group: 'TRANSFER', name: 'Transferencias', sortOrder: 5 },
  { group: 'CREDIT', name: 'Crédito', sortOrder: 6 },
  { group: 'SAVINGS', name: 'Ahorro', sortOrder: 7 },
  { group: 'INCOME', name: 'Ingreso', sortOrder: 8 },
] as const;

/** Idempotente: no duplica si ya existen categorías system del usuario */
export async function seedFinanceDefaultsForUser(userId: string, deps: FinanceRepository): Promise<void> { /* ... */ }

/** Genera planItems + budgets para un periodo recién creado */
export async function seedPeriodFromRules(
  userId: string,
  periodId: string,
  year: number,
  month: number,
  deps: FinanceRepository,
): Promise<void> { /* ... */ }
```

### Errores de dominio (`finance.errors.ts`)

```typescript
export class FinanceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export class FinanceNotFoundError extends FinanceError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

export class FinanceConflictError extends FinanceError {
  constructor(message: string, details?: unknown) {
    super('FINANCE_CONFLICT', message, 409, details);
  }
}
```

Middleware de error global traduce `FinanceError` → JSON `{ error, message, details }` (detalle en `09`).

### Familias de rutas (wireframe; contratos en `09`)

| Prefijo | Recursos |
|---------|----------|
| `GET/POST` | `/periods`, `/periods/:periodId` |
| `GET` | `/periods/:periodId/summary` |
| `POST` | `/periods/:periodId/duplicate` |
| `GET/POST/PATCH` | `/accounts`, `/accounts/:accountId` |
| `GET/POST/PATCH` | `/categories`, `/categories/:categoryId` |
| `GET/POST/PATCH/DELETE` | `/periods/:periodId/plan-items`, `/plan-items/:planItemId` |
| `GET/POST/PATCH` | `/periods/:periodId/transactions`, `/transactions/:transactionId` |
| `GET/POST/PATCH` | `/recurring-rules`, `/recurring-rules/:ruleId` |
| `GET/PATCH` | `/periods/:periodId/budgets` |
| `POST` | `/projection/preview`, `/projection/confirm` |

Ownership: `userId` siempre de `req.user.id`; **ignorar** `userId` en body/query.

La autorización de recursos propios es `authenticate` + ownership, sin
`requireRole`: `READ_ONLY` puede mutar sus propios datos Finance. Cualquier
usuario —incluido `ADMIN`— recibe `404` al solicitar datos Finance ajenos; esta
excepción no aplica a `/api/v1/users` ni a módulos globales.

## Tareas

1. Crear archivos del módulo según árbol; copiar estructura de `_template` o `fitness`.
2. Implementar `finance.errors.ts` y registrar traductor en error handler global si no existe hook.
3. Implementar `finance.schemas.ts` con schemas base: fechas, dinero, enums,
   CRUD cuenta/periodo/categoría y `.strict()` en cada body de escritura.
4. Implementar `finance.repository.ts` con operaciones CRUD mínimas y filtro `userId`.
5. Implementar `finance.defaults.ts` con constantes PRD y funciones idempotentes de seed.
6. Implementar `finance.service.ts`: `ensureFinanceBootstrap`, `createPeriod`, `listPeriods`, `createAccount`, `getPeriodSummary` (stub de cálculos hasta `08`).
7. Implementar `finance.controller.ts` con `asyncHandler` y validación Zod.
8. Implementar `finance.routes.ts` y montar en `v1/index.ts`: todas las rutas
   pasan por `authenticate`; no añadir `requireRole` para operaciones Finance
   propias.
9. Crear stubs exportados en `finance.calculations.ts` y `finance.projection.ts` (tipos y firmas definidos en `08`; sin archivo `finance.types.ts` separado).
10. Tests unitarios de schemas; tests de integración: A `READ_ONLY` autenticado
    → bootstrap → crear/editar/cancelar recursos propios → listar cuentas; B
    `READ_ONLY` y `ADMIN` reciben 404 ante recursos de A.

## Criterios de aceptación

1. **CA-01** Existe `src/modules/finance/` con los nueve archivos listados (incl. calculations/projection stubs).
2. **CA-02** Router montado en `/api/v1/finance`; todas las rutas usan
   `authenticate` + ownership y ninguna usa `requireRole` para recursos Finance
   propios.
3. **CA-03** Ningún controller importa `@prisma/client` ni ejecuta queries.
4. **CA-04** Repository nunca expone filas sin clausula `userId`.
5. **CA-05** Tipos de request/response exportados vía `z.infer`; no interfaces
   duplicadas manualmente para inputs. Todo body de escritura es `.strict()`:
   `createAccountBodySchema` y los demás schemas de `POST`/`PATCH` rechazan
   claves desconocidas con `422 VALIDATION_ERROR`; las reglas de negocio
   explícitas usan `400 FINANCE_VALIDATION`.
6. **CA-06** Montos convertidos string ↔ `Decimal` solo en repository/service boundary.
7. **CA-07** `ensureFinanceBootstrap` crea categorías system y no duplica en llamadas repetidas.
8. **CA-08** `createPeriod` genera Mandado 3×$2,000, Salidas 4×$500, Extras $1,400, retiro $6,250 como transferencia planeado.
9. **CA-09** Handlers usan `asyncHandler`; sin bloques try/catch redundantes.
10. **CA-10** A `READ_ONLY` puede crear, editar y cancelar recursos Finance
    propios; B `READ_ONLY` y `ADMIN` reciben 404 al leer o mutar recursos de A.
11. **CA-11** La excepción de autorización Finance queda limitada a
    `/api/v1/finance`; no se reutiliza para `/api/v1/users` ni módulos globales.

## Verificación

```powershell
Set-Location repos/personal-api
npm run build
npm run lint
npm test -- tests/unit/finance.schemas.test.ts tests/integration/finance-module.test.ts
```

| ID | Comprobación |
|----|--------------|
| V-01 | `rg "prisma\." src/modules/finance/finance.controller.ts` → cero |
| V-02 | `rg "optionalAuth" src/modules/finance` → cero |
| V-03 | Test integración: POST periodo → GET summary responde 200 con shape mínimo |
| V-04 | Tests integración: A/B `READ_ONLY` no acceden entre sí → 404; `ADMIN` tampoco accede datos Finance ajenos → 404 |
| V-05 | Test unitario: regla de negocio `creditLimit` ausente en cuenta CREDIT → 400 `FINANCE_VALIDATION`; schema rechaza una clave desconocida en cualquier body de escritura → 422 `VALIDATION_ERROR` |
| V-06 | Test integración: segundo bootstrap no duplica categorías system |
| V-07 | `rg "requireRole" src/modules/finance` → cero; `authenticate` está aplicado al router Finance |
| V-08 | Sin placeholders en este documento |

## Impacto y riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Prisma en controller | Capas mezcladas | CA-03; revisión en PR |
| userId del cliente | Fuga de datos | Solo `req.user.id`; CA-10 |
| Float en JSON | Pérdida de precisión | moneySchema string; CA-06 |
| Defaults no idempotentes | Duplicación de categorías/ítems | `ensureFinanceBootstrap` idempotente |
| God service | Mantenibilidad | Separar calculations/projection en `08` |
| RBAC global bloquea autoservicio Finance | `READ_ONLY` no puede operar sus propios recursos | Decisión explícita `authenticate` + ownership, sin `requireRole`; tests A/B |

**Desbloquea:** [`08-backend-calculations-and-projection.md`](08-backend-calculations-and-projection.md), [`09-backend-contracts-security-and-errors.md`](09-backend-contracts-security-and-errors.md).
