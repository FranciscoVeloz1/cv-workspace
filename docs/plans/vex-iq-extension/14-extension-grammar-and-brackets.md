# Grammar and brackets

**Tipo:** Extension  
**Depende de:** [`02-functional-editor-experience.md`](02-functional-editor-experience.md), [`12-extension-scaffold.md`](12-extension-scaffold.md), [`13-extension-catalog-harvest.md`](13-extension-catalog-harvest.md)  
**Implementa:** `repos/personal-projects/vex-iq-extension/syntaxes/vex-iq-cpp.tmLanguage.json` and `package.json` `contributes.grammars`.  
**No incluye:** Providers, snippets, C++ language-configuration fork.

## Resultado

TextMate injection grammar colors catalog names inside `source.cpp` without replacing C++.

## Requirements

### `package.json` contribution

```json
{
  "contributes": {
    "grammars": [
      {
        "path": "./syntaxes/vex-iq-cpp.tmLanguage.json",
        "scopeName": "vex-iq.injection",
        "injectTo": ["source.cpp"]
      }
    ]
  }
}
```

When `vexIq.enable` is false, injection still loads (VS Code cannot gate grammars on settings easily). Acceptable v1. Document in README that disable mainly turns off providers/snippets; users who need zero extra colors disable the extension.

If implementers add a `when` clause that actually works on grammars in the target VS Code engine, use it; do not invent unsupported contribution keys.

### Grammar file

`scopeName`: `vex-iq.injection`.  
`injectionSelector`: `L:source.cpp -comment -string` (do not color VEX words inside comments or strings).

Patterns: match catalog `cppNames` grouped by `highlightScopes`:

- classes → `support.class.vex-iq`
- functions/methods → `support.function.vex-iq`
- constants/enums/ports → `variable.other.constant.vex-iq`

Use word-boundary matches (`\bspinFor\b`). Generate the regex list from the catalog at build time **or** maintain a generated `syntaxes/` file committed beside the JSON catalog. If generated, `npm run compile` must regenerate it so names cannot drift. v1 allowed: a small Node script `scripts/build-grammar.mjs` run before `compile`.

Do not hand-maintain a third name list.

### Brackets

Do not contribute `language-configuration` for `cpp`. Microsoft C/C++ / default C++ config owns `{}()[]`. Rainbow brackets out of v1.

## Architecture

Grammar is a derived view of the catalog (DRY).

## Code to do

Add `syntaxes/vex-iq-cpp.tmLanguage.json` and grammar contribution. Optional `scripts/build-grammar.mjs`.

## Testing

Unit: `scripts/build-grammar.mjs` (or equivalent) includes `\bmotor\b` and `\bPORT1\b` and `\bspinFor\b`.

Manual (spec 18): `motor` and `forward` are colored differently from `if`.

```bash
npm run compile
```

Expected: grammar file exists and is valid JSON.

## Acceptance

- `injectTo` is `source.cpp` only.
- No new language id.
- Comments/strings excluded via `injectionSelector`.

## Verification unlocked

Spec 18 highlight check.

## Impact

**Edge cases**

- `off` matching inside other words: `\b` required.
- `wait` might collide with user identifiers: accepted (same as completing `wait`).

**Side effects**

- All `cpp` files in the workspace get VEX coloring when the extension is enabled.

**Mitigations**

- README + `vexIq.enable` for providers; disable extension to drop grammar.
