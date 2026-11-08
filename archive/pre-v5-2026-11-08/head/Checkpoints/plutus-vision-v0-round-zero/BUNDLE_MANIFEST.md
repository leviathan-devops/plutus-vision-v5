# PLUTUS VISION v0 — bundle manifest

## SOURCES (measured, pinned)
| # | file | lines | sha256 (16) |
|---|---|---|---|
| 1 | smart-money-concepts.pine | 847 | a8046ad353c1b495 |
| 2 | sources/liquidity-sweeps.pine | 160 | c81921370a81425e |
| 3 | sources/liquidity-voids-fvg.pine | 112 | e2a5223d726f43fa |
| 4 | sources/buyside-sellside-liquidity.pine | 347 | 6cc2fd6ea98cfa77 |

## MERGED ARTIFACT
- path: e1/vision/plutus-vision-v0.pine
- sha256: 4b3ee0ca68d86ca727f1f2a980f8ec53815d58ddef5b4354e91db96765ecc1a4
- lines: 1497
- license: CC BY-NC-SA 4.0 derivative — © LuxAlgo attribution retained (5 mentions)

## VERDICT BLOCK
| gate | result | evidence |
|---|---|---|
| lexcheck (I-1) | PASS | scripts/lexcheck.py exit 0, 0 findings (run this turn) |
| single declaration | PASS | grep -c ^indicator( = 1 |
| BSLIQ voids default | PASS | bsl_lqVoid = input.bool(false, ...) line 1158 |
| starvation probe (I-3) | PASS | 10/10 rows via bun, RC=0 |
| UDT field consistency | PASS | every access matches a declared field (14 UDTs) |
| behavior diff (I-4) | PASS (static) | 10/10 core shapes present byte-identical modulo identifiers (5 SMC fns + 2 sweep comparisons + 2 void formulas + 1 pool threshold); chart confirmation PENDING |
| compile (I-2) | UNFILLED | needs TradingView Pine editor save — operator step |
| 4/4 render (I-3b) | UNFILLED | needs EURUSD H4 chart — operator step |
| visual parity (W4) | UNFILLED | needs side-by-side vs 4 originals — operator step |

## KNOWN FINDINGS THIS BUILD
1.  collision (voids:37, bsliq:59) — split to voi_bar/bsl_bar. FIXED.
2. 7 shadowed globals — prefixed per §14. FIXED.
3. SWEEPS n/p/l/br single-letter methods — expanded. FIXED.
4. UDT-field over-rename (voi_b.voi_l ×12, bsl_b.bsl_i ×35) — reverted, fields keep source names. FIXED.
5. Object demand 2,000 vs ceiling 500 — 200/125/100/75 allocator + loud-drop counters wired. PROVEN by probe.
6. BSLIQ embedded-voids overlay ships default false — verified at line 1158. NO CHANGE NEEDED.

## RESIDUAL
- TradingView compile + render + parity: operator-side, UNFILLED.
- Tier-1 validation batch (EQH/EQL, CISD, Trap): not started.
- CISD-to-E3-TP calibration: not started.
- License fork A ruling: operator-owned, default taken (derivative + attribution).
