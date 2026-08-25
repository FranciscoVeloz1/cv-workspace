# Logic and units

**Tipo:** Functional  
**Depende de:** [`03-functional-catalog-contract.md`](03-functional-catalog-contract.md), [`11-functional-agent-document.md`](11-functional-agent-document.md)  
**Implementa:** Catalog + Agent chapter for `wait`, ports, unit aliases, events, threads, tasks, timers, and VEXcode Logic pages that are C++ (not a C++ course).  
**No incluye:** Re-teaching `if`/`while` as a language (spec 11 reminder only). Motor/drivetrain units usage (those specs consume these aliases).

## Resultado

Namespace-level catalog for globals and Logic helpers. Official index: https://api.vex.com/iq1/home/cpp/index.html  
Enums: https://api.vex.com/iq1/home/cpp/Enums.html  
Event: https://api.vex.com/iq1/home/cpp/Event.html  
Thread: https://api.vex.com/iq1/home/cpp/Thread.html  
Timer: https://api.vex.com/iq1/home/cpp/Brain/Timer.html

## Requirements

### Control — official names

IQ1 C++ does not use the IQ2 `Logic/Control.html` tree. `wait` appears on nearly every device page; time units live on https://api.vex.com/iq1/home/cpp/Enums.html . If harvest finds a dedicated Wait.html under `/iq1/home/cpp/`, use that as `docUrl`; otherwise `Enums.html` or the C++ index.

| Item | Catalog? | Notes |
|------|----------|-------|
| `wait` | yes, `function` | `void wait(double time, timeUnits units);` units `msec`, `seconds`/`sec`. |
| `for` / `if` / `while` / `break` | **no** as VEX symbols | C++ keywords; grammar already colors them. |
| `programStop` | yes | Official: `Brain.programStop();` — method on `brain` if the Brain page lists it; otherwise SDK `vexSystemExitRequest`. |
| `vexSystemExitRequest` | yes, `cppNames` of `programStop` or separate function | Teach `Brain.programStop()` first when the symbol exists. |

### Variables, Functions, Operators, Comments, Math, Random, String formatting

IQ1 C++ docs do not use the IQ2 `Logic/` subtree. Harvest any Variables / Functions / Comments pages linked from https://api.vex.com/iq1/home/cpp/index.html ; otherwise this section is C++ itself plus `rand`/`srand` from headers.

Do **not** catalog C++ operators or `int`/`bool`. Catalog:

| Name | Kind | Notes |
|------|------|-------|
| `rand` | function | `int rand();` |
| `srand` | function | `void srand(unsigned seed);` |
| Math identifiers used in completions | optional | `abs`, `fmin`, `fmax`, `pow`, `sin`, `cos`, `tan`, `sqrt`, `M_PI`, `M_E` — these are `<cmath>` / macros, not VEX. **v1: do not catalog** (YAGNI; Microsoft C/C++ completes them). |
| `strcat` / `strstr` | **no** | Standard C; not VEX. |

Agent chapter may mention `%d` / `%.xf` / `%s` for `Brain.Screen.print` / `printf` without catalog entries.

### Events — `vex::event`

Official: https://api.vex.com/iq1/home/cpp/Event.html

| Name | Signature |
|------|-----------|
| ctor | `event(void (*callback)(void));` plus official `event(callback)` |
| `broadcast` | `void broadcast();` — does not wait |
| `broadcastAndWait` | `void broadcastAndWait(int32_t timeout = 60000);` |
| `set` / `operator()` | register additional callbacks |

### Threads — `vex::thread`

Official: https://api.vex.com/iq1/home/cpp/Thread.html

| Name | Signature | Notes |
|------|-----------|-------|
| ctor | `thread(void (*callback)(void));` also `int (*callback)(void)` in SDK | Starts immediately. |
| `join` | harvest from Thread.html | Waits for the thread to finish. |
| `detach` | harvest from Thread.html | |
| `interrupt` | `void interrupt();` | Cannot restart; construct a new thread. |
| `interruptAll` | harvest if listed | |
| `hardware_concurrency` | harvest if listed | |
| `swap` | harvest if listed | |

Catalog every method on the official IQ1 Thread page. Agent recipes still prefer ctor + `interrupt` unless the user asked for `join`.

### `vex::task`

Not on the official Logic index as a student page. Optional SDK catalog. Agent chapter: prefer official `thread` unless the project already uses `task`.

### Timer — `vex::timer` / `Brain.Timer`

Official: https://api.vex.com/iq1/home/cpp/Brain/Timer.html

Official listed: ctor `timer()`, `reset`, `value`, `event`.

```cpp
void reset();
double value();           // official prose: ms as double; Doxygen: seconds — catalog both units via time(timeUnits) 
uint32_t time() const;    // ms
double time(timeUnits units) const;
void clear();             // alias of reset
static void event(void (*callback)(void), uint32_t value); // delay ms
```

Conflict: official `value` vs Doxygen seconds. Agent chapter: prefer `Brain.Timer.time(msec)` or `time(seconds)` when units matter.

`brain` also: `timer(timeUnits)`, `resetTimer()`, `setTimer(double, timeUnits)`.

### Custom colors — `vex::color`

Official color enumerators: https://api.vex.com/iq1/home/cpp/Enums.html  
If a Color objects page exists under `/iq1/home/cpp/`, harvest it; otherwise catalog `class color` from headers with `docUrl` pointing at Enums.html.

May be missing from old Doxygen. Catalog if headers have `class color`.

Constructors: `color(hex)`, `color(r,g,b)`, `color(predefined)`, `color()`. Mutators: `rgb`, `hsv`, `web`. Predefined names overlap `colorType` aliases.

### Ports

`PORT1` … `PORT12` as `constant`, `cppNames` same, `container` `vex`.

### Enumerations (complete `enum` + `enumMember` + global aliases)

From `vex_units.h` / `vex_global.h`. Every enumerator and alias below must be a catalog entry (`enumMember` and/or `constant`).

**percentUnits:** `pct`. Alias: `percent`, `pct`.  
**timeUnits:** `sec`, `msec`. Aliases: `seconds`, `sec`, `msec`.  
**currentUnits:** `amp`. Alias: `amp`.  
**voltageUnits:** `volt`, `mV`. Alias: `volt`.  
**powerUnits:** `watt`. Alias: `watt`.  
**torqueUnits:** `Nm`, `InLb`.  
**rotationUnits:** `deg`, `rev`, `raw`. Aliases: `degrees`, `turns`, `deg`, `rev`. Do not teach `raw` in recipes.  
**velocityUnits:** `pct`, `rpm`, `dps`.  
**distanceUnits:** `mm`, `in`, `cm`, `counts`. Aliases: `mm`, `inches`.  
**temperatureUnits:** `celsius`, `fahrenheit`.  
**directionType:** `fwd`, `rev`, `undefined`. Aliases: `forward`, `reverse`, `fwd`.  
**turnType:** `left`, `right`.  
**brakeType:** `coast`, `brake`, `hold`, `undefined`.  
**sizeType:** `none`, `small`, `medium`, `large`.  
**colorType:** `none`, `red`, `green`, `blue`, `white`, `yellow`, `orange`, `purple`, `cyan`, `red_violet`, `violet`, `blue_violet`, `blue_green`, `yellow_green`, `yellow_orange`, `red_orange`, `black`, `transparent`.  
**fadeType:** `off`, `slow`, `fast`.  
**gyroCalibrationType:** `calNormal`, `calSlow`, `calExtended`.  
**rateUnits:** `dps`, `rps`.  
**ledState:** `off`, `on`, `blink`.  
**soundType:** sixteen values listed in spec 07.  
**gestureType:** `none`, `up`, `down`, `left`, `right`.  
**cylinderType:** `cylinder1`, `cylinder2`, `cylinderAll`.  
**gearSetting** (only if Motor.html / headers declare it): `ratio1_1`, `ratio2_1`, `ratio3_1`. IQ1 playbook prefers numeric motor `gears` (spec 04).

`wait` is already listed.

## Architecture

This spec is the namespace SSOT. Other inventories reference these names; they must not redefine enumerator lists.

## Code to do

Spec 13: all ports, aliases, `wait`, `programStop`, event/thread/timer official members. Spec 17 concatenates chapter.

## Testing

Every `PORT1`–`PORT12` present. `wait` present. `forward` and `fwd` in `cppNames` (may share one entry). `degrees` and `turns` present.

## Acceptance

- C++ keywords are not catalog entries.
- Agent recipes use `wait(20, msec)` in poll loops.
- Unit alias table is complete vs `vex_global.h` natural-language + short aliases listed above.

## Verification unlocked

Spec 18 fixture uses `wait(1, seconds)` and `forward`.

## Impact

**Edge cases**

- `off` is both `fadeType` and `ledState` — one `constant` name, `doc` lists both enums.
- `dps` is both `velocityUnits` and `rateUnits`.

**Mitigations**

- Single catalog entry per spelling with `doc` naming both enums when they collide.

## Agent chapter

```markdown
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
```
