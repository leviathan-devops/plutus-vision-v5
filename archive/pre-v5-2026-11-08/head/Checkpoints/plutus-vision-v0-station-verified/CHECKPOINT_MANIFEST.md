# CHECKPOINT plutus-vision-v0-station-verified

Date: 2026-10-01 · Mode: NO LOCK (living snapshot)
Merged SHA: fb752a1c4152817ea82eccd04bf5ae8f0981445367e6ec8a4dcd19ed8eae04d4
Lines: 1510
Engine: PineTS 0.10.0 (forked standalone station, :9641)

## WHAT IS VERIFIED IN THIS CHECKPOINT
- lexcheck PASS (0 findings) — run against THIS sha
- single indicator() declaration (1)
- LuxAlgo attribution retained (5 mentions)
- per-subsystem render 4/4: SMC 5/22/19 · SWEEPS 12/0/24 · VOIDS 94/0/0 · POOLS 1/0/2
- full artifact RUN_OK 112 boxes / 22 labels / 45 lines, 0 warnings
- adversarial: positive GREEN, negative GREEN, 12/12 fixture cells GREEN
- behavior diff 10/10 core shapes present modulo identifiers

## THE EIGHT ENGINE-COMPAT SHIMS (PineTS only; Pine-legal)
1. for-in over box-UDT arrays + na-guard (seed-element tolerance)
2. swp_break_box method inlined at 4 call sites (UDT-returning method on array element)
3. direction literal bound per inlined site (method param has no scope when inlined)
4. bsl_aZZ.bsl_x reverted to bsl_aZZ.x (array-field over-rename, 8 sites)
5. bsl_aZZ.in_out reverted to bsl_roll (method rename missed 2 call sites)
6. swp_len scoping (bare len input + 4 call sites)
7. voi_b.voi_l / bsl_b.bsl_i field reverts (12 + 35 sites)
8. type/parameter shadow renames (swp_isSet param, swp_pct param)

## HONEST GAPS (verbatim, not softened)
- TRADINGVIEW IS UNVERIFIED. Every gate ran on PineTS 0.10.0, a PROXY. No run has
  proved TradingView's compiler accepts the source; no eyes have seen a chart.
- VISUAL PARITY IS COUNTS, NOT PIXELS. SMC + VOIDS match sources exactly on counts;
  SWEEPS source 422s on PineTS so no parity number exists; POOLS draws 1 where the
  source draws 8 (threshold/bar-count dependent, NOT proven benign).
- THE BOX BUDGET IS DOCUMENTED, NOT ENFORCED. 3 of 12 cells sit within 40 boxes of
  the 500 ceiling. OPEN finding, deliberately unfixed in v0.
- AUDIT GATE: BLOCKED (no audit artifact on disk). Never PASS.
- Tier-1 LuxAlgo validation never started.

## CONTENTS (15 files)
  BUNDLE_MANIFEST.md
  FINDINGS_sweeps_extend.md
  P5_ADVERSARIAL_VERDICT.md
  PLUTUS_VISION_V0_BLUEPRINT.md
  RUNTIME_LEDGER.md
  TESTING_LOG.md
  packages/DPL1_SPEC.md
  packages/MASTER_PROMPT.md
  packages/WAVE_PLAN.md
  plutus-vision-v0.pine
  reports_plutus_vision_v0_parity.md
  scripts/lexcheck.py
  scripts/p5_adversarial.py
  scripts/starvation_probe.ts
  scripts/verify_four.py
