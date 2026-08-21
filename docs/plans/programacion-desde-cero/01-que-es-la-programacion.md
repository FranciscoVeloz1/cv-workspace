# Spec 01 — Qué es la programación

## Objetivo

Definir la programación como el proceso de dar instrucciones precisas a una
computadora para automatizar tareas y resolver problemas, sin asumir experiencia
previa.

## Depende de

Ninguna. Es el primer brief de la serie.

## Desbloquea

[02 — Qué es un lenguaje de programación](02-que-es-un-lenguaje-de-programacion.md)

## No incluye

Lenguajes concretos, C#, editores, instalación de herramientas, variables,
tipos, operadores, condicionales, ciclos ni funciones. No produce JSON.

## Salida

`repos/slides-generator/examples/scripts/que-es-la-programacion.md`

## Contrato de entrada

```text
Topic: Qué es la programación
Audience: estudiantes de secundaria y personas sin experiencia en programación
Language: es
Goal: explicar que programar consiste en dar instrucciones precisas para automatizar tareas
Tone: formal y neutral, con precisión técnica suficiente para una persona con formación doctoral, sin asumir experiencia previa
Duration: 45–60 segundos
Slide count: 6
Deck name: que-es-la-programacion
Call to action: continuar con los lenguajes de programación
Visual/media preference: sugerencias visuales (receta, flujo entrada-proceso-salida, aplicaciones); no inventar assets
Code preference: none
```

## Mapa de slides

Regla de copy: el `Texto en pantalla` de cada slide debe aparecer como frase
continua dentro de la `Voz en off` de esa misma slide.

**Slide 1 — Portada** (`cover`)

- Texto en pantalla: Hoy aprendemos qué es la programación.
- Voz en off: Si usas aplicaciones todos los días, conviene entender cómo se construyen. Hoy aprendemos qué es la programación.
- Visual/media: sugerencia — iconografía abstracta de código o instrucciones.

**Slide 2 — Definición** (`keyPoint`)

- Texto en pantalla: La programación es el arte de darle instrucciones precisas a una computadora.
- Voz en off: En términos sencillos: La programación es el arte de darle instrucciones precisas a una computadora. Con esas instrucciones la máquina ejecuta tareas y resuelve problemas de manera automática.
- Una sola idea: definición central.

**Slide 3 — Manual vs automatizado** (`comparison`)

- Texto en pantalla: La automatización sigue instrucciones reutilizables con un resultado consistente.
- Voz en off: Una tarea manual depende de repetir pasos a mano y admite error humano. La automatización sigue instrucciones reutilizables con un resultado consistente.
- Lado izquierdo (manual): pasos repetidos por una persona; propenso a error humano.
- Lado derecho (automatizado): instrucciones reutilizables; resultado consistente.
- 1–4 puntos por lado.

**Slide 4 — Flujo de trabajo** (`process`)

- Texto en pantalla: El trabajo sigue el orden problema, plan, código, ejecución y resultado.
- Voz en off: Antes de escribir nada, conviene fijar el objetivo. El trabajo sigue el orden problema, plan, código, ejecución y resultado.
- Etapas (5): problema → plan → código → ejecución → resultado.
- Cada etapa con nombre corto y detail opcional ≤ 120 caracteres.

**Slide 5 — En la vida diaria** (`keyPoint`)

- Texto en pantalla: Está presente en redes sociales, aplicaciones bancarias y sistemas de navegación.
- Voz en off: Esta disciplina no es remota. Está presente en redes sociales, aplicaciones bancarias y sistemas de navegación. Aparece desde recomendaciones hasta transferencias seguras.
- Una sola idea: ubiquidad.

**Slide 6 — Cierre** (`cta`)

- Texto en pantalla: El siguiente paso es conocer los lenguajes de programación.
- Voz en off: Programar permite automatizar procesos y construir tecnología útil. El siguiente paso es conocer los lenguajes de programación.
- Acción: continuar con los lenguajes de programación.

## Visual/media

- No hay asset local obligatorio para este tema.
- Sugerencias permitidas (etiquetar como sugerencia, sin `src` inventado):
  - analogía de receta o secuencia ordenada;
  - diagrama entrada → proceso → salida;
  - collage abstracto de aplicaciones cotidianas.
- No usar tipo `image` sin media real.

## Código sugerido

Ninguno. `Code preference: none`.

## Criterios de aceptación

- [ ] El archivo de salida es `examples/scripts/que-es-la-programacion.md`.
- [ ] Metadata localizada incluye tono, audiencia, duración y objetivo.
- [ ] Exactamente seis slides: `cover` → `keyPoint` → `comparison` → `process` → `keyPoint` → `cta`.
- [ ] En cada slide, el `Texto en pantalla` es un extracto literal continuo de la `Voz en off`.
- [ ] `comparison` tiene dos lados con 1–4 puntos cada uno.
- [ ] `process` tiene 3–6 etapas (este brief pide 5).
- [ ] No hay código, JSON, JSX, HTML ni MDX.
- [ ] Toda sugerencia visual está etiquetada como sugerencia.
- [ ] Preview: `http://localhost:5173/?presentation=que-es-la-programacion`

## Verificación

Al generar el guion con `/slides-script-generation`:

1. Confirmar ruta, etiquetas localizadas y seis slides tipadas.
2. Confirmar que cada texto en pantalla aparece dentro de su voz en off.
3. Confirmar conteos de `comparison` y `process`.
4. Confirmar ausencia de código y de URLs de media inventadas.
5. No ejecutar `npm run slides -- validate` (solo aplica a JSON).
