# Presupuestos, servicios recurrentes y reglas base

**Tipo:** Functional  
**Depende de:** [`01-functional-domain-and-rules.md`](01-functional-domain-and-rules.md), [`docs/briefs/finance-app/prd.md`](../../briefs/finance-app/prd.md)  
**Implementa:** Servicios mensuales recurrentes; Mandado (3×$2,000); Salidas (4×$500); Extras ($1,400); retiro combinado ($6,250); límites por categoría; overrides por periodo; cambios con alcance futuro.  
**No incluye:** Endpoints, SQL, Prisma, React, Express, componentes, nombres de archivos de implementación, fixtures de integración, motor de propagación (ver `02`), crédito/Klar/ahorro (ver `05`).

## Resultado

El usuario administra compromisos recurrentes y presupuestos por categoría con defaults base del producto, registra variaciones reales, aplica overrides puntuales por periodo, modifica plantillas con efecto futuro confirmado, y trata el retiro de efectivo como transferencia interna — separando movimiento de dinero físico del consumo en Mandado y Salidas.

## Contratos de entrada y salida

### Defaults base del producto (reglas de negocio)

| Grupo | Configuración inicial | Límite mensual base |
|-------|----------------------|---------------------|
| **Mandado** | 3 compras planeadas × $2,000 c/u | $6,000 |
| **Salidas** | 4 salidas planeadas × $500 c/u | $2,000 |
| **Extras** | Presupuesto mensual único | $1,400 |
| **Retiro combinado** | Transferencia Débito → Efectivo | $6,250 (no es gasto) |

Estos valores son **plantillas modificables**; no datos personales inventados. El usuario puede cambiarlos por periodo o hacia el futuro.

### Entradas conceptuales — Servicios mensuales

| Campo / acción | Descripción |
|----------------|-------------|
| Nombre | Identificador del servicio (p. ej. streaming, renta, utilities) |
| Monto esperado | Compromiso recurrente ≥ 0 |
| Cuenta de pago | Cuenta desde la que se espera pagar |
| Fecha esperada | Día del mes opcional |
| Acciones | Crear, editar monto, pausar, eliminar de futuros, registrar real distinto, observaciones |

Comportamiento:

- Servicio **activo** genera expectativa en cada periodo dentro de su vigencia.
- Servicio **pausado** no genera nuevas expectativas futuras; historial conservado.
- Monto **real** puede diferir del esperado al realizarse.
- Eliminar de meses futuros no borra meses pasados.

### Entradas conceptuales — Mandado

| Elemento | Regla |
|----------|-------|
| Estructura base | 3 ítems planeados por periodo |
| Monto base por compra | $2,000 |
| Acciones | Editar presupuesto por compra, cambiar fecha, registrar gasto real, cancelar, agregar extraordinaria, eliminar futura, observaciones |

Comportamiento de acciones específicas:

- **Agregar compra extraordinaria:** crea un ítem planeado adicional fuera de las 3 base; incrementa gasto esperado y puede afectar límite/overrides del periodo.
- **Cancelar compra futura:** marca como Cancelado; excluye de totales pero conserva el registro para contexto.
- **Eliminar compra futura:** quita un ítem planeado que aún no ocurrió; no afecta compras ya realizadas ni historial de periodos pasados; distinto de cancelar (no conserva intención de gasto).

Totales exigidos por periodo:

- Total planeado, total real, total restante de Mandado.

### Entradas conceptuales — Salidas

| Elemento | Regla |
|----------|-------|
| Estructura base | 4 ítems planeados por periodo |
| Monto base por salida | $500 |
| Acciones | Editar presupuesto por salida, cambiar fecha, registrar gasto real, cancelar, agregar extraordinaria, eliminar futura, observaciones |

Comportamiento de acciones específicas:

- **Agregar salida extraordinaria:** crea un ítem planeado adicional fuera de las 4 base; incrementa gasto esperado y puede afectar límite/overrides del periodo.
- **Cancelar salida futura:** marca como Cancelado; excluye de totales pero conserva el registro para contexto.
- **Eliminar salida futura:** elimina un ítem planeado que aún no ocurrió; no afecta salidas ya realizadas ni historial de periodos pasados; distinto de cancelar (no conserva intención de gasto).

Totales exigidos: planeado, real, restante.

### Entradas conceptuales — Extras

| Elemento | Regla |
|----------|-------|
| Presupuesto base mensual | $1,400 |
| Registros | Uno o varios extras por periodo |
| Campos | Fecha, cuenta, monto planeado, monto real, categoría de extra, observaciones |
| Acciones | Crear categoría de extra, cancelar, consultar presupuesto restante |
| Categorías personalizadas | CRUD según [`03-functional-accounts-and-movements.md`](03-functional-accounts-and-movements.md); el usuario crea, renombra y desactiva categorías de Extras sin perder historial |

El presupuesto de Extras puede cambiar **por mes** sin obligar a modificar meses históricos.

### Retiro combinado Salidas + Mandado ($6,250)

| Regla | Detalle |
|-------|---------|
| Naturaleza | **Transferencia interna** Débito (u origen elegido) → Efectivo |
| ¿Es gasto? | **No** |
| Efecto en origen | Disminuye saldo |
| Efecto en Efectivo | Aumenta saldo |
| Relación con Mandado/Salidas | Gastos de esas categorías consumen Efectivo después |
| Cobertura | El sistema indica si $6,250 base cubrió, quedó corto o sobró vs gasto real combinado de Mandado y Salidas |
| Efectivo restante | Saldo de la cuenta Efectivo al cierre del periodo según definición de `01`; consultable con desglose de saldo inicial de Efectivo, retiros/transferencias recibidas y gastos realizados pagados desde Efectivo |
| Cambio futuro | Monto base editable para periodos futuros con propagación (`02`) |

### Límites y presupuesto restante

**Presupuesto restante (real):**

`límite de categoría − gasto realizado de la categoría`

**Presupuesto proyectado restante (cuando aplica):**

Considera además ítems **planeados** no realizados.

Deben mostrarse **por separado** cuando existan planeados pendientes.

| Categoría | Fuente del límite |
|-----------|-------------------|
| Servicios | Suma de servicios activos o límite de periodo |
| Mandado | $6,000 base o override |
| Salidas | $2,000 base o override |
| Extras | $1,400 base o override por periodo |

### Overrides por periodo

| Concepto | Comportamiento |
|----------|----------------|
| **Override** | Cambio de límite o ítem que aplica **solo** al periodo editado |
| **Marcador** | Debe distinguirse visualmente de valor generado por plantilla |
| **Interacción con plantilla** | Propagación futura de plantilla pregunta si sobrescribe overrides en meses afectados |
| **Historial** | Overrides pasados no cambian al editar plantilla desde mes posterior |

### Cambios futuros (plantillas recurrentes)

1. Editar monto, ocurrencias o vigencia de una plantilla desde periodo **P** con alcance futuro:
   - Aplica a **P** y periodos posteriores confirmados.
   - Periodos anteriores a **P** intactos.
2. Requiere previsualización y confirmación según `02`.
3. Ejemplos: subir presupuesto de Mandado a $2,200 desde Abril; cambiar retiro a $6,500 desde Junio; pausar Netflix desde Mayo.

### Salidas conceptuales

| Salida | Descripción |
|--------|-------------|
| Ítems planeados por grupo | Lista generada por plantillas + ajustes del periodo |
| Límite por categoría | Tope del periodo (base u override) |
| Gasto esperado del grupo | Suma de planeados activos |
| Gasto real del grupo | Suma de realizados |
| Restante real y proyectado | Según fórmulas anteriores |
| Estado del retiro | Suficiente / insuficiente / excedente vs Mandado+Salidas reales |
| Efectivo restante | Saldo Efectivo al cierre: saldo inicial de Efectivo + retiros/transferencias recibidas − gastos realizados pagados desde Efectivo; desglose consultable de cada componente |
| Alerta de límite | Cuando gasto real o proyectado supera límite |

## Tareas

1. Documentar defaults Mandado, Salidas, Extras y retiro con montos base del PRD.
2. Especificar ciclo de vida de servicios recurrentes (activo, pausado, eliminado de futuros).
3. Definir overrides vs cambios de plantilla con alcance futuro.
4. Separar semántica del retiro $6,250 vs consumo Mandado/Salidas.
5. Definir cálculo de restante real vs proyectado por categoría.
6. Documentar acciones específicas de Mandado (extraordinaria, cancelar/eliminar futura), Salidas (extraordinaria, cancelar/eliminar futura) y Extras (categorías personalizadas vía `03`).
7. Documentar desglose del retiro $6,250, cobertura suficiente/insuficiente/excedente y efectivo restante.

## Criterios de aceptación

1. **CA-01** Al iniciar, Mandado tiene 3 compras planeadas de $2,000 ($6,000 mensual).
2. **CA-02** Al iniciar, Salidas tiene 4 salidas de $500 ($2,000 mensual).
3. **CA-03** Al iniciar, Extras tiene presupuesto de $1,400.
4. **CA-04** Al iniciar, retiro combinado es $6,250 como transferencia a Efectivo, no gasto.
5. **CA-05** El usuario puede agregar, pausar, editar y eliminar servicios de meses futuros.
6. **CA-06** El usuario puede registrar monto real distinto al esperado en servicios e ítems de Mandado/Salidas/Extras.
7. **CA-07** Cancelar un ítem planeado lo excluye de totales pero conserva el registro.
8. **CA-08** Override de un solo mes no altera otros meses salvo propagación explícita.
9. **CA-09** Cambio de plantilla desde un mes muestra previsualización de impacto en futuros (`02`).
10. **CA-10** Presupuesto restante real usa solo gastos realizados; proyectado incluye planeados pendientes.
11. **CA-11** El sistema reporta si el retiro cubrió, quedó corto o sobró frente al gasto real combinado de Mandado y Salidas en el periodo (suficiente / insuficiente / excedente).
12. **CA-12** Modificar retiro base aplica solo a futuros confirmados; historial previo intacto.
13. **CA-13** El usuario puede agregar una compra extraordinaria de Mandado fuera de las 3 base; aparece en gasto esperado y desglose de Mandado.
14. **CA-14** El usuario puede cancelar una compra futura de Mandado que aún no ocurrió; queda excluida de totales del periodo pero conservada en historial.
15. **CA-15** El usuario puede eliminar una compra futura de Mandado que aún no ocurrió; desaparece del periodo sin afectar compras ya realizadas ni el historial de periodos pasados.
16. **CA-16** El usuario puede agregar una salida extraordinaria de Salidas fuera de las 4 base; aparece en gasto esperado y desglose de Salidas.
17. **CA-17** El usuario puede cancelar una salida futura de Salidas que aún no ocurrió; queda excluida de totales del periodo pero conservada en historial.
18. **CA-18** El usuario puede eliminar una salida futura de Salidas que aún no ocurrió; desaparece del periodo sin afectar salidas ya realizadas ni el historial de periodos pasados.
19. **CA-19** El usuario puede crear una categoría personalizada de Extras (vía CRUD de `03`); queda disponible para nuevos extras.
20. **CA-20** El usuario puede registrar un extra usando una categoría personalizada activa; aparece en desglose de Extras y presupuesto restante.
21. **CA-21** Desde totales de Mandado, Salidas o Extras, el usuario puede consultar el desglose de ítems que explican planeado, real y restante (MVP #22, vía `03`).
22. **CA-22** Desde totales de Servicios mensuales, el usuario puede consultar el desglose de servicios activos e ítems que explican planeado, real y restante (MVP #22, vía `03`).
23. **CA-23** Desde el retiro combinado $6,250, el usuario puede consultar el desglose de la transferencia (origen, destino Efectivo, monto, fecha, estado) y su efecto en el saldo de Efectivo del periodo.
24. **CA-24** Desde el estado de cobertura del retiro (suficiente / insuficiente / excedente), el usuario puede consultar el desglose que compara monto retirado vs gasto real de Mandado y Salidas pagado desde Efectivo.
25. **CA-25** El usuario puede consultar **efectivo restante** (saldo Efectivo al cierre, no Débito ni Klar) con desglose de saldo inicial Efectivo, retiros/transferencias recibidas y gastos realizados pagados desde Efectivo en el periodo; la suma coincide con la cifra mostrada (`01`).

## Verificación

| ID | Verificación documental |
|----|-------------------------|
| V-01 | Montos 3×2000, 4×500, 1400, 6250 coinciden con PRD §9.6–9.9 y MVP #5–9 |
| V-02 | Retiro clasificado como transferencia en todo el spec; nunca como gasto |
| V-03 | Override vs propagación coherente con `02` |
| V-04 | Servicios pausados no generan expectativas futuras |
| V-05 | Restante real vs proyectado definidos sin ambigüedad |
| V-06 | Términos «plantilla recurrente», «ítem planeado», «transferencia» alineados con `01` |
| V-07 | Sin endpoints, SQL, Prisma, React, fixtures ni datos de usuario inventados |
| V-08 | Sin placeholders |
| V-09 | Acciones Mandado/Salidas/Extras alineadas con PRD §9.6–9.8 |
| V-10 | Categorías personalizadas de Extras remiten a CRUD de `03` |
| V-11 | Desglose por categoría (Servicios, Mandado, Salidas, Extras) referenciado a MVP #22 vía `03`; CA-21 y CA-22 |
| V-12 | Desglose de retiro $6,250, cobertura y efectivo restante documentados; CA-23–CA-25 alineados con `01` |

## Impacto y riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Retiro contado como gasto | Doble conteo con Mandado/Salidas | Transferencia explícita CA-04 |
| Propagación borra overrides | Pérdida de excepciones mensuales | Previsualización override vs plantilla |
| Servicio eliminado borra historial | Meses pasados inexplicables | Eliminar solo de futuros; pausar preferido |
| Confundir límite con gasto real | Alertas incorrectas | Restante real vs proyectado CA-10 |
| Retiro insuficiente no visible | Efectivo negativo sorpresa | Estado suficiente/insuficiente/excedente CA-11; efectivo restante CA-25 |

**Dependientes:** `05` usa transferencias hacia Klar; UX `13` presenta secciones; Backend `08` calcula límites.
