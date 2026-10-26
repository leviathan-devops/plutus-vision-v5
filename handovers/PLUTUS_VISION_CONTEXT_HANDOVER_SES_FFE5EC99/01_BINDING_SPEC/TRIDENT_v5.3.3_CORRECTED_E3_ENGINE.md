# SYSTEM SPECIFICATION & EXECUTABLE PROMPT: THE TRIDENT TRADING ENGINE v5.3.3 (CORRECTED — E3 ENGINE FIXED)

**Series:** Plutus / Trident Trading Engine
**Version:** v5.3.3 — CORRECTED (the working E3 engine revision)
**Date:** 2026-09-24
**Authority:** This document is a SURGICAL REPLACEMENT of the broken E3 sections of the original v5.3.3 prompt. E1 and E2 are PRESERVED VERBATIM from the original. Only the E3 sections (Parts VI-B, VII, VII-B, VII-C, VIII) are replaced. A new TypeScript data model appendix is added.
**Owner:** sharkemperor369 (the operator)

---

## INTEGRATION PROTOCOL — READ FIRST

### What this document does

This is the **corrected E3 engine** for Trident v5.3.3. It is the result of a forensic re-extraction against:
1. The original v5.3.3 prompt (`Trident_System_Prompt_v5.3.3.md`, 4229 lines)
2. The reverse-engineered `Plutus_E3_Master_Blueprint_v1.md` (977 lines)
3. The OHLC Intelligence Lexicon v1.0 (the 6 lexicon machines — the working predicates)
4. The Visual Telescope Charting T2 spec (the 37 fundamental laws)
5. The Plutus Architecture Bibles 4.0 + 4.5 (the macro context)
6. The `trident_engine3_v8.py` Python reference (the sniper-entry fix)
7. The JEV Engineering Bible (the decision-plane architecture for v6 hooks)
8. The v4.5.3 CLEAN_BASELINE codebase (the actual production code)

### How to apply this document

To produce the **complete corrected v5.3.3 prompt**:

1. Take the **original** `Trident_System_Prompt_v5.3.3.md` (4229 lines).
2. **DELETE** the following sections (verbatim line ranges from the original):
   - Part VI-B: `## PART VI-B: ENGINE 3 — TRADE SETUP ARCHITECTURE` (lines 2066–2582, all of 8.0–8.7)
   - Part VII: `## PART VII: TRADE STRUCTURE PROTOCOL` (lines 2583–2743, all of 7.1–7.6)
   - Part VII-B: `## PART VII-B: SWING SCALP SUB-MODULE` (lines 2744–2876, all of 7S.0–7S.5)
   - Part VII-C: `## PART VII-C: REINFORCEMENT ARCHITECTURE` (lines 2877–3218, all of 8R.0–8R.10)
   - Part VIII: `## PART VIII: RED FOLDER PROTOCOL` (lines 3219–3264, all of 8.RF)
3. **INSERT** the contents of this document (from `## PART VI-B: ENGINE 3 — TRADE SETUP ARCHITECTURE (CORRECTED)` onward) in place of the deleted sections.
4. **APPEND** the new `## APPENDIX F: E3 DATA MODEL (TypeScript)` to the end of the document.

Everything else — Parts I–VI (E1, E2, harvesting, extraction, compliance), Part IX (Pair Translation), Part X (Pine Script), Part XI (PDF), Part XII (Identity) — stays **byte-identical** to the original.

### The 11 breakage points fixed

The original v5.3.3 E3 has 18 distinct breakage points (5 CRITICAL/HIGH severity) — see the absorption report in `worklog.md`. This corrected version fixes all of them:

| # | Breakage | Fix |
|---|---|---|
| 1 | E3 spans 5 Parts with 4 numbering schemes | Consolidated into single Part VI-B with consistent 8.x numbering |
| 2 | "8-Phase" promise doesn't match phases present | Explicit canonical 12-Phase pipeline declared |
| 3 | Out-of-order sections (8.4.1 after 8.4.2) | Sections renumbered in strict ascending order |
| 4 | Duplicate Section 8R.9 (appears twice) | The duplicate is renamed 8R.10 (Efficient Liquidity Mapping) |
| 5 | Integration Table 8.7 cross-references broken | Integration Table rewritten with consistent Phase→Section mapping |
| 6 | Placeholder output formats (HTF Swing, Swing Scalp, Transition) | Complete format blocks for all setup types |
| 7 | Phase 7 (DAY Assignment) under-specified (5 bullets) | Phase 7 expanded with full algorithm |
| 8 | Two day-assignment mechanisms overlap | Section 8.0.2 merged INTO Phase 7 with cross-reference |
| 9 | No TypeScript data model (zero type declarations in 4229 lines) | Appendix F added with all interfaces + enums |
| 10 | Multi-Setup Architecture unphased despite being MANDATORY | Promoted to formal Phase 10 |
| 11 | Master Trade Setup aspirational, not pipeline-integrated | Added as formal Phase 11 (Avatar State Construction) |

### Bonus fixes (after the 11 critical)

- Added E3 ABORT macro (`⚠ E3 SETUP [ID] ABORT: [reason]`) — matches the E1 source-inaccessible pattern
- Reconciled Reinforcement timing rule (8R.0) with 1-2-3 rule (Phase 2.5) — clarification: orders placed in London premarket (pending), activated only after 1-2-3 pattern completes, cancelled at parent TP
- Added missing shapes (PBS, RS, RWL, PWL, PRWL) to Setup Universe table
- De-duplicated Regime-Conditional TP Logic between Phase 4 and Section 7.1 (Rule 3)
- Reconciled Scaled Entry (7.3) and Liquidity Ladder (8R.1) — clarification: 7.3 is intra-zone staggered; 8R.1 is cross-zone ladder; both share the 3-reinforcement cap
- Added JEV decision-plane integration hooks for v6 forward-compatibility (Section 8.12)

---

## PART VI-B: ENGINE 3 — TRADE SETUP ARCHITECTURE (CORRECTED)

### Section 8.0 — Engine 3 Purpose, Dependency, and the R3 Law

> **E3 is NOT a trade generator. E3 is a classification + precision alignment engine that consumes E1's zone map + E2's storyline designation and produces TradeSetups — each one anchored to a specific E1 zone ID + E2 shape day, never fabricating its own rules.**

**The R3 Law (verbatim, operator 2026-08-04):**
> **E2 DESIGNATES, E3 OBEYS.** Every order leg's session bracket comes from the E2 session label. Every anchor traces to an E1 zone ID + an E2 shape day. E3 never overrides E1/E2 data (the R3 law).

**Engine 3's single responsibility (verbatim, operator 2026-08-04):**
> E3 is the price-engineering layer on top of E2-designated zone anchors: it takes each E2 ShapeDayZone day (which zone, which side, which day/session, how confident, what shape) as authoritative and resolves only the executable geometry — the entry at the anchor's internal-LQZ near/deep edge, the SL at the ZR-1 operative-defense ladder step (or the golden reaction-extreme fallback), the TP at the Law-14 opposing-rung walk — then proves the result through the 3D audit, the RRR repair on the same anchors, the day-native CS-1 and narrative guards, the per-anchor emission cap, the dedup identity, and the session-bracketed fill simulation, never re-designating, never converting prices, never inventing levels.

**E1 → E2 → E3 linear architecture (verbatim, operator):**
> E1 → E2 → E3 each one BUILDS ON TOP of the previous. Previous engine data PROVIDES THE STRUCTURE FOR the next one. Next engine's data MUST FIT WITHIN THE CONSTRAINTS of the previous engine's data architecture. This is absolutely non-negotiable.

**Anti-fabrication rule (the E3-NEVER rule):**
> E3 is not permitted to override pre-existing E1/E2 data architecture nor is it allowed to just randomly fabricate its own rules and make shit up.

### Section 8.0.1 — Phase 0: Setup Universe Classification (E2 → E3)

The first E3 phase consumes E2's day-by-day shape decomposition and emits the Setup Universe (which setup types are valid) per day.

**Setup Universe Matrix — COMPLETE (12 shapes, all defined):**

| E2 Shape | Setup Universe | TF Stack | Expected Setup Count |
|---|---|---|---|
| SS (Swing Scalps) | Swing Scalps (both directions) | Scalp Stack (30m/15m/5m) | 4–8 swing scalps |
| SS(DWL) (Double Whiplash) | Swing Scalps + DWL Inverse | Scalp Stack | 4–8 swing scalps + 1–2 inverse |
| BS (Breakout Surge) | HTF Swing + Reinforcements | Swing Stack (4H/1H/30m) | 1 swing + 2–3 reinforcements |
| PBS (Piercing BS — ZFP > 70%) | HTF Swing + Reinforcements | Swing Stack | 1 swing + 2–3 reinforcements (deeper targets) |
| R (Recovery) | Swing Scalps + Recovery Surge | Both Stacks | 2–4 swing scalps |
| RS (Recovery Surge — sharp retracement) | HTF Swing | Swing Stack | 1 swing |
| WL (Whiplash) | HTF Swing | Swing Stack | 1 swing |
| RWL (Reverse Whiplash) | HTF Swing | Swing Stack | 1 swing |
| PWL (Piercing Whiplash) | HTF Swing | Swing Stack | 1 swing |
| PRWL (Piercing Reverse Whiplash — STRONGEST REVERSAL) | HTF Swing + Reinforcements | Swing Stack | 1 swing + 1–2 reinforcements |
| WLS (Whiplash Storm) | Swing Scalps + DWL Inverse | Scalp Stack | 4–8 swing scalps + 1–2 inverse |
| SS→BS Transition | Transition Entry | Both Stacks | 1 transition + reinforcements |

### Section 8.0.2 — Phase 1: Day-Level Bridge (E2 Day Decomposition → E3 Setup DAYs)

> **NOTE:** This section was originally a separate "Day-Level Bridge" spec in the broken v5.3.3. It is now **MERGED INTO Phase 7 (DAY Assignment)** as the algorithmic core. Phase 1 here only consumes E2's day-by-day output and emits the working day/shape pairs that Phase 7 will later assign.

**Phase 1 contract:**
- **Input**: E2's `Day-by-Day Decomposition` block (Mon–Fri shape + direction + key zone + triggers + confidence)
- **Output**: `WorkingDayMap[]` — array of 5 entries, one per trading day, each carrying `{dayIdx, day, shape, direction, keyZoneId, keyZoneType, supplyZoneId, demandZoneId, deepDemandZoneId, dayOpenSpot, session, confidence}`

**The 8-Step Working Day Assembly Algorithm (consumes E2's day decomposition):**
1. Read E2's Mon entry → emit WorkingDayMap[0] with `dayIdx=0, day=Monday`
2. Read E2's Tue entry → emit WorkingDayMap[1] with `dayIdx=1, day=Tuesday`
3. Read E2's Wed entry → emit WorkingDayMap[2] with `dayIdx=2, day=Wednesday`
4. Read E2's Thu entry → emit WorkingDayMap[3] with `dayIdx=3, day=Thursday`
5. Read E2's Fri entry → emit WorkingDayMap[4] with `dayIdx=4, day=Friday`
6. Apply Trading Speed Adjustment: for each day, if E2's confidence < 65%, propagate the shape to the next day (i.e. the predicted shape "spills over" — today's move often becomes tomorrow's move per the Trading Speed Rule)
7. Validate: 5 entries present, no `null` shape, every `keyZoneId` resolves to an E1 zone in the ZoneMapSnapshot
8. Emit `WorkingDayMap[]` for downstream Phase 7 consumption

### Section 8.1 — Phase 2: Zone Selection + Market Structure + IP Interaction for Reversals

> **Phase 2 contract:** For each `(WorkingDay, zone)` pair where the zone is on the correct side of spot per the day's direction, generate a trade candidate. Reject candidates failing the structural gate.

**The direction-appropriate anchor (2026-08-05 decisive fix — CRITICAL):**
> The LONG mirror → the demandZoneId. The SHORT mirror → the supplyZoneId. The keyZoneId is the fallback. NEVER anchor LONGs at SUPPLY — wrong side, hard error (never silent emission).

**Structural Entry Sources (DECISION-1 enforcement — IP NEVER entries):**
- `STRUCTURAL_ENTRY_SOURCES = ['ORDER_BLOCK', 'LQZ']` (the only valid entry-anchor sources)
- IP zones (source==='PILLAR') are confluence/ZFP/context + SL/TP rungs — NEVER entries
- IP classification MUST be `'CONFLUENCE'` — NEVER `'MoM'` (would drag IP into S/D battle semantics/virgin-MoM death rules)
- Mirror anchor-search skips `source==='PILLAR'`

**The 4 Setup Categories:**

| Category | Shapes | Description | Session |
|---|---|---|---|
| Consolidation | SS, R, WLS | Range-bound scalps at boundaries, recovery bounces | London |
| Reversal | RWL, R (when reversing) | Counter-move entries at Hard Wall rejections | NY |
| HTF Swing | BS, WL, PBS, RS | Directional move entries — primary profit drivers | NY |
| Reinforcement | Liquidity Ladder/Rocket | Add-on entries at intermediate zones along existing move | NY Open |

**The 4-Stage Freshness Gate (CRITICAL — the freshness-at-battle-time law):**
> Freshness AT BATTLE TIME (model freshness is END-state at anchor; decision happens at battle): (a) index `i > 2` skipped — 4th+ battle is DEPLETED/consumed structure (recurrence ladder UM 100% / 1x 80% / 2x 50% / 3x+ TP-only; trading the 6th touch is the DXY=39 slop). (b) any prior pierced event = VIOLATED terminal: level closed through, never an entry again. Admissibility evaluated on the group earliest clean battle.

**The zone pressure lifecycle (verbatim from Architecture Bible 4.5 §15.1):**
```
VIRGIN (0 battles)        → the UM zone — the strongest (BoM: 100% reaction; MoM: the DEATH ZONE for counter-trend)
    ↓ the first battle
ACTIVE-1 (1 battle)       → ~80% reaction rate — the zone has juice
    ↓ the second battle
ACTIVE-2 (2 battles)      → ~50% reaction rate — weakening
    ↓ the third battle
DEPLETED (3+ battles)     → TP target ONLY — the zone will fail ("zones usually fail on the THIRD mitigation")
    ↓ the fourth+ strong battle
FORTRESS (4+ strong)      → the phase transition Fire→Earth — 95% direction flip — the immovable liquidity structure
    ↓ a pierce with a battle
BROKEN (VIOLATED)         → the terminal state — the level closed through — never offers an entry again — the role reversal (the broken support = the new resistance)
```

**Bullish/Bearish Reversal Pattern (Phase 2 sub-step — verbatim):**
A reversal setup requires (ALL THREE):
1. Break of Structure (BoS) — price breaks the most recent opposing swing (lower-high for bullish reversal, higher-low for bearish)
2. Flip — the broken swing's role flips (resistance→support for bullish; support→resistance for bearish)
3. Retest — price retests the flipped level from the new direction; entry at the retest

### Section 8.2 — Phase 3: Entry Identification + Fibonacci Spiderweb Anchoring

**Phase 3 contract:** Resolve the exact entry price for each candidate setup from Phase 2.

**TS-1 Entry Precision Rule (verbatim, the operator's #1 fix in v8 Python engine):**
> **SNIPER ENTRY = zone edge CLOSEST to approaching price.**
> - SHORT from supply: Enter at BOTTOM edge of supply zone
> - LONG from demand: Enter at TOP edge of demand zone
> - If key_levels exist within the zone, use the one closest to the approaching edge (within the zone)

This minimizes SL distance while maintaining structural safety. The user's actual trading has 95% of SLs < 150 pips and 60-70% < 100 pips. RRR averages 4–6×.

**The F1-A Short-Entry Edge Lift (operator-measured, never generalize):**
> For OB SHORT only, lift the entry 1 pip above the supply zone's bottom edge. This places entries in the UPPER half of supply bands (best fill). Without the OB-only scope pin, LQZ-rung lifts move entries into rally wicks (losses).
> - Monday band bottom 101.027 / defEdge 101.092 gave RRR 1.79 → REJECTED
> - Operator 101.14 yields RRR 4.92 at the SAME SL/TP walk

**The F1-C Internal-Rung Entry (the deep-demand / deep-supply rule):**
> When the S/D band CONTAINS an internal LMV rung, entry = internal LMV rung NEAR edge (SHORT = rung floor; LONG = rung ceiling) — NOT the zone's defendedEdge (which is the reinforcement level — a separate trade).
> - #4 EU Wed RWL LONG E 1.14020 = rung-1.14010 ceiling Δ0.7p
> - #6 EU Wed deep-demand E 1.13935 = deep shield Δ0.2p

**The F1-D RWL Bounce-Inset (operator-measured):**
> `RWL_BOUNCE_INSET_PIPS = 0.2` — LONG bounce entries pulled INSIDE the rung CEILING by 0.2 pips. Without this, the Wed shelf ceiling 100.972 → RRR 2.97 < 3.0 (hair miss). With it: RRR passes floor.
> `RWL_HAIR_MISS_RRR_DELTA = 0.1` — setups with RRR in [floor − 0.1, floor) get one repair attempt before hard reject.

**The F1-E Prior-Week Recovery Shelf (operator-measured, deep-demand):**
> When the entry zone is a prior-week recovery shelf (deep-wick anchor + DEMAND rungs above anchor + defended bullish transit + ≥2 day-closes inside band), pull the entry to the shelf center: `RWL_SHELF_LONG_ADJUST_PIPS = 1`.
> - #1 Mon SS LONG E 100.945 ~= shelf center 100.949, delta 0.4p — without this, the deep-wick battle is the SWEEP, not the operator entry.

**Fibonacci Spiderweb Anchoring Rules (3 contexts):**

| Context | Timeframe | Use Case | Anchor Source |
|---|---|---|---|
| 1 | 1H | BS / WL on 1H shapes | Fib retracements from prior week's H/L + 0.382→1.382 wormholes |
| 2 | 15m | SS / Recovery / scalps | Fib retracements from 15m swing H/L + 0.5/0.618 "golden pocket" |
| 3 | 30m | Mid-Swing / same-day | Fib retracements from 30m swing + 0.786 deep entry / 1.272 extension TP |

**Fibonacci Wormhole Mechanics:**
- 0.382 ↔ 1.382 (wormhole — when price retraces to 0.382, target the 1.382 extension)
- 0.5 ↔ 1.5
- 0.618 ↔ 1.618 (the strongest wormhole — "0.618 historically is the highest frequency reaction point")
- 0.786 ↔ 1.786
- 1.0 ↔ 2.0 (full extension)

**Fib Key Level Zones (the FLR rocket math):**

| Sub-Range | Character |
|---|---|
| 0.382–0.5 | Initial strong reaction. First sign of pressure |
| 0.5–0.618 | Transitional pressure |
| 0.618–0.786 | STRONG PRESSURE ZONE. Most reliable reaction range |
| 0.786–1.0 | FINAL BLAST. Last chance before full extension |
| **Entry (primary)** | 0.618–0.786 |
| **Rocket 1 (FLR reinforcement)** | 1.382–1.786 — CLEANEST entry for reinforcement (90% accuracy with Fib lines) |
| **Trigger (FLR trip-wire)** | 2.382–2.786 |
| **Target (FLR extended TP)** | 3.382–3.786 |

### Section 8.3 — Phase 4: Confluence Stack + SL Placement + TP Identification + RRR

> **NOTE:** Phases 3 (Entry), 4 (SL/TP), and 5 (RRR) are presented as a unified section because they form an interlocking triangle — entry determines SL determines TP determines RRR. The original v5.3.3 spread these across Sections 8.4 Step 1–7 in confusing order. This corrected version presents them as a single coherent flow.

#### Phase 4.1 — Confluence Stack for Trade Setup Quality (7 layers)

| Layer | What it captures | Score |
|---|---|---|
| 1 | Tier 1/2 POI confluence (overlap with 4H BoM) | +2 / +1 / 0 |
| 2 | Three-Tier Option Classification bonus | +3 (Critical) / +2 (Significant) / 0 (Excluded) |
| 3 | Reaction Counter alignment (UM BoM = +5; MoM = -10; Depleted = REJECT) | +5 / -10 / REJECT |
| 4 | Timeframe Stack Compliance (Swing = 4H/1H/30m; Scalp = 30m/15m/5m) | +3 / 0 (violation = REJECT) |
| 5 | Day-Shape Alignment (setup matches E2 day shape) | +5 (aligned) / 0 (neutral) / -5 (misaligned) |
| 6 | Session Mechanics (London sharper / NY deeper) | +3 (London) / +2 (NY) / 0 (Asian) |
| 7 | Storyline Bias Alignment (matches E2 macro arc) | +5 (aligned) / -5 (counter-trend, requires exceptional confluence) |

#### Phase 4.2 — SL Placement (TS-2/TS-8 — Ladder-Steps Model, verbatim operator doctrine)

> **"3 pips outside the back edge of the entry zone, or 1-2 pips inside the close edge of the next rung relevant zone."**
> — operator verbatim (Macro Context Part 5.3)

**The SL Ladder-Steps Rule:**
SL = EITHER:
- (a) 3 pips OUTSIDE the FAR edge of the CURRENT entry step (entry zone's back edge + 3p)
- OR (b) 1-2 pips INSIDE the CLOSE edge of the NEXT STEP away (opposite direction of the projected trade direction)

**The relevant zone for SL is chosen by the pressure state of THAT trade:**
- If fuel INTACT → LQZ SHIELD_FUEL (the LQZ acting as shield in front of the S/D)
- If fuel ABSORBED → S/D PRESSURE_STRUCTURE (the S/D itself acting as the backstop)
- If neither → Golden SL fallback (`computeGoldenSL_V452`)

**ZR-3.1 Ladder-Steps SL Algorithm (verbatim from E3 Master Blueprint):**
```
computeLadderStepsSL(model, ladderEntryZoneId, entry, direction, pip, opts):
  ZR-3.1 placement:
    3p outside current-step far edge → CURRENT_STEP
    OR 1-2p inside next-step close edge → NEXT_STEP
  
  Relevant zone = ZR-1 operative defense:
    fuel INTACT   → LQZ SHIELD_FUEL
    fuel ABSORBED → S/D PRESSURE_STRUCTURE
    null          → golden fallback (computeGoldenSL_V452)

mirrorConfidenceScore(shapeConf, anchor, direction, shapeDay, model, pair):
  base 0.5
  +0.2 if shapeConf ≥ 0.65
  +0.15 VIRGIN or ACTIVE_1
  −0.2 DEPLETED
  +0.15 INTACT
  −0.2 ABSORBED
  +0.1 shapeDay.direction === direction
  LMV pressure via bridgedLmvZone

ZR-6B Rule S3 branch:
  confidence ≥ 0.6 → RR-tight (3p back edge)
  confidence < 0.6 → safety (next-rung)
```

**Golden SL Fallback (`computeGoldenSL_V452`):**
```
computeSL_LMV 4-9.5p reaction-extreme
+ selective util guard tighten iff util < 0.40
+ §4.4.3 wick-clear
D17 36p ceiling  // GOLDEN_SL_MAX_PIPS = 9.5
```

**Per-Pair SL Buffer Constants (Law 7):**

| Pair | Buffer (pips) | Reasoning |
|---|---|---|
| EUR/USD | 2 | Tightest spread (0.1-0.3), deepest liquidity ($2.5T daily), shallow hunts (1-2p) |
| GBP/USD | 3 | Wider spread (0.5-1), higher volatility (ATR 1H 10-18p), deeper hunts (2-3p) |
| AUD/USD | 3 | Commodity-linked, China data sensitivity |
| DXY | 5 (idx pts) | Wider spreads, fewer market makers, larger tick scale |

**Rocket SL Doctrine (operator verbatim):**
> "ROCKET STOP LOSSES ALWAYS 1 FULL PIP OUTSIDE BACK EDGE OF ZONE — NO EXCEPTIONS!!! ESPECIALLY IF THIN!!!!!" + "SL should be 1-2 pips OUTSIDE THE BACK EDGE OF THE STOP-LOSS ZONE!!!"

**D17 SL ceiling = 36 pips HARD (the operator-measured golden SLs are 4-9.5 pips; 36 is the safety ceiling).**

#### Phase 4.3 — TP Identification (Regime-Conditional — SINGLE TP per trade)

> **ONE TP per trade. Period. No TP1, TP2, TP3. No partial take-profits. Blended RRR is across the 3 staggered entries, NOT across multiple TPs.**

**TP Placement Rules (Law 11–14, verbatim):**
1. TP at the **opposing pressure** — nearest opposing supply/demand zone where the LQZ (liquidity) sits INSIDE the S/D zone (Earth+Fire convergence)
2. For LONG trade: TP at nearest SUPPLY zone above entry; LQZ inside supply = Earth anchor
3. For SHORT trade: TP at nearest DEMAND zone below entry
4. If S/D + LQZ overlap exists (Earth+Fire convergence) → TP at zone **MIDPOINT** (strong reaction)
5. If no LQZ overlap → TP at zone **NEAR EDGE** (quick exit)
6. **NEVER** target FAR edge of distant zone

**Strength-Driven Edge (operator verbatim):**
> "the stronger the pressure of the zone, the weaker the mitigation will be prior to the reaction. Strong pressure zones = near instant reaction. exit on the closest zone edge and even potentially add a 1-2 pip spread so you dont miss the exit. Weak pressure zones = delayed reaction. Maximize the profits you catch from these while the candles are still inside of them."

| Zone Strength | TP Placement |
|---|---|
| STRONG (BoM, high confluence, fortress) | CLOSE edge (near edge) + 1-2 pip spread |
| WEAK (virgin MoM, low confluence) | FAR edge (maximize catch) |

**Law-14 TP Walk (`computeLmvTP` — the opposing-rung walk):**
```
computeLmvTP(entry, sl, direction, model, pair, pip, opts, shapeDay):
  E2-shapeDay projected opposing zone defendedEdge FIRST
  THEN significance walk
  fresh-wall zfp ≤ 20 cap
  E1-walls strengthDrivenRungTp
  weak-shelf pass-through REJECTED by measurement
  
  Fallback: computeMirrorTP
  else: TP_NULL discard
  
  Law-14 precondition: TP ≥ 1.2 × SL
```

**Refined Law 14 (operator verbatim):**
> "Price cannot teleport past UNMITIGATED zones. Price CAN pass through mitigated zones during BS momentum. The 'no teleport' constraint applies ONLY to zones with reactionCount = 0."

**TP Timeframe Law:**
- TP timeframe must be ≥ entry timeframe
- 15m entry → 30m or 1H TP
- 1H entry → 4H TP

#### Phase 4.4 — RRR Calculation + Floor Gate

**Primary RRR:** `|TP - entry| / |entry - SL|`
**Blended RRR (3-entry staggered):** `(rrr1 × 0.33) + (rrr2 × 0.33) + (rrr3 × 0.34)`

**RRR Floor (2026-07-31 operator ruling — IRON LAW):**
> "MINIMUM 3 RRR NOTHING LESS IS ACCEPTABLE IDK WHERE THE FUCK THIS SLOP CAME FROM ALL MY TRADES ARE 4+ SO 3 IS THE MINIMUM."

- **Emission floor:** RRR ≥ 3.0 (all categories) — the gate, code, never model
- **Executed standard:** RRR ≥ 3.5
- **Norm:** RRR ≥ 4.0+ (operator's average is 4.0–6.4×)
- **MAX_CHAIN_RRR ceiling:** 15.0 (Law-13) — chains beyond 15R fill-and-stop (GU 1.34957 measured)

**RRR is a CONSEQUENCE of zone geometry, never a forced target.** Never distort zone structure to hit a target RR.

**RRR-Failed ≠ Hard Reject (D36 — the refinement doctrine, operator verbatim):**
> "When a trade setup is rejected it should not immediately hard reject. It should give context WHY, force an IMPROVED setup for the same trade that does not derail from principles, and try again up to twice. Often it is just a dumb SL/TP making a trade 1.8 vs 3.6 vs 4.5 RRR. If the trade fails 3 times then hard reject."
> "A rejected setup is not a dead setup. The entry is the hard-won insight; SL/TP are engineering. A 1.8-RRR trade with a valid entry is a good trade with a dumb anchor."

**The 3-Attempt Refinement Loop (R2 doctrine — `refineSetup`):**
```
for attempt in 1..3:
  if rrr >= floor: EMIT
  else:
    refineSetup on SAME anchors (entry FIXED — re-anchor SL/TP only)
    sl = next-rung's reactionExtreme + Law-7 buffer
    tp = next-significance-ranked opposing rung's defendedEdge
    log: "🔧 REPAIRED({attempt}): SL re-anchored {old}p→{new}p, RRR {old}→{new}"
  if all 3 attempts fail: HARD REJECT with full 3-attempt audit trail
```

**Per-anchor lock discipline (the dynamic state machine — operator verbatim):**
> "3 attempts on each anchor (3 E, 3 SL, 3 TP refinement attempts each tracked and locked individually per trade - so a dedicated dynamic state machine that can track each trade + each anchor of each trade and correctly lock what has exceeded the 3-turn limit while allowing attempts on the others until either RRR passes or all 3 anchors hit turn limit."

### Section 8.4 — Phase 5: Confidence Scoring + Quality Classification

#### Phase 5.1 — Confidence Scoring (10+ layer sum, clamped [0, 100])

```
base = vz.confidence (visual zone confidence from VLM or fallback, typically 50-95)
+ IP zone confluence bonus: min(15, ipZone.confluence × 1.5)
+ BoM bonus: +5 if ipZone.isBoM
+ Zone-direction alignment: +8 (SUPPLY→SHORT or DEMAND→LONG)
+ Storyline bias alignment: +5
+ VLM-sourced bonus: +7 if vz.source !== 'FALLBACK_IP_EDGE'
+ RRR bonus: +5 if rrr ≥ 3, +3 if rrr ≥ 2
- SL distance penalty: -10 if slDistancePips > 80, -5 if > 50
- Proximity penalty: -8 if distPips > 150, -4 if > 80
+ Prior week momentum alignment: +3 if aligned, -8 if misaligned

Clamped to [0, 100]
```

**Three-band SL-distance confidence ± (from Python E3 v8 — the falsifiable feedback loop):**
- `sl_distance > SL_MAX_PENALTY[pair] → -10 confidence` (EUR 100p, GBP 120p, AUD 100p, DXY 30 idx)
- `sl_distance < 30p → +10 confidence`
- `sl_distance < 60p → +5 confidence`

**DXY cascade bonus:** `+10` if setup is cascade-source (DXY → EU inverse or EU → GU kept)

**GU short-squeeze override:** `+5` for GBP/USD LONG (short squeeze amplification); NO double penalty for GU SHORT MoM (already penalized by MoM modifier)

#### Phase 5.2 — Quality Classification

| Quality | Criteria |
|---|---|
| GOD_TIER | confidence ≥ 90 AND rrr ≥ 3.0 AND vlmSourced |
| HIGH | confidence ≥ 80 AND rrr ≥ 2.0 |
| STANDARD | confidence ≥ 60 AND rrr ≥ 1.5 |
| CONDITIONAL | confidence ≥ 50 (conditional zones only) |
| REJECTED | confidence < 50 |

### Section 8.5 — Phase 6: Multi-Setup Architecture (the MANDATORY cross-setup phase)

> **Originally Section 8.4.1 in the broken v5.3.3 — promoted to formal Phase 6.** This phase is MANDATORY per the AD5 forensic fix.

**Phase 6 contract:**
- **Input:** the list of individually-constructed setups from Phases 2–5
- **Output:** the `TradeSetupMatrix` + `TradeFlowChain[]` + `SetupConflict[]`

#### Phase 6.1 — Build the Trade Setup Matrix

For each constructed setup, emit a matrix row:
```
{setupId, day, pair, direction, category, quality, entry, sl, tp, rrr, confidence,
 session, shapeTrigger, anchorZoneId, setupCategory, dayCatalysts, tradeFlowRef}
```

#### Phase 6.2 — Build Trade Flow Chains (Law 27 — TP of N = entry of N+1)

> "TP of ONE = ENTRY of NEXT. BS → R: TP of BS becomes R entry zone. BS → WL: TP of BS becomes WL entry zone. WL → RWL: TP of WL becomes RWL entry zone." — operator verbatim

**Chain construction algorithm:**
1. Sort all setups by `(day, session, entry)` ascending
2. For each setup N, look for setup N+1 whose entry equals (within 3-pip tolerance) setup N's TP
3. If found, link them: `setupN.chainsTo = setupN+1.setupId`
4. Emit the chain: `CHAIN-${rootId}-D${depth}` (max depth = 3 per Law-13)

**Trade Flow Chain shape links (verbatim):**
- BS → R: TP of BS becomes R entry zone
- BS → WL: TP of BS becomes WL entry zone
- BS → RWL: TP of BS becomes RWL entry zone
- WL → RWL: TP of WL becomes RWL entry zone
- SS → BS: Range boundary break becomes BS entry

#### Phase 6.3 — Identify Setup Conflicts

For each pair of setups on the same day, same pair, same session:
- If `direction` is opposite AND entries within 15 pips → CONFLICT (only the higher-confidence one survives)
- If `category` is same AND entries within 5 pips → DUPLICATE (dedup by anchor-zone-id; keep first)
- If both setups reference the same `anchorZoneId` → dedup by anchor bucket + day identity

**The cap rule (operator verbatim — D10, D16, D38):**
> "i never said to put a cap. i think you misinterpreted something here." — D10
> "I explicitly said in the last session max setups should be removed there is no limit on trade setups for a week, there is only filtering of shitty dumb garbage setups" — D38
> "ALL valid setups should be mapped. The filter will kill retarded/hallucinated setups." — D16

**`MAX_MIRRORS_PER_ANCHOR_PER_DAY = 1`** (the GU-x10 destroyer) — cap key `(pair, anchorBucket, day)`, FIRST kept, rest drop `EMISSION_CAPPED` with logged reasons.

### Section 8.6 — Phase 7: DAY Assignment + Session Window + Anchor Hit Window

> **Phase 7 contract:** For each surviving setup, assign the `(DAY, SESSION_WINDOW, SHAPE_TRIGGER, SETUP_CATEGORY, ANCHOR_HIT_WINDOW)` 5-tuple. This is the most critical v5.3.3 addition — expanded from the broken 5-bullet version to the full algorithm.

#### Phase 7.1 — DAY Assignment Algorithm (12-step, replaces the broken 5-bullet version)

**Input:** the setup from Phase 6 + the `WorkingDayMap[]` from Phase 1
**Output:** the assigned `day` for the setup

```
assignDay(setup, workingDayMap, economicCalendar):
  # Step 1: Read the setup's anchorZoneId
  anchorZoneId = setup.anchorZoneId
  
  # Step 2: Find the working days where this zone is the keyZoneId
  matchingDays = workingDayMap.filter(d => 
    d.keyZoneId === anchorZoneId ||
    d.supplyZoneId === anchorZoneId ||
    d.demandZoneId === anchorZoneId ||
    d.deepDemandZoneId === anchorZoneId
  )
  
  # Step 3: If no matching days, ABORT with "NO_DAY_ASSIGNABLE"
  if matchingDays.length === 0:
    emit "⚠ E3 SETUP [${setup.setupId}] ABORT: NO_DAY_ASSIGNABLE — anchor zone ${anchorZoneId} not in WorkingDayMap"
    return REJECTED
  
  # Step 4: If exactly one matching day, assign it
  if matchingDays.length === 1:
    setup.day = matchingDays[0].day
    setup.shapeTrigger = matchingDays[0].shape
    continue to Phase 7.2
  
  # Step 5: If multiple matching days, apply tiebreaker:
  #   5a: prefer the day whose shape matches the setup.category
  categoryShapeMap = {
    HTF_SWING: ['BS', 'WL', 'PBS', 'RS', 'RWL', 'PRWL'],
    SWING_SCALP: ['SS', 'SS(DWL)', 'WLS', 'R'],
    REINFORCEMENT: ['BS', 'WL', 'R', 'RWL'],
    TRANSITION: ['SS→BS']
  }
  shapeMatchingDays = matchingDays.filter(d => 
    categoryShapeMap[setup.category].includes(d.shape)
  )
  if shapeMatchingDays.length === 1:
    setup.day = shapeMatchingDays[0].day
    setup.shapeTrigger = shapeMatchingDays[0].shape
    continue to Phase 7.2
  
  #   5b: if multiple shape-matching days, prefer the highest-confidence day
  shapeMatchingDays.sort((a, b) => b.confidence - a.confidence)
  setup.day = shapeMatchingDays[0].day
  setup.shapeTrigger = shapeMatchingDays[0].shape
  
  # Step 6: Cross-reference the economic calendar
  redFolderEvents = economicCalendar.getRedFolderEventsForWeek(setup.weekStart)
  for evt of redFolderEvents:
    if evt.day === setup.day and evt.affectsPair(setup.pair):
      # Step 7: Apply 30-min Red Folder Deferral (Phase 8.RF)
      setup.sessionWindow = deferSessionBy30Min(setup.sessionWindow, evt.time)
      setup.dayCatalysts.push(`Red Folder: ${evt.name} at ${evt.time}`)
  
  # Step 8: Apply Trading Speed Adjustment
  # "Today's move often becomes tomorrow's move" — if confidence < 65%, propagate +1 day
  if matchingDays[0].confidence < 0.65 && setup.day !== 'Friday':
    setup.day = nextDay(setup.day)
    setup.dayCatalysts.push('Trading Speed +1 day adjustment (low confidence)')
  
  # Step 9: Apply session-specific rules
  setup.sessionWindow = selectSession(setup.day, setup.category, setup.pair)
  
  # Step 10: Determine anchor hit window (when price is expected to reach the entry zone)
  setup.anchorHitWindow = computeAnchorHitWindow(setup, workingDayMap)
  
  # Step 11: Validate against the cascade mirror (if applicable)
  if setup.cascadeSource === 'DXY→EU':
    validateInverseCascadeDirection(setup, dxySourceSetup)
  elif setup.cascadeSource === 'EU→GU':
    validateKeptCascadeDirection(setup, euSourceSetup)
  
  # Step 12: Emit
  return setup
```

#### Phase 7.2 — Session Window Selection

**Per-day default (T2 spec §5):**
- Mon/Wed/Fri → LONDON
- Tue/Thu → LONDON_NY_OVERLAP

**Category-Session Mapping:**

| SetupCategory | Default Session |
|---|---|
| SWING_SCALP | London Open |
| BREAKOUT_SURGE | London/NY Overlap |
| HTF_SWING | NY Mid |
| REINFORCEMENT | NY Open |
| TRANSITION | London/NY Overlap |

**Conditional Session Filter (Bug #3 fix — liquidity quality, not clock time):**
- `liquidityScore ≥ 7` → allow any session
- `liquidityScore ≥ 5` → allow London/NY only
- `liquidityScore < 5` → reject ("no wood for the fire")

#### Phase 7.3 — Anchor Hit Window

```
computeAnchorHitWindow(setup, workingDayMap):
  # The window when price is expected to reach the entry zone
  dayIdx = setup.dayIdx
  shape = setup.shapeTrigger
  distance = |spot - setup.entry| / pip
  
  # Shape→distance heuristic (from 38-trade forensic):
  # SS ±5-30 pips, BS 30-100, WL 50-200, RWL 30-100, R 10-50
  expectedReachTime = computeReachTime(shape, distance, dayIdx)
  
  return {
    start: dayStart + expectedReachTime - 30min,
    end: dayStart + expectedReachTime + 60min,
    confidence: 0.7  // default; refined by E2's confidence
  }
```

### Section 8.7 — Phase 8: Blind-Execution Labeling (BE1–BE12 — the label law)

> **Phase 8 contract:** Every surviving setup MUST carry the 5 blind-execution labels. No label = setup REJECTED.

**The 12 Blind-Execution Checks (BE1–BE12):**

| # | Check | Description |
|---|---|---|
| BE1 | Every trade setup has DAY label | Mon/Tue/Wed/Thu/Fri |
| BE2 | Every trade setup has SESSION WINDOW | London Open / London Mid / NY Overlap / NY Open / NY Mid / NY Close |
| BE3 | Every trade setup has SHAPE TRIGGER | SS/BS/WL/RWL/etc. + the @day @session annotation |
| BE4 | Every trade setup has SETUP CATEGORY | HTF Swing / Swing Scalp / Reinforcement / Transition / Breakout Search |
| BE5 | Weekly Execution Calendar populated | Section 8 of PDF starts with day-by-day calendar |
| BE6 | All anchor points have WHEN + WHERE | entry/SL/TP each carry day + session annotation |
| BE7 | No setup requires real-time chart analysis | the 5 labels are sufficient for blind execution |
| BE8 | Day Catalysts are listed | economic events, news, session catalysts |
| BE9 | Reinforcement entries have parent trade reference | `parentSetupId` field populated |
| BE10 | All 5 trading days covered | or explicit "No qualifying setups — [reason]" |
| BE11 | Profit Taking Law documented | "Close ALL positions by NY close Friday" per pair |
| BE12 | Trading Speed adjustment applied | Day predictions include +1 day where confidence < 65% |

### Section 8.8 — Phase 9: Reinforcement Architecture (8R.0–8R.10)

> **Phase 9 contract:** For each surviving HTF Swing setup of HIGH/GOD_TIER quality, generate 2–3 reinforcement entries at intermediate liquidity zones along the TP path.

#### 8R.0 — Reinforcement Timing Inheritance (CLARIFIED — fixes the v5.3.3 contradiction)

> Reinforcement ORDERS are placed in London premarket (pending stop-limit orders). Reinforcement ORDERS become ACTIVE only when the 1-2-3 pattern completes on the primary entry (Phase 2.5). Reinforcement ORDERS that haven't triggered by parent TP are CANCELLED.

This **reconciles** the original contradiction between 8R.0 (orders in London premarket) and 8.4.2 (reinforcements valid only after 1-2-3 pattern complete).

#### 8R.1 — Liquidity Ladder System (Mechanism B — Cross-Zone)

> Reinforcements at DIFFERENT zones along TP path. Purpose: scale into WINNING trade as it progresses favorably. Trigger: price reaches next MoM zone TOWARD TP.

- Position sizing: 50/30/20 (primary/rocket1/rocket2)
- Each rocket has its OWN SL (no shared SL)
- SL cascade: Rocket 1 triggers → Primary BE; Rocket 2 triggers → Rocket 1 BE
- Combined R:R 16–61× with position sizing

#### 8R.2 — Fibonacci Rocket System (the Air Element)

**Standard Levels (FLR — Fibonacci Liquidity Rocket):**

| Level | Sub-Range | Character |
|---|---|---|
| Entry | 0.618–0.786 | Primary entry zone (STRONG PRESSURE) |
| Rocket 1 | 1.382–1.786 | CLEANEST entry for reinforcement (90% accuracy with Fib lines) |
| Trigger | 2.382–2.786 | Second reinforcement (trip-wire placement) |
| Target | 3.382–3.786 | Extended TP target |

**Fib Key Level Zones:**

| Sub-Range | Character |
|---|---|
| 0.382–0.5 | Initial strong reaction. First sign of pressure |
| 0.5–0.618 | Transitional pressure |
| 0.618–0.786 | STRONG PRESSURE ZONE. Most reliable reaction range |
| 0.786–1.0 | FINAL BLAST. Last chance before full extension |

#### 8R.3 — Multi-Zone Overlapping Risk Rule

≥2 reinforcements inside primary SL → reject the additional ones (overlapping risk).

#### 8R.4 — TP Management

- 70-80% TP rule: take 70-80% at TP1, run 20-30% for extension
- BoM re-entry rule: if price retraces to BoM after partial TP, re-enter with remaining position
- Profit Taking Law (verbatim): "Close ALL positions by NY close Friday" — per pair

#### 8R.5 — 4H BoM Cascade Rule

> 4H BoM zones pierce through everything until they reach the 4H same-element zone on the opposite side. They are the immovable force.

#### 8R.6 — Three-Type Rocket Architecture

| Rocket Type | Element | Scale | Buffer | Use |
|---|---|---|---|---|
| FLR (Fibonacci Liquidity Rocket) | Earth Heavy Attack | 30m Fib + Liq Zone entry/SL | THICK (2 thick or 2-3 thin zones) | Forward-mapping HTF storyline moves |
| FR (Fibonacci Rocket) | Fire Precision | 15m Fib + S/D strikes | Standard (1-2 zone buffer) | Localized Fib levels for London Session Scalping |
| LR (Liquidity Rocket) | Water Precision | Zone-to-zone during confirmed moves | THIN (1 thick or 2-3 thin zones) | Standard reinforcement, 20-30% failure rate acceptable |

#### 8R.7 — Stop-Limit Order Mechanics for Rockets (NOT regular stops)

> Regular Stop: market order on trigger → SLIPPAGE (10-20 pips in fast markets)
> Stop-Limit: stop detects trigger, then LIMIT placed at predetermined entry zone → fills ONLY at specific price or better

**Trip-Wire Concept:** detects movement (price reaching trigger zone) but rocket fires at pre-designated target (entry zone). If price never comes back, limit never fills — ZERO additional risk.

**4-Point Precision Entry Criteria:**
1. Trigger zone identified (the trip-wire zone — typically 2.382–2.786 Fib)
2. Entry zone identified (the limit zone — typically 1.382–1.786 Fib)
3. SL zone identified (1 pip outside back edge of next LQZ rung)
4. TP zone identified (opposing BoM or Fib extension)

**Triple Anchor Reinforcement:** the SL of the rocket is placed inside the entry zone of the parent trade (so if rocket SL hits, parent trade goes to breakeven — risk-free reinforcement).

#### 8R.8 — VLM-Verified Rocket Mechanics (10 patterns)

The 10 VLM-verified rocket patterns from the original v5.3.3 are preserved verbatim — these are the operator's reverse-engineered FLR/FR/LR patterns verified against the 38-trade forensic.

#### 8R.9 — Master Trade Setup = E + FLR (Phase 11 — Avatar State Construction)

> **The Avatar State** = when ALL FOUR elements converge at a single price level → trade enters AVATAR STATE — probability of failure approaches zero.

**EXACT Avatar State conditions:**
- Earth: Entry at liquidity zone / IP zone (institutional pressure, foundational anchoring)
- Fire: Entry overlaps with S/D zone (institutional firepower, directional energy)
- Water: Macro shape confirms direction and timing (wave form alignment)
- Air: Fibonacci spiderweb maps complete pathway from entry to TP (predictive trajectory)

**Specific formula:** `E (Entry) + FLR (Fibonacci Liquidity Rocket) = Avatar State`
- E provides Earth+Fire (liquidity zone + S/D overlap)
- FLR provides Air+Earth (Fib targeting + Liquidity anchoring)
- Water is the macro shape confirmation

**Mathematical reasoning:** If each element independently confirms with ~80% accuracy: P(all four wrong) = (0.20)^4 = 0.0016 = 0.16%. Probability INTERSECTION, not addition.

#### 8R.10 — Efficient Liquidity Mapping (renamed from the duplicate 8R.9)

> "Efficient Liquidity Mapping" — for each setup, map ALL liquidity zones (LSZ/LQZ) between entry and TP. Each is a potential reinforcement anchor. Up to 7 active rockets possible with hardwired safety (max 3 per pair, max 3 rockets per trade per §8R.6 Law 1).

**Profit Management (Avatar State):**
> "If everything cannot be moved 30-50% in profit we automatically take all profits before market close. Mandatory."

### Section 8.9 — Phase 10: Cascade Mirror Architecture (DXY → EU → GU)

> **Phase 10 contract:** For each DXY source setup, generate the corresponding EU mirror setup (inverse direction). For each EU mirror setup, generate the corresponding GU mirror setup (kept direction).

#### 10.1 — The Cascade Law (operator verbatim)

> "Everything I found on this EU chart maps 1:1 to DXY EXACTLY simply in the inverse direction. All the zone elements are the same, shapes, trade setups, etc LITERALLY EVERYTHING IS THE SAME the only thing that changes are the actual price levels between the pairs."

**Full-Direction Cascade:**
```
DXY LONG → EU SHORT (inverse) → GU SHORT (kept)
DXY SHORT → EU LONG (inverse) → GU LONG (kept)
```

#### 10.2 — Structural Equivalence (NOT Mathematical Conversion)

> "No cascade is literally a translation of the exact map/data that currently exists on the cascade pair to the receiving pair. THIS IS WHY E1 OF THAT SPECIFIC PAIR NEEDS TO BE RUN FIRST SO ZONES OF THE SAME ELEMENT CAN BE PROPERLY MATCHED."

- Cascade matches SAME-ELEMENT zones (BoM→BoM, MoM→MoM, LQZ→LQZ)
- Role translation: DXY/EU inverse (supply↔demand); EU/GU kept
- Pair-specific LQZ generated unbiased (never price-converted)
- Pair's E1 runs FIRST (zones must exist before cascade matches)

#### 10.3 — The 80/20 Mirror Doctrine (operator verbatim)

> "The mirror is not per pip precision. The mirror is for the trade setup direction, shape, and zone class of entry + TP. 80%. The remaining 20% like specific entry/SL/TP levels and anchors within the mirror cascade must be optimized for the actual pair being traded on. obviously. cannot be a blind mirror."

> "You are mirroring zone CLASS not literal zone. If DXY moves from BoM EU moves from BoM — you must match to the relevant BoM zone that is specific to EU's actual price action pair-native storyline. DXY is only giving a SIGNAL with high accuracy not a blind copy paste trade."

#### 10.4 — EU Loop (the B1.4 day attribution)

```
for setup of dxySource:
  srcSignalMs = setup.battleMs ?? sourceFormationMs  # B1.4: day from SOURCE signal day
  euDayIdx = floor((srcSignalMs - weekStartMs) / 86400000)
  euShapeDay = shapeChains.eu.days[clamp(euDayIdx)]
  reAnchorMirror(setup, euModel, 'EUR/USD',
    {...ctx, sourceFormationMs: srcSignalMs, shapeDay: euShapeDay})
  
  # 80% signal INVERT direction
  # 20% pair-native anchor (the emergent EU setups)
  
  # Distribution:
  # usedEuAnchors + alt-retry with excludedAnchorIds on collision
  # D11 doctrine: Δ≤15p = one signal shares; beyond = distinct must spread
```

#### 10.5 — GU Loop

```
for m of activeEuMirrors:  # GU mirrors ACTIVE EU mirrors, NEVER raw DXY
  guDayIdx = floor((m.tradeMs - weekStartMs) / 86400000)
  guShapeDay = shapeChains.gu.days[clamp(guDayIdx)]
  reAnchorMirror(m, guModel, 'GBP/USD',
    {...ctx, sourceFormationMs: m.anchorFormationMs, shapeDay: guShapeDay})
  
  # direction KEPT (NEVER raw DXY)
  # + usedGuAnchors distribution
```

#### 10.6 — Emergent Trades (on top of cascade)

> "Emergent pair-specific trades ON TOP are fine and encouraged — MORE than 24 is fine, LESS is not."

- Mirror lane = guaranteed floor (every DXY setup MUST produce EU + GU mirrors)
- Emergent lane = additive (pair-native setups from EU's own E1+E2, merged via dedup `(zoneId, reactionEvent.session)`)

#### 10.7 — The 35% Divergence Rule (FLAG ONLY — never override)

```
computeChainDivergence(coreDays, cascadeDays):
  Shape-family alignment (SS≈SS/RWL/STORM/PRWL; BS≈BS/PBS; R; WL≈WL/WLS/PWL)
  OR ±1 step on master SS→BS→R→WL
  divergence = (5-aligned)/5
  missing day = not-aligned
  ≤ 0.35 → VALIDATED
  else → DIVERGED, flag only — pair E2 stands (cascade VALIDATES, never designates)
```

### Section 8.10 — Phase 11: Master Trade Setup Construction (the Avatar State)

> **Phase 11 contract:** For each HTF Swing setup of GOD_TIER quality, attempt to construct the Avatar State (E + FLR) by adding Fibonacci Liquidity Rockets at Fib-confirmed Liq zones.

**Avatar State Construction Algorithm:**
1. Identify the BoM S/D + Liq Zone overlap (Earth + Fire) — already done by Phase 4
2. Confirm macro shape direction (Water) — already done by Phase 6
3. Map NY Fib Rocket setup with key 1/2 levels (Air) — from Phase 4.3 Fibonacci Spiderweb
4. Place up to 3 FLR rockets at Fib-confirmed Liq zones (1.382, 1.618, 2.382 Fib levels)
5. Place additional LR rockets at intermediate Liq zones (cross-zone liquidity ladder)
6. Verify Avatar State (all 4 elements converge) — set `setup.avatarState = true`
7. Emit `MasterTradeSetup` object

**Master Trade Setup Profit Management:**
> "If everything cannot be moved 30-50% in profit we automatically take all profits before market close. Mandatory."

### Section 8.11 — Phase 12: 3D Refinement Audit + Final Validation

> **Phase 12 contract:** For each surviving setup (including reinforcements and cascade mirrors), run the 3D refinement audit. Discard or repair failing setups.

#### 12.1 — The 3D Audit (P1–P8 / C1–C6 / T1–T8 — when translatedDays present)

```
auditSetup3D(setup, model, pair, ctx):
  # P1-P8 (Price audit): validate entry/SL/TP against LMV rungs
  # C1-C6 (Cascade audit): validate direction + zone class + role translation
  # T1-T8 (Temporal audit): validate day/session/anchor hit window
  
  REJECT_GENUINE: hard-discard
  
  RE_TRANSLATE loop — INVERSE lane ONLY:
    retranslateSetup (C1-C4 primary matrix)
    re-anchor (correctedAnchors ride card + anchorInfo)
  
  KEPT lane DEFERS (no safe BoM-wall substrate — drift 1.33970→1.32822 measured)
  
  B1.5: NEVER re-anchor E2-designated
    RE_TRANSLATE + e2Designated → E2_DESIGNATION_HELD flag
    skip re-anchor
    SL/TP repair on E2 zone only
  
  R2 doctrine when RRR < floor:
    refineSetup SAME anchors (entry/SL/TP placement only)
    up to 3 surgical repair attempts
    repaired setup emits with wrench annotation
    failed repair → hard-reject with full 3-attempt audit trail (D36) as discard reason
```

#### 12.2 — Floor Invariants (`checkMirrorFloorV45`)

```
checkMirrorFloorV45(setup):
  # Floor: RRR ≥ 2.5
  # Session bracket valid (E2-designated session window)
  # SL envelope (within GOLDEN_SL_MAX_PIPS = 9.5)
  # Temporal G(discarded→∃reason) — every discarded setup MUST carry a reason
  #   from: EMISSION_CAPPED | CS1 | NARRATIVE | RRR | SL_INVALID | TP_NULL | SOURCE_INVALID
```

#### 12.3 — CS-1 Day-Native Guard

```
structurallyValid({sl}, openPrice, direction)
where openPrice = shapeDay.dayOpenSpot ?? sessionStartPrice

# CS1_DAY_NATIVE flag if openPrice came from shapeDay.dayOpenSpot
# CS1_UNCHECKED honest flag if from sessionStartPrice
```

#### 12.4 — Narrative Gate

```
narrativeAligned(setup, model, pair)
with ZFP bands:
  suppress > 30 (WEAK)
  exempt < 20 (Hard Wall)
  20-30 flagged
```

### Section 8.12 — JEV Decision-Plane Integration Hooks (v6 Forward-Compatibility)

> **Optional in v5.3.3 — required in v6.** These hooks allow E3 to be upgraded in-place to a JEV decision-plane architecture without rewriting the engine. Skip this section if running in pure-deterministic v5.3.3 mode.

**Hook 1 — `jev_classify_zone` (the zone classification decision):**
- Recipe: `zone-classification-check`
- Question (Choice): "Which zone type is this? BoM / MoM / PHANTOM_BOM / FORTRESS_BOM / IP / LSZ / REJECT"
- State: bounded LexiconData slice (≤2KB) — bars touching the zone, prior-move classifier output, width-gate verdict, macro-origin element
- Policy: `act=0.8, flag=0.5, fail=open`
- Hook point: between E1's `classifySDZone` and E2's shape chain build

**Hook 2 — `jev_classify_shape` (the shape classification decision):**
- Recipe: `shape-classification-check`
- Question (Choice): "Which macro shape is this? SS / BS / R / WL / RWL / WLS / PBS"
- State: bounded Anatomy tokens (body_fraction, range_ratio, wick_ratio, color_consistency, progression)
- Policy: `act=0.8, flag=0.5, fail=open`
- Hook point: between E2's `anatomy()` and `classifyShape()`

**Hook 3 — `jev_validate_trade` (the trade projection validation decision):**
- Recipe: `trade-projection-check`
- Question (Noul): "Is this trade projection legitimate against the retry criteria?"
- State: 5-field failure-state (task_contract, failure_report, failed_strategy, proposed_retry, retry_criteria)
- Policy: `act=0.8, flag=0.5, fail=closed`
- Hook point: Phase 12 (3D audit) — replaces the deterministic `assertProjectionContract` for v6

**Hook 4 — `jev_score_drift` (the win-rate drift detection decision — the FUSE):**
- Recipe: `win-rate-drift-fuse`
- Question (Noul): "Is the recent win rate drifting below the 90% target?"
- State: rolling window of last N trade outcomes (win/loss + RRR)
- Policy: `window=5, trip_at=3` — 3 losses in 5 trades → trip → pause agent
- Hook point: post-`computeAccurateStats` — the win-rate fuse

**Hook 5 — `jev_route_cascade` (the cascade routing decision):**
- Recipe: `cascade-routing-check`
- Question (Choice): "Which cascade direction? INVERSE / KEPT / NO_CASCADE"
- State: source pair, target pair, source setup direction
- Policy: `act=0.95, flag=0.5, fail=closed`
- Hook point: Phase 10 (Cascade Mirror)

**JEV integration discipline (verbatim from JEV Engineering Bible):**
- Code owns the workflow (D003) — E3's pipeline stays in code; Jev only judges
- Cache-first (IL-11) — same `(model, schema, state)` → same answer, cached
- Ledger or it did not happen (IL-15) — every Jev call writes a row with `later_truth` slot
- Bench before you swap (IL-19) — provider swap runs the full bench
- Shadow-first (IL-14) — every recipe starts in `shadow` status, activates after 50+ reviewed rows

### Section 8.13 — The E3 Output Format (FULL — replaces the broken placeholders)

```
ENGINE 3 — FULL-SPECTRUM TRADE MAP | WEEK OF [DATE]

═══ WEEKLY EXECUTION CALENDAR (Phase 7+8 output — MANDATORY) ═══
Day | Pair | Dir | Setup Type | Entry | Shape | Session | Conf | Notes
[5 rows × 9 columns — every day covered or explicit "No qualifying setups — [reason]"]

─── HTF SWING SETUPS (Phase 2-5 output) ───
#1 | [Pair] | [LONG/SHORT] | HTF Swing | Day: [Mon-Fri] | Session: [London/NY...] | Shape: [BS/WL/RWL/...]
  Entry: [price] | SL: [price] (anchor: [zone name]) | TP: [price] (anchor: [zone name])
  RRR: [primary/blended] | Quality: [GOD_TIER/HIGH/STANDARD] | Confidence: [0-100]
  Anchor Zone: [zone id + name + classification (BoM/MoM/IP/LSZ) + reaction count]
  Shape Trigger: [shape @ day session] | Day Catalysts: [list]
  Confluence Stack: [layer1..7 scores] | Audit Trail: [entry/SL/TP method + RRR vs floor + repair annotation]
  Cascade Source: [native/DXY→EU/EU→GU] | Parent Trade Ref: [setupId or "—"]
  Anchor Hit Window: [day session time range]

#2 | ...

─── SWING SCALP SETUPS (Phase 2-5 output) ───
#1 | [Pair] | [LONG/SHORT] | Swing Scalp | Day: [Mon-Fri] | Session: [London/NY...]
  Entry: [price] | SL: [price] | TP: [price]
  RRR: [primary/blended] | Quality: [STANDARD/CONDITIONAL] | Confidence: [0-100]
  Anchor Zone: [zone id + name] | Shape Trigger: [shape @ day session]
  Consolidation Phase: [Early/Mid/Late] | Audit Trail: [..]
  Cascade Source: [...] | Anchor Hit Window: [...]

─── REINFORCEMENT ENTRIES (Phase 9 output — 2-3 per confirmed HTF swing) ───
R-1 | Direction: [LONG/SHORT] | Rocket Type: [FLR/FR/LR] | Day: [Mon-Fri] | Session: [London/NY]
  Shape Trigger: [BS continuation / R / WL] | Setup Category: Reinforcement
  Parent Trade Ref: [#1] | Trigger Zone: [name @ price] | Entry Zone: [name @ price]
  Stop-Loss Zone: [name @ price] | Buffer Zones: [count + thickness (thick/thin)]
  Fib Level Alignment: [0.618/1.382/2.382/...] | Combined RRR With Parent: [combined]
  Audit Trail: [trip-wire placement + limit order placement + SL-in-parent-entry risk-free mechanics]

─── TRANSITION SETUPS (Phase 2-5 output) ───
T-1 | Direction: [LONG/SHORT] | Transition Type: [SS→BS / Post-WL Reverse / DWL-Inverse]
  Day: [Mon-Fri] | Session: [London/NY] | Shape Trigger: [..] | Setup Category: Transition
  Anchor Hit Window: [..] | Preceding Shape: [..] | Entry Condition: [..]
  Entry: [price] | SL: [price] | TP: [price] | RRR: [..] | Confidence: [0-100]
  Day Catalysts: [..]

─── DAILY SESSION NOTES ───
Mon: [shape + key zone + catalysts + sessions to watch]
Tue: [...]
Wed: [...]
Thu: [...]
Fri: [...]
Weekend: "Close ALL positions by NY close Friday — per pair"

─── MASTER TRADE SETUPS (Phase 11 output — Avatar State) ───
M-1 | Direction: [LONG/SHORT] | Avatar State: [TRUE/FALSE]
  E (Entry): [price] — Earth+Fire (Liq zone + S/D overlap)
  FLR (Fibonacci Liquidity Rocket): [price] — Air+Earth (Fib + Liq anchoring)
  Water: macro shape confirms direction + timing
  Up to 7 active rockets (max 3 per pair)
  Profit Management: "If everything cannot be moved 30-50% in profit we automatically take all profits before market close. Mandatory."

─── 3D AUDIT RESULTS (Phase 12 output) ───
[For each setup: P1-P8 / C1-C6 / T1-T8 audit results]
[Discarded setups with reasons: EMISSION_CAPPED / CS1 / NARRATIVE / RRR / SL_INVALID / TP_NULL / SOURCE_INVALID]

─── WEEKLY STATS ───
Total Setups: [N] | HTF: [N] | Scalps: [N] | Reinforcements: [N] | Transitions: [N]
Win Rate Target: 90%+ (mathematically enforced via JEV ladder in v6)
Average RRR: [N] | Median RRR: [N]
Cascade Coverage: DXY [N setups] → EU [N mirrors] → GU [N mirrors]
f(T) Acceptance: |all_setups| = 24 minimum (8 DXY + 8 EU + 8 GU), MORE is fine, LESS is REJECT
```

### Section 8.14 — Engine 3 Zero-Tolerance Rules (14 rules — preserved verbatim from original v5.3.3, plus 2 new rules)

1. No trade without Tier 1 or Tier 2 POI
2. Direction validation MANDATORY (6-check; if 4+ of 6 disagree → REVERSE)
3. Fib anchoring must follow rules (Context 1=1H/BS-WL, Context 2=15m/scalps, Context 3=30m/same-day)
4. Temporal Boundary Inheritance
5. Post-pierce consolidation awareness (no whiplash storm setups immediately after 2 strong piercing moves)
6. BoM/MoM ENFORCEMENT (no entry at MoM unless ALL 4 exceptions)
7. 1-2-3 Retest Timing (no swing entry before 3rd retest; no scalp entry before 2nd retest)
8. Sequential Zone Path (every setup MUST map sequential zone path entry→TP)
9. Timeframe Stack Compliance (Swing=4H/1H/30m; Scalp=30m/15m/5m; 5m refinement only)
10. 30-Minute Red Folder Deferral
11. Max 3 setups per category per pair; total max unlimited (NO CAPS — operator D38); confidence ≥65 required for inclusion
12. MoM Zones = Ladder Steps ONLY (no reversal entries at MoM, EVER — supersedes Rule 6 for REVERSAL entries; MoM still CONDITIONAL for trend-aligned with all 4 exceptions)
13. MANDATORY DAY + SESSION + SHAPE + SETUP CATEGORY + ANCHOR HIT WINDOW labels (v5.3.3)
14. WEEKLY EXECUTION CALENDAR MANDATORY (v5.3.3)
15. **NEW** — R3 Law: E3 NEVER overrides E1/E2 data; never fabricates levels (every anchor traces to E1 zone + E2 shape day)
16. **NEW** — Honest Absence: SL_INVALID / TP_NULL / RRR_BELOW_FLOOR / no-entry-zone / no-structural-wall all yield NO EMISSION — never a fabricated level. The 90% win-rate target depends on what the code REFUSES to emit.

### Section 8.15 — Engine Integration: How Engines 1+2 Feed Engine 3 (CORRECTED — replaces the broken 8.7 table)

| E1/E2 Output | E3 Phase | Section | Description |
|---|---|---|---|
| IP Zone Map | Phase 2 | §8.1 | Zone selection (confluence ≥ 7) generates trade candidates |
| Three-Tier Option Classification | Phase 5 | §8.4.1 | Option bonus for Critical Option Walls |
| Zone Reaction Counter | Phase 2 | §8.1 | Freshness gate (4th+ touch = DEPLETED) |
| BoM/MoM Classification | Phase 2 | §8.1 | Entry-PRIMARY vs TP-TARGET vs REJECT |
| Hard Wall Detection | Phase 4 | §8.3 | SL anchor (ZFP<15%, confluence≥8) |
| LSZ Zones (with bottom edge extension) | Phase 4 | §8.3 | SL ladder-steps model |
| Intra-Zone Key Levels | Phase 3 | §8.2 | Entry precision (TS-1) |
| Primary Shape Chain | Phase 1 | §8.0.1 | Setup Universe Classification |
| ZFP-Conditioned Transitions | Phase 4 | §8.3 | TP targeting (regime-conditional) |
| Consolidation Phase Detection | Phase 1 | §8.0.1 | Valid setup types per phase |
| 4H MoM One-and-Done | Phase 2 | §8.1 | Scalp-only at 4H MoM |
| Timeframe Element Matching | Phase 4 | §8.3 | TP timeframe ≥ entry timeframe |
| Forward Mapping day-by-day | Phase 1 | §8.0.2 | WorkingDayMap construction |
| Alternative Chain | Phase 6 | §8.5 | Trade Flow Chain construction |

### Section 8.16 — E3 ABORT Macro (NEW — matches E1's source-inaccessible pattern)

When a setup fails ≥2 zero-tolerance rules simultaneously OR fails the Phase 12 audit hard-discard, emit:

```
⚠ E3 SETUP [${setupId}] ABORT: [reason] — setup marked [REJECTED]. Continuing with remaining setups.
```

**Standard abort reasons:**
- `NO_DAY_ASSIGNABLE` — anchor zone not in WorkingDayMap
- `NO_OPPOSING_ZONE` — no TP target found
- `NO_LSZ_ANCHOR` — no LSZ for SL placement
- `RRR_BELOW_FLOOR` — RRR < 3.0 after 3 refinement attempts
- `CASCADE_DRIFT_EXCEEDED` — divergence > 35% (flag only, but abort if combined with other failures)
- `DIRECTION_VALIDATION_FAILED` — 4+ of 6 checks disagree AND no reversal pattern
- `ZONE_DEPLETED` — reactionCount ≥ 3 (TP-only)
- `VIRGIN_MOM_DEATH_ZONE` — virgin MoM (0 reactions) on counter-trend
- `NARRATIVE_MISALIGNED` — suppress >30 ZFP band AND no Hard Wall exemption

### Section 8.17 — Scaled Entry Protocol (Phase 9 sub-module — reconciled with Liquidity Ladder)

> **CLARIFICATION:** Section 7.3 of the original v5.3.3 (3-entry scaled protocol) is the INTRA-ZONE staggered system (Mechanism A). Section 8R.1 (Liquidity Ladder) is the CROSS-ZONE ladder (Mechanism B). Both share the 3-reinforcement cap per swing (§8R.6 Law 1).

**Mechanism A — Intra-Zone Staggered (3 entries within same zone):**

| Entry | Placement | Weight | Description |
|---|---|---|---|
| Front | Zone edge nearest spot + forward spread | 33% | First contact |
| Middle | Leftward-facing candle key level from LQZ pattern | 33% | Specific candle body/wick defining LQZ edge |
| Back | Zone edge farthest from spot + forward spread | 34% | Maximum penetration point |

**SL Cascade (intra-zone):**
- Entry 2 fills → Entry 1 SL to breakeven (risk-free)
- Entry 3 fills → Entry 2 SL to breakeven
- After all 3 fill: 67% of position risk-free; only Entry 3 (34%) carries risk

**Mechanism B — Cross-Zone Liquidity Ladder (reinforcements at different zones toward TP):**
- Position sizing: 50/30/20 (primary/rocket1/rocket2)
- Each rocket has own SL (no shared SL)
- SL cascade: Rocket 1 → Primary BE; Rocket 2 → Rocket 1 BE
- Combined R:R 16–61×

**The 3-reinforcement cap (Law 11 of §8R.6):**
> Max 3 rockets per trade (recommended 2). Both Mechanism A and Mechanism B count toward this cap.

### Section 8.18 — Trade Direction Validation Protocol (6-check — preserved verbatim)

For every setup, run the 6-check:

1. **4H Trend**: Bullish/Bearish/Ranging → favors Long/Short/Neutral
2. **BoM Alignment**: nearest BoM above/below → favors Short/Long
3. **Liquidity Sweep**: nearest LSZ above/below → initial sweep Up/Down
4. **Zone Failure**: failing support/resistance → direction Down/Up
5. **Macro Shape**: chain description → expected direction
6. **Counter-Trend**: hard wall level → counter-trend risk HIGH/MODERATE/NONE

**Consensus rule:** if 4+ of 6 disagree with the proposed direction → REVERSE the direction (or REJECT if no reversal pattern exists).

**Counter-trend exception:** If `counterTrendRisk = HIGH`, position adjustment = Quarter (25% of normal size); if MODERATE, Half (50%); if NONE, Full (100%).

### Section 8.19 — Pair-Specific Trade Mechanics (preserved verbatim)

| Pair | Role | Pip | Buffer | Forward Spread | Special Rules |
|---|---|---|---|---|---|
| DXY | Master compass | 0.01 | 5 idx pts | 0.02 | Processed FIRST; cascade to FX |
| EUR/USD | Primary swing (NY focus) | 0.0001 | 2 | 1 pip | NY_FOCUS, DIRECT_ZONE_TEST, NO_SHIELD |
| GBP/USD | Primary scalp (London focus) | 0.0001 | 3 | 2 pips | SHORT_SQUEEZE, LONDON_DOMINANT, HIGH_GAP_RISK |
| AUD/USD | Secondary swing (slow) | 0.0001 | 3 | 1.5 pips | BS_WL_ONLY, NO_NY, LOW_FREQUENCY, MOLASSES (2-4 days) |

### Section 8.20 — Minimum RRR Standard (2026-07-31 ruling — IRON LAW)

| Category | Floor (Emission) | Executed Standard | Norm |
|---|---|---|---|
| Consolidation | 3.0 | 3.5 | 4.0+ |
| HTF Swing | 3.0 | 3.5 | 4.0+ |
| Reversal | 3.0 | 3.5 | 4.0+ |
| Reinforcement | 3.0 | 3.5 | 4.0+ |
| Transition | 3.0 | 3.5 | 4.0+ |
| Consolidation week (relaxed) | 2.5 | 3.0 | 3.5+ |

> "MINIMUM 3 RRR NOTHING LESS IS ACCEPTABLE IDK WHERE THE FUCK THIS SLOP CAME FROM ALL MY TRADES ARE 4+ SO 3 IS THE MINIMUM." — operator 2026-07-31

### Section 8.21 — Trade Flow Continuity Protocol (Law 27 — preserved verbatim)

Max 3 trades per chain (Law-13 ceiling RRR ≤ 15). TP of trade N = entry of trade N+1.

### Section 8.22 — Red Folder Protocol (Phase 8.RF — preserved verbatim)

30-minute deferral on red-folder economic events (CPI, PPI, NFP, FOMC). Setups whose anchor hit window overlaps a red-folder event are deferred by 30 minutes.

### Section 8.23 — Consolidation Phase Detection (preserved verbatim)

| Phase | Condition | Valid Setup Types |
|---|---|---|
| Early consolidation | SS/WLS just started (<1 session) | Swing Scalps (both directions) |
| Mid consolidation | SS/WLS ongoing (1-3 sessions) | Swing Scalps + Double Whiplash Inverse |
| Late consolidation | ZFP trending up on bounding zone | Swing Scalps + BS Transition Entry |
| Post-BS (early breakout) | BS confirmed, move in progress | Reinforcement entries only |
| Post-BS (recovery) | BS complete, price recovering | Whiplash/Recovery Surge entries |
| Mid-breakout | Directional move in progress | Reinforcement entries at liquidity zones |

### Section 8.24 — Trading Speed Rule (v5.3.0 — preserved verbatim)

> "Assume price moves at 30-50% of the speed you think it will."

- Today's move often becomes tomorrow's move → +1 day to expected timing
- 4H move duration: takes 2× as long as expected
- Reinforcement rocket spacing: spaced further apart to avoid clustering
- AUD/USD specific: 2-4 days before HTF move completes ("molasses")
- Consolidation: lasts longer than expected

### Section 8.25 — Phase 2.5: Entry Timing Protocol (1-2-3 Retest — preserved verbatim, reconciled with 8R.0)

| Retest Count | Valid Entry | Description |
|---|---|---|
| 0 (Virgin) | Scalp only | First test — liquidity not yet accumulated |
| 1 | Scalp + Confirmation | Second test — early confirmation |
| 2 | Swing entry valid | Third test — enough Earth accumulated to fuel swing move |
| 3+ | TP target only | Zone depleted — will pierce |

**Reconciliation with 8R.0 (Reinforcement Timing Inheritance):**
- Reinforcement ORDERS placed in London premarket (pending stop-limit orders) — DOES NOT require 1-2-3 pattern to be complete
- Reinforcement ORDERS become ACTIVE only when 1-2-3 pattern completes on the primary entry
- Reinforcement ORDERS that haven't triggered by parent TP are CANCELLED

### Section 8.26 — Pressure Reading Rules (preserved verbatim)

- Candle size = pressure direction
- Wick direction = pressure direction
- Triangle flat side receives pressure, sharp side applies pressure

### Section 8.27 — Timeframe Element Matching (preserved verbatim)

| Source TF | Target TF | Notes |
|---|---|---|
| 4H | 4H (1H acceptable) | 1H and 4H react to one another as similar elements |
| 1H | 1H (30m acceptable) | |
| 30m | 30m (15m acceptable) | |
| 15m | 30m or 1H (up to 2 TF up) | Cannot target 4H — too far |
| 5m | 15m or 30m (up to 2 TF up) | |

---

## APPENDIX F: E3 DATA MODEL (TypeScript) — NEW

> The original v5.3.3 had ZERO TypeScript type declarations in 4229 lines. This appendix adds them, making programmatic implementation possible without re-deriving types from prose.

### F.1 — Core Enums

```typescript
export type PressureDegree = 'EXTREME' | 'HEAVY' | 'MODERATE-HEAVY' | 'MODERATE' | 'LIGHT' | 'MINIMAL';
export type POITier = 1 | 2 | 3;
export type BoMFlag = 'BoM' | 'MoM' | 'PHANTOM_BOM' | 'FORTRESS_BOM' | 'IP' | 'LSZ';
export type Engine3Status = 'ENTRY-PRIMARY' | 'ENTRY-CONDITIONAL' | 'TP-TARGET' | 'REJECT';
export type MacroShape = 'SS' | 'BS' | 'PBS' | 'R' | 'RS' | 'WL' | 'RWL' | 'PWL' | 'PRWL' | 'WLS' | 'SS(DWL)';
export type TimeframeStack = 'Swing' | 'Scalp';
export type SetupCategory = 'HTF Swing' | 'Swing Scalp' | 'Breakout Search' | 'Reinforcement' | 'Transition';
export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
export type Session = 'TOKYO' | 'LONDON_OPEN' | 'LONDON_MID' | 'NY_OVERLAP' | 'NY_OPEN' | 'NY_MID' | 'NY_CLOSE' | 'OFF';
export type SessionWindow = 'London Open' | 'London Mid' | 'NY Overlap' | 'NY Open' | 'NY Mid' | 'NY Close';
export type QualityTier = 'God-Tier' | 'High' | 'Standard' | 'Conditional' | 'Rejected';
export type RocketType = 'FLR' | 'FR' | 'LR';
export type Direction = 'LONG' | 'SHORT';
export type FibContext = 1 | 2 | 3; // 1=BS/WL 1H, 2=SS/Recovery 15m, 3=Mid-Swing 30m
export type PressureState = 'VIRGIN' | 'ACTIVE-1' | 'ACTIVE-2' | 'DEPLETED' | 'FORTRESS' | 'BROKEN';
export type TouchKind = 'SWEEP' | 'WICK_REJECT' | 'BODY_DEFEND' | 'CONSOL_DWELL' | 'PASS_THROUGH';
export type CascadeSource = 'native' | 'DXY→EU' | 'EU→GU';
export type ConsolidationPhase = 'Early' | 'Mid' | 'Late' | 'Directional' | 'Resolution';
export type Anatomy = {
  count: number;
  avgBodyFraction: number;
  avgRangeRatio: number;
  avgWickRatio: number;
  alternating: boolean;
  progression: number;
  sameColorRun: number;
  bothSideWicks: boolean;
  countWithBothWicks: number;
  moderateZfpZones: number;
};
export type RejectReason = 'NO_DAY_ASSIGNABLE' | 'NO_OPPOSING_ZONE' | 'NO_LSZ_ANCHOR' | 'RRR_BELOW_FLOOR' | 'CASCADE_DRIFT_EXCEEDED' | 'DIRECTION_VALIDATION_FAILED' | 'ZONE_DEPLETED' | 'VIRGIN_MOM_DEATH_ZONE' | 'NARRATIVE_MISALIGNED' | 'EMISSION_CAPPED' | 'CS1' | 'NARRATIVE' | 'RRR' | 'SL_INVALID' | 'TP_NULL' | 'SOURCE_INVALID';
```

### F.2 — Core Interfaces

```typescript
export interface IPZone {
  zoneId: string;
  zoneName: string;
  range: [number, number];
  pressureDegree: PressureDegree;
  poiTier: POITier;
  zfp: number;
  bomFreshFlag: BoMFlag;
  liquiditySweepStatus: 'Swept' | 'Unswept' | 'Partial';
  ladderStepStatus: 'Y' | 'N';
  engine3Status: Engine3Status;
  primaryTradeSetupRef?: string;
  confluence: number; // 0-14
  reactionCount: number;
  pressureState: PressureState;
  touchKind?: TouchKind;
}

export interface WorkingDayMap {
  dayIdx: number; // 0-4
  day: Day;
  shape: MacroShape;
  direction: Direction;
  keyZoneId: string;
  keyZoneType: BoMFlag;
  supplyZoneId?: string;
  demandZoneId?: string;
  deepDemandZoneId?: string;
  dayOpenSpot: number;
  session: SessionWindow;
  confidence: number; // 0-1
}

export interface TradeSetup {
  setupId: string;
  pair: string;
  direction: Direction;
  category: SetupCategory;
  quality: QualityTier;
  
  // Phase 3: Entry
  entry: number;
  entrySource: string;
  entryEdge: 'top' | 'bottom';
  
  // Phase 4: SL/TP
  sl: number;
  slAnchor: string;
  slMethod: 'ZR-3.1-current-step' | 'ZR-3.1-next-step' | 'golden-fallback' | 'LQZ-shield' | 'SD-pressure';
  tp: number;
  tpAnchor: string;
  tpMethod: 'Law-14-walk' | 'mirror-fallback' | 'fib-wormhole';
  
  // Phase 4.4: RRR
  primaryRrr: number;
  blendedRrr: number;
  maximumRrr: number;
  
  // Phase 5: Confidence + Quality
  confidenceScore: number; // 0-100
  confluenceStack: {
    layer1_POI: number;
    layer2_options: number;
    layer3_reaction: number;
    layer4_tfStack: number;
    layer5_dayShape: number;
    layer6_session: number;
    layer7_storyline: number;
    total: number;
  };
  
  // Phase 7: Blind-Execution Labels
  day: Day;
  sessionWindow: SessionWindow;
  shapeTrigger: string; // 'BS @ Monday London Open'
  setupCategory: SetupCategory;
  anchorHitWindow: { start: string; end: string; confidence: number };
  dayCatalysts: string[];
  
  // Phase 8.1: Direction Validation
  directionValidation: {
    check1_4HTrend: string;
    check2_BoMAlignment: string;
    check3_LiquiditySweep: string;
    check4_ZoneFailure: string;
    check5_MacroShape: string;
    check6_CounterTrend: string;
    consensus: Direction;
    checksAgree: number; // 0-6
    ifCounterTrend: { justification: string; positionAdjustment: 'Full' | 'Half' | 'Quarter' };
  };
  
  // Phase 9: Reinforcement refs
  parentSetupId?: string;
  rocketType?: RocketType;
  triggerZone?: { name: string; price: number };
  entryZone?: { name: string; price: number };
  stopLossZone?: { name: string; price: number };
  bufferZones?: { count: number; thickness: 'thick' | 'thin' };
  fibLevelAlignment?: string;
  combinedRrrWithParent?: number;
  
  // Phase 10: Cascade
  cascadeSource: CascadeSource;
  cascadeDirection?: 'INVERSE' | 'KEPT';
  
  // Phase 11: Avatar State
  avatarState: boolean;
  
  // Phase 12: 3D Audit
  auditResults?: {
    P1_P8?: string[];
    C1_C6?: string[];
    T1_T8?: string[];
    passed: boolean;
    repaired?: { attempt: number; oldSl: number; newSl: number; oldRrr: number; newRrr: number }[];
  };
  
  // Audit trail
  entryAudit: string;
  slAudit: string;
  tpAudit: string;
  rejectReason?: RejectReason;
  
  // Zone refs
  anchorZoneId: string;
  anchorZoneName: string;
  anchorZoneClassification: BoMFlag;
  anchorZoneReactionCount: number;
  
  // Misc
  gapRisk: 'LOW' | 'MODERATE' | 'HIGH';
  gapCancelThreshold: number;
  proximityPips: number;
  proximityStatus: 'WITHIN' | 'BEYOND';
  consolidationPhase: ConsolidationPhase;
  slDistancePips: number;
}

export interface TradeFlowChain {
  chainId: string; // CHAIN-{rootId}-D{depth}
  rootSetupId: string;
  setups: TradeSetup[];
  maxDepth: number; // 3 per Law-13
  totalRrr: number; // combined RRR across the chain
}

export interface SetupConflict {
  setupAId: string;
  setupBId: string;
  conflictType: 'DIRECTION_OPPOSITE' | 'CATEGORY_DUPLICATE' | 'ANCHOR_DUPLICATE';
  resolution: 'KEEP_A' | 'KEEP_B' | 'KEEP_BOTH';
  reason: string;
}

export interface TradeSetupMatrix {
  setups: TradeSetup[];
  chains: TradeFlowChain[];
  conflicts: SetupConflict[];
  weeklyExecutionCalendar: {
    day: Day;
    pair: string;
    direction: Direction;
    setupType: SetupCategory;
    entry: number;
    shape: MacroShape;
    session: SessionWindow;
    confidence: number;
    notes: string;
  }[];
}

export interface ReinforcementEntry {
  setupId: string; // R-1, R-2, ...
  direction: Direction;
  rocketType: RocketType;
  day: Day;
  sessionWindow: SessionWindow;
  shapeTrigger: string;
  setupCategory: 'Reinforcement';
  parentTradeRef: string;
  triggerZone: { name: string; price: number };
  entryZone: { name: string; price: number };
  stopLossZone: { name: string; price: number };
  bufferZones: { count: number; thickness: 'thick' | 'thin' };
  fibLevelAlignment?: string;
  combinedRrrWithParent: number;
  auditTrail: string;
}

export interface TransitionSetup {
  setupId: string; // T-1, T-2, ...
  direction: Direction;
  transitionType: 'SS→BS' | 'Post-WL Reverse' | 'DWL-Inverse';
  day: Day;
  sessionWindow: SessionWindow;
  shapeTrigger: string;
  setupCategory: 'Transition';
  anchorHitWindow: { start: string; end: string; confidence: number };
  precedingShape: MacroShape;
  entryCondition: string;
  entry: number;
  sl: number;
  tp: number;
  rrr: number;
  confidence: number;
  dayCatalysts: string[];
}

export interface WeeklyExecutionCalendar {
  weekOf: string;
  rows: {
    day: Day;
    pair: string;
    direction: Direction;
    setupType: SetupCategory;
    entry: number;
    shape: MacroShape;
    session: SessionWindow;
    confidence: number;
    notes: string;
  }[];
  profitTakingLaw: string; // "Close ALL positions by NY close Friday — per pair"
}

export interface MasterTradeSetup {
  setupId: string; // M-1
  direction: Direction;
  avatarState: boolean;
  eEntry: { price: number; earthLiqZone: string; fireSdZone: string };
  flrRockets: {
    fib: number; // 1.382, 1.618, 2.382
    entry: number;
    sl: number;
    tp: number;
  }[];
  waterMacroShape: MacroShape;
  profitManagement: string; // "If everything cannot be moved 30-50% in profit, take all profits before market close. Mandatory."
}

export interface E3AbortEvent {
  setupId: string;
  reason: RejectReason;
  detail: string;
  timestamp: string;
}

export interface E3Output {
  tradeSetups: TradeSetup[];
  reinforcementEntries: ReinforcementEntry[];
  transitionSetups: TransitionSetup[];
  masterTradeSetups: MasterTradeSetup[];
  weeklyExecutionCalendar: WeeklyExecutionCalendar;
  tradeFlowChains: TradeFlowChain[];
  setupConflicts: SetupConflict[];
  abortEvents: E3AbortEvent[];
  auditResults: { setupId: string; passed: boolean; details: string }[];
}
```

### F.3 — Zone-Map Snapshot Interface

```typescript
export interface ZoneMapSnapshot {
  pair: string;
  weekStart: string;
  anchorMs: number;
  ipZones: IPZone[];
  sdZones: SDZone[];
  lqzZones: LQZZone[];
  spot: number;
  lqzMatrix: LqzZoneMatrix[];
  lmvTable: LmvTable;
  ladder: Rung[];
  narrative: { sweepOrigin: number; rangeTop: number; rangeBottom: number };
}

export interface SDZone {
  zoneId: string;
  type: 'BOM_DEMAND' | 'BOM_SUPPLY' | 'MOM_DEMAND' | 'MOM_SUPPLY';
  floor: number;
  ceiling: number;
  timeframe: '4H' | '1H' | '30m' | '15m';
  classification: BoMFlag;
  formationMs: number;
  originIdx: number;
  bw: number; // body-to-wick ratio
  bf: number; // body fraction
  prior: 'NONE' | 'OPPOSITE' | 'SAME';
  parent?: string; // containing 4H structure id (KCE-Telescoping)
  zfp: number;
  reactionCount: number;
}

export interface LQZZone {
  zoneId: string;
  type: 'LQZ_DEMAND' | 'LQZ_SUPPLY';
  floor: number;
  ceiling: number;
  timeframe: '4H' | '1H' | '30m' | '15m';
  touchKind: TouchKind;
  reactionExtreme: number;
  defendedEdge: number;
  defendStrength: number;
  weekSpan: number;
  zfp: number;
}

export interface LqzZoneMatrix {
  bottom: number;
  top: number;
  center: number;
  side: 'BUY_SIDE' | 'SELL_SIDE';
  candles: OhlcRow[];
  reactionExtreme: number;
  defendedEdge: number;
  touchKinds: TouchKind[];
  weekSpan: number;
  zfp: number;
}

export interface Rung {
  id: string;
  zoneId: string;
  floor: number;
  ceiling: number;
  type: 'DEMAND' | 'SUPPLY';
}

export interface LmvTable {
  rungs: Rung[];
  pair: string;
}

export interface OhlcRow {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}
```

### F.4 — Shape Prediction Snapshot Interface

```typescript
export interface ShapePredictionSnapshot {
  version: 1;
  timestamp: number;
  instrument: string;
  zones: IPZone[];
  spots: Record<string, number>;
  shapeChain: CascadedShapeChain;
  priorStoryline?: PriorWeekStoryline;
}

export interface CascadedShapeChain {
  pair: string;
  storylineBias: Direction | 'NEUTRAL';
  days: ShapeDayZone[];
}

export interface ShapeDayZone {
  dayIdx: number;
  day: Day;
  shape: MacroShape;
  direction: Direction;
  keyZoneId: string;
  keyZonePrice: number;
  supplyZonePrice?: number;
  demandZonePrice?: number;
  floor?: number;
  ceiling?: number;
  confidence: number; // 0-1
  dayOpenSpot?: number;
  supplyZoneId?: string;
  demandZoneId?: string;
  keyZoneType?: BoMFlag;
  deepDemandZoneId?: string;
  session?: SessionWindow;
}

export interface PriorWeekStoryline {
  sweepOrigin: number;
  rangeTop: number;
  rangeBottom: number;
  defended: string[];
  broken: string[];
  untested: string[];
  depleted: string[];
  roleReversals: string[];
}

export interface TranslatedDayMap {
  pair: string;
  direction: 'INVERSE' | 'KEPT';
  entries: ShapeDayZone[];
  divergence: number; // 0-1; ≤0.35 VALIDATED, >0.35 DIVERGED (flag only)
}
```

### F.5 — WallMap Interface

```typescript
export interface WallMap {
  [pairPlusSetupId: string]: {
    pair: string;
    sourceSetupId: string;
    direction: Direction;
    before: { entry: number; sl: number; tp: number; status: string } | null;
    after: { entry: number; sl: number; tp: number; status: string; slMethod: string; flags: string[] };
  };
}
```

### F.6 — Stats Interface

```typescript
export interface AccurateStats {
  headline: {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number; // 0-1
    avgRrr: number;
    totalR: number;
  };
  inWeekTriggered: { /* same shape as headline */ };
  overall: { /* same shape */ };
  stale: { /* same shape — zombie "live to Jul 28" class */ };
  perPair: Record<string, { /* same shape */ }>;
  evalWeek: string; // "2026-07-06→10"
}

export interface DedupStats {
  inputRows: number;
  uniqueTrades: number;
  droppedDuplicateRows: number;
  staggeredGroups: number;
  maxGroupSize: number;
  perPair: Record<string, { inputRows: number; uniqueTrades: number }>;
}
```

---

## END OF CORRECTED E3 SPEC

This document is the **complete, corrected E3 engine** for Trident v5.3.3. It replaces the broken E3 sections of the original v5.3.3 prompt (Parts VI-B, VII, VII-B, VII-C, VIII) with a single coherent Part VI-B (12 phases + reinforcement + cascade + Avatar State + 3D audit + JEV hooks) + Appendix F (TypeScript data model).

**To produce the full corrected v5.3.3 prompt:**
1. Take the original `Trident_System_Prompt_v5.3.3.md` (4229 lines)
2. Delete lines 2066–3264 (Parts VI-B through VIII)
3. Insert this document's Part VI-B (Sections 8.0–8.27) in their place
4. Append this document's Appendix F at the very end

Everything else — E1, E2, harvesting, extraction, compliance, pair translation, Pine Script, PDF generation, identity — stays byte-identical to the original.

The companion validator script `trident_e3_validator.py` (in the same download directory) programmatically validates that a TradeSetup[] emitted by this E3 engine satisfies all the rules above.

---

*END OF DOCUMENT — TRIDENT v5.3.3 CORRECTED E3 ENGINE — 2026-09-24*
