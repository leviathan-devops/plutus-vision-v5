# LEXICON 1 — CANDLE-PRESSURE-LEXICON (pseudocode skeleton)

> The fork's intelligence file for the `candle-pressure` machine
> (`src/machines/candle-pressure.ts` — the registered MachineRule).
> Design authority: `MASTER_CONTEXT/PLUTUS_V4.5.4_LEXICON_SPEC.md` (LEXICON 1).
> Doctrine VERBATIM: "the rendered artifacts are the candles/zones/OHLC data ~ first
> principles macro context is the pressure mechanics, shape chain, etc — you must see
> what GENERATED the rendered artifact. the artifact itself is just the trigger."

## THE PURPOSE
Decode WHO won each battle from the candle's wick/body/close anatomy — the
defend/reject/sweep/dwell state that feeds the zone's pressure lifecycle.
The candle is the TRIGGER; the pressure state is the GENERATOR.

## THE INPUTS (the data contracts — the existing foundation, NEVER re-derived)
- `bars: OHLCBar[]` — the 1H window, gated by the temporal law (bars ≤ ANCHOR_MS).
- `zones[operative].top/bottom` — the operative zone band.
- the widened bucket `[lo−ε, hi+ε]` where `ε = max(2 pips, 0.05 × ATR14)` (PROPOSED).
- `meta.atr14`, `meta.pip`, `meta.spot` — the context ratios.
- the approach direction (`fromAbove` / `fromBelow` / `dwell`).

## THE OUTPUTS (the consuming stage)
- the touch kind: `SWEEP | WICK_REJECT | BODY_DEFEND | CONSOL_DWELL | PASS_THROUGH`
  (the piecewise-TOTAL predicate — exactly one piece per candle).
- the battle-side vote (the LMV side-vote input — the 3-day window!) · the wick-mass ·
  the defended-edge · the consumption event (the SWEEP = the reactionCount += 1).
- **E1/E2/E3 position:** feeds the LMV side vote (`lmv.ts:618-645`) + the
  zone-pressure-lexicon's lifecycle transitions (the consumption = the SWEEP — `lqz-matrix.ts:606-608`).

## THE FAMILIES' PREDICATES (the concrete pseudocode expressions)

### DEFEND — the body defended the level
```
bodyDefended(data):
  z  = operativeZone(data); touch = lastCandleTouching(data, z)
  side = approachSide(data, z)                      # fromAbove | fromBelow | dwell
  closedAgainst = side=='fromAbove' ? touch.C > touch.O
                : side=='fromBelow' ? touch.C < touch.O
                : touch.C > touch.O
  after = nextBarAfter(data, touch.t)
  minTurn = max(2 × meta.pip, 0.5 × meta.atr14)
  turned = after ? (side=='fromAbove' ? after.C-after.O >= minTurn
                  : after.O-after.C >= minTurn) : false
  return closedAgainst AND turned                   # the BODY_DEFEND predicate
```
- descriptive (AGAINST): `bodyClosedThrough` — the body closed THROUGH the level
  (`touch.C < bucket.lo OR touch.C > bucket.hi`).
- substitute (+2 — the surface trap): `wickTouchedBand` — the wick touched the band
  but the body did not (a touch ≠ a defense).
- use (−3 — the exemptor): `passThroughTraversal` — the traversal without a reaction
  (the anti-noise gate — excluded).

### REJECT — the wick rejected the level
```
wickRejected(data):
  wickInto = touch.L < bucket.hi AND touch.L > bucket.lo - 2×meta.pip
  bodyReversed = side=='fromAbove' ? touch.C > touch.O : touch.C < touch.O
  retreated = side=='fromAbove' ? touch.C > z.top : touch.C < z.bottom
  return wickInto AND bodyReversed AND retreated     # the WICK_REJECT predicate
```
- descriptive (AGAINST): `wickCrossedEntireBand` — the wick crossed the ENTIRE band
  (a sweep, not a reject).
- substitute (+2): `longWickWithoutReversal` — the wick ≠ the rejection.
- use (−3): `sweepWithCloseBack` — the consumption, not the rejection.

### SWEEP — the level was consumed
```
sweptBucket(data):  return reactionCount(data, z) >= 1
reactionCount(data, z):  # the SWEEP consumption events
  b = bucket(data, z)
  return count(c in windowBars(data) : c.H > b.hi AND c.L < b.lo)
```
- descriptive (AGAINST): `wickStoppedShort` — the wick stopped short of the far edge
  (a partial probe).
- substitute (+2): `deepWickCloseThrough` — a break, not a sweep.
- use (−3): `wickRejectExempt` — the reversal (the liquidity was NOT taken).

### DWELL — the level was occupied, not attacked
```
consolidatedDwell(data):   # the CONSOL_DWELL predicate (lqz-matrix.ts:239)
  ts = candlesTouching(data, z);  return ts.length >= 3
        AND spanHours(ts) <= 2 × bucketWidth / atr14
        AND last3(ts) all intersect the bucket
```
- descriptive (AGAINST): `barsCrossingBand` — an attack.
- substitute (+2): `singleBarTouch` — a touch ≠ a dwell.
- use (−3): `threeReactionCount` — the battle's ammunition exhausted (the depletion feed).

### PASS — the level was traversed
```
passedThrough(data):  return candlesTouching(data, z).length == 0   # the anti-noise
```

## THE SCORING + THE DECISION
For each candle: score the families over the 3-day window (the recency law — the
`windowBars` 72h gate); the winning intent = the touch kind;
`confidence = pos/(pos+neg+1)`; the zero-window fallback = the spot-relative side
(the `lmv.ts` existing final else).

## THE ENFORCEMENT
- Phase A: a candle classified PASS_THROUGH that the LMV counts as a reaction → the
  refine/retry warning at the `lmv.ts` boundary (the piecewise-TOTAL violation);
  the hard-throw ONLY after 3 failed refinements.
- Phase B: the touch-kind demand appended to the LMV table's row (the audit trail).
- **escape hatch:** `probe-vote-window` · **escalation:** 3 misclassifications → the
  zone-pressure-lexicon's problem-solving dispatch.

## THE MPSE FORM
- the piecewise-total predicate (the classifyTouch exhaustiveness invariant:
  ∀ candle: exactly one piece — the Losslessness Theorem).
- the recurrence: `reactionCountₙ₊₁ = reactionCountₙ + [sweep]`.
- the wick-mass sums (the linear combination).
