# ENGINE 1 — v8 vs MINE · THE COMPLETE SIDE-BY-SIDE

**Authority:** `Original_Canon_Data/Pine Scripts/trident_v8.pine` (668 lines) · the prompt `Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md`.
**Measured:** 2026-10-07, this session. Every "mine" cell is from a tool result on the current tree.

---

## A · THE 5-ZONE LADDER (the IP zones — `dxy_z*`)

The v8 draws 5 boxes + 5 labels. Each box carries: `zTp` (top), `zBt` (bottom), `zCat`, `zDeg`,
`zTir`, `zNm`, a fill (`zfill(cat,deg)`), a border (`zbord(cat,deg)`), and a label
`"<nm> | <pressureLbl(deg)> | <calcZFP(tp,bt,pair)>% ZFP"`.

| v8 field | v8 source (line) | MINE | verdict |
|---|---|---|---|
| `zTp` / `zBt` (bounds) | literals 99.23/99.16 … 97.97/97.63 (`:187-188`) | computed per week | ✅ present |
| `zCat` (RES/RES/MID/SUP/SUP) | literal (`:189`) | computed, positional vs spot | ✅ present (matches) |
| `zNm` (the 5 names) | literal (`:192`) | emitted | ✅ present |
| `zDeg` (HEAVY·MOD-HEAVY·MOD-HEAVY·MODERATE·HEAVY) | **literal** (`:190`) | computed from confluence | ⚠️ **PRESENT BUT WRONG — never reaches HEAVY** |
| `zTir` (T1/T2) | literal T2·T1·T2·T2·T1 (`:191`) | `CAT.tier(conf)` | ⚠️ present (band differs) |
| **`calcZFP` (THE ZFP)** | **`(tp−bt)/1.60×100`** (`:334`) | **`zfp_from_degree(conf)`** (`e1_extract.py:474`) | ❌ **WRONG QUANTITY — this is the crux** |
| `pressureLbl(deg)` | degree→label (`:157`) | present (`e1_category`) | ⚠️ label present; the DEGREE it reads is wrong |
| box FILL `zfill(cat,deg)` | 6 shades/category (`:67`) | 6 shades (R_F1-6/G_F1-6/T_F1-6) | ✅ present |
| box BORDER `zbord(cat,deg)` | 6 shades (`:112`) | present | ✅ present |

**The measured defect (the operator's 10× point):**
- v8's Ceiling (w=0.07) → `calcZFP` = **4%** → a HARD WALL → §6.4.1 `BS + zfp<20 → RWL` = **REVERSAL**.
- Mine: the Ceiling is LIGHT → `zfp_from_degree` = **50%** → `is_breakout_risk` → `BS` = **CONTINUATION**.
- **The wrong ZFP inverts the E2's terminal shape.**
- The degree caps at **5.0/14** (options=0, analyst=0, regime=0 — measured, 150 levels) so the
  extremes can NEVER be HEAVY the way the v8's are.

---

## B · THE LSZ — LIQUIDITY SWEEP ZONES (`dxy_x*`) — ❌ **ABSENT FROM MINE**

| v8 item | v8 source | MINE |
|---|---|---|
| 6 green boxes (`dxy_xTp`/`dxy_xBt`) | `:195-196` | **0** |
| `dxy_xPri` ACTIVE vs STANDARD (fill/border/width differ) | `:197` | **0** |
| `LSZ_STD_F/B` · `LSZ_ACT_F/B` (the 4 green colours) | `:158-159` | **0** |

*(The build's ONE authorized change removed the LSZ from Engine 1 — so this is EXPECTED, but the v8
HAS it and mine does not.)*

---

## C · THE OPTION STRIKES (`dxy_o*`) — ❌ **ABSENT FROM MINE**

| v8 item | v8 source | MINE |
|---|---|---|
| 7 amber lines (`dxy_oPr`, `color.rgb(255,200,60)`) | `:199` | **0** |
| `dxy_oVol` labels (`volLbl`, "2.6bn Option Strike Target") | `:200` | **0** |
| the line WIDTH = 2 if the volume contains "bn", else 1 | `:382` | **0** |

---

## D · THE INFO TABLE (`table.new(...,2,17)`) — ❌ **ABSENT FROM MINE**

The v8's table (`:390-427`) is a 2-column × 17-row block:

| row | v8 content | MINE |
|---|---|---|
| 0 | "TRIDENT v8" / "DXY Apr20-24" | **0** |
| 1 | **Chain** — `dxy_sCh` + `dxy_sCf%` (e.g. "SS>BS>R>WL 52%") | **0** |
| 2 | **Alt** — `dxy_sAlt` + `dxy_sAc%` ("SS>WLS>BS 35%") | **0** |
| 3 | **Days** — "M:SS/H T:SS-BS W:BS-R Th:R-SS F:SS-WL" (the E2 day-by-day) | **0** |
| 4 | "ZONES" header | **0** |
| 5-9 | the 5 zone rows: `tag + tp-bt + prs + zfp%ZFP + zTir` | **0** |
| 10 | "TRADES" header | **0** |
| 11-13 | trade S (T2): Entry `tEn1-tEn3` · SL `tSl`/TP `tTp` · `tDE>tDT` · R:R `tRr` | **0** |
| 14-16 | trade L (T1): same | **0** |

The table's `trades` come from `dxy_tEn1/tEn3/tSl/tTp/tRr/tTir/tDE/tDT` (`:201-208`) — **Engine 3's
output**, shown inside the Engine-1 table. And rows 1-3 are the **E2 chain summary**.

---

## E · THE ANCHORING (the x-span)

| v8 | MINE |
|---|---|
| `tsL = timestamp(2026,4,6)`, `tsR = timestamp(2026,5,15)` — FIXED literals (`:35-36`), `tsMid = (tsL+tsR)/2` | `_lx = _bAnchor`, `_rx = _bAnchor + _bpw` — computed from the chart's own bar |

*(The v8 anchors to FIXED dates because its data is a fixed week; mine anchors to the chart. Both are
"correct" for their data source.)*

---

## F · THE FUNCTIONS (the v8's Engine-1 machinery)

| v8 function | line | MINE |
|---|---|---|
| `zfill(cat, deg)` — the 6-shade fill ladder | `:67` | ✅ present |
| `zbord(cat, deg)` — the 6-shade border ladder | `:112` | ✅ present |
| `pressureLbl(deg)` — degree→label | `:157` | ⚠️ present, fed a wrong degree |
| `volLbl(vol)` — "2.6bn"→"2.6bn" | `:320` | ❌ absent (no options) |
| **`calcZFP(tp,bt,pair)`** — the width ZFP | `:334` | ❌ **replaced by the degree-band** |

---

## THE HONEST SUMMARY

**What MINE has that matches the v8:** the 5-zone ladder (bounds, zCat, names), the 6-shade colour
ladder (fill + border), the label format.

**What MINE is MISSING or WRONG (the full list):**
1. ❌ **`calcZFP`** — the ZFP is the **degree-band**, not the v8's **width formula** (`(tp−bt)/ref`).
   **This is the defect that inverts the E2** (the operator's 10× point).
2. ❌ **`zDeg`** — computed but **never reaches HEAVY** (3 of 6 dimensions are 0 → the score caps at
   5/14). The v8's extremes are HEAVY.
3. ❌ **`zTir`** — the tier band differs from the v8's literal T1/T2.
4. ❌ **THE LSZ** — 6 green boxes + ACTIVE/STANDARD — entirely absent (the authorized removal).
5. ❌ **THE OPTION STRIKES** — 7 amber lines + volume labels — entirely absent.
6. ❌ **THE INFO TABLE** — the 2×17 block (chain + alt + days + 5 zones + 2 trades) — entirely absent.
7. ⚠️ **`volLbl`** — absent (no options).

**The ONE that matters most (per the operator):** #1 — the ZFP. Fix it and the Ceiling reads as a
hard wall, and the E2's terminal shape becomes a REVERSAL instead of a continuation.

---

## G · THE E2 CHAIN SUMMARY (the v8's table rows 1-3) — ❌ **ABSENT FROM MINE**

The v8's table rows 1-3 carry a COMPACT E2 summary; my E2 payload does not emit its source.

| v8 item | v8 source | MINE (measured) |
|---|---|---|
| **Chain** string `dxy_sCh = "SS>BS>R>WL"` | `:210` | ❌ my `chain` is a LIST of links, never the compact string |
| **Chain confidence** `dxy_sCf = 52.0` | `:211` | ❌ **MISSING** — no chain-level confidence field |
| **Alternative** chain `dxy_sAlt = "SS>WLS>BS"` | `:212` | ❌ **MISSING** — no secondary path |
| **Alternative confidence** `dxy_sAc = 35.0` | `:213` | ❌ **MISSING** |
| **Days** row `"M:SS/H T:SS-BS W:BS-R Th:R-SS F:SS-WL"` | `:398` (literal) | ⚠️ my `days` is structured `[('Mon','R'),…]`, not the compact string |

My E2 payload keys (measured): `['chain', 'days', 'ghost', 'momentum', 'monday', 'pair', 'phase',
'refusal', 'week', 'zones_in']` — **no `chain_string`, no `confidence`, no `alternative`.**

---

## THE FULL GAP LIST (v8 Engine 1 → mine)

**WRONG (present but incorrect):**
1. ❌ **`calcZFP`** — mine uses the degree-band, the v8 uses `(tp−bt)/ref`. **THE CRUX.**
2. ❌ **`zDeg`** — computed but caps at 5/14 → never HEAVY.
3. ⚠️ **`zTir`** — the tier band differs from the v8's T1/T2 literals.
4. ⚠️ **`pressureLbl`** — present but fed the wrong degree.

**ABSENT (the v8 has it, mine has nothing):**
5. ❌ **THE LSZ** — 6 green boxes + ACTIVE/STANDARD.
6. ❌ **THE OPTION STRIKES** — 7 amber lines + volume labels + the width rule.
7. ❌ **THE INFO TABLE** — the 2×17 block (chain + alt + days + 5 zones + 2 trades).
8. ❌ **`volLbl`** — the volume-label function.
9. ❌ **THE E2 CHAIN SUMMARY** — the compact chain string + its confidence.
10. ❌ **THE ALTERNATIVE CHAIN** — a secondary path + its confidence.
11. ❌ **THE E2 DAYS STRING** — the compact "M:SS/H T:SS-BS …" form (I have structured days only).

## RESOLUTION (2026-10-11 — the absent list as closed)
- Items 5+8 are MOOT (LSZ ruled OUT of E1 by the operator; `volLbl` needs the unfed
  options harvest). Items 6/7/9/10/11 are CLOSED: the opt-strike layer exists behind
  its empty-data guard, and the 2×17 table (chain + days + 5 zone rows + trades) plus
  the dashed ghost fill from COMPUTED arrays in the served .pine (F-136).
- The side-by-side's method stands: every "mine" cell from a tool result on the live
  tree (PIN_INDICATOR_PORT_BUILD.md:1), never from memory. The render proof is the
  :99 screenshot bound by buffer-sha to the artifact (JEV_GATE/run_gate.sh:54).
- Residual known gap: the Vela build does not paint Pine table geometry (station
  `__tables__: 1`, "geometry absent") — the fill is correctness-verified but
  visually inert here, same as the baked version (SPEC.md:21).
