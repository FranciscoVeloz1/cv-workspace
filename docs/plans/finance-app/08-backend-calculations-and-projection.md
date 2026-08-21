# Cálculos financieros y proyección

**Tipo:** Backend
**Depende de:** [`07-backend-finance-module.md`](07-backend-finance-module.md), [`01-functional-domain-and-rules.md`](01-functional-domain-and-rules.md)–[`05-functional-credit-and-savings.md`](05-functional-credit-and-savings.md), [`docs/architecture/finance-app/architecture.md`](../../architecture/finance-app/architecture.md)
**Implementa:** Funciones puras en `finance.calculations.ts` y `finance.projection.ts` para saldos, deuda, crédito disponible, gastos, ahorro, simulación, propagación cronológica y detección de conflictos de concurrencia.
**No incluye:** Persistencia Prisma (repository), rutas HTTP, contratos Zod completos (`09`), fixtures, UI, commits.

## Resultado

El backend calcula todos los derivados (saldos, totales, proyección, sugerencias) en funciones puras testeables sin I/O. `finance.service.ts` carga datos vía repository, invoca cálculos/proyección y persiste solo cambios confirmados. Las reglas implementan specs funcionales `01`–`05` y PRD §10 sin doble conteo de crédito, retiro ni transferencias internas.

## Contratos de entrada y salida

### Principios

1. **Sin I/O:** `calculations` y `projection` no importan Prisma, Express ni `Date` con zona horaria implícita.
2. **Decimal:** usar `Decimal` de `@prisma/client/runtime/library` o wrapper interno; prohibido `number` para acumular dinero.
3. **Fechas:** strings `YYYY-MM-DD`; periodo de pertenencia derivado de `(year, month)` vs `occurredOn`/`expectedDate`.
4. **Visibilidad:** `isHidden` es preferencia de presentación; **nunca** excluye filas de cálculos ni totales. Los resúmenes aplican reglas de estado (`PLANNED`, `REALIZED`, `CANCELLED`) según `01` con independencia de `isHidden`; ocultar solo afecta listados con `includeHidden=false`.
5. **Estados:** `PLANNED` → esperado; `REALIZED` → real; `CANCELLED` → excluido de totales.

### Tipos de dominio (entrada a funciones puras)

Tipos exportados desde `finance.calculations.ts` (snapshots de entrada y agregados). Tipos de proyección/concurrencia en `finance.projection.ts`. **No** crear `finance.types.ts` — la arquitectura concentra cálculo en esos dos archivos.

```typescript
import { Decimal } from '@prisma/client/runtime/library';

export type FinanceAccountSnapshot = {
  id: string;
  type: 'DEBIT' | 'CASH' | 'CREDIT' | 'SAVINGS' | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE';
  initialBalance: Decimal;
  creditLimit: Decimal | null;
  openingDebt: Decimal | null;
  includeInProjections: boolean;
  startsOn: string; // YYYY-MM-DD en boundary de funciones puras
};

export type FinancePlanItemSnapshot = {
  id: string;
  periodId: string;
  categoryId: string;
  categoryGroup: string;
  accountId: string;
  counterpartyAccountId: string | null;
  expectedDate: string;
  plannedAmount: Decimal;
  realizedAmount: Decimal | null;
  status: 'PLANNED' | 'REALIZED' | 'CANCELLED';
  /**
   * Semántica normalizada por el service para cálculo; no es un campo wire ni
   * obliga a añadir una columna Prisma. Distingue una compra de crédito de su
   * pago y evita inferir gasto por `categoryGroup` solamente.
   */
  expectedKind:
    | 'INCOME'
    | 'EXPENSE'
    | 'TRANSFER'
    | 'CREDIT_PURCHASE'
    | 'CREDIT_PAYMENT'
    | 'SAVINGS_DEPOSIT'
    | 'SAVINGS_WITHDRAWAL';
  recurringRuleId: string | null;
  isHidden?: boolean; // ignorado por cálculos; solo metadata de origen
};

export type FinanceTransactionSnapshot = {
  id: string;
  periodId: string;
  type:
    | 'INCOME'
    | 'EXPENSE'
    | 'TRANSFER'
    | 'CREDIT_PURCHASE'
    | 'CREDIT_PAYMENT'
    | 'SAVINGS_DEPOSIT'
    | 'SAVINGS_WITHDRAWAL';
  accountId: string;
  counterpartyAccountId: string | null;
  categoryGroup: string | null;
  occurredOn: string;
  amount: Decimal;
  planItemId: string | null;
  isHidden?: boolean; // ignorado por cálculos; solo metadata de origen
};

export type FinancePeriodBudgetSnapshot = {
  id: string;
  categoryId: string;
  categoryGroup: string;
  limitAmount: Decimal;
  isOverride: boolean;
  /**
   * `FinancePeriodBudget` no tiene estado propio: el repository/service lo
   * deriva del join con `FinanceCategory.isActive`. Solo `true` es presupuesto
   * activo para el fallback de gasto esperado.
   */
  categoryIsActive: boolean;
};

export type RecurringRuleSnapshot = {
  id: string;
  categoryId: string;
  accountId: string | null;
  name: string;
  group: string;
  amount: Decimal;
  occurrencesPerMonth: number;
  expectedDayOfMonth: number | null;
  effectiveFromYear: number;
  effectiveFromMonth: number;
  effectiveToYear: number | null;
  effectiveToMonth: number | null;
  isActive: boolean;
};

export type PeriodCalculationInput = {
  period: { id: string; year: number; month: number; version: number };
  previousPeriodClosingBalances: Record<string, Decimal>; // accountId → saldo final mes anterior
  accounts: FinanceAccountSnapshot[];
  planItems: FinancePlanItemSnapshot[];
  transactions: FinanceTransactionSnapshot[];
  budgets: FinancePeriodBudgetSnapshot[];
};
```

### Tipos de salida

```typescript
export type AccountBalanceBreakdown = {
  accountId: string;
  openingBalance: Decimal;
  closingBalance: Decimal;
  entries: Decimal;
  exits: Decimal;
  /** Solo CREDIT */
  debt?: Decimal;
  creditAvailable?: Decimal;
  creditLimit?: Decimal;
};

export type PeriodTotals = {
  expectedIncome: Decimal;
  receivedIncome: Decimal;
  expectedExpense: Decimal;
  actualExpense: Decimal;
  expectedSavings: Decimal; // efectivo al cierre proyectado (Débito + Efectivo)
  actualSavings: Decimal;
  expectedConsumption: Decimal; // ingresos − consumos planeados incl. crédito planeado
  cashRemaining: Decimal; // saldo Efectivo al cierre
  creditUsed: Decimal;
  creditAvailable: Decimal;
  projectedCreditAvailable: Decimal;
  klarBalance: Decimal;
};

export type CategoryTotals = {
  categoryGroup: string;
  limit: Decimal;
  expected: Decimal;
  actual: Decimal;
  remainingActual: Decimal;
  remainingProjected: Decimal;
};

export type CashWithdrawalCoverage = {
  withdrawnAmount: Decimal;
  mandadoOutingsActualFromCash: Decimal;
  status: 'SUFFICIENT' | 'INSUFFICIENT' | 'EXCESS';
};

/**
 * Claves obligatorias de trazabilidad MVP #22. Los valores siempre son UUIDs de
 * entidades fuente; una clave sin fuentes debe existir con `[]`, nunca omitirse.
 */
export const PERIOD_SUMMARY_BREAKDOWN_KEYS = [
  // Ingresos y gastos
  'expectedIncomePlanItems',
  'receivedIncomeTransactions',
  'expectedExpensePlanItems',
  'actualExpenseTransactions',
  // Presupuestos y restantes por categoría
  'budgetIds',
  'budgetRemainingActualByCategory',
  'budgetRemainingProjectedByCategory',
  // Saldos y flujos de cuentas
  'accountOpeningBalanceAccountIds',
  'accountEntryTransactions',
  'accountExitTransactions',
  'accountClosingBalanceAccountIds',
  // Crédito, retiro/efectivo y Klar
  'creditPurchaseTransactions',
  'creditPaymentTransactions',
  'cashWithdrawalTransactions',
  'cashExpenseTransactions',
  'klarBalanceAccountIds',
  'klarDepositTransactions',
  'klarWithdrawalTransactions',
  // Ahorro y vínculo plan ↔ real
  'expectedSavingsAccountIds',
  'actualSavingsAccountIds',
  'plannedPlanItems',
  'realizedPlanItems',
  'realizedTransactions',
] as const;

export type PeriodSummaryBreakdownKey =
  (typeof PERIOD_SUMMARY_BREAKDOWN_KEYS)[number];

/** Cada clave obligatoria → ids de entidades de origen que componen el agregado. */
export type PeriodSummaryBreakdownIds = Record<
  PeriodSummaryBreakdownKey,
  string[]
>;

export type PeriodSummary = {
  totals: PeriodTotals;
  accounts: AccountBalanceBreakdown[];
  categories: CategoryTotals[];
  cashWithdrawal: CashWithdrawalCoverage;
  /**
   * Desglose completo de trazabilidad: `buildPeriodSummary` debe poblar cada clave
 * de `PERIOD_SUMMARY_BREAKDOWN_KEYS`, incluso cuando su valor sea `[]`. Para los
 * restantes por categoría, los IDs son los `FinancePeriodBudget.id`; su
 * `categoryGroup` resuelve la categoría correspondiente. `budgetIds` conserva
 * los presupuestos activos usados para límites y permite trazar cuáles aportaron
 * un fallback de gasto esperado sin abrir una clave de breakdown adicional.
   */
  breakdowns: PeriodSummaryBreakdownIds;
};

/** Subconjunto serializable para timeline y confirmación de propagación (09) */
export type PeriodSummaryCompact = Pick<
  PeriodTotals,
  | 'expectedIncome'
  | 'receivedIncome'
  | 'expectedExpense'
  | 'actualExpense'
  | 'expectedSavings'
  | 'actualSavings'
  | 'cashRemaining'
  | 'creditAvailable'
  | 'projectedCreditAvailable'
>;

export type ProjectionDiff = {
  periodId: string;
  year: number;
  month: number;
  deltaExpectedExpense: Decimal;
  deltaActualExpense: Decimal;
  deltaExpectedSavings: Decimal;
  accountDeltas: Record<string, { opening: Decimal; closing: Decimal }>;
  deltaDebt: Decimal;
  deltaCreditAvailable: Decimal;
};

export type ProjectionPreviewResult = {
  originPeriodId: string;
  affectedPeriodIds: string[];
  diffs: ProjectionDiff[];
  warnings: string[];
};

export type PropagationConfirmInput = {
  originPeriodId: string;
  expectedPeriodVersion: number;
  changes: PropagationChange[];
  replaceOverrides?: boolean;
};

export type PropagationChange =
  | {
      kind: 'UPDATE_RECURRING_RULE';
      ruleId: string;
      patch: { amount?: Decimal; occurrencesPerMonth?: number };
      scope: 'FUTURE';
    }
  | { kind: 'UPDATE_BUDGET'; categoryGroup: string; limitAmount: Decimal; scope: 'THIS_PERIOD' | 'FUTURE' }
  | {
      kind: 'UPDATE_PLAN_ITEM';
      planItemId: string;
      patch: {
        categoryId?: string;
        accountId?: string;
        counterpartyAccountId?: string | null;
        concept?: string;
        expectedDate?: string;
        plannedAmount?: Decimal;
        realizedAmount?: Decimal | null;
        status?: 'PLANNED' | 'REALIZED' | 'CANCELLED';
        notes?: string | null;
      };
    }
  | {
      kind: 'UPDATE_TRANSACTION';
      transactionId: string;
      patch: {
        accountId?: string;
        counterpartyAccountId?: string | null;
        categoryId?: string | null;
        occurredOn?: string;
        amount?: Decimal;
        concept?: string;
        notes?: string | null;
        planItemId?: string | null;
      };
    };

export const SUGGESTION_CODES = [
  'CASH_WITHDRAWAL_INSUFFICIENT',
  'CATEGORY_NEAR_LIMIT',
  'PROJECTED_SAVINGS_DROP',
  'CREDIT_PAYMENT_CASH_PRESSURE',
  'UNALLOCATED_CASH',
] as const;

export type SuggestionCode = (typeof SUGGESTION_CODES)[number];

export type Suggestion = {
  code: SuggestionCode;
  message: string;
  source: { periodId?: string; categoryGroup?: string; accountId?: string };
  severity: 'INFO' | 'WARNING';
};

/**
 * Valores explícitos para que el motor no dependa de env, reloj, DB ni defaults
 * implícitos. El caller puede sobrescribirlos en tests/previews, pero siempre
 * debe pasar el objeto completo.
 */
export type SuggestionThresholds = {
  cashWithdrawalShortfall: Decimal;
  categoryNearLimitRatio: Decimal;
  projectedSavingsDrop: Decimal;
  creditPaymentCashLiquidityFloor: Decimal;
  unallocatedCash: Decimal;
};

export const DEFAULT_SUGGESTION_THRESHOLDS: SuggestionThresholds = {
  cashWithdrawalShortfall: new Decimal('0.01'),
  categoryNearLimitRatio: new Decimal('0.90'),
  projectedSavingsDrop: new Decimal('1000.00'),
  creditPaymentCashLiquidityFloor: new Decimal('2000.00'),
  unallocatedCash: new Decimal('5000.00'),
};

export type SavingsComparison = {
  kind: 'PREVIOUS_PERIOD' | 'PREVIEW_BASELINE';
  periodId: string;
  expectedSavings: Decimal;
};

/**
 * Efecto ya calculado de un pago de crédito planeado o de un periodo futuro.
 * `projectedLiquidCashAfterCommitments` ya descuenta el pago y los compromisos
 * de efectivo del periodo; por eso basta para decidir presión sin I/O adicional.
 */
export type FutureCreditPaymentCashEffect = {
  periodId: string;
  paymentSource: {
    kind: 'PLAN_ITEM' | 'FUTURE_TRANSACTION';
    id: string;
  };
  accountId: string;
  paymentAmount: Decimal;
  projectedLiquidCashAfterCommitments: Decimal;
};

export type SuggestionContext = {
  /** Periodo al que se asocian sugerencias derivadas de `current`. */
  periodId: string;
  cashAccountId: string | null;
  liquidCashAccountId: string | null;
  thresholds: SuggestionThresholds;
  /** `null` significa que no hay comparación verificable; no se infiere una. */
  savingsComparison: SavingsComparison | null;
  hasPlannedSavingsAllocation: boolean;
  /** Vacío significa que no hay pago futuro/planeado del que derivar presión. */
  futureCreditPaymentCashEffects: FutureCreditPaymentCashEffect[];
};
```

`PropagationChange`, `ProjectionPreviewResult`, `PropagationConfirmInput` y funciones de concurrencia se exportan desde `finance.projection.ts`. `Suggestion` y agregados de periodo desde `finance.calculations.ts`.

`PropagationChange` es el tipo interno ya mapeado a `Decimal`. El request JSON
usa strings decimales y se valida con el `propagationChangeSchema` discriminado
y estricto de `09`: cada variante rechaza claves desconocidas, exige al menos
un campo en `patch` y no permite `id`, `periodId` ni `userId` dentro del patch.

### Catálogo mínimo de sugerencias, contexto y determinismo

`buildSuggestions` solo emite los cinco códigos de `SuggestionCode`. El mensaje puede
incluir montos y nombres de la entidad fuente, pero el código es estable para cliente,
tests y telemetría. El servicio calcula `SuggestionContext` a partir de snapshots ya
cargados; la función no consulta DB, reloj, entorno ni estado global.

Los defaults normativos son: faltante de retiro `0.01`, cercanía a límite `0.90`,
caída de ahorro `1000.00`, piso de liquidez para pago de crédito `2000.00` y efectivo
sin asignar `5000.00`. Los tests pueden usar otros valores, siempre explícitos en
`context.thresholds`.

| Código | Datos requeridos en `SuggestionContext` | Trigger exacto |
|--------|------------------------------------------|----------------|
| `CASH_WITHDRAWAL_INSUFFICIENT` | `periodId`, `cashAccountId`, `thresholds.cashWithdrawalShortfall` | `cashWithdrawal.status === 'INSUFFICIENT'` y `mandadoOutingsActualFromCash - withdrawnAmount >= cashWithdrawalShortfall`. |
| `CATEGORY_NEAR_LIMIT` | `thresholds.categoryNearLimitRatio` | Entre categorías con `limit > 0`, elegir la de mayor `max(actual, expected) / limit`; emitir si su razón es `>= categoryNearLimitRatio`. Empate: `categoryGroup` ascendente. |
| `PROJECTED_SAVINGS_DROP` | `savingsComparison`, `thresholds.projectedSavingsDrop` | Solo si hay comparación explícita: `comparison.expectedSavings - current.totals.expectedSavings >= projectedSavingsDrop`. `PREVIEW_BASELINE` o `PREVIOUS_PERIOD` ya viene elegido por el caller; no hay fallback implícito. |
| `CREDIT_PAYMENT_CASH_PRESSURE` | `futureCreditPaymentCashEffects`, `thresholds.creditPaymentCashLiquidityFloor` | Considerar solo efectos con `paymentAmount > 0` y `projectedLiquidCashAfterCommitments < creditPaymentCashLiquidityFloor`; elegir el menor efectivo, luego `periodId` y `paymentSource.id` ascendentes. Sin efectos, no emitir. |
| `UNALLOCATED_CASH` | `hasPlannedSavingsAllocation`, `liquidCashAccountId`, `thresholds.unallocatedCash` | `current.totals.expectedSavings >= unallocatedCash` y no existe una asignación explícita planeada a ahorro. |

La salida se ordena por el orden de `SUGGESTION_CODES`; las reglas de desempate de la
tabla evitan que el orden de arrays de entrada cambie el resultado. Así, misma
`PeriodSummary` + mismo `SuggestionContext` producen la misma lista y los mismos
mensajes. En especial, jamás se afirma `CREDIT_PAYMENT_CASH_PRESSURE` sin un elemento
verificable en `futureCreditPaymentCashEffects`.

---

## `finance.calculations.ts` — interfaces de funciones puras

### Saldos de cuentas no crediticias

```typescript
/** saldo inicial + entradas − salidas (PRD §10.1, spec 01) */
export function computeNonCreditClosingBalance(
  openingBalance: Decimal,
  transactions: FinanceTransactionSnapshot[],
  accountId: string,
): Decimal;

/** Clasifica movimiento como entrada (+) o salida (−) para la cuenta */
export function classifyAccountFlow(
  tx: FinanceTransactionSnapshot,
  accountId: string,
): Decimal | null; // null si no afecta la cuenta
```

Reglas `classifyAccountFlow`:

| type | accountId = principal | Efecto |
|------|----------------------|--------|
| INCOME | destino | +amount |
| EXPENSE | origen | −amount |
| TRANSFER | origen | −amount |
| TRANSFER | contraparte | +amount |
| CREDIT_PURCHASE | tarjeta | no cambia saldo cash; deuda aparte |
| CREDIT_PAYMENT | origen | −amount |
| CREDIT_PAYMENT | tarjeta (contraparte) | −deuda |
| SAVINGS_DEPOSIT | origen | −amount |
| SAVINGS_DEPOSIT | Klar | +amount |
| SAVINGS_WITHDRAWAL | Klar | −amount |
| SAVINGS_WITHDRAWAL | destino | +amount |

### Deuda y crédito

```typescript
/** openingDebt + compras realizadas − pagos realizados (spec 05) */
export function computeCreditDebt(
  account: FinanceAccountSnapshot,
  transactions: FinanceTransactionSnapshot[],
): Decimal;

/** creditLimit − deuda (PRD §10.2) */
export function computeCreditAvailable(
  creditLimit: Decimal,
  debt: Decimal,
): Decimal;

/** límite − deuda − sum(compras planeadas no realizadas) */
export function computeProjectedCreditAvailable(
  creditLimit: Decimal,
  debt: Decimal,
  plannedCreditPurchases: Decimal,
): Decimal;
```

### Gasto esperado y real

```typescript
/**
 * Gasto esperado con fuentes explícitas (PRD §10.3).
 *
 * Los ítems materializados, activos (`status === 'PLANNED'`) y aplicables de
 * tipo `EXPENSE` o `CREDIT_PURCHASE` se suman una vez. Cada uno cubre el
 * presupuesto activo de la misma `categoryId`, por lo que ese límite no se suma
 * de nuevo. Un presupuesto activo sin ítem aplicable aporta `limitAmount` como
 * fallback una sola vez por `FinancePeriodBudget.id`.
 *
 * `transactions` se usa para excluir defensivamente un ítem que ya tenga una
 * transacción vinculada: el lado realizado se procesa en `computeActualExpense`
 * y nunca duplica el esperado. Nunca se infiere gasto esperado desde una
 * transacción suelta.
 */
export function computeExpectedExpense(
  planItems: FinancePlanItemSnapshot[],
  budgets: FinancePeriodBudgetSnapshot[],
  transactions: FinanceTransactionSnapshot[],
): Decimal;

/** EXPENSE + CREDIT_PURCHASE realizados; excluye TRANSFER, CREDIT_PAYMENT (PRD §10.4) */
export function computeActualExpense(
  transactions: FinanceTransactionSnapshot[],
): Decimal;

export function computeExpectedIncome(planItems: FinancePlanItemSnapshot[], transactions: FinanceTransactionSnapshot[]): Decimal;
export function computeReceivedIncome(transactions: FinanceTransactionSnapshot[]): Decimal;
```

Regla exacta de `computeExpectedExpense`:

1. Formar el conjunto de `planItemId` ya vinculado por `transactions`; un ítem
   con vínculo no puede contarse como planeado pendiente aunque un snapshot
   inconsistente lo marque `PLANNED`.
2. Sumar cada plan item con `status === 'PLANNED'`, sin vínculo realizado y
   `expectedKind` `EXPENSE` o `CREDIT_PURCHASE`.
3. Para cada presupuesto con `categoryIsActive === true`, agregar su
   `limitAmount` una sola vez **solo** si no existe un plan item elegible con su
   misma `categoryId`. La unicidad `(periodId, categoryId)` es invariante de DB;
   el helper además deduplica defensivamente por `budget.id`.
4. Excluir siempre `TRANSFER`, `CREDIT_PAYMENT`, `SAVINGS_DEPOSIT` y
   `SAVINGS_WITHDRAWAL`, tanto si provienen de plan items como de transacciones;
   `INCOME` tampoco es gasto.

Los presupuestos de fallback son una métrica de gasto esperado, no transacciones
sintéticas ni flujos de cuenta: no inventan movimientos para
`computeExpectedSavings`. El service debe cargar y pasar explícitamente los
tres arrays; no puede decir que incluye presupuestos sin recibir `budgets`.

Exclusiones explícitas de gasto esperado:

- `CANCELLED`
- Plan items con transacción ya vinculada
- `TRANSFER` (incl. retiro $6,250)
- `CREDIT_PAYMENT`, `SAVINGS_DEPOSIT`, `SAVINGS_WITHDRAWAL`
- Depósitos entre cuentas propias

### Presupuesto restante

```typescript
/** límite − gasto realizado categoría (PRD §10.5) */
export function computeRemainingBudgetActual(
  limit: Decimal,
  actual: Decimal,
): Decimal;

/** límite − gasto real − planeados pendientes */
export function computeRemainingBudgetProjected(
  limit: Decimal,
  actual: Decimal,
  plannedPending: Decimal,
): Decimal;

export function computeCategoryTotals(
  categoryGroup: string,
  budgets: FinancePeriodBudgetSnapshot[],
  planItems: FinancePlanItemSnapshot[],
  transactions: FinanceTransactionSnapshot[],
): CategoryTotals;
```

`remainingActual = limit − actual`. Para `remainingProjected`,
`plannedPending` solo contiene consumo que todavía no está en `actual`: un plan
item pendiente se resta por su importe y un fallback de presupuesto aporta
únicamente `max(expected − actual, 0)`, no el límite completo cuando ya existen
realizados. Así una categoría con fallback activo no cuenta dos veces sus
transacciones; el ledger canónico de Marzo queda con
`remainingProjected = 0.00` en Mandado, Salidas y Extras.

### Ahorro

```typescript
/**
 * Efectivo esperado al cierre en cuentas DEBIT + CASH (PRD §10.6, spec 05).
 * Cifra principal de ahorro esperado.
 */
export function computeExpectedSavings(input: PeriodCalculationInput): Decimal;

/** Ahorro real con realizados (PRD §10.7) */
export function computeActualSavings(input: PeriodCalculationInput): Decimal;

/**
 * Ingresos esperados − `computeExpectedExpense(
 * input.planItems, input.budgets, input.transactions
 * )`, incluidos los fallbacks de presupuesto aplicables.
 */
export function computeExpectedConsumption(input: PeriodCalculationInput): Decimal;
```

Reglas ahorro:

- Compra crédito cuenta **una vez** como consumo en su mes.
- Pago en mes posterior afecta efectivo de ese mes, no re-suma consumo.
- Transferencias internas no duplican gasto/ingreso.
- Deuda mostrada **aparte** del ahorro esperado.

### Efectivo y retiro

```typescript
/** Saldo Efectivo al cierre (spec 01, 04) */
export function computeCashRemaining(
  cashAccountId: string,
  input: PeriodCalculationInput,
): Decimal;

/** Comparación retiro base vs gasto Mandado+Salidas pagado desde Efectivo */
export function computeCashWithdrawalCoverage(
  input: PeriodCalculationInput,
  cashAccountId: string,
): CashWithdrawalCoverage;
```

### Klar

```typescript
export function computeKlarBalance(
  savingsAccount: FinanceAccountSnapshot,
  transactions: FinanceTransactionSnapshot[],
): Decimal;
```

### Resumen agregado

```typescript
export function buildPeriodSummary(input: PeriodCalculationInput): PeriodSummary;
```

`buildPeriodSummary` llama explícitamente
`computeExpectedExpense(input.planItems, input.budgets, input.transactions)` y
propaga los `budgetIds` de los presupuestos activos al breakdown estricto. No
puede sustituir `budgets` por defaults implícitos.

### Sugerencias (derivadas puras)

```typescript
export function buildSuggestions(
  current: PeriodSummary,
  context: SuggestionContext,
): Suggestion[];
```

Triggers alineados con PRD §9.15 / spec `05`; el catálogo anterior es el mínimo
normativo del MVP y puede ampliarse solo añadiendo un literal a
`SUGGESTION_CODES`, sus datos requeridos y su trigger documentado.

---

## `finance.projection.ts` — simulación y propagación

### Simulación (previsualización sin persistir)

```typescript
export type SimulationPatch = {
  /** Copia inmutable del estado actual + overrides locales */
  applyTo: PeriodCalculationInput[];
  changes: PropagationChange[];
};

/**
 * Aplica changes en memoria sobre copia de periodos >= origen;
 * recalcula cadena saldo final → saldo inicial siguiente (spec 02 CA-08).
 */
export function simulateProjection(patch: SimulationPatch): ProjectionPreviewResult;
```

Salida incluye (spec `02` previsualización):

- Periodo origen y periodos afectados
- Δ gasto esperado, Δ gasto real (si aplica), Δ saldos, Δ ahorro, Δ deuda/crédito

### Propagación cronológica

```typescript
/**
 * Ordena periodos por (year, month) asc;
 * para cada periodo P: opening[P,a] = closing[P-1,a] para cuentas no crédito.
 */
export function propagateOpeningBalances(
  periods: PeriodCalculationInput[],
): PeriodCalculationInput[];

/**
 * Regenera planItems desde recurring rules vigentes para periodos >= origen,
 * respetando overrides (isOverride=true) salvo flag replaceOverrides.
 */
export function regeneratePlanItemsFromRules(
  originPeriodId: string,
  periods: PeriodCalculationInput[],
  rules: RecurringRuleSnapshot[],
  options: { replaceOverrides: boolean },
): FinancePlanItemSnapshot[][];
```

Reglas propagación (spec `02`):

- Afecta origen + futuros confirmados; anteriores intactos.
- Fechas históricas conservadas en periodos no regenerados.
- Overrides puntuales preservados salvo confirmación `replaceOverrides`.

### Concurrencia

```typescript
/**
 * Compara expectedPeriodVersion con period.version actual.
 * @throws FinanceConflictError lógico si mismatch (mapeado a 409 en service).
 */
export function assertPeriodVersion(
  expectedPeriodVersion: number,
  actualVersion: number,
): void;

export type ConcurrencyConflict = {
  periodId: string;
  expectedPeriodVersion: number;
  actualVersion: number;
};

export function detectVersionConflict(
  expectedPeriodVersions: Record<string, number>,
  actualPeriods: Array<{ id: string; version: number }>,
): ConcurrencyConflict | null;
```

Flujo confirmación (`07` service):

1. `detectVersionConflict` → 409 si falla.
2. `simulateProjection` para validar impacto.
3. `prisma.$transaction`: aplicar cambios, `version: { increment: 1 }`, regenerar ítems, recalcular snapshots.
4. Rollback completo si cualquier paso falla.

### Determinismo

```typescript
/** Misma entrada → mismo PeriodSummary (spec 02 CA-10) */
export function assertDeterministicSummary(
  input: PeriodCalculationInput,
  iterations: number,
): boolean; // test helper
```

## Tareas

1. Definir tipos snapshot y agregados en `finance.calculations.ts`; tipos de proyección/concurrencia en `finance.projection.ts` (reexportar `PropagationChange`, `ProjectionPreviewResult` desde `finance.projection.ts` si el service los importa desde un solo lugar).
2. Implementar `classifyAccountFlow` y tests unitarios por tipo de transacción.
3. Implementar `computeNonCreditClosingBalance`, `computeCreditDebt`, `computeCreditAvailable`.
4. Implementar `computeExpectedExpense(planItems, budgets, transactions)`:
   sumar plan items `PLANNED` aplicables una vez, usar `limitAmount` de un
   presupuesto activo solo como fallback sin plan item de la misma categoría y
   excluir transferencias, pagos y ahorro; implementar `computeActualExpense`.
5. Implementar `computeExpectedSavings`, `computeActualSavings`, `computeCashRemaining`, `computeCashWithdrawalCoverage`.
6. Implementar `buildPeriodSummary` componiendo funciones anteriores + `breakdowns` con ids.
7. Implementar `buildSuggestions(current, context)` con los cinco triggers, defaults
   explícitos, selección/desempates deterministas y sin inferir presión de crédito
   cuando `futureCreditPaymentCashEffects` esté vacío.
8. Implementar `simulateProjection` y `propagateOpeningBalances` en `finance.projection.ts`.
9. Implementar `regeneratePlanItemsFromRules` con respeto a overrides.
10. Implementar `assertPeriodVersion` / `detectVersionConflict`.
11. Conectar en `finance.service.ts`: `getPeriodSummary`, `previewProjection`, `confirmPropagation`.
12. Tests unitarios exhaustivos en `tests/unit/finance.calculations.test.ts` y `tests/unit/finance.projection.test.ts`.

## Criterios de aceptación

1. **CA-01** Ningún archivo en `calculations`/`projection` importa Prisma o Express.
2. **CA-02** Retiro $6,250 como `TRANSFER` no incrementa `computeExpectedExpense` ni `computeActualExpense`.
3. **CA-03** Compra crédito realizada incrementa deuda y gasto real una sola vez; pago realizado no incrementa gasto real.
4. **CA-04** Compra planificada afecta `computeProjectedCreditAvailable`, no `computeCreditDebt`.
5. **CA-05** `buildPeriodSummary` separa ahorro esperado de saldo Klar y de deuda pendiente.
6. **CA-06** `computeCashWithdrawalCoverage` retorna SUFFICIENT/INSUFFICIENT/EXCESS según spec `04` CA-11.
7. **CA-07** `propagateOpeningBalances`: saldo inicial periodo N+1 = saldo final periodo N (spec `02` CA-08).
8. **CA-08** `simulateProjection` no muta inputs originales (inmutabilidad).
9. **CA-09** `detectVersionConflict` con versiones distintas produce conflicto mapeable a 409.
10. **CA-10** Escenario Marzo editado → Abril+ recalculado; Enero-Febrero unchanged en simulación.
11. **CA-11** `isHidden` no altera ningún total calculado; ocultar solo afecta presentación en listados.
12. **CA-12** `buildSuggestions` no muta datos; solo retorna mensajes informativos.
13. **CA-13** Misma `PeriodSummary` y mismo `SuggestionContext` producen la misma
    lista ordenada; un contexto sin comparación de ahorro ni efectos de pago futuro
    no emite `PROJECTED_SAVINGS_DROP` ni `CREDIT_PAYMENT_CASH_PRESSURE`.
14. **CA-14** `breakdowns` contiene exactamente todas las claves de
    `PERIOD_SUMMARY_BREAKDOWN_KEYS`, con `[]` cuando no exista fuente.
15. **CA-15** `computeExpectedExpense` recibe `planItems`, `budgets` y
    `transactions`: un ítem `PLANNED` aplicable cubre su presupuesto y se cuenta
    una vez; un presupuesto activo sin ítem aplicable aporta su límite una vez;
    transferencias, pagos y ahorro no aportan gasto esperado.

## Verificación

```powershell
Set-Location repos/personal-api
npm run build
npm test -- tests/unit/finance.calculations.test.ts tests/unit/finance.projection.test.ts
```

Casos de prueba unitarios obligatorios (archivo → describe):

| Archivo | Escenario |
|---------|-----------|
| `finance.calculations.test.ts` | `TRANSFER` retiro 6250 no es gasto |
| `finance.calculations.test.ts` | Compra crédito realizada + pago mes siguiente: gasto solo en M |
| `finance.calculations.test.ts` | `CREDIT_PAYMENT` desde Klar reduce deuda y Klar, no gasto |
| `finance.calculations.test.ts` | Planeado vs realizado vs cancelado en totales |
| `finance.calculations.test.ts` | Tres plan items Mandado de $2,000 + presupuesto activo $6,000 → gasto esperado $6,000 una vez, no $12,000 |
| `finance.calculations.test.ts` | Presupuesto activo Extras $1,400 sin plan item aplicable → fallback $1,400 una vez; duplicado de snapshot no lo duplica |
| `finance.calculations.test.ts` | Plan/transaction `TRANSFER`, `CREDIT_PAYMENT` y `SAVINGS_*` → $0 de gasto esperado |
| `finance.calculations.test.ts` | Ledger canónico Marzo: renta planeada $10,000 + fallbacks Mandado/Salidas/Extras = `$19,400.00` esperado |
| `finance.calculations.test.ts` | Categorías Marzo: Servicios `expected=10000.00`, Mandado/Salidas/Extras por fallback; `remainingActual = limit − actual` y `remainingProjected` sin doble conteo |
| `finance.calculations.test.ts` | `computeRemainingBudgetActual` vs projected con planeados pendientes |
| `finance.calculations.test.ts` | Ahorro esperado = efectivo Débito+Efectivo al cierre |
| `finance.calculations.test.ts` | `buildSuggestions` con `SuggestionContext` completo: cinco triggers, umbrales y desempates repetibles |
| `finance.calculations.test.ts` | Contexto sin `futureCreditPaymentCashEffects` no inventa presión de pago futuro |
| `finance.calculations.test.ts` | `breakdowns` materializa cada `PeriodSummaryBreakdownKey`, incluso con arrays vacíos |
| `finance.projection.test.ts` | Cadena saldos Mar→Apr tras editar movimiento Mar |
| `finance.projection.test.ts` | Override preservado cuando `replaceOverrides: false` |
| `finance.projection.test.ts` | `detectVersionConflict` version 1 vs 2 |
| `finance.projection.test.ts` | Determinismo: doble `buildPeriodSummary` igual |

| ID | Comprobación |
|----|--------------|
| V-01 | `rg "from '@prisma/client'" src/modules/finance/finance.calculations.ts` → solo `Decimal` import |
| V-02 | `rg "number" src/modules/finance/finance.calculations.ts` en acumulaciones de dinero → cero |
| V-03 | Cobertura mínima 90% líneas en calculations+projection (vitest coverage) |
| V-04 | Sin placeholders |

## Impacto y riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Doble conteo crédito/pago | Totales incorrectos | Tests CA-03; tabla de clasificación |
| Retiro como gasto | Inflación gasto esperado | Test dedicado CA-02 |
| Fallback de presupuesto doble contado | Gasto esperado inflado | Firma recibe `budgets`; ítem aplicable cubre categoría y fallback se deduplica por `budget.id` |
| Propagación muta historial | Pérdida confianza | Inmutabilidad CA-08; solo futuros |
| number en acumulaciones | Redondeo | Decimal obligatorio |
| Override borrado silencioso | Pérdida excepciones | `replaceOverrides` explícito |
| Sugerencias mutan datos | Violación PRD | CA-12; solo lectura |

**Dependientes:** Integración `19` (mutaciones y proyección), `20` (anti doble conteo crédito/Klar).
