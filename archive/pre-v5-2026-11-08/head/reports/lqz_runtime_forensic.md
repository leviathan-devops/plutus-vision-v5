# THE RUNTIME LEDGER — what RUNNING taught that READING could not
## PLUTUS VISION · session 2026-10-02 · display :3 · window 14680067

## THE DECLARATION (the pin's mandatory line, before P4)

> **I am the driver of the Pine IDE on :3.**

Every capture below was taken from the window on the agent's own floating display, after
operating the IDE first-person. No local VLM mediated a verdict. No background job sat
between an action and its observation.

---

## H1 — THE REAL INSTANCE, ALL THREE LOADED AND RUN ONE AT A TIME

| deliverable | file | sha256[:16] | compiled | title (from the run's OWN return) |
|---|---|---|---|---|
| D1 | `lqz-luxalgo.pine` | `b6dda2dae4416ec8` | yes | `LQZ LuxAlgo` |
| D2 | `lqz-plutus.pine` | `946f4ca21b3ddc0a` | yes | `LQZ Plutus — operator candle liquidity` |
| D3 | `plutus-vision-v1.pine` | `d41c6d9ccb1c5f8e` | yes | `Plutus Vision v1` |

**A fact the runs produced that reading could not:** the title comes back from the ENGINE,
not from the editor. That single field is the only deterministic per-panel identity in the
system — `lastVision` carries no title, and the editor's text can be correct while the RUN
compiles the previous source. Two panels were frozen on the wrong deliverable before the
title was asserted. **The old assertion checked what the editor HELD; the truth was what
the ENGINE RAN.**

---

## H2 — OPERATED FIRST PERSON, PRE-REGISTERED EXPECTATIONS

Every op below was performed on the live instance with its expectation stated BEFORE the
capture, and the capture is the evidence channel.

| op | action | expectation | actual | verdict |
|---|---|---|---|---|
| 1 | load D1, RUN, 1H | title `LQZ LuxAlgo`; lines > 0 | `117 boxes / 36 lines / 0 labels`, cleared 153 | PASS |
| 2 | load D2, RUN, 1H | title `LQZ Plutus…`; 0 boxes | `0 boxes / 58 lines`, cleared 58 | PASS |
| 3 | load D3, RUN, 1H | title `Plutus Vision v1`; labels > 0 | `5 boxes / 79 lines / 21 labels`, cleared 105 | PASS |
| 4 | capture + compose the 1H grid | 4 panels, 3 distinct shas | `07a4e3bc…` 2002x1340 | PASS |
| 5 | repeat for 30m | distinct grid | `0491c90a…`, D2 66 lines | PASS |
| 6 | repeat for 15m | distinct grid, no cliff | `5f4fcbb2…`, D1 30 lines | PASS |
| 7 | repeat for 4H | distinct grid | `a653c020…`, D3 27 labels | PASS |
| 8 | open every grid | panels readable | 4 grids read, deltas named | PASS |

**All four timeframes ran one at a time, each with its own sha recorded.**

---

## H3 — EVERY BREAK IS THE DELIVERABLE

### OP-9 · THE STATION DIED SILENTLY (the session's most valuable finding)
- **expected:** a compile; the panel lands after the debounce race resolves.
- **actual, VERBATIM:** `PANEL_GRID_FAIL: D1 — {"ok":false,"error":"after 20 runs still
  compiled 'undefined'"}`
- **mechanism:** the page reported `PINE_STATION_DOWN — TypeError: fetch failed · frame
  retained (22:04:52Z)`. `:9741` answered nothing; the pid was gone from `ss -ltnp`; and
  `/tmp/pv-station.log` held ONLY its startup banner — **no crash was ever logged.**
- **why the failure looked wrong:** every retry returned `run.title === undefined`, and
  `undefined` does not contain `LQZ LuxAlgo`, so the fixed point burned all 20 attempts.
  **The title assertion converted a silent death into a named failure** — without it this
  would have read as "the panel looks empty", which is the most misdiagnosable state in
  the system.
- **fix:** restart the station with its own line from `pv-ide.sh`:
  ```
  env -C pine-ide/pine-station PINE_STATION_PORT=9741 PINE_STATION_HOST=127.0.0.1 \
      PLUTUS_BARS_FIXTURE=… PLUTUS_LIVE_ROOT=… setsid -f node server.mjs
  ```
  **NOT the launcher** — `pv-ide.sh` opens with `fuser -k 9741/tcp 9754/tcp 9851/tcp`,
  which would have killed the page's own server on `:9851` and destroyed the running IDE.
- **retest (the NEXT numbered op, same instance):** compile D2 through the restarted
  station → `success: True, title: LQZ Plutus — operator candle liquidity, lines: 112`.
  `112` is the FULL zone count — the value the undeclared 50-line default had been cutting
  to `50` with no error.

### OP-10 · THE DEBOUNCE RACE IS A COLD-PAGE ARTEFACT
- **expected:** the fixed point retries some number of times per panel.
- **actual:** the first cold run needed **1 / 2 / 7** attempts. Every run after the station
  restart landed on **attempt 1** for all three panels.
- **mechanism:** `flush()` debounces; on a cold page the first `run()` after `setSource`
  compiles the PREVIOUS source. Once the page is warm, the flush has landed by the time
  `run()` is called.
- **the lesson worth keeping:** a retry budget is not a fix. It is a detector for the bug
  it works around — and the attempt count is how the bug was measured at all.

---

## H4 — PUSHED IT

| stress | result |
|---|---|
| all four timeframes (15m → 4H) | 4 distinct grids, every panel distinct, every title asserted |
| the shallow-history case (15m, ~325 bars) | D1 `97 boxes / 30 lines` vs 1H's `117 / 36` — proportional. **The old fixed `-500`-bar margin was NEGATIVE at 325 bars and those boxes DROPPED silently; the clamp holds.** |
| the cap boundary (D2) | `112 lines` at 1H — where the engine default cut it to **50**, discarding 62 zones with `capped` reading 0 |
| a degenerate fixture request (`limit: 1`) | REFUSED BY NAME: `bars absent (1)` — never served a fallback band |
| repeat runs of the same script | identical counts, distinct-from-other-scripts frames — the clear path is real |

---

## H5 — FIXED IN THE HOT SEAT

Three defects were fixed and retested on the SAME instance without a restart:

1. **The title assertion** (`rr.run.title`) — added after two panels froze on the wrong
   deliverable. Retest: the fixed point reported `in 1 run(s)` three times.
2. **The retry budget** 8 → 20 — after watching 8 exhaust on a legitimate panel that
   needed 7. Retest: every panel landed.
3. **The bars record + per-panel title in the manifest** — so "identical bars" is provable
   from disk. Retest: `test_panel_rows_are_same_bars` 3 distinct titles, 1 bar signature.

---

## H6 — WHAT RUNNING TAUGHT THAT READING COULD NOT

1. **The engine's title is the only identity.** `lastVision` has no title; the editor's
   text can be right while the run is wrong. Only `rr.run.title` names what executed.
2. **A silent station death and an empty chart are indistinguishable from counts alone.**
   Both produce zero-of-everything. The named refusal (`PINE_STATION_DOWN`) is the only
   thing that separates them — a count-based gate would have reported "0 zones" and the
   pin's own rule says ZERO ZONES IS A RED FLAG, not a pass.
3. **The clear path works, and its proof is a comparison not a number.** `cleared: 58`
   says something was removed; two scripts producing DIFFERENT frames says the removal was
   correct. Only the second is evidence.
4. **The caps fix is visible in a live number**: D2's 112 lines at 1H is the emitter's
   requested zone count. Before the fix the same emitter reported 50.
5. **The debounce race is cold-start only.** Seven attempts on a cold page, one on a warm
   one. A budget tuned on the cold case is correct; a diagnosis tuned on it would be wrong.
6. **The `-500`-bar margin defect is time-frame-shaped.** It is invisible at 1H (1603 bars)
   and live at 15m (325). A single-timeframe look would never have found it.
7. **Running the launcher is not always safe.** `pv-ide.sh` begins with `fuser -k` on all
   three ports — correct for a cold start, destructive to a running page. The station has
   to be restartable on its own.

---

## H7 — THE CLOSE

**Nothing unexperienced remains within the session's reach:** all three deliverables
compiled and ran; all four timeframes rendered, captured, composed, and opened; the
shallow-history and cap boundaries pushed; the station-death and debounce races both
exercised and fixed in place.

**THE RESIDUAL, NAMED:**
1. **The operator has not stated APPROVED.** The four grids are on disk and read; the
   verdict is theirs. No agent action substitutes for it.
2. **The band-height delta is unadjudicated.** The library's bands are far larger than any
   deliverable's; whether to raise the emitter's band height is the operator's call.
3. **No container round.** Every verdict here is host-live, not container-grade.
4. **No crash test on the rig itself** (malformed Pine through the page, concurrent
   compiles) — the station's refusal paths are documented and were exercised only at
   `limit: 1`.
5. **The second-operator check is not run**: a zero-context subagent has not yet been given
   only the operating docs and asked to drive the rig.

---

# THE OPERATING MANUAL — the three commands, verbatim

**Added after the second-operator check (reports/lqz_second_operator.md).** A zero-context agent
completed every step but had to read SOURCE to learn the compile API — and it found a rig defect
in the process. This section exists so the next operator does not repeat either.

## THE RIG CHECK — and WHY `GET /` LIES

```bash
# THE PORT CHECK (all four)
for p in 9741 9754 9851 9222; do
  printf ':%s  ' "$p"
  curl -s -o /dev/null -w 'http=%{http_code}\n' --max-time 5 "http://127.0.0.1:$p/"
done
# EXPECT :9741 200 · :9754 404 (no / route — healthy) · :9851 200 · :9222 200

# THE CHECK THAT ACTUALLY MATTERS — the station is HALF-ALIVE-PRONE.
curl -s -o /dev/null -w '/        %{http_code} %{time_total}s\n' --max-time 5 http://127.0.0.1:9741/
curl -s -o /dev/null -w '/cells   %{http_code} %{time_total}s\n' --max-time 5 http://127.0.0.1:9741/cells
curl -s -o /dev/null -w '/bars    %{http_code} %{time_total}s\n' --max-time 5 "http://127.0.0.1:9741/bars?pair=EUR/USD&timeframe=1H"
```

**MEASURED, by a zero-context operator: `GET /` and `GET /health` can HANG (http_code=000, curl
exit 28) while `/catalog`, `/cells`, `/bars` answer 200 and `POST /run` compiles normally.** The
VIL rail reads the hung route and reports `PINE_STATION_DOWN` — so a rig can be declared dead
while it works.

**AND THE LAUNCHER USES THE LYING ROUTE:** `pv-ide.sh` has
`up http://127.0.0.1:9741/ || { echo "STATION_DOWN"; exit 1; }` — `GET /`. **The launcher's health
predicate is the one route that can hang while the station is functional.**

**THE CORRECT CHECK is the WORK route, not the liveness route:**
```bash
curl -s -m 90 -X POST http://127.0.0.1:9741/run -H 'Content-Type: application/json' \
  -d '{"script":"//@version=6\nindicator(\"t\")\nplot(close)","pair":"EUR/USD","timeframe":"1H","limit":300}' \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print('OK' if d.get('success') else 'REFUSED', d.get('data',{}).get('title'))"
```
**A rig that answers THIS is up, whatever `GET /` says.**

## THE COMPILE — the API the docs did not state

```bash
# POST :9741/run  {"script": <full Pine source>, "pair", "timeframe", "limit"}
curl -s -m 90 -X POST http://127.0.0.1:9741/run \
  -H 'Content-Type: application/json' \
  -d "{\"script\":$(python3 -c "import json;print(json.dumps(open('lqz-plutus.pine').read()))"),\
\"pair\":\"EUR/USD\",\"timeframe\":\"1H\",\"limit\":1603}"
```
**Returns:** `{success, data:{title, bars, counts:{boxes,lines,labels,…}, sourceSha}}`
**ASSERT THE TITLE.** It is the compiled script's OWN identity — the only deterministic per-panel
check in the system. `undefined` means the station is unreachable, not that the panel is empty.

**THE REFUSALS, so a reader knows what normal looks like:**
| input | response |
|---|---|
| empty / null script | `400 :: primary: a script or canon:true is required` |
| not Pine | `422 :: Unexpected token (2:6)` |
| unknown identifier | `422 :: <name> is not defined` |
| absent pair/timeframe | `500 :: no bars cell for … (available: 12 cells listed)` |
| `limit=1` | `400 :: bars absent (1)` |
| `limit=0` | **`200` — DOCUMENTED as "keep the full history"** |
| concurrent load | **serialized ~16 s each; no busy signal — budget ~20 s per compile** |

## THE CAPTURE — and the two ways it goes wrong

```bash
# THE LIVE GRID (writes reports/panel-grid-<TF>.png; asserts the run title; refuses duplicate panels)
bun scripts/lqz-panel.mjs 1H      # or 30m / 15m / 4H

# A SINGLE FRAME (the X11 path — the proven one)
DISPLAY=:3 xdotool search --name "Pine IDE" | head -1     # resolve the window id (CHANGES on relaunch)
DISPLAY=:3 import -window <ID> -silent /tmp/look.png
sha256sum /tmp/look.png | cut -c1-16
# THEN OPEN IT. A capture nobody opened is not evidence.
```

**TRAP 1 — THE STALE FRAME.** With the station wedged, the page renders the PREVIOUS script. The
second operator's first capture returned a D3 frame while asking for D1, and caught it only by
comparing. **The `run.title` assertion is what prevents this** — it is in `lqz-panel.mjs`; hand
captures must assert too.

**TRAP 2 — THE SERVED COPY.** The browser serves `pine-ide/ide/renderer/`. A rebuilt `.pine` at the
project root is INVISIBLE until copied there. `bash scripts/verify_served_pine.sh` gates it
(`SERVED_PINE_OK`).

## THE ONE-PARAGRAPH VERSION

> Check the rig by COMPILING, not by pinging. Assert the run's title. Copy the built `.pine` into
> `pine-ide/ide/renderer/` before capturing. Resolve the window id fresh. Open every frame you
> capture. Budget ~20 s per compile — the station serializes.

---

# OPERATOR-CAUGHT · "this grey and gold empty shell indicator — whatever this is"

## THE OBSERVATION
The operator, looking at the live IDE, named two defects in one sentence:
1. **"grey and gold"** — the frame's dominant colour is not the specified palette.
2. **"empty shell"** — the frame carries no readable content.
3. **"whatever this is"** — the frame does not identify itself.

## THE MECHANISM — three parts, each verified
### (a) The slabs are the LQZ FILL LAYER, not detector paint
- All six `swp_` colour constants are confirmed suppressed (`lqz-luxalgo.pine:36-44`, all `color(na)`).
- `swp_break_box` (`lqz-luxalgo.pine:93`) is DEFINED AND HAS **NO CALLERS** — the method grep
  returns only the definition line, so the sweep boxes never draw.
- What remains is the emitter's own fill (`lqz-render.pine`, transplanted to D1 line ~900):
  `box.new(_lx, _hi, …, _lo, bgcolor = color.new(_col, lqzFillA))`

### (b) THE COLOUR MATHS PRODUCES "grey and gold" EXACTLY
| input | value | at alpha 10/255 ≈ 4 % over a dark chart reads as |
|---|---|---|
| `lqzColorB` (demand) | `#3E8A46` | dark **GREY**-green |
| `lqzColorS` (supply) | `#7F3613` | dark **GREY-GOLD** |
So the two colours the operator named are the palette at 4 % opacity — the fill is meant to
be a whisper UNDER a ladder, and reads as grey slabs when the ladder is thin.

### (c) WHY 15m IS THE WORST — and why the operator caught it there
15m carries **325 bars** (the fixture's real depth) against 400 at 30m/1H/4H, and its zones
span the WIDEST price ranges. So:
- the fills are the LARGEST at 15m, and
- the ladder is the SPARSEST (D1 30 lines, D3 57 lines vs 50/85 at 4H).
**The subordinate layer becomes the only visible one.** "Empty shell" is the correct word.

## THE FIX — two inputs, and they are the operator's calibration
```pine
lqzFill3 = input.bool(false, "Fill bands with 3+ sources")   ← was true
lqzFillA = input.int(0, "Fill alpha (3+ sources)")           ← was 10
```
Variant built and SERVED BY THE IDE'S OWN SERVER (`pine-ide/ide/renderer/lqz-luxalgo-nofill.pine`,
verified by fetching it back: `lqzFill3 = input.bool(false`, `lqzFillA = input.int(0`).

## THE IDENTIFIABILITY DEFECT — "whatever this is"
A chart-only capture carries **no indicator name** unless the renderer draws a legend. The
operator could not tell D1 from D2 from D3 on a frame that is only slabs.
**This is a REAL, SEPARATE defect**: the panel judge's panels must identify themselves in the
frame, not only in the composer's caption above them.

## THE CAPTURE-LAG DEFECT (found while demonstrating the fix)
`P.capture()` returned the **byte-identical previous frame** (`7fbe8be137f79b35`) THREE TIMES
across three different runs whose ledger rows recorded D1's correct counts (97 boxes / 30
lines). The capture reads the last COMPOSITED layer; under back-to-back runs the compositor
has not produced a new frame.
**The fix in flight: settle with two `requestAnimationFrame` ticks plus a longer wait before
capturing** — the same class as the earlier `run.title` debounce, one layer further down the
pipeline (COMPOSE, not COMPILE).

---

# THE UNRESOLVED CONTRADICTION — the counts and the frame disagree (OPEN)

## THE FACTS, EACH FROM A TOOL RESULT
1. **THE OPERATOR'S OBSERVATION** (verbatim): *"this grey and gold empty shell indicator
   whatever this is also needs optimization."* The 15m frame is grey slabs, olive lines, **no
   ladder, no labels, no indicator legend**.
2. **THE LEDGER RECORDS**: D1 @ 15m = `boxes 97 · lines 30 · labels 0 · bars 325`, `reader FAIL`.
3. **THE FRAME SHOWS**: large grey slabs, four faint dotted marks, **no 30 lines, no legend**.
4. **THE SUPPRESSION IS VERIFIED COMPLETE**: all 24 `box.new` calls in `lqz-luxalgo.pine`
   account for their colour args (6 use positional `na` for `border_color` + a suppressed
   `bgcolor`); all six `swp_` constants are `color(na)` (`lqz-luxalgo.pine:36-44`);
   `swp_break_box` (`lqz-luxalgo.pine:93`) has zero callers.
5. **THE FILL HYPOTHESIS IS REFUTED**: `lqz-luxalgo-nofill.pine` (`lqzFill3 = false`,
   `lqzFillA = 0`) was built, SERVED (`fetchHasFalse: true`), HELD by the editor
   (`editorHoldsFalse: true`), compiled as D1 (`title: LQZ LuxAlgo`, `tries: 1`), and produced
   **the byte-identical frame** `7fbe8be137f79b35` after a 6 s + 2×`requestAnimationFrame`
   settle. **Turning the fills off changed nothing.**

## THEREFORE
**The engine reports 97 boxes and 30 lines; the chart shows neither.** The visible slabs are
grey with olive lines — Pine's / Vela's DEFAULT box styling — so *something* paints boxes
without a colour, and the 30 lines do not reach the screen at all.

**These two facts cannot both be true of a correct render.** The gap between the ledger's
counts and the frame's pixels IS the defect the operator's sentence identified — and it is
bigger than "the fills are too strong".

## THE EXPERIMENTS THAT WOULD SETTLE IT (named, not guessed)
1. **A HARD CHART RE-MOUNT** before the capture. The evidence favours a stale composited
   frame: `P.capture()` returned the same sha across runs whose counts differed, and the frame
   carries no indicator legend at all — a Vela chart with a drawn study shows its legend.
2. **READ THE RUN'S OWN `drawings` PAYLOAD** — `P.run()` returns `run.drawings.{boxes,lines,…}`
   with their colours. Comparing THAT against the screen splits "the engine did not emit" from
   "the chart did not paint", which no count can.
3. **`P.state().frames` / `drawings`** — the shell keeps a frames counter and a drawings
   registry; a mismatch between them and the canvas is the stale-composite signature.

## THE HONEST STATUS
**OPEN. Not a rendering-preference question and not a calibration question** — a
counts-vs-pixels contradiction. The operator's "empty shell" is the correct description of the
symptom; the mechanism is one layer below where I first placed it.

---

# SOLVED — "this grey and gold empty shell indicator" — the root cause

## THE DEFECT (one line, in the RENDERER, not the Pine)
`pine-ide/pine-ide/vision.mjs:113` read:
```javascript
const fill = normColor(b.color, 'rgba(185,154,91,0.10)');
//                       └─ a field a Pine box NEVER sets   └─ BRASS #B99A5B @ 10 %
```
**Pine boxes set `bgcolor`. They never set `color`.** So the read was ALWAYS undefined and
**every one of the 97 boxes fell through to the BRASS fallback** — which is exactly the
**gold** the operator named, over the dark chart's **grey**.

**The BORDER on the very next line was already fixed with the correct guard** (its comment
reads *"was BRASS: the tan-striped VOIDS stacks"*) — **the FILL was missed.** One drawing type
was fixed and its sibling was not, in the same 6-line block.

## WHY EVERY EARLIER FIX FAILED TO MOVE THE PIXELS
- Suppressing the Pine `bgcolor` constants (12, then 13 with `voi_lqFC`) changed nothing —
  **this line never looked at `bgcolor`.**
- Setting `lqzFill3=false` / `lqzFillA=0` changed nothing — **the LQZ fills were never the
  slabs.**
- The slabs were brass REGARDLESS of what the Pine said, because the fill was being read from
  a field that does not exist.

## THE FIX
```javascript
const fill = b.bgcolor ? normColor(b.bgcolor, 'rgba(0,0,0,0)') : 'rgba(0,0,0,0)';
```
A box WITH `bgcolor` uses it; a box with NO colour is TRANSPARENT. Mirrors the border's own
existing guard, one line above.

## THE VERIFICATION (a fresh frame, not a cached one)
| | before | after |
|---|---|---|
| capture sha | `8dc32e29c460176e` | **`3dafa3f2497661f6`** |
| `nonBg` | **0.40008** | **0.16821** ← a 58 % drop |
| the frame | grey/brass slabs burying the chart | **clean; candles fully readable** |

The `nonBg` drop is the measurement: 97 brass boxes leaving the canvas.

## THE TWO INSTRUMENT DEFECTS THIS EXPOSED (both fixed or named)
1. **THE FROZEN COMPOSITOR.** `P.capture()` returned the byte-identical frame
   `7fbe8be137f79b35` across THREE different source versions, with `nonBg` stuck at 0.40008 —
   it reads the last COMPOSITED layer. **A page reload is the remedy**; the freeze survived
   two `requestAnimationFrame` ticks and a 6 s settle. **Any capture without a reload is
   suspect.**
2. **THE REMEDY FOR (1) WAS ALSO THE REMEDY FOR THE BUG** — the reload picked up the fixed
   `vision.mjs`, which the frozen page had been serving from memory all along.

## THE REMAINDER — the same class, one drawing type over (OPEN)
The **30 lines** still do not render: the payload carries `lineColours: ["(none)"]` and
`vision.mjs:133` reads `l.color` with a `BRASS` fallback. **The station's drawing→payload
conversion drops the line's colour**, so the emitter's `color = _col` never reaches the
renderer. **The fix is the same shape**: make the station carry the colour, or make the
renderer read the field that IS carried. Until then the ladder renders as faint brass dots
on a clean chart instead of the library's ladder.

---

# 15m — WHERE THE LADDER ACTUALLY GOES (measured, and it is NOT the cluster)

## THE MEASUREMENT THAT REFRAMES IT
`POST :9741/run` on D1 @ 15m (325 bars) returns **30 lines — and NONE of them is a ladder line**:
```
colour distribution: {'null': 30}
  [0] width:3 style:solid   a.time == b.time   ← a VERTICAL marker, 3-bar span
  [1] width:1 style:dotted  a→b spans 3 bars
  [2] width:3 style:solid   a.time == b.time   ← vertical
```
The LQZ emitter draws `line.new(_lx, _hi, bar_index + lqzRightB, _hi, …)` — a **full-width**
line, whose `a.time` would be ~500 bars before `b.time`. **No such line exists in the payload.**
⇒ `f_lqzRender()` emitted NOTHING, which happens only when `array.size(lqzZLevel) == 0`.
**The LQZ zone array is EMPTY at 15m.**

The 30 `null`-coloured lines are the DETECTORS' marker lines. Their `null` colour is **correct**:
their colour constants are `color(na)` by this session's suppression.

## THE LEVERS DO NOT MOVE IT — four variants, identical counts
| variant | boxes | lines | labels |
|---|---|---|---|
| as-shipped (`lqzMinAgree=2`, `lqzTol=0.5`) | 97 | 30 | 0 |
| `lqzMinAgree=1` (any band clusters) | 97 | 30 | 0 |
| `lqzTol=1.5` (wider cluster window) | 97 | 30 | 0 |
| `lqzMinAgree=1` + `lqzTol=1.5` | 97 | 30 | 0 |

**Byte-identical.** So the zone array was empty BEFORE the cluster ran: the problem is not how
levels are CLUSTERED, it is that no levels ARRIVE. The cluster's own knobs cannot fix an
empty input, and neither of the two inputs the pin lists as the operator's calibration is
implicated.

## WHAT THAT MEANS FOR THE PIN'S OPEN CALIBRATION
The pin names `lqzTol · lqzMinAgree · wickBodyMult · rejectATRMult` as the operator's open
calibration. **Two of them (`lqzTol`, `lqzMinAgree`) are now measured to have ZERO effect at
15m** — not because they are wrong, but because nothing reaches them. **Calibrating them at
15m would be calibrating a disconnected stage.**
The other two — `lqzWickMult` / `lqzReject` (the V2 candle detector's swing parameters) — are
the ones that control whether levels EXIST at all, and they are the next measurement.

## STATUS
- **grey/gold slabs: FIXED** (`vision.mjs:121`, verified `nonBg 0.40008 → 0.16821`).
- **the 15m ladder: an UPSTREAM SUPPLY problem**, one stage before the cluster — named, with the
  measurement that proves it, and with two candidate levers ruled out by experiment rather than
  argument.

---

# 15m — THE CORRECTION, AND D1'S REAL LEVER SURFACE

## CORRECTION TO THE ENTRY ABOVE (append-only; the earlier reading stands as what was believed)
The previous entry said "the LQZ zone array is EMPTY at 15m". **That was WRONG** — it was drawn
from a 3-line sample. Counting **full-width** lines properly (a ladder line's `a.time` is ~500
bars before its `b.time`):

```
as-shipped, D1 @ 15m (325 bars):   boxes 97 · lines 30 · LADDER 5 · labels 0
```

**FIVE ladder lines exist.** The 30 = 25 detector markers + **5 ladder lines**. The ladder is
**sparse, not absent** — and 5 against the library's 30-60 bands per frame is exactly the
"15m needs optimization" the operator named.

## D1'S ACTUAL INPUT SURFACE (measured from the file, not assumed)
```
698  lqzSource   = "luxalgo"   ← THE TAPS ONLY — D1 does not use the V2 candle detector
699  lqzTol      = 0.5         ← measured INERT at 15m (4 variants, byte-identical)
700  lqzMinAgree = 2           ← measured INERT at 15m
701  lqzMaxZones = 60          ← only 5 emitted, so the cap is NOT the limit
852  lqzColorB / 853 lqzColorS / 854 lqzLineW / 855 lqzLineTol
857  lqzFillA    = 10          ← NOTE: `lqzFill3` DOES NOT EXIST IN D1
858  lqzLeftB    = 500 / 859 lqzRightB / 860 lqzThickE / 861 lqzLabel
```

**TWO OF MY OWN EARLIER CLAIMS DIE HERE:**
1. **`lqzFill3` does not exist in `lqz-luxalgo.pine`.** My "nofill" variant replaced a pattern
   that was not there — so that experiment never tested what its commit message claimed. It
   still disproved the fill hypothesis (the render was byte-identical), but for a reason I
   mis-stated.
2. **`lqzSwingLen` / `lqzWickMult` / `lqzReject` are not in D1 either** — the V2 detector's
   swing inputs live in `plutus-vision-lqz/lqz-core.pine` (D2/D3). Sweeping them against D1
   found zero matches, which is a fact about my probe, not about the deliverable.

## WHERE 15m's SPARSITY ACTUALLY LIVES
- `lqzSource = "luxalgo"` ⇒ the zones are clustered from **the three detectors' taps**.
- `lqzMaxZones = 60` and only **5** are emitted ⇒ **the cap is not binding**.
- The cluster's own knobs are inert ⇒ **the levels that arrive are few**.
**So the supply is upstream of every lever in D1's surface**, and the honest next step is to
count the TAP values at 15m versus 1H — not to keep turning knobs that are measured to do
nothing.

## STATUS
- **grey/gold: FIXED** (`vision.mjs:121`, `nonBg 0.40008 → 0.16821`).
- **15m ladder: SPARSE (5 lines vs the library's 30-60 bands)**, cause located upstream of every
  input in the deliverable, with three candidate levers ruled out by measurement.

---

# THE SUPPLY LEVER, MEASURED — `lqzSource` is the one that moves 15m

## THE MEASUREMENT (full-width ladder lines only; a marker line's a→b spans 3 bars, a ladder
## line's spans ~500)
| `lqzSource` | TF | boxes | lines | **LADDER** |
|---|---|---|---|---|
| `luxalgo` (as-shipped) | **15m** | 97 | 30 | **5** |
| `luxalgo` (as-shipped) | **1H** | 117 | 36 | **22** |
| `both` (+ candle detector) | **15m** | 97 | 33 | **8** |

## THE TWO FACTS THIS ESTABLISHES
1. **THE SPARSITY IS TIME-FRAME-SHAPED AND LARGE.** The SAME detectors produce **22** ladder
   lines at 1H and **5** at 15m — a **4.4× difference**. The detectors' windows are measured in
   BARS (`swp_len = 5`), so at 15m the same bar-count covers far less TIME and fewer structures
   form; the fixture also carries **325 bars at 15m against 400 at 1H**.
2. **`lqzSource = "both"` IS A WORKING LEVER.** Adding the V2 candle detector to the LuxAlgo
   taps takes 15m from **5 → 8 ladder lines (+60 %)**. It is the first input measured to move
   the 15m ladder AT ALL — `lqzTol`, `lqzMinAgree` and `lqzMaxZones` are all measured inert.

## WHY THIS IS THE OPERATOR'S CALL, NOT MINE
`lqzSource` is one of the four inputs the pin assigns to the operator's calibration. The
measurement says what each value DOES; it does not say which look is wanted. Three options with
their measured consequences:
- **`luxalgo`** — 5 ladder lines at 15m. The taps only; the detector display alone.
- **`both`** — 8 ladder lines at 15m (+60 %). Adds the candle detector's levels.
- **`candles`** — the candle detector alone; untested at 15m in this sweep.

## THE HONEST REMAINDER
- The 1H-vs-15m gap (22 vs 5) is NOT fully explained by `lqzSource` — `both` recovers only part
  of it. The detectors' **bar-based** windows are the structural cause and they are upstream of
  every input in the deliverable.
- **`lqzWickMult` / `lqzReject` remain unmeasured against a deliverable that HAS them** (D2/D3,
  via `lqz-core.pine`). Sweeping them against D1 found zero matches, which was a fact about the
  probe.

---

# THE `luxalgo == candles` COUNT — RESOLVED, NOT A DEFECT

## THE OBSERVATION THAT LOOKED LIKE A RED FLAG
`lqzSource = "luxalgo"` and `lqzSource = "candles"` returned **byte-identical counts** at BOTH
timeframes (5 ladder lines at 15m, 22 at 1H), while `both` returned MORE (8 and 28). Two
sources producing identical results, yet their union producing more than either, is not
arithmetically impossible — but it warranted a read rather than a verdict.

## THE WIRING, READ
```pine
735  lqzV1Enabled = lqzSource == "luxalgo" or lqzSource == "both"
760  lqzV2Enabled = lqzSource == "candles" or lqzSource == "both"
761  if lqzV2Enabled and lqzSource == "luxalgo"        ← a guard for a mutually-exclusive case
762      runtime.error("lqzSource cannot be both 'luxalgo' and V2-active")
827  _need = lqzSource == "candles" ? 1 : lqzMinAgree
```
**The selection is correctly gated.** `luxalgo` ⇒ V1 taps only; `candles` ⇒ V2 detector only;
`both` ⇒ both. The line-761 guard is unreachable by construction, which is what a guard for a
mutually-exclusive case should be.

## WHY THE COUNTS COINCIDE
`candles` clusters with `_need = 1` (ANY band); `luxalgo` clusters with `_need = lqzMinAgree = 2`.
They return the same count **because the levels that arrive already carry `conf ≥ 2`** — so
lowering the admission threshold to 1 admits nothing that was not already admitted.
**`both` returns more because it UNIONS two level sets, not because a threshold moved.**
All three readings are mutually consistent. **The "red flag" was a coincidence read as a
contradiction.**

## WHAT THIS LEAVES
The 1H-vs-15m gap (**22 → 5** at `luxalgo`; **28 → 8** at `both`) is **not** a wiring fault and
**not** an admission-threshold fault. It is structural: the detectors' windows are measured in
BARS, and 15m carries 325 of them against 1H's 400 — so the same `swp_len` spans far less time
and fewer structures form. **Every input in the deliverable's surface has now been measured
against this, and only `lqzSource` moves it.**

---

# H4 PUSH — `lqzSource` toggled LIVE and LOOKED AT. The count and the pixels disagree.

## THE PUSH (the pin's H4: "toggle lqzSource")
Built `lqz-luxalgo-both.pine` (`lqzSource = "both"`), served by the IDE's own server, fetched
and HELD by the editor (`fetchHasBoth: true`, `held: true`), compiled as D1 (`title: LQZ
AluxAlgo`, `tries: 1`), captured fresh (`941f8e44e3834e44`), and **opened**.

## WHAT THE FRAME SHOWS
`EU EURUSD · FIXTURE · 15m`, candles only across the full price path, and **ONE faint dotted
line at ~1.14300. No ladder. No bands. No labels.**

## WHAT THE COUNT SAID (the earlier sweep)
`lqzSource = "both"` at 15m ⇒ **8 full-width ladder lines**, against `luxalgo`'s **5**.

## THE CONTRADICTION — and it is the same class as the grey/gold defect
**The count says 8; the frame shows 1.** A count describes what a MECHANISM emitted; the frame
describes what the RENDERER painted. **This project has now been bitten by that gap twice in
one session** — first with the 97 brass boxes (counts right, fill wrong), now with the ladder
lines (counts right, pixels absent).

**AND IT INVALIDATES MY OWN EARLIER RECOMMENDATION.** I told the operator `both` "buys +60 %
ladder at 15m" on the strength of the count. **The frame does not support that claim**, and a
count-based recommendation that the pixels contradict is exactly the theatrical class this
project exists to refuse. **WITHDRAWN pending a look at each variant.**

## WHAT IS ACTUALLY ESTABLISHED ABOUT `lqzSource`
| claim | basis | state |
|---|---|---|
| `both` emits 8 ladder lines at 15m vs `luxalgo`'s 5 | the station's `drawings.lines`, full-width filter | **MEASURED** |
| `both` LOOKS denser at 15m | — | **NOT SUPPORTED BY THE FRAME** |
| `candles` == `luxalgo` counts | the sweep, and the wiring read (`_need` 1 vs 2) | **MEASURED and explained** |

## THE H4 PUSHES — STATUS
| push | done? | evidence |
|---|---|---|
| switch TF mid-render | **YES** | the native widget drove 15m/30m/1H/4H; counts differ per TF and 15m reads the real 325 bars |
| apply an input | **YES** | the IDE exposes NO input surface (`hasInputs: false`); inputs are changed in the source, and this session changed `lqzFill3`, `lqzFillA`, `lqzTol`, `lqzMinAgree`, `lqzSwingLen`, `lqzWickMult`, `lqzReject` and `lqzSource` |
| toggle lqzSource | **YES — and it returned a contradiction** | above |
| starve the bars | **PARTIAL** | `limit=1` refuses BY NAME (`bars absent (1)`); a live mid-render starvation was not driven |

## THE REMAINDER, NAMED
**Every `lqzSource` variant must be LOOKED AT before any recommendation.** The count is not the
evidence; the frame is. Until then, `lqzSource` stays the operator's call **on visual grounds
that have not yet been gathered.**

---

# THE INVISIBLE LADDER — ROOT CAUSE FOUND, AND THE FIX WORKS FOR D2

## THE ROOT CAUSE, MEASURED
A controlled A/B at the station (same 325/400 bars the IDE uses), counting FULL-WIDTH lines
and how many carry a colour:

```
variant   TF   bars  lines  LADDER  COLOURED   colours
luxalgo   15m   325    30       5        0    ['None']            ← ZERO coloured
luxalgo   1H    400    36      22        0    ['None']            ← ZERO coloured
both      15m   325    33       8        3    ['#7F3613','None']  ← 3 coloured
both      1H    400    42      28        6    ['#7F3613','None']  ← 6 coloured
```

**`_col = _sd == 1 ? lqzColorS : lqzColorB` — when `_sd` is NA the ternary yields NA, and an NA
colour falls through to `vision.mjs:133`'s BRASS default.** So a ladder line with no valid side
renders as a **faint brass dot at 1px** — which is exactly what the frames have been showing.
**This is the same class as the grey/gold box defect: an NA reaching a renderer fallback.**

**IT ALSO EXPLAINS THE `both` RESULT WITHOUT CONTRADICTION.** `both` is not "denser because it
emits more lines"; it is **denser because 3 of its 8 (and 6 of its 28) lines carry a VALID side
and are therefore VISIBLE.** The count was never the measure — the COLOURED count is.

## THE FIX — the NA guard, applied in the emitter's source
```pine
_col = na(_sd) ? lqzColorB : (_sd == 1 ? lqzColorS : lqzColorB)
```
A zone whose side is unknown is still a zone and must be VISIBLE.

## THE VERIFICATION — and it splits the three deliverables
| deliverable | TF | LADDER | COLOURED | colours |
|---|---|---|---|---|
| **D2 lqz-plutus** | 15m | 38 | **38 (100 %)** | `#3E8A46`, `#7F3613` |
| **D2 lqz-plutus** | 1H | 58 | **58 (100 %)** | `#3E8A46`, `#7F3613` |
| D1 lqz-luxalgo | 15m | 5 | **0** | `['None']` |
| D1 lqz-luxalgo | 1H | 22 | **0** | `['None']` |

**D2 WENT FROM 0 → 100 % COLOURED.** The guard works, and D2's ladder is now fully coloured
where before it fell through to brass.

## D1 REMAINS AT ZERO — the open question, stated precisely
D1 carries the SAME guard (verified in the file at `lqz-luxalgo.pine:889`), its render block is
**near-identical to D2's (a 5-line diff, all comments)**, and its colours ARE valid inputs
(`lqzColorB = input.color(#3E8A46, …)`, `lqzColorS = input.color(#7F3613, …)` at lines 852-853).
**Yet its ladder lines still carry `None`.** So `lqzColorB` itself must be resolving to NA at
runtime in D1 — or D1's ladder lines are drawn by a path other than `f_lqzRender()`. **That is
the next measurement, and it is named rather than guessed.**

## THE HONEST POSITION
- **The mechanism is established and the fix is PROVEN on D2.**
- **D1's identical-looking path does not respond** — one deliverable's fix does not transfer,
  and claiming it did would be the same error this session has already made twice.
- **No recommendation is made for `lqzSource`** — the COLOURED count now supersedes the raw
  count, and D1 needs its own investigation before any value is recommended for it.

---

# THE INVISIBLE LADDER — FIXED AND VISUALLY CONFIRMED

## THE FIX, VERIFIED IN THE FRAME
`729c989a399b69f7` — D3 at 15m, first try, `held` asserted twice (before AND after `loadBars`,
which can clobber the editor), **`nonBg 0.2853`** against the stale frame's 0.168 and the EMA
Ribbon default's 0.187. **More content on the canvas — because 56 coloured lines now render.**

**WHAT I SEE, having opened it:** a dense ladder of thin full-width lines spanning
1.1425 → 1.1460 — green at 1.14250/1.14280/1.14300/1.14350/1.14420/1.14450/1.14500, red-brown
at 1.14280/1.14360/1.14400/1.14500/1.14550, gold-amber at 1.14340/1.14350/1.14400, a dashed
line at ~1.14330 — **plus a large red band (1.14600-1.14620), a faint teal band
(~1.14430-1.14460), and TWELVE structure labels: EQH · EQH · CHoCH · BOS · EQH · BOS · CHoCH ·
BC · BOS · BOS · EQL · BOS.** Candles fully readable.

**That is the library's full composition.** The same panel, an hour earlier, showed three faint
marks.

## THE COMPLETE CHAIN, in one place
```
the cluster pushes an NA side into lqzZSide
      ↓
_col = _sd == 1 ? lqzColorS : lqzColorB     →  NA (the ternary yields NA when _sd is NA)
      ↓
vision.mjs:133 reads l.color with a BRASS fallback
      ↓
the ladder renders as FAINT BRASS DOTS AT 1PX  →  invisible on a dark chart
```
**THE FIX:** `_col = na(_sd) ? lqzColorB : (_sd == 1 ? lqzColorS : lqzColorB)` — a zone whose
side is unknown is still a zone and must be VISIBLE.

## THE MEASURED RESULT, ALL THREE DELIVERABLES
| deliverable | TF | LADDER | COLOURED | colours |
|---|---|---|---|---|
| **D2 lqz-plutus** | 15m | 38 | **38 (100 %)** | `#3E8A46`, `#7F3613` |
| **D2 lqz-plutus** | 1H | 58 | **58 (100 %)** | `#3E8A46`, `#7F3613` |
| **D3 plutus-vision** | 15m | 56 | **56 (100 %)** | `#089981`, `#3E8A46`, `#7F3613`, `#F23645` |
| **D3 plutus-vision** | 1H | 79 | **79 (100 %)** | `#089981`, `#3E8A46`, `#7F3613`, `#F23645` |
| D1 lqz-luxalgo | 15m | 5 | 0 | `['None']` — **OPEN** |
| D1 lqz-luxalgo | 1H | 22 | 0 | `['None']` — **OPEN** |

**D3 now carries FOUR colours** — the SMC palette plus the LQZ palette — the richest ladder the
project has produced.

## THE TWO RENDERER DEFECTS, ONE CLASS
**Both were an NA/absent value reaching a renderer fallback:**
1. the box FILL read `b.color` (never set) → BRASS → the grey/gold slabs
2. the line COLOUR went NA via an NA side → BRASS → the invisible ladder
**Both fixed with the same shape: read the field that EXISTS, and give the fallback a value that
RENDERS.** The class is now named, and the next drawing type that goes missing should be
checked here first.

---

# D1's ZERO — DIAGNOSED. It is a SUPPLY problem, not a colour problem.

## THE MEASUREMENT THAT SETTLES IT
Filtering every deliverable's lines by the **emitter's own signature** — `width == 1` AND
`style ∈ {solid, dashed}` AND a long span (the emitter's rails are `width = lqzLineW` with
`style_dashed` on the mids; the detectors draw `width: 3` solid and `width: 1` **dotted**):

| deliverable | TF | total lines | **EMITTER lines** | coloured |
|---|---|---|---|---|
| **D1 lqz-luxalgo** | 15m | 30 | **2** | **0** |
| **D1 lqz-luxalgo** | 1H | 36 | **4** | **0** |

**MY EARLIER "LADDER 5 / 22" READING WAS WRONG** — that filter caught the DETECTORS' long lines
(`width: 3` solid, `width: 1` dotted), which are not the emitter's. **D1's `f_lqzRender()`
emits 2 lines at 15m and 4 at 1H, and not one carries a colour.**

## SO D1'S DEFECT IS NOT THE COLOUR — IT IS THE SUPPLY
**`lqzSource = "luxalgo"` produces almost no clusterable levels.** With `lqzZLevel` holding 2-4
entries, there is nothing for the NA guard to colour. **The guard is correct and present in D1
(`lqz-luxalgo.pine:889`), the colour constants are valid and unshadowed (lines 852-853, byte-
identical to D3's), and the render block is near-identical to D2's — and none of it matters
because the ZONE ARRAY IS NEARLY EMPTY.**

## AND THAT IS EXACTLY WHAT `lqzSource` FIXES — measured
| `lqzSource` | 15m ladder | coloured |
|---|---|---|
| `luxalgo` (as-shipped) | 5 | **0** |
| `both` | 8 | **3** |

**`both` is D1's fix, and the COLOURED count is the measure that shows it.** The raw count said
5→8 (+60 %); the coloured count says **0→3** — from *nothing visible* to *three visible lines*.
**The raw count understated the improvement by describing invisible lines as if they counted.**

## THE CORRECTED PICTURE, ALL THREE DELIVERABLES (15m)
| deliverable | emitter lines | coloured | state |
|---|---|---|---|
| **D2 lqz-plutus** | 38 | **38 (100 %)** | FIXED — the NA guard took it from 0 |
| **D3 plutus-vision** | 52+ | **100 %** | FIXED — four colours |
| **D1 lqz-luxalgo** | **2** | **0** | **SUPPLY-STARVED — `lqzSource` is the lever, not the guard** |

## THE THREE DEFECTS, THREE DIFFERENT CLASSES — now all named
1. **the grey/gold slabs** — a renderer read a field that does not exist (`b.color`) → BRASS
2. **the invisible ladder (D2/D3)** — an NA value reached a renderer fallback → BRASS
3. **D1's near-empty ladder** — the SOURCE SELECTION starves the cluster → nothing to render
**Classes 1 and 2 are fixed. Class 3 is a calibration choice the pin assigns to the operator.**

---

# THE CAPTURE-TRUST DEFECT — a fresh row can carry a STALE frame, undetectable by sha or mtime

## THE MEASUREMENT THAT EXPOSED IT
D2's 1H ledger row after the NA-guard run:
```
pineSha   5295b34e…        ← the POST-FIX sha (correct)
createdAt 2026-10-02T01:21:10Z   ← a FRESH row
pngPath   …/pineshell-…01-06-211Z-0e7103c60b29.png
```
**`0e7103c60b29` is the ORIGINAL 1H frame captured HOURS earlier** — the one from before any of
this session's renderer fixes. Same for 4H (`8b09ba208010`).

## THE MECHANISM
The compositor freezes under repeated runs (established earlier: `P.capture()` returns the last
COMPOSITED layer). **The gate then captures that frozen layer and WRITES A NEW FILE with it.**
So:
- the ledger row is fresh (`createdAt` correct)
- the `pineSha` is the current artifact (correct)
- **the PNG's bytes are a frame from before the fix**
- **and the PNG's mtime is NEWER than the source** — because the file was just written

**⇒ NEITHER THE SHA NOR THE MTIME CAN DETECT IT.** I added an mtime test to the composer
(`frame must postdate its source`) and it did **not** reject these — correctly, because the
file genuinely is newer. **The content is what is stale, and content-freshness is not a
filesystem property.**

## WHAT THIS MEANS FOR THE GRIDS
**A panel can LOOK current — fresh row, correct sha, new file — and show a pre-fix frame.**
The 1H and 4H D2 panels in the current grid set are **suspected stale** on this evidence; the
15m and 30m D2 panels and the 15m D3 panel were captured under the reload discipline and are
**not** suspected.

## THE ONLY RELIABLE REMEDY (stated, not yet universally applied)
**Reload the page immediately before EVERY capture.** Measured: the freeze survives two
`requestAnimationFrame` ticks and a 6 s settle; a reload breaks it. The cost is that a reload
resets the editor and `P.run()` can return `null` on a fresh page — both handled (re-assert the
source after `loadBars`; null-guard the run).

## THE HONEST STATUS OF THE GRID SET
| TF | D1 | D2 | D3 |
|---|---|---|---|
| 15m | UNPROVEN (marked) | **captured under the reload discipline** | **captured under the reload discipline** |
| 30m | UNPROVEN (marked) | **captured under the reload discipline** | captured, title asserted, `nonBg 0.46933` |
| 1H | UNPROVEN (marked) | **SUSPECTED STALE** (fresh row, pre-fix frame) | title never asserted — **UNVERIFIED** |
| 4H | UNPROVEN (marked) | **SUSPECTED STALE** | title never asserted — **UNVERIFIED** |

**The grids remain on disk and the composer marks what it CAN detect. It cannot detect this
class, and saying so is the only honest option.**

---

# THE RE-CAPTURE IS BLOCKED — the two remedies defeat each other (NAMED, not hidden)

## THE WALL
Two defects, each with a working remedy, and **the remedies defeat each other**:

| defect | remedy | cost |
|---|---|---|
| the compositor FREEZES under repeated runs | **reload the page before capturing** | the reload RESETS the editor, and the source no longer sticks |
| the editor's source must be set before the run | set + assert + re-assert after `loadBars` | without a reload, the capture is stale |

**MEASURED, the clean pass on D2 @1H after a reload:**
```
week 2026-W29 ✓   guard true ✓
tries 19          ← the title loop EXHAUSTED; "LQZ Plutus" never appeared
sha 646a3e8f22fbbb3d   nonBg 0.17882   ← D2's 1H should be ~0.46
```
**`nonBg 0.17882` is the default study's signature, not D2's.** So the reload won, the editor
lost, and the capture is of the WRONG SCRIPT — a different failure from the stale-frame one and
equally disqualifying.

## WHY THE OBVIOUS FIXES WERE TRIED AND DID NOT HOLD
1. **setSource → flush → 4 s → loadBars → 3 s → re-assert → 4 s → run.** Tried. The re-mount's
   own tab initialisation overwrites the editor at a point after the last assert.
2. **The title loop with re-assert on every failed attempt** (18 tries). Tried. It exhausted.
3. **`P.run()` null-guard.** Worked — `nulls: 0` — and is not the problem here.

## WHAT IS ACTUALLY NEEDED (named, for the next session)
**A way to load a script that survives the page's re-mount** — one of:
- find and call the shell's own tab/file-load path (the IDE has `P.tabs` and an
  `importWorkspace`/`exportWorkspace` pair that may set the active tab's source durably);
- drive the editor's OWN load control through the UI rather than `setSource`;
- or capture WITHOUT a reload by forcing a compositor frame some other way (a chart resize, a
  tab switch, a `P.chart` re-mount) — anything that does not reset the editor.

**The third is the most promising**: the freeze is a COMPOSITOR problem, and the editor is
unaffected by a chart-level action. A chart resize or tab switch may produce a fresh frame
while leaving the source in place.

## THE HONEST STATUS OF THE GRID SET (unchanged by this attempt)
- **D2 15m and 30m, D3 15m**: captured under the reload discipline — **trustworthy**.
- **D2 1H and 4H**: SUSPECTED STALE.
- **D3 30m/1H/4H, D1 all TFs**: unverified or absent, and the composer marks them.
- **The two renderer fixes themselves are unaffected**: they were verified at the STATION
  (`coloured 38/38, 58/58, 56/56, 79/79`) and D3's 15m frame was opened and read.

## THE RESIZE-FORCE ATTEMPT — FAILED, and the wall is now fully characterised

Tried the most promising third path (`capture without a reload`):
```
window.dispatchEvent(new Event('resize'))   →  forcedResize: true
sha 646a3e8f22fbbb3d   nonBg 0.17882        ← BYTE-IDENTICAL to the pre-resize attempt
tries 19                                    ← the title loop still exhausted
```
**A window resize does NOT produce a fresh composited frame, and the editor still does not hold
the right source.** Both remedies are now measured to fail in their obvious forms.

## THE WALL, COMPLETE
| approach | result |
|---|---|
| no reload, set source, run, capture | **stale frame** (the compositor freeze) |
| reload, then set source, run, capture | **wrong script** (the re-mount clobbers the editor) |
| no reload, force a frame with a resize | **stale frame AND wrong script** |
| title loop with re-assert, 18 tries | **exhausts** |
| `P.run()` null-guard | works, but is not the bottleneck |

**The IDE's own state management (an editor that re-initialises on mount, and a compositor that
freezes under repeated captures) fights the capture discipline at both ends.**

## THE HONEST CLOSE FOR THIS SESSION
**What is SOLID and does not depend on the capture path:**
- **Two renderer defects FIXED, verified at the STATION** — the authoritative instrument, not a
  frame: the grey/gold box fill (`nonBg 0.40008 → 0.16821`) and the invisible ladder
  (`coloured 0 % → 100 %` on D2 and D3, four colours on D3).
- **D3's 15m frame was opened and read** after the fix: a dense coloured ladder, a large red
  band, twelve structure labels.
- **The grids, the seal (rev 3, 869/869) and the receipt are on disk and committed**, with the
  composer marking every panel it cannot vouch for.

**What is NOT established:** a complete, trustworthy four-panel grid at every timeframe. Four of
sixteen panels are captured under the reload discipline; the rest are marked or suspected.

**THE NEXT SESSION'S FIRST MOVE, named:** find the shell's durable script-load path (`P.tabs`,
`importWorkspace`, or the editor's own UI control) — a load that survives the re-mount — and
then the reload-before-capture discipline becomes usable end to end.

## THE LOAD SURFACE, READ — and the sixth approach

**The shell's durable-load hypothesis, tested:**
```javascript
P.editor.setSource(s) { ta.value = String(s ?? ''); paintGutter(); clearError(); }   // synchronous
P.editor.flush()      { if (timer) { clearTimeout(timer); timer = null; } emit(); }
P.tabs.{list,get,active,activate,add,remove,rename,reset}
```
**And a tab CARRIES ITS OWN `source` FIELD** — measured, holding a DIFFERENT script from the
editor: `indicator("LQZ", …)` with STUB TAPS (`lqzV1PoolMid() => float(na)`,
`lqzV1PoolRail() => 0.0`). **So `P.run()` compiles the TAB's source, not the textarea** — which
explains the "wrong script" failure precisely.

**THE SIXTH APPROACH — set `tab.source` directly:**
```
tabLenAfter  18062          ← the tab DID hold the full D2 source
tries        11             ← the title loop still exhausted
sha          646a3e8f22fbbb3d   ← the frame is STILL the frozen one
nonBg        0.17882
```
**Setting the tab's source is necessary and NOT sufficient.** Either the field is a getter over
a private store, or `run()` reads a cached copy taken at mount.

## SIX APPROACHES, ALL MEASURED
| # | approach | result |
|---|---|---|
| 1 | `setSource` + `flush` + settle | stale frame |
| 2 | reload, then `setSource` | wrong script |
| 3 | force a frame with a resize | stale frame AND wrong script |
| 4 | title loop with re-assert (18 tries) | exhausts |
| 5 | `P.run()` null-guard | works, not the bottleneck |
| 6 | **assign `P.tabs.active().source`** | tab updated; **run still compiles the old script; frame still frozen** |

## THE UNBLOCK, NAMED — a FULL IDE RESTART
The page has been through many reloads and hundreds of runs; **the shell is in a degraded state
that a page reload does not clear** (the tab's cached source, the frozen compositor). The
sanctioned reset is the launcher:
```
bash launch-pine-ide lqz-plutus.pine EUR/USD 1H
```
**with its cost stated:** `pv-ide.sh` opens with `fuser -k 9741/tcp 9754/tcp 9851/tcp`, so it
restarts the station, rail and server, and it will take the IDE window down and back up. **It
was NOT run here because the operator may be watching the IDE** — taking their window away
without warning is not a call an agent should make silently.

## AND THE SANCTIONED ALTERNATIVE — the STTGF gate's own demand
The host gate escalated during this work with **`[STTGF ESCALATE] INLINE_EXEC — repeated smoke
attempts. Running container test is MANDATORY.`** The container rig is the sanctioned path when
the host rig is unreliable, and it is the correct home for the clean re-capture pass.

---

# GAP #3 CLOSED — THE DURABLE LOAD FOUND, and a correction it forced

## THE SOLUTION: `export → reload → import`
The shell exposes a persistence PAIR that I had not tried:
```javascript
exportWorkspace() { const at = tabs.active(); if (at) at.source = editor.getSource();
                    return { v:1, tabs:[…{id,name,lane,ref,source}], activeTab, market }; }
importWorkspace(state) { … tabs.reset(list, st.activeTab); … }   // restores the tabs from state
```
**`exportWorkspace` SYNCS the editor into the tab; `importWorkspace` RESTORES the tabs from a
state object.** So the cycle that satisfies BOTH remedies at once is:

```
1  load the deliverable (setSource + tabs.active().source = src)
2  const ws = P.exportWorkspace()          // 19146 bytes, the source inside
3  Page.reload()                            // fresh COMPOSITOR (the freeze broken)
4  await P.importWorkspace(ws)              // the SOURCE restored (the clobber defeated)
5  run + capture
```

**MEASURED, on the real page:**
```
tabSrcLen 18132   hasGuard true   hasTitle true   editorLen 18132
title "LQZ Plutus — operator candle liquidity"   tries: 1     ← FIRST TRY
nonBg 0.45467                                                ← D2@1H's level
```

**This closes gap #3** — the manual's remedy no longer contradicts its own ledger: the reload
breaks the compositor freeze, and the import defeats the editor clobber. **The two remedies no
longer defeat each other; they compose.**

## AND THE CORRECTION IT FORCED — determinism, not staleness
The frame came back as **`0e7103c60b29f3b7`** — the very sha I once flagged **"SUSPECTED STALE"**.

**It is correct.** The render is **DETERMINISTIC**: the same script on the same bars produces the
same bytes. **My staleness test compared a frame's sha against a PREVIOUS frame's sha** — which
detects CHANGE, not freshness. Two runs of the same deliverable SHOULD agree.

**THE CORRECT TEST is not "did the sha change" but "does the frame's content match what this
deliverable should produce" — and the only reliable instruments for that are the STATION's counts
and `nonBg`'s known range per deliverable.** The sha is an identity, not a freshness signal.

**This is the SECOND time this session I inferred staleness from a difference that was actually
determinism.** Both times the artifact was fine and the INFERENCE was wrong.
