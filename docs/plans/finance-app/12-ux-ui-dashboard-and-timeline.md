# Dashboard y línea de tiempo

**Tipo:** UX/UI  
**Depende de:** [`02-functional-months-and-projections.md`](02-functional-months-and-projections.md), [`03-functional-accounts-and-movements.md`](03-functional-accounts-and-movements.md), [`04-functional-budgets-and-recurring.md`](04-functional-budgets-and-recurring.md), [`05-functional-credit-and-savings.md`](05-functional-credit-and-savings.md), [`10-ux-ui-visual-foundations.md`](10-ux-ui-visual-foundations.md), [`14-ux-ui-accounts-and-settings.md`](14-ux-ui-accounts-and-settings.md)  
**Implementa:** Composición visual del resumen mensual (dashboard), línea de tiempo de periodos, focal de ahorro/disponible/esperado-vs-real, alertas, sugerencias, navegación al detalle por categoría y por cuenta, y estados loading/empty/error/over-budget para la ruta de Resumen.  
**No incluye:** Funcionalidad, reglas de negocio, endpoints, SQL, Prisma, implementación React, JSON, fixtures, mock data, importes concretos, nombres de cuentas reales, payloads, detalle de editores de mes ni composición de pantallas de administración de cuentas (destino visual definido en `14`).

## Resultado

Tras autenticarse, el usuario llega a una vista que responde de un vistazo: cuánto puede ahorrar al cierre, cuánto efectivo hay disponible, cómo va el plan vs la realidad y qué periodos requieren atención. La línea de tiempo permite escanear meses en orden cronológico sin abrir el detalle completo.

## Contratos de entrada y salida

### Roles visuales — Resumen mensual (PRD §9.14)

Cada fila es un rol visual obligatorio en el dashboard; las definiciones numéricas pertenecen al spec funcional indicado.

| Rol | Jerarquía | Tratamiento | Dueño funcional |
|-----|-----------|-------------|-----------------|
| **Ingreso esperado** | Par comparativo (esperado) | Columna o bloque «Esperado» en par ingreso | [`03`](03-functional-accounts-and-movements.md) |
| **Ingreso recibido** | Par comparativo (real) | Columna o bloque «Real» en par ingreso | [`03`](03-functional-accounts-and-movements.md) |
| **Saldo inicial por cuenta** | Fila en resumen por cuenta | Etiqueta de cuenta + monto secundario; enlace desglose | [`03`](03-functional-accounts-and-movements.md) |
| **Gasto esperado** | Par comparativo (esperado) | Columna «Esperado» en par gasto | [`03`](03-functional-accounts-and-movements.md) |
| **Gasto real** | Par comparativo (real) | Columna «Real» en par gasto | [`03`](03-functional-accounts-and-movements.md) |
| **Restante real** | Métrica dedicada (primaria en par restante) | Etiqueta «Restante real» o «Presupuesto restante»; refleja lo aún no gastado frente al consumo realizado del periodo; distinta de gasto esperado y de gasto real; barra o monto con enlace de desglose; referencia semántica PRD §10.5 y [`04`](04-functional-budgets-and-recurring.md) | [`04`](04-functional-budgets-and-recurring.md) |
| **Restante proyectado** | Métrica adyacente (condicional) | Etiqueta «Restante proyectado»; visible solo cuando existen ítems planeados pendientes de realizar; refleja el margen restante considerando compromisos planeados no realizados; no sustituye ni oculta al restante real; referencia PRD §10.5 y [`04`](04-functional-budgets-and-recurring.md) | [`04`](04-functional-budgets-and-recurring.md) |
| **Crédito utilizado** | Métrica en panel crédito | Monto secundario bajo encabezado de panel; token `semantic-credit` | [`05`](05-functional-credit-and-savings.md) |
| **Crédito disponible** | Terciario en panel crédito | Separado del efectivo; iconografía `semantic-credit` | [`05`](05-functional-credit-and-savings.md) |
| **Pagos de tarjeta** | Fila o subtotal en panel crédito | Lista o agregado con enlace desglose; no confundir con gasto de consumo | [`05`](05-functional-credit-and-savings.md) |
| **Saldo fondo de ahorro** | Terciario en panel ahorro | Etiqueta «Saldo acumulado»; token `semantic-savings` | [`05`](05-functional-credit-and-savings.md) |
| **Retiro de efectivo** | Métrica en panel efectivo | Tratamiento `semantic-cash`; etiqueta de transferencia, no de gasto | [`04`](04-functional-budgets-and-recurring.md) |
| **Efectivo restante** | Métrica en panel efectivo | Distinto de disponible total y de Klar; token `semantic-cash` | [`04`](04-functional-budgets-and-recurring.md) |
| **Ahorro esperado** | Hero (Display) | Tarjeta focal superior; `semantic-positive` o `semantic-negative` según signo | [`05`](05-functional-credit-and-savings.md) |
| **Ahorro real** | Secundario junto al hero | Par plan vs real del ahorro del periodo; no confundir con saldo Klar | [`05`](05-functional-credit-and-savings.md) |
| **Diferencia plan vs realidad** | Fila resumen | Monto derivado con signo semántico | [`05`](05-functional-credit-and-savings.md) |
| **Advertencias relevantes** | Zona de alertas | Banners y badges según tipo (presupuesto, ahorro, límite) | [`04`](04-functional-budgets-and-recurring.md), [`05`](05-functional-credit-and-savings.md) |

#### Par restante real vs proyectado (PRD §10.5, [`04`](04-functional-budgets-and-recurring.md))

Dos roles visuales separados; las definiciones numéricas pertenecen al spec funcional dueño.

| Aspecto | Restante real | Restante proyectado |
|---------|---------------|---------------------|
| **Jerarquía** | Primario dentro del bloque de presupuesto restante | Secundario, adyacente o debajo del restante real |
| **Etiqueta** | «Restante real» o «Presupuesto restante» | «Restante proyectado» |
| **Cuándo mostrar** | Siempre que la categoría tenga límite aplicable | Solo cuando existan ítems planeados pendientes de realizar |
| **Comparación visual** | Par planeado/real/restante de la categoría; el restante real responde «cuánto queda vs lo ya consumido» | Mismo bloque de categoría; el restante proyectado responde «cuánto quedaría si se cumplieran los planeados pendientes»; cuando ambos son visibles, el proyectado debe leerse como escenario más conservador (típicamente menor o igual en magnitud favorable) |
| **Estados visuales** | Normal: token neutro o `semantic-positive`; cerca del límite: `semantic-warning` + barra de proximidad; superado: `semantic-negative` + tratamiento over-budget | Mismos estados semánticos evaluados sobre el margen proyectado; si el proyectado supera el límite pero el real no, priorizar alerta proyectada sin ocultar el restante real |
| **Empty / sin planeados** | Guía contextual o monto único | Oculto; no mostrar placeholder ni duplicar el restante real |

Aplica por categoría presupuestada (Servicios mensuales, Mandado, Salidas, Extras) y en el agregado de «falta por gastar» del dashboard cuando el resumen consolida categorías.

### Roles visuales — Navegación al detalle por categoría (PRD §9.14)

Affordance explícita desde el resumen mensual hacia la vista de detalle del periodo; rol de interfaz únicamente — sin endpoints, rutas nombradas ni lógica de negocio.

| Categoría | Rol de interfaz | Tratamiento visual | Accesibilidad |
|-----------|-----------------|-------------------|---------------|
| **Servicios mensuales** | Fila clicable o enlace de fila en bloque de categorías | Etiqueta de categoría + totales planeado/real/restante; icono chevron o texto «Ver detalle»; estado hover/focus visible | Nombre accesible: «Ver detalle de Servicios mensuales»; foco de teclado en toda la fila o en control dedicado |
| **Mandado** | Fila clicable o botón ghost en fila | Misma gramática que Servicios; distinción visual de grupo Mandado | «Ver detalle de Mandado» |
| **Salidas** | Fila clicable o enlace de fila | Misma gramática; grupo Salidas identificable | «Ver detalle de Salidas» |
| **Extras** | Fila clicable o enlace de fila | Misma gramática; grupo Extras identificable | «Ver detalle de Extras» |

- Las cuatro filas viven en una sección «Presupuesto por categoría» o equivalente dentro del resumen mensual, separada del hero de ahorro y de los paneles crédito/efectivo/Klar.
- Cada fila es un único objetivo de activación (no anidar botones conflictivos); el clic o Enter lleva al detalle del periodo enfocado en esa categoría (composición en [`13`](13-ux-ui-month-detail-and-editors.md)).
- En viewport estrecho: fila completa clicable con área táctil mínima coherente con `15`.

### Roles visuales — Navegación al detalle por cuenta (PRD §9.14)

Affordance explícita desde la sección «Resumen por cuenta» hacia la pantalla de detalle de cuenta; rol de interfaz únicamente — sin endpoints, rutas nombradas ni lógica de datos. Destino visual compuesto en [`14`](14-ux-ui-accounts-and-settings.md).

| Rol | Tratamiento visual | Accesibilidad |
|-----|-------------------|---------------|
| **Tarjeta o fila de cuenta** | Etiqueta de cuenta (rol genérico) + saldo inicial o monto derivado; fila o tarjeta compacta en zona «Resumen por cuenta» | Nombre accesible: «Ver detalle de [etiqueta de cuenta]» |
| **Indicador de navegación** | Chevron, icono de enlace o texto «Ver detalle» visible en hover/focus | Parte del nombre accesible o `aria-label` dedicado |
| **Estado hover** | Fondo sutil, borde o elevación leve sobre la tarjeta/fila | Contraste suficiente sin depender solo del color |
| **Estado focus** | Anillo `focus-ring` en fila completa o control dedicado | Tab order dentro de la sección Resumen por cuenta |
| **Estado activo / pressed** | Feedback visual de activación (pressed o selected transitorio) al confirmar la acción | — |

- Cada tarjeta o fila es un único objetivo de activación; no anidar controles conflictivos dentro del mismo destino.
- La sección «Resumen por cuenta» vive en el pie del dashboard, separada del hero de ahorro y de la navegación por categoría.
- En viewport estrecho: tarjeta completa clicable con área táctil mínima coherente con `15`.

### Roles visuales — Focal y agregados del dashboard

| Rol | Jerarquía | Tratamiento |
|-----|-----------|-------------|
| **Efectivo disponible** | Secundario destacado | Agregado consultable Débito + Efectivo (definición en [`03`](03-functional-accounts-and-movements.md)); enlace de desglose |
| **Gasto esperado vs real** | Par comparativo | Dos montos + barra o indicador de diferencia; gramática plan vs real |
| **Ingreso esperado vs recibido** | Par comparativo | Misma gramática visual que gasto |

### Roles visuales — Línea de tiempo

| Rol | Tratamiento |
|-----|-------------|
| **Fila de periodo** | Mes/año, badge temporal, mini-resumen de ahorro o alerta |
| **Periodo actual** | Énfasis en borde o fondo sutil |
| **Periodo con alerta** | Icono warning en fila |
| **Periodo seleccionado** | Estado selected en lista |
| **Acción abrir detalle** | Clic en fila o botón ghost «Ver detalle» |
| **Acción crear periodo futuro** | Botón al final de la lista o empty extendido |

Orden: cronológico ascendente (más antiguo arriba o izquierda según orientación).

### Roles visuales — Alertas y sugerencias

| Rol | Tratamiento |
|-----|-------------|
| **Alerta de presupuesto** | Banner `semantic-warning` o badge en categoría afectada |
| **Alerta de ahorro negativo** | Banner `semantic-negative` bajo focal de ahorro |
| **Alerta de límite superado** | Barra over-budget + mensaje corto |
| **Sugerencia informativa** | Tarjeta `semantic-info` con título, explicación de origen, acciones aceptar/descartar |
| **Lista de sugerencias** | Sección colapsable bajo métricas; no compite con focal |

Las sugerencias nunca muestran controles que impliquen cambio automático de datos; «aceptar» es navegación o enfoque, no commit silencioso.

### Roles visuales — Desglose desde resumen

| Punto de origen | Destino visual |
|-----------------|----------------|
| Cualquier total agregado | Panel lateral o modal con lista de registros explicativos |
| Enlace de desglose | Icono + texto «Ver desglose» en tarjeta de métrica |
| Fila de desglose | Concepto, fecha, monto, estado, enlace a origen |

### Layout del dashboard (desktop)

```
┌──────────────────────────────────────────────────────────────┐
│  [AHORRO ESPERADO — hero]  [Ahorro real | Diferencia]   [Alertas críticas]   │
├────────────────────────────┬─────────────────────────────────┤
│  Disponible │ Rest. real   │  Línea de tiempo (scroll)       │
│  Ingreso e/r│ Rest. proj.  │  • periodo …                   │
│  Gasto e/r  │ Cat. → det.  │  • periodo actual ★            │
│  Crédito u/d│ Serv/Mand/   │                                 │
│  Pagos tarj.│ Sal/Ext      │                                 │
│  Klar saldo │ Retiro/Rest. │                                 │
├────────────────────────────┴─────────────────────────────────┤
│  Sugerencias informativas (colapsable)                        │
├──────────────────────────────────────────────────────────────┤
│  Resumen por cuenta (tarjetas compactas o lista)             │
└──────────────────────────────────────────────────────────────┘
```

### Estados visuales por zona

| Zona | Loading | Empty | Error | Over-budget |
|------|---------|-------|-------|-------------|
| Focal ahorro | Skeleton display | «Sin proyección» + CTA configurar mes | Banner error + reintentar | Monto en `semantic-negative` + alerta |
| Pares esperado/real | Skeleton pares | Guía contextual | Error parcial; resto visible | Barra roja en categoría |
| Línea de tiempo | Skeleton filas | Empty «Aún no hay periodos» + crear | Error lista + reintentar | Icono warning en filas afectadas |
| Sugerencias | Oculto o skeleton | Sección oculta | No bloquea dashboard | — |
| Resumen cuentas | Skeleton tarjetas | Empty cuentas + enlace a Cuentas | Error zona aislada | — |
| Navegación por cuenta | Skeleton tarjetas | Tarjetas ocultas si no hay cuentas activas | Error aislado en sección | — |
| Restante real / proyectado | Skeleton par de montos | Restante real solo; proyectado oculto | Error parcial | Barra warning por rol; over-budget independiente en real y proyectado |
| Navegación por categoría | Skeleton filas | Filas ocultas si categoría vacía sin límite | Error aislado en sección | Badge warning en fila de categoría afectada |

### Gramática plan vs real

- Siempre tres columnas o bloques alineados: **Esperado** | **Real** | **Diferencia** (convención visual; definición de cada total en specs funcionales dueños).
- Diferencia con signo explícito (+/−) y color semántico moderado; no solo color (ver `15`).
- En viewport estrecho: apilar con etiquetas claras; mantener tabular nums.

## Tareas

1. Definir jerarquía focal: ahorro esperado como hero y ahorro real como par visible.
2. Componer pares esperado/real para ingreso y gasto; par restante real vs restante proyectado con jerarquía, etiquetas, comparación y estados según PRD §10.5 y [`04`](04-functional-budgets-and-recurring.md).
3. Cubrir todos los roles PRD §9.14 con dueño funcional referenciado.
4. Definir affordance de navegación visual desde resumen mensual hacia detalle por categoría: Servicios mensuales, Mandado, Salidas y Extras (fila clicable, focus, etiqueta accesible).
5. Definir affordance de navegación visual desde Resumen por cuenta hacia detalle de cuenta (tarjeta/fila clicable, hover/focus/activo, etiqueta accesible; destino en `14`).
6. Diseñar línea de tiempo con clasificador temporal y mini-resumen.
7. Especificar paneles separados para crédito (`semantic-credit`), efectivo (`semantic-cash`) y fondo de ahorro (`semantic-savings`).
8. Documentar alertas, over-budget y lista de sugerencias informativas.
9. Definir estados loading, empty, error por zona independiente.
10. Especificar puntos de enlace a desglose explicativo.

## Criterios de aceptación

1. **CA-01** Ahorro esperado es el elemento visual dominante del dashboard; ahorro real aparece en par o bloque adyacente.
2. **CA-02** Efectivo disponible, crédito (utilizado/disponible), retiro, efectivo restante y saldo de fondo de ahorro no comparten una sola tarjeta sin etiquetas distintivas ni tokens `semantic-cash` / `semantic-credit` / `semantic-savings`.
3. **CA-03** Ingreso y gasto muestran par esperado/real/diferencia con gramática consistente.
4. **CA-04** Restante real y restante proyectado están documentados como roles visuales separados: jerarquía (real primario, proyectado condicional), etiquetas distintas, comparación en bloque de categoría y estados normal/warning/over-budget independientes; alineados con PRD §10.5 y [`04`](04-functional-budgets-and-recurring.md); sin fórmulas técnicas en este spec.
5. **CA-05** Resumen mensual incluye affordance de navegación explícita hacia detalle por categoría para Servicios mensuales, Mandado, Salidas y Extras: fila clicable o enlace visual, estado focus y etiqueta accesible por categoría; sin endpoints ni lógica de negocio.
6. **CA-06** Resumen por cuenta incluye affordance de navegación explícita hacia detalle de cuenta: tarjeta o fila clicable, estados hover/focus/activo, indicador «Ver detalle» y etiqueta accesible por cuenta; destino visual en `14`; sin endpoints ni lógica de negocio.
7. **CA-07** Resumen mensual incluye roles visuales para saldo inicial por cuenta, pagos de tarjeta, retiro de efectivo y ahorro real (PRD §9.14).
8. **CA-08** Línea de tiempo ordena periodos cronológicamente con badge pasado/actual/futuro.
9. **CA-09** Periodo actual tiene énfasis visual identificable.
10. **CA-10** Alerta de presupuesto y alerta de ahorro negativo usan tokens semánticos definidos en `10`.
11. **CA-11** Sugerencias muestran explicación de origen y acciones aceptar/descartar sin implicar auto-guardado.
12. **CA-12** Totales agregados incluyen enlace de desglose visible.
13. **CA-13** Error en una zona no oculta el resto del dashboard cuando hay datos parciales.
14. **CA-14** Sin importes concretos, JSON, fixtures ni nombres de cuentas reales en el spec.

## Verificación

| ID | Verificación documental |
|----|-------------------------|
| V-01 | Tabla PRD §9.14 cubre los roles mínimos con dueño funcional referenciado, incluidos restante real y restante proyectado como roles separados |
| V-02 | Par restante real vs proyectado alineado con PRD §10.5 y `04`: jerarquía, etiquetas, comparación, visibilidad condicional del proyectado y estados over-budget |
| V-03 | Navegación al detalle por categoría documentada para Servicios mensuales, Mandado, Salidas y Extras con rol de interfaz, focus y labels accesibles |
| V-04 | Navegación al detalle por cuenta documentada en Resumen por cuenta: hover/focus/activo, indicador «Ver detalle», etiqueta accesible y destino visual referenciado en `14` |
| V-05 | Línea de tiempo alineada con `02` clasificación pasado/actual/futuro |
| V-06 | Separación ahorro del mes vs saldo Klar vs efectivo restante reflejada en layout y tokens |
| V-07 | Estados loading/empty/error documentados por zona, incluidos restante, navegación por categoría y navegación por cuenta |
| V-08 | Sin endpoints, SQL, Prisma, React, payloads |
| V-09 | Sin placeholders, importes concretos, JSON, fixtures ni mock data |

## Impacto y riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Confundir crédito con efectivo | Decisiones erróneas | Paneles separados CA-02 |
| Hero incorrecto | Prioridad de producto diluida | Ahorro al cierre como Display |
| Timeline ilegible en muchos meses | Scroll infinito confuso | Mini-resumen y alertas en fila |
| Sugerencias compiten con métricas | Ruido visual | Sección colapsable |
| Error full-page | Pérdida de contexto | Errores por zona CA-12 |
| Confundir restante real con proyectado | Subestimar compromisos planeados | Dos roles, etiquetas y visibilidad condicional CA-04 |
| Categorías sin entrada al detalle | Usuario no profundiza presupuesto | Filas navegables CA-05 |
| Cuentas sin entrada al detalle | Usuario no explora saldo por cuenta | Tarjetas navegables CA-06 |

**Dependientes:** Integración `18` (tracer dashboard); `13` consume handoff por categoría; `15` adapta layout móvil.
