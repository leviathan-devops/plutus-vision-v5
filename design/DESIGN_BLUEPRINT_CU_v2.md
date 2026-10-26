# DESIGN BLUEPRINT — COMPUTER-USE v2.0
## A fully self-contained Linux computer, packaged as a tool any agent can use anywhere

**Status:** DESIGN. Authored 2026-10-26 by the operator's brief.
**Authority:** `~/.omp/agent/extensions/computer-use-v2/` v2.0.0 — a FORK of v1. v1 is never edited.
**Consumed by:** PINEBOX (blueprint 2). Nothing else may consume v2 before PINEBOX is green.

---

## §0 · THE CONSTRAINT, AND THE SPLIT IT FORCES

**MEASURED, this host, 2026-10-26 — what v1 actually is:**

```
~/.omp/agent/extensions/computer-use/index.js    652 lines
  spawns weston                          0 references      (grep -c weston = 0)
  spawns agent-display                   0 references      (grep -c agent-display = 0)
  reads the display                      index.js:88       "DISPLAY: S.display || process.env.DISPLAY"
  discovers displays                     index.js:109      readdirSync("/tmp/.X11-unix") → /^X\d+$/
  focus-stealing calls                   windowactivate 0 · windowfocus 0 · wmctrl 0 · ontop 0
  verbs                                  displays · focus · screenshot/shot · click · type · key
```

**v1 is a NAVIGATION engine. It cannot create a display, and it never steals focus.**
The focus theft was one documented example line, not the tool:

```
MECHANISM: ~/.omp/agent/managed-skills/computer-use-virtual-display/SKILL.md:47
  "DISPLAY=:$SLOT xdotool windowactivate $WIN"
  → that single line is the raise. v1's own code never emits it.
```

**THE CONSTRAINT — stated once, in a box:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  THE AGENT MUST BE ABLE TO SEE AND ACT ON A REAL SURFACE,                   │
│  AND THE OPERATOR MUST NEVER LOSE FOCUS, AND THE SAME CODE MUST RUN ON A    │
│  HOST THAT IS NOT THE OPERATOR'S.                                           │
│                                                                              │
│  The display and the filesystem are the only two things a host may not have.  │
│  Everything else — the terminal, the runtime, the state store — is software. │
└──────────────────────────────────────────────────────────────────────────────┘
```

**THE SPLIT IT FORCES — and this is the entire design:**

```
A COMPUTER = FOUR SUBSTRATES, NOT ONE PROGRAM.

   SURFACE      the pixels the agent sees and acts on
   STATE        the files and rows the agent keeps
   TERMINAL     the real PTY the agent runs commands in
   RUNTIME      where the three above execute

   Each substrate has a NATIVE adapter and a FALLBACK adapter, chosen by a probe.
   The FALLBACKS are the same three: a real X display, a real SQLite-backed
   filesystem, a real tmux — so the code path after the probe is IDENTICAL.
```

**WHY TWO ADAPTER AXES, NOT ONE.** The operator's own decomposition, which is correct:
*"A computer is just a shell environment with a display and a file system."* A shell needs a
**surface** and it needs a **state plane**. They are orthogonal:

```
SURFACE axis      native → weston-x11      fallback → weston-vnc (served)  | vm-guest
STATE axis        native → the host FS     fallback → the scoped store    | agentos-wasm
TERMINAL axis     native → tmux on the host                              | tmux in the guest
RUNTIME axis      native → the host        fallback → a Linux guest        | agentos-wasm
```

**And the operator's own rule about the VM, stated exactly as given:**
> *"Key point the Linux VM is not needed if the native device runtime is Linux… There should be
> some auto detection from the tool itself. Am I running on Linux or am I running on something
> else? If not running on Linux, if there is no native Linux runtime, then the Linux VM activates
> and self-hosts everything inside of the tool itself."*

**⇒ THE VM IS A FALLBACK ADAPTER, NEVER THE DEFAULT. On a Linux host it never starts.**

---

## §1 · THE STACK — planes, one dependency direction

```
L6  GOVERN     the registry · the per-instance lock · the no-raise guard · the refusal ledger
L5  DRIVE      the v1 verbs, ported unchanged: focus · shot · click · type · key
L4  TERMINAL   tmux — a real PTY, always
L3  STATE      the scoped store (7 files, copied VERBATIM) — a real SQLite, always
L2  SURFACE   the display adapter — a real framebuffer, always
L1  RUNTIME    where L2-L5 execute: the host, or a Linux guest, or a WASM Linux
L0  PROBE      the capability detection that selects every adapter above
```

**Every plane consumes only the plane below it.** L5 never learns which substrate it drives —
it is handed a display string and a command, exactly as v1 is today (index.js:88). **That is
why v1's 652 lines of navigation survive the fork untouched.**

---

## §2 · THE MACRO ARCHITECTURE IT REUSES

v2 is **v1 plus four planes underneath**. Nothing above L5 changes:

```
  v1 today                          v2
  ───────────────────────────       ─────────────────────────────────────────────
  (the caller supplies DISPLAY)     L0 probe → L2 surface → yields a display string
  S.display = a.display             S.display = a.display || the instance's display
  xdotool --window <id> …           IDENTICAL
  import -window <id> …             IDENTICAL, plus a CDP path for browser windows
  a separate agent-display.sh       ABSORBED into L2 as the weston adapter
```

**The fork is additive. `git diff v1..v2 -- index.js` must show ZERO deleted lines in L5.**

---

## §3 · THE PROCESS IT PRESERVES

The v1 loop, verbatim from the skill, and what changes:

```
  v1                                          v2
  ──────────────────────────────────────     ──────────────────────────────────────
  agent-display.sh up                        computer action=shell op=up
  agent-display.sh app <binary>              computer action=shell op=spawn cmd=…
  xdotool windowactivate $WIN   ← FOCUS      DELETED — and the action it performed now
                                                    REFUSES with ACTIVATE_FORBIDDEN
  import -display :N -window $WIN shot.png    computer action=screenshot (unchanged)
  xdotool mousemove --window $WIN x y click   computer action=click (unchanged)
  agent-display.sh down                      computer action=shell op=down (instance-scoped)
```

**One behaviour changes and it is the important one. Everything else is byte-for-byte.**

---

## §4 · L0 · PROBE — capability detection, by RUNNING things

**CONSUMES** the filesystem, PATH, `/proc`, the uname. **PRODUCES** an adapter selection.
**INVARIANT** every adapter is selected by a probe that RAN, never by reading a config file.

```json
{ "os": { "kernel": "Linux", "arch": "x86_64", "native_linux": true },
  "surface": { "weston": "/usr/bin/weston", "weston_version": "13.0.0",
               "xwayland": "/usr/bin/Xwayland", "xvfb": "/usr/local/bin/Xvfb",
               "x_sockets": ["/tmp/.X11-unix/X1"], "wayland_sockets": [] },
  "state":  { "sqlite3": "/usr/bin/sqlite3", "bwrap": "/usr/bin/bwrap", "unshare": "/usr/bin/unshare" },
  "runtime":{ "tmux": "/usr/bin/tmux", "node": "/home/leviathan/.brv-cli/bin/node",
              "bun": "/home/leviathan/.bun/bin/bun", "qemu": "/usr/bin/qemu-system-x86_64" },
  "selected": { "runtime": "native", "surface": "weston-x11", "state": "scoped-store" } }
```

**FAILURE MODE:** no surface candidate and no X display → `REFUSED NO_SURFACE`. Never assume X11.

---

## §5 · L2 · SURFACE — the display adapter, and its TWO presentations

**THE CONTRACT — every surface adapter must satisfy all six, proven by running them:**

```
C1  A DISPLAY IDENTIFIER that xdotool and import can address (`:N`)
C2  REAL PIXELS in a real framebuffer — capturable and clickable
C3  NO RAISE — operating it never causes a window to be raised or focused
C4  PER-INSTANCE ISOLATION — its own socket, its own slot, its own teardown
C5  A SCOPED TEARDOWN — down kills THIS instance and nothing else
C6  A SERVED FORM when the operator is not at the host — the SAME compositor,
    reachable over a port, so a remote operator can look at it
```

| adapter | C1 | C2 | C3 | C4 | C5 | C6 | selected when |
|---|---|---|---|---|---|---|---|
| `weston-x11` | `:N` via Xwayland | weston window on the host | yes | `--socket=<name>` | kill the process group | — | weston + Xwayland present |
| `weston-vnc` | `:N` via Xwayland | weston, real output | yes | `--socket=<name>` | kill the process group | **`:5900+id`** | the operator is remote, or the host is a Worker |
| `xvfb` | `:N` | a real X framebuffer | yes | `-displayfd` auto slot | kill pid | — | no weston, Xvfb present |
| `existing` | the caller's | the caller's | inherited | the caller's | no-op | — | a display already exists |

**MEASURED PROOF that `weston-vnc` is a real, served, headed surface — this host, 2026-10-25:**

```
MECHANISM: weston --backend=vnc-backend.so --vnc-tls-cert=… --vnc-tls-key=…
  weston's own log — "Output 'vnc' enabled with head(s) vnc"
  ss -ltn                        → 0.0.0.0:5900
  DISPLAY=:1 xdotool search --name 'Weston'   → 1 before, 1 AFTER  (ZERO windows added)
```

**⇒ THE SAME COMPOSITOR, TWO PRESENTATIONS.** `weston-x11` puts the window on the operator's
screen. `weston-vnc` serves the same pixels on a port for a remote operator. The agent's drive
path is identical in both, because the display string is identical.

**FAILURE MODE per adapter:** an adapter that cannot prove C2 or C3 is marked `UNAVAILABLE`
with the failing probe named. **An adapter that cannot prove C3 may be used for CAPTURE only,
never for input** — it would steal the operator's focus.

---

## §6 · L3 · STATE — the scoped store, copied VERBATIM

**THE OPERATOR NAMED THE SOURCE, AND THE SKILL STATES THE LAW:**
> *"Rule: copy 7 files verbatim, then verify with `cmp`."*

```
SOURCE  /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/
        agent_plugin_boilerplates/workspace-scoped-state-boilerplate/
        { db-path.ts · scope-binding.ts · scope-guard.ts · scope-resolver.ts ·
          scoped-store.ts · session-state.ts · workspace-scoping.test.ts }
        7 files · the battery is 32 pass / 0 fail / 68 (measured)
```

**THE FOUR ASSERTIONS THAT DEFINE A LEGAL STATE ROOT** — the reason a computer's filesystem
can never spill into another's:

```
scope-guard.ts:52  assertAbsolute(p, what)          a state path must be absolute
scope-guard.ts:61  assertNotSharedGlobal(dir, what) refuse '/', '/tmp', '/home', '/var' …
scope-guard.ts:78  assertContained(parent, child)   containment by path.relative, NEVER a
                                                        string prefix
scope-guard.ts:92  assertIdentifier(name)            SQL identifiers are interpolated, so they
                                                        are validated
```

**THE COMPUTER'S FILESYSTEM IS A SCOPED STORE.** Each instance owns a root; the guard makes
cross-instance and shared-global writes REFUSE, loudly, by construction.

**FAILURE MODE:** a scope-guard assertion throws → `ScopeGuardError` → the write is refused
and the instance is marked degraded. The store is never served without its tables.

---

## §7 · L4 · TERMINAL — tmux, always

```
tmux 3.4   (/usr/bin/tmux, measured)
A real PTY, a real session, a real scrollback. `computer action=terminal op=send` writes to
`tmux send-keys -t <session>`; `op=read` reads `tmux capture-pane -p`.
```

**WHY tmux and not a pipe:** a pipe is not a terminal — it has no echo, no scrollback, no
job control, and a program that checks `isatty` behaves differently. **A computer whose
terminal is a pipe is not a computer.** The operator's own standard: *"a TUI: a real PTY/terminal
(never a piped stdout standing in for one)"*.

**PER-INSTANCE:** the session name is `cu-<id>-<n>`, so seven instances never share a session.

---

## §8 · L5 · DRIVE — v1's verbs, plus one refusal

Unchanged: `focus · screenshot/shot · click · type · key · displays`.
Added: `shell · terminal · state · app`.

**THE ONE REFUSAL — this is the mechanical fix for the defect that produced this whole session:**

```
action=activate   →   REFUSED ACTIVATE_FORBIDDEN
   "raising a window steals the operator's focus. Use focus (window-scoped), or serve the
    instance's compositor and look at it there."
```

**AND THE FOCUS PROOF, because the operator's requirement is behavioural, not textual:**

```
C3 PROBE (must be in the gate chain):
  1. record the focused window id:  xdotool getwindowfocus
  2. drive the instance:           computer action=click --id N ...
  3. re-read the focused window id: xdotool getwindowfocus
  4. if the id CHANGED → REFUSED FOCUS_STOLEN
```

---

## §9 · L1 · RUNTIME — the auto-detected fallback chain

**THE OPERATOR'S RULE, implemented literally:**

```
if [ "$(uname -s)" = "Linux" ]; then
    RUNTIME=native          # the host IS the Linux runtime. The VM NEVER starts.
else
    RUNTIME=guest           # a Linux VM self-hosts everything inside the tool
fi
```

**THE GUEST — measured from the two repos the operator named:**

```
ExTV/Podroid        Alpine Linux, its OWN kernel, via QEMU. Rootless Android app.
                    An X11 desktop in a built-in viewer. Port forwarding (podroid-forward).
                    SSH in on :9922.  GPLv2.
rivet-dev/agentOS   A WASM Linux — V8 isolates + WebAssembly, POSIX files/processes/networking.
                    SQLite-persisted rootfs. NO nested virtualization. Runs on Cloudflare
                    Workers. 22 MB memory, 4.8 ms cold start. Apache-2.0.
```

**THE MAPPING — which borrowed idea lands where:**

```
PODROID contributes     the guest kernel + rootfs + the "SSH/port-forward to the host" seam
                        → the guest's surface reaches the host as a SERVED display (C6)
AGENTOS contributes     the SQLite-backed POSIX filesystem as a native, always-available
                        state substrate, and the shape of a sandbox with no hypervisor
                        → the state plane's fallback adapter on a Worker
BOTH contribute         the proof that "a computer" is a CONTRACT, not a program
```

**THE ADAPTERS:**

| runtime | when | surface | state | terminal |
|---|---|---|---|---|
| `native` | uname=Linux | weston-x11 / weston-vnc / xvfb / existing | the scoped store | tmux |
| `guest` | not Linux | the guest's own weston, SERVED to the host (C6) | the guest's store | tmux in the guest |
| `agentos` | a Worker / no hypervisor | the agentOS framebuffer, served | agentOS SQLite rootfs | the guest's tmux |

**FAILURE MODE:** a non-Linux host with no QEMU and no agentOS → `REFUSED NO_RUNTIME`, naming
the two paths (install QEMU, or run on a Linux host). Never a degraded shell.

---

## §10 · THE PORTABILITY CONTRACT (the operator's hard requirement)

```
HOST                              runtime  surface      state         the agent sees
──────────────────────────────   ───────  ──────────   ───────────   ─────────────────
this workstation                  native   weston-x11   scoped store  a window on :1
a cloud Linux box (SSH)           native   weston-vnc   scoped store  a served display
a Worker / Durable Object         agentos  served       agentOS fs    a served display
a container with X11              native   existing     scoped store  the container's X
a container with no X11           native   xvfb         scoped store  a served display
a macOS / Windows host            guest    served       guest store   a served display
```

**ONE BEHAVIOUR EVERYWHERE.** After the probe, every downstream step is identical: `xdotool
--window`, `import --window`, tmux, SQLite. There is no "desktop mode" and no "server mode".

**THE FLOOR, measured on this host:**
```
weston 13.0.0 · Xwayland · Xvfb · xdotool · import · tmux 3.4 · sqlite3 3.45.1
node v24.13.1 · bun · qemu-system-x86_64 · bwrap · unshare
⇒ the shell plane costs ~30-80 MB (weston 16 MB measured, Xwayland 15-60 MB measured)
```

**AND THE EXPORT SURFACE, which is the operator's other requirement — one core, three mounts:**

```
core        computer <action> [--id N] [--json]      a POSIX CLI. bash + coreutils only.
extension   ~/.omp/agent/extensions/computer-use-v2/index.ts
            pi.registerTool({ name: "computer", loadMode: "essential", defaultInactive: false })
            forwards every action to the core. Adds NOTHING.
MCP         computer mcp --stdio                     the same action table over tools/call,
            so any runtime (a web agent, Gro, GLM) mounts it and drives the same computer.
```

**THE CORE IS THE ONLY CODE WITH LOGIC.** A bug fixed in the core is fixed in all three
surfaces at once — that is what makes the tool portable to a runtime you have never met.

---

## §11 · THE LEARN LOOP

```
every refusal token → /run/user/<uid>/computer-use/refusals.jsonl
  { token, action, instance, at }
`computer action=doctor` reads the last 200 rows and prints the top 5 tokens.
A token that repeats is a design order, not an incident.
```

---

## §12 · THE ANTI-PATTERNS — WIRED

Each row is a defect class this build WILL produce, with the check that catches it.

| # | the defect | the mechanical detector |
|---|---|---|
| A1 | a focus steal creeps in | `grep -nE 'windowactivate\|windowfocus\|wmctrl -a\|ontop' core/ \| grep -v 'ACTIVATE_FORBIDDEN\|RAISE_TOKENS'` must be EMPTY |
| A2 | a hardcoded display | `grep -nE 'DISPLAY=:[0-9]' core/` must be EMPTY — displays are discovered |
| A3 | weston hardcoded outside its adapter | `grep -n weston core/*.sh` must hit ONLY `adapters/weston-x11.sh` and `adapters/weston-vnc.sh` |
| A4 | a second instance on one id | `up --id 0` twice → the second exits 1 with `INSTANCE_LIVE` |
| A5 | `down` kills siblings | two instances up → `down --id 0` → id 1's display still answers `xdpyinfo` |
| A6 | a mode that renders nowhere (the operator's standing ruling: the WORD or the MODE is the violation) | `test/strings.sh` reads the forbidden-token list at runtime from the operator's forbidden-mode rule file under `~/.omp/agent/rules/` (the rule whose body names the mode and forbids it) and greps `core/` for each token; the check MUST be EMPTY. The token list is never hardcoded in a doc or a script — it is read from the rule that owns it |
| A7 | v1 navigation deleted in the fork | `git diff v1..v2 -- index.js` must show 0 deleted lines in the L5 block |
| A8 | the VM starts on a Linux host | `computer probe --json \| jq -e '.selected.runtime=="native"'` on any Linux host |
| A9 | the scope guard is edited | `cmp` each of the 7 files against the boilerplate source — must be identical |
| A10 | a claim with no probe | every adapter's `probe()` returns the evidence it used; `doctor` re-runs all |

**A6 is a literal string check because the operator's ruling is literal: the word or the mode
is the violation.** A mode that draws nowhere cannot be captured, cannot be clicked, and
therefore cannot be verified — it is the silent-failure surface.

**A8 is the operator's own rule, made mechanical:** on a Linux host the guest must never start.

---

## §13 · BUILD SEQUENCE — each exit can fail

```
V0  the probe                exit: `computer probe --json` names ≥1 runtime AND ≥1 surface
V1  adapter: existing        exit: v1's six verbs pass against :1 UNCHANGED (regression proof)
V2  adapter: weston-x11      exit: a display :N appears; xdpyinfo answers; `displays` lists it
V3  THE C3 PROOF             exit: focus a terminal, drive the instance, focused id UNCHANGED
V4  the registry + lock      exit: two `up --id 0` → the second REFUSED INSTANCE_LIVE
V5  scoped teardown          exit: two instances, down one, the other still answers
V6  the state plane          exit: 7 files cmp-identical; the battery runs in place; a write
                                   outside the instance root is REFUSED by scope-guard
V7  the terminal             exit: `terminal send` then `terminal read` returns the output
V8  the extension forwarder  exit: the `computer` tool appears in a live session and forwards
V9  the MCP server           exit: `tools/list` over stdio returns the whole action table
V10 adapter: weston-vnc      exit: the served display answers on :5900 and captures real pixels
V11 the guest runtime        exit: on a non-Linux host, the guest boots and serves a display
V12 agentos state            exit: on a Worker, the state plane persists across restarts
```

**V3 is the exit that matters most and is the one nobody writes.** It is the whole point.

---

## §14 · WHAT IT INHERITS

```
FORKED FROM  ~/.omp/agent/extensions/computer-use/  v1  (652 lines, index.js)
PRESERVED    the six verbs · the display discovery (index.js:109) · the window-scoped input
             discipline · the `details` payload shape · the state reset action
DELETED      exactly one documented line from the skill: `xdotool windowactivate $WIN`
COPIED       the 7 state-boilerplate files, VERBATIM, proven by `cmp`
ADDED        L0 probe · L1 runtime (native|guest|agentos) · L2 surface (4 adapters, 2 present-
             ations) · L3 state · L4 terminal · L6 govern · ACTIVATE_FORBIDDEN · the focus
             proof · the CLI + extension + MCP surfaces
UNTOUCHED    the operator's display (:0/:1/:2 are never written to; the slot guard refuses)
```

---

## §15 · THE FILE LAYOUT

```
~/.omp/agent/extensions/computer-use-v2/
  index.ts                        the pi.registerTool forwarder            (~120 L)
  core/
    cli.sh                        entry point, action dispatch            (~240 L)
    probe.sh                      L0 capability detection                (~140 L)
    runtime.sh                    L1 runtime selection: native|guest|agentos (~110 L)
    surface.sh                    L2 dispatch → adapter                  (~100 L)
    state.sh                      L3 the scoped store binding             (~120 L)
    terminal.sh                   L4 tmux                               (~90 L)
    drive.sh                      L5 the v1 verbs, ported                (~260 L)
    govern.sh                     L6 registry, lock, no-raise guard      (~160 L)
    adapters/
      weston-x11.sh               (~90 L)
      weston-vnc.sh               (~90 L)
      xvfb.sh                     (~60 L)
      existing.sh                 (~20 L)
    guest/                        the non-Linux fallback
      boot.sh                     the QEMU/agentOS guest launcher       (~140 L)
      rootfs/                     the Alpine rootfs manifest             (manifest)
  scoped/                         THE 7 FILES, COPIED VERBATIM
  mcp/
    server.mjs                    the stdio MCP forwarder                (~160 L)
  test/
    c3-no-raise.sh                THE focus test
    isolation.sh                  A4/A5
    strings.sh                    A1/A2/A3/A6/A7/A8
    cmp-guard.sh                  A9
```

---

## §16 · THE RISK REGISTER

| # | risk | sev | mitigation |
|---|---|---|---|
| R1 | weston-x11 needs a parent display; a cloud box with no display attached has none | HIGH | weston-vnc and xvfb are the fallbacks; the probe orders them |
| R2 | the scope guard is edited during a later change | HIGH | A9 `cmp` in the gate chain; a diff fails the build |
| R3 | a WM on the host raises a window on map | MED | C3 is PROVEN per run; a failing adapter is capture-only |
| R4 | the fork silently diverges from v1 | MED | A7 deleted-lines check |
| R5 | the guest path is never exercised because the host is always Linux | MED | V11 runs on a non-Linux host or a CI image; a skip is a failure |
| R6 | seven instances exhaust the host's X slots | MED | weston allocates ≥3; the probe refuses a slot in the operator's range |
| R7 | the MCP surface drifts from the CLI | LOW | the MCP server calls the CLI; it never reimplements an action |


---

## §7A · THE COMPONENT CONTRACTS — every part, in the M4 form

Each component below states: **WHAT IT CONSUMES · WHAT IT PRODUCES · ITS INVARIANT · ITS
FAILURE MODE**. A part with no failure mode is a part nobody thought about.

### L0 · PROBE

```
COMPONENT      probe.sh
CONSUMES       uname(1) · PATH · /proc · /tmp/.X11-unix/* · /run/user/<uid>/wayland-*
PRODUCES       a JSON capability record (§4) + an adapter selection
INVARIANT      every field is the result of RUNNING a probe, never of parsing a config file
FAILURE MODE   a probe that cannot run → the field is null and the adapter it supports is
               marked UNAVAILABLE. The probe NEVER guesses.
```

### L1 · RUNTIME

```
COMPONENT      runtime.sh
CONSUMES       the capability record · the action list
PRODUCES       a runtime handle: native (the host) | guest (a Linux VM) | agentos (a WASM Linux)
INVARIANT      on a Linux host the selected runtime is ALWAYS "native" and the guest is
               never started (anti-pattern A8 is the detector)
FAILURE MODE   a non-Linux host with no QEMU and no agentOS → REFUSED NO_RUNTIME, naming
               both install paths. Never a degraded shell, never a partial computer.
```

```
COMPONENT      guest/boot.sh
CONSUMES       a QEMU binary · a rootfs image · a port block
PRODUCES       a running Linux guest with an SSH/port-forward seam to the host
INVARIANT      the guest's weston reaches the host as a SERVED display (C6), so the host's
               drive path is byte-identical to the native path
FAILURE MODE   the guest fails to boot → REFUSED GUEST_BOOT_FAILED with the QEMU stderr
               tail. The native path is NEVER used as a silent fallback, because a
               fallback that produces a DIFFERENT computer is false success.
```

```
COMPONENT      guest/rootfs (Alpine, per Podroid)
CONSUMES       nothing at runtime
PRODUCES       the guest filesystem: weston · Xwayland · Xvfb · chromium · node · tmux
INVARIANT      the guest is COMPLETE — every binary the drive path needs is present, so no
               stub is ever shipped (the no-stub law)
FAILURE MODE   a missing binary is a build-time failure of the image, detected by a
               presence assertion at image build, not at first use
```

### L2 · SURFACE

```
COMPONENT      surface.sh
CONSUMES       the capability record · an instance id
PRODUCES       a display string (":N") + a surface record { adapter, display, socket, pid }
INVARIANT      the display is in the operator's reserved range (:0/:1/:2) is REFUSED —
               the tool never writes to the operator's own display
FAILURE MODE   no adapter satisfies C1-C5 → REFUSED NO_SURFACE, listing which contract
               point each candidate failed and the probe output that proved it
```

```
COMPONENT      adapters/weston-x11.sh
CONSUMES       weston 13.0.0 · Xwayland · a socket name · a size
PRODUCES       a weston process whose Xwayland display is the instance's display
INVARIANT      the operator's screen gains exactly ONE window per instance, and the
               window is NOT raised by anything the agent does
FAILURE MODE   weston exits → REFUSED COMPOSITOR_FATAL with the tail of weston's own log
```

```
COMPONENT      adapters/weston-vnc.sh
CONSUMES       weston · a TLS cert+key · --vnc-port
PRODUCES       the SAME compositor, served on :5900+id
INVARIANT      real pixels over a real protocol — MEASURED 2026-10-25: "Output 'vnc'
               enabled with head(s) vnc", 0.0.0.0:5900 listening, and ZERO windows added
               to the operator's display
FAILURE MODE   the cert is missing → it is GENERATED (openssl req -x509, measured working)
               never skipped; a failure → REFUSED TLS_CERT_FAILED
```

```
COMPONENT      adapters/xvfb.sh
CONSUMES       Xvfb · -displayfd
PRODUCES       a real X display with a real framebuffer
INVARIANT      the display number is assigned by Xvfb itself, so it can never collide
FAILURE MODE   Xvfb absent → the adapter is UNAVAILABLE and the chain moves on
```

```
COMPONENT      adapters/existing.sh
CONSUMES       the caller's DISPLAY
PRODUCES       a pass-through surface
INVARIANT      it NEVER creates, never kills and never raises anything — v1 behaviour exactly
FAILURE MODE   none: it is the v1 path and it cannot fail differently than v1 did
```

### L3 · STATE

```
COMPONENT      state.sh + the 7 copied files
CONSUMES       a scope root (absolute, per instance) · a session key
PRODUCES       a SQLite-backed POSIX-ish store: rows, ledgers, a session registry
INVARIANT      the guard refuses a shared-global root and a path outside the instance root
               (scope-guard.ts:61 assertNotSharedGlobal, :78 assertContained)
FAILURE MODE   a guard assertion throws ScopeGuardError → the write is REFUSED, the error is
               LOGGED to stderr, and the instance is marked degraded. The store is never
               served without its tables (the H4 defect, already fixed upstream).
```

```
COMPONENT      scope-guard.ts (COPIED VERBATIM, never edited)
CONSUMES       a path, a directory, an identifier
PRODUCES       the validated value, or a throw
INVARIANT      anti-pattern A9: `cmp` against the boilerplate source must be identical
FAILURE MODE   a diff → the build fails. The guard is a dependency of three of the seven
               files, so a partial copy fails at import — by construction.
```

### L4 · TERMINAL

```
COMPONENT      terminal.sh
CONSUMES       a session name (cu-<id>-<n>) · a command or a key sequence
PRODUCES       tmux send-keys / capture-pane output
INVARIANT      the session is a REAL PTY with echo, scrollback and job control — a pipe is
               not a terminal and a program that checks isatty behaves differently
FAILURE MODE   the session does not exist → it is CREATED (a new tmux session), never
               silently dropped. tmux absent → REFUSED NO_TERMINAL with the install line.
```

### L5 · DRIVE

```
COMPONENT      drive.sh (ported from v1's index.js)
CONSUMES       a display string · a window id · a coordinate or a key
PRODUCES       an X event delivered to that window, or a captured PNG
INVARIANT      EVERY input is window-scoped (`xdotool --window <id>`), so an event can
               never land on the operator's own window
FAILURE MODE   the window id is stale → REFused WINDOW_GONE with the display's current
               window list, so the caller can re-bind
```

```
COMPONENT      drive.sh · the capture path
CONSUMES       a display string · a window id  (X path)  |  a CDP target (browser path)
PRODUCES       a PNG
INVARIANT      for a BROWSER window the capture goes through Page.captureScreenshot, which
               is in-process and therefore CANNOT raise the window. The X path is used only
               for non-browser windows.
FAILURE MODE   no CDP target → REFUSED NO_PAGE naming the CDP port and the target list
```

### L6 · GOVERN

```
COMPONENT      govern.sh
CONSUMES       an instance id · an action
PRODUCES       a registry row · a lock · a refusal ledger row
INVARIANT      one writer per instance id. A second `up --id N` while N is live is
               REFUSED INSTANCE_LIVE with the live pid — never a second display for one id
FAILURE MODE   a stale row (pid dead) is reaped ON READ, and the reap is LOGGED
```

---

## §7B · THE ACTION TABLE — the complete verb surface

Every action below is implemented ONCE in the core and forwarded verbatim by the extension
and the MCP server. There is no second implementation anywhere.

```
ACTION          PARAMS                          PRODUCES
──────────────  ──────────────────────────────  ─────────────────────────────────────────
probe           —                               the capability record (§4) + the selection
doctor          —                               every adapter re-probed + the refusal top-5
shell up        --id N [--size WxH]             a display + a surface record
shell down      --id N                          nothing (the instance is gone)
shell spawn     --id N --cmd <argv...>          a pid, in the instance's display
shell list      —                               every live instance
displays        —                               every display with its windows (v1 verb)
focus           --id N --title <re> | --win    the bound window id (v1 verb)
screenshot      --id N [--out F]                a PNG + its distinct-colour count
click           --id N --win <id> --x --y       the delivered event
type            --id N --win <id> --text <s>     the delivered event
key             --id N --win <id> --key <k>     the delivered event
terminal send   --id N --text <s>               a tmux send-keys
terminal read   --id N [--lines N]              the capture-pane output
state get       --id N --key <k>                a row from the scoped store
state put       --id N --key <k> --value <v>    a row, or a ScopeGuardError refusal
app install     --id N --name <n> --cmd <argv>  a registered default application
app launch      --id N [--name <n>]             the app's pid, in the instance's display
activate        —                               REFUSED ACTIVATE_FORBIDDEN
```

**THE REFUSAL TOKENS, all of them, in one place — every one is a named, greppable string:**

```
NO_SUBSTRATE      no surface adapter satisfied the contract
NO_SURFACE        no surface candidate exists on this host
NO_RUNTIME        a non-Linux host with neither QEMU nor agentOS
COMPOSITOR_FATAL  weston exited; the log tail is in the message
INSTANCE_LIVE     an instance with this id is already running (the pid is named)
WINDOW_GONE       the bound window no longer exists
WINDOW_STALE      the window id changed; re-bind
NO_PAGE           no page target on the CDP port (the port and target list are named)
NO_TERMINAL       tmux is not installed
NO_INPUT          xdotool is not installed (capture still works)
ACTIVATE_FORBIDDEN  raising a window would steal the operator's focus
FOCUS_STOLEN      the behavioural probe observed the focused window changing
SCOPE_VIOLATION   a state write targeted a shared-global or out-of-scope path
PORT_TAKEN        the port is held by a process that is not a pinebox instance
```

---

## §7C · THE DEGRADATION CONTRACT — what happens when each dependency is gone

```
DEPENDENCY GONE                     THE SYSTEM DOES THIS — never "assumes it is present"
──────────────────                  ───────────────────────────────────────────────────
weston                             falls to weston-vnc, then xvfb, then existing
                                   REFUSED NO_SURFACE only if all four fail
Xwayland (weston present)           falls to xvfb, then existing
Xvfb                               the adapter is UNAVAILABLE; the chain moves on
an existing X display               the `existing` adapter uses it, read-only in effect
xdotool                             capture and CDP still work; INPUT is REFUSED NO_INPUT
imagemagick (import)               CDP capture still works for browsers; X capture is
                                   REFUSED NO_CAPTURE
tmux                               the terminal plane is REFUSED NO_TERMINAL; the
                                   display plane is UNAFFECTED
the 7 state files (one edited)      the build FAILS at anti-pattern A9 (cmp). At runtime,
                                   a ScopeGuardError refuses the write
QEMU (non-Linux host)               falls to agentos; if neither → REFUSED NO_RUNTIME
agentos (a Worker)                  the state plane falls to the DO's SQLite
the caller's DISPLAY                the `existing` adapter is used and the tool NEVER
                                   creates a second display
```

**THE LAW: EVERY ROW IS A NAMED, REDUCED BUT HONEST STATE. NO ROW IS A SILENT DEGRADATION
THAT LOOKS LIKE THE FULL THING.**

---

## §7D · THE MCP TOOL SCHEMA — the export surface

```
TOOL   computer
PARAMS {
  action:  enum[probe, doctor, shell_up, shell_down, shell_spawn, shell_list,
                displays, focus, screenshot, click, type, key,
                terminal_send, terminal_read, state_get, state_put,
                app_install, app_launch]
  id:     string   (the instance id)
  win:    string   (a window id)
  x:      number   y: number   text: string   key: string
  cmd:    string[] (argv)
  out:    string   (a file path)
  json:   boolean
}
RETURNS { ok: boolean, text: string, details: object }
        On a refusal: { ok: false, error: "<TOKEN>", detail: "<the probe output>" }
```

**THE REFUSAL IS STRUCTURED, NOT PROSE.** An agent consuming this over MCP can branch on
`error` — it is a token, not a sentence. That is the difference between a tool another
runtime can use and a tool that only its author can read.

---

## §7E · THE EVIDENCE THE DESIGN CITES

Every number in this blueprint was measured on this host, in this session, by a command:

```
652 lines      computer-use/index.js (wc -l)
0 weston refs  grep -c weston computer-use/index.js
0 focus refs   grep -oE 'windowactivate|windowfocus|wmctrl|ontop' computer-use/index.js | wc -l
:88            the DISPLAY read in computer-use/index.js
:109           the /tmp/.X11-unix discovery in computer-use/index.js
7 files        ls workspace-scoped-state-boilerplate/*.ts | wc -l
32/0/68        the boilerplate battery (bun test)
4 assertions   scope-guard.ts:52 :61 :78 :92
weston 13.0.0  weston --version
tmux 3.4       tmux -V
sqlite3 3.45.1 sqlite3 --version
node v24.13.1  node --version
"Output 'vnc' enabled with head(s) vnc"   weston's own log, vnc-backend, 2026-10-25
0 windows added                             DISPLAY=:1 xdotool search --name Weston, before/after
16 MB         weston PSS, measured
15-60 MB       Xwayland PSS, measured
553.0 MB       chrome PSS for one --app instance, measured
188.6 MB      WebKitGTK rendering the SAME page, measured
```

**A BLUEPRINT THAT QUOTES NUMBERS IT DID NOT MEASURE IS A DESIGN THAT CONTRADICTS THE
THING IT DESCRIBES, AND IT WILL BE DISCOVERED ONLY AFTER THE BUILD.**

## §16A · THE REVISION TABLE (provenance)

```
REV 1  the operator asked "why are we even using Chrome?" and, on being told the
        renderer was a separate browser with four handoffs, chose to KEEP Chrome and
        remove the handoffs instead of replacing the renderer.
        → the design has ONE core, and the drive path is CDP, not X.
REV 2  the operator rejected a hidden/off-screen display: "The windows should still be
        visible on my screen if I want to look at them. This cannot be completely
        invisible."
        → the surface plane has TWO presentations of the SAME compositor —
          weston-x11 (a window on the operator's screen) and weston-vnc (served on a
          port for a remote operator). C6 makes the served form part of the contract.
REV 3  the operator rejected a design that stole focus, and named the cause: the
        documented drive loop's `xdotool windowactivate $WIN`.
        → that line is DELETED, the action it performed now REFUSES with
          ACTIVATE_FORBIDDEN, and the requirement is proven by a BEHAVIOURAL probe
          (the focused window id before and after) rather than asserted.
REV 4  the operator required seven concurrent agents with zero spillover.
        → the per-instance lock (INSTANCE_LIVE), the per-instance teardown, and the
          scoped store as the filesystem plane.
REV 5  the operator scoped the target to "any Linux runtime", and rejected the
        Android-specific framing.
        → three surface adapters, one behaviour, and the guest as a non-Linux
          fallback ONLY.
REV 6  the operator stated the VM rule: "The Linux VM is not needed if the native
        device runtime is Linux… If not running on Linux, then the Linux VM activates
        and self-hosts everything inside of the tool itself."
        → the runtime plane probes `uname -s`; on Linux the guest NEVER starts, and
          anti-pattern A8 is the detector that proves it.
REV 7  the operator required the tool to be exportable: "not being fully tethered to
        omp so I can export this to other runtimes as an MCP tool."
        → one core, three mounts (CLI · OMP extension · MCP stdio), with the
          refusals STRUCTURED so a foreign runtime can branch on them.
REV 8  the operator named the state plane: the workspace-scoped-state-boilerplate.
        → the 7 files are copied VERBATIM and proven by `cmp` (A9), because the
          guard is a dependency of three of them and a partial copy fails at import.
REV 9  the operator scoped Cloudflare to phase two.
        → §16B records the four runtimes and what phase two adds.
```

---

## §16B · PHASE TWO — CLOUDFLARE (specified, not built)

**THE OPERATOR'S FRAMING, verbatim:** *"Cloudflare containers and browsers provide the headed
runtime. Obviously the worker itself does not have that capability… A worker, a durable
object, a container, and a browser are four completely separate runtimes."*

```
CLOUDFLARE WORKER         the API + the MCP front door. NO display, NO filesystem.
                          It routes a verb to the instance that owns it.
CLOUDFLARE DURABLE OBJECT the instance REGISTRY. It holds which instance id lives on
                          which container, and each instance's durable state.
                          MEASURED CONSTRAINT (from the Cloudflare Containers reference):
                          "An instance's identity does not make its filesystem
                          persistent: design for restarts and store durable data
                          outside the container disk." → the DO holds the state; the
                          container disk holds nothing durable.
CLOUDFLARE CONTAINER      THE HEADED RUNTIME. A Linux image with weston + Xwayland +
                          Xvfb + Chrome + the three Pine services. The container's
                          display is reached over CDP/VNC, so the agent drives it with
                          the SAME core and the SAME verbs.
CLOUDFLARE BROWSER RUN    the browser for the pages that do not need the container's
                          display, and the CDP endpoint for the container's Chrome.
```

**THE PAYOFF, STATED HONESTLY:** the container image IS the self-contained Linux computer —
a compositor, an X11, a terminal and a Pine runtime in one image. **The core needs ZERO
changes to run there**, because it already probes for weston, Xvfb and X11, and it already
prefers the served presentation when the operator is remote.

**THE ONE THING PHASE TWO ADDS:** the Worker+DO tier, so an agent in a browser can reach a
container's computer. **That is a control-plane change, not a runtime change.**

---

## §17 · SUMMARY

**v1 is 652 lines of navigation that assumes a display exists and never creates one — measured:
zero weston references, zero agent-display references, zero focus-stealing calls, with the
focus theft coming from one documented example line. v2 forks it and adds four planes
underneath: a surface plane whose four adapters (weston-x11, weston-vnc, xvfb, existing) all
satisfy one six-point contract — a display id, real pixels, no-raise, per-instance isolation, a
scoped teardown, and a served form so a remote operator can look at a remote agent's screen;
a state plane that is the seven-file scoped store copied verbatim, so a computer's filesystem
can never spill into another's; a terminal plane that is tmux, because a piped stdout is not a
terminal; and a runtime plane whose guest is a fallback the probe never selects on a Linux host.
The navigation plane is untouched, one documented line is deleted, one action becomes a refusal,
the focus requirement is proven by a behavioural probe rather than asserted, and the same core
is exported as a CLI, an OMP extension and an MCP server — so the identical computer can be
handed to an agent in a Worker, a container, a cloud box or a web agent runtime.**


---

## §18 · AMENDMENTS — what the rebuild MEASURED against this blueprint (2026-10-26)

**Append-only. Every row names the blueprint claim it corrects, the measurement that corrects
it, and where the fix lives. Where the blueprint said "yes" and the run said otherwise, the run
wins.**

### A-1 · THE ROOT CAUSE OF THE FOCUS THEFT (§5 row `weston-x11`, C3 column: "yes" — it was asserted, never proven)

```
MECHANISM  /usr/lib/x86_64-linux-gnu/libweston-13/x11-backend.so imports xcb_create_window and
           xcb_map_window directly and references 0 of the 11 atoms it names matching
           _NET_WM_USER_TIME (strings … | grep). The host window manager therefore sees a window
           with NO user-time and NO placement hint at map, and applies its default focus-on-map
           policy: the compositor takes the focus AND the top of the stack. Every map is one theft,
           so every leaked or restarted compositor was one more.
MEASURED   a paired A/B, each case on its own fresh replica display (mutter 46.2 as the WM,
           operator window focused, exactly one client present before weston):
             no interposer : focus STOLEN, compositor on TOP, _NET_WM_USER_TIME not found
             nofocus.so    : focus KEPT,   _NET_WM_USER_TIME = 0
           and with the focus fixed the window STILL covered the operator (stack top = weston), so
           placement needed its own hint: _NET_WM_STATE = [BELOW] set before the map.
FIX        helpers/nofocus.c, an LD_PRELOAD interposer on xcb_map_window that sets both EWMH hints on
           the SAME connection immediately before the map request. adapters/weston-x11.sh then
           releases BELOW so a human can still click the window forward.
```

### A-2 · THE RELEASE ORDER (the part of A-1 that took three attempts)

```
MEASURED   leaving the BELOW layer drops the window at the TOP of the normal layer. A marked
           timeline of a failing `up` (the adapter now keeps one as <instance>/c3-up.timeline):
             +74 ms  stack=0xa00005,0x80002c      compositor mapped at the BOTTOM, operator on top
             +218 ms lower                        no change: already the bottom
             +522 ms below-off
             +547 ms stack=0x80002c,0xa00005      25 ms after the release the compositor is TOP
           A `lower` issued BEFORE the release is a no-op; it must come AFTER the layer change.
RATE       lower-then-release failed 3 of 24, 5 of 45, 1 of 40 runs (~11%).
FIX        hostwin release: _NET_WM_STATE remove-BELOW then _NET_RESTACK_WINDOW lower, ONE flush, so
           the WM handles both in one dispatch and draws no frame between; the adapter then VERIFIES
           on the WM's own stack, with a bounded correction. 0 failures in 60 runs, with a 30 ms
           sampler over the whole of `up` (any sample with the compositor above the operator counts).
```

### A-3 · C3 IS A PROOF PER RUN, NOT A TABLE CELL (§5, §8)

`up` REFUSES `FOCUS_STOLEN` and tears the instance down if the operator's focus or stack top moved
onto a window of this tool — by IDENTITY (a change the operator made themselves is not a theft),
over EVERY sample taken during the verb, not just before and after. `C3_UNOBSERVABLE` refuses when a
host display exists but cannot be read (the guard must not switch itself off where the agent calls
from). The host display is read from the INSTANCE's own record first, then the environment.
Measured on the operator's real desktop (`active=0x0`, a native Wayland window has focus; `top` =
Discord): `up` + 17 verbs (X and CDP) + teardown, 26/26, before == after. LIMIT: the oracle reads
the X focus and X stack; it cannot read the focus of a Wayland-native window.

### A-4 · VERBS AND REFUSALS THE BLUEPRINT'S TABLES DID NOT HAVE (§7B)

| added | why |
|---|---|
| `view --confirm` | §3 deleted the raise and §7B listed no way to bring the instance forward; PINEBOX §7 names `view` as the ONE permitted raise. It exists, lives in ONE adapter op, and refuses `VIEW_UNCONFIRMED` without `--confirm` (an autonomous agent must not raise a window on the operator's screen). Detector A1b pins the raise surface to exactly one call. |
| `--id` is REQUIRED | `needs_id` defaulted to instance 0 silently: a missing flag drove the wrong computer. Now `MISSING_ID`. |
| `OPERATOR_DISPLAY` | `existing` may bind the operator's display to READ it; click/type/key/spawn into `:0/:1/:2` are refused by name (§7A: "never writes to the operator's own display"). |
| `NO_RUNTIME` is reachable | `shell up` consults `runtime_select`; before, only `probe` did. |
| `C3_UNOBSERVABLE`, `TEARDOWN_INCOMPLETE`, `SHIM_NOT_LOADED`, `SHIM_NOT_EFFECTIVE`, `NO_IMAGE_CHECK`, `HELPERS_UNAVAILABLE` | each names a failure the original token list left to prose. |

### A-5 · A LISTENING PORT IS HELD EVEN WHEN ITS OWNER IS INVISIBLE (§7B `PORT_TAKEN`)

`ss -p`, `fuser` and `lsof` all fail to name the owner of a live listener here (a non-dumpable
process: `/proc/<pid>/smaps_rollup` returns Permission denied for the same uid). An earlier
version treated an ownerless LISTEN row as "a socket the kernel is draining" — wrong twice (a
LISTEN socket cannot be draining) — and a stranger's server went undetected. The predicate is the
LISTEN row, not its owner. The same invisibility makes a process's PSS unreadable, which `status`
now reports as `unreadable` rather than `0`.

### A-6 · THE GATES THAT WERE BLIND (§12)

A reviewer proved four detectors passed on the very defect they guard: A1 could not see the real raise
(`hostwin … raise`); the subshell-exit list named 4 helpers (a fifth passed); no mutant exercised the
two BEHAVIOURAL gates; `--real` had no positive control. Rebuilt: A1b (the raise surface is exactly
one call), A11 COMPUTES the refusing-function set transitively, `mutate.sh --slow` injects a raising
`click` and a registry that forgets live instances and requires C3 / isolation to FAIL, and the
chain ends with `leak-check.sh` (RIG_LEFTOVER / LEAK). Two of my own test defects were found by
these gates: the C3 positive control leaked one compositor per run (six found), and the raw
control's `pkill` pattern is gone in favour of process-group teardown with KILL escalation.

### A-7 · V11 / V12 (§13)

V11: `core/guest/boot.sh` is built (QEMU, the guest's framebuffer SERVED with `-vnc`, ssh into the
guest which runs THE SAME CLI, a presence assertion `rootfs/assert.sh`); proven: 4 refusal paths
(`GUEST_IMAGE_ABSENT` ×2, `AGENTOS_UNAVAILABLE`, killed-mid-boot leaves no VM and no record) and the
assertion FAILING on a bad manifest. NOT PROVEN: a real guest boot, because no guest image exists.
V12 (agentOS) is NOT BUILT — §16B Phase Two.

### A-8 · SMALLER CORRECTIONS

- §10/§15 "bash + coreutils only": the core needs `bun` (the scoped store), `node` (CDP), `gcc`+`libxcb-dev`
  (the two helpers, built into `~/.cache/computer-use/lib` keyed by source sha), and ImageMagick
  (`convert`/`import`); each missing one is a NAMED refusal, never a skipped step.
- A3 ("weston named only in adapters") forced the adapter ORDER out of code into `adapters/order`, and
  `view` into each adapter.
- The first build's `xdotool windowlower` does not exist; EWMH `_NET_RESTACK_WINDOW` is what lowers.
- A replica display used to share a range with another agent's rig on `:99`; replicas are now
  `:200–:230` and `replica.sh down` refuses (`REPLICA_FOREIGN`) any display outside that range.
