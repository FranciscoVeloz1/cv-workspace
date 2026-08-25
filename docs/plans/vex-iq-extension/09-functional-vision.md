# Vision

**Tipo:** Functional  
**Depende de:** [`03-functional-catalog-contract.md`](03-functional-catalog-contract.md), [`11-functional-agent-document.md`](11-functional-agent-document.md)  
**Implementa:** Catalog + Agent chapter for the IQ Vision Sensor (`vision`).  
**No incluye:** Optical/color sensors (spec 06). AI Vision (`aivision`) is IQ 2nd gen — out of IQ1 v1.

## Resultado

Classic `vision` inventory from official IQ1 Vision.html plus Doxygen/headers. `aivision` is not in IQ C++ Doxygen 3.0.4.1 and is not an IQ1 C++ device — do not catalog it.

Official: https://api.vex.com/iq1/home/cpp/Vision.html  
(Chinese locale mirror exists at `/zh-CN/iq1/home/cpp/Vision.html`; harvest English `docUrl` must stay under `https://api.vex.com/iq1`.)

## Requirements

### `vision` (Vision Sensor)

Color signatures and color codes. IQ `#define VISION_MAX_OBJECTS 4`.

#### Constructors

```cpp
vision(int32_t index);
template<typename... Args>
vision(int32_t index, uint8_t bright, Args&... sigs);
```

`index` is `PORTx`. Generated signature names look like `Vision1__BLUEBOX`.

#### Snapshot

| Name | Signatures | Return |
|------|------------|--------|
| `takeSnapshot` | `int32_t takeSnapshot(uint32_t id)` | count |
| `takeSnapshot` | `int32_t takeSnapshot(code& cc)` | |
| `takeSnapshot` | `int32_t takeSnapshot(signature& sig)` | |
| `takeSnapshot` | same three with extra `uint32_t count` | cap largest objects |
| `installed` | `bool installed()` | |

Must `takeSnapshot` before reading objects. `objects[0]` is largest by width.

#### Properties

| Name | Type | Notes |
|------|------|-------|
| `objectCount` | `int32_t` | |
| `largestObject` | `vision::object` | |
| `objects` | `safearray<object, VISION_MAX_OBJECTS>` | max **4** on IQ |

#### `vision::object` fields

`id`, `originX`, `originY`, `centerX`, `centerY`, `width`, `height`, `angle`, `exists` (const refs in SDK).

#### `vision::signature` constructor

```cpp
signature(int32_t id, int32_t uMin, int32_t uMax, int32_t uMean,
          int32_t vMin, int32_t vMax, int32_t vMean, float range, int32_t type);
```

Values come from Vision Utility, not hand-tuned.

#### `vision::code`

Overloads for 2–5 signature ids or `signature&` references. `uint32_t getCode();` `bool isFlipped();`

Utility methods (`setBrightness`, white balance, LED, wifi): SDK/Doxygen. Official student pages often omit them. Catalog as optional SDK entries with `doc` “Utility / not on IQ1 student Vision page.” Do not put them in the Agent recipe.

### `aivision` — out of IQ1 v1

Do not catalog `aivision`, `ALL_TAGS`, `ALL_AIOBJS`, or AprilTag/AI classification APIs. Those belong to IQ 2nd gen / V5. If a mixed SDK still declares the class, `doc` starts with `IQ 2nd-gen only.` and the Agent chapter forbids emitting it.

## Architecture

Winner rule: no invented Vision members; no AI Vision on IQ1.

## Code to do

Spec 13: `vision.*` only. Spec 17 concatenates chapter.

## Testing

`vision.method.takeSnapshot` required. Do not require `aivision` ids.

## Acceptance

- IQ vision object array length taught as **4**, not V5’s larger camera.
- Agent never emits Python `take_snapshot` in C++ files.
- Agent never emits `aivision`.

## Verification unlocked

Not part of motor tracer.

## Impact

**Edge cases**

- Cloudflare blocks unattended fetch of `Vision.html`; harvest must open it in a browser (spec 13).

**Mitigations**

- Spec 13 browser pass includes Vision.html.

## Agent chapter

```markdown
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
```
