---
name: add-cavalier-wiki-definition
description: Adds bilingual concept definitions to the Cavalier cluster wiki (repos/docs/cavalier-cluster-wiki). Each page is in simple terms, includes an example, and includes references to follow; English first, Spanish at the bottom. Use when adding wiki definitions, concept pages, glossary entries, or files under cavalier-cluster-wiki/concepts, or when the user asks to define a term for this wiki.
---

# Add Cavalier wiki definition

Write **one definition page per concept** in `repos/docs/cavalier-cluster-wiki`.

The definition should be in simple terms, should include an example and should include references to follow. Also should be in English and at the bottom in Spanish.

Wiki root: `repos/docs/cavalier-cluster-wiki` (workspace) or the git root of `cavalier-cluster-wiki`.

Read `index.md` and `readme.md` at the wiki root before writing. Do not duplicate the catalog here.

## Workflow

```
Task Progress:
- [ ] 1. Resolve concept in index.md (category slug, concept slug, level, research tags)
- [ ] 2. Create concepts/<category-slug>/<level>/<concept-slug>.md from the template
- [ ] 3. English: simple definition + example + references to follow
- [ ] 4. Spanish block at the bottom (same three parts)
- [ ] 5. Link the concept from index.md
```

1. Match the user term to a row in `index.md`. Use that **Level**, **Concept** title, **Slug**, category heading, and research tags. If the term is new, pick the closest category or ask.
2. Path: `concepts/<category-slug>/<level>/<concept-slug>.md` where `<level>` is `basic`, `intermediate`, `advanced`, or `master` (lowercase, matching the index). Folders already exist (with `.gitkeep`). Do not invent a slug when the index already has one.
3. Fill the template. One concept, one file. Do not append a second concept to an existing file.
4. In `index.md`, turn the concept name into a relative link, e.g. `[Voltage](concepts/electronics/basic/voltage.md)`. Leave the slug column as backticks.

## Page template

```markdown
# <Concept name from index>

- **Level:** Basic | Intermediate | Advanced | Master
- **Category:** <category heading>
- **Slug:** `<concept-slug>`
- **Research:** q0N, q0N | prerequisite

## Definition

<2–6 short sentences. Everyday words. If a technical term is required, explain it in the same sentence.>

## Example

<One concrete example a beginner can picture. Prefer a car / cluster / OBD situation when it helps. Do not invent Cavalier 2021 pinouts, CAN IDs, or part numbers.>

## References

1. [Title](https://example.com) — what to read here and why
2. [Title](https://example.com) — what to read here and why

## En español

### Definición

<Same ideas as Definition, natural Spanish. Keep standard acronyms: CAN, LIN, OBD-II, IPC, ECU.>

### Ejemplo

<Same example as Example, in Spanish.>

### Referencias

1. [Título](https://example.com) — qué leer y por qué
2. [Título](https://example.com) — qué leer y por qué
```

## Writing rules

**Simple terms (English and Spanish)**

- Short sentences. No unexplained jargon.
- Say what it is, then why it matters for reading cluster / vehicle-network material.
- Analogies (Cruze, Malibu Limited, Volt SI) must be labeled **analogy**, never as Cavalier 2021 fact.
- If the research marks a gap, say it is unknown. Do not fill gaps.

**Example**

- Exactly one worked example (a second short contrast is OK).
- Must be consistent with the definition.
- Out of scope: exploits, immobilizer bypass, unauthorized access, verbatim GM shop manuals.

**References to follow**

- At least two **real, followable** URLs. Verify they exist in this session (search or fetch). Do not invent links or document titles.
- Prefer: standards abstracts (ISO, SAE), manufacturer datasheets, public owner-manual / NHTSA pages, Arduino / Linux docs, Wikipedia or a textbook page for first-principles terms.
- Each item: title + URL + one line on what to follow there.
- Same URLs in English and Spanish; Spanish lines may rephrase the “why”.
- Do not paste copyrighted manuals. Link only public pages.

**English then Spanish**

- Entire English page first (`Definition`, `Example`, `References`).
- Then `## En español` with `### Definición`, `### Ejemplo`, `### Referencias`.
- Do not mix languages inside the English sections. Do not put Spanish only as a one-line summary — translate all three parts.

## Do not

- Use the old readme skeleton (`What it is` / `Why it matters` / `What the research actually says`) for new definition pages
- Invent K216 IPC pinouts, CAN IDs, bus placement, or OEM part numbers
- Commit unless the user asked

## Example (shape only)

For index row **Basic · Voltage · `voltage`** under Electronics (`electronics`):

```markdown
# Voltage

- **Level:** Basic
- **Category:** Electronics and signals
- **Slug:** `voltage`
- **Research:** prerequisite

## Definition

Voltage is how strongly electricity is pushed from one point to another. It is measured in volts (V). A bigger voltage means a stronger push, not “more electricity stored.” Current is how much charge actually flows; voltage is the push that can make it flow.

## Example

A 12 V car battery is like a pump rated for a certain pressure. The same 12 V can run a small lamp or a starter motor. The lamp and the starter use different amounts of current, but both see about 12 V across their terminals when the system is healthy.

## References

1. [Voltage (Wikipedia)](https://en.wikipedia.org/wiki/Voltage) — plain overview and the volt as a unit
2. [Khan Academy: Voltage, current, and resistance](https://www.khanacademy.org/science/physics/circuits-topic/circuits-resistance/a/ee-voltage-and-current) — worked circuit examples of push vs flow

## En español

### Definición

El voltaje es qué tan fuerte se empuja la electricidad de un punto a otro. Se mide en voltios (V). Un voltaje más alto es un empujón más fuerte, no “más electricidad guardada.” La corriente es cuánta carga fluye; el voltaje es el empujón que puede hacerla fluir.

### Ejemplo

La batería de un auto a 12 V es como una bomba con cierta presión. Esos mismos 12 V pueden encender un foco pequeño o el motor de arranque. El foco y el arranque usan distinta corriente, pero ambos ven cerca de 12 V en sus terminales si el sistema está sano.

### Referencias

1. [Voltage (Wikipedia)](https://en.wikipedia.org/wiki/Voltage) — panorama sencillo y el voltio como unidad
2. [Khan Academy: Voltage, current, and resistance](https://www.khanacademy.org/science/physics/circuits-topic/circuits-resistance/a/ee-voltage-and-current) — ejemplos de circuito de empujón frente a flujo
```
