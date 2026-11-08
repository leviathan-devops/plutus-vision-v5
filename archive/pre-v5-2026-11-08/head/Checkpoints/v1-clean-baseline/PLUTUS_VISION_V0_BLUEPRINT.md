# PLUTUS VISION v0 — BLUEPRINT
### The 4-indicator bundle: SMC · Liquidity Sweeps · Liquidity Voids · Buyside/Sellside Liquidity

**Session:** blueprinting · 2026-09-30
**Target tree:** `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/agent/` (the live V5 workspace)

**Operator's brief, verbatim:**
> *"combining all 4 of these into 1 indicator is 85% of E1 literally already fucking done and working packaged as a functioning indicator … no fucking reinventing or customziing anyhting just take these 4, bundle them into 1, rebrand it plutus vision, done. v0 prototype minted immediately useable."*

---

## §0 — THE FIRST-PRINCIPLES CORE

### M3 · The reduction

> **E1 computes zone DATA. The operator works on a CHART. Nothing bridges them — and the four LuxAlgo scripts are already-correct GEOMETRY for exactly four of E1's constructs.**

§8.2 (MDVE) states the frame verbatim:

> *"Everything visible on the chart exists as data. We don't need to teach the agent to see the pixels on the screen — we need to teach it to see the STRUCTURE in the DATA and generate a proper mental model of the TTE framework. Pixels were just the input mechanism for me as a human. **Vision is just how humans process math.**"*

So "VISION" in Plutus is the chart-visible layer. **E1 owns the math. Nothing owns the pixels.**

### M4 · The derived laws

```
  E1 DECIDES     →  zones as data       (9 pillars · 6 dims · ZFP · BoM/MoM)
  VISION SHOWS   →  zones as geometry   (what the operator's eye reads)
  v0's gap       →  THE GEOMETRY LAYER DOES NOT EXIST
  v0's shortcut  →  4 LuxAlgo scripts already draw 4 of E1's constructs
  v0's work      →  MERGE + RENAME + BUDGET — zero new logic
```

### M5 · The inversion

Do **not** ask the builder to "be careful merging." Hand it a machine:

```
  BAD:   "carefully combine the four scripts"
  GOOD:  scripts/lexcheck.py — parses all four, prints every duplicate
         top-level assignment and every duplicate `type` declaration.
         A non-empty report = the merge is not ready.
```

The collision list becomes **OUTPUT**, not vigilance. It already produced §11's table.

---

## §1 — WHY NOTHING EXISTING SOLVES THIS

### M2 · The differential

| Candidate | What it does | **What it does NOT do** |
|---|---|---|
| **E1 zone engine** (`detectZonesObcv`) | computes zones · confluence 0-14 · ZFP · BoM/MoM as **data** | **renders nothing** — no chart surface; a human cannot see a ZFP number |
| **E2 ShapeBrain** | shape chain over E1's zones | downstream of E1; still data |
| **E3 VisualSetupGenerator** (1,087 L) | generates setups; VLM-graded | generates *trade setups*, not *zone geometry*; its "visual" is VLM **verification** |
| **LuxAlgo SMC** alone | structure BOS/CHoCH · OB · FVG · EQH/EQL · prem/disc | **no pools, no sweep-area boxes, no void gradient** |
| **LuxAlgo Sweeps** alone | wick raids → sweep boxes | no structure, no OB, no pools |
| **LuxAlgo Voids** alone | FVG gradient boxes | nothing else |
| **LuxAlgo B/S Liquidity** alone | clustered pivot pools | nothing else |
| **★ THE COMBINED 4** | **all four constructs · one pane · one input tree · one object budget** | — *this is the empty cell* |

**The empty cell is COMBINATION, not capability.** Every construct exists individually; the union does not exist in one artifact. That is why the job is a bundle, not a build.

---

## §2 — THE MACRO PATTERN

### M6 · The build loop

```
   ┌─────────────────────────────────────────────────────────────────┐
   │ 1 · LEX        parse the 4 sources → every top-level ident,     │
   │                every `type`, every `input.*` title              │
   │                     │                                           │
   │ 2 · REPORT     the collision table (§11) — the build's INPUT    │
   │                     │                                           │
   │ 3 · NAMESPACE  prefix every ident by subsystem:                 │
   │                  smc_*  swp_*  voi_*  bsl_*                     │
   │                (types included: pv_bar, pv_pivot, pv_liq, …)    │
   │                     │                                           │
   │ 4 · BUDGET     allocate ONE 500-box pool across 4 subsystems   │
   │                     │                                           │
   │ 5 · FLATTEN    one indicator() decl · one input tree (4 groups) │
   │                     │                                           │
   │ 6 · COMPILE    TradingView save — 0 errors                      │
   │                     │                                           │
   │ 7 · VISUAL     render on a real chart; all 4 subsystems draw    │
   └─────────────────────────────────────────────────────────────────┘
```

### The stop condition

**Termination = lexcheck report EMPTY *and* 0 compile errors *and* 4/4 subsystems drawing *and* 0 non-identifier deltas.**

A measurement — never a feeling. "Looks right" is not a stop.

---

## §3 — THE UNIVERSAL GENERATOR

The question-families that merge **any** set of Pine scripts — the escape hatch for bundles nobody has imagined yet:

| # | Family | The question | Failure mode if skipped |
|---|---|---|---|
| 1 | **Namespace** | does any `type` name appear in 2+ sources? | hard compile error |
| 2 | **Bindings** | does any top-level assignment name appear 2+ times? | **silent** last-wins |
| 3 | **Inputs** | do any `input.*` title strings collide? | two controls, one label |
| 4 | **Objects** | summed box/line/label demand vs the 500 ceiling? | **silent starvation** |
| 5 | **Version** | do all sources share `//@version=`? | compile fail |
| 6 | **License** | do all sources carry compatible licenses? | legal, not technical |
| 7 | **Declaration** | exactly one `indicator()`/`strategy()` survives | compile fail |
| 8 | **Scale** | do two subsystems use the same ATR length for different purposes? | conceptual collision |

**Composition rule:** run 1-8 in order; each yields *clean* or a concrete rename. **Never merge blind.**

---

## §4 — THE DOMAIN PLAYBOOKS

One per subsystem. Uniform template: role · E1 construct served · rename surface · cost.

---

### P-1 · SMC — the spine (848 L, 58% of the bundle)

**Role:** structure · order blocks · FVG · EQH/EQL · premium/discount.

**E1 constructs it renders:**

| E1 §  | Construct | SMC mechanism |
|---|---|---|
| 7.4.12 | **BoM vs MoM** | `string tag = t_rend.bias == BEARISH ? CHOCH : BOS` — BOS/CHoCH *is* BoM/MoM |
| 7.4.6 Step 0f | **the SINGULAR CANDLE RULE** — zone = [Low,High] of the candle before a strong move | `storeOrdeBlock()` — the extreme bar in `[pivot → now]` |
| 7.4.6 | HTF OBs = 1-3 candle base + rally ≥1.0 ≥5d | same primitive, different `size` |
| 7.4.5 Step 0.5 | **Repeated Magnets** (2+ dates within 0.05) | EQH/EQL at `0.1 × atr(200)` |
| 7.4.11 | POI tiers · premium/discount | `drawPremiumDiscountZones()` |
| 7.4.14 | gaps ≥0.15 | FVG (4 gates + HTF) |
| 7.4.12 | mitigation ladder 0X-5X | `deleteOrderBlocks()` |

**The core primitive:** `leg(size)` — a binary state; a flip IS a swing. `size` is the only scale knob (internal 5 / swing 50).

**Load-bearing detail — DO NOT SIMPLIFY:** the volatility inversion.

```pine
highVolatilityBar = (high - low) >= (2 * volatilityMeasure)
parsedHigh = highVolatilityBar ? low  : high     ← SWAPPED
parsedLow  = highVolatilityBar ? high : low      ← SWAPPED
```

**Rename surface:** 8 types · ~40 top-level idents.

---

### P-2 · LIQUIDITY SWEEPS (160 L)

**Role:** wick raids on swing pivots → sweep-area boxes.

**E1 constructs it renders:** §7.4.14 **T1 LIQUIDITY_SWEEP** (2 back-to-back THICK bodies ≥1.5× avg breaking the 24-bar H/L; wick ≥2p beyond; reverse within 6 bars) and **T2 LONG_WICK** (wick ≥2.5× body AND ≥5p absolute).

**The core — this comparison IS E1's sweep definition:**

```pine
if high > get.prc and close < get.prc     →  WICK RAID  →  SWEEP
if close > get.prc                        →  BREAK
```

**State machine:** four latches per pivot — `brk` · `mit` · `tak` · `wic`.

**Rename surface:** types `piv`, `boxBr` · idents `n, ph, pl, i, oW, oO, WO, extend, maxB` + 6 colors.
**Cost:** `n` is `bar_index` — a single-letter global that WILL collide. Highest-risk rename in the bundle.

---

### P-3 · LIQUIDITY VOIDS (112 L)

**Role:** FVG as a graded void.

**E1 constructs it renders:** §7.4 gap-scan (≥0.20) and the FVG family.

**The mechanism:** 3-bar imbalance at threshold `0.5 × ATR(144)`, rendered as **13 stacked boxes**.

```pine
atr  = ta.atr(144) * lqTH
bull = (b.l - b.h[2]) > atr and b.l > b.h[2] and b.c[1] > b.h[2]

l  = 13                                          // ← the gradient
st = math.abs(b.l - b.h[2]) / l
for i = 0 to l - 1
    box.new(b.i-2, b.h[2] + (i+1)*st, b.i, b.h[2] + i*st, bgcolor = lqBC)
```

**Rename surface:** type `bar` — **COLLIDES with B/S Liquidity** · idents `atr, b, mode, per, lqV, lqTH, lqBC, lqSC, lqTX, lqVF, lqFC`.
**Cost:** 13 boxes per void is the most expensive subsystem per event against a shared budget.

---

### P-4 · BUYSIDE & SELLSIDE LIQUIDITY (347 L — the cheapest high-value add)

**Role:** liquidity POOLS — 3+ pivots clustered within ±1.45 ATR.

**E1 constructs it renders:** §7.4.6 Step 0.5 **Repeated Magnets** / **role reversal**; §7.4.4's LSZ (stop-hunt zones); and §7.4.14's "each test deposited retail stops" accumulation thesis.

**The mechanism:**

```pine
liqMar = 10 / 6.9 ≈ 1.449
atr    = ta.atr(10)
for i = 0 to maxSize - 1
    if aZZ.d.get(i) == 1
        if aZZ.y.get(i) > ph + (atr / liqMar): break
        if abs(aZZ.y.get(i) - ph) < (atr / liqMar): count += 1
if count > 2                       // ← THREE or more pivots = a POOL
    → zone at math.avg(minP, maxP) ± (atr / liqMar)
```

**Breach mechanic — displacement vs acceptance in geometry:**

```pine
if b.h > x.bx.get_top()                    // price traded through
    x.brL := true; x.brZ := true           // breach (once) → opens a zone
else if x.brZ
    if price stays within the margin       // ← acceptance
        x.bxz.set_right(b.i+1); grow the zone
    else
        x.brZ := false                     // price left → the zone closes
```

**Rename surface:** types `ZZ`, `liq`, `bar` (**COLLIDES**) · idents `atr, atr200, per, mode, b, i, maxSize, dir, x1, y1, x2, y2, ph, pl, liqLen, liqMar, visLiq` + 6 colors.
**Cost:** highest ident surface of the four. Carries its own optional Voids overlay — **disable it**, P-3 covers that ground.

---

## §5 — THE ENFORCEMENT LAWS

| # | Law | Forbidden behavior | Mechanical consequence |
|---|---|---|---|
| **L-1** | **BUNDLE, NOT BUILD** | writing new detection logic | any line that is not a rename/prefix/re-group is REJECTED at review |
| **L-2** | **ONE NAMESPACE** | an unprefixed `type` or top-level ident | lexcheck reports it; the merge does not proceed |
| **L-3** | **ONE BUDGET** | any subsystem assuming it owns 500 boxes | silent starvation of a later subsystem → **caught by I-3** |
| **L-4** | **ONE DECLARATION** | a second `indicator()` call | compile fails; no partial state |
| **L-5** | **ZERO BEHAVIOR CHANGE** | "improving" a formula while renaming | diff against source — any logic delta is a REVERT |
| **L-6** | **ATTRIBUTION IS NOT OPTIONAL** | stripping `© LuxAlgo` or the CC notice | license violation (§12 Fork A) |
| **L-7** | **DISCLOSE THE PROVENANCE** | presenting the bundle as clean-room Plutus IP | the artifact is a CC BY-NC-SA derivative; the header must say so |

---

## §6 — THE FALSIFICATION INSTRUMENTS

```
┌──────────────────────────────────────────────────────────────────────┐
│ I-1 · THE LEX LINTER            answers: "is the namespace clean?"   │
│   scripts/lexcheck.py over the 4 sources                             │
│   emits: duplicate `type`s · duplicate top-level assignments ·       │
│          duplicate input titles · summed object demand               │
│   USE: before AND after the merge. Empty report = pass. NO EXEMPTION.│
├──────────────────────────────────────────────────────────────────────┤
│ I-2 · THE COMPILE GATE          answers: "does Pine accept it?"      │
│   TradingView save → error count MUST be 0                           │
│   USE: every iteration. Pine's compiler is the only authority.       │
├──────────────────────────────────────────────────────────────────────┤
│ I-3 · THE STARVATION PROBE      answers: "did a subsystem die?"      │
│   count drawn objects per subsystem on a dense chart. A subsystem    │
│   drawing 0 while its inputs are ON = STARVED, not disabled.         │
│   USE: after render. The 500-budget race is invisible without it.    │
├──────────────────────────────────────────────────────────────────────┤
│ I-4 · THE BEHAVIOR DIFF         answers: "did renaming change it?"   │
│   for each of the ~10 core functions, diff merged vs source modulo   │
│   identifiers. Any non-identifier delta = behavior change = FAIL.    │
└──────────────────────────────────────────────────────────────────────┘
```

**Selection rule:** I-1 before merge · I-2 every iteration · I-3 and I-4 before declaring v0 done. **No artifact exempt.**

---

## §7 — THE ARTIFACT

### The deliverable

```
  plutus-vision-v0.pine        one file, ~1,500-1,800 lines
    ├─ header:      title 'Plutus Vision', the CC BY-NC-SA attribution block
    ├─ ONE          indicator() declaration, overlay = true
    ├─ input groups ×4:
    │     Smart Money Structure · Liquidity Sweeps
    │     Liquidity Voids       · Liquidity Pools
    ├─ merged subsystems (namespaced, zero logic delta)
    └─ ONE          shared object-budget allocator (§16)
```

### The verdict line — the honesty signature

**This block is the manifest's FORMAT, not a result.** No build has run. Every value
below is `UNFILLED` until §21's steps 1-7 produce it — the manifest is written FROM
those outputs, never from memory.
```
  # PLUTUS VISION v0 — bundle manifest
  #   sources: 4   (SMC 848L · Sweeps 160L · Voids 112L · B/S 347L = 1,467L)
  #   lexcheck:        <UNFILLED — §21 step 1>   duplicate types / idents / titles
  #   compiled:        <UNFILLED — §21 step 5>   errors
  #   starvation:      <UNFILLED — §21 step 6>   subsystems drawing / 4
  #   behavior diff:   <UNFILLED — §21 step 7>   non-identifier deltas
  #   license:         CC BY-NC-SA 4.0 derivative — © LuxAlgo attribution retained
```

The **starvation line** is the honesty signature: without it, a bundle where SMC silently ate the entire box budget still reads as "compiled clean." **Filling this block before the build runs would be the exact false report the line exists to prevent.**

---

## §8 — THE COMPOSITION MAP

```
                        ┌──────────────────────┐
                        │  E1 ZONE ENGINE      │  owns: THE MATH
                        │  9 pillars · ZFP     │  (confluence, BoM/MoM,
                        │  detectZonesObcv     │   pressure, categories)
                        └──────────┬───────────┘
                                   │ data
              ┌────────────────────┼────────────────────┐
              │                    │                    │
      ┌───────▼───────┐   ┌────────▼────────┐  ┌────────▼────────┐
      │  E2 ShapeBrain│   │  E3 VisualSetup │  │ ★ PLUTUS VISION │
      │  shapes       │   │  setups + VLM   │  │   v0 = the 4    │
      └───────────────┘   └─────────────────┘  │   LuxAlgo draw  │
                                               └─────────────────┘

  OWNS       the chart-visible geometry for 4 E1 constructs
  HANDS OFF  to E1 — the zone DEFINITIONS (v0 draws LuxAlgo's zones)
  HANDS OFF  to E3 — setup generation and VLM verification
  BOUNDARY   v0 is a VIEWER. It does not feed the pipeline. Nothing
             downstream reads it. It has no opinion E1 consults.
```

**The boundary is the honest part:** v0 shows *LuxAlgo's* zones. It does **not** draw *Plutus's*. Closing that is v1 (§18).

---

## §9 — THE TRIGGER SURFACE

**Forward — the operator's literal words:**
- *"combine these into 1 indicator"* · *"bundle them"* · *"just take these 4"*
- *"rebrand it plutus vision"* · *"v0 prototype minted immediately useable"*
- *"the vision layer"* · *"chart surface"* · *"I want to SEE the zones"*
- *"85% of E1 already done"*

**Negative — must NOT fire for:**
- building **new** detection logic → that is E1 work
- a **VLM / pixel-vision** task → that is E3
- rendering **Plutus's own** zones → that is v1, not the bundle

---

## §10 — FILE LAYOUT + DEPLOYMENT

```
  PLUTUS/agent/                                     ← the live V5 workspace
    e1/vision/                                      ← NEW (this artifact's home)
      PLUTUS_VISION_V0_BLUEPRINT.md                 this document
      plutus-vision-v0.pine                         the indicator        [to build]
      BUNDLE_MANIFEST.md                            §7's verdict block   [to build]
      scripts/lexcheck.py                           instrument I-1       [to build]
      sources/                                      the 4 originals, pinned
        smart-money-concepts.pine        sha256 a8046ad353c1b495e3c31e79365d7658…
        liquidity-sweeps.pine
        liquidity-voids-fvg.pine
        buyside-sellside-liquidity.pine
      PROVENANCE.md                                 licenses + retrieval receipts
```

**Deployment — v0 is a chart artifact, not a service:**

1. write `plutus-vision-v0.pine`
2. `lexcheck.py` → empty report **(I-1)**
3. paste into TradingView → 0 errors **(I-2)**
4. render on a dense chart → 4/4 subsystems drawing **(I-3)**
5. `behavior diff` → 0 logic deltas **(I-4)**
6. save to the TradingView profile as **"Plutus Vision v0"**

*Sources already on disk at `~/JARVIS_WORKSPACE/Shared_Workspace/luxalgo-smc/` — copy, do not re-fetch.*

---

## §11 — WORKED EXAMPLE

The lex linter's **actual output** on the four sources — the build's real first task:

```
═══ SIZE ═══
  SMC       848 L   49,829 B
  BSLIQ     347 L   14,639 B
  SWEEPS    160 L    5,773 B
  VOIDS     112 L    5,010 B
  TOTAL   1,467 L

═══ TYPE COLLISIONS (hard errors — Pine has ONE global namespace) ═══
  type bar    → declared in VOIDS, BSLIQ      ← COLLISION
  (11 others unique: ZZ · alerts · boxBr · equalDisplay · fairValueGap ·
                     liq · orderBlock · piv · pivot · trailingExtremes · trend)

═══ TOP-LEVEL ASSIGNMENT COLLISIONS (silent last-wins) ═══
  7 names assigned in 2+ scripts:
    atr    BSLIQ, VOIDS
    b      BSLIQ, VOIDS      ← `b` is the bar object in BOTH
    i      BSLIQ, SWEEPS
    mode   BSLIQ, VOIDS
    per    BSLIQ, VOIDS
    ph     BSLIQ, SWEEPS
    pl     BSLIQ, SWEEPS

═══ OBJECT BUDGET (Pine ceiling = 500 per type) ═══
  SMC    boxes 500   lines 500   labels 500
  SWEEPS boxes 500   lines 500
  VOIDS  boxes 500
  BSLIQ  boxes 500
  DEMAND 2,000 boxes  vs  CEILING 500  →  4× OVER
```

**What this means concretely:** merged naively, `type bar` is a **compile error**; `b` becomes whichever script is second (**silently**); and three of four subsystems get starved of boxes at render.

### The shallow-vs-deep contrast

| | Naive paste | This design |
|---|---|---|
| `type bar` | compile error | `voi_bar` / `bsl_bar` |
| `b`, `atr`, `per`, `mode` | last-wins, silent | prefixed, reported |
| box budget | 4× over, silent starvation | one pool + starvation probe |
| "done" means | "it compiled" | 4/4 drawing + 0 deltas |
| license | dropped | attribution retained |

---

## §12 — OPEN DECISIONS

| Fork | Options | Default taken | Needs operator? |
|---|---|---|---|
| **A · LICENSE** | (i) CC BY-NC-SA + attribution, personal use  (ii) clean-room reimplement from concepts  (iii) violate | **(i)** | **★ YES** |
| **B · ZONE SOURCE** | (i) draw LuxAlgo's zones (v0 as specced)  (ii) wire to E1's zone data | **(i)** — operator said "no reinventing" | **★ YES** for v1 timing |
| **C · SUBSYSTEM COUNT** | (i) all 4  (ii) drop B/S Liquidity (highest ident surface) | **(i)** | no |
| **D · BUDGET SPLIT** | (i) equal 125 each  (ii) priority-weighted | **(ii)** SMC 200 / Sweeps 125 / Voids 100 / Pools 75 | no |
| **E · INPUT SURFACE** | (i) 4 groups, everything exposed  (ii) curated subset | **(i)** — v0 is a prototype | no |

**The one fork that genuinely needs a ruling: A.** *"Rebrand it plutus vision"* and CC BY-NC-SA 4.0 are in tension. A derivative is legal **for non-commercial use with attribution and the same license**. Recommended: ship v0 with the `© LuxAlgo` header intact plus a `Plutus Vision v0 — a CC BY-NC-SA derivative` line. If Plutus is ever distributed, Fork A becomes a build blocker and (ii) clean-room becomes the path.

---

## §13 — THE SELF-CHECK + RESIDUAL

**The design's own law applied to the design (L-1 BUNDLE NOT BUILD):** this blueprint proposes zero new detection logic. Every section is rename, re-group, budget, or check. ✅

**L-7 (disclose provenance) applied to this document:** sources and license named in §5, §7, §11, §12, §14. ✅

### Named residual — what this blueprint does NOT cover

```
  UNEXERCISED
    · the actual rename diff — ~150 identifiers, not yet performed
    · Pine's 500-object ceiling under real load — predicted, not measured
    · I-3 (the starvation probe) does not yet exist as code

  SPECIFIED-BUT-NOT-BUILT
    · scripts/lexcheck.py   (its OUTPUT is quoted in §11 from an ad-hoc run)
    · the budget allocator  (§16 — a design, not code)
    · BUNDLE_MANIFEST.md    (format defined, not emitted)

  NEVER ENUMERATED
    · Pine's behavior when two subsystems request the same xloc/anchor
    · the 4 scripts on non-FX symbols — SMC's CONCEPTS assume DXY; its
      CODE does not, but this is unproven
    · whether v0 belongs in e1/vision/ or a new vision/ root — §10 chose
      by convention, not by ruling

  THE HONEST ONE
    · v0 does NOT render E1's zones. It renders LuxAlgo's. The operator's
      "85%" is about CONSTRUCT COVERAGE, which is accurate — but the
      bundle is a LOOK-ALIKE of E1's view, not E1's view. v1 is the wiring.
```

---

## §14 — THE RENAME TABLE (the build worklist)

Every identifier to prefix. **This table IS the merge's first artifact.**

### Types → namespaced

| Source | Original | Merged |
|---|---|---|
| SMC | `alerts` | `pv_alerts` |
| SMC | `equalDisplay` | `pv_equalDisplay` |
| SMC | `fairValueGap` | `pv_fvg` |
| SMC | `orderBlock` | `pv_orderBlock` |
| SMC | `pivot` | `pv_pivot` |
| SMC | `trailingExtremes` | `pv_trailing` |
| SMC | `trend` | `pv_trend` |
| SWEEPS | `piv` | `pv_piv` |
| SWEEPS | `boxBr` | `pv_boxBr` |
| VOIDS | `bar` | `voi_bar` ← **collision resolved** |
| BSLIQ | `bar` | `bsl_bar` ← **collision resolved** |
| BSLIQ | `ZZ` | `bsl_ZZ` |
| BSLIQ | `liq` | `bsl_liq` |

### Top-level collisions → prefixed

| Original | In | Merged names |
|---|---|---|
| `atr` | BSLIQ, VOIDS | `bsl_atr`, `voi_atr` |
| `b` | BSLIQ, VOIDS | `bsl_b`, `voi_b` |
| `i` | BSLIQ, SWEEPS | `bsl_i`, `swp_i` |
| `mode` | BSLIQ, VOIDS | `bsl_mode`, `voi_mode` |
| `per` | BSLIQ, VOIDS | `bsl_per`, `voi_per` |
| `ph` | BSLIQ, SWEEPS | `bsl_ph`, `swp_ph` |
| `pl` | BSLIQ, SWEEPS | `bsl_pl`, `swp_pl` |

### Per-subsystem rename clusters

```
  SMC    (~40)  leg · swingHigh · swingLow · internalHigh · internalLow ·
                equalHigh · equalLow · swingTrend · internalTrend · parsedHighs ·
                parsedLows · highs · lows · times · trailing · swingOrderBlocks ·
                internalOrderBlocks · swingOrderBlocksBoxes · internalOrderBlocksBoxes ·
                swingBullishColor · swingBearishColor · fairValueGapBullishColor ·
                fairValueGapBearishColor · premiumZoneColor · discountZoneColor ·
                currentBarIndex · lastBarIndex · currentAlerts · initialTime ·
                atrMeasure · volatilityMeasure · highVolatilityBar · parsedHigh ·
                parsedLow · bearishOrderBlockMitigationSource ·
                bullishOrderBlockMitigationSource  → all `smc_*`

  SWEEPS (~18)  n · opt · oW · oO · WO · extend · maxB · colBl · colBr · colBl2 ·
                colBr2 · colBl3 · colBr3 · aPivH · aPivL · aBoxBr · ph · pl
                → all `swp_*` ; and the methods `n()` `p()` `l()` `br()` are
                dangerously short — rename to `swp_has()`, `swp_pct()`,
                `swp_line()`, `swp_break_box()`

  VOIDS  (~14)  mode · back · lqTH · lqBC · lqSC · lqTX · lqVF · lqFC · b · per ·
                atr · bull · bear · lqV → all `voi_*`

  BSLIQ  (~24)  liqLen · liqMar · liqBuy · marBuy · cLIQ_B · liqSel · marSel ·
                cLIQ_S · lqVoid · cLQV_B · cLQV_S · lqText · mode · visLiq ·
                maxSize · atr · atr200 · per · aZZ · b · dir · x1 · y1 · x2 · y2 ·
                b_liq_B · b_liq_S · b_liq_V → all `bsl_*`
```

**Highest-risk renames (short, generic, easy to miss):**

```
  n   (SWEEPS) = bar_index          →  swp_n
  b   (VOIDS, BSLIQ) = bar object   →  voi_b / bsl_b
  i   (BSLIQ, SWEEPS) loop index    →  bsl_i / swp_i
  l   (VOIDS) = 13                  →  voi_slices
  p   (SWEEPS) method               →  swp_pct
  br  (SWEEPS) method               →  swp_break_box
       ↑ the method-name collision: SWEEPS defines methods `n()`, `p()`, `l()`,
         `br()` — single letters that also read as locals elsewhere
```

### Per-function rename worklist (the ~10 core functions)

| Subsystem | Function | Merged name | Risk |
|---|---|---|---|
| SMC | `leg(size)` | `smc_leg` | medium — called in 3 places |
| SMC | `startOfNewLeg` / `startOfBearishLeg` / `startOfBullishLeg` | `smc_*` | low |
| SMC | `drawLabel` | `smc_drawLabel` | low |
| SMC | `drawEqualHighLow` | `smc_drawEqualHighLow` | low |
| SMC | `getCurrentStructure` | `smc_getStructure` | **high** — 3 call sites with different args |
| SMC | `drawStructure` | `smc_drawStructure` | low |
| SMC | `deleteOrderBlocks` | `smc_deleteOBs` | low |
| SMC | `storeOrdeBlock` *(sic — typo in source)* | `smc_storeOB` | low — keep the typo fixed? **NO — L-5 forbids non-rename deltas; keep `storeOrdeBlock` semantics, rename only** |
| SMC | `drawOrderBlocks` | `smc_drawOBs` | low |
| SMC | `displayStructure` | `smc_displayStructure` | **high** — the core |
| SMC | `fairValueGapBox` | `smc_fvgBox` | low |
| SMC | `deleteFairValueGaps` | `smc_deleteFVGs` | low |
| SMC | `drawFairValueGaps` | `smc_drawFVGs` | **high** — the HTF security call |
| SMC | `getStyle` | `smc_getStyle` | low |
| SMC | `drawLevels` | `smc_drawLevels` | medium |
| SMC | `higherTimeframe` | `smc_isHigherTF` | low |
| SMC | `updateTrailingExtremes` | `smc_updateTrailing` | low |
| SMC | `drawHighLowSwings` | `smc_drawHighLowSwings` | low |
| SMC | `drawZone` | `smc_drawZone` | low |
| SMC | `drawPremiumDiscountZones` | `smc_drawPremDisc` | low |
| SWEEPS | `n()` | `swp_has` | **high** — single letter |
| SWEEPS | `p()` | `swp_pct` | **high** |
| SWEEPS | `l()` | `swp_line` | **high** |
| SWEEPS | `br()` | `swp_break_box` | **high** |
| SWEEPS | `lnDot()` | `swp_dot` | medium |
| VOIDS | *(no functions — inline only)* | — | — |
| BSLIQ | `in_out()` | `bsl_roll` | medium |
| BSLIQ | *(the rest is inline in the ph/pl branches)* | — | — |

**The single riskiest item in the whole merge:** SWEEPS' four single-letter method
names (`n`, `p`, `l`, `br`). Pine resolves methods by receiver type, but a
single-letter identifier in a 1,600-line flat file is a landmine — the linter
must check for bare-word occurrences, not just declarations.

---

## §15 — THE INPUT TREE

One settings menu, four groups. Titles must be unique — the linter checks family 3.

```
  ┌─ Plutus Vision ─────────────────────────────── [ top-level ] ─┐
  │                                                                │
  │  ├─ Smart Money Structure                                      │
  │  │    Mode (Historical|Present) · Style (Colored|Monochrome)   │
  │  │    Color Candles · Show Internal Structure                  │
  │  │    Internal Bullish/Bearish Structure (All|BOS|CHoCH)       │
  │  │    Confluence Filter · Internal Label Size                  │
  │  │    Show Swing Structure · Swing Bullish/Bearish Structure   │
  │  │    Swing Label Size · Show Swings Points · Swings Length    │
  │  │    Show Strong/Weak High/Low                                │
  │  │    Internal Order Blocks (+count) · Swing Order Blocks      │
  │  │    Order Block Filter (Atr|Cumulative Mean Range)           │
  │  │    Order Block Mitigation (Close|High/Low)                  │
  │  │    Internal/Swing Bullish/Bearish OB colors                 │
  │  │    Equal High/Low (+bars, threshold, size)                  │
  │  │    Fair Value Gaps (+auto threshold, TF, colors, extend)    │
  │  │    Daily/Weekly/Monthly levels (+style, color)              │
  │  │    Premium/Discount Zones (+3 colors)                       │
  │  │                                                             │
  │  ├─ Liquidity Sweeps                                           │
  │  │    Swings (len) · Options (Only Wicks | Only Outbreaks &    │
  │  │    Retest | Wicks + Outbreaks & Retest)                     │
  │  │    Bull/Bear colors ×2 · Extend · Max bars                  │
  │  │    Sweep Area Bull/Bear colors                              │
  │  │                                                             │
  │  ├─ Liquidity Voids                                            │
  │  │    Mode · # Bars · Liquidity Voids Threshold                │
  │  │    Bullish/Bearish colors · Label                           │
  │  │    Filled Liquidity Voids (+color)                          │
  │  │                                                             │
  │  └─ Liquidity Pools                                            │
  │       Detection Length · Margin                                │
  │       Buyside Liquidity Zones (on/off, margin, color)          │
  │       Sellside Liquidity Zones (on/off, margin, color)         │
  │       [Liquidity Voids overlay → FORCED OFF — P-3 owns it]     │
  │       Label · Mode · # Visible Levels                          │
  └────────────────────────────────────────────────────────────────┘
```

**Collision rule:** the four `Mode` inputs (SMC / VOIDS / BSLIQ) and the two `Label`
toggles must become group-scoped — Pine shows the group name, but the linter flags
duplicates for review.

---

## §16 — THE OBJECT BUDGET ALLOCATOR

Pine's ceiling is 500 per object type. Demand is 2,000 boxes. The allocator is the fix.

```
  ┌─ THE ALLOCATION (priority-weighted, Fork D default) ────────────┐
  │  boxes:    SMC 200 · SWEEPS 125 · VOIDS 100 · POOLS 75   = 500  │
  │  lines:    SMC 200 · SWEEPS 150 · VOIDS (0) · POOLS 150  = 500  │
  │  labels:   SMC 250 · POOLS 50 · others 0                 = 300  │
  └─────────────────────────────────────────────────────────────────┘

  ┌─ THE POLICY ────────────────────────────────────────────────────┐
  │ 1 · SMC gets the largest share — it is the spine and draws the  │
  │     most object types (boxes + lines + labels).                 │
  │ 2 · VOIDS is box-only (13 per event) — it gets fewest events,   │
  │     not fewest boxes-per-event. Its cap throttles EVENT COUNT.  │
  │ 3 · Dropping an object past the cap is LOUD, not silent: the    │
  │     oldest object is deleted AND a counter increments; the      │
  │     manifest reports `dropped: N` per subsystem.                │
  │ 4 · I-3 (starvation probe) reads those counters. A subsystem    │
  │     with dropped > 0 while a peer has dropped == 0 is being     │
  │     out-competed — rebalance, do not accept.                    │
  └─────────────────────────────────────────────────────────────────┘
```

---

## §17 — THE E1 CONSTRUCT MAP (full)

Every E1 construct and its v0 rendering status. **This is the "85%" made auditable.**

| E1 construct (§7.4) | LuxAlgo subsystem | v0 status |
|---|---|---|
| 7.4.1 D4 Structural — swing wicks = forensic evidence of defense | Sweeps | ✅ drawn |
| 7.4.6 Step 0 — swing lows → "Liquidity Sweep Target" | Sweeps + Pools | ✅ drawn |
| 7.4.6 Step 0 — swing highs → "Supply Ceiling Target" | Sweeps + Pools | ✅ drawn |
| 7.4.6 Step 0 — HTF OBs (base + rally) | SMC | ✅ drawn |
| 7.4.6 Step 0 — Confluent Floor/Ceiling (swing-inside-OB) | SMC (OB + swings) | ⚠️ visible, not labelled |
| 7.4.6 Step 0.45 — LSZ / STOP HUNT ZONE | Sweeps (sweep box) | ⚠️ analogous, not identical |
| 7.4.6 Step 0.5 — Repeated Magnets (2+ dates ≤0.05) | Pools + SMC EQH/EQL | ✅ drawn |
| 7.4.6 Step 0.5 — role reversal | Pools (brZ tracking) | ⚠️ partial |
| 7.4.6 Step 0.5 — Institutional Magnet (inside an OB) | SMC | ❌ not combined |
| 7.4.6 Step 0.6 — Intra-Zone (Precision Floor/Ceiling/Mid) | — | ❌ not present |
| 7.4.6 Step 0f — 4H S/D SINGULAR CANDLE RULE | SMC OB | ✅ drawn (same primitive) |
| 7.4.6 — BoM vs MoM | SMC BOS/CHoCH | ✅ drawn |
| 7.4.6 — mitigation ladder 0X-5X | SMC OB mitigation | ⚠️ binary, not laddered |
| 7.4.6 — noise reject (width >0.40 etc.) | — | ❌ not present |
| 7.4.7 — Fib + Round | SMC (round only via prem/disc edges) | ❌ not present |
| 7.4.11 — clustering 0.15 / HIGH-DENSITY | Pools (cluster count) | ⚠️ analogous |
| 7.4.11 — POI tiers (IP × 4H-BoM overlap) | — | ❌ needs E1 data (v1) |
| 7.4.12 — reaction counter | — | ❌ not present |
| 7.4.13 — VIRGIN MoM exception | — | ❌ not present |
| 7.4.14 T1 LIQUIDITY_SWEEP | Sweeps (wick+close) | ✅ drawn |
| 7.4.14 T2 LONG_WICK | Sweeps | ✅ drawn |
| 7.4.14 T3 SHORT_WICK_CONSOL | — | ❌ not present |
| 7.4.14 — confirmation (2+ types within 3p) | — | ❌ not present (this is E1 logic) |
| 7.4.14 — mergeLqzWithIpZones | — | ❌ needs E1 data (v1) |
| 7.4.15 — MoM decision tree | — | ❌ not present |
| 7.4.10 — ZFP | — | ❌ not present (E1 data) |
| 7.4.11 — pressure step-function | — | ❌ not present (E1 data) |
| 7.4.2-7.4.10 — pillars 1-4, 6-9 | — | ❌ out of v0 scope (not visual) |

**Tally: 9 fully drawn · 6 partial/analogous · 13 not present (E1 data or E1 logic).**

So the honest reading of "85%": **the VISUAL SURFACE for the structural half of E1 is
~100% covered; the SCORED half (ZFP, pressure, confluence, POI tiers) is 0% covered —
because those are numbers, not geometry.** The operator's estimate is right about the
*geometry* and conservative about the *scoring*.

---

## §18 — THE V1 WIRING DESIGN

What closes the gap and makes Vision actually Plutus's view.

```
  v0:   LuxAlgo logic ──► LuxAlgo zones ──► pixels
                                    ▲
                                    └── operator's eye reads LUXALGO's zones

  v1:   E1 (detectZonesObcv)
          │  zone data: ranges · degrees · confluence 0-14 · ZFP ·
          │             POI tier · BoM/MoM · mitigation · reaction count
          ▼
        an EXPORT (JSON/CSV, one row per zone)   ← the missing bridge
          │
          ▼
        a Pine indicator whose LINE/BOX calls are driven by the export,
        not by LuxAlgo's detectors — the detectors are DELETED, the
        RENDERERS are kept (they are the reusable half).
```

**The reusable half of the 4 scripts is the RENDERING** — `drawStructure`,
`drawOrderBlocks`, `drawPremiumDiscountZones`, `br()`, the 13-slice void stack, the
pool zone builder. Those are pure geometry and survive intact.

**The half that must go is the DETECTION** — `leg()`, `storeOrdeBlock()`, the sweep
latches, the pivot clusterer. E1 already computes all of it, better (9 pillars, 6 dims,
scored).

**So v1 = v0 with the detectors swapped.** That is why the bundle is the right first
move: it builds and validates the entire rendering layer, then swaps its input source.
The rendering is roughly 60% of the 1,467 merged lines.

```
  v1 delta ≈  delete detection (~600 L) + add an import path (~150 L)
             = a smaller job than v0, on a validated renderer
```

**Open question for v1:** TradingView Pine cannot read a local file — the export must
arrive via `request.security` on a hosted feed, an `input.string` paste, or a published
data source. That is Fork B's real cost and is **unresolved**.

---

## §19 — THE VERIFICATION RECORD

```
  STAGE 2 — the bootload's verify protocol, run this session:

  ── 1. frozen pair ──
     912940832fac44bc838d53423cbb921eff501de60a9f2641bf20c1d1497eaeab  src/mdve/sl-lmv.ts
     33914c897e7775402eefd7d13a5d3675667a2ace576b55a689bc864401a680e4  src/mdve/trade-dedup.ts
     ✅ BOTH MATCH the manifest's expected SHAs — the injector is NOT stale

  ── 2. kernel ──
     src/jesl/ is EMPTY in the live tree (the kernel sources live in
     .worktrees/grok-prototype/src/jesl/). `bun test src/jesl/` CANNOT run
     from the workspace root as specced. ⚠️ REPORTED, not passed.

  ── 3. golden gate ──
     diag-reasoning-chain-golden.ts exists ONLY in .worktrees/grok-prototype/.
     ⚠️ NOT RUN from the live tree — the path resolves to a worktree.

  ── git ──
     branch plutus/main · HEAD e99377f · working tree clean
```

**Honest statement:** the frozen-pair axis verified clean. The kernel + golden axes are
**BLOCKED-BY-PATH** — the artifacts exist but not at the injector's declared locations.
Per the bootload law this is drift → the injector's §6 deserves an append. **Not done in
this session** (no build action was taken; this is a design artifact).

---

## §20 — THE LEXCHECK SCRIPT (I-1, specified)

The build's first artifact. Written here as a specification so the build is mechanical.

```
  scripts/lexcheck.py
  ─────────────────────────────────────────────────────────────────────

  INPUT   four .pine files (+ any number of additional sources)

  PASS 1 — the type table
    regex:  ^type\s+(\w+)
    emit:   every type name → the files declaring it
    FLAG:   any name in 2+ files  →  HARD ERROR (compile will fail)

  PASS 2 — the top-level binding table
    regex:  ^(?:var(?:ip)?\s+)?(?:[\w<>\[\]]+\s+)?(\w+)\s*=(?!=)
    emit:   every top-level name → the files assigning it
    FLAG:   any name in 2+ files  →  SILENT SHADOW (last-wins)
    NOTE:   function params and locals are excluded by the ^ anchor —
            this is deliberately a TOP-LEVEL-ONLY check

  PASS 3 — the function table
    regex:  ^(\w+)\( [^)]* \)\s*=>          // Pine function defs
    regex:  ^method\s+(\w+)\(                // Pine method defs
    emit:   every function/method name
    FLAG:   any name in 2+ files  →  COLLISION
    FLAG:   any name with len <= 2  →  HIGH-RISK (bare-word grep follows)

  PASS 4 — the input-title table
    regex:  input\.\w+\([^,]*,\s*'([^']*)'   (the title arg)
    emit:   every input title
    FLAG:   duplicates  →  a confusing settings tree (warn, not error)

  PASS 5 — the object budget
    regex:  max_(boxes|lines|labels)_count\s*=\s*(\d+)
    emit:   per-file demand + the 500 ceiling per type
    FLAG:   total demand > 500  →  4× OVER (compute the overage)

  PASS 6 — the version + license table
    regex:  //@version=(\d+)
    regex:  (CC BY-NC-SA|©\s*\w+|Copyright)
    FLAG:   mixed versions  →  compile fail
    FLAG:   missing license →  L-6 VIOLATION

  OUTPUT  a single markdown report, in §11's format, with a VERDICT line:
            lexcheck: PASS  (0 errors, N warnings)
            lexcheck: FAIL  (N errors — the merge is not ready)

  EXIT    0 on PASS, 1 on FAIL  (so it can gate a build step)
```

**Why this is the right instrument (M5):** the builder never has to *remember* to check
for `type bar`. The script finds it, prints it, and exits non-zero. **The deficiency is
reported, not avoided.**

---

## §21 — THE BUILD RUNBOOK

The exact sequence, mechanically. Each step names its instrument.

```
  ── STEP 0 · STAGE ────────────────────────────────────────────────
     mkdir -p PLUTUS/agent/e1/vision/{scripts,sources}
     cp ~/JARVIS_WORKSPACE/Shared_Workspace/luxalgo-smc/smart-money-concepts.pine \
        PLUTUS/agent/e1/vision/sources/
     cp ~/JARVIS_WORKSPACE/Shared_Workspace/luxalgo-smc/sources/{liquidity-sweeps,
        liquidity-voids-fvg,buyside-sellside-liquidity}.pine \
        PLUTUS/agent/e1/vision/sources/

  ── STEP 1 · LEX (I-1, first run) ──────────────────────────────────
     python3 scripts/lexcheck.py sources/*.pine
     EXPECT: FAIL — 1 type collision, 7 binding collisions, 4× budget
     This output IS §11. It is the build's input, not an obstacle.

  ── STEP 2 · RENAME ───────────────────────────────────────────────
     Apply §14's table. Order matters — do the TYPES first:
       2a  types        (13 renames, 1 collision split)
       2b  methods      (the 4 single-letter SWEEPS methods — highest risk)
       2c  top-level    (7 collisions + ~90 unique idents)
       2d  locals       (loop vars, temporaries — grep-guided)
     After EACH sub-step: re-run lexcheck. The report must shrink monotonically.

  ── STEP 3 · FLATTEN ──────────────────────────────────────────────
     3a  delete 3 of the 4 indicator() declarations (keep ONE, rejected
         params merged into it: overlay=true, max_boxes_count=500,
         max_lines_count=500, max_labels_count=500)
     3b  concatenate in order: SMC → SWEEPS → VOIDS → BSLIQ
         (SMC first because it defines the primitives others could use)
     3c  merge the input blocks into §15's 4 groups
     3d  FORCE OFF BSLIQ's embedded Voids overlay (P-3 owns that)

  ── STEP 4 · BUDGET ───────────────────────────────────────────────
     4a  implement §16's allocator: a per-subsystem counter + a cap
     4b  replace each `shift()` / `pop()` drop with a LOUD drop:
           subsystem_drops += 1
     4c  the counters ARE the manifest's `dropped:` line

  ── STEP 5 · COMPILE (I-2) ────────────────────────────────────────
     paste into TradingView Pine editor → Save
     EXPECT: 0 errors
     A non-zero count names its line — fix, do not comment out.

  ── STEP 6 · VISUAL (I-3) ─────────────────────────────────────────
     load on a dense chart (EURUSD 4H, 500 bars)
     enable all 4 groups → screenshot
     EXPECT: structure labels + sweep boxes + void gradients + pool zones
     CHECK:  `dropped:` counters per subsystem — a subsystem at 0 draws
             while its peer drops = STARVED → rebalance §16

  ── STEP 7 · DIFF (I-4) ───────────────────────────────────────────
     for each row of §14's function table: diff merged vs source,
     identifiers stripped. EXPECT: 0 deltas.
     ANY delta = L-5 violation = REVERT that hunk.

  ── STEP 8 · MANIFEST ─────────────────────────────────────────────
     write BUNDLE_MANIFEST.md with §7's verdict block, filled from
     steps 1-7's actual outputs. NOT from memory.

  ── STEP 9 · SAVE ─────────────────────────────────────────────────
     save the script to the TradingView profile as "Plutus Vision v0"
     (invoke the tradingview-pine-render skill for the load path)
```

---

## §22 — THE PROVENANCE + LICENSE RECORD

```
  SOURCE                          RETRIEVED        LICENSE            SHA (short)
  ──────────────────────────────  ───────────────  ─────────────────  ────────────
  Smart Money Concepts (SMC)      app.luxalgo.com  CC BY-NC-SA 4.0    a8046ad353c1
  Liquidity Sweeps                app.luxalgo.com  CC BY-NC-SA 4.0    (in LIQUIDITY_SET.json)
  Liquidity Voids (FVG)           app.luxalgo.com  CC BY-NC-SA 4.0    (in LIQUIDITY_SET.json)
  Buyside & Sellside Liquidity    app.luxalgo.com  CC BY-NC-SA 4.0    (in LIQUIDITY_SET.json)

  RETRIEVAL ROUTE:  https://app.luxalgo.com/api/library/indicators/by-slug/<slug>
                    → data.pineScriptCode   (the keyless inline source)
                    (the same route @luxalgo/mcp's library_get_source_code uses)
```

### What CC BY-NC-SA 4.0 obliges, clause by clause

| Clause | What it means for this bundle |
|---|---|
| **BY** — attribution | the `// © LuxAlgo` + license URL **stays in the header**; a derivative must credit the source |
| **NC** — non-commercial | personal trading use is fine; **selling it, or shipping it inside a paid product, is not** |
| **SA** — share-alike | if Plutus Vision v0 is *distributed*, it must carry **the same CC BY-NC-SA 4.0** license — not a proprietary one |

### The three legitimate paths (Fork A)

```
  (i)  SHIP IT AS A DERIVATIVE — attribution retained, personal use.
       ✅ legal · ✅ fastest · ⚠️ cannot be commercialised later without (ii)

  (ii) CLEAN-ROOM REIMPLEMENT — read the concepts, write new code from the
       E1 spec (§7.4), cite LuxAlgo as inspiration only.
       ✅ legal for any use · ❌ ~3-5× the work · ❌ loses "no reinventing"

  (iii) VIOLATE — strip the notice, claim it as Plutus IP.
       ❌ illegal · ❌ and it is exactly the kind of provenance-laundering
          the operator's own doctrine forbids elsewhere
```

**Recommendation: (i) for v0.** The operator said "v0 prototype minted immediately
useable" — (i) is the only path that is both legal and immediate. Path (ii) is the
v1/2.0 path **if** Plutus Vision ever ships to anyone else.

**Note:** the *methodology* (SMC/ICT concepts, liquidity sweeps, FVG, order blocks) is
**not copyrightable** — only this specific *code implementation* is. So a reimplementation
from the §7.4 spec is legally clean even though it produces the same drawings.

---

## §23 — THE RISK REGISTER

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-1 | `type bar` collision missed → compile error | **certain if unhandled** | build stops | I-1 PASS 1 catches it mechanically |
| R-2 | A shadowed global (`b`, `atr`, `per`) silently changes behavior | **high** — silent | wrong drawings, no error | I-1 PASS 2 + I-4 the behavior diff |
| R-3 | Object starvation — one subsystem eats the budget | **high** | 1-3 subsystems invisible | §16 allocator + I-3 probe |
| R-4 | A single-letter method (`n`, `p`, `l`, `br`) collides with a local | medium | compile error or wrong call | I-1 PASS 3's ≤2-char flag + grep |
| R-5 | SMC's 13-slice voids blow the box budget alone | medium | voids invisible | §16 caps VOIDS by EVENT COUNT |
| R-6 | Renaming accidentally "fixes" `storeOrdeBlock`'s typo and touches logic | low | L-5 violation | rename identifiers only; the typo stays |
| R-7 | License strip when rebranding | medium | legal exposure | L-6 + L-7 + §22's header requirement |
| R-8 | TradingView rejects the merged file for size | low | build blocks | SMC alone is 848 L; 1,600-1,800 is within observed limits |
| R-9 | v0 mistaken for E1's view (the honest gap) | **high** — conceptual | the operator believes he sees Plutus's zones | §17's tally + §13's "THE HONEST ONE" |
| R-10 | The 4 sources drift from the pinned SHAs mid-build | low | silent divergence | sources/ is pinned; I-1 runs on the pinned copies |

**The two risks that actually matter:** **R-2** (silent shadowing — no error, wrong
output) and **R-9** (the conceptual gap). R-2 is caught by instrumentation. R-9 is caught
only by stating it — which §17 and §13 do.

---

## §24 — THE OPERATOR CHECKLIST

What only the operator can decide or do:

```
  ☐ FORK A — LICENSE. Ship as a CC BY-NC-SA derivative (attribution kept),
    or commission a clean-room reimplement from the §7.4 spec?
    → default taken: (i) derivative. Overrule if Plutus Vision will ship.

  ☐ FORK B — V1 TIMING. Wire the renderers to E1's zone export now
    (bigger job, needs the export format designed + a delivery channel),
    or ship v0 as a look-alike and wire later?
    → default taken: later. The export channel is unresolved (Pine cannot
      read a local file).

  ☐ CONFIRM the trio. The brief says "the 3 liquidity indicators" and names
    Sweeps · Voids · Pools in the body. The library has 35 liquidity-family
    indicators. If a different 3 was meant, swap §4's P-2/P-3/P-4.
    → default taken: Liquidity Sweeps + Liquidity Voids + Buyside/Sellside
      Liquidity (the 3 that map 1:1 onto E1's sweep/void/pool constructs).

  ☐ PLACE the artifact. e1/vision/ (chosen by convention) or a new
    vision/ root at the workspace top?
    → default taken: e1/vision/ — it is E1's view layer.

  ☐ BUILD IT. Steps 0-9 of §21 are mechanical. Authorize the build and it
    runs start to finish with the 4 instruments as its gates.
```

---

## §25 — THE SHOW-ME SUMMARY

```
  ┌──────────────────────────────────────────────────────────────────┐
  │  PLUTUS VISION v0 — at a glance                                  │
  ├──────────────────────────────────────────────────────────────────┤
  │  WHAT   one Pine indicator = SMC + Liquidity Sweeps + Liquidity  │
  │         Voids + Buyside/Sellside Liquidity, titled "Plutus       │
  │         Vision v0"                                               │
  │                                                                  │
  │  WHY    E1 computes zones as DATA; nothing renders them; these   │
  │         4 scripts already draw 4 of E1's constructs              │
  │                                                                  │
  │  WORK   1,467 source lines → ~1,600 merged                       │
  │           · 13 type renames (1 collision: `bar` ×2)              │
  │           · 7 shadowed globals + ~90 unique idents               │
  │           · 4 single-letter methods (the riskiest rename)        │
  │           · 1 namespace · 1 budget · 1 input tree · 0 new logic  │
  │                                                                  │
  │  REAL   the collisions — `type bar` ×2, 7 shadowed globals,      │
  │  COST   2,000 boxes demanded vs a 500 ceiling                    │
  │                                                                  │
  │  PROOF  4 instruments: lex linter · compile gate · starvation    │
  │         probe · behavior diff — no artifact exempt               │
  │                                                                  │
  │  BLOCK  Fork A — the license (CC BY-NC-SA) vs "rebrand it".      │
  │         Needs a ruling. Everything else has a default.           │
  │                                                                  │
  │  HONEST v0 shows LUXALGO's zones, not E1's. v1 swaps the         │
  │         detectors and keeps the renderers.                       │
  └──────────────────────────────────────────────────────────────────┘
```

**Files defined:** `e1/vision/plutus-vision-v0.pine` · `BUNDLE_MANIFEST.md` ·
`scripts/lexcheck.py` · `PROVENANCE.md` · this blueprint
**Files touched:** none — design only, no build performed
**Verification run:** frozen pair ✅ `9129408…` / `33914c89…` matched the manifest;
kernel + golden **BLOCKED-BY-PATH** (reported, not passed)
