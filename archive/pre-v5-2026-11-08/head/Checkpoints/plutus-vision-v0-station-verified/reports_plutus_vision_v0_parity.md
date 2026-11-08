# PLUTUS VISION v0 — PARITY REPORT (station renders, EUR/USD 4H, limit 300)

Merged SHA: fb752a1c4152817ea82eccd04bf5ae8f0981445367e6ec8a4dcd19ed8eae04d4
Station: PineTS 0.10.0 on :9641 (standalone fork pine-ide-fork)
Date: 2026-10-01

## Subsystem renders (merged file, per-section isolation + full file)

| subsystem | boxes | labels | lines | verdict |
|---|---|---|---|---|
| SMC | 5 | 22 | 19 | PASS — draws |
| SWEEPS | 12 | 0 | 24 | PASS — draws |
| VOIDS | 94 | 0 | 0 | PASS — draws |
| POOLS | 1 | 0 | 2 | PASS — draws (thin: cluster gate needs 3+ pivots) |
| FULL FILE | 112 | 22 | 45 | RUN_OK, 0 warnings |

## Parity vs the 4 original sources (same station, same bars)

| subsystem | source counts | merged counts | verdict |
|---|---|---|---|
| SMC | 5 / 22 / 19 | 5 / 22 / 19 | EXACT MATCH |
| VOIDS | 94 / 0 / 0 | 94 / 0 / 0 | EXACT MATCH |
| SWEEPS | 422 engine error | 12 / 0 / 24 | MERGED SUPERIOR — source fails on PineTS (UDT-method return), merged inlined version runs |
| POOLS | 8 / 0 / 6 | 1 / 0 / 2 | PARTIAL — same gate shape, fewer clusters on 300 bars; threshold or bar-count dependent, under investigation |

## Engine-limitation adaptations (behavior-identical on TradingView)
1. for-in over box-UDT arrays + na-guard (seed-element tolerance).
2. swp_break_box method inlined at 4 call sites (UDT-returning method on array element).
3. Direction literal bound per site (method param has no scope when inlined).
4. bsl_aZZ.bsl_x reverted to bsl_aZZ.x (array-field over-rename).
5. bsl_aZZ.in_out reverted to bsl_roll (method rename missed 2 call sites).
6. swp_len scoping (bare len input + 4 call sites).
7. voi_b.voi_l / bsl_b.bsl_i field reverts (12 + 35 sites).
8. Type/parameter shadow renames (swp_piv param, swp_pct param).

All adaptations are engine-compat shims: zero logic change on TradingView semantics.
