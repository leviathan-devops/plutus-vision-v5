# LEXICON 3 — ZONE-CLASSIFICATION-LEXICON (pseudocode skeleton)

> The fork's intelligence file for the `zone-classification` machine
> (`src/machines/zone-classification.ts` — the registered MachineRule).
> Design authority: `MASTER_CONTEXT/PLUTUS_V4.5.4_LEXICON_SPEC.md` (LEXICON 3).
> Doctrine VERBATIM: "a phantom BoM zone... a MoM-disguised BoM... functions as a BoM
> zone" — the type-2 virgin MoM (the FORTRESS). THE most important lexicon of the six
> — the virgin-MoM death rule (`shape-brain.ts:2330-2336`) is the blanket regex that
> rejected the operator's #2 demand and caused the EU LONG's Δ19.4p miss.

## THE PURPOSE
The BoM/MoM/IP/LSZ identity + THE PHANTOM BoM — the operator's fortress-zone concept.

## THE INPUTS (the data contracts)
- the `ObZone` (`obcv.ts:45-59`: id/type/top/bottom/classification/formationMs/
  originIdx/bw/bf/prior/parent/zfp)
- the prior-move classifier output (`NONE | OPPOSITE | SAME`)
- the width-gate verdict · the macro-origin element (the containing 4H structure!)
- the mid-swing position (the zone's formation position relative to the swing leg!)

## THE OUTPUTS (the consuming stage)
`BoM | MoM | IP | LSZ | REJECT` + the `PHANTOM_BOM` flag + the `DEATH_ZONE` flag
(the type-1 virgin MoM). **E1/E2/E3 position:** feeds the E1's
`isDemandZone`/`isSupplyZone` + the E2's death-rule decision (the phantom-BoM
exemption!) + the E3's demand-pick weight (the fortress pressure!).

## THE FAMILIES' PREDICATES

### BOM — the true BoM
```
priorOppositeOrNone = z.prior in {NONE, OPPOSITE}
obcvQualityGates    = z.bw >= 3.0 AND z.bf >= 0.65        # obcv.ts:597-610
widthGatePass       = zoneWidth(z) >= 0.5 × atr14         # PROPOSED ratio
```
- descriptive (AGAINST): `priorContinuationSame` (the continuation — a MoM!).
- substitute (+2): `wideObMidMove` (the width alone ≠ a BoM — the prior matters!).
- use (−3): `rejectTotality` (the totality: every origin → exactly one of
  {BoM, MoM, REJECT}).

### MOM — the true MoM
```
priorSame     = z.prior == 'SAME'
validOrigin   = z.originIdx >= 0
widthGatePass = zoneWidth(z) >= 0.5 × atr14
```
- descriptive (AGAINST): `priorOppositeOrNone` (the reversal origin — a BoM!).
- substitute (+2): `phantomBomSurface` (the type-2 virgin MoM — the MoM-label that
  FUNCTIONS as a BoM!).
- use (−3): `rejectTotality`.

### PHANTOM-BOM — THE FORTRESS (the operator's type-2 criteria — the ALL-4 predicate)
```
largeObRatio            = zoneWidth(z) >= SMC_LARGE_OB_RATIO × atr14
                          # PROPOSED 1.5x — the SMC ratio-based width (the OB's size
                          # is a function of the move it precedes — never a fixed pip)
fakeout(data):
  pre = bars with t < z.formationMs
  swingHigh = max(H, pre); swingLow = min(L, pre)
  breaks = count(c in pre : c.H > swingHigh OR c.L < swingLow)
  return breaks in [1, 3]                                # the "couple of candles"
preFormationReaction(data):
  side = z.type=='DEMAND' ? 'SUPPLY' : 'DEMAND'
  return exists(o in zones : o.id != z.id AND o.type==side AND o.classification=='BoM'
                AND o.formationMs < z.formationMs AND touches(o) >= 1)
macroOriginContinuation(data):
  return z.parent defined                                # the KCE-Telescoping: the
    AND postFormationMove continues in the macro direction  # full-swing completion
```
- descriptive (AGAINST): `smallObWidth` · `midMoveUninterrupted` (the type-1 signature!).
- substitute (+2): `virginMomLabelAlone` — the surface ("it's a MoM so it's a death
  zone" = the regex without the psychology — THE derailment!).
- use (−3): `type1FullSignature` — the type-1 virgin MoM's FULL signature (the small OB
  + the uninterrupted BS/WL + the mid-move → the DEATH ZONE stands!).

### FORTRESS-BOM — the PROVEN BoM (the operator's Q2 correction — SEPARATE from the phantom!)
```
plainProvenBomHolds = z.classification=='BoM'
    AND (z.reactionCount ?? 0) >= 4 AND z.pressure != 'BROKEN'
    # "has not been pierced or broken in 4 prior mitigations... likely to become a
    #  fortress zone and NOT get pierced" (#8 — the 1H Refined 4H supply
    #  [1.14475-1.14625] anchored to the Jun 22 OB!)
```
- descriptive (AGAINST): `phantomBomCategory` (the type-2 virgin — a DIFFERENT
  category — the fortress BoM is a VISIBLE obvious BoM, never disguised!).
- substitute (+2): `depletionCount` (3+ mitigations ≠ the fortress — the FORTRESS
  needs the STRONG holds!).
- use (−3): `brokenWithBattle` (the pierced with a battle!).

### IP — the IP zone
```
ninePillarConfluence = z.classification=='IP' AND z.source=='PILLAR'
```
- descriptive (AGAINST): `canonicalSDOrigin`.

## THE SCORING + THE DECISION
The classification = the highest-scoring family; the `PHANTOM_BOM` intent fires when
the suggestive (width + position + reaction + continuation) > the descriptive (the
type-1 signature); `confidence = pos/(pos+neg+1)`. The `DEATH_ZONE` flag = the type-1
signature's use-exemptor (the negative short-circuit).

## THE ENFORCEMENT
- Phase A: a phantom-BoM-classified zone that the E2's virgin-MoM rule rejects → the
  refine/retry warning at the E2 boundary (the death-rule exemption demand);
  hard-throw ONLY after 3 failed refinements.
- Phase B: the `PHANTOM_BOM` flag appended to the zone's classification (the E1 pool +
  the E3's demand pick read it).
- **escape hatch:** `probe-resting-side` · **escalation:** 3 rejected phantom-BoM
  classifications → the problem-solving dispatch.

## THE MPSE FORM
- the set theory (the phantom-BoM membership test:
  `zone ∈ {LARGE-OB set} ∩ {recovery-base set} ∩ {opposing-BoM-reaction set}`).
- the boolean algebra (the exemption:
  `PHANTOM ∧ DEATH_TYPE1 → DEATH` · `PHANTOM ∧ ¬DEATH_TYPE1 → FORTRESS`).
- the Losslessness (every predicate is deterministic — the operator's exact criteria
  from the #2 analysis!).
