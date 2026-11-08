# ZFP SPECIFICATION — the missing three rules

**Sources, read 2026-10-18:**
- `MASTER_CONTEXT/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md`
  · §10.8 `calcZFP` (the **banned** width proxy)
  · Appendix B.1 (base by zone type) · B.2 (modifiers)
  · §6.1.1–6.1.5 · §6.2 decision matrix · §6.4.1 ZFP-conditioned transitions · §6.5 zone anchoring
- operator ruling: *"A width/reference-range computation printed as '% ZFP' is a fabrication and
  must be killed with fire."*

**Status:** Appendix B is the authoritative axis. This document supplies the three rules the prompt
does not state, so the number is computable and auditable. **Rules marked PROPOSED need the
operator's ruling before use.**

---

## §1 · WHAT ZFP MUST BE, BECAUSE THE CLASSIFIER READS IT

§6.2 classifies every shape by a ZFP threshold. §6.5 states per-shape zone requirements. **A wrong
ZFP does not merely mislabel a zone — it misclassifies the shape, the chain, and the trade.**

| threshold, verbatim from the prompt | used by |
|---|---|
| `< 20%` Hard Wall | §6.2 priority 2 → WL/PWL · §6.4.1 → RWL after BS |
| `20–40%` | §6.2 priority 3 → R/RS · §6.4.1 → R after BS |
| `< 30%` both sides | §6.2 priority 5 → SS · §6.5 SS requires Confluence ≥ 6 |
| `15–40%` per zone, 3+ zones | §6.2 priority 4 → WLS · §6.5 |
| `> 45%` | §6.2 priority 1 → BS/PBS · §6.4.1 → BS from SS |
| `> 50%` intermediate | §6.5 PBS |
| `> 60%` | §6.4.1 → PBS cascade |
| `> 80%` | §6.4.1 → PBS strong cascade |

**Consequence: ZFP must be a calibrated percentage.** An uncalibrated number puts every zone on the
wrong side of these thresholds and reproduces the documented April 20–24 failure —
*"the engine predicted upside continuation when a Hard Wall sat directly above."*

---

## §2 · RULE 1 — POINT SELECTION (PROPOSED)

Appendix B gives ranges. A computable value needs one rule.

```
base_point(tier) = the MIDPOINT of the B.1 range

  Hard Wall            5-15%   -> 10
  Standard Wall       15-30%   -> 22.5
  Post-Expiry Ghost   20-40%   -> 30
  Soft Wall           30-50%   -> 40
  One-Touch           50-70%   -> 60
  Liquidity Sweep     special  -> handled by §5 below, never by the midpoint
```

Modifier magnitudes are also ranges; the same rule applies:

```
  expiry timing +20-30%  -> +25   macro against +15-25% -> +20
  momentum      +10-20%  -> +15   cross-pair    +15-25% -> +20
  cascade       +20-30%  -> +25   regime change +15-25% -> +20
```

**Why the midpoint and not the top:** the midpoints reproduce the Pillar 9 degree table closely
enough to be consistent — `Hard Wall 10%` sits inside `EXTREME <10%`; `Standard Wall 22.5%` sits
inside `HEAVY 10-25%`; `Soft Wall 40%` sits inside `MODERATE 30-45%`; `One-Touch 60%` sits inside
`LIGHT 40-60%`. The range tops would push every zone one bucket stronger and break the cross-check.

**Cross-check (mandatory):** the computed ZFP must land inside the Pillar 9 bucket for that zone's
confluence score. A disagreement is a **finding**, printed with both numbers — never silently
resolved.

---

## §3 · RULE 2 — MODIFIER THRESHOLDS (PROPOSED)

Appendix B names a detection method for each modifier but no cutoff. Without a cutoff the output is
non-deterministic. Each becomes a **boolean gate with a stated test**:

| modifier | gate — apply only if | source of the test |
|---|---|---|
| expiry timing `+25` | an option expiry falls **within the target week**, and the zone is inside the striking range | Protocol A timestamps |
| macro against `+20` | a **red-folder** event is scheduled during the week on the zone's opposing side | Protocol F |
| momentum toward `+15` | **PROPOSED:** the 5-bar close-to-close rate of change exceeds **0.5 ×** the 20-bar average true range **and is directed at the zone** | §B.2 "rate of change in DXY" |
| cross-pair `+20` | **2 or more** of {EUR/USD, GBP/USD, AUD/USD} show the structurally equivalent zone | Protocol A multi-pair |
| cascade `+25` | a zone in the **same direction** already failed earlier this week | sequential failure |
| regime change `+20` | EMA200 was **crossed within the current week** | Pillar 2 recapture |

**Only the momentum gate needs a numeric constant** (0.5 × ATR20). It is the one figure in this
document that is not sourced from the prompt — it is marked PROPOSED for that reason.

**Every applied modifier must be printed on the receipt.** The prompt requires it:
> *"Zone Failure Probability: Show the base probability and each modifier applied."*

---

## §4 · RULE 3 — CLAMP (PROPOSED, and the prompt has none)

```
ZFP = clamp( base_point + Σ applied modifiers , 0 , 99 )
```

**Why this is required, not cosmetic.** Six modifiers at their midpoints sum to `125%`. Added to a
`Soft Wall` base of `40` the raw value is `165%`. Appendix B states no cap, and I grepped the full
4,216-line prompt for one: **zero results.** An uncapped formula emits impossible probabilities and
every downstream threshold becomes meaningless.

**Clamp to 99, not 100:** a zone at exactly 100% asserts certainty of failure, which no model here
can support. 99 preserves "effectively broken" for the `> 80%` PBS branch.

---

## §5 · THE LIQUIDITY SWEEP ZONE — a documented exception

B.1 lists it as `Special: brief breach then reversal`. It is **not** a probability — it is a
behaviour. It renders `SPECIAL` on the label rather than a number, and §6.2 priority 2 reads it as
a rejection zone.

**This is the one place a non-numeric ZFP is correct**, and it is stated by the canon, not invented.

---

## §6 · THE CALIBRATION RUN — the thing that makes the number real

**Dataset available, measured this session:** 24 fixtures · **84 distinct weeks** · **41,546** 1H
bars (2025-03 through 2026-07). No separate outcome CSV is needed — outcomes are derivable.

```
for each of the 84 weeks:
    derive the zones from data BEFORE the Monday 07:00 lock
    compute each zone's ZFP by §2-§4, with the receipt
    run the week forward on real bars
    GROUND TRUTH: did price close through the zone during the week?  (break / hold)
    record: {week, zone, zfp, broke}

report, per ZFP bucket:
    bucket  predicted %   observed break %   n

calibration passes when observation tracks prediction within a stated tolerance.
if it does not track, the formula is WRONG and no percentage may be drawn.
```

**The failure this prevents:** a chart that shows `ZFP 25%` on every zone and looks authoritative
while being uncorrelated with whether those zones actually broke. That is the theatrical class the
whole build exists to eliminate.

**Tolerance is a decision for the operator.** Without one, "calibrated" has no meaning and the run
is worthless. Suggested: observed within ±15 percentage points of predicted, per bucket, with n ≥ 8
per bucket to be reportable at all.

---

## §7 · WHAT IS BANNED

```
x  calcZFP = width / refRange * 100          the operator's explicit ban
x  any ZFP whose receipt is not printed      the prompt requires base + each modifier
x  any ZFP drawn before §6 passes            a percentage nobody calibrated
x  a ZFP that is a literal in the source     it cannot vary with the week
x  silently resolving a Pillar-9 disagreement
```

---

## §8 · OPEN — needs the operator

1. **Rule 1 midpoint** — accept, or specify a different point-selection rule?
2. **Rule 2 momentum constant** — `0.5 × ATR20` is the only invented figure. Replace it?
3. **Rule 3 clamp at 99** — accept?
4. **§6 tolerance** — what counts as calibrated?

Nothing is drawn until these are ruled.
