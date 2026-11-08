# TRIDENT CONTEXT INJECTABLE v6.0
## Complete Trade Engineering Knowledge Preservation
## BASELINE — All prior versions from v6 onward are void

**Purpose:** Context recovery injectable. If context is lost, reading this ONE document restores full awareness of the Trident Trading Engine's correct methodology. Every critical rule, mechanic, and fix is preserved here.

**Date:** 2026-05-29
**Version:** v6.0 clean rebuild (validated 75% win rate on May 18-22 2026)

---

## PART 1: WHAT THIS SYSTEM IS

### Trident Trading Engine — THREE-ENGINE ARCHITECTURE

- **Engine 1** (9-Pillar 6D Hybrid System): Maps Institutional Pressure (IP) zones. Answers: "Where are the walls? How strong are they?"
- **Engine 2** (Macro Shape Chain Map): Forward-maps shape of coming week's price action. Answers: "What path will price take?"
- **Engine 3** (Trade Setup Architecture): Builds executable trade setups from Engine 1+2. Answers: "Where do I enter, where is my stop, where is my target?"

### Multi-Pair Translation Layer

DXY provides DIRECTIONAL CONVICTION ONLY. The PAIR provides its OWN price levels. Mathematical conversion of DXY levels to pair levels produces levels 355-710 pips off reality.

---

## PART 2: THE #1 LESSON — WHY v13 FAILED AND v6 SUCCEEDED

### What v6 Did RIGHT (75% win rate, May 18-22 2026)

1. **All entries were within the current week's trading range.** Example: DXY spot at 99.28, entries at 99.05, 99.35, 99.48 — ALL within the 98.95-99.52 weekly range.

2. **Overshoot buffers saved 4/4 SL hits.** The old 3-5 pip buffers were systematically too tight. v6 used 12-15 pip buffers for DXY, 25-35 pip buffers for pairs.

3. **70% Partial TP captured profit on 2 setups** where full TP was missed by <0.10 DXY / <10 pips.

4. **Gap Risk Protocol worked.** GBP/USD opened 56 pips away from Friday entry → CANCEL original, re-enter at Monday's zone → FULL WIN.

5. **TS-6 Both Directions in SS regime.** Generated LONG floor setups and SHORT ceiling setups that v5.1 never produced. Both won.

6. **RRR Floor rejected bad setups.** Original AUD/USD 1.14x RRR → REJECTED → redesigned with proper SL → WINNING TRADE.

### What v13 Did WRONG (3/15 win rate, May 25-29 2026)

1. **Entries 100-300+ pips from current spot price.** DXY spot at 99.07, entry at 98.40 (67 pips away) — price never reached it. EUR/USD spot at 1.1636, entry at 1.172 (84 pips away) — price never reached it. GBP/USD spot at 1.3437, entry at 1.365 (213 pips away) — price never reached it.

2. **Zone proximity validation was MISSING.** The engine selected ANY zone with BoM/MoM classification regardless of distance from spot.

3. **Distant historical zones treated as actionable.** The engine picked zones from weeks/months ago that were structurally valid but completely unreachable in a consolidation week.

4. **AUD/USD swing scalps generated despite being FORBIDDEN.** AUD/USD only allows BS/WL setups, Tokyo+London sessions only.

5. **"ICT" terminology contamination.** The system is called Trident. It is NOT ICT, Smart Money Concepts, or any internet guru's methodology.

### THE FIX: Entry Proximity Validation (Section 8.7)

Every entry MUST be within MAX_ENTRY_DISTANCE of current spot:

| Pair | Swing Scalp Max | HTF Swing Max | Breakout Surge Max |
|---|---|---|---|
| DXY | 0.30 (30 pips) | 0.50 (50 pips) | 0.40 (40 pips) |
| EUR/USD | 50 pips | 80 pips | 60 pips |
| GBP/USD | 80 pips | 120 pips | 100 pips |
| AUD/USD | 50 pips | 80 pips | 60 pips |

If entry exceeds maximum → REJECT with reason: "Entry [X] is [N] pips from spot [Y]. Zone is structural but NOT actionable this week."

---

## PART 3: BoM vs MoM — THE 90% WIN RATE DIFFERENTIATOR

### BoM = Beginning of Move
- Zone at the EXACT ORIGIN of a primary directional move
- 100% GUARANTEED reaction when touched IF unmitigated
- ENTRY candidates — primary entry source
- 0-2 reactions = still has juice, valid for entry

### MoM = Middle of Move
- Continuation zones formed DURING the move
- Tend to get PIERCED most often
- TP TARGETS for opposing direction, NOT entries
- "One and done" — first retest = minor reaction, then likely pierce

### Virgin MoM Zones = DEATH ZONES
- Never enter on virgin MoM zones. Automatic REJECT.
- BoM virgin zones = exception (100% guaranteed reaction)

### Zone Reaction Counter
- 0 = virgin (strongest if BoM, unpredictable if MoM)
- 1-2 = active, still has juice
- 3 = about to fail, use for TP not entry

---

## PART 4: SINGLE TP ARCHITECTURE

ONE single TP point. Not three. Not two. ONE.

**DEFAULT TP:** Closest edge of opposing 4H BoM liquidity zone.
**WORMHOLE TP:** Dynamic — Entry Fib + 1.0 = TP Fib. Replaces zone edge for HTF Swing and Breakout Surge when conditions met.
**70% PARTIAL TP (contingency):** Take 50% position off at 70% of move. Move SL to breakeven. NOT a primary target.

---

## PART 5: STOP LOSS PLACEMENT

SL = zone boundary + CATEGORY-AWARE overshoot buffer.

| Setup Type | Buffer (System Pips) | Buffer (User Pips) |
|---|---|---|
| Swing Scalp | 15-30 | 1.5-3 |
| Breakout Surge | 25-40 | 2.5-4 |
| HTF Swing | 30-50 | 3-5 |
| Reinforcement | 20-35 | 2-3.5 |

**GBP/USD gets 35-50 pip buffers always (squeeze dynamics).**

---

## PART 6: WEEKEND PROHIBITION (ABSOLUTE)

1. NO limit orders over the weekend. EVER.
2. ALL open positions closed by Friday NY session close (5:00 PM ET)
3. Trading week = Monday open → Friday close only
4. Monday reassessed based on Monday London session data
5. If a trade is still open approaching Friday close → exit at market or partial TP

---

## PART 7: PAIR-SPECIFIC RULES

### AUD/USD
- **BS/WL setups ONLY. NO swing scalps.**
- Tokyo + London sessions ONLY. NOT NY.
- If SS regime → "No setup (AUD/USD SS regime = no valid setup types)"
- Expected: 1-3 setups per week, FEWER but HIGHER quality

### GBP/USD
- **All setup types allowed**
- Primary scalp pair (3-4x more London opportunities)
- Gap risk: ALWAYS MODERATE minimum
- Overshoot buffers: 35-50 pips (larger than all other pairs)
- Short squeeze amplification: When net shorts extreme, LONG +10 conf, SHORT -10 conf
- Weekend prohibition: ABSOLUTE

### EUR/USD
- **All setup types allowed**
- Primary swing pair, NY session focus
- Direct zone test (no liquidity shield like GBP/USD)
- Gap risk: MODERATE

---

## PART 8: GAP RISK PROTOCOL

If Monday open gap exceeds threshold from original entry → CANCEL original setup and re-enter at Monday's zone.

| Pair | Cancel Threshold |
|---|---|
| GBP/USD | 15 pips |
| EUR/USD | 20 pips |
| AUD/USD | 30 pips |
| DXY | 0.15 points |

---

## PART 9: FIBONACCI WORMHOLE (DYNAMIC)

The Fib level where a move ORIGINATES determines the Fib level where it ENDS.

**TP Fib Level = Entry Fib Level + 1.0**

| Entry Fib | TP Fib | Move Type |
|---|---|---|
| 0.236 | 1.236 | Shallow retracement |
| 0.382 | 1.382 | SS/Recovery |
| 0.500 | 1.500 | Mid-range |
| 0.618 | 1.618 | BS/WL Swing |
| 0.786 | 1.786 | Deep retracement |

NOT hardcoded. Dynamic based on origin structure.

---

## PART 10: ANTI-DERAILMENT RULES

These rules prevent the regressions that destroyed v7-v13:

**AD1:** Full 3-engine pipeline PER PAIR. Not DXY overlay.
**AD2:** Engine 3 Status column mandatory in every zone table.
**AD3:** Direction Validation 6-check mandatory for every setup.
**AD4:** Exact key level entries only. Zone range entries FORBIDDEN.
**AD5:** Reinforcement ladder mandatory per HTF swing setup.
**AD6:** No generic zone ranges. Zones anchored to actual price structure.
**AD7:** Pair-specific shape chain mandatory, not just DXY.
**AD8:** ENTRY PROXIMITY VALIDATION MANDATORY. Entries beyond max distance are REJECTED.
**AD9:** Context bloat anti-pattern. Re-read system prompt fresh for each report.
**AD10:** NO ICT/SMC terminology contamination. This is Trident, not ICT.

---

## PART 11: DXY→PAIR CAUSALITY

**DIRECTIONAL, NOT ARITHMETIC:**

```
USD macro forces → DXY → EUR/USD, GBP/USD, AUD/USD
```

- DXY provides DIRECTIONAL CONVICTION (which zones matter, which direction)
- The PAIR provides ITS OWN PRICE LEVELS (from its own MA values, swing structure, options)
- Mathematical conversion of DXY levels to pair levels produces levels 355-710 pips off reality
- This was the catastrophic failure that forced the Translation Layer

---

## PART 12: SESSION RULES

- **London = Scalp only** (30m/15m stack). 95% of NY swings don't start until 2nd half of NY session.
- **NY = Swing session** (4H/1H stack). Most setups hit TP during NY.
- **DXY moves zone-to-zone for London session, breakout doesn't start until 3pm ET**

---

## PART 13: PIP SCALE

User's 1 pip = system's 10 pips (5-digit broker).

EUR/USD: user says "30 pips" = system 0.0030 (300 5-digit pips = 30 "real" pips)
GBP/USD: user says "50 pips" = system 0.0050

---

## PART 14: 9-PILLAR IP ZONE PIPELINE

Zone data from TradingView price action + 9-Pillar IP zone pipeline:
1. P1: Pivot Points (Classic, Fib, Camarilla)
2. P2: Moving Average Confluences (EMA 20/50/100/200)
3. P3: Structure — S/D overlap
4. P4: Analyst Consensus Levels
5. P5: Prior Extremes (swing H/L)
6. P6: Round Numbers / Big Figures
7. P7: DXY Options OI (BLOCKED — CME 403)
8. P8: FX Option Strikes (from OTC expiry pages)
9. P9: 4H Zone Overlap

Max confluence: 14 (12 base + 2 BoM/MoM modifiers)
Minimum floor: 3 for BoM, 4 for MoM

---

## PART 15: WORKED EXAMPLE — v6 WINNING SETUP

**DXY-2 LONG Swing Scalp, May 18-22 2026:**
- Spot at report time: 99.28
- Entry: 99.05 (Zone #3 floor, SMA50/EMA50 confluence)
- Distance from spot: 0.23 DXY points (23 pips) — WITHIN 0.30 max ✅
- SL: 98.80 (below Weekly PP 98.82 - 0.02 buffer)
- TP1: 99.35 (Zone #2 ceiling)
- TP1.5: 99.26 (70% of move, take 50% off)
- RRR: 2.5x blended
- Monday low: 98.95 → entry triggered ✅
- SL never hit (low was 98.95, SL at 98.80) ✅
- TP1.5 reached (Mon close 99.19, Tue recovery 99.33) ✅
- TP1 reached (Tue high 99.43) ✅
- **Result: FULL WIN**

Compare to v13 failure: DXY-1 LONG at 98.40 when spot was 99.07. Distance: 67 pips. Price range was 98.97-99.54. Entry at 98.40 NEVER reached. **REJECTED by proximity validation.**

---

## PART 16: REPORTS ARE ALWAYS PDF

The final deliverable is ALWAYS a PDF file generated programmatically and saved to `/home/z/my-project/download/`. Never .txt, never .md as final output.

---

## PART 17: THIS IS TRIDENT, NOT ICT

This system is called Trident. It uses its OWN terminology:
- BoM (Beginning of Move), MoM (Middle of Move)
- IP Zones (Institutional Pressure)
- LSZ (Liquidity Sweep Zones)
- Macro Shapes (SS, BS, WL, RWL, R, WLS)
- Fibonacci Wormholes (dynamic, NOT hardcoded)

Terms like "ICT setup", "Smart Money Concepts", "order block trading", or any internet trading guru terminology are FORBIDDEN in reports and engine code. The Trident methodology is the user's own system.
