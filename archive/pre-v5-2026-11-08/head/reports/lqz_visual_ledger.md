# LQZ VISUAL LEDGER — the panel look, 2026-10-01 (1H, EUR/USD, 1603 bars, display :3)

Every row below is a frame I opened and read MYSELF. No VLM, no count-only verdict.
The frame's sha256 is the evidence; a row without it is not a look.

| # | deliverable | frame | sha256 | status bar | what I SAW |
|---|---|---|---|---|---|
| 1 | D3 plutus-vision-v1 | /tmp/look-now.png | 5c4285258a36d4b6 | 5 boxes · 50 lines · 21 labels | CLEAN. Thin full-width colour-coded lines; candles fully visible; SMC zones subtle (blue 1.1350-1.1375, green band 1.1430-1.1470); SMC labels CHoCH ×5, EQH, EQL, BC. Matches the library signature. |
| 2 | D2 lqz-plutus | /tmp/panel-D2-1H.png | b2b5b5ba552ffc0a | 0 boxes · 58 lines | CLEAN, BEST MATCH. 58 thin full-width lines; ~35 green #3E8A46 below price, ~23 red #7F3613 above; irregular spacing; nothing occludes the candles. This IS the measured library rendering. |
| 3 | D1 lqz-luxalgo (1st look) | /tmp/panel-D1-1H.png | e7694c1692c68e42 | 117 boxes · 36 lines | WRONG. Large filled blocky zones (green/red/maroon/grey) from the LuxAlgo detectors' OWN primitives dominate; only 36 thin LQZ lines. Reads as three original renders PLUS a layer, not "one display". |
| 4 | D1 lqz-luxalgo (after suppression) | /tmp/panel-D1-v3.png | a0f96c396c8168f7 | 117 boxes · 36 lines | **PASS.** The saturated blocks are gone. Remaining: thin full-width colour-coded LQZ lines + very faint 3-source fills (alpha 10). Candles unobstructed. This IS "three detectors, one display". |

## THE FRAME-SWAP FIX (why these looks are trustworthy)
Operator report: *"the colors are really bright which looks like multiple rounds are stacking on top
of each other."* Root cause: every drawing is `locked` (so the user cannot drag/delete indicator
output) and the store's `remove()` honours that lock — so `clearDrawings()` removed NOTHING and each
compile stacked a fresh frame. **Every visual verdict taken before commit `122eb16` was on
accumulated layers.** Fixed by unlocking before removing.
Evidence: `cleared: 58` (D2) and `cleared: 153` (D1) in the live state after the fix.

## PER-DELIVERABLE VERDICT
- **D2 lqz-plutus — PASS (rendering).** 58 lines, correct palette, correct sides, full width, no stacking.
- **D3 plutus-vision-v1 — PASS (rendering).** Clean; SMC + LQZ coexist; the SMC zone fills still read
  heavier than the library but do not bury the lines.
- **D1 lqz-luxalgo — PASS after two suppression rounds.** 12 colour constants silenced in place
  (same names, so every `.set_top()`/array push keeps working; detection untouched). Two misses cost
  a round each: the POOLS colours are declared `input.color (` **with a space** so the regex
  `input\.color\(` never matched, and the SWEEPS AREA colours `*_2`(50% alpha)/`*_3`(25%) were not
  listed — those were the large translucent bands dominating the frame.

## WHAT RUNNING TAUGHT THAT READING COULD NOT
1. A green box count is not a look. D3 read "39 boxes PASS" while the frame was a barcode.
2. A lock that protects the user also blocks the renderer — the two must be separated explicitly.
3. The engine's default 50-line cap silently dropped zones: D2 was drawing 112 zones into 50 lines.
4. `syminfo.mintick` is 1e-16 here, so a tick-based band floor renders invisible bands.
5. A fixed -500 bar left margin is NEGATIVE below 500 bars of history and those boxes are DROPPED
   silently — 15m=325 bars meant boxes=0 with no error.
6. Level volume is not the cluster's problem; 300 vs 1500 levels both gave 0 zones in D1's old form.


## W6 — THE PANEL GRID (`reports/panel-grid-1H.png`, 2002x1340)

![panel-grid-1H](panel-grid-1H.png)

[library reference | D1 luxalgo | D2 plutus | D3 vision], captured live over CDP, clipped to the
chart element. Panels 2-4 run on identical bars (EUR/USD 1H, limit 1603); panel 1 is the
operator's own GBPUSD capture and is captioned as the reference look, not this fixture.

### What I see, panel by panel
- **P1 LIBRARY REFERENCE** — the target: a ladder of thin full-width lines + large translucent
  zone bands ("15m (Unmitigated) | MoM", "4H Liquidity Shield - 2xC - BEAR CONQUERED").
- **P2 D1 lqz-luxalgo** (117 boxes / 36 lines) — thin lines present, faint bands; the earlier
  saturation is gone. Reads as a consolidated layer, not three stacked renders.
- **P3 D2 lqz-plutus** (0 boxes / 58 lines) — **the closest match to the library's ladder.**
  Dense stacked thin full-width lines, green below price / red above.
- **P4 D3 plutus-vision-v1** (5 boxes / 79 lines / 21 labels) — thin lines + SMC labels
  (CHoCH, EQH, EQL, BC) + zone bands; the only panel carrying structure text.

### Honest fidelity deltas for the operator's judgment
1. **D2's ladder is DENSER than the library's.** The library shows fewer, wider-spaced lines with
   large zone bands between them; D2 stacks lines tightly. If the operator wants the library's
   rhythm, that is a spacing/selection change in the emitter, not a bug.
2. **D3's zone fills still read heavier than the library's** — the SMC boxes are more saturated
   than the reference's soft bands.
3. Cosmetic: the grid's footer caption overlaps the bottom-left panel edge by a few pixels.

### The three defects this renderer had to survive (all caught mechanically)
1. **Every panel identical** (44613 bytes x3) — `setSource` + immediate `run()` races the editor.
2. **Off by one** — "the frame changed" was too weak a test; each panel froze the PREVIOUS
   deliverable.
3. **The real root cause**, named by the assertion: `run()` returns the compiled script's own
   `run.title`, and the FIRST run after `setSource` compiles the PREVIOUS source because the
   editor's `flush()` is debounced. Fixed as a FIXED POINT: run until the returned title IS this
   deliverable (measured: D1 1 run, D2 2 runs, D3 7 runs).
   The identical-panel guard now makes a non-distinct grid UNWRITABLE.
