# Base de datos y migraciones Finance

**Tipo:** Backend  
**Depende de:** [`01-functional-domain-and-rules.md`](01-functional-domain-and-rules.md), [`02-functional-months-and-projections.md`](02-functional-months-and-projections.md), [`03-functional-accounts-and-movements.md`](03-functional-accounts-and-movements.md), [`04-functional-budgets-and-recurring.md`](04-functional-budgets-and-recurring.md), [`05-functional-credit-and-savings.md`](05-functional-credit-and-savings.md), [`docs/architecture/finance-app/sql-tables.md`](../../architecture/finance-app/sql-tables.md), [`docs/architecture/finance-app/architecture.md`](../../architecture/finance-app/architecture.md)  
**Implementa:** Cambios Prisma/PostgreSQL en `repos/personal-api`: enums `Finance*`, modelos `Finance*`, relaciones con `User`, migración append-only, limpieza de tests y contrato de tipos para capas superiores.  
**No incluye:** Rutas HTTP, servicios de dominio, cálculos, seeds ejecutados en runtime (`07`), contratos Zod de API (`09`), fixtures de integración con payloads concretos, UI, commits.

## Resultado

`personal-api` dispone de un schema Prisma completo y migrado para el dominio financiero: siete modelos `Finance*`, cinco enums, importes `Decimal(14,2)`, fechas calendario como `DateTime @db.Date` (PostgreSQL `DATE`), índices y constraints alineados con [`sql-tables.md`](../../architecture/finance-app/sql-tables.md). La migración es append-only; los tests de integración limpian tablas `Finance*` en orden seguro. Los defaults de negocio (Mandado, Salidas, Extras, retiro $6,250) **no** van en SQL global: se documenta el contrato para sembrado por usuario en `finance.defaults.ts` (`07`).

## Contratos de entrada y salida

### Entradas (implementación)

| Entrada | Origen | Uso |
|---------|--------|-----|
| Modelo relacional aprobado | `sql-tables.md` | Fuente de verdad de columnas, enums, FKs |
| Convenciones Prisma existentes | `repos/personal-api/prisma/schema.prisma` | PascalCase modelos, camelCase columnas, UUID, cascade desde `User` |
| Orden de migración | `sql-tables.md` §10 | Secuencia de creación de tablas y FKs cruzadas |

### Salidas (artefactos)

| Artefacto | Ruta |
|-----------|------|
| Schema Prisma extendido | `repos/personal-api/prisma/schema.prisma` |
| Migración SQL | `repos/personal-api/prisma/migrations/<timestamp>_add_finance_tables/migration.sql` |
| Limpieza de tests | `repos/personal-api/tests/helpers/setup.ts` |
| Smoke test de schema | `repos/personal-api/tests/integration/finance-schema.test.ts` |

### Enums Prisma (nombres exactos)

```prisma
enum FinanceAccountType {
  DEBIT
  CASH
  CREDIT
  SAVINGS
  OTHER
}

enum FinanceAccountStatus {
  ACTIVE
  INACTIVE
}

enum FinanceCategoryGroup {
  MONTHLY_SERVICES
  GROCERIES
  OUTINGS
  EXTRAS
  INCOME
  TRANSFER
  CREDIT
  SAVINGS
  OTHER
}

enum FinancePlanItemStatus {
  PLANNED
  REALIZED
  CANCELLED
}

enum FinanceTransactionType {
  INCOME
  EXPENSE
  TRANSFER
  CREDIT_PURCHASE
  CREDIT_PAYMENT
  SAVINGS_DEPOSIT
  SAVINGS_WITHDRAWAL
}
```

### Modelos Prisma (contrato esquemático)

Extender `User`:

```prisma
model User {
  // ... existente ...
  financeAccounts       FinanceAccount[]
  financePeriods        FinancePeriod[]
  financeCategories     FinanceCategory[]
  financeRecurringRules FinanceRecurringRule[]
  financePeriodBudgets  FinancePeriodBudget[]
  financePlanItems      FinancePlanItem[]
  financeTransactions   FinanceTransaction[]
}
```

```prisma
model FinanceAccount {
  id                   String               @id @default(uuid())
  userId               String
  name                 String
  type                 FinanceAccountType
  status               FinanceAccountStatus @default(ACTIVE)
  initialBalance       Decimal              @db.Decimal(14, 2)
  creditLimit          Decimal?             @db.Decimal(14, 2)
  openingDebt          Decimal?             @db.Decimal(14, 2)
  statementDay         Int?
  paymentDay           Int?
  includeInProjections Boolean              @default(true)
  startsOn             DateTime             @db.Date
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt

  user                         User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  recurringRules               FinanceRecurringRule[]
  planItems                    FinancePlanItem[]      @relation("PlanItemAccount")
  counterpartyPlanItems        FinancePlanItem[]      @relation("PlanItemCounterparty")
  transactions                 FinanceTransaction[]   @relation("TransactionAccount")
  counterpartyTransactions     FinanceTransaction[]   @relation("TransactionCounterparty")

  @@index([userId, status])
  @@index([userId, type])
  // UNIQUE parcial (userId, name) WHERE status='ACTIVE' — ver migration.sql; no equivalente a @@unique([userId, name, status])
}

model FinancePeriod {
  id        String   @id @default(uuid())
  userId    String
  year      Int
  month     Int
  label     String?
  notes     String?
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user         User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  budgets      FinancePeriodBudget[]
  planItems    FinancePlanItem[]
  transactions FinanceTransaction[]

  @@unique([userId, year, month])
  @@index([userId, year, month])
}

model FinanceCategory {
  id              String               @id @default(uuid())
  userId          String
  group           FinanceCategoryGroup
  name            String
  isSystemDefault Boolean              @default(false)
  isActive        Boolean              @default(true)
  sortOrder       Int                  @default(0)
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt

  user            User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  recurringRules  FinanceRecurringRule[]
  periodBudgets   FinancePeriodBudget[]
  planItems       FinancePlanItem[]
  transactions    FinanceTransaction[]

  @@unique([userId, group, name])
  @@index([userId, isActive, sortOrder])
}

model FinanceRecurringRule {
  id                  String               @id @default(uuid())
  userId              String
  categoryId          String
  accountId           String?
  name                String
  group               FinanceCategoryGroup
  amount              Decimal              @db.Decimal(14, 2)
  occurrencesPerMonth Int                  @default(1)
  expectedDayOfMonth  Int?
  effectiveFromYear   Int
  effectiveFromMonth  Int
  effectiveToYear     Int?
  effectiveToMonth    Int?
  isActive            Boolean              @default(true)
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt

  user          User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  category      FinanceCategory       @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  account       FinanceAccount?       @relation(fields: [accountId], references: [id], onDelete: Restrict)
  periodBudgets FinancePeriodBudget[]
  planItems     FinancePlanItem[]

  @@index([userId, isActive])
  @@index([userId, effectiveFromYear, effectiveFromMonth])
  @@index([categoryId])
  @@index([accountId])
}

model FinancePeriodBudget {
  id              String   @id @default(uuid())
  userId          String
  periodId        String
  categoryId      String
  recurringRuleId String?
  limitAmount     Decimal  @db.Decimal(14, 2)
  isOverride      Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user          User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  period        FinancePeriod         @relation(fields: [periodId], references: [id], onDelete: Cascade)
  category      FinanceCategory       @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  recurringRule FinanceRecurringRule? @relation(fields: [recurringRuleId], references: [id], onDelete: SetNull)

  @@unique([periodId, categoryId])
  @@index([userId, periodId])
  @@index([recurringRuleId])
}

model FinancePlanItem {
  id                    String                @id @default(uuid())
  userId                String
  periodId              String
  categoryId            String
  accountId             String
  counterpartyAccountId String?
  recurringRuleId       String?
  concept               String
  expectedDate          DateTime              @db.Date
  plannedAmount         Decimal               @db.Decimal(14, 2)
  realizedAmount        Decimal?              @db.Decimal(14, 2)
  status                FinancePlanItemStatus @default(PLANNED)
  notes                 String?
  isHidden              Boolean               @default(false)
  transactionId         String?               @unique
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt

  user                User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  period              FinancePeriod         @relation(fields: [periodId], references: [id], onDelete: Cascade)
  category            FinanceCategory       @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  account             FinanceAccount        @relation("PlanItemAccount", fields: [accountId], references: [id], onDelete: Restrict)
  counterpartyAccount FinanceAccount?       @relation("PlanItemCounterparty", fields: [counterpartyAccountId], references: [id], onDelete: Restrict)
  recurringRule       FinanceRecurringRule? @relation(fields: [recurringRuleId], references: [id], onDelete: SetNull)
  transaction         FinanceTransaction?   @relation("PlanItemRealization", fields: [transactionId], references: [id], onDelete: SetNull)

  @@index([userId, periodId, status])
  @@index([userId, expectedDate])
  @@index([recurringRuleId])
  @@index([categoryId])
  @@index([accountId])
}

model FinanceTransaction {
  id                    String                 @id @default(uuid())
  userId                String
  periodId              String
  type                  FinanceTransactionType
  accountId             String
  counterpartyAccountId String?
  categoryId            String?
  planItemId            String?
  transferGroupId       String?
  occurredOn            DateTime               @db.Date
  amount                Decimal                @db.Decimal(14, 2)
  concept               String
  notes                 String?
  isHidden              Boolean                @default(false)
  createdAt             DateTime               @default(now())
  updatedAt             DateTime               @updatedAt

  user                User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  period              FinancePeriod     @relation(fields: [periodId], references: [id], onDelete: Cascade)
  account             FinanceAccount    @relation("TransactionAccount", fields: [accountId], references: [id], onDelete: Restrict)
  counterpartyAccount FinanceAccount?   @relation("TransactionCounterparty", fields: [counterpartyAccountId], references: [id], onDelete: Restrict)
  category            FinanceCategory?  @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  planItem            FinancePlanItem?       @relation("PlanItemRealization")

  @@index([userId, occurredOn])
  @@index([userId, periodId])
  @@index([userId, accountId, occurredOn])
  @@index([transferGroupId])
  @@index([planItemId])
  @@index([type])
}
```

### Constraints SQL (migration.sql)

Implementar vía `CHECK` en PostgreSQL además de validación de servicio. Índices parciales y FKs cruzadas que Prisma no emite se añaden manualmente:

```sql
-- Nombre activo único por usuario (no equivalente a @@unique([userId, name, status]))
CREATE UNIQUE INDEX "FinanceAccount_userId_name_active_key"
  ON "FinanceAccount" ("userId", "name")
  WHERE "status" = 'ACTIVE';

-- FK espejo PlanItem ↔ Transaction (dirección autoritativa: PlanItem.transactionId)
ALTER TABLE "FinanceTransaction"
  ADD CONSTRAINT "FinanceTransaction_planItemId_fkey"
  FOREIGN KEY ("planItemId") REFERENCES "FinancePlanItem"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
```

| Constraint | Regla |
|------------|-------|
| `FinanceAccount_creditLimit_nonneg` | `creditLimit IS NULL OR creditLimit >= 0` |
| `FinanceAccount_openingDebt_nonneg` | `openingDebt IS NULL OR openingDebt >= 0` |
| `FinanceAccount_credit_requires_limit` | `type <> 'CREDIT' OR creditLimit IS NOT NULL` |
| `FinancePeriod_month_range` | `month BETWEEN 1 AND 12` |
| `FinancePeriod_year_min` | `year >= 2000` |
| `FinanceRecurringRule_amount_nonneg` | `amount >= 0` |
| `FinanceRecurringRule_occurrences_min` | `occurrencesPerMonth >= 1` |
| `FinanceRecurringRule_from_month` | `effectiveFromMonth BETWEEN 1 AND 12` |
| `FinanceRecurringRule_to_month` | `effectiveToMonth IS NULL OR effectiveToMonth BETWEEN 1 AND 12` |
| `FinancePeriodBudget_limit_nonneg` | `limitAmount >= 0` |
| `FinancePlanItem_planned_nonneg` | `plannedAmount >= 0` |
| `FinancePlanItem_realized_nonneg` | `realizedAmount IS NULL OR realizedAmount >= 0` |
| `FinancePlanItem_realized_requires_amount` | `status <> 'REALIZED' OR realizedAmount IS NOT NULL` |
| `FinancePlanItem_planned_no_tx` | `status <> 'PLANNED' OR transactionId IS NULL` |
| `FinanceTransaction_amount_nonneg` | `amount >= 0` |
| `FinanceTransaction_counterparty_required` | tipos `TRANSFER`, `CREDIT_PAYMENT`, `SAVINGS_DEPOSIT`, `SAVINGS_WITHDRAWAL` ⇒ `counterpartyAccountId IS NOT NULL` |
| `FinanceTransaction_distinct_accounts` | `counterpartyAccountId IS NULL OR accountId <> counterpartyAccountId` |

**Ownership cross-FK:** no hay constraint DB entre `userId` de tablas relacionadas; el servicio (`07`) valida coherencia. Opcional: triggers futuros fuera de MVP.

**Relación PlanItem ↔ Transaction:**

| Aspecto | Regla |
|---------|-------|
| Dirección autoritativa | `FinancePlanItem.transactionId` → `FinanceTransaction.id` (`@unique`; Prisma `@relation("PlanItemRealization", fields: [transactionId], ...)`) |
| Inverso espejo | `FinanceTransaction.planItemId` → `FinancePlanItem.id` (FK manual en `migration.sql`; back-relation Prisma `planItem` sin `fields`) |
| Sincronización | Servicio escribe `transactionId` y `planItemId` en la misma transacción DB; nunca dos transacciones para un ítem |
| `isHidden` | Preferencia de vista; **no** excluye filas de cálculos (`01`, `08`) |

**Prohibido:** `Float` / `Double` para columnas monetarias.

### Fechas

- Columnas financieras calendario (`startsOn`, `expectedDate`, `occurredOn`): `DateTime @db.Date` en Prisma → PostgreSQL `DATE`.
- Boundary HTTP (schemas Zod en `07`/`09`): string `YYYY-MM-DD`; repository convierte string ↔ `Date` sin zona horaria.
- `createdAt` / `updatedAt`: `DateTime` TIMESTAMPTZ (auditoría).
- **Prohibido:** `String` como tipo Prisma para fechas de dominio.

### Seeds por usuario (contrato, no migración)

Los montos base del PRD se siembran en runtime vía `finance.defaults.ts` (`07`), **por `userId`**, al crear el primer periodo o onboarding financiero:

| Elemento | Valor base | Mecanismo |
|----------|------------|-----------|
| Mandado | 3 × $2,000 → límite $6,000 | `FinanceRecurringRule` + `FinancePlanItem` × 3 |
| Salidas | 4 × $500 → límite $2,000 | idem × 4 |
| Extras | límite $1,400 | `FinancePeriodBudget` |
| Retiro efectivo | $6,250 Débito → Efectivo | regla + ítem `TRANSFER` planeado |
| Categorías base | Servicios, Mandado, Salidas, Extras, Transferencias, Crédito, Ahorro, Ingreso | `FinanceCategory` `isSystemDefault: true` |

La migración **no** inserta montos personales ni filas por usuario.

## Tareas

1. **Auditar schema existente:** leer `repos/personal-api/prisma/schema.prisma`; confirmar relación `User` y ausencia previa de modelos `Finance*`.
2. **Añadir enums** en el orden listado arriba.
3. **Añadir modelos** respetando orden de dependencias: `FinanceAccount`, `FinancePeriod`, `FinanceCategory` → `FinanceRecurringRule`, `FinancePeriodBudget` → `FinancePlanItem`, `FinanceTransaction`.
4. **Generar migración:** `npx prisma migrate dev --name add_finance_tables --create-only`; revisar SQL; añadir `CHECK` constraints, índice UNIQUE parcial de nombre activo y FK `planItemId` manualmente si Prisma no los emite.
5. **Relación PlanItem ↔ Transaction:** dirección autoritativa `FinancePlanItem.transactionId` UNIQUE con `@relation("PlanItemRealization", fields: [transactionId], references: [id])`; `FinanceTransaction.planItemId` es FK espejo en `migration.sql`; servicio mantiene ambos campos en la misma transacción DB (`07`).
6. **Actualizar `tests/helpers/setup.ts`:** función `cleanupFinanceTables(prisma)` con orden:
   1. `financeTransaction`
   2. `financePlanItem`
   3. `financePeriodBudget`
   4. `financeRecurringRule`
   5. `financeCategory`
   6. `financePeriod`
   7. `financeAccount`
   Invocar en `beforeEach` de tests de integración finance **después** de limpiar módulos existentes (fitness, groceries) según dependencias del setup actual.
7. **Crear smoke test** `tests/integration/finance-schema.test.ts`:
   - Crear usuario de prueba.
   - Insertar cuenta `DEBIT`, periodo `{ year: 2026, month: 3 }`, categoría `GROCERIES`, ítem planeado y transacción `EXPENSE` con `Decimal`.
   - Verificar UNIQUE `(userId, year, month)` rechaza duplicado.
   - Verificar UNIQUE parcial nombre activo: dos cuentas `ACTIVE` mismo `(userId, name)` → `P2002`; una `INACTIVE` + una `ACTIVE` mismo nombre → permitido.
   - Verificar cascade: borrar `User` elimina filas `Finance*`.
8. **Documentar en comentario de migración** que producción usa `npm run db:migrate:deploy`; prohibido `db:push` como sustituto.

## Criterios de aceptación

1. **CA-01** Existen los siete modelos `Finance*` y cinco enums con nombres y columnas alineados a `sql-tables.md`.
2. **CA-02** Todo importe monetario usa `Decimal @db.Decimal(14, 2)`; ningún campo finance usa `Float`.
3. **CA-03** Fechas de dominio (`startsOn`, `expectedDate`, `occurredOn`) son `DateTime @db.Date`; timestamps de auditoría son `DateTime`.
4. **CA-04** `User` tiene relaciones inversas a todas las entidades finance con `onDelete: Cascade`.
5. **CA-05** UNIQUE `(userId, year, month)` en `FinancePeriod` y `(periodId, categoryId)` en `FinancePeriodBudget`.
6. **CA-06** CHECK constraints de montos ≥ 0, mes 1–12, crédito requiere `creditLimit`, contraparte obligatoria en tipos de transferencia/pago/ahorro.
7. **CA-07** Migración bajo `prisma/migrations/` es append-only; nombre cronológico tipo `20260813120000_add_finance_tables`.
8. **CA-08** `setup.ts` limpia tablas finance en orden hijos → padres sin violar FKs.
9. **CA-09** Smoke test pasa insertando y consultando `Decimal` y fechas `@db.Date` (wire/API como `YYYY-MM-DD` vía repository).
10. **CA-10** La migración no contiene INSERT de datos por usuario ni montos MVP (Mandado, retiro, etc.).

## Verificación

Ejecutar desde `repos/personal-api`:

```bash
npm run db:migrate
npm run build
npm run lint
npm test -- tests/integration/finance-schema.test.ts
```

| ID | Comprobación |
|----|--------------|
| V-01 | `rg "Float" prisma/schema.prisma` en modelos `Finance*` → cero coincidencias en campos monetarios |
| V-02 | `npx prisma validate` exitoso |
| V-03 | Migración aplicada en DB de dev; `\d "FinanceAccount"` (psql) muestra `numeric(14,2)` |
| V-04 | Test de UNIQUE periodo duplicado falla con error Prisma `P2002` |
| V-05 | `cleanupFinanceTables` invocado dos veces seguidas no lanza error |
| V-06 | Borrar usuario en test elimina todas sus filas `Finance*` |
| V-07 | Documento no contiene `TBD`, `TODO`, `por definir` |

## Impacto y riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Float heredado de otros módulos | Error de redondeo en dinero | Prohibición explícita; revisión en PR |
| FK cruzada PlanItem/Transaction | Migración circular | Crear tablas; FK autoritativa vía `transactionId`; FK espejo `planItemId` en SQL; servicio sincroniza |
| UNIQUE nombre cuenta | Bloqueo al reactivar nombre histórico | Índice UNIQUE parcial `(userId, name) WHERE status='ACTIVE'` + validación servicio |
| CHECK no generados por Prisma | Reglas solo en app | SQL manual en migration.sql |
| Limpieza tests en orden incorrecto | FK violations en CI | Orden documentado; test de cleanup |
| Seeds en migración global | Datos cruzados entre usuarios | Seeds solo en `finance.defaults.ts` por userId |

**Desbloquea:** [`07-backend-finance-module.md`](07-backend-finance-module.md).
