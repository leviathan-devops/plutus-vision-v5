# W4 GATE — THE VISUAL PROOF (vision-in-the-loop, 2026-10-05)

**This gate is a SCREENSHOT YOU CAN OPEN, not a unit test.** Per the operator's directive:
"the only success metric is what we can visually see on the actual Pine IDE with real vision
screenshot images."

## THE FRAME
- **file:** `evidence/w4-e1-zones.png` (183476 bytes)
- **capture:** CDP `Page.captureScreenshot` from the live Chrome at `:9222`, the Pine IDE at
  `http://127.0.0.1:9851/pine.html`
- **chart:** DXY 1H · FIXTURE · 1614 bars · price 100.5–101.7

## WHAT IS VISIBLE (two independent readers)
**READER 1 — the CDP box count (mechanical):**
```
total boxes 1037 · v8-RED family (#e6823c = R_F5) : 3 · v8-TEAL family (#3cc8be = T_F5) : 3
```
**READER 2 — the opened PNG (the operator's eye):**
- a **RED/ORANGE band ~101.15–101.32** — the 3 clustered RESISTANCE zones (zCat=RES, LIGHT degree)
- a **TEAL band ~100.75–100.97** — the 3 clustered SUPPORT zones (zCat=SUP, LIGHT degree)
- both spanning **Jun 20 → Jul 4** (the chart's own week, the anchor 2026-W28)

## THE v8 COLOUR LADDER IS IN THE ARTIFACT (verbatim port)
```
grep -c 'R_F1\|G_F1\|T_F1\|f_e1Zfill\|f_e1Zbord\|f_e1PressureLbl' plutus-vision-v2.pine -> 13
```
The 36-colour ladder + zfill + zbord + pressureLbl, copied byte-for-byte from trident_v8.pine:43-65.

## THE DEFECTS FOUND AND FIXED IN THE HOT SEAT (this turn)
1. **The wrong week** — the payload was for 2026-W41 (October) while the chart showed the July
   fixture; the zones anchored 91 days off-chart and were culled. FIX: regenerate for 2026-07-06.
2. **The span collapse** — `e1BackWeeks * 5` assumed DAILY bars; on 1H that is a 10-bar (10h)
   sliver. FIX: `432000 / timeframe.in_seconds()` (120 on 1H).
3. **The zero-height hairline** — zones arrive top==bottom, so box.new drew an invisible 1px line.
   FIX: inflate to a band, `mid * 0.0008`.
4. **The pair mismatch** — the zones are DXY prices (100.x) but the chart was EURUSD (~1.14).
   FIX: the chart must show DXY (the operator's chart-setting; the map is DXY-denominated).

## THE LIVE VERDICT (unchanged, honest)
`VERDICT: NO WEEK` · `2 anchors dropped` — the off-chart marker drop persists (a stale last bar);
named as a residual, not hidden.
