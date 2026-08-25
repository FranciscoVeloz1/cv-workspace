# Motion

**Tipo:** Functional  
**Depende de:** [`03-functional-catalog-contract.md`](03-functional-catalog-contract.md), [`11-functional-agent-document.md`](11-functional-agent-document.md)  
**Implementa:** Catalog entries and `AGENTS.md` Motion chapter for `motor`, `motor_group`, and `pneumatic`. Files: spec 13 (JSON) and spec 17 (playbook).  
**No incluye:** Drivetrain (spec 05), grammar, providers.

## Resultado

Complete IQ1 C++ Motion inventory: every official constructor and member, with SDK aliases noted. Agent chapter is paste-ready for `AGENTS.md`.

Official index: https://api.vex.com/iq1/home/cpp/index.html  
Motor: https://api.vex.com/iq1/home/cpp/Motor.html  
Motor group: https://api.vex.com/iq1/home/cpp/MotorGroup.html  
Pneumatic: https://api.vex.com/iq1/home/cpp/Pneumatic.html

## Requirements

Default example names: `Motor1`, `MotorGroup1`, `Pneumatic1`. Default motor velocity and max torque in official docs: **50%**.

### Class `motor`

Inherits `device`. Catalog `container`: `motor`.

#### Constructors (IQ1 official — primary)

Official Motor.html: `gears` defaults to **1.0**. The page describes `gears` as a gear ratio and/or `gearSetting`. Catalog every constructor the harvest SDK actually declares.

| Signature | Parameters |
|-----------|------------|
| `motor(int32_t index)` | `index`: `PORTx`. |
| `motor(int32_t index, bool reverse)` | `reverse`: `true` reverses command direction. |
| `motor(int32_t index, double gears)` | Numeric gear ratio. Official default **1.0**. |
| `motor(int32_t index, double gears, bool reverse)` | Combined. |
| `motor(int32_t index, gearSetting gears)` | Include **only if** headers declare `gearSetting` (`ratio1_1`, `ratio2_1`, `ratio3_1`). |
| `motor(int32_t index, gearSetting gears, bool reverse)` | Same rule. |

Destructor `~motor()` exists in SDK; do not complete it as a user API.

Playbook / snippets prefer `motor(PORT1)`, `motor(PORT1, true)`, and numeric `motor(PORT1, 1.0)` unless the open project already uses `gearSetting`.

#### Actions

| Name | Signatures | Return | Notes |
|------|------------|--------|-------|
| `spin` | `void spin(directionType dir)` | `void` | Forever until another action. Uses configured velocity. |
| `spin` | `void spin(directionType dir, double velocity, velocityUnits units)` | `void` | `percent`/`pct`, `rpm`, `dps`. |
| `spin` | `void spin(directionType dir, double voltage, voltageUnits units)` | `void` | `volt` or `mV`. Negative voltage spins opposite `dir`. |
| `spinFor` | `bool spinFor(double rotation, rotationUnits units, double velocity, velocityUnits units_v, bool waitForCompletion = true)` | `bool` | Relative. Units `deg`/`degrees`, `turns`/`rev`. |
| `spinFor` | `bool spinFor(directionType dir, double rotation, rotationUnits units, double velocity, velocityUnits units_v, bool waitForCompletion = true)` | `bool` | |
| `spinFor` | `bool spinFor(double rotation, rotationUnits units, bool waitForCompletion = true)` | `bool` | Configured velocity. |
| `spinFor` | `bool spinFor(directionType dir, double rotation, rotationUnits units, bool waitForCompletion = true)` | `bool` | |
| `spinFor` | `bool spinFor(double time, timeUnits units, double velocity, velocityUnits units_v)` | `bool` (official) | Timed. `seconds`/`sec`, `msec`. |
| `spinFor` | `bool spinFor(directionType dir, double time, timeUnits units, double velocity, velocityUnits units_v)` | `bool` | |
| `spinFor` | `bool spinFor(double time, timeUnits units)` | `bool` | |
| `spinFor` | `bool spinFor(directionType dir, double time, timeUnits units)` | `bool` | |
| `spinToPosition` | `bool spinToPosition(double rotation, rotationUnits units, double velocity, velocityUnits units_v, bool waitForCompletion = true)` | `bool` | Absolute encoder target. SDK alias `spinTo` → `cppNames` only. |
| `spinToPosition` | `bool spinToPosition(double rotation, rotationUnits units, bool waitForCompletion = true)` | `bool` | |
| `stop` | `void stop()` | `void` | Uses `setStopping` mode. |
| `stop` | `void stop(brakeType mode)` | `void` | `coast`, `brake`, `hold`. |

#### Mutators

| Name | Signature | Notes |
|------|-----------|-------|
| `setVelocity` | `void setVelocity(double velocity, velocityUnits units)` | Does not spin. Default 50%. |
| `setMaxTorque` | `void setMaxTorque(double value, percentUnits units)` | Default 50%. |
| `setMaxTorque` | `void setMaxTorque(double value, torqueUnits units)` | `Nm`, `InLb`. |
| `setMaxTorque` | `void setMaxTorque(double value, currentUnits units)` | `amp`. |
| `setPosition` | `void setPosition(double value, rotationUnits units)` | Sets encoder reference; does not move. |
| `setStopping` | `void setStopping(brakeType mode)` | SDK legacy alias `setBrake` → `cppNames` only. |
| `setTimeout` | `void setTimeout(int32_t time, timeUnits units)` | Positive integer time for target moves. |

Official IQ1 Motor.html also lists **`setReversed`** and **`resetPosition`** as primary members (not 2nd-gen footnotes):

| Name | Signature | Notes |
|------|-----------|-------|
| `setReversed` | `void setReversed(bool value)` | Same result as constructing with `reverse == true`. |
| `resetPosition` | `void resetPosition()` | Sets encoder to 0. Distinct from `setPosition(value, units)`. |

#### Getters

| Name | Signature | Return | Notes |
|------|-----------|--------|-------|
| `isDone` | `bool isDone()` | `bool` | Target moves (`spinFor` / `spinToPosition`). |
| `isSpinning` | `bool isSpinning()` | `bool` | |
| `position` | `double position(rotationUnits units)` | `double` | |
| `velocity` | `double velocity(velocityUnits units)` | `double` | Sign follows direction. |
| `current` | `double current(currentUnits units = amp)` | `double` | Official range ~0.0–1.2 A. |
| `current` | `double current(percentUnits units)` | `double` | |
| `power` | `double power(powerUnits units = watt)` | `double` | IQ1 official documents this. |
| `torque` | `double torque(torqueUnits units = Nm)` | `double` | |
| `efficiency` | `double efficiency(percentUnits units = percent)` | `double` | 0–100. |
| `temperature` | `double temperature(percentUnits units = percent)` | `double` | Stay below 55°C; ~70°C motor stops. |
| `temperature` | `double temperature(temperatureUnits units)` | `double` | `celsius`, `fahrenheit`. |
| `voltage` | `double voltage(voltageUnits units = volt)` | `double` | |
| `direction` | `directionType direction()` | `directionType` | |
| `installed` | `bool installed()` | `bool` | Connected to IQ 1st gen Brain. |

No callbacks on official IQ1 Motor page.

### Class `motor_group`

Does not inherit `device`. Max **4** motors. Sensing generally uses the **first** motor except `current` (sum) and `count`.

#### Constructors

```cpp
motor_group(motor &m1, Args&... m2);
```

Motors must already exist. Official destructor exists; do not complete.

#### Members

Same official action/mutator/getter **names** as `motor`: `spin`, `spinFor` (eight overloads), `spinToPosition`, `stop`, `setVelocity`, `setMaxTorque`, `setPosition`, `setReversed`, `resetPosition`, `setStopping`, `setTimeout`, `isDone`, `isSpinning`, `position`, `velocity`, `current`, `power`, `torque`, `efficiency`, `temperature`, `voltage`, `direction`. Include `setReversed` / `resetPosition` on the group only if MotorGroup.html / headers declare them.

Additional:

| Name | Signature | Return | Notes |
|------|-----------|--------|-------|
| `count` | `int32_t count()` | `int32_t` | Motors in the group. Official. |

`installed` is listed on the shared official Motor/Motor Group page for groups. Include it. If a given SDK build lacks `motor_group::installed`, omit per winner rule (no symbol).

Time-based `spinFor` is `void` on some SDK `motor_group` overloads and `bool` on official IQ1. Catalog `signatures` use official `bool`; `doc` notes SDK may return `void`.

### Class `pneumatic`

Inherits `device`. Official: https://api.vex.com/iq1/home/cpp/Pneumatic.html

#### Constructors

| Signature | Parameters |
|-----------|------------|
| `pneumatic(int32_t index, bool bPumpEnable = true)` | `PORTx`; `bPumpEnable` true = pump on at start. |

#### Actions

| Name | Signature | Notes |
|------|-----------|-------|
| `extend` | `void extend(cylinderType id)` | `cylinder1`, `cylinder2`, `cylinderAll` (official table also writes `cylinderALL`). |
| `retract` | `void retract(cylinderType id)` | |
| `pumpOn` | `void pumpOn()` | |
| `pumpOff` | `void pumpOff()` | |
| `pump` | `void pump(bool state)` | `true` on, `false` off. |

#### Getters

| Name | Signature | Return |
|------|-----------|--------|
| `installed` | `bool installed()` | `bool` |

No official callbacks.

### Enums used here (catalog as `enum` / `enumMember` / `constant`)

Must exist in catalog (full enumerator lists also in spec 10): `directionType` (`fwd`/`forward`, `rev`/`reverse`), `brakeType` (`coast`, `brake`, `hold`), `velocityUnits`, `rotationUnits`, `timeUnits`, `percentUnits`, `voltageUnits`, `currentUnits`, `powerUnits`, `torqueUnits`, `temperatureUnits`, `cylinderType`. Catalog `gearSetting` (`ratio1_1`, `ratio2_1`, `ratio3_1`) **only if** the harvest SDK / official Motor.html actually names those enumerators.

## Architecture

Inventory only. JSON entries in spec 13; playbook chapter below in spec 17.

## Code to do

Spec 13: one `CatalogEntry` per class, constructor group, method, and enum member listed above.  
Spec 17: concatenate `## Agent chapter` unchanged.

## Testing

Spec 13 must include ids `motor.method.spin`, `motor.method.spinFor`, `motor.method.spinToPosition`, `motor.method.setReversed`, `motor.method.resetPosition`, `motor_group.method.count`, `pneumatic.method.pumpOn`.  
Spec 17 grep: `spinFor`, `pumpOn`, `motor_group`, `setReversed`.

## Acceptance

- Every official Motor and Pneumatic member named above is in the catalog.
- `spinTo` is not a primary `name`.
- Agent chapter follows spec 11 template and includes one recipe per class.

## Verification unlocked

Tracer in spec 18 uses `motor` + `spin`.

## Impact

**Edge cases**

- `waitForCompletion == false` makes official `spinFor`/`spinToPosition` return `false` even if the move started.
- Group `current` is a **sum**; other getters are first motor.

**Side effects**

- Completing `spinTo` as alias is OK; teaching it as the IQ1 name is not.

**Mitigations**

- Hover `doc` on `spinToPosition` mentions SDK alias `spinTo`.

## Agent chapter

```markdown
## Motion

Official: https://api.vex.com/iq1/home/cpp/Motor.html (motors), https://api.vex.com/iq1/home/cpp/MotorGroup.html (groups), and https://api.vex.com/iq1/home/cpp/Pneumatic.html (pneumatics). Index: https://api.vex.com/iq1/home/cpp/index.html

### When an agent should use this

Use `motor` for one IQ Smart Motor (arm, claw, single wheel). Use `motor_group` when up to four motors must spin together. Use `pneumatic` for the IQ pneumatics kit (pump + cylinders). Do not use these classes to drive a whole chassis as a unit — that is `drivetrain` / `smartdrive` (Drivetrain chapter). Always construct devices in VS Code; there is no Device Menu here.

### Types and constructors

`motor Motor1 = motor(PORT1);`  
`motor Motor1 = motor(PORT1, true);`  
`motor Motor1 = motor(PORT1, 1.0);`  
`motor Motor1 = motor(PORT1, 1.0, true);`  
Numeric `gears` default is **1.0**. Use `ratio1_1` / `ratio2_1` / `ratio3_1` only if those `gearSetting` names exist in the project headers.

`motor_group DriveMotors = motor_group(LeftMotor, RightMotor);` — pass existing `motor` objects, maximum four.

`pneumatic Pneumatic1 = pneumatic(PORT3);`  
`pneumatic Pneumatic1 = pneumatic(PORT4, true);` — second argument enables the pump at start (SDK default true).

### Members

**motor / motor_group actions:** `spin(dir)`, `spin(dir, velocity, units)`, `spin(dir, voltage, voltUnits)`, `spinFor` (rotation or time overloads, optional `waitForCompletion`), `spinToPosition` (absolute; SDK alias `spinTo` — do not prefer it), `stop()`, `stop(brakeType)`.

**motor / motor_group mutators:** `setVelocity`, `setMaxTorque` (percent, torque, or current units), `setPosition`, `setReversed`, `resetPosition`, `setStopping` (`coast`/`brake`/`hold`), `setTimeout`.

**motor / motor_group getters:** `isDone`, `isSpinning`, `position`, `velocity`, `current`, `power`, `torque`, `efficiency`, `temperature`, `voltage`, `direction`, `installed`. Group extra: `count()`. Group `current` sums motors; other sensors use the first motor.

**pneumatic:** `extend(cylinderType)`, `retract(cylinderType)`, `pumpOn()`, `pumpOff()`, `pump(bool)`, `installed()`. Cylinder ids: `cylinder1`, `cylinder2`, `cylinderAll`.

### Agent recipe

```cpp
#include "vex.h"

using namespace vex;

int main() {
  // Initializing Robot Configuration. DO NOT REMOVE!
  vexcodeInit();

  motor Motor1 = motor(PORT1);
  Motor1.spin(forward);
  wait(1, seconds);
  Motor1.stop();
}
```

Motor group:

```cpp
motor LeftMotor = motor(PORT1);
motor RightMotor = motor(PORT2, true);
motor_group DriveMotors = motor_group(LeftMotor, RightMotor);
DriveMotors.spin(forward);
wait(1, seconds);
DriveMotors.stop();
```

Pneumatic:

```cpp
pneumatic Pneumatic1 = pneumatic(PORT3);
Pneumatic1.pumpOn();
Pneumatic1.extend(cylinder1);
wait(1, seconds);
Pneumatic1.retract(cylinder1);
```

### Pitfalls

- `spin` never finishes by itself — follow with `stop` or another command.
- `spinFor` / `spinToPosition` wait by default; pass `false` only if the next lines must run during the move, then poll `isDone`.
- Do not emit `spinTo` as the primary name; use `spinToPosition`.
- Do not emit Python names (`pump_on`). Use `pumpOn` / `pumpOff`.
- Prefer numeric `motor(PORT1, 1.0)` (or `motor(PORT1)`) unless the project already uses `gearSetting`.
- `setReversed(true)` matches constructing with `reverse == true`. `resetPosition()` zeros the encoder.
- Missing `vexcodeInit()` breaks VEXcode-generated configuration.
```
