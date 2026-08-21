# Spec 05 — Qué es Visual Studio Code

## Objetivo

Presentar Visual Studio Code como un editor de código extensible, explicar la
relación entre el editor base y las extensiones, y mostrar un flujo mínimo para
trabajar con C#.

## Depende de

[04 — Qué es un editor de código](04-que-es-un-editor-de-codigo.md) (pedagógico).
El brief redefine VS Code de forma autosuficiente.

## Desbloquea

[06 — Cómo correr C# en Windows](06-como-correr-csharp-en-windows.md)

## No incluye

Pasos detallados de instalación del .NET SDK, todos los atajos de teclado,
comparación completa con Visual Studio IDE ni configuración avanzada. No
produce JSON.

## Salida

`repos/slides-generator/examples/scripts/que-es-visual-studio-code.md`

## Contrato de entrada

```text
Topic: Qué es Visual Studio Code
Audience: estudiantes de secundaria y personas sin experiencia en programación
Language: es
Goal: explicar qué es Visual Studio Code, por qué es extensible y cómo se usa de forma básica con C#
Tone: formal y neutral, con precisión técnica suficiente para una persona con formación doctoral, sin asumir experiencia previa
Duration: 45–60 segundos
Slide count: 6
Deck name: que-es-visual-studio-code
Call to action: aprender a correr C# en Windows
Visual/media preference: sugerencias de interfaz; no afirmar que exista una captura local
Code preference: none
```

## Mapa de slides

Regla de copy: el `Texto en pantalla` de cada slide debe aparecer como frase
continua dentro de la `Voz en off` de esa misma slide.

**Slide 1 — Portada** (`cover`)

- Texto en pantalla: Hoy vemos qué es Visual Studio Code.
- Voz en off: Es un editor popular, gratuito y extensible. Hoy vemos qué es Visual Studio Code.

**Slide 2 — Definición** (`keyPoint`)

- Texto en pantalla: Visual Studio Code es un editor de código extensible.
- Voz en off: No es lo mismo que un IDE completo, aunque puede acercarse con extensiones. Visual Studio Code es un editor de código extensible.
- Una sola idea: definición.

**Slide 3 — Base vs extensiones** (`comparison`)

- Texto en pantalla: El editor base edita archivos; las extensiones añaden soporte de lenguajes y utilidades.
- Voz en off: Conviene separar lo incluido de lo opcional. El editor base edita archivos; las extensiones añaden soporte de lenguajes y utilidades.
- Izquierda (editor base): edición de archivos, búsqueda, terminal integrada.
- Derecha (extensiones): soporte de lenguajes, temas, depuración, utilidades.
- 1–4 puntos por lado.

**Slide 4 — Flujo con C#** (`process`)

- Texto en pantalla: El flujo abre una carpeta, instala soporte de C#, crea un archivo, abre la terminal y ejecuta.
- Voz en off: Para empezar con C# basta un recorrido mínimo. El flujo abre una carpeta, instala soporte de C#, crea un archivo, abre la terminal y ejecuta.
- Etapas (5): abrir carpeta → instalar soporte de C# → crear archivo `.cs` → abrir terminal → ejecutar.
- No detallar cada comando `dotnet` (eso es la spec 06).

**Slide 5 — Áreas de la interfaz** (`keyPoint`)

- Texto en pantalla: Explorador, editor y terminal trabajan juntos.
- Voz en off: Ubicas archivos, editas código y emites comandos en el mismo entorno. Explorador, editor y terminal trabajan juntos.
- Una sola idea: las tres zonas principales.

**Slide 6 — Cierre** (`cta`)

- Texto en pantalla: El siguiente paso es aprender a correr C# en Windows.
- Voz en off: Falta instalar el SDK y ejecutar el primer proyecto. El siguiente paso es aprender a correr C# en Windows.
- Acción: aprender a correr C# en Windows.

## Visual/media

- Solo sugerencias de interfaz (Explorador, editor, terminal).
- No afirmar existencia de captura local en `public/media/`.
- No usar tipo `image` sin media real.

## Código sugerido

Ninguno. `Code preference: none`.

## Criterios de aceptación

- [ ] Salida: `examples/scripts/que-es-visual-studio-code.md`.
- [ ] Seis slides: `cover` → `keyPoint` → `comparison` → `process` → `keyPoint` → `cta`.
- [ ] En cada slide, el `Texto en pantalla` es un extracto literal continuo de la `Voz en off`.
- [ ] `process` incluye abrir carpeta, soporte C#, archivo `.cs`, terminal y ejecutar.
- [ ] Media solo como sugerencia.
- [ ] Preview: `http://localhost:5173/?presentation=que-es-visual-studio-code`

## Verificación

1. Confirmar tipos y conteos.
2. Confirmar que cada texto en pantalla aparece dentro de su voz en off.
3. Confirmar CTA hacia ejecución en Windows.
4. No ejecutar `npm run slides -- validate`.
