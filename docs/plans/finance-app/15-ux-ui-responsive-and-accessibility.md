# Responsive y accesibilidad

**Tipo:** UX/UI  
**Depende de:** [`10-ux-ui-visual-foundations.md`](10-ux-ui-visual-foundations.md), [`11-ux-ui-auth-and-app-shell.md`](11-ux-ui-auth-and-app-shell.md), [`12-ux-ui-dashboard-and-timeline.md`](12-ux-ui-dashboard-and-timeline.md), [`13-ux-ui-month-detail-and-editors.md`](13-ux-ui-month-detail-and-editors.md), [`14-ux-ui-accounts-and-settings.md`](14-ux-ui-accounts-and-settings.md)  
**Implementa:** Reglas transversales de layout responsive (desktop, tablet, móvil), navegación por teclado, contraste, focus, hit areas, reduced motion, errores de campo y patrones de feedback accesible para toda la SPA.  
**No incluye:** Funcionalidad, reglas de negocio, endpoints, SQL, Prisma, implementación React, JSON, fixtures, mock data, importes concretos, nombres de cuentas reales, payloads, redefinición de tokens base (ver `10`) ni diseño de pantallas individuales desde cero.

## Resultado

La aplicación es usable en desktop, tablet y móvil, operable por teclado, legible bajo criterios de contraste, respetuosa de preferencias de movimiento reducido, y clara en errores de campo y fallos de zona — sin sacrificar la jerarquía focal de ahorro, disponible y alertas definida en specs anteriores.

## Contratos de entrada y salida

### Breakpoints y layout

| Breakpoint | Rango orientativo | Shell | Contenido |
|------------|-------------------|-------|-----------|
| **Desktop** | ≥ 1024 px | Sidebar lateral fija (`11`) + header | Multi-columna; tablas completas |
| **Tablet** | 768–1023 px | Nav colapsada a iconos | Dos columnas donde cabe; drawer filtros |
| **Mobile** | < 768 px | Nav inferior + header compacto | Una columna; sheets full-screen |

Regla: el **focal de ahorro** permanece primero en el orden de lectura en todos los breakpoints.

### Adaptaciones por pantalla

| Pantalla | Desktop | Tablet | Mobile |
|----------|---------|--------|--------|
| **Login** | Card centrada max-width | Card centrada | Full width con padding |
| **Dashboard** | Grid 2–3 columnas | 2 columnas | Stack vertical; timeline horizontal scroll opcional |
| **Detalle mes** | Tabs horizontales | Tabs scrollables | Accordion por sección o bottom sheet nav |
| **Tabla movimientos** | Todas columnas | Ocultar columnas secundarias | Card por fila; swipe acciones opcional |
| **Formularios** | Modal centrado | Drawer lateral | Full-screen sheet |
| **Diálogo impacto** | Modal ancho | Drawer | Full-screen con scroll |
| **Cuentas / Config** | Tabla/lista ancha | Lista | Lista full width |

### Roles visuales — Navegación móvil

| Rol | Tratamiento |
|-----|-------------|
| **Barra inferior** | Cuatro iconos + etiqueta corta |
| **Selector periodo** | Compacto en header; expande a sheet |
| **FAB agregar** | Esquina inferior derecha en listas (movimientos, extras) |
| **Filtros** | Botón abre drawer; chips activos bajo header |

### Teclado y focus

| Requisito | Especificación visual |
|-----------|----------------------|
| **Orden de tabulación** | Lógico: header → nav → contenido principal → acciones pie |
| **Focus visible** | Anillo `focus-ring` 2 px offset en todos los interactivos |
| **Skip link** | «Saltar al contenido» visible al foco en primera tab |
| **Traps de foco** | Modales y sheets atrapan foco; Escape cierra |
| **Atajos opcionales** | No requeridos en MVP; si existen, no conflictúan con inputs |
| **Dropdown periodo** | Flechas navegan lista; Enter selecciona |

### Contraste y legibilidad

| Elemento | Criterio |
|----------|----------|
| **Texto primary sobre surface-base** | Ratio ≥ 4.5:1 (WCAG AA) |
| **Texto secondary** | Ratio ≥ 4.5:1 sobre su superficie |
| **Montos semánticos positive/negative** | No solo color: incluir signo o icono |
| **Badges de estado** | Texto + fondo con contraste ≥ 4.5:1 |
| **Bordes de input error** | `semantic-negative` + icono error |
| **Placeholders** | No sustituyen labels; contraste ≥ 3:1 |

### Hit areas y touch

| Control | Tamaño mínimo |
|---------|---------------|
| **Botones** | 44×44 px área táctil |
| **Iconos accionables** | Padding hasta 44×44 px |
| **Filas de lista** | Altura mínima 48 px en móvil |
| **Checkboxes / switches** | 44×44 px incluyendo label clickeable |
| **Tabs** | 44 px altura |

Separación mínima 8 px entre targets táctiles adyacentes.

### Reduced motion

| Preferencia | Comportamiento |
|-------------|----------------|
| **`prefers-reduced-motion: reduce`** | Desactivar animaciones de entrada/salida; skeleton sin pulso o pulso mínimo |
| **Transiciones** | Instantáneas o ≤ 50 ms |
| **Barra de progreso** | Actualización sin animación de relleno |
| **Toast** | Aparece/desaparece sin slide |
| **Preferencia in-app** | Toggle en Configuración refuerza comportamiento |

### Errores visuales

| Tipo | Presentación |
|------|--------------|
| **Error de campo** | Borde `semantic-negative`, icono, mensaje bajo campo; label asociada por `aria-describedby` |
| **Error de formulario** | Resumen arriba del formulario con lista de campos |
| **Error de zona** | Banner en sección (dashboard, tabla) con acción reintentar |
| **Error global / red** | Banner shell o toast persistente |
| **Conflicto concurrencia** | Diálogo modal explicativo; acción recargar |
| **Sesión expirada** | Banner o redirect según `11` |

Mensajes en lenguaje claro; sin códigos técnicos visibles al usuario.

### Feedback accesible

| Evento | Feedback |
|--------|----------|
| **Guardado exitoso** | Toast + anuncio para lectores de pantalla |
| **Eliminación** | Confirmación previa + toast |
| **Carga** | `aria-busy` en zona; skeleton visible |
| **Empty** | Texto descriptivo en región principal |

### Tablas y listas densas

- Header sticky en scroll vertical.
- Primera columna (concepto o fecha) sticky en scroll horizontal móvil.
- `content-visibility: auto` recomendado en filas fuera de viewport (patrón de rendimiento visual).
- Opción densidad compacta reduce padding según preferencia `14`.

### Orientación y safe areas

- Respetar safe-area-inset en nav inferior iOS.
- Landscape móvil: mantener nav accesible; reducir padding vertical hero.

## Tareas

1. Definir breakpoints y matriz de adaptación por pantalla principal.
2. Especificar shell móvil con nav inferior y selector compacto.
3. Documentar requisitos de teclado, focus ring y skip link.
4. Fijar criterios de contraste y redundancia no solo color.
5. Definir hit areas mínimas y espaciado touch.
6. Documentar comportamiento reduced motion.
7. Especificar patrones de error de campo, zona y global.

## Criterios de aceptación

1. **CA-01** Focal de ahorro es el primer bloque en orden de lectura en móvil y desktop.
2. **CA-02** Todos los controles interactivos tienen focus visible con token `focus-ring`.
3. **CA-03** Skip link «Saltar al contenido» documentado para shell autenticado.
4. **CA-04** Modales y sheets atrapan foco y cierran con Escape.
5. **CA-05** Montos positivos/negativos no dependen solo del color (signo o icono).
6. **CA-06** Hit areas ≥ 44×44 px en controles primarios móviles.
7. **CA-07** `prefers-reduced-motion` desactiva animaciones no esenciales.
8. **CA-08** Errores de campo muestran mensaje asociado bajo el control.
9. **CA-09** Tabla de movimientos tiene estrategia móvil (cards o scroll) documentada.
10. **CA-10** Diálogo de impacto es usable full-screen en móvil con scroll.
11. **CA-11** Sin importes concretos, JSON, fixtures, endpoints ni payloads.

## Verificación

| ID | Verificación documental |
|----|-------------------------|
| V-01 | Breakpoints cubren desktop, tablet, móvil |
| V-02 | Focus, contraste y hit areas documentados |
| V-03 | Reduced motion alineado con arquitectura §11 |
| V-04 | Errores de campo y zona distinguibles |
| V-05 | Dependencias `10`–`14` reflejadas en matriz de adaptación (shell, dashboard, detalle, cuentas) |
| V-06 | Sin placeholders; sin redefinición de tokens de `10` |

## Impacto y riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Tablas inutilizables en móvil | Captura imposible | Estrategia cards CA-09 |
| Focus invisible | Exclusión teclado | focus-ring obligatorio |
| Solo color para signo | Accesibilidad fallida | Signo/icono CA-05 |
| Animaciones mareantes | Malestar | Reduced motion CA-07 |
| Diálogo impacto cortado | Confirmación ciega | Full-screen scroll CA-10 |

**Dependientes:** Implementación en `repos/finance-app` debe verificar manualmente en tres anchos sobre shell (`11`), dashboard (`12`), detalle (`13`) y cuentas/config (`14`); Integración E2E (`21`) usa mismos roles visuales.
