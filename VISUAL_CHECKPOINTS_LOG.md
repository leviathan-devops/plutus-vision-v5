# VISUAL CHECKPOINTS LOG — PLUTUS VISION

The library of the build's visual runtime states. Each entry: the checkpoint token, the image,
its SHA, and the state it depicts. The purpose: a state can be recognised and RESTORED from
visual semantics ("I remember it looked like X — get that checkpoint"), and the images form the
foundation for a later visually-semantically-integrated graph over the build's history.

## THE CAPTURE CHANNEL
The runtime is the Pine IDE desktop app on the operator display. The renderer page is
`pine-ide/ide/renderer/pine.html:1`, served by `scripts/pv-server.py:141` (`do_GET`), driven over
CDP (`:9222`). The capture is a CDP screenshot of the live tab; it is saved to
`Checkpoints/<token>/visual/runtime-state.png` and its `sha256sum` is recorded here and in the
`CHECKPOINT_MANIFEST.md`. The chart itself renders through the Vela workbench
(`pine-ide/charts/workbench.js:1`); the E1 zones + the E2 path are drawn by the injected Pine
(`plutus-vision-v2.pine`).

## THE LIBRARY (newest first)
| date | checkpoint | image | sha256 | the state depicted |
|---|---|---|---|---|
| 2026-10-06 | `e1-e2-v2-pending-ship-approval-2026-10-06` | `visual/runtime-state.png` | `bf0d72dc66652585…` | 6 labelled E1 zones (RES orange ×2 · MID orange · SUP teal ×3) + the E2 cyan path at the Equilibrium; the PINE IDE chart, clean (no wall) |

## THE STATE ANCHORS (what the image depicts → the code)
- The E1 zones: the colour ladder at `plutus-vision-lqz/e1-render.pine:24` and the box+label loop
  at `plutus-vision-lqz/e1-render.pine:161` (the `box.new` at `plutus-vision-lqz/e1-render.pine:215`).
- The E2 path: `plutus-vision-lqz/e2-render.pine:1` (the day-tag loop and the polyline).
- The payload the render consumes: `data/e1/DXY-2026-07-06.json:1` (the zones) and
  `data/e2/DXY-2026-07-06-e2.json:1` (the chain).
- The build that produces both: `scripts/lqz_vision_v2_build.py:153` (`build_payload`).
- The server that serves them: `scripts/pv-server.py:141` and `scripts/pv-server.py:152` (the
  `/api/v1/e1/zones` route the BACKTEST overlay reads).

## THE STATE CROSS-REFERENCES (the canon)
- The truth SHAs: `context_management/CURRENT_STATE.md:14` (v2) and
  `context_management/CURRENT_STATE.md:15` (the served copy).
- The build-state chain: `context_management/BUILD_STATE.md:19`.
- The canon manifest: `context_management/CANON_MANIFEST.md:75`.
- The audit gate line: `TESTING_LOG.md:1633`.

## THE VISUAL HISTORY (what the build looked like through its iterations)
The build passed through a sequence of visual states, most of them WRONG before they were right.
Recording them makes the failure modes recognisable on sight:

1. **The 5-vertex triangle.** The earliest E2 was five day-vertices (R→WL→SS→SS→SS) — a spike
   then a flat line. It read as a shape template, not price action. The operator: "the E2 path is
   a triangle."
2. **The clipped zones.** The price scale (which autoscales to the bars) cut the two upper
   resistance zones off the top edge. The fix: the prediction-space band bar pulls the scale.
3. **The label-less zones.** The v1 SMC label families exhausted the label budget, so the E1 zone
   tags were dropped. The fix: disable the noisy v1 label families in the v2.
4. **The 800-label wall.** The injected arrays accumulated every bar (a bare global `.push()`),
   so the E2 day-tag drew 800 stacked labels at one x (the chart's scene held 846 drawings:
   6 box + 800 text + 38 trendline + 2 polyline). The operator, looking at the app: "what the
   fuck is this." The fix: one `if bar_index == 0` guard around every push → 846 → 14 drawings.
5. **The teal candle wall.** Every one of the 126 prediction bars carried a ±0.75 high/low → 126
   tall candles stacked at the right edge. The fix: only the first bar carries the band.
6. **The scale wick.** The single band bar left a full-height vertical wick. The fix: two flat
   bars (ceiling + floor).
7. **THE CLEAN STATE (this checkpoint).** 6 labelled zones + the E2 path + real candles, no wall.

## THE RESTORE RECIPE
To restore a visual state from the library: check out the checkpoint's `dist/plutus-vision-v2.pine`
(the artifact) into `pine-ide/ide/renderer/plutus-vision-v2.pine`, restart `pine-ide`, and the app
renders the state the image depicts. The `src/` in the checkpoint rebuilds it from source
(`scripts/lqz_vision_v2_build.py`).

## THE HONEST GAPS
- The library holds ONE entry today (this checkpoint is the first with the full visual artifact).
- The captures are full-window screenshots, not cropped chart-only frames; a region crop would
  make the visual diff sharper.
- The edge-case states (a replay mid-week, a dead VLM, an empty payload) are not separately
  captured — the named-refusal states would be worth a frame each.
- No pixel-level diff instrument yet links two entries; the future visual-semantic graph would
  consume these images to that end.

## THE PER-ITERATION DIAGNOSTIC DETAIL (what each state measured)
Every entry above was measured by reading the chart's own scene via
`window.PlutusPineShell.chart.replayControl.ctrl.drawings.all()` and grouping by `.type` —
NOT by eyeballing the screenshot. The scene counts are the objective instrument; the pixels
confirm them. The per-state numbers:

- **The clean state (this checkpoint):** `drawings = 29` → `{box: 6, trendline: 10, text: 11,
  polyline: 2}`. The 6 boxes are the E1 zones; the 10 trendlines + 2 polylines are the E2 path
  segments; the 11 text items are the 6-zone labels + the E2 day tags + the watermark. The
  census line: `2 plots · 6 boxes · 10 lines · 11 labels · 0 markers · 798 segs · bars 1740`.
- **The 800-label wall:** `drawings = 846` → `{box: 6, trendline: 38, text: 800, polyline: 2}`,
  with all 800 text items reading the IDENTICAL string `"SS 55%"` at one x
  (`1783288800000`, the Monday). The 798 `segs` (the scale) were unchanged.
- **The teal candle wall:** the pixel sample of the wall band returned
  `rgb(8, 153, 129)` = `#089981` (the TradingView default candle green) in a dense vertical
  run — the 126 banded prediction-space bars.
- **The clipped-zones state:** the price scale spanned `100.55 – 101.05`, cutting the two RES
  zones (101.28, 101.45) off the top edge — fixed by the banded scale.

## THE INSTRUMENT VALIDATION
The scene read is validated by a KNOWN-POSITIVE control: the raw v1 render (no E1/E2 injection)
reports `0 segs · 2 boxes · 19 lines · 17 labels` — a DIFFERENT scene, proving the read is not a
constant. Without the control, a scene read of `0` would be indistinguishable from a broken read.

## THE STATE → THE CHECKPOINT MAP
| visual state | the checkpoint that carries it |
|---|---|
| the clean render (6 zones + the E2 path) | `e1-e2-v2-pending-ship-approval-2026-10-06` (this) |
| the wall-free render (pre-scale-wick-fix) | `e1-automatic-polish-2026-10-06` |
| the target-week ship render | `e1-automatic-ship-2026-10-05` |

## THE NEXT ENTRIES (the queued captures)
- The 5-week cross-validation states (5 weeks × the render) — one image each, appended as the
  validation runs.
- The named-refusal states (a dead VLM, an empty payload, the LSZ reference) — one frame each.
- The BACKTEST-tab state (the room + the E1 overlay) — captured separately (a distinct surface).

## 2026-10-08 · indicator-engine1-e2-fixed-2026-10-08
- image: Checkpoints/indicator-engine1-e2-fixed-2026-10-08/visual/runtime-state.png
- sha256: 2b1ace7f8f437a74a647eb22a87f8c605db3dabfb4b55679a9c80fce5c024ad3
- state: the LIVE IDE render (Plutus Dashboard PINE IDE, EURUSD 1H) — the 5 E1 IP zones in the canon colors (RED ceiling/upper, ORANGE #FF9800 equilibrium, TEAL mid/floor) each labelled "<name> | <degree> | <zfp>% ZFP", plus the cyan E2 forecast path. The day-tag gold boxes removed.

## 2026-10-08 · indicator-engine1-e2-fixed-2026-10-08 (final)
- image: Checkpoints/indicator-engine1-e2-fixed-2026-10-08/visual/runtime-state.png
- state: the LIVE IDE render (EURUSD 1H) — the 5 E1 IP zones in the canon colors (RED Key IP Resistance Band + Upper IP Resistance, ORANGE #FF9800 Equilibrium Zone, TEAL Mid-Range Support + IP Support Floor), each labelled "<name> | <degree> | <zfp>% ZFP"; the 6 green LSZ strips; the option-strike layer (wired; empty when the harvest is DOWN); the full 2x17 info table (header / Chain RWL->SS / Days / ZONES + 5 rows / TRADES + 6 rows); and the E2 cyan forecast path (WL->RWL->SS: a drop to the support then a recovery into the range).

## 2026-10-26 · computer-use-v2-focus-proven-2026-10-26
- image: Checkpoints/computer-use-v2-focus-proven-2026-10-26/visual/runtime-state.png
- state: the LIVE Pine IDE inside a computer-use v2 instance on a REPLICA display (:2xx): DXY 1H,
  2026-W29, candles + EMA 20 (yellow) + EMA 50 (blue) + 4 green crossover triangles, status row
  `FIXTURE · DXY · 1H · 508 bars · rail : 9764 · station UP` — the instance naming its OWN rail, and
  the operator's stand-in window untouched above it.
- sha256: (recorded in the checkpoint manifest)
- note: the same load on the operator's real desktop (:1) produced the identical frame with
  `active=0x0 top=0xa0000a` unchanged before/after — cited in TESTING_LOG T-34, not stored here
  because it is the operator's screen content.

## 2026-11-01 · computer-use-v2 + pinebox live frames (PINEBOX repo, `reports/overnight-2026-11-01/visual/`)

| frame | sha16 | what it depicts (opened and read) | caveat |
|---|---|---|---|
| pinebox-live-works.png | 75cb315960cb4f5b | Pine IDE, DXY 1h, week 2026-W28, status row "FIXTURE . DXY . 1H . 508 bars", candles, `plutus-vision-v2.pine` loaded | no Plutus overlay visible although the station reports 32 drawings (F-158) |
| pinebox-verify-judged.png | 2fee35dd9c193a32 | the frame `verify` accepted: candles, 4,989 candle pixels | |
| pinebox-live-ema.png | de92c03b6fa05bb6 | EMA Ribbon: candles, EMA20 (yellow), EMA50 (blue), green crossover triangles | the tools' acceptance fixture |
| pinebox-after-load-prezoom.png | 8f64957ef8977bf0 | a full week of candles after load | |
| pinebox-final-chart.png | 43fcd47233377452 | an EMPTY chart (gridlines and axis only) that the old `verify` accepted | the defect frame of F-157 |
| cu-live-typed.png | 32bcb0c41b6487a9 | a GTK zenity dialog with "typed by computer-use v2" in its entry | driven on the headless xvfb adapter |
| cu-live-xev.png | 54ed8ee3ddd65be7 | the xev window (178x178, white, hollow square) | byte-identical to guest-xev.png and cu-live-xterm.png |
| cu-live-xterm.png | 54ed8ee3ddd65be7 | NOT an xterm: a duplicate of the xev frame (xterm is not installed, APP_EXITED) | MISLABELED (F-163) |
| guest-xev.png | 54ed8ee3ddd65be7 | xev inside the Alpine guest (ssh-side uname Linux 6.12.114-0-virt) | same hash as a host frame; guest provenance rests on the ssh evidence |
| cu-shell-up-xev.png | f10d2ed194c3b8bc | the first `shell up` + xev frame (02:51) | |
| room-up.png / room-session.png / room-replay.png | 323f53549256aadc / ba11d4cac9c6465b / 3dc52d0811c65737 | the per-instance Backtest room up, a REPLAY-DXY session, 3 step-clicks 216 -> 219 | |

### 2026-11-02 - N3 / N4 checkpoint (headed, through the tool, opened)
| frame | sha256 (16) | what it shows | ruling |
|---|---|---|---|
| n3-9-c0.png (and c1..c4) | 2da539dd25e013e4 | a computer's own dialog, its session name as the title and its own typed text only (9-session run) | |
| n3-9-p0-chart.png (and p1..p3) | 3b5616b33b76bb57 | the chart section: candles, EMA20 yellow, EMA50 blue, crossover triangles, legend EMA Ribbon (9-session run) | |
| n4-persistent-computer-id10.png | 69d29f199d14f6a1 | the persistent computer's dialog naming id 10 and its owning session | |
| n4-persistent-pinebox-id0.png | 287660c24d27a167 | the persistent Pinebox's full IDE: editor, run bar FIXTURE DXY 1H 508 bars, rail :9754 station UP, chart | |

## CHECKPOINT cu-v2-pinebox-gaps-mapped-2026-11-02 (2026-11-02, session ckpt-visual, instance 1 slot :6, torn down after capture; operator focus 0x0 before and after)

| frame | sha256 (16) | what it shows | ruling |
|---|---|---|---|
| checkpoints/cu-v2-pinebox-gaps-mapped-2026-11-02/visual/runtime-state.png | 7c85ed0c7ec34ebe | the full Pine IDE 1626x875: tabs PINE IDE / BACKTEST, the EMA Ribbon source in the editor, status row 2026-W28 · FIXTURE · DXY · 1H · 508 bars · rail :9854 · station UP, chart with candles, yellow EMA20, blue EMA50, four green crossover triangles; the EMAs run flat at 101.263 over the fixture's padding after ~Jul 13; `verify` WORKS | the state the gap closure starts from |
| checkpoints/cu-v2-pinebox-gaps-mapped-2026-11-02/visual/runtime-chart.png | d7c0206801a82c70 | the chart element only (1042x785, 371 colours): legend EMA Ribbon, price axis 100.400-102.100, time axis Jul 2 / Jul 9 / Jul 16 | |

## W9 FINAL RECORD (2026-11-03) - crash rounds, nine sessions, the final sweep (all frames opened; no delta)

| frame | sha256 (16) | what it shows | ruling |
|---|---|---|---|
| reports/goal-2026-11-03/frames/w9-crash-r1-recoloured.png | 0b65577e9e34 | the chart with candles recoloured orange/purple, both EMAs, crossover triangles (verify WORKS on it) | no delta |
| reports/goal-2026-11-03/frames/w9-crash-r1-spawn.png | 0decc5fd2c7c | the program spawned into a Pinebox, seen through X: W9SPAWN1 'spawned' | no delta |
| reports/goal-2026-11-03/frames/w9-crash-r3-computer.png | f6d2d89ce01f | the computer's zenity entry holding 'typed-round3' | no delta |
| reports/goal-2026-11-03/frames/n9-p2-chart.png | a8107318534362b0 | one of four concurrent Pinebox charts (EMA ribbon, 1042x785) during the nine-session round | no delta |
| reports/goal-2026-11-03/frames/n9-c3.png | c761ba24f594ca5e | one of five concurrent computers: 'typed-n3-9-c3' in its own dialog | no delta |
| reports/sweep-2026-11-03/frames/pinebox-view.png | (rows.jsonl) | view --confirm raised the Pinebox over a private mutter display at its fixed 1626x931, whole IDE visible | no delta |

## CHECKPOINT cu-v2-pinebox-gap-closure-complete-2026-11-03 (2026-11-03, session ckpt-visual, instance 1 slot :5, torn down after capture; operator focus 0x0 before and after)

| frame | sha256 (16) | what it shows | ruling |
|---|---|---|---|
| checkpoints/cu-v2-pinebox-gap-closure-complete-2026-11-03/visual/runtime-state.png | ed5f873e1226f8d0 | the full Pine IDE 1626x875 at the end of the gap closure: tabs PINE IDE / BACKTEST, EMA Ribbon source, run bar 2026-W28 · FIXTURE · DXY · 1H · 508 bars · rail :9854 · station UP, chart with EMA 20/50 and crossover triangles; verify WORKS on 5 clauses | no delta |
| checkpoints/cu-v2-pinebox-gap-closure-complete-2026-11-03/visual/runtime-chart.png | e599950b565de721 | the chart element only (1042x785): legend EMA Ribbon, price axis 100.400-102.100, time axis Jul 2 / Jul 9 / Jul 16, last price 101.263 | no delta |

## THE FINAL RECORD (2026-11-04, after F-222..F-224) - all 33 frames opened, no delta

| frame | what it shows | ruling |
|---|---|---|
| reports/sweep-2026-11-03/frames/pinebox-view.png (run 9) | the Pinebox raised over the private mutter display at its fixed 1626x931, the whole IDE visible | no delta |
| reports/goal-2026-11-03/frames/w9-crash-r3-spawn-ide.png | a bare spawn instance on DXY FIXTURE 1h with 508 bars (the instance H27 then refuses NO_SCRIPT_LOADED on) | no delta |
| reports/goal-2026-11-03/frames/n9-p0..p3-chart.png | four Pinebox charts verified CONCURRENTLY through the host-wide judge lock (clocks 02:58:45 / 55 / 56 / 57 UTC) | no delta |
| /tmp/t-f223.png (ST-199) | the loaded EMA ribbon after NO_SCRIPT_LOADED was resolved by `load`: 508 bars, 6 drawn, verify WORKS | no delta |
