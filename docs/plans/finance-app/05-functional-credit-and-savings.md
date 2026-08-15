# Crédito, Fondo Klar, ahorro y sugerencias

**Tipo:** Functional  
**Depende de:** [`01-functional-domain-and-rules.md`](01-functional-domain-and-rules.md), [`docs/briefs/finance-app/prd.md`](../../briefs/finance-app/prd.md)  
**Implementa:** Compras a crédito, deuda, límite, crédito disponible, pagos desde Débito/Klar, Fondo Klar, ahorro esperado/real, sugerencias informativas; fórmulas conceptuales sin doble conteo.  
**No incluye:** Endpoints, SQL, Prisma, React, Express, componentes, nombres de archivos de implementación, fixtures de integración, detalle de cuentas genéricas (ver `03`), presupuestos Mandado/Salidas (ver `04`).

## Resultado

El usuario registra compras con tarjeta y pagos de deuda desde Débito o Klar, mantiene el saldo acumulado del Fondo Klar, consulta ahorro esperado y real del periodo como efectivo al cierre (separado del saldo Klar), y recibe sugerencias explicativas que nunca modifican datos automáticamente — con reglas explícitas que impiden doble conteo entre compra, pago, transferencia y gasto.

## Contratos de entrada y salida

### Entradas conceptuales — Crédito

| Campo / acción | Descripción |
|----------------|-------------|
| Tarjeta | Cuenta tipo Crédito específica |
| Compra | Fecha, concepto, categoría, monto, estado |
| Límite de crédito | Tope de la tarjeta |
| Deuda inicial | Deuda al dar de alta la cuenta |
| Pago | Cuenta origen (Débito o Klar), tarjeta destino, monto, fecha, estado |
| Fechas de corte/pago | Opcionales, informativas |

### Salidas conceptuales — Crédito

| Salida | Fórmula / regla |
|--------|-----------------|
| **Deuda actual** | Deuda inicial + compras realizadas − pagos realizados |
| **Crédito disponible** | Límite − deuda actual |
| **Crédito utilizado** | Límite de crédito − crédito disponible (= deuda actual) |
| **Crédito disponible proyectado** | Límite − deuda − compras planeadas (sin aumentar deuda real) |
| **Compras planeadas** | Listado; impactan proyección, no deuda real |
| **Compras realizadas** | Aumentan deuda; cuentan como gasto de consumo **una vez** |
| **Pagos planeados** | Impactan flujo de efectivo proyectado |
| **Pagos realizados** | Reducen deuda y saldo origen; **no** re-suman compra |

Por defecto no se crean compras de crédito hasta que el usuario las agregue.

### Reglas anti doble conteo — Crédito

| Evento | ¿Gasto de consumo? | ¿Afecta deuda? | ¿Afecta efectivo? |
|--------|---------------------|----------------|-------------------|
| Compra planificada | Proyección only | No (deuda real) | No |
| Compra realizada | **Sí, una vez** | Sí (+) | No directo (a crédito) |
| Pago planificado | No | No hasta realizarse | Proyección (−) |
| Pago realizado | **No** | Sí (−) | Sí (− origen) |

Si compra ocurre en mes **M** y pago en mes **M+1**: consumo en M; efectivo afectado en M+1; **nunca** sumar consumo dos veces.

### Pagos desde Débito vs Klar

| Origen | Efecto |
|--------|--------|
| **Débito** | Disminuye saldo Débito y deuda tarjeta |
| **Klar** | Disminuye saldo acumulado Klar y deuda tarjeta |

Ambos son pagos de deuda, no gastos adicionales.

### Entradas conceptuales — Fondo Klar

| Acción | Naturaleza |
|--------|------------|
| Saldo inicial | Al configurar cuenta Fondo de ahorro |
| Depósito | Transferencia desde Débito (u origen) → Klar |
| Retiro | Transferencia Klar → destino |
| Pago de tarjeta desde Klar | Pago de deuda (ver arriba) |
| Corrección histórica | Edición con propagación si altera saldos (`02`) |

### Salidas conceptuales — Fondo Klar

| Salida | Descripción |
|--------|-------------|
| Saldo acumulado Klar | Saldo inicial + depósitos − retiros − pagos desde Klar |
| Entradas del mes | Depósitos realizados en el periodo |
| Salidas del mes | Retiros + pagos de tarjeta realizados desde Klar |
| Saldo posterior a movimiento | Traza consultable |

Movimiento Débito ↔ Klar: **transferencia interna**; no ingreso ni gasto del periodo.

### Ahorro esperado

El producto muestra dos perspectivas relacionadas:

| Perspectiva | Definición |
|-------------|------------|
| **Consumo esperado** | Ingresos esperados − todos los consumos planeados (incluye compras crédito planeadas) |
| **Efectivo esperado al cierre** | Dinero en Débito + Efectivo tras ingresos, gastos pagados, pagos planeados y movimientos planeados hacia/desde Klar |

**Cifra principal de ahorro esperado:** efectivo esperado al cierre (responde cuánto quedará disponible al terminar el mes).

Reglas:

- Compra a crédito cuenta **una vez** como consumo en su mes.
- Pago en otro mes afecta efectivo de **ese** mes, no vuelve a contar consumo.
- Transferencias internas no duplican gasto ni ingreso.
- Deuda y compromisos de crédito se muestran **aparte** para no confundir con ahorro.

### Ahorro real

Calculado con ingresos recibidos, gastos y pagos **realizados**, respetando fecha de ocurrencia.

El detalle explicativo incluye:

- Ingresos recibidos
- Gastos pagados (incl. compras crédito realizadas)
- Pagos de crédito realizados
- Movimientos hacia/desde Klar
- Efectivo disponible (Débito + Efectivo)
- Deuda pendiente

**Ahorro real** ≠ **saldo acumulado Klar**.

### Diferencia plan vs realidad

Comparación explícita entre proyección y hechos del periodo:

| Concepto | Plan (esperado) | Real | Diferencia |
|----------|-----------------|------|------------|
| Ingresos | Ingreso esperado del periodo | Ingreso recibido | Real − esperado |
| Gasto | Gasto esperado | Gasto real | Real − esperado |
| Ahorro | Ahorro esperado (efectivo al cierre) | Ahorro real | Real − esperado |
| Crédito | Crédito disponible proyectado | Crédito disponible actual | Disponible real − proyectado |

Reglas:

1. La diferencia se muestra en el resumen mensual junto a ambas cifras.
2. Una diferencia distinta de cero debe poder explicarse mediante desglose consultable (MVP #22; dueño funcional `05`; consulta desde resumen de cuentas vía `03` cuando aplique).
3. Signo positivo en ahorro indica superávit vs plan; negativo indica déficit vs plan.
4. La diferencia no altera datos; es derivada de totales ya registrados.

### Sugerencias

Sugerencias **informativas** derivadas de datos del usuario; **nunca** mutan datos solas.

| Trigger conceptual | Ejemplo de mensaje |
|--------------------|-------------------|
| Categoría cerca del límite | «Servicios superará el 90% del presupuesto» |
| Gasto real recurrentemente mayor | «Mandado lleva 3 meses sobre plan» |
| Ahorro proyectado cayó | «Ahorro esperado bajó $X vs mes anterior» |
| Pago futuro apretará efectivo | «Pago de tarjeta planeado dejará poco en Débito» |
| Retiro insuficiente | «Retiro $6,250 no cubrió Mandado+Salidas reales» |
| Dinero sin asignar | «Hay efectivo disponible no asignado a ahorro» |
| Servicio subió | «Netflix aumentó vs promedio» |
| Exceso de extras | «Extras supera el presupuesto mensual» |
| Compra cancelada | «Compra cancelada mejora proyección» |
| Klar puede cubrir pago | «Saldo Klar cubriría pago sin tocar efectivo del mes» |

Cada sugerencia debe **explicar el origen** del dato (categoría, periodo, comparación).

El usuario **acepta o descarta**; aceptar puede navegar a la acción, no auto-aplicar cambios.

### Resumen mensual (campos crédito/ahorro)

Cada periodo incluye como mínimo:

- Crédito utilizado (= deuda actual) y crédito disponible
- Pagos de tarjeta (planeados y realizados)
- Saldo Klar
- Retiro de efectivo y efectivo restante (dueño funcional `04`; definición en `01`)
- Ahorro esperado y ahorro real
- Diferencia plan vs realidad
- Advertencias (límite superado, ahorro negativo)

### Desglose del resumen de crédito y Klar

Dueño funcional de fórmulas y desglose de crédito, saldo Klar, ahorro y plan vs real (`01` D13/CA-09). La consulta desde el resumen de cuentas se expone vía `03`; retiro y efectivo restante vía `04`.

| Elemento consultable | Contenido del desglose |
|----------------------|------------------------|
| **Resumen de crédito** | Límite, deuda actual, crédito utilizado, crédito disponible |
| **Compras del periodo** | Detalle de compras planeadas y realizadas por tarjeta |
| **Pagos del periodo** | Detalle de pagos planeados y realizados (origen Débito o Klar, tarjeta, monto, fecha) |
| **Saldo Klar** | Saldo inicial del periodo, depósitos, retiros, pagos desde Klar, saldo final |

Reglas:

1. Cada cifra enlaza al movimiento o ítem que la explica.
2. Crédito utilizado = deuda actual = límite − crédito disponible.
3. Saldo final Klar = saldo inicial + depósitos − retiros − pagos desde Klar del periodo.
4. Ahorro esperado/real y diferencia plan vs realidad incluyen desglose propio según secciones anteriores de este spec.

## Tareas

1. Formalizar fórmulas de deuda, crédito disponible y anti doble conteo compra/pago.
2. Documentar Fondo Klar: depósitos, retiros, pagos desde Klar.
3. Definir ahorro esperado (efectivo al cierre) vs consumo esperado vs saldo Klar.
4. Definir ahorro real con desglose explicativo.
5. Catalogar triggers de sugerencias alineados al PRD §9.15.
6. Alinear pagos Débito/Klar con transferencias internas de `01`.
7. Definir crédito utilizado y diferencia plan vs realidad en resumen mensual.
8. Documentar desglose del resumen de crédito y saldo Klar con trazabilidad (MVP #22).

## Criterios de aceptación

1. **CA-01** Compra a crédito realizada aumenta deuda y reduce crédito disponible; cuenta como gasto de consumo una sola vez.
2. **CA-02** Compra planificada afecta crédito disponible proyectado sin aumentar deuda real.
3. **CA-03** Pago realizado desde Débito reduce deuda y saldo Débito; no incrementa gasto de consumo.
4. **CA-04** Pago realizado desde Klar reduce deuda y saldo Klar; no incrementa gasto de consumo.
5. **CA-05** Compra en mes M y pago en M+1: consumo contado en M; efectivo afectado en M+1; sin doble conteo.
6. **CA-06** Depósito a Klar es transferencia; no gasto ni ingreso del periodo.
7. **CA-07** Retiro desde Klar actualiza saldo acumulado; no confundir con ahorro del mes.
8. **CA-08** Ahorro esperado principal refleja efectivo al cierre en Débito+Efectivo.
9. **CA-09** Deuda pendiente se muestra separada del ahorro esperado.
10. **CA-10** Ahorro real incluye desglose de ingresos, gastos, pagos crédito, Klar, efectivo y deuda.
11. **CA-11** Sugerencias no modifican datos; usuario acepta o descarta.
12. **CA-12** Sugerencia de retiro insuficiente referencia retiro base $6,250 vs Mandado+Salidas (`04`).
13. **CA-13** Advertencia cuando gasto supera límite o ahorro proyectado es negativo.
14. **CA-14** Crédito utilizado se define como límite de crédito menos crédito disponible; equivale a deuda actual y se muestra junto a crédito disponible.
15. **CA-15** El resumen mensual muestra diferencia plan vs realidad para ingresos, gasto, ahorro y crédito (compras planeadas vs realizadas, pagos planeados vs realizados, deuda y crédito disponible); el usuario puede consultar desglose que explica cada diferencia (MVP #22).
16. **CA-16** Desde ahorro esperado o ahorro real, el usuario puede consultar qué movimientos e ítems componen cada cifra.
17. **CA-17** Desde el saldo Klar del periodo, el usuario puede consultar desglose de saldo inicial, depósitos, retiros, pagos desde Klar y saldo final; la suma coincide con la cifra mostrada.
18. **CA-18** Desde el resumen de crédito del periodo, el usuario puede consultar límite, deuda, crédito utilizado, crédito disponible y el desglose de compras y pagos (planeados y realizados) que explican cada cifra; el usuario puede abrir el origen de cada línea.

## Verificación

| ID | Verificación documental |
|----|-------------------------|
| V-01 | Tabla anti doble conteo cubre escenarios MVP #16–18 |
| V-02 | Ahorro vs Klar separados en definiciones y CA-07–CA-09 |
| V-03 | Fórmulas alineadas con PRD §10.2, §10.6–10.7 |
| V-04 | Pagos Débito/Klar consistentes con `01` invariantes de crédito |
| V-05 | Sugerencias alineadas con PRD §9.15; sin auto-mutación |
| V-06 | Retiro $6,250 referenciado como transferencia vía `04`, no gasto |
| V-07 | Términos «deuda», «crédito disponible», «crédito utilizado», «transferencia interna» consistentes con `01`–`04` |
| V-08 | Crédito utilizado = límite − disponible documentado |
| V-09 | Diferencia plan vs realidad alineada con resumen mensual del PRD; dueño funcional `05` |
| V-10 | Desglose de saldo Klar y resumen de crédito documentados; CA-17 y CA-18 alineados con D13/CA-09 de `01` |
| V-11 | Sin endpoints, SQL, Prisma, React, fixtures ni placeholders |

## Impacto y riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Doble conteo compra + pago | Gasto inflado | Tabla anti doble conteo; CA-03–CA-05 |
| Confundir ahorro con saldo Klar | Malas decisiones | Definiciones separadas; CA-07–CA-09 |
| Sugerencia auto-aplica cambio | Pérdida de control | CA-11; sugerencias solo informativas |
| Crédito planeado aumenta deuda real | Disponible incorrecto | CA-02 |
| Pago desde Klar contado como gasto | Efectivo y gasto distorsionados | Pago = transferencia de deuda |
| Ahorro negativo no visible | Sorpresa fin de mes | CA-13 advertencias |

**Dependientes:** Backend `08` implementa cálculos; Integración `20` verifica anti doble conteo; UX `13` presenta paneles Crédito/Klar.
