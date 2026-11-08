# THE 5-WEEK CROSS-VALIDATION — PLUTUS VISION E1/E2

**The operator's litmus test (2026-10-06):** *"can it maintain this accuracy across infinite
potential trading weeks? … picking five random trading weeks within the last six months and you
just rewind there. You run the pipeline and you will literally see on the charts — does the
engine two accurately predict the actual price action that happened and are the engine one zones
relevant to that specific trading week's price action?"*

**VERDICT: THE MACHINERY HOLDS ACROSS WEEKS. The E1 zones are 88% relevant; the E2 path beats
the naive baseline 5/5. THE DIRECTION IS THE WEAK AXIS (2/5) — the honest gap. SHIP PENDING the
direction work.**

---

## 1 · THE METHOD

Five random trading weeks were drawn from the last six months, seeded (`random.seed(7)`) over the
Monday pool `2026-04-06 … 2026-09-28`:

`2026-04-13` · `2026-05-04` · `2026-06-15` · `2026-06-29` · `2026-08-24`

The bars are the operator's OWN real DXY 1H series — `/tmp/dxy-tv.json`, **5000 bars,
2025-12-11 → 2026-10-05** (the same real market the whole build reads). For each week:
1. **REWIND** — slice the bars to the week's Monday (the input window, the derivation sees
   nothing after).
2. **E1** — `e1_extract.build_levels(bars)` (prior-week pivots + the MA grid + round numbers) then
   `e1_extract.assemble(...)` (the confluence clustering) → the institutional-pressure zones.
   **The REAL deterministic derivation, never a fixture.**
3. **E2** — `momentum(bars[-20:])` → `e2_engine.forward_map(zones, mom, monday)` →
   `day_decomposition` → the Mon-Fri path. **The REAL engine.**
4. **GROUND TRUTH** — the week's OWN bars (held back from the derivation).
5. **MEASURE** — the E2 path's MAE vs the actual closes; the E1 zone relevance (did the week's
   action touch the zones).

The harness: `/tmp/pv_crossval.py` → `evidence/crossval-5week.json` (every per-week record).

## 2 · THE RESULTS

| week | E1 zones | touched | E2 shape | E2 days | E2 MAE | naive | beat? | E2 dir / actual |
|---|---|---|---|---|---|---|---|---|
| 2026-04-13 | 4 | 3 (75%) | WLS | WLS/WLS/BS/R/SS | 0.903 | 0.923 | ✓ | up / **down** ✗ |
| 2026-05-04 | 6 | 5 (83%) | R | R/WL/SS/SS/SS | 0.183 | 0.191 | ✓ | up / **down** ✗ |
| 2026-06-15 | 5 | 5 (100%) | WLS | WLS×5 | 0.572 | 0.714 | ✓ | down / **up** ✗ |
| 2026-06-29 | 6 | 6 (100%) | WLS | WLS×5 | 0.226 | 0.253 | ✓ | down / down ✓ |
| 2026-08-24 | 6 | 5 (83%) | WLS | WLS/WLS/BS/R/SS | 0.204 | 0.350 | ✓ | up / up ✓ |

**AGGREGATES:** E1 relevance **88% mean** (≥75% every week) · E2 beat-naive **5/5** · E2 direction
**2/5** · E2 MAE **0.417 mean**.

## 3 · WHAT THE NUMBERS SAY

**THE E1 ZONES ARE RELEVANT ON ANY WEEK (88%).** On four of five weeks the price action traded
THROUGH 5-6 of the 6 zones; on the fifth it touched 3 of 4. The clusters land where the market
actually reacted — the zones are not a partition of the range, they are where independent evidence
converges.

**THE E2 PATH IS CLOSER THAN THE NAIVE BASELINE EVERY WEEK (5/5).** "Predict the prior close"
(naive MAE mean 0.486) loses to the E2 path (mean 0.417) on every week. The path carries real
information. The margin is widest on the volatile week (2026-08-24: 0.204 vs 0.350, a 42% cut).

**THE DIRECTION IS THE WEAK AXIS (2/5).** The E2's net call matched the week's net move on two of
five. This is honest: the momentum is the net move of the 20 bars before the Monday divided by
twice the ATR — a WEAK signal. The 2026-06-15 miss is the clearest: momentum −1.0 (a decisive
down-move into the week) but the week closed UP.

## 4 · THE DEFECT FOUND AND FIXED (found BY this validation)

**THE DEGENERATE RANGE.** On the first run the E2 returned the shape `R` for ALL FIVE WEEKS — even
at momentum ±1.0. Root cause (measured): every assembled zone is a `SOFT_WALL`, so `zfp_for`
returns a constant **40** for every zone. With `zfp=40`: `is_hard_wall` (40 < 20) is False and
`is_breakout_risk` (40 > 45) is False, so `classify`'s step #2 (`WL`, a hard wall) can NEVER fire —
and step #3 (`R`) fired whenever ANY mid-zfp zone existed, regardless of the momentum. **The E2
was structurally incapable of predicting direction.** The operator's earlier read — *"if this
week's price action is actually flat for this week then this is a valid prediction"* — was exactly
this symptom.

**THE FIX** (`scripts/e2_engine.py`): `R` (a stabilisation, by definition low-momentum) now
requires `|momentum| < R_STABILISE` (0.35); a decisive move with no breakout/hard-wall zone falls
to a directional shape carrying its own sign (BS up / WL down), anchored to the boundary zone the
move travels toward (the canon's §6.2 #1/#2 momentum reads). Measured after the fix: the E2 path
beats naive **5/5** (was 4/5); the days now VARY by week (WLS/WL/BS/R/SS) instead of a flat `R`.
Battery: `e2_tests 36/0 · e1_st_18 8/0 · e1_tests 15/0`. **The operator's approved Jul-6 render is
byte-identical (`282517ac622769bd`)** — the fix touches only fresh engine runs.

## 5 · THE RENDER — THE DYNAMIC WEEK REWIND (the operator's question #1)

*"is the dynamic training week rendering working correctly or if we rewind to any point on the
chart it just automatically renders the engine one engine two data for that specific trading
week?"*

**MEASURED: YES.** Five payloads were produced by the SAME pipeline for the five weeks — the SAME
`lqz_vision_v2_build.py` drove each, selected by `PV2_WEEK`:
- `evidence/cv-pines/plutus-vision-2026-04-13.pine` — `04642d87f131`
- `evidence/cv-pines/plutus-vision-2026-05-04.pine` — `e63ca2f7890f`
- `evidence/cv-pines/plutus-vision-2026-06-15.pine` — `99ab705e8cdd`
- `evidence/cv-pines/plutus-vision-2026-06-29.pine` — `d4bcfc0b525d`
- `evidence/cv-pines/plutus-vision-2026-08-24.pine` — `4edfe99c3108`  (×5 DISTINCT artifacts)

Five DISTINCT pines = the render is week-specific, never a pinned one-week artifact. The
station render (`:9741/run` with the week's `dataFile`) returns the plot set for each. The E2 path
is `bar_index`-anchored, and the E1 zones are placed at the payload's own times — so the overlay
re-anchors to whatever week the chart shows.

## 6 · THE HONEST GAPS

1. **The E2 direction is 2/5.** The momentum signal is weak. A stronger direction model (or a
   reversion bias — the E2 currently follows the momentum's sign, and the mirror would be 3/5)
   is the open work. NOT SHIPPED as correct.
2. **The visual capture on the operator's app** for each rewind week was rendered via the
   station (`:9741`) — the draw-count census — not yet a screenshot per week on the operator's
   display (queued).
3. **The E2 MAE mean (0.417) is dominated by one week** (2026-04-13, MAE 0.903 — a high-volatility
   week where the path under-shot a 0.92 move). The other four mean 0.296.
4. **The shape vocabulary collapses** — `WLS` recurred on three weeks. The zone-zfp regime
   (every zone `SOFT_WALL` → zfp 40) limits how many of the canon's six shapes can fire.

## 7 · THE VERDICT

**The operator's two questions, answered with measurements:**
- **Q1 — does the dynamic-week rendering work?** YES (5 distinct pines; the station renders each;
  the overlay re-anchors by time).
- **Q2 — is the E1/E2 accurate on a random week?** The E1 YES (88% zone relevance). The E2 path
  YES-vs-baseline (5/5 beat naive) but the DIRECTION is NO (2/5).

**SHIP STATUS: PENDING.** The zones ship; the E2 path's magnitude ships (beats naive); the E2's
DIRECTION does not meet the bar. The gap is named and mechanical (the momentum signal).

## 8 · THE CODE ANCHORS (every claim's source)

- The E1 deterministic derivation: `scripts/e1_extract.py:452` (`build_levels`) and
  `scripts/e1_extract.py:722` (`assemble` — the confluence clustering).
- The E2 engine: `scripts/e2_engine.py:103` (`classify` — the shape decision matrix) and
  `scripts/e2_engine.py:261` (`forward_map`).
- The defect's fix: `scripts/e2_engine.py:28` (`R_STABILISE`) and `scripts/e2_engine.py:146`
  (the gated `R` branch) and `scripts/e2_engine.py:173` (the decisive-move fallback).
- The momentum (the weak signal): `scripts/wire_e2.py:34` (`compute_momentum`).
- The day decomposition: `scripts/e2_engine.py:456` (`day_decomposition`).
- The payload builder: `scripts/lqz_vision_v2_build.py:153` (`build_payload`).
- The ZFP regime (the root cause's origin): `scripts/e1_extract.py:445` (`zfp_for`) — the
  `SOFT_WALL` band (30,50) → a constant `int((30+50)/2)=40`.
- The harness: `/tmp/pv_crossval.py:56` (`measure_week`) → `evidence/crossval-5week.json:1`.
- The render proof: `evidence/cv-pines/plutus-vision-2026-06-29.pine:1` (a distinct per-week pine).
- The checkpoint manifest: `Checkpoints/e1-e2-v2-pending-ship-approval-2026-10-06/CHECKPOINT_MANIFEST.md:1`.
- The testing log: `TESTING_LOG.md:1670` (the cross-val section).
- The debug log: `DEBUG_LOG.md:2081` (the F-DEGENERATE-RANGE entry).

---
# THE MACRO SWEEP — 35 WEEKS (2026-02-02 … 2026-09-28)

**The 5-week sample was TOO SMALL to trust.** The operator's real question — *"can it maintain
this accuracy across infinite potential trading weeks"* — needs every available week, not five.
The macro sweep (`/tmp/pv_macro.py` → `evidence/macro-sweep.json`) runs `measure_week` over ALL 35
Mondays inside the bar window. **THE MACRO NUMBERS SUPERSEDE THE 5-WEEK SAMPLE.**

| metric | 5-week | **35-week (the truth)** |
|---|---|---|
| E1 zone relevance (mean) | 88% | **74%** (min 33% · max 100%) |
| E2 direction hit-rate | 2/5 = 40% | **19/35 = 54%** |
| E2 path beat-naive | 5/5 = 100% | **17/35 = 49%** |

## THE HONEST READING

**E1 — REAL AND ROBUST.** 74% mean zone relevance; **32/35 = 91% of weeks** had ≥50% of their
zones touched by the actual action. This is the durable capability: the institutional-pressure
zones land where the market trades, on almost any week. (Down from the 5-week's 88% — the larger
sample is the honest number, and 74% with a 91%-of-weeks floor is strong.)

**E2 DIRECTION — WEAKLY POSITIVE, CONCENTRATED IN DECISIVE WEEKS.** 54% overall (barely above a
coin flip), but **58% on the decisive weeks (|momentum| ≥ 0.5, 26 of 35)** and 44% on the mild
weeks. The signal is real at the extremes and noise in the middle — the momentum's magnitude is the
discriminator. The contrarian mirror = 46% (so the E2's "follow the momentum" is the better of the
two directions, marginally).

**E2 PATH MAGNITUDE — NO MACRO EDGE.** **17/35 = 49%** beat-naive — a COIN FLIP. The E2 path's
MAE (mean 0.4795) is slightly WORSE than "assume the week stays at the prior close" (0.4558). **The
5-week 5/5 was a sample-size artifact.** At the macro level, the zone-anchored E2 path adds no
value over a flat line.

## THE VERDICT (corrected)

- **E1 (the zones): SHIPS.** 74% macro relevance, 91% of weeks ≥50%. The durable capability.
- **E2 direction: MARGINAL.** 54% overall, 58% decisive-only. Weakly positive; not a standalone
  predictor.
- **E2 path magnitude: NO SHIP.** 49% beat-naive = no edge. The 5-week result was noise.

**THE SHIP DECISION: the E1 ships; the E2 does not (yet).** The operator's own read — *"if this
week's price action is actually flat for this week then this is a valid prediction"* — is exactly
right: the E2 is a flat/zone-anchored prediction, not a directional path, and the macro sweep
confirms it adds no edge over flat.

---
# THE COVERAGE-BASELINE AUDIT — IS THE E1 ACTUALLY GOOD? (the null test)

**A high hit-rate is only a capability if it beats chance.** The 74% "touched" is measured against
a NULL: 6 RANDOM bands, same count, placed in the SAME ±0.70 window as the E1 zones
(`evidence/null-baseline.json`). And a SECOND, stronger instrument — the REACTION test: did the
price REVERSE at the zone (the zone held as S/R), vs pass through (`evidence/reaction-test.json`).

| instrument | E1 | random baseline | edge |
|---|---|---|---|
| a zone is TOUCHED by the week | 73.8% | 65.3% | **+8.4%** |
| a zone HELD (the price reversed) | 54.8% | 48.0% | **+6.8%** |

## THE HONEST VERDICT (and it is sobering)

**The E1's edge over random bands in the same window is WEAK: +6–8%.** The 74% headline number is
MOSTLY THE WINDOW, not zone selection: 6 bands placed anywhere in a ±0.70 window near the spot get
touched by ~65% of weeks regardless of where they sit — because the window is narrow and most weeks
travel through it. The E1's clustering buys it ~+8% over throwing darts; its S/R quality buys ~+7%.

**Neither instrument shows a STRONG capability.** The operator's own question — *"that is where the
intelligence of the code base is going to shine or ship the bet"* — is answered: **the intelligence
does NOT strongly shine.** The E1 is a WEAK-POSITIVE signal (real, but small), not a strong one.

## WHAT THIS MEANS FOR THE SHIP

- **The E1 renders correctly** (the operator saw it; C16). The RENDER ships.
- **The E1's zone-selection edge is WEAK (+6–8%).** It is NOT a strong predictor. The "88% / 74%"
  relevance numbers were inflated by the window; the honest capability is the +6–8% edge.
- **The E2 has NO edge** (direction 54%, path 49% vs naive).
- **THE HONEST SHIP CALL: neither engine clears a strong-capability bar.** They render; they are
  directionally weak. A real edge needs a better zone-selection rule (the confluence sum is not
  discriminating enough) or a better direction model.

**This is the coverage-baseline lesson:** a hit-rate must be measured against the null before it is
called a capability. 74% sounds strong; +8% over chance is the truth.

## 9 · THE ZONE-SELECTION EXPERIMENT — V4 REFUTED (the current params stand)

Two candidate tightenings were measured across 35 weeks against their nulls. The **touched** rate
favoured a tighter window (V4 win=0.50: +12.0% vs the current +8.5%). The **held** rate (the truer
instrument — does the price reverse at the zone?) **refuted it**: V4 +3.2% vs the current +6.6%.
A tighter window puts zones nearer the spot (touched more) but they hold as S/R less. **The current
parameters are better; the E1 stays as-is.** (DEBUG_LOG: F-TUNE-REFUTED.)
