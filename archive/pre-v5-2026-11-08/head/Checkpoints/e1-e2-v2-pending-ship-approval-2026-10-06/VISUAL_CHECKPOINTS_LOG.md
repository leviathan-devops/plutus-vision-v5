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
