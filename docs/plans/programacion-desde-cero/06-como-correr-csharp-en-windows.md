# Spec 06 — Cómo correr C# en Windows

## Objetivo

Enseñar el flujo mínimo en Windows para verificar el .NET SDK, crear un
proyecto de consola y ejecutarlo, sin leer todos los comandos en voz alta.

## Depende de

[05 — Qué es Visual Studio Code](05-que-es-visual-studio-code.md) (pedagógico).
El brief enumera requisitos de forma autosuficiente.

## Desbloquea

[07 — Primeros pasos con C#](07-primeros-pasos-con-csharp.md)

## No incluye

Publicación a producción, depuración avanzada, Visual Studio IDE, macOS/Linux,
ni explicación profunda de MSBuild. No produce JSON.

## Salida

`repos/slides-generator/examples/scripts/como-correr-csharp-en-windows.md`

## Contrato de entrada

```text
Topic: Cómo correr C# en Windows
Audience: estudiantes de secundaria y personas sin experiencia en programación
Language: es
Goal: mostrar cómo verificar el SDK, crear un proyecto de consola y ejecutarlo en Windows
Tone: formal y neutral, con precisión técnica suficiente para una persona con formación doctoral, sin asumir experiencia previa
Duration: 45–60 segundos
Slide count: 6
Deck name: como-correr-csharp-en-windows
Call to action: escribir el primer programa
Visual/media preference: sugerencia de terminal/PowerShell; no inventar capturas como assets
Code preference: text block with PowerShell commands (máximo 8 líneas)
```

## Mapa de slides

Regla de copy: el `Texto en pantalla` de cada slide debe aparecer como frase
continua dentro de la `Voz en off` de esa misma slide.

**Slide 1 — Portada** (`cover`)

- Texto en pantalla: Hoy vemos cómo correr C# en Windows.
- Voz en off: Hay un flujo mínimo reproducible. Hoy vemos cómo correr C# en Windows.

**Slide 2 — Requisitos** (`keyPoint`)

- Texto en pantalla: Se necesitan Windows, el .NET SDK, un editor y soporte de C#.
- Voz en off: Sin estos elementos el comando no encontrará la herramienta. Se necesitan Windows, el .NET SDK, un editor y soporte de C#.
- Una sola idea: requisitos.

**Slide 3 — Flujo** (`process`)

- Texto en pantalla: El recorrido es instalar, verificar, crear y ejecutar.
- Voz en off: Cada etapa confirma que el entorno responde. El recorrido es instalar, verificar, crear y ejecutar.
- Etapas (4): instalar → verificar → crear → ejecutar.
- Detail breve por etapa (p. ej. verificar con `dotnet --version`).

**Slide 4 — Comandos** (`steps`)

- Texto en pantalla: Los comandos verifican el SDK, crean el proyecto y lo ejecutan.
- Voz en off: No hace falta leerlos todos en voz alta. Los comandos verifican el SDK, crean el proyecto y lo ejecutan.
- Ítems alineados al orden de comandos (2–5 ítems; agrupar si hace falta):
  1. Verificar versión (`dotnet --version`)
  2. Crear carpeta y entrar
  3. Crear proyecto (`dotnet new console`)
  4. Ejecutar (`dotnet run`)
- Incluir el bloque `text` completo en `Código sugerido` (no en narración).
- La voz en off no debe leer todos los comandos literalmente.

**Slide 5 — Salida y errores comunes** (`keyPoint`)

- Texto en pantalla: La consola muestra la salida; un error de comando suele indicar instalación o PATH.
- Voz en off: El éxito se ve en el texto impreso. La consola muestra la salida; un error de comando suele indicar instalación o PATH.
- Una sola idea: interpretar el resultado.

**Slide 6 — Cierre** (`cta`)

- Texto en pantalla: El siguiente paso es escribir el primer programa.
- Voz en off: Ya puedes crear y ejecutar un proyecto. El siguiente paso es escribir el primer programa.
- Acción: escribir el primer programa.

## Visual/media

- Sugerencia: ventana de PowerShell o terminal integrada con salida de
  `dotnet run`.
- No inventar `src` ni presentar capturas inexistentes como media real.
- No usar tipo `image` sin media real.

## Código sugerido

```text
dotnet --version
mkdir HolaCSharp
cd HolaCSharp
dotnet new console
dotnet run
```

- `language`: `text`
- Exactamente 5 líneas no vacías (≤ 8); ≤ 400 caracteres.
- Ubicar asociado al slide de comandos (`steps`).
- Narración: describir el propósito de los comandos, no recitarlos todos.

## Criterios de aceptación

- [ ] Salida: `examples/scripts/como-correr-csharp-en-windows.md`.
- [ ] Seis slides: `cover` → `keyPoint` → `process` → `steps` → `keyPoint` → `cta`.
- [ ] En cada slide, el `Texto en pantalla` es un extracto literal continuo de la `Voz en off`.
- [ ] Bloque `text` con los comandos dentro de límites.
- [ ] La voz en off no lee todos los comandos literalmente.
- [ ] Preview: `http://localhost:5173/?presentation=como-correr-csharp-en-windows`

## Verificación

1. Contar líneas no vacías del bloque `text` (≤ 8).
2. Confirmar que cada texto en pantalla aparece dentro de su voz en off.
3. Confirmar que `Código sugerido` está separado de la narración.
4. No ejecutar `npm run slides -- validate`.
