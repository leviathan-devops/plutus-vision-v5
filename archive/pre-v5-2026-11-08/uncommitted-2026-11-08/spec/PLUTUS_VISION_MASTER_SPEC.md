# PLUTUS VISION — MASTER SPEC + FULL EXECUTION WORKFLOW

**Version:** 1.0 · 2026-10-18
**Class:** SPEC — process-artifact spec for a rendering build (GS-8 declaration)
**Status:** AUTHORITATIVE for this build. Supersedes every earlier spec in `spec/` that conflicts.
**Purpose:** a fresh session must be able to read THIS FILE ALONE and operate correctly.

---

# §0 · READ THIS FIRST — THE TEN LAWS

These are the operator's rulings, not preferences. Nothing overrides them. Each law carries the
measured incident that produced it, because a law without its failure is a slogan.

## L1 · NOTHING IS "BUILT AND WORKS" UNTIL VISUALLY PROVEN

```
what it means  every prior artifact is a candidate, never a foundation.
               It becomes real when it appears on a chart that was opened and read.
measured       scripts/e1_zfp.py · e2_engine.py · e1_fetch.py are 270/783/784 lines
               and matching canon formulas. Under this law they remain candidates.
failure this   three days spent perfecting a baked payload the code already had;
prevents       17 reviewer rounds on cosmetics while the indicator was wrong.
```

## L2 · THE ONLY VERDICT IS PIXELS OPENED THIS TURN

```
what it means  a grep is not a test · a hash is not a test · a file existing is not a test
               a line count is not a test · a diff is not a test · my own JSON is not a test
               they are PRE-FLIGHT GUARDS: they may HALT, they may NEVER PASS
measured       15 gate scripts were built and proven to discriminate 15/15 —
               every one of them observed a text file. Recorded as T-16 and F-147.
failure this   a build that could pass all 15 gates with an empty chart and a
prevents       fabrication still baked into the served dist.
```

## L3 · THE DERIVATION RUNS ONE WAY

```
E1 (zones)  ->  E2 (shape chain)  ->  E3 (trades)

E2 is derived from E1.  E3 is derived from E2.  Never upward.
E1 never reads E2.  E2 never reads E3.
consequence  a defect in E1 is invisible from E3 and corrupts it completely —
             which is why P1 runs first and carries seven criteria.
```

## L4 · NO LITERAL PRICE IN A DRAW CALL

```
what it means  every rendered object is f(bars, weekStart). Nothing else.
measured       15 literal price pushes baked into the .pine by an offline builder.
               A literal cannot change with the week, so it cannot survive GATE B.
guard          grep -nE '^\s*(box|line|label)\.new\([^)]*[0-9]+\.[0-9]{3,}' -> must be 0
               (a guard, not a verdict — see L2)
```

## L5 · THE GOLDEN WEEK IS A VISUAL TARGET, NEVER A FIT

```
what it means  if it looks right on Jul 6-10 and wrong anywhere else, the code is
               hardcoded and the phase is REJECTED — no matter the screenshot.
measured       "as soon as the golden week is approved within the exact same minute
               I should be able to split test on 10 other weeks and they are all
               equally as accurate ... because of how this is coded."
failure this   "they just hard-coded a bunch of trash and made the screenshots look
prevents       accurate. Then when I test this on 15 other weeks, everything breaks."
```

## L6 · EVERY PHASE CLOSES WITH BOTH GATES

```
GATE A  the golden-week visual  — a frame opened, every delta named
GATE B  the anti-hardcode       — 10 held-out weeks, no code change between them

inside every phase. Not at the end.
"every single phase needs to have a golden week visual and an anti-hard code gate
 inside of every single phase"
a phase that passes A and fails B is HARDCODED. Reject it.
a phase that passes B and fails A is MISPLACED. Fix the geometry.
```

## L7 · ZFP IS ZONE FAILURE PROBABILITY, APPENDIX B. NEVER ZONE WIDTH

```
authoritative  APPENDIX B.1 + B.2  ->  base(zone_type) + Σ modifiers, with a receipt
banned         §10.8 calcZFP = width / refRange * 100
               "A width/reference-range computation printed as '% ZFP' is a
                fabrication and must be killed with fire."
why           width is geometry; failure is structural resistance and market
               approach. A width-derived number has no defined relationship to
               whether price actually broke the zone, so it cannot be calibrated.
```

## L8 · THE SHAPES ARE CLASSIFIED BY ZFP THRESHOLDS, NOT BY VIBES

```
§6.2 is the decision matrix. Every row is a ZFP condition.
the ZFP of the TARGET zone determines the next shape — not the momentum of the
current move. That is the prompt's own stated #1 Engine 2 error.
consequence  an uncalibrated ZFP misclassifies the shape, which misclassifies
             the chain, which misclassifies the trades — and none of that is
             visible from inside the shape or trade phase.
```

## L9 · NO INVENTED VOCABULARY

```
what it means  a term not in the canon does not go in the code.
               a shape with no defined anatomy and no ZFP condition is not
               classifiable and must not be emitted.
measured       PBS and PRWL appear as tokens in chains; the canon defines no
               candle anatomy for them. SS-BS has zero hits anywhere.
failure this   a chain built from invented tokens cannot be compared against the
prevents       winning-trade library, so no reference can confirm or refute it.
```

## L10 · THE OPERATOR'S WORDS ARE VERBATIM AND BINDING

```
what it means  re-read them before any decision. Never paraphrase them into
               something easier to build.
measured       a paraphrase of the E2 phase split produced a polyline drawn before
               the boxes existed — the exact sequence the ruling forbade.
```

### The five forbidden things, in the execution terms

```
x advance on a red gate                      x weaken or lower a gate to pass it
x reuse evidence produced before a fix       x describe a render you did not open
x substitute a different artifact for a failed primary path
```

---

# §1 · MISSION

**Build a Pine Script indicator** that renders, on a TradingView chart, for any trading week:

```
E1  the institutional pressure zones  +  supply/demand/liquidity
E2  the predictive shape chain across the week
E3  the trade setups — entry, SL, TP as boxes
```

**so accurate that a trader can execute blindly from the chart alone**, and so that it is
**equally accurate on any week, not just the one it was developed against.**

```
initial acceptance     DXY / EURUSD, Jul 6-10 2026
final acceptance       >= 90% on the golden week AND >= 90% on 10+ held-out weeks
                       the builder never saw
```

## SCOPE

**In scope — what this spec governs building:**

```
1  the indicator script          vision/plutus-vision.pine, a Pine Script indicator that
                                 renders into a chart on TradingView
2  E1, E2 and E3 rendering       three engines drawn onto that same chart, same week
3  the golden week               Jul 6-10 2026, the first visual acceptance
4  the derivation                every rendered value derived from bars and weekStart,
                                 never typed, so the indicator is accurate on any week
5  the gates                     a gate script per phase, plus the calibration script
6  the calibration run           scripts/zfp_calibrate.py over the 84 fixture weeks
7  the held-out acceptance       ten weeks the operator draws after the build freezes
```

**Out of scope — explicitly not built by this spec:**

```
x  any mechanical wall, ticket system, or tool-call firewall
x  the sidecar/backtest room, the dashboard, the journal
x  any rewrite of the sealed baseline plutus-vision-v1.pine (sha 0d20e831)
x  E3 before E1 and E2 each pass both gates (DIRF-E3-DEFERRED)
x  anything under Checkpoints/ — read-only, per RULE-D
```

**The one-line scope:** build a Pine Script indicator that renders E1 zones, the E2 chain and E3
trades onto a chart accurately enough to be traded blind, first for the golden week and then on any
trading week, proven by opening the chart.

## The three sentences that define the product

```
E1 answers  WHERE are the walls and how strong is each one?
E2 answers  WHAT path will price take through those walls?
E3 answers  WHERE do I enter, where is my stop, where is my target?
```

**E1 is the only source of prices in the build.** E2 reads E1. E3 reads E2's chain and E1's zone
edges. Neither computes a price of its own.

---

# §2 · THE CANON MAP — WHICH DOCUMENT WINS

**When two documents disagree, the higher one governs. State the conflict in the report; never
silently pick.**

```
1  THE OPERATOR'S VERBATIM RULINGS
      this file §0 and Appendix A. In any conflict, these win outright.
2  MASTER_CONTEXT/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md
      the TOOLSET ORIGINAL · 328,319 B / 4,216 lines
      the authoritative engine specification
3  MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/
      Trident_Fractal_Architecture_FirstPrinciples_v2.3.md   52 KB   the four densities
      TTE_MACRO_SHAPES_COMPLETE_REFERENCE.md                          shape anatomy
      TTE_SHAPE_ZONE_MECHANICS_MILITARY_GRADE.md             zone-shape mechanics
      VISUAL_TELESCOPE_CHARTING_T2.md                                the trade contract
4  MASTER_CONTEXT/FORENSIC_ANALYSIS_38_TRADES.md               the 3 entry laws
5  MASTER_CONTEXT/Golden_Operator_Trade_Feedback_EU_GU.md      the golden-week ground truth
6  cards/ (34) · type/ (10) · sources/ (12)                    the typed knowledge graph
7  spec/*.md written before 2026-10-18                         SUPERSEDED where conflicting
```

## Known supersessions — recorded so nobody re-litigates them

| superseded | by | where this is stated |
|---|---|---|
| `§10.8 calcZFP` = `width/refRange × 100` | **Appendix B** = base + modifiers | §4.9 |
| "6 macro shapes" (TTE doc) | **§6.1 of the 5.3.3 prompt**: five base + five variants = 10 | §5.1 |
| "shapes classified by candle anatomy" | **§6.2 ZFP decision matrix** (anatomy is secondary) | §5.2 |
| E2 as a single polyline from the start | **two-phase: boxes first, then one line** | §5.6 |
| "entry at a shape vertex" | **entry at a ZONE EDGE** (1H/30m/15m) | §6.1 |
| `spec/EW_B2_ENGINE2_SPEC.md`'s polyline workflow | the §9 workflow in this file | §9 |
| `spec/EW_A_BACKEND_SPEC.md`, `spec/EW_B1_ENGINE1_SPEC.md` | this file | §2, Appendix C |
| `spec/VERIFICATION_ARCHITECTURE.md` | deleted | §10 |
| `spec/RENDER_LOOP_WORKFLOW.md` | this file | §10 |
| "built and works" claims from prior agents | **L1 — candidates until rendered** | §8.2 |
| grep / hash / diff as a PASS reason | **pre-flight guard only** | §10.2 |
| any 15-gate set under `gates/e1/` | **3 tests** | §10.8 |

## How to use this map

```
question: does document X outrank document Y?
  1  find X and Y in the list above — the lower number wins
  2  if either is not on the list, it is a CANDIDATE, not authority
  3  if both are in tier 3, the one whose subject matches the question governs
  4  record the conflict in your report; never silently pick

question: is this claim mine or a quotation?
  quotations keep their attribution and their words
  anything I computed is marked as measured, with the command pasted
```

---

# §3 · E1 — THE ZONES

**One engine, two faces.** Both render on the same chart, on the same week, and neither may
occlude the other.

E1's job is to establish the **levels** and their **strength**. It reads only the 9-Pillar
matrix. It never derives from the E2 chain. It never reads a bar of the week it is drawing.

---

## §3.0 · THE 9-PILLAR MATRIX — the only E1 input

Nine structural levels, from weakest to strongest. Each contributes to the confluence score.

| # | pillar | description | timeframe |
|---|---|---|---|
| 1 | Round Number | 0.00 / 0.50 psychological levels | all |
| 2 | EMA 200 | the 200-period exponential moving average | 1D |
| 3 | Weekly Swing Point | a confirmed weekly high or low | W |
| 4 | 4H Order Block | the last down-close before an up move (or inverse) | 4H |
| 5 | Daily Liquidity Zone | prior day highs/lows, equal levels | 1D |
| 6 | Level Cluster | 1H / 4H / Weekly levels that coincide spatially | 1H-4H-W |
| 7 | Intraday Swing Point | a confirmed intraday swing | 1H |
| 8 | Minor Level | 30m / 15m structural levels | 30m-15m |
| 9 | Institutional Pressure Zone | the zone the operator's own analysis produces | 1H+ |

**Plus five auxiliary structures**, which contribute to confluence but are not pillars:

```
Institutional Liquidity Level   resting orders at prior extremes
Pivot Points                    classical pivots, S1-R3 and beyond
Price Action Structure          BOS, CHOCH, equal highs/lows, trend breaks
Previous Day Levels             prior day open / high / low / close
Supply and Demand               order blocks, imbalance zones, inefficiency
Option Structure                critical strikes, expiry dates, gamma walls
```

## §3.1 · LEVEL CLUSTERING — how a level becomes a zone

A level is not a price — it is a **range**. Two levels within `0.004` DXY of each other merge
into one zone. A zone is the unit everything else operates on.

```
cluster(levels, tol = 0.004)
  sort ascending
  absorb level[i] into cluster[i-1] if  |level[i] - cluster[i-1].mid| <= tol
  else start a new cluster
  each cluster records: mid, top, bottom, width, and the pillars it absorbed
```

**The zone's width is a real property** and it drives the sweep classification (`<0.020` = soft
wall, `0.020–0.060` = standard, `>0.060` = hard wall / structural level). It is **not** ZFP —
width is geometry, ZFP is resistance.

## §3.2 · CONFLUENCE SCORING — the 0–14 scale

The confluence score is the count of independent structural supports on a zone, weighted.

```
score = Σ over the 9 pillars       1 point each if the pillar lands inside the zone
      + Σ over the auxiliaries     0.5 each, capped at 1.0
      + extreme bonus              +2 if the zone is a confirmed weekly swing
                                   +1 if it is a confirmed daily swing
      - penalty                    -1 if the level has already been mitigated
```

**Bounded to 14.** The sub-components the operator specified:

```
x1.5   a 4H order block co-located with a round number
x2.0   a weekly swing point co-located with an option wall
x1.3   a daily liquidity zone co-located with the EMA200
```

**The score is printed on the chart's zone detail, and the degree is derived from it:**

| score | degree | expected failure probability |
|---|---|---|
| 12–14 | EXTREME | <10% |
| 10–11 | HEAVY | 10–25% |
| 8–9 | MODERATE-HEAVY | 20–35% |
| 6–7 | MODERATE | 30–45% |
| 4–5 | LIGHT | 40–60% |
| 0–3 | MINIMAL | >60% |

**This table is the cross-check for ZFP.** A ZFP whose implied bucket contradicts the degree
printed for that zone is a finding — never silently resolved.

## §3.3 · FACE A — the five IP zones

**Five fixed institutional roles.** Not a sorted list of prices — five named positions with
different structural jobs.

| role | position | structural job |
|---|---|---|
| RESISTANCE CEILING | the top of the operating range | the level where supply is heaviest |
| UPPER RESISTANCE | below the ceiling | the second resistance, where breakouts stall |
| EQUILIBRIUM ZONE | mid-range | the pivot; premium above it, discount below |
| MID-RANGE SUPPORT | below equilibrium | the demand side of the pivot |
| KEY SUPPORT BAND | the bottom of the operating range | where the buyer base sits |

**The roles are assigned by position within the operating range, not by price order.** A zone
becomes `KEY SUPPORT BAND` because it sits at the bottom of the operating range with the highest
confluence below equilibrium — not because it is the lowest number.

### The label grammar — mandatory, verbatim

```
"<name> | <degree> | ZFP n%"

examples
  "KEY SUPPORT BAND | MODERATE-HEAVY | ZFP 28%"
  "EQUILIBRIUM ZONE | HEAVY          | ZFP 18%"
  "UPPER RESISTANCE | LIGHT          | ZFP 44%"

when the report scores no ZFP for a zone:
  "EQUILIBRIUM ZONE | MODERATE       | ZFP n/a"

when the zone is a Liquidity Sweep Zone:
  "LIQUIDITY SWEEP  | HEAVY          | ZFP SPECIAL"
```

**Three failure modes that are instantly visible on a frame:**

```
a label missing its degree   -> the Pillar 9 table was not consulted
a label missing its ZFP      -> the zone is not finished
a ZFP with no receipt        -> the number was authored, not computed
```

## §3.4 · FACE A — the authoritative reference set (Apr 20–24 DXY)

The shape reference for what a correct zone table looks like. **This is a shape reference, not a
fixture** — the values belong to that specific week.

| role | bottom | top | ZFP |
|---|---|---|---|
| RESISTANCE CEILING | 99.16 | 99.23 | 15% |
| UPPER RESISTANCE | 98.77 | 98.99 | 25% |
| EQUILIBRIUM | 98.29 | 98.41 | 20% |
| MID-RANGE SUPPORT | 98.00 | 98.12 | 30% |
| KEY SUPPORT BAND | 97.63 | 97.97 | 12% |

Note the ZFP sequence: **15, 25, 20, 30, 12.** Not monotonic. That is what a real zone table
looks like — the ceiling is the strongest, but the key support band is *stronger* than
equilibrium, because it is a confluence floor rather than a midpoint.

## §3.5 · FACE B — supply / demand / liquidity

**SMC primitives**, carried verbatim from the v1 baseline (LuxAlgo lineage, CC BY-NC-SA):

```
OB boxes           internal + swing order blocks, each drawn as a rectangle
FVG                fair value gaps, rendered as a DOUBLE box (upper + lower)
BOS / CHOCH        break of structure / change of character, drawn as a horizontal
                   step at the broken swing
EQH / EQL          equal highs / equal lows — drawn as a matched pair with a rail
MTF                higher-timeframe levels drawn through the session
premium/discount   the equilibrium split, shading the region above and below
```

**LQZ — candle liquidity rails**, drawn at full chart width:

```
colour        #3E8A46   demand rails, drawn BELOW price
              #7F3613   supply rails, drawn ABOVE price
mitigation    every rail carries a counter:
              Unmitigated -> 1x -> 2x -> 3x
              a rail increments when price returns to it and respects it
anchors       prior-day highs and lows
              session highs and lows
              weekly extremes
              relative equal levels across sessions
```

**The mitigation counter is the whole point.** A rail that has been swept three times is not the
same object as an untouched rail, and the counter is how that difference reaches the chart.

### The golden-week face-B ground truth

From `MASTER_CONTEXT/Golden_Operator_Trade_Feedback_EU_GU.md`, the zones that must be
identifiable on the golden week:

```
1H supply       1.14460 - 1.14530
LQZ supply      1.1444  - 1.14395
1H MoM demand   1.14149 - 1.14000
nested LQZ      1.14110 - 1.14020
```

**These are the acceptance anchors for P2.** If they are not identifiable on the frame, the phase
fails regardless of how many boxes rendered.

## §3.6 · THE OPERATING RANGE AND THE WINDOW

```
anchor       Monday 09:00 London, locked from the prior Friday's close
left edge    tsL = anchor  -  7 days     (one week back, exactly)
right edge   tsR = anchor                 (no forward extension)
window       tsL .. tsR, the focus week only
```

**The left extension is the one permitted backward look.** The right edge is the temporal
boundary: **no bar of the week being drawn is read for any purpose** — not for the zones, not for
the chain, not for the trades.

## §3.7 · E1 CANNOT DO

```
x  derive ZFP from zone width — width is geometry, ZFP is resistance
x  invent a zone the 9-pillar evidence did not produce
x  omit the degree or the ZFP from a label
x  extend a zone forward past the target week's Friday close
x  read a bar of the target week
x  render a zone without its confluence score in the detail
x  emit a zone count that is constant across weeks
```

## §3.8 · HOW E1'S OUTPUT IS CONSUMED

```
zone { name, top, bottom, width, confluence, degree, zfp, receipt, mitigation }
  |
  |-> the chart draws it                              (this phase)
  |-> the E2 classifier reads confluence and degree   (§5.2)
  |-> the E3 trade contract reads top and bottom       (§6.1)
```

**E1 is the only source of prices in the whole build.** E2 and E3 read E1's output; neither
computes a price of its own. If E1 is wrong, everything downstream is wrong, and it is wrong for
a reason that cannot be seen from the downstream phase.

# §4 · ZFP — ZONE FAILURE PROBABILITY

**Definition:** the probability that price breaks through a given zone during the target week.

**Authoritative source:** `APPENDIX B.1` + `APPENDIX B.2` of `Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md`.
The Pine `calcZFP` in `§10.8` — `width / refRange * 100` — is **banned** by explicit operator
ruling:

> *"A width/reference-range computation printed as '% ZFP' is a fabrication and must be killed
> with fire."*

**Why the ban is correct on physics, not just on principle:** zone width is a property of
geometry; failure probability is a property of structural resistance and market approach. A wide
zone can be air and a thin one can be a wall. A width-derived number has **no defined relationship
to whether price actually broke the zone**, so it cannot be calibrated — there is no experiment
that could show it wrong.

---

## §4.1 · B.1 — BASE PROBABILITY BY ZONE TYPE

| zone type | criteria | base range | **base point (Rule 1)** |
|---|---|---|---|
| Hard Wall | CRITICAL OPTION WALL ≥ $1.5B **and** 3+ pillars **and** a confluent floor/ceiling | 5–15% | **10** |
| Standard Wall | SIGNIFICANT MAGNET $850M–$1.499B **and** 2+ pillars | 15–30% | **22.5** |
| Post-Expiry Ghost | the option has expired; the structural memory remains | 20–40% | **30** |
| Soft Wall | no option wall (EXCLUDED tier, <$850M) **or** only 1–2 pillars | 30–50% | **40** |
| One-Touch | 1 pillar and no option wall | 50–70% | **60** |
| **Liquidity Sweep Zone** | the level sits at a prior exact swing low | **Special** | **SPECIAL — not a number** |

**The tiering is a conjunction, not a list.** A zone needs the option wall *and* the pillar count
*and* the confluence to reach Hard Wall. A $1.5B wall with one pillar is a Standard Wall at best —
and the Pillar 9 cross-check will show it as a scoring bug if the label says otherwise.

## §4.2 · B.2 — MODIFIERS

Each modifier has a **detection method** named by the prompt and a **cutoff** this spec must
supply, because the prompt does not state one.

| modifier | range | **point (Rule 1)** | detection | **gate (Rule 2)** — apply only if |
|---|---|---|---|---|
| option expiry timing | +20–30% | **+25** | Protocol A timestamps | an expiry falls **within the target week** and the zone is inside the striking range |
| macro catalyst against zone | +15–25% | **+20** | Protocol F + web search | a **red-folder** event is scheduled during the week on the zone's opposing side |
| increasing momentum toward zone | +10–20% | **+15** | rate of change in DXY | **PROPOSED:** `abs(ROC5) > 0.5 * ATR20` **and** directed at the zone |
| cross-pair confirmation | +15–25% | **+20** | Protocol A multi-pair | **2 or more** of {EUR/USD, GBP/USD, AUD/USD} show the structurally equivalent zone |
| cascade (prior zone broke) | +20–30% | **+25** | sequential failure | a zone in the **same direction** already failed earlier in the week |
| regime change (EMA200) | +15–25% | **+20** | Pillar 2 recapture | EMA200 was **crossed within the current week** |

**Only `0.5 × ATR20` is not sourced from the prompt.** It is the one invented figure in this
document and is marked PROPOSED so it cannot be mistaken for canon.

**The gates are booleans.** A modifier is either applied at its point value or it is not applied
at all. There is no partial application — a range multiplied by an unknown fraction is the same
nondeterminism the ranges introduce in the first place.

## §4.3 · RULE 1 — POINT SELECTION (PROPOSED)

```
base_point  = the midpoint of the B.1 range
modifier(i) = the midpoint of its B.2 range
```

**Why the midpoint and not the top:**

```
midpoint reproduces the Pillar 9 buckets:
   Hard Wall     10    falls inside   EXTREME <10%
   Standard      22.5  falls inside   HEAVY 10-25%
   Soft          40    falls inside   MODERATE 30-45%
   One-Touch     60    falls inside   LIGHT 40-60%

range TOPS would push every zone one bucket stronger and break the cross-check:
   Standard top  30    lands in HEAVY's edge / MODERATE-HEAVY's floor — ambiguous
   Soft top      50    leaves MODERATE entirely and lands in LIGHT
```

The midpoint is the selection rule that keeps Appendix B and the Pillar 9 table consistent with
each other. A different rule may be chosen by ruling — but **some** rule must exist, because the
spec cannot compute a number from a range without one.

## §4.4 · RULE 2 — MODIFIER THRESHOLDS (PROPOSED)

See §4.2's gate column. The requirement is that **every gate is a testable predicate on data the
week provides.** A gate phrased as *"if momentum is building"* cannot be computed; a gate phrased
as `abs(ROC5) > 0.5 * ATR20` can.

## §4.5 · RULE 3 — CLAMP (PROPOSED)

```
ZFP = clamp( base_point + Σ applied modifiers , 0 , 99 )
```

**Why the clamp is required, with the arithmetic shown:**

```
all six modifiers at their midpoints:  25 + 20 + 15 + 20 + 25 + 20 = 125
on a Soft Wall base of 40:             40 + 125                     = 165%

Appendix B states NO cap.
The full 4,216-line prompt was grepped for one: zero results.
An uncapped formula emits a probability above 100%, at which point every
threshold in §5.2 and §5.3 becomes meaningless — "> 80%" is satisfied by
"165%", so a Soft Wall would cascade into PBS.

Clamp to 99, not 100:
  100 asserts certainty of failure, which no model here can support
  99 preserves the "> 80% cascade" semantics without claiming the impossible
```

## §4.6 · THE RECEIPT — mandatory, non-negotiable

The prompt requires it verbatim: *"Show the base probability and each modifier applied."*

```json
{ "zfp": 28,
  "tier": "Standard Wall",
  "base": 22.5,
  "modifiers_applied": [ {"name": "increasing momentum", "value": 15,
                          "gate": "abs(ROC5)=0.42 > 0.5*ATR20=0.31, directed at zone"} ],
  "modifiers_declined": [ {"name": "expiry", "gate": "no expiry this week"},
                          {"name": "macro",  "gate": "no red-folder event"},
                          {"name": "cross-pair", "gate": "1 of 3 pairs matched, need 2"},
                          {"name": "cascade", "gate": "no same-direction failure prior"},
                          {"name": "regime",  "gate": "EMA200 not crossed this week"} ],
  "raw": 37.5, "clamped": 37.5,
  "pillar9_bucket": "MODERATE-HEAVY 20-35%",
  "cross_check": "consistency"
}
```

**Both halves are required.** Declined modifiers carry their failed gate — that is what makes the
number auditable rather than asserted.

**A ZFP printed on the chart without this receipt is invalid**, no matter how plausible the value
looks.

**The `cross_check` field is a finding, never a resolution.** If the computed ZFP lands outside
the Pillar 9 bucket for that zone's confluence score, both numbers are printed and the disagreement
is reported. Silently choosing one is how a spec contradicts itself in production.

---

## §4.7 · CALIBRATION — the run that makes the percentage real

**Dataset, measured 2026-10-18:** 24 fixtures · **84 distinct weeks** · **41,546** 1H bars
(2025-03 → 2026-07). No separate outcome file is required — outcomes derive from the bars.

### The procedure, as executable steps

```bash
# tool: bash — the calibration run
python3 scripts/zfp_calibrate.py \
  --fixtures 'fixtures/bars/**/*.json' \
  --engine    scripts/e1_zfp.py \
  --out       .trident/pv/proofs/calibration/zfp_report.json \
  2>&1 | tee .trident/pv/proofs/calibration/run.log
```

```text
# the algorithm the script implements
for each of the 84 weeks:
    zones = derive_zones(bars BEFORE the Monday 07:00 lock)
    for zone in zones:
        zfp = compute(zone)          # Appendix B.1 + B.2, with the receipt
        break = did price close through the zone during the week?
        record {week, zone, tier, zfp, receipt, break}
```

```bash
# tool: bash — the report (the calibrate script prints this table itself;
# an inline heredoc has no artifact and cannot be re-run)
cat .trident/pv/proofs/calibration/run.log | tail -20
```

### What the report must show

```
bucket      predicted      observed       n
0-9             5%          3.1%         14
10-19          15%         12.4%         29
20-29          25%         21.7%         41
30-39          35%         44.2%         33
40-49          45%         58.9%         18
50-59          55%         71.4%          9
60+            65%         88.2%          7
```

*(illustrative of the shape — the real numbers come from the run.)*

### The acceptance, decided BEFORE the run

**Tolerance is a decision the operator must make, and it must be made before the run or the run
is worthless.** Suggested:

```
observed within +/- 15 percentage points of predicted, per bucket
n >= 8 per bucket for the bucket to be reportable at all
buckets with n < 8 are printed as UNREPORTABLE, never silently dropped
```

**A tolerance chosen after seeing the data is not a tolerance.** It is a post-hoc rationalisation.

### What failure looks like, and what it means

```
observed tracks predicted      -> ZFP is real; the P1 gate opens
observed flat everywhere       -> the formula measures nothing; no percentage may be drawn
observed inverse               -> the modifier signs are wrong
bimodal, near 0 and near 100   -> the clamp is masking an uncapped formula
all buckets identical          -> ZFP is not varying; it is a constant with noise
```

**If calibration fails, P1 does not start.** Not "start and calibrate later", not "start with a
placeholder ZFP". A percentage on a chart that nobody has calibrated is the exact class this
build exists to eliminate.

## §4.8 · THE LOAD-BEARING CONSEQUENCE

§5.2 classifies shapes by ZFP threshold. §5.3 sequences chains by ZFP threshold. Every one of
these is a percentage:

```
< 20%   Hard Wall        -> WL/PWL · RWL after BS
< 30%   both sides hold  -> SS
20-40%  mid-range        -> R/RS · R after BS
15-40%  three zones      -> WLS
> 45%   zone fails       -> BS/PBS
> 50% / > 60% / > 80%    -> PBS cascade grades
```

**A miscalibrated ZFP puts zones on the wrong side of every threshold above.** The shape is
wrong, the chain is wrong, the trades are wrong — and none of that is visible from inside the
shape or trade phase. The prompt records the consequence in its own words:

> *"This was the #1 Engine 2 error that caused the April 20-24 misprediction — the engine
> predicted upside continuation when a Hard Wall sat directly above. The ZFP of the TARGET zone
> determines the next shape, not the momentum of the current move."*

**So: ZFP accuracy gates E2 accuracy gates E3 accuracy.** It is the foundation of all three
engines, and it is the reason §4.7 is a precondition on P1 rather than a follow-up.

## §4.9 · THE THREE DEFINITIONS — reconciled, so nobody reopens this

The canon contains three different things called ZFP. They are not in conflict once the roles are
stated:

| source | what it defines | status |
|---|---|---|
| `APPENDIX B.1 + B.2` | `base(zone_type) + Σ modifiers` — the **computation** | **AUTHORITATIVE** |
| Pillar 9 Pressure Degree table | score → degree → probability **bucket** | the **cross-check** |
| `§10.8 calcZFP` | `width / refRange * 100` — a Pine **rendering proxy** | **BANNED** |

`scripts/e1_zfp.py` (270 L) implements Appendix B.1+B.2 and matches the authoritative formula.
**Under §L1 it remains a candidate, not a foundation** — its output must appear on a calibrated
chart before it counts.

# §5 · E2 — THE SHAPE CHAIN

**E2 answers one question: what path will price take through those walls.**
Derived from E1's zones. Never free-written. Never a copied path.

---

## §5.1 · THE TAXONOMY — 10 shapes, 5 base + 5 variants

### The five base shapes

**SS — Swing Scalps (consolidation)**
```
candles      8 to 30+
body frac    0.10 - 0.30, tiny
range        tight, 0.2 - 0.5 of the surrounding context
wicks        moderate on both sides
colour       alternating, no dominant direction
role         price oscillates inside a range bounded by two IP zones
```

**BS — Breakout Surge (sustained explosive move)**
```
candles      4 to 8
body frac    0.65 - 0.95 on the thrust
range        3-5x the SS candle range
wicks        minimal on the thrust (<0.2)
colour       dominant in the breakout direction
role         breaks a zone decisively and surges toward the next
```

**R — Recovery (correction / retracement)**
```
candles      6 to 24
body frac    0.40 - 0.60, medium
range        0.8 - 2.0 of the prior move
wicks        moderate
colour       V-shaped, same direction as the prior trend
role         temporary stabilisation — ALWAYS transitional, never terminal
```

**WL — Whiplash (liquidity grab)**
```
candles      3
body frac    0.5 - 0.7 momentum
range        2-4x the context
wicks        LONG on the rejection side
colour       dominant, then immediate reject
role         spike and instant reject at a zone
```

**WLS — Whiplash Storm (extended choppy oscillation)**
```
candles      extended, several sessions
body frac    choppy, no clean value
range        wide
wicks        mixed, no dominant side
colour       no dominant direction
role         a sequence of violent whiplashes across 2-5 sessions
```

### The five variants

```
PBS   Piercing BS        BS that pierces MULTIPLE zones without pausing
                          detected: 2+ zone breaks inside a single BS leg
RS    Recovery Surge     R but sharp instead of slow
                          detected: body frac > 0.60 in fewer than 6 candles
RWL   Reverse Whiplash   whiplash opposite the preceding BS
                          the most common follow-on shape in the taxonomy
                          detected: BS leg, then a 3-candle move of >= 1.2x the
                          BS range in the opposite direction, with a long wick
                          on the rejection side
PWL   Piercing WL        WL that pierces multiple zones before rejecting
                          detected: 2+ zones pierced inside the 3-candle WL
PRWL  Piercing RWL       the strongest reversal signal in the taxonomy
                          detected: RWL whose reversal range is >= 2x the RWL range
```

### Vocabulary that is NOT classifiable

Any token outside these ten has no definition and no ZFP condition. It must not be emitted.
If a term appears in an older document without both, **it does not exist in this build.**

---

## §5.2 · THE CLASSIFICATION MATRIX (§6.2) — apply in strict priority order

**Every row is a ZFP condition.** The classifier reads the target zone's ZFP first, then the
trend. Never the other way around.

| pri | condition | shape | confidence | the discriminating measurement |
|---|---|---|---|---|
| 1 | breaks a zone with **ZFP > 45%**, confirms 15+ min, measured-move target exists | **BS** (PBS if multiple zones) | HIGH | a close beyond the zone edge + a 15-minute close beyond it |
| 2 | surges to a zone with **ZFP < 20%**, briefly pierces, rejects, LSZ target present | **WL** (PWL if multiple) | HIGH | a wick through the zone + a close back inside within 3 candles |
| 3 | after BS or WL: stabilises at a zone with **ZFP 20–40%**, duration < 1 session | **R** (RS if sharp) | MODERATE | duration under 24h + a body fraction in 0.40–0.60 |
| 4 | **3+ zones within a 0.30–0.50 DXY band**, violent oscillation, 4H consolidation | **WLS** | HIGH | the count of zones inside the band + an ATR ratio > 2.0 |
| 5 | oscillating between Heavy and Extreme zones, **both ZFP < 30%**, > 1 session | **SS** | HIGH | body fractions all < 0.30 + a range ratio < 0.5 |
| 6 | after BS: violent reversal opposite through the origin, Hard Wall rejection above | **RWL** (PRWL if piercing) | MOD-HIGH | a full reversal of the BS range + a Hard Wall rejection |

### Why the priority order matters

A week can satisfy several rows. Priority 1 wins over priority 2 because **a zone that fails at
>45% is a stronger signal than a zone that rejects at <20%** — the first is a structural
breakdown, the second is a normal reaction. Applying the rows in a different order produces a
different chain for the same week, and that is the #1 documented Engine 2 error:

> *"This was the #1 Engine 2 error that caused the April 20-24 misprediction — the engine
> predicted upside continuation when a Hard Wall sat directly above."*

The ZFP of the **target** zone determines the next shape. The momentum of the **current** move
does not.

---

## §5.3 · ZFP-CONDITIONED TRANSITIONS (§6.4.1)

**Sequence on the target zone's ZFP, never on current momentum.**

| current | target zone ZFP | next | confidence | the flip condition |
|---|---|---|---|---|
| BS | **< 20%** Hard Wall | **RWL** — rejection, NOT R, NOT PBS | HIGH | if the BS confirms above the wall, it becomes PBS |
| BS | **20–40%** | **R** | HIGH | if the R exceeds one session, reclassify as SS |
| BS | **> 60%** | **PBS** | MODERATE | if the second zone also > 60%, confidence rises to HIGH |
| BS | **> 80%** | **PBS** strong | HIGH | cascade: the third zone's ZFP decides the continuation |
| SS | bounding zone **> 45%** fails | **BS** | HIGH | if the break does not confirm in 15m, it was a WL |
| SS | **all bounding zones < 30%** | **SS continues** | HIGH | until a bounding zone crosses 30% |
| WLS | any bounding zone fails | **BS** | VERY HIGH | the WLS terminates on the first break |
| R | persists > 1 full session | **SS** — reclassify | MOD-HIGH | a reclassification, not a new shape |
| R | < 1 session, opposing zone near | **WL / RWL** | MODERATE | direction decides which |
| WL | opposite momentum builds | **RWL** | MOD-HIGH | the momentum threshold is the §4.2 rule |
| WL | no opposite momentum | **SS** | MODERATE | consolidation, not reversal |

### The cascade rule — the one the old engine missed

When a zone fails, the engine does **not** reclassify the current shape. It reads the **next**
zone's ZFP and sequences from there:

```
zone1 fails at ZFP 62%  ->  BS
zone2 has ZFP 71%       ->  the BS CONTINUES as PBS
zone3 has ZFP 24%       ->  the PBS terminates; the chain moves to R
```

**A cascade is a chain of BS legs through consecutive high-ZFP zones, terminated by the first
low-ZFP zone.** It is one shape (PBS), not three.

---

## §5.4 · THE OBSERVED CHAINS — all twelve, with their frequencies ranked

```
rank  chain                                     frequency
 1    SS -> BS -> R -> WL                       HIGHEST    the default weekly storyline
 2    SS -> BS                                  VERY HIGH  the abbreviated default
 3    BS -> R -> RWL                            HIGH       false breakout signal
 4    BS -> RWL -> SS -> BS                     HIGH       the complete false-breakout cycle
 5    WL -> RWL -> SS -> BS                     MODERATE
 6    R  -> RWL -> SS -> BS                     MODERATE
 7    BS -> RWL -> PBS                          MODERATE
 8    BS -> R -> PBS                            MODERATE
 9    SS -> BS -> SS -> BS                      MODERATE   the double-touch week
10    WLS -> BS -> WLS                          MODERATE
11    WLS -> SS -> PBS                          MODERATE
12    PBS -> R/SS -> PRWL -> SS                 LOW-MOD    the full cascade week
```

**Maximum chain length: 5.** Terminate when the cumulative confidence drops below 25%.
**Never extend a chain past a Hard Wall** — a Hard Wall terminates the story, it does not continue it.

**The default, if nothing else fires:** `SS -> BS -> R -> WL`. This is the canonical weekly
storyline and the shape to compare against when a chain looks unusual.

---

## §5.5 · FORWARD MAPPING — the mandatory five steps (§6.6)

The engine produces five things in order. A missing step is an incomplete classification, not a
partial success.

```
STEP 1  CURRENT SHAPE
        name it · name the anchoring zone · name that zone's ZFP

STEP 2  TRANSITION
        apply §5.2 then §5.3 · assign confidence

STEP 3  CHAIN EXTENSION
        one shape at a time, each with (current, trigger, ZFP, next, confidence)
        format:  A -> [zone, ZFP X%] -> B -> [...] -> C [confidence Y%]

STEP 4  ALTERNATIVE CHAIN
        at least one, with the decision zone and the ZFP threshold that flips it
        format:  PRIMARY  A -> B -> C
                 DECISION ZONE  ZFP > T%  ->  ALT  A -> X -> Y

STEP 5  DAY DECOMPOSITION
        Mon..Fri: the day's shape, direction, key zone, triggers, confidence
```

**Step 4 is mandatory and it is what makes the chain falsifiable.** A chain with no stated
alternative cannot be wrong — and a prediction that cannot be wrong is not a prediction.

### A worked chain, in the required format

```
PRIMARY  SS -> [KEY SUPPORT BAND, ZFP 12%] -> BS -> [UPPER RESISTANCE, ZFP 24%] -> R
         -> [RESISTANCE CEILING, ZFP 62%] -> BS [confidence 61%]

DECISION ZONE  RESISTANCE CEILING
  ZFP > 70%   ->  ALT: PBS -> [CEILING, ZFP 71%] -> PBS -> [EQUILIBRIUM] -> R
  ZFP < 30%   ->  ALT: SS continues, no breakout this week

DAY DECOMPOSITION
  Mon  SS   sideways   KEY SUPPORT BAND     hold 12%        55%
  Tue  BS   up         KEY SUPPORT -> EQ    break 24%       62%
  Wed  R    down       EQ -> UPPER RES      retrace 20%     58%
  Thu  BS   up         UPPER -> CEILING     break 62%       61%
  Fri  R    down       CEILING -> EQ        retrace 24%     59%
```

---

## §5.6 · E2 IS TWO PHASES (operator ruling)

```
PHASE 1  THE BOXES      P3 in §9.4
         one box per shape, chained.
           left  = the shape's start bar TIME   (a real timestamp from the data)
           right = the shape's end bar TIME     (a real timestamp)
           top / bottom = the two adjacent ladder rungs the shape traversed
           label = the shape token
         consecutive boxes SHARE an edge:  box[i].right == box[i+1].left
         ZERO diagonals — every edge is axis-aligned
         purpose: make the structure legible and verifiable
         reference: /home/leviathan/Pictures/WINNING_TRADE_LIBARARY/
                    39 images across 10 transition folders, one per chain

PHASE 2  THE LINE       P4 in §9.5
         collapse the boxes into ONE polyline.
           vertex[i]   = (entry time, entry rung) of box[i]
           vertex[i+1] = (exit time,  exit rung)  of box[i]
         join in time order. The vertices ARE the box corners — no new points.
         acceptance MEASURED, not eyeballed:
           within 3 px of a candle column for >= 90% of its length
           (the old polyline measured 0.18 — the reason it was rejected)
```

**The phase split exists because a polyline drawn before the boxes exist is a polyline drawn
between invented points.** The boxes establish where price actually was; the line then traces it.

---

## §5.7 · E2 CANNOT DO

```
x  free-write a chain                      x  emit a shape not in §5.1
x  sequence on current momentum            x  emit a shape without a ZFP-conditioned trigger
x  read a bar of the target week           x  classify from a 4H timeframe (1H primary; 4H validates only)
x  extend a chain past a Hard Wall         x  exceed 5 shapes
x  omit Step 4 (the alternative chain)     x  omit the confidence on any link
x  produce a chain that is identical across two different weeks
```

## §5.8 · THE TEMPORAL BOUNDARY — restated because it governs every shape

```
Monday 09:00 London is the anchor. Everything E2 reads is from BEFORE it.
  the ladder          built from the prior week's freeze
  the zone ZFP        computed from prior-week pillars
  the swing points    confirmed 2 bars after printing, and before the lock
  the trend           read from prior-week closes
NO bar of the target week is read, at any point, for any purpose.
A shape that needed a bar from the target week to classify was misclassified.
```

# §6 · E3 — THE TRADE SETUPS

**E3 is derived from the E2 chain.** Not from the zones directly, and never from realtime chart
reading. If E2 has not run, E3 does not exist.

`DIRF-E3-DEFERRED` is `TERMINATION_GRADE`: *"E1 and E2 must be solid and verifiably like 90%
accurate... E3 is phase two, no thinking about E3 before then."*

---

## §6.1 · THE CONTRACT — every field, verbatim from the canon

```
ENTRY   at the EDGE of a 1H / 30m / 15m LQZ or S/D zone
        NEVER at a 4H zone edge                    (FORENSIC LAW 1)
        NEVER at a shape vertex
        NEVER derived from realtime chart reading

SL      the OPPOSITE zone edge + a 2-5 pip buffer  (FORENSIC LAWS 2-3)

TP      the nearest opposing zone on the entry side

RRR     >= 3.0 or the setup is REJECTED            (MIN_RRR_FLOOR)

TIER    the primary entry is 1H/30m/15m
        4H zones are structural context ONLY — they may guide but never trigger

CATEGORY the shape it entered from:
        SS · BS · WL · RWL · R · LADDER · AVATAR

LABEL   every setup carries a DAY (Mon-Fri) and a SESSION (London / NY)
```

### Why the 4H rule is absolute

A 4H zone is structural context — it tells you where the strong levels are. It does not tell you
when. An entry taken at a 4H edge sits at a structural level with no timing, and the SL placed
beyond the opposite 4H edge is the single most frequently breached line in the recorded trades.
The 1H/30m/15m tiers exist because they carry both a level *and* a timing signal.

### Why the RRR floor is absolute

```
RRR  = (TP - entry) / (entry - SL)      for a long
RRR  = (entry - TP) / (SL - entry)      for a short

RRR < 3.0  ->  the setup is REJECTED. Not discounted, not downgraded — rejected.
```

A 3.0 floor means three losing trades are paid for by one winning trade. Below it, the geometry
does not survive normal slippage.

---

## §6.2 · THE BOX

```
left   = entry time          a real bar timestamp from the chain
right  = TP time             a real bar timestamp
top    = TP price
bottom = SL price

teal   = LONG
red    = SHORT
```

**Boxes OVERLAP in time.** Two setups opened at different points in Monday are both live until
each resolves. They are parallel trades, not a chain. **Consecutive-box logic must not be applied
to E3** — that rule belongs to E2's phase-1 boxes only.

**The box's width is the holding period.** A box that spans Monday to Thursday is a four-day hold;
a box that spans one session is a scalp. The width is readable off the frame and is part of the
acceptance.

---

## §6.3 · THE GOLDEN-WEEK GROUND TRUTH — 8 EU setups

These are the operator's own recorded trades for the golden week. **They are the E3 acceptance
for that week: every row must reproduce.**

| # | direction | entry | SL | TP | RRR | category | day |
|---|---|---|---|---|---|---|---|
| 1 | LONG | 1.14395 | 1.14485 | 1.14110 | 3.18 | RWL | Mon |
| 2 | LONG | 1.14425 | 1.14460 | 1.14135 | 8.29 | RWL | Mon |
| 3 | SHORT | 1.14395 | 1.14380 | 1.14645 | 16.67 | BS | Mon |
| 4 | SHORT | 1.14225 | 1.14215 | 1.14245 | 2.00 | SS | Tue |
| 5 | SHORT | 1.14290 | 1.14300 | 1.14255 | 3.50 | SS | Tue |
| 6 | SHORT | 1.14300 | 1.14345 | 1.14020 | 6.22 | BS | Wed |
| 7 | LONG | 1.14020 | 1.14010 | 1.14110 | 9.00 | WLS | Thu |
| 8 | LONG | 1.14020 | 1.14010 | 1.14150 | 13.00 | WLS | Fri |

**Read the table before trusting the floor.** Row 4 shows `RRR 2.00`, below the 3.0 floor. That is
the operator's own recorded trade, so one of two things is true and both must be resolved before
P5 runs:

```
(a) MIN_RRR_FLOOR applies to DERIVED setups only, and these eight are the
    accepted historical record — then the acceptance is "reproduce the eight",
    not "reproduce the eight that pass the floor"
(b) MIN_RRR_FLOOR applies to all, and row 4 must be rejected by the derivation,
    making the golden week's expected count 7, not 8
```

**This is open decision §13.8 — it changes the P5.4 gate count and must be ruled before P5.**

### The entries in context

Rows 1 and 2 both open Monday at overlapping prices — they are two simultaneous longs on the same
reversal, which is why the boxes must be allowed to overlap. Rows 1 and 3 both anchor at 1.14395
in opposite directions: **the same zone edge, opposite reads** — row 3 is the failure of row 1's
thesis and the BS that follows.

Row 6 is the week's largest short (RRR 6.22), entered Wednesday on the BS category. Rows 7 and 8
are the Thursday and Friday WLS longs from the identical 1.14020 entry with different TPs —
**one entry, two exits**, which the box model supports by width and must not collapse into one.

---

## §6.4 · THE HIT TEST — how a setup is scored

For each setup, walk the week's bars forward from the entry time:

```
for each bar after entry:
    if dir == LONG:
        if bar.low  <= SL  -> LOSS   (stop hit first)
        if bar.high >= TP  -> WIN    (target hit first)
    if dir == SHORT:
        if bar.high >= SL  -> LOSS
        if bar.low  <= TP  -> WIN
first event decides. A bar that hits both in one candle counts as a LOSS —
  the conservative reading, and the only one that survives real fills.
bars after Friday close -> UNRESOLVED, reported separately, never counted as wins
```

**The score is `wins / resolved`, and `resolved` is always reported alongside it.** A score of
`3/3` and a score of `3/8` with five unresolved are different results and must not be printed the
same way.

---

## §6.5 · E3 CANNOT DO

```
x  enter at a shape vertex                      x  enter at a 4H zone edge
x  a setup with RRR < 3.0                       x  a setup with no DAY label
x  a setup with no SESSION label                x  realtime chart reading
x  a setup whose entry does not trace to an E1 zone edge
x  force a setup on a week that has none
x  count an UNRESOLVED setup as a win
x  collapse two simultaneous setups on one entry into one box
x  apply consecutive-box logic to trade boxes
```

**The last two are the modelling traps.** The E2 phase-1 boxes chain; the E3 boxes overlap. They
are visually similar and structurally opposite, and conflating them produces either a chained
trade list that misses parallel entries, or a scattered shape chain.

---

## §6.6 · HOW E3 IS DERIVED — the sequence

```
the chain (E2)      shape transitions with their zone anchors
   |
   v
an entry opportunity = a chain vertex that sits on a zone edge, in a 1H/30m/15m tier
   |
   v
SL    = the opposite edge of that zone + 2-5 pips
TP    = the nearest opposing zone on the entry side
RRR   = computed; >= 3.0 or reject
   |
   v
the box {entry time, TP time, TP price, SL price, category, day, session}
```

**Every setup must be traceable back to a zone edge in E1 and a vertex in E2.** An entry that
traces to neither is fabricated, regardless of its RRR.

# §7 · THE DERIVATION CHAIN AND THE FOUR DENSITIES

## §7.1 · THE FOUR DENSITIES (Trident Fractal Architecture v2.3, verbatim concepts)

```
EARTH   liquidity & institutional pressure    the foundation
FIRE    supply & demand                       the firepower
WATER   macro shapes                          the waves
AIR     Fibonacci                             the spiderweb
```

**The metaphor is structural, not decorative.** Water flows *over* Earth and Fire; Fire burns
*through* them; Air carries *inside* a recovery. Each density contributes a different quantity to
a different engine, and a build that collapses them loses the quantity that density supplied.

## §7.2 · WHICH DENSITY FEEDS WHICH ENGINE

| density | what it contributes | consumed by |
|---|---|---|
| **EARTH** | the levels — round numbers, EMAs, swings, order blocks, liquidity pools | E1 (zone positions) · E3 (SL/TP placement) |
| **FIRE** | the supply/demand pressure — confluence, order flow, who is leaning | E1 (confluence score → degree) · E2 (zone strength) |
| **WATER** | the macro shapes — the chain itself | E2 (the shapes, the chain) |
| **AIR** | the fib retracements and extensions | E2 (levels inside a recovery) · E3 (TP selection) |

```
EARTH + FIRE  ->  E1's zones     {top, bottom, confluence, degree, ZFP}
                       |
                       v
WATER + AIR   ->  E2's chain     {shape tokens, transitions, the one line}
                       |
                       v
EARTH + WATER ->  E3's trades     {entry at an EARTH zone edge, TP along an E2 vertex}
```

## §7.3 · WHY AIR CANNOT BE DROPPED — the measured consequence

My earlier statement *"pressure + ZFP"* collapsed four densities into two and dropped Fibonacci.
The operator's response:

> *"yes exactly. My zero tolerance for slop coded bullshit."*

**Fibonacci is not decoration.** The golden-week ground truth uses it constantly:

```
0.618 -> TP 1.618          the 1.618 extension is the TP for the entry at 1.14395
0.786 -> TP 1.14434        used on the 1H supply
0.5   -> 1.14120           the midpoint of the 1H MoM demand zone
0.382 -> 1.14074
0.236 -> 1.14017
0     -> 1.13925           the range origin
```

**A build without Air cannot reproduce any of these levels** — so it cannot reproduce the
recorded trades, so it fails P5 regardless of how E1 and E2 look. Fibonacci supplies the
*interior* levels of a recovery, which is exactly where E3's TPs sit.

## §7.4 · THE ONE-WAY INVARIANT

```
EARTH + FIRE  -->  E1  -->  WATER + AIR  -->  E2  -->  E1's edges + E2's vertices  -->  E3
                    ^                        |
                    |                        |
                    never reads back         never reads back
```

**Three rules follow mechanically:**

```
1  E1 never reads E2 or E3.  A zone that was adjusted because a trade failed downstream
   is a zone fitted to an outcome, and the anti-hardcode gate will show it as one.

2  E2 never reads E3.  A chain that is smoother because the trades came out nicer is
   not a chain; it is a backfill.

3  E3 never invents a price.  Every entry traces to an E1 zone edge. Every TP traces
   to an E1 zone edge or an AIR level. Every SL traces to an E1 zone edge.
   An E3 number that traces to nothing is fabricated (L4, L9).
```

## §7.5 · WHERE THE CHAIN CAN BREAK — the failure visibility problem

The dependency direction means **a defect's visibility is inverted from its cost:**

```
defect in E1 (zones)      visible ONLY at P1 — invisible from P2 onward without a re-check
defect in the ZFP         visible only at P3 (shape classification) — invisible at P1/P2
defect in the chain       visible only at P4 (the line ratio) — invisible at P3
defect in E1 in E3        visible only at P5 — E3's boxes look plausible while wrong
```

**This is why Gate A at every phase re-checks the prior phase's output.** P2's Gate A criterion 1
is "P1's five IP bands are still there". P6's Gate A re-opens the frame and re-checks all four.
A defect introduced at P1 that survives to P6 must be caught at P6 even though P1 caught it
first — because P1's fix may have introduced a different one.

## §7.6 · THE TEMPORAL BOUNDARY APPLIES TO THE WHOLE CHAIN

```
Monday 09:00 London, from the prior Friday's freeze.

  E1's zones          derived from the prior week's pillars and swings
  E2's chain          classified from zones that already exist at the lock
  E3's entries        at zone edges that already exist at the lock
  the left extension  exactly one week back, never forward

NO bar of the target week is read by any engine, for any purpose.
A shape that needed a target-week bar was misclassified. A trade that needed a
target-week bar was not derivable. A zone that needed a target-week bar was invented.
```

# §8 · CURRENT STATE — MEASURED, WITH THE COMMANDS

**Nothing in this build is proven.** L1 governs: a prior agent's "built and works" is a claim until
it appears on a chart that was opened and read.

## §8.1 · PROVED — each with the command that produced it

```bash
$ ss -ltn | grep -oE ':(9741|9851|9222)' | sort -u
:9222 :9741 :9851
$ DISPLAY=:4 xdotool search --name "Plutus Vision" | wc -l
1
```
→ the rig is up: station `:9741`, renderer `:9851`, CDP `:9222`, one indicator window on
display `:4`. **`:9230` is NOT listening** — an earlier draft claimed it; the measurement does
not. The rig is the only part of this build that is confirmed working end to end.

```bash
$ wc -lc vision/plutus-vision.pine
  231 9715 vision/plutus-vision.pine
```
→ the indicator file exists at 231 lines. **Its render counts are NOT current** — the file was
rewritten after its last render, so the only proven fact is that it exists and compiled in a
prior run. Any count quoted for it is stale.

```bash
$ python3 <fixture census over fixtures/bars/**/*.json>
fixtures=24 weeks=84 bars=41546
```
→ 84 weeks of 1H bar data across 24 fixtures, spanning 2025-03 → 2026-07. This is the calibration
dataset for §4.7 and the pool from which held-out weeks are drawn.

```bash
$ wc -l scripts/e1_zfp.py scripts/e2_engine.py scripts/e1_fetch.py
  270 scripts/e1_zfp.py
  783 scripts/e2_engine.py
  784 scripts/e1_fetch.py
```
→ the three engine candidates exist at those sizes. **Existence is not working (L1).**

## §8.2 · CANDIDATES — unproven until rendered

| module | size | what it claims | what would prove it |
|---|---|---|---|
| `scripts/e1_zfp.py` | 270 L | Appendix B.1+B.2 — base + modifiers with a receipt | its ZFP appears on a calibrated chart, P1 Gate A |
| `scripts/e2_engine.py` | 783 L | the §6.4.1 transition table + `[NO DATA]` honesty | its shapes appear as boxes, P3 Gate A |
| `scripts/e1_fetch.py` | 784 L | the `[NO DATA]` discipline — never invent data | its refusals appear as `NO DATA`, not as values |

`e1_zfp.py` is the only one whose formula I verified against the authoritative source: Appendix B
says `base(zone_type) + Σ(modifiers)` and the script computes `base(zone_type) + Σ(modifiers)`.
**That match makes it a candidate, not a foundation.**

## §8.3 · ABSENT — does not exist

```
E1 face B in the merged render
the E2 shape chain as boxes (phase 1)
the E2 line (phase 2)
E3 trade boxes
the ZFP calibration run (§4.7)
the held-out week set — the operator draws it after the freeze
gate_A / gate_B scripts for any phase
.trident/pv/ as a tree at all
```

## §8.4 · THE RENDER, AS ACTUALLY OBSERVED (last successful render, pre-rewrite)

```
load receipt   boxes 13 · labels 15 · lines 1 · bars 364   on fixtures/bars/weeks/2026-04-13.json
opened frame   11 named bands, reading:
                 PRIOR HIGH · ROUND 100.00 · ROUND 99.50 · EQUILIBRIUM ·
                 ROUND 99.00 · PRIOR LOW · PRIOR HIGH · ROUND 98.50 ·
                 EQUILIBRIUM · ROUND 98.00 · PRIOR LOW
               1 short cyan segment, ~Apr 9-11, starting on a band, ending in air
               candles running 100.2 -> 97.5 across the week
```

**Three defects visible in that one frame:**

```
1  the names are a sorted PRICE LADDER, not the five IP roles
   PRIOR HIGH / ROUND 99.50 / SWING HIGH  vs  IP RESISTANCE CEILING / EQUILIBRIUM ZONE /
                                               KEY SUPPORT BAND
   -> the zone MODEL is wrong. Redrawing the same object better does not fix this.

2  the line has 2 vertices and terminates mid-pane
   -> it does not trace the week; measured column-coincidence on the earlier
      12-week render set was 0.18 against a target of >= 0.90

3  no face B at all — no OB boxes, no LQZ rails on this render
```

## §8.5 · THE FAILURE RECORD — why the prior build failed

From `forensic/SLUMP_MAP.md` and `FAILURE_LEDGER_INDICATOR_PORT.md`, verbatim:

```
BUILT AND WORKS (the candidates, §8.2)
  e1_zfp.py · e2_engine.py · e1_fetch.py · the pivot engine + MA grid + band_of
  · the rig · the fixtures

BUILT AND IS THE DERAILMENT
  the baked e1_injected_* arrays in the .pine     15 literal price pushes
  scripts/lqz_vision_v2_build.py                  the offline builder that bakes them
  a twin renderer · orphan modules · 17 reviewer rounds on cosmetics

THE WASTE
  three days perfecting the baked payload instead of porting the engine
  121,200,415 tokens on one goal · 76 commits

THE ROOT CAUSE
  the chart had no feedback path into the agent's loop — it could not see
  that its own work was wrong
```

**The root cause is the reason every phase closes twice.** A build with no feedback path will
optimize whatever it can measure, and if what it can measure is a text file, it will optimize text
files. That is §L2.

## §8.6 · THE MANDATE THIS RECORD PRODUCES

```
1  no literal price may appear in a draw call         (L4) — the baked arrays are the failure
2  no phase closes on a text property                 (L2) — the feedback path must reach pixels
3  every phase renders on a week it was not built for  (L5, L6) — the held-out set
4  the engine is PORTED, not rewritten                 — 8.2's candidates are the source
5  no "built and works" claim enters this spec         (L1) — §8.2 lists them as candidates
```

# §9 · THE FULL EXECUTION WORKFLOW

## §9.0 · THE UNIVERSAL PHASE CONTRACT

Every phase runs the same six steps. A phase that fails a gate does not advance. There is no
"close enough", no "continue and fix later", no partial pass.

```
P0  ENTRY       the previous phase's two gates BOTH exited 0.
                The commit sha is recorded. The path-lock sha is read.
                If either gate failed, this phase does not start.
A   ACTION      the exact tool calls of §9.2-§9.7, in order, with literal arguments.
                No line numbers carried between turns — re-derive with grep before each edit.
E   EVIDENCE    every command's stdout is written to .trident/pv/proofs/<phase>/.
                A step whose evidence file is missing is UNVERIFIED.
J   JUDGE       a command decides wherever a command can decide.
                The model judges only the two semantic calls, and only after
                passing its calibration pair.
R   REASONING   three lines before any gate run:
                  what changed · what the evidence shows · why it is safe to advance
G   GATE        bash .trident/pv/gates/gate_<phase>_a.sh   -> exit 0 = GATE A
                bash .trident/pv/gates/gate_<phase>_b.sh   -> exit 0 = GATE B
                BOTH must exit 0. Either failure -> the debug loop.
C   COMMIT      git commit carrying both gate results in the message body.
                The commit sha becomes the next phase's ENTRY reference.
```

### The evidence law, restated because it governs everything below

```
VERDICT EVIDENCE     a frame PNG opened with the read tool in the SAME TURN as the capture
                     a value the code RETURNED (not a file it wrote)
                     a live dependency's HTTP response
PRE-FLIGHT GUARD     grep · sha256sum · wc -l · file existence · diff · a JSON the agent authored
                     -> may HALT a phase
                     -> may NEVER pass one
```

A phase whose only evidence is a guard reports `UNVERIFIED`. It does not report PASS.

### The debug loop — every gate failure, no exceptions

```
1  CLASSIFY, print exactly one of five:
     GATE_DEFECT     the gate's expectation is wrong
     INPUT_DEFECT    my literal, path, or argument was wrong
     SOURCE_DEFECT   the code change is wrong or incomplete
     CONCURRENCY     the path-lock sha changed; another session wrote the file
     ENV             rig down, dependency missing, disk unwritable

2  RESPONSE, one per class, never improvised:
     GATE_DEFECT     fix the gate, re-run THE GATE ONLY. Re-baseline its sha.
     INPUT_DEFECT    correct the literal, redo the ACTION from A.
     SOURCE_DEFECT   git checkout -- <path> to this phase's entry sha, redo A.
     CONCURRENCY     HALT. Name the other writer. Operator decision.
     ENV             HALT. Paste the verbatim error.

3  BOUND: .trident/pv/proofs/<phase>/attempt.N  ->  1, 2, 3
     3rd failure -> HALT with the gate name, all three verbatim errors, and git status.

4  REGENERATE: evidence produced before a fix is never reused for after it.
```

### The rig bring-up — once per session, before P0

```bash
# tool: bash — the agent display. NEVER :0/:1/:2 (those are the operator's).
S=~/.omp/agent/managed-skills/computer-use-virtual-display/scripts/agent-display.sh
export AGENT_DISPLAY_ID=pv-indicator
bash $S up
SLOT=$(bash $S status | grep -oE ':[0-9]+' | head -1); echo "SLOT=$SLOT"
#  EXPECTED: AGENT_DISPLAY=<slot> and a pid printed.
#  FAIL "concurrent 'up' for instance": that instance is already UP — a success, not a failure.
```

```bash
# tool: bash — the station, rail and renderer
cd /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
FIX="$PWD/fixtures/bars/2026-07-06.json"
env -C pine-ide/pine-station PINE_STATION_PORT=9741 PINE_STATION_HOST=127.0.0.1 \
  PLUTUS_BARS_FIXTURE="$FIX" PLUTUS_LIVE_ROOT="$PWD" PINE_STATION_RSS_CAP_MB=2560 \
  setsid -f bash -c 'while :; do node --max-old-space-size=1536 server.mjs; sleep 1; done' \
  >/tmp/pv-station.log 2>&1 </dev/null
env PV_FIXTURE="$FIX" setsid -f python3 scripts/pv-server.py 9851 \
  "$PWD/pine-ide/ide/renderer" >/tmp/pv-http.log 2>&1 </dev/null
```

**The station supervisor is a process group. `pkill -f server.mjs` does NOT match it — its
cmdline is `node --max-old-space-size=1536 server.mjs` with no path.** Measured 2026-10-18: a
stale supervisor held the wrong fixture for two hours because of this. Kill by supervisor pattern:

```bash
pkill -f 'while :; do node --max-old-space-size=1536 server.mjs'   # the supervisor
# then find and kill the station by its PORT, never by a name you remember
ss -ltnp | grep 9741 | grep -oE 'pid=[0-9]+' | cut -d= -f2 | xargs -r kill -9
```

```bash
# tool: bash — verify the station serves the fixture you think it does
curl -s -m4 "http://127.0.0.1:9741/bars?pair=DXY&timeframe=1H" | python3 -c "
import json,sys,datetime
d=json.load(sys.stdin)['data']; b=d['bars']; f=d.get('source','?').split('/')[-1]
def iso(t): return datetime.datetime.fromtimestamp((t if t>1e11 else t*1000)/1000, datetime.UTC).strftime('%Y-%m-%d %H:%M')
print('count:', len(b), 'range:', iso(b[0]['time']), '..', iso(b[-1]['time']))
print('fixture:', f)"
#  EXPECTED: count matches the fixture's bar count, and the range matches that week.
#  FAIL — count is the OLD fixture's, or range is a different month: the supervisor survived.
#         kill by port, relaunch, re-verify. Do not proceed on a stale fixture.
```

```bash
# tool: bash — launch the chart into the agent display
CHROME=/home/leviathan/.cache/puppeteer/chrome/linux-154.0.8037.57/chrome-linux64/chrome
AGENT_DISPLAY_ID=pv-indicator bash $S app "$CHROME" \
  --user-data-dir=/tmp/pv-chrome-$SLOT --no-first-run --no-default-browser-check \
  --remote-debugging-port=9222 --remote-allow-origins='*' \
  --window-size=1600,900 --window-position=0,0 \
  --ozone-platform=x11 --disable-gpu --use-gl=swiftshader --enable-unsafe-swiftshader \
  --app="http://127.0.0.1:9851/pine.html"
```

**`--ozone-platform=x11` is mandatory.** Measured: without it chrome probes Wayland, prints
`Failed to connect to Wayland display`, then `The platform failed to initialize. Exiting.` — and
the chart renders into nothing with no window to capture.

```bash
# tool: bash — verify the window exists on the RIGHT display
for d in :3 :4 :5; do
  n=$(DISPLAY=$d xdotool search --name 'Plutus Vision' 2>/dev/null | wc -l)
  [ "$n" -gt 0 ] && echo "  $d -> $n window(s)"
done
```

**If the window is on the display the Pine IDE already used, abort and re-launch with a distinct
`AGENT_DISPLAY_ID`.** Two build surfaces on one display cross-capture and produce verdicts about
the wrong window. Measured 2026-10-18.

### The render-and-capture loop — used by every LOOK step

```bash
# tool: bash — load a script into the IDE
cd /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
export DISPLAY=$SLOT
timeout 150 bun scripts/pv-load.mjs <the .pine> <PAIR> <TF> 2>&1 | tail -2
```

**The returned `counts` object is NOT a verdict.** It is a loading receipt. `boxes:13 labels:15`
appeared while the chart was blank — measured. Only the opened frame decides.

```bash
# tool: bash — capture the WINDOW, never the device
W=$(DISPLAY=$SLOT xdotool search --name "Plutus Vision" | head -1)
bash $S shot $W /tmp/pv/<phase>.png 2>&1
ls -la /tmp/pv/<phase>.png
```

`shot` refuses `WIN=root` by design — *"you are explicitly forbidden from doing device level
screenshots."*

```python
# tool: read — SAME TURN as the capture. Never later, never batched.
read(path="/tmp/pv/<phase>.png")
```

**A frame not opened this turn is not evidence.** A frame opened last turn is not evidence.

---

## §9.1 · P0 · BASELINE

**Purpose:** establish what exists before touching it, and prove the rig works. Without this phase
every later comparison measures against nothing.

### P0.0 — prove the workflow is wired, then create the evidence tree
```bash
# tool: bash — THE PREDICATE. It extracts every command in this file and
# asserts it against the tree. Exit 0 is the entry condition for P0.1.
python3 scripts/spec_wire_verify.py
#  EXIT 0 = every command in §9 can run against the disk as it is
#  EXIT 1 = at least one cannot: it fails, or silently yields an empty artifact
#  This script is mutation-proven: 7 reverted fixes, 7 red.
```
```bash
# tool: bash — every phase writes here; nothing created it before
mkdir -p .trident/pv/gates .trident/pv/proofs /tmp/pv
ls -d .trident/pv/*/
```

### P0.1 — bring the rig up
Run §9.0's rig bring-up verbatim. Record `SLOT` and the station's bar count to
`.trident/pv/proofs/P0/rig.txt`.

### P0.2 — load and render the current indicator
```bash
# tool: bash
export DISPLAY=$SLOT
timeout 150 bun scripts/pv-load.mjs vision/plutus-vision.pine DXY 1H \
  2>&1 | tee .trident/pv/proofs/P0/load.txt | tail -2
```
```bash
# tool: bash
sleep 5
W=$(DISPLAY=$SLOT xdotool search --name "Plutus Vision" | head -1)
bash $S shot $W /tmp/pv/P0.png
```
```python
# tool: read
read(path="/tmp/pv/P0.png")
```

### P0.3 — enumerate off the pixels
Write `.trident/pv/proofs/P0/enumeration.json` from what the frame shows. **Every field filled
from the image, never from the source file.**

```json
{ "png": "/tmp/pv/P0.png", "read_in_turn": true,
  "candles_present": true,
  "band_count": <INT>, "band_labels": ["<verbatim from the frame>"],
  "line_count": <INT>, "box_count": <INT>,
  "axis_start": "<date>", "axis_end": "<date>",
  "unknowns": ["<anything not readable>"] }
```

**No placeholder may survive.** `grep -c '<INT>\|<date>'` on the file must return `0`. A surviving
placeholder means the enumeration was typed, not read.

### P0.4 — GATE A

| criterion | how it is decided |
|---|---|
| the frame exists | `read()` succeeded this turn |
| the enumeration has no placeholders | `grep -c '<'` == 0 |
| every band label is verbatim from the frame | cross-check against the opened image |
| `unknowns` is populated if anything was unreadable | an unlisted unknown is a fabricated count |

### P0.5 — GATE B
**n/a.** No new object exists yet.

### P0.6 — COMMIT
```
pv(P0): baseline rendered and enumerated off the pixels
gate_A: exit 0 (enumeration.json, no placeholders)
evidence: .trident/pv/proofs/P0/*
```

**The output of P0 is the "before" frame. Every later phase compares against it by eye and by
delta. If P0's frame is empty, say so — an empty baseline makes every improvement unmeasurable.**

---

## §9.2 · P1 · E1 FACE A — the five IP zones

**Purpose:** replace the sorted price ladder with the five named institutional roles. This is the
deepest fix in the build — the current render draws `PRIOR HIGH` / `ROUND 99.50` / `SWING HIGH`,
which is a different object from `IP RESISTANCE CEILING` / `EQUILIBRIUM ZONE` / `KEY SUPPORT BAND`.

**Precondition:** §4.5's calibration run has passed. **Without it, every ZFP on this chart is
theatre, and the phase is rejected before it starts regardless of how it looks.**

### P1.1 — derive the zone inputs

```bash
# tool: bash — the prior week's data is the ONLY input. No bar of the target week.
python3 scripts/p1_zones.py --fixture fixtures/bars/2026-07-06.json --week 2026-07-06 \
  > .trident/pv/proofs/P1/zone_inputs.json 2>/tmp/pv/P1.err
cat .trident/pv/proofs/P1/zone_inputs.json | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('zones:', len(d['zones']))
for z in d['zones']:
    print(f\"  {z['name']:<22} {z['bottom']:.5f}-{z['top']:.5f}  conf={z['confluence']}  degree={z['degree']}  zfp={z['zfp']}  receipt={z['receipt']}\")"
```

**The receipt is mandatory.** The prompt requires it verbatim: *"Show the base probability and
each modifier applied."* A zone with a ZFP and no receipt is rejected.

**FAIL → `NO-BARS`:** the fetch returned nothing for the pre-lock window. HALT, paste the response.
**FAIL → a zone with `zfp` populated and `receipt` empty:** the number was authored, not computed.

### P1.2 — write the zone module

```bash
# tool: edit — create src/ip_zones.pine (or the equivalent section of the indicator)
#   five roles, each with {top, bottom, degree, zfp}
#   top/bottom from the 9-pillar level clustering
#   degree from the confluence score via the Pillar 9 table
#   ZFP from the receipt-computed value; null -> renders "ZFP n/a"
```

```bash
# tool: bash — the anti-hardcode guard. A guard, never a verdict.
grep -nE '^\s*box\.new\([^)]*[0-9]+\.[0-9]{3,}' vision/plutus-vision.pine | tee /tmp/pv/P1/literal.txt
echo "LITERALS=$(wc -l < /tmp/pv/P1/literal.txt)"
#  EXPECTED: 0
#  FAIL -> a literal price in a draw call. It cannot change with the week, so it
#          cannot survive GATE B. Remove it, derive the value instead.
```

### P1.3 — render and look
```bash
# tool: bash
export DISPLAY=$SLOT
timeout 150 bun scripts/pv-load.mjs vision/plutus-vision.pine DXY 1H 2>&1 | tail -2
sleep 5
W=$(DISPLAY=$SLOT xdotool search --name "Plutus Vision" | head -1)
bash $S shot $W /tmp/pv/P1.png
```
```python
# tool: read
read(path="/tmp/pv/P1.png")
```

Read the five labels **off the frame, verbatim**, into `P1/labels.json`. **Do not read them from
the source.** A label appears in the source whether or not it rendered.

### P1.4 — GATE A · GOLDEN WEEK VISUAL

| # | criterion | how it is decided |
|---|---|---|
| 1 | exactly 5 bands visible | count off the opened frame |
| 2 | names are the IP vocabulary | each label contains `RESISTANCE CEILING` · `UPPER RESISTANCE` · `EQUILIBRIUM` · `MID-RANGE SUPPORT` · `KEY SUPPORT BAND` |
| 3 | **no ladder vocabulary survives** | zero occurrences of `PRIOR HIGH` · `ROUND ` · `SWING HIGH` in any label |
| 4 | the grammar is exact | every label matches `<name> \| <degree> \| ZFP n%` |
| 5 | degrees match scores | the degree printed for each zone is the one the Pillar 9 table gives for that zone's confluence score |
| 6 | ZFP has a receipt | every numeric ZFP's base and every modifier are printed and auditable |
| 7 | no forward extension | no band edge is past the target week's Friday close, read against the axis |

### P1.5 — GATE B · ANTI-HARDCODE

```bash
# tool: bash — the held-out set. The OPERATOR supplies the list (§11.3);
# this refuses fewer than ten, so Gate B can never run an incomplete set.
scripts/heldout_set.sh --from fixtures/bars/weeks   # or: scripts/heldout_set.sh <ten weeks>

# tool: bash — render TEN weeks the build never saw, with NO code change
for W in $(cat /tmp/pv/heldout_weeks.txt); do
  env PLUTUS_BARS_FIXTURE="$PWD/fixtures/bars/weeks/$W.json" <restart station>
  timeout 150 bun scripts/pv-load.mjs vision/plutus-vision.pine DXY 1H 2>&1 | tail -1
  bash $S shot $W "/tmp/pv/P1-$W.png"
done
```

| # | criterion | how |
|---|---|---|
| 1 | all ten render five zones | count off each opened frame |
| 2 | the zone PRICES differ across weeks | compare two frames; identical ranges = **REJECT** |
| 3 | the DEGREES differ where confluence differs | compare across weeks |
| 4 | no crash, no empty frame on any | a blank frame is a fail, not a skip |

**The held-out set is drawn by the operator AFTER the build freezes.** The builder never reads it
before scoring. That is the guarantee — a mechanism, not a promise.

### P1.6 — MUTATION and NEGATIVE

```
MUTATION   change one zone's base tier in the payload
           -> re-render -> THAT zone's ZFP label must change on screen
           -> restore. If the label does not move, the test is blind and the phase fails.

NEGATIVE   a payload carrying three zones
           -> exactly three bands render, never five
           -> the render does not pad to five.
```

### P1.7 — COMMIT
```
pv(P1): five IP zones, ZFP with receipts, labels off the pixels
gate_A: exit 0 (7 criteria)
gate_B: exit 0 (10 held-out weeks, geometry varies)
evidence: zone_inputs.json · labels.json · P1.png · P1-*.png
```

---

## §9.3 · P2 · E1 FACE B — supply / demand / liquidity

**Purpose:** render the SMC and liquidity layers on the same chart as the IP zones. Both faces must
be legible together — neither may occlude the other.

### P2.1 — wire the face-B primitives
```bash
# tool: bash — confirm the v1 baseline's face-B section is the source, and it is SEALED
sha256sum plutus-vision-v1.pine | cut -c1-8 | tee .trident/pv/proofs/P2/v1.sha
#  EXPECTED: 0d20e831
#  FAIL -> the sealed baseline drifted. HALT. Restore it before anything else.
```
```bash
# tool: edit — add OB boxes, FVG double-boxes, BOS/CHOCH, EQH/EQL, premium/discount,
#               and the LQZ rails with the mitigation counter
#   LQZ colours: #3E8A46 demand below price · #7F3613 supply above price
#   counter:     Unmitigated -> 1x -> 2x -> 3x
#   NEVER edit plutus-vision-v1.pine — it is the source, not the target.
```

### P2.2 — render and look
The same three commands as P1.3, writing `/tmp/pv/P2.png`. Then `read()` it.

### P2.3 — GATE A · GOLDEN WEEK VISUAL

| # | criterion | how |
|---|---|---|
| 1 | **P1's five IP bands are still there** | count off the frame — a regression here fails the phase |
| 2 | OB boxes visible and countable | named count off the pixels |
| 3 | LQZ rails visible and countable | named count off the pixels |
| 4 | LQZ colours correct | demand below price in `#3E8A46`, supply above in `#7F3613` |
| 5 | mitigation counters present | at least one rail shows its `1x` / `2x` / `3x` state |
| 6 | both faces legible together | no overlap that hides a band behind a box |
| 7 | the golden-week zones are identifiable | `1H supply 1.14460-1.14530` · `LQZ 1.1444-1.14395` · `1H MoM demand 1.14149-1.14000` · `nested LQZ 1.14110-1.14020` |

### P2.4 — GATE B · ANTI-HARDCODE

| # | criterion | how |
|---|---|---|
| 1 | both faces render on all ten held-out weeks | count off each opened frame |
| 2 | the OB count VARIES week to week | a constant count = the classifier is a constant |
| 3 | the LQZ count VARIES week to week | same |
| 4 | IP bands present on all ten | P1 not regressed anywhere |

### P2.5 — MUTATION and NEGATIVE
```
MUTATION   disable the face-B section -> the rail count goes to zero,
           the IP bands remain. If the bands disappear too, the two faces
           are coupled and the phase fails.

NEGATIVE   an empty fixture -> candles only, zero boxes, zero rails, zero bands.
```

### P2.6 — COMMIT
```
pv(P2): face B wired alongside face A, both legible, P1 not regressed
gate_A: exit 0 (7 criteria)   gate_B: exit 0 (10 weeks, counts vary)
```

---

## §9.4 · P3 · E2 PHASE ONE — the shape boxes

**Purpose:** classify the week's shapes and render one box per shape, chained, so the structure
is legible and verifiable. **This phase makes the structure visible; it is not the line.**

### P3.1 — classify the week

The classifier runs §5.2 in priority order, then §5.3 for transitions.

```bash
# tool: bash — run the classifier and print its reasoning, not just its answer
python3 scripts/e2_engine.py --week 2026-07-06 --pair DXY --explain \
  2>&1 | tee .trident/pv/proofs/P3/classify.txt
```

**The output must carry the per-shape reasoning:**

```
shape: BS    zone: <name>   zoneZFP: 62%   trend: UP
        reason: broke zone with ZFP > 45%, 15m confirmation, measured-move target
shape: R     zone: <name>   zoneZFP: 31%   trend: DOWN
        reason: stabilised at 20-40% for less than one session
```

**FAIL → a shape with no ZFP-conditioned reason:** the chain was transcribed, not derived.
HALT — that is the free-write the canon forbids.
**FAIL → `NO DATA` where a zone's pressure is unknown:** the engine is honest about it. **Do not
substitute a value.** The phase is blocked until the data arrives.
**FAIL → a token outside the ten (§5.1):** unclassifiable vocabulary. HALT.

### P3.2 — emit one box per shape
```bash
# tool: edit — the box layer
#   left  = the shape's start bar TIME   (a real bar timestamp from the data)
#   right = the shape's end bar TIME     (a real bar timestamp)
#   top / bottom = the two adjacent ladder rungs the shape traversed
#   label = the shape token
#   consecutive boxes SHARE an edge: box[i].right == box[i+1].left
#   ZERO diagonals — every edge is axis-aligned
```

```bash
# tool: bash — the anti-hardcode guard
grep -nE '^\s*box\.new\([^)]*[0-9]+\.[0-9]{3,}' vision/plutus-vision.pine | wc -l
#  EXPECTED: 0
```

### P3.3 — render and look
The same three commands, writing `/tmp/pv/P3.png`, then `read()` it. **Open the matching
winning-library folder image beside it** — `/home/leviathan/Pictures/WINNING_TRADE_LIBARARY/<transition>/`
— and compare box proportions and chaining directly.

### P3.4 — GATE A · GOLDEN WEEK VISUAL

| # | criterion | how |
|---|---|---|
| 1 | at least three boxes visible | count off the frame |
| 2 | every token is one of the ten | cross-check against §5.1 |
| 3 | the sequence is one of the twelve observed chains | cross-check against §5.5 |
| 4 | boxes chain — shared edges, no gaps, no overlaps beyond a border | read the edges off the frame |
| 5 | every box edge lies on a ladder rung | the vertical edges must touch a named band |
| 6 | boxes sit ON the candles, not in empty pane | price must pass through them |
| 7 | the render matches its winning-library reference | box proportions and chaining compared directly to the reference image, both opened |

### P3.5 — GATE B · ANTI-HARDCODE

| # | criterion | how |
|---|---|---|
| 1 | every held-out week produces boxes | count off each opened frame |
| 2 | the shape SEQUENCE differs week to week | compare across weeks; a constant sequence = **REJECT** |
| 3 | every chain is one of the twelve | cross-check |
| 4 | the box COUNT differs where the sequence differs | structural, not cosmetic |

### P3.6 — MUTATION and NEGATIVE
```
MUTATION   move one zone's ZFP across a §5.3 threshold
           -> the adjacent shape MUST change on screen
           -> restore. If it does not move, the classifier reads a constant.

NEGATIVE   a single-zone payload
           -> the classifier REFUSES and emits NO chain
           -> never a partial or invented chain.
```

### P3.7 — COMMIT
```
pv(P3): shape chain rendered as chained boxes, classified from ZFP
gate_A: exit 0 (7 criteria)   gate_B: exit 0 (sequence varies across 10 weeks)
```

---

## §9.5 · P4 · E2 PHASE TWO — the boxes become one line

**Purpose:** collapse the P3 boxes into a single polyline that traces where price actually goes.
The vertices are the box corners by construction, so the line cannot float.

### P4.1 — collapse the boxes
```bash
# tool: edit — the line layer
#   for each box i:  vertex[i] = (entry time, entry rung)
#                    vertex[i+1] = (exit time, exit rung)
#   join vertices in time order into ONE polyline
#   the vertices ARE the box corners — no new points may be introduced
```

### P4.2 — render and look
The same three commands, writing `/tmp/pv/P4.png`, then `read()` it.

### P4.3 — measure the line, do not eyeball it
```bash
# tool: bash — the column-coincidence measurement
python3 scripts/p4_ratio.py /tmp/pv/P4.png --json > .trident/pv/proofs/P4/ratio.json
python3 scripts/p4_ratio.py /tmp/pv/P4.png | head -1
#  EXIT 0 = ratio >= threshold (the line traces price)
#  EXIT 1 = it does not        EXIT 2 = INCONCLUSIVE (no line / no candles)
#  instrument validated on three controls: hug 1.0000 PASS · float 0.0000 FAIL
#  · two-vertex 0.0000 FAIL.
```

**This measurement is the acceptance, not the impression.** 90% column coincidence is what
*"the line traces the path price takes"* means numerically.

### P4.4 — GATE A · GOLDEN WEEK VISUAL

| # | criterion | how |
|---|---|---|
| 1 | exactly ONE line | count off the frame |
| 2 | its turn count equals the P3 box count | cross-check |
| 3 | every vertex sits on a box edge | read off the frame |
| 4 | the line stays inside the ladder for its whole length | read off the frame |
| 5 | **ratio >= 0.900** | the P4.3 measurement, printed |

### P4.5 — GATE B · ANTI-HARDCODE

| # | criterion | how |
|---|---|---|
| 1 | one line on every held-out week | count off each opened frame |
| 2 | the line's SHAPE differs week to week | compare across weeks |
| 3 | **ratio >= 0.900 on all ten** | the P4.3 measurement per week |

### P4.6 — MUTATION and NEGATIVE
```
MUTATION   move one shape's rung -> that vertex MUST move on screen -> restore
NEGATIVE   disable E2 -> zero lines, the E1 bands remain untouched
```

### P4.7 — COMMIT
```
pv(P4): E2 collapsed to one traced line, ratio >= 0.900 measured
gate_A: exit 0 (5 criteria)   gate_B: exit 0 (10 weeks, ratio holds)
```

---

## §9.6 · P5 · E3 — the trade boxes

**Purpose:** derive the trade setups from the P4 chain and render them as boxes. Entry at a zone
edge, never at a shape vertex.

### P5.1 — derive the setups
```bash
# tool: bash — derive from the chain, with the RRR filter applied
python3 scripts/e3_trades.py --week 2026-07-06 --pair DXY --rrr-floor 3.0 \
  2>&1 | tee .trident/pv/proofs/P5/setups.json
cat .trident/pv/proofs/P5/setups.json | python3 -c "
import json,sys
for s in json.load(sys.stdin)['setups']:
    print(f\"  #{s['id']} {s['dir']:<5} entry={s['entry']:.5f} SL={s['sl']:.5f} TP={s['tp']:.5f} RRR={s['rrr']:.2f} {s['category']} {s['day']}\")"
```

**The golden week has 8 EU setups.** Their exact parameters are in §6.3 of the master spec and
must reproduce.

**FAIL → a setup with `rrr` below 3.0:** `MIN_RRR_FLOOR` rejects it. The derivation is wrong.
**FAIL → an entry with no 1H/30m/15m zone edge behind it:** a 4H entry is the documented forensic
failure — the most frequent source of SLs at structural levels that held.
**FAIL → a setup with no DAY label:** the spec requires it and the operator uses it.

### P5.2 — render the boxes
```bash
# tool: edit — the trade layer
#   box: left = entry time · right = TP time · top = TP price · bottom = SL price
#   teal = long · red = short
#   boxes OVERLAP in time — they are parallel trades, not a chain
```

### P5.3 — render and look
The same three commands, writing `/tmp/pv/P5.png`, then `read()` it.

### P5.4 — GATE A · GOLDEN WEEK VISUAL

| # | criterion | how |
|---|---|---|
| 1 | eight boxes visible | count off the frame |
| 2 | the eight reproduce §6.3 | direction, entry, SL, TP, RRR, category, day all match |
| 3 | the hit test is scored | for each box: did price reach the TP edge before the SL edge? N/8 |
| 4 | boxes overlap in time | setup 1 and setup 2 are both live on Monday |
| 5 | each box's entry sits on a zone edge | read against P1/P2's bands |
| 6 | every box carries a DAY label | read off the frame |
| 7 | every RRR shown is >= 3.0 | read off the frame |

### P5.5 — GATE B · ANTI-HARDCODE

| # | criterion | how |
|---|---|---|
| 1 | every held-out week produces setups | count off each opened frame |
| 2 | the setup COUNT varies | a constant count = the derivation is a constant |
| 3 | the DIRECTION mix varies | a constant long/short split = hardcoded |
| 4 | the hit-test score is computed per week | reported, not assumed |

### P5.6 — MUTATION and NEGATIVE
```
MUTATION   invert one setup's SL and TP -> the hit-test result MUST invert -> restore
NEGATIVE   a week with no valid setup -> ZERO boxes rendered.
           Never a forced setup. A box drawn to satisfy the count is fabricated.
```

### P5.7 — COMMIT
```
pv(P5): eight trade boxes, entry at zone edges, RRR >= 3.0, hit-tested
gate_A: exit 0 (7 criteria)   gate_B: exit 0 (10 weeks, count and direction vary)
```

---

## §9.7 · P6 · FINAL ACCEPTANCE

**Purpose:** the whole system, all three engines together, judged twice — against the golden week
on screen, and against ten weeks the builder never saw.

### P6.1 — three frames, one turn
```python
# tool: read — ALL THREE in the same turn
read(path="/tmp/pv/P6.png")
read(path="/home/leviathan/Pictures/Jul_6-10_DXY_Gold_Standard/Screenshot from 2026-07-28 02-51-16.png")
read(path="/home/leviathan/Pictures/Screenshot from 2026-10-14 07-51-15.png")
```

**Every delta against each reference is named.** A delta silently ignored is a delta shipped.

### P6.2 — GATE A · GOLDEN WEEK VISUAL

| # | criterion | how |
|---|---|---|
| 1 | E1's five IP zones present and labelled per grammar | read off the frame |
| 2 | E1 face B present | OB and LQZ counts off the frame |
| 3 | E2's one line present, ratio >= 0.900 | the P4.3 measurement re-run |
| 4 | E3's eight trade boxes present | count off the frame |
| 5 | every delta against the E1 reference is named and closed | three frames opened, deltas listed |
| 6 | every delta against the E2/E3 reference is named and closed | three frames opened, deltas listed |

### P6.3 — GATE B · THE ACCEPTANCE
**Ten held-out weeks, drawn by the operator after the build freezes. The builder never reads them
before scoring.**

```bash
# tool: bash — no code change between the golden week and the held-out set
for W in $(cat /tmp/pv/heldout_weeks.txt); do
  <set fixture> ; <load> ; <shot> ; <enumerate>
done
```

| # | criterion | how |
|---|---|---|
| 1 | all ten render with no crash and no empty frame | a blank frame is a **fail**, not a skip |
| 2 | E1 zones react — did price reverse, reject, or hold? | N/M per week |
| 3 | E2's line follows price | the P4.3 ratio per week |
| 4 | E3's setups hit TP before SL | N/M per week |
| 5 | the geometry differs across all ten | the structural discriminator |

**The verdict:**

```
>= 90% on the golden week AND >= 90% on held-out weeks   -> PASS
>= 90% on golden week,  < 90% on held-out                -> HARDCODED, REJECT
<  90% on the golden week                                 -> not finished
```

**A build that passes the golden week and fails the held-out set is the theatrical class the
operator has been fighting for four months.** It is rejected at this gate, at every phase, and at
the end. No exceptions, no "but the screenshots look right".

### P6.4 — COMMIT and record
```
pv(P6): full system accepted — 8+ held-out weeks, >= 90%, geometry varies
gate_A: exit 0 (6 criteria)
gate_B: exit 0 (10 weeks, every metric reported)
```

---

## §9.8 · THE PER-PHASE SUMMARY

| phase | object | GATE A counts | GATE B discriminator | mutation |
|---|---|---|---|---|
| P0 | baseline frame | 4 | — | — |
| P1 | 5 IP zones | 7 | prices and degrees vary | ZFP tier change moves the label |
| P2 | face B on top | 7 | OB/LQZ counts vary | face B off → rails zero, bands stay |
| P3 | shape boxes | 7 | sequence varies | ZFP crosses a threshold → shape changes |
| P4 | the line | 5 | ratio holds on all ten | rung moves → vertex moves |
| P5 | trade boxes | 7 | count and direction vary | SL/TP invert → hit test inverts |
| P6 | full acceptance | 6 | all metrics, 10 weeks | — |

**43 Gate-A criteria. 6 anti-hardcode discriminators. 5 mutations. Every phase closes twice.**

# §10 · THE TEST FRAMEWORK

**Authority:** `skill://runtime-testing` (the five-domain ladder), `skill://vision-hotseat` (the
driving procedure), `skill://red-team-slop-audit` (the 22 slop classes), `skill://black-hat-audit-wave`
(N disjoint vectors + the verification layer).

**Superseded:** every gate written before 2026-10-18 in `gates/e1/gates/`. Those 15 scripts assert
text-file properties and none of them observes the running system. Recorded in
`THEATRICALITY_LOG.md T-16` and `FAILURE_LOG.md F-147`.

---

## §10.1 · THE TWO QUESTIONS — every step answers one, and only one

```
Q1  IS THE RUNNING SYSTEM DOING THE THING?         -> a VERDICT
    answered by: driving it and looking at the result
    the evidence: a frame opened THIS turn, or a value the code RETURNED

Q2  ARE WE CLOSER TO A RUNNING SYSTEM THAN BEFORE? -> a PROGRESS CHECK
    answered by: a comparison against the previous observed state
    the evidence: the prior frame, the prior returned value, the prior live response
```

**A step that answers neither is bookkeeping.** Bookkeeping is allowed — it is not a test, and it
does not close a phase.

## §10.2 · THE TWO TIERS

```
TIER 1 · PRE-FLIGHT GUARD             TIER 2 · VERDICT
  grep · sha256sum · wc -l · file      D1 SCRIPT     execute it; observe the RETURN value
  existence · diff · a JSON the        D5 HOT SEAT   drive it; LOOK at the pixels
  agent authored                       D2 LIVE       the real dependency answered
                                       D3 CONTAINER  clean environment
  may HALT a step                      D4 AUDIT      an independent reader
  may NEVER pass one
```

**THE LAW:** a step whose only evidence is Tier 1 reports **`UNVERIFIED`**, never `PASS`.

**THE SUBJECT TEST** — run before trusting any check:
> *what object does this check look at, and is that object the thing that runs?*

A gate can fail correctly on a property that does not matter. The measured history is instructive:
15 gate scripts were proven to **discriminate** — 15/15 refused a corrupted input — and **every
one of them still observed a text file.** Discrimination proved they bite; it proved nothing about
what they bite.

## §10.3 · THE EVIDENCE HIERARCHY

```
1  PIXELS OPENED THIS TURN       the rendered frame, described in its own terms
2  A RETURNED VALUE              the code's output, produced by executing it
3  A LIVE DEPENDENCY'S RESPONSE  the real service answering
────────── the line below is not evidence, only a guard ──────────
4  TEXT PROPERTIES               grep · sha · wc · exists · diff · an authored JSON
```

## §10.4 · THE FIVE RULES

```
R1  NO PASS FROM A TEXT PROPERTY.
    Guards halt; they never pass. A turn whose only evidence is a guard reports
    UNVERIFIED.

R2  NO PASS FROM A FILE I AUTHORED.
    The artifact must come from a different process than the one being verified:
    the renderer's pixels, a returned value, or a live response. Never a JSON
    the same agent typed. Measured failure: four prior gates passed on
    `"opened": true` in a file the agent wrote — indistinguishable from typing it.

R3  EVERY TEST CARRIES A MUTATION.
    Break it on purpose -> the verdict MUST flip -> restore.
    A test never seen red is DELETED, not fixed. It has no discriminating power
    that has ever been demonstrated.

R4  EVERY TEST CARRIES A NEGATIVE CONTROL.
    A case that must FAIL. If it passes, the test is blind and the phase does not close.

R5  THE VERDICT IS PIXELS I OPENED THIS TURN.
    Not last turn, not a count, not a compile line, not a drawing count.
    The frame, opened, described in its own terms.
```

## §10.5 · THE THREE RENDER GUARDS — accompany every LOOK

```
chart-region control   crop the CHART REGION ONLY, not the whole frame
                       chrome painted is not chart painted.
                       Measured failure: a whole-frame non-black test passed while
                       the chart body was empty and only the toolbar had pixels.

bars_in_week > 0      0 bars means the fixture has no data for this week.
                       It is an off-screen render, not a draw defect.
                       Without this, an empty chart is misclassified as SCRIPT
                       and a fix goes to the wrong file.

no source-leak         a label that appears verbatim in the .pine source was read
                       from the code, not from the pixels. If a label string is in
                       the source, its presence in the report proves nothing.
```

## §10.6 · THE CANONICAL THREE TESTS — the actual tests this build runs

### TEST A · DOES IT RENDER, AND IS IT THE RIGHT ARTIFACT

```
STIMULUS      the real indicator file + the golden-week fixture + a real load
DRIVE         pv-load.mjs, then the window capture, then read() in the same turn
CRITERION     candles present AND >= 1 named object of this phase's type present
              AND the object's labels read the vocabulary this phase requires
NEGATIVE      an empty fixture -> candles present, ZERO of this phase's objects
MUTATION      disable the phase's draw call -> its object count goes to zero -> restore
FAIL IF       the frame is blank, or the vocabulary is wrong for this phase
              (e.g. ladder names where IP roles are required)
```
Runs at: P0, P1, P2, P3, P4, P5, P6.

### TEST B · ARE THE OBJECTS AT THE RIGHT PLACE

```
STIMULUS      the same render
DRIVE         the same render loop
CRITERION     phase-specific geometry read off the pixels:
                P1  5 bands, labels match the grammar, degrees match their scores,
                    no band past Friday close
                P2  P1's bands still present, LQZ colours correct, counters visible
                P3  box edges sit on ladder rungs, boxes chain, price passes through
                P4  vertices sit on box edges, ratio >= 0.900 vs candle columns
                P5  entries sit on zone edges, RRR >= 3.0, DAY labels present
NEGATIVE      a payload with N-1 objects -> exactly N-1 render, no padding to N
MUTATION      move one input by a known amount -> THAT rendered position moves
FAIL IF       the geometry is right only for the golden week (see TEST C)
```
Runs at: P1, P2, P3, P4, P5.

### TEST C · ★ THE MONEY TEST — did price react, on a week never seen

```
STIMULUS      a held-out week drawn by the operator AFTER the build froze
DRIVE         the same render loop, NO code change since the golden-week pass
CRITERION     per rendered zone: did price reverse, reject, or hold at it?
                score  N zones / M reacted
              per E2 line: ratio >= 0.900 (P4.3's measurement)
              per E3 box: did price reach TP before SL?  wins / resolved
NEGATIVE      a level price ignored must NOT count as a reaction
MUTATION      not mutable — this measures reality, not the code
FAIL IF       geometry identical across two weeks, OR the score is far below
              the golden week's score
```
Runs at: P1, P2, P3, P4, P5, P6 — **once per phase, as GATE B.**

**TEST C is not optional at any phase.** It is the test that distinguishes a working indicator
from a screenshot machine, and it is the one prior builds never ran.

## §10.7 · THE ANTI-THEATRE BAN LIST

```
x a drawing COUNT as proof of a render      x a compile line as proof it works
x a green suite as proof of behavior x my own JSON as proof of anything
x a screenshot opened in an earlier turn    x a pass token typed by the agent
x "it renders" without the frame in this turn's trace
x a test whose pass condition encodes a defect
x a gate whose subject is a file the code under test wrote
```

## §10.8 · WHAT THE OLD GATES BECOME

| old gate | its fate |
|---|---|
| `gate_0` baseline, `gate_1` read coverage, `gate_5` integrity | **pre-flight guards** — may halt, never pass |
| `gate_2` callability, `gate_3` fabrication, `gate_4` window, `gate_6` build, `gate_7` deploy, `gate_12` final | **pre-flight guards** |
| `gate_7_0`, `gate_7_1`, `gate_9`, `gate_10`, `gate_11` | **pre-flight guards** — all read files the agent authored |
| `gate_8`'s PIL chart-region control | **RETAINED and strengthened** — the only real measurement in the set |

**15 gates → 3 tests.** Every one of the three is D5, pixel-based, and carries a negative control
and a mutation.

# §11 · ANTI-HARDCODE — THE STRUCTURAL GUARANTEE

**The failure this exists to kill, verbatim:**

> *"they just hard-coded a bunch of trash and made the screenshots look accurate. Then when I
> test this on 15 other weeks, everything breaks because it's hard coded fucking trash and it's
> not actually built correctly."*

> *"if it passes for this one week but fails for everything else it's all obviously not aligned
> and not allowed and is theatrical."*

## §11.1 · THE STRUCTURAL RULE

```
EVERY rendered object is  f(bars, weekStart)  and NOTHING ELSE.

  zone top/bottom    = f(9-pillar level clustering)          derived
  zone confluence    = f(the 6 dimensions + extreme bonus)   derived
  zone degree        = f(confluence) via the Pillar 9 table   derived
  zone ZFP           = f(base + modifiers) with a receipt     derived
  shape token        = f(candle structure + zone ZFP)          derived
  box edges          = f(shape start/end bar times)            derived
  trade entry / SL / TP = f(zone edges) + f(AIR levels)        derived
  trend              = f(prior-week closes)                   derived
```

**The only literals permitted in the indicator are non-price constants** — colours, line widths,
max counts, the Monday 07:00 hour, the `0.12` collapse tolerance.

## §11.2 · THE ONE PERMITTED TEXT CHECK — a guard, never a verdict

```bash
grep -nE '^\s*(box|line|label)\.new\([^)]*[0-9]+\.[0-9]{3,}' vision/plutus-vision.pine
-> must return 0
```

**What it catches:** a `box.new(..., 99.16, ...)` written by hand. A literal price cannot change
with the week, so if it survives the grep it will fail Gate B — and Gate B failing is a rejected
phase, not a fixable warning.

**What it does NOT catch, and must not be trusted for:**

```
x a literal pushed into an array before the draw call
x a literal computed from another literal
x a zone derived from a single week's data in a way that only works for that week
```

**That is why this check is Tier 1.** It halts; Gate B decides.

## §11.3 · THE HELD-OUT SET — a mechanism, not a promise

```
BUILD TIME                    FREEZE                        SCORING TIME
the build sees:               the build sees NOTHING:       the operator runs:
  the golden week Jul 6-10      w1 w2 w3 ... w10             no code change
  the fitted weeks              drawn AFTER the freeze       between golden
  (cv-* fixtures are            never printed to me          week and the set
   visible to me)               before scoring
       |                            |                              |
       +----------------------------+------------------------------+
                                                 |
                                                 v
                                     score BOTH, with the same code
```

**Three rules make it uncheatable:**

```
1  THE SET IS DRAWN BY THE OPERATOR AFTER THE FREEZE.
   I never see the weeks before scoring. A held-out week I chose is not held out.

2  NO CODE CHANGE BETWEEN THE GOLDEN WEEK AND THE SET.
   The set is run with the exact binary that passed the golden week.

3  THE DISCRIMINATOR IS THE GAP.
     geometry on the golden week HIGH  +  geometry on the held-out set LOW -> HARDCODED
     both HIGH                                                        -> real derivation
     both LOW                                                           -> broken, fix
```

## §11.4 · THE DISCRIMINATORS PER PHASE — what makes each object *structurally* checkable

The point of the structural guarantee is that **each phase's object cannot be hardcoded without
tripping a specific, named check:**

| phase | the object | why a literal cannot survive |
|---|---|---|
| P1 | five IP zones | a literal zone table cannot produce different zone PRICES on two different weeks — Gate B criterion 2 compares ranges |
| P1 | the degree | a literal degree cannot track a confluence score that varies — Gate B criterion 3 compares degrees |
| P2 | OB / LQZ counts | a fixed count is the tell — Gate B requires the counts to **vary** |
| P3 | the shape sequence | a hardcoded chain is identical every week — Gate B requires the sequence to **vary** |
| P4 | the line | a hardcoded line has the same shape every week; the `ratio >= 0.900` measurement applies to **that week's** candles, so a line fitted to the golden week scores near 0 on another |
| P5 | the trade boxes | a fixed count and a fixed long/short split are the tells — Gate B requires both to **vary** |
| P6 | all of it | N/M reaction, ratio, hit-test — all computed against **that week's** price action |

**The strongest discriminator is P4's ratio.** A line hardcoded to the golden week's path scores
`>= 0.900` on that week and near `0` on any other, because column coincidence is computed against
the actual candles. It is the one metric that cannot be satisfied by a constant.

## §11.5 · THE POST-APPROVAL SPLIT TEST — from the operator, as an acceptance event

> *"as soon as the golden week is approved within the exact same minute I should be able to
> split test on 10 other weeks and they are all equally as accurate to the real price action of
> those trading weeks because of how this is coded."*

**Read that as a specification of the moment of approval.** The golden week is not approved and
then tested later — approval **is** the split test:

```
1  the golden week passes Gate A
2  WITHIN THE SAME SESSION, run Gate B on the ten held-out weeks
3  only if both hold is the phase approved
4  a phase approved this way can be split-tested again at any later time,
   on weeks drawn at that later time, with no code change
```

**A phase approved without step 2 is not approved.** It is merely un-rejected.

## §11.6 · WHAT ANTI-HARDCODE DOES NOT CATCH

Stated plainly, because overclaiming this gate would make it theater:

```
x  a build that works on ALL weeks but is the wrong model
     (correct derivation of the wrong thing — Gate A's visual criteria catch this)
x  a build whose geometry varies but whose trades never win
     (TEST C's hit-test catches this — variation alone is not accuracy)
x  a build that fails for a reason other than hardcoding
     (the debug loop classifies it; it is not Gate B's failure)
```

**Gate B proves the code derives. Gate A proves it derives the right thing. Both must hold.**

# §12 · THE MASTER CONTEXT GRAPH

## §12.1 · What the graph is

A typed knowledge store over this project's canon, so a session queries a fact instead of
re-reading 4,216 lines. **The canon documents are the law; the cards are the atomic facts;
this file is the operating manual.**

```
MASTER_CONTEXT/
  CANON.md                          the canon index
  EXECUTION_CONTEXT.md              the routing node — read before anything else
  NON-NEGOTIABLE-RELOAD/            the four reference documents
  cards/            34              typed atomic facts, one claim each
  type/             10              type definitions
  sources/          12              source hubs
  laws/ mechanisms/ rulings/ gates/ lessons/ profiles/ state/ terms/
  knowledge-graph/                  the graph artifacts
  .omp/graph-intelligence/layers/semantica/kg.json   the entity store
```

## §12.2 · How to query it — run this before reading any document

```bash
# 1  the graph's shape — what entity types exist and how many
python3 -c "
import json
from collections import Counter
d = json.load(open('MASTER_CONTEXT/.omp/graph-intelligence/layers/semantica/kg.json'))
print(Counter(e.get('type','?') for e in d['entities']))"
#  EXPECTED, measured 2026-10-02: {'doc': 1277, 'law': 559}
#  If law == 0 the graph is a silent no-op by design: the reflex reads laws.
```

```bash
# 2  locate the card for a question
ls cards/ | grep -iE '<topic>|<law name>'
cat cards/<CARD>.md
#  A card carries: tldr · statement (verbatim) · tier · source anchor
```

```bash
# 3  locate the source hub for an area
ls sources/ ; cat sources/<hub>.md
```

```bash
# 4  full-text across the canon when the card set does not answer
grep -rn -i '<term>' MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/ | head -20
```

**Order matters.** Card first (a typed fact), then hub (the area), then document (the law).
Reading the 4,216-line toolset first is how a session re-derives a fact that already has a card.

## §12.3 · THE CARD INDEX — all 34, grouped by what they answer

### Engine contracts
```
ENGF-E1-IP              what face A renders — the 5 IP roles, the label grammar
ENGF-E1-SD-LIQ          what face B renders — OB/FVG/BOS/LQZ rails + mitigation
ENGF-E2-SHAPE-CHAIN     what E2 renders — the chain, two-phase, derived from E1
ENGF-E3-TRADES          what E3 renders — entry/SL/TP boxes derived from E2
```

### Zone definitions
```
ZONEF-GRAMMAR           the mandatory label form  <name> | <degree> | ZFP n%
ZONEF-AUTHORITATIVE-SET the Apr 20-24 DXY reference set: 5 zones with exact prices
ZONEF-FACE-B-FAMILIES   the SMC + liquidity families and their anchor lists
```

### Shape definitions
```
SHAPEF-CLASSIF          the §6.2 decision matrix — ZFP-thresholded, priority ordered
SHAPEF-CHAIN-PRIMACY    the primary chain SS->BS->R->WL and the alternative
SHAPEF-TRANSITION-EDGES how one shape is detected as ending and the next beginning
```

### Laws (tier: BINDING — never renegotiated)
```
LAWF-MONDAY-LONDON-ANCHOR   the anchor and its timezone
LAWF-ONE-WEEK-LOOKBACK      left extension only, no forward
LAWF-NO-ZONE-FABRICATION    no invented levels, no width-derived ZFP
LAWF-ZFP-IS-FAILURE-PROBABILITY  ZFP = Appendix B, never geometry
LAWF-E1-TWO-SIDES           E1 has both faces or E1 is incomplete
LAWF-E2-DERIVED-FROM-E1     the chain comes from the zones, never free-written
LAWF-E3-VERTEX-ENTRY        trades enter at zone edges from the chain
LAWF-REPLAY-IS-THE-TEST     tier IMMUTABLE — 10 random weeks, 10x, ~90%
LAWF-REPAID-DIRECT-READ     the receipt discipline
```

### Directives (tier: TERMINATION_GRADE — stopping the build)
```
DIRF-PIXELS-ONLY         the verdict is always a rendered frame
DIRF-PROCESS-INVARIANT   what may never be violated at any phase
DIRF-TARGET-WEEK         which week is the acceptance
DIRF-E3-DEFERRED         E3 is phase two; no E3 before E1+E2 pass
```

### Specification and reference
```
SPECF-REPLAY-ACCEPTANCE  the acceptance procedure and its explicitly rejected forms
DOCF-GOLDEN-WEEK         the golden-week ground truth
```

## §12.4 · THE GRAPH EDGES — which fact depends on which

```
                    [MASTER_SPEC]  this file
                   /      |      \          \
             §3 E1     §4 ZFP    §5 E2     §6 E3
               |         |         |           |
      ENGF-E1-*     Appendix B  ENGF-E2-    ENGF-E3-
      ZONEF-*       ZONEF-GRAMMAR  SHAPE-CHAIN  TRADES
      LAWF-E1-*     LAWF-ZFP-*   SHAPEF-*    LAWF-E3-*
               \        |        /            |
                THE DERIVATION CHAIN, one direction only
                          |
                    [THE GATES]
              GATE A  golden week visual
              GATE B  anti-hardcode, 10 weeks
              applied INSIDE every phase, not after them
```

**The dependency direction is the whole build.** E1 is the only source of prices. E2 reads E1's
confluence and ZFP. E3 reads E2's chain and E1's zone edges. A defect in E1 is invisible from E3
and corrupts it completely — which is why P1 has seven criteria and runs before anything else.

## §12.5 · WHEN THE GRAPH DISAGREES WITH A DOCUMENT

```
1  card says X, document says Y  ->  check both tiers.
                                   tier BINDING or TERMINATION_GRADE beats prose.
                                   Record the conflict; never silently pick.
2  card has no source anchor     ->  the card is PROPOSED, not a fact.
3  document not in §2's authority order -> it is a candidate, not authority.
4  the LSP reports law == 0      ->  the graph is inert; use grep as fallback,
                                   and say so in the report rather than claiming a query.
```

## §12.6 · WHY THIS SECTION EXISTS

Three failure modes this graph prevents, each of which actually happened in this session:

```
a  re-deriving a shape taxonomy that already had a card
   -> I wrote "6 shapes" from the TTE doc when §6.1 defined 10

b  treating a prior agent's "built and works" as foundation
   -> §8.2 lists them as candidates because L1 says so

c  opening a superseded spec and continuing on it
   -> §2 records every supersession; EXECUTION_CONTEXT.md §E lists them
      so they are never opened as authority again
```

---

# §13 · OPEN DECISIONS — THE OPERATOR'S RULINGS REQUIRED

**Nothing in P1 begins until 1–4 are ruled.** E2 classifies by ZFP threshold and E3 trades off the
chain, so all seven phases inherit from these.

| # | fork | why it blocks | recommendation | if not ruled |
|---|---|---|---|---|
| 1 | **ZFP point selection** | Appendix B gives ranges; no rule picks a number | midpoint — reproduces the Pillar 9 buckets without shifting any zone | ZFP cannot be computed at all |
| 2 | **ZFP momentum constant** | `0.5 × ATR20` is the only figure in this spec not sourced from the prompt | accept it, or supply another number | the momentum gate is a judgment call → nondeterministic output |
| 3 | **ZFP clamp** | Appendix B has none; six modifiers sum to 125% | `clamp(base + Σ, 0, 99)` | the formula emits >100% and every §5.2 threshold breaks |
| 4 | **calibration tolerance** | a tolerance chosen after seeing the data is not a tolerance | ±15 pp per bucket, `n ≥ 8` reportable | the calibration run cannot conclude PASS or FAIL |
| 5 | **golden-week instrument** | the operator feedback is EU/GU; the fixtures are DXY | confirm which is the render target for P1–P6 | the acceptance frames may be the wrong instrument |
| 6 | **E2 box vertical span** | rung-to-rung vs shape-high-to-shape-low | rung-to-rung — keeps every edge on the ladder and every box traceable to E1 | P3's Gate A criterion 5 has no defined subject |
| 7 | **held-out week set** | the set must be drawn by the operator after the freeze | you generate ten; I never read them before scoring | GATE B has no input |
| 8 | **RRR floor vs the 8 recorded setups** | golden-week row 4 shows `RRR 2.00`, below `MIN_RRR_FLOOR = 3.0` | either the floor binds only to derived setups (expected count 8) or it binds to all (expected count 7) | P5.4's Gate A count 1 is undefined |

### Why #8 matters more than it looks

It is the only decision where **the acceptance itself is ambiguous.** The operator's recorded
trades include one below the documented floor. Either the floor is a floor and the record has a
row that a correct implementation must refuse — or the floor applies to what the engine derives and
the record is the ground truth as-is. The two readings give P5 a different pass count: 8 or 7.
**A gate whose pass count is undecided cannot fail meaningfully.**

### Why #4 matters more than it looks

Calibration without a pre-declared tolerance produces a number that always passes. Observed within
±30 points would "look fine" after the fact. The tolerance must exist before the run or the run
proves nothing — that is the same defect as a test written after the bug is known.

### The sequence these rulings unlock

```
1-4 ruled  ->  §4.7 calibration run can execute against the 84 fixture weeks
            ->  P1 opens
 5 ruled  ->  the golden-week instrument is fixed
 6 ruled  ->  P3's box geometry is defined
 7 ruled  ->  every GATE B has its input
 8 ruled  ->  P5's Gate A pass count is defined
```

# §14 · SUMMARY, RESUME GUIDE AND CONTINUATION

## §14.1 · The one paragraph

E1 draws the walls — five IP zones, each with a confluence score, a Pillar-9 degree, and an
Appendix-B failure probability carrying its receipt, plus supply/demand and liquidity on the same
chart. E2 reads those zones' ZFPs through a priority matrix to classify the week's shapes,
sequences them with ZFP-conditioned transitions, and renders the chain — first as chained boxes so
the structure is legible, then as one line that traces where price actually went. E3 places trades
at zone edges along that chain, SL beyond the opposite edge, RRR at or above 3.0. Every phase is
judged twice, inside itself: against the golden week on screen, and against ten weeks the builder
never saw. **A build that works only on the golden week is hardcoded and is rejected, however good
the screenshot looks.**

## §14.2 · RESUME GUIDE — reading this after a context break

**The order, and why it is this order:**

```
1  MASTER_CONTEXT/EXECUTION_CONTEXT.md
     173 lines · tells you what is authoritative, what is superseded,
     what is proved, what is absent. Read it before any document.

2  this file §0 — the ten laws
     ten minutes, and it prevents every failure mode this build has already had.

3  this file §13 — the open decisions
     eight rulings block everything. If they are decided, note it and go to §9.
     if they are not, you are blocked regardless of what else you know.

4  this file §9 — the workflow
     the phase you are in, its ACTION, its GATE A, its GATE B.

5  this file §8 — current state
     what exists, what is a candidate, what is absent. Do not trust memory.
```

**If you only read one thing:** §13, then §9.8 (the per-phase summary table).

## §14.3 · WHAT YOU MUST NOT DO ON RESUMING

```
x  open spec/EW_A_BACKEND_SPEC.md · EW_B1 · EW_B2 as authority — superseded
x  treat scripts/e1_zfp.py · e2_engine.py · e1_fetch.py as foundations — candidates (L1)
x  run a grep and report it as a test (L2)
x  skip GATE B because Gate A looked good (L6)
x  choose a calibration tolerance after seeing the data
x  start P1 before §13 items 1-4 are ruled
x  render the golden week, approve, and defer the held-out set (§11.5)
```

## §14.4 · THE CONTINUATION CONTRACT — what a resumed session hands to the next one

Every session that stops must leave:

```
1  the commit sha of the last phase that passed BOTH gates
2  the two gate results as text in that commit's message
3  the opened frames under .trident/pv/proofs/<phase>/ — the PNGs, not descriptions
4  any §13 ruling that arrived, verbatim
5  the honest residue: what was attempted and failed, what is still open,
   what evidence could not be produced and why
```

**A continuation that cannot produce the opened frames has not done the work.** The frames are the
evidence; a description of a frame is a claim.

## §14.5 · THE ORDER OF OPERATIONS, STARTING FROM HERE

```
BLOCKED NOW          §13 items 1-4  ->  the four ZFP rulings
THEN                 §4.7 the calibration run against 84 fixture weeks
                       pass -> P1 opens     fail -> no percentage may be drawn
THEN                 P1 -> P2 -> P3 -> P4 -> P5 -> P6
                       each closes on Gate A AND Gate B
THEN                 §13 items 5-8 resolved as their phases reach them
AT THE END           the ten held-out weeks, in the same session as the golden
                       week's approval, with no code change between them
```

**Nothing before §13 is buildable.** The spec layer completes at this file; the build layer
begins only when the four rulings exist.

---

# §15 · ZERO-TRUST AUDIT OF THIS SPEC

**A spec is an artifact like any other.** This is this document's own audit, so a reader knows
what it can and cannot be trusted to answer.

## §15.1 · What is measured, and how

| claim | evidence | status |
|---|---|---|
| the rig is up on `:9741`/`:9851`/`:9222`/`:9230` | `ss -ltn` + `xdotool search --name "Plutus Vision" \| wc -l` = 1 | **MEASURED** |
| `vision/plutus-vision.pine` exists at 231 L / 9,715 B | `wc -lc` | **MEASURED** |
| 24 fixtures · 84 weeks · 41,546 bars | fixture census script | **MEASURED** |
| the three engine candidates exist at 270/783/784 L | `wc -l` | **MEASURED** (existence only) |
| `e1_zfp.py` matches Appendix B | read against `APPENDIX B.1 + B.2` | **VERIFIED BY READING**, not by running |
| the golden-week 8 setups | `Golden_Operator_Trade_Feedback_EU_GU.md` | **QUOTED**, operator-authored |
| the indicator renders | prior run's `counts` + one opened frame | **STALE** — file rewritten after |
| the render counts `boxes 13 · labels 15 · lines 1` | one prior capture | **STALE** — do not reuse |

## §15.2 · What is claimed but not verified

```
x  that §4.5's midpoint rule reproduces the Pillar 9 buckets in practice
   -> argued from the arithmetic, not observed on a run
x  that 84 fixture weeks is enough for calibration per bucket (n >= 8)
   -> the count exists; the bucket distribution does not, until §4.7 runs
x  that the v1 face-B primitives can be wired without editing the sealed baseline
   -> asserted by §9.3; not attempted
x  that `pv-load.mjs` still behaves as written
   -> the command strings are from a prior session's runs; not re-run this turn
```

**Each of these becomes a finding the moment its phase runs.** None may be cited as established.

## §15.3 · What this spec cannot tell you

```
x  the exact numbers a calibration run will produce — §4.7 shows the SHAPE of the report,
   with illustrative rows explicitly marked as illustrative
x  which held-out weeks are correct — the operator draws them
x  whether the golden-week instrument is DXY or EU — §13 item 5
x  whether any phase will pass — no phase has run
```

## §15.4 · Self-check against the requirements it was written to satisfy

```
[ ] operator rulings quoted verbatim, attributed      Appendix A, 7 blocks
[ ] the derivation chain stated and not violated      §7.4, one diagram, one invariant
[ ] both gates present in every phase                  §9.2-§9.7, 6 phases
[ ] anti-hardcode is structural, not a promise         §11.4 per-phase discriminators
[ ] every test carries a negative and a mutation       §10.6, all three canonical tests
[ ] the supersession map is recorded                   §2, 11 entries
[ ] the failure record is stated as a failure           §8.5, verbatim
[ ] open decisions are explicit, with blocking status   §13, 8 items
[ ] claims carry their command or are marked unverified §15.1 / §15.2
[ ] the document says what it cannot tell you           §15.3
```

## §15.5 · The defect this document admits about itself

**§4.7's calibration procedure is specified but has never run.** Every downstream phase inherits
from it: E2 classifies by ZFP threshold, E3 trades off the chain. If calibration fails, §9 does not
begin — and this document will have been written against a premise that did not hold.

**That is the honest position of the spec as of 2026-10-18: complete as an instrument, unproven as
a description of what is buildable.** §13 items 1-4 are the tests of it.

# §16 · SUCCESS CRITERIA — COMMAND-CHECKABLE

**GS-1:** every criterion below names a process artifact — the indicator script, a gate script,
a rendered frame, or a report file. No criterion can be satisfied by a library sitting unused.

**GS-3 / GS-7:** every criterion carries the mission nouns from §1 — `indicator`, `chart`,
`renders`, `tradingview`, `accurate`, `script` — so the mission and the criteria translate in both
directions.

| # | criterion (process artifact named) | the command that decides it |
|---|---|---|
| S-1 | `vision/plutus-vision.pine` — the indicator script — compiles and `renders` into the `chart` | `bun scripts/pv-load.mjs vision/plutus-vision.pine DXY 1H` exits 0 and returns `success: true` |
| S-2 | the `chart` shows five named E1 bands, and the `indicator` script draws them from derived values, not literals | `grep -nE '^\s*(box\|line\|label)\.new\([^)]*[0-9]+\.[0-9]{3,}' vision/plutus-vision.pine` exits 1 with no matches |
| S-3 | the `indicator` `renders` the golden-week frame and the frame is opened this turn | `.trident/pv/proofs/P1/P1.png` exists **and** `read(path=…)` returns in the same turn |
| S-4 | `tradingview`-equivalent `chart` geometry: the E2 line traces price at `accurate` ratio | `python3 <P4.3 ratio script> /tmp/pv/P4.png` prints `ratio >= 0.900` |
| S-5 | the `indicator` `script` is `accurate` on weeks it was never built against | `bash .trident/pv/gates/gate_P6_b.sh` exits 0 over the ten held-out weeks |
| S-6 | the ZFP calibration `script` produces a report the `chart` labels can rely on | `python3 scripts/zfp_calibrate.py --out …` exits 0 and `zfp_report.json` contains every bucket row with `n >= 8` or `UNREPORTABLE` |
| S-7 | each phase's gate `script` refuses a corrupted input, proving the `indicator` cannot pass `chart` checks it should fail | `bash gates/prove.sh` prints `BROKEN: 0` and exits 0 |
| S-8 | the `chart` `renders` both E1 faces simultaneously without occlusion, measured off the opened frame | `.trident/pv/proofs/P2/enumeration.json` lists `ip_bands >= 5`, `ob_boxes >= 1`, `lqz_rails >= 1`, `read_in_turn: true` |
| S-9 | the `indicator` `script` reproduces the eight golden-week `tradingview` setups | `.trident/pv/proofs/P5/setups.json` matches every row of §6.3 on direction, entry, SL, TP and category |
| S-10 | the `chart` `renders` on `tradingview`'s week window — Monday 09:00 to Friday close, no forward extension | `.trident/pv/proofs/P1/bands.json` `axis_start`/`axis_end` equal the anchor and Friday close, read off the frame |

## §16.1 · WHAT FAILS THESE CRITERIA

```
S-1 fails  the script does not compile, or the load returns success:false
S-2 fails  a literal price appears in a draw call, or the frame shows ladder names
S-3 fails  the frame is not opened in the turn that captured it
S-4 fails  the measured ratio is below 0.900 — including the old line's 0.18
S-5 fails  any held-out week differs so far from the golden week that the build is hardcoded
S-6 fails  the calibration run errors, or a bucket is reported without n and without
           the UNREPORTABLE marker
S-7 fails  a gate returns 0 on a corrupted input — the gate cannot distinguish
S-8 fails  either face is absent from the opened frame, or the two occlude
S-9 fails  any of the eight setups differs from §6.3 in direction, entry, SL or TP
S-10 fails a band edge falls outside Monday 09:00 .. Friday close
```

**No criterion is satisfied by a document, a suite of tests, or a count.** Each one names the
`indicator` `script`, a gate `script`, a rendered `chart` frame, or a report file — the artifacts
that exist only if the build exists.

# APPENDIX A · THE OPERATOR'S RULINGS, VERBATIM

**Copied without paraphrase. A future session that reads only this appendix must not need the
original conversations.**

### A.1 · on the verification standard

> *"every previous gate observed a text file's properties and none observed the running system.
> The only fucking thing that matters is the running system. Everything else is irrelevant.
> No fucking bullshit tests are allowed."*

> *"Does the game work? Yes or no. Can I play it? Yes or no. Boolean true or false."*

> *"nothing is fucking working until visually proven. RIGHT NOW I DONT HAVE ANYTHING FUCKING
> RUNNING BEYOND THE PINE IDE CUZ NOTHING ELSE WORKS."*

### A.2 · on what is being built

> *"Engine one is the supply, demand, liquidity, and institutional pressure zones.
> Engine two is the shape chain. Engine three is the actual trade setups."*

> *"the shapes are derived from pressure + ZFP. The shape CHAIN is what the trade setups are
> derived from. E2 derived from E1. E3 derived from E2."*

### A.3 · on E2's two phases

> *"We literally said a two phase process where phase one is the boxes drawing the shapes. Like
> you can see in the entire winning trade library. And then phase two is converting the boxes
> into one single line."*

> *"phase four becomes E2 face B, which is the line that you're talking about here, which you
> need to derive from the actual shape chains"*

### A.4 · on the gates

> *"why the fuck are these at the very end absolutely fucking not forbidden no this needs to
> happen at the end of every single phase because you are retarded and you're fucking untrustworthy
> and no this is the exact theatrical bullshit no you're not allowed to just vibe code a bunch of
> trash and verify at the end forbidden and rejected no this needs to happen at the end of every
> single phase every single phase needs to have a golden week visual ad and an anti-hard code gate
> inside of every single phase this is going to be recursively fucking reiterated at least half
> a dozen times."*

### A.5 · on hardcoding

> *"as soon as the golden week is approved within the exact same minute I should be able to
> split test on 10 other weeks and they are all equally as accurate to the real price action of
> those trading weeks because of how this is coded."*

> *"if it passes for this one week but fails for everything else it's all obviously not aligned
> and not allowed and is theatrical etc etc"*

### A.6 · on ZFP

> *"A width/reference-range computation printed as '% ZFP' is a fabrication and must be killed
> with fire."*

> *"whatever is in the TOOLSET ORIGINAL 5.3.3 PROMPT IS AUTHORITATIVE"*

> *"I have no idea which one results the actual zone failure probability being calculated with
> accuracy instead of some theatrical fucking bullshit that literally does not fucking help in any
> way, shape, or form to calculate the actual tangible zone failure probability and pressure
> mechanics of the E1 Zones"*

### A.7 · on prior-agent work

> *"anything that is 'built and works' should be considered theatrical trash from previous agents."*

> *"You're fucking around on E2" ... "you're just regurgitating sloth" ... "zero tolerance for
> slop coded bullshit"*

---

# APPENDIX B · THE TERM GLOSSARY

**So no session invents a definition.**

| term | meaning in this build |
|---|---|
| **E1** | the zones — face A (institutional pressure) + face B (supply/demand/liquidity) |
| **E2** | the shape chain — derived from E1, rendered as boxes first, then one line |
| **E3** | the trade setups — derived from E2, rendered as entry→TP boxes |
| **the ladder** | the sorted set of `kept` rungs (prior high/low, equilibrium, rounds, swings) — a *substrate*, not a zone |
| **a zone** | a clustered range with a confluence score, a degree, a ZFP and a receipt |
| **IP zone** | one of the five named institutional roles |
| **ZFP** | zone failure probability = Appendix B base + modifiers, clamped, with a receipt |
| **degree** | EXTREME / HEAVY / MODERATE-HEAVY / MODERATE / LIGHT / MINIMAL, from the Pillar 9 score |
| **confluence** | the 0–14 count of independent structural supports on a zone |
| **GATE A** | the golden-week visual comparison — a frame opened, deltas named |
| **GATE B** | the anti-hardcode gate — 10 held-out weeks, no code change between them |
| **held-out week** | a week the builder never saw, drawn by the operator after the freeze |
| **the golden week** | Jul 6–10 2026 — the visual target and the first acceptance |
| **golden standard** | `~/Pictures/Jul_6-10_DXY_Gold_Standard/` — the reference frames |
| **winning trade library** | `~/Pictures/WINNING_TRADE_LIBARARY/` — the shape-box reference, 10 transition folders |
| **pre-flight guard** | a grep/hash/count/existence check — may halt, may never pass |
| **verdict evidence** | an opened frame, a returned value, a live dependency's response |
| **mutation** | break the thing on purpose; the verdict MUST flip; restore |
| **negative control** | a case that must FAIL; if it passes, the test is blind |
| **calibration** | predicted ZFP vs observed break rate across the 84 fixture weeks |

---

# APPENDIX C · THE FILE MAP

```
THE SPEC
  spec/PLUTUS_VISION_MASTER_SPEC.md          THIS FILE — the authority
  spec/ZFP_SPEC.md                            the ZFP detail (folded into §4 here)
  MASTER_CONTEXT/EXECUTION_CONTEXT.md         the routing node — read before anything else
  MASTER_CONTEXT/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md   the TOOLSET ORIGINAL, 4,216 lines

THE CANON
  MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/
    Trident_Fractal_Architecture_FirstPrinciples_v2.3.md   the four densities
    TTE_MACRO_SHAPES_COMPLETE_REFERENCE.md                 shape anatomy
    TTE_SHAPE_ZONE_MECHANICS_MILITARY_GRADE.md             zone-shape mechanics
    VISUAL_TELESCOPE_CHARTING_T2.md                        the trade contract
  MASTER_CONTEXT/FORENSIC_ANALYSIS_38_TRADES.md            the 3 entry laws
  MASTER_CONTEXT/Golden_Operator_Trade_Feedback_EU_GU.md   the golden-week ground truth
  MASTER_CONTEXT/Trident_System_Prompt_DOWNLOAD_ME.md      the original toolset

THE GRAPH
  cards/            34 typed atomic facts
  type/             10 type definitions
  sources/          12 source hubs
  MASTER_CONTEXT/knowledge-graph/
  MASTER_CONTEXT/.omp/graph-intelligence/layers/semantica/kg.json

THE TARGETS (visual, never text)
  ~/Pictures/Jul_6-10_DXY_Gold_Standard/Screenshot from 2026-07-28 02-51-16.png   E1+E3
  ~/Pictures/Jul_6-10_DXY_Gold_Standard/Screenshot from 2026-08-04 01-04-32.png   E1+E3
  ~/Pictures/Screenshot from 2026-10-14 07-51-15.png                              E2+E3 reference
  ~/Pictures/Screenshot from 2026-10-08 21-38-07.png                              E1+E2
  ~/Pictures/WINNING_TRADE_LIBARARY/                                              shape boxes, 39 images

THE CODE (candidates only, §8.2)
  scripts/e1_zfp.py · scripts/e2_engine.py · scripts/e1_fetch.py
  vision/plutus-vision.pine              the current indicator, 231 L
  scripts/pv-load.mjs · scripts/pv-ide.sh · scripts/pv-server.py   the rig
  scripts/slice-weeks.mjs                12 week fixtures from the long series
  pine-ide/pine-station/                 station :9741 · server :9851 · rail :9754

SUPERSEDED — do not open as authority
  spec/EW_A_BACKEND_SPEC.md · spec/EW_B1_ENGINE1_SPEC.md · spec/EW_B2_ENGINE2_SPEC.md
  spec/RENDER_LOOP_WORKFLOW.md

