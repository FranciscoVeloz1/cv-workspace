# Spec 11 — Condicionales

## Objetivo

Explicar las condicionales como decisiones basadas en una expresión booleana,
contrastar las ramas `if` y `else`, y aclarar que `else` es opcional, sin
incluir `switch`.

## Depende de

[10 — Operadores aritméticos](10-operadores-aritmeticos.md) (pedagógico). El
brief redefine condiciones booleanas de forma autosuficiente.

## Desbloquea

[12 — Ciclos](12-ciclos.md)

## No incluye

`switch`, operadores lógicos complejos a fondo, patrones, ternary anidado ni
evaluación de cortocircuito avanzada. No produce JSON.

## Salida

`repos/slides-generator/examples/scripts/condicionales.md`

## Contrato de entrada

```text
Topic: Qué son las condicionales
Audience: estudiantes de secundaria y personas sin experiencia en programación
Language: es
Goal: explicar if/else como decisión según una expresión booleana en C#
Tone: formal y neutral, con precisión técnica suficiente para una persona con formación doctoral, sin asumir experiencia previa
Duration: 45–60 segundos
Slide count: 6
Deck name: condicionales
Call to action: estudiar los ciclos
Visual/media preference: sugerencia de diagrama de decisión; no inventar assets
Code preference: short csharp snippet with if, comparison, and else
```

## Mapa de slides

Regla de copy: el `Texto en pantalla` de cada slide debe aparecer como frase
continua dentro de la `Voz en off` de esa misma slide.

**Slide 1 — Portada** (`cover`)

- Texto en pantalla: Hoy vemos qué son las condicionales.
- Voz en off: Un programa puede elegir entre caminos de ejecución. Hoy vemos qué son las condicionales.

**Slide 2 — Definición** (`keyPoint`)

- Texto en pantalla: Una condicional decide según una expresión booleana.
- Voz en off: Si es verdadera ejecuta un bloque; si es falsa puede ejecutar otro o continuar. Una condicional decide según una expresión booleana. El else es opcional.
- Una sola idea: decisión booleana.

**Slide 3 — if vs else** (`comparison`)

- Texto en pantalla: if se ejecuta cuando la condición es verdadera y else cuando es falsa.
- Voz en off: Son dos ramas alternativas del mismo punto de decisión. if se ejecuta cuando la condición es verdadera y else cuando es falsa.
- Izquierda (`if`): se ejecuta cuando la condición es verdadera.
- Derecha (`else`): se ejecuta cuando la condición es falsa (si existe).
- 1–4 puntos por lado.

**Slide 4 — Flujo** (`process`)

- Texto en pantalla: El flujo evalúa la condición, ejecuta el caso verdadero o el falso y continúa.
- Voz en off: Después de la decisión el programa sigue adelante. El flujo evalúa la condición, ejecuta el caso verdadero o el falso y continúa.
- Etapas (4): evaluar condición → ejecutar caso verdadero → ejecutar caso falso → continuar.
- Detail breve; el caso falso puede ser “omitir” si no hay `else`.

**Slide 5 — Ejemplo** (`keyPoint`)

- Texto en pantalla: El ejemplo compara un valor y elige un mensaje.
- Voz en off: No hace falta recitar el código; basta entender la decisión. El ejemplo compara un valor y elige un mensaje. Recuerda que else es opcional.
- Incluir `Código sugerido`.
- No mezclar `switch`.

**Slide 6 — Cierre** (`cta`)

- Texto en pantalla: El siguiente concepto son los ciclos.
- Voz en off: Después de decidir conviene aprender a repetir. El siguiente concepto son los ciclos.
- Acción: estudiar los ciclos.

## Visual/media

- Sugerencia: diagrama de decisión / bifurcación (flowchart abstracto).
- No inventar `src`.
- No usar tipo `image` sin media real.

## Código sugerido

```csharp
int edad = 18;
if (edad >= 18)
{
    Console.WriteLine("Adulto");
}
else
    Console.WriteLine("Menor");
```

- `language`: `csharp`
- Exactamente 7 líneas no vacías (≤ 8); ≤ 400 caracteres.
- Debe incluir `if`, una comparación y `else`.
- Ubicar en slide 5; no incluir el bloque en la voz en off.

## Criterios de aceptación

- [ ] Salida: `examples/scripts/condicionales.md`.
- [ ] Seis slides: `cover` → `keyPoint` → `comparison` → `process` → `keyPoint` → `cta`.
- [ ] En cada slide, el `Texto en pantalla` es un extracto literal continuo de la `Voz en off`.
- [ ] Narración indica que `else` es opcional.
- [ ] No aparece `switch`.
- [ ] Código dentro de límites.
- [ ] Preview: `http://localhost:5173/?presentation=condicionales`

## Verificación

1. Contar líneas de código (≤ 8).
2. Confirmar que cada texto en pantalla aparece dentro de su voz en off.
3. Confirmar ausencia de `switch`.
4. No ejecutar `npm run slides -- validate`.
