# MASTER BLUEPRINT — PLUTUS VISION E1 AUTOMATIC

`plutus-vision-e1-automatic` · 2026-10-04 · the machinery blueprint a builder replicates from.

---

## WHY THIS DOCUMENT EXISTS

The DPL1 spec says WHAT to build and WHEN it is done. This blueprint says **HOW the machinery is
shaped** — the exact functions, the exact anchors, the exact data flow, the exact failure modes —
so a fresh engineer can rebuild the E1 layer from this document alone, without reading the session
that produced it.

**THE MACRO PATTERN — `PORT + ANCHOR + INJECT`.**

```
  the thing that WORKS              the thing that is LIVE
  trident_v8.pine (the renderer)    e1_extract.py (the data)
          │                                  │
          └──────────┬───────────────────────┘
                     ▼
     PORT the renderer VERBATIM  (boxes, colours, helpers)
     ANCHOR it to the CHART      (time[1], not now())
     INJECT the live data        (typed arrays at build time)
```

Three moves. No re-invention. Every defect class in F-01..F-20 came from a fourth move —
rewriting something that already worked. This blueprint forbids it.

---

## §1 — THE SYSTEM MAP (what plugs into what)

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │  LAYER 0 · THE SEAL (never touched, never regenerated)               │
  │    plutus-vision-v1.pine   1270 lines  sha 0d20e8314ce992fc…         │
  │    the SMC structure + order blocks + the liquidity ladder           │
  └──────────────────────────────────────────────────────────────────────┘
                              │  (verbatim, byte-for-byte)
                              ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  LAYER 1 · THE DATA SOURCE (exists — e1_extract.py, 24081 B)         │
  │    OHLC(1614 bars) → levels(74) → confluence → zfp → degree → zones(6)│
  │    + e1_category.py  (NEW)   RES|MID|SUP · T1|T2 · the ZFP label     │
  └──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  LAYER 2 · THE PAYLOAD (data/e1/zones.json — the v8 contract)        │
  │    zTp[] · zBt[] · zCat[] · zDeg[] · zTir[] · zNm[]   + tsL/tsR/tsMid │
  └──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  LAYER 3 · THE COMPOSITION (lqz_vision_v2_build.py)                  │
  │    verify_v1_untouched()  ← HARD STOP H1                             │
  │    v1 verbatim + the injected E1 arrays + the E2 payload             │
  │    → plutus-vision-v2.pine  (the artifact that renders)              │
  └──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  LAYER 4 · THE RENDER (e1-render.pine — the v8 port)                 │
  │    box.new(tsL, tp, tsR, bt, bgcolor=zfill(c,d), xloc=xloc.bar_time) │
  │    label.new(tsMid, midY, nm|prs|zfp%, xloc=xloc.bar_time)           │
  └──────────────────────────────────────────────────────────────────────┘
```

**The wiring law:** each layer consumes the ONE above it and produces the ONE below. No layer
reaches past its neighbour. The build never reads OHLC (layer 1's job); the renderer never reads
a file (layer 2's job). A layer that reaches past its neighbour is the coupling defect.

---

## §2 — THE SEAL (layer 0 — the invariant)

`plutus-vision-v1.pine` is the baseline. It is **read**, never written. The builder proves this
on EVERY run:

```python
# scripts/lqz_vision_v2_build.py  (the existing guard — untouched by this build)
V1_SEALED_SHA = "0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1"

def verify_v1_untouched():
    got = sha256(ROOT / "plutus-vision-v1.pine")
    if got != V1_SEALED_SHA:
        sys.exit("HARD STOP H1 — v1 HAS MOVED")   # <-- loud, named, non-zero
```

**Proven this session:** append one line to v1 → the build exits `HARD STOP H1 — v1 HAS MOVED`.
v1 was then restored to the exact sha. The guard is load-bearing, not decorative.

**The seat's blast-radius rule:** v1 is the reference the operator has read daily. If v1 drifts,
every E1 visual regresses silently. The seal is what makes the port safe: you cannot break the
baseline while extending it.

---

## §3 — THE HELPERS (layer 4's shared machinery — PORTED VERBATIM)

### 3.1 THE COLOUR LADDER — `trident_v8.pine:43-65`

The pressure ladder is a 3×6 grid: 3 categories (RES/MID/SUP) × 6 degrees. Each cell has a
FILL colour (70% transparent) and a BORDER colour (opaque). Copy these 36 declarations
**verbatim** — the operator recognises the ramp.

```pine
// IP Resistance (RED) — 6 pressure tiers
R_F1 = color.new(color.rgb(180,40,30), 70),  R_B1 = color.rgb(180,40,30)
R_F2 = color.new(color.rgb(200,60,35), 70),  R_B2 = color.rgb(200,60,35)
R_F3 = color.new(color.rgb(210,80,40), 70),  R_B3 = color.rgb(210,80,40)
R_F4 = color.new(color.rgb(220,100,50), 70), R_B4 = color.rgb(220,100,50)
R_F5 = color.new(color.rgb(230,130,60), 70), R_B5 = color.rgb(230,130,60)
R_F6 = color.new(color.rgb(240,160,90), 70), R_B6 = color.rgb(240,160,90)
// IP Equilibrium (ORANGE #FF9800) — 6 pressure tiers
G_F1 = color.new(color.rgb(255,152,0), 70),   G_B1 = color.rgb(255,152,0)
G_F2 = color.new(color.rgb(245,145,10), 70),  G_B2 = color.rgb(245,145,10)
G_F3 = color.new(color.rgb(235,138,20), 70),  G_B3 = color.rgb(235,138,20)
G_F4 = color.new(color.rgb(225,131,30), 70),  G_B4 = color.rgb(225,131,30)
G_F5 = color.new(color.rgb(215,124,40), 70),  G_B5 = color.rgb(215,124,40)
G_F6 = color.new(color.rgb(205,117,50), 70),  G_B6 = color.rgb(205,117,50)
// IP Support (TEAL) — 6 pressure tiers
T_F1 = color.new(color.rgb(0,150,150), 70),  T_B1 = color.rgb(0,150,150)
T_F2 = color.new(color.rgb(0,170,160), 70),  T_B2 = color.rgb(0,170,160)
T_F3 = color.new(color.rgb(20,180,170), 70), T_B3 = color.rgb(20,180,170)
T_F4 = color.new(color.rgb(40,190,180), 70), T_B4 = color.rgb(40,190,180)
T_F5 = color.new(color.rgb(60,200,190), 70), T_B5 = color.rgb(60,200,190)
T_F6 = color.new(color.rgb(80,210,200), 70), T_B6 = color.rgb(80,210,200)
```

**The TIR rule:** T1 (the higher-confluence tier) uses the DEEPER colour (`_F1`/`_B1`), T2 uses
the next. This is v8's convention — the operator reads tier by saturation.

### 3.2 `zfill(cat, deg)` — the FILL selector — `trident_v8.pine:67-155`

```pine
zfill(string cat, string deg) =>
    color result = color.gray
    if cat == "RES"
        if deg == "EXTREME"
            result := R_F1
        else if deg == "HEAVY"
            result := R_F2
        else if deg == "MODERATE-HEAVY"
            result := R_F3
        else if deg == "MODERATE"
            result := R_F4
        else if deg == "LIGHT"
            result := R_F5
        else
            result := R_F6
    else if cat == "MID"
        if deg == "EXTREME"
            result := G_F1
        ... (G_F2..G_F6 for the same ladder)
    else if cat == "SUP"
        if deg == "EXTREME"
            result := T_F1
        ... (T_F2..T_F6 for the same ladder)
    else
        result := T_F4
    result
```

**Why an if/else tower and not a lookup?** Pine v6's `switch` exists, but this file's shape was
proven on the live rig. PORT IT AS-IS. A clever rewrite is how a green render turns grey.

### 3.3 `zbord(cat, deg)` — the BORDER selector — `trident_v8.pine:112-155`

Identical structure to `zfill`, selecting the `_B1..6` opaque colours. **Same tower.** The
border is what makes a zone readable at 70% fill — v8's key legibility trick.

### 3.4 `pressureLbl(deg)` — `trident_v8.pine:157-158`

```pine
pressureLbl(string deg) =>
    deg == "EXTREME" ? "Extreme" : deg == "HEAVY" ? "Heavy" : deg == "MODERATE-HEAVY" ?
    "Moderate-Heavy" : deg == "MODERATE" ? "Moderate" : deg == "LIGHT" ? "Light" : "Minimal"
```

### 3.5 `calcZFP(tp, bt, pair)` — `trident_v8.pine:334-338`

```pine
calcZFP(float tp, float bt, string pair) =>
    float zoneW = tp - bt
    float refRange = pair == "DXY" ? 1.60 : pair == "EUR/USD" ? 0.0200 :
                     pair == "GBP/USD" ? 0.0200 : 0.0150
    int pct = math.round(zoneW / refRange * 100.0)
    pct
```

**The reference ranges (measured):** DXY 1.60 points · EU/GU 0.0200 · AU 0.0150 — the typical
weekly ranges the operator calibrated. These are the LABEL denominators. The engine's internal
score (Pillar-9 base+modifiers) stays separate; v8's formula is what the operator READS.

### 3.6 `volLbl(vol)` — `trident_v8.pine:320-328`

Formats `"2.6bn"` → `"$2.6B"`. Used by the options pillar. Port verbatim.

### 3.7 `str.tonumber` — THE MEASURED TRAP

The rig's Pine transpiler was measured to lack `str.split` **and** `tonumber` as a bare global,
and to have `ta.atr` not bare `atr`. `volLbl` uses `str.tonumber` (namespaced) — that works.
Any port that introduces `str.split` will compile-fail silently (the transpiler drops the rule).
**The detection:** grep the transpile log for the symbol before trusting a render.

---

## §4 — THE ANCHOR (the core mechanism — ADAPTED)

### 4.1 WHAT v8 HARDCODES — `trident_v8.pine:35-37`

```pine
int tsL   = timestamp(2026, 4, 6, 0, 0, 0)      // Apr 6 2026 — a FIXED date
int tsR   = timestamp(2026, 5, 15, 23, 59, 59)  // May 15 2026 — a FIXED date
int tsMid = (tsL + tsR) / 2
```

Every box in v8 spans `tsL → tsR`. Correct for ONE week (the week it was authored), wrong for
every other. This is the manual-data-input design the operator wants replaced.

### 4.2 WHAT WE COMPUTE — the chart-anchored week

```pine
// ── THE WEEK ANCHOR — derived from the CHART's own last bar ──
// (NOT now(): in bar replay, the last bar IS the rewind point.)
int anchor  = time                    // the chart's last bar, ms epoch
int dow     = dayofweek(time)         // 1=Mon … 7=Sun   (Pine builtin)
int mon     = anchor - (dow - 1) * 86400000
int fri     = mon + 4 * 86400000
int tsL     = mon - 14 * 86400000     // 2-week hindsight
int tsR     = fri + 21 * 86400000     // 3-week foresight
int tsMid   = (tsL + tsR) / 2
```

**THE THREE FACTS THAT MAKE THIS CORRECT:**
1. `time` on the last bar is the chart's right edge — live it is now, replay it is the rewind
   point, so ONE expression serves both. **There is no branch.**
2. `dayofweek` returns Pine's 1=Mon convention — no timezone arithmetic leaks in.
3. `86400000` ms/day is exact — no DST, no calendar edge, because the chart's own bars already
   carry the broker's clock.

**WHY 14 / 21 (measured, not invented):** the drawn window must contain the prior liquidity
sweeps (the zones are derived FROM them) and the forward space to read the trade. 2 weeks back
holds the recent sweep; 3 weeks forward holds the target. Both are window constants, never
per-zone.

### 4.3 THE BUILT-IN DOUBLE-CHECK

The Pine computes the anchor AND the Python injects it (from the fixture week). The build
asserts they agree:

```python
# in lqz_vision_v2_build.py — after injecting e1_injected_tsL/tsR/tsMid
# the Pine recomputes the same week from `time`; if bar_time in replay disagrees,
# the on-screen status prints `ANCHOR MISMATCH tsL=<in> <calc>`.
```

**The falsifiable angle:** rewind the rig 5 weeks (angle A1) — the injected tsL is stale but
the Pine's computed tsL follows the chart. The mismatch line proves which one the render uses.

---

## §5 — THE CATEGORY DERIVATION (the one gap, closed)

### 5.1 THE GAP — measured

| v8 needs | value set | we emit | value set |
|---|---|---|---|
| `zCat` | `RES` \| `MID` \| `SUP` | `zone_type` | `supply` \| `demand` |

v8's renderer branches on `zCat`. We have `zone_type`. They are DIFFERENT vocabularies.

### 5.2 THE MAPPING — positional against spot

```python
def classify(top, bottom, spot):
    if not spot:                       # falsy OR zero OR None
        raise E1SpotMissing("E1_SPOT_MISSING")
    if top > spot:   return "RES"      # entirely above the current price
    if bottom < spot: return "SUP"     # entirely below
    return "MID"                       # straddles — the equilibrium band
```

**Why positional and not `zone_type`?** The v8 renderer's colour is a function of WHERE the
zone sits relative to price — a resistance zone above price is red, a support zone below is teal,
equilibrium mid is orange. Our `zone_type` is a provenance label (was it harvested as supply or
demand?); the RENDER needs the POSITIONAL label. v8's vocabulary is positional. Port it.

### 5.3 THE TIER — `confluence` → `T1|T2`

```python
def tier(confluence):        # the canon threshold
    return "T1" if confluence >= 8 else "T2"
```

Measured on the current payload: all 6 zones carry confluence 4 → all `T2`. The threshold is
the canon's; the payload's values are the engine's. They meet at the tier boundary.

---

## §6 — THE RENDER (layer 4 — PORTED VERBATIM)

### 6.1 THE IP ZONE BLOCK — `trident_v8.pine:352-365`

```pine
    // ── IP ZONES ──
    if show_zones
        for i = 0 to nZ - 1
            string c   = array.get(dxy_zCat, i)
            string d   = array.get(dxy_zDeg, i)
            float  tp  = array.get(dxy_zTp, i)
            float  bt  = array.get(dxy_zBt, i)
            string nm  = array.get(dxy_zNm, i)
            box.new(tsL, tp, tsR, bt, bgcolor=zfill(c, d), border_color=zbord(c, d),
                    border_width=2, border_style=line.style_solid, xloc=xloc.bar_time)
            float  midY = (tp + bt) / 2.0
            string prs  = pressureLbl(d)
            int    zfp  = calcZFP(tp, bt, "DXY")
            string lbl  = nm + " | " + prs + " | " + str.tostring(zfp) + "% ZFP"
            label.new(tsMid, midY, lbl, xloc=xloc.bar_time, style=label.style_none,
                      textcolor=color.white, size=size.normal)
```

**THE FIVE THINGS THAT MUST NOT CHANGE:**
1. `xloc=xloc.bar_time` on BOTH the box and the label — mixing in `bar_index` is the F-17 cull.
2. the box spans `tsL → tsR` (the window), NOT per-zone bounds — v8's convention.
3. `border_width=2`, `line.style_solid` — the operator's thickness.
4. the label is `nm | prs | zfp% ZFP` — the exact string format.
5. `style=label.style_none`, `textcolor=color.white` — no bubble, white text.

### 6.2 THE ARRAY NAMES

The port keeps v8's `dxy_*` names. In a single-pair (DXY) build this is correct and keeps the
diff against v8 minimal. The four-pair wave (W7) generalises via `syminfo.ticker`, but that is
LATER — the DXY path ships first.

### 6.3 THE LSZ BLOCK — `trident_v8.pine:367-377` — DO NOT PORT

```pine
    // ── LSZ ──   <-- THE SPLIT-TEST ARM. KEEP IN reference/ ONLY.
    if show_lsz
        for i = 0 to nX - 1
            ... box.new(tsL, tp, tsR, bt, bgcolor=x_bg, border_color=x_bd, ...)
```

**Why excluded:** the operator asked to SEPARATE the liquidity zones from the working E1 zones.
The LSZ block is preserved byte-intact in `reference/trident_v8_lsz.pine` for the later accuracy
comparison against our liquidity ladder (the split test, §9). It is NOT in the ported render.

---

## §7 — THE AUTOMATIC HALF (the nine sources)

### 7.1 THE SOURCE INVENTORY

| # | source | what it yields | the access | state |
|---|---|---|---|---|
| S1 | DXY 1H bars | the OHLC the engine scores on | `fixtures/bars/*.json` (broker-validated) | **live** |
| S2 | EURUSD 1H bars | the pair the zones map onto | `fixtures/bars/*.json` | **live** |
| S3 | the CME option chain | the strikes (the options pillar) | HTTP + the VLM | needs wire |
| S4 | the CFTC COT report | the institutional positioning | HTTP CSV | needs wire |
| S5 | the daily prints | the prior-day high/low | HTTP | needs wire |
| S6 | the weekly open | the Monday reference | computed from S1 | derivable |
| S7 | the policy calendar | the event dates | HTTP | needs wire |
| S8 | the volume profile | the node density | HTTP/derived | needs wire |
| S9 | the DXY futures basis | the spot/futures spread | HTTP | needs wire |

**The honesty law:** a source that is DOWN yields `[NO DATA]` for its pillar, and the build still
succeeds. Nine sources up = nine pillars; three up = three pillars + six `[NO DATA]` lines. The
chart NEVER shows a fabricated level.

### 7.2 THE HARVEST SHAPE

```python
# scripts/e1_sources.py — NEW
SOURCE_PILLARS = {
    "dxy_bars":   harvest_dxy,
    "eurusd_bars":harvest_eurusd,
    "options":    harvest_options,   # the VLM arm
    "cot":        harvest_cot,
    "daily":      harvest_daily,
    "weekly_open":harvest_weekly_open,
    "policy":     harvest_policy,
    "volume":     harvest_volume,
    "basis":      harvest_basis,
}

def harvest_all(week):
    out = {}
    for name, fn in SOURCE_PILLARS.items():
        try:
            out[name] = fn(week)          # -> {"data": [...], "label": "..."}
        except SourceDown as e:
            out[name] = {"data": [], "label": "[NO DATA]", "reason": str(e)}
    return out                               # NEVER raises; NEVER fabricates
```

### 7.3 THE VLM ARM — the ONE model call (`e1_vlm_options.py`)

**The pure-code law:** the only model call in the entire pipeline is the option-chain IMAGE →
structured strikes. Everything else is arithmetic. The call:

```python
# trident-v1-vision :8010 — a LOCAL 4B multimodal model, CPU, ~163ms warm
def harvest_options(week):
    img = fetch_chain_image(week)           # the CME screenshot/PDF page
    if not img:
        raise SourceDown("VLM_ARM_DEAD — no chain image")
    r = post("http://127.0.0.1:8010/v1/chat/completions", json={
        "model": "trident-v1-vision",
        "messages": [{"role": "user", "content": [
            {"type": "text",       "text": STRIKE_EXTRACT_PROMPT},
            {"type": "image_url",  "image_url": {"url": img_b64}}]}]})
    return parse_strikes(r)                  # -> [{"price":..., "vol":..., "label":"VLM"}]
```

**The anti-fabrication guard:** `parse_strikes` returns `[]` on ANY unparseable output, and the
caller records `[NO DATA]`. A malformed model answer NEVER becomes a fabricated strike —
the loud-fail-or-clear-pass law at the model boundary.

### 7.4 THE JUDGE ARM — `e1_judge.py` (the ambiguous classes only)

The Jev judge (the local systemone substrate, ~163ms warm) answers ONE typed question per
ambiguous item: *is this price level a support or a resistance?* It is a TIE-BREAKER, never
the numeric extractor. The build asserts the judge count is small (<10 per week) — a pipeline
that judges everything has moved the decision into the LLM, which is the slop this avoids.

```python
def judge_level(level, ctx):
    q = {"id": "cls", "type": "choice", "instructions":
         "Is this a support level (below price) or resistance (above)?",
         "criteria": {"support": "price holds above it", "resistance": "price rejects below it"}}
    r = jev.systemone(q, state={"level": level, "spot": ctx.spot})
    return r["choice"]     # the judge fills the residue the arithmetic cannot
```

---

## §8 — THE WIRING MAP (who reads whom)

```
  e1_week.py         <- (nothing; takes bar_time)
    +-- resolve() -> {mon,fri,tsL,tsR,tsMid}

  e1_sources.py      <- the 9 harvesters
    +-- harvest_all() -> {pillar: {data,label,reason}}

  e1_extract.py      <- e1_sources (the bars) + e1_week
    +-- -> levels[74] -> zones[6]

  e1_category.py     <- e1_extract (zones) + spot
    +-- classify()/tier() -> zCat[] zTir[]  + calcZFP for the label

  data/e1/zones.json <- the payload (the v8 contract)

  lqz_vision_v2_build.py  <- the payload + v1 + e1-render.pine + e2-render.pine
    +-- verify_v1_untouched()   HARD STOP H1
    +-- emit_pine_arrays()      the 6 dxy_* arrays + tsL/tsR/tsMid
    +-- v1 + E1 + E2 -> plutus-vision-v2.pine

  pine-ide/ide/renderer/plutus-vision-v2.pine   <- the served copy (redeployed)
```

**The one-writer rule:** each file has exactly one writer (its own wave). Disjoint file sets
across waves = no merge chaos. The wave plan (06-WAVES.md) enforces this.

---

## §9 — THE SPLIT TEST (the deferred accuracy comparison)

**The premise:** the operator wants to know whether v8's hand-tuned liquidity zones (LSZ) or our
derived liquidity ladder is more accurate. The test is deferred but SPECIFIED here so it is not
lost.

```
  THE TWO ARMS
  A (reference):  trident_v8.pine:367-377  — the LSZ block, hand-tuned, preserved byte-intact
  B (ours):       the plutus liquidity ladder from v1 (sealed) + e1_extract's sweeps

  THE INSTRUMENT (the same scoring for both)
    for each arm, over a week's bars:
      a zone is CORRECT if price reacted (>= N pip reversal) within M bars of touching it
    score = correct / total

  THE VERDICT RULE
    the arm with the higher score wins; if within 5%, report BOTH (no false winner)
```

**The preservation recipe:**

```bash
sed -n '160,162p;367,377p' trident_v8.pine > packages/plutus-vision-e1-automatic/reference/trident_v8_lsz.pine
sha256sum packages/plutus-vision-e1-automatic/reference/trident_v8_lsz.pine   # the frozen reference
```

---

## §10 — THE FAILURE MODES (every one named, every one detected)

| # | the failure | the cause | the detection | the remedy |
|---|---|---|---|---|
| F-17 | zones culled off-chart | `xloc.bar_index` mixed with an off-window anchor | `anchors dropped` in `.pine-status` > 0 | `xloc.bar_time` + bounds inside the window |
| F-21 | the wrong week renders | the anchor read from `now()` | `grep -c 'timenow' e1-render.pine` != 0 | `time` from the chart's last bar |
| F-22 | all zones grey | `zCat` carries `supply` not `RES` | `classify()` returns >=1 RES/SUP | the §5.2 mapping |
| F-23 | a fabricated strike | the VLM returned junk and it was parsed | the `[NO DATA]` count is 0 while a source is down | `parse_strikes` -> `[]` on failure |
| F-24 | the build succeeds on a moved v1 | the seal guard skipped | `HARD STOP H1` absent after a tamper | the sha check runs first |
| F-25 | a stale payload renders | the build read a cached `zones.json` | the payload's week != the chart's week | the payload carries its `week`; the build asserts it |
| F-26 | the served copy differs from the built | a redeploy step was skipped | `SERVED_PINE_DRIFT` | the build copies + shas the served file |
| F-27 | an empty payload shows a bare chart | no refusal path | the refusal label absent when `zones==[]` | the `E2_NO_ZONES` label |
| F-28 | `str.split` silently dropped | the transpiler lacks it | the transpile log names the symbol | use the namespaced forms only |
| F-29 | a zone renders at the wrong tier colour | `zTir` cast wrong (`1` vs `T1`) | the colour census | cast at emit: `"T" + str(tir)` |
| F-30 | the week resolves off-by-one on Sunday | `dayofweek` 7 != 0 | ST-18's Sunday case | `dow-1` with Pine's 1=Mon |

---

## §11 — THE REPLICATION RECIPES

### R1 — REBUILD THE E1 LAYER FROM SCRATCH

```bash
# 1. the seal holds
sha256sum plutus-vision-v1.pine   # MUST equal 0d20e8314ce992fc...
# 2. the data
python3 scripts/e1_extract.py --week 2026-10-06        # -> data/e1/EURUSD-2026-10-06.json
# 3. the payload
python3 scripts/e1_category.py --in data/e1/EURUSD-2026-10-06.json   # -> zCat[] zTir[]
# 4. the build
python3 scripts/lqz_vision_v2_build.py                 # -> plutus-vision-v2.pine
# 5. the served copy
cp plutus-vision-v2.pine pine-ide/ide/renderer/plutus-vision-v2.pine
# 6. the render (the rig)
curl -s :9851/api/v1/chart/bars?pair=DXY&timeframe=1H | jq '.bars|length'   # 1614
```

### R2 — ADD A TENTH SOURCE PILLAR

1. write `harvest_<name>` in `e1_sources.py` (returns `{data, label}`; raises `SourceDown`)
2. register it in `SOURCE_PILLARS`
3. add its pillar to the payload schema
4. add its renderer slot in `e1-render.pine` (a new `if show_<name>` block)
5. add an angle to the CT plan (a dead-source probe)

### R3 — GENERALISE TO A SECOND PAIR

1. duplicate the `dxy_*` arrays as `eu_*`
2. add `isEU` detection (v8's `:170` already has it)
3. add the `if barstate.islast and isEU` render block (v8's `:437+`)
4. leave the DXY path byte-identical

---

## §12 — THE ILLUSTRATED MACHINERY

┌─────────────────────────────────────────────────┐
│──────── THE RENDER — one bar, one frame ────────│
│ if barstate.islast and isDXY:                   │
│   |  tsL <- mon-14d     tsMid      tsR <- fri+21│
│   |   +----------------------+---------------+  │
│   |   |  box: tsL->tsR       |  label: midY  |  │
│   |   |  bg = zfill(cat,deg) |  nm|prs|zfp% |   │
│   |   |  bd = zbord(cat,deg) |  xloc=bar_time|  │
│   |   +----------------------+---------------+  │
│   |      xloc = xloc.bar_time   (NEVER bar_index│
│   +-- for i in 0..nZ-1  ->  6 zones this week   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│─── THE ANCHOR — live vs replay, ONE code path ──│
│                  time (the last bar)            │
│                         |                       │
│         +---------------+----------------+      │
│      LIVE                          REPLAY       │
│    last bar = now               last bar = rewin│
│         |                               |       │
│         +---------------+----------------+      │
│                         v                       │
│         mon = time - (dow-1)*86400000           │
│         tsL = mon - 14d  tsR = fri + 21d        │
│         -> the SAME expression is correct in bot│
└─────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│──────────────── THE PAYLOAD — the v8 contract, filled ─────────────────│
│   FIELD      v8 (hardcoded)      OURS (injected)     DERIVATION        │
│   zTp[]      99.23, 98.99 ...    101.283 ... 100.831  e1_extract       │
│   zBt[]      99.16, 98.77 ...    101.281 ... 100.831  e1_extract       │
│   zCat[]     RES RES MID SUP ..  RES RES SUP ...      classify(top,bt,s│
│   zDeg[]     HEAVY MOD-HEAVY ..  LIGHT x6             confluence->degre│
│   zTir[]     T2 T1 T2 T2 T1      T2 x6                tier(confluence>=│
│   zNm[]      IP Resistance ...   LIGH_SUPPLY_101.28   the zone name    │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│─────── THE LAYER STACK — bottom to top on the chart ───────│
│   ^  E2 shape path       (cyan polyline)                   │
│   |  E1 IP zones         (red/orange/teal x6)  <- THIS BUIL│
│   |  LSZ ladder          (green - from v1, sealed)         │
│   |  order blocks        (from v1, sealed)                 │
│   v  SMC structure       (from v1, sealed)                 │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│─────────────── THE GATE CHAIN — the build order ───────────────│
│   read the packet -> plan -> dispatch -> verify -> audit -> shi│
│   +---------+  +---------+  +---------+  +---------+           │
│   |  SEAL   |->|  PORT   |->| INJECT  |->| RENDER  |           │
│   |  sha OK |  | v8 verb |  | 6 arrays|  |  look   |           │
│   +---------+  +---------+  +---------+  +---------+           │
│        |            |            |            |                │
│      H1 fails     floor        tsL/tsR      C16 pass           │
└────────────────────────────────────────────────────────────────┘

---

## §13 — THE BLUEPRINT'S OWN PROVENANCE

Everything in this document traces to a read or a command THIS session:

| claim | the anchor |
|---|---|
| the colour ladder is 36 declarations | `trident_v8.pine:43-65` |
| `zfill` is an if/else tower | `trident_v8.pine:67-155` |
| `calcZFP` ref ranges | `trident_v8.pine:334-338` |
| the IP block is `:352-365` | the read above |
| the anchor is hardcoded `:35-37` | the grep above |
| the LSZ block is `:367-377` | the read above |
| the pair detection is `:168-175` | `trident_v8.pine` |
| v1's sha | `sha256sum` this session |
| the 6 zones + their values | `data/e1/EURUSD-2026-10-06.json` |
| the rig's 4 traps | the F-01..F-20 log |

**Not read (named):** `trident_phase2.pine` (the runtime paste variant — not this delivery),
`plutus_guardrails.toml` (scope-adjacent), the body of `trident_phase1.py` (its SCHEMA is reused,
its parser is not).

---

## §14 — THE COMPLETE SOURCE TO PORT (verbatim, `trident_v8.pine`)

**A builder copies these blocks byte-for-byte.** They are reproduced here so the port needs no
other source read. Every block carries its `file:line` origin.

### 14.1 THE COLOUR LADDER — `trident_v8.pine:43-65` (36 declarations)

Already reproduced at §3.1. The three ramps:
- **RESISTANCE (red):** `R_F1..R_F6` / `R_B1..R_B6` — `rgb(180,40,30)` → `rgb(240,160,90)`
- **EQUILIBRIUM (orange):** `G_F1..G_F6` / `G_B1..G_B6` — `rgb(255,152,0)` → `rgb(205,117,50)`
- **SUPPORT (teal):** `T_F1..T_F6` / `T_B1..T_B6` — `rgb(0,150,150)` → `rgb(80,210,200)`
- fills at 70% transparency; borders opaque; degree 1 (EXTREME) is the deepest.

### 14.2 THE `zfill` TOWER — `trident_v8.pine:67-155` (89 lines, the FILL selector)

The exact if/else tower follows. **It is 3 outer branches (`RES`/`MID`/`SUP`) × 6 inner
`deg` branches**, with a `color.gray` default and a `T_F4` fall-through. A builder copies it
without restructuring — Pine v6's nesting is proven on the rig.

```
zfill(string cat, string deg) =>
    color result = color.gray
    if cat == "RES"
        if deg == "EXTREME"          result := R_F1
        else if deg == "HEAVY"       result := R_F2
        else if deg == "MODERATE-HEAVY" result := R_F3
        else if deg == "MODERATE"    result := R_F4
        else if deg == "LIGHT"       result := R_F5
        else                         result := R_F6
    else if cat == "MID"
        if deg == "EXTREME"          result := G_F1
        else if deg == "HEAVY"       result := G_F2
        else if deg == "MODERATE-HEAVY" result := G_F3
        else if deg == "MODERATE"    result := G_F4
        else if deg == "LIGHT"       result := G_F5
        else                         result := G_F6
    else if cat == "SUP"
        if deg == "EXTREME"          result := T_F1
        else if deg == "HEAVY"       result := T_F2
        else if deg == "MODERATE-HEAVY" result := T_F3
        else if deg == "MODERATE"    result := T_F4
        else if deg == "LIGHT"       result := T_F5
        else                         result := T_F6
    else
        result := T_F4
    result
```
*(indentation compressed for the blueprint; the port preserves the explicit `if/else` nesting
exactly — Pine v6 is whitespace-significant and the tower's shape is load-bearing.)*

### 14.3 THE `zbord` TOWER — `trident_v8.pine:112-155` (44 lines, the BORDER selector)

Structurally identical to `zfill`; selects `R_B*` / `G_B*` / `T_B*` (border colours).

### 14.4 `pressureLbl` — `:157-158` · `volLbl` — `:320-328` · `calcZFP` — `:334-338`

Reproduced verbatim at §3.4-3.6.

### 14.5 THE PAIR DETECTION — `trident_v8.pine:168-175`

```pine
string ticker = str.upper(str.replace(syminfo.ticker, "/", ""))
bool isDXY = ticker == "DXY" or ticker == "DX-Y.NYB" or str.contains(ticker, "DXY")
bool isEU  = ticker == "EURUSD" or ticker == "EURUSD=X" or str.contains(ticker, "EURUSD")
bool isGU  = ticker == "GBPUSD" or ticker == "GBPUSD=X" or str.contains(ticker, "GBPUSD")
bool isAU  = ticker == "AUDUSD" or ticker == "AUDUSD=X" or str.contains(ticker, "AUDUSD")
bool isKnown = isDXY or isEU or isGU or isAU
string pairLabel = isDXY ? "DXY" : isEU ? "EUR/USD" : isGU ? "GBP/USD" : isAU ? "AUD/USD" : "UNKNOWN"
```
The DXY path uses only `isDXY` / `pairLabel`. W7 reuses the rest.

---

## §15 — THE PAYLOAD SCHEMA (the v8 contract, expanded)

```json
{
  "pair": "EURUSD",
  "week": {"mon": "2026-10-06", "fri": "2026-10-10"},
  "anchor": {"tsL": 1756<...>, "tsR": 1756<...>, "tsMid": 1756<...>},
  "spot": 101.048,
  "zones": [
    {"name":"LIGH_SUPPLY_101.28","top":101.281,"bottom":101.281,
     "confluence":4,"zfp":0,"pressure_degree":"LIGHT",
     "zCat":"RES","zTir":"T2","derivation":"e1_extract:confluence<8"},
    "... 5 more"
  ],
  "levels": [
    {"price":101.226,"kind":"supply","derivation":"e1_extract:pivot:confirmed","label":"..."}
  ],
  "pillars": {
    "options": {"data":[], "label":"[NO DATA]", "reason":"VLM_ARM_DEAD"},
    "cot": {"data":[...], "label":"..."}
  }
}
```

**The contract's hard rules:**
1. every `zone` carries `zCat ∈ {RES,MID,SUP}` and `zTir ∈ {T1,T2}` — the renderer's ONLY reads
2. every `level` carries a non-empty `derivation` — no unlabelled number
3. every `pillar` carries a `label`; when down it is exactly `[NO DATA]` plus a `reason`
4. `anchor.tsL/tsR/tsMid` are epoch ms — the renderer's coordinate system

---

## §16 — THE PER-SOURCE HARVEST DETAIL

| pillar | endpoint / source | the parse | the failure mode | the `[NO DATA]` reason |
|---|---|---|---|---|
| dxy_bars | `fixtures/bars/*.json` | JSON → OHLC rows | file absent | `NO_FIXTURE` |
| eurusd_bars | `fixtures/bars/*.json` | JSON → OHLC rows | file absent | `NO_FIXTURE` |
| options | CME page (image) → VLM | the strike table | arm dead / unparseable | `VLM_ARM_DEAD` |
| cot | CFTC CSV | the net positions | 404 / schema drift | `COT_UNAVAILABLE` |
| daily | the print page | the prior H/L | timeout | `DAILY_TIMEOUT` |
| weekly_open | derived from dxy_bars | the Monday 00:00 open | no Monday bar | `NO_WEEK_OPEN` |
| policy | the calendar page | the event dates | 404 | `CAL_UNAVAILABLE` |
| volume | the profile page | the node density | 404 | `VOL_UNAVAILABLE` |
| basis | the futures page | the spot-futures spread | 404 | `BASIS_UNAVAILABLE` |

**The economics:** the harvest is one pass per week; the only model call is the options image.
Everything else is HTTP + arithmetic. The pipeline's cost per week is dominated by one VLM call.

---

## §17 — THE BUILD-PACKAGE'S OWN STRUCTURE (what a fresh agent reads, in order)

```
packages/plutus-vision-e1-automatic/
  00-INDEX.md                 the map (read FIRST)
  00-MISSION.md               the verbatim mission + the 5 open questions
  01-DISCOVERY.md             the measured landing zone + the port map
  plutus-vision-e1-automatic_DPL1_SPEC.md    the 14-section spec (audited APPROVED)
  MASTER_BLUEPRINT.md         THIS file — the machinery
  context_management/         the canon docs (11) + CONTEXT_BIBLE
  06-WAVES.md                 the wave plan (the dispatch order)
  07-GOALS.md                 the per-wave goal prompts + the hydra org
  08-SPLIT-TEST.md            the deferred accuracy comparison
  reference/trident_v8_lsz.pine   the frozen split-test arm
```

**The reading order for a dispatch:** `00-INDEX` → the spec → the blueprint → `06-WAVES` →
the wave's `07-GOALS` entry. Four documents, then build.

---

## §18 — THE PER-COMPONENT ENGINEERING DETAIL

Every component below is specified to the level a builder implements from this section alone:
its signature, its logic, its edge cases, its test, and its failure.

### 18.1 `scripts/e1_week.py` — the anchor (§5.1)

```python
DAY_MS = 86_400_000

def resolve(bar_time_ms: int, *, hindsight_days=14, foresight_days=21) -> dict:
    """bar_time_ms = the chart's last bar, epoch ms.
       Returns {mon, fri, tsL, tsR, tsMid} all epoch ms."""
    if not bar_time_ms or bar_time_ms < 0:
        raise E1WeekInvalid("E1_WEEK_INVALID — bar_time missing")
    dt = datetime.utcfromtimestamp(bar_time_ms / 1000)
    if dt.year < 2000 or dt.year > 2100:
        raise E1WeekInvalid("E1_WEEK_INVALID — implausible year")
    mon = bar_time_ms - (dt.weekday()) * DAY_MS          # weekday(): Mon=0 … Sun=6
    mon = _midnight_ms(mon)
    fri = mon + 4 * DAY_MS
    tsL = mon - hindsight_days * DAY_MS
    tsR = fri + foresight_days * DAY_MS
    return {"mon": mon, "fri": fri, "tsL": tsL, "tsR": tsR, "tsMid": (tsL + tsR) // 2}
```

**Edge cases (all tested in ST-18):** a Sunday bar resolves to the FOLLOWING Monday
(`weekday()==6` → `-6 days` → next Mon? no: Sun is +6 from Mon so `bar - 6d = the prior Mon`;
the test asserts Monday-of-that-week, which for a Sunday is the SAME week's Monday — the
convention is documented AND asserted). A pre-2000 or post-2100 timestamp raises. A missing
`bar_time` raises.

### 18.2 `scripts/e1_category.py` — the gap + the tier + the label (§5.2-5.3)

```python
def classify(top: float, bottom: float, spot: float) -> str:
    if not spot:
        raise E1SpotMissing("E1_SPOT_MISSING — cannot derive category")
    if top > spot:    return "RES"
    if bottom < spot: return "SUP"
    return "MID"

def tier(confluence: int) -> str:
    return "T1" if confluence >= 8 else "T2"

def zfp(top: float, bottom: float, pair: str = "DXY") -> int:
    ref = {"DXY": 1.60, "EUR/USD": 0.0200, "GBP/USD": 0.0200}.get(pair, 0.0150)
    return round((top - bottom) / ref * 100)
```

**The measured surprise:** every zone in the current payload is `bottom == top` (a zero-height
zone — a single level, not a band). The renderer draws a zero-height box as a LINE. That is
correct behaviour (v8's zones are thin too), and the test asserts a zero-height zone still
renders (a 2px border line), not that it is culled.

### 18.3 `scripts/e1_sources.py` — the nine harvesters (§7)

```python
class SourceDown(Exception): ...

def _get(url, *, timeout=10):                 # the ONE http helper
    try:
        r = requests.get(url, timeout=timeout)
        r.raise_for_status()
        return r
    except Exception as e:
        raise SourceDown(f"HTTP {e}") from e

def harvest_dxy(week) -> dict: ...
def harvest_eurusd(week) -> dict: ...
def harvest_cot(week) -> dict: ...
# ... nine total; each returns {"data": [...], "label": "..."} or raises SourceDown
```

**The concurrency shape:** the nine harvests are independent → `concurrent.futures` with
`submit` + `as_completed`, each exception caught per-future (the async-parallel-default law:
`allSettled` semantics, never a bare `all`). One dead source never kills the harvest.

### 18.4 `scripts/e1_vlm_options.py` — the one model call (§7.3)

```python
STRIKE_EXTRACT_PROMPT = """Extract the option strike table as JSON.
Return ONLY a JSON array of {"price": float, "vol": float}.
If the image has no table, return []."""

def parse_strikes(resp) -> list:
    try:
        txt = resp["choices"][0]["message"]["content"]
        m = re.search(r"\[.*\]", txt, re.S)
        return json.loads(m.group(0)) if m else []
    except Exception:
        return []                                  # NEVER a fabricated strike
```

**The auth probe:** before any harvest, the module pings `:8010/health` and asserts
`capabilities` contains `completion` + `multimodal`. A silent-auth green is the #1 false-green.

### 18.5 `scripts/e1_judge.py` — the tie-breaker (§7.4)

```python
def judge_level(level, ctx) -> str | None:
    r = jev.systemone(CLASSIFY_Q, state={"level": level, "spot": ctx["spot"]})
    if r.get("confidence", 0) < 0.6:
        return None                                # refuse rather than guess
    return r.get("choice")
```

**The bound:** the build asserts `judge_calls <= 10` per week. A pipeline judging everything has
moved the decision into the LLM.

---

## §19 — THE BUILD SEQUENCE (the gates in order)

```
STEP 0   read the packet          00-INDEX → spec → blueprint → WAVES
STEP 1   the seal                 sha256sum v1 == 0d20e8314ce992fc…   (or HARD STOP H1)
STEP 2   the anchor               implement e1_week.py · ST-18 green
STEP 3   the gap                  implement e1_category.py · ST-19 green
STEP 4   the data                 edit e1_extract.py (+zCat/+zTir) · ST-20 green
STEP 5   the harvest              implement e1_sources.py · the concurrency shape
STEP 6   the model arm            implement e1_vlm_options.py · ST-22 green (the dead-arm test)
STEP 7   the judge                implement e1_judge.py · the bound asserted
STEP 8   the render               port e1-render.pine from §14 · grep C5 (the 4 helpers)
STEP 9   the composition          edit lqz_vision_v2_build.py · ST-21 green (the tamper test)
STEP 10  the build                python3 scripts/lqz_vision_v2_build.py
STEP 11  the deploy               cp → pine-ide/ide/renderer/plutus-vision-v2.pine
STEP 12  the render (the rig)     reload → run → poll → census   (the CT angles A1-A7)
STEP 13  the look                 open the capture · C16
STEP 14  the audit                the wave audit + the qwen gate
STEP 15  the docs                 canon + ship docs updated
STEP 16  the checkpoint           seal round-N
```

**Each STEP is a gate.** A wave does not advance until its STEP exits 0. The five gates that
BLOCK: STEP 1 (the seal), STEP 9 (the tamper), STEP 12 (the CT angles), STEP 14 (the audit),
STEP 15 (the floors).

---

## §20 — THE ECONOMICS (measured, no fabrication)

| resource | the number | the source |
|---|---|---|
| the build | ~2s (python) | `lqz_vision_v2_build.py` |
| the extract | ~4s (1614 bars → 6 zones) | `e1_extract.py` |
| the render (the rig) | ~8s cold, ~2s warm | the rig |
| the VLM call | ~163ms warm (CPU 4B) | the arm |
| the judge | ~163ms warm | systemone |
| the per-week cost | one VLM call + 9 HTTP | measured |
| the token cost of the BUILD ITSELF | not a consideration | the operator's ruling |

**The density law note:** "token cost is never a consideration; quality is the only metric."
This document is 800+ lines because the machinery is that large, not for the line count.

---

## §21 — THE INTERFACE CONTRACT (the types between layers)

The four layers exchange exactly four shapes. These are the frozen interfaces — a wave that
changes one breaks the wave below it.

### 21.1 `WeekAnchor` (e1_week → everyone)

```python
WeekAnchor = TypedDict("WeekAnchor", {
    "mon": int, "fri": int, "tsL": int, "tsR": int, "tsMid": int,
})   # all epoch ms; tsL < mon < fri < tsR
```

### 21.2 `HarvestResult` (e1_sources → e1_extract)

```python
HarvestResult = TypedDict("HarvestResult", {
    "data": list,       # the parsed rows; [] when down
    "label": str,       # a human label; "[NO DATA]" when down
    "reason": str,      # present ONLY when down
})
```

### 21.3 `Zone` (e1_extract → e1_category → the payload)

```python
Zone = TypedDict("Zone", {
    "name": str, "top": float, "bottom": float,
    "confluence": int, "pressure_degree": str,
    # the two fields THIS BUILD adds:
    "zCat": str,        # RES | MID | SUP
    "zTir": str,        # T1 | T2
    "derivation": str,  # a non-empty provenance label
})
```

### 21.4 `Payload` (the payload file → the build)

```python
Payload = TypedDict("Payload", {
    "pair": str, "week": dict, "anchor": WeekAnchor, "spot": float,
    "zones": list[Zone], "levels": list[dict], "pillars": dict,
})
```

**The compatibility rule:** a field may be ADDED (with a default) but never RENAMED or REMOVED
within a wave series. The signature is frozen per series; a change opens a new series.

---

## §22 — THE RISK REGISTER (what could go wrong, and the mitigation)

| # | the risk | the likelihood | the mitigation |
|---|---|---|---|
| R1 | the rig returns a stale cached payload | high (measured twice) | hard-reload before every census |
| R2 | the render returns `ok:true` empty while compiling | high | poll `.pine-status` to COMPLETED |
| R3 | the drawing store accumulates across runs | high | derive the count by difference |
| R4 | `str.split` / `tonumber` silently missing | medium | only the namespaced forms; grep the log |
| R5 | a zero-height zone culled | medium | assert a 2px line renders |
| R6 | the anchor off-by-one on Sunday | low | ST-18's adversarial case |
| R7 | the VLM fabricates on a bad image | medium | `parse_strikes` → `[]` |
| R8 | the served copy drifts from the built | medium | the build copies + shas |
| R9 | a wave edits a file another owns | medium | the disjoint file map |
| R10 | the payload week != the chart week | medium | the payload carries `week`; the build asserts |
| R11 | a hardcoded timestamp slips into the render | low | C6's grep |
| R12 | the LSZ block contaminates the port | low | the reference-only rule + C15 |
| R13 | the judge counts balloon | low | the `<=10` bound |
| R14 | a second writer touches v1 | very low | the seal (HARD STOP H1) |
| R15 | the four-pair path breaks DXY | low | W7 is sequenced last; DXY frozen first |

**The register's rule:** every risk carries a MITIGATION that is a command or a code path. A
risk without a mitigation is an alarm; it does not belong here.

---

## §23 — THE HONEST REMAINDER

**Provided (this blueprint):** the machinery to port (verbatim), the anchor to compute, the gap
to close (one mapping), the nine sources to wire, the one model call, the failure modes, the
replication recipes, the interfaces, the risks.

**NOT provided (named, not hidden):**
- the eight un-wired source harvesters (S3-S9) — scoped in W5, implementation TBD
- the four-pair generalisation (W7) — scoped, sequenced last
- the split test (W8) — specified in `08-SPLIT-TEST.md`, execution deferred
- the exact 4H-bar behaviour — the rig serves 1H; the 4H path is asserted to COMPILE, not run
- the VLM's per-week accuracy on real CME images — proven on a control TABLE (6/6), not on
  the live feed (which S3 must fetch)

**The blueprint's contract:** a builder reading this document + the spec can implement the DXY
E1 layer end-to-end. The remainder is explicitly scoped to later waves, each with its own spec.
