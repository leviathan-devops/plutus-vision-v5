# PLUTUS VISION v0 — WAVE PLAN
WAVES: 4

Files disjoint per wave. W1 lands interfaces before W2/W3 fan out.

## W1 — NAMESPACE + SINGLE DECLARATION (the interface wave)
- owner: merge desk
- files: plutus-vision-v0.pine (first write), scripts/lexcheck.py
- deliverable: one file, one indicator() decl, 13 type renames, 7 global
  renames, 4 single-letter method renames — no behavior change
- gate: lexcheck reports 0 duplicate types / 0 duplicate idents / 0 dup titles
- test ids: test_lex_no_type_collision, test_lex_no_shadowed_global

## W2 — THE FOUR SUBSYSTEMS MERGED (parallel with W3)
- owner: merge desk
- files: plutus-vision-v0.pine (SMC + SWEEPS + VOIDS + POOLS bodies)
- deliverable: all four draw; BSLIQ embedded-voids overlay forced OFF
- gate: TradingView save 0 errors; 4/4 subsystems render on EURUSD H4
- test ids: test_smc_structure_draws, test_sweep_box_on_wick_raid

## W3 — OBJECT BUDGET + STARVATION PROBE (parallel with W2)
- owner: budget desk
- files: plutus-vision-v0.pine (budget allocator), scripts/starvation_probe.ts
- deliverable: one 500-box pool split 200/125/100/75 + per-subsystem drop counters
- gate: starvation probe returns 4/4 subsystems > 0 drawn on a dense chart
- test ids: test_budget_allocation_sums, test_starvation_none_zero

## W4 — PARITY + MANIFEST + TIER-1 SCREEN (depends W1+W2+W3)
- owner: verify desk
- files: BUNDLE_MANIFEST.md, reports/plutus_vision_v0_parity.md
- deliverable: visual parity vs the 4 originals; manifest filled from real runs
- gate: behavior diff 0 non-identifier deltas across 10 core fns; manifest has
  no UNFILLED markers
- test ids: test_behavior_diff_zero, test_manifest_no_unfilled
