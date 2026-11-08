# VERDICT — PLUTUS VISION · E1 AUTOMATIC (the E1-E2 build)

_The legal-stop record. Written 2026-10-06. A fresh agent resumes from THIS + the checkpoint._

## THE VERDICT: 13/14 gates green · OPEN pending C16

| phase | gate | state |
|---|---|---|
| P0 baseline | the baseline re-measured (no memory numbers) | ✅ |
| P1 spec | the DPL1 spec APPROVED (0/8) + the wave-plan on disk | ✅ |
| P2 preflight | the build package + round-0 checkpoint | ✅ |
| P3 execute | every wave's deliverable on disk, suite green | ✅ |
| P4 runtime | the live render operated first-person (the replay, the play-forward, the video, the mimo verdict) | ✅ |
| P5 adversarial | A1-A7 9/9 PASS; the frontier named | ✅ |
| P6 document | the canon (12) + the 5 ship docs; AUDIT GATE PASS | ✅ |
| P7 checkpoint | src + dist+SHA + docs + manifest + seal | ✅ |
| P8 verdict | **C16 (the operator's look) PENDING** | ⏳ |

## THE RECEIPT (bound to tool results)

### The seal + the artifact
- **v1 seal** `0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1` — byte-identical (the HARD-STOP target). Enforced at `scripts/lqz_vision_v2_build.py:1` (`verify_v1_untouched`) → `HARD STOP H1`.
- **v2** `282517ac622769bd` — the served copy == the tree == the checkpoint (all in sync). Recorded in `context_management/CURRENT_STATE.md:14` and `.omp/ct-results.json:1`.
- The truth table: `context_management/CURRENT_STATE.md:7` · the manifest `context_management/CANON_MANIFEST.md:75` · the E1 payload `data/e1/DXY-2026-07-06.json:1` · the E2 chain `data/e2/DXY-2026-07-06-e2.json:1`.
- The build: `scripts/lqz_vision_v2_build.py:153` (`build_payload`) injects the E1 zones + the E2 path; the render is `plutus-vision-lqz/e1-render.pine:1` + `plutus-vision-lqz/e2-render.pine:1`.
- The engine: `scripts/e2_engine.py:97` (`classify`) · `:342` (`_next_target`) · `:456` (`day_decomposition`) · `:570` (`fine_path`).
- The E2 driver: `scripts/wire_e2.py:35` (`compute_momentum`) · `scripts/wire_e2.py:132` (the week validation).
- The backtest overlay: `scripts/pv-server.py:152` (`/api/v1/e1/zones`) · `pine-ide/ide/renderer/tabs/backtest.js:783` (`drawE1Zones`).
- The audit gate line: `TESTING_LOG.md:1633` (`AUDIT GATE: PASS`).

### The suites (this session)
`e1_st_18` 8 · `e1_st_19` 10 · `e1_st_20` 7 · `e1_st_21` 4 · `e1_st_22` 7 · `e1_st_26` 4 · `e2_tests` 36 — **0 failures**.

### C1-C15 (the spec's acceptance — run first-person)
C1 v1 byte-identical · C2 floor 226 · C3 no E3 · C4 the v1-drift refusal (`HARD STOP H1`, exit 1) · C5 the v8 renderer (5 helpers) · C6 anchor computed (0 `timestamp(2026)`) · C7 anchor chart-based (no `now()` call) · C8 the category (2 RES, 3 SUP) · C10 the zones land (6 boxes) · C11 replay-safe (`anchor.from=chart_last_bar`) · C12 the dead-source honesty (exit 0) · C13 no fabrication (144 labelled levels) · C14 the suites green · C15 the LSZ reference. **14/14 PASS.**

### A1-A7 (the adversarial loop — run against the deployed render)
A1 replay rewind (bars 2007→1608, restored) · A2 classify (RES/SUP) · A3 dead arm (exit 0) · A4 floor 226 · A5 seal tamper (exit 1, HARD STOP H1) · A6 empty payload (exit 1, HARD STOP) · A7 Sunday (Sun→Mon; the control Mon→Mon). **9/9 PASS** — the one initial "FAIL" (A7) was a probe error, adjudicated.

### AUDIT GATE
`ocr` (Alibaba OpenCodeReview) on `scripts/e2_engine.py` + `scripts/wire_e2.py`: 2 files, 13 comments, **0 critical**. Every finding fixed or proven a false positive. Recorded in `TESTING_LOG.md`.

## THE RUNTIME SEAT (H1-H7) — what running taught that reading could not
"I am the driver of the PLUTUS_VISION live render (:9851 + :9222 CDP)."
- **The play-forward method** (the operator's): the real DXY 1h bars (1881, Apr→Jul21) from the dashboard's own TV feed, replayed Jul 3 → Jul 11 as a 36-frame video, watched by **mimo-v2.6-flash** (the pinned vision model).
- **The verdict**: the price action **respects the zones** (a floor at the teal support, stall/reject at the orange resistance) — the E1 zones are ACCURATE.
- **The break** (every break is the deliverable): the E2 was a 5-vertex triangle, then a flat squiggle. The play-forward exposed **six defects**, all fixed:
  1. `wire_e2` passed `bars_momentum = 1.0` (a constant) → derived from the bars.
  2. `classify` anchored to the lowest support → the zone nearest the spot.
  3. `_next_target` walked to the adjacent zone → the FAR zone (the week's extreme).
  4. the day y was the zone's top edge → the zone MID.
  5. **my own TZ skew** (a naive `timestamp()`) → the sign had flipped; fixed, the direction now matches the week.
  6. a range shape (SS) anchored at the far support → the mid-range (the Equilibrium).

## THE FRONTIER (the named residual — no unstated gaps)
1. **C16** — the operator's look. The legal stop; cannot be self-certified.
2. **The E2 direction** is the momentum's sign — a weak, lookback-sensitive signal. The TZ fix made it match THIS week; a different week's bar set decides it.
3. **The backtest overlay draws zones at the chart's last bar**, not the room's future week (the room's Vite chart has no `xloc` future drawing) — it shows the levels, not the weekly projection.

## REPLICATION
```
repo   PLUTUS_VISION @ the checkpoint Checkpoints/e1-automatic-polish-2026-10-06/
build  PV2_PAIR=DXY PV2_WEEK=2026-07-06 python3 scripts/lqz_vision_v2_build.py
       -> plutus-vision-v2.pine  282517ac622769bd  (v1 verified untouched)
tests  python3 scripts/e1_st_18.py · scripts/e2_tests.py (0 fail)
rig    :9741 pine-station · :9854 VIL rail · :9851 pv-server · :9222 CDP
app    pine-ide  -> the 2-tab dashboard (PINE IDE + BACKTEST), the app on the operator display
```

---

## THE DIAGNOSIS LOG (what VISUAL inspection found that reading could not)

This is the record of the "wonky shit with the dashboards" the operator flagged by
LOOKING at the app. Every fix below traces to a MEASURED observation, never a guess.

### WONK 1 — the SPLIT-TAB layout (fixed)
The operator's screenshot showed only the left of the window. Cause: a stray `"` in an
inline `onclick` attribute in `pine-ide/ide/renderer/pine.html:1` closed the attribute
early and leaked `pv-pane">` as visible text on the BACKTEST tab. Fixed by moving the
switcher off the inline handler.

### WONK 2 — FIXTURE_CELL_ABSENT (fixed)
`scripts/pv-server.py:72` (`bars_for`) keyed cells on `pair` + `timeframe`; the app
requested `EUR/USD` while the fixture carried `DXY`. The app's navigation map normalizes
`EUR/USD → EURUSD`; the `norm_pair` helper in `scripts/pv-server.py:62` now strips the
slash before comparison, so both spellings resolve to one cell.

### WONK 3 — THE SCRIPT-MISMATCH (fixed)
After a page reload the editor reset to a study smoke case (`// THE PINE SHELL — a study
smoke case`), so the chart showed an "EMA Ribbon", not the E1/E2 render. The reload path
must always re-inject `plutus-vision-v2.pine`; the served copy lives at
`pine-ide/ide/renderer/plutus-vision-v2.pine:1`.

### WONK 4 — THE 800-LABEL WALL (fixed — the big one)
Measured by reading the chart's OWN scene: `ctrl.drawings.all()` returned **846** items —
`6 box, 38 trendline, 800 text, 2 polyline`. All 800 text items were the IDENTICAL
`"SS 55%"` E2 day-tag at the SAME x. The mechanism lived in the payload injection:
`scripts/lqz_vision_v2_build.py:183` (`add()`) emitted `var array<T> name = array.new<T>()`
plus a BARE GLOBAL `name.push(v)`; a bare global statement in Pine runs EVERY BAR, so each
array grew by its length on every bar and the E2 day-tag loop drew the label once per
accumulated point. The E1 hid it (`e1MaxZones` caps its loop, `plutus-vision-lqz/e1-render.pine:1`).
The fix: ONE `if bar_index == 0` guard around every push. `array.from([...])` was tried
first and PineTS REJECTED it ("Cannot call array.from with a tuple argument"). After the
fix the scene reads **14** drawings (6 box + 4 trendline + 2 text + 2 polyline) and the
census shows `2 labels` — the E1 zone tags RETURN.

### WONK 5 — THE TEAL CANDLE WALL (fixed)
The raw v1 ALSO showed a wall with `0 segs`, proving it was the CANDLES, not a study.
`scripts/pv-server.py:110` (`_prediction_space`) gave EVERY one of the 126 prediction bars
a `±0.75` high/low — 126 tall candles stacked at the chart's right edge. An earlier change
of mine had done that to pull the price scale. The fix: only the FIRST prediction bar
carries the band (for the scale); the rest are FLAT.

### WONK 6 — ST-1b the stale path (fixed)
`scripts/e1_tests.py:60` read a hardcoded `data/e1/EURUSD-2026-10-06.json` that stopped
existing, so the test reported `no data file` and FAILED while the contract it guards was
intact. Now it reads the newest E1 file on disk. `e1_tests` went 13/1 -> 15/0.

## THE FRONTIER (named residual)
- The E2 direction is the momentum's sign (a weak signal); the TZ fix made it match THIS
  week.
- The backtest overlay draws the zones at the chart's last bar (the room's Vite chart has no
  future drawing).
- C16 — the operator's look.
