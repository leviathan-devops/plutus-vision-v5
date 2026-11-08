# PLUTUS VISION v0 — MASTER PROMPT (the operator's operating depth)

The /goal pin is the entry. THIS file is the depth. Read in this order:
1. packages/plutus-vision-v0/MASTER_PROMPT.md   (this)
2. packages/plutus-vision-v0/DPL1_SPEC.md        (the contract)
3. packages/plutus-vision-v0/WAVE_PLAN.md        (WAVES: 4)
4. e1/vision/PLUTUS_VISION_V0_BLUEPRINT.md       (1057L — the design authority)
5. ../../luxalgo-smc/DESIGN_ANALYSIS.md          (the Tier-0 deep read)
6. ../../luxalgo-smc/PLUTUS_VISION_COMPONENTS.md (the tier map)

## WHAT THIS BUILD IS
Four LuxAlgo open-source Pine indicators merged into one, rebranded
"Plutus Vision v0". Zero new detection logic. The merge is an ASSEMBLY.

## THE FOUR (measured SHAs this session)
| # | slug | lines | sha256 (16) |
|---|---|---|---|
| 1 | smart-money-concepts-smc | 847 | a8046ad353c1b495 |
| 2 | liquidity-sweeps | 160 | c81921370a81425e |
| 3 | liquidity-voids-fvg | 112 | e2a5223d726f43fa |
| 4 | buyside-sellside-liquidity | 347 | 6cc2fd6ea98cfa77 |

## THE THREE COLLISIONS (measured, not guessed)
1. `type bar` declared TWICE (voids:37, bsliq:59) — a hard Pine compile error.
2. Seven top-level names shadowed across files: atr, b, i, mode, per, ph, pl
   (`b` is the bar object in BOTH voids and bsliq) — silent last-wins.
3. Object demand 2,000 boxes (4 x 500) vs Pine's hard ceiling of 500 per type.
Plus 4 single-letter SWEEPS methods (n, p, l, br) — the riskiest renames.

## THE FOUR INSTRUMENTS (no artifact exempt)
I-1 lexcheck.py — 0 duplicate types / idents / titles. Runs before AND after.
I-2 the compile — TradingView save must read `0 errors`.
I-3 the starvation probe — all 4 subsystems draw > 0 on a dense chart.
I-4 the behavior diff — 0 non-identifier deltas across the ~10 core functions.

## THE BUDGET (Pine's ceiling forces rationing)
boxes  SMC 200 / SWEEPS 125 / VOIDS 100 / POOLS 75 = 500
lines  SMC 200 / SWEEPS 150 / VOIDS 0    / POOLS 150 = 500
labels SMC 250 / POOLS 50 / others 0               = 300
Dropping past a cap is LOUD: increment the subsystem's drop counter. A
subsystem with drops while a peer has none is being out-competed -> rebalance.

## THE HONEST BOUNDARY (do not let this be lost)
v0 renders LUXALGO's zones, not E1's. The coverage claim ("85% of E1") is about
CONSTRUCT COVERAGE and is accurate — but v0 is a LOOK-ALIKE of E1's view, not
E1's view. v1 swaps the DETECTORS for E1's export and KEEPS the renderers
(~60% of the merged lines are pure geometry that survives).

## THE LICENSE (Fork A — the operator's call)
All four carry CC BY-NC-SA 4.0 (verified in the headers this session):
BY attribution (keep `// © LuxAlgo`), NC non-commercial, SA share-alike.
Default taken: ship as a DERIVATIVE with attribution. Clean-room reimplement
only if Plutus Vision ever ships to anyone else. The methodology is not
copyrightable; this CODE is.

## THE TWO PRIOR-ART SHELLS ON DISK
trident_v8_multi_pair_template.pine (792L) + trident_phase2.pine (686L):
the OLD Plutus renderer (IP heatmap RED/ORANGE/TEAL, 6 pressure tiers, the
info table, the paste-buffer). Two things to mine:
- the table machinery (cell/divider) for the info panel,
- the `xloc.bar_time` timestamp windowing (tsL/tsR) — the full-width lesson.
Do NOT resurrect the generator path (Plutus -> JSON -> .pine). v0 is LIVE.

## THE FULL-WIDTH NOTE (operator-reported, verified this turn)
SMC's order-block boxes use `extend = extend.right` (smc:305,308); SWEEPS has
an `Extend` toggle calling `set_right(bar_index)` every bar (sweeps:151);
VOIDS extends live boxes (voids: cb.set_right(b.i+1)). So the sources ALREADY
push to the right edge. Check the Extend toggle, the Max-bars cap, and
present-mode before touching any geometry.

## WHAT v0 DOES NOT DO (the named residual)
- no E1 export wiring (v1)
- no Tier-1 calibration beyond batch 1 (EQH/EQL, CISD, Trap)
- no CISD-to-E3-TP calibration yet
- the 9 closed LuxAlgo indicators (PAC etc.) are UNREADABLE — never stubbed
- Pine cannot read a local file: the v1 export channel is UNRESOLVED

## THE FIRST ACT
Re-measure the 4 core SHAs. If they match, fire W1: write lexcheck.py, run it
on the 4 sources, and let its OUTPUT be the rename worklist. The report is the
build's input, never an obstacle.
