# CONTEXT BIBLE — PLUTUS VISION · E1 AUTOMATIC

**Companion to:** `MASTER_BLUEPRINT.md` (the machinery) · `plutus-vision-e1-automatic_DPL1_SPEC.md`
(the contract) · `00-INDEX.md` (the map). This bible is the SINGLE-ENTRY reference: read it and you
hold the build.

`2026-10-04` · class: SYSTEM · status: PACKAGE MINTED (spec APPROVED 0/8)

---

## §1 STATUS BANNER

```
WORKSTREAM        E1-AUTOMATIC (replace v8's manual data input with an automatic source)
BASELINE          plutus-vision-v1.pine   SEALED   sha 0d20e8314ce992fc…   1270 lines
TARGET            plutus-vision-v2.pine   the artifact that renders
THE PORT SOURCE   trident_v8.pine  668 lines   /tmp/tph2/.../reference_files/
SPEC              plutus-vision-e1-automatic_DPL1_SPEC.md   609L   APPROVED (0/8)
BLUEPRINT         MASTER_BLUEPRINT.md   1032L
FROZEN REFERENCE  reference/trident_v8_lsz.pine   sha db24a18cc8cdd234…
NEXT              finish WAVES/GOALS/INDEX → round-0 checkpoint → mint the pin → dispatch W1
```

---

## §2 THE MISSION (verbatim)

> "we need the five institutional pressure zones that are rendered for engine one from the nine
> web data sources … the exact indicator we have right now is the baseline and we just add the
> five institutional pressure zones on top … the original manual data input design is now replaced
> with an automatic data input … make it automatic so that the indicator just loads the
> institutional pressure zones for the target trading week … It should also auto-adjust so that if
> I use bar replay and I rewind … the engine one zones render for that week … base it on the most
> recent bar of the chart that is active … There is no next week. There is no previous week. It
> just renders from Monday to Friday of this trading week … separate the liquidity zones out so
> that you just take the working engine one institutional pressure zones"

**Decomposed to irreducibles:**
1. The RENDERER exists (v8) and works. → PORT it.
2. The DATA exists (e1_extract) and works. → BRIDGE it (one derived field).
3. The ANCHOR is wrong (hardcoded week). → DERIVE it from the chart.
4. The INPUT is manual. → AUTOMATE it (nine sources).
5. The LSZ must be SEPARATED. → exclude + preserve (the split test).

---

## §3 THE THREE MOVES (+ the fourth that is forbidden)

```
MOVE 1  PORT      the v8 render blocks → e1-render.pine, byte-for-byte
MOVE 2  ANCHOR    now()/hardcoded → time (the chart's last bar)
MOVE 3  INJECT    the live payload → the 6 dxy_* arrays + tsL/tsR/tsMid
──────────────────────────────────────────────────────────────────────────
MOVE X  REWRITE   FORBIDDEN — every defect F-01..F-20 came from rewriting what worked
```

**The anchor is a SIMPLIFICATION, not a feature.** `anchor = time` is correct live AND in replay.
A wall-clock anchor needs `now()` + replay detection + a second path. The smaller expression is
the more capable one. **There is no phase 2.**

---

## §4 ARCHITECTURE (four layers + the seal)

```
  LAYER 0  THE SEAL       plutus-vision-v1.pine   (read-only, sha-guarded)
  LAYER 1  THE DATA       e1_sources → e1_extract → e1_category   (Python)
  LAYER 2  THE PAYLOAD    data/e1/zones.json      (the v8 contract, 6 columns)
  LAYER 3  THE BUILD      lqz_vision_v2_build.py  (v1 + injected arrays + E2)
  LAYER 4  THE RENDER     e1-render.pine          (the v8 port, xloc=bar_time)
```

**The wiring law:** each layer consumes the ONE above; never reaches past its neighbour.
**The one-writer rule:** each file has exactly one writer (its own wave) — no merge chaos.

---

## §5 THE V8 PORT MAP (what to copy, verbatim, with file:line)

| what | the source | the instruction |
|---|---|---|
| the colour ladder (36 decls) | `trident_v8.pine:43-65` | COPY verbatim |
| `zfill(cat,deg)` | `:67-155` | COPY verbatim (the if/else tower) |
| `zbord(cat,deg)` | `:112-155` | COPY verbatim |
| `pressureLbl(deg)` | `:157-158` | COPY verbatim |
| `volLbl(vol)` | `:320-328` | COPY verbatim |
| `calcZFP(tp,bt,pair)` | `:334-338` | COPY verbatim |
| the IP zone block | `:352-365` | COPY verbatim (adapt the anchor) |
| the pair detection | `:168-175` | copy (W8 reuses) |
| the anchor | `:35-37` | **ADAPT** → computed from `time` |
| the data arrays | `:187-192` | **ADAPT** → injected |
| the LSZ block | `:367-377` | **DO NOT PORT** — reference/ only |

---

## §6 THE ANCHOR (the core mechanism)

```pine
int anchor = time                    // the chart's last bar (ms epoch)
int dow    = dayofweek(time)         // 1=Mon … 7=Sun
int mon    = anchor - (dow - 1) * 86400000
int fri    = mon + 4 * 86400000
int tsL    = mon - 14 * 86400000     // 2-week hindsight
int tsR    = fri + 21 * 86400000     // 3-week foresight
int tsMid  = (tsL + tsR) / 2
```

**Why 14/21:** the window must contain the prior sweeps (the zones derive FROM them) + forward
space. Both are WINDOW constants, never per-zone.
**The Python double-check:** the builder injects the same tsL/tsR/tsMid; a mismatch prints
`ANCHOR MISMATCH tsL=<in> <calc>` in the status line.

---

## §7 THE ONE GAP, CLOSED

| v8 emits | we emit | the bridge |
|---|---|---|
| `zCat ∈ {RES,MID,SUP}` | `zone_type ∈ {supply,demand}` | `classify(top,bottom,spot)` |

```python
if bottom > spot: "RES"    # entirely above
if top < spot:    "SUP"    # entirely below
goto MID otherwise          # straddles
else:             "MID"
```
**Positional, not provenance.** v8's colour is a function of WHERE the zone sits vs price. Our
`zone_type` is provenance. The RENDER needs the positional label.

---

## §8 THE FAILURE MODES (named + detected)

| # | the failure | the detection |
|---|---|---|
| F-17 | zones culled off-chart | `anchors dropped` > 0 |
| F-21 | the wrong week | `grep -c 'timenow' e1-render.pine` ≠ 0 |
| F-22 | all zones grey | `classify()` → 0 RES/SUP |
| F-23 | a fabricated strike | `[NO DATA]` absent while a source is down |
| F-24 | build passes on a moved v1 | `HARD STOP H1` absent |
| F-25 | a stale payload | the payload's `week` ≠ the chart's week |
| F-26 | served ≠ built | `SERVED_PINE_DRIFT` |
| F-27 | an empty payload → bare chart | the refusal label absent |
| F-28 | `str.split` silently dropped | the transpile log names the symbol |
| F-30 | Sunday off-by-one | ST-18's adversarial case |

---

## §9 THE VERIFICATION LADDER

```
L0  the build    python3 scripts/lqz_vision_v2_build.py         exit 0
L1  the suites   e1_tests.py · e1_render_tests.py · e2_*        RESULT pass=N fail=0
L2  the ST       ST-18/19/20/21/22                              exit code IS the verdict
L3  the rig      reload → run → poll → census                   the CT angles A1-A7
L4  the look     open the capture                               C16 (the human gate)
L5  the audit    the wave audit + qwen-code-audit               GATE: PASS
```

---

## §10 THE GATES (the blocking criteria)

| gate | the command | the block |
|---|---|---|
| G-SEAL | `sha256sum plutus-vision-v1.pine` | ≠ 0d20e831… → HARD STOP H1 |
| G-FLOOR | `grep -c 'pv_alerts\|smc_' plutus-vision-v2.pine` | ≠ 226 → refuse |
| G-E3 | `grep -icE 'entry\.\|strategy\.\|sl_'` | ≠ 0 → refuse |
| G-SPEC | `spec-audit specPath=…` | REJECTED → no dispatch |
| G-CT | the Phase-E 10 checks | any false → no declaration |
| G-AUDIT | `qwen-code-audit action=review` | FAIL → no ship |
| G-DOC | `wc -l` per class floor | under floor → refuse |

---

## §11 COMPACTION RECOVERY

**On wake, read in this order:**
1. `packages/plutus-vision-e1-automatic/00-INDEX.md` — the map
2. `context_management/CURRENT_STATE.md` — the 2026-10-04 superseding block
3. `packages/plutus-vision-e1-automatic/CONTEXT_BIBLE.md` — THIS file
4. the wave's `07-GOALS.md` entry

**Then assert the fingerprint:**
```bash
sha256sum plutus-vision-v1.pine    # 0d20e8314ce992fc…
sha256sum packages/plutus-vision-e1-automatic/reference/trident_v8_lsz.pine  # db24a18cc8cdd234…
wc -l plutus-vision-v2.pine        # 1694
```

**The live state lives in files, never in recollection.** The five frozen facts (§CURRENT_STATE):
v1 sealed; `xloc.bar_time` only; `time` not `now()`; LSZ in reference/ only; no E3.

---

## §12 THE DECISION CHAIN (the rulings that shaped this build)

| # | the decision | the alternative rejected | WHY |
|---|---|---|---|
| D-1 | PORT v8 verbatim; adapt only the anchor + data | rewrite the renderer | rewriting is how F-01..F-20 happened; the operator reads v8 daily |
| D-2 | `anchor = time` (the last bar) | `anchor = now()` + replay detection | one expression serves live + replay; NO branch, NO phase 2 |
| D-3 | classify POSITIONALLY vs spot | map from `zone_type` | v8's colour IS positional; provenance ≠ position |
| D-4 | the ZFP LABEL uses v8's `zoneW/refRange` | the engine's Pillar-9 score | the label is what the OPERATOR reads; Pillar-9 stays internal |
| D-5 | the LSZ block → `reference/` only | port both LSZ + our ladder | the operator asked to SEPARATE them (the split test) |
| D-6 | nine sources, `[NO DATA]` on death | fabricate / crash | the loud-fail law: never a fake level on a chart |
| D-7 | ONE model call (options image) | models everywhere | the pure-code law; everything else is arithmetic |
| D-8 | the judge = a tie-breaker (≤10/wk) | judge everything | a pipeline that judges all has moved the decision to the LLM |
| D-9 | DXY first, four pairs later (W8) | all four now | the zones are DXY-denominated; ship the proven path first |
| D-10 | auto-run on build + `make e1` | a timer | a timer is a later iteration; the build-time run is the floor |

---

## §13 THE EVIDENCE STATE (measured this session)

| the claim | the evidence |
|---|---|
| v1 is 1270 lines, 76550 B | `wc -l` + `stat` this session |
| v1's sha is `0d20e831…` | `sha256sum` this session |
| v2 is 1694 lines, 101690 B, sha `3c3f1a76…` | the same |
| e1-render.pine is 236 lines, 15286 B | the same |
| the payload has 6 zones, 74 levels | `jq '.zones|length'` → 6 |
| the seal REFUSES on drift | append→build→`HARD STOP H1` (a prior session; re-prove at W5) |
| the v8 machinery is `:43-65 / :67-155 / :352-365` | the reads this session |
| the frozen LSZ reference sha is `db24a18c…` | `sha256sum reference/trident_v8_lsz.pine` |
| spec APPROVED 0/8 | `spec-audit` this session |

**NOT yet evidenced (named):** the render on the rig (W9); the dead-arm behaviour live (W7);
the four-pair path (W8); the split test (W10).

---

## §14 THE OPEN DECISIONS (with recorded defaults)

| # | the fork | the default (proceed on this) |
|---|---|---|
| Q1 | 4H or 1H render | BOTH — `bar_time` is TF-agnostic; verify 1H (the rig's), assert 4H compiles |
| Q2 | which ZFP formula | v8's `zoneW/refRange` for the label |
| Q3 | auto-run trigger | on build + `make e1` |
| Q4 | four pairs now | DXY first; W8 |
| Q5 | the VLM's role | the options image only; `[NO DATA]` on death |

**No answer changes the architecture.** All five are recorded; the build proceeds.

---

## §15 THE SOURCE INVENTORY

```
S1 dxy_bars     fixtures/bars/*.json        live      the engine's OHLC
S2 eurusd_bars  fixtures/bars/*.json        live      the mapping pair
S3 options      CME page → VLM              wire      the strike pillar
S4 cot          CFTC CSV                    wire      institutional positioning
S5 daily        the print page              wire      prior-day H/L
S6 weekly_open  derived from S1             derivable the Monday reference
S7 policy       the calendar page           wire      event dates
S8 volume       the profile page            wire      node density
S9 basis        the futures page            wire      spot-futures spread
```
**The honesty law:** a down source → `[NO DATA]` + a `reason`; the build still exits 0.

---

## §16 THE INTERFACE CONTRACT (frozen)

```python
WeekAnchor    = {mon, fri, tsL, tsR, tsMid}          # epoch ms
HarvestResult = {data: list, label: str, reason?: str}
Zone          = {name, top, bottom, confluence, pressure_degree, zCat, zTir, derivation}
Payload       = {pair, week, anchor, spot, zones, levels, pillars}
```
**A field may be ADDED (with a default), never RENAMED/REMOVED within a wave series.**

---

## §17 THE ECONOMICS (measured)

```
the build      ~2s   ·  the extract ~4s (1614 bars)  ·  the render ~2s warm
the VLM call   ~163ms warm (CPU 4B)  ·  the judge ~163ms warm
per-week cost  one VLM call + 9 HTTP
token cost     NOT a consideration (the operator's ruling) — density is the only metric
```

---

## §18 THE WORKING RECIPES

```bash
# R1 — rebuild the E1 layer
sha256sum plutus-vision-v1.pine                                   # the seal
python3 scripts/e1_extract.py --week 2026-10-06
python3 scripts/e1_category.py --in data/e1/EURUSD-2026-10-06.json
python3 scripts/lqz_vision_v2_build.py                            # -> v2
cp plutus-vision-v2.pine pine-ide/ide/renderer/plutus-vision-v2.pine

# R2 — the CT angles (W9)
container-testing action=setup ...                                # the rig
# then A1 (replay) · A2 (classify) · A3 (dead arm) · A4 (floor) · A5 (seal)
#      · A6 (empty payload) · A7 (Sunday boundary)

# R3 — the split test (W10)
# arm A: reference/trident_v8_lsz.pine reconstructed on the rig
# arm B: v1's liquidity ladder + e1_extract's sweeps
# the instrument: a zone is CORRECT if price reversed ≥N pips within M bars of touch
```

---

## §19 THE FIVE FROZEN FACTS (never violated)

1. **v1 stays byte-identical** — `HARD STOP H1` on any drift.
2. **`xloc=xloc.bar_time` ONLY** — mixing `bar_index` is the F-17 cull.
3. **The anchor is `time`** (the chart's last bar) — NEVER `now()`/`timenow`.
4. **The LSZ block lives in `reference/` only** — never in the ported render.
5. **No E3 primitive exists** — no entry/SL/TP/position anywhere.

---

## §20 THE REMAINDER (honest)

- the eight un-wired sources (S3-S9) — scoped W6, implementation TBD
- the four-pair generalisation (W8) — scoped, sequenced last
- the split test (W10) — specified in `08-SPLIT-TEST.md`, execution deferred
- the 4H render path — asserted to compile, not run (the rig serves 1H)
- the VLM's live accuracy — proven on a control table (6/6), not the live feed

## ANCHOR INDEX (path:line)

- `plutus-vision-e1-automatic_DPL1_SPEC.md:1 (the contract)`
- `MASTER_BLUEPRINT.md:1 (the machinery)`
- `06-WAVES.md:3 (`WAVES: 10`)`
