# Spec 08 — Qué es una variable

## Objetivo

Explicar que una variable es un nombre asociado a un valor en memoria, y
mostrar el ciclo declarar → asignar → leer → actualizar con un ejemplo corto
en C#.

## Depende de

[07 — Primeros pasos con C#](07-primeros-pasos-con-csharp.md) (pedagógico). El
brief redefine variables de forma autosuficiente.

## Desbloquea

[09 — Tipos de datos](09-tipos-de-datos.md)

## No incluye

Tipos exhaustivos, operadores aritméticos a fondo, alcance/lifetime avanzado,
referencias, nullable ni constantes. No produce JSON.

## Salida

`repos/slides-generator/examples/scripts/que-es-una-variable.md`

## Contrato de entrada

```text
Topic: Qué es una variable
Audience: estudiantes de secundaria y personas sin experiencia en programación
Language: es
Goal: explicar qué es una variable y cómo se declara, asigna, lee y actualiza en C#
Tone: formal y neutral, con precisión técnica suficiente para una persona con formación doctoral, sin asumir experiencia previa
Duration: 45–60 segundos
Slide count: 6
Deck name: que-es-una-variable
Call to action: estudiar los tipos de datos
Visual/media preference: sugerencia de cajas etiquetadas; no presentar imagen no disponible como real
Code preference: short csharp snippet (hasta 4 líneas)
```

## Mapa de slides

Regla de copy: el `Texto en pantalla` de cada slide debe aparecer como frase
continua dentro de la `Voz en off` de esa misma slide.

**Slide 1 — Portada** (`cover`)

- Texto en pantalla: Hoy explicamos qué es una variable.
- Voz en off: Un programa necesita guardar valores con nombre. Hoy explicamos qué es una variable.

**Slide 2 — Definición** (`keyPoint`)

- Texto en pantalla: Una variable es un nombre asociado a un valor.
- Voz en off: El nombre identifica el dato y ese valor puede cambiar durante la ejecución. Una variable es un nombre asociado a un valor.
- Una sola idea: definición.

**Slide 3 — Ciclo de uso** (`process`)

- Texto en pantalla: El ciclo declara, asigna, lee y actualiza.
- Voz en off: Cada etapa cambia el estado del dato. El ciclo declara, asigna, lee y actualiza.
- Etapas (4): declarar → asignar → leer → actualizar.
- Detail breve por etapa.

**Slide 4 — Nombre vs valor** (`comparison`)

- Texto en pantalla: El nombre identifica la variable y el valor es el dato almacenado.
- Voz en off: No conviene confundir la etiqueta con el contenido. El nombre identifica la variable y el valor es el dato almacenado.
- Izquierda (nombre): identificador que usa el programador (`edad`).
- Derecha (valor): dato almacenado (`15`, luego `16`).
- 1–4 puntos por lado.

**Slide 5 — Ejemplo** (`keyPoint`)

- Texto en pantalla: El ejemplo declara, actualiza e imprime un valor.
- Voz en off: El efecto se entiende sin recitar el código. El ejemplo declara, actualiza e imprime un valor.
- Incluir `Código sugerido`.

**Slide 6 — Cierre** (`cta`)

- Texto en pantalla: El siguiente concepto son los tipos de datos.
- Voz en off: Cada valor pertenece a una categoría. El siguiente concepto son los tipos de datos.
- Acción: estudiar los tipos de datos.

## Visual/media

- Sugerencia: cajas o etiquetas con nombre en el exterior y valor dentro.
- No inventar `src`.
- No usar tipo `image` sin media real.

## Código sugerido

```csharp
string nombre = "Ana";
int edad = 15;
edad = edad + 1;
Console.WriteLine(edad);
```

- `language`: `csharp`
- Exactamente 4 líneas no vacías; ≤ 400 caracteres.
- Ubicar en slide 5; no incluir el bloque en la voz en off.

## Criterios de aceptación

- [ ] Salida: `examples/scripts/que-es-una-variable.md`.
- [ ] Seis slides: `cover` → `keyPoint` → `process` → `comparison` → `keyPoint` → `cta`.
- [ ] En cada slide, el `Texto en pantalla` es un extracto literal continuo de la `Voz en off`.
- [ ] Código `csharp` ≤ 4 líneas en `Código sugerido`.
- [ ] Media solo como sugerencia de cajas etiquetadas.
- [ ] Preview: `http://localhost:5173/?presentation=que-es-una-variable`

## Verificación

1. Contar líneas del bloque de código (≤ 8, aquí 4).
2. Confirmar que cada texto en pantalla aparece dentro de su voz en off.
3. Confirmar separación narración/código.
4. No ejecutar `npm run slides -- validate`.
