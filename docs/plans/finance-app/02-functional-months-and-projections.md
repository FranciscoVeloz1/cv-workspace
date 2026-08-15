# Periodos mensuales y proyección

**Tipo:** Functional  
**Depende de:** [`01-functional-domain-and-rules.md`](01-functional-domain-and-rules.md), [`docs/briefs/finance-app/prd.md`](../../briefs/finance-app/prd.md)  
**Implementa:** Comportamiento de periodos pasados, actuales y futuros; línea de tiempo; edición histórica; propagación hacia el futuro; previsualización; confirmación; conflictos conceptuales.  
**No incluye:** Endpoints, SQL, Prisma, React, Express, componentes, nombres de archivos de implementación, fixtures de integración, detalle de cuentas/movimientos (ver `03`), presupuestos recurrentes (ver `04`), crédito/Klar (ver `05`).

## Resultado

El usuario puede navegar una línea de tiempo mensual cronológica, abrir cualquier periodo, crear periodos futuros, duplicar estructura desde un periodo existente, editar meses históricos y ver cómo un cambio confirmado recalcula saldos iniciales y proyecciones de periodos posteriores — siempre con previsualización previa y sin alterar periodos anteriores al punto de cambio.

## Contratos de entrada y salida

### Entradas conceptuales

| Entrada | Descripción |
|---------|-------------|
| Periodo identificado | Año + mes únicos por usuario |
| Clasificación temporal | Pasado, actual o futuro (derivada de fecha del sistema) |
| Cambio local | Modificación en un periodo: ingreso, presupuesto, ítem, movimiento o plantilla con alcance |
| Alcance de propagación | «Solo este periodo» vs «Este periodo y futuros» |
| Confirmación explícita | Acción del usuario que autoriza persistir tras ver previsualización |
| Versión del periodo | Marcador de concurrencia para detectar ediciones simultáneas |

### Salidas conceptuales

| Salida | Descripción |
|--------|-------------|
| Línea de tiempo | Lista ordenada de periodos con indicador pasado/actual/futuro y resumen mínimo |
| Resumen de periodo | Totales agregados sin abrir detalle completo; cada total expone desglose y trazabilidad según D13/CA-09 de `01`: cuentas, ingresos y gastos → `03`; retiro y efectivo restante → `04`; crédito, Klar, ahorro y plan vs real → `05` (MVP #22) |
| Saldo inicial por cuenta | Derivado del saldo final del periodo anterior |
| Saldo final por cuenta | Tras aplicar movimientos realizados del periodo |
| Proyección futura | Gasto esperado, ahorro esperado y saldos proyectados en periodos posteriores |
| Previsualización de impacto | Diff de totales y periodos afectados antes de confirmar |
| Conflicto de concurrencia | Rechazo cuando el periodo cambió desde que el usuario lo abrió |

### Clasificación de periodos

| Clase | Criterio | Editable | Uso principal |
|-------|----------|----------|---------------|
| **Pasado** | Mes anterior al actual | Sí | Corrección de historial |
| **Actual** | Mes en curso según calendario | Sí | Operación diaria |
| **Futuro** | Mes posterior al actual | Sí | Planificación |

Ninguna clase bloquea edición. La clasificación es informativa para la interfaz y sugerencias, no una restricción de negocio.

### Operaciones sobre periodos

| Operación | Comportamiento |
|-----------|----------------|
| **Consultar línea de tiempo** | Orden cronológico ascendente; resumen por periodo |
| **Abrir periodo** | Carga saldo inicial, ingreso, totales y acceso al detalle |
| **Crear periodo futuro** | Genera estructura vacía o desde defaults/plantillas vigentes |
| **Duplicar periodo** | Copia estructura planificada como punto de partida; ver reglas de duplicación abajo |
| **Editar periodo histórico** | Permitido; puede disparar propagación hacia adelante si el cambio lo requiere |

### Duplicación de periodo

Al duplicar la estructura de un periodo origen hacia un periodo destino:

| Elemento | ¿Se copia? | Comportamiento |
|----------|------------|----------------|
| Ingreso mensual esperado | Sí, como valor inicial | Editable en el periodo destino; no implica propagación automática |
| Ingresos extraordinarios realizados | **No** | Son hechos del periodo origen; el destino inicia sin ellos |
| Presupuestos base (Mandado, Salidas, Extras) | Sí, como punto de partida | Valores iniciales editables; pueden diferir si las plantillas vigentes cambiaron |
| Ítems planeados del origen | No directamente | Se **regeneran** según plantillas recurrentes y reglas vigentes al crear el destino |
| Plantillas recurrentes | No se duplican | Las existentes aplican al destino según su vigencia actual |
| Movimientos realizados | **No** | Nunca se copian |
| Overrides del origen | No automáticamente | El destino parte de defaults/plantillas, salvo que el usuario los replique |
| Historial del periodo origen | Conservado intacto | Duplicar no altera el origen ni sus movimientos |

Reglas adicionales:

1. Duplicar **no modifica** el periodo origen ni sus totales históricos.
2. El periodo destino queda en estado **planificable** (expectativas, no hechos realizados).
3. Si una plantilla recurrente cambió desde el origen, el destino refleja la **versión vigente**, no una copia literal obsoleta del origen.
4. El usuario puede editar cualquier valor inicial copiado antes de confirmar el periodo destino.

### Navegación entre periodos

1. Desde un periodo abierto, el usuario puede ir al **mes inmediatamente anterior** o **inmediatamente siguiente** en la línea de tiempo.
2. Si el mes consecutivo no existe, el sistema indica que no hay periodo y ofrece crearlo (si es futuro) o informa el límite (si es el más antiguo).
3. La navegación conserva el contexto de vista (resumen vs detalle) cuando sea posible.
4. El orden de navegación sigue el calendario: diciembre → enero del año siguiente es consecutivo.

### Edición histórica

1. Corregir un movimiento, ingreso o presupuesto en un periodo **pasado** es válido.
2. Si la corrección altera el **saldo final** de ese periodo, el **saldo inicial** del periodo inmediatamente siguiente debe recalcularse.
3. La cadena continúa hacia periodos futuros existentes hasta el último periodo del usuario.
4. Los periodos **anteriores** al editado **no** cambian automáticamente.
5. Las fechas originales de movimientos en periodos no editados se conservan.

### Propagación

**Disparadores típicos de propagación hacia el futuro:**

- Cambio en plantilla recurrente con alcance «desde este periodo en adelante»
- Modificación de ingreso mensual base aplicada a futuros
- Ajuste de presupuesto base de Mandado, Salidas o Extras con alcance futuro
- Cambio en monto del retiro de efectivo base para meses futuros

**Reglas:**

1. Propagación afecta el periodo origen y **todos los periodos futuros** dentro del alcance confirmado.
2. Periodos anteriores al origen conservan valores históricos.
3. Overrides puntuales de un solo mes (ver `04`) no se sobrescriben salvo confirmación explícita de «reemplazar override».
4. Tras confirmar, los totales derivados de periodos afectados deben ser **deterministas**: repetir la consulta produce el mismo resultado.

### Previsualización (simulación)

Antes de confirmar un cambio con propagación, el sistema debe calcular y mostrar **sin persistir**:

| Elemento de previsualización | Contenido |
|------------------------------|-----------|
| Periodo origen | Mes desde el cual aplica el cambio |
| Periodos afectados | Lista o rango de meses futuros impactados |
| Δ gasto esperado | Por periodo afectado, si aplica |
| Δ gasto real | Solo si el cambio toca movimientos realizados |
| Δ saldo por cuenta | Inicial/final en periodos afectados |
| Δ ahorro esperado | Por periodo afectado |
| Δ deuda / crédito disponible | Si el cambio involucra crédito (detalle en `05`) |

El usuario puede **descartar** la previsualización sin efecto en datos.

### Confirmación

1. Ningún cambio con propagación se persiste sin confirmación explícita tras previsualización.
2. Cambios locales sin impacto en periodos futuros (p. ej. override de un solo mes, observación, visibilidad) pueden confirmarse sin diálogo de propagación ampliado.
3. Tras confirmar, la línea de tiempo y resúmenes reflejan inmediatamente los nuevos derivados.

### Conflictos conceptuales

| Conflicto | Condición | Resolución esperada |
|-----------|-----------|---------------------|
| **Concurrencia** | Dos ediciones sobre el mismo periodo antes de guardar | Rechazar la segunda con mensaje de conflicto; usuario debe recargar y reintentar |
| **Override vs plantilla** | Plantilla futura choca con override previo en un mes | Previsualización muestra qué overrides serían sobrescritos; usuario elige |
| **Periodo inexistente** | Propagación requiere mes futuro no creado | Ofrecer crear periodos faltantes o acotar alcance |
| **Cadena de saldos rota** | Saldo final calculado ≠ saldo inicial del siguiente antes de editar | Tras confirmar, la cadena debe quedar consistente |

## Tareas

1. Definir reglas de clasificación pasado/actual/futuro y su presentación en línea de tiempo.
2. Especificar cuándo un cambio requiere previsualización de propagación vs confirmación simple.
3. Documentar recálculo de saldo inicial → saldo final → saldo inicial del siguiente periodo.
4. Documentar manejo conceptual de conflictos de concurrencia y override.
5. Alinear duplicación de periodo con defaults de `04` sin copiar hechos realizados ni ingresos extraordinarios.
6. Documentar navegación entre meses consecutivos alineada con PRD §9.2.

## Criterios de aceptación

1. **CA-01** El usuario ve periodos en orden cronológico con indicador pasado/actual/futuro.
2. **CA-02** Todo periodo es editable independientemente de su clasificación.
3. **CA-03** Crear un periodo futuro genera estructura planificable coherente con plantillas vigentes.
4. **CA-04** Duplicar un periodo: copia el ingreso mensual esperado como valor inicial editable; no copia ingresos extraordinarios realizados; regenera ítems planeados según plantillas vigentes; conserva intacto el historial del periodo origen; no copia movimientos realizados.
5. **CA-05** Editar Marzo y confirmar propagación actualiza saldos y proyecciones de Abril en adelante; Enero y Febrero no cambian.
6. **CA-06** Antes de propagar, el usuario ve periodos afectados y cambios en gasto esperado, saldos y ahorro esperado.
7. **CA-07** Descartar previsualización no modifica datos persistidos.
8. **CA-08** El saldo inicial de un periodo coincide con el saldo final del periodo anterior tras recálculo.
9. **CA-09** Dos ediciones concurrentes del mismo periodo producen conflicto detectable, no sobrescritura silenciosa.
10. **CA-10** Repetir consulta de totales tras confirmar produce resultados idénticos (determinismo).
11. **CA-11** El usuario puede navegar al mes inmediatamente anterior o siguiente desde un periodo abierto; si el consecutivo no existe, el sistema lo indica claramente.
12. **CA-12** El resumen de periodo expone desglose y trazabilidad de totales según D13/CA-09 de `01`, con dueños funcionales: ingresos, gastos, presupuesto por categoría y resumen de cuentas → `03`; retiro $6,250, suficiencia/excedente y efectivo restante → `04`; crédito, saldo Klar, ahorro y diferencia plan vs realidad → `05` (MVP #22).

## Verificación

| ID | Verificación documental |
|----|-------------------------|
| V-01 | Escenario Marzo → Abril+ documentado y alineado con PRD §9.2 y criterio MVP #19–20 |
| V-02 | Previsualización lista todos los elementos exigidos por PRD §9.13 |
| V-03 | «Pasado/actual/futuro» no aparece como bloqueo de edición en ningún criterio |
| V-04 | Propagación no altera periodos anteriores al origen |
| V-05 | Duplicar periodo distingue planeado vs realizado; no copia ingresos extraordinarios realizados |
| V-06 | Conflictos de concurrencia y override tienen resolución definida |
| V-07 | Términos «periodo», «propagación», «previsualización» coinciden con `01` |
| V-08 | Navegación consecutiva documentada y alineada con PRD §9.2 |
| V-09 | Sin referencias a endpoints, SQL, Prisma, React o fixtures |

## Impacto y riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Propagación accidental a muchos meses | Plan de gasto alterado sin intención | Previsualización obligatoria + confirmación |
| Edición histórica rompe cadena de saldos | Totales incoherentes | Recálculo en cascada documentado en CA-08 |
| Override silenciosamente borrado | Pérdida de excepciones mensuales | Conflicto override vs plantilla en previsualización |
| Concurrencia no detectada | Última escritura gana sin aviso | Conflicto explícito CA-09 |
| Confundir simulación con guardado | Datos corruptos percibidos | Descartar previsualización sin efecto CA-07 |

**Dependientes:** Backend `06`–`08`, UX `12`, Integración `18`–`19` usarán estas reglas para proyección y propagación.
