---
name: vex-iq-cpp
description: Use when writing, reviewing, completing, or explaining VEXcode IQ (1st gen) C++ for VEX IQ robots — motors, drivetrain, smartdrive, pneumatics, sensors, Brain screen, controller, vision, wait, ports, or robot code. Use when the user mentions VEX IQ, VEXcode IQ, IQ1, vex.h, Motor1, Brain, Controller, or IQ Smart Ports. Do not use for V5, EXP, Python, Blocks, or IQ 2nd gen inertial/aivision as the primary API.
---

# VEXcode IQ (1st gen) C++

This folder is the **API source of truth**. Emit only names, types, parameters, and overloads that already exist here. Do not invent APIs, guess V5/Python names, or "fill in" missing SDK methods.

Announce: Using **vex-iq-cpp** to write IQ1 C++ from the bundled playbook and catalog.

## Files in this skill (self-contained)

| File | Role |
|------|------|
| [AGENTS.md](AGENTS.md) | Playbook: when to use a device, constructors, recipes, pitfalls, official URLs |
| [catalog/iq1-cpp.json](catalog/iq1-cpp.json) | 463 harvested symbols: `kind`, `name`, `cppNames`, `container`, `signatures[]` (`label`, `parameters`, `returnType`), `doc`, `docUrl` |
| [snippets/cpp.json](snippets/cpp.json) | `vex-main`, `vex-motor`, `vex-drivetrain`, `vex-wait` bodies |

Do **not** depend on the VS Code extension repo being present. If it is available (`vex-iq-cpp` overlay / `repos/personal-projects/vex-iq-extension`), it is editor-only (completions/hover). It does not compile or download. This skill still wins for generated code.

## Hard constraints

- IQ **1st gen** C++ only. Official docs: `https://api.vex.com/iq1/home/cpp/index.html`.
- Always write **constructors**. There is no VEXcode Device Menu here.
- `#include "vex.h"` (or the project's existing include), `using namespace vex;`, `vexcodeInit();` first in `main` after the generated comment.
- `wait(...)` inside every `while (true)` sensor/controller loop.
- Ports: `PORT1`–`PORT12` only. Braces on every `if` / `for` / `while`.
- Prefer VEXcode names: `spinFor`, `spinToPosition` (not `spinTo`), `pumpOn` (not `pump_on`).
- Chassis heading uses a port **`gyro`** + **`smartdrive`**. Never emit Brain `inertial()` or `aivision`.
- If a name is not in the catalog, **do not emit it**.

## Workflow (every coding request)

1. Pick the matching **AGENTS.md** chapter from the table below. Read that chapter **before** writing code.
2. Confirm every identifier (type, method, enum, port) in **catalog/iq1-cpp.json**. For callables, copy `signatures[].label` and parameter `name` / `type` — do not invent overloads.
3. Match the project's existing include and object names. If the file is empty, use the skeleton and official sample names (`Motor1`, `Brain`, `Controller`, `Drivetrain`).
4. If the user asked for an IQ2-only or V5 API, say it is out of scope and use the IQ1 equivalent from the catalog (or refuse).

```cpp
#include "vex.h"

using namespace vex;

int main() {
  // Initializing Robot Configuration. DO NOT REMOVE!
  vexcodeInit();

  // device constructors + code from the matching chapter
}
```

## Chapter map

| User intent | Read |
|-------------|------|
| Motor, motor group, pneumatics, arm, claw, spin | AGENTS.md **Motion** |
| Chassis drive/turn, wheel size, gyro heading | AGENTS.md **Drivetrain** |
| Bumper, gyro, sonar/range, distance, optical, color, touchled, Brain buttons/battery | AGENTS.md **Sensing** |
| LCD print/draw, `playSound` / `playNote`, `printf` console | AGENTS.md **Brain screen, sound, console** |
| Remote buttons/joysticks, driver control | AGENTS.md **Controller** |
| Vision Sensor snapshots / signatures | AGENTS.md **Vision** |
| `wait`, ports, units, events, threads, timers, `programStop` | AGENTS.md **Logic, units, ports, globals** |

Catalog lookup: search `"name": "<id>"` and read `kind`, `container`, `signatures`. Members live under `container` (e.g. `motor` + `spin`). Constructor signatures are on the constructor entry, not the class entry.

## Forbidden (common inventions)

| Do not emit | IQ1 replacement |
|-------------|-----------------|
| `inertial` | `gyro` on a Smart Port; heading drive via `smartdrive` |
| `aivision` | `vision` (color signatures; max 4 objects) |
| `ButtonL3` / `ButtonR3` | IQ1 buttons: `ButtonEUp`/`EDown`, `FUp`/`FDown`, `LUp`/`LDown`, `RUp`/`RDown` |
| Prefer `Axis1`–`Axis4` | Official IQ1: `AxisA` (left Y), `AxisB` (left X), `AxisC` (right X), `AxisD` (right Y) |
| `controller(primary)` | `controller()` |
| `PORT13` / `PORT21` | `PORT1`–`PORT12` |
| Python `spin_for`, `pump_on`, `take_snapshot` | C++ `spinFor`, `pumpOn`, `takeSnapshot` |
| `calibrateDrivetrain()` | Not in this overlay; construct `drivetrain` / `smartdrive` yourself |
| Mix Range Finder with Distance Sensor | `sonar` → `foundObject` / `distance()`; `distance` → `objectDistance` / `isObjectDetected` |

## Rationalizations — do not

| Excuse | Reality |
|--------|---------|
| "SDK probably has this helper" | If it is missing from the catalog, it is not IQ1 C++ for this skill. |
| "V5 sample is close enough" | Different platform. Port the *task* onto IQ1 types from AGENTS.md. |
| "I'll add inertial for better turns" | IQ1 heading is a port gyro + `smartdrive`. |
| "Device Menu will generate constructors" | Write them. |
| "Skip wait, it's a short loop" | Brain starves. Always `wait`. |

## Red flags — stop and look up

- Identifier you cannot grep in `catalog/iq1-cpp.json`
- Code copied from V5, Python, Blocks, or IQ2 docs
- `inertial`, `aivision`, `ButtonL3`, `Axis1` as the preferred names
- `main` without `vexcodeInit()` or devices used without constructors
- Poll loop without `wait`
