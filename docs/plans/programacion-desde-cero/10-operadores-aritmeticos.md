# Spec 10 — Operadores aritméticos

## Objetivo

Presentar los operadores aritméticos `+`, `-`, `*`, `/` y `%` como símbolos
que calculan valores, mostrar el flujo de evaluación y advertir brevemente
que el tipo influye en el resultado, sin una clase de precedencia completa.

## Depende de

[09 — Tipos de datos](09-tipos-de-datos.md) (pedagógico). El brief reintroduce
valores numéricos tipados de forma autosuficiente.

## Desbloquea

[11 — Condicionales](11-condicionales.md)

## No incluye

Precedencia completa, operadores de asignación compuestos a fondo,
sobrecarga, matemáticas avanzadas ni operadores lógicos/relacionales (salvo
mención mínima si ayuda el puente a condicionales). No produce JSON.

## Salida

`repos/slides-generator/examples/scripts/operadores-aritmeticos.md`

## Contrato de entrada

```text
Topic: Qué son los operadores aritméticos
Audience: estudiantes de secundaria y personas sin experiencia en programación
Language: es
Goal: explicar +, -, *, / y % y cómo se evalúa una expresión aritmética en C#
Tone: formal y neutral, con precisión técnica suficiente para una persona con formación doctoral, sin asumir experiencia previa
Duration: 45–60 segundos
Slide count: 6
Deck name: operadores-aritmeticos
Call to action: estudiar las condicionales
Visual/media preference: sugerencias; no inventar assets
Code preference: short csharp snippet showing the five operators
```

## Mapa de slides

Regla de copy: el `Texto en pantalla` de cada slide debe aparecer como frase
continua dentro de la `Voz en off` de esa misma slide.

**Slide 1 — Portada** (`cover`)

- Texto en pantalla: Hoy vemos qué son los operadores aritméticos.
- Voz en off: Vamos a calcular valores con símbolos estándar. Hoy vemos qué son los operadores aritméticos.

**Slide 2 — Definición** (`keyPoint`)

- Texto en pantalla: Los operadores son símbolos que calculan valores a partir de operandos.
- Voz en off: Una expresión combina valores y operadores para producir un resultado. Los operadores son símbolos que calculan valores a partir de operandos.
- Una sola idea: definición.

**Slide 3 — Los cinco operadores** (`steps`)

- Texto en pantalla: Usaremos suma, resta, multiplicación, división y módulo.
- Voz en off: Cinco símbolos cubren el cálculo básico. Usaremos suma, resta, multiplicación, división y módulo.
- Exactamente 5 ítems:
  1. `+` — suma
  2. `-` — resta
  3. `*` — multiplicación
  4. `/` — división
  5. `%` — resto (módulo)
- Título ≤ 60; detail ≤ 140.

**Slide 4 — Evaluación** (`process`)

- Texto en pantalla: El recorrido va de los valores a la expresión, luego a la evaluación y al resultado.
- Voz en off: Primero se eligen los datos y después se calcula. El recorrido va de los valores a la expresión, luego a la evaluación y al resultado.
- Etapas (4): valores → expresión → evaluación → resultado.
- Detail breve.

**Slide 5 — Ejemplo y tipo** (`keyPoint`)

- Texto en pantalla: El tipo de los operandos influye en el resultado.
- Voz en off: Por ejemplo, la división entera no es igual a la división decimal. El tipo de los operandos influye en el resultado.
- Incluir `Código sugerido`.
- Sin clase de precedencia completa.

**Slide 6 — Cierre** (`cta`)

- Texto en pantalla: El siguiente concepto son las condicionales.
- Voz en off: Con cálculos claros puedes tomar decisiones. El siguiente concepto son las condicionales.
- Acción: estudiar las condicionales.

## Visual/media

- Sugerencia: expresión con operandos y resultado, o tabla compacta de símbolos.
- No inventar `src`.
- No usar tipo `image` sin media real.

## Código sugerido

```csharp
int a = 10, b = 3;
Console.WriteLine(a + b);
Console.WriteLine(a - b);
Console.WriteLine(a * b);
Console.WriteLine(a / b);
Console.WriteLine(a % b);
```

- `language`: `csharp`
- ≤ 8 líneas no vacías; ≤ 400 caracteres.
- Ubicar en slide 5; no recitar el bloque en la voz en off.
- La advertencia sobre tipos va en narración, no como lección de precedencia.

## Criterios de aceptación

- [ ] Salida: `examples/scripts/operadores-aritmeticos.md`.
- [ ] Seis slides: `cover` → `keyPoint` → `steps` → `process` → `keyPoint` → `cta`.
- [ ] En cada slide, el `Texto en pantalla` es un extracto literal continuo de la `Voz en off`.
- [ ] `steps` lista los cinco operadores.
- [ ] Código `csharp` dentro de límites; menciona influencia del tipo en narración.
- [ ] Preview: `http://localhost:5173/?presentation=operadores-aritmeticos`

## Verificación

1. Contar ítems de `steps` (5) y líneas de código (≤ 8).
2. Confirmar que cada texto en pantalla aparece dentro de su voz en off.
3. Confirmar que no se enseña precedencia completa.
4. No ejecutar `npm run slides -- validate`.
