# Integración — Crédito, Klar, retiro y sugerencias

**Tipo:** Integration  
**Depende de:** [`04-functional-budgets-and-recurring.md`](04-functional-budgets-and-recurring.md), [`05-functional-credit-and-savings.md`](05-functional-credit-and-savings.md), [`08-backend-calculations-and-projection.md`](08-backend-calculations-and-projection.md), [`17-integration-finance-api-client-and-cache.md`](17-integration-finance-api-client-and-cache.md), [`18-integration-dashboard-tracer-bullet.md`](18-integration-dashboard-tracer-bullet.md), [`19-integration-mutations-and-projection.md`](19-integration-mutations-and-projection.md)  
**Implementa:** Compra crédito, pago desde Débito/Klar, depósitos/retiros Klar, retiro de efectivo $6,250 y sugerencias; mutaciones anti doble conteo en una fixture aislada y lectura de sugerencias/breakdowns del ledger canónico de `18`.  
**No incluye:** Runbook E2E completo (`21`), commits.

## Resultado

Los flujos de crédito, fondo Klar y retiro de efectivo funcionan integrados en
detalle de mes y dashboard sin doble conteo: compra cuenta una vez como gasto;
pago no re-suma; transferencias Débito ↔ Klar y retiro a Efectivo no son
gastos; las sugerencias son informativas y no mutan datos. Las mutaciones se
ejecutan en un usuario/ledger aislado, por lo que jamás vuelven a publicar los
movimientos canónicos Marzo/Abril del tracer de `18`.

## Contratos de entrada y salida

### Fixture aislada de mutación — usuario de crédito

Los `POST` de este spec no usan el usuario A, los periodos ni las transacciones
del tracer de `18`. El fixture propio se provisiona por admin, sin campo `id`,
y resuelve el UUID real antes de crear sus filas Finance:

| Variable | Valor / origen |
|----------|----------------|
| `FINANCE_CREDIT_USER_EMAIL` | `finance.credit.integration@example.com` |
| `FINANCE_CREDIT_USER_PASSWORD` | `FinanceCreditTest1!` |
| `FINANCE_CREDIT_USER_ID` | UUID runtime `$creditMe.user.id` tras login → `GET /api/v1/auth/me` |

El contrato se verifica antes de implementar la fixture en
`repos/personal-api/src/modules/users/users.schemas.ts` y
`repos/personal-api/README.md`: `createUserSchema` usa el body
`{ email, name, password, role }` y `GET /api/v1/auth/me` responde
`{ user: { id, email, name, role } }`. `role` está al nivel superior del objeto
anidado `user`; no usar `permissions` ni `applicationSlug`, contratos
eliminados de v1. Login retorna `{ user: { id, email, name }, accessToken,
refreshToken }`; refresh retorna solo tokens.

```powershell
# Requiere $adminLogin.accessToken. El payload usa role top-level y jamás id.
$env:FINANCE_CREDIT_USER_EMAIL = 'finance.credit.integration@example.com'
$env:FINANCE_CREDIT_USER_PASSWORD = 'FinanceCreditTest1!'
$creditFixtureUser = @{
  email = $env:FINANCE_CREDIT_USER_EMAIL
  password = $env:FINANCE_CREDIT_USER_PASSWORD
  name = 'Finance Credit Integration User'
  role = 'READ_ONLY'
}
$creditProvisionBody = $creditFixtureUser | ConvertTo-Json -Compress
$status = (curl.exe -s -o NUL -w '%{http_code}' -X POST http://localhost:3000/api/v1/users `
  -H "Authorization: Bearer $($adminLogin.accessToken)" `
  -H 'Content-Type: application/json' `
  -d $creditProvisionBody).Trim()
if ($status -notin @('200', '201', '409')) {
  throw "No se pudo provisionar $($creditFixtureUser.email): HTTP $status"
}

# Un 409 puede pertenecer a un usuario ajeno. No se reutiliza ni limpia hasta
# verificar identidad completa y que la contraseña fija autentique el usuario.
$creditLoginBody = @{
  email = $creditFixtureUser.email
  password = $creditFixtureUser.password
} | ConvertTo-Json -Compress
$creditLogin = curl.exe -s -X POST http://localhost:3000/api/v1/auth/login `
  -H 'Content-Type: application/json' `
  -d $creditLoginBody | ConvertFrom-Json
if (
  [string]::IsNullOrWhiteSpace($creditLogin.accessToken) -or
  [string]::IsNullOrWhiteSpace($creditLogin.refreshToken) -or
  $null -eq $creditLogin.user -or
  [string]::IsNullOrWhiteSpace($creditLogin.user.id) -or
  $creditLogin.user.email -cne $creditFixtureUser.email -or
  $creditLogin.user.name -cne $creditFixtureUser.name
) {
  throw 'La contraseña fija de la fixture no autenticó al usuario existente; no se reutiliza ni elimina.'
}

$creditMe = curl.exe -s http://localhost:3000/api/v1/auth/me `
  -H "Authorization: Bearer $($creditLogin.accessToken)" | ConvertFrom-Json
$hasFixtureIdentity = (
  $null -ne $creditMe.user -and
  -not [string]::IsNullOrWhiteSpace($creditMe.user.id) -and
  $creditMe.user.email -ceq $creditFixtureUser.email -and
  $creditMe.user.name -ceq $creditFixtureUser.name
)
$hasTopLevelReadOnlyRole = (
  $null -ne $creditMe.user -and
  $creditMe.user.PSObject.Properties.Name -contains 'role' -and
  $creditMe.user.role -ceq 'READ_ONLY'
)
if (-not $hasFixtureIdentity -or -not $hasTopLevelReadOnlyRole) {
  throw 'El usuario existente no coincide exactamente con la fixture READ_ONLY; abortar sin reutilizar, limpiar Finance ni eliminar el usuario.'
}

# Solo después de esta verificación, incluido un 409, puede reutilizarse la fixture.
$env:FINANCE_CREDIT_USER_ID = $creditMe.user.id
```

#### Precondición, base y cleanup

1. Solo después de que la verificación anterior haya pasado —también cuando el
   provisioning devolvió `409`—, antes de **cada** prueba de mutación limpiar
   solo las filas `Finance*` cuyo owner sea `FINANCE_CREDIT_USER_ID`, en el
   orden de `sql-tables.md` §11. Si `$creditMe.user.id/email/name/role` o login
   con la contraseña fija no coinciden, abortar antes de este paso: no
   reutilizar, limpiar ni borrar el usuario existente. Nunca tocar A/B o el
   ledger de `18`.
2. Reinsertar únicamente la base fija inferior (periodos, cuentas y categorías)
   mediante helper de test/Prisma, usando el `userId` runtime de crédito. No
   sembrar transacciones de compra, pago, depósito, retiro Klar ni retiro de
   efectivo.
3. Ejecutar los `POST` de esta sección una vez por caso y guardar los UUID como
   `response.transaction.id`. `09`/`19` no aceptan `id` en el body: esos UUID
   de transacción son runtime y no aliases del registry.
4. Ejecutar el mismo cleanup en `afterEach` y ofrecer el script npm planned
   `db:clean-finance-credit-fixture` para la limpieza manual. El clean del
   tracer (`18`) no cubre esta fixture aislada.

| Entidad base aislada | UUID v4 fijo | Valor |
|----------------------|--------------|-------|
| Periodo compra Marzo 2027 | `4f0cf8b1-024a-4a62-8fbe-2d0e5a2f2001` | Periodo de compra/retiro efectivo |
| Periodo pago Abril 2027 | `4f0cf8b1-024a-4a62-8fbe-2d0e5a2f2002` | Periodo de pago/Klar |
| Cuenta Débito | `e50f35bb-e831-4b95-92ae-2c900b4d2001` | Saldo inicial `$50,000.00` |
| Cuenta Efectivo | `e50f35bb-e831-4b95-92ae-2c900b4d2002` | Saldo inicial `$0.00` |
| Cuenta Crédito | `e50f35bb-e831-4b95-92ae-2c900b4d2003` | Deuda `$0.00`; límite `$50,000.00` |
| Cuenta Klar | `e50f35bb-e831-4b95-92ae-2c900b4d2004` | Saldo inicial `$12,000.00` |
| Categoría Crédito | `7dd55b3a-0fc9-4d1a-83c4-7293f75e2001` | `CREDIT` |
| Categoría Ahorro | `7dd55b3a-0fc9-4d1a-83c4-7293f75e2002` | `SAVINGS` |
| Categoría Transferencias | `7dd55b3a-0fc9-4d1a-83c4-7293f75e2003` | `TRANSFER` |

La base aislada no sustituye ni modifica el registry de `18`: sus UUID v4
continúan siendo el ledger canónico del tracer. Esta tabla solo evita colisiones
entre pruebas de mutación de crédito y ese ledger.

### Payloads de mutación aislada

Cada `POST /api/v1/finance/periods/:periodId/transactions` de esta fixture
responde `201 { transaction: TransactionDto }` según `09`. Las pruebas leen
`response.transaction` (en particular `response.transaction.id` para
`breakdowns`); nunca tratan la respuesta como una transacción plana ni esperan
un `id` raíz. Las validaciones de cuentas, contraparte, categoría, fecha y
ownership se mantienen en el endpoint antes de devolver el wrapper.

#### Compra crédito — `POST /api/v1/finance/periods/4f0cf8b1-024a-4a62-8fbe-2d0e5a2f2001/transactions`

```json
{
  "type": "CREDIT_PURCHASE",
  "accountId": "e50f35bb-e831-4b95-92ae-2c900b4d2003",
  "categoryId": "7dd55b3a-0fc9-4d1a-83c4-7293f75e2001",
  "occurredOn": "2027-03-10",
  "amount": "3500.00",
  "concept": "Compra TDC — fixture aislada"
}
```

#### Pago tarjeta Débito — `POST /api/v1/finance/periods/4f0cf8b1-024a-4a62-8fbe-2d0e5a2f2002/transactions`

```json
{
  "type": "CREDIT_PAYMENT",
  "accountId": "e50f35bb-e831-4b95-92ae-2c900b4d2001",
  "counterpartyAccountId": "e50f35bb-e831-4b95-92ae-2c900b4d2003",
  "occurredOn": "2027-04-05",
  "amount": "3500.00",
  "concept": "Pago TDC marzo — fixture aislada"
}
```

#### Depósito Klar — `POST /api/v1/finance/periods/4f0cf8b1-024a-4a62-8fbe-2d0e5a2f2002/transactions`

```json
{
  "type": "SAVINGS_DEPOSIT",
  "accountId": "e50f35bb-e831-4b95-92ae-2c900b4d2001",
  "counterpartyAccountId": "e50f35bb-e831-4b95-92ae-2c900b4d2004",
  "occurredOn": "2027-04-10",
  "amount": "2000.00",
  "concept": "Ahorro Klar — fixture aislada"
}
```

#### Retiro Klar — `POST /api/v1/finance/periods/4f0cf8b1-024a-4a62-8fbe-2d0e5a2f2002/transactions`

```json
{
  "type": "SAVINGS_WITHDRAWAL",
  "accountId": "e50f35bb-e831-4b95-92ae-2c900b4d2004",
  "counterpartyAccountId": "e50f35bb-e831-4b95-92ae-2c900b4d2001",
  "occurredOn": "2027-04-20",
  "amount": "500.00",
  "concept": "Retiro Klar — fixture aislada"
}
```

#### Retiro efectivo combinado — `POST /api/v1/finance/periods/4f0cf8b1-024a-4a62-8fbe-2d0e5a2f2001/transactions`

```json
{
  "type": "TRANSFER",
  "accountId": "e50f35bb-e831-4b95-92ae-2c900b4d2001",
  "counterpartyAccountId": "e50f35bb-e831-4b95-92ae-2c900b4d2002",
  "occurredOn": "2027-03-01",
  "amount": "6250.00",
  "concept": "Retiro Salidas y Mandado — fixture aislada"
}
```

### Expectativas anti doble conteo — fixture aislada

| Métrica | Marzo 2027 (post compra/retiro) | Abril 2027 (post pago + Klar) |
|---------|----------------------------------|--------------------------------|
| Gasto real consumo | `$3,500.00`: una compra TDC | `$0.00`: pago, depósito y retiro no son consumo |
| Deuda TDC | `$3,500.00` | `$0.00` |
| Crédito disponible | `$46,500.00` | `$50,000.00` |
| Saldo Débito | `$43,750.00` (`$50,000 − $6,250`) | `$38,750.00` (`−$3,500 − $2,000 + $500`) |
| Saldo Klar | `$12,000.00` | `$13,500.00` (`+$2,000 − $500`) |
| Retiro $6,250.00 | No pertenece a `actualExpense`; aumenta Efectivo | — |

**Regresión explícita:** `actualExpense` de Abril no aumenta `$3,500.00` por
`CREDIT_PAYMENT`; la compra ya se contó una vez en Marzo. Las aserciones de
`breakdowns` usan los IDs devueltos por estos POST. La suite ejecuta además una
variante recién limpiada donde el pago usa Klar como `accountId`; reduce Klar y
deuda sin sumar gasto.

### Sugerencias — mismo catálogo y fixture que el summary

Esta comprobación es **solo de lectura** sobre el ledger canónico de A sembrado
por `18`: después de crear/registrar el script npm planned
`db:seed-finance-tracer`, iniciar sesión como A y
hacer el `GET` siguiente. No publica compra, pago, depósito ni retiro contra
los periodos del tracer; esas mutaciones pertenecen exclusivamente a la fixture
aislada anterior.

`GET /api/v1/finance/periods/4bc02a91-6ad8-4627-8ab9-01c3ee0a1003/summary`
devuelve los cinco códigos de `SuggestionCode` definidos en `08` y ejemplificados
en el summary completo de `17`:

| Código | Trigger exacto de fixture | Severity |
|--------|---------------------------|----------|
| `CASH_WITHDRAWAL_INSUFFICIENT` | Retiro $6,250.00 frente a Mandado + Salidas en efectivo $6,500.00; faltan $250.00 | `WARNING` |
| `CATEGORY_NEAR_LIMIT` | Mandado realizado $6,000.00 de límite $6,000.00 (>= 90%) | `WARNING` |
| `PROJECTED_SAVINGS_DROP` | Marzo esperado $29,650.00 frente a Febrero $37,000.00 | `WARNING` |
| `CREDIT_PAYMENT_CASH_PRESSURE` | Abril proyecta $1,650.00 tras pago TDC y compromisos planeados ($150.00 si se confirma `19`) | `WARNING` |
| `UNALLOCATED_CASH` | Marzo proyecta $29,650.00 líquidos y no tiene depósito a Klar planeado | `INFO` |

UI (`12`, `13`): `SuggestionList` presenta mensaje y fuente; «Entendido»
solo cierra localmente. Nunca llama a `PATCH`, `POST` ni `DELETE`.

### Artefactos SPA

| Artefacto | Ruta |
|-----------|------|
| Panel crédito detalle | `repos/finance-app/src/components/finance/CreditSection.tsx` |
| Panel Klar | `repos/finance-app/src/components/finance/KlarSection.tsx` |
| Retiro efectivo | `repos/finance-app/src/components/finance/CashWithdrawalPanel.tsx` |
| Form compra/pago | `repos/finance-app/src/components/forms/CreditTransactionForm.tsx` |
| Form Klar | `repos/finance-app/src/components/forms/SavingsTransferForm.tsx` |
| Hooks | `repos/finance-app/src/hooks/useCreditMutations.ts`, `repos/finance-app/src/hooks/useSavingsMutations.ts` |
| Fixture backend aislada | `repos/personal-api/tests/fixtures/finance-credit-klar.fixture.ts` |
| Script de limpieza aislada | `repos/personal-api/scripts/clean-finance-credit-fixture.ts` |
| Tests SPA | `repos/finance-app/src/test/integration/credit-klar-double-count.test.tsx` |
| Test backend | `repos/personal-api/tests/integration/finance-credit-klar.test.ts` |

### Roles visuales críticos (`13`)

| Flujo | Tratamiento |
|-------|-------------|
| Compra crédito | Badge crédito; deuda sube; no resta Débito |
| Pago tarjeta | `semantic-transfer`; etiqueta «Pago de deuda» |
| Depósito Klar | Transferencia; no gasto |
| Retiro efectivo | Panel `semantic-transfer`; badge cobertura `INSUFFICIENT` |
| Sugerencia | Banner informativo; dismiss local opcional, sin API |

## Tareas

1. Crear `repos/personal-api/tests/fixtures/finance-credit-klar.fixture.ts` y
   registrar `db:clean-finance-credit-fixture` para
   `repos/personal-api/scripts/clean-finance-credit-fixture.ts`: provisionar/
   reutilizar solo el usuario de crédito con payload top-level. Tras un `409`,
   exigir login con la contraseña fija y coincidencia exacta de email, name y
   `role: 'READ_ONLY'` en `$creditMe.user` de `/auth/me`; si falla, abortar sin
   limpiar ni borrar el usuario existente. Resolver su `user.id` como
   `$creditMe.user.id` por login → `/auth/me` solo después de esa verificación
   y limpiar sus `Finance*` antes/después de cada caso.
2. Sembrar únicamente periodos, cuentas y categorías base de la tabla aislada con UUID v4 fijos; nunca transacciones del ledger de `18`.
3. Implementar forms y mutaciones tipadas por `FinanceTransactionType` bajo la base `/api/v1/finance`; los cinco POST anteriores apuntan exclusivamente a los periodos aislados de 2027.
4. Validar en cliente que `counterpartyAccountId` es obligatorio según tipo (`09`).
5. Integrar secciones Crédito, Klar y Retiro en `MonthDetailPage`.
6. Mapear `SuggestionCode` del API a `SuggestionList` de dashboard y detalle; consultar el summary canónico de `18` sin mutarlo.
7. Probar backend: `actualExpense`, deuda, saldos Klar/Débito y `breakdowns`
   por los IDs runtime devueltos como `response.transaction.id` por los POST
   aislados.
8. Probar SPA: registrar pago Abril no incrementa `actualExpense` en $3,500.00 y ejecutar una variante limpia de pago desde Klar.
9. Mantener la matriz anti doble conteo y la comprobación read-only de los UUIDs/códigos canónicos de `18` como comentarios de los tests.

## Criterios de aceptación

1. **CA-01** Tras el cleanup aislado, un único `POST` de compra $3,500.00 aumenta deuda y `actualExpense` Marzo 2027 una sola vez.
2. **CA-02** El `POST` de pago $3,500.00 Abril 2027 reduce deuda a $0.00 y Débito; no incrementa `actualExpense`.
3. **CA-03** Los POST de depósito Klar $2,000.00 y retiro $500.00 dejan Klar en $13,500.00; no cuentan como gasto.
4. **CA-04** El POST de retiro $6,250.00 no aparece en gasto real; sí en panel de retiro y cuenta Efectivo.
5. **CA-05** Crédito disponible es $46,500.00 tras compra y $50,000.00 tras pago; reejecutar la suite no cambia esas cifras porque limpia/recrea únicamente la fixture de crédito.
6. **CA-06** La variante recién limpiada de pago desde Klar reduce Klar y deuda, sin duplicar gasto.
7. **CA-07** Los cinco códigos de sugerencia de `08` aparecen con el trigger exacto de la tabla anterior al hacer GET read-only al tracer de `18`; el `SuggestionContext` y los `breakdowns` del summary no se alteran.
8. **CA-08** Descartar una sugerencia no llama mutaciones finance.
9. **CA-09** `breakdowns` de la fixture aislada enlaza a los UUID runtime devueltos por sus POST; el summary canónico de `18` sigue enlazando sus UUID v4 fijos de compra, pago, transferencias y consumos.
10. **CA-10** Ningún POST de este spec usa los periodos `4bc02a91-6ad8-4627-8ab9-01c3ee0a1003`/`1004` ni reenvía transacciones del ledger de `18`.
11. **CA-11** Un `409` al provisionar solo reutiliza la fixture después de login
    exitoso con `FinanceCreditTest1!` y de comprobar en `/auth/me` email, name
    y `role: 'READ_ONLY'` en `$creditMe.user` (incluido su `id`). Cualquier
    discrepancia aborta antes de limpiar `Finance*` o borrar el usuario
    existente.
12. **CA-12** Cada POST aislado consume `201 { transaction: TransactionDto }`
    y usa exclusivamente `response.transaction.id` como UUID runtime para sus
    aserciones; no acepta ni espera una respuesta plana.

## Verificación

```powershell
# Backend: ejecutar desde la raíz del workspace.
Set-Location repos/personal-api
# Tras crear y registrar la fixture aislada planned; el test también limpia en
# beforeEach/afterEach.
# planned: db:clean-finance-credit-fixture se habilita al crear/registrar el script.
npm run db:clean-finance-credit-fixture
npm run test:integration -- tests/integration/finance-credit-klar.test.ts

# Solo para la comprobación read-only de sugerencias/breakdowns canónicos.
# planned: db:seed-finance-tracer se habilita al crear/registrar el script de 18.
npm run db:seed-finance-tracer
```

```powershell
# SPA: ejecutar en otra terminal PowerShell desde la raíz del workspace.
Set-Location repos/finance-app
npm test -- src/test/integration/credit-klar-double-count.test.tsx
npm run typecheck
```

**Manual:**

1. Login como `finance.credit.integration@example.com`; limpiar/recrear su fixture y confirmar que los POST usan solo los UUID de periodo aislados de 2027.
2. En Marzo 2027, confirmar que compra TDC suma $3,500.00 de deuda y gasto real, sin salida de Débito.
3. En Abril 2027, registrar el pago: deuda $0.00 y gasto real sigue $0.00; verificar depósito y retiro Klar: saldo final `$13,500.00`.
4. Repetir tras cleanup y confirmar que no queda una segunda compra/pago/transferencia.
5. Login como A, abrir el summary Marzo canónico y comprobar los cinco códigos de sugerencia; descartarlos no cambia totales ni publica movimientos.
6. Simular un `409` con email de fixture pero name, role o contraseña distintos:
   la preparación aborta, no ejecuta cleanup y no elimina ese usuario.

## Impacto y riesgos

| Riesgo | Mitigación |
|--------|------------|
| Pago contado como gasto | Tipo `CREDIT_PAYMENT` y test de regresión |
| Retiro + Mandado/Salidas doble contados | Transferencia y gastos de consumo diferenciados |
| Confundir ahorro del mes con Klar | Paneles y labels separados |
| Sugerencia muta datos | Sin endpoint de aplicación en MVP |
| Pago Klar mal tipado | Validar contraparte de tarjeta |
| POST duplicado sobre el tracer | Fixture/usuario/periodos aislados, cleanup `beforeEach`/`afterEach` y CA-10 |
