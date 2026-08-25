# Extension scaffold

**Tipo:** Extension  
**Depende de:** [`02-functional-editor-experience.md`](02-functional-editor-experience.md), [`01-functional-domain-and-scope.md`](01-functional-domain-and-scope.md)  
**Implementa:** `repos/personal-projects/vex-iq-extension/package.json`, `src/extension.ts`, `tsconfig.json`, `.vscodeignore`, extension `README.md`.  
**No incluye:** Catalog JSON (13), grammar (14), provider logic (15), snippets JSON (16), `AGENTS.md` body (17).

## Resultado

A loadable VS Code / Cursor extension that activates on `cpp`, reads `vexIq.enable`, and calls into modules added by later specs. Tracer path: `activate` → empty providers until 13–15 land.

## Requirements

### Identifiers

| Field | Value |
|-------|-------|
| `name` | `vex-iq-cpp` |
| `displayName` | `VEXcode IQ C++ Overlay` |
| `publisher` | `francisco` |
| `version` | `0.1.0` |
| `engines.vscode` | `^1.85.0` (Cursor-compatible) |
| `main` | `./out/extension.js` |
| `activationEvents` | `onLanguage:cpp` |

### `contributes`

- `configuration` property `vexIq.enable`: boolean, default `true`, description “Enable VEXcode IQ (1st gen) C++ completions, hovers, signatures, snippets, and extra highlighting.”
- `grammars` array filled in spec 14 (empty array forbidden in final 14; scaffold may omit grammars until 14).
- `snippets` filled in spec 16.
- **No** `languages` contribution that registers a new id or steals `.cpp`.

### `src/extension.ts`

```ts
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext): void {
  const enabled = vscode.workspace.getConfiguration("vexIq").get<boolean>("enable", true);
  if (!enabled) {
    return;
  }
  // Specs 14–16 register providers/grammars via package.json; spec 15 registers providers here.
}

export function deactivate(): void {
  return;
}
```

Always braces, explicit returns.

### Scripts

`package.json` scripts: `compile` (`tsc -p .`), `watch`, `test` (`vitest run`). DevDependencies: `typescript`, `@types/vscode`, `vitest`, `zod`.

### README.md (extension repo)

State: docs-only overlay; not a compiler; point agents to `AGENTS.md`; require Microsoft C/C++ for standard C++; optional official VEX extension for build/download.

### `.vscodeignore`

Exclude `src/**`, `tests/**`, `tsconfig.json`, `*.map`. Include `catalog/**`, `syntaxes/**`, `snippets/**`, `out/**`, `AGENTS.md`.

## Architecture

Thin `activate`. Catalog load in a `src/catalog.ts` module (spec 13). Providers in `src/providers/` (spec 15).

## Code to do

Create the files listed in **Implementa**. Do not implement harvest yet.

## Testing

```bash
cd repos/personal-projects/vex-iq-extension
npm install
npm run compile
```

Expected: `out/extension.js` exists, `tsc` exit 0.

Open Extension Development Host (`F5` when launch.json added). Expected: extension activates on a `.cpp` file without throwing.

## Acceptance

- No new language id.
- `vexIq.enable` false → `activate` returns immediately (providers from 15 must also no-op; until 15, simply return).
- Extension README links `AGENTS.md`.

## Verification unlocked

Launch config may be added here:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"]
    }
  ]
}
```

File: `repos/personal-projects/vex-iq-extension/.vscode/launch.json`

## Impact

**Edge cases**

- `get<boolean>` undefined: default `true`.
- Activating on non-cpp: should not happen (`onLanguage:cpp`).

**Side effects**

- None outside this repo.

**Mitigations**

- `deactivate` empty explicit return.
