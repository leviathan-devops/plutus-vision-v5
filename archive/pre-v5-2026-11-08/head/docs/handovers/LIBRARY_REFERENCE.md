# LIBRARY_REFERENCE — the WINNING_TRADE_LIBARARY, measured
### 39 frames · the refinement target for the PLUTUS VISION liquidity deliverables

```
Source (the machine that built this):  /home/leviathan/Pictures/WINNING_TRADE_LIBARARY   [LOCAL-ONLY]
Inside this pack:                      04_REFERENCE_LIBRARY/WINNING_TRADE_LIBARARY/       (39 PNGs)
The OCR of all 39 frames:              04_REFERENCE_LIBRARY/ALL_OCR.txt                    (7486 lines)
Measurements from the session:         reports/lqz_panel_judge.md  (03_SUPERSEDED_READ_ONLY/)
```

**This document is READ-ONLY reference.** It exists so the refinement stream (handover R-13) has a
MEASURED target instead of an impression. Every number below carries its method so you can re-run
it; where a prior number was wrong, the correction is recorded rather than quietly overwritten.

---

## 0 · THE HALLUCINATION — measured FALSE 2026-10-02 (read this first)

A prior turn claimed the library's tags read **"30m LQ Sellside Liquidity"** and **"Liquidity
Void"**. That claim reached the project's own canon (`context_management/TASK_QUEUE.md` §D:
*"the library's tags carry the timeframe too (`30m LQ Sellside Liquidity`)"*) and a feature was
built on it: `lqzLabel` was wired to emit one label per zone.

**It is FALSE.** The OCR of all 39 frames:

| token | occurrences across all 39 frames | frames containing it |
|---|---|---|
| `Sellside` | **0** | 0 |
| `Buyside` | **0** | 0 |
| `LQ` (as a tag token) | **0** | 0 |
| `Void` | **0** | 0 |

**Reproduce (this is the proof, run it yourself):**

```bash
cd 04_REFERENCE_LIBRARY
for w in Sellside Buyside 'LQ ' Void; do printf '%-10s %s\n' "$w" "$(grep -o "$w" ALL_OCR.txt | wc -l)"; done
# EXPECT:  Sellside 0 · Buyside 0 · LQ  0 · Void 0
```

**What happened to the feature:** the emitted 34 stacked side-name labels crowded the ladder; the
operator asked *"why are you adding buyside/sellside liquidity labels"*; the wiring was REVERTED,
the module restored, and D3 regenerated — the deterministic build reproduced the
OPERATOR-APPROVED artifact **bit-for-bit** (`82da437af969a315`), commit `53a29ac`, `SERVED_PINE_OK`.

**The lesson, verbatim from the revert commit:** *"I matched the feature's EXISTENCE and missed its
DENSITY."*

**THE DEAD PATH, for the record:** do not emit `Sellside Liquidity`, `Buyside Liquidity`, or
`Liquidity Void` labels. Do not re-derive them from `TASK_QUEUE.md` §D — that line IS the error.
If you need a label, use the REAL vocabulary below, and keep it SPARSE (~3-5 per chart).

---

## 1 · WHAT THE LIBRARY IS

The operator's own hand-charted winning trades: **39 PNGs** — **38 in 10 pattern families** plus
**1 root-level frame** that is a different KIND of reference (see §5).

```
BS --> R\RWL/          BS\WL --> SS/         LIQUIDITY LADDERS/
PBS --> R --> WL(S)/   R --> BS\WL/          R --> WL/
SS --> BS/             Swing Scalps/         WL --> RWL\R/
WL --> SS/             + Screenshot from 2026-07-19 17-55-53.png   (the root frame)
```

Measured (from `reports/lqz_panel_judge.md`, the 39-frame cross-reference):

| metric | value |
|---|---|
| frames measured | **39/39** |
| families covered | **11** (incl. the root frame) |
| frames with bands > 0 | 38/39 |
| frames IRREGULAR (spacing) | 38/39 |
| total bands found | **1203** |
| band count range | **6-61 per frame** (mean ~31) |
| per-family band counts | `BS→R\RWL` 22-61 · `SS→BS` 10-60 · `PBS→R→WL(S)` 54-60 · `WL→SS` 59 · `WL→RWL\R` 33 · `BS\WL→SS` 42-56 · `R→WL` 14-54 · `R→BS\WL` 12-22 · `Swing Scalps` 8-24 · `LIQUIDITY LADDERS` 6-27 |

---

## 2 · THE REAL VOCABULARY (measured over the 39 images)

**Method** (re-run it; never inherit a count):

```bash
# raw occurrences
grep -o '<token>' ALL_OCR.txt | wc -l
# frames containing the token
python3 - <<'PY'
import re
txt=open('ALL_OCR.txt',encoding='utf-8',errors='replace').read()
imgs=re.split(r'===== ',txt)[1:]
for t in ['Unmitigated','Mitigated','MoM','BoM','Shield','ZoC','CONQUERED','PIERC']:
    print(f"{t:14} occ={len(re.findall(t,txt)):3} frames={sum(1 for im in imgs if t in im):2}/39")
PY
```

**Measured (this handover's re-run):**

| token | raw occurrences | frames (of 39) | notes |
|---|---|---|---|
| `Unmitigated` | 5 | 3 | always inside a `TF (Unmitigated) \| X` tag |
| `Mitigated` (standalone) | 1 | 1 | the family `Unmitigated\|Mitigated` appears in **4** frames / 6 occurrences |
| `MoM` | 15 exact / **17** case-insensitive | 12 | OCR renders it `moll` / `Moat` in places — count case-insensitively |
| `BoM` | 3 | 3 | |
| `Shield` | 10 | 8 | `Liquidity Shield` 5× |
| `ZoC` | 2 | 2 | |
| `CONQUERED` | 1 | 1 | |
| `PIERC*` | `PIERC` 10 + `PIERCING` 9 = **19** raw | 9 | `PIERCING BREAKOUT SURGE` (4×), `PIERCING WHIPLASH`, `PIERCLO`, `RECOVERY PIERCING` |

> **On the prior count** (mission brief: "Unmitigated 5, Mitigated 7, MoM 17, BoM 3, Shield 10,
> ZoC 2, CONQUERED 1, PIERC* 12"): re-measurement agrees on 5 / 17 / 3 / 10 / 2 / 1 and differs
> on `Mitigated` (1 standalone vs 7 — likely the `Unmitigated|Mitigated` family under a looser
> rule) and `PIERC*` (19 raw vs 12 — likely frames or a narrower pattern). **Where a count
> matters, re-run the command; never inherit one.** The `Sellside/Buyside/LQ/Void = 0` result is
> robust under every rule tried (case-insensitive included) and is the load-bearing correction.

### 2.1 The REAL tag formats (verbatim from the OCR — match these SHAPES)

```
30m (Unmitigated) | MoM
30m (Unmitigated) | BoM
30m (Unmitigated) | Bull
15m (Unmitigated) | MoM
4H Liquidity Shield ~ ZoC - BEAR CONQUERED
4H Liquidity Shield — 2xC — BEAR CONQUERED
4H Liquidity Shield - ZoC ~ Key Price Zone
SH Liquidity Shield ~ PIERCLO:
30m MoM Liquidity Shield
Liquidity Shield Zone
PIERCING BREAKOUT SURGE
PIERCING WHIPLASH
RECOVERY PIERCING
4H BoM Zone pierced = ALL 4H liquidity near the fallen zone will be swept.
```

**The grammar the tags obey:**

```
<TF> (<Unmitigated|Mitigated>) | <MoM|BoM|Bull>          e.g. "30m (Unmitigated) | MoM"
<TF> <MoM|BoM> Liquidity Shield                          e.g. "30m MoM Liquidity Shield"
<TF> Liquidity Shield ~ <ZoC|PIERCLO|…> [- BEAR CONQUERED]
<TF> BoM Zone pierced = <the consequence sentence>
PIERCING <SURGE|WHIPLASH>   /   RECOVERY PIERCING
```

**Note the TF prefixes are SHORT and the vocabulary is 8 tokens — nothing like the claimed
`Sellside/Buyside Liquidity`.**

---

## 3 · THE VISUAL MEASUREMENTS (what "looks like the library" means, numerically)

### 3.1 Band height — THE headline gap

| set | n | mean | max | distribution |
|---|---|---|---|---|
| the LIBRARY (5 frames, `LIQUIDITY LADDERS`) | 69 | **15.9 px** | **156 px** | BIMODAL: many 1-3 px thin lines PLUS large zones at 16, 17, 17, 44, 70, 150, 156, 32, 42, 46, 107, 122 px |
| the GRIDS (4 TFs) | 96 | **1.5 px** | 18 px | almost entirely 1-4 px; one 18 px on 15m |

**RATIO: 8.7× on the maxima.**

**What it means (sharper than "make bands bigger"):** the library renders TWO kinds of object —
**(1) thin 1-2 px lines** (one per detected level: the ladder) and **(2) large translucent
rectangles (16-156 px tall)** (a zone spanning a price range). **The deliverables render (1) and
almost never (2).** The gap is not a thickness setting; the deliverables are effectively missing a
whole LAYER of the library's picture.

**The lever (three inputs in `plutus-vision-lqz/lqz-render.pine` — the fill code EXISTS, gated):**

```pine
if lqzFill3 and _cf >= 3 and _span > lqzLineTol
    box.new(_lx, _hi, bar_index + lqzRightB, _lo,
         border_color = na, bgcolor = color.new(_col, lqzFillA))
```

| input | shipped | what it does | the experiment |
|---|---|---|---|
| `lqzFill3` | `true` | gates the fill to bands with **3+ agreeing sources** | lower the source threshold so 2-source zones fill too |
| `lqzFillA` | `10` | the fill alpha — **very faint** | raise toward the library's visible translucency |
| `lqzLineTol` | `0.0` | the span a zone needs before it gets rails instead of one line | raise so tiny zones collapse to a line and real zones keep their height |

**A zone's rendered height is already its price span** (`_hi` to `_lo`), so the geometry exists.
**This is the operator's look decision, not a correctness one.**

### 3.2 Ladder geometry (measured)

| metric | the library | the deliverables |
|---|---|---|
| row coverage (full-width) | **99-100 %** | 99-100 % |
| spacing | IRREGULAR (n=40 gaps, 23 distinct, min 2.5 px, max 48.5 px) | IRREGULAR |
| palette | GREEN/teal 33 bands `#3E8A46` · RED 7 bands `#7F3613` | `#3E8A46` / `#7F3613` family — MATCH |
| thickness | 1 px | 1 px — MATCH |
| geography | RED upper (y 32-140) = BUY_SIDE · GREEN lower (y 98-378) = SELL_SIDE | matches the spec's semantics |

### 3.3 The refinement findings (D3 vs the library at the library's OWN timeframe)

- **D3 @15m = 10 bands vs the library's 4-22 (mean 11)** → **density MATCHES.**
- **Spacing irregular** → MATCHES.
- **Colours / thickness** → MATCH.
- **Side mix: 44 % green vs the library's 57-92 %** → **REGIME-DRIVEN**, not a defect: the
  fixture is a downtrend, and the spec's semantics are `green = SELL_SIDE = below price` (below-price
  liquidity gets consumed in a downtrend).
- **The tolerance sweep (tol 0.5 → 1.5) is MARGINAL** — it merges bands; the mix is structural.
- **The line COUNT was never the gap** — the deliverables' 30-80 lines per TF sit INSIDE the
  library's 6-61 per frame. **The gap is the HEIGHT** (the missing zone layer).

---

## 4 · HOW TO USE THIS LIBRARY (the method, not just the numbers)

1. **Open the frames.** They are in `04_REFERENCE_LIBRARY/WINNING_TRADE_LIBARARY/<family>/*.png`.
   A number derived without opening the frame is a claim about your instrument, not the library.
2. **Re-derive any count before quoting it** (§2's method block).
3. **Match the SHAPE, not the pixels.** The target is: thin full-width lines + large translucent
   zone bands + sparse structure labels + readable candles.
4. **Never treat the root frame as a ladder frame** (§5).
5. **The operator owns the look.** You produce the measurement; they decide the variant.

---

## 5 · THE ONE FRAME THAT READS ZERO — and it is the most important frame

`WINNING_TRADE_LIBARARY/Screenshot from 2026-07-19 17-55-53.png` — the ONLY root-level PNG, in no
pattern family. The band instrument reported `bands 0 · irregular False`. **Rather than accepting
or dismissing the zero, the session OPENED it.**

**What it actually is: EUR/USD 1h — the fixture's EXACT pair and timeframe — showing the operator's
own ANNOTATION VOCABULARY and nothing else:**

- white outlined **boxes around specific swings** (LOCAL zones, NOT full-width bands)
- labels: **`WL`** · **`RWL`** · **`BREAKOUT SURGE`**
- **no full-width line ladder at all**

**Consequences (all three matter):**

1. **The zero was validated by a look, not assumed.** A blank reading on a library frame is exactly
   the case where an unexamined instrument reports a fact about itself.
2. **This frame must NOT be counted as a deliverable failure.** It is a different KIND of
   reference; the deliverables are not expected to reproduce it.
3. **It raises a REAL question for the operator:** should the deliverables also carry LOCAL BOXES
   around swings (`WL` / `RWL` / `BREAKOUT SURGE`)? That is a SECOND FEATURE, not a tuning change,
   and it is not in the current emitter.

---

## 6 · THE OCR (how it was produced, so you can redo it)

`ALL_OCR.txt` (7486 lines) is `tesseract` over all 39 frames:

```bash
# per image:
python3 -c "from PIL import Image; im=Image.open(SRC); im.resize((im.width*2, im.height*2)).save('/tmp/_ocr.png')"
tesseract /tmp/_ocr.png - --psm 11 >> ALL_OCR.txt
```

Each image's section starts with a `===== <relative path> =====` banner, which is what makes the
per-frame counts (§2) possible. **OCR is noisy** — expect `moll`/`Moat` for `MoM`, `Unmnitgated`
for `Unmitigated`, `Uquidity` for `Liquidity`. **Count case-insensitively and corroborate a
token's ABSENCE with more than one spelling** before declaring it dead (the four zeros above were
checked with and without case sensitivity).

---

## 7 · THE FIVE LAWS OF USING THIS LIBRARY

1. **Measure, never inherit.** Every number here has its method; re-run it.
2. **Absence needs more evidence than presence.** A claimed tag that reads 0 under every rule is
   DEAD — and a feature built on it must be reverted, not "fixed".
3. **Open the frame.** The instrument can be right (the root frame's zero) and still tell you
   nothing until you look.
4. **Match the composition, not one metric.** Lines + bands + sparse labels + readable candles.
5. **The operator owns the look.** The lever is named; the value is theirs.

*End of LIBRARY_REFERENCE.*
