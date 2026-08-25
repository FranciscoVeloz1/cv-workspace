# Catalog contract

**Tipo:** Functional  
**Depende de:** [`01-functional-domain-and-scope.md`](01-functional-domain-and-scope.md)  
**Implementa:** The `CatalogEntry` JSON contract and uniqueness rules. File on disk is owned by spec 13.  
**No incluye:** Harvest procedure details (spec 13), provider wiring (spec 15), playbook prose (specs 04–11).

## Resultado

One typed catalog shape. Zod infers TypeScript types (`z.infer`). Do not declare a duplicate `interface CatalogEntry` beside the schema. `AGENTS.md` must not list a member that is missing from this catalog.

## Requirements

### Root document

File: `repos/personal-projects/vex-iq-extension/catalog/iq1-cpp.json` (created in spec 13).

```ts
type CatalogFile = {
  version: 1;
  platform: "iq1-cpp";
  sourceDocs: "https://api.vex.com/iq1/home/cpp/index.html";
  entries: CatalogEntry[];
};
```

`version` is the integer `1`. Additional root keys are forbidden in v1.

### `CatalogSymbolKind`

```ts
type CatalogSymbolKind =
  | "class"
  | "constructor"
  | "method"
  | "property"
  | "enum"
  | "enumMember"
  | "constant"
  | "function"
  | "snippet";
```

### `CatalogEntry`

```ts
type CatalogEntry = {
  id: string;
  kind: CatalogSymbolKind;
  name: string;
  cppNames: string[];
  container?: string;
  signatures: Array<{
    label: string;
    parameters: Array<{ name: string; type: string; doc: string }>;
    returnType: string;
  }>;
  doc: string;
  docUrl: string;
  snippet?: string;
  highlightScopes: string[];
};
```

| Field | Rule |
|-------|------|
| `id` | Unique in `entries`. Pattern: `container?` + `.` + `kind` + `.` + primary name, e.g. `motor.method.spin`, `vex.function.wait`, `vex.constant.PORT1`, `motor.constructor.motor`. |
| `kind` | One of `CatalogSymbolKind`. |
| `name` | VEXcode-style primary identifier (`spinFor`, not `spin_for`). |
| `cppNames` | All spellings that should complete/highlight, including aliases (`fwd` and `forward`). Always includes `name`. |
| `container` | Owning class or `vex` for namespace-level symbols. Omit only for file-level snippets. |
| `signatures` | At least one object for callable kinds (`constructor`, `method`, `function`). Empty array for `enum` / `constant` / `class` / `property` when not callable. |
| `doc` | Short official description (one or two sentences). English. |
| `docUrl` | Must start with `https://api.vex.com/iq1`. No Doxygen URLs in this field (Doxygen is harvest-only). |
| `snippet` | Optional VS Code snippet body for `kind: "snippet"` or constructor recipes. |
| `highlightScopes` | One or more of `support.class.vex-iq`, `support.function.vex-iq`, `variable.other.constant.vex-iq`. |

### Uniqueness

- `id` unique (case-sensitive).
- Duplicate `(container, name, kind)` is forbidden unless overloads share one entry with multiple `signatures`.
- Overloads of one member = **one** entry, many `signatures`.

### Winner rule (docs vs headers)

1. Prefer official VEXcode-style `name` and `doc`.
2. If official documents a name with **no** matching SDK symbol, **omit** the entry (do not invent).
3. SDK-only aliases (`spinTo` for `spinToPosition`) may appear in `cppNames` of the official entry, with `doc` noting the alias. Do not create a second entry that teaches the alias as the primary API.
4. IQ **2nd-gen-only** members accidentally harvested (`inertial` Brain IMU, `aivision`, `ButtonL3`/`ButtonR3`) must not be primary. If a symbol exists only in a mixed SDK, `doc` starts with `IQ 2nd-gen only.` and the Agent chapter must not teach it. IQ1 `sonar` (`foundObject`, `distance`) and IQ1 `distance` (`objectDistance`) are both in-scope; do not prefix them with a generation warning.

### Invalid catalog

Parse or Zod failure: log once, treat as empty `entries`, disable VEX providers, do not throw out of `activate`.

### Playbook constraint

Every member named in any `## Agent chapter` (specs 04–10) must have a catalog `id`. Spec 17 tests this with grep against `name` fields.

### Derived fields

- Snippet prefixes in spec 16 read `kind === "snippet"` plus constructor `snippet` strings.
- Grammar in spec 14 unions all `cppNames` grouped by `highlightScopes`.

## Architecture

Catalog is knowledge SSOT. Providers, grammar, snippets, and playbook names are derived. Playbook **recipes** (prose + sample code) are SSOT for agents; they must not introduce extra identifiers.

## Code to do

Zod schema + JSON file → spec 13.

## Testing

Spec 13:

- every `id` unique;
- every `docUrl` starts with `https://api.vex.com/iq1`;
- every symbol required by specs 04–10 is present;
- invalid JSON does not crash `activate`.

## Acceptance

- Schema matches the types above (no parallel interface).
- Winner rule is implementable without product judgment in harvest.
- Playbook cannot outrun the catalog.

## Verification unlocked

Specs 13, 17, 18.

## Impact

**Edge cases**

- Empty `signatures` on a `method` is invalid; Zod must reject.
- `cppNames` missing `name` is invalid; Zod must reject.

**Side effects**

- Changing `id` after v1 breaks nothing user-facing (ids are internal) but breaks tests; treat `id` as stable once shipped.

**Mitigations**

- Vitest fixtures with one good entry and one malformed file.
