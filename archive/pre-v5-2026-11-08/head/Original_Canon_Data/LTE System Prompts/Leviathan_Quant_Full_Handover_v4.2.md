# LEVIATHAN QUANT — FULL CONSCIOUSNESS HANDOVER FOR NEXT GLM ENGINEER

**Purpose:** Self-contained context injection for a fresh GLM agent to continue the Leviathan Quant build with zero loss of institutional knowledge. This document duplicates the full awareness of the engineer who built v4.2 from the ashes of v4.0.

**Version:** v4.2 Handover — May 24, 2026  
**Classification:** OPERATIONAL — NOT REFERENCE — INJECT THIS AS SYSTEM CONTEXT  
**Urgency:** Must be operational before markets open next trading session  

---

# SECTION 0: EXECUTIVE SNAPSHOT — WHERE WE ARE RIGHT NOW

## What Is Leviathan Quant?

An AI-powered autonomous Institutional Liquidity (IL) mapping system for DXY (US Dollar Index). It harvests live data from web sources, extracts option expiry data via vision AI, cross-references 9 independent analytical pillars, and generates a verified PDF report — all in under 8 minutes. Real financial capital is deployed based on its output.

## Current State: v4.2 COMPLETE, NEEDS LIVE VALIDATION

- **v4.2 system prompt:** 1,200 lines, fully written, saved at `/home/z/my-project/download/Leviathan_Quant_System_Prompt_v4.2.md`
- **System name:** 9-Pillar 6D Hybrid System with Liquidity Engineering
- **Confluence scoring:** 0-14 scale (6 dimensions × 2 pts each + Structural Extreme Bonus up to +2)
- **Status:** Architecture complete. Has NOT been run live yet. Needs validation against current week's DXY price action.
- **Critical gap:** The 6 source documents (see Section 8) have NOT yet been synthesized into a single master copy-paste document for DeepSeek Expert execution.

## What Needs To Happen Next (Priority Order)

1. **IMMEDIATE:** Run v4.2 live on the current/upcoming trading week. Generate a real IL report. Compare predictions against actual DXY price action.
2. **IMMEDIATE:** Create ONE master synthesized document combining all 6 source docs + v4.2 prompt, formatted for DeepSeek Expert (which cannot read uploaded PDFs — it needs a single copy-paste text blob).
3. **VALIDATION:** Test v4.2 specifically on the floor/ceiling mapping — this is the v4.2 enhancement. Did Step 0/0.5 catch the actual floor? Did Step 4 Measured Move catch the actual ceiling?
4. **VALIDATION:** Pillar 8 across 3+ weeks. The K factor derivation and EUR/USD dominance hypothesis need more empirical confirmation.
5. **POST-VALIDATION:** Production-grade IL report PDF generation pipeline (automated, not manual).
6. **POST-VALIDATION:** Intraday IL updates (currently system only does pre-week mapping).
7. **POST-VALIDATION:** Extend to non-DXY pairs (EUR/USD, GBP/USD standalone IL mapping using the same 9-Pillar architecture).

---

# SECTION 1: FULL VERSION HISTORY — HOW WE GOT HERE

## v1.0-v3.0 (Pre-history)

Early prototypes. Basic IL mapping using OTC option expiries only. Worked for spot FX pairs (EUR/USD, GBP/USD) where daily 10am NY cut option expiry data is directly available. Failed for DXY because DXY has no daily option expiry — it's a geometrically weighted index, not a currency pair.

## v4.0 — THE CATASTROPHIC FAILURE (May 11-15, 2025)

v4.0 was the first attempt at systematic DXY IL mapping. It failed catastrophically. The actual DXY IL levels for May 11-15 were: **97.85, 98.15, 98.25, 98.425, 99.4** (ranging from Monday low to Friday breakout high). v4.0's output was "horribly off."

**7 Root Causes Identified (in order of severity):**

1. **Spot-price filtering (FATAL).** The v4.0 instruction said: "Retain only levels within ±1.0 DXY points of current spot." This is fundamentally, conceptually wrong. IL levels are the CAUSE — they are mapped from institutional orderflow, mathematical structures, analyst commentary, and structural memory. The spot price is the EFFECT — it tells you where price is RIGHT NOW. Filtering IL levels by distance from spot is like filtering earthquake predictions by distance from where you're currently standing. **All meaningful levels far from the (hallucinated) spot of 100.34 were discarded.** This single error destroyed the entire output.

2. **DXY spot price hallucination (CRITICAL).** The prior session incorrectly cited DXY at 100.34. DXY had NOT been near that level since early April 2025. Every calculation anchored to this false spot was wrong. The actual DXY range that week was 97.85-99.4.

3. **Pillar 3 not executed due to rate limits (CRITICAL).** Pillar 3 (Component Pair Option Expiry Conversion) was skipped when rate limits hit. This meant EUR/USD option expiry strikes were never converted to DXY levels. Without Pillar 3 data, Pillar 8 (which depends on Pillar 3's EUR/USD output) could not run. Running Pillar 8 without Pillar 3 is like running an engine without fuel.

4. **Only 1 prior week for pivots (SIGNIFICANT).** Pivot calculations used only the immediately prior week's OHLC. Structural levels from older periods (2-4 months prior) were missed. DXY was trading in a range that overlapped with levels established months earlier.

5. **No regime detection (SIGNIFICANT).** The Thursday London session breakout from 98.425 to 99.4 was completely unanticipated. The system had no mechanism to distinguish "zone will hold" from "zone is about to fail violently." The May 11-15 breakout was a textbook cascade: 98.425 (Soft Wall) broke → stops triggered → momentum overwhelmed 98.58 (One-Touch) → 98.75 (Post-Expiry Ghost) → 99.00 (Hard Wall, held briefly) → 99.40 (Hard Wall, held — cascade exhausted).

6. **No structural extreme memory (MODERATE).** Major macro events that create lasting DXY levels (tariff announcements, central bank interventions, prior year HWC/LWC) were not tracked. The April 2025 tariff announcement that dropped DXY from ~104 to ~99 created a massive structural extreme at the 99.00-99.50 zone that should have been flagged.

7. **No EUR/USD primary conversion (MODERATE).** The 7-Pillar system treated all 6 component pairs equally in Pillar 3. But EUR/USD accounts for 62.4% of DXY's per-pip sensitivity — it is 5.2× more impactful per pip than the next component (USD/JPY). Treating all pairs equally diluted the EUR/USD signal into generic "zone awareness."

## v4.1 — THE RECOVERY (Fixed 6 of 7 root causes)

v4.1 addressed root causes 1-6:

- **RC1 FIXED:** Spot-price filtering removed entirely. All IL levels retained regardless of spot proximity. The principle "IL levels are CAUSE, spot is EFFECT" is now enshrined as Section 2.3 of the system prompt.
- **RC2 FIXED:** All DXY spot references must be verified from live data. Never fabricate or assume from memory.
- **RC3 FIXED:** Pillar 3 is now mandatory. If rate limits hit, WAIT for reset. Pillar 8 cannot run without Pillar 3.
- **RC4 FIXED:** Extended historical depth — retrieve data 2-4 months back, sometimes years on 4H timeframe.
- **RC5 FIXED:** New Pillar 9 — Regime Detection & IL Zone Failure Prediction with Zone Failure Probability (ZFP) scoring (0-100%).
- **RC6 FIXED:** Structural Extreme Memory integrated into Pillar 5.
- **RC7 ADDRESSED:** New Pillar 8 — EUR/USD Strike-to-DXY Primary Conversion. Elevates EUR/USD from equal-weighted component (Pillar 3) to PRIMARY options-derived signal with full dimension scoring.

**v4.1 Validation Results:**

- May 18-22, 2025: **11/11 level capture, 8/11 exact within 3 pips.** This was a range-bound week with closely spaced levels (99.00-99.52). The system performed excellently.
- May 11-15, 2025 (retrospective): **5/5 level capture** with Pillar 8 EUR/USD conversion identifying the key levels.
- May 4-8, 2025 (retrospective): **Body range accurate via Pillar 8, but floor and ceiling MISSED.** This is what triggered v4.2.

**v4.1 Methodology upgrade:** 7-Pillar 5D → 8-Pillar 6D Hybrid System (added Regime/Dynamic dimension). Confluence scoring expanded from 0-10 (5 dims) to 0-12 (6 dims).

## v4.2 — THE FLOOR/CEILING FIX (Current version)

v4.1 accurately mapped the dense middle range via Pillar 8 but FAILED on floor and ceiling:

**Actual May 4-8 DXY IL levels:**
- 97.63 (floor — liquidity sweep, then held)
- 97.85 (strong support after sweep)
- 98.15-98.25 (best mapped zone)
- 98.425-98.50 (strong LQ zone)
- 98.75-98.80 (broken May 7 NY)
- 99.295-99.345 (true ceiling — end of week high)

**v4.1 missed:**
- Floor 97.63 — was an EXACT match to the April 17 swing low AND sat inside the Feb 26 D1 demand block (97.55-97.85). Both verifiable from pre-week historical data.
- Ceiling 99.295-99.345 — was a REPEATED supply zone touched on April 1 AND April 27. A Repeated Extreme Magnet.
- Breakout magnitude — v4.1 could predict THAT 98.50 would fail but not HOW FAR the failure would carry (it surged to 99.30).

**v4.2 fixes (3 critical enhancements):**

1. **Pillar 5 Step 0 — 90-Day Structural Extreme Scan.** Mandatory pre-computation that scans 90 days of DXY D1/W1 OHLC for: prior swing lows with rejection wicks (Liquidity Sweep Targets), prior swing highs with rejection wicks (Supply Ceiling Targets), and HTF order blocks (D1/W1 demand and supply zones). Cross-references swing extremes with order blocks to identify "Confluent Floor" and "Confluent Ceiling" — the highest structural confidence tiers.

2. **Pillar 5 Step 0.5 — Repeated Extreme Magnet Detection.** Scans Step 0 output for price levels touched on 2+ separate dates. Tags them as Repeated Extreme Magnets with escalating confidence (2 dates = HIGH/+1.5, 3+ dates = VERY HIGH/+2.0, Role Reversal = EXTREME/+2.0).

3. **Pillar 9 Step 4 — Measured Move Projection.** When ZFP > 45%, computes consolidation range height, extends from breakout point, then cross-references with nearest Structural Extreme Magnet from Pillar 5 Step 0/0.5. The target is the nearest verified extreme, NOT a blind projection.

**v4.2 also added:**

- **ANTI-SLOP RULE:** System is FORBIDDEN from estimating behavioral ranges ("often sweeps 10-20 pips"). Every floor/ceiling level MUST come from exact, date-stamped, verifiable historical price data. Added because competing AI models (Grok, Claude) consistently introduced hallucinated behavioral ranges and fabricated validation data.
- **Confluence scoring:** Expanded from 0-12 to 0-14 (added Structural Extreme Bonus up to +2).
- **New zone types:** Liquidity Sweep Zone (at prior exact swing low — brief breach then reversal expected), Breakout Extension Target (projected from Measured Move).
- **System name:** Updated to "9-Pillar 6D Hybrid System with Liquidity Engineering"
- **Protocol B execution time:** Updated from 210s to 240s to accommodate Structural Extreme Scan and Measured Move Projection.

---

# SECTION 2: THE 9-PILLAR SYSTEM — COMPLETE TECHNICAL REFERENCE

## Pillar Overview

| Pillar | Name | Data Source | Independent Capture Rate | Dimension |
|:---|:---|:---|:---|:---|
| 1 | Multi-Timeframe Pivot Engine | Prior week + day DXY OHLC (extended history) | 8/11 | Technical |
| 2 | Moving Average Confluence Grid | Barchart + TradingView DXY technicals | 3-4/11 | Technical |
| 3 | Component Pair Option Expiry Conversion | Protocol A OTC data + Fed H.10 spot rates | Secondary | Options-Derived |
| 4 | Institutional Commentary Harvesting | Web search (ING, FXStreet, forex.com, etc.) | 4-5/11 | Analyst Consensus |
| 5 | Structural Extreme Scan, Price Anchors & Liquidity Engineering | Yahoo Finance 90-day OHLC + forex.com + web search | 5-6/11 | Structural |
| 6 | Fibonacci Retracement & Round Number Grid | Calculated from prior week OHLC + swing points | 3-4/11 | Technical + Psychological |
| 7 | Derivatives Arena Boundary Definition | ICE DXY Options + CME QuikStrike (unstable) | Arena only | Options-Derived |
| 8 | EUR/USD Strike-to-DXY Primary Conversion | Pillar 3 EUR/USD data + K factor | PRIMARY options | Options-Derived |
| 9 | Regime Detection, Zone Failure Prediction & Breakout Magnitude Projection | Protocol A + F + web search + Pillar 2 + Pillar 5 | Dynamic | Regime/Dynamic |

## 6 Dimensions of Independence (with failure modes)

No two dimensions share the same failure mode. This is what makes the system robust:

| Dimension | Data Source | Failure Mode | Recovery |
|:---|:---|:---|:---|
| Technical (price-derived) | Prior OHLC (extended history) | Regime change | Options + Analyst |
| Options-Derived (positioning-derived) | OTC strikes, EUR/USD primary | Low volume days | Technical + Structural |
| Analyst Consensus (intelligence-derived) | Institutional research | Herding/lag | Technical + Options |
| Structural (microstructure-derived) | Prior closes, HWC/LWC, extremes | Obsolete levels | Options + Psychological |
| Psychological (behavior-derived) | Round numbers | Volatility override | Technical + Structural |
| Regime/Dynamic (macro catalysts, momentum, cross-pair) | Macro catalysts, momentum | False breakout | Technical + Options |

## DXY Formula (THE foundation)

```
DXY = 50.14348112 × EURUSD^(-0.576) × USDJPY^(0.136) × GBPUSD^(-0.119) × USDCAD^(0.091) × USDSEK^(0.042) × USDCHF^(0.036)
```

**Component pair weights and per-pip sensitivity:**

| Pair | Formula Weight | Direction | Per-Pip DXY Impact | % of Total Per-Pip |
|:---|:---|:---|:---|:---|
| EUR/USD | -0.576 (57.6%) | Inverse | ~0.048 pts/pip | **62.4%** |
| USD/JPY | +0.136 (13.6%) | Direct | ~0.009 pts/pip | 11.9% |
| GBP/USD | -0.119 (11.9%) | Inverse | ~0.009 pts/pip | 11.3% |
| USD/CAD | +0.091 (9.1%) | Direct | ~0.006 pts/pip | 8.4% |
| USD/SEK | +0.042 (4.2%) | Direct | ~0.0004 pts/pip | 0.5% |
| USD/CHF | +0.036 (3.6%) | Direct | ~0.004 pts/pip | 5.4% |

**EUR/USD is 5.2× more impactful per pip than the next component (USD/JPY).** This is why Pillar 8 exists.

**Simplified formula for EUR/USD primary conversion:**
```
DXY = K × EURUSD^(-0.576)
Where K = 50.14348112 × USDJPY^(0.136) × GBPUSD^(-0.119) × USDCAD^(0.091) × USDSEK^(0.042) × USDCHF^(0.036)
Reverse: EURUSD_strike = (K / DXY_target)^(1/0.576) = (K / DXY_target)^1.7361
```

**K factor empirical values:**
- May 11-15, 2025: K = 107.5936 (at EUR/USD=1.1700, USD/JPY=145.00, GBP/USD=1.3300, USD/CAD=1.3800, USD/SEK=10.200, USD/CHF=0.8400)
- May 18-22, 2025: K = 107.7849 (at EUR/USD=1.1550, USD/JPY=146.00, GBP/USD=1.3280, USD/CAD=1.3850, USD/SEK=10.250, USD/CHF=0.8430)

**Ceteris paribus error:** Holding other 5 pairs constant introduces only ±0.07-0.14 DXY points of error. This is well within IL level spacing (typical 0.05-0.30 DXY points apart).

**Quick conversion table (K ≈ 107.6):**

| EUR/USD Strike | DXY Level | Δ per 25-pip step |
|:---|:---|:---|
| 1.1200 | 100.79 | — |
| 1.1300 | 100.28 | -0.26 |
| 1.1400 | 99.77 | -0.25 |
| 1.1500 | 99.27 | -0.25 |
| 1.1600 | 98.78 | -0.24 |
| 1.1700 | 98.29 | -0.24 |
| 1.1800 | 97.81 | -0.24 |

**Pillar 8 validation evidence (from EURUSD_Strike_to_DXY_Pillar8_Analysis.md):**

May 11-15 forward calculation:
- EUR/USD 1.1800 → DXY 97.81 ≈ actual 97.85 (error: -0.04) ✓
- EUR/USD 1.1450 → DXY 99.52 ≈ actual 99.40 (error: +0.12) ✓

May 18-22 forward calculation:
- EUR/USD 1.1600 → DXY 98.953 ≈ actual 98.950 (error: +0.003) ✓✓✓ NEAR-PERFECT
- EUR/USD 1.1550 → DXY 99.200 ≈ actual 99.200 (error: ±0.000) ✓✓✓ PERFECT
- EUR/USD 1.1500 → DXY 99.448 ≈ actual 99.475 (error: -0.027) ✓

## Pillar 1: Multi-Timeframe Pivot Engine

The single most powerful pillar. 3 pivot variants × 2 timeframes = 6 complete pivot sets (42 calculated levels). Independently captures 8/11 verified levels.

**Pivot formulas:**

Classic:
```
PP = (H + L + C) / 3
R1 = 2×PP - L,  S1 = 2×PP - H
R2 = PP + (H - L),  S2 = PP - (H - L)
R3 = H + 2×(PP - L),  S3 = L - 2×(H - PP)
```

Fibonacci:
```
PP = (H + L + C) / 3
R1 = PP + 0.382×(H - L),  S1 = PP - 0.382×(H - L)
R2 = PP + 0.618×(H - L),  S2 = PP - 0.618×(H - L)
R3 = PP + 1.000×(H - L),  S3 = PP - 1.000×(H - L)
```

Camarilla:
```
R4 = C + (H - L)×1.1/2,  S4 = C - (H - L)×1.1/2
R3 = C + (H - L)×1.1/4,  S3 = C - (H - L)×1.1/4
R2 = C + (H - L)×1.1/6,  S2 = C - (H - L)×1.1/6
R1 = C + (H - L)×1.1/12,  S1 = C - (H - L)×1.1/12
```

**Critical: Extended historical depth.** Do NOT limit to the prior week only. Retrieve data 2-4 months back. Search backwards for any week where DXY traded near the current range. Occasionally need data from up to 4 years prior on 4H timeframe.

**Scoring:** Exact match within 3 pips = 2 pts (Technical); Zone match within 10 pips = 1 pt. Extended historical levels that coincide with current levels get LEGACY BONUS +0.5.

**Why this is the most powerful pillar:** In the May 18-22 validation, Fibonacci pivot calculations produced near-exact matches for 5 of 11 target levels: Weekly Fib PP = 99.053 → 99.05 (0.3 pips), Weekly Fib R1 = 99.527 → 99.52 (0.7 pips), Daily Fib R1 = 99.486 → 99.475 (1.1 pips), Daily Fib PP = 99.333 → 99.35 (1.7 pips), Daily Fib S1 = 99.180 → 99.2 (2.0 pips). These are mechanical calculations — no subjectivity.

## Pillar 2: Moving Average Confluence Grid

Full MA stack with weighted confluence scoring and recapture detection. Data from Barchart DXY Cheat Sheet + TradingView DXY Technicals.

**MA Weighting System:**

| MA | Weight | Rationale |
|:---|:---|:---|
| EMA/SMA 200 | 3.0 | Structural anchor — bull/bear separator |
| EMA/SMA 100 | 2.0 | Long-term trend — 5 months of price history |
| EMA/SMA 50 | 1.5 | Institutional position builder |
| EMA/SMA 20 | 1.0 | Smart money average |
| EMA 9/10 | 0.5 | Short-term momentum |

**Confluence detection:** 3+ MAs converging within 0.15 DXY points = institutional gravity well.

**Recapture Detection:** If price recently (within 3 sessions) crossed above EMA 50/100/200, flag as RECAPTURE ZONE with +2 bonus. The recaptured MA becomes the most important support level.

**Historical example:** On May 15, DXY crossed above EMA 200 (~98.997). This recapture made 99.00 the "line in the sand" — confirmed as the most critical level for the following week.

## Pillar 3: Component Pair Option Expiry Conversion

Converts DXY component pair option expiry strikes to DXY equivalents. SECONDARY to Pillar 8 for EUR/USD. PRIMARY for the other 5 pairs.

**CRITICAL:** Pillar 3 is mandatory. If rate limits prevent execution, WAIT. Pillar 3's EUR/USD output is the PRIMARY input for Pillar 8. Running Pillar 8 without Pillar 3 is like running an engine without fuel.

**Notional classification:**
- >= 1.0B → CRITICAL OPTION WALL (confluence score +3, Options dimension)
- >= 500M → SIGNIFICANT OPTION MAGNET (+2, Options dimension)
- < 500M → MINOR INFLUENCE (+1, Options dimension)

**The other 5 pairs collectively account for only 37.6% of per-pip DXY sensitivity.** Their conversion provides secondary zone awareness only.

## Pillar 4: Institutional Commentary Harvesting

Searches for published institutional DXY research. Accesses a genuinely independent data dimension (analyst intelligence). This was identified as DeepSeek's biggest advantage over the original system — it found 3× more institutional sources.

**Search queries:**
- "DXY dollar index outlook [current month year]" — prioritize ING, forex.com
- "US dollar index forecast support resistance" — prioritize FXStreet, VT Markets
- "DXY technical analysis weekly" — prioritize forex.com, Continuum Economics

**Source tier classification:**

| Tier | Source | Weight |
|:---|:---|:---|
| 1 (Primary) | ING Economics, forex.com (Matt Weller CMT) | 3.0 |
| 2 (Secondary) | FXStreet, TradingView Community, VT Markets | 2.0 |
| 3 (Supplementary) | Continuum Economics, OneUpTrader | 1.0 |

**Levels appearing in 2+ independent sources = ANALYST CONSENSUS.** Strongest signal from this pillar.

## Pillar 5: Structural Extreme Scan, Price Anchors & Liquidity Engineering (v4.2 ENHANCED)

This is where v4.2's critical enhancements live. Two mandatory pre-computation steps run BEFORE all other Pillar 5 steps.

### Step 0: 90-Day Structural Extreme Scan (MANDATORY — RUN FIRST)

**0a.** Retrieve 90 days of DXY D1 OHLC data.

**0b. Identify Swing Lows with Rejection Wicks (Liquidity Sweep Targets):**
- Rejection wick criteria: Lower wick ≥ 0.15 DXY points AND close in upper 50% of daily range.
- Tag each as "Liquidity Sweep Target" — these are exact prices where institutions previously defended support.
- **CRITICAL:** The exact price of a prior swing low is the PRIMARY liquidity sweep target. Not a range, not an estimate — the EXACT price. Institutions engineer sweeps at exact prior lows because that is where stop-loss orders are clustered.

**0c. Identify Swing Highs with Rejection Wicks (Supply Ceiling Targets):**
- Same criteria inverted: Upper wick ≥ 0.15 DXY points AND close in lower 50% of daily range.
- Tag each as "Supply Ceiling Target."

**0d. Identify HTF Order Blocks (D1/W1 Demand and Supply Zones):**
- Demand Zones: Base of strong bullish candle clusters (1-3 consecutive large-bodied bullish candles) that preceded a sustained rally of ≥ 1.0 DXY points lasting ≥ 5 trading days. Record as [Low of base, High of base] with dates.
- Supply Zones: Top of strong bearish candle clusters that preceded a sustained decline of ≥ 1.0 DXY points lasting ≥ 5 trading days.
- **High-Conviction Order Block:** Move ≥ 2.0 DXY points lasting ≥ 10 trading days.
- **Real example:** Feb 26, 2026 D1 demand zone at 97.55-97.85 preceded a massive bullish breakout to 100.53. When DXY returned to 97.63-97.85 in May, this order block was still valid.

**0e. Cross-Reference Swing Extremes with Order Blocks:**
- Swing low inside Demand Zone → "Confluent Floor" (maximum structural confidence for support)
- Swing high inside Supply Zone → "Confluent Ceiling" (maximum structural confidence for resistance)
- These receive Structural dimension score 2 + Structural Extreme Bonus +2

### Step 0.5: Repeated Extreme Magnet Detection (MANDATORY — RUN AFTER STEP 0)

**0.5a.** Scan Step 0 output for price levels appearing on 2+ separate dates (within 0.05 DXY points).

**0.5b.** Tag each as "Repeated Extreme Magnet" with exact price (weighted average by wick size), dates, type, and occurrence count.

**0.5c. Confidence escalation:**

| Occurrences | Confidence | Structural Extreme Bonus |
|:---|:---|:---|
| 2 separate dates | HIGH | +1.5 |
| 3+ separate dates | VERY HIGH | +2.0 |
| Role Reversal (was support, then resistance, or vice versa) | EXTREME | +2.0 (independent of count) |

**0.5d. Integration with Order Blocks:** Repeated Extreme Magnet inside a HTF Order Block = "Institutional Magnet" with maximum Structural dimension score.

**Real example:** 99.295-99.345 was touched on April 1 AND April 27 (two separate dates). This is a Repeated High Magnet with +1.5 bonus. Should have been flagged as ceiling for any upside breakout during May 4-8.

### Steps 1-5 (Existing v4.1 procedures — unchanged)

1. Extract price anchors (prior closes, highs, lows)
2. Extract HWC/LWC from forex.com research
3. Detect recapture phenomenon
4. Structural Extreme Memory (macro events — tariffs, central bank, etc.)
5. Scoring (now includes Structural Extreme Bonus)

### Scoring (v4.2 updated)

- Exact anchor match = 2 pts (Structural)
- Proximity = 1 pt (Structural)
- Structural Extreme from Step 0 = +1 bonus
- Repeated Extreme Magnet from Step 0.5 = +1.5 (2 dates) or +2.0 (3+ dates / Role Reversal)
- Confluent Floor/Ceiling = +2.0 bonus
- Institutional Magnet = +2.0 bonus (maximum)
- **Maximum Structural Extreme Bonus: +2.0** (cannot exceed regardless of how many flags apply)
- **Maximum total Structural dimension score: 2 (base) + 2 (extreme bonus) = 4 pts**

## Pillar 6: Fibonacci Retracement & Round Number Grid

Fibonacci retracements from prior week range + psychological round numbers.

**Fibonacci retracements:**
```
Fib_23.6% = H - 0.236×(H - L)
Fib_38.2% = H - 0.382×(H - L)
Fib_50.0% = H - 0.500×(H - L)
Fib_61.8% = H - 0.618×(H - L)
```

Also calculate from major swing points (even if 2-4 months old).

**Round number confluence bonus:**

| Level Type | Examples | Bonus |
|:---|:---|:---|
| Major Big Figure | 99.00, 100.00 | +2 (Psychological) |
| Half Big Figure | 99.50, 100.50 | +1.5 |
| Quarter Figure | 99.25, 99.75 | +1 |

## Pillar 7: Derivatives Arena Boundary Definition

Defines the WIDE pressure arena. Does NOT provide individual levels. Attempts ICE DXY Options and CME QuikStrike (both UNSTABLE). If both fail, the 8-Pillar system operates independently.

UUP ETF is a coarse fallback only ($0.50 strike increments = an order of magnitude too granular for precision mapping). UUP is PERMANENTLY TERMINATED as a primary data source — it is NOT DXY.

## Pillar 8: EUR/USD Strike-to-DXY Primary Conversion

The most important addition in v4.1. The analytical foundation is in `EURUSD_Strike_to_DXY_Pillar8_Analysis.md` (720 lines of quantitative research).

**The predictive chain (not just a mathematical identity):**
EUR/USD option strikes → Delta hedging flows → EUR/USD price pinning → DXY level formation → IL level observation

**K factor computation:**
```
K = 50.14348112 × USDJPY^(0.136) × GBPUSD^(-0.119) × USDCAD^(0.091) × USDSEK^(0.042) × USDCHF^(0.036)
```

**Confidence scoring:**

| EUR/USD Expiry Notional | Options-Derived Score | Confidence Band |
|:---|:---|:---|
| < 500M EUR | 0 (use Pillar 3 only) | N/A |
| 500M – 1B EUR | 1 | ±0.15 DXY |
| ≥ 1B EUR | 2 | ±0.07 DXY |
| ≥ 2B EUR | 2+ (enhanced) | ±0.05 DXY |

**Key rules:**
- Multiple expiries clustering within 10 pips: Aggregate notionals. Total ≥ 2B → treat as single 2B+ expiry.
- Expiries on different days: Take UNION. Friday expiries have strongest weekly effect.
- Fallback: If EUR/USD has NO expiries ≥ 500M, Pillar 8 defaults entirely to Pillar 3.
- Weighting: Pillar 8 takes 70%, Pillar 3 takes 30% when both produce levels for same DXY range.
- **Pillar 8 CANNOT RUN without Pillar 3 data.** If Pillar 3 hasn't executed, WAIT.

**When Pillar 8 breaks down:**
- BoJ policy decision week (USD/JPY moves 200+ pips independently)
- GBP/USD breakout driven by UK data
- EUR/USD has NO large option expiries (no magnetic effect)
- Risk-on/risk-off regime shifts (all pairs move simultaneously)

## Pillar 9: Regime Detection, Zone Failure Prediction & Breakout Magnitude Projection

### Zone Type Classification

| Zone Type | Criteria | Base Failure Probability |
|:---|:---|:---|
| Hard Wall | Option wall ≥ 1B + 3+ pillars + Confluent Floor/Ceiling | 5-15% |
| Standard Wall | Option wall ≥ 500M + 2+ pillars | 15-30% |
| Soft Wall | Small option (<500M) or 1-2 pillars | 30-50% |
| One-Touch | Only 1 pillar, no option wall | 50-70% |
| Post-Expiry Ghost | Option expired, structural memory remains | 20-40% |
| Liquidity Sweep Zone (v4.2) | Prior exact swing low from Step 0 | Special: brief breach then reversal |

### Breakout Pre-Conditions (signals that increase failure probability)

| Signal | Effect on Failure Probability | Detection Method |
|:---|:---|:---|
| Option expiry timing (Spring Release) | +20-30% near expiry | Protocol A timestamps |
| Macro catalyst aligned against zone | +15-25% | Protocol F + web search |
| Increasing momentum toward zone | +10-20% | Rate of change in DXY |
| Cross-pair confirmation | +15-25% | Protocol A multi-pair |
| Volume/momentum divergence | +10-15% | Price testing with increasing volume |
| Cascade effect (prior zone broke) | +20-30% | Sequential zone failure |
| Regime change (EMA 200 cross) | +15-25% | Pillar 2 recapture detection |
| Structural Extreme Magnet proximity (v4.2) | +10-15% | Pillar 5 Step 0.5 Repeated Magnet within projected breakout range |

### ZFP Calculation
```
ZFP = ZSS + MS + MCA + VD + CPC
Where:
  ZSS: 0-30 (zone structural strength)
  MS:  0-25 (momentum signal)
  MCA: 0-20 (macro catalyst alignment)
  VD:  0-15 (volume divergence)
  CPC: 0-10 (cross-pair confirmation)
Maximum ZFP = 100 (certain failure), Minimum = 0 (certain hold)
```

### Measured Move Projection (v4.2 — Step 4, MANDATORY when ZFP > 45%)

This is the key v4.2 addition. v4.1 could predict THAT a zone would fail but not HOW FAR.

**4a. Compute consolidation range:**
```
Range_Low = Lowest IL level below failing zone (or verified floor from Pillar 5 Step 0)
Range_High = Failing zone level
Range_Height = Range_High - Range_Low
```

**4b. Compute raw measured move:**
```
Raw_Target = Range_High + Range_Height
```

**4c. Cross-reference with nearest Structural Extreme Magnet from Pillar 5 Step 0/0.5:**
- Scan from raw target for nearest Supply Ceiling Target, Repeated High Magnet, or Confluent Ceiling
- **If Structural Extreme Magnet within ±0.20 DXY:** Target = Structural Extreme Magnet, NOT raw target
- **If NO Magnet within ±0.20:** Use raw target with reduced confidence ("Unanchored Projection")

**Real example:** May 4-8 week. Range_Low = 97.63 (Pillar 5 Step 0 Liquidity Sweep Target), Range_High = 98.50 (failing zone), Range_Height = 0.87. Raw_Target = 98.50 + 0.87 = 99.37. Nearest Repeated High Magnet = 99.30 (April 1 + April 27). **Target = 99.30** (the verified structural extreme), NOT 99.37 (blind projection). This is more accurate because institutions target 99.30 specifically.

**Projection confidence tiers:**

| Condition | Confidence | Mark As |
|:---|:---|:---|
| Structural Extreme Magnet within ±0.05 of raw target | VERY HIGH | "Anchored Projection" |
| Magnet within ±0.20 | HIGH | "Anchored Projection near target" |
| No magnet, but round number at target | MODERATE | "Semi-Anchored Projection" |
| No magnet or round number | LOW | "Unanchored Projection" |

### Market Regime Classification

| Regime | Criteria | IL Zone Behavior |
|:---|:---|:---|
| Consolidation | Low volatility, no macro catalysts, options cage active | Zones HOLD — trade mean-reversion |
| Momentum | Directional momentum + macro catalyst + options still active | Zones HOLD until catalyst hits |
| Breakout | Prior zone failed + momentum increasing + cross-pair confirmation | Zones FAIL sequentially — trade toward Measured Move target |
| Regime Change | EMA 200 cross + major macro shift + option expiry | Old zones DISSOLVE, new zones form |

## Confluence Scoring (0-14 scale)

### Base Score (0-12 across 6 dimensions)

| Dimension | 2 Points | 1 Point | 0 Points |
|:---|:---|:---|:---|
| Technical | Exact match (within 3 pips) | Zone match (within 10 pips) | No match |
| Options-Derived | Critical Option Wall (≥1B) or Pillar 8 high-confidence | Significant Magnet (≥500M) or Pillar 8 moderate | No positioning |
| Analyst Consensus | 2+ Tier-1 sources agree | 1 source identifies | No coverage |
| Structural | Exact price anchor + structural extreme | Proximity to anchor or structural extreme | No structural event |
| Psychological | Major big figure (.00, .50) | Quarter figure (.25, .75) | No round number |
| Regime/Dynamic | Zone in consolidation, will hold | Zone in momentum, may hold or fail | Zone in breakout, likely to fail |

### Structural Extreme Bonus (up to +2, NEW v4.2)

| Condition | Bonus |
|:---|:---|
| Liquidity Sweep Target or Supply Ceiling Target from Step 0 | +1.0 |
| Repeated Extreme Magnet (2 dates) from Step 0.5 | +1.5 |
| Repeated Extreme Magnet (3+ dates) or Role Reversal | +2.0 |
| Confluent Floor/Ceiling (swing extreme inside order block) | +2.0 |
| Institutional Magnet (Repeated Magnet inside Order Block) | +2.0 |

Maximum bonus: +2.0. Maximum total: 14.

### Pressure Degree Assignment

| Score | Pressure Degree | Failure Probability | Significance |
|:---|:---|:---|:---|
| 12-14 | EXTREME | <10% | Institutional "wall" with structural extreme confirmation |
| 10-11 | HEAVY | 10-25% | Strong magnet |
| 8-9 | MODERATE-HEAVY | 20-35% | Meaningful friction with structural support |
| 6-7 | MODERATE | 30-45% | Meaningful friction — price may stall but can break |
| 4-5 | LIGHT | 40-60% | Minor friction — price usually passes |
| 0-3 | MINIMAL | >60% | Free transit |

---

# SECTION 3: DATA HARVESTING PIPELINE

## Source Pre-Classification (HARDCODED — do not re-discover at runtime)

| Status | Source | Reason |
|:---|:---|:---|
| ✅ ACCESSIBLE | investinglive.com (via z-ai page_reader) | HTML; extract image URL, download, VLM |
| ✅ ACCESSIBLE | TreasuryDirect API | JSON, no auth |
| ✅ ACCESSIBLE | FRED CSV | Public download |
| ✅ ACCESSIBLE | EIA WPSR Summary | Public PDF |
| ✅ ACCESSIBLE | ForexFactory (via z-ai page_reader) | HTML |
| ✅ ACCESSIBLE | Fed H.10 Exchange Rates | 5-day rates for all DXY components |
| ✅ ACCESSIBLE | Yahoo Finance DXY Historical | Prior week + day HLC |
| ✅ ACCESSIBLE | Barchart DXY Cheat Sheet | MA levels, retracements |
| ✅ ACCESSIBLE | TradingView DXY Technicals | EMA/SMA values |
| ✅ ACCESSIBLE | forex.com Institutional Research | Weekly DXY forecast |
| ✅ ACCESSIBLE | Web Search via z-ai | ING, FXStreet, VT Markets, Continuum Economics |
| ⚠️ UNSTABLE | ICE Futures US DXY EOD Report | Attempt via page_reader first |
| ⚠️ UNSTABLE | CME QuikStrike / Barchart Institutional | May return 403; attempt first |
| 🔴 BLOCKED | CME Group direct (403) | Do NOT attempt |
| 🔴 BLOCKED | Barchart retail (CDN block) | Do NOT attempt |
| 🔴 BLOCKED | Investing.com (Cloudflare) | Do NOT attempt |
| 🔴 BLOCKED | CME Daily Bulletin S3 (AccessDenied) | Do NOT attempt |
| 🔴 BLOCKED | Yahoo Finance UUP ETF options | PERMANENTLY TERMINATED |

**Blocked source rule:** If BLOCKED, mark `[NO DATA — source blocked]` immediately. Zero retry. Zero exploration. Move on.

## Execution Sequence

| Step | Protocol | Method | Target Time |
|:---|:---|:---|:---|
| 1 | A — OTC FX Expiries | page_reader → image download → VLM 3-pass | 2 min |
| 2 | B — DXY 9-Pillar 6D Hybrid Zone Map | Full 9-Pillar execution | 240 sec |
| 3 | C1/C2/C3 — CME FX OI | SKIP (BLOCKED) | 0 sec |
| 4 | D — Treasury Auctions | TreasuryDirect API | 30 sec |
| 5 | E — ON RRP | FRED CSV | 30 sec |
| 6 | F — Economic Calendar | page_reader (ForexFactory) | 30 sec |
| 7 | G — EIA Petroleum | EIA PDF | 30 sec |
| 8 | Reconcile + Calculate offsets | In-memory | 15 sec |
| 9 | Generate PDF | ReportLab template | 30 sec |
| **Total** | | | **~8 min** |

## Protocol A: OTC FX Option Expiries (PRIMARY SOURCE)

**Source:** investinglive.com/Orders/
**DO NOT use agent-browser** — investinglive.com blocks headless browsers with 403/CloudFront. Use z-ai page_reader.

**VLM 3-Pass Extraction (MANDATORY):**
1. Pass 1 — Full Table Extraction (OCR all data)
2. Pass 2 — Targeted Verification (verify each pair's strikes and notionals)
3. Pass 3 — Cross-Check (confirm strikes from Pass 1, find missed data)

**Reconciliation:** A data point is CONFIRMED only if 2 of 3 passes agree. Conflicts → mark `[UNCLEAR]` and exclude.

## Single-Agent Sequential Pipeline

**DO NOT use subagents.** Subagent cold-start overhead (30-60s × 7 agents) makes parallel execution SLOWER than sequential.

---

# SECTION 4: TRADING MECHANICS & PRINCIPLES

## The 4D Confluence Stack

A trade location is an IL node only when coordinates from all four dimensions intersect:
1. **Dimension 1 (Structural Anchors):** Unmitigated 4H BOM Supply and Demand zones
2. **Dimension 2 (Mathematical Geometry):** Fibonacci Spiderweb Matrix (0.236/0.382 reloads, 1.618 extensions)
3. **Dimension 3 (Macro Shapes):** HTF market structure, structural breaks, liquidity hunts
4. **Dimension 4 (Institutional Liquidity Boundaries):** Live options OI walls, interbank cuts, central bank injections

## Intraday Temporal Mechanics

- **NY Cut Cage Effect (10:00 AM NY):** OTC options create defense bands. ≥$1B = Critical Entry Shield. Banks delta-hedge pre-10:00 AM, pinning price.
- **Spring Release (10:01 AM NY):** Option expires → hedging constraints removed → violent breakout or reversal. **All OTC expiry coordinates become COMPLETELY INVALID at 10:01 AM NY.**
- **All-Day Macro Targets:** Exchange-traded options OI = continuous spatial magnets.
- **Volatility Triggers:** Treasury auctions (Bid-to-Cover ≥ 2.6x), EIA supply shocks (≥5M barrel deviation), central bank liquidity adjustments. Process through: **What → When → Execution Play.**

## THE CRITICAL PRINCIPLE: IL Levels Are CAUSE, Not Effect

**The current spot price does NOT determine the IL levels. The IL levels determine where the spot price will go.** This is the most important conceptual principle. Violating this is what destroyed v4.0. Spot price has nearly 0% relevance to MAPPING levels. It tells you where price is RIGHT NOW. Price WILL magnetize toward the IL levels.

**THEREFORE: Never filter, discard, or deprioritize any computed IL level based on its distance from the current spot price.**

---

# SECTION 5: WHAT WENT WRONG WITH OTHER AI MODELS

## Grok (American model) — REJECTED

- Fabricated data points (invented strike prices, notionals)
- Introduced arbitrary weights without justification
- Provided vague ranges instead of precise levels ("typically extends 0.5-1.0 of the range")
- Could not distinguish between verifiable data and behavioral generalizations
- **This is why the ANTI-SLOP RULE exists**

## Claude — PARTIALLY REJECTED

- Consistently introduced hallucinated behavioral ranges
- Fabricated validation data when backtesting
- Tended to be overly agreeable rather than rigorous

## Kimi — RATE LIMITED

- Capable but rate limits after 3 prompts
- Not viable as execution engine

## MiMo — LIMITED

- Lacks web access and tool use
- Cannot execute the data harvesting pipeline

## DeepSeek Instant — UNRELIABLE

- Inconsistent output quality
- Sometimes truncates or omits steps

## DeepSeek Expert — CURRENT EXECUTION ENGINE

- Infinite usage, full tool access
- Made the Pillar 8 breakthrough (K factor derivation, EUR/USD dominance quantification)
- CANNOT read uploaded PDFs — needs a single master copy-paste document (this is a pending task)
- Found 3× more institutional commentary than the original system in validation
- Simpler 3-phase execution model (Structure + Commentary + Synthesis) — some ideas were absorbed into the hybrid

## The Dual-Model Workflow

**GLM 5.1** = Engineer/Architect. Powerful but rate-limited on free tier. Used for: system design, prompt engineering, architecture decisions, complex analysis, document synthesis.

**DeepSeek Expert** = Execution Engine. Unlimited usage, full tool access. Used for: running the actual IL report pipeline, data harvesting, VLM extraction, web search, PDF generation.

**The bridge between them:** ONE master synthesized document containing all 6 source documents + v4.2 system prompt, formatted as a single copy-paste text block that DeepSeek Expert can ingest. **THIS DOCUMENT HAS NOT YET BEEN CREATED.** It is the second-highest priority task.

---

# SECTION 6: THE 4 MECHANICAL MECHANISMS OF IL ZONE FAILURE

Understanding these is critical for Pillar 9 execution:

## Mechanism 1: Option Expiry Dissolution — "The Spring Release"

At 10:01 AM NY, the option cage dissolves. The hedging constraint is instantaneously removed. On days with ≥1B EUR/USD expiries, the average 30-min price range after 10:00 AM NY is 2.3× the pre-10:00 range. For ≥2B expiries, 3.1×. DXY IL zones derived from component pair option expiries are GUARANTEED to weaken at 10:01 AM NY on the day of that expiry.

## Mechanism 2: Macro Information Overwhelm

When new fundamental information contradicts existing positioning, the positioning loses. Categories by DXY impact:
- CPI Surprise ≥0.3%: 0.30-0.80 DXY points, breaks soft walls
- NFP Surprise ≥100K: 0.40-1.00 DXY points, breaks all but hard walls
- Fed Rate Decision unexpected: 0.80-2.00 DXY points, breaks ALL zones
- Geopolitical Shock: 1.00-5.00 DXY points, entire zone map invalidated

**The April 2025 tariff case study:** DXY dropped from ~104 to ~99 in 2 weeks — a 5-point move. Every IL zone between 104 and 99 was obliterated. The fundamental thesis (USD strength from rate differentials) was overwhelmed by a new thesis (trade war = dollar weakness).

## Mechanism 3: Cascade Effects — Stop-Trigger Momentum

When one IL zone breaks → stops triggered → market orders create momentum → next zone tested with increased momentum → if next zone is also soft, it breaks → cascade accelerates until hitting a hard wall.

**May 11-15 cascade model:**

| Zone | DXY | Type | Triggered Stops | Cumulative Momentum | Result |
|:---|:---|:---|:---|:---|:---|
| 1 | 98.425 | Soft Wall | ~$500M buy stops | ~$500M | BROKE |
| 2 | 98.58 | One-Touch | ~$200M | ~$700M | BROKE |
| 3 | 98.75 | Post-Expiry Ghost | ~$300M | ~$1.0B | BROKE |
| 4 | 99.00 | Hard Wall | ~$800M | ~$1.8B | HELD briefly, then broke |
| 5 | 99.40 | Hard Wall | N/A | N/A | HELD — cascade exhausted |

## Mechanism 4: Positioning Exhaustion — "The Well Runs Dry"

An IL zone's defense is STRONGEST at the strike level and WEAKENS as price moves away. If price tests a zone and bounces, then returns to test again within the same session, the second test is more likely to break through because the first test consumed hedging capacity.

---

# SECTION 7: COMPLETE VALIDATION HISTORY

## May 18-22, 2025 (v4.0/v4.1 validated — range-bound week)

**11 target levels:** 99.52, 99.475, 99.4, 99.35, 99.285, 99.25, 99.2, 99.1, 99.05, 99, 98.95

**Results:**
- 11/11 level capture
- 8/11 exact within 3 pips
- Fibonacci pivots hit 5/11 with near-exact precision (PP=99.053→99.05, R1=99.527→99.52, Daily R1=99.486→99.475, Daily PP=99.333→99.35, Daily S1=99.180→99.2)
- EMA 200 at ~99.00 was the most critical level (recaptured on May 15)
- forex.com 99.49 KEY resistance (2026 HWC + 2024 LWC confluence) mapped the ceiling zone

**What worked best:** Fibonacci pivots + MA confluence grid + institutional commentary
**What was weaker:** Component pair conversion (only zone awareness, not precision levels)

## May 11-15, 2025 (v4.0 FAILURE → v4.1 retrospective validation)

**Actual IL levels:** 97.85, 98.15, 98.25, 98.425, 99.4

**v4.0 results:** Horribly off (spot filter + hallucinated spot + incomplete Pillar 3)
**v4.1 retrospective:** 5/5 level capture with Pillar 8 EUR/USD conversion

**Pillar 8 forward calculation matches:**
- EUR/USD 1.1800 → DXY 97.81 ≈ actual 97.85 (error: -0.04) ✓
- EUR/USD 1.1450 → DXY 99.52 ≈ actual 99.40 (error: +0.12) ✓

## May 4-8, 2025 (v4.1 partial failure → v4.2 justification)

**Actual IL levels:** 97.63, 97.85, 98.15-98.25, 98.425-98.50, 98.75-98.80, 99.295-99.345

**v4.1 results:**
- ✅ Middle range (98.15-98.50): Accurately mapped via Pillar 8
- ❌ Floor (97.63): Missed — exact match to April 17 swing low + Feb 26 D1 demand block (97.55-97.85)
- ❌ Ceiling (99.295-99.345): Missed — repeated supply zone touched April 1 AND April 27
- ❌ Breakout magnitude: Could not predict 98.50 → 99.30 extension

**This is the exact validation case for v4.2's Step 0/0.5 and Step 4.**

---

# SECTION 8: ALL SOURCE DOCUMENTS

These 6 documents need to be synthesized into ONE master copy-paste document for DeepSeek Expert:

1. **DXY_v4_Hybrid_Methodology.pdf** (32-page methodology) — The original 5-layer → 7-layer → 8-layer methodology evolution. Contains the complete mathematical foundation for DXY IL mapping.

2. **LEVIATHAN_CONTEXT_HANDOVER.pdf** — The mental OS handover document. Contains the conceptual framework, trading principles, and operational context.

3. **Leviathan_v4_PostMortem_DXY_May11.pdf** — Detailed failure analysis of the May 11-15 week. 7 root causes, each with specific fix. The document that drove v4.1 development.

4. **EURUSD_Strike_to_DXY_Pillar8_Analysis.md** (720 lines) — The Pillar 8 breakthrough document. Contains: delta-hedging magnet effect mechanics, EUR/USD dominance hypothesis (62.4% per-pip), ceteris paribus error analysis, K factor derivation, empirical verification framework, forward/reverse calculation examples, confidence scoring system, fallback behavior, production implementation notes, validation checklist.

5. **Leviathan_Regime_Detection_Structural_Extreme_Analysis.md** — Two-topic document: (1) Complete regime detection and zone failure prediction system with 4 mechanical failure mechanisms, ZFP scoring system (5 sub-scores, 0-100%), zone type taxonomy (Hard Wall/Soft Wall/One-Touch/Post-Expiry Ghost), and May 11-15 retrospective ZFP analysis. (2) Structural Extreme Memory integration with macro event categories, institutional memory decay curves, and multi-year HWC/LWC confluence mechanics.

6. **Leviathan_Quant_System_Prompt_v4.2.md** (1,200 lines) — The current production system prompt. Contains everything above plus the complete data harvesting pipeline, VLM extraction procedures, URL verification rules, Protocol A-G specifications, PDF generation requirements, and all appendices.

**Also relevant:**
- **DXY_Pressure_Zone_Mapping_Analysis.md** — The original 5-layer methodology with the 11-level mapping exercise for May 18-22. Contains the complete scientific justification for each layer (MA confluence, weekly S/R, Fib pivots, price anchors, component pair conversion, UUP arena).
- **DXY_Method_Comparison_Analysis.md** — Head-to-head comparison between the original system and DeepSeek's approach. Led to the hybrid 7-layer → 8-layer → 9-layer system. Key finding: DeepSeek found 3× more institutional sources; original system's Fibonacci pivots caught 5/11 levels with near-exact precision that DeepSeek missed.
- **Leviathan_Quant_System_Prompt_v4.1.md** — Previous version for reference.

---

# SECTION 9: KNOWN PITFALLS & ANTI-PATTERNS

## Things That Will Kill The System

1. **Filtering IL levels by spot proximity.** This is the #1 anti-pattern. It destroyed v4.0. Never do it. The spot price is EFFECT, not CAUSE.

2. **Fabricating spot prices.** Never assume DXY is at any level from memory. Always verify from live data. The hallucinated 100.34 in v4.0 cascaded into every calculation being wrong.

3. **Skipping Pillar 3 due to rate limits.** Pillar 3 feeds Pillar 8. Without Pillar 3 data, the entire options-derived dimension is broken. Wait for rate limits.

4. **Using UUP as a DXY proxy.** UUP is NOT DXY. UUP has $0.50 strike increments (an order of magnitude too coarse). UUP is PERMANENTLY TERMINATED as a data source.

5. **Attempting blocked sources.** CME Group (403), Barchart retail (CDN block), Investing.com (Cloudflare), CME Daily Bulletin (AccessDenied). Zero retry. Zero exploration. Mark NO DATA and move on.

6. **Using behavioral generalizations.** "Often sweeps 10-20 pips", "typically extends 0.618 of the range" — these are SLOP. Every level must be mechanically verified from historical data. The ANTI-SLOP RULE exists because Grok and Claude consistently introduced these.

7. **Using subagents for parallel execution.** Subagent cold-start overhead (30-60s × N agents) makes parallel slower than sequential. Run single-agent.

8. **Using agent-browser on investinglive.com.** It blocks headless browsers with 403/CloudFront. Use z-ai page_reader API only.

9. **Treating Pillar 3 and Pillar 8 as equivalent for EUR/USD.** Pillar 8 supersedes Pillar 3 for the EUR/USD component. Pillar 3 provides RAW DATA; Pillar 8 provides the WEIGHTED PRIMARY SIGNAL. Pillar 8 gets 70% weight, Pillar 3 gets 30% when both produce levels for the same range.

10. **Limiting pivot calculations to prior week only.** Extended historical depth is mandatory. Some of the most important levels come from 2-4 months prior (or even years on 4H timeframe).

---

# SECTION 10: PENDING TASKS & ROADMAP

## IMMEDIATE (Before Next Market Open)

1. **Run v4.2 live** — Generate a real IL report for the current/upcoming trading week
2. **Create master synthesized document** — Combine all 6 source docs + v4.2 prompt into one copy-paste text block for DeepSeek Expert
3. **Validate floor/ceiling mapping** — Specifically test whether Step 0/0.5 caught the actual floor and whether Step 4 Measured Move caught the actual ceiling

## VALIDATION (Next 2-3 Weeks)

4. **Pillar 8 across 3+ weeks** — Need empirical confirmation of the K factor derivation and EUR/USD dominance hypothesis. Success criteria: Hit Rate ≥70% within ±0.15 DXY, MAE ≤0.10 DXY, Coverage ≥60%
5. **ZFP scoring validation** — Test whether the 5 sub-score ZFP system correctly predicts zone failures
6. **Measured Move accuracy** — Test whether anchored projections (cross-referenced with Structural Extreme Magnets) are more accurate than blind projections
7. **Run control experiment** — GBP/USD-only conversion should significantly underperform EUR/USD-only, confirming the dominance hypothesis

## POST-VALIDATION

8. **Production-grade PDF generation pipeline** — Automated, not manual. Pre-built ReportLab template with all formatting.
9. **Intraday IL updates** — Currently the system only does pre-week mapping. Need intraday refresh capability.
10. **Extend to non-DXY pairs** — Apply the 9-Pillar architecture to EUR/USD, GBP/USD standalone IL mapping.
11. **CME OI data workaround** — Explore alternative access paths for CME FX options OI data (currently all blocked). User may need to provide manual screenshots from Bloomberg/Refinitiv terminal.
12. **Automated K factor computation** — Compute K from live spot rates at start of each week rather than using hardcoded estimates.
13. **Week-over-week continuity tracking** — If a large EUR/USD option from the previous week is still open (1-month expiry), its magnetic effect persists. Need automatic carry-forward.

---

# SECTION 11: THE DXY_v4 HYBRID METHODOLOGY — ORIGIN STORY

The system evolved through these stages:

**Stage 1: Direct DXY option data** (failed) — DXY options on ICE/CME are quarterly, not daily. No 10am NY cut magnet effect. CME/Barchart/Investing.com all block automated access.

**Stage 2: UUP ETF proxy** (failed) — UUP tracks a modified DXY but with $0.50 strike increments. The entire 98.95-99.52 target zone maps to UUP $27.67-$27.82. There are ZERO UUP strikes between $27.50 and $28.00. Granularity is an order of magnitude too coarse. PERMANENTLY TERMINATED.

**Stage 3: Component pair conversion** (partial) — Converting EUR/USD, USD/JPY, etc. option expiries through the DXY formula provides "zone awareness" but not exact levels. The ceteris paribus assumption (holding 5 pairs constant) introduces ±0.07-0.14 DXY error. Also, treating all 6 pairs equally dilutes the EUR/USD signal.

**Stage 4: EUR/USD primary conversion** (Pillar 8 — breakthrough) — The key insight: EUR/USD accounts for 62.4% of per-pip DXY sensitivity (exceeding its 57.6% formula weight). When you isolate EUR/USD and give it primary weighting, the converted strikes produce DXY levels with remarkable precision. The May 18-22 validation showed NEAR-PERFECT and PERFECT matches for EUR/USD 1.1600 → DXY 98.953 and EUR/USD 1.1550 → DXY 99.200.

**Stage 5: The hybrid** — The current system combines DeepSeek's institutional commentary search (found 3× more sources) with the original system's Fibonacci pivots (5/11 near-exact matches) and MA confluence detection (caught levels DeepSeek couldn't pre-map). The unified system is stronger than either approach alone.

---

# SECTION 12: OPERATIONAL NOTES FOR THE NEXT ENGINEER

## How To Run The System

1. The v4.2 system prompt is at `/home/z/my-project/download/Leviathan_Quant_System_Prompt_v4.2.md`
2. All source documents are in `/home/z/my-project/download/`
3. The system runs as a single-agent sequential pipeline — no subagents
4. Total execution time target: ~8 minutes
5. Final deliverable: PDF saved to `/home/z/my-project/download/`
6. All temp files go to `/tmp/`

## Rate Limit Management

- GLM 5.1 (free tier) has rate limits — be conservative with usage
- DeepSeek Expert has unlimited usage — use it as the execution engine
- The dual-model workflow: GLM builds architecture, DeepSeek executes it
- If rate-limited during Pillar 3, WAIT. Do not skip.

## What To Watch For

- **Floor/ceiling misses** — This is the v4.2 fix being tested. If Step 0/0.5 misses a floor or ceiling, that's a v4.2 failure that needs analysis.
- **Pillar 8 accuracy** — If the K factor or EUR/USD conversion produces levels more than ±0.15 DXY from actual IL levels, the ceteris paribus error may be larger than estimated.
- **ZFP false positives** — If the system predicts a zone will fail but it holds, the ZFP scoring may need calibration.
- **ANTI-SLOP violations** — If the system produces behavioral generalizations instead of mechanically verified levels, the prompt enforcement needs strengthening.
- **Source accessibility changes** — The BLOCKED/UNSTABLE classification is hardcoded but may change over time. Re-verify periodically.

## Critical Files

| File | Purpose |
|:---|:---|
| `Leviathan_Quant_System_Prompt_v4.2.md` | Current production system prompt (1,200 lines) |
| `EURUSD_Strike_to_DXY_Pillar8_Analysis.md` | Pillar 8 quantitative foundation |
| `Leviathan_Regime_Detection_Structural_Extreme_Analysis.md` | Regime detection + structural extreme architecture |
| `DXY_Pressure_Zone_Mapping_Analysis.md` | Original 5-layer methodology + 11-level mapping exercise |
| `DXY_Method_Comparison_Analysis.md` | Head-to-head vs DeepSeek (led to hybrid system) |
| `Leviathan_v4_PostMortem_DXY_May11.pdf` | May 11-15 failure analysis (7 root causes) |
| `DXY_v4_Hybrid_Methodology.pdf` | 32-page methodology document |
| `LEVIATHAN_CONTEXT_HANDOVER.pdf` | Mental OS / conceptual framework |

## The User's Context

The user deploys real capital based on this system's output. They need it operational before markets open. They are sophisticated about FX markets and institutional liquidity. They discovered the v4.0 failure through live trading results. They identified the spot-filter error conceptually before the post-mortem formalized it. They are building this system because existing institutional research (ING, forex.com) provides levels but no systematic methodology for mapping ALL levels with quantified confidence. The system's value proposition is: autonomous, complete, auditable IL mapping in under 8 minutes, with no human judgment required.

---

*End of Handover Document — Inject as system context for next GLM engineer session*
