# Detalle de mes y editores visuales

**Tipo:** UX/UI  
**Depende de:** [`03-functional-accounts-and-movements.md`](03-functional-accounts-and-movements.md), [`04-functional-budgets-and-recurring.md`](04-functional-budgets-and-recurring.md), [`05-functional-credit-and-savings.md`](05-functional-credit-and-savings.md), [`10-ux-ui-visual-foundations.md`](10-ux-ui-visual-foundations.md), [`12-ux-ui-dashboard-and-timeline.md`](12-ux-ui-dashboard-and-timeline.md)  
**Implementa:** Composición visual de la pantalla de detalle de periodo: secciones Servicios, Mandado, Salidas, Extras, movimientos, Crédito, Fondo Klar, retiro de efectivo, formularios de captura, filtros, visibilidad, estado de llegada desde dashboard por categoría, y diálogo de impacto de propagación.  
**No incluye:** Funcionalidad, reglas de negocio, endpoints, SQL, Prisma, implementación React, JSON, fixtures, mock data, importes concretos, nombres de cuentas reales, payloads, pantallas de cuentas/configuración globales ni reglas transversales responsive (ver `15`).

## Resultado

El usuario edita un periodo en una vista estructurada por secciones reconocibles (como la hoja de cálculo mental que reemplaza), con editores visuales consistentes, estados de ítem claros, distinción transferencia vs gasto, y confirmación visual antes de cambios que se propagan a meses futuros.

## Contratos de entrada y salida

### Anatomía de la página de detalle

```
┌──────────────── Header: periodo + badge temporal + nav ◀ ▶ ────────────────┐
├─ Resumen compacto del periodo (métricas clave, enlace a dashboard) ───────┤
├─ [Tabs o anclas] Servicios | Mandado | Salidas | Extras | Movimientos | …  │
├─ Sección activa ───────────────────────────────────────────────────────────┤
│   Encabezado: título + totales planeado/real/restante (convención visual; cálculo en [`03`](03-functional-accounts-and-movements.md) / [`04`](04-functional-budgets-and-recurring.md)) + acción agregar     │
│   Lista de ítems o tabla                                                    │
│   Pie: barra de progreso de presupuesto (si aplica)                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

Navegación secundaria sticky bajo header en scroll largo.

### Handoff desde dashboard por categoría (PRD §9.14, origen en `12`)

Estado visual de llegada cuando el usuario activa una fila de categoría en el resumen mensual (Servicios mensuales, Mandado, Salidas o Extras). Solo composición de interfaz — sin rutas, endpoints ni lógica de datos.

| Aspecto | Tratamiento visual |
|---------|-------------------|
| **Sección activa** | Tab o ancla de la categoría correspondiente preseleccionado y resaltado (`selected`) en navegación secundaria |
| **Scroll y foco** | Viewport desplazado para que el encabezado de la sección activa quede visible bajo el header sticky; foco inicial en encabezado de sección o primer control accionable de la sección |
| **Título y contexto** | Header conserva etiqueta de periodo (`11`); subtítulo, breadcrumb o badge indica categoría enfocada (p. ej. «Mandado — detalle del periodo») |
| **Regreso** | Control «Volver al resumen» o breadcrumb clicable hacia el dashboard del mismo periodo; estado focus coherente con shell `11` |
| **Resumen compacto** | Bloque compacto del periodo permanece visible o colapsable; no oculta contexto temporal |

- El periodo mostrado coincide con el selector de mes del shell; no se redefine aquí.
- Las cuatro categorías presupuestadas comparten la misma gramática de llegada; solo cambia la sección activa y el copy de contexto.
- Si el usuario llega por otra vía (timeline, nav directa), no aplica preselección de categoría; navegación secundaria inicia sin sección forzada.

### Roles visuales — Sección Servicios

| Rol | Tratamiento |
|-----|-------------|
| **Fila de servicio** | Nombre, monto esperado, cuenta de pago, fecha esperada, badge estado |
| **Servicio pausado** | Fila atenuada + badge «Pausado» |
| **Monto real distinto** | Real junto a esperado; diferencia resaltada si aplica |
| **Total de servicios** | Subheader numérico con enlace desglose |
| **Acción agregar servicio** | Botón secundario en encabezado |
| **Empty servicios** | Estado vacío con CTA agregar |

### Roles visuales — Sección Mandado

| Rol | Tratamiento |
|-----|-------------|
| **Ítem de compra planeado** | Número o etiqueta de slot, presupuesto, fecha, estado |
| **Compra extraordinaria** | Misma fila + badge «Extraordinaria» |
| **Marcador override** | Icono o borde `Marcador de override` si difiere de plantilla |
| **Totales Mandado** | Planeado / real / restante en encabezado |
| **Acciones por ítem** | Editar, registrar real, cancelar, eliminar (futuro), observaciones |
| **Barra de progreso** | Límite vs consumo visual; umbrales warning/over-budget (definición de límites en [`04`](04-functional-budgets-and-recurring.md)) |

### Roles visuales — Sección Salidas

Misma gramática visual que Mandado con cuatro slots base implícitos en la estructura (estructura de slots en [`04`](04-functional-budgets-and-recurring.md)). Etiqueta de sección «Salidas»; totales planeado/real/restante.

### Roles visuales — Sección Extras

| Rol | Tratamiento |
|-----|-------------|
| **Presupuesto mensual Extras** | Métrica en encabezado + restante real y proyectado como roles separados (definición en [`04`](04-functional-budgets-and-recurring.md)) |
| **Fila de extra** | Fecha, categoría de extra, monto planeado/real, cuenta, estado |
| **Categoría personalizada** | Etiqueta de categoría con icono distintivo leve |
| **Acción nueva categoría** | En flujo de creación de extra o enlace a Configuración |
| **Lista densa** | Permite varios extras; variante compacta de tabla |

### Roles visuales — Retiro de efectivo

| Rol | Tratamiento |
|-----|-------------|
| **Bloque retiro combinado** | Panel `semantic-transfer`; etiqueta explícita «Transferencia a Efectivo» (naturaleza transferencia en [`04`](04-functional-budgets-and-recurring.md)) |
| **Monto del retiro** | Monto principal; marcador override si aplica |
| **Cuenta origen → Efectivo** | Diagrama inline origen → icono → destino |
| **Estado de cobertura** | Badge suficiente / insuficiente / excedente (reglas en [`04`](04-functional-budgets-and-recurring.md)) |
| **Efectivo restante** | Métrica separada debajo; enlace desglose (definición en [`04`](04-functional-budgets-and-recurring.md)) |
| **Advertencia visual** | `semantic-warning` o `semantic-negative` si cobertura insuficiente |

Nunca presentar el retiro con el mismo tratamiento visual que un gasto de categoría.

### Roles visuales — Movimientos

| Rol | Tratamiento |
|-----|-------------|
| **Tabla de movimientos** | Columnas: fecha, concepto, categoría, cuenta, monto, estado, acciones |
| **Fila planeado** | Badge `semantic-planned`; opcional atenuación |
| **Fila realizado** | Badge `semantic-realized` |
| **Fila cancelado** | Badge `semantic-cancelled`; tachado leve |
| **Fila transferencia** | Badge `semantic-transfer`; sin columna categoría de gasto |
| **Fila oculta por preferencia** | Opacidad reducida + icono ojo tachado |
| **Barra de filtros** | Estado, cuenta, categoría, rango de fechas; chips activos |
| **Toggle visibilidad** | Ocultar planeados / cancelados; copy que aclara que totales del resumen no cambian (regla de visibilidad en [`03`](03-functional-accounts-and-movements.md)) |
| **Acción agregar movimiento** | FAB en móvil o botón primario en desktop |

### Roles visuales — Panel Crédito

| Rol | Tratamiento |
|-----|-------------|
| **Resumen por tarjeta** | Límite, deuda, crédito utilizado, crédito disponible (definiciones en [`05`](05-functional-credit-and-savings.md)) |
| **Crédito disponible proyectado** | Línea secundaria si hay compras planeadas (proyección en [`05`](05-functional-credit-and-savings.md)) |
| **Lista compras** | Fecha, concepto, monto, estado planeado/realizado |
| **Lista pagos** | Origen (Débito o fondo), tarjeta destino, monto, estado (anti doble conteo en [`05`](05-functional-credit-and-savings.md)) |
| **Acción agregar compra / pago** | Botones separados; nunca un solo «gasto» genérico |
| **Empty crédito** | Mensaje: sin compras hasta que el usuario agregue |

Panel usa token `semantic-credit` en encabezado.

### Roles visuales — Panel Fondo Klar

| Rol | Tratamiento |
|-----|-------------|
| **Saldo acumulado** | Display secundario; etiqueta «Saldo acumulado» vs «Ahorro del mes» (distinción en [`05`](05-functional-credit-and-savings.md)) |
| **Movimientos del periodo** | Depósitos, retiros, pagos desde fondo |
| **Línea de movimiento** | Tipo, fecha, monto, saldo posterior (rol consultable) |
| **Acciones** | Depositar, retirar, pagar tarjeta desde fondo |
| **Empty movimientos** | Estado vacío con acciones sugeridas |

Panel usa token `semantic-savings`.

### Roles visuales — Ingreso del periodo

| Bloque | Contenido |
|--------|-----------|
| **Ingreso mensual esperado** | Campo editable inline o en modal |
| **Ingresos extraordinarios** | Sublista con fecha, concepto, monto, estado |
| **Par esperado/recibido** | Misma gramática que dashboard (totales de ingreso en [`03`](03-functional-accounts-and-movements.md)) |

### Editor visual de formulario (patrón compartido)

| Elemento | Tratamiento |
|----------|-------------|
| **Modal o drawer** | Drawer en desktop ancho; full-screen sheet en móvil |
| **Campos** | Label, input, hint según tipo de dato |
| **Selector de cuenta** | Lista con icono de tipo de cuenta |
| **Selector de categoría** | Lista agrupada |
| **Selector de fecha** | Calendario; fecha calendario sin ambigüedad de zona |
| **Selector de estado** | Segmented control o radio: planeado / realizado / cancelado |
| **Montos planeado y real** | Dos campos; real visible solo si estado lo requiere |
| **Observaciones** | Textarea opcional colapsable |
| **Alcance de cambio** | Radio «Solo este periodo» / «Este periodo y futuros» cuando aplique plantilla (propagación en [`02`](02-functional-months-and-projections.md)) |
| **Acciones** | Cancelar (ghost) + Guardar (primario); destructivo separado |

### Diálogo de impacto de propagación

| Zona | Contenido visual |
|------|------------------|
| **Título** | «Impacto en meses futuros» o equivalente |
| **Periodo origen** | Rol **Etiqueta de periodo** destacado |
| **Lista de periodos afectados** | Filas mes/año con deltas resumidos (previsualización en [`02`](02-functional-months-and-projections.md)) |
| **Tabla de deltas** | Columnas: concepto afectado, Δ gasto esperado, Δ ahorro, Δ saldo (roles visuales; sin redefinir fórmulas) |
| **Conflicto override** | Sección warning listando overrides que serían sobrescritos (conflictos en [`02`](02-functional-months-and-projections.md)) |
| **Acciones** | Descartar (secundario), Confirmar (primario destructivo suave o primario según severidad) |
| **Estado loading confirmación** | Botón primario en loading; modal no cerrable |

Previsualización es lectura; no indica guardado hasta confirmar.

### Estados visuales por sección

| Sección | Loading | Empty | Error |
|---------|---------|-------|-------|
| Servicios | Skeleton filas | Empty + CTA | Banner sección |
| Mandado / Salidas | Skeleton slots | Empty estructura base | Banner sección |
| Extras | Skeleton | Empty presupuesto | Banner sección |
| Movimientos | Skeleton tabla | Empty movimientos | Banner + filas previas si cache |
| Crédito | Skeleton panel | Empty informativo | Banner panel |
| Klar | Skeleton panel | Empty informativo | Banner panel |
| Retiro | Skeleton bloque | — | Banner bloque |

## Tareas

1. Definir anatomía de página y navegación secundaria entre secciones.
2. Documentar estado visual de llegada desde dashboard por categoría: sección activa, scroll/foco, título/contexto y regreso (PRD §9.14, origen en `12`).
3. Especificar editores visuales de Servicios, Mandado, Salidas y Extras con totales y barras.
4. Diseñar bloque de retiro como transferencia con estado de cobertura.
5. Documentar tabla de movimientos, filtros y toggles de visibilidad.
6. Componer paneles Crédito y Fondo Klar con listas separadas compra/pago.
7. Definir patrón de formulario modal/drawer compartido.
8. Diseñar diálogo de impacto de propagación con deltas y conflictos override.

## Criterios de aceptación

1. **CA-01** Cada sección (Servicios, Mandado, Salidas, Extras, Movimientos, Crédito, Klar, Retiro) tiene encabezado con totales planeado/real/restante cuando aplica.
2. **CA-02** Al llegar desde dashboard por categoría, la sección correspondiente queda activa, visible en viewport, con contexto de categoría en título/breadcrumb y control de regreso al resumen del mismo periodo; sin rutas ni lógica de datos.
3. **CA-03** Retiro usa tratamiento `semantic-transfer` y nunca aparece como fila de gasto ordinario.
4. **CA-04** Estado de cobertura del retiro (suficiente/insuficiente/excedente) es badge visible en el bloque retiro (reglas en [`04`](04-functional-budgets-and-recurring.md)).
5. **CA-05** Movimientos distinguen planeado, realizado, cancelado y transferencia en badge y estilo de fila.
6. **CA-06** Filtros y ocultar registros incluyen copy de que totales del resumen no cambian (alineado con [`03`](03-functional-accounts-and-movements.md)).
7. **CA-07** Panel Crédito separa visualmente compras y pagos; panel Klar separa saldo acumulado de ahorro del mes.
8. **CA-08** Marcador de override visible en ítems que difieren de plantilla.
9. **CA-09** Diálogo de impacto lista periodos afectados y deltas antes de confirmar.
10. **CA-10** Diálogo muestra sección de conflicto override cuando aplica.
11. **CA-11** Formularios incluyen selector de alcance solo cuando el flujo lo requiere visualmente.
12. **CA-12** Sin importes concretos, JSON, fixtures, nombres de cuentas reales ni payloads.

## Verificación

| ID | Verificación documental |
|----|-------------------------|
| V-01 | Handoff desde dashboard por categoría documentado: sección activa, scroll/foco, título/contexto y regreso; alineado con affordance de `12` |
| V-02 | Retiro no usa tratamiento de gasto |
| V-03 | Crédito y Klar alineados con separación de `05` y `10` |
| V-04 | Visibilidad documentada sin implicar cambio de totales |
| V-05 | Diálogo de impacto alineado con previsualización de `02` |
| V-06 | Overrides visualmente distinguibles |
| V-07 | Sin endpoints, SQL, Prisma, React, placeholders |
| V-08 | Sin datos concretos inventados |

## Impacto y riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Retiro parece gasto | Doble conteo percibido | Panel transferencia CA-02 |
| Crédito mezclado con débito | Confusión de disponible | Paneles separados CA-06 |
| Formularios inconsistentes | Curva de aprendizaje | Patrón modal compartido |
| Diálogo de impacto críptico | Propagación accidental | Tabla de deltas CA-08 |
| Página demasiado larga | Pérdida de contexto | Nav secundaria sticky |
| Llegada sin contexto de categoría | Usuario desorientado | Handoff documentado CA-02 |

**Dependientes:** `15` adapta secciones a móvil; Integración `19`–`20` conecta mutaciones sin rediseñar layout.
