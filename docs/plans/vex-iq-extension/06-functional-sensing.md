# Sensing

**Tipo:** Functional  
**Depende de:** [`03-functional-catalog-contract.md`](03-functional-catalog-contract.md), [`11-functional-agent-document.md`](11-functional-agent-document.md)  
**Implementa:** Catalog + Agent chapter for Brain buttons/battery and port sensors.  
**No incluye:** Screen, speaker, console (spec 07). Brain IMU (`inertial`) is out of IQ1 v1.

## Resultado

Complete IQ1 Sensing inventory. Range Finder is `sonar`. Distance Sensor is `distance`. Brain buttons are `buttonCheck`, `buttonUp`, `buttonDown`.

Official index: https://api.vex.com/iq1/home/cpp/index.html

## Requirements

### `brain` — buttons and battery only (this spec)

Official Brain: https://api.vex.com/iq1/home/cpp/Brain/index.html  
Buttons: https://api.vex.com/iq1/home/cpp/Brain/Brain.Button.html  
Battery: https://api.vex.com/iq1/home/cpp/Brain/Brain.Battery.html  
Constructor: `brain Brain;` or `brain Brain = brain();` (typical: global `Brain`).

Official IQ1 Brain has three button objects: `buttonCheck`, `buttonUp`, `buttonDown`. Do **not** teach IQ2 `buttonLeft` / `buttonRight` as primary names. If headers alias left/right onto up/down, put those spellings in `cppNames` of `buttonUp`/`buttonDown`.

Nested `Battery` (`brain::battery`).

#### `brain::button` members

| Name | Signature | Return |
|------|-----------|--------|
| `pressed` | `void pressed(void (*callback)(void))` | `void` |
| `released` | `void released(void (*callback)(void))` | `void` |
| `pressing` | `bool pressing(void)` | Official docs also say 1/0. Catalog returnType `bool`. |

#### `brain::battery` members

| Name | Signature | Return |
|------|-----------|--------|
| `capacity` | `uint16_t capacity(percentUnits units = percentUnits::pct)` | percent remaining |
| `voltage` | `double voltage(voltageUnits units = voltageUnits::volt)` | |
| `current` | `double current()` | Include if official Battery.html or Brain index documents it; omit per winner rule if the SDK has no symbol. |

### `bumper`

Official: https://api.vex.com/iq1/home/cpp/Bumper.html  
Prose: Three Wire Port. Official example: `bumper BumperA = bumper();`. Parameter tables may also mention a Smart Port — harvest the **real** constructor from headers.

Catalog constructors that exist:

| Signature | Notes |
|-----------|-------|
| `bumper()` | Official example. |
| `bumper(int32_t index)` | Include if SDK requires a port / triport index. |

| Name | Signature | Return |
|------|-----------|--------|
| `pressed` | `void pressed(void (*callback)(void))` | `void` |
| `released` | `void released(void (*callback)(void))` | `void` |
| `pressing` | `int32_t pressing()` (SDK inline to `value()`) | 1 pressed / 0 not. Official Boolean 1/0. |
| `installed` | `bool installed()` | `bool` — include if official/SDK lists it. |

### `touchled`

Official: https://api.vex.com/iq1/home/cpp/TouchLED.html  
`touchled TouchLED1 = touchled(PORTx);`

| Name | Signatures | Return |
|------|------------|--------|
| `pressed` / `released` | callback `(void)(*)(void)` | `void` |
| `on` | `void on(colorType color, uint32_t brightness = 100)` | `void` |
| `on` | `void on(uint32_t hue, uint32_t brightness = 100)` | `void` |
| `on` | `void on(uint8_t red, uint8_t green, uint8_t blue, uint32_t brightness = 100)` | `void` |
| `off` | `void off()` | `void` |
| `setColor` | `void setColor(colorType color)` | `void` |
| `setFade` | `void setFade(fadeType setting)` | `off`, `slow`, `fast` |
| `setBrightness` | `void setBrightness(uint32_t brightness)` | `void` |
| `setBlink` | `void setBlink(colorType color, double onTime = 0.25, double offTime = 0.25)` | seconds |
| `setBlink` | `void setBlink(uint32_t hue, double onTime = 0.25, double offTime = 0.25)` | |
| `pressing` | `bool pressing()` | |
| `installed` | `bool installed()` | |

Python `toggle` is not an official C++ member — omit.

### `colorsensor`

Official: https://api.vex.com/iq1/home/cpp/Colorsensor.html  
`colorsensor Color1 = colorsensor(PORTx);`

Harvest every method on that page. Typical members (confirm against the page + headers): `setLight`, `isNearObject`, `detects`, `colorname`, `brightness`, `hue`, `colorname3`, `color`, `installed`.

| Name | Signature | Notes |
|------|-----------|-------|
| `setLight` | `void setLight(ledState state)` | `off`, `on`, `blink` |
| `setLight` | `void setLight(int32_t intensity, percentUnits units = percentUnits::pct)` | |
| `isNearObject` | `bool isNearObject()` | |
| `detects` | `bool detects(colorType color)` | |
| `colorname` | `colorType colorname()` | 12 named colors (SDK may implement via `colorname12`) |
| `colorname3` | `colorType colorname3()` | red/green/blue |
| `brightness` | `int32_t brightness(bool bRaw = false)` | |
| `hue` | `int32_t hue()` | |
| `color` | official getter returning a predefined color | Include if symbol exists. |
| `installed` | `bool installed()` | |

### `optical`

Official: https://api.vex.com/iq1/home/cpp/Optical.html  
`optical Optical1 = optical(PORTx);` SDK: `optical(int32_t index, bool enableGesture = false)`.

Official members to harvest from the page include `colorname` / `color`, `isNearObject`, `objectDetected`, `objectLost`, `setLight`, `setLightPower`, `objectDetectThreshold`, `brightness`, `hue`, `installed`.

| Name | Signature | Notes |
|------|-----------|-------|
| `objectDetected` | `void objectDetected(void (*callback)(void))` | |
| `objectLost` | `void objectLost(void (*callback)(void))` | |
| `setLight` | `void setLight(ledState state)` | |
| `setLightPower` | `void setLightPower(int32_t intensity, percentUnits units = percentUnits::pct)` | |
| `objectDetectThreshold` | `int32_t objectDetectThreshold(int32_t value = 0)` | 0–255; 0 = no change; returns current threshold in SDK |
| `isNearObject` | `bool isNearObject()` | |
| `color` / `colorname` | official `color` and/or `colorname` | Primary `name` is the official heading; put the other spelling in `cppNames` if both exist |
| `brightness` | `double brightness(bool bRaw = false)` | |
| `hue` | `double hue()` | |
| `installed` | `bool installed()` | |

Gesture APIs (`gestureEnable`, `getGesture`, …) are SDK/Doxygen. Official IQ1 Optical list typically omits them. Catalog: omit as primary.

### `gyro`

Official: https://api.vex.com/iq1/home/cpp/Gyro.html  
Prose: Three Wire Port. Example: `gyro Gyro = gyro(PORT1);`. Parameter tables may say Smart Port — catalog the constructor the SDK actually has.

Official members (harvest full page): `calibrate`, `changed`, `setHeading`, `setRotation`, `resetHeading`, `resetRotation`, `heading`, `rotation`, `rate`, `isCalibrating`, `installed`.

Map SDK `startCalibration` as implementation of `calibrate` (`cppNames`).

Official `rate(rateUnits units = dps)` — single-axis IQ gyro (ignore “x,y,z” prose if the signature has no axis).

### Range Finder — `sonar` (classic IQ1)

Official: https://api.vex.com/iq1/home/cpp/Sonar.html  
Example: `sonar Sonar = sonar(PORT1);` (Three Wire / Range Finder).

| Name | Signature | Notes |
|------|-----------|-------|
| `distance` | `double distance(distanceUnits units)` | Large positive number if nothing in range. |
| `foundObject` | `bool foundObject()` | Official: true if closer than 1000 mm unless `setMaximum` changed the limit. |
| `setMaximum` | `void setMaximum(double distance, distanceUnits units)` | Changes `foundObject` threshold. |
| `objectDetected` | `void objectDetected(void (*callback)(void))` | |
| `changed` | `void changed(void (*callback)(void))` | Include if the page lists it. |
| `installed` | `bool installed()` | |

This is the primary Range Finder recipe for IQ1.

### Distance Sensor — `distance`

Official: https://api.vex.com/iq1/home/cpp/Distance.html  
`distance Distance1 = distance(PORT1);` — Smart Port Distance Sensor (distinct hardware from Range Finder).

| Name | Signature | Notes |
|------|-----------|-------|
| `objectDistance` | `double objectDistance(distanceUnits units)` | `mm`, `inches`, `cm`. Large positive if none detected. |
| `objectVelocity` | `double objectVelocity()` | |
| `objectSize` | `sizeType objectSize()` | `none`, `small`, `medium`, `large` |
| `objectRawSize` | harvest if listed | |
| `isObjectDetected` | `bool isObjectDetected()` | |
| `changed` | `void changed(void (*callback)(void))` | |
| `timestamp` | `uint32_t timestamp()` | |
| `installed` | `bool installed()` | |

Use `distance` only when the robot has a Distance Sensor. Do not mix `foundObject` onto `distance`.

## Architecture

Same catalog/playbook split.

## Code to do

Spec 13 + spec 17.

## Testing

Ids: `bumper.method.pressing`, `sonar.method.foundObject`, `sonar.method.distance`, `distance.method.objectDistance`, `gyro.method.calibrate`, `brain.button.property.buttonUp` (or equivalent property ids for `buttonCheck` / `buttonUp` / `buttonDown`).

## Acceptance

- Range Finder recipe uses `sonar` + `foundObject` / `distance(units)`.
- Distance Sensor recipe uses `distance` + `objectDistance` / `isObjectDetected`.
- Brain buttons only `buttonCheck`, `buttonUp`, `buttonDown` as official names.

## Verification unlocked

None unique; spec 18 stays motor tracer.

## Impact

**Edge cases**

- `colorsensor` vs `optical`: different classes; do not mix members.
- Gyro `calibrate`: robot must be still.
- Bumper / gyro / sonar port tables disagree with constructor examples — headers win for the symbol; playbook shows the official example plus a comment if the SDK needs a port.

**Mitigations**

- Agent pitfalls below.

## Agent chapter

```markdown
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
```
