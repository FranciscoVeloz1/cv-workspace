# Spec 13 — Funciones

## Objetivo

Explicar una función como bloque reutilizable con parámetros y valor de
retorno, contrastar repetir instrucciones frente a reutilizar una función, y
cerrar la serie invitando a practicar un programa pequeño. No incluir clases,
sobrecargas, genéricos ni asincronía.

## Depende de

[12 — Ciclos](12-ciclos.md) (pedagógico). El brief define funciones de forma
autosuficiente.

## Desbloquea

Ninguna dentro de esta serie. Es el brief final.

## No incluye

Clases, métodos de instancia, sobrecarga, genéricos, `async`/`await`,
delegados ni LINQ. No produce JSON.

## Salida

`repos/slides-generator/examples/scripts/funciones.md`

## Contrato de entrada

```text
Topic: Qué son las funciones
Audience: estudiantes de secundaria y personas sin experiencia en programación
Language: es
Goal: explicar funciones con parámetros, return y llamada en C#
Tone: formal y neutral, con precisión técnica suficiente para una persona con formación doctoral, sin asumir experiencia previa
Duration: 45–60 segundos
Slide count: 6
Deck name: funciones
Call to action: practicar un programa pequeño
Visual/media preference: sugerencia de caja entrada-proceso-salida; no inventar assets
Code preference: short csharp function with two parameters, return, and call
```

## Mapa de slides

Regla de copy: el `Texto en pantalla` de cada slide debe aparecer como frase
continua dentro de la `Voz en off` de esa misma slide.

**Slide 1 — Portada** (`cover`)

- Texto en pantalla: Hoy vemos qué son las funciones.
- Voz en off: Vamos a reutilizar lógica con nombre. Hoy vemos qué son las funciones.

**Slide 2 — Definición** (`keyPoint`)

- Texto en pantalla: Una función es un bloque reutilizable de instrucciones.
- Voz en off: Recibe entradas, ejecuta un proceso y puede devolver un resultado. Una función es un bloque reutilizable de instrucciones.
- Una sola idea: reutilización.

**Slide 3 — Ciclo de uso** (`process`)

- Texto en pantalla: El recorrido define, recibe parámetros, ejecuta, devuelve y llama.
- Voz en off: Primero se declara la lógica y después se usa. El recorrido define, recibe parámetros, ejecuta, devuelve y llama.
- Etapas (5): definir → recibir parámetros → ejecutar → devolver → llamar.
- Detail breve por etapa.

**Slide 4 — Repetir vs reutilizar** (`comparison`)

- Texto en pantalla: Repetir copia instrucciones; una función concentra la lógica en un solo bloque.
- Voz en off: La diferencia es mantenimiento y claridad. Repetir copia instrucciones; una función concentra la lógica en un solo bloque.
- Izquierda (repetir): copiar las mismas instrucciones en varios lugares.
- Derecha (función): un solo bloque llamado cuando haga falta.
- 1–4 puntos por lado.

**Slide 5 — Entrada, proceso y salida** (`keyPoint`)

- Texto en pantalla: El ejemplo separa parámetros, cálculo y resultado.
- Voz en off: Entrada, proceso y salida quedan visibles sin recitar el código. El ejemplo separa parámetros, cálculo y resultado.
- Incluir `Código sugerido`.
- Sin clases, sobrecargas, genéricos ni asincronía.

**Slide 6 — Cierre** (`cta`)

- Texto en pantalla: Practica un programa pequeño con lo aprendido.
- Voz en off: Combina variables, tipos, operadores, condicionales, ciclos y funciones. Practica un programa pequeño con lo aprendido.
- Acción: practicar un programa pequeño.

## Visual/media

- Sugerencia: caja o diagrama entrada → proceso → salida.
- No inventar `src`.
- No usar tipo `image` sin media real.

## Código sugerido

```csharp
int resultado = Sumar(2, 3);
Console.WriteLine(resultado);

int Sumar(int a, int b)
{
    return a + b;
}
```

- `language`: `csharp`
- Exactamente 7 líneas no vacías (≤ 8); ≤ 400 caracteres.
- Debe mostrar dos parámetros, `return` y una llamada.
- Ubicar en slide 5; no incluir el bloque en la voz en off.

## Criterios de aceptación

- [ ] Salida: `examples/scripts/funciones.md`.
- [ ] Seis slides: `cover` → `keyPoint` → `process` → `comparison` → `keyPoint` → `cta`.
- [ ] En cada slide, el `Texto en pantalla` es un extracto literal continuo de la `Voz en off`.
- [ ] `process` tiene 5 etapas válidas.
- [ ] Código con parámetros, `return` y llamada dentro de límites.
- [ ] Sin clases, sobrecargas, genéricos ni asincronía.
- [ ] Preview: `http://localhost:5173/?presentation=funciones`

## Verificación

1. Contar líneas de código (≤ 8) y etapas de `process` (3–6).
2. Confirmar que cada texto en pantalla aparece dentro de su voz en off.
3. Confirmar CTA de práctica (fin de serie).
4. No ejecutar `npm run slides -- validate`.
