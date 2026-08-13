# Spec 03 — Qué es C#

## Objetivo

Presentar C# como lenguaje de programación de propósito general, distinguir
brevemente C# (lenguaje) de .NET (plataforma) y mostrar usos reales, sin
convertir el guion en una lección completa de .NET.

## Depende de

[02 — Qué es un lenguaje de programación](02-que-es-un-lenguaje-de-programacion.md)
(pedagógico). El brief define C# de forma autosuficiente.

## Desbloquea

[04 — Qué es un editor de código](04-que-es-un-editor-de-codigo.md)

## No incluye

Instalación del SDK, Visual Studio Code, sintaxis avanzada, OOP, ASP.NET a
fondo ni comparación exhaustiva con otros lenguajes. No produce JSON.

## Salida

`repos/slides-generator/examples/scripts/que-es-csharp.md`

## Contrato de entrada

```text
Topic: Qué es C#
Audience: estudiantes de secundaria y personas sin experiencia en programación
Language: es
Goal: explicar qué es C#, para qué se usa y cómo se distingue de .NET como plataforma
Tone: formal y neutral, con precisión técnica suficiente para una persona con formación doctoral, sin asumir experiencia previa
Duration: 45–60 segundos
Slide count: 6
Deck name: que-es-csharp
Call to action: conocer el editor de código
Visual/media preference: sugerencia de logo o fragmento visual de código; no hay asset local de C#
Code preference: short csharp snippet with Console.WriteLine
```

## Mapa de slides

Regla de copy: el `Texto en pantalla` de cada slide debe aparecer como frase
continua dentro de la `Voz en off` de esa misma slide.

**Slide 1 — Portada** (`cover`)

- Texto en pantalla: Hoy explicamos qué es C# y para qué sirve.
- Voz en off: En industria y educación aparece con frecuencia este lenguaje. Hoy explicamos qué es C# y para qué sirve.

**Slide 2 — Definición** (`keyPoint`)

- Texto en pantalla: C# es un lenguaje de programación de propósito general.
- Voz en off: Combina claridad y tipado útil para proyectos reales. C# es un lenguaje de programación de propósito general.
- Una sola idea: definición de C#.

**Slide 3 — C# vs .NET** (`comparison`)

- Texto en pantalla: C# es el lenguaje y .NET es la plataforma que lo acompaña.
- Voz en off: No son lo mismo, aunque trabajan juntos. C# es el lenguaje y .NET es la plataforma que lo acompaña.
- Izquierda (C#): lenguaje; sintaxis e instrucciones que escribe el programador.
- Derecha (.NET): plataforma; bibliotecas, runtime y herramientas de ejecución.
- 1–4 puntos por lado. No ampliar a una lección separada de .NET.

**Slide 4 — Dónde se usa** (`steps`)

- Texto en pantalla: Con C# puedes crear web, escritorio, servicios y videojuegos.
- Voz en off: Su alcance práctico es amplio. Con C# puedes crear web, escritorio, servicios y videojuegos.
- Exactamente 4 ítems:
  1. Aplicaciones web
  2. Aplicaciones de escritorio
  3. Servicios y backends
  4. Videojuegos (p. ej. con motores que usan C#)
- Título y detail dentro de límites del schema.

**Slide 5 — Una instrucción** (`keyPoint`)

- Texto en pantalla: Una instrucción corta escribe un mensaje en la consola.
- Voz en off: El ejemplo muestra el efecto sin leer el código línea por línea. Una instrucción corta escribe un mensaje en la consola.
- Incluir `Código sugerido` (ver abajo).

**Slide 6 — Cierre** (`cta`)

- Texto en pantalla: El siguiente paso es conocer el editor de código.
- Voz en off: Ya tienes el lenguaje; falta la herramienta de escritura. El siguiente paso es conocer el editor de código.
- Acción: conocer el editor de código.

## Visual/media

- No existe asset local de C# en `public/media/`.
- Sugerencia (sin `src`): logotipo oficial de C# o captura genérica de código
  con sintaxis resaltada.
- No usar tipo `image` sin media real.

## Código sugerido

```csharp
Console.WriteLine("Hola");
```

- `language`: `csharp`
- Máximo 1–2 líneas no vacías; ≤ 400 caracteres.
- Ubicar en slide 5; no repetir el bloque dentro de la voz en off.

## Criterios de aceptación

- [ ] Salida: `examples/scripts/que-es-csharp.md` (no `que-es-csharp-y-dotnet.md`).
- [ ] Seis slides: `cover` → `keyPoint` → `comparison` → `steps` → `keyPoint` → `cta`.
- [ ] En cada slide, el `Texto en pantalla` es un extracto literal continuo de la `Voz en off`.
- [ ] La comparación distingue lenguaje vs plataforma sin saturación de .NET.
- [ ] Código `csharp` válido dentro de límites, en `Código sugerido`.
- [ ] Media solo como sugerencia o asset verificable (ninguno inventado).
- [ ] Preview: `http://localhost:5173/?presentation=que-es-csharp`

## Verificación

1. Confirmar deck name distinto del script histórico `que-es-csharp-y-dotnet`.
2. Confirmar que cada texto en pantalla aparece dentro de su voz en off.
3. Confirmar límites de código y ausencia de `src` inventado.
4. No ejecutar `npm run slides -- validate`.
