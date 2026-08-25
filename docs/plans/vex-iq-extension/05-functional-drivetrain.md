# Drivetrain

**Tipo:** Functional  
**Depende de:** [`03-functional-catalog-contract.md`](03-functional-catalog-contract.md), [`04-functional-motion.md`](04-functional-motion.md), [`11-functional-agent-document.md`](11-functional-agent-document.md)  
**Implementa:** Catalog + Agent chapter for `drivetrain` and `smartdrive`.  
**No incluye:** Motor internals (spec 04), gyro device APIs except as `smartdrive` constructor arguments (spec 06). Brain IMU (`inertial`) is out of IQ1 v1.

## Resultado

Complete IQ1 drivetrain inventory. Heading/rotation APIs are **smartdrive only**.

Official: https://api.vex.com/iq1/home/cpp/Drivetrain.html  
Smartdrive: https://api.vex.com/iq1/home/cpp/Smartdrive.html

## Requirements

Example object: `Drivetrain`. Default unspecified drive/turn velocity: **50%**. Official constructor dimension defaults in docs: wheelTravel **300 mm**, trackWidth **320 mm**, wheelBase **320 mm** (SDK 3.0.4.1 defaults 200/200/50 — catalog `doc` states both; signatures use SDK defaults as optional parameters, playbook examples use measured robot numbers).

Motors or motor groups must be constructed first.

### Class `drivetrain`

#### Constructors

| Signature | Parameters |
|-----------|------------|
| `drivetrain(motor& l, motor& r, double wheelTravel = 200, double trackWidth = 200, double wheelBase = 50, distanceUnits unit = distanceUnits::mm, double externalGearRatio = 1.0)` | Left/right motors; wheel circumference; track; wheelbase; unit for those three; extra gear compensation. |
| `drivetrain(motor_group& l, motor_group& r, double wheelTravel = 200, double trackWidth = 200, double wheelBase = 50, distanceUnits unit = distanceUnits::mm, double externalGearRatio = 1.0)` | Four-motor (grouped) form. |

#### Actions

| Name | Signatures | Return | Notes |
|------|------------|--------|-------|
| `drive` | `void drive(directionType dir)` | `void` | Indefinite. |
| `drive` | `void drive(directionType dir, double velocity, velocityUnits units)` | `void` | |
| `driveFor` | `bool driveFor(directionType dir, double distance, distanceUnits units, bool waitForCompletion = true)` | `bool` | `mm`, `inches`, `cm`. |
| `driveFor` | `bool driveFor(directionType dir, double distance, distanceUnits units, double velocity, velocityUnits units_v, bool waitForCompletion = true)` | `bool` | |
| `driveFor` | `bool driveFor(double distance, distanceUnits units, bool waitForCompletion = true)` | `bool` | Signed distance. |
| `driveFor` | `bool driveFor(double distance, distanceUnits units, double velocity, velocityUnits units_v, bool waitForCompletion = true)` | `bool` | |
| `turn` | `void turn(turnType dir)` | `void` | `left` / `right`. Indefinite. |
| `turn` | `void turn(turnType dir, double velocity, velocityUnits units)` | `void` | |
| `turnFor` | `virtual bool turnFor(turnType dir, double angle, rotationUnits units, bool waitForCompletion = true)` | `bool` | `smartdrive` overrides. |
| `turnFor` | `virtual bool turnFor(turnType dir, double angle, rotationUnits units, double velocity, velocityUnits units_v, bool waitForCompletion = true)` | `bool` | |
| `turnFor` | `virtual bool turnFor(double angle, rotationUnits units, bool waitForCompletion = true)` | `bool` | Signed angle. |
| `turnFor` | `virtual bool turnFor(double angle, rotationUnits units, double velocity, velocityUnits units_v, bool waitForCompletion = true)` | `bool` | |
| `stop` | `void stop()` | `void` | |
| `stop` | `void stop(brakeType mode)` | `void` | |

`calibrateDrivetrain` is **VEXcode-generated**, not a portable class member. Do **not** put it in the catalog. Agent chapter may mention it only as “VEXcode-only; do not call from this overlay’s recipes.”

SDK-only `arcade(...)`: omit unless official IQ1 page lists it (it does not).

#### Mutators

| Name | Signature | Notes |
|------|-----------|-------|
| `setDriveVelocity` | `void setDriveVelocity(double velocity, velocityUnits units)` | |
| `setTurnVelocity` | `void setTurnVelocity(double velocity, velocityUnits units)` | |
| `setStopping` | `void setStopping(brakeType mode)` | |
| `setTimeout` | `void setTimeout(int32_t time, timeUnits units)` | |
| `setGearRatio` | SDK: `void setGearRatio(double ratio)`. Official IQ1 may also name cartridge enums. Catalog primary: numeric `double` if that is the symbol; add `gearSetting` overload only if headers declare it. |

#### Getters

| Name | Signature | Notes |
|------|-----------|-------|
| `isDone` | `bool isDone()` | |
| `isMoving` | `virtual bool isMoving()` | |
| `velocity` | `double velocity(velocityUnits units)` | Average. |
| `current` | `double current(currentUnits units = amp)` and percent overload | Total current. |
| `power` | `double power(powerUnits units = watt)` | Official treats several of these as more accurate on smart drivetrain. |
| `torque` | `double torque(torqueUnits units = Nm)` | |
| `efficiency` | `double efficiency(percentUnits units = percent)` | |
| `temperature` | `double temperature(percentUnits units)` | Official: percent only. |

`heading` / `rotation` / `turnToHeading` / `turnToRotation` are **not** on base `drivetrain`.

### Class `smartdrive`

`public drivetrain`. Official IQ1 Smartdrive.html constructs with a **Gyro** (`gyro Gyro = gyro(PORT3);` then `smartdrive(..., Gyro, ...)`). Prose may mention “Inertial Sensor or Gyro”; **do not** catalog `inertial&` constructors for IQ1. SDK 3.0.4.1 types `gyro&`. If a mixed SDK also has `inertial&`, mark it `IQ 2nd-gen only.` and omit from the Agent chapter.

#### Constructors

| Signature | Parameters |
|-----------|------------|
| `smartdrive(motor& l, motor& r, gyro& g, double wheelTravel = 200, double trackWidth = 200, double wheelBase = 50, distanceUnits unit = distanceUnits::mm, double externalGearRatio = 1.0)` | |
| `smartdrive(motor_group& l, motor_group& r, gyro& g, ...)` | same trailing params |

Do not add inertial overloads for IQ1.

Inherits all `drivetrain` members.

#### smartdrive-only actions

| Name | Signatures | Return |
|------|------------|--------|
| `turnToHeading` | `bool turnToHeading(double angle, rotationUnits units, bool waitForCompletion = true)` | `bool` |
| `turnToHeading` | `bool turnToHeading(double angle, rotationUnits units, double velocity, velocityUnits units_v, bool waitForCompletion = true)` | `bool` |
| `turnToRotation` | `bool turnToRotation(double angle, rotationUnits units, bool waitForCompletion = true)` | `bool` |
| `turnToRotation` | `bool turnToRotation(double angle, rotationUnits units, double velocity, velocityUnits units_v, bool waitForCompletion = true)` | `bool` |

SDK `isTurning()`: include if present; official page may not list it separately.

#### smartdrive-only mutators

| Name | Signature |
|------|-----------|
| `setHeading` | `void setHeading(double value, rotationUnits units)` |
| `setRotation` | `void setRotation(double value, rotationUnits units)` |
| `setTurnThreshold` | `void setTurnThreshold(double t)` — degrees, default **1**. |
| `setTurnConstant` | `void setTurnConstant(double kp)` — 0.1–4.0, default **1.0**. |
| `setTurnDirectionReverse` | `smartdrive& setTurnDirectionReverse(bool value)` (SDK return). |

#### smartdrive-only getters

| Name | Signature |
|------|-----------|
| `heading` | `double heading(rotationUnits units = rotationUnits::deg)` wrapped heading |
| `rotation` | `double rotation(rotationUnits units = rotationUnits::deg)` unbounded |

## Architecture

Same as spec 04.

## Code to do

Spec 13 entries for every member above. Spec 17 concatenates the Agent chapter.

## Testing

Required ids: `drivetrain.method.drive`, `drivetrain.method.driveFor`, `smartdrive.method.turnToHeading`, `smartdrive.method.heading`.

## Acceptance

- Base drivetrain cannot complete `turnToHeading`.
- `calibrateDrivetrain` is not in the catalog.
- Agent recipes construct motors first, then drivetrain.

## Verification unlocked

Spec 18 may use drivetrain snippets; tracer remains motor.

## Impact

**Edge cases**

- Wrong wheelTravel/trackWidth makes `driveFor` distances wrong.
- `turnToHeading` without a gyro: smartdrive required.

**Mitigations**

- Playbook pitfalls call out dimension units (`mm` vs `inches`).

## Agent chapter

```markdown
## Drivetrain

Official: https://api.vex.com/iq1/home/cpp/Drivetrain.html and https://api.vex.com/iq1/home/cpp/Smartdrive.html

### When an agent should use this

Use `drivetrain` for a two-side chassis (two motors or two `motor_group`s). Use `smartdrive` when a **Gyro** should make heading-accurate turns (`turnToHeading`, `turnToRotation`, `heading`, `rotation`). Do not call `turnToHeading` on a plain `drivetrain`. Do not emit Brain `inertial()` — IQ1 heading uses a port gyro. Do not use `calibrateDrivetrain()` outside VEXcode — it is generated-only.

### Types and constructors

Construct motors (or groups) first.

Two-motor drivetrain:

```cpp
motor leftMotor = motor(PORT1, false);
motor rightMotor = motor(PORT2, true);
drivetrain Drivetrain = drivetrain(leftMotor, rightMotor, 259.34, 320, 40, mm, 1);
```

Parameter order: left, right, wheelTravel, trackWidth, wheelBase, unit, externalGearRatio.

Smart drive (official gyro example):

```cpp
gyro Gyro = gyro(PORT3);
smartdrive Drivetrain = smartdrive(leftMotor, rightMotor, Gyro, 259.34, 320, 40, mm, 1);
```

Do not invent `inertial` overloads. If the SDK constructor only accepts `gyro&`, that is the IQ1 API.

### Members

**drivetrain actions:** `drive`, `driveFor`, `turn`, `turnFor`, `stop`.  
**drivetrain mutators:** `setDriveVelocity`, `setTurnVelocity`, `setStopping`, `setTimeout`, `setGearRatio`.  
**drivetrain getters:** `isDone`, `isMoving`, `velocity`, `current`, `power`, `torque`, `efficiency`, `temperature`.

**smartdrive extra:** `turnToHeading`, `turnToRotation`, `setHeading`, `setRotation`, `setTurnThreshold` (default 1°), `setTurnConstant` (default 1.0, range 0.1–4.0), `setTurnDirectionReverse`, `heading`, `rotation`. Inherits drivetrain members.

### Agent recipe

```cpp
#include "vex.h"

using namespace vex;

int main() {
  // Initializing Robot Configuration. DO NOT REMOVE!
  vexcodeInit();

  motor leftMotor = motor(PORT1, false);
  motor rightMotor = motor(PORT2, true);
  drivetrain Drivetrain = drivetrain(leftMotor, rightMotor, 259.34, 320, 40, mm, 1);

  Drivetrain.driveFor(forward, 200, mm);
  Drivetrain.turnFor(right, 90, degrees);
  Drivetrain.stop();
}
```

Heading turn (smartdrive):

```cpp
Drivetrain.turnToHeading(90, degrees);
```

### Pitfalls

- Measure wheelTravel/trackWidth/wheelBase; do not copy 259.34 blindly.
- `drive` / `turn` without `For` run forever until `stop`.
- `turnToHeading` needs a gyro via `smartdrive`.
- Keep the robot still if you calibrate the gyro (Sensing chapter).
- Missing `vexcodeInit()`.
```
