# PLUTUS VISION V2 — BUILD PACKAGE

**Foundation:** the V1 working baseline (sha 0d20e8314ce992fc) — UNTOUCHABLE.
**Goal pin:** `GOAL_PIN.md` — paste into `/goal` to run the whole build autonomously.

## WHAT IS IN THIS PACKAGE

| file | what it is |
|---|---|
| `GOAL_PIN.md` | the paste-ready /goal pin: mission, canon, 4 waves, C1-C11, A1-A6, the laws |
| `PLUTUS_VISION_V2_BUILD_SPEC.md` | the build spec: architecture, the 9 sources, the E1 five-zone render, the E2 paintbrush line, the waves, the criteria, the anti-theatre test |
| `PLUTUS_VISION_V2_E1E2_SPEC.md` | the scope spec: the 23 items, the measured census, the per-item implementation detail, the 3 verification harnesses, the v1 non-regression floor |

## THE ARTIFACTS THAT MUST SURVIVE THE BUILD

```
LuxAlgo SMC            226 refs   the geometry + the structure tags      NEVER TOUCHED
SMC order blocks         6 refs   origin-candle mapped                 NEVER TOUCHED
LQZ liquidity bands      4 refs   GREEN, price-keyed merge              NEVER TOUCHED
```

C10 checks these counts after every render. A wave that lowers one is REJECTED.

## THE RUNTIME (live + hardened)

```
trident-v1-vision.service  127.0.0.1:8010  Qwen3.5-4B + mmproj on CPU
   enabled at boot · Restart=always · security 3.9 OK · sandbox bound to the process
   MEASURED: 6/6 strikes from a synthetic control table, 24.9 s, finish=stop
   REQUIRED FLAG: --reasoning-budget 0  (without it the reply is EMPTY with
                  finish_reason=length — the regression that was measured and fixed)
judge-systemone.service   127.0.0.1:8090  JevK5 judge, 163 ms known-answer probe
```

## THE FILES THE BUILD ADDS (none exist yet)

```
scripts/e1_fetch.py              the 9-source fetch, the temporal boundary, the notional assert
data/e1/<pair>-<week>.json       the output, in the handover's template schema
plutus-vision-lqz/e1-render.pine the 5 degree-banded zones, Monday-anchored
e2-engine.py                     the shape chain in pure code
plutus-vision-lqz/e2-render.pine the ONE paintbrush line
```

## THE SCHEMA (adopted verbatim from Trident_Pine_Handover)

```json
{ "pair": "", "target_week": "", "spot": 0, "data_as_of": "",
  "zones":  [ { "name","top","bottom","zone_type","pressure_degree","confluence",
                "zfp","regime","measured_move_target","structural_extreme","poi_tier",
                "bom_fresh_flag","primary_driver","timeframe","levels":[] } ],
  "levels": [ { "price","label","level_type","style","use_box" } ],
  "shapes": { "current","primary_chain","primary_confidence","alternative_chain",
              "alternative_confidence","anchor_poi_zone","days":[
                {"day","date","shape","confidence"} ] } }
```

## THE ORDER OF WORK

1. WAVE 1 fetch — pure code + ONE model call; zero fabrication (A2 proves it)
2. WAVE 2 E1 five zones — first pixels; gated on C10
3. WAVE 3 E2 one line — the first busy-chart risk; gated on C10 + C7
4. WAVE 4 legibility — the operator's eye is the gate
