# Cuentas configurables, ingresos y movimientos

**Tipo:** Functional  
**Depende de:** [`01-functional-domain-and-rules.md`](01-functional-domain-and-rules.md), [`docs/briefs/finance-app/prd.md`](../../briefs/finance-app/prd.md)  
**Implementa:** Cuentas configurables por usuario; categorías personalizadas; ingreso mensual e ingresos extraordinarios; movimientos con fecha exacta y estados; filtros; visibilidad; desglose explicativo de ingresos/gastos/presupuesto y desglose del resumen de cuentas; desactivación sin pérdida de historial.  
**No incluye:** Endpoints, SQL, Prisma, React, Express, componentes, nombres de archivos de implementación, fixtures de integración, propagación de periodos (ver `02`), presupuestos Mandado/Salidas/Extras (ver `04`), crédito/Klar/ahorro (ver `05`).

## Resultado

El usuario define y administra sus cuentas y categorías personalizadas, registra ingresos esperados y recibidos, captura movimientos con fecha calendario y estado (planeado, realizado, cancelado), consulta qué movimientos explican cada total, filtra y oculta registros en la vista sin alterar totales, y desactiva cuentas o categorías conservando su papel en el historial.

## Contratos de entrada y salida

### Entradas conceptuales — Cuentas

| Campo / acción | Descripción |
|----------------|-------------|
| Nombre | Etiqueta visible elegida por el usuario |
| Tipo | Débito, Efectivo, Crédito, Fondo de ahorro, Otro |
| Saldo inicial | Punto de partida al crear la cuenta |
| Participación en proyecciones | Indica si la cuenta entra en cálculos proyectados |
| Límite y deuda inicial | Solo cuentas de crédito (detalle de cálculo en `05`) |
| Fechas de corte/pago | Opcionales para crédito |
| Fecha de inicio | Desde cuándo aplica la cuenta |
| Acciones | Agregar, editar, renombrar, desactivar; eliminar solo sin historial dependiente |

### Entradas conceptuales — Categorías personalizadas

Las categorías agrupan movimientos para presupuestos y reportes. Además de categorías base del producto (Servicios, Mandado, Salidas, Extras), el usuario puede definir **categorías personalizadas** — principalmente para Extras, pero aplicables a cualquier movimiento que requiera clasificación.

| Campo / acción | Descripción |
|----------------|-------------|
| Nombre | Etiqueta visible elegida por el usuario |
| Grupo padre | Categoría base a la que pertenece (p. ej. Extras) |
| Acciones | Crear, renombrar, desactivar; eliminar solo sin historial dependiente |

### Salidas conceptuales — Categorías personalizadas

| Salida | Descripción |
|--------|-------------|
| Lista de categorías activas | Usables en nuevos movimientos |
| Categorías históricas | Inactivas pero visibles en periodos pasados |
| Movimientos por categoría | Libro filtrable asociado a la categoría |

### Reglas de categorías personalizadas (CRUD conceptual)

1. **Crear:** el usuario define una categoría nueva con nombre; queda activa y disponible para nuevos registros.
2. **Renombrar:** cambia la etiqueta mostrada; movimientos históricos conservan la referencia con el nuevo nombre.
3. **Desactivar:** la categoría no aparece en nuevos registros; movimientos e ítems históricos **conservan** referencia y significado; reportes de periodos pasados siguen mostrándola.
4. **Eliminar:** solo si **no existe** historial dependiente (movimientos, ítems planeados); preferir desactivar cuando hay historial.
5. Desactivar o renombrar **no altera** totales históricos ni desgloses de periodos pasados.

Referenciado desde `04` para categorías de Extras.

### Salidas conceptuales — Cuentas

| Salida | Descripción |
|--------|-------------|
| Lista de cuentas activas | Usables en nuevos movimientos y periodos |
| Cuentas históricas | Inactivas pero visibles en periodos pasados |
| Saldo derivado | Saldo inicial + movimientos realizados (no crediticio) |
| Movimientos por cuenta | Libro filtrable asociado a la cuenta |

### Tipos de cuenta

| Tipo | Rol principal |
|------|---------------|
| **Débito** | Ingresos, pagos, origen de transferencias |
| **Efectivo** | Destino de retiros; pago de gastos en efectivo |
| **Crédito** | Compras y pagos de tarjeta |
| **Fondo de ahorro** | Saldo acumulado Klar; depósitos y retiros |
| **Otro** | Cuentas personalizadas del usuario |

### Reglas de desactivación

1. Desactivar marca la cuenta como **inactiva** para nuevos registros.
2. Movimientos e ítems históricos **conservan** referencia y significado.
3. Reportes de periodos pasados **siguen mostrando** la cuenta y sus movimientos.
4. Eliminar físicamente solo si **no existe** historial dependiente (movimientos, ítems, plantillas activas).
5. Renombrar no altera movimientos pasados más allá de la etiqueta mostrada.

### Entradas conceptuales — Ingresos

| Tipo | Descripción |
|------|-------------|
| **Ingreso mensual esperado** | Valor editable por periodo; no se asume permanente entre meses |
| **Propagación de ingreso** | Cambio aplicado desde un periodo hacia futuros (reglas en `02`) |
| **Ingreso extraordinario** | Entrada puntual con fecha, concepto y monto |

### Salidas conceptuales — Ingresos

| Salida | Descripción |
|--------|-------------|
| Ingreso esperado del periodo | Suma de expectativas de ingreso activas |
| Ingreso recibido | Suma de movimientos de ingreso **realizados** en el periodo |
| Diferencia | Esperado vs recibido para el resumen mensual |

Reglas:

- Ingreso extraordinario **realizado** incrementa ingreso recibido y saldo de la cuenta destino.
- Ingreso **planeado** entra en proyección, no en ingreso recibido hasta realizarse.
- Transferencias internas **no** son ingresos.

### Entradas conceptuales — Movimientos

Cada movimiento de gasto o ítem equivalente puede incluir:

| Campo | Obligatorio | Notas |
|-------|-------------|-------|
| Fecha de ocurrencia | Sí | Calendario; define periodo de pertenencia |
| Concepto | Sí | Descripción humana |
| Categoría | Según tipo | Agrupa para presupuestos |
| Cuenta | Sí | Origen o destino según tipo |
| Monto planeado | Si planeado | ≥ 0 |
| Monto real | Si realizado | ≥ 0 |
| Estado | Sí | Planeado, Realizado, Cancelado |
| Observaciones | No | Texto libre |

### Semántica de estados (movimientos e ítems)

Alineado con [`01-functional-domain-and-rules.md`](01-functional-domain-and-rules.md):

| Estado | Proyección | Gasto/ingreso real | Saldo |
|--------|------------|-------------------|-------|
| Planeado | Sí | No | No |
| Realizado | No | Sí | Sí |
| Cancelado | No | No | No |

### Filtros

El usuario puede filtrar movimientos e ítems por:

| Filtro | Comportamiento |
|--------|----------------|
| Estado | Planeado, Realizado, Cancelado (combinable) |
| Cuenta | Una o varias cuentas |
| Categoría | Una o varias categorías |
| Rango de fechas | Dentro del periodo o cruzando periodos en vista de cuenta |

Filtrar **reduce la vista**; no recalcula totales del resumen mensual.

### Visibilidad (mostrar / ocultar)

| Acción | Efecto en vista | Efecto en totales |
|--------|-----------------|-------------------|
| Ocultar planeados | No se listan | Sin cambio |
| Ocultar cancelados | No se listan | Sin cambio |
| Ocultar movimiento individual | No se lista | Sin cambio |
| Mostrar de nuevo | Reaparecen | Sin cambio |

Regla invariante: **ninguna** preferencia de visibilidad altera gasto esperado, gasto real, saldos ni ahorro.

### Desglose explicativo de totales

Alineado con decisión D13 de [`01-functional-domain-and-rules.md`](01-functional-domain-and-rules.md) y MVP #22 del PRD.

**Alcance de este spec (`03`):** ingresos, gastos, presupuesto restante por categoría y **desglose del resumen de cuentas** (saldos, entradas/salidas, pagos de tarjeta como consulta agregada). **No cubre por sí solo:** retiro $6,250, suficiencia/excedente ni efectivo restante → `04`; fórmulas y desglose de crédito, saldo Klar, ahorro y plan vs real → `05`.

El usuario puede consultar, desde un total agregado del periodo, **qué movimientos e ítems lo componen**:

| Total consultable | Dueño del desglose | Registros incluidos |
|-------------------|--------------------|---------------------|
| **Gasto esperado** (total o por categoría) | `03` | Ítems planeados activos, servicios recurrentes activos, compras crédito planeadas |
| **Gasto real** (total o por categoría) | `03` | Movimientos realizados de consumo o compra |
| **Ingresos** (esperado o recibido) | `03` | Expectativas de ingreso activas o movimientos de ingreso realizados, según la perspectiva |
| **Presupuesto restante** (por categoría) | `03` / `04` | Límite de la categoría y gastos realizados (y planeados pendientes si aplica la vista proyectada); límites base de Mandado/Salidas/Extras según `04` |
| **Ahorro** (esperado o real) | `05` | Componentes que explican la cifra según reglas de ahorro y efectivo al cierre |
| **Saldo inicial/final por cuenta** | `03` | Saldo inicial del periodo + movimientos realizados que explican el saldo final |
| **Entradas y salidas por cuenta** | `03` | Movimientos realizados clasificados como entradas o salidas de la cuenta (excluye transferencias internas del gasto/ingreso del periodo) |
| **Pagos de tarjeta** (total y detalle) | `03` (consulta) / `05` (reglas) | Pagos realizados y planeados hacia cuentas Crédito; detalle por fecha, origen y monto |
| **Deuda, crédito disponible, crédito utilizado** | `05` (reglas) / `03` (consulta en resumen de cuentas) | Compras y pagos según reglas de `05`; el usuario abre el origen desde el resumen |
| **Retiro de efectivo y efectivo restante** | `04` | Transferencia Débito → Efectivo, cobertura vs Mandado+Salidas, saldo Efectivo al cierre |
| **Saldo Klar** | `05` | Depósitos, retiros y pagos desde Klar del periodo |
| **Diferencia plan vs realidad** | `05` | Desglose que explica cada diferencia de ingreso, gasto, ahorro y crédito |

Reglas del desglose:

1. La suma de montos del desglose **coincide** con el total mostrado (salvo redondeo de presentación).
2. Excluye movimientos cancelados, transferencias internas (como gasto/ingreso del periodo) y registros ocultos por preferencia de visibilidad **solo en la vista filtrada**; el desglose del total siempre incluye todos los registros que componen el cálculo.
3. El usuario accede al desglose desde el total o desde la categoría/cuenta correspondiente.
4. Cada registro del desglose muestra fecha, concepto, monto, estado y cuenta (cuando aplique).
5. El usuario puede **abrir el origen** de cada cifra del resumen (movimiento o ítem planeado concreto).

### Desglose del resumen de cuentas

Sección del resumen mensual donde el usuario consulta el estado de **cada cuenta activa o histórica del periodo**.

| Elemento consultable | Contenido del desglose | Dueño |
|----------------------|------------------------|-------|
| **Saldo inicial** | Valor al abrir el periodo (heredado del saldo final anterior o saldo inicial de la cuenta) | `03` |
| **Saldo final** | Saldo inicial + entradas − salidas no crediticias (cuentas Débito, Efectivo, Klar, Otro) o deuda/crédito (cuentas Crédito) | `03` |
| **Entradas** | Movimientos que incrementan el saldo de la cuenta en el periodo | `03` |
| **Salidas** | Movimientos que disminuyen el saldo de la cuenta en el periodo | `03` |
| **Pagos de tarjeta** | Total del periodo y detalle de cada pago hacia cuentas Crédito (origen, fecha, monto, estado) | Consulta `03`; reglas `05` |
| **Deuda / crédito disponible / crédito utilizado** | Para cuentas Crédito: límite, deuda actual, crédito utilizado (= deuda), crédito disponible, compras y pagos del periodo | Consulta `03`; reglas y fórmulas `05` |

Reglas:

1. Cada cifra del resumen de cuentas enlaza a su desglose; el usuario identifica qué registros la explican.
2. Transferencias internas aparecen en entradas/salidas de las cuentas afectadas pero **no** duplican gasto ni ingreso del periodo (`01`).
3. El **efectivo restante** (saldo Efectivo al cierre) se consulta desde la cuenta Efectivo o desde el indicador del retiro; su definición y cobertura vs Mandado+Salidas son responsabilidad de `04`.
4. El saldo acumulado Klar y el desglose de depósitos/retiros/pagos desde Klar siguen reglas de `05`.

### Movimientos por tipo (referencia cruzada)

| Tipo de movimiento | Spec principal |
|--------------------|----------------|
| Gasto desde Débito/Efectivo | Este documento |
| Ingreso | Este documento |
| Transferencia interna | `01`, `04` (retiro) |
| Compra y pago de crédito | `05` |
| Depósito/retiro Klar | `05` |

## Tareas

1. Definir ciclo de vida de cuenta: creación, edición, desactivación, eliminación condicionada.
2. Especificar ingreso mensual por periodo e ingresos extraordinarios.
3. Documentar campos y estados de movimientos con fecha exacta.
4. Documentar filtros y visibilidad sin efecto en cálculos.
5. Alinear desactivación con conservación de historial del PRD §9.3.
6. Formalizar CRUD conceptual de categorías personalizadas, desglose explicativo de ingresos/gastos/presupuesto y desglose del resumen de cuentas (MVP #22).

## Criterios de aceptación

1. **CA-01** El usuario puede crear cuentas de tipos Débito, Efectivo, Crédito, Fondo de ahorro y Otro.
2. **CA-02** El usuario puede agregar una cuenta nueva sin modificar las existentes.
3. **CA-03** Desactivar una cuenta con historial la oculta de nuevos registros pero la conserva en periodos históricos.
4. **CA-04** Eliminar cuenta solo está permitido sin movimientos ni dependencias.
5. **CA-05** Cada periodo conserva su propio ingreso mensual esperado editable.
6. **CA-06** Ingreso extraordinario requiere fecha, concepto y monto; al realizarse aumenta ingreso recibido.
7. **CA-07** Todo movimiento tiene fecha calendario exacta que determina su periodo.
8. **CA-08** Movimiento planeado aparece en proyección pero no en gasto real ni saldo.
9. **CA-09** Movimiento realizado aparece en gasto real y actualiza saldo de la cuenta.
10. **CA-10** Movimiento cancelado no afecta gasto real ni saldo.
11. **CA-11** Ocultar movimientos o filtrar por estado no cambia totales del resumen.
12. **CA-12** Filtros por cuenta, categoría, estado y rango de fechas funcionan de forma combinada en la vista.
13. **CA-13** El usuario puede crear una categoría personalizada con nombre; queda activa para nuevos registros.
14. **CA-14** El usuario puede renombrar una categoría personalizada; los movimientos históricos conservan la referencia.
15. **CA-15** Desactivar una categoría con historial la oculta de nuevos registros pero la conserva en periodos históricos y desgloses.
16. **CA-16** Eliminar categoría solo está permitido sin movimientos ni ítems dependientes.
17. **CA-17** Desde gasto esperado, gasto real, ingresos o presupuesto restante (total o por categoría), el usuario puede consultar el desglose de movimientos e ítems que explican la cifra; la suma coincide con el total.
18. **CA-18** Por cada cuenta del periodo, el usuario puede consultar saldo inicial, saldo final y el desglose de entradas y salidas que explican la diferencia; la suma coincide con los saldos mostrados.
19. **CA-19** El usuario puede consultar pagos de tarjeta del periodo como total agregado y como detalle (fecha, origen, tarjeta destino, monto, estado); cada línea enlaza al movimiento de origen (reglas de cálculo en `05`).
20. **CA-20** En cuentas Crédito del resumen, el usuario puede consultar deuda, crédito utilizado, crédito disponible y el desglose de compras y pagos del periodo que explican cada cifra (reglas en `05`).
21. **CA-21** Desde cualquier cifra del resumen de cuentas, el usuario puede abrir el origen (movimiento o ítem planeado) que la compone.

## Verificación

| ID | Verificación documental |
|----|-------------------------|
| V-01 | Estados Planeado/Realizado/Cancelado idénticos a `01` |
| V-02 | Visibilidad explícitamente excluida de cálculos en CA-11 y tabla de visibilidad |
| V-03 | Desactivación alineada con PRD §9.3 y criterios MVP #3–4, #15 |
| V-04 | Fecha exacta alineada con PRD §9.10 y decisión D2 de `01` |
| V-05 | Ingreso mensual no asumido permanente (PRD §9.4, decisión D6) |
| V-06 | Sin endpoints, SQL, Prisma, React, fixtures ni nombres de implementación |
| V-07 | Transferencias y crédito remiten a `04`/`05` sin redefinir reglas |
| V-08 | CRUD de categorías personalizadas alineado con PRD §9.8 y riesgo de categorías cambiantes |
| V-09 | Desglose de ingresos, gastos, presupuesto y resumen de cuentas alineado con MVP #22 y D13 de `01`; retiro/efectivo restante remite a `04`; crédito/Klar/ahorro/plan vs real remite a `05` |

## Impacto y riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Eliminar cuenta con historial | Pérdida de contexto | Solo eliminación sin dependencias; preferir desactivar |
| Visibilidad confundida con exclusión | Totales «no cuadran» con lista | CA-11 y tabla explícita |
| Fecha mal asignada a periodo | Resumen mensual incorrecto | Fecha define periodo CA-07 |
| Ingreso duplicado vía transferencia | Inflación de ingreso recibido | Transferencias no son ingreso (`01`) |
| Cuenta inactiva en nuevo movimiento | Error de captura | Solo cuentas activas en nuevos registros |

**Dependientes:** `04` usa cuentas para pagos; `05` extiende tipos Crédito y Klar; Backend `06`–`07` modelan entidades.
