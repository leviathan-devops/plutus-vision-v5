# LEXICON 6 — OBVIOUS-TRADES-LEXICON (pseudocode skeleton)

> The fork's intelligence file for the `obvious-trades` machine
> (`src/machines/obvious-trades.ts` — the registered MachineRule).
> Design authority: `MASTER_CONTEXT/PLUTUS_V4.5.4_LEXICON_SPEC.md` (LEXICON 6).
> Doctrine VERBATIM: "My analysis in the golden doc for EU trades is literally EXACTLY
> what the reasoning tokens should look like as a baseline reference" (the
> REASONING-TOKEN LAW). THE MISSING LAYER: the forward-reasoning baseline.

## THE PURPOSE
The forward-reasoning baseline — the operator's #1/#2 logic: "the short is halfway to
the demand — the TP is AT the demand — the demand's pressure will react — the LONG
from its internal liquidity." THE agent-in-the-loop reasoning chain's deterministic
core (the AGGREGATE classifier — the spec line 249).

## THE INPUTS (the data contracts)
- the E1 zone map (the pressure state per zone!) · the E2 storyline (the day shapes +
  the chain!) · the trade-chaining state (the TP of N = the entry of N+1 — Law 27!)
- the price's CURRENT POSITION relative to the designations (the "halfway to the
  demand" predicate!).

## THE OUTPUTS (the consuming stage)
The trade projections + the E/SL/TP anchors + the confidence — the reasoning chain's
output schema (the `TradeProjection` interface — `src/reasoning/reasoning-chain.ts`).

## THE FAMILIES' PREDICATES (the reasoning tokens — the operator's golden-doc baseline!)

### ZONE-IDENTIFICATION — the trade's zone
```
e1ZoneWithPressureRead = operativeZone(data).pressure defined
    # "the 1H Unmitigated MoM Demand zone at 1.14145 - 1.14000 from Thursday's
    #  Breakout Surge" (the #2!)
```
- descriptive (AGAINST): `zoneWithoutPressure` (the bare level!).
- substitute (+2): `labelAlone` ("a demand zone" — the regex without the psychology!).
- use (−3): `phantomBomFlag` (the fortress — the strongest!).

### PRESSURE-MECHANICS — the zone's reaction certainty
```
strongPressureLiquidity = z.pressure in {'VIRGIN', 'FORTRESS'}
    # "This is clearly an area of strong pressure + bullish liquidity... the opposing
    #  bearish pressure is not yet strong enough to pierce it" (the #2!)
```
- descriptive (AGAINST): `contestedZone` (the WLS — the #6's "HEAVILY CONTESTING all
  breaks"!).
- substitute (+2): `zfpAlone` (the number without the lifecycle!).
- use (−3): `fortressStrong` (the 4+ strong holds!).

### SHAPE-CHAIN-CONTEXT — the chain's position
```
chainNextStepMatches = lastShape matches the E1 direction
    # "This follows the shape chain forming of SS → BS" (the #2!) — the chain's next
    # step = the trade's direction!
```
- descriptive (AGAINST): `chainConflict` (the divergence!).
- substitute (+2): `singleDayShape` (the chain ≠ the day!).
- use (−3): `macroAuthorityUse` (the unified macro authority).

### FORWARD-POSITION — THE MISSING PREDICATE
```
priceHalfwayToDesignation:
  dist = |spot - (z.type=='DEMAND' ? z.bottom : z.top)|
  return dist in [0.5 × width, 3 × width]        # PROPOSED ratio band — "the short
      # is halfway to the demand" (the operator's directive!) — never a fixed pip
```
- descriptive (AGAINST): `priceMovingAway` (dist > 3 × width — the rejection!).
- substitute (+2): `priceAtZone` (the reaction already happened!).
- use (−3): `zoneReactionState` (the virgin/fortress = the reaction probability!).

### ANCHOR-CONSTRUCTION — the E/SL/TP
```
anchorsTraceable = e1.zoneIds includes z.id AND e2.projectionIds non-empty
    # "Set E at the TP level of trade #1, SL 3 pips outside the far edge of the nested
    #  liquidity zone... and set TP at the near edge of the supply zone" (the #2 — THE
    #  reasoning token!) — the E3-NEVER rule: the anchors trace to a specific E1 zone
    #  + the E2 projection (never fabricated levels!)
```
- descriptive (AGAINST): `fabricatedLevels` (no zone geometry!).
- substitute (+2): `roundedLevels` (the "nice number" — the regex without the
  structure!).
- use (−3): `rrrGate` (`|TP−E|/|E−SL| ≥ 2.5` — the consequence, not the input!).

### VALIDATION — the confluence check
```
confluenceAligned = z.pressure defined AND shapeChain.length >= 1 AND e3 defined
    # "all the macro storyline confluences align" (the #2!) — the E1 pressure + the
    # E2 chain + the E3 geometry ALL agree
```
- descriptive (AGAINST): `layerDivergence`.
- substitute (+2): `singleConfluence` (one signal ≠ the alignment!).
- use (−3): `breakValidation` (the #6's "this ZONE has not yet been broken" — the E1
  pressure validates the structure break!).

### STRENGTH-COMPARISON — the opposing force
```
comparativeImpulse = e2.strengthDelta > 0
    # "the Bearish BS from Tuesday was extremely weak compared to the Bullish BS from
    #  Thursday" (the #6!) — the comparative impulse strengths
```
- descriptive (AGAINST): `equalStrengths` (the WLS!).

### REACTION-COUNT-STATE — the mitigation math
```
mitigationMath = (z.reactionCount ?? 0) >= 3
    # "zones usually fail on the THIRD mitigation" (#4!) · "has not been pierced or
    #  broken in 4 prior mitigations... likely to become a fortress zone" (#8!)
```
- descriptive (AGAINST): `freshZone` (the virgin — the FIRST test!).
- substitute (+2): `touchCount` (the touches ≠ the mitigations!).
- use (−3): `fortressExemption` (the #8's exemption — the 5th mitigation holds!).

## THE SCORING + THE DECISION
The trade projection fires when the families' AGGREGATE pos > neg (the aggregate
classifier — `classifyAggregate`); `confidence = pos/(pos+neg+1)`; the RRR gate
(≥ 2.5) as the FINAL filter (the consequence!). The output = the `TradeProjection`
(the E/SL/TP as CHECKABLE numbers + the pressure read + the chain context + the
validation signals).

## THE ENFORCEMENT
- Phase A: a trade projection whose E/SL/TP are not traceable to a specific E1 zone +
  the E2 projection → the refine/retry warning (the E3-NEVER rule — never a fabricated
  level!); hard-throw after 3.
- Phase B: the projection demand appended to the E3's setup output (the audit trail).
- **escape hatch:** `diag-monday` (the harness) · **escalation:** 3 rejected
  projections → the problem-solving dispatch (the operator's reasoning-chain retry!).

## THE MPSE FORM
- the forward-reasoning state machine (the E3's read → project → anchor → validate
  sequence!).
- the inequalities (the RRR gate! the N-pips-from-zone predicate!).
- the logical implication (the chain step → the trade direction!).
