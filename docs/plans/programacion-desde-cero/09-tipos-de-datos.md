# Spec 09 — Tipos de datos

## Objetivo

Enseñar que cada valor en C# tiene un tipo, presentar cinco tipos básicos
(`int`, `double`, `bool`, `char`, `string`) y contrastar enteros con decimales,
sin una lista exhaustiva de .NET.

## Depende de

[08 — Qué es una variable](08-que-es-una-variable.md) (pedagógico). El brief
reintroduce la idea de valor tipado de forma autosuficiente.

## Desbloquea

[10 — Operadores aritméticos](10-operadores-aritmeticos.md)

## No incluye

Tipos nullable, enums, structs, arrays, genéricos, conversión avanzada ni
catálogo completo de tipos de .NET. No produce JSON.

## Salida

`repos/slides-generator/examples/scripts/tipos-de-datos.md`

## Contrato de entrada

```text
Topic: Qué son los tipos de datos
Audience: estudiantes de secundaria y personas sin experiencia en programación
Language: es
Goal: explicar que cada valor tiene un tipo y presentar int, double, bool, char y string
Tone: formal y neutral, con precisión técnica suficiente para una persona con formación doctoral, sin asumir experiencia previa
Duration: 45–60 segundos
Slide count: 6
Deck name: tipos-de-datos
Call to action: estudiar los operadores aritméticos
Visual/media preference: sugerencias; no inventar assets
Code preference: short csharp snippet covering five basic types
```

## Mapa de slides

Regla de copy: el `Texto en pantalla` de cada slide debe aparecer como frase
continua dentro de la `Voz en off` de esa misma slide.

**Slide 1 — Portada** (`cover`)

- Texto en pantalla: Hoy vemos qué son los tipos de datos.
- Voz en off: Los valores se clasifican según su naturaleza. Hoy vemos qué son los tipos de datos.

**Slide 2 — Definición** (`keyPoint`)

- Texto en pantalla: Cada valor tiene un tipo que determina qué operaciones son válidas.
- Voz en off: El tipo guía al compilador y al programador. Cada valor tiene un tipo que determina qué operaciones son válidas.
- Una sola idea: tipado de valores.

**Slide 3 — Cinco tipos básicos** (`steps`)

- Texto en pantalla: Usaremos int, double, bool, char y string como tipos básicos.
- Voz en off: No hace falta memorizar todo .NET al inicio. Usaremos int, double, bool, char y string como tipos básicos.
- Exactamente 5 ítems:
  1. `int` — enteros
  2. `double` — números con decimal
  3. `bool` — verdadero o falso
  4. `char` — un carácter
  5. `string` — texto
- Título ≤ 60; detail ≤ 140.

**Slide 4 — int vs double** (`comparison`)

- Texto en pantalla: int guarda enteros y double admite parte decimal.
- Voz en off: La elección depende de si necesitas fracciones. int guarda enteros y double admite parte decimal.
- Izquierda (`int`): cantidades enteras; sin parte fraccionaria.
- Derecha (`double`): mediciones o divisiones con decimal.
- 1–4 puntos por lado.

**Slide 5 — Flujo de elección** (`process`)

- Texto en pantalla: El flujo elige el tipo, declara, almacena y opera.
- Voz en off: Primero se decide la categoría del dato. El flujo elige el tipo, declara, almacena y opera.
- Etapas (4): elegir tipo → declarar → almacenar → operar.
- Detail breve.

**Slide 6 — Cierre** (`cta`)

- Texto en pantalla: El siguiente concepto son los operadores aritméticos.
- Voz en off: Con tipos claros ya puedes calcular. El siguiente concepto son los operadores aritméticos.
- Acción: estudiar los operadores aritméticos.

Incluir `Código sugerido` en el slide de tipos (`steps`); no en narración.

## Visual/media

- Sugerencia: tarjetas tipadas o iconos abstractos por categoría de dato.
- No inventar `src`.
- No usar tipo `image` sin media real.

## Código sugerido

```csharp
int edad = 15;
double precio = 9.99;
bool activo = true;
char nota = 'A';
string nombre = "Ana";
```

- `language`: `csharp`
- Exactamente 5 líneas no vacías; ≤ 400 caracteres.
- No presentar lista exhaustiva de tipos de .NET en texto ni código.

## Criterios de aceptación

- [ ] Salida: `examples/scripts/tipos-de-datos.md`.
- [ ] Seis slides: `cover` → `keyPoint` → `steps` → `comparison` → `process` → `cta`.
- [ ] En cada slide, el `Texto en pantalla` es un extracto literal continuo de la `Voz en off`.
- [ ] `steps` cubre exactamente los cinco tipos pedidos.
- [ ] Código dentro de límites; sin catálogo exhaustivo.
- [ ] Preview: `http://localhost:5173/?presentation=tipos-de-datos`

## Verificación

1. Contar ítems de `steps` (5) y líneas de código (≤ 8).
2. Confirmar que cada texto en pantalla aparece dentro de su voz en off.
3. Confirmar comparación `int` vs `double`.
4. No ejecutar `npm run slides -- validate`.
