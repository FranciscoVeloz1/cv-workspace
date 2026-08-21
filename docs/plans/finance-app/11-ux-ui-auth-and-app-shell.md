# Autenticación y shell de aplicación

**Tipo:** UX/UI  
**Depende de:** [`10-ux-ui-visual-foundations.md`](10-ux-ui-visual-foundations.md)  
**Implementa:** Composición visual de pantalla de inicio de sesión, shell autenticado, navegación principal, selector de periodo, estados de sesión y contenedor de rutas para `repos/finance-app`.  
**No incluye:** Funcionalidad, reglas de negocio, endpoints, SQL, Prisma, implementación React, JSON, fixtures, mock data, importes concretos, nombres de cuentas reales, payloads, registro público, recuperación de contraseña ni lógica de refresh de token.

## Resultado

El usuario experimenta una transición clara entre acceso no autenticado (login minimalista sin datos financieros) y aplicación autenticada (shell persistente con navegación, contexto de periodo y zona de contenido). La sesión expirada, la carga inicial y los errores de acceso tienen tratamiento visual explícito alineado con MVP provisionado por administrador.

## Contratos de entrada y salida

### Roles visuales — Login

| Rol | Presentación |
|-----|--------------|
| **Marca de producto** | Logotipo o wordmark centrado; subtítulo opcional sobre finanzas personales |
| **Campo identificador** | Label «Correo» o «Usuario»; input con focus ring |
| **Campo credencial** | Label «Contraseña»; input enmascarado |
| **Acción de ingreso** | Botón primario ancho completo en móvil |
| **Mensaje de error de acceso** | Banner o texto bajo formulario; tono `semantic-negative` |
| **Estado de envío** | Botón en loading; campos disabled |

**Ausencias visuales en MVP:** enlaces de registro, recuperación de contraseña y proveedores OAuth (no mostrar controles diferidos).

### Roles visuales — Shell autenticado

| Zona | Contenido visual |
|------|------------------|
| **Barra superior** | Marca compacta, selector de periodo, acciones de usuario |
| **Navegación principal** | Resumen, Detalle de mes, Cuentas, Configuración |
| **Indicador de ruta activa** | Resaltado con `accent-primary` |
| **Área de contenido** | Scroll independiente; padding `space-xl` |
| **Pie opcional** | Versión o texto legal mínimo; no distractor |

### Roles visuales — Selector de periodo

| Elemento | Tratamiento |
|----------|-------------|
| **Etiqueta de periodo activo** | Mes y año legibles (rol **Etiqueta de periodo**) |
| **Clasificador temporal** | Badge pasado / actual / futuro junto a la etiqueta |
| **Control anterior** | Icono chevron; hit area ≥ 44×44 px |
| **Control siguiente** | Icono chevron; hit area ≥ 44×44 px |
| **Selector expandido** | Lista o calendario de meses al abrir dropdown; orden cronológico |
| **Periodo inexistente** | Estado inline informativo al navegar a mes consecutivo no creado |
| **Acción crear periodo** | Enlace o botón secundario visible solo cuando aplica (futuro) |

### Roles visuales — Sesión y acceso

| Estado | Presentación |
|--------|--------------|
| **Bootstrap de sesión** | Pantalla completa con skeleton del shell o spinner centrado |
| **Sesión válida** | Shell completo; contenido de ruta visible |
| **Sesión expirada** | Banner persistente o redirección a login con mensaje claro |
| **Cierre de sesión** | Acción en menú de usuario; confirmación opcional |
| **Ruta protegida sin sesión** | Redirección visual a login; sin flash de datos |

### Layout del shell

```
┌─────────────────────────────────────────────────────────┐
│ [Marca]  [◀ Periodo activo + badge ▶]     [Usuario ▾]  │  ← barra superior
├──────────┬──────────────────────────────────────────────┤
│ Resumen  │                                              │
│ Detalle  │         Área de contenido de ruta            │
│ Cuentas  │                                              │
│ Config   │                                              │
└──────────┴──────────────────────────────────────────────┘
     ↑ navegación lateral (desktop) o drawer (móvil)
```

- **Desktop:** navegación lateral **fija** (~240 px) como navegación principal; selector de periodo siempre visible en barra superior. No usar tabs superiores como sustituto de la sidebar en desktop.
- **Tablet:** sidebar colapsada a rail de iconos (~64 px) con tooltip; selector de periodo permanece en header.
- **Móvil:** navegación inferior (4 destinos) + selector de periodo en header; drawer hamburguesa solo si el rail no cabe (ver [`15-ux-ui-responsive-and-accessibility.md`](15-ux-ui-responsive-and-accessibility.md)).

### Menú de usuario

- Avatar o iniciales en círculo.
- Dropdown: identificador de usuario (rol **text-secondary**), acción cerrar sesión.
- Sin configuración de perfil en MVP si no hay pantalla dedicada.

## Tareas

1. Definir composición visual de login sin flujos diferidos de registro/recuperación.
2. Especificar anatomía del shell autenticado y zonas persistentes.
3. Diseñar selector de periodo con clasificador temporal y navegación consecutiva.
4. Documentar estados de sesión: bootstrap, válida, expirada, cierre.
5. Alinear navegación principal con rutas conceptuales de arquitectura (Resumen, Detalle, Cuentas, Configuración).

## Criterios de aceptación

1. **CA-01** Login muestra solo identificador, credencial y acción de ingreso; sin enlaces de registro ni recuperación.
2. **CA-02** Shell autenticado en desktop usa sidebar lateral fija como navegación principal; en móvil usa barra inferior de cuatro destinos.
3. **CA-03** Cuatro destinos (Resumen, Detalle de mes, Cuentas, Configuración) tienen indicador de ruta activa con `accent-primary`.
4. **CA-04** Selector de periodo muestra etiqueta de mes/año y badge pasado/actual/futuro.
5. **CA-05** Controles anterior/siguiente de periodo tienen hit area mínima documentada (44×44 px, heredada de `10`).
6. **CA-06** Periodo consecutivo inexistente muestra rol visual informativo, no pantalla en blanco.
7. **CA-07** Error de acceso usa tratamiento `semantic-negative` sin exponer detalles técnicos.
8. **CA-08** Bootstrap de sesión evita flash de contenido financiero antes de validar sesión.
9. **CA-09** Tokens y tipografía heredados de `10` sin redefinición local.

## Verificación

| ID | Verificación documental |
|----|-------------------------|
| V-01 | Login no incluye registro ni recuperación de contraseña |
| V-02 | Cuatro destinos de navegación alineados con arquitectura §6 |
| V-03 | Selector incluye clasificador temporal |
| V-04 | Sin endpoints, SQL, Prisma, React, JSON, fixtures, importes concretos |
| V-05 | Estados de sesión cubren bootstrap, válida, expirada |
| V-06 | Sin placeholders |

## Impacto y riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Flash de datos antes de auth | Confianza y privacidad | Bootstrap full-screen |
| Selector de periodo oculto en móvil | Desorientación | Siempre en header |
| Mostrar registro/recuperación | Alcance MVP violado | Ausencias explícitas CA-01 |
| Navegación inconsistente con integración | Retrabajo de rutas | Alinear con arquitectura |

**Dependientes:** `12`–`14` renderizan dentro del shell; Integración `16` implementa guardas sin rediseñar composición.
