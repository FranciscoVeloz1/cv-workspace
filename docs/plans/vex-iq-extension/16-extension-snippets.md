# Snippets

**Tipo:** Extension  
**Depende de:** [`02-functional-editor-experience.md`](02-functional-editor-experience.md), [`12-extension-scaffold.md`](12-extension-scaffold.md), [`13-extension-catalog-harvest.md`](13-extension-catalog-harvest.md)  
**Implementa:** `repos/personal-projects/vex-iq-extension/snippets/cpp.json` and `package.json` `contributes.snippets`.  
**No incluye:** Completion items of kind Snippet beyond these prefixes (constructors still complete as catalog entries).

## Resultado

Four user prefixes that insert official-style IQ1 C++ skeletons. Bodies match catalog `snippet` fields where present.

## Requirements

### Contribution

```json
{
  "contributes": {
    "snippets": [
      {
        "language": "cpp",
        "path": "./snippets/cpp.json"
      }
    ]
  }
}
```

### Snippet file

VS Code snippet JSON. Prefixes locked:

#### `vex-main`

```cpp
#include "vex.h"

using namespace vex;

int main() {
  // Initializing Robot Configuration. DO NOT REMOVE!
  vexcodeInit();

  $0
}
```

#### `vex-motor`

```cpp
motor ${1:Motor1} = motor(${2:PORT1});
${1:Motor1}.spin(${3:forward});
wait(${4:1}, seconds);
${1:Motor1}.stop();
```

#### `vex-drivetrain`

```cpp
motor ${1:leftMotor} = motor(${2:PORT1}, false);
motor ${3:rightMotor} = motor(${4:PORT2}, true);
drivetrain ${5:Drivetrain} = drivetrain(${1:leftMotor}, ${3:rightMotor}, ${6:259.34}, ${7:320}, ${8:40}, mm, 1);
${5:Drivetrain}.driveFor(forward, ${9:200}, mm);
```

#### `vex-wait`

```cpp
wait(${1:20}, msec);
```

If catalog entries have `kind: "snippet"` with the same prefixes, generate `cpp.json` from the catalog in `scripts/build-snippets.mjs` so bodies cannot drift. v1: committed `snippets/cpp.json` is allowed if tests assert the four prefixes exist and `vex-main` contains `vexcodeInit`.

## Architecture

Snippets are user-triggered templates. Completions remain catalog-driven (spec 15).

## Code to do

Add `snippets/cpp.json` and contribution. Optional generate script.

## Testing

```bash
node -e "const s=require('./snippets/cpp.json'); if (!s['VEX main'] && !Object.values(s).some(x=>x.prefix==='vex-main')) process.exit(1)"
```

Or Vitest: read JSON, assert prefixes `vex-main`, `vex-motor`, `vex-drivetrain`, `vex-wait`; `vex-main` body includes `vexcodeInit` and `using namespace vex`.

Expected: PASS.

## Acceptance

- Inserting `vex-main` yields a compilable-looking `main` (no toolchain in this repo).
- `vex-motor` matches the spec 18 fixture pattern (`motor` + `spin` + `wait` + `stop`).

## Verification unlocked

Spec 18 snippet insert check.

## Impact

**Edge cases**

- Snippets still insert when `vexIq.enable` is false (same grammar limitation). Document: disable the extension to hide snippets, or accept snippets always-on in v1.

**Mitigations**

- Extension README notes the limitation.
