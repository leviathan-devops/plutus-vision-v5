# W9 GATE — THE RIG ANGLES (vision-in-the-loop, 2026-10-05)

**The operator's metric: a screenshot opened THIS turn.** Not a unit test.

## THE FRAME
- `evidence/w9-final-render.png` (183483 B) — the live Pine IDE, DXY 1H · FIXTURE · 1614 bars
- captured via CDP `Page.captureScreenshot` from the Chrome at `:9222`

## THE ANGLES
| # | angle | the measured result |
|---|---|---|
| A1 | chart-anchored (bar replay) | the zones anchor to `bar_index` — `grep '_bAnchor = bar_index' = 1`; span follows the active bar (Jun 22 → Jul 6) |
| A2 | classify RES+SUP | the payload carries zCat=SUP×3 (below spot) AND zCat=RES×3 (above) — ST-19 |
| A3 | dead arm | the VLM arm DOWN -> `[NO DATA]`, exit 0, ZERO fabricated strikes — ST-22a/b |
| A4 | the floor | `SMC=226 OB=6 LQZ=4` — v1's signature survives |
| A5 | the seal | `sha256sum v1 = 0d20e831…`; a tamper -> `HARD STOP H1` + exit 1 — W5 |
| A6 | empty payload | the build refuses (E2_NO_ZONES) rather than drawing a fabricated zone |
| A7 | Sunday boundary | `resolve()` maps a Sunday bar to the FOLLOWING Monday — ST-18c |

## THE VISIBLE RESULT (two readers)
- **READER 1 (CDP box count):** v8-RED family ×3, v8-TEAL family ×3 (of 37 boxes)
- **READER 2 (the opened PNG):** a red/orange RESISTANCE band ~101.15–101.32 + a teal SUPPORT
  band ~100.75–100.97, spanning Jun 22 → Jul 6, in v8's exact ladder

## THE HONEST RESIDUALS
- `VERDICT: NO WEEK` · `2 anchors dropped` — the off-chart marker drop persists (a stale last bar)
- the zones cluster near spot (~100.8–101.3) — the engine's 6 highest-confluence levels
- W6: 1/8 sources wired (ohlc live; S3-S9 honest `[NO DATA]`)
- A1's true bar-replay behavior is asserted in code (chart-anchored), not yet driven through a
  replay session — named as the next visual test

---

## THE DEFINITIVE C16 CAPTURE (2026-10-05, post all fixes)

`evidence/C16-definitive-render.png` (183431 B) — the FINAL artifact rendered on the live IDE
after the audit fixes + the replay hook. DXY 1H · FIXTURE · 1614 bars.

- the ORANGE band ~101.19–101.31 (the 3 clustered RESISTANCE zones; v8 R_F5 #e6823c)
- the TEAL band ~100.79–100.96 (the 3 clustered SUPPORT zones; v8 T_F5 #3cc8be)
- CDP reader: 6 E1 zones (3 red-family + 3 teal-family of 37 boxes)

**C16 awaits the OPERATOR's look at this file.** The agent's job is done; the legal stop
requires the operator to view the capture and confirm "this is right".
