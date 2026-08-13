# Spec 02 — Qué es un lenguaje de programación

## Objetivo

Explicar qué es un lenguaje de programación, por qué existe y cómo traduce
ideas humanas en instrucciones ejecutables, usando ejemplos representativos.

## Depende de

[01 — Qué es la programación](01-que-es-la-programacion.md) (pedagógico). El
brief repite la noción de instrucciones precisas para poder ejecutarse solo.

## Desbloquea

[03 — Qué es C#](03-que-es-csharp.md)

## No incluye

Instalación de herramientas, sintaxis completa de ningún lenguaje, C# a fondo,
editores ni conceptos de variables/control de flujo. No produce JSON.

## Salida

`repos/slides-generator/examples/scripts/que-es-un-lenguaje-de-programacion.md`

## Contrato de entrada

```text
Topic: Qué es un lenguaje de programación
Audience: estudiantes de secundaria y personas sin experiencia en programación
Language: es
Goal: explicar por qué existen los lenguajes de programación y cómo comunican instrucciones a una computadora
Tone: formal y neutral, con precisión técnica suficiente para una persona con formación doctoral, sin asumir experiencia previa
Duration: 45–60 segundos
Slide count: 6
Deck name: que-es-un-lenguaje-de-programacion
Call to action: iniciar el aprendizaje con C#
Visual/media preference: permitir /media/javascript-logo.svg en el slide de ejemplos; resto como sugerencias
Code preference: optional short javascript snippet (máximo dos líneas)
```

## Mapa de slides

Regla de copy: el `Texto en pantalla` de cada slide debe aparecer como frase
continua dentro de la `Voz en off` de esa misma slide.

**Slide 1 — Portada** (`cover`)

- Texto en pantalla: Hoy vemos qué es un lenguaje de programación.
- Voz en off: Para comunicarnos con una máquina hace falta un idioma compartido. Hoy vemos qué es un lenguaje de programación.

**Slide 2 — Definición** (`keyPoint`)

- Texto en pantalla: Un lenguaje de programación permite comunicar instrucciones precisas a una computadora.
- Voz en off: Sin un lenguaje formal, solo quedaría el código máquina. Un lenguaje de programación permite comunicar instrucciones precisas a una computadora.
- Una sola idea: definición.

**Slide 3 — Humano vs programación** (`comparison`)

- Texto en pantalla: El lenguaje de programación exige reglas formales y precisión ejecutable.
- Voz en off: El lenguaje humano admite ambigüedad y contexto. El lenguaje de programación exige reglas formales y precisión ejecutable.
- Izquierda (lenguaje humano): ambigüedad, contexto, matices.
- Derecha (lenguaje de programación): reglas formales, precisión, ejecutabilidad.
- 1–4 puntos por lado.

**Slide 4 — Del pensamiento a la ejecución** (`process`)

- Texto en pantalla: El recorrido va de la idea al código fuente, luego a la traducción y a la ejecución.
- Voz en off: Una idea no corre sola en la máquina. El recorrido va de la idea al código fuente, luego a la traducción y a la ejecución.
- Etapas (4): idea → código fuente → traducción → ejecución.
- Detail breve en cada etapa (compilador/intérprete como concepto, sin profundizar).

**Slide 5 — Ejemplos** (`steps`)

- Texto en pantalla: Python, JavaScript, C# y SQL resuelven dominios distintos con reglas propias.
- Voz en off: No todos los lenguajes sirven para lo mismo. Python, JavaScript, C# y SQL resuelven dominios distintos con reglas propias.
- Exactamente 4 ítems (dentro de 2–5):
  1. Python — datos e inteligencia artificial (uso representativo).
  2. JavaScript — interacciones en la web.
  3. C# — aplicaciones y juegos.
  4. SQL — consulta de datos.
- Título ≤ 60; detail ≤ 140 por ítem.
- Media opcional: `/media/javascript-logo.svg` con alt exacto (ver Visual/media).

**Slide 6 — Cierre** (`cta`)

- Texto en pantalla: El siguiente paso es iniciar el aprendizaje con C#.
- Voz en off: Elegir un primer lenguaje ordena el camino. El siguiente paso es iniciar el aprendizaje con C#.
- Acción: iniciar el aprendizaje con C#.

## Visual/media

- Asset real permitido solo en el slide de ejemplos (`steps`):
  - `src`: `/media/javascript-logo.svg`
  - `alt`: `Logotipo de JavaScript`
  - `attribution`: omitir (no hay crédito inventable en el asset)
- Otras ideas (sugerencia, sin `src`): mapa de idiomas / especialización por dominio.
- No usar tipo `image` sin media real.

## Código sugerido

Opcional, en un slide `keyPoint` o `steps` si aclara sintaxis (no en narración):

```javascript
console.log("Hola");
```

- `language`: `javascript`
- Máximo 2 líneas no vacías; ≤ 400 caracteres.

## Criterios de aceptación

- [ ] Salida: `examples/scripts/que-es-un-lenguaje-de-programacion.md`.
- [ ] Seis slides: `cover` → `keyPoint` → `comparison` → `process` → `steps` → `cta`.
- [ ] En cada slide, el `Texto en pantalla` es un extracto literal continuo de la `Voz en off`.
- [ ] `steps` tiene 4 lenguajes con uso representativo.
- [ ] Si se usa media, `src` es `/media/javascript-logo.svg` con alt correcto.
- [ ] Si hay código, es `javascript`, ≤ 2 líneas, en `Código sugerido`.
- [ ] Preview: `http://localhost:5173/?presentation=que-es-un-lenguaje-de-programacion`

## Verificación

1. Validar etiquetas localizadas, tipos y conteos de items/stages/points.
2. Confirmar que cada texto en pantalla aparece dentro de su voz en off.
3. Confirmar que no se inventan URLs ni attribution.
4. No ejecutar `npm run slides -- validate`.
