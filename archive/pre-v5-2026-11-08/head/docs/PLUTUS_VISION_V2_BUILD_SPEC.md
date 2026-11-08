# PLUTUS VISION V2 — BUILD SPEC: E1 + E2 ON TOP OF THE V1 BASELINE

**Class:** BUILD SPEC (Layer 1) · **Date:** 2026-10-03
**Foundation:** `plutus-vision-v1.pine` sha `0d20e8314ce992fc` — **TAKES PRECEDENCE, SUPERSEDES
every prior baseline, and is not modified by this spec.**
**Authority:** `PLUTUS/MASTER_CONTEXT/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md` (the ORIGINAL canon)
**Reference (schema only, not code):** `Trident_Pine_Handover.zip → trident_template.json`
**Companion:** `PLUTUS_VISION_V2_E1E2_SPEC.md` (the 23-item scope + the census + the criteria)

---

## §0 THE OPERATOR'S ORDER (verbatim — this is the contract)

> "the v1 that we have right now takes precedence it supersedes this but as the as the foundation
> so the foundation will be this v1 that we just created"

> "I don't want anything lost from this baseline this baseline takes precedence and we want to keep
> the charge clean so all you're gonna do is you're going to add the engine one data on top of what
> we already have And you're going to add the engine two data to the indicator, which previously
> was not rendered correctly"

> "This indicator only has the engine one data that you can put immediately and start polishing it so
> that it doesn't make a gigantic mess of the fucking charts."

> "we just need the five major institutional pressure zones that are rendered for engine one from
> the nine web data sources to actually see where's all the institutional pressure for a target
> trading week that's engine one"

> "then engine two we need the shape chain prediction drawn as a line chart so we can visually see
> what the predicted price action is going to be for the trading week and again we want to have all
> of this as a Monday temporal anchor that forward predicts the rest of the trading week with some
> hindsight and foresight as like context of offers so the zones span the full horizontal and it's
> not autistic."

> "yeah try to make everything as pure code as possible just use the model to process the options
> table image data from ivnesting live. use code and tools and scripts for as much as possible.
> model only doesn wht it is needed for"

> "No stupid bullshit fallbacks no theatrical garbage Make things work properly."

**THE FIVE CONSEQUENCES THAT ARE BINDING ON THIS SPEC**
1. **ADD ONLY.** Nothing in v1 is edited. Every v1 layer is verified unchanged by a reference
   count gate (§6, C10).
2. **E1 = FIVE zones.** Not 27 bands. The institutional pressure map is 5 objects.
3. **E2 = ONE line.** The predicted price path, drawn with the paintbrush, Monday-anchored.
4. **PURE CODE.** The model is invoked for ONE artefact: the options-table image. Everything else.
5. **NO FALLBACKS.** A dead source emits `[NO DATA]`. A wrong strike is a fake pressure zone.

---

## §1 THE MEASURED FOUNDATION (v1 — the protected baseline)

```
┌───────────────────────────────────────────────────────────────────────┐
│ LuxAlgo SMC   226 refs   BOS · CHoCH · EQL · FVG · trailing extremes  │
│ SMC order blk   6 refs   origin-candle mapped        KEEP VERBATIM    │
│ LQZ bands       4 refs   GREEN · price-keyed merge  KEEP AS IS       │
│                                                                       │
│ THE MISSING LAYERS (grep census, this artifact):                     │
│   confluence 3 (cosmetic toggle) · pressureDegree 0 · ZFP 0           │
│   IPZone 0 · measuredMove 0 · shapeChain 0 · RWL 0 · WLS 0           │
│   consolidationPhase 0                                                │
└───────────────────────────────────────────────────────────────────────┘
```

**WHAT WE TAKE FROM THE HANDOVER ZIP — AND WHAT WE DO NOT.** The zip carries
`trident_v8.pine` (44 KB), `trident_phase1.py`, `plutus_models.py`, and
`trident_template.json`. **We take the JSON SCHEMA as the contract** — its `zones[]` object already
carries `pressure_degree`, `confluence`, `zfp`, `regime`, `measured_move_target`,
`structural_extreme`, `bom_fresh_flag`, `poi_tier`, `levels[]`, and a `shapes{}` block with
`primary_chain` / `alternative_chain` / `days[]`. **We do NOT copy the Pine.** Its arrays are
hard-coded 2026 DXY levels (99.23, 98.99, 98.41, 98.12, 97.97) — stale values, and copying them
would import a second class of hard-coded truth alongside v1's live detection.

---

## §2 ARCHITECTURE — THE ADDITION

```
  OHLC (the IDE already serves it)
     │
     ├─► [PURE CODE — the OHLC pillars]
     │     P1 pivots  Classic/Fib/Camarilla + the mandatory verification checks
     │     P2 MA grid 200·100·50·20·9 + recapture
     │     P6 Fib 0.236…1.0 + round .00/.25/.50/.75
     │     P5 structural swings, LSZ, repeated-extreme magnets
     │     P9 regime + ZFP base & modifiers + measured move
     │     P7 derivatives — upstream BLOCKED → [NO DATA]
     │
     ├─► [PURE CODE — the two TEXT sources]
     │     P4 analyst   forex.com + tiered search levels
     │     (TreasuryDirect · FRED · EIA · ForexFactory feed P9's modifiers)
     │
     ├─► [ONE MODEL CALL — the image]
     │     P3+P8 options  investinglive.com → embedded image → VLM OCR → strikes
     │
     └────────────► ALL NINE → cluster → score → ZFP → degree → BoM/MoM
                                    │
                                    ▼
                            data/e1/<pair>-<week>.json     (the template schema)
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
          ┌─────────────────────┐         ┌─────────────────────┐
          │ E1 RENDER           │         │ E2 RENDER           │
          │ 5 IP zones          │         │ ONE paintbrush line │
          │ banded by DEGREE    │         │ Mon-anchored,       │
          │ Mon-anchored        │         │ forward across week │
          └─────────────────────┘         └─────────────────────┘
```

**THE PURITY RULE, MECHANICAL.** The fetch script's model call count is bounded at **one image per
run**. Everything else — parsing, clustering, scoring, ZFP, degree, BoM/MoM, reaction counting,
shape classification, transition selection, day decomposition, path projection, and the xloc
timeline math — is arithmetic in Python and Pine. **A reviewer must be able to delete the model
call, run the script, and get a valid file with the options pillar marked `[NO DATA]`.**

---

## §3 E1 — THE FIVE INSTITUTIONAL PRESSURE ZONES

### §3.1 THE FETCH SCRIPT

```
scripts/e1_fetch.py --pair EUR/USD --week 2026-10-06 --out data/e1/
```

| # | source | transport | pillar | failure |
|---|---|---|---|---|
| 1 | `investinglive.com/Orders/` → date page | CDP fetch → embedded img → **VLM OCR** | P3, P8 | `[NO DATA]` |
| 2 | `TreasuryDirect /TA_WS/securities/auctioned` | JSON | P9 mod | `[NO DATA]` |
| 3 | `FRED fredgraph.csv?id=RRPONTTLD` | CSV | P9 mod | `[NO DATA]` |
| 4 | `EIA ir.eia.gov/wpsr/wpsrsummary.pdf` | PDF text | P9 mod | `[NO DATA]` |
| 5 | ForexFactory calendar | CDP fetch | P9 mod | `[NO DATA]` |
| 6 | `federalreserve.gov/releases/h10/current` | HTML | P3 K-factor | `[NO DATA]` |
| 7 | `finance.yahoo.com DX-Y.NYB` history | CDP fetch | P1 pivots | `[NO DATA]` |
| 8 | `tradingview.com/symbols/…/technicals/` | CDP fetch | P2 MA | `[NO DATA]` |
| 9 | `forex.com` research + analyst search | CDP fetch | P4 | `[NO DATA]` |

**THE TEMPORAL BOUNDARY IS CODE, NOT CONVENTION.** Every fetch records its publish timestamp.
Anything published after **Friday 17:00 ET of the week preceding the target week** is REFUSED and
its pillar emits `[NO DATA]`. The output carries `"data_as_of"`. This is the prompt's zero-tolerance
Temporal Boundary Rule, mechanised.

**THE NOTIONALS TRAP GETS AN ASSERTION.** The prompt: "NOTIONALS ARE ALREADY IN BILLIONS. DO NOT
DIVIDE BY 1000." A $1.5B wall is `1.5`. Dividing by 1000 drops every wall below the threshold,
every option classifies EXCLUDED, and the options dimension scores 0 for every zone — silently. The
script asserts `0.1 ≤ notional ≤ 500` and hard-fails on a value outside it.

**THE THREE-TIER NOTIONAL CLASSIFICATION** (v5.2.0 correction — the threshold is $1.5B, not $1B):
`≥$1.5B` CRITICAL OPTION WALL (+3, ±0.07 DXY) · `$850M–$1.499B` SIGNIFICANT MAGNET (+2, ±0.10) ·
`<$850M` EXCLUDED (override only with 3+ pillar confluence + P5 validation, +1).

### §3.2 THE MODEL ARM — EXACTLY ONE JOB

```
unit:     trident-v1-vision.service   (127.0.0.1:8010, CPU, hardened)
model:    Qwen3.5-4B-Q4_K_M.gguf + Qwen3.5-4B-mmproj-F16.gguf
input:    ONE base64 PNG (the options table image)
output:   a JSON array of {pair, strike, notional_billions}
budget:   120 s wall clock. EXCEEDED → [NO DATA]. Never a guess.
control:  a synthetic 6-row table runs as a SELF-TEST before every live fetch.
          MEASURED 2026-10-03: 6/6 strikes recovered, finish=stop, 24.9 s.
```

**IF THE ARM IS DEAD, THE OPTIONS PILLAR IS `[NO DATA]` — AND THE RUN CONTINUES.** That is not a
"bullshit fallback": it is the prompt's own rule, and it is recorded in the output file so the
chart can show the gap rather than hide it.

### §3.3 THE RENDER — FIVE BANDS, TINTED BY DEGREE

```
┌───────────────────────────────────────────────────────────────────────┐
│ E1 RENDER — 5 zones, banded by PRESSURE DEGREE (never by side)       │
├───────────────────────────────────────────────────────────────────────┤
│ 12-14 EXTREME         solid · full width · top of stack             │
│ 10-11 HEAVY           solid · full width                            │
│  8-9  MODERATE-HEAVY  translucent 70                               │
│  6-7  MODERATE        translucent 45                               │
│  4-5  LIGHT           hairline top+bottom only                      │
│  0-3  MINIMAL         NOT PAINTED — score 0 is discarded upstream   │
└───────────────────────────────────────────────────────────────────────┘
```

**WHY DEGREE AND NOT SIDE.** v1's banding defect was colour reading a POSITIONAL field. E1's colour
reads `pressure_degree` — a derived integer band. **One level can never be two colours**, because
the band is a function of a single number. And E1 is visually distinct from the SMC by
construction: SMC is red/blue boxes, liquidity is green bands, institutional pressure is an
**amber→violet degree ramp**.

**CLEANLINESS IS THE RAMP.** A MINIMAL zone paints nothing, so the weak tail of the map never
reaches the screen. 27 thin green bands + 5 degree bands + 1 forecast line is readable; 27 + 27 +
a filled forecast ribbon is the mess the operator named.

### §3.4 THE TEMPORAL ANCHOR — HINDSIGHT AND FORESIGHT

```
anchor = the target week's MONDAY 00:00
paint  from anchor − 2 weeks   (hindsight context: prior S/D, prior structure)
   to   anchor + 3 weeks       (foresight: where the forward map is valid)
every band spans the FULL horizontal extent — the prompt's own band standard
```

**NOT HARD-CODED.** The reference implementation hard-codes `timestamp(YYYY,M,D,…)`. Ours computes
both bounds from the anchor every run. **If the weeks are hard-coded, the indicator is only ever
right for one week** — the prompt's §Temporal Boundary violation in a different costume.

---

## §4 E2 — THE PREDICTED PRICE PATH, ONE LINE

### §4.1 THE ENGINE (pure code)

```
1  CURRENT SHAPE   §6.2 decision matrix, priority order: BS·WL·R·WLS·SS·RWL
2  TRANSITION      §6.4.1 ZFP-CONDITIONED — the TARGET zone's ZFP decides:
                     BS + zfp<20%  -> RWL   (NOT R, NOT PBS — the #1 E2 error)
                     BS + 20-40%   -> R
                     BS + >60%     -> PBS
3  CHAIN           §6.6 step 3, an audit trail per link, MAX 5 shapes,
                   terminate when cumulative confidence < 25%
4  ALTERNATIVE     §6.6 step 4, with its decision zone + ZFP threshold
5  DAY DECOMP      §6.6 step 5, Mon-Fri + the Trading Speed Rule (+1 day)
   + CONSOLIDATION PHASE  §6.8
   + TF ELEMENT MATCHING  4H->4H · 1H->1H · 30m->30m · 15m->30m/1H · never >2 dims
```

**RULE 1, THE ANCHORING LAW.** Every shape names the zone ids that anchor it. A shape with no zone
behind it is a fabrication and is refused, not rendered. This is the empty-corpus guard.

### §4.2 THE RENDER — A PAINTBRUSH LINE

```
┌───────────────────────────────────────────────────────────────────────┐
│ E2 RENDER — one freehand polyline, Monday-anchored                   │
├───────────────────────────────────────────────────────────────────────┤
│  x   the 5 trading days, spread across the week's horizontal extent   │
│  y   price, from each day's ZFP-conditioned expected range            │
│  a thick brush stroke through the day anchors, with a soft glow       │
│  a dot + the shape tag (SS/BS/R/WL/WLS) at each anchor               │
│  the ALTERNATIVE chain as a thin dashed ghost                        │
│  opacity ~55 — it is a FORECAST and must never read as price          │
│                                                                       │
│  IT IS ONE LINE. NOT A FILLED AREA. That single decision is what      │
│  prevents the chart from becoming a mess.                             │
└───────────────────────────────────────────────────────────────────────┘
```

**IT SITS OVER THE ZONES IT IS REACTING TO** — that is the point. The line crosses the pressure
bands; where it meets one is a predicted reaction. Forward past Friday, the line continues into the
foresight band with a fading tail so the eye reads it as a projection.

---

## §5 THE BUILD — FOUR WAVES

| wave | what | files | gate |
|---|---|---|---|
| **1** | the fetch script + the JSON schema + the temporal boundary + the self-test | `scripts/e1_fetch.py`, `data/e1/` | 9 sources attempted · every absence `[NO DATA]` · **zero fabricated values** · the notional assertion holds |
| **2** | the E1 renderer: five degree-banded zones, Mon-anchored | `plutus-vision-lqz/e1-render.pine` | renders on W29 · **C10: the v1 reference counts unchanged** |
| **3** | the E2 engine + the paintbrush line | `e2-engine.py`, `e2-render.pine` | the line lands · the alternative ghost shows · C7/C8 pass |
| **4** | the legibility pass + the docs | the render params, the ship docs | side-by-side vs the library · **the operator's eye** |

**THE ORDERING LAW.** No wave may paint before its producer exists. Wave 1 produces a FILE, not
pixels. Wave 2 is the first pixel change and it is gated on the v1 invariants. Wave 3 is the first
thing that can make the chart busy, so it is gated on the same invariants plus C10.

---

## §6 SUCCESS CRITERIA

```
C1  FETCH HONESTY      9 sources attempted; every failure recorded as [NO DATA] with its
                       reason; ZERO fabricated strikes/notionals/URLs/spots
C2  TEMPORAL BOUNDARY  no input published after Friday 17:00 ET of the prior week
                       appears in the output; `data_as_of` present
C3  FIVE ZONES         the E1 render emits ≤ 6 IP zones for a week (5 + the option wall
                       at most); NOT one per level
C4  DEGREE IS DERIVED  for every zone, band(confluence) == pressureDegree — 0 mismatches
C5  MINIMAL PAINTS NOTHING  a MINIMAL zone emits no box and no line
C6  E2 IS ANCHORED     every shape names its anchoring zone ids; 0 unanchored shapes
C7  THE HARD-WALL RULE  BS + target zfp<20 -> RWL. NOT R. NOT PBS.
C8  DAY DECOMP + SPEED  5 day entries, each with shape + key zone + confidence; the +1
                       day speed rule applied and visible
C9  MONDAY ANCHORED     the band's left edge == the target Monday for every zone and for
                       the forecast line; no hard-coded timestamp survives
C10 v1 UNTOUCHED        the v1 layer reference counts are unchanged:
                          LuxAlgo SMC 226 · SMC order blocks 6 · LQZ bands 4
                       and plutus-vision-lqz/lqz-core.pine + lqz-render.pine diff-clean
                       against the v1 baseline checkpoint
C11 THE EYE             a human looks at the chart. No verdict from numbers alone.
```

**C10 IS HOW "DON'T LOSE ANYTHING FROM THIS BASELINE" BECOMES MECHANICAL.** The counts are
measured now (226/6/4). If a wave drops one, the wave is rejected. Intent is not a control.

---

## §7 THE CONTAINER TEST ANGLES

```
A1  ARM ALIVE          the VLM answers a synthetic 6-row table 6/6 within 120 s
                       pass: 6/6 strikes, finish=stop
                       fail: empty content / finish=length / timeout
A2  DEAD ARM IS HONEST  with the unit STOPPED, the script still produces a valid file
                       with the options pillar = [NO DATA]
                       pass: the file exists and says [NO DATA]
                       fail: any fabricated strike, OR a crash, OR no file
A3  THE V1 FLOOR       the v1 reference counts after every render
                       pass: 226 / 6 / 4 exactly
                       fail: any count lower
A4  THE HARD-WALL RULE a synthetic (BS, zfp=18) transition yields RWL
                       pass: "RWL"
                       fail: "R" or "PBS"
A5  THE EMPTY CORPUS   E2 against an empty zone map
                       pass: an empty chain + a NAMED refusal
                       fail: any shape emitted
A6  THE CHART          capture W29 at 1H; the operator looks
```

**A2 IS THE ANTI-TEATRE TEST.** The operator's order was "no stupid bullshit fallbacks." A2 proves
that killing the model does NOT produce a plausible-looking fake — it produces a file that says so.
If A2 fails, the design has a fabricated fallback in it and the build is rejected regardless of what
the chart looks like.

---

## §8 WHAT IS NOT IN THIS SPEC

- **Engine 3.** Ruled flawed by the operator. No entry, no SL, no TP.
- **The TradingView-native compile.** The PineTS station compiles it here; the real compiler has
  not seen v2.
- **A measured accuracy figure for liquidity.** The operator's "90 plus accuracy just from looking
  at the chart" is a JUDGMENT, not a measurement. No labelled set exists. v2 does not invent one.
- **Copying the reference Pine.** Its schema is adopted; its hard-coded 2026 levels are not.

---

## §9 THE RUNTIME DEPENDENCY (closed 2026-10-03)

```
trident-v1-vision.service   127.0.0.1:8010   CPU llama-server + Qwen3.5-4B + mmproj
  enabled at boot (WantedBy=default.target)   Restart=always  RestartSec=5
  systemd-analyze security: 3.9 OK
  sandbox BOUND: reads its GGUF (allowed) · cannot write it (blocked)
  survives restart: re-verified against the same control image
  THE BUG FIXED HERE: `--reasoning-budget 0`. Without it the model emits an unbounded
  thinking preamble, consumes the entire n_predict budget, and returns EMPTY CONTENT
  with finish_reason=length. Measured: that is exactly what happened.
judge-systemone.service    127.0.0.1:8090   the JevK5 judge — 163 ms on a known-answer
                                           probe, already enabled + Restart=always
```

**THE HARDENING RECORD:** `hardening/context/trident-v1-vision.md` carries the operator's verbatim
words, the threat model, the sandbox directives, the rollback commands, and four honest residuals
(the largest being that `ProtectHome=read-only` is not concealment, and the correct fix — moving
the GGUF files to `/var/lib` with `ProtectHome=yes` — is recorded, not done).

---

## §10 THE ACCEPTANCE BAR

v2 is DONE when C1–C11 pass, A1–A6 return their pass tokens, the chart is looked at, **C10 has
never once regressed**, and nothing in the artifact implements an E3 primitive.

**A green suite without the operator's eye is not acceptance** — that inversion is what the
previous ship docs committed, and it is the failure this spec exists to prevent.

**THE SOURCE OF EVERY NUMBER HERE:** the grep census over `plutus-vision-v1.pine` (2026-10-03); the
rig render + payload audits (EURUSD 1H W29, sha `0d20e8314ce992fc`); the OCR census over all 39
library charts; the v5.3.3 prompt read from disk; the VLM control-table measurements
(6/6 at 24.9 s, and the empty-content regression that produced `--reasoning-budget 0`). **Nothing
is invented.**
