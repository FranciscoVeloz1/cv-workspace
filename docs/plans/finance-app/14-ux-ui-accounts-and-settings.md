# Cuentas, categorías y preferencias

**Tipo:** UX/UI  
**Depende de:** [`03-functional-accounts-and-movements.md`](03-functional-accounts-and-movements.md), [`04-functional-budgets-and-recurring.md`](04-functional-budgets-and-recurring.md), [`10-ux-ui-visual-foundations.md`](10-ux-ui-visual-foundations.md)  
**Implementa:** Composición visual de pantallas de administración de cuentas configurables, pantalla de detalle de cuenta (destino desde dashboard), categorías personalizadas, reglas recurrentes (plantillas) y preferencias de interfaz; empty states y tratamiento visual de desactivación.  
**No incluye:** Funcionalidad, reglas de negocio, endpoints, SQL, Prisma, implementación React, JSON, fixtures, mock data, importes concretos, nombres de cuentas reales, payloads, detalle de periodo ni composición del dashboard (origen del handoff en `12`).

## Resultado

El usuario configura su espacio financiero en pantallas de administración claras: listas escaneables de cuentas y categorías, formularios de alta/edición con tipo de cuenta explícito, reglas recurrentes con vigencia visible, y preferencias de UI — con estados vacíos que guían la primera configuración y desactivación que conserva contexto histórico visible. Desde el resumen mensual puede profundizar en el detalle visual de una cuenta concreta.

## Contratos de entrada y salida

### Pantalla detalle de cuenta — layout (destino desde dashboard, PRD §9.14)

Pantalla conceptual de consulta y contexto por cuenta; distinta de la lista de administración. Origen del handoff en [`12`](12-ux-ui-dashboard-and-timeline.md).

```
┌─ Header: etiqueta de cuenta + tipo + control regreso ────────────────────┐
├─ Contexto de periodo (etiqueta de periodo si llega desde resumen) ─────┤
├─ Métricas clave: saldo inicial, movimientos del periodo, saldo derivado │
├─ Lista de movimientos del periodo (rol filtrado por cuenta) ───────────┤
└─ Acciones secundarias: editar cuenta (enlace al formulario de esta spec) │
```

| Rol | Tratamiento |
|-----|-------------|
| **Encabezado cuenta** | Icono de tipo + etiqueta de cuenta + badge de tipo legible |
| **Contexto periodo** | Etiqueta de periodo visible cuando el origen es resumen mensual; ocultable si llegada directa desde administración |
| **Métricas clave** | Saldo inicial, total movimientos del periodo, saldo derivado — roles numéricos sin cifras ejemplo |
| **Lista movimientos** | Misma gramática de fila que detalle de periodo (`13`) pero acotada a la cuenta activa |
| **Regreso** | «Volver al resumen» hacia dashboard del mismo periodo, o «Volver a Cuentas» si origen administración |
| **Estado focus al llegar** | Foco en encabezado o primera fila de movimientos; coherente con `15` |
| **Empty movimientos** | Estado vacío contextual: «Sin movimientos en este periodo para esta cuenta» |

### Pantalla Cuentas — layout

```
┌─ Título «Cuentas» + acción agregar ─────────────────────────────────────┐
├─ Lista de cuentas activas ───────────────────────────────────────────────┤
│  [icono tipo] Nombre cuenta    Tipo    Saldo derivado    [acciones ▾]   │
├─ Sección cuentas inactivas (colapsable) ─────────────────────────────────┤
│  Filas atenuadas + badge «Inactiva»                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

### Roles visuales — Cuenta

| Rol | Tratamiento |
|-----|-------------|
| **Fila cuenta activa** | Icono por tipo, nombre, tipo legible, saldo derivado alineado |
| **Fila cuenta inactiva** | Opacidad ~60%, badge «Inactiva», sin acciones de nuevo movimiento (desactivación conserva historial en [`03`](03-functional-accounts-and-movements.md)) |
| **Tipo Débito / Efectivo / Crédito / Fondo / Otro** | Icono + color sutil de acento por tipo |
| **Campos crédito** | Límite, deuda inicial, fechas corte/pago en subpanel expandible (campos de cuenta Crédito en [`03`](03-functional-accounts-and-movements.md)) |
| **Saldo inicial** | Campo en formulario de alta/edición (saldo inicial de cuenta en [`03`](03-functional-accounts-and-movements.md)) |
| **Participación en proyecciones** | Toggle con hint explicativo |
| **Empty cuentas** | Ilustración ligera, título, descripción, CTA «Agregar primera cuenta» |
| **Acción desactivar** | En menú contextual; confirmación modal |
| **Acción eliminar** | Solo visible si sin historial (regla en [`03`](03-functional-accounts-and-movements.md)); estilo destructivo; confirmación |

### Formulario cuenta (modal o página dedicada)

| Campo visual | Componente |
|--------------|--------------|
| Nombre | Input texto |
| Tipo | Select con iconos por opción |
| Saldo inicial | Input numérico tabular |
| Límite / deuda | Visible solo si tipo Crédito |
| Fechas opcionales | Date pickers agrupados |
| Toggle proyección | Switch + caption |
| Acciones | Cancelar / Guardar |

### Pantalla Categorías — layout

```
┌─ Título «Categorías» + filtro por grupo padre ──────────────────────────┐
├─ Grupos: Servicios | Mandado | Salidas | Extras | … ────────────────────┤
│  Lista de categorías activas del grupo                                   │
│  Subsección categorías personalizadas (Extras)                           │
├─ Inactivas (colapsable) ─────────────────────────────────────────────────┤
└──────────────────────────────────────────────────────────────────────────┘
```

### Roles visuales — Categoría

| Rol | Tratamiento |
|-----|-------------|
| **Fila categoría activa** | Nombre, grupo padre, contador opcional de uso |
| **Categoría personalizada** | Badge «Personalizada» |
| **Fila inactiva** | Atenuada + badge «Inactiva» |
| **Empty categorías** | Contextual por grupo |
| **Formulario** | Nombre + selector grupo padre |

### Pantalla Reglas recurrentes (plantillas)

```
┌─ Título «Reglas recurrentes» + acción agregar ──────────────────────────┐
├─ Tarjetas o filas por plantilla ─────────────────────────────────────────┤
│  Nombre regla | Grupo (Servicio/Mandado/…) | Vigencia desde | Estado     │
│  Badge activa / pausada                                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Roles visuales — Plantilla recurrente

| Rol | Tratamiento |
|-----|-------------|
| **Tarjeta plantilla activa** | Nombre, grupo, monto base (rol monto, sin cifra ejemplo), vigencia |
| **Plantilla pausada** | Badge + fila atenuada |
| **Indicador alcance futuro** | Icono calendario cuando edición afecta futuros |
| **Empty plantillas** | CTA contextual según grupo |
| **Editor plantilla** | Campos según tipo: servicio vs presupuesto base vs retiro (tipos de plantilla en [`04`](04-functional-budgets-and-recurring.md)) |

Servicios recurrentes comparten lista con otras plantillas; agrupación visual por tipo de regla (vigencia y pausa en [`04`](04-functional-budgets-and-recurring.md)).

### Pantalla Preferencias / Configuración

| Preferencia visual | Control |
|--------------------|---------|
| Densidad de tablas | Radio: cómoda / compacta |
| Ocultar cancelados por default | Toggle |
| Ocultar planeados por default | Toggle |
| Mostrar clasificador temporal | Toggle |
| Animaciones reducidas | Toggle (respeta también preferencia del sistema) |
| Formato numérico | Solo lectura «MXN» en MVP |

Layout simple: lista de filas preferencia + control alineado a la derecha.

### Desactivación — gramática visual transversal

| Acción | Efecto visual |
|--------|---------------|
| **Desactivar cuenta/categoría/plantilla** | Sale de listas activas; aparece en sección inactivas (conservación de historial en [`03`](03-functional-accounts-and-movements.md) / [`04`](04-functional-budgets-and-recurring.md)) |
| **En selectores de formulario** | No listada en nuevos registros |
| **En periodos históricos** | Sigue visible en lectura con badge histórico |
| **Confirmación** | Modal explica que historial se conserva (sin redefinir regla de borrado) |

### Menús contextuales y acciones

- Icono «⋯» al final de fila; acciones: editar, desactivar, eliminar (condicional).
- Eliminar usa color destructivo y segunda confirmación.

### Estados globales de pantalla

| Estado | Tratamiento |
|--------|-------------|
| **Loading** | Skeleton de lista |
| **Empty** | Empty state por pantalla con CTA |
| **Error** | Banner superior + reintentar |
| **Success mutación** | Toast breve |

## Tareas

1. Diseñar pantalla de detalle de cuenta como destino visual desde Resumen por cuenta (`12`).
2. Diseñar lista y formulario de cuentas con tipos e iconografía.
3. Diseñar lista y formulario de categorías con grupos y personalizadas.
4. Componer vista de reglas recurrentes con estados activa/pausada.
5. Definir pantalla de preferencias de interfaz.
6. Documentar gramática visual de desactivación e inactive sections.
7. Especificar empty states y confirmaciones destructivas.

## Criterios de aceptación

1. **CA-01** Pantalla detalle de cuenta documentada como destino desde Resumen por cuenta: encabezado, contexto de periodo, métricas clave, lista de movimientos y regreso; sin rutas ni lógica de datos.
2. **CA-02** Cada tipo de cuenta tiene icono y etiqueta legible distintivos.
3. **CA-03** Cuentas inactivas aparecen en sección separada atenuada, no mezcladas como activas.
4. **CA-04** Formulario de cuenta muestra campos de crédito solo cuando tipo es Crédito.
5. **CA-05** Categorías personalizadas tienen badge identificable en lista Extras.
6. **CA-06** Plantillas pausadas tienen badge y atenuación consistente con servicios pausados.
7. **CA-07** Desactivar muestra confirmación que comunica conservación de historial (alineado con [`03`](03-functional-accounts-and-movements.md)).
8. **CA-08** Eliminar usa estilo destructivo y no aparece para filas con indicador de historial (regla en [`03`](03-functional-accounts-and-movements.md)).
9. **CA-09** Empty state en cada pantalla principal incluye CTA de primera acción.
10. **CA-10** Preferencias incluyen toggles de visibilidad default y densidad de tablas.
11. **CA-11** Sin importes concretos, nombres de cuentas reales, JSON, fixtures ni payloads.

## Verificación

| ID | Verificación documental |
|----|-------------------------|
| V-01 | Pantalla detalle de cuenta alineada con affordance de `12` y PRD §9.14 (detalle por cuenta) |
| V-02 | Tipos de cuenta alineados con [`03`](03-functional-accounts-and-movements.md) (Débito, Efectivo, Crédito, Fondo, Otro) |
| V-03 | Plantillas y reglas recurrentes alineadas con [`04`](04-functional-budgets-and-recurring.md) |
| V-04 | Desactivación alineada con conservación de historial en [`03`](03-functional-accounts-and-movements.md) |
| V-05 | Sin endpoints, SQL, Prisma, React |
| V-06 | Tokens heredados de `10` |
| V-07 | Sin placeholders ni datos inventados |

## Impacto y riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Cuenta inactiva parece eliminada | Pánico del usuario | Sección inactivas explícita |
| Tipo crédito sin campos | Formulario incompleto | Subpanel condicional CA-03 |
| Plantillas vs servicios confusos | Duplicidad UI | Agrupación por tipo de regla |
| Eliminar demasiado visible | Pérdida de datos | Acción condicional CA-07 |

**Dependientes:** `12` consume destino de detalle por cuenta; `13` consume selectores de cuenta/categoría; Integración no redefine estas pantallas.
