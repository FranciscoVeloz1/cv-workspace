# Editor experience

**Tipo:** Functional  
**Depende de:** [`01-functional-domain-and-scope.md`](01-functional-domain-and-scope.md)  
**Implementa:** User-visible editor behavior for IQ1 C++ overlay (no implementation files).  
**No incluye:** Catalog JSON schema (spec 03), grammar JSON paths (spec 14), provider class names (spec 15), snippet file contents (spec 16), playbook assembly (spec 17).

## Resultado

A contract for what a user sees when editing a `.cpp` file with the overlay enabled: highlighting, completions, hover, signature help, and snippets. Agents read `AGENTS.md`; they do not get a VS Code webview.

## Requirements

### Highlighting

- C++ keywords (`if`, `int`, `void`, `class`, …), comments, strings, and numbers stay on the existing C++ TextMate grammar / Microsoft C/C++.
- This overlay **adds** scopes for catalog names:
  - types / classes (`motor`, `drivetrain`, `brain`, …) → `support.class.vex-iq`;
  - members (`spin`, `spinFor`, `drive`, …) → `support.function.vex-iq`;
  - enums and aliases (`forward`, `degrees`, `percent`, `coast`, …) → `variable.other.constant.vex-iq`;
  - ports (`PORT1`–`PORT12`) → `variable.other.constant.vex-iq`.
- Brackets `{}()[]` stay on C++ `language-configuration`. Do not fork a full C++ language-configuration in v1 unless spec 18 proves a pairing gap.
- Rainbow-bracket extra colors are out of v1. Themes already color brackets; spec 18 verifies pairing.

### Completions

When `vexIq.enable` is true and the language is `cpp`:

- Suggest classes, constructors, globals (`wait`, `vexcodeInit`), enums, aliases, and `PORT1`–`PORT12`.
- After `.`, suggest members. If the left-hand identifier was declared as `Type name` in the same file (simple pattern `Type ident` or `Type ident =`), prefer members of `Type`. If the type is unknown, still offer **all** catalog methods (no full C++ parser in v1).
- Qualified `vex::motor` and unqualified `motor` (with `using namespace vex`) both complete.

### Hover

On a catalog name: short official description, primary signature, and `docUrl` (official `https://api.vex.com/iq1/...` page). No invented APIs.

### Signature help

Overloads as listed in catalog `signatures[]`. Trigger on `(` after a catalog function or method.

### Snippets

User-facing prefixes (implemented in spec 16): `vex-main`, `vex-motor`, `vex-drivetrain`, `vex-wait`. Bodies include the `vexcodeInit()` comment block matching official examples.

### Agents

The playbook is a **repo file**, not an editor view. Do not add a documentation webview in v1.

### Not in v1 (editor)

- Semantic highlighting via LSP.
- Compile / squiggle errors from a toolchain.
- `#include` path UI (Microsoft C/C++ still owns include paths).

## Architecture

Editor UX is a client of the catalog. Grammar injection and providers are orthogonal consumers of the same names.

## Code to do

Owned later:

- Scaffold / setting → spec 12.
- Grammar → spec 14.
- Providers → spec 15.
- Snippets → spec 16.

## Testing

Manual Extension Host checks in spec 18. Unit tests for providers in spec 15.

## Acceptance

- A user can distinguish overlay coloring from C++ keyword coloring.
- Completions exist for `motor`, `spin`, `wait`, `PORT1`, `forward`.
- Hover includes an official URL.
- Snippets insert a legal `main` + `vexcodeInit` skeleton.
- No webview requirement.

## Verification unlocked

Spec 18 fixture `fixtures/sample-iq1.cpp`.

## Impact

**Edge cases**

- Unknown type after `.` floods completions with every method: accepted YAGNI for v1.
- `vexIq.enable` false: no VEX completions or signature/hover providers (spec 15). TextMate injection may still load (VS Code grammar limitation; spec 14). Disable the extension to drop extra colors.

**Side effects**

- Duplicate items if official VEX extension is also installed: both may suggest `spin`. Do not filter the other extension.

**Mitigations**

- Spec 15: empty or invalid catalog → no items, no throw.
