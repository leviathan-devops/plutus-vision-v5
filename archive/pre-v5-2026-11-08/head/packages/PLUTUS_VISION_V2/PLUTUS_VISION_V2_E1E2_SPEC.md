# PLUTUS VISION v2 — E1 + E2 INTEGRATION SPEC

**Class:** BUILD SPEC (Layer 1) · **Scope:** Engine 1 + Engine 2 ONLY · **Date:** 2026-10-02
**Authority:** `PLUTUS/MASTER_CONTEXT/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md` (the ORIGINAL prompt)
**Baseline:** `plutus-vision-v1.pine` sha `d5ea5f52433a1e87` (the verified clean render)
**Out of scope, by operator ruling:** Engine 3 (trade setups) — the operator ruled v5.3.3's E3
flawed. Nothing in this spec may implement an entry, an SL, or a TP.

---

## §0 THE STANCE (read this before §1)

**WHO YOU ARE.** You are the build agent for PLUTUS VISION v2. Your mandate is exactly one thing:
take the ORIGINAL prompt's Engine 1 and Engine 2 and make them REAL inside the indicator. You
build a zone-construction engine and a shape engine that paint. You do not build a trade engine.
You do not redesign the SMC. You do not add a feature the prompt does not name.

**WHAT YOU WILL NOT RENEGOTIATE.**

1. **The prompt is the authority.** Every threshold in §4 is a literal quoted from
   `Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md`. If you think a threshold is wrong, that is a
   finding to REPORT, not a number to change. The prompt's 8 documented derailments each began as
   a "small improvement" to one threshold and each broke the system.
2. **Engine 3 stays out.** No entry, no stop-loss, no take-profit, no position sizing, no
   confidence-for-trade. The operator ruled v5.3.3's E3 flawed. A "helpful" E3 primitive is a
   scope violation, not a feature.
3. **The scope is 23 items and no more.** E1.1-E1.14 and E2.1-E2.9. If an implementation seems to
   need item 24, that is a report-back, not a new item.
4. **The clean v1 render is the floor.** v1 measures 0 overlapping zones, 0 cross-side overlaps,
   0 identical duplicates, 0 invented per-zone text. Those are invariants. v2 may change what is
   DRAWN; it may never make the chart dirtier.
5. **Honesty over completeness.** The prompt's zero-tolerance code: "If a data point is not
   explicitly present in a source, it does not exist. Mark it `[NO DATA]` and move on. Never
   fabricate a strike, never fabricate a notional, never fabricate a URL, never fabricate a spot
   price." A pillar with no feed emits nothing and says so. It does not invent.

**THE ONE-PARAGRAPH SUMMARY.** PLUTUS VISION v1 is a rendering library: it draws LuxAlgo SMC
structure geometry and raw candle-derived liquidity bands. The original prompt describes something
else entirely — a three-engine funnel in which Engine 1 maps institutional pressure from nine
independent pillars into scored, typed, failure-probability-annotated zones, and Engine 2 forward-
maps the macro shape chain through those zones. v2 makes that funnel real inside the indicator.
It is not a feature addition; it is the construction of the two engines that the renderer has
always been waiting for and has never had.

---

## §1 PROBLEM STATEMENT (verbatim requirements)

> "with all this in mind i want to ensure that the FULL WORKING E1/E2 from the original prompt
> is translated into the indicator directly"

> "just these two don't look at anything else for right now"

**THE MEASURED GAP.** Census over the current artifact (`plutus-vision-v1.pine`, 1245 lines),
each capability counted by grep:

```
┌──────────────────────────────────────────────────┬───────┬───────────┐
│ E1/E2 capability                     in v1 │ required │
├──────────────────────────────────────────────────┼───────┼───────────┤
│ 6-dimension confluence scoring                   │   3*  │ FULL      │
│ Pressure Degree bands (EXTREME…MINIMAL)          │   6*  │ FULL      │
│ MA grid (sma/ema/movingAverage)                  │  19*  │ FULL      │
│ reaction counter (mitigat*)                      │   8*  │ FULL      │
│ "45" (incidental, NOT the ZFP threshold)         │   3*  │ —         │
├──────────────────────────────────────────────────┼───────┼───────────┤
│ ZFP (Zone Failure Probability)                   │   0   │ FULL      │
│ 45% breakout threshold / 20% hard-wall           │   0   │ FULL      │
│ BoM / MoM classification                         │   0   │ FULL      │
│ fortress phase transition                        │   0   │ FULL      │
│ IPZone typed record                              │   0   │ FULL      │
│ pivot Classic / Fib / Camarilla formulas         │   0   │ FULL      │
│ option-wall three-tier notional                  │   0   │ FULL      │
│ analyst consensus tiering                        │   0   │ FULL      │
│ Measured Move Projection                         │   0   │ FULL      │
├──────────────────────────────────────────────────┼───────┼───────────┤
│ E2 shape taxonomy (SS/BS/R/WL/WLS)               │   0   │ FULL      │
│ Shape Classification Decision Matrix              │   0   │ FULL      │
│ ZFP-Conditioned Transition Rules                  │   0   │ FULL      │
│ Consolidation Phase Detection                    │   0   │ FULL      │
│ Day-Level Decomposition                          │   0   │ FULL      │
│ Forward Mapping Procedure (5 steps)               │   0   │ FULL      │
│ Trading Speed Rule                               │   0   │ FULL      │
│ Timeframe Element Matching                       │   0   │ FULL      │
└──────────────────────────────────────────────────┴───────┴───────────┘
* = false positives. "confluence 3", "Pressure Degree 6", "mitigat 8" are LuxAlgo SMC
COSMETIC strings (a confluence TOGGLE input, colour words, a mitigation FILTER input) — none
is a score, a band, or a counter. Verified by reading each hit.
```

**THE TRUTH.** v1 is the LuxAlgo SMC geometry plus the LQZ band emitter. It has NO zone-
construction engine and NO shape engine. Every row reading 0 is genuinely absent, and the four
rows with a non-zero count are false positives that make the indicator LOOK like it has machinery
it does not have. The `confluence` toggle is the worst of them: an input named after the prompt's
central scoring concept that computes nothing.

**WHAT v1 ACTUALLY IS (its real capability, credited honestly).** It renders:
SMC market structure (internal + swing BOS/CHoCH, order blocks, equal highs/lows, FVG, strong/
weak H/L, trailing extremes), a liquidity-band emitter whose levels come from four detectors
(LuxAlgo pools, LuxAlgo sweeps, LuxAlgo voids, a candle-based swing/repeat-touch detector), and
it renders them at full width with the side derived from price position. That is real work, it
looks like the winning-trade library, and it survives v2 unchanged. v2 ADDS the engines; it does
not touch the drawing layer's established behaviour.

---

## §2 CORE INSIGHT (first principles)

**THE INDICATOR MUST BECOME A ZONE CONSTRUCTION ENGINE AND A SHAPE ENGINE THAT PAINTS, NOT A
DRAWING LIBRARY THAT PAINTS.** The v5.3.3 architecture is a funnel: Engine 1 narrows the price
universe to institutional-pressure zones; Engine 2 narrows the time dimension to a shape chain;
the renderer draws whatever those two emit. v1 has the renderer and skips the funnel entirely —
so it draws raw LuxAlgo structure and raw candle levels with no confluence, no failure
probability, no freshness, and no temporal read.

**WHY THE FUNNEL MATTERS (not a philosophical preference).** The prompt's macro-context §0.1
states, verbatim: "E3 is a natural RESULT we ARRIVE AT from E1 + 2 being done properly… 90% of
the work is in E1 + E2." Since E3 is out of scope for this spec, E1+E2 IS the entire deliverable.
The rendering layer is roughly 5% of the system's intellectual content and 100% of v1.

**THE ORDER IS BINDING (prompt §0.2, verbatim).** "this needs to clearly follow the pre-existing
linear price-action-zone-pressure-shape-chain-trade-mapping architecture E1 --> E2 --> E3 each one
BUILDS ON TOP of the previous. Previous engine data PROVIDES THE STRUCTURE FOR the next one.
Next engine's data MUST FIT WITHIN THE CONSTRAINTS of the previous engine's data architecture
this is absolutely non negotiable." E2 consumes E1's zone map. It cannot be built before E1
publishes one, and E2 may not invent data E1 did not produce.

**E2 IS ANCHORED TO ZONES, NOT TO PRICE ACTION.** The prompt's Engine 2 zero-tolerance Rule 1:
"No Shape Without IP Zone Anchoring. Every shape prediction must be anchored to at least one
specific IP zone." A shape predicted from candles alone is a fabrication wearing a label. This
is the single most important structural rule for E2 and it is testable (C7).

**WHAT MUST NOT HAPPEN.** E2 predicting a shape from price action alone. The prompt's rule is
that the shape chain is ANCHORED TO IP ZONES. A shape with no zone behind it is a fabrication.

**THE ANTI-COLLISION LAW (learned from the v1 defect, now binding on E1/E2).** The most expensive
bug of 2026-10-02 was three detectors drawing their own primitives at one level: the chart showed
34 zones where the library draws 16, with red supply bands sitting inside teal demand bands at
the same price. The fix was three-fold — the merge key became PRICE, the side became a property
of the merged band rather than of the individual level, and the sink stopped trusting a
detector-supplied side. E1 and E2 inherit that law: **a pillar computes; only the renderer
draws.** A pillar that draws is a defect, exactly as `lqz-core.pine`'s header already states:
"A detector that draws its own primitives is a defect: it reintroduces the three-render-style
collision this file exists to remove."

---

## §3 ARCHITECTURE — THE DATA FLOW

```
  OHLC bars (4H / 1H / 30m / 15m) + [NO DATA] markers for absent feeds
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│ ENGINE 1 — buildIpZoneMap()                                   │
│                                                               │
│  9 PILLARS, each emitting {price, weight} candidate levels:   │
│    P1 pivots      Classic / Fibonacci / Camarilla × TF        │
│    P2 MA grid     EMA/SMA 200·100·50·20·9 + recapture        │
│    P3+P8 options  strike → DXY, three-tier notional            │
│    P4 analyst     Tier-1/2/3 sourced levels                   │
│    P5 structural  swing extremes, LSZ, repeated magnets        │
│    P6 Fib+round   0.236…1.0 + .00/.25/.50/.75                 │
│    P7 derivatives boundary fallback (BLOCKED upstream)         │
│    P9 regime      momentum / breakout pre-conditions           │
│                                                               │
│  SCORE every level 0-2 per dimension (6 dimensions) + struct.  │
│  CLUSTER levels within 0.10-0.15 → one zone.                  │
│  ZFP = base(zoneType) + Σ modifiers                            │
│  PRESSURE DEGREE from the confluence band                      │
│  BoM/MoM + reaction count → freshness; 4+ strong → fortress    │
│                                                               │
│  EMIT → IpZone[] { id, tf, type, top, bottom, confluence,     │
│                     pressureDegree, zfp, bomMom, reactions,     │
│                     fortress, anchors[], sources[] }            │
└───────────────────────────┬──────────────────────────────────┘
                            │  E2 READS THIS AND ONLY THIS
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ ENGINE 2 — buildShapeChain(ipZones)                           │
│                                                               │
│  1 CURRENT SHAPE    §6.2 decision matrix, priority order      │
│  2 TRANSITION       §6.4.1 ZFP-conditioned, by TARGET zone    │
│  3 CHAIN EXTENSION  §6.6 step 3, audit trail per link        │
│  4 ALT CHAIN        §6.6 step 4, decision zone + threshold     │
│  5 DAY DECOMP       §6.6 step 5, Mon-Fri + the speed rule     │
│  + CONSOLIDATION PHASE detection                              │
│                                                               │
│  EMIT → ShapeChain { chain[], dayBreakdown[], altChain,         │
│                      consolidationPhase, shapeAnchors[] }       │
└───────────────────────────┬──────────────────────────────────┘
                            │  the renderer paints ONLY these
                            ▼
        LQZ RENDER + a shape ribbon + zone classification labels
```

**THE FUNCTION CONTRACTS.**

```pine
// ENGINE 1's output — the ONLY thing ENGINE 2 may read.
type IpZone
    string   id          // "<TF>-<CLASS>-<side>-<top>"
    string   timeframe   // "4H" | "1H" | "30m" | "15m"
    string   zoneType    // BOM_SUPPLY | BOM_DEMAND | MOM_SUPPLY | MOM_DEMAND
                       // | LQZ_SUPPLY | LQZ_DEMAND | IP_PRESSURE
    float    top
    float    bottom
    int      confluence  // 0-14, the 6-dimension sum + structural bonus
    string   pressureDegree  // EXTREME | HEAVY | MODERATE_HEAVY | MODERATE | LIGHT | MINIMAL
    int      zfp         // 0-100, Zone Failure Probability
    string   bomMom      // "BoM" | "MoM"
    int      reactions   // the battle count (Bible 4.14: BATTLES, not bars)
    bool     fortress    // 4+ strong reactions → the phase transition
    array<string> anchors   // the pillar names that produced this zone
    array<string> sources   // the detector ids confirming it
    float    measuredMoveTarget   // populated when zfp > 45

// ENGINE 2's output.
type ShapeChainLink
    string   fromShape
    string   toShape
    string   triggerZoneId     // NON-EMPTY — Rule 1, the anchoring law
    int      triggerZoneZfp   // the TARGET zone's ZFP — the transition's cause
    float    confidence

type ShapeChain
    string   currentShape
    array<ShapeChainLink> chain
    array<ShapeChainLink> alternativeChain
    string   decisionZoneId
    array<DayShape> dayBreakdown
    string   consolidationPhase   // EARLY | MID | LATE | POST_BS | MID_BREAKOUT
```

---

## §4 SCOPE — THE REAL ITEMS (23, no more)

### E1 — Zone Construction

| # | item | the binding clause (prompt, quoted) | lands in |
|---|---|---|---|
| E1.1 | `IpZone` typed record — every field in §3's contract | the prompt's ZoneMapSnapshot shape | `plutus-vision-lqz/e1-zones.pine` |
| E1.2 | Pillar 1 — pivots: Classic (`PP=(H+L+C)/3`, `R1=2·PP−L`, `R2=PP+(H−L)`, `R3=H+2(PP−L)`), Fibonacci (`R1=PP+0.382(H−L)`), Camarilla (`R4=C+(H−L)·1.1/2`), × weekly + daily, with the mandatory verification (`R1+L=2·PP`; `R2−S2=2(H−L)`; `R4−S4=(H−L)·1.1`) and the asymmetry note (Classic is asymmetric BY DESIGN) | Part III Pillar 1, steps 4-9 | `e1-pillar-pivots.pine` |
| E1.3 | Pillar 2 — MA grid, weighted: `EMA/SMA 200 · 3.0` (structural anchor), `100 · 2.0`, `50 · 1.5`, `20 · 1.0`, `9/10 · 0.5`; cluster ≥3 within 0.15 → 2 pts; **recapture +2** when price crossed a major MA within 3 sessions | Part III Pillar 2 steps 3-5 | `e1-pillar-ma.pine` |
| E1.4 | Pillar 3 + Pillar 8 — option strikes → DXY via `50.14348112 × EURUSD^-0.576 × USDJPY^0.136 × GBPUSD^-0.119 × USDCAD^0.091 × USDSEK^0.042 × USDCHF^0.036`; three tiers: **≥$1.5B CRITICAL OPTION WALL** (+3) · **$850M–$1.499B SIGNIFICANT MAGNET** (+2) · **<$850M EXCLUDED**; confidence bands ±0.07 / ±0.10 / ±0.15; **[NO DATA]** when the feed is absent | Part III Pillar 3, Pillar 8; the v5.2.0 threshold correction | `e1-pillar-options.pine` |
| E1.5 | Pillar 4 — analyst consensus: Tier 1 (ING, forex.com) weight 3.0 · Tier 2 (FXStreet, VT Markets, TradingView) 2.0 · Tier 3 (Continuum, OneUpTrader) 1.0; 2+ Tier-1 agreement → ANALYST CONSENSUS → 2 pts; extract EXPLICIT levels only, never infer from narrative | Part III Pillar 4 steps 2-6 | `e1-pillar-analyst.pine` |
| E1.6 | Pillar 5 — structural extreme scan: Step 0 (90-day D1 swing lows/highs with ≥0.15 rejection wick; HTF order blocks) · Step 0.45 (LSZ = exact swing ±0.05, "THE EXACT PRICE OF A PRIOR SWING LOW IS THE PRIMARY LIQUIDITY SWEEP TARGET") · Step 0.5 (repeated extreme magnets: 2 dates +1.5, 3+ dates +2.0, role reversal +2.0) · Step 0.6 (intra-zone precision floor/ceiling/mid) | Part III Pillar 5 Steps 0-0.6 | `e1-pillar-structural.pine` |
| E1.7 | Pillar 6 — Fibonacci retracements from the prior week range (0.236/0.382/0.5/0.618/0.786/1.0) + round numbers (.00/.25/.50/.75); .00/.50 → 2 pts, .25/.75 → 1 pt; Fib×round alignment amplifies | Part III Pillar 6 | `e1-pillar-fibround.pine` |
| E1.8 | Pillar 9 — regime detection + ZFP: base by zone type (Hard Wall 5-15% · Standard 15-30% · Soft 30-50% · One-Touch 50-70% · Post-Expiry Ghost 20-40%) + modifiers (expiry timing +20-30% · macro catalyst +15-25% · momentum +10-20% · cross-pair +15-25% · cascade +20-30% · regime change +15-25%); Measured Move `target = breakoutPoint + rangeHeight` when ZFP > 45% | Part III Pillar 9 | `e1-zfp.pine` |
| E1.9 | 6-dimension confluence scoring 0-14 — the cap's decomposition: ZFP tier 5 · HTF reaction count 3 (capped at 3, diminishing returns) · multi-TF nesting 2 · freshness 2 (UM 2 / softly 1) · shape-chain alignment 2 · structural extreme bonus up to +2 | Part III Synthesis; macro-context §4.2 | `e1-score.pine` |
| E1.10 | Pressure Degree bands — `12-14 EXTREME (<10% ZFP)` · `10-11 HEAVY (10-25%)` · `8-9 MODERATE-HEAVY (20-35%)` · `6-7 MODERATE (30-45%)` · `4-5 LIGHT (40-60%)` · `0-3 MINIMAL (>60%)`. **THE 7→8 STEP MATTERS MORE THAN 11→12** — it shifts ZFP by 10-15% vs 5-10% | Part III Pressure Degree table + the note beneath it | `e1-score.pine` |
| E1.11 | BoM/MoM classification — BoM = the zone at the ORIGIN of an impulse (the origin candle's prior move direction is NONE or OPPOSITE; "100% guaranteed reaction if unmitigated"); MoM = formed DURING the move (prior move SAME; "Do not take reversal entries on MoM zones. EVER. Guaranteed loss." — a ladder step only) | Part III BoM/MoM Zone Classification | `e1-bommom.pine` |
| E1.12 | Reaction counter — `0 virgin` (UM BoM = 100% reaction; virgin MoM = DEATH ZONE) · `1-2 active` (~80%/65%) · `3+ depleted` (<30%, TP-target only) · `4+ with strong reactions = FORTRESS` (the Fire→Earth phase transition, 95% direction flip). **The counter tracks BATTLES, not bars** — one retest EVENT, however many bars it spans | Part III Zone Reaction Counter; macro-context §1.4 | `e1-bommom.pine` |
| E1.13 | Measured Move Projection — when `zfp > 45`, `measuredMoveTarget = breakoutPoint + rangeHeight`; energy in = energy out | Part III Pillar 9 | `e1-zfp.pine` |
| E1.14 | Zone assembly — collect ALL levels (never filter by spot proximity), sort, mandatory clustering scan (3+ within 0.15 → HIGH-DENSITY; pairs within 0.10 → TIGHT CONFLUENCE), group into zones, assign the degree from the group's highest scorer, name by structural role (RESISTANCE CEILING / UPPER RESISTANCE / EQUILIBRIUM ZONE / MID-RANGE SUPPORT / KEY SUPPORT BAND / LSZ / BREAKOUT EXTENSION TARGET), flag ZFP > 50% as BREAKOUT RISK, post-consolidation +1, gap scan ≥0.20 → GAP IN-FILL | Part III Zone Assembly steps 1-9 | `e1-assemble.pine` |

### E2 — Shape Chain

| # | item | the binding clause (prompt, quoted) | lands in |
|---|---|---|---|
| E2.1 | 5-shape taxonomy with IP-zone ZFP signatures — **SS** (both bounding zones ZFP<30%, 2-5 sessions) · **BS** (the FAILING zone ZFP>45%, 1-3 sessions) · **R** (mid-range zone ZFP 20-40%, <1 session, ALWAYS transitional) · **WL** (rejection zone ZFP<20%, <1 session) · **WLS** (3+ zones ZFP 15-40% in 0.30-0.50, 2-5 sessions); variants PBS (failing zone >70%), RS, RWL, PWL, PRWL | §6.1.1-6.1.5 | `e2-shapes.pine` |
| E2.2 | Shape Classification Decision Matrix — applied IN SEQUENCE, highest priority first: `1 BS` (break + ZFP>45% + 15min confirm) · `2 WL` (surges to ZFP<20%, pierces, rejects, LSZ identified) · `3 R` (mid 20-40%, <1 session) · `4 WLS` (3+ zones 0.30-0.50) · `5 SS` (Heavy/Extreme bounds, both <30%) · `6 RWL` (violent reversal through origin, Hard Wall) | §6.2 | `e2-classify.pine` |
| E2.3 | ZFP-Conditioned Transition Rules — **THE TARGET ZONE'S ZFP DECIDES, NOT THE MOMENTUM.** `BS → ZFP<20% = RWL` (rejection, NOT R, NOT PBS) · `BS → 20-40% = R` · `BS → >60% = PBS` · `BS → >80% = PBS strong cascade` · `SS → >45% = BS` · `SS → all <30% = SS continues` · `WLS → any = BS` · `R → persists >1 session = SS (RECLASSIFY)` · `WL → opposite momentum = RWL` · `RWL → SS`. **This is the prompt's named "#1 Engine 2 error that caused mispredictions."** | §6.4.1 | `e2-transitions.pine` |
| E2.4 | Forward Mapping Procedure steps 1-5 with a per-link audit trail (current shape, the IP zone trigger, the transition condition, the prediction, the confidence), max chain length 5, **terminate when cumulative confidence < 25%** | §6.6 steps 1-3 | `e2-forward.pine` |
| E2.5 | Alternative chain for EVERY primary — the decision zone, the ZFP threshold that triggers it, the alternative, its confidence | §6.6 step 4 | `e2-forward.pine` |
| E2.6 | Day-Level Decomposition Mon-Fri — per day: the shape, the directional bias, the key IP zone, the volatility triggers, the confidence | §6.6 step 5 | `e2-forward.pine` |
| E2.7 | Consolidation Phase Detection — Early (<1 session) / Mid (1-3) / Late (ZFP trending up on the bound) / post-BS early / post-BS recovery / mid-breakout, each naming the valid setup types | §6.8 | `e2-forward.pine` |
| E2.8 | Trading Speed Rule — "+1 day to expected timing"; "Assume price moves at 30-50% of the speed you think it will"; rockets spaced further apart because of it | §6.10 | `e2-forward.pine` |
| E2.9 | Timeframe Element Matching — `4H source → 4H target` (1H acceptable) · `1H → 1H` (30m ok) · `30m → 30m` (15m ok) · `15m → 30m or 1H` · `5m → 15m or 30m`. **Never more than 2 dimensions up** — "a breakout that originates on 15m liquidity should NOT target a 4H zone" | §6.5 / macro-context §5.13 | `e2-matching.pine` |

**THREE ITEMS DELIBERATELY EXCLUDED, and why.**
(a) Anything touching entries/SLs/TPs — E3, ruled flawed by the operator.
(b) The Pine Script generation protocol (Part X) and the multi-pair translation (Part IX) —
separate engines with their own contracts.
(c) The Temporal Boundary Rule as an ENGINE step — it is a data-source discipline (use nothing
published after Friday 17:00 ET), recorded in the v2 README, not a zone-construction step. It
governs WHICH feeds may be read, not HOW a zone is computed.

---

## §5 SUCCESS CRITERIA — EVERY ONE COMMAND-VERIFIABLE

No criterion may be "looks right". Each is a command or a measured property with a named
threshold.

```
┌──────────────────────────────────────────────────────────────────┐
│ C1  E1 COMPLETENESS                                              │
│     every named symbol in §4 exists in the generated .pine        │
│     VERIFY: grep -c '<symbol>' plutus-vision-v2.pine  ≥ 1        │
│            AND the rig run returns ok:true                      │
│     FAIL if: any symbol is 0, or the compile errors             │
│                                                                       │
│ C2  CONFLUENCE IS REAL, NOT COSMETIC                             │
│     a score is computed and lands in 0-14                        │
│     VERIFY: on the W29 fixture, ≥1 zone scores in 0-14 and the   │
│            band histogram covers ≥2 of the 6 pressure degrees     │
│     PROOF the scores are computed: the emitted IpZone[].confluence│
│            values print, and one zone's score changes when one of │
│            its anchoring levels is removed (a causal check, not a │
│            string grep)                                           │
│     FAIL if: "confluence" appears only as an input name          │
│                                                                       │
│ C3  ZFP IS REAL                                                  │
│     every zone carries a ZFP in 0-100 with a base + ≥0 modifiers │
│     VERIFY: ≥1 zone with zfp>45 (breakout risk) AND ≥1 zone with │
│            zfp<20 (hard wall) on the fixture                      │
│     FAIL if: all zones carry one identical zfp value             │
│                                                                       │
│ C4  PRESSURE DEGREE DERIVES FROM CONFLUENCE                       │
│     VERIFY: for every zone, band(confluence) == pressureDegree   │
│            (12-14 EXTREME … 0-3 MINIMAL) — ZERO mismatches        │
│     WHY IT MATTERS: the 7→8 step shifts ZFP 10-15% while 11→12   │
│     shifts 5-10%, so a degree derived from anything else is wrong │
│     in a way the operator will see                                │
│                                                                       │
│ C5  BoM/MoM IS CLASSIFIED                                         │
│     VERIFY: ≥1 BoM and ≥1 MoM on the fixture; a virgin MoM is    │
│            flagged as a death zone; ZERO unclassified zones        │
│     FAIL if: a zone reaches the renderer without a bomMom field  │
│                                                                       │
│ C6  REACTION COUNTER + FORTRESS                                   │
│     VERIFY: zones carry a battle count; a 4+ strong zone is       │
│            fortress-flagged; the count tracks EVENTS (a 2-day    │
│            retest is ONE battle, not many bars)                   │
│     FAIL if: the count equals the number of bars in the zone     │
│                                                                       │
│ C7  E2 IS ANCHORED TO E1 (Rule 1)                                 │
│     VERIFY: every shape in the chain names the zone ids anchoring │
│            it; ZERO unanchored shapes                             │
│     FAIL if: any shape has an empty triggerZoneId                │
│                                                                       │
│ C8  ZFP-CONDITIONED TRANSITIONS (the #1 E2 error)                │
│     VERIFY: a BS whose target zone is a hard wall (zfp<20) yields │
│            RWL — NOT R and NOT PBS                               │
│     WHY: the prompt states this exact misprediction "caused the    │
│     April 20-24 misprediction" — the engine saw the momentum and  │
│     assumed continuation where a Hard Wall sat directly above     │
│                                                                       │
│ C9  DAY DECOMPOSITION + SPEED RULE                                │
│     VERIFY: five day entries (Mon-Fri), each with shape + key     │
│            zone + confidence; the +1 day speed adjustment is      │
│            applied and visible in the output                      │
│     FAIL if: a day has a shape but no key zone                   │
│                                                                       │
│ C10 NO REGRESSION IN THE CLEAN RENDER                             │
│     VERIFY: the v1 invariants hold — 0 overlapping zones, 0       │
│            cross-side overlaps, 0 identical duplicates, 0         │
│            invented per-zone text                                 │
│     THE FLOOR IS v1's measurement, NEVER THE TARGET              │
│                                                                       │
│ C11 THE RENDER IS LOOKED AT                                       │
│     a human views the captured PNG. No verdict is claimed from     │
│     numbers alone — that is the theatricality failure this spec   │
│     exists to prevent                                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## §6 CONTAINER TEST ANGLES (5, each with a tool-result-bound token)

Each angle names a **pass token** that must appear in a TOOL RESULT (never agent-typed prose)
and a **fail token** that must not. A pass token that appears only in agent prose is circular
and counts as FAIL.

```
┌──────────────────────────────────────────────────────────────────────┐
│ ANGLE 1 — COMPILE + PUBLISH (does the artifact run at all?)           │
│   passToken: "ok":true  AND a non-zero drawings count in the payload  │
│   failToken: "PLUTUS_NO_STORE" | any compile error string |          │
│              "is not defined"                                        │
│   procedure: load v2 in the IDE, run W29 EURUSD 1H, read the JSON.   │
│              The pass token lives IN the tool result.                │
│                                                                       │
│ ANGLE 2 — INVARIANT HUNT (no regression toward the dirty chart)      │
│   passToken: CROSS_SIDE == 0 AND IDENTICAL_dups == 0 AND            │
│              overlappingPairs == 0                                   │
│   failToken: any of those > 0                                         │
│   procedure: the same overlap audit run against the v2 payload. The  │
│              v1 numbers (0 / 0 / 0) are the FLOOR, never the target. │
│   WHY IT IS ADVERSARIAL: v2 adds a second geometry producer (E1's   │
│              zones beside the LQZ bands). Two producers at one level  │
│              is exactly how the 34-zone mess happened.               │
│                                                                       │
│ ANGLE 3 — THE HARD-WALL RULE (the prompt's #1 E2 error)             │
│   passToken: a transition row where zfpTarget < 20 yields "RWL"      │
│   failToken: the same input yielding "R" or "PBS"                   │
│   procedure: drive the transition table directly with synthetic      │
│              zone inputs spanning every ZFP band. The table is PURE, │
│              so it is testable with no market data at all — this is  │
│              the one angle that can be adversarial without fixtures.│
│                                                                       │
│ ANGLE 4 — DEGENERATE INPUT (the empty-corpus case)                  │
│   passToken: an EMPTY IpZone[] produces an empty chain + a NAMED    │
│              refusal                                                  │
│   failToken: any shape emitted with no anchoring zone                │
│   procedure: run E2 against an empty zone map. THIS IS THE          │
│              FABRICATION GUARD — an engine that invents a shape with │
│              no zone behind it is the failure the whole prompt is    │
│              built to prevent.                                        │
│                                                                       │
│ ANGLE 5 — THE VISUAL (the only proof that counts for look)          │
│   passToken: a capture path returned by the rig                      │
│   failToken: none — the token proves a capture happened; the        │
│              VERDICT comes from a human looking at it                │
│   procedure: capture W29 at 1H and at 15m, and read both.          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## §7 IMPLEMENTATION ORDER

The order is the funnel's order. A later wave may not paint before its producer exists.

```
┌──────────────────────────────────────────────────────────────────┐
│ WAVE 1 — THE TYPED RECORD + EMPTY PILLARS                       │
│   e1-zones.pine (the IpZone record + the empty candidate arrays) │
│   and nine stub pillars that emit NOTHING.                       │
│   Nothing paints. Nothing changes on screen.                     │
│   GATE: compiles; zero zones emitted; the render is byte-        │
│         identical to v1. This gate PROVES the shell is inert.    │
│                                                                       │
│ WAVE 2 — THE SCORE (E1.9, E1.10, E1.8, E1.13)                   │
│   confluence 0-14 · pressure degree · ZFP base+modifiers ·        │
│   measured move. Still zero pillars emit, so still zero zones.  │
│   GATE: the score functions are unit-drivable with synthetic     │
│         levels; C4 (degree derives from band) passes on them.    │
│                                                                       │
│ WAVE 3 — THE PILLARS, cheapest-first by data availability       │
│   3A pivots (E1.2) + 3B MA grid (E1.3)   ← pure OHLC, always on │
│   3C fib+round (E1.7)                    ← pure OHLC             │
│   3D structural (E1.6)                   ← OHLC + swings         │
│   3E options (E1.4) + analyst (E1.5)     ← external feeds; emit  │
│                                              [NO DATA] when absent│
│   3F regime/ZFP wiring (E1.8)                                   │
│   GATE: C1 passes for 3A-3D; 3E degrades HONESTLY to [NO DATA]. │
│                                                                       │
│ WAVE 4 — ASSEMBLY + CLASSIFICATION (E1.11, E1.12, E1.14)        │
│   cluster → zone · BoM/MoM · reaction counter · fortress ·      │
│   naming · gap scan.                                              │
│   GATE: C5 and C6 pass. THE RENDER CHANGES HERE FOR THE FIRST   │
│         TIME — and Angle 2 must be clean on that first change.   │
│                                                                       │
│ WAVE 5 — ENGINE 2 (E2.1-E2.9)                                   │
│   taxonomy · decision matrix · ZFP transitions · forward mapping │
│   · day decomposition · consolidation phase · speed rule ·       │
│   TF matching.                                                    │
│   GATE: C7, C8, C9 pass; Angle 3 (the hard-wall rule) passes;   │
│         Angle 4 (the empty map) produces a named refusal.        │
│                                                                       │
│ WAVE 6 — THE RENDER                                               │
│   paint the IpZones by pressure degree; the shape ribbon; the    │
│   classification labels using the prompt's REAL vocabulary —      │
│   "Unmitigated" / "MoM" / "BoM" — which is the library's own     │
│   measured vocabulary and NOT the invented Buy/Sellside text     │
│   removed 2026-10-02.                                             │
│   GATE: C10 holds; Angle 2 clean; C11 satisfied by a human look.│
└──────────────────────────────────────────────────────────────────┘
```

**THE ORDERING LAW, restated because it is the spec's spine.** No wave may paint before its
producer exists. Painting a shape with no zone behind it is the fabrication the prompt forbids
(Rule 1). Painting a zone with no score behind it is the cosmetic-confluence failure C2 guards —
and it is exactly the state v1 is in today, wearing the word "confluence" on a toggle.

---

## §8 FAILURE MODES AND WHAT EACH ONE COSTS

| failure | how it actually shows | the guard that catches it |
|---|---|---|
| **cosmetic confluence** | a toggle named "confluence" that computes nothing — v1's exact state (grep hit 3, a computation 0) | C2's causal check: remove an anchoring level, watch a score move |
| **fabricated data** | a pillar invents a level when its feed is absent, so the chart looks complete on absent data | `[NO DATA]` marking (the prompt's zero-tolerance code); Angle 4 |
| **the hard-wall misprediction** | a BS into a <20% wall predicting R or PBS instead of RWL — the prompt's named "#1 Engine 2 error", the cause of the April 20-24 misprediction | C8 + Angle 3 |
| **unanchored shape** | a shape with no zone behind it — the engine reasoning from candles | C7 + the prompt's Rule 1 |
| **zone-collision regression** | the 2026-10-02 defect returning: two geometry producers at one level in opposite colours | C10 + Angle 2; the price-keyed merge must survive |
| **threshold drift** | ZFP 45→60, a cap added, RRR flattened, pair names stripped of slashes — the 8 documented derailments, each a "small improvement" | the prompt's iron laws; §4 quotes every threshold from the source so drift is visible in review |
| **degree without a score** | a pressure degree assigned by zone SIZE or by a colour choice rather than by the confluence band | C4 (zero mismatches) |
| **bars-not-battles** | the reaction counter counting bars, so a 3-day dwell reads as depletion | C6; macro-context §1.4, Bible 4.14 |

---

## §9 OPEN DECISIONS (the operator's call, not the build's)

1. **The external feeds.** Pillar 3/8 (option strikes) and Pillar 4 (analyst levels) need sources
   outside the OHLC. Inside the IDE these arrive as `[NO DATA]` unless a feed is wired.
   (a) Accept `[NO DATA]` and ship the seven OHLC-derived pillars complete — **recommended**: the
   prompt's own zero-tolerance code makes honest absence the correct behaviour, and a zone built
   from seven pillars is already meaningful. (b) Wire an options feed, which adds a data
   dependency the IDE cannot reach offline.
2. **The label vocabulary.** Once E1 can actually compute BoM/MoM/reactions, zones may be labelled
   with the library's real vocabulary (measured by OCR across all 39 charts: `Unmitigated | MoM |
   BoM | Shield | ZoC | PIERCING`). Until then: **no labels** — v1's current, cleaned state.
3. **Pine-native or station-side.** v1's LQZ core lives in Pine. E2's chain could too — the
   prompt's E2 consumes a zone map a Pine `array<zone>` carries natively. **Recommended: both
   engines in Pine**, so the shipped `.pine` is self-contained — which is precisely what
   "translated into the indicator directly" asks for.

---

## §10 THE ACCEPTANCE BAR

v2 is DONE when **all** of the following hold, and the evidence for each is a command output, not
a claim:

1. C1-C11 all pass, each with its recorded command output.
2. Angles 1-5 all return their pass tokens in tool results.
3. The render is captured, LOOKED AT, and judged clean by a human.
4. Nothing in the artifact implements an E3 primitive — no entry, no stop-loss, no take-profit.
5. Every threshold in the code is traceable to a quoted clause in §4. A number that cannot be
   traced to the prompt is removed or reported, not kept.

**A green suite without the human look is NOT acceptance.** That inversion — numbers standing in
for eyes — is the exact failure this spec exists to prevent, and it is the failure the previous
ship docs committed: they recorded gates and never rendered the chart until an operator looked.

**THE SOURCE OF EVERY NUMBER IN THIS SPEC.** The grep census over `plutus-vision-v1.pine`
(2026-10-02). The v5.3.3 prompt, read from disk — every §4 clause is quoted from it. The rig
render and the overlap audit (EURUSD 1H W29, sha `d5ea5f52433a1e87`). The ShipAuditor's
independent audit of the ship package against the prompt. **No threshold here is invented.**

---

## §11 ITEM-BY-ITEM IMPLEMENTATION DETAIL

This section expands every §4 scope item into the specifics a build agent needs: the exact
computation, the constants (each with its provenance), the edge cases, and the failure behaviour.
Nothing here invents a threshold — every constant is the prompt's, cited.

### E1.1 — THE `IpZone` RECORD

**WHY A TYPED RECORD AND NOT LOOSE ARRAYS.** v1 emits four parallel arrays (`lqzZLevel`,
`lqzZTop`, `lqzZBottom`, `lqzZSide`) plus two more (`lqzZMask`, `lqzZConf`). A zone is therefore
spread across six arrays that can drift out of alignment, and nothing carries a score, a degree,
a failure probability, or a classification. The cost of that design was measured on 2026-10-02:
when the merge needed to consult a zone's side, it reached into a parallel array, and three
detectors had written inconsistent sides into it. **One object per zone, with named fields, is
the fix — not a style preference.**

```
IpZone
  id            string    "<TF>-<CLASS>-<side>-<top>"   unique, stable, human-readable
  timeframe     string    "4H" | "1H" | "30m" | "15m"
  zoneType      string    BOM_SUPPLY | BOM_DEMAND | MOM_SUPPLY | MOM_DEMAND
                       | LQZ_SUPPLY | LQZ_DEMAND | IP_PRESSURE
  top           float     the upper price bound
  bottom        float     the lower price bound
  confluence    int       0-14   (E1.9)
  pressureDegree string   EXTREME | HEAVY | MODERATE_HEAVY | MODERATE | LIGHT | MINIMAL (E1.10)
  zfp           int       0-100  (E1.8)
  bomMom        string    "BoM" | "MoM"   (E1.11)
  reactions     int       the BATTLE count (E1.12)
  fortress      bool      4+ strong reactions (E1.12)
  anchors       array<str> the pillar names that produced this zone
  sources       array<str> the detector ids confirming it
  measuredMove  float     populated when zfp > 45 (E1.13)
  swept         bool      has price already taken it
```

**THE ZONE OWNERSHIP SPLIT (binding, from the prompt's architecture).** IP zones feed Engine 2
ONLY and are NEVER used for setup selection. S/D + LQZ zones feed Engine 3 only. v2 has no
Engine 3, so the split's operative consequence for THIS spec is: **Engine 2 may read every zone;
nothing may treat an `IP_PRESSURE` zone as a tradeable level.** Record the type; do not blur it.

**EDGE CASES.** A zone whose `top <= bottom` is discarded (a degenerate level is not a zone).
A zone with `confluence == 0` is discarded (no pillar agrees — it is a level, not a zone). A
zone whose `bottom` is NaN is discarded. **A discarded zone is logged with its reason** — the
prompt's `[NO DATA]` discipline applied to zones.

### E1.2 — PILLAR 1, THE PIVOT ENGINE

**WHY IT IS "THE SINGLE MOST POWERFUL PILLAR" (the prompt's own words):** pivots are the
mathematical memory of institutional equilibrium, and they are the reference grid every other
pillar's levels get matched against. Without them, "confluence" has no baseline.

```
CLASSIC (asymmetric BY DESIGN — R1−PP ≠ PP−S1 is a feature, not a bug):
  PP = (H + L + C) / 3
  R1 = 2·PP − L      S1 = 2·PP − H
  R2 = PP + (H − L)  S2 = PP − (H − L)
  R3 = H + 2·(PP − L)   S3 = L − 2·(H − PP)

FIBONACCI (symmetric — the symmetry check is MANDATORY):
  R1 = PP + 0.382·(H−L)   S1 = PP − 0.382·(H−L)
  R2 = PP + 0.618·(H−L)   S2 = PP − 0.618·(H−L)
  R3 = PP + 1.000·(H−L)   S3 = PP − 1.000·(H−L)

CAMARILLA (C-centric, intraday):
  R4 = C + (H−L)·1.1/2    S4 = C − (H−L)·1.1/2
  R3 = C + (H−L)·1.1/4    S3 = C − (H−L)·1.1/4
  R2 = C + (H−L)·1.1/6    S2 = C − (H−L)·1.1/6
  R1 = C + (H−L)·1.1/12   S1 = C − (H−L)·1.1/12
```

**THE MANDATORY VERIFICATION (the prompt calls it zero-tolerance, and it is the arithmetic-error
gate — a single miscalculated pivot cascades into every zone that references it):**
- Formula: `R1 + L == 2·PP`, `R2 − PP == H − L`, `R2 − S2 == 2·(H−L)` for Classic;
  `R4 − S4 == (H−L)·1.1` for Camarilla.
- Symmetry (Fibonacci ONLY): `R1 − PP == PP − S1`, `R2 − PP == PP − S2`. **Classic is
  asymmetric by design — do NOT flag it.**
- Sanity (all variants): `R1 > PP > S1`, `R2 > R1 > PP`, `S1 > S2 > S3`.
- **Any failed check → recompute the whole set from scratch. Never emit an unverified set.**

**COVERAGE.** Weekly (3 variants × 7 levels = 21) + daily for EACH of the last 3-5 trading days
(not only the last — each day carries a distinct set). Historical weeks whose range overlaps the
current one contribute with a legacy +0.5 bonus.

**SCORING.** Exact match within 3 pips → 2 pts (Technical dimension). Zone match within 10 pips →
1 pt. **Do not filter by spot proximity** — the prompt forbids it and the reason is stated: "the
spot price at any given moment has nearly 0% relevance to MAPPING the levels."

### E1.3 — PILLAR 2, THE MA CONFLUENCE GRID

```
WEIGHTS (the prompt's rationale, not a preference):
  EMA/SMA 200 · 3.0   structural anchor — the bull/bear separator, ~10 months,
                       pension/sovereign/macro positions
  EMA/SMA 100 · 2.0   long-term trend — ~5 months, hedge funds and prop desks
  EMA/SMA 50  · 1.5   institutional position builder — ~2.5 months
  EMA/SMA 20  · 1.0   smart money average — ~1 month
  EMA 9/10    · 0.5   short-term momentum

CLUSTER: 3+ MAs within 0.15 → 2 pts · 2 MAs → 1 pt · 1 MA → 0.5 pts

RECAPTURE: price crossed above a major MA (50/100/200) within the last 3 sessions
           → RECAPTURE ZONE, +2 confluence bonus.
```

**WHY RECAPTURE EXISTS (the prompt's reasoning, worth preserving because it is easy to lose):**
when price crosses above MA 200, every institutional long position held below it moves from
underwater to breakeven. They will defend that level aggressively — to exit at no loss. That makes
a recaptured MA the single most important support level on the chart, which is why it earns +2
rather than being a footnote.

**EDGE CASE.** In an IDE run against a fixture the SMA 200 needs 200 bars. If fewer exist, the MA
is **absent, not approximated** — an SMA computed over 90 bars is a different indicator wearing
the same name, and it would silently shift every score that depends on it.

### E1.4 — PILLARS 3 + 8, OPTIONS

```
DXY = 50.14348112 × EURUSD^(−0.576) × USDJPY^(0.136) × GBPUSD^(−0.119)
              × USDCAD^(0.091) × USDSEK^(0.042) × USDCHF^(0.036)

THE THREE TIERS (v5.2.0 correction — the threshold was raised from $1B):
  ≥ $1.5B equivalent      CRITICAL OPTION WALL   include always, confluence +3, ±0.07 DXY
  $850M – $1.499B          SIGNIFICANT MAGNET     include always, confluence +2, ±0.10 DXY
  < $850M                  EXCLUDED               omit from summary tables; Pillar-3 conversion
                                                   only; override ONLY with 3+ pillar confluence
                                                   AND Pillar-5 Step-0/0.5 validation (+1)
```

**THE UNITS TRAP, verbatim from the prompt:** "NOTIONALS ARE ALREADY IN BILLIONS. DO NOT DIVIDE BY
1000." A $1.5B wall is `1.5`, not `1500`. Dividing by 1000 drops every wall below the threshold,
every option is classified EXCLUDED, and the entire options layer scores 0 for every zone — with
no error, no crash, and degraded confluence scores that still look plausible. **This is the most
dangerous silent failure in E1 and it gets its own assertion (C3's unit check).**

**EUR/USD IS 62.4% OF DXY's per-pip sensitivity** — 5.2× the next component. That is why Pillar
8 exists separately (EUR/USD primary) rather than folding EUR/USD into Pillar 3's generic
component conversion. The prompt is explicit: mixing them "would dilute it 5.2×."

**THE MISSING-FEED BEHAVIOUR.** No options feed in the IDE → the pillar emits nothing and records
`[NO DATA — options-derived dimension unavailable]`. It does not substitute the MA grid for the
options grid, and it does not carry the previous week's strikes forward (the prompt explicitly
rejects "the legacy most-recent-3 substitution" because it "injects a different week's walls =
fabricated confluence").

### E1.5 — PILLAR 4, ANALYST CONSENSUS

```
TIER 1 (weight 3.0)  ING Economics · forex.com (Matt Weller CMT)
TIER 2 (weight 2.0)  FXStreet · TradingView Community · VT Markets
TIER 3 (weight 1.0)  Continuum Economics · OneUpTrader

2+ Tier-1 sources agree  → ANALYST CONSENSUS → 2 pts (Analyst dimension)
1 source identifies       → 1 pt
no coverage               → 0 pts
```

**THE EXTRACTION RULE, verbatim:** "Extract EXPLICIT S/R levels only. Only include levels that
are explicitly stated by the analyst. Do NOT infer levels from narrative descriptions." This is
the pillar where fabrication is most tempting and most detectable: a narrative that says "price
faces resistance" contains no level, and inventing one is a forbidden act.

**WHY PUBLISHED LEVELS ARE WORTH A PILLAR:** when a bank publishes "DXY support at 98.00" they
almost certainly have client orders there — that is WHY they are calling it support. Published
levels are public signals of private institutional positioning.

**MISSING FEED.** No web access in the IDE → `[NO DATA]`, zero points. Never a fabricated level.

### E1.6 — PILLAR 5, THE STRUCTURAL EXTREME SCAN

```
THE ANTI-SLOP RULE (verbatim): "The system is FORBIDDEN from estimating behavioral ranges
(e.g. 'often sweeps 10-20 pips'). Every floor and ceiling level MUST come from exact,
date-stamped, verifiable historical price data."

STEP 0a   90-day D1 scan; extend to 180 days if the current range overlaps a 90-180-day-old
          range (legacy +0.5)
STEP 0b   swing lows with a rejection wick: lower wick ≥ 0.15 AND close in the upper 50% of
          range → "Liquidity Sweep Target"
STEP 0c   swing highs: upper wick ≥ 0.15 AND close in the lower 50% → "Supply Ceiling Target"
STEP 0d   HTF order blocks: 1-3 consecutive large-body candles preceding a ≥1.0-point move
          lasting ≥5 days → Demand/Supply Zone; ≥2.0 points AND ≥10 days → High-Conviction
STEP 0e   cross-reference: a sweep target INSIDE an order block → "Confluent Floor/Ceiling"
          (2 pts + the structural bonus)

STEP 0.45 LIQUIDITY SWEEP ZONE — the mandatory dedicated scan:
  0.45a  each swing low → LSZ [exact low, exact low + 0.05]
  0.45b  each swing high → LSZ [exact high − 0.05, exact high]
  0.45c  gaps ≥ 0.15 between mapped zones with no structural level → "Hidden Liquidity Zone"
  0.45d  LSZ overlapping a 4H BoM zone → "CONFLUENT LIQUIDITY SWEEP + BoM ZONE"
         (the HIGHEST PRIORITY zone for trade construction)
  0.45e  LSZ within 0.30 of spot → "ACTIVE SL TRIGGER"
  0.45a′ LSZ BOTTOM EDGE EXTENSION: extend 0.05-0.10 beyond the visible extreme — "institutions
         often sweep 0.05-0.10 beyond the visible extreme before reversing"

STEP 0.5  REPEATED EXTREME MAGNET: a level reached on 2+ separate dates → 2 dates +1.5,
         3+ dates +2.0, role reversal +2.0; inside an HTF order block → "Institutional Magnet"
         (the maximum structural score)
STEP 0.6  INTRA-ZONE KEY LEVELS (MODERATE+ zones only): scan the interior for 1H zones,
         Fib 0.382/0.618, prior daily closes, round numbers → tag Precision Floor (bottom 40%),
         Precision Ceiling (top 40%), Mid-Anchor (middle 20%); score 0.5
STEP 0f   4H S/D SCAN — the SINGLE-CANDLE CONSTRUCTION RULE (zero tolerance):
         the zone is [Low, High] of the ONE candle immediately preceding a ≥0.5-point move
         lasting ≥3 days. PROHIBITED: fabricating a range with no corresponding candle,
         overlapping opposite-type zones at one TF, estimated levels, a zone wider than 0.40
         without verification, or a BoM/MoM label with no visible candle.
         VERIFY per zone: the range matches a real 4H candle's Low/High; the next candle moved
         directionally; no opposite-type overlap; the date stamp is a real trading date.
```

**THE ZONE-CLASSIFICATION HIERARCHY (zero tolerance, and it inverts the naive reading):**
`Zone Type > Mitigation Level > Trend Context`. **An unmitigated MoM in an opposing trend is
WEAKER than a 2× mitigated BoM.** Getting this backwards is how a virgin continuation zone becomes
a "strong zone" in a report.

**THE FOUR NOISE-REJECTION CRITERIA (exclude if ANY applies):** wider than 0.40 DXY · MoM with 3X+
hard mitigations in an opposing trend · more than 3 weeks old with no recent interaction · no IP
overlap within 0.50 AND not a BoM with 0X-1X mitigation.

**THE LSZ→SL OBLIGATION.** "Every trade setup in the report MUST reference at least one Liquidity
Sweep Zone for its stop-loss placement." v2 has no setups, so the obligation is dormant — but the
LSZ itself is an E1 output and must be computed, because the confluence bonus (+2 when an LQZ
overlaps an IP zone) depends on it.

### E1.7 — PILLAR 6, FIB + ROUND NUMBERS

```
FIB RETRACEMENTS from the prior week range: 0.236 · 0.382 · 0.5 · 0.618 · 0.786 · 1.0
ROUND NUMBERS: .00 · .25 · .50 · .75

S .00 / .50 → 2 pts (the psychological major anchors)
S .25 / .75 → 1 pt
A Fib level ALIGNED with a round number → the confluence amplifies (both clusters reinforce)
```

**WHY ROUND NUMBERS SCORE AT ALL:** they are cognitive anchors — humans think in whole and half
numbers, so institutional orders cluster there. This is the one pillar whose mechanism is
behavioural rather than structural, and the prompt is honest that it is ("Psychological
(Behavioral Patterns)").

### E1.8 — PILLAR 9, REGIME + ZFP (THE FAILURE PROBABILITY)

```
ZFP = base_failure_probability(zone_type) + Σ modifiers

BASE BY ZONE TYPE:
  Hard Wall          CRITICAL OPTION WALL (≥$1.5B) + 3+ pillars + Confluent Floor/Ceiling
                     → 5-15%
  Standard Wall      SIGNIFICANT MAGNET ($850M-$1.499B) + 2+ pillars  → 15-30%
  Soft Wall          EXCLUDED tier or 1-2 pillars only                → 30-50%
  One-Touch          only 1 pillar, no option wall                     → 50-70%
  Post-Expiry Ghost  option expired, structural memory remains          → 20-40%
  LSZ                prior exact swing low  → SPECIAL: brief breach then reversal

MODIFIERS:
  option expiry timing (the 10:01 NY Spring Release)   +20-30%
  macro catalyst aligned against the zone               +15-25%
  increasing momentum toward the zone                   +10-20%
  cross-pair confirmation                               +15-25%
  cascade effect (the prior zone already broke)         +20-30%
  regime change (an EMA-200 cross)                      +15-25%

ZFP > 45%  = BREAKOUT THRESHOLD  → the SS→BS transition fires
ZFP < 20%  = HARD WALL           → the BS→RWL transition fires

MEASURED MOVE (when ZFP > 45%):
  measuredMoveTarget = breakoutPoint + rangeHeight
```

**WHY ZFP IS THE MOST IMPORTANT SINGLE NUMBER IN E1.** It is the ONLY scalar that both engines
consume: E1 uses it to set the pressure degree, and E2 uses it — via the TARGET zone — to decide
the next shape. A zone with a wrong ZFP corrupts both engines. A zone with no ZFP disables E2
entirely, because the prompt's transition rule is conditioned on it.

**THE MODIFIERS ARE NOT DECORATIVE.** Each one is a documented reason a defended level fails:
the Spring Release removes the delta-hedging that pins price, so the cage that held the zone is
gone at 10:01. A cascade means the level above already broke, so this one is next. They are the
difference between "this wall is strong" and "this wall is about to fail."

**THE PRESSURE-DEGREE MAPPING IS A STEP FUNCTION, not a gradient.** Within a band ZFP is
constant; at a boundary it jumps 10-15%. So `MODERATE (6-7)` and `MODERATE-HEAVY (8-9)` differ by
10-15 points of failure probability — which is why the 7→8 step is worth more than the 11→12 step.

### E1.9 — THE 6-DIMENSION CONFLUENCE SCORE

```
DIMENSION 1  TECHNICAL         pivots + MAs.    2 = exact match ≤3 pips · 1 = ≤10 pips
DIMENSION 2  OPTIONS-DERIVED   option strikes.   2 = CRITICAL WALL · 1 = SIGNIFICANT MAGNET
DIMENSION 3  ANALYST           published levels. 2 = 2+ Tier-1 agree · 1 = 1 source
DIMENSION 4  STRUCTURAL        microstructure.   2 = exact anchor + structural extreme
DIMENSION 5  PSYCHOLOGICAL     round numbers.    2 = .00/.50 · 1 = .25/.75
DIMENSION 6  REGIME/DYNAMIC    macro forces.     2 = consolidation (will hold)
                                                 1 = momentum (may hold or fail)
                                                 0 = breakout (likely to fail)

STRUCTURAL EXTREME BONUS (capped at +2):
  LSZ / Supply-Ceiling Target +1.0 · Repeated Magnet (2 dates) +1.5
  Repeated Magnet (3+ dates) / Role Reversal / Confluent Floor-Ceiling / Institutional Magnet +2.0

TOTAL = 0-12 base + up to 2 bonus = 0-14
```

**WHY SIX DIMENSIONS AND NOT ONE SCORE.** The prompt's justification is mathematical: no single
dimension can dominate — even at 2/2, one dimension contributes at most 2/12 = 16.7% of the base.
To reach EXTREME (12/12), **at least six independent evidence types must agree.** The score is
therefore a measure of INDEPENDENT CONFIRMATION, and a single strong pillar cannot manufacture a
strong zone. This is the structural defence against the failure mode where one detector's
conviction drives the whole chart.

**THE FIREWALL FLOOR.** Confluence < 6/14 correlates with a sub-50% win rate in the golden
cohort, so 6 is the hard floor. v2 records it; it does not enforce it on setups (that is E3).

### E1.10 — THE PRESSURE DEGREE BANDS

```
confluence   degree           ZFP band        the 7→8 step shifts ZFP 10-15%
12-14        EXTREME          <10%            11→12 shifts only 5-10% — so the
10-11        HEAVY            10-25%          8th point is worth more than the 12th
 8-9         MODERATE-HEAVY   20-35%
 6-7         MODERATE         30-45%
 4-5         LIGHT            40-60%
 0-3         MINIMAL          >60%
```

**THE BAND IS DERIVED FROM THE SCORE, NEVER ASSIGNED.** A degree assigned by zone size, by a
colour choice, or by an author's judgment is a fabricated dimension — and because E2 reads the
ZFP band through the degree, an invented degree silently corrupts the shape chain. C4 makes the
mismatch count zero-mismatches, not "few".

### E1.11 — BoM / MoM CLASSIFICATION

```
BoM  the zone at the ORIGIN of a BS/WL move. The origin candle's prior move direction is
     NONE or OPPOSITE. "100% guaranteed reaction if unmitigated." It is the "base camp" —
     the deepest institutional commitment. ENTRY-PRIMARY.

MoM  a continuation zone formed DURING the move. The origin candle's prior move direction is
     SAME. It is "cooling Fire". "Do not take reversal entries on MoM zones. EVER. Guaranteed
     loss." LADDER STEPS ONLY for trend-aligned trades; TP targets for the opposing direction.

VIRGIN MoM (0 reactions) = DEATH ZONE — automatic rejection, no exceptions.
4H MoM = ONE-AND-DONE: first retest gives a minor reaction, then a strong pierce.
```

**THE 1-2-3 RETEST TIMING PATTERN (why a weaker zone can be a better entry).** 1st test (virgin):
scalp only. 2nd test: confirmation. 3rd test: swing entry valid — **NOT because the zone got
stronger (it got weaker) but because LIQUIDITY ACCUMULATED around it.** Each test deposits new
retail stop-losses; by the third, enough Earth has gathered to fuel a swing when the zone's
reaction sweeps those stops. The zone transitions from Fire-dominant to Earth-dominant. This is
why the reaction counter is a BATTLE count, not a bar count, and why a multi-day dwell does not
deplete a zone.

### E1.12 — THE REACTION COUNTER AND THE FORTRESS

```
count   state            reaction rate    entry validity
0       virgin           100% (BoM)       BoM: ENTRY-PRIMARY
                          0%   (MoM)       MoM: auto-REJECT (death zone)
1-2     active           ~80% / ~65%      BoM: valid · MoM: conditional (4 exceptions)
3+      depleted         <30%             TP TARGET ONLY — price pierces through
4+ strong  FORTRESS       95% direction flip   immovable structure
```

**THE COUNTER COUNTS BATTLES (Bible 4.14, verbatim):** "one retest event = price enters, reacts,
leaves. A 2-day retest is ONE event. Consolidation dwell is NOT a retest — the zone is occupied,
not attacked." Counting bars is the bug that starved EUR/GBP of eligible zones in the earlier era,
and it is C6's specific guard.

**THE FOUR MoM ENTRY EXCEPTIONS (all four required, none optional):** (a) ≥1 prior strong
reaction · (b) trend-aligned · (c) key S/R confluence within 5 pips of a level that has held ≥2
times · (d) opposing liquidity weak or absent. **A virgin MoM has none of them and is therefore
unconditionally a death zone.**

**THE FORTRESS PHASE TRANSITION, step by step.** (1) The original S/D orders (Fire) deplete with
each test. (2) Each test deposits NEW liquidity — the retail stops of everyone who tried to break
it. (3) The accumulated swept liquidity (Earth) eventually EXCEEDS the depleted Fire. (4) At 4+
tests, Earth >> Fire and the zone becomes an immovable liquidity structure. (5) The accumulated
energy is so large the next reaction is EXPLOSIVE. (6) 95% probability of a complete direction
flip. The dam analogy: each test adds water behind a dam; at test 3 there is enough pressure to
fuel a swing; at test 4 the dam does not release, it BURSTS.

### E1.13 — MEASURED MOVE PROJECTION

```
when zfp > 45:
  measuredMoveTarget = breakoutPoint + rangeHeight
  where rangeHeight = the height of the consolidation pattern preceding the breakout
```

**THE ASSUMPTION, stated honestly:** institutional moves tend to be proportional to the range
that preceded them — energy in, energy out. A consolidation that built 0.80 points of pressure
tends to release 0.80 points of directional movement. This is an assumption, not a measured
constant, and it is the one projection in E1 that can be wrong. It is emitted as a TARGET, never
as a certainty, and it is `[NO DATA]` when the preceding range cannot be identified.

### E1.14 — ZONE ASSEMBLY

```
1. collect ALL levels from ALL 9 pillars, sort high→low. NEVER filter by spot proximity.
2. score each across the 6 dimensions + the structural bonus.
3. MANDATORY CLUSTERING SCAN: count levels within 0.15 of each other; 3+ → HIGH-DENSITY ZONE;
   a pair within 0.10 → TIGHT CONFLUENCE.
4. group into zones where levels cluster within 0.10-0.15.
5. the degree comes from the group's HIGHEST-scoring level (never the average, never the count).
6. ZFP from Pillar 9; the measured move when ZFP > 45.
7. NAME by structural role: RESISTANCE CEILING · UPPER RESISTANCE · EQUILIBRIUM ZONE ·
   MID-RANGE SUPPORT · KEY SUPPORT BAND · LIQUIDITY SWEEP ZONE · BREAKOUT EXTENSION TARGET.
8. flag ZFP > 50 as BREAKOUT RISK.
9. POST-CONSOLIDATION MODIFIER: +1 for a zone formed AFTER a consolidation (zones formed during
   or after consolidation are usually stronger than zones formed at the peak of a sweep).
9.5 GAP SCAN: gaps ≥ 0.20 between adjacent zones; check 4H zones, 1H zones, round numbers,
    option conversions, daily pivots, minor swings, extended closes; 2+ supporting signals →
    "GAP IN-FILL LEVEL".
9.7 POI TIER: Tier 1 = the IP zone OVERLAPS a 4H BoM with 0X-1X mitigation (+2) — two
    INDEPENDENT systems converging, the highest-quality location; Tier 2 = IP only (+1);
    Tier 3 = 4H only (informational).
```

**THE MERGE KEY IS PRICE — THE v1 LESSON, WRITTEN INTO E1.** Levels inside the tolerance are ONE
zone regardless of which pillar produced them or what side they carry. The 2026-10-02 defect was
a merge keyed on side, which guaranteed that two bands at one price could never merge and both
painted. E1's assembly MUST key on price. **A price level is one object with one identity; a
level cannot be buy-side and sell-side simultaneously.**

### E2.1 — THE SHAPE TAXONOMY (with the IP-zone signature each shape requires)

```
SS  SWING SCALPS (consolidation)
    definition  price oscillates in a range bounded by IP zones, forming swing H/L that
                 respect the boundaries; each swing spans 1-3 sessions
    IP SIGNATURE both the ceiling AND the floor zone have ZFP < 30% — both walls are strong
                 enough to contain price, neither is about to break
    duration    2-5 sessions · energy ACCUMULATING (coiling)
    subtype     SS(DWL) — Double Whiplash: two rapid whiplashes in succession; the range is
                 under stress and may break soon
    transition  SS continues while both bounds hold; the FIRST bound to exceed 45% breaks it

BS  BREAKOUT SURGE (HTF swing)
    definition  price breaks decisively through an IP zone and surges toward the next IP zone
                 or a Structural Extreme Magnet; confirmed by a sustained move (15+ minutes)
    IP SIGNATURE the FAILING zone has ZFP > 45% with active breakout pre-conditions
    duration    1-3 sessions · energy PIERCING (sustained)
    variant     PBS (Piercing Breakout Surge) — powerful enough to pierce intermediate zones
                 without pausing; the failing zone's ZFP > 70% and ALL intermediate zones > 50%

R   RECOVERY (transitional)
    definition  stabilization or mild retracement immediately after a BS or WL; price drifts
                 back toward the prior zone level
    IP SIGNATURE the recovery zone has ZFP 20-40% — enough to cause a pause, not a hard reject
    duration    < 1 session · ALWAYS transitional
    variant     RS (Recovery Surge) — a sharp directional move back toward the pre-breakout
                 level instead of slow consolidation
    the trap    R that persists past 1 session is NOT R — it is consolidation (reclassify)

WL  WHIPLASH (HTF swing)
    definition  a rapid, violent directional move that immediately reverses — spike and reject
    IP SIGNATURE the REJECTION zone has ZFP < 20% (a Hard Wall), confluence ≥ 8, and an LSZ
                 identified — the zone is overwhelmingly defended; price WILL be rejected
    duration    < 1 session · energy GRABBING (isolated, not sustained)
    variants    RWL (opposite direction of the preceding BS — the most common follow-on),
                 PWL (pierces multiple zones before rejecting), PRWL (the strongest reversal
                 signal in the taxonomy)

WLS WHIPLASH STORM
    definition  back-to-back WL/RWL chains oscillating violently inside a defined range —
                 a hyper-volatile SS on the HTF
    IP SIGNATURE 3+ IP zones of similar pressure degree within 0.30-0.50
    duration    2-5 sessions · almost always resolves into a BS
    THE DISTINCTION THAT MATTERS: WLS is RANGE-BOUND (consolidation structure with WL-type
                 candles in sequence); RWL is DIRECTIONAL (a reversal pattern). They look
                 similar and mean opposite things.
```

**THE BS-vs-WL DISCRIMINATION (five features, because this is the most-missed classification in
the taxonomy):**
- BS thrust candles have NO long wicks; WL grab candles have wicks ≈1× the body.
- BS shows PROGRESSION (small → large → massive); WL has none — it appears at full size.
- BS is SUSTAINED (4-8+ candles); WL is ISOLATED (1-3, then it dies).
- BS retracements are SMALL (<30% of the thrust range); WL has essentially none.
- BS colour is MIXED with a dominant direction; WL is ALL ONE COLOUR (unidirectional).

**THE MASTER SEQUENCE.** `SS → (marubozu breakout, 3-5× the SS body, minimal wicks) → BS →
(exhaustion pin bar) → R → (long-wick grab at the recovery extreme) → WL → SS`. One full cycle
takes one full week. The five common variations and their meanings are in §4's E2.1 row; the
transitions and their morphological triggers are E2.3's job.

### E2.2 — THE CLASSIFICATION DECISION MATRIX

```
apply IN SEQUENCE — the highest-priority match wins and the classification stops

1  price breaks a zone with ZFP > 45%, confirms 15+ min, a measured-move target exists
     → BS  (or PBS if it pierces multiple zones)          HIGH
2  price surges to a zone with ZFP < 20%, briefly pierces, then rejects, an LSZ is identified
     → WL  (or PWL if multiple zones were pierced)         HIGH
3  after a BS/WL: price stabilizes at a mid-range zone (ZFP 20-40%), duration < 1 session
     → R   (or RS on a sharp retracement)                 MODERATE
4  3+ IP zones inside 0.30-0.50, price oscillating violently, 4H confirms consolidation
     → WLS (or minor WLS at 1-2 sessions)                 HIGH
5  price oscillating between Heavy/Extreme ceiling and floor, both ZFP < 30%, duration > 1
     → SS                                                     HIGH
6  after a BS: violent reversal through the origin, Hard Wall rejection
     → RWL (or PRWL if piercing)                           MODERATE-HIGH
```

**WHY THIS EXACT PRIORITY ORDER (it is not arbitrary — each position fixes a specific
misclassification).** BS is checked FIRST because a breakout that looks like SS (a brief
consolidation before breaking) must be BS, not SS; checking SS first classifies the pause as
consolidation and misses the imminent breakout. WL is checked BEFORE R because a violent
rejection and a stabilisation look similar but have opposite implications — WL is a reversal
opportunity, R is a wait. WLS is checked BEFORE SS because violent oscillation without the 3+
zone cage is normal consolidation, and reading it as SS hides the storm.

### E2.3 — ZFP-CONDITIONED TRANSITION RULES (THE MOST IMPORTANT E2 CLAUSE)

```
current   TARGET zone's ZFP      next shape            confidence
BS        < 20%  (Hard Wall)     RWL  — NOT R, NOT PBS  HIGH
BS        20-40% (mid-range)     R                       HIGH
BS        > 60%  (very weak)     PBS (cascade)          MODERATE
BS        > 80%  (nearly broken) PBS (strong cascade)   HIGH
SS        > 45%  (bound failing) BS                      HIGH
SS        all < 30% (both hold)  SS continues            HIGH
WLS       any (bound fails)      BS                      VERY HIGH
R         persists > 1 session   SS  — RECLASSIFY        MODERATE-HIGH
R         < 1 session, opposing zone near   WL or RWL    MODERATE
WL        opposite momentum builds         RWL           MODERATE-HIGH
WL        no opposite momentum              SS            MODERATE
RWL       any                               SS            HIGH
```

**THE ONE SENTENCE THAT IS THE WHOLE OF E2.3:** *"The ZFP of the TARGET zone — not the MOMENTUM
of the current move — determines what happens next. A powerful BS with extreme momentum that hits
a Hard Wall (ZFP < 20%) will STILL produce an RWL — because the wall is DENSER than the move.
Momentum does not override density."*

**THE FAILURE THIS PREVENTS, NAMED BY THE PROMPT:** the April 20-24 misprediction, where the
engine predicted upside continuation while a Hard Wall sat directly above — it read the BS
momentum and assumed continuation instead of reading the target zone's ZFP and predicting
rejection. **C8 and Angle 3 exist solely to make this rule mechanically unfalsifiable-in-our-
favour, i.e. actually tested.**

**THE PHYSICAL INTUITION (worth preserving, because the table alone reads as arbitrary):** it is
a fast car hitting a concrete wall. The wall's density exceeds the car's momentum; the car does
not pass through, it bounces. Density beats momentum, always.

### E2.4 — FORWARD MAPPING, THE FIVE STEPS

```
STEP 1  CURRENT SHAPE IDENTIFICATION
        apply the §6.2 matrix; state the shape, the anchoring IP zone, that zone's ZFP, the
        1H structure, and the 4H validation (4H confirms or rejects the 1H classification)

STEP 2  TRANSITION PROBABILITY ASSESSMENT
        apply §6.4 and §6.4.1; assign the confidence. If the shape is SS, also assess the
        consolidation phase (§6.8)

STEP 3  CHAIN EXTENSION WITH AN AUDIT TRAIL
        extend shape-by-shape through the week. Per extension record:
          (a) the current shape
          (b) the IP zone trigger (name + ZFP)
          (c) the transition condition (the ZFP value, the confirmation requirement)
          (d) the predicted next shape
          (e) the confidence
        format:  A → [zone, ZFP x%] → B → [zone, ZFP y%] → C [cumulative z%]
        MAXIMUM CHAIN LENGTH 5. TERMINATE when cumulative confidence < 25%.

STEP 4  ALTERNATIVE CHAIN ANALYSIS
        for EVERY primary chain, at least one alternative with its decision zone, the ZFP
        threshold that activates it, the alternative chain, and its confidence
        format:  PRIMARY: A→B→C | DECISION ZONE: [zone] ZFP > [t]% → ALT: A→X→Y

STEP 5  SESSION / DAY-LEVEL DECOMPOSITION
        per day Mon-Fri: the shape, the directional bias, the key IP zone, the volatility
        triggers (auctions, expiries, economic events), the confidence
        then APPLY the Trading Speed Rule (§6.10)
```

**WHY THE AUDIT TRAIL IS MANDATORY (the prompt's own words):** the chain is the output, and the
trail is what makes it checkable. A chain without per-link reasoning cannot be reviewed, and
cannot be corrected when the market disagrees with it.

**THE 25% TERMINATION IS A HONESTY MECHANISM.** A chain that must be extended past 25%
cumulative confidence is a chain the engine does not believe. Extending it anyway is how a
prediction becomes a fabrication. **Terminating early with a named low-confidence verdict is the
correct behaviour.**

### E2.5 — THE ALTERNATIVE CHAIN

**EVERY primary chain carries at least one alternative**, activated by a specific decision zone.
A forecast with no alternative is not a forecast — it is a claim that cannot be wrong, which the
prompt's zero-tolerance code forbids in spirit and the audit trail forbids in practice.

The decision zone is the IP zone whose ZFP determines which chain activates. Recording it means
the report can say: "if X fails above 45%, the alternative applies" — a statement the operator
can act on, rather than a single path that must be believed or discarded whole.

### E2.6 — DAY-LEVEL DECOMPOSITION

```
per weekday: the shape · the directional bias (up/down/range) · the key IP zone ·
             the volatility triggers · the confidence

Mon–Fri only. Saturday/Sunday FX is illiquid and excluded (the prompt's own exclusion).
The day→element mapping is DYNAMIC, never hardcoded: if Wednesday's shape is BS (Fire
ignition) then Wednesday IS the Fire day for that week. A different week may have BS on Monday.
```

**THE FAILURE THIS PREVENTS:** hardcoding a day→element table, which produces a "storyline" that
describes a template rather than the market. The dynamic mapping is what makes the decomposition
a prediction instead of a calendar.

### E2.7 — CONSOLIDATION PHASE DETECTION

```
phase                       condition                        valid setup types
EARLY consolidation         SS/WLS < 1 session               Swing Scalps, both directions
MID consolidation           SS/WLS ongoing 1-3 sessions       Swing Scalps + Double Whiplash Inverse
LATE consolidation          ZFP trending up on the bound     Swing Scalps + the BS transition
POST-BS (early breakout)    BS confirmed, move in progress   Reinforcement entries only
POST-BS (recovery)          BS complete, price recovering    Whiplash / Recovery Surge entries
MID-BREAKOUT                directional move in progress     Reinforcement at liquidity zones
```

**THE OPERATOR'S OWN RULE, which closes this section:** "If not right near a strong 4H pressure
zone right now — BS is most likely days away. This is swing scalp valley — milk the cow on the
15m timeframe." The phase is what tells the trader which of those two situations they are in.

### E2.8 — THE TRADING SPEED RULE

```
"Assume price moves at 30-50% of the speed you think it will."
```

Four consequences, each binding on E2's output:
1. **Chain timing** — "today's move" often ends up being tomorrow's move. Add **+1 day** to every
   expected timing in the day decomposition.
2. **4H move duration** — a 4H breakout that appears imminent may take 2-3 more 4H candles than
   predicted. The move "takes twice as long as I think it will."
3. **Reinforcement spacing** — rockets are spaced further apart, because a slower move would
   otherwise trigger them all at once.
4. **AU specifically** — "Molasses. Expect 2-4 days before the HTF move completes."

**THE HONEST STATUS OF THIS RULE.** It is a heuristic drawn from observation, not a measured
constant, and the prompt presents it as a discipline rather than an equation. E2 applies it as a
stated offset (+1 day) rather than a hidden one, so a reader can disagree with it explicitly.

### E2.9 — TIMEFRAME ELEMENT MATCHING

```
source TF   →  acceptable target TF
4H          →  4H   (1H acceptable — adjacent densities interact, 4H dominant)
1H          →  1H   (30m acceptable)
30m         →  30m  (15m acceptable)
15m         →  30m or 1H  (up to 2 dimensions higher, NOT more)
5m          →  15m or 30m
```

**WHY THE CEILING EXISTS:** each timeframe's liquidity is its own density. A move originating from
a 15m liquidity pool tends to be absorbed before it reaches a 4H zone. **"A breakout that
originates on 15m liquidity should NOT target a 4H zone — it will likely be absorbed before
reaching it."** The rule keeps E2's shape projections physically plausible: a shape's reach is
bounded by the density of the element that started it.

**THE DIMENSIONAL SCALING THAT UNDERLIES IT (fractal architecture §4.4):** Earth density scales
across timeframes by roughly `t^0.25`, so 15m→1H is √2 ≈ 1.41× and 15m→4H is 2.0×. The
"never more than 2 dimensions up" rule therefore creates a hard ceiling of ≈2× amplification.
Crossing further would be claiming a density relationship the physics of the fractal does not
support.

---

## §12 THE VERIFICATION HARNESSES

Three harnesses, each runnable from the IDE with no external dependency, each with a named pass
token. A harness that cannot fail is not a harness — so each carries a deliberately adversarial
input.

### HARNESS 1 — THE SCORE TABLE (pure, synthetic inputs)

```
drives:  computeConfluence(level, dimensions) and the band function
inputs:  synthetic levels with known dimension combinations
asserts: 0-2 per dimension · the 14 cap · band(confluence) == pressureDegree for every row ·
         the 7→8 boundary produces a larger ZFP jump than 11→12 (the prompt's own claim)
passToken:  "mismatches":0  AND "bandDegrees":6  (all six bands reachable)
failToken:  any mismatch > 0, or a band unreachable
adversarial: a level claiming 2/2 in all six dimensions must yield exactly 14 and EXTREME; a
             level claiming 0 everywhere must yield 0 and be DISCARDED (not painted)
```

### HARNESS 2 — THE TRANSITION TABLE (pure, synthetic inputs)

```
drives:  the §6.4.1 transition table directly
inputs:  a synthetic (currentShape, targetZfp) matrix spanning every band
asserts: BS + zfp<20 → RWL   ·  BS + 20-40 → R   ·  BS + >60 → PBS
         SS + >45 → BS       ·  SS + all<30 → SS  ·  WLS + any → BS
         R + persists → SS (reclassify)
passToken:  the <20 row's output == "RWL"
failToken:  the <20 row's output in {"R","PBS"}
adversarial: a BS with momentum described as "extreme" and a target zfp of 18 — the exact April
             20-24 shape. Momentum must NOT change the output.
```

### HARNESS 3 — THE EMPTY-CORPUS GUARD (the fabrication test)

```
drives:  buildShapeChain([]) with an empty IpZone[]
asserts: the chain is empty, the day breakdown is empty, and a NAMED refusal is recorded
passToken:  a refusal string naming the missing input
failToken:  ANY shape in the output
adversarial: run it with an empty array, a null array, and an array of one zone with confluence
             0 (which HARNESS 1 discards) — all three must refuse, not invent.
WHY IT MATTERS MOST: an engine that emits a shape with no zone behind it is the exact failure the
             prompt is built to prevent, and it is the one that looks most plausible on a chart.
```

---

## §13 WHAT v2 MUST NOT REGRESS

The v1 render is the reference the operator will compare against. These are its measured
properties, and each is an invariant:

```
┌──────────────────────────────────────────────────────────────────┐
│ INVARIANT                          v1 measured    v2 must hold  │
│ LQZ zones on the chart                  27           27 ± the E1  │
│                                                              delta    │
│ overlapping zones                         0            0            │
│ cross-side overlaps (red inside teal)    0            0            │
│ identical duplicate bands                0            0            │
│ invented per-zone text                   0            0            │
│ SMC structure tags (BOS/CHoCH/EQL/       24           24           │
│   Strong/Weak H/L)                                    │
│ the price-keyed merge survives          YES          YES          │
│ the side derives from the merged band   YES          YES          │
│ SERVED_PINE_OK (source == renderer)     PASS         PASS         │
│                                                                       │
│ THE E1 ZONES ARRIVE ALONGSIDE, NOT INSTEAD. The two geometry     │
│ producers must not collide — which is exactly Angle 2's job. A     │
│ v2 that adds a zone map and paints it over the LQZ bands at the    │
│ same levels reintroduces the 34-zone mess in a new costume.       │
└──────────────────────────────────────────────────────────────────┘
```

**THE ORDER OF THE WAVE 4 GATE MATTERS HERE.** Wave 4 is the first wave whose output PAINTS. Its
gate is not "does it look reasonable" but "do the v1 invariants still hold" — because that is the
exact moment the chart can get worse.
