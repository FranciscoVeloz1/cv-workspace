# Spec 04 — Qué es un editor de código

## Objetivo

Definir un editor de código como la herramienta donde se escribe, revisa y
organiza el código fuente, y contrastarlo con un procesador de texto genérico.

## Depende de

[03 — Qué es C#](03-que-es-csharp.md) (pedagógico). El brief define el editor
sin depender del contenido previo.

## Desbloquea

[05 — Qué es Visual Studio Code](05-que-es-visual-studio-code.md)

## No incluye

Instalación de Visual Studio Code, comandos `dotnet`, sintaxis de C#, ni
tutoriales de extensiones concretas. No produce JSON.

## Salida

`repos/slides-generator/examples/scripts/que-es-un-editor-de-codigo.md`

## Contrato de entrada

```text
Topic: Qué es un editor de código
Audience: estudiantes de secundaria y personas sin experiencia en programación
Language: es
Goal: explicar qué es un editor de código y por qué no basta un procesador de texto
Tone: formal y neutral, con precisión técnica suficiente para una persona con formación doctoral, sin asumir experiencia previa
Duration: 45–60 segundos
Slide count: 6
Deck name: que-es-un-editor-de-codigo
Call to action: presentar Visual Studio Code
Visual/media preference: sugerencia de interfaz genérica de editor; no captura inventada como asset real
Code preference: none (salvo una línea text si hace falta ilustrar un nombre de archivo)
```

## Mapa de slides

Regla de copy: el `Texto en pantalla` de cada slide debe aparecer como frase
continua dentro de la `Voz en off` de esa misma slide.

**Slide 1 — Portada** (`cover`)

- Texto en pantalla: Hoy vemos qué es un editor de código.
- Voz en off: El software se escribe en una herramienta especializada. Hoy vemos qué es un editor de código.

**Slide 2 — Definición** (`keyPoint`)

- Texto en pantalla: Un editor de código es la aplicación donde se escribe y organiza código fuente.
- Voz en off: Trabaja con archivos de texto estructurado y apoya al programador. Un editor de código es la aplicación donde se escribe y organiza código fuente.
- Una sola idea: definición.

**Slide 3 — Editor vs procesador de texto** (`comparison`)

- Texto en pantalla: El editor de código está orientado a proyectos y a la ejecución, no al formato tipográfico.
- Voz en off: Un procesador de texto prioriza documentos y apariencia. El editor de código está orientado a proyectos y a la ejecución, no al formato tipográfico.
- Izquierda (editor de código): resaltado de sintaxis, proyectos, terminal, extensiones.
- Derecha (procesador de texto): formato tipográfico, documentos, no orientado a ejecución.
- 1–4 puntos por lado.

**Slide 4 — Flujo básico** (`process`)

- Texto en pantalla: El flujo es abrir, escribir, guardar, revisar y ejecutar con una herramienta externa.
- Voz en off: La edición y la ejecución suelen coordinarse. El flujo es abrir, escribir, guardar, revisar y ejecutar con una herramienta externa.
- Etapas (5): abrir archivo → escribir → guardar → revisar → ejecutar con una herramienta externa.

**Slide 5 — Capacidades útiles** (`steps`)

- Texto en pantalla: Resaltado, autocompletado, búsqueda, extensiones y terminal aceleran el trabajo.
- Voz en off: Estas ayudas no son decorativas. Resaltado, autocompletado, búsqueda, extensiones y terminal aceleran el trabajo.
- Exactamente 5 ítems (máximo del schema):
  1. Resaltado de sintaxis
  2. Autocompletado
  3. Búsqueda
  4. Extensiones
  5. Terminal
- Título ≤ 60; detail ≤ 140.

**Slide 6 — Cierre** (`cta`)

- Texto en pantalla: El siguiente tema es Visual Studio Code.
- Voz en off: Conviene estudiar un editor concreto y popular. El siguiente tema es Visual Studio Code.
- Acción: presentar Visual Studio Code.

## Visual/media

- Sugerencia (sin `src`): interfaz genérica de editor con panel de archivos,
  área de código y terminal; no una captura de marca presentada como asset local.
- No usar tipo `image` sin media real.

## Código sugerido

Ninguno por defecto. Si se necesita ilustrar un nombre de archivo, máximo una
línea `text` (por ejemplo `Programa.cs`) en `Código sugerido`, nunca en narración.

## Criterios de aceptación

- [ ] Salida: `examples/scripts/que-es-un-editor-de-codigo.md`.
- [ ] Seis slides: `cover` → `keyPoint` → `comparison` → `process` → `steps` → `cta`.
- [ ] En cada slide, el `Texto en pantalla` es un extracto literal continuo de la `Voz en off`.
- [ ] `steps` tiene 5 capacidades listadas.
- [ ] `process` tiene 5 etapas válidas.
- [ ] No hay capturas inventadas como media real.
- [ ] Preview: `http://localhost:5173/?presentation=que-es-un-editor-de-codigo`

## Verificación

1. Confirmar tipos, conteos y ausencia de código innecesario.
2. Confirmar que cada texto en pantalla aparece dentro de su voz en off.
3. Confirmar CTA hacia Visual Studio Code.
4. No ejecutar `npm run slides -- validate`.
