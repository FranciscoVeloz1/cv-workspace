# Providers

**Tipo:** Extension  
**Depende de:** [`02-functional-editor-experience.md`](02-functional-editor-experience.md), [`12-extension-scaffold.md`](12-extension-scaffold.md), [`13-extension-catalog-harvest.md`](13-extension-catalog-harvest.md)  
**Implementa:** `repos/personal-projects/vex-iq-extension/src/providers/completion.ts`, `src/providers/hover.ts`, `src/providers/signature.ts`, registration in `src/extension.ts`, `tests/providers.test.ts`.  
**No incluye:** Snippets contribution (16), grammar (14).

## Resultado

Completion, hover, and signature help for `cpp` when catalog loaded and `vexIq.enable` is true.

## Requirements

Register only if `loadCatalog` returned non-null and `vexIq.enable` is true:

```ts
const selector: vscode.DocumentSelector = { language: "cpp" };

context.subscriptions.push(
  vscode.languages.registerCompletionItemProvider(selector, completionProvider, ".", ":"),
  vscode.languages.registerHoverProvider(selector, hoverProvider),
  vscode.languages.registerSignatureHelpProvider(selector, signatureProvider, "(", ","),
);
```

Trigger characters: `.` for members, `:` for `vex::`.

### Completion

- If `null` catalog: do not register (already handled) or `provideCompletionItems` returns `undefined`. Never throw.
- Top-level: classes, functions (`wait`), constants (`PORT1`, `forward`), constructors as class names.
- After `.`: parse simple declaration in the current document:

```ts
const decl = new RegExp("\\b([A-Za-z_][A-Za-z0-9_]*)\\s+" + ident + "\\b");
```

If `Type` matches a catalog `kind === "class"` `name`, offer that class’s methods/properties. Else offer **all** methods (spec 02 YAGNI).

- `vex::` prefix: offer catalog names as `vex::motor` insert text when appropriate.
- `CompletionItem.documentation` = `doc` + `docUrl`.
- Kinds: Class, Method, Function, EnumMember, Constant, Snippet as mapped from `CatalogSymbolKind`.

### Hover

On word at position: find entry where `cppNames` contains the word. Markdown string:

```md
**spinFor** — `bool spinFor(...)`

<doc>

[Official docs](docUrl)
```

Multiple signatures: list each `label`. No match → `undefined`.

### Signature help

When cursor is inside a call whose callee is a catalog function/method: `SignatureHelp` with each overload’s `label` and `parameters`. Active parameter from comma count. No throw on parse failure.

### Errors

Empty catalog / `null`: no registration. Catch `unknown` in providers, log once, return `undefined`.

```ts
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : "provider error";
  console.error("vex-iq-cpp", message);
  return undefined;
}
```

## Architecture

Providers read `CatalogFile` in memory. No second JSON. No C++ AST library in v1.

## Code to do

Create provider files and wire `activate`. Export pure helpers for Vitest:

```ts
export function membersForType(catalog: CatalogFile, typeName: string): CatalogEntry[];
export function findEntry(catalog: CatalogFile, word: string): CatalogEntry | undefined;
```

## Testing

```bash
npx vitest run tests/providers.test.ts
```

Tests (no VS Code host required):

1. `findEntry` finds `spin` and `PORT1`.
2. `membersForType(catalog, "motor")` includes `spin` and `spinFor`, excludes `drive`.
3. `membersForType(catalog, "UnknownType")` returns all methods (YAGNI fallback).
4. `findEntry` misses `notAVexApi` → `undefined`.

Expected: PASS.

## Acceptance

- `vexIq.enable` false: no providers registered.
- Invalid catalog: no providers, extension stays alive.
- Member completion prefers typed object when `motor Motor1` is in file.

## Verification unlocked

Spec 18: type `Motor1.` in fixture and see `spin`.

## Impact

**Edge cases**

- `brain Brain` vs `Brain.Screen`: nested `Screen` may not parse; user still gets all-methods fallback.
- Overload lists can be long (`spinFor`): show all signatures (official does).

**Side effects**

- Duplicate completions with official VEX extension.

**Mitigations**

- Documentation in extension README.
