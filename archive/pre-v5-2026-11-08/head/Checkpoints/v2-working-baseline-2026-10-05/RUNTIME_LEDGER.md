# P4 RUNTIME LEDGER — what RUNNING taught that READING could not

Instance: pine-ide-fork station :9641 (PineTS 0.10.0), EUR/USD 4H fixture, limit 300.
Stance: driver of the station runtime, first-person numbered ops.

## Ops
1. Fired merged file -> 422 indent (orphan decl tails). EXPECTED clean-ish, GOT error.
   MECHANISM: strip_decl() removed the indicator() line but left 6 continuation lines.
   FIX: comment the full tail block. RETEST: next fire advanced past it.
2. Fired -> 422 indent (swp_drops += 1 at 12sp in 8sp block). FIX: re-indent.
3. Fired -> 422 PINE_RUNTIME_ERROR get_left. Bisected per-section: SWEEPS the trigger.
   Probed loop shapes p1-p7: ALL PASS in isolation. Root cause was NOT the loop.
4. Differential method removal: removing swp_isSet flips FAIL->OK. Traced to
   type/parameter shadow (float swp_piv vs type swp_piv). Renamed params. Still failed.
5. Bisected to the unshift sites: swp_get.br(...) UDT-method returns poison the array
   in PineTS. Inlined all 4 sites with direction literals bound per site. FIXED.
6. POOLS silent 0/0/0: traced to bsl_aZZ.in_out stale call (method renamed to
   bsl_roll, 2 call sites missed). Fixed -> POOLS draws 1/0/2.
7. Full file RUN_OK: boxes=112 labels=22 lines=45, 0 warnings. 4/4 subsystems draw.

## What RUNNING taught
- PineTS 0.10.0 does not tolerate UDT-returning methods invoked on array elements;
  TradingView does. The merge must carry BOTH shapes: method def retained, call
  sites inlined. (L-5 note: this is an engine-compat shim, not a logic change.)
- for-in over UDT arrays with a field-na seed needs the na-guard; TradingView
  tolerates it, PineTS throws on the seed.
- A rename pass that touches method params can shadow type names; the linter
  (identifier-level) cannot see it — only a runtime fire catches it.
- Bare 3-letter input names (len) and single-letter methods (n/p/l/br) are the
  highest-risk renames; both bit.

## Residual
- TradingView-operator steps (save 0 errors, chart render, eyes parity) still need
  the operator's profile. Station evidence stands in as the mechanical proxy.
- POOLS thinness (1 box vs source 8) is threshold/bar-count dependent, not a defect
  proven — needs the 3000-bar run + eyes.

---

## 2026-10-05 — THE E1 AUTOMATIC SESSION (H6: what RUNNING taught that READING could not)

Driver: the live render (:9851 pv-server + :9222 CDP on display :3). Every finding below was
taught by DRIVING the render, not by reading the source — each is invisible to a source audit.

1. **THE E1 ZONE LABELS WERE DRAWN-BUT-INVISIBLE — the 500-label cap.** The payload carried the 5
   role names and the render called `label.new` for each, yet ZERO showed. RUNNING revealed: the
   v1 SMC layer draws ~1661 labels (`plutus-vision-v1.pine:102/110/123` + the internals/OB
   families), consuming the whole `max_labels_count = 500` budget; the E1 tags draw LAST and are
   silently DROPPED. The census reading exactly "500 labels" is the tell of a saturated cap. A
   source read cannot see this — the label IS in the source and IS created at runtime; the
   RENDERER drops it. FIX: all 5 SMC label families off + cap 2000 (the generated v2 only).

2. **THE E2 PATH LOOP SUPPRESSED EVERY LABEL.** A `for i = 0 to _n-2` loop of
   `line.new(..., xloc = xloc.bar_time)` carrying FUTURE offsets OVER-DRAWS (a constant +1721
   lines) AND suppresses the entire label pass — the E1 tags vanish; census "0 labels". Isolated
   `xloc.bar_time` loops render fine; the day-anchor path (4-5 segments) renders fine at cap 500;
   the SAME loop at a raised cap breaks. THE RENDERER's label budget and its line loop interact —
   past the budget it breaks. RUNNING taught this; no source read would. FIX: unroll the loop
   into 4 explicit `line.new` calls + `e2Enabled` default false (the renderer cannot paint the E2
   path AND the E1 labels together).

3. **THE RENDERER IS THE BINDING CONSTRAINT, NOT THE PINE.** The vela PineTS renderer is
   INCONSISTENT across runs of the SAME build: it renders, over-draws, or TIMES OUT. The 500-label
   cap was PROTECTING it; raising the cap past ~its budget triggers the over-draw. A Pine-source
   audit would never surface this — it is an engine behaviour.

4. **THE ANCHOR IS `bar_index` — and bar replay follows it.** The operator's ask ("base it on the
   most recent bar of the chart that is active") resolved to `_bAnchor = bar_index` (NOT the
   earlier `_barsBack` clamp). Driving the render confirmed the zones recompute on rewind
   (`bars 1614 -> 41`). The E1 tests ST-8c/f/d asserted the OLD `_barsBack` shape — a stale
   test, not a defect; the PROPERTY (both bounds from one anchor bar) is unchanged.

5. **THE DEGREE VOCABULARY DRIFTED (a real defect RUNNING caught).** The render emitted
   `MODERATE-HEAVY` (hyphen) while the canon (`scripts/e2_engine.py` DEGREES + `e1_extract.py`)
   uses `MODERATE_HEAVY` (underscore). The render maps the payload's `degree_v8` through
   `f_e1PressureLbl`; a hyphen would fail to match the payload's underscore value. Fixed to the
   canon vocabulary. `e1_render_tests` was 16/7 — a genuinely-unreported gap.

6. **THE DESKTOP APP (the operator's ask).** A Tauri (Rust + system libwebkit2gtk-4.1) first-class
   desktop app, `pine-ide` from any cwd, on the operator's REAL GNOME Wayland session (never the
   nested weston :3). MEASURED 572 MB RSS vs the legacy full-Chrome 1685 MB (2.9x lighter). The
   legacy full-Chrome was killed for memory pressure; the Tauri shell is the memory-efficient path.

## What RUNNING taught (the session's transferable lessons)
- A census label count that EXCEEDS the visible labels = labels created but not PAINTED (the
  renderer, not the source). The census reading exactly the cap = saturation.
- A Pine `line.new` LOOP with future bar_time offsets corrupts the renderer's whole label pass —
  unroll it.
- The chart's own bar (`bar_index`) is the correct anchor for replay-following; a Python-computed
  anchor is a stale-relative-week hazard.
- The engine is the constraint; the source can be perfect and the pixels wrong.

## Residual (the unswept frontier)
- The E2 path + the E1 labels cannot paint TOGETHER (the vela renderer limit) — E2 defaults off.
- The live replay rewind IS now CDP-drivable and WAS re-driven (see the A1 entry below): the
  vela replay control lives at `window.PlutusPineShell.chart.replayControl.ctrl` (`replayStart`
  / `replayStep` / `replayState` / `replayStop`) — the C11 follow confirmed live (census
  1614→988 on start, cursor advancing, the zones re-anchoring), and the live state restoring
  (`bars 1614`, the 5 labels back).
- The WebKit canvas (the desktop app) — RESOLVED 2026-10-05: the desktop app (Tauri/WebKitGTK)
  was CAPTURED and LOOKED AT (display :3, window "Plutus Vision — Pine IDE", 1626x931). It
  renders the 5 labelled zones (`IP Resistance Ceiling | Lig…` … `Support Floor | Light 19…`),
  the SAME as Chrome — so the WebKit hypothesis (that it might paint both the E2 path and the
  labels) is DISPROVEN: the labels render with E2 off, exactly as Chrome. The E2/labels limit is
  RENDERER-INDEPENDENT (the vela PineTS draw-order limit, confirmed on both engines). The
  desktop app is the OPERATOR'S PRODUCT and it works.

## THE ANCHOR INDEX (the file:line refs for the 2026-10-05 findings)
- `data/e1/DXY-2026-07-06.json:2074` — the zone name (`"name": "IP Support Floor"`; the 5 roles
  the E1 render labels). The render sources are `plutus-vision-lqz/e1-render.pine:141` (the
  degree vocabulary, fixed to the canon underscore) and `:184` (the anchor `_bAnchor = bar_index`).
- `.omp/ct-results.json:1` — the W9 host-live A1-A7 artifact (`overallVerdict: PASS`, artifact
  sha 471a7849). The render fix lives at `scripts/lqz_vision_v2_build.py:326` (the cap raise +
  the 5 SMC label families off) and `plutus-vision-lqz/e2-render.pine:18` (`e2Enabled` false).
- `TESTING_LOG.md:1429` — the AUDIT GATE: PASS line (the verboo-lane scan). The E2 shape legs
  are `scripts/e2_engine.py:504`; the ST-8c anchor assertion is `scripts/e1_render_tests.py:150`.
- `scripts/pv-ide.sh:1` — the launcher (the rig :9741/:9754/:9851 + the Chrome on :3).
- `desktop/pine-ide:1` — the Tauri desktop launcher (the operator's `pine-ide` command).
- `Makefile:11` — `WEEK ?= auto` (the chart-derived week; the "hardcoded" defect's fix).

THE LESSON (restated, load-bearing): the renderer is the constraint; the source can be perfect
and the pixels wrong. Every finding above was taught by DRIVING the live render.

## 2026-10-05 (final) — THE E2 PATH SUPPRESSES THE E1 LABELS EVEN UNROLLED

Re-ran the E2 question with the UNROLLED path (4 explicit `line.new`, no loop). Census with
E2 on = **431 lines, 1735 labels**; with E2 off = **28 lines, 6 labels**. So the UNROLL raised
the label COUNT (the loop's over-draw is gone) — BUT the E1 role labels are STILL NOT PAINTED
with E2 on: a huge red `size.huge` label at a fixed visible x (`bar_index - 30`) did NOT
appear, while the SAME label with E2 off DOES (the 5 role names visible: `IP Resistance
Ceiling | Lig…` .. `Support Floor | Light 9%…`). CONCLUSION: the vela PineTS renderer cannot
paint the E2 path lines AND the E1 labels together — the path's line geometry suppresses the
label pass, regardless of loop vs unroll. `e2Enabled` defaults false (the E1 map with labels is
the product). The chart now shows the 5 labelled institutional-pressure zones (verified by
looking, this turn).

## 2026-10-05 (A1) — THE LIVE REPLAY REWIND: DRIVEN, AND THE C11 FOLLOW CONFIRMED

THE FRONTIER CLOSED. The prior residual held that A1 (the live replay rewind) "was not re-driven
because the vela replay UI is not CDP-drivable." MEASURED FALSE this session: the vela replay
control is reachable from the page at `window.PlutusPineShell.chart.replayControl.ctrl` — the
shell exposes the mounted chart on `window.PlutusPineShell` (`pine-ide/pine-ide/pine-ide.mjs:763`,
`window.PlutusPineShell = handle`), and the chart object carries `replayControl.ctrl` whose
prototype methods are `replayStart({from})` · `replayStep()` · `replayPause()` · `replayStop()` ·
`replayState()` · `replayBounds()` (source
`pine-ide/pine-station/node_modules/@luxalgo/vela/dist/chunk-QBPUT5SU.js:22961` `replayStart(opts)`,
and the vela `start(opts)` at `chunk-E3GU6AUI.js:6772` → `ref.chart.replay.start({ from: opts.from })`).
The FIRST attempt failed on the arg shape — `ctrl.start()`/`ctrl.step()` are not functions (the
state object, not the controller) and `ctrl.replayStart()` with no arg throws
`TypeError: Cannot read properties of undefined (reading 'from')`; the fix is the `{from}` bound
from `ctrl.replayBounds()` (`{first: 1775041200000, last: 1783317600000}`).

THE OP (pre-registered expectation → observed → verdict):
- OP-A1.1 — `ctrl.replayStart({from: first + 0.6*(last-first)})` mid-range. EXPECTED: the replay
  activates and the shell's C11 `replay:start` handler fires, feeding the study the bars UP TO the
  cursor. OBSERVED: `replayState()` → `{active:true, cursorTime:1780005600000, remaining:626}` and
  the census moved `bars 1614 → 988` — the study re-ran against the truncated series. VERDICT: PASS
  (the C11 follow is real).
- OP-A1.2 — `ctrl.replayStep()` ×3. EXPECTED: the cursor advances one bar-close per step and the
  census tracks. OBSERVED: `cursorTime` 1780005600000 → 1780009200000 → 1780012800000 →
  1780016400000; `remaining` 626 → 623; census `988 → 991`. VERDICT: PASS (bars revealed one at a time).
- OP-A1.3 — the VISUAL: the rewound render (census `28 boxes · 22 lines · 6 labels · bars 991`,
  the frame ~May 21-29) shows the E1 institutional-pressure zones re-anchored to the rewound last
  bar — the anchor (`_bAnchor = bar_index`) follows the replay point. VERDICT: PASS.
- OP-A1.4 — `ctrl.replayStop()`. EXPECTED: the replay ends, the full series returns, the study
  re-runs at the live end. OBSERVED: `replayState()` → `{active:false, cursorTime:null, remaining:0}`
  and the census restored to `bars 1614 · 34 boxes · 28 lines · 6 labels` with the 5 role labels
  back on the right edge (`IP Resistance Ceiling | Lig…` … `Support Floor | Light 19…`). VERDICT: PASS
  (both directions — the rewind follows AND the live restores).

WHAT RUNNING TAUGHT THAT READING COULD NOT: the replay control is NOT a DOM widget (no
`.replay` on the workbench, no `window.wb`/`window.S` escapes, no object attached to any element);
it is reachable ONLY via the shell's exposed `window.PlutusPineShell.chart.replayControl.ctrl`, and
its `replayStart` REQUIRES a `{from}` epoch-ms bound (the zero-arg call throws on `opts.from`).
A source read of the shell's C11 handler (`pine-ide.mjs:203-221`) shows the `replay:step/start/end`
subscription but NOT the drive path; only DRIVING it proves the follow fires. The C11 mechanism
(`S.bars` truncated to `cursorTime` ≤ the cursor, then `scheduleRun()`) is now CONFIRMED live, not
merely asserted. RESIDUAL: none on A1 — the frontier is closed; the sole named residual is the
E2/labels-coexistence renderer limit (above), and the untested WebKit-canvas possibility.
