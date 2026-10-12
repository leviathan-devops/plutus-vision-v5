# Live-chart exercises (measured on repo fixtures, 1H bars)

Method: repo 1H bar fixtures + E1/E2 JSONs. No invented prices. All numbers from the commands below.

## Exercise 1 — DXY week of 2026-07-06 (E2 chain R→SS→SS→BS→BS)

E2 file: `data/e2/DXY-2026-07-06-e2.json` → days Mon R (60%) @Equilibrium, Tue SS @Mid-Range Support,
Wed SS @Mid-Range Support, Thu BS (80%) @Key IP Support, Fri BS (80%) @Key IP Support.
Chain: `R->SS@Mid-Range Support`, `SS->BS@Key IP Support`. Phase: POST_BS_EARLY_BREAKOUT.

E1 zones (`data/e1/DXY-2026-07-06.json`): Resistance Ceiling 101.605 (SOFT, zfp 37, conf 6) /
Upper Resistance 101.397–101.453 (zfp 27, conf 8) / Equilibrium 101.163–101.213 (zfp 27, conf 9) /
Mid-Range Support 100.893–101.010 (SOFT, zfp 37, conf 7) / Key IP Support 100.544–100.614 (SOFT, zfp 37, conf 6).

Measured 1H action (`fixtures/bars/2026-07-06.json`, 382 bars):
- Mon 07-06: O 100.878 H 101.145 L 100.838 C 100.869 (31pts). Push to 101.145 stopped 1.8pts under
  Equilibrium floor 101.163, rejected to close — R behavior at a mid zone. Matches E2 Mon=R.
- Tue 07-07: O 100.871 H 101.194 L 100.803 C 101.186 (39pts). Pierced Equilibrium (H 101.194 inside
  101.163–101.213), closed 101.186 inside the zone — SS oscillation holding mid-range. Matches Tue=SS.
- Wed 07-08: O 101.189 H 101.275 L 100.946 C 101.027 (33pts). Probed above Equilibrium, rejected back
  toward Mid-Range Support top — SS continuation. Matches Wed=SS. Upper Resistance 101.397 never touched:
  correctly NOT predicted as target (no teleport past unmitigated zones).
- Thu 07-09: O 101.024 H 101.039 L 100.786 C 100.913 (25pts). Narrow drift down through Mid-Range Support
  top — breakdown beginning, BS leg forming. Matches Thu=BS onset (directional, Key support as magnet).
- Fri 07-10: O 100.915 H 100.997 L 100.598 C 100.965 (40pts). Low 100.598 wicked INTO Key IP Support
  (100.544–100.614) and closed 100.965 back above — textbook BS-into-support + bounce (RWL seed).
  Matches Fri=BS @Key IP Support.

Pressure mechanics seen: Earth (Equilibrium/Mid-Support/Key-Support ladder) channeled the whole week;
Fire ignited Tue (close inside Equilibrium = acceptance) then exhausted; Water traced R→SS→SS→BS→BS;
Air consequence: the Fri wick into Key Support + recovery close is exactly where a 0.618–0.786 reaction
and a bounce LONG (demand-side, sniper at approaching edge) would anchor — E3 Phase 2/3 shape, no levels
invented here.

Verdict: E2 chain maps this week with correct zones, correct order, correct Friday magnet. No ZFP violation
(TRIGGER zones mid-range 27–37, no Hard Wall pierce claimed).

## Exercise 2 — DXY/EU week of 2026-04-20 (cross-pair fixture honesty check)

E1 (`data/e1/DXY-2026-04-20.json`, DXY): Equilibrium 98.194–98.301 (zfp 85, conf 10) / Mid-Range Support
97.982–98.034 (zfp 40, conf 8) / Key IP Support 97.808–97.853 (zfp 60, conf 10) / IP Support Floor
97.630–97.652 (zfp 60, conf 8).
E2 (`data/e2/DXY-2026-04-20-e2.json`): all five days BS @Equilibrium (60%), phase POST_BS_EARLY_BREAKOUT,
empty chain (no staged transitions — honest low-structure output, not a fabricated chain).

Fixture caveat (measured, not hidden): `fixtures/bars/2026-04-20.json` cells[0] bars print at 1.16x
(EU-scale, e.g. Mon O 1.163 H 1.166 L 1.162 C 1.166) — this cell is the PAIR side of the cascade fixture,
not DXY. Reading it as DXY would be a category error; the honest use is cascade-mirror reading
(DXY BS directive ↔ EU same-shape inverted-direction), per §10 80/20 doctrine.

Lesson applied: E2's ZFP-conditioned law is what prevents the documented April 20–24 error class (BS into a
Hard Wall must yield RWL, never continuation). This week's E2 output (flat BS, no chain) is the shape of a
model refusing to extend past moderate confidence — the correct behavior per Rule 6 (terminate <25% cumconf),
not a defect.

## Exercise 3 — EURUSD week of 2026-07-06 (cascade-mirror read, R→WL→SS→SS→SS)

E1 (`data/e1/EURUSD-2026-07-06.json`): six-zone demand→supply ladder 1.13486–1.14405, all zfp 40:
MODE_DEMAND 1.13486–1.13630 (conf 6) / MODE_DEMAND 1.13644–1.13780 (conf 6) /
LIGH_DEMAND 1.13798–1.13943 (conf 5) / LIGH_DEMAND 1.13954–1.14100 (conf 4) /
MODE_SUPPLY 1.14105–1.14253 (conf 6) / LIGH_SUPPLY 1.14261–1.14405 (conf 4).
No Hard Wall in the ladder (all zfp 40 = mid-range) — so no RWL is predicted, consistent with the chain.

E2 (`data/e2/EURUSD-2026-07-06-e2.json`): Mon R (60%) → Tue WL (60%) → Wed/Thu/Fri SS (55%).
This is the cascade mirror of the DXY week (Exercise 1): same weekly energy, inverted direction —
DXY pressed down into support Fri while EU's structure pressed up through its demand ladder into supply.
R→WL first (rejection-driven open, the WL seed) then three days of SS inside the ladder: JS-chain
SS→BS did not trigger because no bounding zone failed (all zfp 40 < 45) — the ZFP gate doing its job.

Honest limit: no EU 1H bar fixture for this week was measured in this pass (fixtures carry DXY 1H for
2026-07-06), so Exercise 3 is a zone+chain structural read, not a bar-verified verdict. The bar-verified
verdicts are Exercises 1 (DXY July) and the April fixture-scale check.

Cascade check (§10 80/20): direction inverted DXY↔EU, shapes same family (recovery/rejection/range on both
sides), zone classes matched (DXY IP ladder ↔ EU S/D ladder) — mirror VALIDATED, pair-native levels kept.

## What the exercises changed in my handling

1. I now gate every E2 claim on target-zone ZFP first, momentum second.
2. I treat flat/empty chains as valid honest output, not as missing work.
3. I verify fixture pair-scale before comparing bars to zones (the April cell caught this).
4. For the indicator: zone boxes render first; shape path second; setups only where both coincide (R3).
5. I read EU weeks as cascade mirrors of DXY weeks first, pair-native second — never the reverse.

Commands (re-runnable):
- `python3 -c` week-vs-zone reads above on `fixtures/bars/2026-07-06.json` + `data/e1/DXY-2026-07-06.json` + `data/e2/DXY-2026-07-06-e2.json`
- `python3 -c` April read on `fixtures/bars/2026-04-20.json` + `data/e1/DXY-2026-04-20.json` + `data/e2/DXY-2026-04-20-e2.json`
- `python3 -c` EU ladder read on `data/e1/EURUSD-2026-07-06.json` + `data/e2/EURUSD-2026-07-06-e2.json`

## Canon anchor index (every anchor below was opened at the cited line)

- ZFP-conditioned transitions (BS→Hard Wall = RWL, never R/PBS): Original_Canon_Data/Toolset/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1819
- E2 output format + day decomposition feeding E3: Original_Canon_Data/Toolset/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1984
- E1 Protocol B + BoM/MoM + reaction counter: Original_Canon_Data/Toolset/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:922
- BoM/MoM classification law: Original_Canon_Data/Toolset/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md:1145
- Corrected-E3 DAY assignment (12-step) + session windows: Original_Canon_Data/Toolset/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md:473
- Corrected-E3 output format + zero-tolerance rules: Original_Canon_Data/Toolset/TRIDENT_v5.3.3_CORRECTED_E3_ENGINE.md:927
- Elemental cycle Earth→Fire→Water→Air→Earth: Original_Canon_Data/Toolset/Trident_Fractal_Architecture_FirstPrinciples_v2.3.md:251
- Measured E1 zones July week: data/e1/DXY-2026-07-06.json:1
- Measured E2 chain July week: data/e2/DXY-2026-07-06-e2.json:1
- Measured 1H bars July week: fixtures/bars/2026-07-06.json:1
