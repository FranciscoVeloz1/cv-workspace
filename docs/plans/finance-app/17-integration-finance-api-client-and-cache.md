# Integración — Cliente API Finance y caché

**Tipo:** Integration
**Depende de:** [`07-backend-finance-module.md`](07-backend-finance-module.md), [`08-backend-calculations-and-projection.md`](08-backend-calculations-and-projection.md), [`09-backend-contracts-security-and-errors.md`](09-backend-contracts-security-and-errors.md), [`16-integration-auth-and-http-client.md`](16-integration-auth-and-http-client.md)
**Implementa:** Tipos DTO alineados con contratos `09`, wrappers HTTP finance, query keys centralizadas, hooks TanStack Query, política de invalidación, validación Zod de respuestas, montos como string y `AbortSignal` en `repos/finance-app`.
**No incluye:** Implementación backend, pantallas dashboard (`18`), mutaciones con propagación (`19`), crédito/Klar (`20`), runbook E2E (`21`), commits.

## Resultado

La SPA consume `/api/v1/finance/*` mediante funciones tipadas y hooks cacheados. Los montos circulan como **string decimal** (nunca `number` ni `Float`). Las respuestas críticas se validan con Zod antes de entrar a la UI. Las query keys son estables y la invalidación post-mutación mantiene coherencia resumen ↔ detalle ↔ timeline.

## Contratos de entrada y salida

### Entradas

| Entrada | Proveedor |
|---------|-----------|
| Cliente HTTP autenticado | Spec `16` (`createHttpClient`) |
| Contratos HTTP | Spec `09` (familias periodos, cuentas, transacciones, proyección) |
| Tipos cálculo | Spec `08` (`PeriodSummary`, `Suggestion`, etc.) serializados en `09` |

### Salidas (artefactos SPA)

| Artefacto | Ruta |
|-----------|------|
| Tipos wire DTO | `repos/finance-app/src/api/finance-types.ts` |
| Schemas Zod respuesta | `repos/finance-app/src/api/finance-schemas.ts` |
| Cliente finance | `repos/finance-app/src/api/finance.ts` |
| Query keys | `repos/finance-app/src/api/query-keys.ts` |
| Hooks queries | `repos/finance-app/src/hooks/useFinancePeriods.ts`, `repos/finance-app/src/hooks/useFinanceSummary.ts`, `repos/finance-app/src/hooks/useFinanceAccounts.ts`, `repos/finance-app/src/hooks/useFinanceTransactions.ts`, `repos/finance-app/src/hooks/useFinancePlanItems.ts`, `repos/finance-app/src/hooks/useFinanceBudgets.ts` |
| Hooks mutaciones (stubs) | `repos/finance-app/src/hooks/useFinanceMutations.ts` (completado en `19`) |
| Utilidad dinero | `repos/finance-app/src/utils/money.ts` |
| Tests | `repos/finance-app/src/test/api/finance-client.test.ts`, `repos/finance-app/src/test/api/finance-schemas.test.ts` |

### Convenciones wire (heredadas de `09`)

| Aspecto | Regla cliente |
|---------|---------------|
| Base URL | `VITE_API_BASE_URL` es solo el origen (`http://localhost:3000` en local) |
| Base path finance | `/api/v1/finance` |
| Dinero | Montos de entrada y entidades: `moneySchema` `/^\d+\.\d{2}$/` (sin signo); derivados con signo (`expectedSavings`, `actualSavings`, `expectedConsumption`, `remainingActual`, `remainingProjected`, deltas de proyección y `accountDeltas.*`): `signedMoneySchema` `/^-?\d+\.\d{2}$/`; nunca `number` ni `Float` |
| Fechas calendario | `YYYY-MM-DD` |
| IDs | UUID v4 canónico en minúsculas |
| Errores | `ApiError` con `code` de `09`; Zod/request validation → `422 VALIDATION_ERROR`, reglas Finance explícitas → `400 FINANCE_VALIDATION`, inesperados → `500 INTERNAL_SERVER_ERROR` |

### IDs UUID v4 y query de cuentas

`repos/finance-app/src/api/finance-schemas.ts` exporta la misma regla canónica
de `09`; no se usa `z.string().uuid()` genérico ni se normaliza la entrada. Los
schemas de respuesta la aplican a cada `id`, `periodId`, `accountId`,
`categoryId`, `transactionId` y FK equivalente.

```typescript
// repos/finance-app/src/api/finance-schemas.ts
export const UUID_V4_CANONICAL_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export const uuidV4Schema = z
  .string()
  .regex(UUID_V4_CANONICAL_PATTERN, 'Expected canonical UUID v4');
```

Espejo de `09` para montos wire:

```typescript
// repos/finance-app/src/api/finance-schemas.ts
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

export const periodSummaryTotalsSchema = z.object({
  expectedIncome: moneySchema,
  receivedIncome: moneySchema,
  expectedExpense: moneySchema,
  actualExpense: moneySchema,
  expectedSavings: signedMoneySchema,
  actualSavings: signedMoneySchema,
  expectedConsumption: signedMoneySchema,
  cashRemaining: moneySchema,
  creditUsed: moneySchema,
  creditAvailable: moneySchema,
  projectedCreditAvailable: moneySchema,
  klarBalance: moneySchema,
});
```

`ProjectionDiff` usa `signedMoneySchema` para
`deltaExpectedExpense`, `deltaActualExpense`, `deltaExpectedSavings`,
`accountDeltas.opening`, `accountDeltas.closing`, `deltaDebt` y
`deltaCreditAvailable`:

```typescript
export const projectionDiffSchema = z.object({
  periodId: uuidV4Schema,
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  deltaExpectedExpense: signedMoneySchema,
  deltaActualExpense: signedMoneySchema,
  deltaExpectedSavings: signedMoneySchema,
  accountDeltas: z.record(
    uuidV4Schema,
    z.object({
      opening: signedMoneySchema,
      closing: signedMoneySchema,
    }).strict(),
  ),
  deltaDebt: signedMoneySchema,
  deltaCreditAvailable: signedMoneySchema,
}).strict();
```

El frontend valida antes de serializar el mismo contrato de
`GET /api/v1/finance/accounts`. `includeBalances` es un boolean en memoria y
se convierte exclusivamente al literal URL `true`; los nombres de propiedades
son estrictos, por lo que `period_id`, `withBalances` o cualquier key adicional
fallan localmente antes de emitir una petición.

### `PeriodSummary.breakdowns` estricto

`PeriodSummaryBreakdownKey` en `08` define 23 claves obligatorias. El cliente
redeclara esa unión en `finance-types.ts` como espejo de `08` y construye un
objeto Zod cerrado: cada clave debe existir y su valor debe ser un arreglo de
UUID v4 canónicos. No usar `z.record(...)`, porque aceptaría claves extra y no
puede exigir el conjunto completo.

```typescript
// repos/finance-app/src/api/finance-schemas.ts
import type { PeriodSummaryBreakdownKey } from './finance-types';

const uuidIdArraySchema = z.array(uuidV4Schema);

type PeriodSummaryBreakdownShape = {
  [key in PeriodSummaryBreakdownKey]: typeof uuidIdArraySchema;
};

const periodSummaryBreakdownShape: PeriodSummaryBreakdownShape = {
  expectedIncomePlanItems: uuidIdArraySchema,
  receivedIncomeTransactions: uuidIdArraySchema,
  expectedExpensePlanItems: uuidIdArraySchema,
  actualExpenseTransactions: uuidIdArraySchema,
  budgetIds: uuidIdArraySchema,
  budgetRemainingActualByCategory: uuidIdArraySchema,
  budgetRemainingProjectedByCategory: uuidIdArraySchema,
  accountOpeningBalanceAccountIds: uuidIdArraySchema,
  accountEntryTransactions: uuidIdArraySchema,
  accountExitTransactions: uuidIdArraySchema,
  accountClosingBalanceAccountIds: uuidIdArraySchema,
  creditPurchaseTransactions: uuidIdArraySchema,
  creditPaymentTransactions: uuidIdArraySchema,
  cashWithdrawalTransactions: uuidIdArraySchema,
  cashExpenseTransactions: uuidIdArraySchema,
  klarBalanceAccountIds: uuidIdArraySchema,
  klarDepositTransactions: uuidIdArraySchema,
  klarWithdrawalTransactions: uuidIdArraySchema,
  expectedSavingsAccountIds: uuidIdArraySchema,
  actualSavingsAccountIds: uuidIdArraySchema,
  plannedPlanItems: uuidIdArraySchema,
  realizedPlanItems: uuidIdArraySchema,
  realizedTransactions: uuidIdArraySchema,
};

export const periodSummaryBreakdownsSchema = z
  .object(periodSummaryBreakdownShape)
  .strict();
```

La anotación de `periodSummaryBreakdownShape` falla en TypeScript si falta o
sobra una clave del espejo `PeriodSummaryBreakdownKey`; `.strict()` rechaza
claves extra en la respuesta real. Arrays vacíos siguen siendo válidos cuando
un agregado no tiene entidades fuente. `periodSummarySchema` declara
obligatoriamente `breakdowns: periodSummaryBreakdownsSchema`.

### Query keys (contrato)

```typescript
// repos/finance-app/src/api/query-keys.ts
import { z } from 'zod';

import { calendarDateSchema, uuidV4Schema } from './finance-schemas';
import type {
  FinanceCategoryGroup,
  FinanceTransactionType,
} from './finance-types';

export type PeriodListFilters = {
  fromYear?: number;
  fromMonth?: number;
  toYear?: number;
  toMonth?: number;
};

export type TransactionListFilters = {
  type?: FinanceTransactionType;
  accountId?: string;
  categoryId?: string;
  fromDate?: string;
  toDate?: string;
  includeHidden?: boolean;
  cursor?: string;
  limit?: number;
};

export type PlanItemListFilters = {
  status?: 'PLANNED' | 'REALIZED' | 'CANCELLED';
  categoryGroup?: FinanceCategoryGroup;
  accountId?: string;
  includeHidden?: boolean;
};

export type CategoryListFilters = {
  activeOnly?: boolean;
};

export type AccountListParams =
  | {
      status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
      includeBalances?: false;
      periodId?: never;
    }
  | {
      status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
      includeBalances: true;
      periodId: string;
    };

const accountListParamsSchema = z
  .object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).optional(),
    periodId: uuidV4Schema.optional(),
    includeBalances: z.boolean().optional().default(false),
  })
  .strict()
  .superRefine((params, ctx) => {
    if (params.includeBalances && !params.periodId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['periodId'],
        message: 'periodId is required when includeBalances=true',
      });
    }
    if (!params.includeBalances && params.periodId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['includeBalances'],
        message: 'periodId requires includeBalances=true',
      });
    }
  });

export const periodListFiltersSchema = z.object({
  fromYear: z.number().int().min(2000).max(9999).optional(),
  fromMonth: z.number().int().min(1).max(12).optional(),
  toYear: z.number().int().min(2000).max(9999).optional(),
  toMonth: z.number().int().min(1).max(12).optional(),
}).strict();

export const transactionListFiltersSchema = z.object({
  type: z.enum([
    'INCOME',
    'EXPENSE',
    'TRANSFER',
    'CREDIT_PURCHASE',
    'CREDIT_PAYMENT',
    'SAVINGS_DEPOSIT',
    'SAVINGS_WITHDRAWAL',
  ]).optional(),
  accountId: uuidV4Schema.optional(),
  categoryId: uuidV4Schema.optional(),
  fromDate: calendarDateSchema.optional(),
  toDate: calendarDateSchema.optional(),
  includeHidden: z.boolean().optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
}).strict();

export const planItemListFiltersSchema = z.object({
  status: z.enum(['PLANNED', 'REALIZED', 'CANCELLED']).optional(),
  categoryGroup: z.enum([
    'MONTHLY_SERVICES',
    'GROCERIES',
    'OUTINGS',
    'EXTRAS',
    'TRANSFER',
    'CREDIT',
    'SAVINGS',
    'INCOME',
  ]).optional(),
  accountId: uuidV4Schema.optional(),
  includeHidden: z.boolean().optional(),
}).strict();

export const categoryListFiltersSchema = z.object({
  activeOnly: z.boolean().optional(),
}).strict();

export const financeKeys = {
  all: ['finance'] as const,
  periods: (filters?: PeriodListFilters) =>
    [...financeKeys.all, 'periods', filters ?? {}] as const,
  period: (periodId: string) => [...financeKeys.all, 'period', periodId] as const,
  summary: (periodId: string) => [...financeKeys.all, 'summary', periodId] as const,
  accounts: (params?: AccountListParams) =>
    [...financeKeys.all, 'accounts', params ?? {}] as const,
  transactions: (periodId: string, filters?: TransactionListFilters) =>
    [...financeKeys.all, 'transactions', periodId, filters ?? {}] as const,
  planItems: (periodId: string, filters?: PlanItemListFilters) =>
    [...financeKeys.all, 'planItems', periodId, filters ?? {}] as const,
  budgets: (periodId: string) => [...financeKeys.all, 'budgets', periodId] as const,
  categories: (filters?: CategoryListFilters) =>
    [...financeKeys.all, 'categories', filters ?? {}] as const,
  recurringRules: () => [...financeKeys.all, 'recurringRules'] as const,
  projectionPreview: (originPeriodId: string, hash: string) =>
    [...financeKeys.all, 'projectionPreview', originPeriodId, hash] as const,
};
```

Los tipos y schemas anteriores son espejo de `09`; los wrappers deben ejecutar
el `.parse()` correspondiente antes de construir la URL. No usar tipos de
filtro abiertos: `periods` acepta solo
`fromYear/fromMonth/toYear/toMonth`, `accounts` solo su unión condicional,
`transactions` solo los ocho campos definidos, `planItems` solo sus cuatro
campos y `categories` solo `activeOnly`. Aliases como `period_id`,
`include_hidden` o `from_date` fallan localmente antes de emitir la petición.

### Invalidación (política)

| Evento | Claves a invalidar |
|--------|-------------------|
| Mutación transacción / ítem | `summary(periodId)`, `transactions`, `planItems`, `accounts` (si balances), `periods` (timeline compact) |
| Mutación cuenta global | `accounts`, todos `summary` visibles |
| Confirm propagación (`19`) | `summary` + `period` + `periods` + `budgets` + `planItems` + `transactions` para cada `affectedPeriodId` |
| Toggle visibilidad | Solo listados (`transactions`, `planItems`); **no** `summary` |
| Logout | `queryClient.clear()` |

### Wrapper — ejemplo period summary

```typescript
// repos/finance-app/src/api/finance.ts
export async function getPeriodSummary(
  periodId: string,
  signal?: AbortSignal,
): Promise<PeriodSummaryResponse> {
  const raw = await http.request<unknown>(
    `/api/v1/finance/periods/${periodId}/summary`,
    { signal },
  );
  return periodSummaryResponseSchema.parse(raw);
}
```

### Wrapper — cuentas con balances de periodo

```typescript
// repos/finance-app/src/api/finance.ts
export async function listAccounts(
  params: AccountListParams = {},
  signal?: AbortSignal,
): Promise<AccountsResponse> {
  const validParams = accountListParamsSchema.parse(params);
  const query = new URLSearchParams();
  if (validParams.status) query.set('status', validParams.status);
  if (validParams.includeBalances && validParams.periodId) {
    query.set('periodId', validParams.periodId);
    query.set('includeBalances', 'true');
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  const raw = await http.request<unknown>(
    `/api/v1/finance/accounts${suffix}`,
    { signal },
  );
  return accountsResponseSchema.parse(raw);
}
```

`AccountListParams` hace imposible pedir balances sin UUID de periodo en
TypeScript, y `accountListParamsSchema` repite esa protección en runtime con
UUID v4 canónico y `.strict()`. Si `includeBalances` es `true`,
`accountsResponseSchema` exige el `periodId` de respuesta y la unión
crédito/no crédito documentada en `09`; sin balances rechaza campos derivados
inesperados.

### Contexto calculado de fixture — `SuggestionContext`

El endpoint no serializa este objeto: el seed/test backend convierte estos strings
decimales a `Decimal` y lo pasa a `buildSuggestions(summary, context)`. Es la
evidencia suficiente para las cinco sugerencias del fixture; no se infiere presión de
crédito desde el summary de Marzo solamente.

```json
{
  "periodId": "4bc02a91-6ad8-4627-8ab9-01c3ee0a1003",
  "cashAccountId": "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1002",
  "liquidCashAccountId": "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1001",
  "thresholds": {
    "cashWithdrawalShortfall": "0.01",
    "categoryNearLimitRatio": "0.90",
    "projectedSavingsDrop": "1000.00",
    "creditPaymentCashLiquidityFloor": "2000.00",
    "unallocatedCash": "5000.00"
  },
  "savingsComparison": {
    "kind": "PREVIOUS_PERIOD",
    "periodId": "4bc02a91-6ad8-4627-8ab9-01c3ee0a1002",
    "expectedSavings": "37000.00"
  },
  "hasPlannedSavingsAllocation": false,
  "futureCreditPaymentCashEffects": [
    {
      "periodId": "4bc02a91-6ad8-4627-8ab9-01c3ee0a1004",
      "paymentSource": {
        "kind": "FUTURE_TRANSACTION",
        "id": "e8c54f93-3b6d-4c28-8e8b-4fcd709e4014"
      },
      "accountId": "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1001",
      "paymentAmount": "3500.00",
      "projectedLiquidCashAfterCommitments": "1650.00"
    }
  ]
}
```

Si `futureCreditPaymentCashEffects` fuese `[]`, esta fixture no debe contener
`CREDIT_PAYMENT_CASH_PRESSURE`; si `savingsComparison` fuese `null`, tampoco debe
contener `PROJECTED_SAVINGS_DROP`.

### Fixture payload — `GET /api/v1/finance/periods/:periodId/summary`

Usuario A: `finance.integration@example.com` (ver `16`). Su
`FINANCE_USER_ID` se resuelve en runtime por login → `GET /api/v1/auth/me`;
el registry de `18` contiene únicamente UUID fijos de entidades Finance, nunca
UUID de usuario. El periodo foco es Marzo 2026. Los totales siguen el ledger canónico de `18`;
`expectedConsumption` = ingresos esperados − gasto esperado
(`"10000.00" − "19400.00" = "-9400.00"`).

En `categories`, Servicios tiene `expected: "10000.00"` por el plan item de
renta; Mandado, Salidas y Extras tienen `expected` igual a su fallback activo
(`"6000.00"`, `"2000.00"`, `"1400.00"`). En todas las categorías,
`remainingActual = limit − actual`; `remainingProjected` resta solo el
consumo pendiente (en los fallbacks, `max(expected − actual, 0)`), sin volver a
contar transacciones realizadas. Por eso los cuatro valores proyectados del
fixture son `"0.00"` y el total esperado sigue siendo `"19400.00"`.

```json
{
  "period": {
    "id": "4bc02a91-6ad8-4627-8ab9-01c3ee0a1003",
    "year": 2026,
    "month": 3,
    "version": 1
  },
  "summary": {
    "totals": {
      "expectedIncome": "10000.00",
      "receivedIncome": "10000.00",
      "expectedExpense": "19400.00",
      "actualExpense": "10850.00",
      "expectedSavings": "29650.00",
      "actualSavings": "39650.00",
      "expectedConsumption": "-9400.00",
      "cashRemaining": "750.00",
      "creditUsed": "3500.00",
      "creditAvailable": "46500.00",
      "projectedCreditAvailable": "46500.00",
      "klarBalance": "12000.00"
    },
    "accounts": [
      {
        "accountId": "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1001",
        "openingBalance": "36000.00",
        "closingBalance": "38900.00",
        "entries": "10000.00",
        "exits": "7100.00"
      },
      {
        "accountId": "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1002",
        "openingBalance": "1000.00",
        "closingBalance": "750.00",
        "entries": "6250.00",
        "exits": "6500.00"
      },
      {
        "accountId": "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1003",
        "openingBalance": "0.00",
        "closingBalance": "0.00",
        "entries": "0.00",
        "exits": "0.00",
        "debt": "3500.00",
        "creditAvailable": "46500.00",
        "creditLimit": "50000.00"
      },
      {
        "accountId": "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1004",
        "openingBalance": "12000.00",
        "closingBalance": "12000.00",
        "entries": "0.00",
        "exits": "0.00"
      }
    ],
    "categories": [
      {
        "categoryGroup": "MONTHLY_SERVICES",
        "limit": "10350.00",
        "expected": "10000.00",
        "actual": "350.00",
        "remainingActual": "10000.00",
        "remainingProjected": "0.00"
      },
      {
        "categoryGroup": "GROCERIES",
        "limit": "6000.00",
        "expected": "6000.00",
        "actual": "6000.00",
        "remainingActual": "0.00",
        "remainingProjected": "0.00"
      },
      {
        "categoryGroup": "OUTINGS",
        "limit": "2000.00",
        "expected": "2000.00",
        "actual": "500.00",
        "remainingActual": "1500.00",
        "remainingProjected": "0.00"
      },
      {
        "categoryGroup": "EXTRAS",
        "limit": "1400.00",
        "expected": "1400.00",
        "actual": "500.00",
        "remainingActual": "900.00",
        "remainingProjected": "0.00"
      }
    ],
    "cashWithdrawal": {
      "withdrawnAmount": "6250.00",
      "mandadoOutingsActualFromCash": "6500.00",
      "status": "INSUFFICIENT"
    },
    "breakdowns": {
      "expectedIncomePlanItems": ["d0bf673e-d70c-4a8d-9ed2-7418f2073003"],
      "receivedIncomeTransactions": ["e8c54f93-3b6d-4c28-8e8b-4fcd709e4005"],
      "expectedExpensePlanItems": ["d0bf673e-d70c-4a8d-9ed2-7418f2073004"],
      "actualExpenseTransactions": [
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4006",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4007",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4008",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4009",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4010",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4011",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4012"
      ],
      "budgetIds": [
        "7ac0a3f5-3c1e-4d93-8d1f-7c5d18a65001",
        "7ac0a3f5-3c1e-4d93-8d1f-7c5d18a65002",
        "7ac0a3f5-3c1e-4d93-8d1f-7c5d18a65003",
        "7ac0a3f5-3c1e-4d93-8d1f-7c5d18a65004"
      ],
      "budgetRemainingActualByCategory": [
        "7ac0a3f5-3c1e-4d93-8d1f-7c5d18a65001",
        "7ac0a3f5-3c1e-4d93-8d1f-7c5d18a65002",
        "7ac0a3f5-3c1e-4d93-8d1f-7c5d18a65003",
        "7ac0a3f5-3c1e-4d93-8d1f-7c5d18a65004"
      ],
      "budgetRemainingProjectedByCategory": [
        "7ac0a3f5-3c1e-4d93-8d1f-7c5d18a65001",
        "7ac0a3f5-3c1e-4d93-8d1f-7c5d18a65002",
        "7ac0a3f5-3c1e-4d93-8d1f-7c5d18a65003",
        "7ac0a3f5-3c1e-4d93-8d1f-7c5d18a65004"
      ],
      "accountOpeningBalanceAccountIds": [
        "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1001",
        "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1002",
        "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1003",
        "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1004"
      ],
      "accountEntryTransactions": [
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4005",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4013"
      ],
      "accountExitTransactions": [
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4006",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4007",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4008",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4009",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4010",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4011",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4013"
      ],
      "accountClosingBalanceAccountIds": [
        "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1001",
        "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1002",
        "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1003",
        "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1004"
      ],
      "creditPurchaseTransactions": ["e8c54f93-3b6d-4c28-8e8b-4fcd709e4012"],
      "creditPaymentTransactions": [],
      "cashWithdrawalTransactions": ["e8c54f93-3b6d-4c28-8e8b-4fcd709e4013"],
      "cashExpenseTransactions": [
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4007",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4008",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4009",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4010"
      ],
      "klarBalanceAccountIds": ["7f5c8b0d-771c-4d4c-8cbd-7e7f318f1004"],
      "klarDepositTransactions": [],
      "klarWithdrawalTransactions": [],
      "expectedSavingsAccountIds": [
        "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1001",
        "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1002"
      ],
      "actualSavingsAccountIds": [
        "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1001",
        "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1002"
      ],
      "plannedPlanItems": ["d0bf673e-d70c-4a8d-9ed2-7418f2073004"],
      "realizedPlanItems": ["d0bf673e-d70c-4a8d-9ed2-7418f2073003"],
      "realizedTransactions": [
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4005",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4006",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4007",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4008",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4009",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4010",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4011",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4012",
        "e8c54f93-3b6d-4c28-8e8b-4fcd709e4013"
      ]
    }
  },
  "suggestions": [
    {
      "code": "CASH_WITHDRAWAL_INSUFFICIENT",
      "message": "El retiro de $6,250.00 no cubre $6,500.00 de Mandado y Salidas pagados en Efectivo; faltan $250.00.",
      "source": {
        "periodId": "4bc02a91-6ad8-4627-8ab9-01c3ee0a1003",
        "categoryGroup": "GROCERIES",
        "accountId": "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1002"
      },
      "severity": "WARNING"
    },
    {
      "code": "CATEGORY_NEAR_LIMIT",
      "message": "Mandado alcanzó $6,000.00 de su límite de $6,000.00.",
      "source": {
        "periodId": "4bc02a91-6ad8-4627-8ab9-01c3ee0a1003",
        "categoryGroup": "GROCERIES"
      },
      "severity": "WARNING"
    },
    {
      "code": "PROJECTED_SAVINGS_DROP",
      "message": "El ahorro esperado de Marzo ($29,650.00) bajó $7,350.00 frente a Febrero.",
      "source": {
        "periodId": "4bc02a91-6ad8-4627-8ab9-01c3ee0a1003"
      },
      "severity": "WARNING"
    },
    {
      "code": "CREDIT_PAYMENT_CASH_PRESSURE",
      "message": "El pago de tarjeta de Abril y los compromisos ya planeados dejan $1,650.00 de efectivo esperado.",
      "source": {
        "periodId": "4bc02a91-6ad8-4627-8ab9-01c3ee0a1004",
        "accountId": "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1001"
      },
      "severity": "WARNING"
    },
    {
      "code": "UNALLOCATED_CASH",
      "message": "Marzo proyecta $29,650.00 de efectivo líquido sin depósito a Klar planificado.",
      "source": {
        "periodId": "4bc02a91-6ad8-4627-8ab9-01c3ee0a1003",
        "accountId": "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1001"
      },
      "severity": "INFO"
    }
  ]
}
```

### Fixture — `GET /api/v1/finance/accounts?periodId=4bc02a91-6ad8-4627-8ab9-01c3ee0a1003&includeBalances=true`

```json
{
  "periodId": "4bc02a91-6ad8-4627-8ab9-01c3ee0a1003",
  "accounts": [
    {
      "id": "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1001",
      "name": "Débito Principal",
      "type": "DEBIT",
      "status": "ACTIVE",
      "initialBalance": "20000.00",
      "creditLimit": null,
      "openingDebt": null,
      "statementDay": null,
      "paymentDay": null,
      "includeInProjections": true,
      "startsOn": "2026-01-01",
      "derivedBalance": "38900.00"
    },
    {
      "id": "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1002",
      "name": "Efectivo",
      "type": "CASH",
      "status": "ACTIVE",
      "initialBalance": "1000.00",
      "creditLimit": null,
      "openingDebt": null,
      "statementDay": null,
      "paymentDay": null,
      "includeInProjections": true,
      "startsOn": "2026-01-01",
      "derivedBalance": "750.00"
    },
    {
      "id": "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1003",
      "name": "Tarjeta",
      "type": "CREDIT",
      "status": "ACTIVE",
      "initialBalance": "0.00",
      "creditLimit": "50000.00",
      "openingDebt": "0.00",
      "statementDay": null,
      "paymentDay": null,
      "includeInProjections": true,
      "startsOn": "2026-01-01",
      "derivedDebt": "3500.00",
      "derivedCreditAvailable": "46500.00"
    },
    {
      "id": "7f5c8b0d-771c-4d4c-8cbd-7e7f318f1004",
      "name": "Klar",
      "type": "SAVINGS",
      "status": "ACTIVE",
      "initialBalance": "12000.00",
      "creditLimit": null,
      "openingDebt": null,
      "statementDay": null,
      "paymentDay": null,
      "includeInProjections": true,
      "startsOn": "2026-01-01",
      "derivedBalance": "12000.00"
    }
  ]
}
```

### Hooks TanStack Query (contrato)

```typescript
// repos/finance-app/src/hooks/useFinanceSummary.ts
export function useFinanceSummary(periodId: string | undefined) {
  return useQuery({
    queryKey: financeKeys.summary(periodId!),
    queryFn: ({ signal }) => getPeriodSummary(periodId!, signal),
    enabled: !!periodId,
    staleTime: 30_000,
  });
}

// repos/finance-app/src/hooks/useFinancePeriods.ts — timeline dashboard
export function useFinancePeriods(filters?: PeriodListFilters) {
  return useQuery({
    queryKey: financeKeys.periods(filters),
    queryFn: ({ signal }) => listPeriods(filters, signal),
  });
}
```

**AbortSignal:** pasar `signal` del `queryFn` a `http.request` para cancelar al cambiar periodo en selector (`11`).

### Validación respuesta

- Schemas Zod en `finance-schemas.ts` reflejan DTOs de `09`
  (`moneySchema`, `signedMoneySchema`, `calendarDateSchema`).
- `periodSummaryTotalsSchema` aplica `moneySchema` a ingresos/gastos/saldos no
  negativos y `signedMoneySchema` a `expectedSavings`, `actualSavings`,
  `expectedConsumption`, `remainingActual` y `remainingProjected`.
- `periodSummarySchema.breakdowns` usa `periodSummaryBreakdownsSchema`: objeto
  `.strict()` con exactamente las 23 claves de `PeriodSummaryBreakdownKey` de
  `08`, cada una `string[]` validada con `uuidV4Schema`.
- En dev: `parse` estricto; log `ZodError` sin montos en consola (redactar).
- El fixture JSON de summary anterior se valida completo con
  `periodSummaryResponseSchema.parse(fixture)` en CI; los tests también
  rechazan una clave omitida, una clave extra y un ID que no sea UUID v4.

### Utilidad `repos/finance-app/src/utils/money.ts`

```typescript
export function parseMoney(value: string): bigint; // o decimal lib — no Number()
export function formatMoneyMx(value: string): string; // es-MX MXN, tabular nums en UI
export function assertMoneyString(value: unknown): asserts value is string;
```

**Prohibido:** `parseFloat` para persistir o sumar; solo presentación puede usar `Intl.NumberFormat`.

## Tareas

1. Definir `repos/finance-app/src/api/finance-types.ts` espejo de DTOs `09`
   (`PeriodDto`, `TransactionDto`, `PeriodSummary`, `Suggestion`, enums) y
   `PeriodSummaryBreakdownKey` con los 23 literales exactos de `08`.
2. Implementar `repos/finance-app/src/api/finance-schemas.ts` con Zod para respuestas de lectura principales,
   incluyendo `periodSummaryBreakdownsSchema` como
   `z.object(periodSummaryBreakdownShape).strict()`
   con exactamente todas las `PeriodSummaryBreakdownKey` de `08`, cada valor
   `z.array(uuidV4Schema)`, y las dos variantes de cuentas documentadas en `09`.
3. Implementar wrappers GET en `repos/finance-app/src/api/finance.ts`:
   `listPeriods`, `getPeriod`, `getPeriodSummary`, `listAccounts`,
   `listTransactions`, `listPlanItems`, `listBudgets`; `listAccounts` debe
   serializar `periodId=<UUID>&includeBalances=true` solo en su variante con
   balances.
4. Centralizar `repos/finance-app/src/api/query-keys.ts` y exportar factory
   helpers para invalidación.
5. Implementar hooks query con `enabled`, `staleTime`, `signal`.
6. Implementar `repos/finance-app/src/utils/money.ts` y usarlo en formateo UI
   (`10` tabular nums).
7. Configurar `QueryClientProvider` en `repos/finance-app/src/App.tsx` con
   defaults (`retry: 1` solo errores red, no 4xx).
8. Tests: `periodSummaryResponseSchema` acepta el fixture summary completo y
   rechaza `"1234.5"` (un decimal), `"1234.567"`, amount numérico JSON, montos
   negativos en campos `moneySchema`, una breakdown key faltante, una extra o un
   ID que no sea UUID v4.
9. Tests de `listAccounts`: acepta solo UUID v4 canónico, rechaza UUID v1,
   `period_id`/`withBalances` y keys extra antes de construir la URL, y serializa
   `includeBalances: true` únicamente como `includeBalances=true`.

## Criterios de aceptación

1. **CA-01** Todos los montos en tipos TS del cliente son `string`.
2. **CA-02** `getPeriodSummary` valida respuesta con Zod antes de retornar.
3. **CA-03** Cambiar `periodId` en selector aborta request anterior (`AbortSignal`).
4. **CA-04** Query keys siguen estructura documentada; no strings ad hoc en componentes.
5. **CA-05** `useFinanceSummary` expone `isLoading`, `isError`, `error: ApiError | null`, `data`.
6. **CA-06** El fixture summary JSON completo parsea sin error contra
   `periodSummaryResponseSchema`, incluido `summary.breakdowns` y totales del
   ledger canónico Marzo (`expectedExpense: "19400.00"`,
   `expectedConsumption: "-9400.00"`).
7. **CA-07** Error 404 periodo ajeno → `ApiError` code `NOT_FOUND`; hook en `isError`.
8. **CA-08** Invalidación helper `invalidatePeriod(periodId)` invalida summary, transactions, planItems, budgets.
9. **CA-09** `financeKeys` serializa filters estables (objeto ordenado o primitivos).
10. **CA-10** Cliente nunca envía `userId` en body/query finance.
11. **CA-11** `listAccounts({ periodId: "4bc02a91-6ad8-4627-8ab9-01c3ee0a1003", includeBalances: true })`
    solicita exactamente `/api/v1/finance/accounts?periodId=4bc02a91-6ad8-4627-8ab9-01c3ee0a1003&includeBalances=true`.
12. **CA-12** El schema del summary usa
    `z.object(periodSummaryBreakdownShape).strict()` y exige
    exactamente cada `PeriodSummaryBreakdownKey` de `08`, con `string[]` de UUID
    v4 por valor; no usa `z.record` abierto. La fixture declara arrays vacíos
    para pago de crédito y movimientos Klar de Marzo.
13. **CA-13** La fixture solo muestra `CREDIT_PAYMENT_CASH_PRESSURE` porque su
    `SuggestionContext` aporta el pago futuro y efectivo posterior de Abril; con
    `futureCreditPaymentCashEffects: []` el schema/test espera que no exista.
14. **CA-14** `listAccounts` aplica el contrato estricto de `09`: valida UUID v4
    canónico, `status` enum y la relación `periodId`/`includeBalances`; aliases
    o parámetros extra fallan antes de hacer la petición.
15. **CA-15** `moneySchema` y `signedMoneySchema` son espejo de `09`; la fixture
    summary usa `expectedConsumption: "-9400.00"`, permite signo únicamente en
    derivados y rechaza JSON numérico o strings de entrada sin exactamente dos
    decimales.
16. **CA-16** La fixture de categorías de Marzo usa Servicios
    `expected: "10000.00"` por plan, Mandado/Salidas/Extras por fallback activo,
    `remainingActual = limit − actual`, `remainingProjected` sin doble conteo,
    `expectedExpense: "19400.00"` y `expectedConsumption: "-9400.00"`.
17. **CA-17** Una respuesta o query inválida de Zod se expone como
    `ApiError` `422 VALIDATION_ERROR`; un error inesperado conserva
    `INTERNAL_SERVER_ERROR`.

## Verificación

```powershell
Set-Location repos/finance-app
npm test -- src/test/api/finance-schemas.test.ts src/test/api/finance-client.test.ts
npm run typecheck
```

**Manual (requiere API + seed `18`):**

1. Autenticado, abrir dashboard → Network muestra `GET /api/v1/finance/periods` y `GET /api/v1/finance/periods/4bc02a91-6ad8-4627-8ab9-01c3ee0a1003/summary`.
2. Cambiar mes rápido en selector → requests canceladas (status canceled en DevTools).
3. Respuesta API con `"amount": 100` (number) → Zod falla en dev con error claro.

## Impacto y riesgos

| Riesgo | Mitigación |
|--------|------------|
| Drift schema API vs cliente | Tests contrato JSON; coordinar despliegue |
| Sobre-invalidación | Helpers granulares; visibilidad no toca summary |
| Number en JSON rompe precisión | Zod rechaza; documentar en `09` |
| Cache stale tras mutación | Política invalidación (`19` confirma) |
| Query key con objeto inline | Factory con params primitivos |
