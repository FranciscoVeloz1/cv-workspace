# Controller

**Tipo:** Functional  
**Depende de:** [`03-functional-catalog-contract.md`](03-functional-catalog-contract.md), [`11-functional-agent-document.md`](11-functional-agent-document.md)  
**Implementa:** Catalog + Agent chapter for `controller`, buttons, axes, `RemoteControlCodeEnabled`.  
**No incluye:** Drivetrain arcade helpers (out of official IQ1 drivetrain page). Stick-click `ButtonL3`/`ButtonR3` (IQ 2nd gen).

## Resultado

Complete IQ1 controller inventory. Official axes are **`AxisA`–`AxisD`**. Eight shoulder/face buttons. No L3/R3.

Official: https://api.vex.com/iq1/home/cpp/Controller/index.html  
Axis: https://api.vex.com/iq1/home/cpp/Controller/Controller.Axis.html  
Button: https://api.vex.com/iq1/home/cpp/Controller/Controller.Button.html

## Requirements

### VEXcode glue (namespace / generated)

| Name | Type | Notes |
|------|------|-------|
| `vexcodeInit` | `void vexcodeInit();` | First line of `main` after the official comment. Catalog `kind: function`, container `vex`. |
| `RemoteControlCodeEnabled` | `bool` assignable | Default true. `false` disables Devices-menu driver control so user code owns sticks. Catalog `kind: constant` or `property` at `vex` / global. |

These are VEXcode-generated, not in old `vex_controller.h`. Still required: every official example uses them.

### Class `controller`

Constructor: `controller Controller = controller();` — no primary/partner argument on IQ (unlike V5).

### Buttons (`controller::button`)

Members on each button object:

| Name | Signature | Return |
|------|-----------|--------|
| `pressing` | `bool pressing(void) const` | Official page also says integer 1/0. Catalog `bool`. |
| `pressed` | `void pressed(void (*callback)(void)) const` | |
| `released` | `void released(void (*callback)(void)) const` | |

Button objects (all required on IQ1):

| Object | Hardware |
|--------|----------|
| `ButtonEUp` | E ▲ |
| `ButtonEDown` | E ▼ |
| `ButtonFUp` | F ▲ |
| `ButtonFDown` | F ▼ |
| `ButtonLUp` | L ▲ |
| `ButtonLDown` | L ▼ |
| `ButtonRUp` | R ▲ |
| `ButtonRDown` | R ▼ |

Do **not** catalog `ButtonL3` / `ButtonR3` as primary. Those are IQ 2nd-gen stick clicks. If a mixed SDK still has the symbols, `doc` starts with `IQ 2nd-gen only.`

### Axes (`controller::axis`)

Official IQ1 Axis page objects:

| Object | Stick |
|--------|-------|
| `AxisA` | Left joystick up/down |
| `AxisB` | Left joystick left/right |
| `AxisC` | Right joystick left/right |
| `AxisD` | Right joystick up/down |

Playbook and snippets emit **`AxisA`–`AxisD`**. If headers also declare `Axis1`–`Axis4`, catalog them as aliases in `cppNames` (or separate properties) with `doc` mapping to A–D. Do not prefer 1–4 in recipes.

Members:

| Name | Signature | Return |
|------|-----------|--------|
| `position` | `int32_t position(percentUnits units = percentUnits::pct) const` | −100…100 |
| `changed` | `void changed(void (*callback)(void)) const` | `void` |

SDK-only `value()` (−127…127): `cppNames` optional, not official Axis page primary.

## Architecture

Same.

## Code to do

Spec 13 + 17.

## Testing

Ids: `controller.constructor.controller`, `controller.button.method.pressing`, `controller.axis.method.position`, `vex.function.vexcodeInit`. Completions must include `AxisA`. Do not require `ButtonL3`.

## Acceptance

- Stick loops use `wait(20, msec)` in the agent recipe.
- `RemoteControlCodeEnabled = false` documented for custom drive code.
- Official axis names in recipes are `AxisA`–`AxisD`.

## Verification unlocked

Spec 16 snippet may insert controller poll; spec 18 stays motor tracer.

## Impact

**Edge cases**

- Completing both `Axis1` and `AxisA` (if both exist) may confuse students. Hover `doc` on aliases must point at A–D.
- Deadzone: official examples use `> 10` / `< -10`.

**Mitigations**

- Agent recipe includes deadzone and AxisA.

## Agent chapter

```markdown
## Controller

Official: https://api.vex.com/iq1/home/cpp/Controller/index.html , https://api.vex.com/iq1/home/cpp/Controller/Controller.Axis.html , https://api.vex.com/iq1/home/cpp/Controller/Controller.Button.html

### When an agent should use this

Use `controller` to read the IQ (1st gen) remote. If VEXcode Devices-menu bindings fight user drive code, set `RemoteControlCodeEnabled = false`. Do not use V5 `controller(primary)` — IQ has a single `controller()` constructor. Do not emit `ButtonL3` / `ButtonR3`.

### Types and constructors

```cpp
controller Controller = controller();
```

Buttons: `ButtonEUp`, `ButtonEDown`, `ButtonFUp`, `ButtonFDown`, `ButtonLUp`, `ButtonLDown`, `ButtonRUp`, `ButtonRDown`.

Axes (official IQ1): `AxisA` left Y, `AxisB` left X, `AxisC` right X, `AxisD` right Y. Emit these names. `Axis1`–`Axis4` only if the project already uses them.

### Members

Each button: `pressing()`, `pressed(callback)`, `released(callback)`.  
Each axis: `position()` −100 to 100, `changed(callback)`.  
Globals: `vexcodeInit()`, `RemoteControlCodeEnabled`.

### Agent recipe

```cpp
#include "vex.h"

using namespace vex;

int main() {
  // Initializing Robot Configuration. DO NOT REMOVE!
  vexcodeInit();

  RemoteControlCodeEnabled = false;
  controller Controller = controller();

  while (true) {
    if (Controller.ButtonLUp.pressing()) {
      // user action
    }
    int ax = Controller.AxisA.position();
    if (ax > 10) {
      // forward
    } else if (ax < -10) {
      // reverse
    }
    wait(20, msec);
  }
}
```

Register callbacks in `main` after `vexcodeInit()`:

```cpp
Controller.ButtonEDown.pressed(onPress);
Controller.AxisB.changed(onStick);
```

### Pitfalls

- Polling loops need `wait(20, msec)` or the Brain starves.
- `pressing` is held state; `pressed` is an edge callback.
- Do not emit IQ2 stick-click `ButtonL3` / `ButtonR3`.
- Do not emit V5 partner controllers.
- Missing `vexcodeInit()`.
```
