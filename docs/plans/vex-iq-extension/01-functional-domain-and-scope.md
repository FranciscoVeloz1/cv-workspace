# Domain and scope

**Tipo:** Functional  
**Depende de:** [`README.md`](README.md)  
**Implementa:** Shared vocabulary, success criteria, coexistence rules, and out-of-scope list that every later vex-iq-extension spec must obey.  
**No incluye:** `package.json`, catalog JSON, TextMate grammars, providers, `AGENTS.md` file on disk, snippets, or harvest scripts.

## Resultado

A single functional contract defining what the overlay is, what “catalog” and “agent playbook” mean, how this product coexists with Microsoft C/C++ and the official VEX extension, and what v1 must not ship.

## Requirements

### Vocabulary

| Term | Definition |
|------|------------|
| **Overlay** | This extension. Adds VEX IQ (1st gen) C++ names, docs, snippets, and extra token colors on top of existing `cpp` editing. |
| **Injection** | TextMate grammar and language providers that attach to `source.cpp` without replacing the C++ language id. |
| **Catalog** | Machine-readable list of `CatalogEntry` records (classes, members, enums, ports, globals). Symbol SSOT for completions, hover, signatures, snippets, and extra highlight names. |
| **VEXcode-style name** | Identifier as on [api.vex.com/iq1/home/cpp](https://api.vex.com/iq1/home/cpp/index.html), e.g. `spinFor`, `objectDistance`, `pumpOn`. |
| **Header name** | Identifier in IQ SDK / Doxygen (e.g. `spinTo` alias of `spinToPosition`). Used only when the official name has no matching symbol. |
| **Agent playbook** | One Markdown file `AGENTS.md` that adapts official docs for coding agents. Not a second catalog in a different JSON shape. |
| **Sample object names** | Official example identifiers: `Motor1`, `Brain`, `Controller`, `Drivetrain`, `Bumper1`, `Pneumatic1`. Agents and snippets use these unless the user named devices. |
| **Tracer** | Smallest end-to-end proof: `motor Motor1 = motor(PORT1); Motor1.spin(forward);` completes, hovers, highlights, and matches the Motion chapter recipe. |

### Success

A student or coding agent can write VEXcode IQ (1st gen) C++ in Cursor / VS Code with:

- function and type names from the IQ1 C++ library;
- autocomplete, hover docs, signature help, and snippets;
- extra color on VEX types, members, enums, and `PORT*`;
- C++ keywords, comments, and brackets still handled by the existing C++ grammar / Microsoft C/C++;
- an `AGENTS.md` playbook that lists the same APIs without inventing symbols.

### Failure

Shipping a compiler, linker, Brain downloader, firmware updater, or a new language id that takes over `.cpp` files.

### Coexistence matrix

| Product | Role | This overlay |
|---------|------|----------------|
| Microsoft C/C++ (`ms-vscode.cpptools`) | Standard C++ IntelliSense, `#include` paths, brackets, C++ keywords | Must remain the C++ owner. Overlay adds VEX catalog providers and injection tokens. |
| Official VEX extension (`VEXRobotics.vexcode`) | Project templates, build, download, firmware | Orthogonal. Do not duplicate build/deploy. May run at the same time. |
| This overlay (`vex-iq-cpp`) | IQ1 C++ catalog, snippets, extra colors, `AGENTS.md` | Docs-only. Setting `vexIq.enable` turns VEX providers and injection off. |

### Platform lock

- IQ **1st gen** C++ only.
- Official docs: `https://api.vex.com/iq1/home/cpp/index.html` (flat paths such as `/Motor.html`, `/Brain/Brain.Screen.html` — not the IQ2 `Motion/` / `Sensing/` tree).
- `using namespace vex;` and `vex::` qualification are both valid.
- Official examples require `vexcodeInit();` as the first statement in `main` after the generated comment.

### Out of scope (v1)

- Compiler, linker, debugger, download, VEXos / firmware.
- Python, Blocks, V5, EXP, CTE, AIM, AIR.
- IQ **2nd gen** as the primary API: Brain built-in `inertial()`, AI Vision (`aivision`), controller stick-click `ButtonL3`/`ButtonR3`, preferring `Axis1`–`Axis4` over official IQ1 `AxisA`–`AxisD`.
- New language id (`vex-iq-cpp` as a file type).
- Semantic tokens LSP, compile errors, C++ include-path wizard.
- Webview documentation browser.
- Rainbow-bracket plugin.
- Per-topic Markdown files instead of one `AGENTS.md`.
- Marketplace publication (local install is enough for v1).

## Architecture

Functional only. Later specs own files:

- Catalog schema → spec 03, files → spec 13.
- Editor UX → spec 02, files → specs 12, 14, 15, 16.
- Playbook contract → spec 11, file → spec 17.
- API inventories → specs 04–10.

## Code to do

No repo files in this spec. Later specs implement the vocabulary here.

## Testing

Conceptual only. Implementation tests live in specs 13–18.

## Acceptance

- Overlay vs compiler is unambiguous.
- Injection (not new language id) is the only allowed attachment model.
- Coexistence with Microsoft C/C++ and official VEX is stated.
- `AGENTS.md` is named as the single agent playbook.
- Out-of-scope list matches the README global constraints.

## Verification unlocked

None until spec 18 (Extension Host + playbook).

## Impact

**Edge cases**

- Coloring VEX words in non-VEX `.cpp` files: `vexIq.enable` default `true`; user can disable.
- Official VEX extension already offers IntelliSense: this overlay may duplicate completions. Acceptable; do not disable the official extension from this product.

**Side effects**

- None on `personal-api` or other workspace apps.

**Mitigations**

- Spec 12 documents the setting. Spec 18 verifies disable turns providers off.
