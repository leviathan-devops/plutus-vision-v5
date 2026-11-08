# ENGINE 1 + ENGINE 2 — THE BLUEPRINT (the authoritative build plan)

**AUTHORITY:** `Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md` (the prompt) +
`Original_Canon_Data/Pine Scripts/trident_v8.pine` (the SAME prompt, rendered as an indicator).
These two are the VERBATIM authority. The build package (`packages/plutus-vision-e1-automatic/`)
is a DERIVED plan — useful, NOT the authority; where it disagrees with the prompt, the prompt wins.

**THE ONE AUTHORIZED CHANGE:** the LSZ (liquidity zones) are REMOVED from Engine 1 — the baseline
(`plutus-vision-v1.pine`) already has them. Everything else is followed verbatim.

**SCOPE:** Engine 1 + Engine 2 ONLY. Engine 3 (trade setups) is IGNORED by operator ruling.

---

## ENGINE 1 — "Where are the walls? How strong?" (the prompt, Part III + the Synthesis Engine)

```
THE 9 PILLARS (harvest LEVELS — price points, with a source label)
  P1  Pivots (Classic/Fib/Camarilla weekly + daily; the MANDATORY verification: R2-S2=2(H-L))
  P2  Moving-Average confluence grid (EMA/SMA 9,10,20,50,100,200; the recapture rule)
  P3  Component-pair option-expiry → DXY conversion (the 6 component pairs; the K-factor)
  P4  Institutional commentary S/R (ING/forex.com; the source tiers)
  P5  Structural extremes (90-day swing H/L w/ rejection wicks; the 0.45 LSZ scan; STEP 0.6 intra-zone)
  P6  Fibonacci + round numbers (the prior-week range; .00/.50 majors, .25/.75 quarters)
  P7  Derivatives arena boundary
  P8  EUR/USD strike → DXY (the primary options conversion; the three-tier notional)
  P9  Regime detection + the ZFP (see below)

THE SCORE (the prompt's SYNTHESIS ENGINE — "CONFLUENCE SCORING 0-14")
  Score EACH level 0-2 across SIX dimensions:
    Technical · Options-Derived · Analyst Consensus · Structural · Psychological · Regime/Dynamic
  PLUS the STRUCTURAL EXTREME BONUS (up to +2):
    Liquidity Sweep/Supply Ceiling Target +1.0 · Repeated Magnet(2 dates) +1.5 ·
    Repeated Magnet(3+)/Role Reversal +2.0 · Confluent Floor/Ceiling +2.0 · Institutional Magnet +2.0
  Max total = 12 (base) + 2 (bonus) = 14.
  "+1 for zones formed AFTER consolidation (POST-CONSOLIDATION ZONE)."

THE ZONE ASSEMBLY (the prompt's steps 1-9)
  1. Collect ALL levels (never filter by spot proximity). Sort.
  2. Score each (the 0-14 above).
  3. CLUSTERING SCAN: 3+ levels within 0.15 DXY = HIGH-DENSITY ZONE; pairs within 0.10 = TIGHT CONFLUENCE.
  4. Group into zones (cluster within 0.10-0.15).
  5. Assign the degree from the GROUP's HIGHEST-scoring level.
  6. Assign ZFP (§Pillar 9).
  7. Name: RESISTANCE CEILING / UPPER RESISTANCE / EQUILIBRIUM ZONE / MID-RANGE SUPPORT /
     KEY SUPPORT BAND / BREAKOUT EXTENSION TARGET.  [LSZ REMOVED — the authorized change]
  8. Flag ZFP > 50% as BREAKOUT RISK.
  9. +1 confluence for POST-CONSOLIDATION zones.

THE PRESSURE DEGREE → ZFP (the prompt's own table — THE ZFP IS THIS BAND)
  | Score | Degree         | FAILURE PROBABILITY (the ZFP) |
  | 12-14 | EXTREME        | <10%                          |
  | 10-11 | HEAVY          | 10-25%                        |
  | 8-9   | MODERATE-HEAVY | 20-35%                        |
  | 6-7   | MODERATE       | 30-45%                        |
  | 4-5   | LIGHT          | 40-60%                        |
  | 0-3   | MINIMAL        | >60%                          |
```

**THE ZFP IS THE DEGREE'S FAILURE BAND — NOT a zone width.** `zfp_from_degree(conf)` →
`{EXTREME:7, HEAVY:17, MODERATE_HEAVY:27, MODERATE:37, LIGHT:50, MINIMAL:70}`. The build package's
"v8's calcZFP (zoneW/refRange) for the label" was WRONG (it showed a flat ~9% box width).

---

## ENGINE 2 — "What path will price take through the walls?" (the prompt, Part VI)

```
§6.1 THE 5-SHAPE TAXONOMY (SS · BS · R · WL · WLS + variants PBS/RS/RWL/PWL/PRWL)
     each shape = a defined price-zone relationship with an IP-zone ZFP signature.

§6.2 THE CLASSIFICATION MATRIX (applied IN SEQUENCE, highest priority first):
     1 BS  (break + ZFP>45% + 15min confirm)   2 WL  (surge to ZFP<20%, pierce, reject, LSZ)
     3 R   (mid 20-40%, <1 session)            4 WLS (3+ zones 0.30-0.50)
     5 SS  (Heavy/Extreme bounds both <30%)    6 RWL (violent reversal through origin, Hard Wall)

§6.4.1 THE ZFP-CONDITIONED TRANSITIONS (**THE MOST IMPORTANT RULE**) —
       "THE TARGET ZONE'S ZFP DECIDES, NOT THE MOMENTUM."
       BS + zfp<20  → RWL (NOT R, NOT PBS)   |  BS + 20-40 → R   |  BS + >60 → PBS
       SS + >45     → BS                     |  SS + all<30 → SS
       WLS + any    → BS                     |  R + persists>1 → SS (RECLASSIFY)
       WL + opposite momentum → RWL          |  RWL + any → SS

§6.6 THE FORWARD MAPPING (5 steps): current shape → transition → chain w/ audit trail (max 5,
     terminate at cumulative confidence <25%) → the alternative chain (mandatory) →
     the day-level decomposition (Mon-Fri: shape + bias + key zone + triggers + confidence).

§6.8 CONSOLIDATION PHASE · §6.10 TRADING SPEED (+1 day) · §6.5 TIMEFRAME MATCHING (≤2 dims up).
```

---

## THE BUILD STATUS (what exists vs what the prompt requires)

| Engine 1 part | Prompt | Current | Gap |
|---|---|---|---|
| P1 Pivots | ✓ | ✓ built (e1_extract P1) | — |
| P2 MA grid | ✓ | ✓ built | — |
| P5 structural + LSZ scan | ✓ | partial (swing H/L; LSZ removed per the change) | STEP 0.6 intra-zone |
| P6 Fib + round | ✓ | ✓ built | — |
| P9 regime | ✓ | ✓ built | — |
| **P3/P4/P8 options + analyst** | ✓ | **[NO DATA]** (needs S3/S4 wire) | **the score can't vary without them** |
| **6-dimension score (0-14)** | ✓ | **the pillar-sum, not the 6-dim** | **THE GAP — the score clusters → the degree clusters → the ZFP clusters** |
| Pressure degree → ZFP band | ✓ | **✓ FIXED 2026-10-06** (`zfp_from_degree`) | — |
| **Engine 2 §6.4.1 ZFP-conditioned** | ✓ | reads the momentum (`e2_engine.py:138,142`) | **THE GAP — must read the TARGET zone's ZFP** |

## THE PLAN (next steps — the continuation)

**W1 — THE 6-DIMENSION SCORE (the heart of Engine 1).** Replace the pillar-sum confluence with the
prompt's 0-14 six-dimension score: Technical (pivot/MA/fib alignment) · Options-Derived (the strike
tier) · Analyst (the source tier) · Structural (the swing extreme + the bonus) · Psychological (the
round-number tier) · Regime (consolidation/momentum). The score must VARY per level — that is what
makes the degree (and the ZFP) vary per zone. `scripts/e1_extract.py:452` (`build_levels`) +
`:488` (`add`).

**W2 — THE OPTIONS + ANALYST PILLARS (S3/S4).** Wire the option-wall tier (S3, the CME chain via
the VLM arm) and the analyst harvest (S4) so the Options-Derived and Analyst dimensions carry real
values. Without them, 2 of 6 dimensions are always 0 and the score is compressed.

**W3 — ENGINE 2 → ZFP-CONDITIONED.** Rewrite `e2_engine.classify` + `transition` to the prompt's
§6.2 matrix + §6.4.1 table: the SHAPE decision reads the ZONE's ZFP (not the momentum), and the
TRANSITION reads the TARGET zone's ZFP. `scripts/e2_engine.py:112` (`classify`), `:209`
(`transition`).

**W4 — THE FORWARD MAPPING + THE DAY DECOMPOSITION.** The §6.6 5-step forward map with the audit
trail + the mandatory alternative chain + the Mon-Fri day decomposition. `scripts/e2_engine.py:300`
(`forward_map`), `:456` (`day_decomposition`).

**W5 — THE RENDER.** The E1 zones (the 6-dim degrees + the ZFP band label) + the E2 chain rendered
over the forward price action. `plutus-vision-lqz/e1-render.pine`, `e2-render.pine`.

**THE GATE:** cross-validate on 5 random weeks — the E1 zones land where the price is, and the E2
chain matches the actual shape sequence (the operator's visual test).

---

## THE CODE ANCHOR INDEX (every mechanism → its file:line)

**THE AUTHORITY (read first):**
- the prompt: `Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1` (4216 lines)
- the reference pine: `Original_Canon_Data/Pine Scripts/trident_v8.pine:1`

**ENGINE 1 (the pillars + the score + the ZFP):**
- the pipeline head: `scripts/e1_extract.py:18` (the 8-role map)
- the level `add()`: `scripts/e1_extract.py:488` (each pillar contributes a scored level)
- the MA grid: `scripts/e1_extract.py:591` (Pillar 2)
- the pivot family: `scripts/e1_extract.py:516` (P1's six sets + the extended scan)
- the regime dimension: `scripts/e1_extract.py:669` (P9's sixth dimension)
- the degree band: `scripts/e1_extract.py:439` (`band_of` → EXTREME…MINIMAL)
- **the ZFP (FIXED):** `scripts/e1_extract.py:465` (`zfp_from_degree` — the degree's failure band)
- the assemble: `scripts/e1_extract.py:739` (`assemble` — the cluster + the 6D sum)
- the payload zfp: `scripts/e1_extract.py:822`
- the payload write: `scripts/e1_extract.py:899` (`main`)

**ENGINE 2 (the shape chain):**
- the classify: `scripts/e2_engine.py:112` (the shape matrix — reads the momentum, MUST read the zfp)
- the transition: `scripts/e2_engine.py:209` (the §6.4.1 table — reads the target zfp)
- the forward map: `scripts/e2_engine.py:300`
- the day decomposition: `scripts/e2_engine.py:456`
- the wire: `scripts/wire_e2.py:110`

**THE RENDER:**
- the label: `plutus-vision-lqz/e1-render.pine:240` (reads `e1PayloadZfp`)
- the payload arrays: `plutus-vision-lqz/e1-render.pine:166`
- the calcZFP (v8's, now UNUSED for the label): `plutus-vision-lqz/e1-render.pine:153`
- the build: `scripts/lqz_vision_v2_build.py:202` (the zfp emit)

**THE CANON (the operator's docs):**
- the authority ruling: `context_management/DECISION_CHAIN.md:290`
- this blueprint: `context_management/ENGINE_BLUEPRINT.md:1`
