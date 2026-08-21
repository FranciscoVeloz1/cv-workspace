# Contratos HTTP, seguridad y errores Finance

**Tipo:** Backend
**Depende de:** [`07-backend-finance-module.md`](07-backend-finance-module.md), [`08-backend-calculations-and-projection.md`](08-backend-calculations-and-projection.md), [`01-functional-domain-and-rules.md`](01-functional-domain-and-rules.md)–[`05-functional-credit-and-savings.md`](05-functional-credit-and-savings.md), [`docs/architecture/finance-app/architecture.md`](../../architecture/finance-app/architecture.md)
**Implementa:** Contratos conceptuales request/response por familia de recursos, reglas auth/ownership, validación Zod, códigos HTTP 400/401/404/409/422/500, shape de error unificado, límites operativos y logging seguro en `repos/personal-api`. Tipos de respuesta de cálculo/proyección importados desde `finance.calculations.ts` / `finance.projection.ts` (`08`).
**No incluye:** Fixtures de integración con datos concretos (`16`–`21`), implementación SPA, rediseño visual, commits.

## Resultado

Toda la superficie HTTP del módulo `finance` tiene contratos estables: payloads validados con Zod, respuestas serializables sin `Decimal` crudo ni `Float`, errores en formato `{ error, message, details }` compatible con `ApiError` del frontend, ownership estricto por JWT, y logging operacional sin PII financiera ni montos en claro. Los shapes `PeriodSummary`, `PeriodSummaryCompact`, `ProjectionPreviewResult`, `PropagationChange` y `Suggestion` provienen de `08`; este spec define su serialización JSON (montos como string) y los DTOs de persistencia.

> **Dependencias alineadas (resuelto):** este spec depende de [`07`](07-backend-finance-module.md) (módulo y capas HTTP) y [`08`](08-backend-calculations-and-projection.md) (tipos `PeriodSummary`, `PeriodSummaryCompact`, `ProjectionPreviewResult`, `PropagationChange`, `Suggestion`). El [`README.md`](README.md) y el grafo Mermaid ya reflejan `09 → 07`, `09 → 08` y el orden backend `06 → 07 → 08 → 09`.

## Contratos de entrada y salida

### Tipos importados de `08` (cálculo → JSON)

Implementación: importar desde `finance.calculations.ts` / `finance.projection.ts` y serializar montos `Decimal` → string con 2 decimales en controller.

| Tipo en `08` | Uso HTTP en este spec |
|--------------|----------------------|
| `PeriodSummary` | `GET /periods/:periodId/summary` |
| `PeriodSummaryCompact` | `GET /periods` (timeline), `POST /projection/confirm` |
| `ProjectionPreviewResult` | `POST /projection/preview`, preview opcional en PATCH reglas |
| `PropagationChange` | `POST /projection/preview`, `POST /projection/confirm`, PATCH con `scope: FUTURE` |
| `Suggestion` | `GET /periods/:periodId/summary` |

Serialización de `PeriodSummary` / `PeriodSummaryCompact`: mismos campos que en `08`, montos como `string`; estructura anidada preservada en el summary completo (`totals`, `accounts`, `categories`, `cashWithdrawal`, `breakdowns`).

### Convenciones globales

| Aspecto | Regla |
|---------|-------|
| Base URL | `/api/v1/finance` |
| Auth | Header `Authorization: Bearer <accessToken>` obligatorio |
| Content-Type | `application/json` |
| Fechas | `YYYY-MM-DD` string |
| Dinero | `moneySchema` (entradas y montos de entidad, no negativos) o `signedMoneySchema` (derivados con signo); siempre string con exactamente dos decimales; nunca `number` ni `Float` JSON |
| IDs | UUID v4 canónico en minúsculas |
| Paginación | `?cursor=` / `?limit=` donde aplique listas largas (movimientos) |
| Ownership | `userId` = `req.user.id`; ignorar `userId` en body, query o params de cliente |

### Regla reutilizable para IDs UUID v4

Todo ID que llegue desde el cliente en `params`, `query` o `body` usa el mismo
schema; no usar `z.string().uuid()` genérico ni aplicar `trim`, coerción o
normalización. El valor válido es únicamente el UUID v4 canónico en minúsculas
(36 caracteres, guiones, versión `4` y variante `8`–`b`).

```typescript
import { z } from 'zod';

export const UUID_V4_CANONICAL_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export const uuidV4Schema = z
  .string()
  .regex(UUID_V4_CANONICAL_PATTERN, 'Expected canonical UUID v4');

export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
```

Reutilizar `uuidV4Schema` para `periodId`, `accountId`, `categoryId`,
`transactionId`, `planItemId`, `recurringRuleId` y cualquier otro ID de entrada
donde aplique. Los nombres de campo también forman parte del contrato: no se
aceptan aliases como `period_id`, `account_id`, `id`, `withBalances` o
`include_balance`. Los schemas de objeto de entrada deben terminar en
`.strict()` para rechazarlos.

### Regla reutilizable para montos (`moneySchema` / `signedMoneySchema`)

Montos de entrada, DTOs de entidad y saldos derivados no negativos usan
`moneySchema`. Totales y deltas derivados que pueden ser negativos usan
`signedMoneySchema`. Ambos exigen string con **exactamente** dos decimales; no
coercionar ni aceptar JSON numérico.

```typescript
/** Montos de entrada y entidades: no negativos, exactamente dos decimales */
export const moneySchema = z
  .string()
  .regex(/^\d+\.\d{2}$/, 'Expected decimal string with exactly 2 fractional digits');

/** Totales derivados, deltas y remaining que pueden ser negativos */
export const signedMoneySchema = z
  .string()
  .regex(
    /^-?\d+\.\d{2}$/,
    'Expected signed decimal string with exactly 2 fractional digits',
  );
```

| Ámbito | Schema | Ejemplos de campo |
|--------|--------|-------------------|
| Request body / entidades | `moneySchema` | `amount`, `plannedAmount`, `limitAmount`, `initialBalance`, `creditLimit`, `openingDebt` |
| Saldos y agregados no negativos en respuesta | `moneySchema` | `expectedIncome`, `receivedIncome`, `expectedExpense`, `actualExpense`, `cashRemaining`, `creditUsed`, `creditAvailable`, `projectedCreditAvailable`, `klarBalance`, `openingBalance`, `closingBalance`, `entries`, `exits`, `debt`, `limit`, `expected`, `actual`, `withdrawnAmount` |
| Derivados con signo en respuesta | `signedMoneySchema` | `expectedSavings`, `actualSavings`, `expectedConsumption`, `remainingActual`, `remainingProjected`, `deltaExpectedExpense`, `deltaActualExpense`, `deltaExpectedSavings`, `accountDeltas.*`, `deltaDebt`, `deltaCreditAvailable` |

`expectedConsumption` serializa `computeExpectedConsumption` de `08`: ingresos
esperados menos gasto esperado (incluidos fallbacks de presupuesto). En el
ledger canónico de Marzo (`18`): `"10000.00" − "19400.00" = "-9400.00"`.

Los schemas Zod de respuesta de `PeriodSummary`, `PeriodSummaryCompact` y DTOs
compartidos deben aplicar la columna correcta por campo; rechazar `"1234.5"`,
`"1234.567"`, `1234.56` (number) y strings sin dos decimales exactos.

Los strings con signo están reservados a derivados de respuesta: ahorro,
remaining, consumo esperado y deltas de proyección. Ningún monto de entrada o
campo de entidad acepta signo; todos pasan por `moneySchema`.

### Schemas estrictos de query

Las rutas reciben query params como strings. Estos schemas reflejan los nombres
canónicos del wire contract, transforman únicamente booleanos y enteros de
query a valores tipados y terminan en `.strict()`. `z.string()` también rechaza
arrays producidos por parámetros repetidos.

```typescript
const queryBooleanSchema = z
  .enum(['true', 'false'])
  .transform((value): boolean => value === 'true');

const queryYearSchema = z
  .string()
  .regex(/^\d{4}$/, 'Expected four-digit year')
  .transform(Number)
  .refine((year) => year >= 2000, 'Expected year >= 2000');

const queryMonthSchema = z
  .string()
  .regex(/^(?:[1-9]|1[0-2])$/, 'Expected month 1..12')
  .transform(Number);

const queryLimitSchema = z
  .string()
  .regex(/^(?:[1-9]|[1-9]\d|100)$/, 'Expected limit 1..100')
  .transform(Number);

const financeCategoryGroupSchema = z.enum([
  'MONTHLY_SERVICES',
  'GROCERIES',
  'OUTINGS',
  'EXTRAS',
  'TRANSFER',
  'CREDIT',
  'SAVINGS',
  'INCOME',
]);

const financeTransactionTypeSchema = z.enum([
  'INCOME',
  'EXPENSE',
  'TRANSFER',
  'CREDIT_PURCHASE',
  'CREDIT_PAYMENT',
  'SAVINGS_DEPOSIT',
  'SAVINGS_WITHDRAWAL',
]);

const planItemStatusSchema = z.enum(['PLANNED', 'REALIZED', 'CANCELLED']);

export const listPeriodsQuerySchema = z.object({
  fromYear: queryYearSchema.optional(),
  fromMonth: queryMonthSchema.optional(),
  toYear: queryYearSchema.optional(),
  toMonth: queryMonthSchema.optional(),
}).strict();

export const getAccountsQuerySchema = z
  .object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).optional().default('ACTIVE'),
    periodId: uuidV4Schema.optional(),
    includeBalances: queryBooleanSchema.optional().default(false),
  })
  .strict()
  .superRefine((query, ctx) => {
    if (query.includeBalances && !query.periodId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['periodId'],
        message: 'periodId es obligatorio cuando includeBalances=true',
      });
    }
    if (!query.includeBalances && query.periodId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['includeBalances'],
        message: 'periodId requiere includeBalances=true',
      });
    }
  });

export const getCategoriesQuerySchema = z.object({
  activeOnly: queryBooleanSchema.optional(),
}).strict();

export const listPlanItemsQuerySchema = z.object({
  status: planItemStatusSchema.optional(),
  categoryGroup: financeCategoryGroupSchema.optional(),
  accountId: uuidV4Schema.optional(),
  includeHidden: queryBooleanSchema.optional(),
}).strict();

export const listTransactionsQuerySchema = z.object({
  type: financeTransactionTypeSchema.optional(),
  accountId: uuidV4Schema.optional(),
  categoryId: uuidV4Schema.optional(),
  fromDate: calendarDateSchema.optional(),
  toDate: calendarDateSchema.optional(),
  includeHidden: queryBooleanSchema.optional(),
  cursor: z.string().min(1).optional(),
  limit: queryLimitSchema.optional(),
}).strict();

/** Endpoints sin filtros aceptan únicamente un query vacío. */
export const listRecurringRulesQuerySchema = z.object({}).strict();
export const listPeriodBudgetsQuerySchema = z.object({}).strict();
```

No se aceptan aliases como `from_year`, `period_id`, `withBalances`,
`include_balance`, `category_group`, `include_hidden`, `from_date`, ni keys
desconocidas. Los schemas de `09` son la fuente normativa que `17` espeja en
tipos y schemas de filtros del cliente.

### Shape de error (todas las rutas)

```typescript
type ApiErrorBody = {
  error: string;      // código máquina, p. ej. VALIDATION_ERROR, FINANCE_CONFLICT
  message: string;    // mensaje humano breve
  details?: unknown;  // Zod issues, conflict metadata, etc.
};
```

Reutilizar handler global existente de `personal-api`; mapeo:

La implementación vigente de `validate.ts` traduce Zod a `ValidationError`
`422`; este spec adopta ese contrato sin exigir cambios globales al middleware
existente. `FinanceError` conserva `400 FINANCE_VALIDATION` únicamente para las
reglas de negocio enumeradas abajo.

| Situación | HTTP | `error` |
|-----------|------|---------|
| Body/query inválido (Zod) | 422 | `VALIDATION_ERROR` |
| Regla de negocio / invariante | 400 | `FINANCE_VALIDATION` |
| Sin token / token inválido | 401 | `UNAUTHORIZED` |
| Recurso inexistente o ajeno | 404 | `NOT_FOUND` |
| Conflicto versión / propagación | 409 | `FINANCE_CONFLICT` |
| Error inesperado | 500 | `INTERNAL_SERVER_ERROR` |

**404 vs existencia ajena:** si el recurso existe pero pertenece a otro usuario, responder **404** (no 403) para no filtrar existencia cross-user.

**500:** nunca incluir stack trace, SQL ni nombres de constraint al cliente.

---

### Familia: Periodos

#### `GET /periods`

Query: `listPeriodsQuerySchema` — `{ fromYear?, fromMonth?, toYear?, toMonth? }`;
los cuatro nombres son exactos y cada año/mes inválido responde `422
VALIDATION_ERROR`.

Response `200`:

```typescript
{
  periods: Array<{
    id: string;
    year: number;
    month: number;
    label: string | null;
    classification: 'PAST' | 'CURRENT' | 'FUTURE'; // derivado server-side
    version: number;
    summary: PeriodSummaryCompact; // subset de totals para timeline
  }>;
}
```

#### `POST /periods`

Body:

```typescript
{
  year: number;  // int >= 2000
  month: number; // 1-12
  label?: string;
  seedDefaults?: boolean; // default true
}
```

Response `201`: `{ period: PeriodDto }`
Error `409`: periodo `(year, month)` ya existe.

#### `GET /periods/:periodId`

Response `200`: `{ period: PeriodDto }`
Error `404`: no encontrado.

#### `GET /periods/:periodId/summary`

Response `200`:

```typescript
{
  period: { id: string; year: number; month: number; version: number };
  summary: PeriodSummary; // shape completo de 08
  suggestions: Suggestion[];
}
```

#### `POST /periods/:periodId/duplicate`

Body:

```typescript
{
  targetYear: number;
  targetMonth: number;
}
```

Response `201`: `{ period: PeriodDto }` — regenera planeados; no copia realizados (`02`).

---

### Familia: Cuentas

#### `GET /accounts`

Ruta completa: `/api/v1/finance/accounts`. Los tres query params se validan como
un conjunto estricto; no se aceptan aliases, parámetros desconocidos ni valores
vacíos. En la URL, `includeBalances` llega como el literal `true` o `false`;
después de validar, el valor del schema es un `boolean`.

El schema normativo `getAccountsQuerySchema` está definido en «Schemas
estrictos de query» arriba; su tipo de salida es:

```typescript
export type GetAccountsQuery = z.output<typeof getAccountsQuerySchema>;
// GetAccountsQuery['includeBalances'] es boolean.
```

Reglas de query:

| Param | Valores válidos | Default / efecto |
|-------|-----------------|------------------|
| `status` | `ACTIVE`, `INACTIVE`, `ALL` | `ACTIVE`; `ALL` no filtra por estado. |
| `periodId` | UUID v4 canónico de un periodo propio | Opcional en el schema; requerido únicamente con `includeBalances=true`; ajeno o inexistente → `404 NOT_FOUND`. |
| `includeBalances` | Literal URL `true` o `false`, transformado a `boolean` | `false`; solo `true` habilita saldos derivados. |

`includeBalances=true` carga el snapshot completo del periodo propio para calcular
los saldos y después aplica el filtro `status` a la respuesta. Por tanto, una cuenta
inactiva puede no aparecer con `status=ACTIVE`, pero sí puede participar en el cálculo
histórico si el periodo la referencia.

Response `200` sin balances (`?status=ACTIVE`, por ejemplo):

```typescript
{
  accounts: AccountBaseDto[];
}
```

Response `200` con balances
(`/api/v1/finance/accounts?periodId=<UUID-v4>&includeBalances=true`):

```typescript
type AccountBaseDto = {
  id: string; // UUID v4 canónico
  name: string;
  type: FinanceAccountType;
  status: FinanceAccountStatus;
  initialBalance: string; // decimal con dos posiciones
  creditLimit: string | null;
  openingDebt: string | null;
  statementDay: number | null;
  paymentDay: number | null;
  includeInProjections: boolean;
  startsOn: string; // YYYY-MM-DD
};

type AccountWithBalancesDto =
  | (AccountBaseDto & {
      type: 'CREDIT';
      derivedDebt: string;
      derivedCreditAvailable: string;
    })
  | (AccountBaseDto & {
      type: Exclude<FinanceAccountType, 'CREDIT'>;
      derivedBalance: string;
    });

{
  periodId: string; // el UUID v4 canónico validado en query
  accounts: AccountWithBalancesDto[];
}
```

Los campos derivados solo se emiten en la variante con balances: una cuenta `CREDIT`
incluye ambos valores de deuda/crédito disponible y una no crediticia incluye
`derivedBalance`. Todos son strings decimales de dos posiciones; no emitir campos
derivados `null`, `number` ni `Float`. Un `status`, UUID o boolean serializado de otra
forma falla con `422 VALIDATION_ERROR`.

Ejemplos que deben fallar con `422 VALIDATION_ERROR`: un UUID v1/UUID no
canónico, `period_id=...`, `withBalances=true`, `includeBalances=1`,
`includeBalances=` y un `status` fuera del enum. Un query repetido que el parser
convierta en array también falla por tipo.

#### `POST /accounts`

Body: `CreateAccountBody` (ver `07`).

Response `201`: `{ account: AccountDto }`
Error `400 FINANCE_VALIDATION`: CREDIT sin `creditLimit` después de que el body
estructural haya pasado Zod.

#### `PATCH /accounts/:accountId`

Body: partial de create; no cambiar `type` si hay historial dependiente.
Response `200`: `{ account: AccountDto }`

#### `POST /accounts/:accountId/deactivate`

Response `200`: `{ account: AccountDto }` con `status: INACTIVE`

#### `DELETE /accounts/:accountId`

Response `204` solo sin movimientos/planItems/reglas dependientes; else `400 FINANCE_VALIDATION`.

---

### Familia: Categorías

#### `GET /categories`

Query: `getCategoriesQuerySchema` — `{ activeOnly?: 'true' | 'false' }`;
aliases, arrays y keys desconocidas → `422 VALIDATION_ERROR`.

Response `200`: `{ categories: CategoryDto[] }`

#### `POST /categories`

Body: `{ group: FinanceCategoryGroup; name: string }`
Response `201`: `{ category: CategoryDto }`
Error `409`: UNIQUE `(userId, group, name)`.

#### `PATCH /categories/:categoryId`

Body: `{ name?: string; isActive?: boolean }`

---

### Familia: Reglas recurrentes

#### `GET /recurring-rules`

Query: `listRecurringRulesQuerySchema` — `{}`; cualquier parámetro recibe `422
VALIDATION_ERROR`.

Response `200`: `{ rules: RecurringRuleDto[] }`

#### `POST /recurring-rules`

Body:

```typescript
{
  categoryId: string;
  accountId?: string;
  name: string;
  group: FinanceCategoryGroup;
  amount: string;
  occurrencesPerMonth?: number; // default 1
  expectedDayOfMonth?: number;
  effectiveFromYear: number;
  effectiveFromMonth: number;
}
```

#### `PATCH /recurring-rules/:ruleId`

Body: partial + `{ scope: 'THIS_PERIOD_ONLY' | 'FROM_PERIOD'; periodId?: string; expectedPeriodVersion?: number }`
Si `FROM_PERIOD`: requiere `expectedPeriodVersion` del periodo origen (de `GET /periods/:periodId` o respuesta de `POST /projection/preview`); mismatch → 409 `FINANCE_CONFLICT`.

Response `200`: `{ rule: RecurringRuleDto; preview?: ProjectionPreviewResult }`

---

### Familia: Presupuestos de periodo

#### `GET /periods/:periodId/budgets`

Query: `listPeriodBudgetsQuerySchema` — `{}`; cualquier parámetro recibe `422
VALIDATION_ERROR`.

Response `200`: `{ budgets: PeriodBudgetDto[] }`

#### `PATCH /periods/:periodId/budgets/:categoryGroup`

Body:

```typescript
{
  limitAmount: string;
  isOverride?: boolean; // default true para PATCH directo
  scope?: 'THIS_PERIOD' | 'FUTURE';
  expectedPeriodVersion?: number; // obligatorio si scope: FUTURE y afecta periodos posteriores
}
```

Response `200`: `{ budget: PeriodBudgetDto }`
Con `scope: FUTURE`: puede requerir flujo preview/confirm.

---

### Familia: Ítems planeados

#### `GET /periods/:periodId/plan-items`

Query: `listPlanItemsQuerySchema` — `{ status?, categoryGroup?, accountId?,
includeHidden? }`; aliases, arrays y keys desconocidas → `422
VALIDATION_ERROR`.
**Nota:** filtros de vista no alteran summary; summary siempre calcula todos.

Response `200`: `{ planItems: PlanItemDto[] }`

#### `POST /periods/:periodId/plan-items`

Body:

```typescript
{
  categoryId: string;
  accountId: string;
  counterpartyAccountId?: string;
  concept: string;
  expectedDate: string;
  plannedAmount: string;
  notes?: string;
}
```

#### `PATCH /plan-items/:planItemId`

Body: partial; transición a `REALIZED` requiere `realizedAmount` y crea transacción vinculada.
Transición a `CANCELLED`: no borra registro.

#### `DELETE /plan-items/:planItemId`

Solo ítems futuros no realizados; realizados → usar `CANCELLED`.
Response `204`.

#### `PATCH /plan-items/:planItemId/visibility`

Body: `{ isHidden: boolean }` — no afecta totales.

---

### Familia: Transacciones

#### `GET /periods/:periodId/transactions`

Query: `listTransactionsQuerySchema` — `{ type?, accountId?, categoryId?,
fromDate?, toDate?, includeHidden?, cursor?, limit? }`; `limit` max 100.
Aliases, arrays y keys desconocidas → `422 VALIDATION_ERROR`.

Response `200`:

```typescript
{
  transactions: TransactionDto[];
  nextCursor: string | null;
}
```

#### `POST /api/v1/finance/periods/:periodId/transactions`

Body:

```typescript
{
  type: FinanceTransactionType;
  accountId: string;
  counterpartyAccountId?: string; // required según type
  categoryId?: string;
  occurredOn: string;
  amount: string;
  concept: string;
  notes?: string;
  planItemId?: string; // si realiza ítem existente
}
```

Validaciones:

- `counterpartyAccountId` obligatorio para TRANSFER, CREDIT_PAYMENT, SAVINGS_*.
- `accountId <> counterpartyAccountId`.
- Cuentas activas y mismo userId.
- `occurredOn` dentro del periodo indicado o coherente con reglas de periodo de pertenencia (`01`).
- `:periodId`, todas las FKs y el body `.strict()` se validan antes de escribir;
  `userId`, `id` y `periodId` en body no son aceptados.
- El periodo, cuentas, categoría y `planItemId` deben pertenecer al
  `req.user!.id`; inexistentes o ajenos → `404 NOT_FOUND`.

Response `201`:

```typescript
{ transaction: TransactionDto }
```

`TransactionDto` es el DTO completo de esta sección (incluidos UUIDs y montos
como string decimal). La API no devuelve una transacción plana ni un `id` en la
raíz.

#### `PATCH /api/v1/finance/transactions/:transactionId`

Body: parcial `.strict()`; editar realizados puede disparar preview de
propagación si altera saldo final. `:transactionId` debe ser UUID v4 canónico y
la transacción se resuelve con `{ id: transactionId, userId: req.user!.id }`;
ajena o inexistente → `404 NOT_FOUND`. Si el patch cambia cuenta, contraparte,
categoría, fecha o vínculo de plan, cada referencia se valida como propia y
coherente con el periodo de la transacción. No se aceptan `id`, `userId` ni
`periodId` en el body.

Response `200`:

```typescript
{ transaction: TransactionDto }
```

La respuesta también es envuelta; el cliente consume
`response.transaction`, nunca un `TransactionDto` plano.

---

### Familia: Proyección

### Schema estricto de `PropagationChange`

El contrato de entrada no usa `Partial<FinancePlanItemSnapshot>` ni
`Partial<FinanceTransactionSnapshot>`, porque esos tipos permitirían IDs y
campos internos. Cada variante del discriminated union tiene un patch cerrado;
el service convierte los strings de dinero a `Decimal` para el tipo interno de
`08`.

```typescript
const propagationRecurringRulePatchSchema = z
  .object({
    amount: moneySchema.optional(),
    occurrencesPerMonth: z.number().int().min(1).max(31).optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, 'patch cannot be empty');

const propagationPlanItemPatchSchema = z
  .object({
    categoryId: uuidV4Schema.optional(),
    accountId: uuidV4Schema.optional(),
    counterpartyAccountId: uuidV4Schema.nullable().optional(),
    concept: z.string().min(1).max(500).optional(),
    expectedDate: calendarDateSchema.optional(),
    plannedAmount: moneySchema.optional(),
    realizedAmount: moneySchema.nullable().optional(),
    status: z.enum(['PLANNED', 'REALIZED', 'CANCELLED']).optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, 'patch cannot be empty');

const propagationTransactionPatchSchema = z
  .object({
    accountId: uuidV4Schema.optional(),
    counterpartyAccountId: uuidV4Schema.nullable().optional(),
    categoryId: uuidV4Schema.nullable().optional(),
    occurredOn: calendarDateSchema.optional(),
    amount: moneySchema.optional(),
    concept: z.string().min(1).max(500).optional(),
    notes: z.string().max(2000).nullable().optional(),
    planItemId: uuidV4Schema.nullable().optional(),
  })
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, 'patch cannot be empty');

export const propagationChangeSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('UPDATE_RECURRING_RULE'),
    ruleId: uuidV4Schema,
    patch: propagationRecurringRulePatchSchema,
    scope: z.literal('FUTURE'),
  }).strict(),
  z.object({
    kind: z.literal('UPDATE_BUDGET'),
    categoryGroup: financeCategoryGroupSchema,
    limitAmount: moneySchema,
    scope: z.enum(['THIS_PERIOD', 'FUTURE']),
  }).strict(),
  z.object({
    kind: z.literal('UPDATE_PLAN_ITEM'),
    planItemId: uuidV4Schema,
    patch: propagationPlanItemPatchSchema,
  }).strict(),
  z.object({
    kind: z.literal('UPDATE_TRANSACTION'),
    transactionId: uuidV4Schema,
    patch: propagationTransactionPatchSchema,
  }).strict(),
]);

export type PropagationChange = z.infer<typeof propagationChangeSchema>;

export const projectionPreviewBodySchema = z.object({
  originPeriodId: uuidV4Schema,
  changes: z.array(propagationChangeSchema).min(1),
}).strict();

export const projectionConfirmBodySchema = z.object({
  originPeriodId: uuidV4Schema,
  expectedPeriodVersion: z.number().int().nonnegative(),
  changes: z.array(propagationChangeSchema).min(1),
  replaceOverrides: z.boolean().optional(),
}).strict();
```

Las claves `id`, `periodId`, `userId`, `isHidden` y cualquier alias se rechazan
en los patches; `amount`, `limitAmount`, `plannedAmount` y
`realizedAmount` usan `moneySchema` y por tanto no aceptan signo ni decimales
distintos de exactamente dos posiciones.

#### `POST /projection/preview`

Body: `projectionPreviewBodySchema`.

```typescript
{
  originPeriodId: string;
  changes: PropagationChange[]; // ver 08
}
```

Response `200`: `ProjectionPreviewResult`. En cada `ProjectionDiff`, los campos
`deltaExpectedExpense`, `deltaActualExpense`, `deltaExpectedSavings`,
`accountDeltas.*`, `deltaDebt` y `deltaCreditAvailable` se serializan con
`signedMoneySchema`, aunque su valor sea `"0.00"`.
Sin escritura DB.

#### `POST /projection/confirm`

Body: `projectionConfirmBodySchema`.

```typescript
{
  originPeriodId: string;
  expectedPeriodVersion: number;
  changes: PropagationChange[];
  replaceOverrides?: boolean;
}
```

Response `200`:

```typescript
{
  affectedPeriodIds: string[];
  summaries: Array<{ periodId: string; summary: PeriodSummaryCompact }>;
}
```

Error `409`:

```typescript
{
  error: 'FINANCE_CONFLICT';
  message: 'Period was modified by another session';
  details: { periodId: string; expectedPeriodVersion: number; actualVersion: number };
}
```

---

### DTOs compartidos (serialización respuesta)

```typescript
type AccountDto = {
  id: string;
  name: string;
  type: FinanceAccountType;
  status: FinanceAccountStatus;
  initialBalance: string;
  creditLimit: string | null;
  openingDebt: string | null;
  statementDay: number | null;
  paymentDay: number | null;
  includeInProjections: boolean;
  startsOn: string;
};

type CategoryDto = {
  id: string;
  group: FinanceCategoryGroup;
  name: string;
  isSystemDefault: boolean;
  isActive: boolean;
  sortOrder: number;
};

type RecurringRuleDto = {
  id: string;
  categoryId: string;
  accountId: string | null;
  name: string;
  group: FinanceCategoryGroup;
  amount: string;
  occurrencesPerMonth: number;
  expectedDayOfMonth: number | null;
  effectiveFromYear: number;
  effectiveFromMonth: number;
  effectiveToYear: number | null;
  effectiveToMonth: number | null;
  isActive: boolean;
};

type PeriodBudgetDto = {
  id: string;
  periodId: string;
  categoryId: string;
  recurringRuleId: string | null;
  limitAmount: string;
  isOverride: boolean;
};

type PeriodDto = {
  id: string;
  year: number;
  month: number;
  label: string | null;
  notes: string | null;
  version: number;
  createdAt: string; // ISO8601
  updatedAt: string;
};

type PlanItemDto = {
  id: string;
  periodId: string;
  categoryId: string;
  accountId: string;
  counterpartyAccountId: string | null;
  concept: string;
  expectedDate: string;
  plannedAmount: string;
  realizedAmount: string | null;
  status: 'PLANNED' | 'REALIZED' | 'CANCELLED';
  notes: string | null;
  isHidden: boolean;
  transactionId: string | null;
};

type TransactionDto = {
  id: string;
  periodId: string;
  type: FinanceTransactionType;
  accountId: string;
  counterpartyAccountId: string | null;
  categoryId: string | null;
  occurredOn: string;
  amount: string;
  concept: string;
  notes: string | null;
  isHidden: boolean;
  planItemId: string | null;
};
```

Exportar schemas Zod de respuesta para tests de contrato opcionales (`tests/unit/finance.contracts.test.ts`).

---

## Autenticación y ownership

### Reglas

1. **Todas** las rutas bajo `/finance` usan middleware `authenticate`.
2. **Prohibido** `optionalAuth` en lecturas o mutaciones financieras.
3. `const userId = req.user!.id` es la única fuente de ownership en
   service/repository; params `:periodId`, `:accountId`, etc. se resuelven con
   `findFirst({ id, userId })`.
4. Finance **no** usa `requireRole` para recursos propios. Un usuario global
   `READ_ONLY` puede crear, editar y cancelar sus propios recursos Finance.
5. Todo recurso Finance inexistente o ajeno devuelve `404 NOT_FOUND` a
   cualquier usuario, incluido `ADMIN`; el rol global `ADMIN` no bypassa
   ownership Finance (arquitectura §8).
6. Esta es una excepción deliberada y limitada a `/api/v1/finance`. No cambia
   el RBAC de `/api/v1/users` ni de módulos globales, donde `requireRole` puede
   seguir siendo obligatorio.
7. MVP: usuarios provisionados por admin vía `/api/v1/users`; sin registro
   público en rutas finance.

> **Nota de implementación:** la excepción `READ_ONLY` self-owned requiere
> actualizar o documentar el middleware/policy específico del módulo Finance
> durante la implementación. Esta corrección no muta el middleware/policy
> global ni módulos existentes.

### Contrato vigente de usuarios (evidencia)

Antes de provisionar fixtures o clientes administrativos, verificar
`createUserSchema` en `repos/personal-api/src/modules/users/users.schemas.ts`
y la respuesta documentada en `repos/personal-api/README.md`:

```typescript
type CreateUserBody = {
  email: string;
  name: string;
  password: string;
  role: 'READ_ONLY' | 'ADMIN';
};

type UserDto = {
  id: string;
  email: string;
  name: string;
  role: 'READ_ONLY' | 'ADMIN';
};
```

`role` es un campo top-level tanto al crear como al leer el usuario. No enviar,
leer ni derivar autorización de `permissions` o `applicationSlug`: ese contrato
anterior fue eliminado y no es parte de v1.

### Validación de referencias cruzadas

Al crear/actualizar entidades con FKs (`accountId`, `categoryId`, `periodId`):

```typescript
async function assertSameUserOwnership(userId: string, refs: { accountIds?: string[]; categoryIds?: string[]; periodId?: string }) {
  // Todas las FKs deben existir y pertenecer a userId
  // Si alguna falta o es de otro usuario → FinanceNotFoundError (404)
}
```

---

## Validación

### Boundary Zod

- Middleware `validateBody`, `validateQuery`, `validateParams` en routes.
- Controller usa `getValidated(req, schema)`.
- Coerción mínima: no coerce strings a number para dinero; rechazar `2000` numérico en JSON si el schema exige string (forzar consistencia wire).
- Request/response finance: `moneySchema` para entradas y montos de entidad no negativos; `signedMoneySchema` para `expectedSavings`, `actualSavings`, `expectedConsumption`, `remainingActual`, `remainingProjected` y todos los deltas de proyección.

### Reglas de negocio (400 `FINANCE_VALIDATION`)

| Regla | Mensaje típico |
|-------|----------------|
| Cuenta CREDIT sin límite | `creditLimit required for credit accounts` |
| TRANSFER sin contraparte | `counterpartyAccountId required` |
| Misma cuenta origen/destino | `accounts must differ` |
| Realizar ítem sin monto | `realizedAmount required` |
| Periodo duplicado | `period already exists` |
| Eliminar cuenta con historial | `account has dependent records` |
| `occurredOn` fuera de rango periodo | `date outside period` |

---

## Códigos HTTP — matriz completa

`422` es exclusivamente para errores de request/Zod (`VALIDATION_ERROR`);
`400` queda para reglas de negocio explícitas (`FINANCE_VALIDATION`).

| Operación | 200 | 201 | 204 | 400 | 401 | 404 | 409 | 422 | 500 |
|-----------|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| GET * | ✓ | | | | ✓ | ✓ | | ✓ | ✓ |
| POST create | | ✓ | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| PATCH | ✓ | | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| DELETE | | | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| POST preview | ✓ | | | ✓ | ✓ | ✓ | | ✓ | ✓ |
| POST confirm | ✓ | | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Límites operativos

| Límite | Valor | Respuesta |
|--------|-------|-----------|
| `limit` listado transacciones | max 100 | 422 `VALIDATION_ERROR` si excede |
| Longitud `concept` | 500 chars | 422 `VALIDATION_ERROR` |
| Longitud `notes` | 2000 chars | 422 `VALIDATION_ERROR` |
| Longitud `name` cuenta/categoría | 100 chars | 422 `VALIDATION_ERROR` |
| Reglas recurrentes activas por usuario | 200 soft warning en logs | — |
| Ítems planeados por periodo | 500 soft warning | — |
| Payload JSON | 1 MB (límite Express existente) | 413 |
| Rate limit | Reutilizar limiter global API si existe | 429 |

---

## Logging seguro

### Permitido en logs estructurados

- `userId` (UUID)
- `periodId`, `accountId`, `transactionId` (UUIDs)
- `error` code, HTTP status, duration ms
- `operation` name (p. ej. `finance.confirmPropagation`)
- Conteo de registros afectados (`affectedPeriodCount: 3`)

### Prohibido en logs (MVP)

- Montos (`amount`, `limitAmount`, saldos)
- Conceptos, notas, nombres de cuenta/categoría
- Tokens JWT completos
- Stack traces en respuesta al cliente (solo en log server-side en dev)

### Ejemplo

```typescript
logger.info({
  operation: 'finance.getPeriodSummary',
  userId,
  periodId,
  durationMs,
});

logger.error({
  operation: 'finance.confirmPropagation',
  userId,
  periodId,
  error: 'FINANCE_CONFLICT',
  expectedPeriodVersion,
  actualVersion,
});
// NO: logger.info({ amount: transaction.amount, concept: transaction.concept })
```

---

## Tareas

1. Completar `finance.schemas.ts` con schemas request/response por familia (secciones anteriores).
2. Añadir `finance.contracts.test.ts` validando ejemplos JSON contra schemas,
   incluido `GET /accounts`: UUID v4 canónico, defaults, salida booleana de
   `includeBalances`, UUID v1 rechazado, aliases/parámetros extra rechazados por
   `.strict()` y la dependencia condicional `periodId` ↔ `includeBalances`.
3. Implementar `assertSameUserOwnership` en service.
4. Mapear `FinanceError`, `ZodError`, `Prisma P2002/P2025` en error handler global.
5. Documentar rutas en comentarios OpenAPI opcionales o README del módulo (sin archivo markdown extra salvo este spec).
6. Aplicar rate limiter existente al router finance si el monolith lo usa en otros módulos.
7. Tests integración `tests/integration/finance-auth.test.ts`: 401 sin token;
   A/B `READ_ONLY` pueden crear/editar/cancelar solo sus recursos propios;
   B `READ_ONLY` y `ADMIN` reciben 404 cross-user; 409 versión.
8. Tests integración `tests/integration/finance-validation.test.ts`: casos 422 de
   Zod/request validation y casos 400 de reglas `FINANCE_VALIDATION`.

## Criterios de aceptación

1. **CA-01** Todas las familias de recursos de arquitectura §10 tienen contrato request/response documentado aquí.
2. **CA-02** Errores usan shape `{ error, message, details? }` en
   400/401/404/409/422/500; los inesperados usan
   `INTERNAL_SERVER_ERROR`.
3. **CA-03** Recurso ajeno retorna 404, nunca 403 con body que confirme existencia.
4. **CA-04** Sin token → 401 en `GET /api/v1/finance/periods`.
5. **CA-05** Body o query inválido Zod → 422 `VALIDATION_ERROR` con `details`
   array de issues; las reglas de negocio explícitas permanecen en 400
   `FINANCE_VALIDATION`.
6. **CA-06** Confirm propagación con `expectedPeriodVersion` stale → 409 `FINANCE_CONFLICT` con versiones en details.
7. **CA-07** Montos en JSON respuesta son strings con exactamente dos decimales (`moneySchema` o `signedMoneySchema` según campo); no `Float` JSON number.
8. **CA-08** Fechas en JSON son `YYYY-MM-DD`; timestamps ISO solo en `createdAt`/`updatedAt`.
9. **CA-09** Logs de mutaciones finance no contienen montos ni conceptos (revisión manual + test de logger mock).
10. **CA-10** A `READ_ONLY` puede crear, editar y cancelar datos Finance
    propios; B `READ_ONLY` y `ADMIN` con token válido no acceden ni mutan el
    periodo de A (404).
11. **CA-11** `POST /projection/preview` no persiste cambios (verificar conteos DB antes/después).
12. **CA-12** `PATCH plan-items visibility` no altera `GET summary` totals.
13. **CA-13** `GET /api/v1/finance/accounts` acepta solo `status` del enum,
    `periodId` UUID v4 canónico y `includeBalances` URL `true|false` transformado
    a boolean; aliases y parámetros desconocidos reciben `422 VALIDATION_ERROR`.
14. **CA-14** `POST /api/v1/finance/periods/:periodId/transactions` responde
    `201 { transaction: TransactionDto }` y
    `PATCH /api/v1/finance/transactions/:transactionId` responde
    `200 { transaction: TransactionDto }`; ambos validan body/FKs/ownership y
    nunca exponen un DTO plano.

## Verificación

```powershell
Set-Location repos/personal-api
npm run build
npm run lint
npm test -- tests/unit/finance.contracts.test.ts tests/integration/finance-auth.test.ts tests/integration/finance-validation.test.ts
```

| ID | Comprobación |
|----|--------------|
| V-01 | Supertest: sin Authorization → 401 |
| V-02 | Supertest: A/B `READ_ONLY` cruzados y `ADMIN` contra periodId de A → 404; A puede mutar solo el suyo |
| V-03 | Supertest: POST account CREDIT sin creditLimit → 400 `FINANCE_VALIDATION`; un body/query inválido de Zod → 422 `VALIDATION_ERROR` |
| V-04 | Supertest: confirm con version mismatch → 409 body shape |
| V-05 | Supertest: preview no incrementa `version` en DB |
| V-06 | `rg "logger\.(info|error).*amount" src/modules/finance` → cero |
| V-07 | Respuesta summary: `JSON.parse` montos son typeof string |
| V-08 | Sin placeholders ni elipsis de implementación en contratos del spec |
| V-09 | README: spec `09` depende de `07` y `08`; grafo incluye arista `calculations → contracts` |
| V-10 | Supertest: POST transaction → `201` y PATCH transaction → `200`, ambos con `{ transaction: TransactionDto }` y sin `id` raíz |

## Impacto y riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| 403 en recurso ajeno | Filtrado de existencia | 404 uniforme CA-03 |
| Decimal serializado como number | Float en wire | Serializador string CA-07 |
| Logs con PII financiera | Exposición operacional | Política logging CA-09 |
| Preview persiste por bug | Datos corruptos | Test CA-11; preview sin repository writes |
| `requireRole` bloquea recursos propios | `READ_ONLY` no puede usar Finance | Excepción explícita `authenticate` + ownership; tests A/B `READ_ONLY` |
| Contrato drift vs UI | Integración frágil | Schemas compartidos; spec `17` consumirá estos tipos |
| README grafo desactualizado | Orden de ejecución incorrecto para `09` | **Resuelto:** README y grafo alineados; `09` depende de `07` y `08` (ver nota de cabecera) |
| Payloads enormes | DoS ligero | Límites paginación y JSON size |

**Desbloquea:** Integración `16` (cliente HTTP), `17` (API client y cache), `19` (mutaciones y proyección).
