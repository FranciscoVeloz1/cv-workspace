# Spec 07 — Primeros pasos con C#

## Objetivo

Conectar el código fuente de un programa de consola con la salida visible,
explicar `Console.WriteLine` y preparar el paso a variables.

## Depende de

[06 — Cómo correr C# en Windows](06-como-correr-csharp-en-windows.md)
(pedagógico). El brief asume que se puede crear y ejecutar un proyecto, pero
repite el flujo a nivel conceptual.

## Desbloquea

[08 — Qué es una variable](08-que-es-una-variable.md)

## No incluye

Variables, tipos, operadores, condicionales, ciclos, funciones, OOP ni
manejo de errores avanzado. No produce JSON.

## Salida

`repos/slides-generator/examples/scripts/primeros-pasos-con-csharp.md`

## Contrato de entrada

```text
Topic: Primeros pasos con C#
Audience: estudiantes de secundaria y personas sin experiencia en programación
Language: es
Goal: relacionar el código fuente con la salida en consola mediante Console.WriteLine
Tone: formal y neutral, con precisión técnica suficiente para una persona con formación doctoral, sin asumir experiencia previa
Duration: 45–60 segundos
Slide count: 6
Deck name: primeros-pasos-con-csharp
Call to action: pasar a variables
Visual/media preference: sugerencia del flujo archivo → terminal
Code preference: short csharp snippet with Console.WriteLine("Hola, mundo")
```

## Mapa de slides

Regla de copy: el `Texto en pantalla` de cada slide debe aparecer como frase
continua dentro de la `Voz en off` de esa misma slide.

**Slide 1 — Portada** (`cover`)

- Texto en pantalla: Hoy damos los primeros pasos con C#.
- Voz en off: Vamos a relacionar el código con lo que aparece en pantalla. Hoy damos los primeros pasos con C#.

**Slide 2 — Código y salida** (`keyPoint`)

- Texto en pantalla: El código fuente produce una salida observable.
- Voz en off: El archivo `.cs` describe instrucciones y la consola muestra el efecto. El código fuente produce una salida observable.
- Una sola idea: relación fuente → resultado.

**Slide 3 — Flujo mínimo** (`process`)

- Texto en pantalla: El flujo crea el proyecto, escribe, guarda y ejecuta.
- Voz en off: No hace falta repetir todos los comandos de instalación. El flujo crea el proyecto, escribe, guarda y ejecuta.
- Etapas (4): crear proyecto → escribir → guardar → ejecutar.
- Detail breve; sin repetir todos los comandos de la spec 06.

**Slide 4 — Línea vs resultado** (`comparison`)

- Texto en pantalla: La instrucción escrita en el archivo produce el texto que aparece en la consola.
- Voz en off: Conviene mirar ambos lados a la vez. La instrucción escrita en el archivo produce el texto que aparece en la consola.
- Izquierda (código): la instrucción escrita en el archivo.
- Derecha (consola): el texto que aparece al ejecutar.
- 1–4 puntos por lado.

**Slide 5 — Console.WriteLine** (`keyPoint`)

- Texto en pantalla: Console.WriteLine escribe una línea en la consola.
- Voz en off: El efecto se entiende sin recitar el bloque de código. Console.WriteLine escribe una línea en la consola.
- Incluir `Código sugerido`.

**Slide 6 — Cierre** (`cta`)

- Texto en pantalla: El siguiente concepto son las variables.
- Voz en off: El siguiente paso es guardar valores con nombre. El siguiente concepto son las variables.
- Acción: pasar a variables.

## Visual/media

- Sugerencia: diagrama o composición archivo `.cs` → terminal con salida.
- No inventar `src`.
- No usar tipo `image` sin media real.

## Código sugerido

```csharp
Console.WriteLine("Hola, mundo");
```

- `language`: `csharp`
- 1 línea no vacía; ≤ 400 caracteres.
- Ubicar en slide 5; no incluir el bloque en la voz en off.

## Criterios de aceptación

- [ ] Salida: `examples/scripts/primeros-pasos-con-csharp.md`.
- [ ] Seis slides: `cover` → `keyPoint` → `process` → `comparison` → `keyPoint` → `cta`.
- [ ] En cada slide, el `Texto en pantalla` es un extracto literal continuo de la `Voz en off`.
- [ ] Código `csharp` con `Console.WriteLine("Hola, mundo");` en `Código sugerido`.
- [ ] Narración no lee el código literal.
- [ ] Preview: `http://localhost:5173/?presentation=primeros-pasos-con-csharp`

## Verificación

1. Confirmar límites de código y separación narración/código.
2. Confirmar que cada texto en pantalla aparece dentro de su voz en off.
3. Confirmar CTA hacia variables.
4. No ejecutar `npm run slides -- validate`.
