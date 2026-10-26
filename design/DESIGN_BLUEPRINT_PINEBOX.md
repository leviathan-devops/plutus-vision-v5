# DESIGN BLUEPRINT — PINEBOX
## The Pine IDE as a self-contained, multi-instance agent computer

**Status:** DESIGN. Authored 2026-10-26 by the operator's brief.
**Authority:** `scripts/pinebox/` — a FORK of computer-use v2.0 (blueprint 1) with the Pine IDE
as its **default application layer**.
**Precondition:** computer-use v2.0 must be green (its V0-V9 exits) before PINEBOX starts.
**Consumed by:** the operator's agents, and any runtime that mounts the MCP surface.

---

## §0 · THE CONSTRAINT, AND THE SPLIT IT FORCES

**MEASURED, this host, 2026-10-26 — the three facts that shape everything:**

```
FACT 1 · THE PAGE IS FROZEN, AND IT ALREADY HAS A CONFIG SEAM.
  pine-ide/ide/renderer/pine.html:11-16
      window.dashboardConfig = { apiBase: 'http://127.0.0.1:9851',
                                 wsUrl:   'ws://127.0.0.1:9431',
                                 authToken: 'rw_dev_plutus_backtest',
                                 pineStation: 'http://127.0.0.1:9741' };
  13 read-sites across 4 files read it: apiBase · authToken · wsUrl · config ·
                     railBases · readerUrl
  ⇒ THE PORTS ARE ALREADY A CONFIGURATION, NOT A CONSTANT.
  ⇒ PER-INSTANCE ISOLATION REACHES THE PAGE WITHOUT EDITING ONE BYTE OF IT.

FACT 2 · THE BACKEND ALREADY TAKES ITS PORT FROM THE ENVIRONMENT.
  pine-station/server.mjs:46   const PORT = parseInt(process.env.PINE_STATION_PORT || '9741',10)
  pine-ide/vil-rail.mjs:52     const PORT_ENV = Number(process.env.PLUTUS_VIL_PORT || 0)
  scripts/pv-server.py:29      Run: python3 pv-server.py <port> <static-root>
  ⇒ EVERY SERVICE IS ALREADY PORT-INJECTED. NONE OF THEM NEEDS A CODE CHANGE.

FACT 3 · THE CURRENT LAUNCHER IS HARD-CODED TO ONE PORT SET, AND IT LEAKS.
  scripts/pv-ide.sh:69         "station :9741 · rail :9754 · server :9851 up"
  scripts/pv-load.mjs:23       fetch("http://127.0.0.1:9222/json/list")
  measured, this host, 2026-10-26:  3 instance dirs · 12 chrome processes · 4 ports
  ⇒ THE LEAK IS 4 CHROME PROCESSES PER INSTANCE, AND THE HARDCODED BLOCK IS WHY
    TWO INSTANCES CANNOT COEXIST.
```

**THE CONSTRAINT:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  THE PAGE AND THE BACKEND ARE BOTH FROZEN AND BOTH ALREADY PARAMETERISED.   │
│  THE ISOLATION MUST THEREFORE REACH THEM THROUGH THE TWO EXISTING SEAMS:     │
│  THE SERVE-TIME CONFIG BLOCK, AND THE ENVIRONMENT PORT.                     │
│                                                                              │
│  Any design that edits a file under pine-ide/ is a FAILED design.           │
└──────────────────────────────────────────────────────────────────────────────┘
```

**THE SPLIT IT FORCES — PINEBOX IS TWO PIECES, NOT ONE:**

```
  PINEBOX = A COMPUTER (blueprint 1, inherited whole)  +  AN APPLICATION LAYER

  the APPLICATION LAYER is three services and one page:
      station : the Pine runtime (pinets) → normalizeDrawings → plain JSON
      rail    : the face rail
      server  : pv-server.py — the static host AND the API the page talks to
      page    : pine.html — UNCHANGED, in a browser, on the instance's display

  and the ONE new thing the application layer needs from the computer:
      A WAY TO REACH THE PAGE'S PORTS WITHOUT EDITING THE PAGE.
      ⇒ the config block is rewritten AT SERVE TIME, on the server, per instance.
```

---

## §1 · THE STACK — planes, one dependency direction

```
L6  GOVERN     the instance registry · the per-instance lock · the no-raise guard
L5  DRIVE      the v1 verbs, inherited whole from computer-use v2
L4  TERMINAL   tmux, inherited whole
L3  STATE      the scoped store, inherited whole (7 files, VERBATIM)
L2  SURFACE    the display adapter, inherited whole (weston-x11 | weston-vnc | xvfb | existing)
L1  RUNTIME    native | guest | agentos, inherited whole
L0  PROBE      the capability detection, inherited whole
────────────── inherited from computer-use v2.0 — UNCHANGED ──────────────
A1  APP        THE PINE APPLICATION LAYER — the only new code in PINEBOX
      station · rail · server · page · the port block · the config injection
```

**A1 IS THE ONLY PLANE PINEBOX ADDS.** Everything above it is blueprint 1, byte for byte.
**That is the operator's own definition:** *"Pine Box is just the upgraded computer use tool with
the pine IDE as the default application layer that spawns with the shell."*

---

## §2 · THE MACRO ARCHITECTURE IT REUSES

PINEBOX reuses three proven things and re-implements none of them:

```
REUSED 1 · agent-display.sh's weston recipe      204 lines, proven, per-agent isolated
REUSED 2 · computer-use v1's navigation            652 lines, the drive verbs
REUSED 3 · pv-ide.sh's six launch stages           80 lines, the service choreography
REUSED 4 · pv-load.mjs's CDP drive                 84 lines, Runtime.evaluate over a WebSocket
REUSED 5 · the scoped store                        7 files, the filesystem plane
```

**AND WHAT IT REPLACES — the four hardcoded port sets, with a derived block:**

```
             CURRENT (hardcoded)                PINEBOX (derived from --id)
station      9741                               9741 + id*10
rail         9754                               9754 + id*10
server       9851                               9851 + id*10
CDP          9222                               9222 + id*10
VNC          —                                  5900 + id
```

**AND THE ONE THING THAT MUST NOT CHANGE:** not one byte under `pine-ide/ide/renderer/`.

---

## §3 · THE PROCESS IT PRESERVES

**The operator's working loop, verbatim from this session, and what becomes automatic:**

```
  TODAY (hand, repeatedly, wrong every time)          PINEBOX
  ───────────────────────────────────────────────      ────────────────────────────────────
  agent-display.sh up                                 pinebox up --id N
    → computes its OWN slot from md5(PWD)               → the slot is CHOSEN and RECORDED
    → chrome opens on a display nobody watches          → chrome opens on THAT slot
  start station, rail, server by hand                 → three services, one port block
  start chrome by hand, profile in a hardcoded dir     → profile at /tmp/pinebox/i<N>/chrome
  hunt for the window with xdotool                    → the window id is RECORDED at spawn
  capture with import (which can raise the window)     → capture over CDP (never raises)
  load a pine file                                    → pinebox load --pine F
  find the CDP port                                   → the port is in the instance record
  measure RAM, discover a second browser, debug       → pinebox status --id N
```

**THE PROCESS THAT IS PRESERVED IS THE PINE IDE'S, EXACTLY:**
*compile a Pine script → run it against bars → get drawings JSON → draw them → navigate →
inspect*. **Not one of those five steps changes.** The IDE's own semantics, its tabs, its
chart, its face — all unchanged.

---

## §4 · A1 · THE APPLICATION LAYER — the port block

**THE DERIVATION, one place, one function:**

```python
def ports(instance_id: int) -> dict:
    """EVERY resource of an instance is derived from its id. Nothing is shared, so seven
    instances cannot collide. Measured floor: the base ports 9741/9754/9851/9222 are the
    LIVE ones on this host (ss -ltn), so the block starts at id 1 and id 0 is the
    canonical one the operator uses."""
    n = instance_id
    return {"station": 9741 + n * 10,     # pine-station/server.mjs:46  PINE_STATION_PORT
            "rail":    9754 + n * 10,     # pine-ide/vil-rail.mjs:52    PLUTUS_VIL_PORT
            "server":  9851 + n * 10,     # scripts/pv-server.py:29     argv[1]
            "cdp":     9222 + n * 10,     # chrome --remote-debugging-port
            "vnc":     5900 + n}         # weston --vnc-port
```

**THE ID SPACE IS CLAIMED, NOT ASSUMED.** A port that is already in use by something else
is a REFUSAL, never a collision:

```
REFUSED PORT_TAKEN:9741 — :9741 is held by pid 12345 (not a pinebox instance)
REFUSED PORT_TAKEN:9751 — :9751 is held by pid 12346
```

---

## §5 · A1 · THE CONFIG INJECTION — the seam that makes it work

**THE MECHANISM, and it is server-side so the page file is never touched:**

```
AT SERVE TIME, pv-server.py rewrites ONLY the `window.dashboardConfig = { … };` BLOCK
in the bytes it returns for pine.html — the file on disk is read, the block is replaced
with the instance's values, and the REWRITTEN BYTES are sent. The file is unchanged.

  pine.html:11-16  (on disk, forever)
      window.dashboardConfig = { apiBase: 'http://127.0.0.1:9851', … };

  served for instance 3          (in the HTTP response, per request)
      window.dashboardConfig = { apiBase: 'http://127.0.0.1:9881', …,
                                 pineStation: 'http://127.0.0.1:9771' };
```

**WHY THE SEAM IS SUFFICIENT — measured:** 13 read-sites across 4 files read the config, and
the keys they read are `apiBase · authToken · wsUrl · config · railBases · readerUrl`. **The port keys are
`apiBase` and `pineStation`, both already in the block.** So the rewrite reaches every
consumer without a single module change.

**THE INJECTION IS A PREDICATE, NOT A HOPE:**

```python
def _inject_dashboard_config(body: bytes, ports: dict) -> bytes:
    """Rewrite ONLY the dashboardConfig block in the served bytes. The file on disk is
    never modified. If the block is absent, the page will talk to the wrong ports —
    so the absence is a LOUD refusal, not a fallback."""
    text = body.decode("utf-8", "replace")
    m = re.search(r"window\.dashboardConfig\s*=\s*\{[^}]*\}", text)
    if not m:
        raise Refused("CONFIG_BLOCK_ABSENT",
                      "pine.html has no window.dashboardConfig block — the instance cannot "
                      "reach its own ports")
    cfg = {"apiBase": f"http://127.0.0.1:{ports['server']}",
           "wsUrl": f"ws://127.0.0.1:{ports['server'] + 80}",
           "authToken": "rw_dev_plutus_backtest",
           "pineStation": f"http://127.0.0.1:{ports['station']}"}
    return (text[:m.start()] + "window.dashboardConfig = " + json.dumps(cfg) +
            text[m.end():]).encode()
```

**THE LOOP:**
```
if not re.search(r"window\.dashboardConfig\s*=\s*\{", html):
    echo "CONFIG_BLOCK_ABSENT: pine.html has no dashboardConfig — instance cannot bind"; exit 1
fi
```

---

## §6 · A1 · THE FIVE STAGES — each with an exit that can fail

```
STAGE 1 · THE SHELL          computer-use v2, inherited
     weston + Xwayland on a slot ≥3, recorded. The window is on the operator's screen and
     STAYS IN THE BACKGROUND when the operator clicks away.
     exit: xdpyinfo answers on the slot, and the instance record holds it

STAGE 2 · THE SERVICES       three processes, one port block
     node pine-station/server.mjs      (PINE_STATION_PORT)
     node pine-ide/vil-rail.mjs        (PLUTUS_VIL_PORT, PLUTUS_STATION_URL)
     python3 scripts/pv-server.py <port> <renderer-root>
     exit: station POST /run returns success:true, and the rail answers

STAGE 3 · THE PAGE          google-chrome-stable --app=http://127.0.0.1:<server>/pine.html
     --user-data-dir=/tmp/pinebox/i<N>/chrome
     --remote-debugging-port=<cdp>
     DISPLAY=:<slot>          ← THE ONE THING THAT MAKES IT HEADED AND ON THE RIGHT SCREEN
     exit: a window exists on that slot, and the CDP /json/list names a pine.html target

STAGE 4 · THE FRAME         Page.captureScreenshot over the CDP WebSocket
     exit: a PNG with >1 distinct colour, THEN OPENED AND READ

STAGE 5 · THE LOAD          the pine source into the page's editor, then RUN
     exit: the page's own status row shows the fixture and the chart is not blank
```

---

## §7 · THE VERBS

```
pinebox up      --id N [--week W] [--pair P] [--tf T] [--pine F]
                 the five stages, in order, each verified, each refusing by name
pinebox down    --id N | --all
pinebox list                  every instance: slot, ports, window, frame colours, pid
pinebox status  --id N [--json]
pinebox shot    --id N --out F           CDP capture — NEVER raises the window
pinebox load    --id N --pine F          put the source in, RUN it, capture, verify
pinebox drive   --id N --action <verb>   the computer-use verbs, bound to this instance
pinebox terminal --id N --send "…"       tmux inside the instance
pinebox view    --id N                   THE ONLY VERB PERMITTED TO RAISE A WINDOW
```

**THE NO-RAISE INVARIANT, AS A PREDICATE:**

```
if grep -nE 'windowactivate|windowfocus|wmctrl -a|--ontop' scripts/pinebox/*.sh \
     | grep -v 'cmd_view\|RAISE_TOKENS\|ACTIVATE_FORBIDDEN' ; then
    echo "RAISE_FORBIDDEN: a non-view path raises a window"; exit 1
fi
```

**AND THE BEHAVIOURAL PROOF, which is the one that counts:**

```
  xdotool getwindowfocus          → W_before
  pinebox drive --id 0 --action click ...
  xdotool getwindowfocus          → W_after
  if [ "$W_before" != "$W_after" ]; then echo "FOCUS_STOLEN: the drive raised a window"; exit 1; fi
```

---

## §8 · THE MULTI-INSTANCE CONTRACT

```
RESOURCE           ISOLATION                              WHERE IT IS RECORDED
────────────────   ────────────────────────────────────    ─────────────────────────
weston socket      --socket=pinebox<N>                     the instance record
Xwayland slot      weston allocates ≥3                     the instance record
weston window      ONE per instance, on the operator's     the instance record
                   screen, movable and minimisable
station            9741 + N*10                             the instance record
rail               9754 + N*10                             the instance record
server             9851 + N*10                             the instance record
CDP                9222 + N*10                             the instance record
chrome profile     /tmp/pinebox/i<N>/chrome                the instance record
chrome processes   ONE PROFILE PER INSTANCE                 the process group
tmux session       cu-<N>-<n>                              the instance record
state root         the scoped store's instance root        the scoped store
config block       rewritten per instance at serve time    derived from the record
```

**THE LEAK — the one measured tonight — AND ITS FIX:**

```
MEASURED  2026-10-26:  3 instance dirs · 12 chrome processes · 4 ports
MECHANISM  scripts/pv-ide.sh's cleanup greps a FIXED profile path
           ("/tmp/pv-ide-chrome") while its launch used a DIFFERENT one
           ("/tmp/pv-chrome-solo") → the old browser is never killed → 4 chrome
           processes per instance accumulate.
FIX        the profile path is DERIVED (/tmp/pinebox/i<N>/chrome) and the teardown kills
           the process group by the RECORDED pid, never by a pattern.
```

---

## §9 · THE DELIVERY — one core, three mounts

```
core        scripts/pinebox/pinebox            a POSIX CLI
            deps: bash · coreutils · node OR bun · python3 · xdotool · import · tmux
extension   ~/.omp/agent/extensions/pinebox/index.ts
            pi.registerTool({ name: "pinebox", loadMode: "essential", defaultInactive: false })
            forwards every verb to the core. Adds NOTHING.
MCP         scripts/pinebox/mcp/server.mjs     the same verb table over tools/call
            ⇒ a web agent, Gro, or GLM mounts it and drives the same Pine IDE.
```

**THE CORE IS THE ONLY CODE WITH LOGIC** — a fix in the core is a fix in all three mounts.
**That is what makes PINEBOX exportable to a runtime the author has never met.**

---

## §10 · THE LEARN LOOP

```
every refusal → /tmp/pinebox/i<N>/refusals.jsonl   { token, verb, at }
`pinebox status --id N --json` includes the last 5 tokens for that instance.
A token that repeats is a design order.
```

---

## §11 · THE ANTI-PATTERNS — WIRED

| # | the defect | the mechanical detector |
|---|---|---|
| B1 | a file under pine-ide/ is edited | `git diff --stat -- pine-ide/` must be EMPTY in the PINEBOX commit |
| B2 | a hardcoded port outside the block | `grep -nE ':(9741\|9754\|9851\|9222)\b' scripts/pinebox/` must hit ONLY ports() |
| B3 | the config block is absent and ignored | `pinebox up --id 9` on a doctored page → exit 1 with CONFIG_BLOCK_ABSENT |
| B4 | a focus steal | the FOCUS_STOLEN probe above |
| B5 | chrome accumulates | `pgrep -f 'user-data-dir=/tmp/pinebox/i' | wc -l` ≤ 5 per instance after 3 loads |
| B6 | a second instance on one id | `up --id 0` twice → the second exits 1 with INSTANCE_LIVE |
| B7 | `down` kills siblings | two instances → `down --id 0` → id 1's display still answers |
| B8 | a capture that raises the window | the FOCUS_STOLEN probe, run during a capture |
| B9 | a frame that is blank | the capture refuses when the distinct-colour count is 1 |
| B10 | the page is served with the DEFAULT ports | `curl -s localhost:<server>/pine.html \| grep -o "apiBase: '[^']*'"` must name the instance's server port |
| B11 | the scoped store is edited | `cmp` each of the 7 files against the boilerplate — must be identical |
| B12 | a mode that renders nowhere (the operator's standing ruling: the WORD or the MODE is the violation) | `test/strings.sh` reads the forbidden-token list at runtime from the operator's forbidden-mode rule file under `~/.omp/agent/rules/` (the rule whose body names the mode and forbids it) and greps `scripts/pinebox/` for each token; the check MUST be EMPTY. The token list is never hardcoded in a doc or a script — it is read from the rule that owns it |

**B10 is the isolation proof, and it is the one that proves the whole mechanism:** the SERVED
bytes must name the instance's own port. If they name 9851 for instance 3, the rewrite
failed and the instance would talk to another instance's server.

---

## §12 · THE BUILD SEQUENCE — each exit can fail

```
P0  the port block            exit: `pinebox ports --id 3` prints 4 distinct, unclaimed ports
P1  the config injection      exit: `curl -s :9881/pine.html | grep apiBase` names :9881
                              AND `git diff --stat -- pine-ide/` is EMPTY
P2  stage 1 · the shell       exit: xdpyinfo answers on the slot; the record holds it
P3  stage 2 · the services   exit: station POST /run → success:true on the INSTANCE's port
P4  stage 3 · the page       exit: CDP /json/list names a pine.html target on that instance
P5  stage 4 · the frame      exit: a PNG with >1 distinct colour, OPENED AND READ
P6  stage 5 · the load       exit: the chart is not blank; the fixture row is right
P7  no-raise                 exit: the FOCUS_STOLEN probe passes during a drive AND a capture
P8  two instances            exit: `pinebox list` shows 2 rows, 2 slots, 2 port blocks, and
                              each instance's page names its OWN server port
P9  seven instances           exit: 7 rows, 7 slots, 7 port blocks, 0 shared ports, and the
                              operator's display shows 7 weston windows
P10 the teardown             exit: `down --id 3` leaves the other six untouched
P11 the extension            exit: the `pinebox` tool appears in a live session and forwards
P12 the MCP surface          exit: `tools/list` over stdio returns the whole verb table
P13 the leak                 exit: after 3 loads of one instance, ≤5 chrome processes, not 12
```

**P7 is the exit that matters most and is the one nobody writes.** It is the whole point.

---

## §13 · WHAT IT INHERITS

```
INHERITS WHOLE  computer-use v2.0 (blueprint 1) — every plane, byte for byte
COPIED VERBATIM the 7 scoped-store files, proven by `cmp`
REUSED          agent-display.sh's weston recipe · pv-ide.sh's six stages ·
                pv-load.mjs's CDP drive · pv-server.py's static host
FROZEN          every file under pine-ide/  (B1 proves it)
ADDED           the port block · the config injection · the five stages · the nine verbs ·
                the instance record · the leak fix
```

---

## §14 · THE FILE LAYOUT

```
PLUTUS_VISION/scripts/pinebox/
  pinebox                     the CLI entry          (~320 L)
  ports.sh                    the port block + the claim check   (~80 L)
  inject.py                   the serve-time config rewrite     (~90 L)
  stages/
    shell.sh                  stage 1 — the display              (~60 L)
    services.sh               stage 2 — the three services      (~140 L)
    page.sh                   stage 3 — the browser              (~110 L)
    frame.sh                  stage 4 — the CDP capture         (~90 L)
    load.sh                   stage 5 — the pine load            (~70 L)
  core/                       the computer-use v2 core, imported
  mcp/server.mjs              the stdio MCP forwarder            (~160 L)

~/.omp/agent/extensions/pinebox/index.ts
                               the pi.registerTool forwarder     (~120 L)

/tmp/pinebox/i<N>/
  state.json                  the instance record
  chrome/                     the chrome profile
  frame.png                   the last verified frame
  station.log · rail.log · server.log · chrome.log
```

---

## §15 · THE RISK REGISTER

| # | risk | sev | mitigation |
|---|---|---|---|
| R1 | the config block is the ONLY seam, and a future page edit removes it | HIGH | B3 refuses loudly; the block's presence is checked at every serve |
| R2 | seven chromes = 7 × ~550 MB on this host | HIGH | measured: 553 MB/chrome. The operator's 7 agents need a smaller renderer, or fewer concurrent chromes. **This is a KNOWN, MEASURED cost, not a surprise** |
| R3 | the CDP capture needs a websocket client | MED | the core already has one (pv-load.mjs uses `WebSocket`); the capture reuses it |
| R4 | the rail's port fallback (9444→9445) collides with the block | MED | PLUTUS_VIL_PORT is set explicitly, so the fallback never runs |
| R5 | a weston window the operator clicks away from stops rendering | MED | weston keeps rendering; the operator's focus is independent of the compositor's |
| R6 | the instance record is lost | LOW | it is re-derivable from the port block + the pid files; `list` reconciles |

---

## §16 · THE REVISION TABLE (provenance)

```
REV 1  the operator rejected a WebKit replacement and a DOM rebuild
        → the UI is FROZEN; the only change is the engine and the backend
REV 2  the operator rejected a hidden/off-screen display
        → the window is VISIBLE on the operator's screen and stays in the background
REV 3  the operator required that driving it must never raise it
        → the no-raise invariant + the FOCUS_STOLEN probe
REV 4  the operator required seven concurrent instances with zero spillover
        → the derived port block + the per-instance record
REV 5  the operator required the same code on any Linux host
        → the substrate adapters, and the guest as a non-Linux fallback only
REV 6  the operator required the tool to be exportable to other runtimes
        → one core, three mounts (CLI · OMP extension · MCP)
REV 7  the operator scoped Cloudflare to phase two
        → §17
```

---

## §17 · PHASE TWO — CLOUDFLARE (specified, not built)

**THE OPERATOR'S FRAMING, verbatim:** *"Cloudflare containers and browsers provide the headed
runtime. Obviously the worker itself does not have that capability… A worker, a durable
object, a container, and a browser are four completely separate runtimes."*

```
CLOUDFLARE WORKER        the API + the MCP front door. No display, no filesystem.
                         It routes a verb to the instance that owns it.
CLOUDFLARE DURABLE OBJECT the instance REGISTRY. It holds which instance id lives on
                         which container, and the durable state of each instance.
                         (Containers are controlled through Durable Objects — a container's
                         identity does NOT make its filesystem persistent, so durable data
                         lives in the DO, not the container disk.)
CLOUDFLARE CONTAINER     the HEADED RUNTIME. A Linux image with weston + Xwayland +
                         Xvfb + Chrome + the three services. The container's display is
                         reachable over CDP/VNC, so the agent drives it exactly as it
                         drives a local instance — SAME core, SAME verbs.
CLOUDFLARE BROWSER RUN   the browser for the pages that do not need the container's
                         display, and the CDP endpoint for the container's Chrome.
```

**THE PORTABILITY PAYOFF, STATED HONESTLY:** the container image IS the "self-contained
Linux computer" — a weston, an X11, a terminal and a Pine runtime, in one image. **PINEBOX's
core needs ZERO changes to run there**, because the core already probes for weston, Xvfb and
X11 and already prefers a served display when the operator is remote.

**THE ONE THING PHASE TWO ADDS:** the Worker+DO tier, so an agent in a browser can reach a
container's Pine IDE. **That is a control-plane change, not a runtime change.**


---

## §7A · THE COMPONENT CONTRACTS — every part, in the M4 form

### A1 · STATION — the Pine runtime

```
COMPONENT      pine-ide/pine-station/server.mjs  (319 lines)
CONSUMES       a Pine source · a pair · a timeframe · a limit
               env: PINE_STATION_PORT (server.mjs:46) · PINE_STATION_HOST
PRODUCES       plain JSON: { labels[], lines[], boxes[], other{}, drawings, dropped }
INVARIANT      the output is TIME-ANCHORED and anchorless points are DROPPED AND COUNTED
               (run.mjs:163) — the count is the honesty mechanism; a dropped anchor
               is visible, never silent
FAILURE MODE   a Pine compile error → the response names the error and the line; the
               station does NOT return an empty drawing set dressed as success
```

```
COMPONENT      run.mjs → normalizeDrawings  (~40 plain lines, no browser anything)
CONSUMES       ctx.plots from pinets
PRODUCES       the drawings JSON the page draws
INVARIANT      the three primitive families carry exact fields:
                 labels { time, price, text, yloc, color, textColor, size }
                 lines  { a:{time,price}, b:{time,price}, color, width, style }
                 boxes  { a:{time,price}, b:{time,price}, color, borderColor }
FAILURE MODE   NONE TODAY — and that is a KNOWN GAP, recorded in the risk register:
               run.mjs:163 COUNTS '__polylines__', '__linefills__', '__tables__' and
               DISCARDS their geometry. The E2 day-chain is therefore invisible to any
               consumer of the JSON. This is a BACKEND change, inside the operator's
               "backend only" scope, and it is PINEBOX's first backend task — because a
               pinebox that renders a chart without the chain is a different IDE.
```

### A1 · RAIL — the face

```
COMPONENT      pine-ide/pine-ide/vil-rail.mjs  (533 lines)
CONSUMES       env PLUTUS_VIL_PORT (vil-rail.mjs:52) · PLUTUS_STATION_URL
PRODUCES       the face's rail endpoints
INVARIANT      the port comes from the ENV, and the 9444→9445 fallback (vil-rail.mjs:53)
               NEVER RUNS, because PINEBOX always sets PLUTUS_VIL_PORT explicitly
FAILURE MODE   the station is unreachable → the rail reports the station's refusal
               verbatim; it does not synthesise an empty face
```

### A1 · SERVER — the static host and the API

```
COMPONENT      scripts/pv-server.py  (651 lines)
CONSUMES       argv[1] the port · argv[2] the static root · the instance's port block
PRODUCES       the static files · the API the page calls · THE REWRITTEN pine.html
INVARIANT      the file on disk is NEVER written. The rewrite happens in the response
               bytes only. Anti-pattern B1 proves it: `git diff --stat -- pine-ide/`
               must be EMPTY.
FAILURE MODE   the dashboardConfig block is absent from the served page → REFUSED
               CONFIG_BLOCK_ABSENT, naming the file and the fact that the instance cannot
               reach its own ports. NEVER a fallback to the default ports, because that
               would point instance 3 at instance 0's server.
```

```
COMPONENT      the config rewrite (inject.py, ~90 lines)
CONSUMES       the served bytes of pine.html · the instance's port block
PRODUCES       the same bytes with ONE block replaced
INVARIANT      exactly one substitution, and the substituted block is JSON-serialisable
               and re-parses. Anti-pattern B10 proves the RESULT: the served apiBase
               must name the instance's own server port.
FAILURE MODE   the regex does not match → REFUSED CONFIG_BLOCK_ABSENT (loud). A silent
               no-op would point every instance at :9851 and produce the exact
               cross-instance contamination the design exists to prevent.
```

### A1 · PAGE — the frozen client

```
COMPONENT      pine-ide/ide/renderer/pine.html + tabs/ + the config readers
CONSUMES       window.dashboardConfig { apiBase, wsUrl, authToken, pineStation }
PRODUCES       the chart · the editor · the face · the verdict · the backtest
INVARIANT      NOT ONE BYTE CHANGES. The config block is read, never written.
FAILURE MODE   a module hardcodes a port instead of reading the config → the instance
               talks to another instance. Detected by B10, and the fix is in the module
               (a backend-adjacent change) NOT in the page's HTML contract.
```

### A1 · BROWSER — the renderer

```
COMPONENT      google-chrome-stable --app=...
CONSUMES       DISPLAY=:<slot> · --user-data-dir (derived) · --remote-debugging-port
PRODUCES       the window · the CDP target list · the pixels
INVARIANT      the profile path is DERIVED from the instance id, so the teardown can kill
               the process group by the RECORDED pid. The measured leak (12 chrome
               processes for 3 instances) came from a pattern-grep against a path that
               the launch never used.
FAILURE MODE   the window does not map → REFUSED WINDOW_NOT_MAPPED with chrome's own log
               tail and the slot it was given.
```

### A1 · THE FRAME — the evidence

```
COMPONENT      frame.sh (CDP Page.captureScreenshot)
CONSUMES       the CDP target's webSocketDebuggerUrl
PRODUCES       a PNG + a distinct-colour count
INVARIANT      the count > 1. A frame with one colour is a BLANK frame, and the capture
               REFUSES it rather than reporting a successful capture of nothing.
               AND the capture is in-process, so it CANNOT raise the window — which is
               why it is CDP and not `import`.
FAILURE MODE   no target → REFUSED NO_PAGE, naming the CDP port and the target list
```

---

## §7B · THE VERB TABLE — the complete PINEBOX surface

```
VERB              PARAMS                              PRODUCES
───────────────   ────────────────────────────────   ─────────────────────────────────────
ports             --id N                              the 5 derived ports + a claim verdict
up                --id N [--week W] [--pair P]        an instance record + a verified frame
                  [--tf T] [--pine F]
down              --id N | --all                      nothing (the instance is gone)
list              —                                   every instance: slot, ports, window, colours
status            --id N [--json]                     the full instance record
shot              --id N --out F                      a PNG + its distinct-colour count
load              --id N --pine F [--pair P]          the page's own status row + a frame
drive             --id N --action <verb> ...          the computer-use v2 verbs, bound
terminal          --id N --send "…" | --read           tmux inside the instance
state             --id N --get <k> | --put <k> <v>    a scoped-store row
view              --id N                              the instance's window raised — THE ONLY ONE
```

**THE REFUSAL TOKENS — every one named, greppable, structured over MCP:**

```
PORT_TAKEN:<port>      the port is held by a process that is not a pinebox instance
INSTANCE_LIVE          an instance with this id is already running (the pid is named)
CONFIG_BLOCK_ABSENT    the served page has no dashboardConfig block
SERVICE_DOWN:<name>    a service never listened (the log path is named)
STATION_WILL_NOT_COMPILE   POST /run never answered success
WINDOW_NOT_MAPPED      the browser opened no window on that slot (chrome's log is named)
WINDOW_GONE            nothing to capture; the display's window list is included
FRAME_BLANK            the capture produced one distinct colour
NO_PAGE                no pine.html target on the CDP port
CONFIG_BLOCK_ABSENT    (see above)
FOCUS_STOLEN           the behavioural probe saw the focused window change
RAISE_FORBIDDEN        a non-view path tried to raise a window
SCOPE_VIOLATION        a state write targeted a shared-global or out-of-scope path
```

---

## §7C · THE DEGRADATION CONTRACT — what happens when each dependency is gone

```
DEPENDENCY GONE              THE SYSTEM DOES THIS
──────────────────           ──────────────────────────────────────────────────────────
the station                  REFUSED SERVICE_DOWN:station. The IDE is never shown
                             with a chart that cannot be computed — a broken IDE is
                             worse than a refused launch.
the rail                     the IDE opens WITHOUT the face. The page's own
                             "workspaces: offline" state is shown, which is the
                             honest reduced state the page already has.
the server (static host)     REFUSED SERVICE_DOWN:server. Without it there is no page.
the browser                  REFUSED WINDOW_NOT_MAPPED, naming the slot and chrome's log
weston / Xwayland            inherited from computer-use v2 §7C — xvfb, then existing
tmux                         REFUSED NO_TERMINAL; the IDE planes are UNAFFECTED
the CDP port                 REFUSED NO_PAGE. The X capture path still works, so the
                             agent can SEE the IDE even when the drive path is down
the scoped store             the instance is marked degraded; the writes are refused
one instance of seven        the other six are UNAFFECTED — proven by P10
```

**NO ROW IS A SILENT DEGRADATION.** Every one either refuses by name or produces a state the
page already knows how to display honestly.

---

## §7D · THE CONFIG REWRITE — the exact before and after

```
ON DISK, FOREVER (pine-ide/ide/renderer/pine.html:11-16) — NOT MODIFIED:
    window.dashboardConfig = {
      apiBase: 'http://127.0.0.1:9851',
      wsUrl: 'ws://127.0.0.1:9431',
      authToken: 'rw_dev_plutus_backtest',
      pineStation: 'http://127.0.0.1:9741'
    };

IN THE HTTP RESPONSE for instance 3 (per request, in memory):
    window.dashboardConfig = {
      "apiBase": "http://127.0.0.1:9881",
      "wsUrl": "ws://127.0.0.1:9961",
      "authToken": "rw_dev_plutus_backtest",
      "pineStation": "http://127.0.0.1:9771"
    };
```

**THE VERIFICATION, which is B10 and is the whole isolation proof:**

```
  curl -s http://127.0.0.1:9881/pine.html | grep -o "apiBase[^,]*"
    → "apiBase": "http://127.0.0.1:9881"     ← the instance's OWN server
  curl -s http://127.0.0.1:9881/pine.html | grep -o "pineStation[^,]*"
    → "pineStation": "http://127.0.0.1:9771"  ← the instance's OWN station
  git diff --stat -- pine-ide/
    → (empty)                                ← the page was NOT touched
```

---

## §7E · THE CHROME FLAGS — each one, and WHY it is there

```
--app=<url>                     the IDE is a window, not a tab in a browser chrome
--user-data-dir=<derived>       the profile is DERIVED from the id — THE LEAK FIX
--no-first-run                  no setup wizard
--no-default-browser-check      no "set as default" prompt
--remote-debugging-port=<cdp>   the drive + capture path (Page.captureScreenshot)
--remote-allow-origins=*        the WebSocket handshake the CDP client needs
--window-size=1626,931          the measured IDE geometry
--window-position=0,0           inside the weston surface, not on the host desktop
--disable-gpu                   the weston surface is a software compositor
--disable-gpu-compositing       ditto
--disable-accelerated-2d-canvas  ditto
--use-gl=swiftshader            ditto
--enable-unsafe-swiftshader     ditto
```

**THE FOUR THAT MATTER AND WHY:**
- `--user-data-dir=<derived>` — the measured leak. 12 chrome processes for 3 instances came
  from a fixed path in the teardown and a different one at launch.
- `--remote-debugging-port=<cdp>` — the capture path that CANNOT raise the window.
- `--disable-gpu*` + `--use-gl=swiftshader` — the surface is a software compositor; a GPU
  path inside it is a crash, not a speedup.
- `--app=<url>` — the IDE has its own window, so the operator's window-switcher shows it
  as ONE window, not a tab inside another app.

---

## §7F · THE MEMORY BUDGET — measured, and stated honestly

```
MEASURED 2026-10-26, ONE instance, attributed by port/profile/instance:
  chrome (the --app instance)         553.0 MB   11 processes
  weston + Xwayland + shell           102.8 MB
  station :9741                        50.2 MB
  rail :9754                           47.5 MB
  ───────────────────────────────────────────
  ONE INSTANCE                        753.5 MB

  SEVEN INSTANCES                  5,274 MB  ← DOES NOT FIT a 2 GB phone
```

**THIS IS THE MEASURED TRUTH AND IT IS A REAL CONSTRAINT, NOT A SURPRISE.** The browser is
74% of an instance. The three options, in order of honesty:

```
1  RUN THE FULL SET ON A WORKSTATION    5.3 GB of RAM for 7 instances. This host has
                                         more than that. ZERO code change.
2  SWAP THE RENDERER                    WebKitGTK renders the SAME unchanged page at
                                         188.6 MB (MEASURED, and the frame was OPENED
                                         and read: the real IDE, pixel-identical UI).
                                         7 × 188.6 = 1,320 MB. A 60% cut, and the UI
                                         is provably the same page.
3  RUN FEWER CONCURRENT INSTANCES       the design supports N; N is the operator's choice.
```

**THE DESIGN DOES NOT PICK ONE. It measures and reports.** `pinebox status --json` returns
the measured PSS of every instance and the projected total for the requested count, and the
operator decides. **A tool that silently chose would be making the operator's RAM decision
for him, and the operator's explicit instruction is that the scope and the tradeoffs are his.**

---

## §7G · THE EVIDENCE THE DESIGN CITES

```
651 lines      scripts/pv-server.py (wc -l)
319 lines      pine-ide/pine-station/server.mjs
533 lines      pine-ide/pine-ide/vil-rail.mjs
 84 lines      scripts/pv-load.mjs
 80 lines      scripts/pv-ide.sh
 13 / 4        config read-sites / distinct files reading the config
:11-16         pine.html's dashboardConfig block
:46            server.mjs's PINE_STATION_PORT read
:52            vil-rail.mjs's PLUTUS_VIL_PORT read
:29            pv-server.py's port argv
:23            pv-load.mjs's CDP /json/list fetch
:69            pv-ide.sh's hardcoded port block
:163          run.mjs's polyline COUNT-not-emit
12 / 3         chrome processes per instance, measured
553.0 MB       one chrome --app instance, PSS
188.6 MB       WebKitGTK on the same page, PSS
34,690,000+    the bytes the operator's desktop carried before the cleanup
```

**A BLUEPRINT THAT QUOTES NUMBERS IT DID NOT MEASURE IS A DESIGN THAT CONTRADICTS THE
THING IT DESCRIBES, AND IT WILL BE DISCOVERED ONLY AFTER THE BUILD.**

---

## §18 · SUMMARY

**PINEBOX is computer-use v2.0 with the Pine IDE as its default application layer, and it
adds exactly one plane: the application layer, which is the three existing services plus
the unchanged page, bound to a port block derived from `--id` and to a serve-time rewrite of
the one config block the page already reads — so seven agents each get their own station,
rail, server, browser, terminal and state root with zero shared resources, zero spillover
and zero edits under `pine-ide/`, while the operator keeps seven real windows on their
screen that they can click into or ignore, and the agent drives them with window-scoped
input and CDP capture that provably never raises a window; and the same core exports as a
CLI, an OMP extension and an MCP server, so the identical Pine IDE can be handed to an
agent in a container, a cloud box, a Cloudflare Worker or a web-agent runtime.**


---

## §19 · AMENDMENTS — what the rebuild MEASURED against this blueprint (2026-10-26)

### B-A1 · THE PAGE HAS TWO CONFIG GLOBALS (§0 FACT 1, §5, §7D — "the port block is the ONLY seam")

```
MECHANISM  pine-ide/ide/renderer/tabs/pineshell.js:103,147 - "var cfg = window.PlutusPineShellConfig || {};"
           then :151 "railBases: cfg.railBases || undefined". PlutusPineShellConfig is READ at 3 sites
           and DEFINED NOWHERE in the renderer. With it undefined the engine falls to
           pine-ide/pine-ide/gate.mjs:21 DEFAULT_RAIL_BASES = [the canonical rail], so EVERY instance
           would use instance 0's rail.
MEASURED   RUN_FAILED VIL_RAIL_DOWN "no VIL rail answered on <the canonical rail>" on instance 1,
           whose own rail was up on its own port.
FIX        inject.py defines window.PlutusPineShellConfig = {"railBases":[<this instance's rail>]} in
           the SERVED bytes beside the dashboardConfig rewrite; readerUrl is left unset because
           pineshell.js:106 derives it from railBases[0]. dashboardConfig itself carries exactly the
           four keys of §7D. B10 now asserts BOTH globals in the served bytes.
           `git diff HEAD -- pine-ide/` stays EMPTY (B1).
```

### B-A2 · scripts/pv-load.mjs HARDCODED THE PAGE URL, not just the CDP port (§7G "pv-load.mjs:23")

Line 26 matched `":9851/pine.html"`: parametrising the CDP port alone still found no tab for any
instance but the canonical one. Both now come from `PV_CDP_PORT` / `PV_SERVER_PORT` (unset = the
original behaviour). The file is under scripts/, not pine-ide/.

### B-A3 · THE LEAK INVARIANT IS "NO GROWTH", NOT "≤5" (§12 P13)

§12 requires ≤5 chrome processes per instance after 3 loads; §7F of the same document measures
**11** for one `--app` chrome. MEASURED: 11 after `up`, 11 after each of 3 loads (12 → 11 on
another run). The invariant enforced is "the count after 3 loads ≤ the count before", and every
browser pid is recorded by the core, so teardown kills by recorded group, never by pattern.

### B-A4 · IDS RUN 0..9, AND ID 0 IS THE OPERATOR'S (§4, §8)

With stride 10 and `ws = server + 80`, id ≥ 10 puts one instance's station on another's server, so
`BAD_ID` above 9. The canonical block (9741/9754/9851/9222) is the operator's own IDE: on this host
`:9851` is held by a live `pv-server.py` (pid 1271332, not this tool's), and `up --id 0` REFUSES
`PORT_TAKEN` without starting anything. The seven-instance gate therefore runs ids 1..7.

### B-A5 · INPUTS ARE VALIDATED BEFORE ANYTHING STARTS (§6)

`pb_preflight` (fixture, engine, config block) runs before stage 1: an instance with a wrong
input starts NO compositor (measured: `compositors=0 stations=0` for FIXTURE_ABSENT,
CONFIG_BLOCK_ABSENT). A failed `up` after stage 1 tears down everything it started.

### B-A6 · THE STAGE-5 ACCEPTANCE SOURCE (§6 stage 5, "the chart is not blank")

`plutus-vision-v2.pine` (mtime 2026-10-25) bakes OCTOBER timestamps (1791144000000 = 2026-10-04 …
2026-10-25) while every bar fixture ends 2026-07-21; its geometry can never overlap those bars, and
pv-load.mjs:66-67 frames to the geometry's extent (Jun 26 → Oct 25), which the chart clamps to a
ONE-HOUR window pinned at the last bar: an empty chart. That is a data pairing in the operator's
tree, not PINEBOX. (An earlier theory — the newest E1 zone file — was MEASURED WRONG and its
machinery removed.) Stage-5 acceptance uses `test/fixtures/ema-ribbon.pine`: 508 bars, 6 drawn
objects (2 plots, 4 markers), candles + both EMAs + 4 triangles in the OPENED frame, on a replica
AND on the operator's real desktop.

### B-A7 · READINESS PREDICATES (§6 stage 2)

A service is up when it ANSWERS (any HTTP status); only the PAGE needs a 200. Requiring a 200 from
the rail's `/` reported a live, listening rail as DOWN.

### B-A8 · NOT DONE

§7A's KNOWN GAP — `run.mjs:163` counting and discarding polylines/linefills/tables, so the E2
day-chain is invisible — is a change under `pine-ide/pine-station/` and the renderer's draw path.
It conflicts with B1 inside the PINEBOX commit and needs the renderer's consumption read first. It
is NOT done (`counts.polylines: 0` in every load).

### B-A9 · WHERE EACH MEASURED FIX LIVES (anchors re-measured by `grep -n` at commit time)

| amendment | the code | anchor |
|---|---|---|
| the port block, ids 0..9 | `pb_ports_json()` (the ONLY file allowed to contain the base numbers; B2 proves it) | `scripts/pinebox/ports.sh:21` |
| a LISTEN row is a held port, owner or not | `pb_port_holder()` / `pb_claim()` | `scripts/pinebox/ports.sh:36`, `scripts/pinebox/ports.sh:44` |
| inputs validated before anything starts (B-A5) | `pb_preflight()`, called by `pb_up()` | `scripts/pinebox/stages/services.sh:34`, `scripts/pinebox/pinebox:124` |
| the station probe is the WORK route, not `GET /` | `pb_station_compiles()` | `scripts/pinebox/stages/services.sh:18` |
| a service is up when it ANSWERS (B-A7) | `pb_http_answers()` | `scripts/pinebox/stages/services.sh:30` |
| B10: the SERVED bytes name this instance's ports, both globals (B-A1) | the `CONFIG_NOT_INJECTED` refusals | `scripts/pinebox/stages/services.sh:86` |
| the browser is spawned THROUGH the core, so its group is recorded | `stage_page()` | `scripts/pinebox/stages/page.sh:18` |
| the frame is a CDP capture, refused when blank | `stage_frame()` | `scripts/pinebox/stages/page.sh:57` |
| stage 5 reuses pv-load with the instance's CDP and server ports (B-A2) | `stage_load()` | `scripts/pinebox/stages/load.sh:16` |
| the verb table both forwarders read | `drive` row, `drive_action` | `scripts/pinebox/actions.json:34` |
| measured PSS; an unreadable process is named, never counted as 0 (B-A4/A5) | `pb_pss_group()` | `scripts/pinebox/pinebox:179` |
| the five stages in order, tearing down what a failed `up` started | `pb_up()` | `scripts/pinebox/pinebox:112` |
| the inherited core's C3 identity check | `c3_check()` | `~/.omp/agent/extensions/computer-use-v2/core/govern.sh:125` |
| release+lower in one flush, verified (CU A-2) | the adapter's release block | `~/.omp/agent/extensions/computer-use-v2/core/adapters/weston-x11.sh:111` |
| a LISTEN row is held (CU A-5) | `port_listening()` | `~/.omp/agent/extensions/computer-use-v2/core/lib.sh:155` |
| `view` raises only with `--confirm` (CU A-4) | `VIEW_UNCONFIRMED` | `~/.omp/agent/extensions/computer-use-v2/core/cli.sh:216` |
