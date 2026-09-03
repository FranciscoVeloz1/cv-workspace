# VEXcode IQ (1st gen) C++ — agent playbook

## Table of contents

- [How to use this file](#how-to-use-this-file)
- [Hard constraints](#hard-constraints)
- [Project skeleton](#project-skeleton)
- [C++ language reminder (VEXcode)](#c-language-reminder-vexcode)
- [Motion](#motion)
- [Drivetrain](#drivetrain)
- [Sensing](#sensing)
- [Brain screen, sound, console](#brain-screen-sound-console)
- [Controller](#controller)
- [Vision](#vision)
- [Logic, units, ports, globals](#logic-units-ports-globals)

## How to use this file

Read the matching topic chapter before emitting code for that device. Keep `wait` inside loops that poll sensors or controllers. Name objects like official examples (`Motor1`, `Brain`, `Controller`) unless the user named devices.

## Hard constraints

- IQ1 C++ only.
- This repo's extension does not compile or download.
- No V5, Python, or Blocks APIs.
- Do not invent APIs.
- Prefer this file + `catalog/iq1-cpp.json` over guessing.
- Do not emit `inertial` or `aivision` as primary IQ1 APIs.

## Project skeleton

```cpp
#include "vex.h"

using namespace vex;

int main() {
  // Initializing Robot Configuration. DO NOT REMOVE!
  vexcodeInit();

  // agent code here
}
```

Official samples also use `iq_cpp.h` in some SDK trees; agents should match the project's existing include. If the file is empty, use `vex.h`.

In VS Code / Cursor, agents **must write constructors**. VEXcode Device Menu generation is not available here.

Always braces on `if` / `for` / `while` in generated C++.

## C++ language reminder (VEXcode)

VEXcode-specific helpers only — not a C++ course.

- Comments: `//` and `/* */`
- `if` / `else` / `while` / `for` / `break` as ordinary C++
- `wait(time, units)` with `msec` and `seconds`
- `Brain.programStop()` ends a project (`vexSystemExitRequest` is the low-level alias)



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

## Sensing

Official: https://api.vex.com/iq1/home/cpp/index.html — Bumper https://api.vex.com/iq1/home/cpp/Bumper.html , Gyro https://api.vex.com/iq1/home/cpp/Gyro.html , Sonar https://api.vex.com/iq1/home/cpp/Sonar.html , Distance https://api.vex.com/iq1/home/cpp/Distance.html , Optical https://api.vex.com/iq1/home/cpp/Optical.html , TouchLED https://api.vex.com/iq1/home/cpp/TouchLED.html , Colorsensor https://api.vex.com/iq1/home/cpp/Colorsensor.html , Brain buttons https://api.vex.com/iq1/home/cpp/Brain/Brain.Button.html , Battery https://api.vex.com/iq1/home/cpp/Brain/Brain.Battery.html

### When an agent should use this

Use these types for IQ1 sensors and the Brain’s buttons/battery. Screen, speaker, and console are the next chapter. For chassis heading while driving, prefer `smartdrive` plus a **gyro** (Drivetrain chapter). Do not emit Brain `inertial()`.

### Types and constructors

```cpp
brain Brain = brain();
bumper BumperA = bumper();          // official IQ1 example; add PORTx if headers require it
touchled TouchLED1 = touchled(PORT2);
colorsensor Color1 = colorsensor(PORT3);
optical Optical1 = optical(PORT4);
gyro Gyro = gyro(PORT5);
sonar Sonar = sonar(PORT6);         // Range Finder
distance Distance1 = distance(PORT7); // Distance Sensor only
```

### Members

**Brain buttons** (`Brain.buttonCheck` / `buttonUp` / `buttonDown`): `pressed(callback)`, `released(callback)`, `pressing()`.  
**Brain.Battery:** `capacity()`, `voltage()`, `current()` when present.

**bumper:** `pressed`, `released`, `pressing`, `installed` (if listed).  
**touchled:** `on` / `off`, `setColor`, `setFade`, `setBrightness`, `setBlink`, `pressing`, `pressed`, `released`, `installed`.  
**colorsensor:** `setLight`, `isNearObject`, `detects`, `colorname`, `colorname3`, `brightness`, `hue`, `installed` (and `color` if present).  
**optical:** `objectDetected`, `objectLost`, `setLight`, `setLightPower`, `objectDetectThreshold`, `isNearObject`, `color`/`colorname`, `brightness`, `hue`, `installed`.  
**gyro:** `calibrate`, `changed`, `setHeading`, `setRotation`, `resetHeading`, `resetRotation`, `heading`, `rotation`, `rate`, `isCalibrating`, `installed`.  
**sonar (Range Finder):** `foundObject()`, `distance(units)`, `setMaximum(distance, units)`, `objectDetected(callback)`, `installed()`.  
**distance (Distance Sensor):** `objectDistance(units)`, `objectVelocity()`, `objectSize()`, `isObjectDetected()`, `changed(callback)`, `installed()`.

### Agent recipe

```cpp
#include "vex.h"

using namespace vex;

int main() {
  // Initializing Robot Configuration. DO NOT REMOVE!
  vexcodeInit();

  bumper BumperA = bumper();
  sonar Sonar = sonar(PORT1);

  while (true) {
    if (BumperA.pressing()) {
      Brain.Screen.print("bump");
    }
    if (Sonar.foundObject()) {
      double rangeMm = Sonar.distance(mm);
    }
    wait(20, msec);
  }
}
```

Gyro calibrate (stay still):

```cpp
gyro Gyro = gyro(PORT3);
Gyro.calibrate();
while (Gyro.isCalibrating()) {
  wait(50, msec);
}
```

Distance Sensor (only if that device is installed):

```cpp
distance Distance1 = distance(PORT2);
if (Distance1.isObjectDetected()) {
  double rangeMm = Distance1.objectDistance(mm);
}
```

### Pitfalls

- Range Finder is `sonar` + `foundObject` / `distance()`. Distance Sensor is `distance` + `objectDistance` / `isObjectDetected`. Do not mix the two.
- Brain buttons on IQ1 are Check / Up / Down, not Left / Right.
- Poll loops need `wait` (typically `wait(20, msec)`).
- `calibrate` on gyro: Brain/robot must not move.
- `colorsensor` and `optical` are different types.
- Register `pressed` callbacks after `vexcodeInit()`, usually in `main`.

## Brain screen, sound, console

Official: https://api.vex.com/iq1/home/cpp/Brain/Brain.Screen.html and https://api.vex.com/iq1/home/cpp/Brain/index.html (playSound, playNote, soundOff)

### When an agent should use this

Use `Brain.Screen` to print and draw on the IQ1 Brain LCD. Use `Brain.playSound` / `Brain.playNote` / `Brain.soundOff()` for the built-in speaker. Use `printf` for the VEXcode console (remember `\n`). Do not treat console `printf` as `Brain.Screen.print`. Do not emit `inertial` — IQ1 heading is a port gyro.

### Types and constructors

```cpp
brain Brain = brain();
```

Screen is `Brain.Screen`. Sound methods hang off `Brain`.

### Members

**Screen:** `print`, `printAt`, `setCursor`, `newLine`, `clearLine`, `clearScreen`, `row`, `column`, `setFont`, `setPenWidth`, `setPenColor`, `setFillColor`, `setOrigin`, `getStringWidth`, `getStringHeight`, `drawPixel`, `drawLine`, `drawRectangle`, `drawCircle`, plus `setClipRegion` / `render` if present. Default font `mono20`.

**Sound:** `playSound(soundType)`, `playNote(octave, note, durationMs = 500)`, `soundOff()`. Sounds: `alarm`, `alarm2`, `doorClose`, `fillup`, `headlightsOff`, `headlightsOn`, `powerDown`, `ratchet`, `ratchet2`, `siren`, `siren2`, `tada`, `tollBooth`, `wrench`, `wrongWay`, `wrongWaySlow`. Notes: octave 1–7, note 0=C … 6=B, duration max 500 ms.

**Console:** `printf(fmt, ...)`. Flush with `\n`. Clear with `printf("\033[2J\n")`. Prefer `Brain.Terminal.print` only if that is what the project already uses.

### Agent recipe

```cpp
#include "vex.h"

using namespace vex;

int main() {
  // Initializing Robot Configuration. DO NOT REMOVE!
  vexcodeInit();

  Brain.Screen.print("hello");
  Brain.Screen.newLine();
  Brain.playSound(siren);
  wait(500, msec);
  Brain.soundOff();
  printf("console line\n");
}
```

### Pitfalls

- `printf` without newline may not appear.
- After you call `render()`, you must call `render` again to show later draws.
- Do not emit `inertial()` for IQ1.
- `playNote` duration max is 500 ms.
- Missing `vexcodeInit()`.

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

## Vision

Official: https://api.vex.com/iq1/home/cpp/Vision.html

### When an agent should use this

Use `vision` for the IQ Vision Sensor (color signatures and color codes only). Do not emit `aivision` (AI Vision is not IQ 1st gen C++). Do not use V5 vision sample code (different resolution and object limits). Always call `takeSnapshot` before reading `objects` / `objectCount`.

### Types and constructors

```cpp
vision Vision1 = vision(PORT1);
// signatures are usually generated: Vision1__SIGNAME
```

### Members

**vision:** `takeSnapshot(id|signature|code [, count])` → `int32_t` count; `installed()`; `objectCount`; `largestObject`; `objects[i]` with `id`, `originX`, `originY`, `centerX`, `centerY`, `width`, `height`, `angle`, `exists`. IQ max objects **4**. Nested `vision::signature` and `vision::code` (2–5 signatures). Signature numbers come from Vision Utility.

### Agent recipe

```cpp
#include "vex.h"

using namespace vex;

int main() {
  // Initializing Robot Configuration. DO NOT REMOVE!
  vexcodeInit();

  vision Vision1 = vision(PORT1);

  while (true) {
    Vision1.takeSnapshot(Vision1__SIG);
    if (Vision1.objectCount > 0 && Vision1.objects[0].exists) {
      int cx = Vision1.objects[0].centerX;
    }
    wait(20, msec);
  }
}
```

Replace `Vision1__SIG` with the generated signature name from the project.

### Pitfalls

- Forgetting `takeSnapshot` yields empty/stale objects.
- IQ `objects` length is 4, not V5 counts.
- Do not write Python `take_snapshot` or `Ports.PORT1` in C++.
- Do not emit `aivision`.
- Signature tuples are utility-generated; do not guess uMin/uMax.
- Missing `vexcodeInit()`.

## Logic, units, ports, globals

Official: https://api.vex.com/iq1/home/cpp/index.html , Enums https://api.vex.com/iq1/home/cpp/Enums.html , Event https://api.vex.com/iq1/home/cpp/Event.html , Thread https://api.vex.com/iq1/home/cpp/Thread.html , Timer https://api.vex.com/iq1/home/cpp/Brain/Timer.html

### When an agent should use this

Use this chapter for `wait`, ports, unit names (`forward`, `degrees`, `percent`, `mm`), events, threads, and timers. Do not reimplement C++ `if`/`while` as VEX APIs. Use `Brain.programStop()` to end a project. Always `wait` inside `while (true)` sensor/controller loops.

### Types and constructors

```cpp
void wait(double time, timeUnits units);
event moveEvent = event(callback);
thread worker = thread(workerFn);
timer myTimer = timer();
// or Brain.Timer
```

Ports: `PORT1` through `PORT12` only (IQ).

### Members

**wait:** `wait(1, seconds);` `wait(20, msec);`  
**programStop:** `Brain.programStop();`  
**event:** construct with callback; `broadcast()` (does not wait); `broadcastAndWait(timeoutMs = 60000)`.  
**thread:** `thread(fn)` starts immediately; official IQ1 also documents `join`, `detach`, `interrupt`, `interruptAll` (harvest the page). Cannot restart an interrupted thread — construct a new `thread`.  
**timer:** `time(units)` (default msec), `clear()`, `reset()`, `system()`, `event(callback, delayMs)` as on Brain.Timer.html. Prefer `Brain.Timer.time(msec)` when units matter.

**Direction:** `forward` / `reverse` (also `fwd`).  
**Turns:** `left` / `right`.  
**Stopping:** `coast`, `brake`, `hold`.  
**Rotation:** `degrees`, `turns`.  
**Velocity:** `percent`, `rpm`, `dps`.  
**Time:** `seconds`, `msec`.  
**Distance:** `mm`, `inches`, `cm`.  
**Gear cartridges:** numeric motor `gears` (default 1.0). Complete `ratio1_1` / `ratio2_1` / `ratio3_1` only if those names exist in headers.

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
  Motor1.stop(brake);
  Brain.programStop();
}
```

Event:

```cpp
void onGo() {
  // work
}

int main() {
  vexcodeInit();
  event go = event(onGo);
  go.broadcast();
  wait(1, seconds);
}
```

### Pitfalls

- `while (true)` without `wait` can hang the Brain.
- Do not emit `PORT13` or V5 `PORT21`.
- Prefer `forward` in samples; `fwd` is the same `directionType`.
- `thread.interrupt()` is final for that object.
- `event.broadcast` does not wait; use `broadcastAndWait` when the next line needs the handlers to finish.
- Timer `value()` units conflict (ms vs seconds) — use `time(msec)` / `time(seconds)`.
- Missing `vexcodeInit()`.

### Catalog symbol names

`catalog/iq1-cpp.json` is the symbol list. Names: `AxisA`, `AxisB`, `AxisC`, `AxisD`, `Battery`, `ButtonEDown`, `ButtonEUp`, `ButtonFDown`, `ButtonFUp`, `ButtonLDown`, `ButtonLUp`, `ButtonRDown`, `ButtonRUp`, `InLb`, `Nm`, `PORT1`, `PORT10`, `PORT11`, `PORT12`, `PORT2`, `PORT3`, `PORT4`, `PORT5`, `PORT6`, `PORT7`, `PORT8`, `PORT9`, `RemoteControlCodeEnabled`, `Screen`, `Terminal`, `Timer`, `alarm`, `alarm2`, `amp`, `angle`, `black`, `blink`, `blue`, `blue_green`, `blue_violet`, `brain`, `brake`, `brakeType`, `brightness`, `broadcast`, `broadcastAndWait`, `bumper`, `buttonCheck`, `buttonDown`, `buttonUp`, `calExtended`, `calNormal`, `calSlow`, `calibrate`, `capacity`, `celsius`, `centerX`, `centerY`, `changed`, `clear`, `clearLine`, `clearScreen`, `cm`, `coast`, `code`, `colorType`, `colorname`, `colorname3`, `colorsensor`, `column`, `controller`, `count`, `counts`, `current`, `currentUnits`, `cyan`, `cylinder1`, `cylinder2`, `cylinderAll`, `cylinderType`, `deg`, `degrees`, `detach`, `detects`, `direction`, `directionType`, `distance`, `distanceUnits`, `doorClose`, `down`, `dps`, `drawCircle`, `drawLine`, `drawPixel`, `drawRectangle`, `drive`, `driveFor`, `drivetrain`, `efficiency`, `event`, `exists`, `extend`, `fadeType`, `fahrenheit`, `fast`, `fillup`, `forward`, `foundObject`, `fwd`, `gestureType`, `getCode`, `green`, `gyro`, `gyroCalibrationType`, `hardware_concurrency`, `heading`, `headlightsOff`, `headlightsOn`, `height`, `hold`, `hue`, `id`, `in`, `inches`, `installed`, `interrupt`, `isCalibrating`, `isDone`, `isFlipped`, `isMoving`, `isNearObject`, `isObjectDetected`, `isSpinning`, `isTurning`, `join`, `large`, `largestObject`, `ledState`, `left`, `mV`, `medium`, `mm`, `motor`, `motor_group`, `msec`, `newLine`, `none`, `object`, `objectCount`, `objectDetectThreshold`, `objectDetected`, `objectDistance`, `objectLost`, `objectRawSize`, `objectSize`, `objectVelocity`, `objects`, `off`, `on`, `optical`, `orange`, `originX`, `originY`, `pct`, `percent`, `percentUnits`, `playNote`, `playSound`, `pneumatic`, `position`, `power`, `powerDown`, `powerUnits`, `pressed`, `pressing`, `print`, `printAt`, `printf`, `programStop`, `pump`, `pumpOff`, `pumpOn`, `purple`, `rand`, `ratchet`, `ratchet2`, `rate`, `rateUnits`, `raw`, `red`, `red_orange`, `red_violet`, `released`, `reset`, `resetHeading`, `resetPosition`, `resetRotation`, `resetTimer`, `retract`, `rev`, `reverse`, `right`, `rotation`, `rotationUnits`, `row`, `rpm`, `rps`, `sec`, `seconds`, `set`, `setBlink`, `setBrightness`, `setColor`, `setCursor`, `setDriveVelocity`, `setFade`, `setFillColor`, `setGearRatio`, `setHeading`, `setLight`, `setLightPower`, `setMaxTorque`, `setMaximum`, `setOrigin`, `setPenColor`, `setPenWidth`, `setPosition`, `setReversed`, `setRotation`, `setStopping`, `setTimeout`, `setTimer`, `setTurnConstant`, `setTurnDirectionReverse`, `setTurnThreshold`, `setTurnVelocity`, `setVelocity`, `signature`, `siren`, `siren2`, `sizeType`, `slow`, `small`, `smartdrive`, `sonar`, `soundOff`, `soundType`, `spin`, `spinFor`, `spinToPosition`, `srand`, `stop`, `swap`, `system`, `tada`, `takeSnapshot`, `temperature`, `temperatureUnits`, `thread`, `time`, `timeUnits`, `timer`, `tollBooth`, `torque`, `torqueUnits`, `touchled`, `transparent`, `turn`, `turnFor`, `turnToHeading`, `turnToRotation`, `turnType`, `turns`, `undefined`, `up`, `value`, `velocity`, `velocityUnits`, `vexSystemExitRequest`, `vexcodeInit`, `violet`, `vision`, `volt`, `voltage`, `voltageUnits`, `wait`, `watt`, `white`, `width`, `wrench`, `wrongWay`, `wrongWaySlow`, `yellow`, `yellow_green`, `yellow_orange`.

