# Fundamentos visuales

**Tipo:** UX/UI  
**Depende de:** [`01-functional-domain-and-rules.md`](01-functional-domain-and-rules.md), [`docs/architecture/finance-app/architecture.md`](../../architecture/finance-app/architecture.md)  
**Implementa:** Sistema de diseño base para `repos/finance-app`: intent visual, tokens semánticos, tipografía, espaciado, tratamiento numérico, firma distintiva y roles de contenido reutilizables en specs `11`–`15`.  
**No incluye:** Funcionalidad, reglas de negocio, endpoints, SQL, Prisma, implementación React, JSON, fixtures, mock data, importes concretos, nombres de cuentas reales, payloads ni ejemplos de registros.

## Resultado

Un contrato visual único que define cómo debe sentirse y leerse la aplicación financiera: calma, claridad y confianza en cifras. Todo componente posterior hereda tokens, tipografía tabular para montos, jerarquía de información y estados visuales estándar sin redefinir estilo por pantalla.

## Contratos de entrada y salida

### Roles visuales de contenido (vocabulario UI)

| Rol | Uso en interfaz |
|-----|-----------------|
| **Etiqueta de periodo** | Mes y año seleccionado o consultado |
| **Clasificador temporal** | Indicador pasado / actual / futuro (informativo, no restrictivo) |
| **Monto principal** | Cifra focal del bloque (ahorro, disponible, total) |
| **Monto secundario** | Cifra de apoyo o comparación |
| **Monto derivado** | Subtotal, restante, diferencia plan vs real |
| **Etiqueta de cuenta** | Nombre configurable mostrado por el usuario |
| **Tipo de cuenta** | Débito, Efectivo, Crédito, Fondo de ahorro, Otro |
| **Concepto de movimiento** | Descripción legible de un registro |
| **Estado de ítem** | Planeado, Realizado, Cancelado |
| **Estado de cobertura** | Suficiente, Insuficiente, Excedente (retiro vs consumo) |
| **Alerta de presupuesto** | Aviso cuando gasto se acerca o supera límite |
| **Alerta de ahorro** | Aviso cuando proyección de cierre es negativa o baja |
| **Sugerencia informativa** | Recomendación explicativa; no muta datos |
| **Estado vacío** | Ausencia de registros con guía de acción |
| **Estado de carga** | Placeholder mientras llega información |
| **Estado de error** | Fallo recuperable o irrecuperable |
| **Marcador de override** | Valor editado puntualmente vs generado por plantilla |
| **Marcador de transferencia** | Movimiento interno; no es gasto ni ingreso |
| **Enlace de desglose** | Acceso desde total agregado a lista explicativa |

### Tokens semánticos de color

| Token | Intención | Aplicación |
|-------|-----------|------------|
| `surface-base` | Fondo principal de la aplicación | Shell, páginas |
| `surface-raised` | Tarjetas y paneles elevados | Resumen, secciones de detalle |
| `surface-sunken` | Zonas de datos densos | Tablas, listas de movimientos |
| `surface-overlay` | Capa sobre contenido | Backdrop de diálogo, drawer |
| `border-subtle` | Separación sin ruido | Divisores, bordes de tarjeta |
| `border-strong` | Énfasis estructural | Encabezados de tabla, focos de sección |
| `text-primary` | Contenido principal | Etiquetas, conceptos |
| `text-secondary` | Metadatos y apoyo | Fechas, subtítulos |
| `text-muted` | Información terciaria | Ayudas, hints |
| `text-inverse` | Sobre superficies de acento | Botones primarios |
| `accent-primary` | Acción principal y foco de marca | CTA, elemento activo de navegación |
| `accent-secondary` | Acción secundaria | Enlaces, acciones alternativas |
| `semantic-positive` | Saldo favorable, restante saludable, ahorro positivo | Montos, badges |
| `semantic-negative` | Déficit, sobre presupuesto, deuda destacada | Montos, alertas críticas |
| `semantic-warning` | Proximidad a límite, atención requerida | Barras de progreso, alertas |
| `semantic-info` | Información neutral explicativa | Sugerencias, tooltips |
| `semantic-planned` | Estado planeado | Badges, filas atenuadas |
| `semantic-realized` | Estado realizado | Badges, filas sólidas |
| `semantic-cancelled` | Estado cancelado | Badges tachados o atenuados |
| `semantic-transfer` | Transferencia interna | Iconografía y etiqueta distintiva |
| `semantic-credit` | Contexto de tarjeta y deuda | Paneles de crédito |
| `semantic-cash` | Contexto de efectivo disponible y retiros | Paneles efectivo, retiro, métricas de saldo Efectivo |
| `semantic-savings` | Contexto de fondo de ahorro | Paneles Klar |
| `focus-ring` | Indicador de foco accesible | Todos los controles interactivos |

### Color world (intención)

- **Base:** tonos neutros cálidos o fríos suaves (gris azulado o gris cálido) que no compiten con cifras.
- **Acento:** un solo color de marca sobrio (verde profundo, azul petróleo o índigo) reservado para acciones y navegación activa; nunca para montos positivos/negativos por sí solo.
- **Semántica:** verde/rojo/ámbar solo para significado financiero (positivo, negativo, advertencia); nunca como decoración.
- **Modo claro** como default del MVP; tokens preparados para modo oscuro futuro sin redefinir semántica.

### Tipografía

| Rol tipográfico | Tratamiento | Uso |
|-----------------|-------------|-----|
| **Display** | Peso semibold, escala mayor | Monto focal de ahorro o disponible |
| **Heading 1** | Semibold | Título de página |
| **Heading 2** | Medium | Título de sección |
| **Heading 3** | Medium, tamaño menor | Subsección (Servicios, Mandado, etc.) |
| **Body** | Regular | Texto corrido, conceptos |
| **Label** | Medium, tamaño pequeño | Etiquetas de campo y columna |
| **Caption** | Regular, tamaño pequeño, color secundario | Metadatos, fechas |
| **Numeric** | Tabular nums, alineación derecha en columnas | Todos los montos y totales |

### Escala tipográfica mínima

Escala relativa obligatoria (valores orientativos; la implementación elige fuente concreta):

| Rol | Escala mínima | Line-height orientativo |
|-----|---------------|-------------------------|
| **Display** | 2rem (32 px) | 1.2 |
| **Heading 1** | 1.5rem (24 px) | 1.3 |
| **Heading 2** | 1.25rem (20 px) | 1.35 |
| **Heading 3** | 1.125rem (18 px) | 1.4 |
| **Body** | 1rem (16 px) | 1.5 |
| **Label** | 0.875rem (14 px) | 1.4 |
| **Caption** | 0.875rem (14 px) | 1.4 |
| **Numeric** | Hereda del bloque padre | 1.2 en filas densas |

Reglas:

- Fuente sans-serif legible en pantalla (Inter, system-ui o equivalente del workspace).
- `font-variant-numeric: tabular-nums` obligatorio en montos, totales y columnas numéricas.
- Alineación decimal consistente en tablas y tarjetas comparativas.
- Formato de presentación MXN con símbolo y separadores locales (`es-MX`); la capa visual asume cadena ya formateada o slot de contenido.

### Espaciado y layout

| Token | Uso |
|-------|-----|
| `space-xs` | Entre icono y etiqueta |
| `space-sm` | Entre elementos relacionados en fila |
| `space-md` | Padding interno de tarjeta |
| `space-lg` | Separación entre bloques dentro de sección |
| `space-xl` | Separación entre secciones principales |
| `space-2xl` | Margen de página y respiración del shell |

- Grid base de **8 px**; todos los espaciados múltiplos de 4 u 8.
- Ancho máximo de contenido legible en desktop (~1200–1280 px) con márgenes laterales generosos.
- Densidad **cómoda** por default; tablas de movimientos permiten variante **compacta** visual (menor padding de fila) sin cambiar tokens.

### Profundidad y elevación (estrategia de tokens)

Jerarquía de superficie sin sombras decorativas; máximo **tres niveles** de elevación perceptible:

| Nivel | Token | Uso | Tratamiento |
|-------|-------|-----|-------------|
| 0 | `surface-base` | Fondo de app y shell | Plano; sin sombra |
| 1 | `surface-raised` | Tarjetas de métrica, paneles, modales | Borde `border-subtle` + sombra mínima opcional |
| 2 | `surface-sunken` | Tablas, listas densas, zonas de datos | Fondo ligeramente hundido o borde interno |
| Overlay | `surface-overlay` | Backdrop de diálogo/drawer | Capa semitransparente sobre nivel 0 |

Reglas:

- La elevación comunica **contenedor**, no significado financiero (positivo/negativo sigue en tokens semánticos).
- Modales y sheets usan `surface-raised` sobre `surface-overlay`; nunca un cuarto nivel de sombra.
- Sticky headers y nav usan `surface-base` o `surface-raised` con borde inferior `border-subtle`, no sombra fuerte.

### Hit area mínima (controles interactivos)

| Control | Área táctil mínima |
|---------|-------------------|
| Botones, iconos accionables, chevrons de navegación | **44×44 px** incluyendo padding invisible |
| Filas de lista seleccionables (móvil) | Altura mínima **48 px** |
| Targets adyacentes | Separación mínima **8 px** entre áreas táctiles |

Los specs `11`–`15` heredan esta regla; no redefinen tamaños menores salvo excepción documentada en `15`.

### Firma visual distintiva

1. **Focal numérico:** una cifra hero por vista (ahorro esperado en dashboard; total de sección en detalle) con display tipográfico y contexto inmediato debajo.
2. **Plan vs real:** siempre en pares visuales alineados (esperado | real | diferencia) con codificación de color semántica moderada.
3. **Separación crédito / efectivo / ahorro:** tres «mundos» visuales diferenciados por iconografía y tokens `semantic-credit`, `semantic-cash` y `semantic-savings`; nunca mezclar en un solo bloque sin etiqueta.
4. **Transferencias visibles:** movimientos internos con tratamiento `semantic-transfer` (icono de intercambio, etiqueta explícita) para evitar confusión con gasto.
5. **Calma operativa:** bordes suaves, sombras mínimas, animaciones discretas; la interfaz prioriza escaneo rápido sobre ornamentación.

### Componentes base (piezas visuales)

| Pieza | Anatomía visual |
|-------|-----------------|
| **Tarjeta de métrica** | Etiqueta, monto principal, subtítulo opcional, enlace de desglose |
| **Barra de progreso de presupuesto** | Pista, relleno, etiquetas de límite y restante |
| **Badge de estado** | Texto corto + color semántico |
| **Badge temporal** | Pasado / actual / futuro |
| **Fila de lista / tabla** | Concepto, fecha, monto alineado, badge, acciones |
| **Botón primario / secundario / ghost / destructivo** | Altura mínima táctil, focus ring |
| **Campo de formulario** | Label, input, hint, mensaje de error |
| **Diálogo** | Overlay, panel, título, cuerpo, acciones alineadas a la derecha |
| **Toast / banner** | Icono, mensaje, acción opcional |
| **Skeleton** | Bloques animados que respetan layout final |
| **Empty state** | Ilustración o icono ligero, título, descripción, CTA |

### Matriz de estados por pieza base (verificable)

Leyenda: ● = estado obligatorio documentado; — = no aplica.

| Pieza | default | loading | empty | error | disabled | variantes |
|-------|---------|---------|-------|-------|----------|-----------|
| **Tarjeta de métrica** | ● | ● skeleton | ● | ● | — | — |
| **Barra de progreso** | ● normal | — | — | — | — | ● warning, ● over-budget |
| **Badge de estado** | ● | — | — | — | — | ● planeado, ● realizado, ● cancelado, ● transferencia |
| **Badge temporal** | ● pasado/futuro | — | — | — | — | ● actual (énfasis) |
| **Fila lista/tabla** | ● | — | — | — | — | ● hover, ● selected, ● oculto-atenuado |
| **Botón** | ● | ● | — | — | ● | ● hover, ● active |
| **Campo formulario** | ● | — | — | ● | ● | ● focus, ● readonly |
| **Diálogo** | ● | ● confirmación | — | ● | — | — |
| **Toast / banner** | ● | — | — | ● | — | ● info, ● success, ● warning |
| **Skeleton** | — | ● | — | — | — | — |
| **Empty state** | ● | — | ● | — | — | — |

### Iconografía

- Set consistente (lucide o equivalente del workspace); tamaños 16 px inline, 20 px en navegación, 24 px en empty states.
- Iconos de cuenta por tipo (débito, efectivo, crédito, fondo, otro) definidos una vez y reutilizados.
- Icono de desglose (chevron o «abrir detalle») en totales agregados.

## Tareas

1. Documentar intent visual, color world y firma distintiva.
2. Definir tokens semánticos de color, tipografía y espaciado.
3. Establecer roles de contenido UI reutilizables (sin datos concretos).
4. Describir anatomía y matriz verificable de estados visuales de piezas base.
5. Fijar escala tipográfica mínima, hit area 44×44 px y estrategia de profundidad (tokens de elevación).
6. Fijar reglas de presentación numérica tabular y formato MXN a nivel visual.

## Criterios de aceptación

1. **CA-01** Todo spec UX/UI posterior referencia tokens y roles definidos aquí sin redefinir colores ad hoc.
2. **CA-02** Montos usan rol **Numeric** con alineación tabular documentada.
3. **CA-03** Estados Planeado, Realizado, Cancelado y Transferencia tienen badge y color semántico únicos.
4. **CA-04** Plan vs real se presenta siempre como par o trío visual coherente.
5. **CA-05** Crédito, efectivo (`semantic-cash`) y fondo de ahorro tienen tratamiento visual separado.
6. **CA-06** Cada pieza base tiene estados verificables en la matriz de estados; donde un estado no aplica aparece marcado explícitamente (—).
7. **CA-07** No aparecen importes concretos, nombres de cuentas reales, JSON, fixtures ni payloads.
8. **CA-08** Focus ring (`focus-ring`) definido para todos los controles interactivos.
9. **CA-09** Token `semantic-cash` documentado junto a `semantic-credit` y `semantic-savings` para separación de mundos financieros.
10. **CA-10** Escala tipográfica mínima, hit area 44×44 px y estrategia de profundidad (tres niveles + overlay) documentadas sin código de implementación.

## Verificación

| ID | Verificación documental |
|----|-------------------------|
| V-01 | Buscar importes numéricos concretos o nombres de cuenta reales → cero |
| V-02 | Buscar endpoints, SQL, Prisma, React, JSON, fixtures → cero |
| V-03 | Tokens semánticos cubren positivo, negativo, warning, planeado, realizado, cancelado, transferencia, crédito, efectivo (`semantic-cash`) y ahorro |
| V-04 | Tipografía tabular documentada para montos |
| V-05 | Firma visual incluye separación crédito/efectivo/ahorro con tokens `semantic-credit`, `semantic-cash`, `semantic-savings` |
| V-06 | Matriz de estados cubre las once piezas base con celdas ● o — explícitas |
| V-07 | Escala tipográfica mínima, hit area 44×44 y profundidad (niveles 0–2 + overlay) documentados |
| V-08 | Sin placeholders (`TBD`, `TODO`, `por definir`) |

## Impacto y riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Inconsistencia entre pantallas | Confianza erosionada | Tokens únicos; specs `11`–`15` heredan |
| Montos ilegibles o desalineados | Errores de lectura | Tabular nums obligatorio |
| Color solo decorativo | Confusión semántica | Color reservado a tokens semánticos |
| Sobrecarga visual en densidad de tablas | Fatiga | Variante compacta documentada |
| Modo oscuro no planificado | Retrabajo futuro | Tokens nombrados por semántica, no por hex fijo |

**Dependientes:** `11`–`15` consumen este sistema; Integración no redefine aspecto visual.
