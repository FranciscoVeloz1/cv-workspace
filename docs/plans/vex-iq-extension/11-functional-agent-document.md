# Agent document (functional)

**Tipo:** Functional  
**Depende de:** [`01-functional-domain-and-scope.md`](01-functional-domain-and-scope.md)  
**Implementa:** Contract for one agentic playbook. The file on disk is created in spec 17 from this front matter plus `## Agent chapter` bodies in specs 04–10.  
**No incluye:** Member inventories (04–10), catalog JSON (13), extension activate (12).

## Resultado

A locked contract so every topic chapter uses the same template, heading order, and adaptation rules. Coding agents can follow `AGENTS.md` without opening `api.vex.com`.

## Requirements

### File and audience

- **Path:** `repos/personal-projects/vex-iq-extension/AGENTS.md`
- **Audience:** Cursor and similar coding agents writing or reviewing VEXcode IQ (1st gen) C++. Humans may read it; it is optimized for agents.
- **Single file.** Do not split topics into `docs/motion.md` etc.

### Front matter (written once, owned by this spec)

Spec 17 must start `AGENTS.md` with:

1. Title: `VEXcode IQ (1st gen) C++ — agent playbook`
2. Purpose: adapt official IQ1 C++ docs for agentic development.
3. Hard constraints:
   - IQ1 C++ only;
   - this repo’s extension does not compile or download;
   - no V5, Python, or Blocks APIs;
   - do not invent APIs;
   - prefer this file + `catalog/iq1-cpp.json` over guessing.
4. Project skeleton:

```cpp
#include "vex.h"

using namespace vex;

int main() {
  // Initializing Robot Configuration. DO NOT REMOVE!
  vexcodeInit();

  // agent code here
}
```

   Official samples also use `iq_cpp.h` in some SDK trees; agents should match the project’s existing include. If the file is empty, use `vex.h`.
5. Constructors vs Device Menu: in VS Code / Cursor, agents **must write constructors**. VEXcode Device Menu generation is not available here (official C++ index states this).
6. Style: always braces on `if` / `for` / `while` in generated C++.
7. How to use this file: read the matching topic chapter before emitting code for that device; keep `wait` inside loops that poll sensors or controllers; name objects like official examples (`Motor1`, `Brain`, `Controller`) unless the user named devices.

### C++ language reminder chapter (owned by this spec)

A short chapter titled `## C++ language reminder (VEXcode)` covering only VEXcode-specific control helpers, **not** the C++ standard:

- Comments: `//` and `/* */`
- `if` / `else` / `while` / `for` / `break` as C++ (do not re-teach the language)
- `wait(time, units)` with `msec` and `seconds`
- `Brain.programStop()` as the official end-project helper (`vexSystemExitRequest` is the low-level alias; teach `programStop` first)

### Chapter template (every topic in specs 04–10)

```markdown
## [Topic name]

Official: [full https://api.vex.com/iq1/... URL]

### When an agent should use this
[2–6 sentences]

### Types and constructors
[Every class in the topic with constructor signatures and parameter meaning]

### Members
[Every member: name, signatures, return type, notes. Group Actions / Getters / Mutators / Callbacks as the official page does]

### Agent recipe
[Minimal complete C++ fragment: include, namespace, construction, one real call, wait if a loop]

### Pitfalls
[IQ1 vs IQ2 if relevant; blocking vs non-blocking; calibrate-still; invented camelCase; missing vexcodeInit]
```

### Chapter ownership (append order)

1. Motion — spec 04  
2. Drivetrain — spec 05  
3. Sensing — spec 06  
4. Brain screen, sound, console — spec 07  
5. Controller — spec 08  
6. Vision — spec 09  
7. Logic, units, ports, globals — spec 10  

### Adaptation rules

- Imperative agent voice (“Construct `motor` with `PORTx` before calling `spin`”).
- Keep every documented member; do not summarize away signatures.
- At least one copy-paste recipe per **class**.
- Official URL at the top of each chapter.
- If official prose and headers disagree, state both and follow the README winner rule (official names; omit if no symbol).
- Do not invent APIs absent from the catalog.

### Out of scope for the playbook

- Second playbook file.
- HTML scrape checked into git.
- Python or Blocks chapters.
- Teaching a full C++ course.

## Architecture

Playbook = concatenated Markdown. Catalog = symbols. Spec 17 is the only writer of `AGENTS.md`.

## Code to do

Assembly → spec 17. Chapter bodies → specs 04–10 (must exist before 17).

## Testing

Spec 17:

- TOC matches the seven topic headings plus front matter and C++ reminder;
- every chapter starts with `Official: https://api.vex.com/iq1`;
- every catalog `name` appears at least once in `AGENTS.md`.

## Acceptance

- One path, one template, one order.
- Front matter includes skeleton, `vexcodeInit`, constructor rule, brace rule.
- C++ reminder does not duplicate spec 10’s full unit tables (spec 10 owns units; this chapter only points at `wait` / `programStop` / comments / control keywords).

## Verification unlocked

Specs 17 and 18.

## Impact

**Edge cases**

- Agents copying recipes without `vexcodeInit`: front matter and every recipe must include it or a comment that `main` already called it.
- Header vs `vex.h`: skeleton documents the fallback.

**Side effects**

- Large `AGENTS.md` in context windows: accepted; one file is the product requirement.

**Mitigations**

- TOC at top of the assembled file (spec 17).
