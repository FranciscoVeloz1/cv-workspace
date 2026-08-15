# Integración — Auth y cliente HTTP

**Tipo:** Integration
**Depende de:** [`09-backend-contracts-security-and-errors.md`](09-backend-contracts-security-and-errors.md), [`11-ux-ui-auth-and-app-shell.md`](11-ux-ui-auth-and-app-shell.md), [`docs/architecture/finance-app/architecture.md`](../../architecture/finance-app/architecture.md), [`repos/personal-api/README.md`](../../../repos/personal-api/README.md)
**Implementa:** Cliente HTTP base, `ApiError`, gestión de sesión JWT (access en memoria, refresh persistido), bootstrap, retry único ante `401`, logout, guarda de rutas y configuración CORS/hosts en `repos/finance-app`.
**No incluye:** Hooks TanStack Query de dominio finance (`17`), contratos DTO finance (`17`), pantallas de dashboard (`18`), mutaciones/propagación (`19`), flujos crédito/Klar (`20`), runbook E2E (`21`), registro público, recuperación de contraseña ni commits.

## Resultado

La SPA `repos/finance-app` se comunica con `personal-api` usando el mismo contrato de auth JWT existente (`/api/v1/auth/*`). El access token vive solo en memoria; el refresh token se persiste de forma segura en el cliente. Un usuario **provisionado por administrador** puede iniciar sesión, mantener sesión con refresh transparente, recuperarse de un access token expirado con **un único** reintento tras refresh, cerrar sesión y quedar bloqueado fuera de rutas protegidas. Los hosts y CORS están documentados para desarrollo local y despliegue separado API/SPA.

## Contratos de entrada y salida

### Entradas (runtime)

| Entrada | Origen | Uso |
|---------|--------|-----|
| `VITE_API_BASE_URL` | `.env` SPA | **Origen** de la API; en local `http://localhost:3000`, sin `/api/v1` ni `/finance` |
| `CORS_ORIGINS` | `.env` API | Origen permitido de la SPA (p. ej. `http://localhost:5173`) |
| Credenciales usuario fixture | Admin vía `POST /api/v1/users` | Login de prueba |
| Endpoints auth existentes | `personal-api` | login, refresh, logout, me |

### Salidas (artefactos SPA)

| Artefacto | Ruta |
|-----------|------|
| Cliente HTTP | `repos/finance-app/src/api/http.ts` |
| Auth API | `repos/finance-app/src/api/auth.ts` |
| Tipos error | `repos/finance-app/src/api/types.ts` |
| Sesión refresh | `repos/finance-app/src/auth/session-storage.ts` |
| Provider | `repos/finance-app/src/auth/AuthProvider.tsx` |
| Guarda | `repos/finance-app/src/auth/RequireAuth.tsx` |
| Login page (orquestación) | `repos/finance-app/src/pages/LoginPage/LoginPage.tsx` |
| Tests unitarios | `repos/finance-app/src/test/api/http.test.ts`, `repos/finance-app/src/test/api/auth.test.ts` |

### Fixtures — usuarios A/B provisionados por admin (MVP)

**No existe registro público.** Los usuarios de integración A y B se crean o
reutilizan con el admin existente. Sus emails, passwords, nombres y roles son
fijos; sus UUID son asignados por el servicio de usuarios y se resuelven en
runtime. Ningún registry, seed ni payload de provisión fija un UUID de usuario.

> **Fuente verificada:** `repos/personal-api/src/modules/users/users.schemas.ts`
> define exactamente `{ email, password, name, role }` y el rol global
> `READ_ONLY | ADMIN`. No añadir `id`, `permissions`, `application` ni
> membresías a este payload. `role` siempre está al nivel superior.

Primero sembrar el admin con las tres variables requeridas por el script:

```powershell
# PowerShell, desde repos/personal-api.
$env:ADMIN_EMAIL = 'admin@example.com'
$env:ADMIN_PASSWORD = 'secret123'
$env:ADMIN_NAME = 'Initial Admin'
npm run db:seed-admin
```

Un `409` de `POST /api/v1/users` **no** confirma que la cuenta existente sea
reutilizable. Cuando ocurra, el bloque intenta inmediatamente login con la
contraseña fixture y valida email, nombre y rol. Si no coincide, aborta con una
instrucción explícita de limpieza/recreación: no emite un `DELETE` automático
porque antes un administrador debe identificar y confirmar que se trata
exactamente de una fixture. `ADMIN_NAME` forma parte del bootstrap del admin,
no de los payloads A/B.

```powershell
# PowerShell, con API y admin seed ya disponibles.
$adminLoginBody = @{
  email = $env:ADMIN_EMAIL
  password = $env:ADMIN_PASSWORD
} | ConvertTo-Json -Compress

$adminLogin = curl.exe -s -X POST http://localhost:3000/api/v1/auth/login `
  -H 'Content-Type: application/json' `
  -d $adminLoginBody | ConvertFrom-Json

if ([string]::IsNullOrWhiteSpace($adminLogin.accessToken)) {
  throw 'No fue posible autenticar al admin para provisionar las fixtures.'
}

$env:FINANCE_USER_EMAIL = 'finance.integration@example.com'
$env:FINANCE_USER_PASSWORD = 'FinanceTest1!'
$env:FINANCE_OTHER_USER_EMAIL = 'finance.other@example.com'
$env:FINANCE_OTHER_USER_PASSWORD = 'FinanceOtherTest1!'

$fixtureUsers = @(
  @{
    email = $env:FINANCE_USER_EMAIL
    password = $env:FINANCE_USER_PASSWORD
    name = 'Finance Integration User'
    role = 'READ_ONLY'
  },
  @{
    email = $env:FINANCE_OTHER_USER_EMAIL
    password = $env:FINANCE_OTHER_USER_PASSWORD
    name = 'Finance Other Integration User'
    role = 'READ_ONLY'
  }
)

function Try-ResolveFixtureSession {
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
  $fixtureUserBody = $fixtureUser | ConvertTo-Json -Compress
  $status = (curl.exe -s -o NUL -w '%{http_code}' -X POST http://localhost:3000/api/v1/users `
    -H "Authorization: Bearer $($adminLogin.accessToken)" `
    -H 'Content-Type: application/json' `
    -d $fixtureUserBody).Trim()

  if ($status -notin @('200', '201', '409')) {
    throw "No se pudo provisionar $($fixtureUser.email): HTTP $status"
  }

  # Tras 409, este login con la contraseña fixture es obligatorio, no opcional.
  $session = Try-ResolveFixtureSession $fixtureUser
  if ($null -eq $session) {
    throw (
      "El email $($fixtureUser.email) ya existe o no se puede autenticar como la fixture esperada. " +
      "Abortado: con el admin obtenido mediante ADMIN_EMAIL, ADMIN_PASSWORD y ADMIN_NAME, " +
      "identifica el usuario y elimínalo/recréalo solo si email, name y role coinciden exactamente " +
      "con esta fixture; nunca borres otro usuario. Después vuelve a ejecutar este bloque."
    )
  }

  $fixtureSessions[$fixtureUser.email] = $session
}

$financeUserSession = $fixtureSessions[$fixtureUsers[0].email]
$financeOtherUserSession = $fixtureSessions[$fixtureUsers[1].email]
$env:FINANCE_USER_ID = $financeUserSession.id
$env:FINANCE_OTHER_USER_ID = $financeOtherUserSession.id
```

| Fixture | Email | Password | Nombre / rol del objeto `user` | UUID de runtime |
|---------|-------|----------|-------------------------|-----------------|
| A | `finance.integration@example.com` | `FinanceTest1!` | `Finance Integration User` / `READ_ONLY` | `$env:FINANCE_USER_ID`, desde `$me.user.id` de `GET /api/v1/auth/me` |
| B | `finance.other@example.com` | `FinanceOtherTest1!` | `Finance Other Integration User` / `READ_ONLY` | `$env:FINANCE_OTHER_USER_ID`, desde `$me.user.id` de `GET /api/v1/auth/me` |

El seed de `18` repite la resolución login → `/auth/me` y desenvuelve
`$me.user.id` antes de crear filas `Finance*`; usa esos IDs reales como owner.
Las variables de entorno son la evidencia y handoff del runtime, no valores
persistidos ni aliases de fixture. No se hace `upsert` de `User` con un UUID
inventado; los UUID v4 fijos del registry corresponden únicamente a entidades
Finance.

Las mutaciones finance propias **no requieren** rol `ADMIN` ni una operación
cross-user: `07`/`09` toman el dueño desde `req.user.id` y validan cada
referencia contra ese mismo usuario. `ADMIN` tampoco obtiene acceso financiero
cross-user.

### Contrato HTTP base

```typescript
// repos/finance-app/src/api/types.ts
export type ApiErrorBody = {
  error: string;
  message: string;
  details?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.error;
    this.details = body.details;
  }

  static async fromResponse(res: Response): Promise<ApiError> {
    let body: ApiErrorBody;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      body = { error: 'UNKNOWN', message: res.statusText || 'Request failed' };
    }
    return new ApiError(res.status, body);
  }
}
```

### Shapes de respuesta auth vigentes

```typescript
type LoginResponse = {
  user: { id: string; email: string; name: string };
  accessToken: string;
  refreshToken: string;
};

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

type MeResponse = {
  user: { id: string; email: string; name: string; role: 'READ_ONLY' | 'ADMIN' };
};
```

Solo login contiene `response.user`, y ese objeto no tiene `role`. Refresh
rota tokens pero no retorna usuario. La identidad autorizativa completa siempre
se toma de `GET /api/v1/auth/me` mediante `response.user`.

### Contrato auth — login

**Request** `POST /api/v1/auth/login`

```json
{
  "email": "finance.integration@example.com",
  "password": "FinanceTest1!"
}
```

**Response** `200`

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<opaque>",
  "user": {
    "id": "<uuid-runtime>",
    "email": "finance.integration@example.com",
    "name": "Finance Integration User"
  }
}
```

### Contrato auth — refresh

**Request** `POST /api/v1/auth/refresh`

```json
{
  "refreshToken": "<opaque-from-session-storage>"
}
```

**Response** `200` (rotación de refresh):

```json
{
  "accessToken": "<jwt-rotado>",
  "refreshToken": "<opaque-rotado>"
}
```

No contiene `user` ni `role`; después del refresh, solicitar `/api/v1/auth/me`
y usar `response.user`.

### Contrato auth — me (bootstrap)

**Request** `GET /api/v1/auth/me`
**Header:** `Authorization: Bearer <accessToken>`

**Response** `200`

```json
{
  "user": {
    "id": "<uuid-runtime>",
    "email": "finance.integration@example.com",
    "name": "Finance Integration User",
    "role": "READ_ONLY"
  }
}
```

### Contrato auth — logout

**Request** `POST /api/v1/auth/logout`

```json
{
  "refreshToken": "<opaque>"
}
```

**Response** `204` — cliente limpia memoria y storage.

### Política de tokens

| Token | Ubicación | Duración típica |
|-------|-----------|-----------------|
| Access | Memoria (`AuthProvider` ref/state) | `JWT_ACCESS_EXPIRES_IN` (15m) |
| Refresh | `sessionStorage` clave versionada `finance:refresh:v1` | 7d |

**Prohibido:** guardar access token en `localStorage` o cookies accesibles por JS sin hardening.

### Cliente HTTP — comportamiento

```typescript
// repos/finance-app/src/api/http.ts (contrato)
export type HttpRequestInit = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
  skipAuth?: boolean;       // login, refresh
  skipRefreshRetry?: boolean; // evitar loop en refresh
};

export function createHttpClient(deps: {
  getAccessToken: () => string | null;
  refreshSession: () => Promise<string>; // usa RefreshResponse; lanza si refresh falla
  onSessionExpired: () => void;
}): {
  request<T>(path: string, init?: HttpRequestInit): Promise<T>;
};
```

Flujo ante `401`:

1. Si `skipAuth` o `skipRefreshRetry` → lanzar `ApiError`.
2. Si ya se reintentó una vez en esta cadena → `onSessionExpired()`; lanzar `ApiError`.
3. Llamar `refreshSession()` → obtener nuevo access token.
4. Repetir request original **una vez** con nuevo Bearer.
5. Si segundo intento falla → `onSessionExpired()`.

### Bootstrap de sesión

Al montar `AuthProvider`:

1. Si no hay refresh en storage → estado `unauthenticated`.
2. Si hay refresh → `POST /api/v1/auth/refresh` (`RefreshResponse`: solo tokens)
   → guardar tokens → `GET /api/v1/auth/me` (`MeResponse`) → guardar
   `me.user` con `id`, `email`, `name` y `role` → estado `authenticated`.
3. Mientras tanto → estado `bootstrapping` (UI skeleton según `11`).

Al hacer login, `loginResponse.user` solo puede aportar `id`, `email` y `name`;
no se intenta leer `loginResponse.user.role`. Tras guardar sus tokens, el
provider solicita `/auth/me` y usa `me.user` como identidad completa. El mismo
paso posterior a refresh evita inventar `refreshResponse.user`.

### Guarda de rutas

`RequireAuth` envuelve rutas autenticadas (`/`, `/month/*`, `/accounts`, `/settings`):

| Estado auth | Comportamiento |
|-------------|----------------|
| `bootstrapping` | Pantalla bootstrap; no flash de datos finance |
| `unauthenticated` | `<Navigate to="/login" replace state={{ from: location }} />` |
| `authenticated` | Render children |

Ruta `/login` redirige a `/` si ya autenticado.

### CORS y hosts

| Escenario | API | SPA | Config |
|-----------|-----|-----|--------|
| Dev separado | `http://localhost:3000` | `http://localhost:5173` | API `CORS_ORIGINS=http://localhost:5173`; SPA `VITE_API_BASE_URL=http://localhost:3000` |
| Orígenes desplegados | origen API explícito | origen SPA explícito | `VITE_API_BASE_URL=https://api.example.test`; los wrappers usan la base `/api/v1/finance` |

Preflight: cliente envía `Content-Type: application/json`; API responde headers CORS para origen permitido.

**Errores CORS:** no retry automático; mensaje UI «No se pudo conectar con el servidor» (`11`).
La reproducción negativa F4 está definida en `21`: debe forzar temporalmente
`CORS_ORIGINS=http://localhost:5173`, reiniciar API, abrir la SPA en `:5174` y
restaurar después el valor previo. No depende del contenido de `.env.example`.

## Tareas

1. Crear `ApiError` y parser JSON de error alineado con `09` (`VALIDATION_ERROR`, `UNAUTHORIZED`, etc.).
2. Implementar `repos/finance-app/src/auth/session-storage.ts` con clave
   versionada y try/catch (Safari privado).
3. Implementar `repos/finance-app/src/api/auth.ts`: `login` → `LoginResponse`,
   `refresh` → `RefreshResponse`, `logout`, `getMe` → `MeResponse`; solo
   `login` y `getMe` desenvuelven `.user`, y solo `getMe.user` contiene `role`.
4. Implementar `repos/finance-app/src/api/http.ts` con inyección de Bearer,
   base URL, parse JSON, retry único 401.
5. Implementar `repos/finance-app/src/auth/AuthProvider.tsx` con estados
   `bootstrapping | authenticated | unauthenticated` y métodos `login`, `logout`.
6. Implementar `repos/finance-app/src/auth/RequireAuth.tsx` y wiring en
   `repos/finance-app/src/App.tsx`.
7. Implementar `LoginPage` sin enlaces registro/recuperación (`11`).
8. Documentar variables en `repos/finance-app/.env.example`.
9. Tests Vitest en `repos/finance-app/src/test/api/http.test.ts` y
   `repos/finance-app/src/test/api/auth.test.ts`: parse error, retry 401 éxito,
   retry 401 fallo → logout, login sin `role` en `user`, refresh sin `user`,
   `getMe` con wrapper `{ user }`, bootstrap con refresh válido/inválido.

## Criterios de aceptación

1. **CA-01** Login fixture admin-provisioned devuelve
   `{ user: { id, email, name }, accessToken, refreshToken }`; el shell usa el
   `role` obtenido después de `GET /api/v1/auth/me` en `me.user`.
2. **CA-02** Access token no persiste tras recargar página; refresh devuelve
   solo `{ accessToken, refreshToken }` y el bootstrap consulta `/auth/me`
   antes de pasar a `authenticated`.
3. **CA-03** Request finance con access expirado reintenta **exactamente una vez** tras refresh exitoso.
4. **CA-04** Segundo 401 consecutivo o refresh inválido → limpia sesión y redirige a login con mensaje.
5. **CA-05** Logout revoca refresh en API y limpia storage local.
6. **CA-06** Ruta protegida sin sesión nunca renderiza hijos finance (sin flash).
7. **CA-07** `GET /api/v1/finance/periods` sin token desde cliente → `ApiError` status 401 code `UNAUTHORIZED`.
8. **CA-08** Login page no muestra registro ni recuperación de contraseña.
9. **CA-09** Dev cross-origin: SPA en `:5173` consume API `:3000` sin error CORS con env documentado.
10. **CA-10** Errores 400/404/409 propagan `ApiError` con `code` y `details` intactos para UI posterior.
11. **CA-11** Un `409` al provisionar A/B solo reutiliza la cuenta después de
    login con la contraseña fixture y coincidencia exacta de
    `$me.user.id/email/name/role`; si falla, el bloque aborta y exige
    limpiar/recrear únicamente esa fixture.

## Verificación

```powershell
# Terminal PowerShell 1 — API (mantener abierta)
Set-Location repos/personal-api
docker compose up -d   # o embedded DB
Copy-Item .env.example .env
# Editar .env: DATABASE_URL, CORS_ORIGINS y JWT_*_SECRET.
npm install
npm run db:migrate
$env:ADMIN_EMAIL = 'admin@example.com'
$env:ADMIN_PASSWORD = 'secret123'
$env:ADMIN_NAME = 'Initial Admin'
npm run db:seed-admin
npm run dev
```

```powershell
# Terminal PowerShell 2 — SPA (mantener abierta)
Set-Location repos/finance-app
Copy-Item .env.example .env
# Confirmar que .env contiene: VITE_API_BASE_URL=http://localhost:3000
npm install
npm run dev
```

```powershell
# Terminal PowerShell 3 — tests unitarios auth/http
Set-Location repos/finance-app
npm test -- src/test/api/http.test.ts src/test/api/auth.test.ts
npm run typecheck
```

**Manual:**

1. Provisionar A/B y resolver sus UUID runtime con el bloque curl admin (arriba).
2. Login en `http://localhost:5173/login` → llega a dashboard shell vacío o loading.
3. DevTools → Application: confirmar refresh en storage, access **no** en localStorage.
4. Simular access expirado (mock test o esperar TTL): mutación sigue funcionando tras refresh silencioso.
5. Logout → `/login`; back no restaura sesión sin credenciales.

## Impacto y riesgos

| Riesgo | Mitigación |
|--------|------------|
| Loop infinito refresh | Flag `skipRefreshRetry`; máximo 1 retry por request |
| XSS roba refresh | Preferir sessionStorage; no access en storage; CSP futuro |
| CORS mal configurado | Documentar par API+SPA; fallo explícito en dev |
| Usuario asume registro público | Copy MVP + ausencia controles (`11`) |
| ADMIN intenta ver datos ajenos | Ownership finance en backend (`09`); UI no expone selector de usuario |
| Colisión de email fixture | Login y validación completa tras `409`; abortar antes de borrar una cuenta no verificada |
