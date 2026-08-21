# Spec 12 — Ciclos

## Objetivo

Explicar los ciclos como repetición controlada sin copiar código, contrastar
`for` (iteraciones conocidas) con `while` (condición de permanencia), mostrar
el ciclo inicializar → comprobar → ejecutar → actualizar, y advertir sobre
ciclos infinitos. No incluir `foreach`, anidamiento ni optimización.

## Depende de

[11 — Condicionales](11-condicionales.md) (pedagógico). El brief reintroduce
condiciones de control de forma autosuficiente.

## Desbloquea

[13 — Funciones](13-funciones.md)

## No incluye

`foreach`, bucles anidados, `break`/`continue` a fondo, optimización ni
iteradores. No produce JSON.

## Salida

`repos/slides-generator/examples/scripts/ciclos.md`

## Contrato de entrada

```text
Topic: Qué son los ciclos
Audience: estudiantes de secundaria y personas sin experiencia en programación
Language: es
Goal: explicar for y while como repetición controlada en C#
Tone: formal y neutral, con precisión técnica suficiente para una persona con formación doctoral, sin asumir experiencia previa
Duration: 45–60 segundos
Slide count: 6
Deck name: ciclos
Call to action: estudiar las funciones
Visual/media preference: sugerencia de bucle/contador; no inventar assets
Code preference: short csharp for-loop snippet
```

## Mapa de slides

Regla de copy: el `Texto en pantalla` de cada slide debe aparecer como frase
continua dentro de la `Voz en off` de esa misma slide.

**Slide 1 — Portada** (`cover`)

- Texto en pantalla: Hoy vemos qué son los ciclos.
- Voz en off: Vamos a repetir tareas de forma controlada. Hoy vemos qué son los ciclos.

**Slide 2 — Definición** (`keyPoint`)

- Texto en pantalla: Un ciclo repite una tarea sin copiar el mismo código.
- Voz en off: La repetición termina cuando la condición deja de cumplirse. Un ciclo repite una tarea sin copiar el mismo código.
- Una sola idea: repetición controlada.

**Slide 3 — for vs while** (`comparison`)

- Texto en pantalla: for conviene con iteraciones conocidas y while mientras una condición sea verdadera.
- Voz en off: Ambos repiten, pero el criterio de permanencia cambia. for conviene con iteraciones conocidas y while mientras una condición sea verdadera.
- Izquierda (`for`): número de iteraciones conocido o contador claro.
- Derecha (`while`): se mantiene mientras una condición sea verdadera.
- 1–4 puntos por lado.

**Slide 4 — Mecánica** (`process`)

- Texto en pantalla: El ciclo inicializa, comprueba, ejecuta y actualiza.
- Voz en off: Si falta la actualización, la condición puede no cambiar. El ciclo inicializa, comprueba, ejecuta y actualiza.
- Etapas (4): inicializar → comprobar → ejecutar → actualizar.
- Detail breve en cada etapa.

**Slide 5 — Ejemplo y riesgo** (`keyPoint`)

- Texto en pantalla: El ejemplo usa for; un ciclo sin actualización puede no terminar.
- Voz en off: El efecto se entiende sin recitar el código. El ejemplo usa for; un ciclo sin actualización puede no terminar.
- Incluir `Código sugerido`.
- No incluir `foreach` ni anidamiento.

**Slide 6 — Cierre** (`cta`)

- Texto en pantalla: El siguiente concepto son las funciones.
- Voz en off: Después de repetir conviene reutilizar lógica. El siguiente concepto son las funciones.
- Acción: estudiar las funciones.

## Visual/media

- Sugerencia: contador o flecha circular de iteración.
- No inventar `src`.
- No usar tipo `image` sin media real.

## Código sugerido

```csharp
for (int i = 1; i <= 3; i++)
{
    Console.WriteLine(i);
}
```

- `language`: `csharp`
- Exactamente 4 líneas no vacías; ≤ 400 caracteres.
- Debe inicializar, comprobar, ejecutar y actualizar el contador.
- Ubicar en slide 5; no recitar el bloque en la voz en off.

## Criterios de aceptación

- [ ] Salida: `examples/scripts/ciclos.md`.
- [ ] Seis slides: `cover` → `keyPoint` → `comparison` → `process` → `keyPoint` → `cta`.
- [ ] En cada slide, el `Texto en pantalla` es un extracto literal continuo de la `Voz en off`.
- [ ] Comparación `for` vs `while` presente.
- [ ] Advertencia de ciclos infinitos en narración o texto.
- [ ] Sin `foreach`, anidamiento ni optimización.
- [ ] Preview: `http://localhost:5173/?presentation=ciclos`

## Verificación

1. Contar líneas de código (≤ 8).
2. Confirmar que cada texto en pantalla aparece dentro de su voz en off.
3. Confirmar ausencia de `foreach`.
4. No ejecutar `npm run slides -- validate`.
