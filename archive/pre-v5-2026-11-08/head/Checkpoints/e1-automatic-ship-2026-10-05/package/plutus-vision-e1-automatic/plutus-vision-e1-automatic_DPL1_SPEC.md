# BUILD SPEC ARTIFACT — PLUTUS VISION E1 AUTOMATIC

| field | value |
|---|---|
| **Target** | `/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION` |
| **Generated** | 2026-10-04 |
| **Trident Version** | v5.3.3 canon (the E1/E2 reference prompt) |
| **Status** | `PLANNING` |
| **Artifact Type** | `BUILD_SPEC (Layer 1 Prompt)` |
| **Class** | **Class: SYSTEM** — multi-front, multi-day (the declared type the gates read) |
| **Discovery** | ENABLED — 9 source reads, 1 zip (13 files), the live rig measured |
| **Predecessor** | `packages/PLUTUS_VISION_V2/GOAL_PIN.md` (the v2 build, shipped) |

---

## DISCOVERED INTELLIGENCE BLOCK

```
Languages      Pine Script v6 (the indicator) · Python 3 (the pipeline) · Node/Bun (the IDE)
Entry points   scripts/lqz_vision_v2_build.py   the composition
               scripts/e1_extract.py            the data source
               scripts/e1_fetch.py              the 9-source harvest
               scripts/e2_engine.py             the shape chain
               scripts/wire_e2.py               the E2 payload
Indicators     plutus-vision-v1.pine    SEALED (sha 0d20e8314ce992fc)
               plutus-vision-v2.pine    v1 + E1 + E2
Patterns       the port pattern (copy proven code, adapt the anchor)
               the injection pattern (typed arrays, build-time)
Failures       F-01..F-20 in DEBUG_LOG.md (20 documented defects)
Decisions      DECISION_CHAIN + the operator's verbatim rulings
Warheads       APPEND_SYSTEM.md — the operative laws (44 warheads)
Audit layers   the boot gate · the write gate · the doc-density gate · the H1 seal guard
```

---

## §1 PROBLEM STATEMENT (verbatim requirements)

> "we need the five institutional pressure zones that are rendered for engine one from the nine
> web data sources"

> "the exact indicator we have right now is the baseline and we just add the five institutional
> pressure zones on top, but you need to improve like you copy paste exactly what's working in
> that regard from the original time"

> "the original manual data input design is now replaced with an automatic data input"

> "make it automatic so that the indicator just loads the institutional pressure zones for the
> target trading week"

> "It should also auto-adjust so that if I use bar replay and I rewind… the engine one zones
> render for that week… base it on the most recent bar of the chart that is active"

> "There is no next week. There is no previous week. It just renders from Monday to Friday of
> this trading week"

> "separate the liquidity zones out so that you just take the working engine one institutional
> pressure zones"

**THE PROBLEM, STATED FROM FIRST PRINCIPLES.** We have a **proven renderer** with **no live
data** (`trident_v8.pine`, hand-fed by hardcoded arrays) and a **live data source** with **no
matching renderer** (`e1_extract.py` produces scored zones in our schema). Neither alone is the
product. The product is their **composition** — plus the removal of the manual step between them,
plus a temporal anchor that follows the chart instead of the clock.

The three facts that make this tractable:
1. The renderer is written and works (`trident_v8.pine:352-365`) — porting, not inventing.
2. The data pipeline works (`e1_extract.py` → 6 zones from 1614 real bars, pivots verified to 1e-9)
   — the schema bridge is ONE derived field (`zCat`).
3. The anchor change is a **simplification**: `anchor = time(last bar)` replaces
   `anchor = now()` **and** handles bar replay with no extra code.

---

## §2 ARCHITECTURE

```
                    THE CHART (Pine, the last bar)
                              │  time(last bar)
                              ▼
        ┌─────────────────────────────────────────────────┐
        │ WEEK RESOLUTION   e1_week.py                    │
        │   monday = bar_time - weekday(bar_time)          │
        │   friday = monday + 4d                           │
        │   tsL = monday - 14d   tsR = friday + 21d        │
        └───────────────────┬─────────────────────────────┘
                            ▼
        ┌─────────────────────────────────────────────────┐
        │ HARVEST + SCORE   e1_extract.py (exists)         │
        │   OHLC → levels → confluence → zfp → degree      │
        │   + e1_category.py   RES|MID|SUP · T1|T2         │
        └───────────────────┬─────────────────────────────┘
                            ▼
        ┌─────────────────────────────────────────────────┐
        │ PAYLOAD           data/e1/zones.json             │
        │   6 columns, the v8 contract exactly             │
        └───────────────────┬─────────────────────────────┘
                            ▼
        ┌─────────────────────────────────────────────────┐
        │ THE BUILD   lqz_vision_v2_build.py               │
        │   verify_v1_untouched()  ← HARD STOP H1          │
        │   v1 verbatim + injected arrays + E1 + E2        │
        └───────────────────┬─────────────────────────────┘
                            ▼
        ┌─────────────────────────────────────────────────┐
        │ THE RENDER   e1-render.pine (the v8 port)        │
        │   box.new(tsL, tp, tsR, bt, xloc=bar_time)       │
        │   zfill(cat,deg) · zbord(cat,deg) · the label    │
        └─────────────────────────────────────────────────┘
```

**The four layers on the chart, bottom to top:**

| layer | source | colour | state |
|---|---|---|---|
| 0 · SMC structure + order blocks | v1 (sealed) | LuxAlgo defaults | exists |
| 0 · liquidity ladder | v1 (sealed) | green | exists |
| 1 · **E1 IP zones** | `e1-extract` → injected | RED/ORANGE/TEAL ×6 tiers | **THIS BUILD** |
| 2 · E2 shape path | `e2_engine` → injected | cyan polyline | exists |

---

## §3 DISCOVERY INTELLIGENCE (measured)

```
PLUTUS_VISION tree
  plutus-vision-v1.pine        1270 lines   76550 B   sha 0d20e8314ce992fc23e27f1b97fed…
  plutus-vision-v2.pine        1694 lines  101690 B
  plutus-vision-lqz/e1-render.pine  236 lines   REPLACED BY THIS BUILD
  scripts/e1_extract.py                     24081 B   6 zones from 1614 bars
  scripts/e2_engine.py                      16025 B   chain BS→RWL

Fixtures (the OHLC source)
  fixtures/bars/2026-07-06.json   DXY 1614 × 1H · EURUSD 1614 × 1H · broker-validated against
                                  the documented prints in the golden cascade
Reference (the renderer to port)
  /home/leviathan/Documents/WEB_AGENT_WARHEADS/Trident_Pine_Handover.zip   83114 B, 13 files
  trident_v8.pine            668 lines  CURRENT  the visual system
  trident_phase1.py         2219 lines  the generator (its SCHEMA, not its parser, is reused)

Rig
  :9741 station · :9754 rail · :9851 renderer · :9222 CDP · :3 weston 1638x996
  GET :9851/api/v1/chart/bars?pair=DXY&timeframe=1H  ->  1614 bars
```

---

## §4 CORE INSIGHT (the first-principles thesis)

> **The implementation must produce a chart overlay that a human reads correctly on the first
> look, on any week they rewind to — not a build that compiles and injects arrays.**

**THE GOVERNING INSIGHT.** The anchor must be **the chart's own last bar**, never wall-clock
`now`. This is the whole design in one line:

```
wall-clock:     anchor = now()            → needs a branch for replay
chart-anchored: anchor = time(last bar)   → replay works by construction
```

**Why this is a simplification, not a feature.** In TradingView's bar replay, the "last bar" *is*
the rewind point. A wall-clock anchor needs `now()` **plus** replay detection **plus** a second
code path. A chart anchor needs neither — the same expression is correct live and rewound. The
more capable version is the smaller one. **There is therefore no phase 2:** bar-replay support is
not an increment, it is a consequence.

**THE SECOND INSIGHT — port, don't rebuild.** `trident_v8.pine` is a 4-month-old indicator whose
visual system the operator has read daily. Rewriting it is how the 20 defects in F-01..F-20
happened. The render loop (`:352-365`), the colour ladder (`:44-65`) and the helpers (`:67-158`)
are copied **verbatim**; only the anchor (`:35-37`) and the data source (`:187-192`) are adapted.

**THE THIRD INSIGHT — the gap is one derived field.** v8 colours by `zCat` (`RES`/`MID`/`SUP`);
we emit `zone_type` (`supply`/`demand`). The mapping is positional against spot — three lines,
no new fetch:
```
bottom > spot → RES    top < spot → SUP    else → MID   (a straddler is MID)
```

**THE NON-NEGOTIABLES THE BUILD MUST HOLD** (error-surfaced, never silent):
- every path that can fail NAMES its failure (`[NO DATA]` + the reason, never a zero);
- boundaries are validated before use (spot falsy ⇒ refuse; ms bounds ⇒ assert in range);
- resources are released (the isolated headless Chrome is killed on every path);
- side effects land before claims (the artifact is written, then the claim is made).

---

## §5 SCOPE (≤20 items, real)

| # | item | the deliverable | the file |
|---|---|---|---|
| 1 | week resolution | `resolve(bar_time) → {mon,fri,tsL,tsR,tsMid}` as epoch ms — the anchor the **institutional** pressure map renders against | `scripts/e1_week.py` NEW |
| 2 | category derivation | `classify(top, bottom, spot) → RES\|MID\|SUP` | `scripts/e1_category.py` NEW |
| 3 | tier derivation | `tier(confluence) → T1\|T2` | `scripts/e1_category.py` NEW |
| 4 | ZFP label formula | v8's `calcZFP(zoneW/refRange)` for the LABEL | `scripts/e1_category.py` NEW |
| 5 | the colour ladder | R/G/T `_F1..6`+`_B1..6` verbatim | `plutus-vision-lqz/e1-ip-colors.pine` NEW |
| 6 | the helpers | `zfill` `zbord` `pressureLbl` `volLbl` verbatim | `plutus-vision-lqz/e1-ip-colors.pine` NEW |
| 7 | **the IP render** | the v8 block verbatim, `xloc=bar_time`, computed bounds | `plutus-vision-lqz/e1-render.pine` REPLACED |
| 8 | payload emission | the 6-column `zones.json` in the v8 contract | `scripts/e1_extract.py` EDIT |
| 9 | build injection | the E1 arrays into the artifact | `scripts/lqz_vision_v2_build.py` EDIT |
| 10 | the anchor injection | `e1_injected_tsL/tsR/tsMid` computed in Python | `scripts/lqz_vision_v2_build.py` EDIT |
| 11 | the 9-source harvest | the automatic ingest, per source `[NO DATA]` | `scripts/e1_sources.py` NEW |
| 12 | **the ONE model call** | the options-table image → strikes | `scripts/e1_vlm_options.py` NEW |
| 13 | the judge hook | the ambiguous item classes via Jev | `scripts/e1_judge.py` NEW |
| 14 | the make target | `make e1` = harvest → extract → wire → build | `Makefile` EDIT |
| 15 | the auto-run | the pipeline fires at build time | `scripts/lqz_vision_v2_build.py` EDIT |
| 16 | the LSZ split preservation | `trident_v8.pine:367-377` kept byte-intact as the reference arm | `packages/.../reference/` |
| 17 | the split-test spec | the method for the later accuracy comparison | `packages/.../08-SPLIT-TEST.md` |
| 18 | docs | canon + ship docs updated per their skills | `context_management/`, root |
| 19 | checkpoint | a sealed round-zero before dispatch | `Checkpoints/` |
| 20 | the four-pair isolation | `syminfo.ticker` detection (named for a later wave) | `plutus-vision-lqz/e1-render.pine` |

**Items 11-13 are the "automatic" half.** Items 1-10 are the port + anchor. Items 16-17 preserve
the deferred split test. Item 20 is scoped but sequenced last.

---

## §6 SUCCESS CRITERIA (mechanical — every one command/ledger/eyes-verifiable)

| # | criterion | the command | the pass condition |
|---|---|---|---|
| C1 | **v1 is byte-identical** | `sha256sum plutus-vision-v1.pine` | `0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1` |
| C2 | **the floor holds in v2** | `grep -c 'pv_alerts\|smc_' plutus-vision-v2.pine` | `226` · OB `6` · LQZ `4` |
| C3 | **no E3 primitive** | `grep -icE 'entry\.\|strategy\.\|sl_\|take\.profit'` | `0` |
| C4 | **the build refuses on v1 drift** | append a line to v1, run the builder | exit non-zero, `HARD STOP H1` |
| C5 | **the renderer is v8's — VERBATIM** | `grep -c 'zfill\|zbord\|pressureLbl\|calcZFP' e1-render.pine` | ≥ 4 named helpers present, copied **verbatim** from `trident_v8.pine:44-158,334-338` |
| C6 | **the anchor is computed** | `grep -c 'timestamp(2026' plutus-vision-v2.pine` | `0` |
| C7 | **the anchor is chart-based** | `grep -n 'time\[1\]\|time - ' e1-render.pine` | the last-bar read present |
| C8 | **the INSTITUTIONAL category is derived** | `python3 -c "…classify…"` on the 6 zones | ≥1 RES, ≥1 SUP, 0 unclassified |
| C9 | **the zones render** | the rig, one run, fresh page | `boxes` == v1's 32 + the zone count |
| C10 | **the zones land on-chart** | `anchors dropped` in `.pine-status` | `0` |
| C11 | **bar replay is correct** | rewind the rig to a prior week, run | the zones recompute; `tsL/tsR` differ |
| C12 | **a dead source is honest** | stop the VLM, run `make e1` | exit 0; the options pillar reads `[NO DATA]` |
| C13 | **no fabricated level** | the JSON, every level | carries a derivation label |
| C14 | **the suite is green** | `python3 scripts/e1_tests.py` etc. | `RESULT pass=N fail=0` on all four |
| C15 | **the LSZ block is preserved** | `sha256sum` of the reference extract | unchanged vs the zip |
| C16 | **the look** | the operator views the capture | "this is right" |

**Every criterion is a command or a ledger row.** C16 is the only human one and it is last.

---

## §7 CONTAINER TEST PLAN (plan-first — ≥5 adversarial angles)

**OBJECTIVE.** Prove the E1 layer renders v8's visual system, anchored to the chart's own week,
on the currently served artifact — and that it fails loudly, never silently.

**TOOLS UNDER TEST.** the build (`lqz_vision_v2_build.py`) · the render (`e1-render.pine`) · the
extractor (`e1_extract.py`) · the artifact (`plutus-vision-v2.pine`) · the rig (`:9851`/`:9222`).

**THE BLAST RADIUS.** every importer of `e1-render.pine` (the builder) · the served copy path ·
`data/e1/*.json` (the payload) · the four existing test suites.

### THE ANGLES (each with a TOOL-RESULT-BOUND pass token + a fail token)

| # | angle | the probe | PASS token (in a tool result) | FAIL token |
|---|---|---|---|---|
| A1 | **ANCHOR** | rewind the rig to 5 weeks prior, run | the emitted `tsL`/`tsR` differ from the live run | identical bounds |
| A2 | **CATEGORY** | `classify(102.0, 101.5, 101.048)` | `RES` · and `classify(100.5,100.0,101.048)` → `SUP` | both the same class |
| A3 | **THE FLESH: a dead source** | stop `trident-v1-vision`, run `make e1` | `[NO DATA]` in the JSON + exit 0 | a fabricated strike, or a crash, or no file |
| A4 | **THE FLOOR** | run the builder | `SMC 226 · OB 6 · LQZ 4` in the output | any count lower |
| A5 | **THE SEAL** | tamper v1, run the builder | `HARD STOP H1` + exit≠0 | a successful build |
| A6 | **THE EMPTY PAYLOAD** | build with `data/e1/` absent | the chart shows the refusal label | a bare chart with no notice |
| A7 | **BOUNDARY** | `resolve(bar_time)` at a Sunday timestamp | the Monday of THAT week, day 0 | an off-by-one weekday |

**EVIDENCE.** the rig (`:9851` renderer + `:9222` CDP) · the dist sha of the served copy · the
capture path returned by `P.capture()` · the `.pine-status` text · the JSON on disk.

**PASS THRESHOLD.** all 7 angles return their pass token; the four suites remain green; the
capture is opened and looked at. **Zero broken windows** — no regression in v1's counts.

**THE AUTH PROBE (mandatory FIRST).** `trident-v1-vision` must answer (`:8010/health` → 200 and
`capabilities: ["completion","multimodal"]`) before any A3-class angle, because a dead arm makes
A3 vacuous.

---

## §8 THE ANTI-PATTERN LEDGER (3 categories, each with a mechanical detection)

### CATEGORY 1 — ARCHITECTURAL (banned structures)

| the banned thing | the incident class | the MECHANICAL detection |
|---|---|---|
| a hardcoded `timestamp(Y,M,D)` in the render | v8's `:35-37` — right for one week only | `grep -c 'timestamp([0-9]\{4\}' e1-render.pine` must be 0 |
| the anchor read from `now()`/wall-clock | replay renders the wrong week | `grep -c 'timenow\|now()' e1-render.pine` must be 0 |
| a second coordinate space (bar_index) mixed with `bar_time` | the F-17 cull class | every `box.new` carries `xloc.bar_time` |
| the LSZ block present in the ported render | the split-test arm contaminated | `grep -c 'LSZ_' e1-render.pine` must be 0 |
| an E3 primitive anywhere | the scope violation | `grep -icE 'entry\.\|strategy\.\|sl_' v2.pine` must be 0 |

### CATEGORY 2 — BEHAVIORAL (banned runtime behaviour)

| the banned thing | the incident class | the MECHANICAL detection |
|---|---|---|
| a fabricated strike/level when a source is down | the fake-zone-on-a-chart class | every JSON level carries a `label`; 0 unlabelled |
| a silent fallback producing a DIFFERENT artifact marked ready | the false-success class | the refusal string is non-empty whenever zones are empty |
| a fabricated witness for a rule with no basis | the warhead's own `INVENTED_BASIS` class | the judge returns a `basis` or `INSUFFICIENT_BASIS` |
| the model called anywhere but the options image | the pure-code violation | `grep -c 'chat/completions'` in every script but `e1_vlm_options.py` must be 0 |
| an empty catch / `except: pass` | the swallowed-failure class | the gate's own grep, run over `scripts/` |
| zones culled off-chart silently | the F-17 class | `anchors dropped: 0` in `.pine-status` |

### CATEGORY 3 — PROCESS (banned actions)

| the banned thing | the incident class | the MECHANICAL detection |
|---|---|---|
| editing `plutus-vision-v1.pine` | the seal violation | the sha check at build; `git diff --stat v1.pine` empty |
| a wave dispatched with its gate unmet | the preflight violation | the gate's command run before dispatch, exit 0 recorded |
| editing a file another wave owns | the merge-chaos class | the per-wave disjoint file map, checked at dispatch |
| navigating a browser the process did not launch | the 2026-10-03 display hijack | `grep -c '9222' scripts/e1_sources.py` must be 0 |
| a `.md` under its class floor | the napkin class | `wc -l` per doc against the class floor |
| a completion claim with no artifact | the phantom-completion class | every wave's audit cites the file + the sha |

---

## §9 OPEN DECISIONS

| # | the fork | the evidence | the default |
|---|---|---|---|
| D1 | **4H or 1H render** | v8 says 4H; the rig serves 1H DXY | **both** — `bar_time` is timeframe-agnostic; verify at 1H (the rig's own) and assert the 4H path compiles |
| D2 | **which ZFP formula in the label** | v8's `zoneW/refRange` vs our Pillar-9 base+modifiers | **v8's for the label** (it is what the operator reads); Pillar-9 stays the engine's internal score |
| D3 | **auto-run trigger** | on build / on timer / on demand | **on build + `make e1`**; a timer is a later iteration |
| D4 | **four pairs now or DXY first** | PART X specifies four; the zones are DXY-denominated | **DXY first**; the four-pair isolation is wave W7 |
| D5 | **the VLM's role** | it is a 3 GB CPU model; proven 6/6 on a control table | **use it for the options image only**; on death the pillar is `[NO DATA]` |
| D6 | **the Jev role** | it answers a typed question in 163 ms | **the ambiguous item classes only** (is this a support level?); never the numeric extraction |

---

## THE SPEC ILLUSTRATED

*(4+ graphs; every box names its section; a builder reading only these understands the build)*

```
┌───────────────────────────────────────────────────────────────┐
│──────────── THE MASTER VIEW — every § to its owner ───────────│
│   the CHART last bar (§4)  ── time(last bar) ──►              │
│   e1_week.py (§5.1)        ── mon/fri/tsL/tsR ──►             │
│   e1_extract.py (§5.8)     ── levels → zones ──►              │
│   e1_category.py (§5.2-4)  ── RES|MID|SUP · T1 ──►            │
│   zones.json (§5.8)        ── the 6-column contract ──►       │
│   lqz_vision_v2_build.py (§5.9-10)                            │
│      ├─ verify_v1_untouched  HARD STOP H1 (N1)                │
│      ├─ inject tsL/tsR/tsMid + zTp/zBt/zCat/zDeg/zTir/zNm     │
│      └─ v1 verbatim + E1 + E2 ──► plutus-vision-v2.pine       │
│   e1-render.pine (§5.7)    ── box.new(tsL,tp,tsR,bt,bar_time) │
│   the CHART (§6 C9-C11)    ── THIS week, replay-correct       │
└───────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│──────── THE CORE MECHANISM — the anchor (§4) ───────│
│ IN:   bar_time   (the chart's OWN last bar)         │
│                                                     │
│   mon = bar_time - weekday(bar_time) days   @00:00  │
│   fri = mon + 4 days                         @23:59 │
│   tsL = mon - 14 days     (2wk hindsight)           │
│   tsR = fri + 21 days     (3wk foresight)           │
│                                                     │
│ OUT:  {mon, fri, tsL, tsR, tsMid}                   │
│                                                     │
│ WHY IT IS SIMPLER, NOT HARDER:                      │
│   live    last bar = now      → correct             │
│   replay  last bar = rewind   → correct             │
│   ONE expression · ZERO branches · no phase 2       │
└─────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│────────── THE OVERLAYS — always-on mechanisms ───────────│
│   N1 the seal      sha 0d20e831… refuses any v1 write    │
│   N2 the floor     SMC 226 · OB 6 · LQZ 4 on every build │
│   N3 E3 off        no entry/SL/TP exists anywhere        │
│   N4 pure code     the model reads ONE image             │
│   N5 no fallback   [NO DATA] + the reason                │
│   N7 chart anchor  time(last bar), never now()           │
└──────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│───────── THE MANIFEST — new · edited · preserved ──────────│
│ NEW   scripts/e1_week.py        §5.1                       │
│ NEW   scripts/e1_category.py    §5.2-4                     │
│ NEW   scripts/e1_sources.py     §5.11                      │
│ NEW   scripts/e1_vlm_options.py §5.12                      │
│ NEW   scripts/e1_judge.py       §5.13                      │
│ NEW   e1-ip-colors.pine         §5.5-6                     │
│ REPL  e1-render.pine            §5.7                       │
│ EDIT  e1_extract.py             §5.8                       │
│ EDIT  lqz_vision_v2_build.py    §5.9-10,15                 │
│ EDIT  Makefile                  §5.14                      │
│ KEEP  plutus-vision-v1.pine     the seal (N1)              │
│ KEEP  trident_v8.pine:367-377   the split-test arm (§5.16) │
└────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│───── THE ERROR VOCABULARY — the rejection surface ────│
│ HARD STOP H1      v1 moved — the build refuses        │
│ E2_NO_ZONES       the payload carries no zones        │
│ E2_NO_ANCHORS     no day carried an anchoring zone    │
│ E1_NO_DATA        a source is down — [NO DATA]        │
│ E1_SPOT_MISSING   category cannot be derived — refuse │
│ E1_WEEK_INVALID   the resolved Monday is not a Monday │
│ VLM_ARM_DEAD      the local arm did not answer        │
│ SERVED_PINE_DRIFT the served copy != the built copy   │
└───────────────────────────────────────────────────────┘
```

---

## THE SCRIPT TESTING SUITE

*(load `script-test` first — done. Every assertion targets a SPEC-NAMED token or an OBSERVABLE
artifact: bytes on disk, exit codes, state transitions. Never a mock of the unit under test.)*

### THE HARNESS (the shared sandbox — written verbatim into the spec)

```python
# scripts/e1_st_harness.py — imported by every ST script, never duplicated
import json, os, subprocess, sys, tempfile, shutil, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
PASS, FAIL = [], []
def ok(name, cond, detail=""):
    (PASS if cond else FAIL).append(name)
    print(f"  {'PASS' if cond else 'FAIL'}  {name}" + (f"  — {detail}" if detail else ""))
def run(args, cwd=None):
    return subprocess.run(args, capture_output=True, text=True, cwd=cwd or ROOT, timeout=600)
def report():
    print(f"\nRESULT pass={len(PASS)} fail={len(FAIL)}")
    return 0 if not FAIL else 1
```

### ST-18 · THE WEEK RESOLUTION (the anchor)

```
SPEC-NAMED TOKENS:  E1_WEEK_INVALID
OBSERVABLE:         the returned ms bounds
asserts
  a Monday input resolves to ITS OWN Monday (day 0)
  a Wednesday input resolves to the SAME Monday
  a Sunday input resolves to the FOLLOWING Monday
  tsL == monday - 14d ; tsR == friday + 21d   (exact ms)
  a non-date input raises E1_WEEK_INVALID      ← the adversarial half
```

### ST-19 · THE CATEGORY + TIER DERIVATION

```
SPEC-NAMED TOKENS:  E1_SPOT_MISSING
OBSERVABLE:         the returned class string
asserts
  classify(102.0, 101.5, spot=101.048) == "RES"
  classify(100.5, 100.0, spot=101.048) == "SUP"
  classify(101.2, 100.9, spot=101.048) == "MID"   (straddles)
  tier(8) == "T1" ; tier(7) == "T2"               (the canon threshold)
  classify(x, y, spot=0) raises E1_SPOT_MISSING   ← adversarial
  classify(x, y, spot=None) raises E1_SPOT_MISSING
```

### ST-20 · THE EXTRACTOR → THE V8 CONTRACT

```
SPEC-NAMED TOKENS:  E1_NO_DATA
OBSERVABLE:         the JSON on disk (bytes read back)
asserts
  every zone carries top/bottom/name/confluence/zfp/degree
  every zone carries zCat ∈ {RES, MID, SUP}       ← THE GAP, closed
  every zone carries zTir ∈ {T1, T2}
  every level carries a derivation label          (no fabricated number)
  with data/e1 absent: exit 0 and zones == []     (loud-absence, not a crash)
```

### ST-21 · THE BUILD + THE SEAL

```
SPEC-NAMED TOKENS:  HARD STOP H1 · SERVED_PINE_DRIFT
OBSERVABLE:         the artifact on disk + the exit code
asserts
  a clean build exits 0 and writes plutus-vision-v2.pine
  the artifact contains the 6 injected arrays
  tamper v1 -> the build exits != 0 and prints "HARD STOP H1"   ← adversarial
  the floor reads 226 / 6 / 4 in the artifact
  the served copy sha == the built sha
```

### ST-22 · A DEAD SOURCE IS HONEST (the anti-theatre script)

```
SPEC-NAMED TOKENS:  [NO DATA]  ·  VLM_ARM_DEAD
OBSERVABLE:         the JSON + the exit code
asserts
  with the VLM unreachable: exit 0, the file exists, the options pillar == [NO DATA]
  ZERO fabricated strikes in the output
  the refusal names the reason
```

### THE RUNNER

```bash
python3 scripts/e1_st_harness.py          # or per-file
for t in ST-18 ST-19 ST-20 ST-21 ST-22; do python3 scripts/e1_st_$t.py; done
# exit code IS the verdict
```

### THE ANTI-CHEAT PROPERTIES

- written **before** the implementation — the builder implements TO these
- every assertion names a SPEC token or reads a real artifact back
- the adversarial half is present in every script (a missing-spot, a tampered v1, a dead arm)
- the runner is a program, not a human reading a screen
- ST-21's tamper test proves the seal is load-bearing, not decorative

---

## THE DEEP CONTAINER TESTING SUITE

*(load `deep-container-testing` first — done. The 12-step law, instantiated for THIS build.)*

### THE 12 STEPS (this build's instance)

```
1  PLAN        the §7 plan (7 angles, tokens, 2000+ chars) — written first
2  PREFLIGHT   the plan self-check: 6 sections, 3+ scenarios, 1+ adversarial — READY
3  SETUP       the rig: :9851 renderer + :9222 CDP on display :3, fresh page
               record the SERVED sha of plutus-vision-v2.pine
4  AUTH PROBE  trident-v1-vision :8010 -> 200 + capabilities ["completion","multimodal"]
5  MODEL       N/A for the render (no model on this path); the arm is the harvest's
6  SCENARIOS   the 7 angles of §7, each: run -> poll .pine-status to COMPLETED
               -> read the census -> assert the pass token, the fail token absent
7  ADVERSARIAL the FIRST error is not the stop: a failed angle is a defect to fix
8  BUGS        fixed in source, rebuilt, redeployed, the SAME angle re-run
9  PHASE E     all 10: sha match, auth probe, all angles run, all tokens asserted,
               no circular passes, no timeouts, the blast radius covered, the
               adversarial behaved, the container alive, the artifact written
10 ARTIFACT    .omp/ct-results.json — per-scenario: name, passToken, passTokenMatch,
               failTokenAbsent, toolResultContext, verdict, evidence
11 ZERO-WINDOWS the four Python suites + the build re-run after every fix
12 DECLARE     the sha256sum + the stream excerpt + the per-angle verdict + the artifact
```

### THE FAMILY SUITES

**THE AUTH FAMILY (first — the silent-auth-failure green is the #1 false-green)**
| the check | the pass token | the fail token |
|---|---|---|
| the rig answers | `:9851/pine.html` → 200 | connection refused |
| the arm answers | `capabilities:["completion","multimodal"]` | `000` |
| the served artifact is current | `SERVED_PINE_OK` | a sha mismatch |

**THE ENFORCEMENT FAMILY (the POSITIVE — every guard fires its OWN token)**
| use case | the attack | the SPECIFIC token |
|---|---|---|
| the seal | tamper v1, build | `HARD STOP H1` (never a generic error) |
| the floor | drop a v2 layer, build | the count mismatch named |
| the anchor | a hardcoded `timestamp(2026…)` in the render | C6's grep → non-zero |
| E3 | a `strategy.entry` added | C3's grep → non-zero |

**THE NEGATIVE / HAPPY FAMILY (MANDATORY — the zero-misfire proof, AFTER the teeth)**
| the legit op | the pass condition |
|---|---|
| a clean build | exit 0, the floor intact, NOTHING blocked |
| a re-render on a fresh page | the same census, no drift |
| `make e1` with all sources up | the zones present, no `[NO DATA]` |
| reading the served artifact | never gated |

**THE ADVERSARIAL FAMILY**
| the probe | the expectation |
|---|---|
| rewind the rig 5 weeks | the zones recompute; `tsL`/`tsR` differ from the live run |
| stop the VLM, run `make e1` | `[NO DATA]`, exit 0, no fabrication |
| remove `data/e1/` | the chart shows the refusal label, not a bare chart |
| a Sunday bar_time | resolves to the FOLLOWING Monday |

### THE RESULTS ARTIFACT SCHEMA

```json
{"overallVerdict":"PASS|FAIL|BLOCKED",
 "scenarios":[{"name":"A1_anchor_replay","kind":"POSITIVE",
   "passToken":"tsL differs from the live run","passTokenMatch":true,
   "failToken":"identical bounds","failTokenAbsent":true,
   "toolResultContext":"<the verbatim .pine-status or capture path>",
   "timedOut":false,"verdict":"PASS","evidence":"evidence/…png"}],
 "phaseE":{"shaMatch":true,"authProbe":true,"allScenariosRun":true,
   "allTokensAsserted":true,"noCircularPasses":true,"noTimeouts":true,
   "blastRadiusCovered":true,"adversarialBehaved":true,"containerAlive":true,
   "artifactWritten":true}}
```

### THE PASS CRITERIA + THE BANNED PHRASES

- Phase E's 10 checks all true; the negative half green; the capture opened and looked at.
- **BANNED:** "structural PASS" · "PASS by design" · "PASS (source inspection)" · "asserted the
  behavior" · "it works, trust me". A scenario is PASS only when the pass token matched in a tool
  result AND its fail token was absent AND the artifact recorded it.

---

## THE SPEC-MANAGER GATE

**This spec is not dispatchable until the spec-manager machine approves it.**

```bash
bun run scripts/spec-manager.ts packages/plutus-vision-e1-automatic/plutus-vision-e1-automatic_DPL1_SPEC.md
# ✅ APPROVED            -> dispatchable
# ✗ <section> <error>   -> fix the named section, re-run
```

**The external audit (the author is never the auditor):**

```bash
spec-audit specPath=packages/plutus-vision-e1-automatic/plutus-vision-e1-automatic_DPL1_SPEC.md
# SPEC-AUDIT: APPROVED (0/8)  -> handoff proceeds
# SPEC-AUDIT: REJECTED (N/8)  -> fix the named gates, re-audit
```

**PREFLIGHT: script-test ✓ deep-container-testing ✓ ascii-diagrams ✓ trident-deep-planning ✓**
