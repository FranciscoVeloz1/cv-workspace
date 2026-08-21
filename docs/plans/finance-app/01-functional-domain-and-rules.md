# Dominio funcional y reglas transversales

**Tipo:** Functional  
**Depende de:** [`docs/briefs/finance-app/prd.md`](../../briefs/finance-app/prd.md)  
**Implementa:** Vocabulario compartido, invariantes de negocio y tabla de decisiones que aplican a todos los specs funcionales `02`–`05` y a los carriles posteriores.  
**No incluye:** Endpoints, SQL, Prisma, React, Express, componentes, nombres de archivos de implementación, fixtures de integración, diseño visual ni contratos HTTP.

## Resultado

Un contrato funcional único que define qué significa cada concepto del producto, quién es dueño de los datos, cómo se representan importes y fechas, y qué reglas nunca pueden violarse al calcular saldos, gastos, crédito, efectivo y ahorro. Cualquier spec o implementación posterior debe referirse a este documento para resolver ambigüedades.

## Contratos de entrada y salida

### Entradas conceptuales

| Entrada | Descripción |
|---------|-------------|
| Usuario autenticado | Persona con sesión válida; única dueña de sus datos financieros |
| Periodo calendario | Año y mes (1–12) que agrupa ingresos, presupuestos, ítems planeados y movimientos |
| Cuenta | Origen o destino del dinero con tipo, saldo inicial y estado activo/inactivo |
| Ítem planeado | Expectativa con fecha, monto planeado, estado y cuenta asociada |
| Movimiento | Hecho registrado con fecha de ocurrencia, tipo, monto y cuentas involucradas |
| Plantilla recurrente | Regla que genera expectativas mensuales desde una fecha de vigencia |
| Preferencia de visibilidad | Marca de mostrar u ocultar en la vista; no altera cálculos |

### Salidas conceptuales

| Salida | Descripción |
|--------|-------------|
| Totales derivados | Gasto esperado, gasto real, presupuesto restante, ahorro esperado, ahorro real |
| Saldos por cuenta | Saldo inicial + entradas − salidas (no crediticias); deuda y crédito disponible (crediticias) |
| Clasificación de periodo | Pasado, actual o futuro según la fecha del sistema |
| Violación de invariante | Condición que impide persistir o confirma rechazo con mensaje claro |
| Impacto de propagación | Resumen de periodos y totales afectados hacia el futuro |

### Vocabulario obligatorio

| Término | Definición |
|---------|------------|
| **Periodo** | Mes calendario editable que contiene la foto financiera de ese mes |
| **Cuenta** | Contenedor de saldo; tipos: Débito, Efectivo, Crédito, Fondo de ahorro, Otro |
| **Movimiento** | Registro con fecha exacta que representa ingreso, gasto, compra, pago, depósito, retiro o transferencia |
| **Ítem planeado** | Compromiso o expectativa dentro de un periodo antes o durante su realización |
| **Plantilla recurrente** | Regla reutilizable (servicio, mandado, retiro, ingreso base) con vigencia temporal |
| **Presupuesto de periodo** | Límite monetario por categoría dentro de un periodo concreto |
| **Gasto** | Consumo o compra que reduce patrimonio disponible o aumenta deuda; no incluye transferencias internas |
| **Transferencia interna** | Movimiento entre cuentas propias sin crear ingreso ni gasto adicional |
| **Retiro de efectivo** | Transferencia desde cuenta de origen hacia Efectivo; no es gasto |
| **Compra a crédito** | Gasto de consumo registrado en tarjeta; aumenta deuda al realizarse |
| **Pago de tarjeta** | Transferencia de deuda: reduce saldo de origen y deuda de la tarjeta; no re-cuenta la compra |
| **Fondo de ahorro (Klar)** | Cuenta de tipo fondo con saldo acumulado independiente del ahorro del mes |
| **Ahorro del mes** | Efectivo esperado o real al cierre del periodo en cuentas de débito y efectivo, separado del saldo acumulado de Klar |
| **Efectivo restante** | Saldo de la cuenta **Efectivo** al cierre del periodo: saldo inicial de Efectivo + transferencias y retiros recibidos hacia Efectivo − gastos realizados pagados desde Efectivo en el periodo. **No** es saldo Débito ni saldo acumulado Klar. Debe poder explicarse mediante desglose consultable (dueño funcional del retiro base y cobertura: `04`; movimientos de Efectivo: `03`) |
| **Gasto esperado** | Suma de compromisos planeados activos del periodo |
| **Gasto real** | Suma de movimientos realizados que representan consumo o compra |
| **Propagación** | Aplicación confirmada de un cambio desde un periodo hacia periodos futuros |
| **Previsualización** | Cálculo del impacto sin modificar datos hasta confirmación explícita |
| **Desglose explicativo** | Lista consultable de movimientos e ítems que componen un total agregado |

### Ownership y privacidad

1. Cada periodo, cuenta, categoría, plantilla, ítem planeado y movimiento pertenece a **un solo usuario**.
2. Ninguna operación de lectura o escritura puede acceder a datos de otro usuario, aunque exista un rol administrador global en el sistema.
3. En el MVP, el usuario se **provisiona por administrador**; registro público y recuperación de contraseña quedan fuera de alcance funcional inmediato, pero la regla de aislamiento aplica igual.
4. Desactivar una cuenta, categoría o plantilla **no borra** el significado histórico de movimientos ya registrados.

### Moneda (MXN)

1. Toda cantidad monetaria se expresa en **pesos mexicanos (MXN)** con **dos decimales**.
2. No existe conversión de moneda en el MVP.
3. Los importes base del producto (p. ej. retiro de $6,250) son reglas de negocio, no datos de usuario inventados.
4. Las operaciones aritméticas deben preservar precisión decimal; redondeos solo al presentar, nunca acumulando error en cálculos internos.

### Fechas

1. Toda fecha financiera es **calendario** (`YYYY-MM-DD`) sin conversión implícita de zona horaria.
2. Un movimiento pertenece al periodo de su **fecha de ocurrencia**, no al periodo en que se capturó.
3. La clasificación pasado/actual/futuro de un periodo se deriva de la fecha del sistema, pero **no bloquea** la edición.
4. Las fechas de ítems planeados y movimientos realizados se conservan al propagar cambios; los periodos anteriores no se reescriben retroactivamente salvo edición explícita en ese periodo.

### Invariantes de estados

| Estado | Gasto esperado | Gasto real | Saldo de cuenta | Notas |
|--------|----------------|------------|-----------------|-------|
| **Planeado** | Sí | No | No hasta realizarse | Entra en proyección |
| **Realizado** | No (reemplazado por real) | Sí | Sí | Debe tener monto real |
| **Cancelado** | No | No | No | Se conserva para contexto |

Reglas adicionales:

- Un ítem planeado realizado genera **como máximo un** movimiento vinculado.
- Cancelar un ítem planeado no elimina el historial; explica por qué no ocurrió el gasto.
- Aplicar una preferencia de visibilidad (ocultar) a un ítem o movimiento **no cambia** ningún total, saldo ni proyección.

### Invariantes de transferencias

1. Una transferencia interna mueve dinero entre dos cuentas del **mismo usuario**.
2. Origen disminuye saldo; destino aumenta saldo en el **mismo monto**.
3. No incrementa ingreso ni gasto del periodo.
4. Tipos reconocidos: Débito ↔ Efectivo, Débito/Klar ↔ pago de tarjeta, Débito ↔ Klar (depósito/retiro de fondo).
5. El **retiro combinado de Salidas y mandado** ($6,250 base) es transferencia Débito → Efectivo, **nunca** gasto.

### Invariantes de crédito

1. **Límite de crédito** ≥ 0; **deuda actual** ≥ 0.
2. **Crédito disponible** = límite − deuda actual.
3. Compra a crédito **planeada**: reduce crédito disponible proyectado; **no** aumenta deuda real.
4. Compra a crédito **realizada**: aumenta deuda una sola vez; cuenta como gasto de consumo.
5. Pago de tarjeta **realizado**: disminuye deuda y saldo de la cuenta de origen; **no** vuelve a sumar el gasto original.
6. Compra y pago son eventos distintos; pueden caer en periodos distintos.

### Invariantes de efectivo

1. El saldo de Efectivo refleja transferencias recibidas menos gastos pagados desde Efectivo.
2. **Efectivo restante** sigue la definición del vocabulario: solo cuenta Efectivo; excluye Débito y Klar.
3. Gastos de Mandado y Salidas pagados desde Efectivo consumen efectivo, no vuelven a contar el retiro como gasto.
4. El sistema debe poder indicar si el retiro base cubrió, quedó corto o sobró frente al gasto real de Mandado y Salidas en el periodo; ese estado y el **efectivo restante** deben tener desglose consultable (dueño funcional: `04`; trazabilidad de movimientos: `03`).

### Tabla de decisiones adoptadas

| # | Decisión | Regla |
|---|----------|-------|
| D1 | Meses editables | Todo periodo es editable; cambios pueden propagarse hacia el futuro |
| D2 | Fecha exacta | Movimientos e ítems llevan fecha calendario, no solo mes |
| D3 | Crédito vs pago | Compra = gasto; pago = transferencia de deuda |
| D4 | Cuentas configurables | El usuario define cuentas; desactivar conserva historial |
| D5 | Plantillas con alcance | Cambio desde un periodo afecta ese periodo y futuros confirmados |
| D6 | Ingreso mensual | Cada periodo conserva su propio ingreso esperado |
| D7 | Estados de ítem | Planeado / Realizado / Cancelado con semántica fija |
| D8 | Visibilidad | Ocultar no altera cálculos |
| D9 | Moneda | MXN únicamente en MVP |
| D10 | Retiro $6,250 | Transferencia a Efectivo; consumo en Mandado/Salidas |
| D11 | Ahorro vs Klar | Ahorro del mes ≠ saldo acumulado del fondo |
| D12 | Fuente de verdad | Cuentas, periodos, plantillas, ítems y movimientos; totales derivados |
| D13 | Trazabilidad de totales | Todo total agregado del resumen mensual debe tener desglose explicativo consultable. **Dueños funcionales:** ingreso, gasto, presupuesto restante por categoría y desglose del resumen de cuentas → `03`; retiro de efectivo, cobertura Mandado+Salidas y efectivo restante → `04`; crédito (límite, deuda, utilizado, disponible, compras/pagos), saldo Klar, ahorro esperado/real y diferencia plan vs realidad → `05`. El usuario debe poder identificar los movimientos e ítems planeados que explican cada cifra (MVP #22) |

## Tareas

1. Adoptar el vocabulario de este spec en los documentos `02`–`05` sin sinónimos conflictivos.
2. Validar toda regla de negocio futura contra las invariantes de estados, transferencias, crédito y efectivo.
3. Documentar excepciones explícitas en el spec que las introduce; no en código suelto.
4. Usar la tabla de decisiones como checklist de revisión en specs Backend e Integración.

## Criterios de aceptación

1. **CA-01** Un término definido aquí no tiene definición contradictoria en `02`–`05`.
2. **CA-02** Queda explícito que ocultar registros no modifica totales ni proyecciones.
3. **CA-03** Queda explícito que transferencias internas, pagos de tarjeta y retiros de efectivo no son gastos.
4. **CA-04** Queda explícito que compras a crédito realizadas cuentan una sola vez como consumo.
5. **CA-05** Queda explícito que MXN usa dos decimales y fechas son calendario sin zona horaria.
6. **CA-06** Queda explícito que cada entidad financiera pertenece a un único usuario autenticado.
7. **CA-07** La tabla de decisiones D1–D13 cubre las decisiones funcionales adoptadas del PRD §7 y la trazabilidad de totales.
8. **CA-08** Ahorro del mes y saldo acumulado de Klar están definidos como conceptos separados.
9. **CA-09** Todo total agregado del resumen mensual debe poder explicarse mediante un desglose consultable de movimientos e ítems planeados, de modo que el usuario identifique qué registros explican cada cifra (MVP #22). **Alcance por dueño:** ingreso, gasto, presupuesto restante por categoría (Servicios, Mandado, Salidas, Extras) y desglose del resumen de cuentas → `03`; retiro de efectivo, suficiencia/excedente vs Mandado+Salidas y **efectivo restante** (saldo Efectivo al cierre, no Débito ni Klar) → `04`; límite, deuda, crédito utilizado, crédito disponible, compras/pagos de tarjeta, saldo Klar, ahorro esperado/real y diferencia plan vs realidad → `05`.

## Verificación

| ID | Verificación documental |
|----|-------------------------|
| V-01 | Buscar en `02`–`05` referencias a «gasto» aplicadas a transferencias o pagos de tarjeta → debe ser cero |
| V-02 | Buscar definiciones duplicadas de «periodo», «movimiento», «ahorro» → deben remitir a este spec o ser consistentes |
| V-03 | Confirmar que ningún spec funcional menciona endpoints, SQL, Prisma, React o fixtures |
| V-04 | Revisar que estados Planeado/Realizado/Cancelado tienen la misma semántica en `03` y `04` |
| V-05 | Revisar que el retiro $6,250 aparece como transferencia en `04` y no como gasto en ningún spec |
| V-06 | Confirmar ausencia de placeholders (`TBD`, `TODO`, `por definir`) en este documento |

## Impacto y riesgos

| Riesgo | Impacto | Mitigación en specs posteriores |
|--------|---------|----------------------------------|
| Doble conteo crédito/pago | Totales de gasto inflados | `05` distingue compra vs pago; `01` invariante explícita |
| Retiro contado como gasto | Gasto esperado/real inflado | `04` y `01` lo clasifican como transferencia |
| Confundir ahorro con saldo Klar | Decisiones erróneas del usuario | Definiciones separadas en `01`; efectivo restante ≠ Klar; desarrollo en `05` |
| Visibilidad alterando totales | Desconfianza en cifras | Invariante en `01`; detalle de filtros en `03` |
| Ambigüedad de fechas | Movimientos en periodo incorrecto | Regla calendario en `01`; detalle en `02` y `03` |
| Violación de ownership | Fuga de datos entre usuarios | Regla transversal; Backend debe filtrar por usuario |

Este spec es **raíz** del grafo funcional: `02`, `03`, `04` y `05` dependen de él y no deben contradecirlo.
