# Assemble AGENTS.md

**Tipo:** Extension  
**Depende de:** [`11-functional-agent-document.md`](11-functional-agent-document.md), [`04-functional-motion.md`](04-functional-motion.md), [`05-functional-drivetrain.md`](05-functional-drivetrain.md), [`06-functional-sensing.md`](06-functional-sensing.md), [`07-functional-brain-screen-sound.md`](07-functional-brain-screen-sound.md), [`08-functional-controller.md`](08-functional-controller.md), [`09-functional-vision.md`](09-functional-vision.md), [`10-functional-logic-and-units.md`](10-functional-logic-and-units.md), [`12-extension-scaffold.md`](12-extension-scaffold.md), [`13-extension-catalog-harvest.md`](13-extension-catalog-harvest.md)  
**Implementa:** `repos/personal-projects/vex-iq-extension/AGENTS.md`  
**No incluye:** Catalog JSON edits, extension providers.

## Resultado

One playbook file agents can follow without `api.vex.com`. Built by concatenating spec 11 front matter + C++ reminder + Agent chapters from specs 04–10 in that order.

## Requirements

### File header (from spec 11)

Start with a Markdown TOC, then front matter:

```markdown
# VEXcode IQ (1st gen) C++ — agent playbook

## Table of contents

- [How to use this file](#how-to-use-this-file)
- [Hard constraints](#hard-constraints)
- [Project skeleton](#project-skeleton)
- [C++ language reminder (VEXcode)](#c-language-reminder-vexcode)
- [Motion](#motion)
- [Drivetrain](#drivetrain)
- [Sensing](#sensing)
- [Brain screen, sound, console](#brain-screen-sound-console)
- [Controller](#controller)
- [Vision](#vision)
- [Logic, units, ports, globals](#logic-units-ports-globals)

Then the spec 11 front-matter sections (purpose, constraints, skeleton, Device Menu vs constructors, braces, how to use).

Then spec 11 **C++ language reminder** chapter.

Then, verbatim, the fenced `## Agent chapter` bodies from:

1. spec 04 (heading `## Motion`)
2. spec 05 (`## Drivetrain`)
3. spec 06 (`## Sensing`)
4. spec 07 (`## Brain screen, sound, console`)
5. spec 08 (`## Controller`)
6. spec 09 (`## Vision`)
7. spec 10 (`## Logic, units, ports, globals`)
```

When copying, strip the outer ````markdown` wrapper from each spec’s Agent chapter; keep the inner `##` headings.

### Rules

- No extra topics.
- Every chapter starts with a line `Official: https://api.vex.com/iq1`.
- Every catalog `name` appears at least once in `AGENTS.md` (test). Nested names like `spinFor` count.
- Do not generate `AGENTS.md` from JSON in v1 unless a single script already exists; concatenation from spec chapters is enough. If a generator is added later, catalog remains SSOT for names and `AGENTS.md` remains SSOT for recipes.
- Point to `catalog/iq1-cpp.json` in Hard constraints as the symbol list.

### Classes that need a heading or subheading

At minimum `###` or `##` mention: `motor`, `motor_group`, `pneumatic`, `drivetrain`, `smartdrive`, `brain`, `bumper`, `touchled`, `colorsensor`, `optical`, `gyro`, `distance`, `sonar`, `controller`, `vision`, `event`, `thread`, `timer`, plus Screen / Sound / Console as in spec 07. An explicit “do not emit `inertial` / `aivision`” sentence counts; do not require those class headings.

## Architecture

Playbook is prose SSOT. Catalog is symbol SSOT. Spec 17 is the only writer of `AGENTS.md`.

## Code to do

Create `repos/personal-projects/vex-iq-extension/AGENTS.md` with the concatenation above. Add `tests/agents-md.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { catalogFileSchema } from "../src/catalog.schema";

const playbook = readFileSync("AGENTS.md", "utf8");
const catalog = catalogFileSchema.parse(
  JSON.parse(readFileSync("catalog/iq1-cpp.json", "utf8")),
);

test("chapters and official URLs", () => {
  expect(playbook).toContain("## Motion");
  expect(playbook).toContain("## Drivetrain");
  expect(playbook).toContain("## Sensing");
  expect(playbook).toContain("## Brain screen, sound, console");
  expect(playbook).toContain("## Controller");
  expect(playbook).toContain("## Vision");
  expect(playbook).toContain("## Logic, units, ports, globals");
  expect(playbook).toContain("## C++ language reminder (VEXcode)");
  const official = playbook.split("\n").filter((line) => {
    return line.startsWith("Official:");
  });
  expect(official.length).toBeGreaterThanOrEqual(7);
  for (const line of official) {
    expect(line).toContain("https://api.vex.com/iq1");
  }
});

test("every catalog name appears in AGENTS.md", () => {
  for (const entry of catalog.entries) {
    expect(playbook.includes(entry.name)).toBe(true);
  }
});
```

## Testing

```bash
cd repos/personal-projects/vex-iq-extension
npx vitest run tests/agents-md.test.ts
```

Expected: PASS after `AGENTS.md` and catalog exist.

Grep gate during spec review (this pass): each of 04–10 Agent chapters contains `Official: https://api.vex.com/iq1`.

## Acceptance

- TOC lists seven topic chapters plus reminder.
- No second playbook path.
- Extension README (spec 12) links this file.

## Verification unlocked

Spec 18 playbook completeness + Motion recipe vs fixture.

## Impact

**Edge cases**

- Catalog `name` that is only an enum spelling like `off` may match inside “offtime”: test uses `includes(entry.name)` which can false-pass. Acceptable v1; prefer word checks later.

**Side effects**

- Large file in agent context windows: required by product.

**Mitigations**

- TOC at top.
