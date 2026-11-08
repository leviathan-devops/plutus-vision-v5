# LEXICON 5 — SHAPE-CHAIN-LEXICON (pseudocode skeleton)

> The fork's intelligence file for the `shape-chain` machine
> (`src/machines/shape-chain.ts` — the registered MachineRule).
> Design authority: `MASTER_CONTEXT/PLUTUS_V4.5.4_LEXICON_SPEC.md` (LEXICON 5).
> Doctrine VERBATIM: "everything is fractal... BS/R/WL --> WLS --> SS (micro, 30m)
> and BS/R/WL --> SS (macro, 4H). Both are valid." (the FRACTAL LAW) + "they ARE
> allowed to have their own mechanics but unified macro signal has authority"
> (the UNIFIED-MACRO-AUTHORITY LAW — the GU Monday R divergence!).

## THE PURPOSE
The chain semantics — the operator's fractal doctrine + the unified macro authority.

## THE INPUTS (the data contracts)
- the per-day shapes (the E2's decomposition!) · the contested zone's pressure state
- the ZFP-conditioned transition matrix (`shape-brain.ts:874-888`)
- the chain state (the prior days' shapes — `shapeChain`).

## THE OUTPUTS (the consuming stage)
The chain (max 5 — the day decomposition) + the UNIFIED MACRO AUTHORITY (the
authoritative shape per day across the 3 pairs!) + the fractal-validity flags.
**E1/E2/E3 position:** feeds the E2's `buildDayDecomposition` (the authority
override!) + the E3's forward projection (the chain's next step!).

## THE FAMILIES' PREDICATES (the S1 transition matrix — the ZFP-conditioned)

### SS-to-BS — the breakout step
```
marubozuBreakout(data):
  c = lastCandle; body = |c.C - c.O|
  return bf(c) > 0.65 AND wick(c) < 0.2×body AND body >= 3 × avgBodyBefore(data,'SS')
zfpConditionedBs = lastShape=='SS' AND zfp > 0.45        # shape-brain.ts:880
```
- descriptive (AGAINST): `exhaustionPinBar` (the R!).
- substitute (+2): `singleBsCandle` (one candle ≠ the chain step!).
- use (−3): `ssLowZfp` (the SS when the bounding zfp < 30%).

### BS-to-R — the exhaustion → recovery step
```
bsTargetRetrace = lastShape=='BS' AND zfp in [0.20, 0.40]   # shape-brain.ts:877
```
- descriptive (AGAINST): `hardWall` (the RWL!).

### BS-to-RWL — the hard-wall step
```
shootingStarEngulfing = upperWick(c) > 2×body OR lowerWick(c) > 2×body
bsTargetBelowTwenty   = lastShape=='BS' AND zfp < 0.20
```
- descriptive (AGAINST): `moderateRetrace` (the R!).

### R-to-WL — the liquidity-grab step
```
longWickLiquidityGrab = lastShape=='R' AND wick(c) >= |c.C - c.O|
```
- descriptive (AGAINST): `continuationNotGrab` (the BS!).

### WL-to-SS — the consolidation step
```
immediateConsolidation = lastShape=='WL' AND zfp < 0.30
```
- descriptive (AGAINST): `furtherLash` (the RWL!).

### MICRO-vs-MACRO — THE FRACTAL + THE UNIFIED MACRO AUTHORITY
```
sameChainBothTfs = shapeChain.length >= 2      # the SAME chain at the 30m AND the 4H
chainsContradict = e2.macroDirection defined AND e2.macroDirection != lastShape
```
- descriptive (AGAINST): `chainsContradict` (the micro and the macro disagree!).
- substitute (+2): `microOnlyReading` (the 30m precision ≠ the 4H macro!).
- use (−3): `unifiedMacroAuthority` (the DXY's chain for the EU, the EU core's for the
  GU — the divergence = the per-pair mechanics WITHOUT the macro override!).

## THE SCORING + THE DECISION
The chain = the recurrence (`nextShape = predictNextShapePressureAware` — the S1
transitions!); the UNIFIED MACRO AUTHORITY = the source chain's shape for the day (the
DXY's SS = the EU's SS = the GU's SS!) — the per-pair divergence (the GU Monday R vs
the DXY/EU SS) = the AUTHORITY OVERRIDE fires (the GU Monday becomes the SS — the
operator's WL LONG becomes possible!).

## THE ENFORCEMENT
- Phase A: a day whose per-pair shape diverges from the macro authority without a
  documented per-pair mechanic → the refine/retry warning at the E2 boundary (the
  divergence is the bug!); hard-throw after 3.
- Phase B: the authority-override demand appended to the day decomposition.
- **escape hatch:** `probe-shape`.

## THE MPSE FORM
- the recurrence relation (the chain).
- the composition operator (`g∘f` over the day decomposition — the fractal layers!).
- the set membership (the shape ∈ the chain's domain).
