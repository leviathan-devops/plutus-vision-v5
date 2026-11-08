# 08 — THE SPLIT TEST (the deferred accuracy comparison)

**Status:** SPECIFIED, EXECUTION DEFERRED to W10. This document exists so the test is not lost
between sessions.

---

## §1 THE QUESTION

The operator wants to know whether `trident_v8.pine`'s hand-tuned liquidity zones (the LSZ block,
`:367-377`) or our DERIVED liquidity ladder (from `plutus-vision-v1.pine`'s sealed ladder +
`e1_extract.py`'s sweeps) is more accurate. The two arms are now SEPARATED: the LSZ block is
frozen in `reference/trident_v8_lsz.pine` (sha `db24a18cc8cdd234…`), never ported into the render.

## §2 THE TWO ARMS

```
ARM A (the reference)  reference/trident_v8_lsz.pine   — v8's hand-tuned LSZ
                       the source: trident_v8.pine:160-162 (colours) + :367-377 (the block)
                       the zones: dxy_xTp/xBt (hardcoded: 97.68,97.88,98.02,98.58,98.34,99.23)

ARM B (ours)           the plutus liquidity ladder (v1, sealed) + e1_extract's sweeps
                       the zones: the derived ladder, green (#2E8B57), the measured 27 zones
```

## §3 THE INSTRUMENT (the same scoring for both)

```
for each arm, over a week's OHLC bars:
  for each zone (top, bottom, kind):
    the zone is TOUCHED if any bar's high ≥ bottom and low ≤ top
    the zone is CORRECT if, within M bars of the touch, price reversed ≥ N pips
  score = correct / touched
```

**The parameters (to be calibrated, not invented):** N (the pip reversal) and M (the bars) are
DERIVED from the fixture's own volatility, not picked. The derivation is part of W10's spec.

## §4 THE VERDICT RULE

```
if score_A > score_B * 1.05:   "arm A (v8 LSZ) wins"
if score_B > score_A * 1.05:   "arm B (ours) wins"
else:                          "within 5% — report BOTH, no false winner"
```

**The honesty clause:** a within-5% result reports BOTH scores and declines to crown a winner. A
false winner is worse than no winner.

## §5 THE PREREQUISITES

1. W9 done (a working render exists to reconstruct arm A on the rig)
2. the fixture week is fixed (the same week for both arms)
3. the reversal threshold N is derived (the volatility of the week)
4. the bar window M is derived

## §6 THE BLAST RADIUS

- `08-SPLIT-TEST.md` (the results section, appended)
- NO production file changes — the test READS both arms, writes only the results

## §7 THE STATUS

```
THE FROZEN ARM   reference/trident_v8_lsz.pine   sha db24a18cc8cdd2349ce2419b1a1439c089ce32d634cdb85d1953f3855a54f985
THE RESULTS      (unwritten — W10)
```

## ANCHOR INDEX (path:line)

- `plutus-vision-e1-automatic_DPL1_SPEC.md:1 (the spec)`
- `MASTER_BLUEPRINT.md:1 (the machinery)`
- `06-WAVES.md:3 (the waves)`

## §8 — THE INSTRUMENT'S CONSTRUCTION (the details)

The accuracy instrument is a small scorer over a week's OHLC + a zone set:

```python
def score(arm, bars, N_pips, M_bars):
    touched = correct = 0
    for (top, bottom, kind) in arm:
        for i, b in enumerate(bars):
            if b.high >= bottom and b.low <= top:          # the zone was touched
                touched += 1
                # did price REVERSE within M bars (a rejection, not a pass-through)?
                window = bars[i:i+M_bars]
                if kind == "resistance" and max(w.high for w in window) - b.high >= N_pips:
                    correct += 1
                elif kind == "support" and b.low - min(w.low for w in window) >= N_pips:
                    correct += 1
                break
    return correct / touched if touched else 0.0
```

## §9 — THE PARAMETER DERIVATION (never invented)

`N_pips` (the reversal threshold) and `M_bars` (the reaction window) are DERIVED from the
fixture's own volatility. The derivation:

```
N_pips = the 75th percentile of the week's per-bar true range, in pips
M_bars = the median number of bars a swing takes to resolve (measured from the fixture)
```

A threshold PICKED rather than DERIVED is a defect (it fits the result).

## §10 — THE ARMS, STATED PRECISELY

```
ARM A (the reference)  reference/trident_v8_lsz.pine — v8's hand-tuned LSZ
                       the zones: dxy_xTp/xBt (the operator's arrays)
ARM B (ours)           plutus-vision-v1.pine's ladder + e1_extract's sweeps
                       the zones: the derived ladder (the measured 27 zones)
```

Both arms score against the SAME week's bars, with the SAME N/M. A different N/M per arm is a
rigged test.

## §11 — THE VERDICT + THE HONEST CLAUSE

```
|score_A - score_B| <= 0.05 * max(score_A, score_B)  ->  "within 5% — report BOTH"
score_A > score_B * 1.05  ->  "arm A (v8 LSZ) wins"
score_B > score_A * 1.05  ->  "arm B (ours) wins"
```

A within-5% result crowns NO winner. The crown is earned, never assumed.

## §12 — THE TERMINATION

The split test runs ONCE per fixed week (no p-hacking by re-running). The result is recorded with
the fixture sha, the N/M derivation, and both raw scores — so a fresh session reproduces it.
