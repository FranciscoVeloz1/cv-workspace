# Catalog harvest

**Tipo:** Extension  
**Depende de:** [`03-functional-catalog-contract.md`](03-functional-catalog-contract.md), [`04-functional-motion.md`](04-functional-motion.md), [`05-functional-drivetrain.md`](05-functional-drivetrain.md), [`06-functional-sensing.md`](06-functional-sensing.md), [`07-functional-brain-screen-sound.md`](07-functional-brain-screen-sound.md), [`08-functional-controller.md`](08-functional-controller.md), [`09-functional-vision.md`](09-functional-vision.md), [`10-functional-logic-and-units.md`](10-functional-logic-and-units.md), [`12-extension-scaffold.md`](12-extension-scaffold.md)  
**Implementa:** `repos/personal-projects/vex-iq-extension/catalog/iq1-cpp.json`, `src/catalog.ts`, `src/catalog.schema.ts`, `tests/catalog.test.ts`.  
**No incluye:** Providers (15), `AGENTS.md` (17).

## Resultado

Validated JSON catalog covering every member required by specs 04–10. Load failure disables VEX features without crashing.

## Requirements

### Harvest procedure (mandatory)

1. **Browser pass** of official pages (Cloudflare blocks unattended `WebFetch`):
   - https://api.vex.com/iq1/home/cpp/index.html
   - Motion: `Motor.html`, `MotorGroup.html`, `Pneumatic.html`
   - Drive: `Drivetrain.html`, `Smartdrive.html`
   - Sensing: `Bumper.html`, `Gyro.html`, `Optical.html`, `Distance.html`, `TouchLED.html`, `Sonar.html`, `Colorsensor.html`
   - Brain: `Brain/index.html`, `Brain/Brain.Screen.html`, `Brain/Brain.Button.html`, `Brain/Brain.Battery.html`, `Brain/Timer.html`
   - Controller: `Controller/index.html`, `Controller/Controller.Axis.html`, `Controller/Controller.Button.html`
   - Vision: `Vision.html` (classic Vision Sensor only — skip AI Vision)
   - Logic/globals: `Event.html`, `Thread.html`, `Enums.html`, plus any Wait / Console page linked from the IQ1 index
   - Do **not** harvest IQ2 trees (`/iq2/`, `Motion/`, `Sensing/`, `Inertial.html`, `AI_Vision_Sensor.html`) as primary docs.
2. **Doxygen/header cross-check:** https://johnholbrook.github.io/iqcpp-doxygen/namespacevex.html and `include/` headers (`vex_motor.h`, `vex_brain.h`, `vex_global.h`, `vex_units.h`, …). Prefer the SDK bundled with the user’s VEXcode IQ if available on disk.
3. Apply winner rule from spec 03.
4. Manual JSON is allowed in v1. A scrape script is optional and must not be the only way to update the file.

Do not commit raw HTML dumps.

### Zod schema (`src/catalog.schema.ts`)

Use `z.infer` — no duplicate interface.

```ts
import { z } from "zod";

const catalogSymbolKindSchema = z.enum([
  "class",
  "constructor",
  "method",
  "property",
  "enum",
  "enumMember",
  "constant",
  "function",
  "snippet",
]);

const catalogSignatureSchema = z.object({
  label: z.string().min(1),
  parameters: z.array(
    z.object({
      name: z.string().min(1),
      type: z.string().min(1),
      doc: z.string(),
    }),
  ),
  returnType: z.string().min(1),
});

export const catalogEntrySchema = z.object({
  id: z.string().min(1),
  kind: catalogSymbolKindSchema,
  name: z.string().min(1),
  cppNames: z.array(z.string().min(1)).min(1),
  container: z.string().min(1).optional(),
  signatures: z.array(catalogSignatureSchema),
  doc: z.string().min(1),
  docUrl: z.string().url().startsWith("https://api.vex.com/iq1"),
  snippet: z.string().optional(),
  highlightScopes: z.array(z.string().min(1)).min(1),
}).refine((entry) => {
  return entry.cppNames.includes(entry.name);
}, { message: "cppNames must include name" });

export const catalogFileSchema = z.object({
  version: z.literal(1),
  platform: z.literal("iq1-cpp"),
  sourceDocs: z.literal("https://api.vex.com/iq1/home/cpp/index.html"),
  entries: z.array(catalogEntrySchema),
});

export type CatalogFile = z.infer<typeof catalogFileSchema>;
export type CatalogEntry = z.infer<typeof catalogEntrySchema>;
```

Callable kinds (`constructor`, `method`, `function`) require `signatures.length >= 1` via `.superRefine` in the same file.

### Loader (`src/catalog.ts`)

```ts
import * as vscode from "vscode";
import { catalogFileSchema, type CatalogFile } from "./catalog.schema";

export function loadCatalog(context: vscode.ExtensionContext): CatalogFile | null {
  try {
    const uri = vscode.Uri.joinPath(context.extensionUri, "catalog", "iq1-cpp.json");
    const raw = Buffer.from(require("fs").readFileSync(uri.fsPath, "utf8")).toString();
    const parsed: unknown = JSON.parse(raw);
    const result = catalogFileSchema.safeParse(parsed);
    if (!result.success) {
      console.error("vex-iq-cpp: catalog validation failed", result.error);
      return null;
    }
    const ids = new Set<string>();
    for (const entry of result.data.entries) {
      if (ids.has(entry.id)) {
        console.error("vex-iq-cpp: duplicate catalog id", entry.id);
        return null;
      }
      ids.add(entry.id);
    }
    return result.data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown catalog error";
    console.error("vex-iq-cpp: catalog load failed", message);
    return null;
  }
}
```

Use `fs.readFileSync` only at activate (once). Prefer `vscode.workspace.fs.readFile` if keeping it async; then `activate` must `await` or chain. Either is fine; do not throw.

### Minimum entries (tests assert presence by `id` or `name`)

`motor`, `spin`, `spinFor`, `spinToPosition`, `setReversed`, `resetPosition`, `motor_group`, `count`, `pneumatic`, `pumpOn`, `drivetrain`, `drive`, `smartdrive`, `turnToHeading`, `bumper`, `pressing`, `sonar`, `foundObject`, `distance` (Range Finder method **and** Distance Sensor class), `objectDistance`, `playSound`, `soundOff`, `controller`, `AxisA`, `vision`, `takeSnapshot`, `wait`, `PORT1`, `PORT12`, `forward`, `vexcodeInit`.

Do **not** require `inertial`, `aivision`, `Axis1`, or `ButtonL3` as required names.

## Architecture

Catalog module is the only JSON parser. Providers never `JSON.parse` themselves.

## Code to do

Create schema, loader, JSON, tests as listed.

## Testing

```bash
cd repos/personal-projects/vex-iq-extension
npx vitest run tests/catalog.test.ts
```

Tests:

1. Fixture `catalog/iq1-cpp.json` parses.
2. All `id` values unique.
3. Every `docUrl` starts with `https://api.vex.com/iq1`.
4. Required names listed above exist in `entries`.
5. Malformed JSON / missing `name` in `cppNames` → `safeParse` failure (unit test against schema, not against `activate`).

Expected: PASS.

## Acceptance

- One file `catalog/iq1-cpp.json`.
- Zod is the type source.
- Load failure returns `null`.

## Verification unlocked

Specs 14–16 consume `loadCatalog`. Spec 18 uses `motor.spin`.

## Impact

**Edge cases**

- Duplicate `id` after a merge: loader returns null (all VEX IntelliSense off) — loud failure is correct.
- Cloudflare: harvest cannot be fully automated.

**Mitigations**

- Vitest list of required names catches accidental deletions.
- Browser pass called out in this spec so implementers do not skip Vision.html, Sonar.html, or Brain.Button.html.
