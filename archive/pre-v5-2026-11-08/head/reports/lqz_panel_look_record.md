# THE PANEL LOOK RECORD — every panel opened, per the pin's judge-gate contract

**Contract (pin §THE PANEL VISUAL JUDGE GATE):** *for each TF in 15m/30m/1H/4H render ONE grid
holding [ library reference | D1 luxalgo | D2 plutus | D3 vision ] on IDENTICAL bars, save it,
OPEN IT, and record per panel: found / missing / wrong with coordinates.*

**Who looked:** the orchestrator (this session), by opening each PNG and reading the rendered
pixels. **No VLM verdict is used anywhere below.** Each row cites the artifact and the
coordinate evidence.

---

## 0 · THE GRIDS THEMSELVES

| TF | artifact | sha256[:16] | panels present |
|---|---|---|---|
| 15m | `reports/panel-grid-IDE-15m-2026-W29.png` | `dcd2598f…` | 4 (lib + D1 + D2 + D3) |
| 30m | `reports/panel-grid-IDE-30m-2026-W29.png` | `71320abb…` | 4 |
| 1H | `reports/panel-grid-IDE-1H-2026-W29.png` | `d461941e…` | 4 |
| 4H | `reports/panel-grid-IDE-4H-2026-W29.png` | `8a3f62f2…` | 4 |

**Composer:** `scripts/lqz_panel_ide.py` — composes from `vil/2026-W29.jsonl`, matching each
panel by **`pineSha` prefix + timeframe**, and enforcing **THE FRESHNESS TEST**: a frame whose
PNG mtime predates its source's mtime is REJECTED and the panel reads `NO POST-FIX CAPTURE for
this TF — UNPROVEN`. That guard is load-bearing: without it a stale frame would be captioned as
current.

**⇒ A FINDING FROM READING THE COMPOSER.** The 15m grid I opened shows D2 with an **x-axis of
`12:00 · Jun 30 · Jul 2`** while D1/D3 read `Jul 3 · 12:00 · Jul 4 · Jul 6`. **The bars are
identical (measured: `IDENTICAL_BARS: true` — 400 bars, `2026-06-11T15:00` → `2026-07-06T06:00`
for all three), but the chart's VIEWPORT auto-fits per run and D2's drawings span a wider price
range, widening its window.** The grid is therefore faithful to each panel's own viewport; it is
**not** an apples-to-apples scale comparison. Recorded as a **known limitation**, not a defect:
`scripts/lqz-panel.mjs` (the CDP path) has **no viewport control at all** — no
`zoom`/`fitContent`/`setVisible` call exists in it.

---

## 1 · LIBRARY REFERENCE (panel 1, every grid)

**Content:** the operator's own frame, `WINNING_TRADE_LIBARARY/LIQUIDITY LADDERS/` — the first
file alphabetically (`Screenshot from 2026-07-13 19-13-03.png`), chosen by
`lqz-panel.mjs:40` (`libList.split("\n").filter(Boolean)[0]`).

**LOOKED — found:** a TradingView EUR/USD chart carrying **LARGE thick horizontal bands**
(orange/red/green) spanning the full width, plus thin rails and small inline labels. The band
stack sits over the mid-chart and the price action pierces it.

**Verdict: FOUND.** This is the target look — *"thin lines + LARGE bands + labels"* as the
composer's own caption states.

---

## 2 · D1 `lqz-luxalgo` — the three LuxAlgo detectors bundled

| TF | ledger counts | what I SAW | verdict |
|---|---|---|---|
| 15m | boxes 97 · lines 30 · labels 0 | **chart effectively EMPTY** — candles only; viewport y `1.14200–1.14650`; the box cluster sits at `1.1389–1.1411`, **BELOW the visible range** | MISSING |
| 30m | boxes 145 · lines 40 · labels 0 | faint dotted rails at y≈`1.1380`, `1.1400`, `1.1430`; nothing band-like | PARTIAL |
| 1H | boxes 117 · lines 36 · labels 0 | three faint dotted rails (row-density scan: y=232→`1.1434`, y=269→`1.1426`, y=452→`1.1387`) | PARTIAL |
| 4H | boxes 216 · lines 50 · labels 0 | faint dotted rails at `1.145`, `1.143`, `1.141`, `1.139` — the most visible of the four | PARTIAL |

**MEASURED MECHANISM (this look's core finding).** D1's drawn primitives are the **LuxAlgo-native
slivers**: `boxSpanHist = {1h:1, 2h:1, 3h:24, 4h:7, 5-12h:36, 13-48h:24, 2-7d:21, >7d:3}` —
**median span 11 bars**, max 397, min 1. The emitters in `lqz-luxalgo.pine` are 2-bar
(`box.new(swp_n -1, …, swp_n +1, …)`) and 3-bar (voids) primitives. **The library's bands span
the whole chart; these do not.**

**AND THE FULL-WIDTH RENDERER EXISTS BUT EMITS NOTHING HERE.** `lqz-luxalgo.pine` carries
`f_lqzRender()` — *"the full-width horizontal zone emitter"* — with `lqzLeftB=500` /
`lqzRightB=20` margins and `lqzLabel=true`. Its gate is
`_need = lqzSource == "candles" ? 1 : lqzMinAgree` with `lqzMinAgree=2`, so under the **default
`lqzSource="luxalgo"`** a zone requires **2 distinct sources to agree at one level**. **Few or
none do → 0 LQZ zones → no labels.**

**THE LEDGER CONFIRMS THE CONSEQUENCE.** `vil/2026-W29.jsonl` row 46 (D1@1H) carries
`deltas: ["MECH_VETO:boxes=117:labels=0"]` and `readerVerdict: "FAIL"`. **The rail's mechanical
rule:** boxes drawn with **zero labels** is a veto — because the library's zones are labelled.

**⇒ D1's verdict is NOT "the gate is broken". It is: the default source setting draws the
LuxAlgo-native primitives, which are slivers, and the labelled full-width emitter stays silent.
The pin names `lqzSource` as an OPERATOR calibration. The measured alternative is recorded in
§5.**

---

## 3 · D2 `lqz-plutus` — the operator's candle strategy

| TF | ledger counts | what I SAW | verdict |
|---|---|---|---|
| 15m | boxes 0 · lines 38 · labels 0 | a **large orange band** across `1.1425–1.1440` + thin rails; x-axis `12:00–Jun 30–Jul 2` | FOUND |
| 30m | boxes 0 · lines 66 · labels 0 | **a rich full-width ladder** — red/green rails at `1.1360`, `1.1380`, `1.1390`, `1.1400`, `1.1410`, `1.1420`, `1.1430` | FOUND |
| 1H | boxes 0 · lines 58 · labels 0 | thin rails across; viewport `1.13000–1.16500` (widest of the three — its drawings span more) | FOUND |
| 4H | boxes 0 · lines 53 · labels 0 | **the richest ladder of the set** — rails stack across `1.1300–1.1700` | FOUND |

**⇒ D2 IS THE CLOSEST VISUAL MATCH TO THE LIBRARY** at 30m and 4H: thin full-width rails forming
a readable ladder on the same bars. This is the look the operator's own hand-charts describe.

**Its ledger rows still read `FAIL`** — rows 45/47 carry `MECH_VETO`-class deltas under the same
rail rule family. **The veto is on the LEDGER row, and the look is good.** Both are reported.

---

## 4 · D3 `plutus-vision-v1` — the winner + the LuxAlgo SMC

| TF | ledger counts | what I SAW | verdict |
|---|---|---|---|
| 15m | boxes 5 · lines 57 · labels 22 | zones + `EQH` `EQL` `CHoCH` `BOS` `EQ` labels; a large teal box at `1.14200–1.14650` | FOUND |
| 30m | boxes 5 · lines 85 · labels 23 | the ladder + labels (`CHoCH`, `BOS`, `EQL`, `EQ`) | FOUND |
| 1H | boxes 5 · lines 79 · labels 24 | zones + labels, the best-labelled panel | FOUND |
| 4H | boxes 5 · lines 80 · labels 30 | ladder + labels + a teal box at `1.15600–1.16600` | FOUND |

**Ledger rows: `PASS` on all four TFs** (sha `82da437a…`), the only deliverable with 4/4.
Deltas read `ANCHOR_DROPPED:3` (1H) — recorded, not a veto.

---

## 5 · THE MEASURED ALTERNATIVE FOR D1 (demonstrated, then handed to the operator)

The served directory already carries the variant built for this calibration:
`pine-ide/ide/renderer/lqz-luxalgo-both.pine` (42437 bytes) — `lqzSource` defaulted to `both`.
**The earlier session measured:** `luxalgo → 0 coloured zones · both → 3 coloured`. This record
re-runs the variant on the live page and appends the `boxes/lines/labels` the rail returns, so
the operator's choice is made against a measured pair rather than a claim.

**THE OPERATOR'S CHOICE IS EXACTLY THIS SET** (pin §OPEN calibration): `lqzTol` · `lqzMinAgree`
· `wickSourceMult` · `rejectATRMult` — plus `lqzSource`, whose two settings differ by
`0 → 3` labelled zones on D1.

---

## 6 · WHAT THE LOOK ESTABLISHED (the honest summary)

1. **All four grids exist, hold the required 4 panels, and were built under a freshness guard
   that REFUSES a stale frame rather than captioning it.**
2. **The panels' BARS ARE IDENTICAL** — re-measured this turn: `400 bars`,
   `2026-06-11T15:00 → 2026-07-06T06:00`, same TF, three distinct `sourceSha`s
   `d33c2b75e30d / 68881deaca0c / 82da437af969`. **`IDENTICAL_BARS: true`.**
3. **The VIEWPORTS ARE NOT IDENTICAL** — the chart auto-fits per run and no viewport control
   exists in the CDP composer. A scale-matched comparison is a NAMED residual, not a claim.
4. **D2 and D3 match the library's look** at 30m/4H (thin full-width rails + labels).
5. **D1 does not — yet.** Its default draws unlabelled slivers; the labelled full-width emitter
   is gated on 2-source agreement and emits nothing under `luxalgo`. The `-both` variant is the
   measured alternative.
6. **THE OPERATOR'S EYES ARE THE FINAL GATE.** Nothing here substitutes for them. This record
   is what the agent saw; the verdict is theirs.


---

# APPENDIX — D1's three defects, found AFTER the looks above, each with its measurement

**The looks in §2 were of the state as it was.** Three defects were then found and fixed; they
are recorded here because a look record that does not carry the fixes is a record of a system
that no longer exists.

## A · `lqzLabel` — DECLARED, IN THE DIALOG, DEFAULT ON, NEVER CONSUMED

```
grep -n  lqzLabel  lqz-luxalgo.pine   ->  1 line    (its own declaration)
grep -c  label.new lqz-luxalgo.pine   ->  0         (no emission existed at all)
```

**The consequence, traced to the line — `gate.mjs:157`:**

```javascript
if (verdict === 'PASS' && (zones === 0 || labels === 0)) {   // MECH_VETO
  deltas.push(`MECH_VETO:boxes=${zones}:labels=${labels}`);  // -> FAIL
```

**D1 could never pass: `labels` was 0 by construction.** ← Commit `facb519`.

## B · THE LABEL WAS COUNTED BUT NEVER DRAWN

Wiring the emission gave `labels 2` — and **a pixel scan found ZERO text pixels**. The label
carried `time 1783389600000` against the run's `lastTime 1783317600000`: **20 bars PAST the last
bar, outside the frame.** The library's tags ride the middle of their bands.
**Re-anchored at `math.max(0, bar_index - math.round(lqzLeftB / 2))`** — measured
`t=06-19T20:00, inside: true` for both. ← Commit `1795231`.

## C · THE RIG — THE RAIL CALLED A WORKING STATION DEAD

While chasing B, every run began returning `VIL_RAIL_DOWN`. The chain, each link measured:

```
station /health (half-alive)          4.0–20 s      POST /run: {"success":true} throughout
  -> rail /health probes it INLINE     4.04 s
  -> page's gate client aborts at      2500 ms
  -> VIL_RAIL_DOWN — EVERY RUN FAILED, station fine
```

`scripts/pv-ide.sh` already carried this exact lesson for its own launcher; **the rail never
learned it.** Fixed: a timeout is not a refusal (`PINE_STATION_SLOW`), 800 ms budget, `up` is
three-valued — `true`, or `null` (UNKNOWN) for a timeout, **never `false`**. ← Commit `469e1b2`.

## D · THE ASSERTION THAT DOES NOT BITE — two files, one title

The retry loop asserted the run **title** (`'LQZ LuxAlgo'`). **Both the shipped D1 and the
`-both` variant carry that title**, so the loop broke on the engine's debounced-flush compile of
the PREVIOUS file and reported the old file's counts under the new file's name. **The fix is to
assert `sourceSha`** — the per-file identity — whenever two artifacts can share a display name.

## THE OPERATOR'S MEASURED PAIR, as it now stands

| config | boxes | lines | labels | zones visible |
|---|---|---|---|---|
| `lqzSource='luxalgo'` (default) | 117 | 36 | **0** | the native primitives only; the LQZ full-width emitter admits no zones under the 2-source rule |
| `lqzSource='both'` | 117 | 42 | **2** | + 2 labelled full-width zones (`Sellside Liquidity`) |

**The default is honest, not broken:** under `luxalgo` the 2-distinct-source rule (`lqzMinAgree=2`)
finds no agreeing pair on this fixture, so there is nothing to label. **Both knobs — `lqzSource`
and `lqzMinAgree` — are the operator's calibration.**


---

# THE CLOSING MEASUREMENT — D1's first PASS, and the frame it rides on

**Date:** 2026-10-02 · **Rig:** restored by the launcher after the station wedged; all four ports
confirmed (`:9741 200 · :9754 404=healthy · :9851 200 · :9222 200`), rail `/health` at
**0.0016 s**.

**THE RUN** (asserted on `sourceSha`, per finding D):

```
srcSha 88de18cfde20   boxes 117 · lines 42 · labels 2
```

**THE GATE ROW** — the first D1 row in the ledger that is NOT vetoed:

```
verdict PASS · deltas [] · labels 2 · boxes 117 · pngSha cceb3271898d3d35
```

**THE LOOK.** The capture `cceb3271898d3d35` was opened. It carries, on the EUR/USD 1h fixture
across Jun 13 – Jul 5:

- **two labelled full-width zones** — the tags read **"Sellside Liquidity"**, sitting at ≈1.1405
  and ≈1.1390, mid-chart (Jun 22–23), visibly drawn;
- the zone rails spanning the plot width;
- the LuxAlgo-native primitives beneath them.

**For comparison, the same file under the shipped default `lqzSource='luxalgo'`:**

```
boxes 117 · lines 36 · labels 0   -> MECH_VETO:boxes=117:labels=0 -> FAIL
```

**THE HONEST READING OF THE PAIR.** The default is not broken; it is *honest*. Under `luxalgo`
the 2-distinct-source rule (`lqzMinAgree=2`) finds no agreeing pair on this fixture, so the
full-width emitter has nothing to label. **The display the pin's D1 asks for appears when the
operator sets `lqzSource='both'` — or lowers `lqzMinAgree` — both of which are in the pin's
OPEN calibration set.** The measured pair is now: **`luxalgo` 117/36/0/FAIL · `both` 117/42/2/PASS.**


---

# THE FIFTH GRID — the combined 4TF, opened last (an unopened panel is UNPROVEN)

`reports/panel-grid-IDE-4TF-2026-W29.png` · sha256[:16] **`2cbc46a8a75e7537`** · titled by its
composer *"PLUTUS VISION v1 (D3) ACROSS ALL FOUR TIMEFRAMES — captured BY THE IDE on 2026-W29"*.

**THIS GRID IS D3-ONLY** — the library reference beside D3 at 15m/30m/1H/4H — so it supplements
the pin's `[library | D1 | D2 | D3]` contract rather than replacing it. It is read here because
**it was listed among the artifacts and had not been opened; an unopened panel is unproven.**

**READ — every panel, with coordinates:**

| panel | reader | counts | what I SAW |
|---|---|---|---|
| LIBRARY REF | — | — | the operator's frame, LARGE bands, as in the other four |
| D3 · 15m | **PASS** | boxes 5 · lines 57 · labels 22 · bars 325 · dropped 3 | a red zone `1.14450–1.14650` top-left; tags `EQH` `EQ` `CHoCH` `BOS` `EQL`; teal rails; x-axis Jul 3–Jul 6 |
| D3 · 30m | **PASS** | boxes 5 · lines 85 · labels 23 · bars 400 · dropped 4 | red zones `1.14600–1.14800` and `1.14400–1.14500`; a teal zone `1.14350–1.14450`; `CHoCH`; x-axis Jul 2–Jul 4 |
| D3 · 1H | **PASS** | boxes 5 · lines 79 · labels 24 · bars 400 · dropped 3 | the richest panel — red zones `1.14550–1.14800`, a blue zone `1.13600–1.13800`, dense thin rails, `BOS` `CHoCH`; x-axis Jun 26–Jul 4 |
| D3 · 4H | **PASS** | boxes 5 · lines 80 · labels 30 · bars 400 · dropped 3 | red `1.16300–1.16600` (top), teal `1.14800–1.14900` and `1.14000–1.14100`, blue `1.13500–1.13600`; `CHoCH` `BOS`; x-axis Jun 4–Jul 2 |

**VERDICT: D3 PASSES ALL FOUR TIMEFRAMES** — 4/4 `reader=PASS`, labels 22–30 per panel, zones and
tags visible in every frame I opened. `dropped: 3–4` recorded throughout (the same
`ANCHOR_DROPPED` family the per-TF ledgers carry — recorded, not hidden).
