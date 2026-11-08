# DESIGN BLUEPRINT — THE AGENT DESK v3 · computer-use v2 + PINEBOX, CAD-grade

**What is being manufactured:** a two-tool runtime that lets a text-only agent operate its own Linux
desktop and a self-hosted Pine IDE — spawn shells, paste and run a Pine script, switch tabs, navigate
and resize a canvas, change the week/asset/timeframe, toggle widgets, drive the backtest, and *see* the
result — such that a careless agent cannot produce a wrong answer without the tool refusing first.

**Revision table (provenance — every row is an operator correction that changed the design)**

| # | the operator's words | what it changed |
|---|---|---|
| R1 | "it should just not fucking rip the primary focus" | C3 became a per-run behavioural refusal, not a table cell |
| R2 | "why are you using VNC … I need a headed window on my screen" | `weston-x11` is the default; vnc refuses when a display answers (`VNC_NEEDS_NO_DISPLAY`) |
| R3 | "the indicator is rendered and it's on the wrong fucking week" | the week became a first-class control, set by `up`, checked by `verify` (`WEEK_MISMATCH`) |
| R4 | "there should be an action to insert the pine script and render it" | `run` / `insert` / `editor` verbs (P1) |
| R5 | "switch to the back testing tab … navigate the chart … open and close widgets … speed it down" | the `tab` / `chart` / `widget` / `backtest` domains (P2–P3) |
| R6 | "build the vision into the tools so it's impossible for the agent to be retarded" | `look` returns the frame INLINE; `verify` refuses `NO_FRESH_FRAME` |
| R7 | "keep it lightweight … not 65 fucking actions" | 31 verbs grouped by DOMAIN; the agent names an intent, never a knob |

---

# §0 · THE CONSTRAINT, AND THE SPLIT IT FORCES

**THE ONE PHYSICAL LAW**

> **THE AGENT HAS NO EYES AND NO HANDS EXCEPT WHAT THE TOOL RETURNS.**
> Its entire sensorium is the tool result. Anything not in that string did not happen, and anything it
> *says* it saw is narration — including when it is right.

This is not a preference about UX. It is the binding constraint, and it is measurable: the model receives
tokenised text plus image parts, and nothing else. A capture written to `/tmp/frame.png` and a path
printed in prose is **invisible** to the agent that must judge the render.

**THE SPLIT IT FORCES — three consequences, each of which shaped a plane**

```
CONSTRAINT: the result IS the sensorium
   │
   ├─ 1 · PIXELS MUST RIDE IN THE RESULT, not beside it.
   │      → every capture verb returns an image part in the same tool result (§6).
   │      → a capture that only prints a path is a verb that produces blindness, and is refused.
   │
   ├─ 2 · A GESTURE IS UNPROVEN UNTIL THE STATE IS READ BACK.
   │      → pan/zoom/toggle/set verbs must re-read the state they changed, and refuse when it did not
   │        change: ZOOM_NO_EFFECT · WIDGET_STATE_UNCHANGED · WEEK_SET_FAILED · SPEED_SET_FAILED (§7).
   │      → a dispatch that "succeeded" with no state delta is indistinguishable from a no-op.
   │
   └─ 3 · AN UNANSWERABLE QUESTION MUST REFUSE, NOT GUESS.
          → every verb declares the preconditions it cannot satisfy and returns a TOKEN (§7's table).
          → the refusal is the only channel that survives a careless agent: it cannot be narrated away,
            and it names its own remedy.
```

**THE SECOND LAW (a constraint on the artefact, not the agent)**

> **THE IDE IS FROZEN:** `git diff HEAD -- pine-ide/` must stay empty. The renderer and the station are
> not ours to edit on this path.

The split it forces: the only levers are (a) the **served bytes** — rewritten at request time for the
configuration the page reads — and (b) the **DOM** at runtime. So configuration is a serve-time rewrite
(`inject.py`), and every control is driven through the page's own elements. A verb that would need a
renderer change is out of scope by construction, and says so.

**WHAT THE CONSTRAINT KILLS (designs that would have looked complete)**

- A `screenshot --save PATH` verb with no inline image: the agent reports on a file it never decoded.
- A `zoom` verb that returns `{"ok":true}`: the gesture is asserted, the range unread.
- A `verify` that returns counts (`boxes:5`): geometry was CREATED; whether the pixels are correct is
  unasked. Counts are captured, but the verdict requires the opened frame (§8).
- A tab switch that returns after clicking: a button can be styled active while its pane is not visible.

---

# §1 · THE STACK — five planes, ONE dependency direction

```
  L4  VERIFY      verify / look            the gates; the only plane that may say WORKS
        ▲
  L3  DRIVE       tab · chart · widget ·   gestures + state read-back (the hands)
                  backtest · week · asset
        ▲
  L2  SURFACE     run · insert · editor    the IDE as an app: script in, pixels out
        ▲
  L1  COMPUTE     the station (PineTS)     bars + the drawing counts
        ▲
  L0  DATA        fixtures/bars/<week>     the bars; the only source of truth for prices
```

| plane | consumes | produces | owner | when absent |
|---|---|---|---|---|
| **L0 DATA** | a fixture file for a week | bars for one (asset, tf) | the repo | `FIXTURE_ABSENT` — nothing starts |
| **L1 COMPUTE** | bars + the script | drawing counts + geometry | the station | `STATION_DOWN` — `verify` refuses; `up` records it |
| **L2 SURFACE** | the script + the served page | a rendered frame | the page (frozen) | `PAGE_UNREADABLE` / `CONFIG_BLOCK_ABSENT` |
| **L3 DRIVE** | a target element + a gesture | a CHANGED state, read back | the tool | `*_SET_FAILED` / `*_NO_EFFECT` |
| **L4 VERIFY** | the frame + the record | `WORKS` or a refusal token | the tool | it cannot be absent: `verify` IS the gate |

**No arrow points down.** L4 never mutates; L3 never reads pixels to decide; L2 never fetches bars; L1
never touches the DOM; L0 never knows a tool exists. That single direction is what makes each plane
independently testable, and it is why a new verb is an L3 addition that cannot break L0–L2.

---

# §2 · THE MACRO ARCHITECTURE IT REUSES

The shipped v2 already implements this shape for the primitive verbs, so v3 is an **extension of the same
skeleton**, not a new system:

```
computer (per instance id N)                      pinebox (the app layer, inherits the core whole)
  probe → runtime(L1) → surface adapter(L2)         ports ← derived from --id
  drive: focus/click/type/key/screenshot(L3)        stages: preflight → services → page → frame → load → verify
  govern: c3_check + the refusal ledger(L4)         inject: the served page rewritten for BOTH config globals
```

The one action table (`core/actions.json`) is read by the CLI, the OMP extension and the MCP server, so a
new verb is added once and appears on all three surfaces. That is the property v3 must not break.

---

# §3 · THE PROCESS IT PRESERVES

The old loop, before these tools, was: *an agent guesses at a chart it cannot see, then narrates a
verdict.* It produced: renders on the wrong week, a "working" indicator drawing nothing, a rail down
while the face was described as live, and five consecutive reports of a focus theft the agent could not
observe.

**What is preserved:** the operator still says "open pinebox, run the indicator, look at it" — the same
sentence, in the same order. Nothing about the workflow is redesigned.

**What changes:** each of those four steps becomes ONE verb that either does the thing and returns the
evidence (`run` → counts + frame; `look` → the image inline) or refuses by name. The agent is not asked
to be more careful; it is given no way to answer "does it work?" from anything except a frame it received.

---

# §4 · L0 — THE DATA PLANE

| field | value |
|---|---|
| source | `fixtures/bars/<week>.json` (one file per week) |
| consumed by | L1 only — nothing else may read a price |
| invariant | the file's own first/last bar dates are the ONLY authority on which week is loaded |
| failure | `FIXTURE_ABSENT` before any process starts (`pb_preflight`) |

**The invariant that matters:** the week is derived from the BARS, never from a label. The measured
defect was a label reading `2026-W29` over bars dated to ISO week 28. So:

```
week_label(fixture) = ISO-8601 week of the fixture's first bar date      ← computed, never stored
```

`pb_iso_week` (`scripts/pinebox/stages/verify.sh`) computes it; `up` writes it into the IDE's control;
`verify` compares the control against it. Three places, one source.

---

# §5 · L1 — THE COMPUTE PLANE (the station)

| field | value |
|---|---|
| consumes | `{script, pair, timeframe, limit}` + the fixture the server was started with |
| produces | `{success, counts:{boxes,labels,lines,table,polylines,linefills}, bars, onChart}` |
| invariant | `success:true` on `POST /run` is the ONLY proof the station is usable — a listening socket is not |
| failure | `STATION_DOWN` (verify) · `PINE_COMPILE_FAILED` (run) · `NO_DRAWINGS` when onChart = 0 |

**The measured lie this plane must never repeat:** the station reports `boxes:5` while the chart draws
nothing (the render is async, and counts are emitted at compile). So a count is EVIDENCE OF GEOMETRY
CREATED, never of pixels. §8 is the plane that settles it, and it never trusts this one.

**Known gap carried forward:** `run.mjs:163` counts `polylines` / `linefills` / `tables` and discards
their geometry, so the E2 day-chain is invisible on every load (`counts.polylines: 0`). That is a
renderer-side fix, outside this blueprint's frozen-page rule, and it is stated here so no reader assumes
the absence is a vendored chart limitation.

---

# §6 · L2 — THE SURFACE PLANE (the page)

| field | value |
|---|---|
| consumes | the script text + the served page (both config globals rewritten) |
| produces | a frame — the pixels the whole design exists to bring back |
| invariant | the served bytes name THIS instance's `apiBase`, `pineStation` and `railBases` |
| failure | `CONFIG_BLOCK_ABSENT` · `PORTS_MISMATCH` · `PAGE_UNREADABLE` · `WINDOW_NOT_MAPPED` |

The page is frozen (§0, second law). Configuration reaches it only through `inject.py`, which rewrites
`window.dashboardConfig` and `window.PlutusPineShellConfig` **in the response**, never on disk. The
measured reason the second global matters: it is read at `tabs/pineshell.js:103,147` and defined nowhere,
so without the rewrite every instance silently uses instance 0's rail.

**Contract:** a capture is produced by `Page.captureScreenshot` over CDP — in-process, so it cannot raise
a window (this is why the browser path is CDP and never X input).

---

# §7 · L3 — THE DRIVE PLANE (the hands)

**THE LAW OF THIS PLANE: A GESTURE IS UNPROVEN UNTIL THE STATE IT CHANGED IS READ BACK.**
Every `--set` / `--pan` / `--zoom` / `--open` returns the state it read AFTER acting, and refuses when
that state did not change. This is the mechanism that makes "I clicked it" impossible to confuse with
"it happened".

### The verb surface — 31, grouped by DOMAIN

| domain | verbs | each refuses with |
|---|---|---|
| **lifecycle** | `up` · `down` · `list` · `status` · `ports` · `spawn` · `attach` | `INSTANCE_LIVE` `PORT_TAKEN` `NOT_UP` `TEARDOWN_INCOMPLETE` `FIXTURE_ABSENT` `CONFIG_BLOCK_ABSENT` |
| **script** | `run` · `insert` · `editor` | `PINE_ABSENT` `PINE_COMPILE_FAILED` `NO_DRAWINGS` `NO_BARS` `EDITOR_ABSENT` |
| **tabs** | `tab --to pine\|backtest` · `tab --get` | `TAB_NOT_FOUND` `TAB_SWITCH_FAILED` |
| **chart** | `chart --pan DX,DY` · `--zoom IN\|OUT [--at X,Y]` · `--fit` · `--view` · `--resize WxH` | `CANVAS_ABSENT` `ZOOM_NO_EFFECT` `RESIZE_FAILED` |
| **axes** | `week` · `asset` · `tf` | `WEEK_SET_FAILED` `ASSET_SET_FAILED` `TF_SET_FAILED` `ASSET_ABSENT` |
| **widgets** | `widget --list` · `--open NAME` · `--close NAME` | `WIDGET_NOT_FOUND` `WIDGET_STATE_UNCHANGED` |
| **backtest** | `backtest --play\|--pause\|--step [N]` · `--speed X` · `--date D` | `BACKTEST_TAB_INACTIVE` `SPEED_SET_FAILED` `DATE_SET_FAILED` `DATE_OUT_OF_RANGE` |
| **vision** | `look` · `verify` (exists) | `CAPTURE_FAILED` `FRAME_BLANK` `NO_FRESH_FRAME` `WEEK_MISMATCH` `RAIL_DOWN` `STATION_DOWN` `PORTS_MISMATCH` |
| **the fence** | `activate` (always) | `ACTIVATE_FORBIDDEN` |

### The three anti-theatre tokens, and why each exists

| token | the lie it kills |
|---|---|
| `ZOOM_NO_EFFECT` | "I zoomed out" when the visible range is identical before and after — a wheel event on a canvas that ignores it |
| `WIDGET_STATE_UNCHANGED` | "I opened the widget" when the pane's visibility did not change — a toggle that silently no-ops |
| `BACKTEST_TAB_INACTIVE` | replay commands sent into the IDE tab, reported as backtest progress |

### Guards that fire in a fixed order (so the caller never gets the wrong reason)

```
1  the id is well formed            → BAD_ID / MISSING_ID
2  the instance exists and is live  → NOT_UP
3  the DISPLAY belongs to us        → OPERATOR_DISPLAY     (before any window is touched)
4  a client window is bound         → NO_WINDOW_BOUND / WINDOW_GONE
5  the domain precondition holds    → TAB_NOT_FOUND / CANVAS_ABSENT / BACKTEST_TAB_INACTIVE
6  the gesture is dispatched
7  the state is re-read             → *_NO_EFFECT / *_SET_FAILED
```

Measured reason for the order: with the fence checked at step 4, a click aimed at the operator's display
reported `NO_WINDOW_BOUND` — true but useless, because the real answer was `OPERATOR_DISPLAY`.

---

# §8 · L4 — THE VERIFY PLANE (the only plane that may say WORKS)

`verify --id N` runs the full predicate set and returns one JSON verdict with an evidence row per check.
It is the ONLY verb permitted to emit a success verdict about a render.

| check | refuses |
|---|---|
| rail answers (the rooms/face) | `RAIL_DOWN` |
| station compiles (`POST /run`) | `STATION_DOWN` |
| served bytes name this instance | `PORTS_MISMATCH` |
| the IDE's week control == the bars' ISO week | `WEEK_MISMATCH` |
| bars > 0 | `NO_BARS` |
| onChart > 0 | `NO_DRAWINGS` |
| the frame has > 1 colour | `FRAME_BLANK` |
| the frame is not byte-identical to the last one | `NO_FRESH_FRAME` |

**`look` is the sensorium's delivery mechanism:** it returns the frame as an IMAGE PART in the same tool
result. This is the constraint from §0 made mechanical — the agent cannot claim a render it did not
receive, because the only thing it receives is the image.

**Honest status of `NO_FRESH_FRAME`:** its positive side is proven (a re-render yields a new sha); its
must-fail side was intercepted by `WEEK_MISMATCH` before reaching the frame check and has NOT been
re-proven. It is specified here, not claimed as verified.

---

# §9 · THE DEGRADATION CONTRACT — every dependency, and what the system does without it

The rule: **degrade to a named, reduced, honest state — or refuse loudly. Never assume a dependency.**

| dependency absent | the system does | the agent sees |
|---|---|---|
| **the rail** (the rooms/face) | `up` still completes and RECORDS `rail: down`; `verify` REFUSES | `RAIL_DOWN` — an instance without rooms cannot be called working |
| **the station** | nothing starts; preflight refuses before a process is spawned | `STATION_DOWN` / `ENGINE_ABSENT` |
| **the server / the page** | `up` refuses and tears down what it started | `SERVICE_DOWN:server` / `PAGE_UNREADABLE` |
| **the config block in the page** | the request returns 500; the unrewritten page is NEVER served | `CONFIG_BLOCK_ABSENT` |
| **a display** (a cloud host) | `weston-vnc` becomes the only reachable surface, and serves the frame on a port | the instance exists with no host window; `view` returns the port |
| **the CDP port** | X-path capture only, for non-browser windows; a dead CDP refuses rather than silently switching | `NO_PAGE` (names the port and the targets it saw) |
| **`jq` / `bun` / `gcc` / `convert`** | the verb that needs it refuses; no verb pretends | `NO_JQ` `NO_STATE` `HELPERS_UNAVAILABLE` `NO_IMAGE_CHECK` |
| **a guest image** | the guest runtime refuses; the native path is never substituted for it | `GUEST_IMAGE_ABSENT` |
| **the audit lane (`ocr`)** | every ship-ready claim is withheld and recorded BLOCKED | `AUDIT GATE: BLOCKED` in the ship docs |

**The one degradation this design REFUSES to allow:** a surface that renders no window on a host that has
a display. That is not a degradation, it is the product being deleted — so `weston-vnc` refuses
`VNC_NEEDS_NO_DISPLAY` when a display answers.

---

# §10 · THE DELIVERY — how the two tools reach the agent

| option | mechanism | verdict |
|---|---|---|
| **A · OMP extension** (chosen) | `~/.omp/agent/extensions/{computer-use-v2,pinebox}/index.ts` registers tools that forward to the CLI, and attaches the frame as an image part | the only path that puts the pixels IN the agent's context |
| **B · MCP server** | `mcp/server.mjs` per tool, stdio JSON-RPC, same action table | kept: it is how a foreign runtime (web agent, another harness) reaches the same core |
| **C · CLI on PATH** | `computer` and `pinebox` | kept: it is the implementation, and the surface every gate runs against |
| **D · the model calls the IDE directly** | — | IMPOSSIBLE by §0: the agent has no browser, no eyes, and would receive no pixels |

All three live paths read ONE action table (`core/actions.json`), so a verb added once appears on all
three, and a bug fixed in the CLI is fixed everywhere. That is the property that keeps 31 verbs from
becoming 93 implementations.

---

# §11 · THE LEARN LOOP — how the tool gets better without a session remembering

```
a refusal happens  →  it is appended to <state>/refusals.jsonl AND the ship-doc ledger
                  →  the token is the row key, so "which refusals recur" is a query, not a memory
                  →  a recurring token is a SPEC GAP: either the verb's precondition is wrong, or the
                     caller needs a new verb. The token names which.
                  →  the fix lands as a verb change + a must-fail case in its acceptance set
```

Measured instance: `WEEK_MISMATCH` firing on a *correct* instance (an empty week control) was not a caller
error — it exposed that `up` had to set the week. The refusal led to a design change, which is the loop
working. The counter-case is a refusal nobody queries, which is why the ledger is written by the tool and
not by the agent.

---

# §12 · ANTI-PATTERNS, EACH WITH A MECHANICAL DETECTOR

A gate that cannot fail is documentation; a risk without a detector is a wish. Every row names the
defect class, the detector that catches it, and the token it prints.

| # | the defect the build will produce | the detector (mechanical) | token |
|---|---|---|---|
| A1 | a raise/activate/focus primitive creeps into `core/` | `test/strings.sh` greps for `windowactivate\|windowfocus\|wmctrl -a\|ontop\|windowraise` outside the refusal line | `FOCUS_STEAL_CREPT_IN` |
| A2 | the raise SURFACE widens (a second call to the helper's raise verb) | A1b: exactly ONE `hostwin … raise` may exist, in the weston-x11 adapter | `RAISE_SURFACE_WIDENED` |
| A3 | a hardcoded display | grep `DISPLAY=:[0-9]` in `core/` | `HARDCODED_DISPLAY` |
| A4 | a compositor named outside its adapter | grep `weston` in `core/*.sh` | `COMPOSITOR_OUTSIDE_ADAPTER` |
| A5 | a refusing helper substituted in `$()` without `\|\| exit $?` | `test/subshell-exit.sh` COMPUTES the refusing-function set transitively | `SUBSHELL_EXIT_LEAK` |
| A6 | a probe that accepts its own failure as evidence | every adapter's probe must FAIL when its command fails (fake-binary probe) | `DEAD_PROBE` (by per-adapter must-fail) |
| A7 | a scoped-store file edited | `test/cmp-guard.sh` compares all 7 against the boilerplate | `SCOPED_FILE_EDITED` |
| A8 | the app layer edited under the frozen page | `git diff HEAD --stat -- pine-ide/` must be empty | `PINE_IDE_EDITED` |
| A9 | a hardcoded port outside the block | grep the four base numbers, `ports.sh` excepted | `HARDCODED_PORT_OUTSIDE_BLOCK` |
| A10 | a generated artifact in the source tree | find `__pycache__` / `*.pyc` | `GENERATED_ARTIFACT_IN_TREE` |
| A11 | a verb that claims success without a state delta | every `--set`/`--pan`/`--zoom`/`--toggle` re-reads and refuses | `ZOOM_NO_EFFECT` `WIDGET_STATE_UNCHANGED` `WEEK_SET_FAILED` |
| A12 | a render claimed from a stale or absent frame | `verify` captures fresh and compares the sha | `NO_FRESH_FRAME` `FRAME_BLANK` |
| A13 | an indicator read on the wrong week | the week control vs the bars' ISO week | `WEEK_MISMATCH` |
| A14 | a page talking to another instance | the served bytes must name this instance's apiBase/station/rail | `PORTS_MISMATCH` |
| A15 | a leak left by a test or a run | `test/leak-check.sh` as the last gate of every chain | `RIG_LEFTOVER` `LEAK` |
| A16 | a deploy that drifted from its seal | `deploy.sh verify` re-hashes 63 sealed files + helper shas | `DEPLOY_DRIFT` `HELPER_STALE` |
| A17 | a doc padded to hit a floor | the pre-commit W-9 floor (lines AND anchors) | `REJECT(W-9)` |
| A18 | a prevention written as advice | `gates/blueprint-gate.sh` refuses a design missing any mandatory section | `BLUEPRINT_INCOMPLETE` |
| A19 | a phase sized by a duration instead of an exit criterion | the same gate greps for duration phrasing | `BLUEPRINT_TIME_ESTIMATE` |

**A18/A19 are new in v3 and are the reason this document can be trusted:** the design is now checkable by
a script, so the next session cannot quietly produce a blueprint that is missing its risk register.

---

# §13 · THE BUILD SEQUENCE — every exit can fail

| phase | builds | EXIT (a check that can fail) |
|---|---|---|
| **P0 · floor** | the seam table completed by DOM discovery (editor buffer, RUN, AUTO, tab strip, widget headers) | every seam resolves in a live page, or the phase FAILS and the verb is not written |
| **P1 · script + vision** | `run` · `insert` · `editor` · `look` (both tools) with the inline-image contract | `run` on `test/fixtures/ema-ribbon.pine` returns `onChart > 0` AND `look` returns an image part whose opened pixels show candles + both EMAs + 4 markers |
| **P2 · navigation** | `tab` · `chart` (pan/zoom/fit/view/resize) · `asset` · `tf` · `widget` | each verb's must-fail prints its token; each legitimate case CHANGES the state it reports; `tab --get` names the pane that is visible, not the button that is styled |
| **P3 · backtest** | `backtest` play/pause/step/speed/date | every one refuses `BACKTEST_TAB_INACTIVE` while the IDE tab is active, and the speed change is READ BACK |
| **P4 · drawing** | the `tv_draw_*` subset — ONLY if drawing is wanted | a drawn object appears in `chart --view` and in the opened frame |
| **P5 · harness** | both tools under the same refusal discipline; the abuse matrix extended per verb | the adversarial matrix runs every verb with a declared expectation, and a verb without a must-fail case fails the chain |

**P1 is the phase that matters.** Everything the operator named in R6 ("impossible for the agent to be
retarded") is delivered there: paste, run, and the pixels arrive in the result in one call each.

---

# §14 · WHAT IT INHERITS FROM v2 (stated precisely)

| inherited | why it must not change |
|---|---|
| the C3 check (`c3_check`, identity-based, per 30 ms sample) | it is the only mechanism that proved 0 thefts in 60 runs |
| the interposer (`nofocus.c`: user_time 0 + BELOW before map) | the root cause lives in weston's map, not in our code |
| `hostwin release` (remove-BELOW + restack + attention, ONE flush) | releasing alone raises the window; the ordering is measured |
| the rejection of `weston-vnc` when a display answers | AP-25: the surface must not delete the product |
| the scoped store (7 verbatim files) | the isolation proof, and `cmp`-guardable |
| the one action table for all three surfaces | 31 verbs must not become 93 implementations |
| the refusal ledger | the learn loop (§11) reads it |

---

# §15 · THE FILE LAYOUT

```
~/.omp/agent/extensions/computer-use-v2/       the tool (v2, extended)
  core/{lib,govern,probe,runtime,surface,drive,terminal,state,cli}.sh
  core/adapters/{weston-x11,weston-vnc,xvfb,existing}.sh
  core/cdp.mjs · core/actions.json            the CDP client · the ONE verb table
  helpers/{nofocus.c,hostwin.c,build.sh}      the interposer · the window controller
  mcp/server.mjs · index.ts                   the two forwarders
  test/{run,strings,mutate,c3-no-raise,isolation,mcp,leak-check,adversarial}.sh
  deploy.sh · MANIFEST.sha256                 seal / install / verify
scripts/pinebox/                              the app layer (v3 grows here)
  pinebox · ports.sh · inject.py · actions.json
  stages/{services,page,load,verify}.sh       P1-P3 add: script.sh · nav.sh · backtest.sh
  mcp/server.mjs · test/*
design/DESIGN_BLUEPRINT_AGENT_DESK_v3.md      this document
gates/blueprint-gate.sh                       A18/A19's detector
```

---

# §16 · THE RISK REGISTER

| sev | risk | mitigation | what would falsify the mitigation |
|---|---|---|---|
| CRIT | the seam table is guessed, not discovered, so a verb drives a selector that resolves to nothing | P0's exit is DOM discovery; no verb ships before its seam resolves live | a verb whose must-fail token is `TAB_NOT_FOUND` on a page that HAS tabs |
| CRIT | a "success" verb that changes nothing (the ZOOM_NO_EFFECT class) reaches the agent | every gesture re-reads its state and refuses on no-delta | a pan that reports ok with an identical `chart --view` range |
| CRIT | the agent claims a render from a frame it never received | `look` returns the image inline; `verify` refuses on a stale sha | a WORKS verdict with no image part in the result |
| HIGH | the frozen page forces a need for a renderer change (e.g. the E2 geometry) | out of scope by §0; the gap is named in §5 so no reader assumes it is vendored | a load whose `counts.polylines` is 0 while the design claims chains |
| HIGH | the week/asset/tf controls are `<input>`s that ignore programmatic sets | `*_SET_FAILED` on read-back | a set that returns the new value while the chart is unchanged |
| HIGH | P3's backtest verbs fire into the IDE tab | `BACKTEST_TAB_INACTIVE` gate on every backtest verb | a replay command that returns ok with the IDE tab visible |
| MED | the surface count grows past what an agent can hold (the "65 actions" fear) | domains, not knobs: 31 verbs, each an intent | an agent asking "which of these 3 zoom variants do I use" |
| MED | `NO_FRESH_FRAME` stays unproven and is cited as verified | recorded as unproven here and in PACKAGE_AUDIT | the term "proven" appearing beside it in any doc |
| MED | the audit lane (`ocr`) stays broken so nothing is ship-ready | the gate records BLOCKED and withholds the claim | a ship-ready claim with no `sg-ocr-*.json` |
| LOW | the replica range collides with another agent's display | `:200–:230`, and `replica.sh down` refuses foreign displays | a `:9x` socket in a leak-check run |

---

# SUMMARY — the design in one breath

The agent has no eyes and no hands except what the tool returns, so every verb either performs the act
and returns the evidence — the frame as an image part, the state read back after the gesture — or refuses
with a token that names the missing precondition; the IDE is frozen, so configuration is a serve-time
rewrite and control is DOM-driven; the surface is chosen by contract, never by convenience; and the five
planes (data → compute → surface → drive → verify) point one way, so `verify` is the only thing that may
say WORKS, and a careless agent's only reachable outcome is a refusal that tells it what to do next.

---

## WHERE EACH CONTRACT IS ENFORCED TODAY (anchors measured with grep -n at commit time)

| contract | anchor |
|---|---|
| one action table for all three surfaces | `scripts/pinebox/actions.json:209` |
| the port block every verb must respect | `scripts/pinebox/ports.sh:21` |
| the degradation preflight (nothing starts on bad input) | `scripts/pinebox/stages/services.sh:34` |
| the week predicate (WEEK_MISMATCH) | `scripts/pinebox/stages/verify.sh:11` |
| the stale-frame predicate (NO_FRESH_FRAME) | `scripts/pinebox/stages/verify.sh:80` |
| the gate that keeps THIS document checkable (A18/A19) | `gates/blueprint-gate.sh:4` |
| A18/A19 wired into the chain | `scripts/pinebox/test/run.sh:28` |
