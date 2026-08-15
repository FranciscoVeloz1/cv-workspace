# Integración — E2E y runbook local

**Tipo:** Integration
**Depende de:** [`16-integration-auth-and-http-client.md`](16-integration-auth-and-http-client.md), [`18-integration-dashboard-tracer-bullet.md`](18-integration-dashboard-tracer-bullet.md), [`19-integration-mutations-and-projection.md`](19-integration-mutations-and-projection.md), [`20-integration-credit-klar-and-suggestions.md`](20-integration-credit-klar-and-suggestions.md), [`docs/architecture/finance-app/architecture.md`](../../architecture/finance-app/architecture.md), [`repos/personal-api/README.md`](../../../repos/personal-api/README.md)
**Implementa:** Recorrido E2E completo, runbook reproducible Windows-first, variables no secretas, comandos, URLs, limpieza de fixtures, escenarios login/edición/propagación/crédito/Klar/logout y fallos esperados.
**No incluye:** Despliegue detallado de producción (ver README API Railway), commits.

## Resultado

Un desarrollador con PowerShell puede levantar PostgreSQL + API + SPA,
provisionar un admin y los usuarios A/B con credenciales deterministas, resolver
sus UUID runtime y sembrar el tracer, ejecutar el flujo E2E manual o Playwright,
verificar propagación Marzo → Abril → Mayo, crédito/Klar sin doble conteo,
logout y los fallos 401/404/409/CORS. El periodo foco es el UUID fijo de Marzo,
no el mes que marque el sistema.

## Contratos de entrada y salida

### Topología local

```text
┌─────────────────┐     CORS      ┌──────────────────┐
│ finance-app     │ ────────────► │ personal-api     │
│ :5173           │   JWT Bearer  │ :3000            │
└─────────────────┘               └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ PostgreSQL       │
                                  │ :5432 (docker)   │
                                  └──────────────────┘
```

### URLs

| Servicio | URL | Propósito |
|----------|-----|-----------|
| API health | `http://localhost:3000/api/v1/health/ping` | Liveness |
| API readiness | `http://localhost:3000/api/v1/health` | DB check |
| SPA | `http://localhost:5173/` | Dashboard |
| Login SPA | `http://localhost:5173/login` | Auth |
| API auth | `http://localhost:3000/api/v1/auth/*` | Login, refresh, logout, me |
| API finance | `http://localhost:3000/api/v1/finance/*` | Datos y mutaciones |

### Variables de entorno (templates no secretos)

#### `repos/personal-api/.env`

| Variable | Valor ejemplo local | Notas |
|----------|---------------------|-------|
| `NODE_ENV` | `development` | |
| `PORT` | `3000` | |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/personal_api` | Ajustar a Docker |
| `CORS_ORIGINS` | `http://localhost:5173` | Obligatorio con SPA separada |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | |

**Secretos (no commitear):** `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`; generar
32+ caracteres y conservarlos fuera de control de versiones.

#### `repos/finance-app/.env`

| Variable | Valor ejemplo |
|----------|---------------|
| `VITE_API_BASE_URL` | `http://localhost:3000` |

`VITE_API_BASE_URL` es el **origen**, nunca incluye un path de API; los wrappers
usan la base `/api/v1/finance`.

#### Variables de sesión para PowerShell

| Variable | Uso |
|----------|-----|
| `ADMIN_EMAIL` | `admin@example.com` |
| `ADMIN_PASSWORD` | valor local de desarrollo |
| `ADMIN_NAME` | `Initial Admin` para `db:seed-admin` |
| `FINANCE_USER_EMAIL` | `finance.integration@example.com` |
| `FINANCE_USER_PASSWORD` | `FinanceTest1!` |
| `FINANCE_USER_ID` | UUID obtenido como `$me.user.id` en runtime por login de A → `GET /api/v1/auth/me`; nunca se configura fijo |
| `FINANCE_OTHER_USER_EMAIL` | `finance.other@example.com` |
| `FINANCE_OTHER_USER_PASSWORD` | `FinanceOtherTest1!` |
| `FINANCE_OTHER_USER_ID` | UUID obtenido como `$me.user.id` en runtime por login de B → `GET /api/v1/auth/me`; nunca se configura fijo |

### Precondición: artefactos de fixture

Antes de ejecutar los comandos de seed/clean, crear y registrar estos
artefactos de `18`; **no son scripts existentes todavía**:

| Artefacto por crear | Registro npm posterior |
|---------------------|------------------------|
| `repos/personal-api/scripts/seed-finance-tracer.ts` | `db:seed-finance-tracer` |
| `repos/personal-api/scripts/clean-finance-tracer.ts` | `db:clean-finance-tracer` |

Ambos deben ser idempotentes y usar los UUID del `Fixture ID registry` de `18`
solo para entidades Finance. Antes de crear o limpiar esas filas, el seed
resuelve A/B por sus credenciales, desenvuelve `$me.user.id` desde
`/api/v1/auth/me` y nunca fija ni busca un UUID de User. El test
`repos/personal-api/tests/integration/finance-tracer-seed.test.ts` verifica su
creación antes de autorizar este runbook.

### Runbook Windows-first — bootstrap desde cero

Todos los bloques siguientes son para **PowerShell**. Ejecutar los servidores
en terminales independientes; no usar operadores de background.

```powershell
# Terminal PowerShell 1 — PostgreSQL y preparación API
Set-Location repos/personal-api
docker compose up -d
Copy-Item .env.example .env
# Editar .env: DATABASE_URL, CORS_ORIGINS y los dos JWT_*_SECRET.

npm install
npm run db:migrate

$env:ADMIN_EMAIL = 'admin@example.com'
$env:ADMIN_PASSWORD = 'secret123'
$env:ADMIN_NAME = 'Initial Admin'
npm run db:seed-admin
```

```powershell
# Terminal PowerShell 2 — API (mantener abierta)
Set-Location repos/personal-api
npm run dev
```

> **Fuente de provisión verificada:** `repos/personal-api/src/modules/users/users.schemas.ts`
> acepta exactamente `{ email, password, name, role }`, con `role` top-level
> `READ_ONLY | ADMIN`. No añadir `permissions`, `application` ni membresías.

Un `409` de provisión no demuestra que una cuenta preexistente sea la fixture
correcta. El bloque siguiente intenta login con el password fixture justo
después de cada `409` y valida su identidad completa. Si falla, aborta con un
mensaje de limpieza/recreación para el admin; no borra automáticamente, porque
solo puede eliminarse una cuenta que coincida exactamente con la fixture.

```powershell
# Terminal PowerShell 3 — provisión reproducible de A/B por admin.
$adminBody = @{
  email = $env:ADMIN_EMAIL
  password = $env:ADMIN_PASSWORD
} | ConvertTo-Json -Compress

$adminLogin = curl.exe -s -X POST http://localhost:3000/api/v1/auth/login `
  -H 'Content-Type: application/json' `
  -d $adminBody | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace($adminLogin.accessToken)) {
  throw 'No fue posible autenticar al admin.'
}

$fixtureUsers = @(
  @{
    email = 'finance.integration@example.com'
    password = 'FinanceTest1!'
    name = 'Finance Integration User'
    role = 'READ_ONLY'
  },
  @{
    email = 'finance.other@example.com'
    password = 'FinanceOtherTest1!'
    name = 'Finance Other Integration User'
    role = 'READ_ONLY'
  }
)

function Try-ResolveFixtureIdentity {
  param([Parameter(Mandatory)] [hashtable] $FixtureUser)

  $loginBody = @{
    email = $FixtureUser.email
    password = $FixtureUser.password
  } | ConvertTo-Json -Compress

  try {
    $login = curl.exe -s -X POST http://localhost:3000/api/v1/auth/login `
      -H 'Content-Type: application/json' `
      -d $loginBody | ConvertFrom-Json
    if (
      [string]::IsNullOrWhiteSpace($login.accessToken) -or
      [string]::IsNullOrWhiteSpace($login.refreshToken) -or
      $null -eq $login.user -or
      [string]::IsNullOrWhiteSpace($login.user.id) -or
      $login.user.email -cne $FixtureUser.email -or
      $login.user.name -cne $FixtureUser.name
    ) {
      return $null
    }

    $me = curl.exe -s http://localhost:3000/api/v1/auth/me `
      -H "Authorization: Bearer $($login.accessToken)" | ConvertFrom-Json
  } catch {
    return $null
  }

  if (
    $null -eq $me.user -or
    [string]::IsNullOrWhiteSpace($me.user.id) -or
    $login.user.id -cne $me.user.id -or
    $me.user.email -cne $FixtureUser.email -or
    $me.user.name -cne $FixtureUser.name -or
    $me.user.role -cne $FixtureUser.role
  ) {
    return $null
  }

  return [pscustomobject]@{ accessToken = $login.accessToken; id = $me.user.id }
}

$fixtureSessions = @{}
foreach ($fixtureUser in $fixtureUsers) {
  # El payload admite exactamente email/password/name/role, con role top-level.
  $provisionBody = $fixtureUser | ConvertTo-Json -Compress
  $status = (curl.exe -s -o NUL -w '%{http_code}' -X POST http://localhost:3000/api/v1/users `
    -H "Authorization: Bearer $($adminLogin.accessToken)" `
    -H 'Content-Type: application/json' `
    -d $provisionBody).Trim()
  if ($status -notin @('200', '201', '409')) {
    throw "No se pudo provisionar $($fixtureUser.email): HTTP $status"
  }

  # Tras 409, este login con password fixture es obligatorio.
  $session = Try-ResolveFixtureIdentity $fixtureUser
  if ($null -eq $session) {
    throw (
      "El email $($fixtureUser.email) ya existe o no es la fixture esperada. " +
      "Abortado: con el admin obtenido mediante ADMIN_EMAIL, ADMIN_PASSWORD y ADMIN_NAME, " +
      "identifica y elimina/recrea solo el usuario cuyo email, name y role coincidan exactamente " +
      "con esta fixture; nunca borres otro usuario. Después repite la provisión."
    )
  }
  $fixtureSessions[$fixtureUser.email] = $session
}

$financeUserSession = $fixtureSessions[$fixtureUsers[0].email]
$financeOtherUserSession = $fixtureSessions[$fixtureUsers[1].email]
$env:FINANCE_USER_EMAIL = $fixtureUsers[0].email
$env:FINANCE_USER_PASSWORD = $fixtureUsers[0].password
$env:FINANCE_USER_ID = $financeUserSession.id
$env:FINANCE_OTHER_USER_EMAIL = $fixtureUsers[1].email
$env:FINANCE_OTHER_USER_PASSWORD = $fixtureUsers[1].password
$env:FINANCE_OTHER_USER_ID = $financeOtherUserSession.id
```

El bloque anterior crea A/B por email y, ante cada `409`, solo reutiliza la
cuenta después de comprobar el login fixture e identidad completa por
`/auth/me` en `$me.user`; `createUserSchema` no acepta un `id`.
`READ_ONLY` es el rol del servicio de usuarios. Las mutaciones finance propias
se autorizan con `authenticate` + ownership del JWT (`07`/`09`), no requieren
`ADMIN` ni acceso cross-user; `ADMIN` tampoco evita el aislamiento financiero.

```powershell
# Terminal PowerShell 3 — solo después de crear los artefactos planned de fixture
# y registrar el script npm.
# El seed vuelve a resolver los IDs runtime antes de crear el ledger Finance de A.
Set-Location repos/personal-api
npm run db:seed-finance-tracer
```

```powershell
# Terminal PowerShell 4 — SPA (mantener abierta)
Set-Location repos/finance-app
Copy-Item .env.example .env
# Confirmar que .env contiene: VITE_API_BASE_URL=http://localhost:3000
npm install
npm run dev
```

Abrir `http://localhost:5173/login`, iniciar sesión como Usuario A y verificar
que el selector del tracer abre el periodo
`4bc02a91-6ad8-4627-8ab9-01c3ee0a1003` (Marzo 2026).

### Verificación rápida de API — PowerShell

```powershell
$financeBody = @{
  email = $env:FINANCE_USER_EMAIL
  password = $env:FINANCE_USER_PASSWORD
} | ConvertTo-Json -Compress

$financeLogin = curl.exe -s -X POST http://localhost:3000/api/v1/auth/login `
  -H 'Content-Type: application/json' `
  -d $financeBody | ConvertFrom-Json

if (
  [string]::IsNullOrWhiteSpace($financeLogin.accessToken) -or
  [string]::IsNullOrWhiteSpace($financeLogin.refreshToken) -or
  $null -eq $financeLogin.user -or
  [string]::IsNullOrWhiteSpace($financeLogin.user.id) -or
  $financeLogin.user.email -ne $env:FINANCE_USER_EMAIL -or
  $financeLogin.user.name -ne 'Finance Integration User'
) {
  throw 'Login A no devolvió el contrato LoginResponse esperado.'
}

$token = $financeLogin.accessToken
$financeMe = curl.exe -s http://localhost:3000/api/v1/auth/me `
  -H "Authorization: Bearer $token" | ConvertFrom-Json
if (
  $null -eq $financeMe.user -or
  [string]::IsNullOrWhiteSpace($financeMe.user.id) -or
  $financeLogin.user.id -ne $financeMe.user.id -or
  $financeMe.user.email -ne $env:FINANCE_USER_EMAIL -or
  $financeMe.user.name -ne 'Finance Integration User' -or
  $financeMe.user.role -ne 'READ_ONLY'
) {
  throw 'La sesión A no devolvió $financeMe.user.id/email/name/role esperado.'
}
$env:FINANCE_USER_ID = $financeMe.user.id
$marchId = '4bc02a91-6ad8-4627-8ab9-01c3ee0a1003'

$periods = curl.exe -s `
  -H "Authorization: Bearer $token" `
  http://localhost:3000/api/v1/finance/periods | ConvertFrom-Json
$periods.periods.Count

$summary = curl.exe -s `
  -H "Authorization: Bearer $token" `
  "http://localhost:3000/api/v1/finance/periods/$marchId/summary" | ConvertFrom-Json
$summary.summary.totals.expectedSavings
```

Resultados esperados: cinco periodos Enero–Mayo y ahorro esperado Marzo
`29650.00` antes de la mutación de `19`.

### Limpieza de fixtures

| Alcance | Acción |
|---------|--------|
| Datos finance del Usuario A | Tras crear el script planned: `npm run db:clean-finance-tracer` |
| Reset DB local completo | `docker compose down -v`; luego repetir bootstrap y migración |
| Tests integración API | `beforeEach` limpia `Finance*` en el orden de `sql-tables.md` §11 |
| Cache SPA | Logout ejecuta `queryClient.clear()` |

El clean deja provisionados A y B; borra únicamente las filas `Finance*` del
owner runtime `$env:FINANCE_USER_ID` (A). Nunca usa un UUID fijo de usuario ni
toca la fixture aislada de crédito de `20`.

### Recorrido E2E manual

| # | Paso | Expectativa |
|---|------|-------------|
| 1 | Login usuario provisionado | Shell autenticado; sin registro ni recuperación |
| 2 | Dashboard con Marzo seleccionado | Hero ahorro esperado `$29,650.00`; skeleton previo |
| 3 | Timeline | Enero–Mayo visibles |
| 4 | Detalle Marzo → movimientos | Ingreso, gastos, compra crédito y transferencia presentes |
| 5 | Editar Extra $500.00 → $2,000.00 | Preview Marzo/Abril/Mayo; confirm; hero Marzo `$28,150.00` |
| 6 | Verificar Enero/Febrero | Snapshots idénticos a pre-edición |
| 7 | Abril pago TDC | Deuda $0.00; gasto real no suma $3,500.00 |
| 8 | Abril depósito/retiro Klar | Saldo Klar `$13,500.00` |
| 9 | Sugerencias | Los cinco códigos de `08`; dismiss no modifica datos |
| 10 | Logout | Redirección login; rutas protegidas bloqueadas |
| 11 | Usuario B login con `FINANCE_OTHER_USER_EMAIL` / `FINANCE_OTHER_USER_PASSWORD` | Resolver `FINANCE_OTHER_USER_ID` por `/auth/me`; dashboard vacío; GET summary ajeno devuelve 404 |

### E2E automatizado — Playwright

| Artefacto | Ruta |
|-----------|------|
| Spec | `repos/finance-app/e2e/finance-happy-path.spec.ts` |
| Config | `repos/finance-app/playwright.config.ts` |
| Helper auth | `repos/finance-app/e2e/helpers/login.ts` |
| Snapshot Ene/Feb | `repos/finance-app/e2e/fixtures/jan-feb-summary.snapshot.json` |

```powershell
Set-Location repos/finance-app
# Requiere API, SPA y fixture ya ejecutándose según el runbook.
npx playwright test e2e/finance-happy-path.spec.ts
```

Escenarios obligatorios:

1. Login → hero de Marzo.
2. Editar extra Marzo → diálogo de impacto → confirm → ahorro `$28,150.00`.
3. Pago Abril → deuda cero sin gasto de consumo adicional.
4. Logout → login.

`repos/finance-app/playwright.config.ts` usa `baseURL: 'http://localhost:5173'`; la API se
levanta en otra terminal PowerShell en `:3000`.

### Fallos esperados

| # | Escenario | Cómo reproducir | Resultado esperado |
|---|-----------|-----------------|--------------------|
| F1 | Sin token finance | `curl.exe` sin Bearer a `/api/v1/finance/periods` | 401 `UNAUTHORIZED` |
| F2 | Ownership | Login B con `FINANCE_OTHER_USER_EMAIL` / `FINANCE_OTHER_USER_PASSWORD`, resolver su UUID por `/auth/me` y solicitar summary de `4bc02a91-6ad8-4627-8ab9-01c3ee0a1003` | 404 `NOT_FOUND`; no expone datos/ID de A |
| F3 | Concurrencia | Dos confirms con versión 1 | 409 `FINANCE_CONFLICT` |
| F4 | CORS | Ejecutar el bloque F4: fuerza API a permitir solo `:5173` y abre SPA en `:5174` | Error CORS; UI «No se pudo conectar» |
| F5 | Refresh inválido | Corromper refresh de sessionStorage | Login tras retry fallido |
| F6 | Validación | POST finance con amount `"10.567"` | 422 `VALIDATION_ERROR` |
| F7 | Preview no persiste | Repetir `POST /api/v1/finance/projection/preview` | Conteos `FinanceTransaction` sin cambio |
| F8 | Registro público | POST `/api/v1/auth/register` | Ruta no expuesta, 404 |
| F9 | Logout | Logout y usar refresh anterior | Refresh rechazado |
| F10 | Pago como gasto | Cambiar tipo de pago a `EXPENSE` en test | Regresión `20` falla |

### Reproducción controlada F4 — CORS

Este caso debe cambiar el archivo `.env` **real de la API**, aunque
`.env.example` ya incluya `:5174` o varios orígenes. Ejecutar el primer bloque en
una terminal PowerShell de control; conservar la copia hasta terminar la prueba.

```powershell
# Terminal PowerShell de control — antes de abrir la SPA en :5174
Set-Location repos/personal-api
Copy-Item .env .env.f4-backup -Force

$envLines = Get-Content -LiteralPath .env
if (-not ($envLines -match '^CORS_ORIGINS=')) {
  throw 'No existe CORS_ORIGINS en .env; no se puede ejecutar F4 de forma controlada.'
}

$restrictedEnvLines = $envLines | ForEach-Object {
  if ($_ -match '^CORS_ORIGINS=') {
    'CORS_ORIGINS=http://localhost:5173'
  } else {
    $_
  }
}
Set-Content -LiteralPath .env -Value $restrictedEnvLines -Encoding utf8
```

1. En la terminal de API, detenerla con `Ctrl+C` y volver a ejecutar `npm run dev`
   para que lea `CORS_ORIGINS=http://localhost:5173`.
2. En otra terminal PowerShell, iniciar una segunda SPA con origen distinto:

```powershell
Set-Location repos/finance-app
npm run dev -- --port 5174
```

3. Abrir `http://localhost:5174/login`, intentar login o cargar dashboard y verificar
   el error CORS y el mensaje «No se pudo conectar».
4. Restaurar inmediatamente el `.env` original y reiniciar la API:

```powershell
Set-Location repos/personal-api
Copy-Item .env.f4-backup .env -Force
Remove-Item .env.f4-backup
# En la terminal de API: Ctrl+C y luego npm run dev.
```

### Comandos de verificación

```powershell
# Backend: ejecutar desde la raíz del workspace, después de crear los artefactos
# planned db:seed-finance-tracer/db:clean-finance-tracer.
Set-Location repos/personal-api
npm run build
npm run test:integration -- tests/integration/finance-tracer-seed.test.ts tests/integration/finance-propagation.test.ts tests/integration/finance-credit-klar.test.ts
```

```powershell
# SPA: ejecutar en otra terminal PowerShell desde la raíz del workspace.
Set-Location repos/finance-app
npm test -- src/test/pages/DashboardPage.test.tsx src/test/integration/propagation.test.tsx src/test/integration/credit-klar-double-count.test.tsx
npm run typecheck
npx playwright test e2e/finance-happy-path.spec.ts
```

### Migraciones

| Entorno | Comando |
|---------|---------|
| Dev | `npm run db:migrate` |
| CI/prod | `npm run db:migrate:deploy` |

No usar `db:push` como sustituto de migraciones. Aplicar migraciones
`Finance*` antes de crear o ejecutar el seed tracer.

## Tareas

1. Crear los scripts de seed/clean definidos en `18`, registrar los dos comandos
   npm y hacer que el seed resuelva/valide
   `$me.user.id/email/name/role` por login → `/auth/me` antes de escribir
   `Finance*`.
2. Crear `repos/finance-app/e2e/fixtures/jan-feb-summary.snapshot.json` para
   pruebas de propagación.
3. Implementar `repos/finance-app/e2e/finance-happy-path.spec.ts` con el flujo
   de once pasos.
4. Implementar helper de login E2E que lea `FINANCE_USER_*` y
   `FINANCE_OTHER_USER_*` desde entorno, use `loginResponse.user` solo para
   `id/email/name`, compruebe que `loginResponse.user.id` coincide con
   `me.user.id`, consulte `/auth/me` y desenvuelva `me.user` para validar
   `id/email/name/role`; nunca espera UUIDs fijos de User ni
   `refreshResponse.user`.
5. Añadir job CI opcional con pruebas integration finance y Playwright.
6. Mantener esta matriz de fallos como referencia de CI y soporte.

## Criterios de aceptación

1. **CA-01** El bootstrap funciona en Windows con PowerShell, Docker y Node 20.
2. **CA-02** Tras seed, el summary de Marzo devuelve `expectedSavings: "29650.00"`.
3. **CA-03** E2E Playwright pasa con API, SPA y fixture activos.
4. **CA-04** El checklist manual de once pasos se completa sin comandos POSIX.
5. **CA-05** `db:clean-finance-tracer` deja A/B provisionados, pero borra solo las filas `Finance*` de A identificadas por `FINANCE_USER_ID` runtime.
6. **CA-06** F1–F7 son reproducibles con resultados documentados.
7. **CA-07** Logout E2E bloquea `/` y vuelve a login.
8. **CA-08** Propagación conserva snapshots de Enero/Febrero.
9. **CA-09** Pago de Abril no aumenta gasto real en $3,500.00.
10. **CA-10** Ningún template de entorno contiene secretos.
11. **CA-11** F2 autentica B con su password fija y resuelve
    `FINANCE_OTHER_USER_ID` como `$me.user.id` por `/auth/me` antes de comprobar
    el 404 ownership.
12. **CA-12** Un `409` de A/B solo continúa tras login con la contraseña fixture,
    coincidencia de `login.user.id` con `$me.user.id` y coincidencia exacta de
    `$me.user.id/email/name/role`; si falla, el runbook aborta y exige
    limpiar/recrear únicamente la fixture identificada por el admin.
13. **CA-13** Los checks de runbook y helper respetan los tres shapes: login
    contiene `user` sin `role`, refresh contiene solo tokens y `/auth/me`
    devuelve `{ user }` con `role`.

## Impacto y riesgos

| Riesgo | Mitigación |
|--------|------------|
| Seed frágil entre migraciones o colisión User.id | Test integration de seed; UUIDs fijos solo Finance, validación de login/identidad tras `409` y A/B resueltos por `/auth/me` |
| E2E flaky por timing | `expect` con retry; sin sleeps fijos |
| Secretos en logs E2E | No imprimir passwords ni tokens |
| Runbook deriva de scripts futuros | Precondición explícita de crear artefactos antes de usarlos |
| CORS inconsistente | Origen SPA/API documentado; F4 fuerza `:5173`, prueba `:5174` y restaura backup |
| Fecha actual altera el tracer | `selectedPeriodId` fijo de Marzo |
