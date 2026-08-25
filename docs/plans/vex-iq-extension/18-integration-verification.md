# Integration verification

**Tipo:** Integration  
**Depende de:** [`12-extension-scaffold.md`](12-extension-scaffold.md), [`13-extension-catalog-harvest.md`](13-extension-catalog-harvest.md), [`14-extension-grammar-and-brackets.md`](14-extension-grammar-and-brackets.md), [`15-extension-providers.md`](15-extension-providers.md), [`16-extension-snippets.md`](16-extension-snippets.md), [`17-extension-agent-document.md`](17-extension-agent-document.md)  
**Implementa:** `repos/personal-projects/vex-iq-extension/fixtures/sample-iq1.cpp` and the verification runbook in this spec.  
**No incluye:** New product features.

## Resultado

Prove the tracer: `motor.spin` completes, hovers, highlights, and matches the Motion chapter. Prove `AGENTS.md` has all seven topics. No browser app; use Extension Development Host.

## Requirements

### Fixture

Create `repos/personal-projects/vex-iq-extension/fixtures/sample-iq1.cpp`:

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

This must match the Motion Agent chapter recipe (spec 04 / `AGENTS.md`).

### Automated tests (already specified)

From repo root of the extension:

```bash
npm test
```

Must run Vitest suites from specs 13, 15, 16, 17 (`catalog.test.ts`, `providers.test.ts`, snippet assertions, `agents-md.test.ts`). Expected: all PASS.

### Extension Development Host (manual)

1. `npm run compile`
2. Launch **Run Extension** (`launch.json` from spec 12).
3. Open `fixtures/sample-iq1.cpp`.
4. Confirm language mode is **C++** (not a custom VEX id).
5. Hover `spin`: documentation includes a signature and a link whose href starts with `https://api.vex.com/iq1`.
6. Type `Motor1.` after the declaration: list includes `spin`, `spinFor`, `stop`.
7. Insert snippet prefix `vex-wait`: expands to `wait(..., msec)` or equivalent.
8. Visual: `motor` / `forward` / `PORT1` use extra VEX scopes; `if` / `int` still look like C++ keywords; `{` `}` pair (place caret on `{` — matching `}` highlights).
9. Set `"vexIq.enable": false` in user settings, reload: VEX completions for `spin` are gone (grammar may remain; that limitation is accepted in spec 14).
10. Open `AGENTS.md`: TOC lists Motion, Drivetrain, Sensing, Brain screen, Controller, Vision, Logic; Motion recipe matches the fixture; no strings `TBD`, `TODO`, `implement later`.

### Cloudflare note

Future catalog refresh must use a **browser** on `api.vex.com`. Unattended fetch may show a Cloudflare challenge and must not be treated as an empty API.

### Out of this verification

- Compiling or downloading to a Brain.
- Playwright against a web app (there is none).

## Architecture

Verification is the tracer bullet named in specs 12, 17, and this file: catalog `motor.spin` → completion + hover + signature + highlight + playbook recipe.

## Code to do

Add `fixtures/sample-iq1.cpp`. Do not add a compiler.

## Testing

```bash
cd repos/personal-projects/vex-iq-extension
npm test
npm run compile
```

Expected: tests PASS, `tsc` exit 0. Then complete the Host checklist above.

## Acceptance

- Fixture compiles as text against the Motion recipe (same tokens).
- Language id remains `cpp`.
- Playbook TOC has seven topic chapters.
- Hover URL is official IQ1.

## Verification unlocked

None (this is the last spec).

## Impact

**Edge cases**

- Host without Microsoft C/C++: C++ keyword colors may differ; VEX injection should still apply. Note in the runbook if `cpptools` is missing.
- Official VEX extension installed: duplicate `spin` items — do not fail the checklist.

**Side effects**

- None on other workspace repos.

**Mitigations**

- Checklist item 4 (language is C++) catches accidental new-language registration.
- Item 10 catches playbook placeholders.
