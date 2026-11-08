# LEXICON 4 — ZONE-PRESSURE-LEXICON (pseudocode skeleton)

> The fork's intelligence file for the `zone-pressure` machine
> (`src/machines/zone-pressure.ts` — the registered MachineRule).
> Design authority: `MASTER_CONTEXT/PLUTUS_V4.5.4_LEXICON_SPEC.md` (LEXICON 4).
> Doctrine VERBATIM: "zones usually fail on the THIRD mitigation" (#4) · the fortress
> "not pierced or broken in 4 prior mitigations... likely to become a fortress zone
> and NOT get pierced" (#8).

## THE PURPOSE
The lifecycle/mitigation/freshness states + the fortress detection + the operator's
refined death-rule scope.

## THE INPUTS (the data contracts)
- the `reactionEvents` (the battle counts — the SWEEP consumption events!)
- the freshness state (`freshness.ts`: the FRESH→TESTED→DEPLETED|VIOLATED machine)
- the absorption state · the liquidity links (the nested/shield rungs) · `z.tf`.

## THE OUTPUTS (the consuming stage)
The lifecycle state `VIRGIN / ACTIVE-1 / ACTIVE-2 / DEPLETED / FORTRESS / BROKEN`
(E1/E2/E3-MACRO:551-562) + the ZFP + the absorption + the FORTRESS flag.
**E1/E2/E3 position:** feeds the E2's pressure-aware designation (the pressureScore:
+40 VIRGIN-BoM / −30 DEPLETED / +20 FORTRESS, ZR7-spec:991-992!) + the E3's
SL-relevance switch (the operative defense — the SHIELD_FUEL vs the
PRESSURE_STRUCTURE!).

## THE FAMILIES' PREDICATES

### VIRGIN — the untested zone
```
virginZone = (z.reactionCount ?? 0) == 0 AND z.classification == 'BoM'
                                            # the ENTRY-PRIMARY +40!
```
- descriptive (AGAINST): `momType` (the DEATH ZONE — the E2-5 reject — the
  PHANTOM_BOM exemption from Lexicon 3!).
- substitute (+2): `zeroTouchWideBand` (no reaction ≠ virgin — the formation's own
  candles!).
- use (−3): `phantomBomExempt` (the type-2 — the fortress — the virgin-MoM exemption!).

### VIRGIN-DEATH-SCOPE — THE REFINED DEATH RULE (the operator's Q3 answer!)
```
deathRuleScope = z.tf in {'30m', '1H'} AND z.classification=='MoM' AND rc==0
    # the operator verbatim: "the 'virgin MoM zones = death' applies largely to 30m
    #  virgin MoM zones and 1H type 1 virgin MoMs"
```
- descriptive (AGAINST): `fourHVirginMoM` — the operator verbatim: "ALL 4H zones WILL
  have at least 1 reaction before mitigation so even though this is MoM on the 4H it
  is still a valid reaction point" — the 4H zones are NEVER death zones!
- substitute (+2): `oneHPhantomBom` (the type-2 — the exemption!).

### TF-HIERARCHY — THE KING/GENERAL/CAPTAIN (the operator's Q3/Q4 answers!)
```
htfSetsLtf = meta.tf=='30m' AND exists(z in zones : z.tf in {'1H', '4H'})
    # 4H = the King (the E2 shape chain — the war strategy!) · 1H = the General (the
    # E3 trade setups — the battles!) · 30m = the Captain (the per-trade context!) —
    # "HTF > LTF" — the pressure mechanics SET by the HTF, CASCADED DOWN to the LTFs.
```
- descriptive (AGAINST): `equalWeightReadings` (the LTF overruling the HTF!).
- substitute (+2): `singleTfStatic` (the charts require the multi-TF analysis — the
  telescoping!).
- use (−3): `fourHZone` (the King's structures — the ≥1 reaction guaranteed!).

### ACTIVE — the tested zone
```
activeZone = rc in {1, 2}                     # the ~80% / ~50% reaction rates
```
- descriptive (AGAINST): `virginCount` (rc == 0 — virgin!).
- substitute (+2): `consolidationDwells` (the occupied ≠ tested!).
- use (−3): `depletedCount` (rc >= 3 — depleted!).

### DEPLETED — the failing zone
```
depletedZone = rc >= 3                        # the TP-target-ONLY
```
- descriptive (AGAINST): `strongCountOneTwo`.
- use (−3): `fortressHolds` (the 4+ holds with the STRONG reactions!).

### FORTRESS — the zone that holds
```
fortressZone = rc >= 4 AND z.pressure=='FORTRESS'
    # the phase transition Fire→Earth — the 95% direction flip (E1/E2/E3-MACRO:165-167)
```
- descriptive (AGAINST): `weakMitigations` (the "barely touching the close edge" —
  the #8's mitigations 3+4!).
- substitute (+2): `depletedLabel` (the 4 touches ≠ the 4 strong holds!).
- use (−3): `brokenWithBattle`.

### BROKEN — the violated zone
```
brokenZone = z.pressure=='BROKEN'             # the pierce with a battle — the role reversal
```
- descriptive (AGAINST): `gapThrough` (the gap ≠ a battle — the pierce requires the
  battle, freshness.ts!).
- substitute (+2): `wickThrough` (the sweep ≠ the break!).

## THE SCORING + THE DECISION
The lifecycle = the recurrence state (`stateₙ₊₁ = f(stateₙ, the touch event)`); the
FORTRESS flag = the 4+ strong holds; the ZFP = the state's ladder (the existing
`zfpFromState!`).

## THE ENFORCEMENT
- Phase A: a DEPLETED zone that the E2's designation treats as the ENTRY-PRIMARY →
  the refine/retry warning (the TP-target-ONLY rule!); hard-throw after 3.
- Phase B: the lifecycle demand appended to the zone's pressure state.
- **escape hatch:** `probe-resting-side`.

## THE MPSE FORM
- the recurrence relation (`stateₙ₊₁ = f(stateₙ, touchEventₙ)`).
- the inequalities (`rc ≥ 3 → TP-only`; `≥ 4 strong → FORTRESS`).
- the linear combination (the pressureScore = Σ weights).
