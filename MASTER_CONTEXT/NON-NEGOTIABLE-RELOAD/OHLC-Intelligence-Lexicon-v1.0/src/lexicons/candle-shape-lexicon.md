# LEXICON 2 — CANDLE-SHAPE-LEXICON (pseudocode skeleton)

> The fork's intelligence file for the `candle-shape` machine
> (`src/machines/candle-shape.ts` — the registered MachineRule).
> Design authority: `MASTER_CONTEXT/PLUTUS_V4.5.4_LEXICON_SPEC.md` (LEXICON 2).
> Doctrine VERBATIM: "1 candle = 1 token. 1 token by itself does not provide any
> meaningful data. A set of tokens in a structured dataset = relevant context (TTE
> shapes)" (the TOKEN-SET LAW).

## THE PURPOSE
The impulse/reversal/consolidation candle signatures that feed the E2 shape
classification — the SS/BS/R/WL/RWL/WLS anatomy. The shape is the CANDLE-LEVEL
grammar; the chain (Lexicon 5) is the SENTENCE.

## THE INPUTS (the data contracts)
The candle anatomy tokens (the L2-spec:861-864) computed over the 3-day window:
- `body_fraction (bf)` = mean |C−O| / max(|H−L|, ε)
- `body_to_wick` = the wick-mass ratio
- `wick_ratio` = mean wick / body
- `total_range_ratio` = mean (H−L) / ATR14
- `color_consistency` = the up/down alternation
- `candle_progression` = lastRange / firstRange (small→MASSIVE)
- `retracement_size` = the retracement ratio (BS family)

## THE OUTPUTS (the consuming stage)
The shape code `SS/BS/R/WL/RWL/WLS/PBS` + the confidence — the input to the E2's
`identifyCurrentShape`/`classifyShape` (`shape-brain.ts:331/890`).
**E1/E2/E3 position:** feeds the E2's per-day shape classification — the unified
macro authority (the DXY's chain for the EU, the EU core's for the GU!).

## THE FAMILIES' PREDICATES (the canonical anatomy — Bible 4.5 §14 + the TTE shape zones)

### SS — the scalp/consolidation
```
ssSignature(data):
  a = anatomy(data)
  return a.avgBodyFraction in [0.10, 0.30]
     AND a.avgRangeRatio   in [0.2, 0.5]
     AND a.alternating
     AND boundingZfp(data) < 0.30                      # shape-brain.ts:905-907
```
- descriptive (AGAINST): `directionalThrust` (bf > 0.6).
- substitute (+2): `narrowInTrend` — the narrow-range candle in a trend
  (the range ≠ the consolidation!).
- use (−3): `wlsSignature` — the 14-15+ candle storm (the ss-lookalike that is a WLS!).

### BS — the breakout surge
```
bsSignature(data):
  return a.avgBodyFraction in [0.65, 0.95]
     AND a.avgWickRatio   < 0.2
     AND a.progression    >= 3.0                        # small → MASSIVE
     AND boundingZfp(data) > 0.45                       # shape-brain.ts:909-915
```
- descriptive (AGAINST): `moderateBf` (0.30-0.60 — a recovery, not a breakout!).
- substitute (+2): `singleBigCandle` (one candle ≠ a BS — the BS is the PROGRESSION!).
- use (−3): `reversalFirstCandle` — the R/RWL's big-candle open.

### WL — the whiplash
```
wlSignature(data):
  return a.sameColorRun >= 3
     AND a.avgWickRatio  in [0.8, 1.5]                  # the grab→momentum→grab (TTE:177-179)
```
- descriptive (AGAINST): `sustainedMomentum` (a BS!).
- substitute (+2): `bsMiddleCandles` (the whiplash-lookalike!).
- use (−3): `rwlInstantReversal` — the RWL (no recovery period!).

### RWL — the reversal whiplash
```
rwlSignature(data):
  return a.count >= 6 AND a.avgBodyFraction in [0.30, 0.50] AND NOT a.alternating
```
- descriptive (AGAINST): `oneDirectionalThrust`.
- use (−3): `wlThenRComposite` — the two-shape composite.

### R — the recovery
```
rSignature(data):
  vShape = midMin(bs) < firstLow AND midMin(bs) < lastLow   # the V
  return a.count in [6, 24] AND a.avgBodyFraction in [0.40, 0.60] AND vShape
```
- descriptive (AGAINST): `impulsiveMove` (a BS!).
- substitute (+2): `wlsRecoveryLeg`.

### WLS — the whiplash storm
```
wlsStorm(data):
  return a.count >= 14 AND a.bothSideWicks AND a.moderateZfpZones >= 3
                                                   # shape-brain.ts:393-422
```
- descriptive (AGAINST): `cleanConsolidation` (a SS!).
- substitute (+2): `ssWideRange` (the storm-lookalike!).
- use (−3): `ssBelowWlsThreshold` (the zone-spread < the WLS threshold).

## THE SCORING + THE DECISION
The shape = `argmax` over the families' pos−neg scores; `confidence = pos/(pos+neg+1)`;
the tie → the zone-interaction `classifyShape` (the E2's existing refinement).
The MPSE form: the piecewise-total classifier (the shape = the piece over the
anatomy-token space — the exhaustiveness invariant) + the linear combination
(`shapeScore = Σ wᵢ×tokenᵢ`).

## THE ENFORCEMENT
- Phase A: a day whose shape the candle-shape lexicon classifies as BS but the E2
  classifies as PBS (the divergence!) → the refine/retry warning at the E2 boundary
  (the unified macro check); hard-throw ONLY after 3 refinements.
- Phase B: the shape demand appended to the E2's day decomposition.
- **escape hatch:** `probe-shape`.

## THE MPSE FORM
- the piecewise-total classifier (the exhaustiveness invariant).
- the linear combination (the shapeScore = Σ wᵢ×tokenᵢ).
