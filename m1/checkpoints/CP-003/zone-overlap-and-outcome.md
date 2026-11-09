# CP-003 zone-by-zone overlap: operator-documented zones vs the rendered E1 bands

Operator side: m1/evidence/operator-zones-eurusd/operator-zones.json (from
MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/Golden_Operator_Trade_Feedback_EU_GU.md, operator-authored).
E1 side: m1/checkpoints/CP-003/visual/golden-week-zoomed.png (sha256 80c2f5a3d541fe6f525278d10e6ec73d49a2f4fa255797d1418b3383e351c09a), the room on
REPLAY-EURUSD, bar 8927 = 2026-07-10T19:00, chart framed 2026-06-30..2026-07-12.

| Operator zone | Price band | Rendered E1 band at that level (read from the capture) | Overlap |
|---|---|---|---|
| OZ-01 1H supply (SL anchor) | 1.14460-1.14530 | red UPPER RESISTANCE band 1.1450-1.1465 + EURUSD 1.145 EUR1.4bn option line | YES |
| OZ-02 LQZ entry anchor | 1.14395-1.14440 | resistance band edge ~1.1440 | YES |
| OZ-03/OZ-07 1H MoM demand | 1.14000-1.14149 | EURUSD 1.14 EUR2.2bn option line at 1.1400 + support band 1.1405-1.1415 | YES |
| OZ-04 nested LQZ | 1.14020-1.14110 | same support band 1.1405-1.1415 | YES |
| OZ-05 1H refined 4H supply | 1.14475-1.14625 | red bands 1.1450-1.1465 | YES |
| OZ-06/OZ-14 LQZ (Jun 18-22) | 1.14620-1.14660 | UPPER RESISTANCE MODERATE-HEAVY 8.5 band ~1.1465-1.1475 | YES |
| OZ-08 1H MoM supply | 1.14220-1.14295 | EQUILIBRIUM ZONE 1.1430-1.1435 sits ~5 pips above; band edge reaches ~1.1425 | PARTIAL |
| OZ-09 LQZ (Jun 29-30) | 1.13875-1.13935 | "8.5 40% ZFP T1 Virgin 0R 1H BoM 0X" band ~1.1385-1.1395 | YES |
| OZ-10 BoM demand (4H OB refined) | 1.13815-1.13885 | MID-RANGE SUPPORT 4H BoM 1X band ~1.1375-1.1390 | YES |
| OZ-11 30m LQZ (fib 0.618) | 1.14150-1.14170 | support band 1.1405-1.1415 / equilibrium lower edge | PARTIAL |
| OZ-12 LQZ (fib 0.786) | 1.14195-1.14225 | between the support band top and the equilibrium zone | PARTIAL |
| OZ-13 LQZ under Fib 1 | 1.14265-1.14300 | EQUILIBRIUM ZONE lower edge 1.1430 | PARTIAL |
| OZ-15 BoM supply (1.618 target) | 1.14555-1.14625 | red bands 1.1455-1.1465 | YES |

Score: 9 YES / 4 PARTIAL / 0 MISS out of 13 operator bands (OZ-06 and OZ-14 share one band, OZ-03/OZ-07 one).
Every documented operator zone falls inside or against a rendered E1 band; none is absent.

## Outcome table for this card (bun m1/src/evaluate.ts EURUSD 2026-07-06)

week 2026-07-06 range 1.13911-1.14608 | zones in range 55 | tested 8 | correct 6 (75.0%)

| Zone | Band | ZFP in force | Predicted | Observed | Result |
|---|---|---|---|---|---|
| Z35 | 1.146-1.147 R | 40 | HOLD | HELD | OK |
| Z36 | 1.144-1.146 R | 99 (card 60 +25 Spring Release expired 07-06T14:00 +25 Cascade Z37) | BREAK | HELD | MISS |
| Z37 | 1.143-1.144 R | 85 (card 60 +25 Cascade) | BREAK | BROKE | OK |
| Z38 | 1.143 R | 60 | BREAK | BROKE | OK |
| Z39 | 1.141-1.143 equilibrium | 40 | HOLD | BROKE | MISS |
| Z40 | 1.141 S | 60 | BREAK | BROKE | OK |
| Z41 | 1.140-1.141 S | 22.5 | HOLD | HELD | OK |
| Z42 | 1.139 S | 40 | HOLD | HELD | OK |

75.0% against the 95% target. The two misses: Z36 (Spring Release + Cascade over-fired a BREAK on a zone price
never closed beyond) and Z39 (the equilibrium zone broke on the first bar while ZFP said HOLD). Both are engine
rule work, not data work.

## How the overlap was read

1. The room chart's visible range was set to 2026-06-29..2026-07-13 through the workbench chart's own
   `setVisibleRange` (m1/tools/pv-verify-room.sh exercises the same capture path the picture came from).
2. The Indicators dialog was dismissed and the capture taken through the plutus-browser control server
   (`POST /capture`, bearer token in ~/.plutus-browser/token).
3. Each of the 15 rows in m1/evidence/operator-zones-eurusd/operator-zones.json was located on the capture by
   its price band (the y-axis is labelled 1.12800..1.15800) and matched to the rendered band whose range
   covers it. YES = a rendered band covers the operator band; PARTIAL = a band edge reaches it (within
   ~5 pips) but does not cover it; MISS = no band at that level.

## References (file:line)

- The E1 scoring and ZFP rules the rendered labels come from: m1/src/assemble.ts:72 (assembly),
  m1/src/assemble.ts:175 (the Depleted-before-BoM rule), m1/src/evaluate.ts:1 (the outcome instrument).
- The card that produced the labels: m1/out/e1-card-EURUSD-2026-07-06.json (sha256 93d922396afa18bd,
  sealed inside m1/checkpoints/CP-003/checkpoint.json).
- The operator's zones: m1/evidence/operator-zones-eurusd/operator-zones.json:1 (source
  MASTER_CONTEXT/NON-NEGOTIABLE-RELOAD/Golden_Operator_Trade_Feedback_EU_GU.md).
- The verdict instrument for the render itself: m1/tools/pv-verify-room.sh:1 (proof pair:
  E1_ZONE_BANDS_ABSENT exit 1 at 27 pixels; E1_RENDER_VERIFIED exit 0 at 1726 pixels).
- The canon ZFP bands the numbers come from: Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:4052
  (Appendix B strength-based ZFP) and :1154 (the strong-reaction counter).

## Full evaluate.ts output for this card (verbatim)

```
week 2026-07-06 range 1.13911-1.14608 | zones in range 55 | tested 8 | correct 6 (75.0%)
Z3   1.193-1.193 resistance  LIGHT          5.5  ZFP 60    pred BREAK -> UNTESTED   card 60
Z6   1.185-1.185 resistance  MODERATE-HEAVY 9    ZFP 40    pred HOLD  -> UNTESTED   card 40
Z21  1.162-1.163 resistance  HEAVY          11   ZFP 5     pred HOLD  -> UNTESTED   card 5
Z23  1.159-1.161 resistance  HEAVY          11.5 ZFP 22.5  pred HOLD  -> UNTESTED   card 22.5
Z31  1.150-1.151 resistance  EXTREME        13.5 ZFP 10    pred HOLD  -> UNTESTED   card 10
Z35  1.146-1.147 resistance  MODERATE-HEAVY 8.5  ZFP 40    pred HOLD  -> HELD     OK   07-10T02:00 card 40
Z36  1.144-1.146 resistance  HEAVY          10.5 ZFP 99    pred BREAK -> HELD     MISS 07-06T18:00 card 60 +25 Spring Release (expired 07-06T14:00) +25 Cascade (Z37 broke)
Z37  1.143-1.144 resistance  MODERATE-HEAVY 9.5  ZFP 85    pred BREAK -> BROKE    OK   07-06T17:00 card 60 +25 Cascade (Z38 broke)
Z38  1.143-1.143 resistance  MODERATE-HEAVY 8.5  ZFP 60    pred BREAK -> BROKE    OK   07-06T16:00 card 60
Z39  1.141-1.143 equilibrium MODERATE-HEAVY 9.5  ZFP 40    pred HOLD  -> BROKE    MISS 07-06T08:00 card 40
Z40  1.141-1.141 support     LIGHT          5    ZFP 60    pred BREAK -> BROKE    OK   07-06T09:00 card 60
Z41  1.140-1.141 support     MODERATE-HEAVY 9.5  ZFP 22.5  pred HOLD  -> HELD     OK   07-06T10:00 card 22.5
Z42  1.139-1.139 support     HEAVY          10.5 ZFP 40    pred HOLD  -> HELD     OK   07-08T11:00 card 40
Z43  1.137-1.138 support     HEAVY          10.5 ZFP 40    pred HOLD  -> UNTESTED   card 40
Z45  1.135-1.135 support     EXTREME        12.5 ZFP 22.5  pred HOLD  -> UNTESTED   card 22.5
Z50  1.130-1.130 support     MODERATE       7.5  ZFP 60    pred BREAK -> UNTESTED   card 60
```
(The full 57-row run is reproducible with `bun m1/src/evaluate.ts EURUSD 2026-07-06` from the project root;
rows outside the traded range are omitted here - they are UNTESTED by construction.)

## What the two misses mean for the engine

- Z36: the card ZFP was 60 (BREAK) and the time-dependent rules added +25 Spring Release (the driving option
  expired 07-06T14:00, before the 18:00 touch) and +25 Cascade (Z37 broke first) -> 99. Price touched the
  zone at 18:00 and moved away without closing below 1.144 -> HELD. The canon's Spring Release is a
  probability lift after expiry, not a certainty; the ladder capped it at BREAK. Rule work: how the two
  modifiers combine, and whether Cascade applies when the nearer zone broke only minutes earlier.
- Z39: the equilibrium zone broke on the very first bar of the week (07-06T08:00) at ZFP 40 (HOLD). The
  zone sat between the cutoff spot and the deeper support; the first-bar break was a coin-flip the card
  called wrong. Rule work: the equilibrium role's base ZFP, and whether a zone whose first test is the
  cutoff bar should carry a different prior.
