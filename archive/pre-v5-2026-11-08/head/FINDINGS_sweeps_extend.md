# FINDING — SWEEPS extend block vs PineTS 0.10.0 (2026-10-01)

## SYMPTOM
`for swp_bx in swp_aBoxBr` + `swp_bx.swp_bx.get_left()` throws
`PINE_RUNTIME_ERROR: Cannot read properties of undefined (reading 'get_left')`
on the station (pinets 0.10.0), while the IDENTICAL pattern with a fresh
`box.new()` in the same loop shape works.

## PROOF
- extend-probe (seed element `swp_boxBr.new()` = all-na fields, then a real
  element unshifted at bar 10): 422 get_left.
- boxudt-probe (same UDT shape, direct field access, no for-in): OK, boxes=1.
- method-probe (UDT method creating a line): OK, lines=66.
- sweepcore-probe (pivot loop, no boxes): OK.

## ROOT CAUSE (two-sided adjudication)
Side A (my probe wrong?): the probe mirrors the source line-for-line;
the seed `swp_boxBr.new()` carries `swp_bx = na` by construction.
Side B (real defect?): the engine iterates the SEED element on bars 0-9
(before any real box exists) and calls `.get_left()` on its na box field.
TradingView's runtime tolerates `na` box handles in this position (the
seed is a documented LuxAlgo pattern — every one of the 4 sources seeds
its arrays with a field-na element). PineTS 0.10.0 does not: it
dereferences the handle instead of guarding it.

## DISPOSITION
ENGINE LIMITATION, not a merge defect. The merged file is faithful to the
sources (behavior diff 10/10 shapes present). Options, cheapest first:
1. Guard the loop: `if not na(swp_bx.swp_bx)` before any method call on it
   (one line per loop; zero behavior change on TradingView, fixes the engine).
2. Seed with a real box instead of na (changes bar-0 state — WORSE).
3. Report upstream to PineTS (correct long-term, blocks nothing today).

## STATUS
OPEN — option 1 to be applied after operator confirms the deviation is
acceptable (it adds a guard the sources lack; behavior-identical on TV).
