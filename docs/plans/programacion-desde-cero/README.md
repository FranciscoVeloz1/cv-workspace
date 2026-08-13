# Programación desde cero — Specs de guiones

Estas especificaciones definen briefs ejecutables para generar guiones Markdown
en `repos/slides-generator` mediante
[`.agents/skills/slides-script-generation/SKILL.md`](../../../.agents/skills/slides-script-generation/SKILL.md).

**Esta carpeta contiene briefs, no los guiones finales.** No produce
presentaciones JSON, JSX, HTML ni MDX, y no modifica el código de
`slides-generator`.

Los scripts existentes
`repos/slides-generator/examples/scripts/que-es-la-programacion.md`,
`lenguajes-de-programacion.md` y `que-es-csharp-y-dotnet.md` son referencias
editoriales con formato histórico. Las specs de esta serie deben seguir el
skill y el schema actuales en
[`presentation-schema.ts`](../../../repos/slides-generator/src/domain/presentation-schema.ts).

## Execution order

1. [01 — Qué es la programación](01-que-es-la-programacion.md)
   - Deck: `que-es-la-programacion`
2. [02 — Qué es un lenguaje de programación](02-que-es-un-lenguaje-de-programacion.md)
   - Deck: `que-es-un-lenguaje-de-programacion`
3. [03 — Qué es C#](03-que-es-csharp.md)
   - Deck: `que-es-csharp`
4. [04 — Qué es un editor de código](04-que-es-un-editor-de-codigo.md)
   - Deck: `que-es-un-editor-de-codigo`
5. [05 — Qué es Visual Studio Code](05-que-es-visual-studio-code.md)
   - Deck: `que-es-visual-studio-code`
6. [06 — Cómo correr C# en Windows](06-como-correr-csharp-en-windows.md)
   - Deck: `como-correr-csharp-en-windows`
7. [07 — Primeros pasos con C#](07-primeros-pasos-con-csharp.md)
   - Deck: `primeros-pasos-con-csharp`
8. [08 — Qué es una variable](08-que-es-una-variable.md)
   - Deck: `que-es-una-variable`
9. [09 — Tipos de datos](09-tipos-de-datos.md)
   - Deck: `tipos-de-datos`
10. [10 — Operadores aritméticos](10-operadores-aritmeticos.md)
    - Deck: `operadores-aritmeticos`
11. [11 — Condicionales](11-condicionales.md)
    - Deck: `condicionales`
12. [12 — Ciclos](12-ciclos.md)
    - Deck: `ciclos`
13. [13 — Funciones](13-funciones.md)
    - Deck: `funciones`

El orden es pedagógico. Cada brief declara `Depende de`, `Desbloquea` y
`No incluye`, y debe repetir las definiciones necesarias para ejecutarse de
forma aislada.

## Fixed decisions

- **Audience:** `estudiantes de secundaria y personas sin experiencia en programación`
- **Language:** `es` (texto en pantalla, metadata y narración en español)
- **Tone:** formal y neutral, con precisión técnica suficiente para una persona
  con formación doctoral, sin asumir experiencia previa
- **Duration:** `45–60 segundos` por guion
- **Slide count:** seis slides; `cover` primero y `cta` último
- **Salida:** `repos/slides-generator/examples/scripts/<deck-name>.md`
- **Deck names:** únicos, kebab-case, sin rutas ni extensiones
- **Tipos permitidos:** `cover`, `keyPoint`, `steps`, `comparison`, `process`,
  `stat`, `quote`, `cta`, `image`
- **Medios (suggestions-first):** usar
  `/media/javascript-logo.svg` u otro asset local/HTTPS verificable cuando
  exista; si no existe, dejar una sugerencia visual explícita. No inventar URL,
  attribution ni asset. No usar `image` solo para aparentar un recurso real.
- **Código:** solo en `Código sugerido`; lenguajes
  `csharp` · `javascript` · `typescript` · `python` · `json` · `text`; máximo
  400 caracteres y 8 líneas no vacías. Nunca en narración ni como bloque fenced
  en el cuerpo de una slide.
- **Texto en pantalla ⊂ voz en off:** en cada slide, el `Texto en pantalla` debe
  ser una frase continua tomada de la `Voz en off` (mismo español, sin
  parafrasear). La narración puede añadir contexto antes o después; la línea en
  pantalla no puede decir algo que la voz no diga.
- **Validación CLI:** `npm run slides -- validate` no aplica a specs ni a
  scripts Markdown; solo a una futura etapa que genere JSON.

## Plantilla de cada spec

Cada archivo `01`–`13` debe incluir exactamente estas secciones:

1. `Objetivo`
2. `Depende de`
3. `Desbloquea`
4. `No incluye`
5. `Salida`
6. `Contrato de entrada`
7. `Mapa de slides`
8. `Visual/media`
9. `Código sugerido`
10. `Criterios de aceptación`
11. `Verificación`

El `Contrato de entrada` debe fijar valores concretos para:

```text
Topic
Audience
Language
Goal
Tone
Duration
Slide count
Deck name
Call to action
Visual/media preference
Code preference
```

## Reglas de conversión al schema

Fuente de verdad:
[`repos/slides-generator/src/domain/presentation-schema.ts`](../../../repos/slides-generator/src/domain/presentation-schema.ts).

| Campo / tipo                    | Límites relevantes                                         |
| ------------------------------- | ---------------------------------------------------------- |
| `cover.title`                   | ≤ 80                                                       |
| `cover.subtitle`                | ≤ 120 (opcional)                                           |
| `cover.eyebrow`                 | ≤ 40 (opcional)                                            |
| `keyPoint.title` / `body`       | ≤ 80 / ≤ 220                                               |
| `keyPoint.label`                | ≤ 40 (opcional)                                            |
| `steps.items`                   | 2–5; título ≤ 60; detail ≤ 140                             |
| `comparison` left/right         | label ≤ 40; 1–4 points ≤ 90 c/u                            |
| `process.stages`                | 3–6; name ≤ 40; detail ≤ 120                               |
| `cta.title` / `body` / `action` | ≤ 80 / ≤ 160 / ≤ 60                                        |
| `media.src`                     | path `/...` o `https://`; alt ≤ 160                        |
| `code.language`                 | enum permitido; `source` ≤ 400 chars, ≤ 8 líneas no vacías |
| presentación                    | 1–24 slides                                                |

Cada mapa de slides debe:

- indicar el tipo literal de cada slide;
- proponer `Texto en pantalla` corto y `Voz en off` natural;
- hacer que el `Texto en pantalla` sea un extracto literal continuo de esa
  `Voz en off` (la voz puede ampliar; la pantalla no inventa otra idea);
- incluir `Acción` en la slide `cta`;
- prohibir iconos no presentes en el schema, campos arbitrarios, fuentes
  inventadas y URLs de medios no verificadas.

Ejemplo de la regla:

```text
Texto en pantalla: Dominar C# abre oportunidades para desarrollar software profesional en múltiples áreas tecnológicas.
Voz en off: C# y .NET no son lo mismo: se complementan para crear software de todo tipo. Dominar C# abre oportunidades para desarrollar software profesional en múltiples áreas tecnológicas.
```

Etiquetas localizadas del guion generado (skill):

`Tono` · `Audiencia` · `Duración aproximada` · `Objetivo` ·
`Texto en pantalla` · `Voz en off` · `Visual/media` · `Código sugerido` ·
`Acción` · `Preview`

## Review contract

Cada spec tiene:

- un límite de salida (un archivo Markdown de guion);
- criterios de aceptación verificables;
- un commit boundary independiente al generar el guion;
- dependencias pedagógicas explícitas.

No comenzar la generación del guion de una spec posterior hasta que su
dependencia esté disponible o el brief se ejecute de forma autosuficiente.

## Verificación de la carpeta

Al crear o modificar esta serie:

```powershell
rg --files docs/plans/programacion-desde-cero
rg -n "^#|^## |Deck name|Salida|Mapa de slides|Criterios de aceptación|Verificación" docs/plans/programacion-desde-cero
git diff --check
```

Además, buscar marcadores incompletos o instrucciones vagas que pospongan
detalle. Esa búsqueda debe devolver cero coincidencias.

Esperado:

- exactamente `README.md` y 13 specs;
- todas las secciones requeridas presentes;
- cero coincidencias de marcadores incompletos;
- sin errores de whitespace.

## Related

- Skill de guiones: [`.agents/skills/slides-script-generation/SKILL.md`](../../../.agents/skills/slides-script-generation/SKILL.md)
- Schema: [`repos/slides-generator/src/domain/presentation-schema.ts`](../../../repos/slides-generator/src/domain/presentation-schema.ts)
- README del proyecto: [`repos/slides-generator/README.md`](../../../repos/slides-generator/README.md)
