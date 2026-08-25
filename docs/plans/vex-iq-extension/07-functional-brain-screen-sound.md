# Brain screen, sound, console

**Tipo:** Functional  
**Depende de:** [`03-functional-catalog-contract.md`](03-functional-catalog-contract.md), [`06-functional-sensing.md`](06-functional-sensing.md), [`11-functional-agent-document.md`](11-functional-agent-document.md)  
**Implementa:** Catalog + Agent chapter for `Brain.Screen`, speaker methods on `brain`, and console/`printf`.  
**No incluye:** Brain buttons/battery (spec 06). Brain IMU (`inertial`) is out of IQ1 v1 — heading lives on port `gyro` (spec 06) and `smartdrive` (spec 05).

## Resultado

Complete Brain UI inventory for IQ1. Sound is methods on `brain` (`playSound`, `playNote`, `soundOff`), not a separate Sound device. There is no official IQ1 C++ Brain inertial class.

## Requirements

### Screen — `brain::lcd` via `Brain.Screen`

Official: https://api.vex.com/iq1/home/cpp/Brain/Brain.Screen.html  
Not user-constructed. Access: `Brain.Screen`. Default font at project start: **`mono20`** / `MONO20`.

Official method names (all required in catalog if symbols exist):

**Cursor / text:** `print`, `setCursor`, `newLine`, `clearLine`, `row`, `column`, `printAt`, `getStringWidth`, `getStringHeight`  
**Mutators:** `clearScreen`, `setFont`, `setPenWidth`, `setPenColor`, `setFillColor`, `setOrigin`  
**Draw:** `drawPixel`, `drawLine`, `drawRectangle`, `drawCircle`  
**Also harvest if listed:** `setClipRegion`, `render`, `invertCircle`, `invertRectangle`, `setAspectCompensation`

Signatures (Doxygen + official):

```cpp
void setCursor(int32_t row, int32_t col);
void setPenWidth(uint32_t width);
void setOrigin(int32_t x, int32_t y);
int32_t column();
int32_t row();
void setPenColor(colorType color);
void setFillColor(colorType color);
void print(const char *format, ...);
void printAt(int32_t x, int32_t y, const char *format, ...);
void clearScreen(void);
void clearLine(int number);
void clearLine(void);
void newLine(void);
void drawPixel(int x, int y);
void drawLine(int x1, int y1, int x2, int y2);
void drawRectangle(int x, int y, int width, int height);
void drawRectangle(int x, int y, int width, int height, colorType color);
void drawCircle(int x, int y, int radius);
void drawCircle(int x, int y, int radius, colorType color);
```

Official-only names missing from old Doxygen: `setFont(fontType)`, `getStringWidth`, `getStringHeight`, `setClipRegion`, `render`. Include when the target SDK has them.

Fonts documented on Screen siblings: `mono12`, `mono15`, `mono20`, `mono30`, `mono40`, `mono60`, `prop20`, `prop30`, `prop40`, `prop60`. Catalog as `enumMember` of `fontType` if present.

Do not catalog EXP-only `drawImageFromFile`.

### Sound — `brain` speaker

Official: https://api.vex.com/iq1/home/cpp/Brain/index.html (class methods on `brain`; there is no IQ1 `/Sound.html` tree).  
Access: `Brain.playSound` / `Brain.playNote` / `Brain.soundOff()` (not a `Sound` object).

| Name | Signature | Notes |
|------|-----------|-------|
| `playSound` | `void playSound(soundType sound)` | |
| `playNote` | `void playNote(int32_t octave, int32_t note)` | octave 1–3 low, 4–7 high; note 0–6 = C–B |
| `playNote` | `void playNote(int32_t octave, int32_t note, int32_t ms)` | duration max 500, default 500 |
| `soundOff` | `void soundOff()` | **Official on IQ1 Brain.** Stops playing sound. |

`soundType` members (complete, confirm against Enums.html / Brain page): `alarm`, `alarm2`, `doorClose`, `fillup`, `headlightsOff`, `headlightsOn`, `powerDown`, `ratchet`, `ratchet2`, `siren`, `siren2`, `tada`, `tollBooth`, `wrench`, `wrongWay`, `wrongWaySlow`.

### `inertial` — out of IQ1 v1

Do **not** catalog `inertial` as a Brain IMU. IQ1 has no built-in inertial on the Brain. Heading uses `gyro` (spec 06) and `smartdrive(..., gyro&)` (spec 05). If a mixed SDK still declares `class inertial`, mark entries `IQ 2nd-gen only.` and omit them from the Agent chapter.

### Console

IQ1 C++ docs may not ship a dedicated `Console.html`. Student-facing console API is still **`printf`**. Text is not sent until a newline (`\n`). Clear: `printf("\033[2J\n")`.

`docUrl` for `printf`: use a Console page if the IQ1 index links one; otherwise `https://api.vex.com/iq1/home/cpp/index.html` with `doc` stating VEXcode console behavior.

Also catalog `Brain.Terminal.print(const char *fmt, ...)` if present. Doxygen `vex::console::write` is SDK; primary official name is `printf`.

Format specifiers taught in Logic (spec 10): `%d`, `%.xf`, `%x`/`%X`, `%c`, `%s`.

### `Brain.Timer`

Official: https://api.vex.com/iq1/home/cpp/Brain/Timer.html — **Logic chapter (spec 10) owns `timer` members**. This spec may mention `Brain.Timer` exists; do not duplicate the full timer table.

## Architecture

Same.

## Code to do

Spec 13 + 17.

## Testing

Ids: `brain.method.playSound`, `brain.method.soundOff`, `brain.lcd.method.print`. `printf` as `vex.function.printf` or equivalent namespace-level function. Do **not** require `inertial.method.calibrate`.

## Acceptance

- Screen members listed above are catalogued when symbols exist.
- `soundOff` is a primary IQ1 Brain method.
- Agent recipes never construct `inertial()`.
- `playSound` completes `siren` and other `soundType` names.

## Verification unlocked

Spec 18 optional: hover `playSound`.

## Impact

**Edge cases**

- After `render()` is used, drawing may not show until `render` again (official double-buffer note, if the SDK has `render`).
- `printf` without `\n` appears stuck.

**Mitigations**

- Agent pitfalls.

## Agent chapter

```markdown
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
```
