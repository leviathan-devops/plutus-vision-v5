# TRIDENT ENGINE 3 OVERHAUL SPECIFICATION v6.0.0
## Trade Setup Architecture — Hedge Fund Grade Rebuild

**Date:** 2026-05-28
**Status:** ENGINEER IMPLEMENTATION REQUIRED
**Replaces:** Engine 3 sections in Trident v5.1.0 (Sections 8.0-8.7, Part VII)
**Grade Target:** A+ (from current D+)
**Validation:** VLM + Live Market Data — May 18-22 test week

---

## ROOT CAUSE ANALYSIS — MAY 18-22 TEST WEEK

### Test Results Summary
| Category | Grade | Detail |
|---|---|---|
| Zone Placement | A+ | 9.5/10 — every tested zone reacted as predicted |
| Option Wall Analysis | A+ | 1.1600 held 3 times, 99.45 rejected perfectly |
| Macro Shape Direction | B | 8/13 shapes correct, Friday overblown |
| Trade Setup Winners | D+ | 0/7 clean winners, 3 directional wins, 4 losses/misses |
| Overall | B- for engines 1+2, D+ for engine 3 | Engine 3 is the bottleneck |

### Specific Trade Setup Failures

**FAILURE 1: DXY Setup #3 (God-Tier SHORT at Zone #1)**
- Predicted: Entry 99.48, SL 99.62, TP 99.05, RRR 3.07x
- Actual: High 99.52 (entry triggered), Low 99.12 (TP missed by 0.07)
- Root Cause: **TP OVERREACH** — TP at zone edge (99.05) required price to traverse the ENTIRE Zone #3. Price stopped 0.07 short at 99.12 (70% of zone traverse).
- Fix: 70% Partial TP rule would have taken 50% profit at ~99.23 (70% of 99.48→99.05), locking in profit.

**FAILURE 2: DXY Setup #1 (SHORT High at Zone #2)**
- Predicted: Entry 99.35, SL 99.52, TP 98.85, RRR 2.9x
- Actual: High 99.41 (entry triggered), Low 98.95, SL nearly hit Wed (99.52)
- Root Cause: **SL TOO TIGHT + TP OVERREACH** — SL at 99.52 was just 0.07 above Wed high (99.52 touched exactly). TP at 98.85 was at Zone #3 mid, price only reached 98.95.
- Fix: SL needs 0.10 buffer beyond zone edge (not 0.03). TP needs 70% partial rule.

**FAILURE 3: EUR/USD Setup EU-1 (SHORT High)**
- Predicted: Entry 1.1645, SL 1.1668, TP 1.1595, RRR 2.17x
- Actual: Tue high ~1.1656-1.1680, **SL HIT** (1.1668 < 1.1680)
- Root Cause: **SL TOO TIGHT** — 23-pip SL from entry. Zone overshoot of 12-35 pips at 1.1650 resistance level meant SL was always going to get swept before the rejection.
- Fix: SL must be 25-35 pips from entry for EUR/USD Swing Scalps (not 23). Minimum overshoot buffer = 15 pips beyond LSZ edge.

**FAILURE 4: GBP/USD Setup GU-1 (LONG High)**
- Predicted: Entry 1.3320, SL 1.3280, TP 1.3400, RRR 2.0x
- Actual: GBP/USD opened Monday at 1.3376-1.3433. Entry at 1.3320 NEVER TRIGGERED.
- Root Cause: **GAP INVALIDATION** — Report used Friday 17:00 spot (1.3325). Weekend short-squeeze momentum gapped price 50+ pips above by Monday open. The entire zone map was built on stale data.
- Fix: Gap risk assessment mandatory for every pair setup. GBP/USD with extreme short positioning = ELEVATED gap risk. If Monday gap > 30 pips from entry, CANCEL and reassess.

**FAILURE 5: AUD/USD Setup AU-1 (LONG Supplementary)**
- Predicted: Entry 0.7155, SL 0.7120, TP 0.7195, RRR 1.14x
- Actual: Mon low 0.7118 — **SL HIT** (by 2 pips). Entry triggered (open 0.7152).
- Root Cause: **SL TOO TIGHT + RRR BELOW MINIMUM** — 35-pip SL, only 2-pip overshoot buffer. Pair has 70+ pip weekly range and 15-20 pip zone overshoots. SL at 0.7120 was always going to get swept by Monday's 0.7118 low.
- Fix: SL minimum buffer = 25 pips beyond LSZ edge for AUD/USD (not 5). And RRR 1.14x should be REJECTED, not "supplementary."

---

## ENGINE 3 v6.0.0 SPECIFICATION

### Section 8.0: Engine 3 Purpose & Dependency

[UNCHANGED from v5.1.0 — Engine 3 depends on Engine 1 + Engine 2, does not operate independently]

### Section 8.0.1: Consolidation Phase Detection (NEW)

Before generating any trade setups, Engine 3 MUST classify the current market phase for EACH PAIR:

| Phase | Criteria | Trade Architecture |
|---|---|---|
| **Early Consolidation** | SS regime, days 1-2, range still forming | Swing Scalps from both ceiling and floor (TS-6) |
| **Mid Consolidation** | SS regime, days 2-3, range established | Swing Scalps + Breakout Search at range edges |
| **Late Consolidation** | SS regime, days 3-5, compression visible | Breakout Search + HTF Swing preparation |
| **Directional** | BS/WL regime active | HTF Swings + Reinforcement Rockets |
| **Resolution** | R regime, post-BS/WL | Reinforcement + Profit Taking enforcement |

**PHASE DETERMINATION RULES:**
- If shape = SS and day = Mon/Tue → Early Consolidation
- If shape = SS and day = Wed → Mid Consolidation  
- If shape = SS and day = Thu/Fri and range compressing → Late Consolidation
- If shape = BS/WL → Directional
- If shape = R → Resolution

### Section 8.0.2: Day-Level Bridge (NEW)

Each day's setups must BRIDGE from the previous day's actual outcome. The bridge is:

1. **Record yesterday's actual outcome** (high, low, close, direction)
2. **Classify current position** relative to IP zones (at ceiling, at floor, mid-range)
3. **Apply phase-appropriate architecture** (Section 8.0.1)
4. **Assign session** (London for SS scalps, NY for BS/WL, NY Mid for HTF)
5. **Check gap risk** for limit orders (Section 8.4.2)

### Section 8.1: Market Structure + IP Interaction for Reversals

[UNCHANGED from v5.1.0]

### Section 8.2: Fibonacci Spiderweb Anchoring Rules

[UNCHANGED from v5.1.0 — Context 1/2/3 anchoring rules remain]

### Section 8.3: Confluence Stack (REVISED)

| Layer | Criterion | Weight | Description |
|---|---|---|---|
| 1 | Strong IP zone | Required | Confluence score ≥ 6/14 |
| 2 | Overlapping 4H BoM S/D | Required | Tier 1 Confluent POI (0X-1X) |
| 3 | Macro-shape aligns with POI | +2 | Engine 2 predicted path goes through this zone |
| 4 | Fib spiderweb pathway clear | +2 | Correctly anchored fib reveals entry→TP path |
| 5 | IP/news data supports direction | +1 | Options, analyst consensus, or volatility triggers align |
| 6 | RRR meets minimum threshold | Required | **3.0x for Swing Scalps, 2.5x for Breakout Search, 4.0x for HTF Swings** (REVISED from 4x/5x universal) |
| 7 | No blind spots | Required | SL at verified LSZ + overshoot buffer, TP at verified zone edge |

**Quality Classification (REVISED):**
- **God-Tier:** 7/7 + RRR ≥ 5x
- **High:** Layers 1-3 + 2 of 4-7 + RRR ≥ 3.5x
- **Standard:** Layers 1-2 + 1 of 4-7 + RRR ≥ 3.0x
- **Below Minimum:** RRR < 3.0x → **REJECT** (not "supplementary")

### Section 8.4: Trade Setup Construction Protocol (COMPLETE REWRITE)

**Step 1: Phase + Shape Classification**
- Apply Consolidation Phase Detection (Section 8.0.1)
- Apply Day-Level Bridge (Section 8.0.2)
- Determine setup type architecture from phase:
  - Early/Mid Consolidation → Swing Scalp architecture (Section 8.4.3)
  - Late Consolidation → Breakout Search architecture (Section 8.4.4)
  - Directional → HTF Swing architecture (Section 8.4.5)
  - Resolution → Reinforcement architecture (Section 8.4.6)

**Step 2: Direction Determination**
- Apply the 6-check Direction Validation Protocol (Section 7.2)
- TS-6 OVERRIDE: In SS regime, BOTH SHORT from ceiling AND LONG from floor are valid co-existing setups. Do not pick one direction. Generate both.
- Counter-Trend Check (Check 6): If price is within 0.20 DXY / 30 pips of a HEAVY zone (ZFP < 15%), the counter-trend probability OVERRIDES directional consensus.

**Step 3: Entry Identification (REVISED)**
- Entry must be at a SPECIFIC key level, NOT a zone edge (TS-1)
- Priority: (1) Intra-zone key level from Step 0.6, (2) Fib level nearest zone edge, (3) Zone edge + 5-pip buffer
- For Swing Scalps (Context 2): Entry = zone edge ± 5 pips toward the trade direction
  - SHORT: Entry = ceiling zone upper edge - 5 pips
  - LONG: Entry = floor zone lower edge + 5 pips
- For HTF Swings: Entry = exact key level or fib level
- NEVER use "zone edge" alone as the entry justification. Always specify the key level or fib level that makes the zone edge the entry.

**Step 4: Stop Loss Placement (CRITICAL REVISION)**

**OLD RULE (v5.1.0):** SL = nearest LSZ edge + 3-5 pip buffer
**NEW RULE (v6.0.0):** SL = nearest LSZ edge + OVERSHOOT BUFFER

The overshoot buffer is determined by:
| Pair | Overshoot Buffer | Rationale |
|---|---|---|
| DXY | 0.10-0.15 beyond zone edge | DXY zone overshoots are typically 0.05-0.15 |
| EUR/USD | 15-25 pips beyond LSZ edge | EUR/USD liquidity sweeps extend 10-25 pips beyond zones |
| GBP/USD | 20-35 pips beyond LSZ edge | GBP/USD has larger sweeps due to thinner liquidity + squeeze dynamics |
| AUD/USD | 15-25 pips beyond LSZ edge | AUD/USD sweeps similar to EUR/USD |

**SL Placement Rules:**
1. For LONGS: SL = demand-side LSZ bottom edge MINUS overshoot buffer
2. For SHORTS: SL = supply-side LSZ top edge PLUS overshoot buffer
3. If no LSZ exists within 30 pips (pairs) / 0.30 DXY, REJECT — no valid SL anchor
4. SL must be at least 15 pips (pairs) / 0.10 DXY from entry for Swing Scalps
5. SL must be at least 25 pips (pairs) / 0.15 DXY from entry for HTF Swings
6. **NEVER place SL exactly at a round number or previous extreme** — these are liquidity magnets. Offset by 3-5 pips minimum.

**Step 5: Take Profit Identification (REVISED — 70% Partial TP Rule)**

**TP1 (Primary — ALWAYS calculated):**
- SS regime: Nearest opposing IP zone boundary (UNCHANGED)
- BS/WL regime: Fib wormhole target (UNCHANGED)
- R regime: Next IP zone in recovery direction (UNCHANGED)

**TP1.5 (70% Partial TP — NEW MANDATORY):**
- Level: Entry ± 70% of the distance from Entry to TP1
- Action: Take 50% of position off at TP1.5
- Trail: Move SL to breakeven on remaining 50%

**TP2 (Extended Target — CONDITIONAL):**
- Level: Full TP1 zone edge or fib wormhole target
- Condition: Only pursued on remaining 50% of position after TP1.5 hit
- If TP2 is reached: close remaining position

**RRR Calculation (REVISED):**
- **Realized RRR** = (TP1.5 - Entry) / (Entry - SL) — this is the ACTUAL RRR you'll capture on 50% of position
- **Maximum RRR** = (TP1 - Entry) / (Entry - SL) — this is the RRR on the other 50% if TP1 is reached
- **Blended RRR** = 0.5 × Realized + 0.5 × Maximum — this is the EXPECTED RRR
- Minimum Blended RRR: 3.0x for Swing Scalps, 2.5x for Breakout Search, 4.0x for HTF Swings

**Step 6: Gap Risk Assessment (NEW MANDATORY)**

For EVERY pair trade setup with a limit entry:
1. **Assess weekend gap risk** based on: positioning extremes, geopolitical catalysts, pending data releases
2. **Classify gap risk:** HIGH / MODERATE / LOW
3. **Set gap cancellation threshold:** If Monday open is more than [threshold] pips from entry, CANCEL setup
   - LOW gap risk: threshold = 30 pips
   - MODERATE: threshold = 20 pips
   - HIGH: threshold = 15 pips
4. **Special GBP/USD rule:** When GBP net shorts exceed £3B (heaviest in 2 years), gap risk is ALWAYS HIGH. Threshold = 15 pips. Reassess at Monday's opening zone.
5. **Output in every setup:** "Gap Risk: [LEVEL] — If Monday gap exceeds [X] pips from entry, CANCEL and reassess at [opening zone]"

**Step 7: Session Assignment (NEW MANDATORY)**

| Setup Type | Session | Time (ET) | Rationale |
|---|---|---|---|
| Swing Scalp | London Open | 02:00-05:00 | Best liquidity for scalps, clean zone tests |
| Breakout Search | London/NY overlap | 07:00-10:00 | Catalyst overlap window |
| HTF Swing | NY Mid | 10:00-14:00 | Post-data clarity, institutional flow |
| Reinforcement | NY Open / London | Variable | Follows primary setup session |
| Red Folder Deferral | Post-09:00 | 30 min after data | No entry before 30 min after high-impact data |

**Step 8: Range Validation (NEW MANDATORY)**

Before generating any Swing Scalp setup:
1. Calculate the expected daily range for the pair (based on ATR or recent range)
2. Minimum daily range for Swing Scalp at 3:1 RRR: SL distance × 4 = minimum range
3. If pair's expected daily range < minimum: **"No setup (range too narrow for [minimum RRR]:1 RRR)"**
4. Examples from A- report: AUD/USD Monday range 19 pips = REJECT. GBP/USD Monday range 61 pips = ACCEPT.

**Step 9: Time-Based Exit Rule (NEW)**

If a trade has not moved at least 50% toward TP1 within 2 trading sessions (approximately 48 hours):
- Exit at market price
- Document: "Time-based exit: [reason] — price only reached [X]% of TP distance in [N] sessions"

**Step 10: Confluence Scoring + Quality Classification**

[Apply Section 8.3 as revised above]

### Section 8.4.1: Multi-Setup Architecture (REVISED)

**OLD:** Generate ALL valid setups, no maximum
**NEW:** Maximum 14 setups per week (matching A- baseline). Quality over quantity.

1. **Weekly Execution Calendar** — Day-by-day table showing ALL setups for ALL pairs
2. **Swing Scalp pairs** — Both directions in SS regime (TS-6 at every scale)
3. **Range-Too-Narrow rejection** — Explicitly state when a pair/day has no setup
4. **No Setup is a VALID output** — "No setup (range too narrow)" or "No setup (insufficient RRR)"

### Section 8.4.2: Gap Risk Assessment Protocol (NEW)

See Step 6 above. This is now a MANDATORY section in every pair trade setup.

### Section 8.4.3: Swing Scalp Architecture (NEW — extracted from A- baseline)

```
[PAIR] [DAY] Swing Scalps
DAY: [Day] | SESSION: London 02:00-05:00 ET | SHAPE: SS | CATEGORY: Swing Scalp
ANCHOR HIT WINDOW: London Open when [PAIR] tests [CEILING] / [FLOOR]
Consolidation Range: [LOW]-[HIGH] | Phase: [Early/Mid/Late] | Scalp Stack: 30m/15m/5m

# | Dir | Entry | SL | TP1 | TP1.5 (50%) | RRR (Blended) | Conf | Zone Ref
1 | SHORT | [ceiling-5] | [high+buffer] | [floor zone edge] | [entry-70% of TP1 dist] | 3.x | 8x | Ceiling Zone #N, [reason]. SL above [level].
2 | LONG | [floor+5] | [low-buffer] | [ceiling zone edge] | [entry+70% of TP1 dist] | 3.x | 7x | Floor Zone #N, [reason]. SL below [level].
Gap Risk: [LEVEL] — If Monday gap exceeds [X] pips from entry, CANCEL and reassess.
```

### Section 8.4.4: Breakout Search Architecture (NEW)

```
[PAIR] [DAY] Breakout Search
DAY: [Day] | SESSION: [London/NY overlap] | SHAPE: [SS transitioning to BS] | CATEGORY: Breakout Search
TRIGGER: [Catalyst or zone breach condition]
MINIMUM RRR: 2.5x (lower than Swing Scalp due to directional uncertainty)

# | Dir | Entry | SL | TP1 | TP1.5 (50%) | RRR | Conf | Activation Condition
1 | [DIR] | [key level] | [LSZ+buffer] | [target zone] | [70% dist] | 2.x | 7x | [Catalyst must occur]
30-minute Red Folder deferral applies if [event] at [time].
```

### Section 8.4.5: HTF Swing Architecture (NEW — extracted from A- baseline)

```
[PAIR] [DAY] HTF Swing
DAY: [Day] | SESSION: NY Mid 10:00-14:00 ET | SHAPE: BS/WL | CATEGORY: HTF Swing
RED FOLDER PROTOCOL: [Details if applicable]
30-Minute Deferral Rule applies on Red Folder days.

# | Pair | Dir | Type | Entry | SL | TP1 | TP1.5 (50%) | RRR | Conf | Activation
1 | [pair] | [DIR] | HTF Swing | [level] | [LSZ+buffer] | [target zone] | [70%] | 4.x | 8x | [Condition]
```

### Section 8.4.6: Reinforcement Architecture (NEW — extracted from A- baseline)

```
[PAIR] [DAY] [Primary Setup Type] Reinforcement

Rocket | Type | Trigger | Entry | SL | Buffer | Fib Align
LR #1 | Liquidity | [Zone level] | [entry] | [sl] | 1 thick zone | None (pure S/D/L)
FR #2 | Fibonacci | [Fib level] | [entry] | [sl] | 2 zones | [Timeframe] Fib [level]

Combined RRR with Primary ([entry] entry): Primary [X]x + LR [Y]x + FR [Z]x = combined ~[total]x
Reinforcement placed: [LR+FR / LR only / FR only] | Buffer: [X thick zones] | PASS/FAIL
```

### Section 8.5: Engine 3 Output Format (REVISED)

**Weekly Execution Calendar (MANDATORY — Section 18 header):**
```
WEEKLY EXECUTION CALENDAR
Day-by-day summary of ALL trade setups. This is the blindly executable layer.

Day | Pair | Dir | Setup Type | Entry | Shape | Session | Conf
Mon | GBP/USD | SHORT | Swing Scalp | 1.3495 | SS | London 02-05 ET | 82
Mon | GBP/USD | LONG | Swing Scalp | 1.3440 | SS | London 05-08 ET | 78
...
Total: [N] setups across 5 days | HTF Swings: [N] | Swing Scalps: [N] | Reinforcement: [N] | Breakout Search: [N] | No Setup: [N]
```

**Individual Setup Format (REVISED with all new fields):**
```
TRADE SETUP: [Pair]-[#] [Direction] [Quality]
POI: [Zone Name] | POI Tier: [1/2] | Range: [pair range]
Direction Validation: [X]/6 checks agree → [Long/Short]
  Check 1 (4H Trend): [result]
  Check 2 (BoM Alignment): [result]
  Check 3 (Liquidity Sweep): [result]
  Check 4 (Zone Failure): [result]
  Check 5 (Macro Shape): [result]
  Check 6 (Counter-Trend): [result]
Entry: [exact level] ([key level / fib level / zone edge ± buffer] — specific anchor)
Stop Loss: [exact level] ([LSZ name] + [overshoot buffer] pips buffer — specific anchor)
Take Profit 1: [exact level] ([regime-conditional: nearest opposing zone edge])
Take Profit 1.5 (50% position): [exact level] (70% of Entry→TP1 distance)
Take Profit 2 (remaining 50%): [exact level] (full TP1 target)
Blended RRR: [X]x | Maximum RRR: [X]x | Realized RRR: [X]x
Gap Risk: [HIGH/MODERATE/LOW] — If Monday gap exceeds [X] pips, CANCEL and reassess at [level]
Session: [London 02-05 ET / NY Mid 10-14 ET / etc.]
Phase: [Early/Mid/Late Consolidation / Directional / Resolution]
Fib Spiderweb: [Context 1/2/3] | Anchor: [1H/15m/30m] | Anchor Type: [type]
Confluence Stack: Layer 1=[Y/N] ... Layer 7=[Y/N] | Score: [X]/7
Trade Flow: This setup → [next setup or reinforcement]
Day: [Monday-Wednesday / etc.]
Audit Trail: [entry calculation, SL calculation, TP calculation with inputs]
```

**No Setup Output (MANDATORY when range too narrow or RRR insufficient):**
```
[PAIR] [DAY]: No setup ([range only N pips, insufficient for 3:1 RRR] / [RRR below 3.0x minimum])
```

### Section 8.6: Engine 3 Zero-Tolerance Rules (EXPANDED)

1. **No trade without Tier 1 or Tier 2 POI** — [UNCHANGED]
2. **Direction validation is MANDATORY** — [UNCHANGED]
3. **Fib anchoring must follow rules** — [UNCHANGED]
4. **Temporal Boundary Inheritance** — [UNCHANGED]
5. **Post-pierce consolidation awareness** — [UNCHANGED]
6. **Minimum RRR is a HARD FLOOR** — RRR below 3.0x for Swing Scalps, 2.5x for Breakout Search, 4.0x for HTF Swings = REJECT. No "supplementary" downgrade. [NEW]
7. **Overshoot buffer is MANDATORY** — SL must include pair-specific overshoot buffer (15-35 pips). No 3-5 pip buffers. [NEW]
8. **Gap risk assessment is MANDATORY** — Every pair setup must include gap risk classification and cancellation threshold. [NEW]
9. **70% Partial TP is MANDATORY** — Every setup must include TP1.5 level where 50% of position is taken off. [NEW]
10. **Session assignment is MANDATORY** — Every setup must specify London/NY/NY Mid session. [NEW]
11. **Range validation is MANDATORY** — No Swing Scalp when daily range < SL × 4. [NEW]
12. **TS-6 is MANDATORY in SS** — Both SHORT from ceiling AND LONG from floor must appear for every SS pair. [NEW]
13. **No setup is a VALID output** — "No setup (range too narrow)" is better than a forced low-quality setup. [NEW]

### Section 8.7: GBP/USD Special Configuration (NEW)

GBP/USD is the operator's primary manual trading pair. It has unique characteristics that require special Engine 3 handling:

1. **Elevated Gap Risk:** GBP/USD is the most gap-prone major pair due to: (a) London/NY session overlap creates positioning extremes, (b) heavy speculative positioning (short squeeze dynamics), (c) weekend risk from UK-specific data (CPI, employment, BOE). ALWAYS classify gap risk as MODERATE minimum. When speculative shorts exceed £3B, classify as HIGH.

2. **Larger Overshoot Buffers:** GBP/USD zone overshoots are 20-35 pips (not 10-15 like EUR/USD). SL buffers must reflect this:
   - Minimum SL buffer beyond LSZ: 25 pips
   - Minimum SL distance from entry: 25 pips for Swing Scalps, 40 pips for HTF Swings

3. **Short Squeeze Amplification:** When GBP net shorts are at extreme levels (heaviest in 2+ years):
   - Any DXY weakness = amplified GBP rally
   - LONG setups get a +10 confidence bonus
   - SHORT setups get a -10 confidence penalty
   - Gap cancellation threshold = 15 pips (not 30)

4. **BOE/CPI Catalyst Awareness:** UK-specific data releases (CPI, employment, BOE rate decisions) can move GBP/USD independently of DXY. Check economic calendar for UK events.

5. **Session Optimization:** GBP/USD has best liquidity during London session (02:00-08:00 ET). Prioritize London session for Swing Scalps. NY session for HTF Swings when US data is the catalyst.

---

## IMPLEMENTATION CHECKLIST

- [ ] Replace Engine 3 sections 8.0-8.7 in system prompt with this specification
- [ ] Add Section 8.0.1 (Consolidation Phase Detection)
- [ ] Add Section 8.0.2 (Day-Level Bridge)
- [ ] Revise Section 8.3 (Confluence Stack — new RRR minimums)
- [ ] Complete rewrite of Section 8.4 (Trade Setup Construction Protocol)
- [ ] Add Section 8.4.2 (Gap Risk Assessment)
- [ ] Add Section 8.4.3 (Swing Scalp Architecture)
- [ ] Add Section 8.4.4 (Breakout Search Architecture)
- [ ] Add Section 8.4.5 (HTF Swing Architecture)
- [ ] Add Section 8.4.6 (Reinforcement Architecture)
- [ ] Revise Section 8.5 (Output Format with new fields)
- [ ] Expand Section 8.6 (Zero-Tolerance Rules — 8 new rules)
- [ ] Add Section 8.7 (GBP/USD Special Configuration)
- [ ] Update validator (trident_validator.py) with new Engine 3 checks
- [ ] Test on May 18-22 week
- [ ] Verify via TradingView + VLM

---

## VALIDATION CRITERIA

The overhaul is considered SUCCESSFUL if, when re-tested on the May 18-22 week:

1. **Zone placement:** Maintains A+ grade (9.5/10)
2. **Trade setup win rate:** At least 4/7 setups would have been profitable (vs 0/7 before)
3. **SL protection:** No SL hit by less than 15 pips (zone overshoot buffer prevents FM-02)
4. **TP achievement:** At least 70% of setups reach TP1.5 (partial profit taken)
5. **GBP/USD gap handling:** Setup explicitly states gap risk + cancellation threshold
6. **No sub-3.0x RRR setups accepted** (AUD/USD 1.14x would be REJECTED)
7. **Both directions present in SS regime** (TS-6 enforced)
