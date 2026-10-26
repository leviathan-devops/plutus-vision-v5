# DESIGN BLUEPRINT — computer-use v2 + PINEBOX v3 · THE FULL DESKTOP-CONTROL EXPANSION

**Status:** SPEC (next phase). The shipped v2 is what stands today; this document is what replaces its
verb surface. It is written so a fresh agent can build it without re-deriving anything.

**THE OPERATOR'S MISSION, VERBATIM**
> "the tool itself should have an action to paste the full pine script into the actual code box that
> renders in on the chart and press run ... navigate the chart ... switch between the back testing tab
> and the pine ide ... change the assets ... change the time frame to zoom out to resize ... open and
> close all of the widgets ... play the back testing, increase the speed, slow it down ... both of them
> should also have a screenshot function, a verification function, a vision in the loop ..."

> "it's impossible for them to fuck up the tasks because the tools are so idiot proof, so
> straightforward, so precisely engineered, that it's like the only possible way they could fuck up is
> if they don't use the tool."

**THE DESIGN LAW THIS PHASE IS BUILT ON**

A verb either DOES the thing and returns the evidence that it happened, or REFUSES with a token that
names the missing precondition. There is no third outcome — no "probably", no narration, no count that
stands in for a pixel. Where an agent could take a wrong turn, the verb makes the wrong turn
UNREACHABLE rather than detectable:

| the wrong turn | how v2 handles it | how v3 makes it unreachable |
|---|---|---|
| report a render without looking | a `verify` that can pass on counts | `verify` ATTACHES the frame inline and refuses `NO_FRESH_FRAME` if the bytes did not change |
| read an indicator on the wrong week | nothing (measured live: W29 on W28 bars) | `up` SETS the week from the fixture; `verify` refuses `WEEK_MISMATCH` |
| pick the surface with no window | refused only when a display answers | already unreachable (`VNC_NEEDS_NO_DISPLAY`) |
| drive the operator's screen | `OPERATOR_DISPLAY` | unchanged, and it fires BEFORE binding |
| claim "it works" from a blank frame | `FRAME_BLANK` | `FRAME_BLANK` + `NO_DRAWINGS` + the inline image |

**THE VERB SURFACE — 13 today, 31 after. Grouped so an agent picks a DOMAIN, never a knob.**

Design rule: a verb is a USER INTENT ("run this script and show me"), never an implementation step
("set the textarea value, dispatch input, click run"). The tool owns the multi-step choreography; the
agent names the outcome. That is what keeps the surface small while the capability grows.

### A · LIFECYCLE (today: up, down, list, status, ports)
| verb | does | refuses |
|---|---|---|
| `up --id N [--week W] [--asset A] [--tf T] [--pine F]` | one call: shell + services + page + week + frame + (optional) load | `INSTANCE_LIVE` `PORT_TAKEN` `FIXTURE_ABSENT` `CONFIG_BLOCK_ABSENT` `WEEK_SET_FAILED` |
| `down --id N \| --all` | scoped teardown by recorded | `TEARDOWN_INCOMPLETE` |
| `list` / `status` / `ports` | inventory; `status` carries measured PSS and names an unreadable process | `NOT_UP` |
| **`spawn --id N [--cmd …]`** | a NEW instance (the operator's "spawn another shell") | `INSTANCE_LIVE` |
| **`attach --id N`** | re-open a PERSISTENT instance and return its live state (ports, week, frame sha) — the "retrieve a persistent shell" verb | `NOT_UP` |

### B · SCRIPT (the operator's first ask)
| verb | does | refuses |
|---|---|---|
| **`run --id N --pine F [--asset A] [--tf T]`** | paste the source into the IDE editor, press RUN, wait for the run to settle, capture, return `{bars, onChart, counts, frame}` | `PINE_ABSENT` `PINE_COMPILE_FAILED` `NO_DRAWINGS` `NO_BARS` |
| **`insert --id N --pine F`** | paste WITHOUT running (so an agent can edit before running) | `PINE_ABSENT` |
| **`editor --id N [--get \| --set TEXT]`** | read or write the editor buffer as TEXT | `EDITOR_ABSENT` |

`run` subsumes today's `load`; `load` stays as an alias for one release so old callers keep working.

### C · TABS (today: none — the operator's "switch to the back testing tab")
| verb | does | refuses |
|---|---|---|
| **`tab --id N --to pine\|backtest`** | click the tab, WAIT for its pane to be visible, verify the active tab, capture | `TAB_NOT_FOUND` `TAB_SWITCH_FAILED` |
| **`tab --id N --get`** | the active tab + the tab list that exists | — |

The tab strip is `PINE IDE | BACKTEST` (`pine-ide/ide/renderer/pine.html`). The active-tab predicate is
the pane's own visibility, not the button's class — a button can be styled active while the pane is not.

### D · CHART (the operator's "navigate the chart like TV MCP")
Ported from `tv-browser-mcp-v4` (`tv_canvas_pan`, `tv_canvas_zoom`, `tv_scroll`, `tv_drag`, `tv_reset`,
`tv_get_view`), adapted to this canvas.

| verb | does | refuses |
|---|---|---|
| **`chart --id N --pan DX,DY`** | drag the canvas (a real pointer drag, which is what the canvas listens for) | `CANVAS_ABSENT` |
| **`chart --id N --zoom IN\|OUT [--at X,Y]`** | wheel/trackpad zoom about a point | `CANVAS_ABSENT` `ZOOM_NO_EFFECT` |
| **`chart --id N --fit`** | frame all loaded bars (the "I cannot see anything" fix) | `NO_BARS` |
| **`chart --id N --view`** | the visible range as `{from, to, minPrice, maxPrice}` | `CANVAS_ABSENT` |
| **`chart --id N --resize WxH`** | the pane's size (a layout change, then re-frame) | `RESIZE_FAILED` |

`ZOOM_NO_EFFECT` is the anti-theatre token: after the gesture, the visible range must have CHANGED; a
zoom that leaves the range identical is refused, so an agent cannot claim navigation it did not do.

### E · DATA AXES (today: `--week` at up only)
| verb | does | refuses |
|---|---|---|
| **`week --set LBL \| --get`** | (exists) the `.pine-week` control | `WEEK_SET_FAILED` |
| **`asset --set SYM \| --get`** | the instrument selector (DXY, EURUSD, …) | `ASSET_SET_FAILED` `ASSET_ABSENT` |
| **`tf --set TF \| --get`** | 1m · 5m · 15m · 1H · 4H · 1D… | `TF_SET_FAILED` |

Each `--set` RE-READS the control after setting it: a selector that silently ignored the input is
`*_SET_FAILED`, never a success.

### F · WIDGETS (the operator's "open and close all of the widgets")
| verb | does | refuses |
|---|---|---|
| **`widget --id N --list`** | every toggleable pane/widget with its state | — |
| **`widget --id N --open NAME` / `--close NAME`** | toggle it, then VERIFY the pane's visibility | `WIDGET_NOT_FOUND` `WIDGET_STATE_UNCHANGED` |

`WIDGET_STATE_UNCHANGED` exists because a toggle that does nothing is indistinguishable from a toggle
that worked — unless the state is read back.

### G · BACKTEST (the operator's play/pause/speed; ported from `tv_replay_*`)
| verb | does | refuses |
|---|---|---|
| **`backtest --id N --play \| --pause \| --step [N]`** | replay control | `BACKTEST_TAB_INACTIVE` |
| **`backtest --id N --speed X`** | playback rate | `SPEED_SET_FAILED` |
| **`backtest --id N --date YYYY-MM-DD`** | seek the replay date | `DATE_SET_FAILED` `DATE_OUT_OF_RANGE` |

Every one of these refuses `BACKTEST_TAB_INACTIVE` if the Backtest tab is not the active pane — so an
agent cannot send replay commands into the IDE tab and report progress.

### H · VISION (the operator: "built into the tool, impossible to be retarded")
| verb | does |
|---|---|
| **`look --id N [--out F]`** | capture and return the frame AS AN IMAGE PART in the tool result — the agent's own context receives the pixels, so "looking" is the default path, not an extra step |
| **`verify --id N`** | (exists) the predicate set: `RAIL_DOWN · STATION_DOWN · PORTS_MISMATCH · WEEK_MISMATCH · NO_BARS · NO_DRAWINGS · FRAME_BLANK · NO_FRESH_FRAME`, plus the inline frame |

Both tools get `look`. `computer look` captures the instance's window; `pinebox look` captures the IDE
over CDP. The difference between the two is only the capture channel; the contract is identical: the
image rides in the RESULT, and a claim without a fresh frame is refused.

### I · WHAT IS DELIBERATELY NOT PORTED FROM TV MCP (44 tools → 0 of these)
`tv_paper_buy/sell/positions`, `mt5_*` — trading operations, not IDE control; belong to a trading tool.
`tv_draw_*` (fib, rectangle, trend line, positions), `tv_select_tool`, `tv_open_drawing_settings*`,
`tv_list_drawings`, `tv_select_drawing` — DRAWING tools. The operator flagged these as "more for the
backtesting tab"; they are phase 3, and only if drawing is actually wanted.
`tv_find_element`, `tv_find_price_y`, `tv_find_y_price`, `tv_refine_element_coordinates`,
`tv_find_empty_area`, `tv_open_flyout`, `tv_browser_container`, `tv_browser_desktop`, `tv_navigate*` —
those exist because TradingView is a third-party page that must be discovered; THIS IDE is our own page
with known seams, so a selector table replaces them. That is the whole reason the port is "half of it".
`tv_evaluate` — becomes an internal primitive (the CDP path already exists), never an agent-facing verb:
an agent with `evaluate` can type any lie into a page.

**THE SEAM TABLE (discovered from the live DOM, not guessed)**
| seam | selector | status |
|---|---|---|
| the week control | `input.pine-week` | DISCOVERED (driven by `week --set`, proven) |
| the editor buffer | the editor's textarea/contenteditable | TO DISCOVER (phase 1) |
| the RUN button | `[data-act='run']` (the renderer's own act attribute) | TO VERIFY |
| AUTO re-run toggle | `[data-act='auto']` (120 ms; must be OFF for a deterministic capture) | TO VERIFY |
| the tab strip | `PINE IDE` / `BACKTEST` buttons | TO DISCOVER |
| widget toggles | the pane headers | TO DISCOVER |

A verb whose seam is not in this table does not ship: a guessed selector is the "cat vs _cat" class of
failure (a name that looks right and resolves to nothing).

**PHASES**
- **P1 · script + vision (highest value, smallest surface):** `run`, `insert`, `editor`, `look` on both
  tools, and the inline-image contract. This alone makes "paste the script, run it, look at it" one call each.
- **P2 · navigation:** `tab`, `chart` (pan/zoom/fit/view/resize), `asset`, `tf`, `widget`.
- **P3 · backtest:** `backtest` play/pause/step/speed/date, gated on `BACKTEST_TAB_INACTIVE`.
- **P4 · drawing** (only if wanted): the `tv_draw_*` subset.

**ACCEPTANCE (per verb, the must-fail first)**
Every new verb ships with: (1) a must-fail case that violates its precondition and MUST print its token
with rc=1; (2) a legitimate case that prints JSON with rc=0; (3) for anything visual, a `look` whose
frame is OPENED and read. A verb without all three is not merged — the gate chain refuses it.

**WHAT THIS DOES NOT FIX (be honest)**
The E2 geometry is still discarded at `pine-ide/pine-station/run.mjs:163`; no amount of navigation makes
a polyline appear that the station never emits. `plutus-vision-v2.pine` bakes October geometry against
fixtures ending July. And the audit gate is BLOCKED on `OCR_MISSING`, so nothing here can be called
ship-ready until that lane is repaired.

## WHERE EACH SEAM AND GATE LIVES (anchors measured with grep -n at spec time)

| what | anchor |
|---|---|
| the week control's setter (proven) | `scripts/pinebox/stages/verify.sh:25` |
| the week gate (WEEK_MISMATCH) | `scripts/pinebox/stages/verify.sh:11` |
| the stale-frame gate (NO_FRESH_FRAME) | `scripts/pinebox/stages/verify.sh:80` |
| the stage order that P1 will extend | `scripts/pinebox/pinebox:147` |
| the port block every new verb must respect | `scripts/pinebox/ports.sh:21` |
| the served-page rewrite both config globals | `scripts/pinebox/inject.py:68` |
| the verb table a new verb is added to | `scripts/pinebox/actions.json:209` |
| the CLI dispatch a new verb is wired into | `scripts/pinebox/pinebox:340` |
| the core's drive verbs the chart verbs will extend | `/home/leviathan/.omp/agent/extensions/computer-use-v2/core/drive.sh:177` |
| the CDP client every DOM verb goes through | `/home/leviathan/.omp/agent/extensions/computer-use-v2/core/actions.json:38` |
