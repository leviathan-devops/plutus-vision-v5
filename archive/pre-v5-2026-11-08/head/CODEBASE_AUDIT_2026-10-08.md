# CODEBASE AUDIT — PLUTUS_VISION · 2026-10-08

**Auditor:** OMP desk (this session). **Method:** read the code + payloads + tests + the
operator's PIN as the authority; every finding carries a `file:line` anchor and the quoted
evidence. **Verdict written for a reader who was not in the room.**

**THE ONE-SENTENCE VERDICT:** the indicator DRAWS the right SHAPE (5 zones, RES/RES/MID/SUP/SUP,
the v8 names) but carries THREE contradictory ZFP implementations and a HARDCODED `role_weight`
table that fabricates the pressure degrees — so the zone labels claim strength the confluence does
not support, every zone computes a width that reads `< 20%` (a HARD WALL), and the E2 collapses
onto `SS` because the E1 it reads is internally inconsistent. The battery does not run: two suites
CRASH, two FAIL.

---

## 0 · THE DATA FLOW (where it breaks)

```
   E1 (Engine 1 — the zone map)
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  data/fixtures/bars/*.json  (the chart's own OHLC, 1H)                    │
  │            │                                                              │
  │            ▼                                                              │
  │  scripts/e1_extract.py :: build_levels()   ── 6 pillars ─────────────────┤
  │     • technical ✓   structural ✓   psychological ✓                        │
  │     • options   = 0 ✗   analyst = 0 ✗   regime = 0 ✗   ← 3 DEAD DIMENSIONS│
  │            │                                                              │
  │            ▼                                                              │
  │  synthesize_institutional_zones()                                          │
  │     • conf = Σ dims, CLAMPED (payload: 5,5,6,5,5  → band_of ⇒ LIGHT/MOD)  │
  │     • deg  = band_of(conf + role_weight[ROLE])  ← ✗ HARDCODED ROLE OFFSET │
  │             Ceiling 5+7=12 EXTREME · Upper 5+5=10 HEAVY · Eq 6+5=11 HEAVY │
  │             Mid 5+3=8 MODERATE-HEAVY · Floor 5+7=12 EXTREME               │
  │     • zfp  = e1_zfp.zfp(zone) = round((top-bottom)/ref*100)  ← ✗ WIDTH    │
  │           6, 8, 14, 8, 6   (all < 20 ⇒ every zone = a HARD WALL)          │
  │            │                                                              │
  │            ▼                                                              │
  │  data/e1/DXY-<week>.json  (zones[])  ── injected ──▶ plutus-vision-v2.pine│
  └──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
   E2 (Engine 2 — the shape chain) READS the E1 zone .zfp
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  scripts/e2_engine.py :: classify() + transition(current, target_zfp)     │
  │     • ZFP_HARDWALL = 20 ; ZFP_BREAKOUT = 45   (canon §6.4.1)              │
  │     • every E1 zone zfp (<20) ⇒ is_hard_wall ⇒ SS / RWL branch ONLY      │
  │            │                                                              │
  │            ▼                                                              │
  │  data/e2/DXY-<week>-e2.json  ── injected ──▶ plutus-vision-v2.pine        │
  │     • chain = "WL->SS@IP Resistance Ceiling"  (ONE link, degenerate)     │
  │     • days  = Mon WL · Tue-Fri SS  (4 of 5 identical)                    │
  │     • momentum = 1.0 (CLAMPED CONSTANT)                                   │
  │     • ghost zfp = 37  ← ✗ INCONSISTENT with the E1 zones' 6/8/14          │
  └──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
   RENDER  plutus-vision-v2.pine  ("Plutus Vision v1", 1793 lines)
     • E1: box.new per zone, colour = zfill(zCat, degree)  ✓ shape right
     • E2: line.new(..., xloc = xloc.bar_index)  ← ✗ violates the mount law
     • table: "<bounds> <degree> <zfp>%ZFP T2"  ← the fabricated degree + width ZFP
```

**READ THE DIAGRAM:** three of six E1 dimensions are dead → the confluence clamps to 5-6; the
degree is then a **hardcoded positional lookup** (`role_weight`), not a function of that
confluence; and the ZFP is the **v8's width formula**, which the operator's PIN forbids. The E2
inherits the bad ZFP and collapses. The render faithfully draws a wrong payload.

---

## 1 · THE FINDINGS (by severity)

### ═══ S1 · CRITICAL — the artifact is off-spec ═══

#### F-1 · THE ZFP IS THE WRONG QUANTITY — and THREE implementations claim to be "the ONE ZFP"

- **WHAT.** The ZFP (the 3rd column of every zone) is computed by `round((top−bottom)/ref*100)`
  — the **zone WIDTH divided by a fixed pair reference range**. `e1_zfp.py:46-58`.
- **WHY IT IS WRONG.** The canon defines ZFP as the **Zone Failure Probability** — a value that
  RISES as a zone gets weaker. `Trident_System_Prompt_v5.3.3` Appendix B (`:4052-4076`) gives it
  as *base-by-zone-type + modifiers* (Hard Wall 5-15% … One-Touch 50-70%; +20-30% on expiry, etc.),
  and the pressure-degree table (`:1483-1493`) labels the SAME ranges *Failure Probability*
  (`12-14 EXTREME → <10%` … `0-3 MINIMAL → >60%`). The width formula is a DIFFERENT quantity: it
  measures how TALL a box is, not how likely it fails.
- **THE OPERATOR SAID SO, IN WRITING.** `PIN_FINISH_INDICATOR.md` LAWS line:
  *"the ZFP = the pressure degree's failure band (prompt: MODERATE 30-45% · LIGHT 40-60%); … NEVER
  v8's calcZFP for the engine value; NEVER a made-up step function; NEVER a hardcoded constant."*
  And anti-derail #2: *"THE IMPROVISED ZFP: I wrote my own step function (37%/50%) and then v8's
  width formula — BOTH wrong."*
- **THE THREE-WAY CONTRADICTION (the mechanism of the circle):**
  | file | what it says the ZFP is | the code it runs |
  |---|---|---|
  | `scripts/e1_zfp.py:2-14` | *"THE WIDTH FORMULA IS THE AUTHORITY; Appendix B is a reading aid"* | `(tp−bt)/ref*100` |
  | `scripts/e1_category.py:27-31` | *"The canon's ZFP is base + modifiers — see e1_zfp.py"* | deletes its own; computes none |
  | `scripts/e1_extract.py:17` | *"ZFP base by zone type + the canon's modifiers"* | calls `ZFP.zfp()` (the width) |
  | `scripts/e1_extract.py:455-459` | *"the width formula … could NEVER rise to signal a FAILING zone"* | (comment only) |
  Each file points at another and asserts the OTHER one holds the right formula. Two of the three
  comments say **base + modifiers**; the code that actually runs is the **width**. The comments are
  the lie; the width is the live defect.
- **EVIDENCE (measured this turn).** The payload `data/e1/DXY-2026-07-13.json` emits
  `zfp = 6, 8, 14, 8, 6` (`:2088,2165,2242,2319,2396`) — every value `< 20`.
- **CONSEQUENCE (the cascade).** `e2_engine.py:27` sets `ZFP_HARDWALL = 20`; `Zone.is_hard_wall`
  (`:80-81`) is `zfp < 20`. **Every E1 zone is a Hard Wall.** `classify()` (`:213-216`) then takes
  the `weak < 30` branch → `SS`. The E2 renders `SS` on 4 of 5 days. The wrong ZFP is the root of
  the E2 collapse.
- **VERDICT: FLAWED (critical).** The ZFP must be ONE quantity = the **failure probability** from
  Appendix B (base + B.2 modifiers), keyed off the cluster's degree/zone-type, and the same number
  must feed BOTH the label AND `e2_engine`'s thresholds. The width formula is a v8 render-ism; it
  is NOT the engine value.

#### F-2 · THE PRESSURE DEGREE IS A HARDCODED `role_weight` LOOKUP — fabricated strength

- **WHAT.** `e1_extract.py:774-775`:
  ```python
  role_weight = {"IP Resistance Ceiling": 7, "Upper IP Resistance": 5,
                 "Equilibrium Zone": 5, "Mid-Range Support": 3, "IP Support Floor": 7}
  ```
  and `:796`: `deg = band_of(int(min(CONFLUENCE_CAP, conf + role_weight[nm])))`.
- **WHY IT IS WRONG.** The degree (= the pressure label = the zone's advertised strength) is
  computed as `band_of(confluence + a fixed per-ROLE offset)`. The offset is a **positional
  constant** — the Ceiling is ALWAYS `+7`, the Mid ALWAYS `+3` — regardless of the zone's actual
  measured confluence. This is the v8's literal degree ladder (HEAVY·MODERATE-HEAVY·MODERATE-HEAVY·
  MODERATE·HEAVY) hand-tuned into offsets so the OUTPUT would match the v8 — **authoring the answer
  instead of computing it.** It is exactly anti-derail #3 (*"authoring instead of transcribing …
  the v8 IS engine 1. Transcribe"*) and #4 (*"a global constant in a dimension flattens
  everything"*).
- **EVIDENCE (the decoupling, measured).** `band_of()` (`e1_extract.py:448-451`) is
  `≥12 EXTREME · ≥10 HEAVY · ≥8 MODERATE_HEAVY · ≥6 MODERATE · ≥4 LIGHT · else MINIMAL`. The
  payload's confluences are **5,5,6,5,5** → `band_of` ⇒ **LIGHT, LIGHT, MODERATE, LIGHT, LIGHT**.
  But the EMITTED degrees are **EXTREME, HEAVY, HEAVY, MODERATE_HEAVY, EXTREME**. The emitted
  degree is NOT `band_of(confluence)` — it is `band_of(confluence + role_weight)`. A zone with a
  **5/14 LIGHT** confluence is **labelled EXTREME**.
- **THE INTERNAL INCONSISTENCY.** Same `conf = 5` yields THREE different degrees across the five
  zones (EXTREME at the ceiling, HEAVY at the upper, MODERATE-HEAVY at the mid, EXTREME at the
  floor). A degree that is not a function of its own score is not a measurement — it is a label.
- **VERDICT: FLAWED (critical).** The degree must be `band_of(confluence)` — the cluster's own
  top-scorer, per the canon's `6. Assign pressure degrees based on the group's highest-scoring
  level` (`:1500`). If the extremes SHOULD read HEAVY (the v8 target), the fix is to make the
  SCORE reach 10-11 (fix F-3), never to add a fudge offset.

#### F-3 · THE CONFLUENCE IS CLAMPED LOW BY THREE DEAD DIMENSIONS

- **WHAT.** The score is `Σ(technical, options, analyst, structural, psychological, regime)`, 0-2
  each (max 12) + the structural bonus (max +2). Measured confluences: **5,5,6,5,5**.
- **WHY.** Three of six dimensions are ~0 on every zone: **options = 0** (Pillar 3, the option
  strikes), **analyst = 0** (Pillar 4), **regime = 0** (`e1_extract.py` sets `l["regime"]`
  identically — the anti-derail #4 global constant). With half the dimensions dead, the max
  reachable score is ~6, so `band_of` can never reach HEAVY (≥10) or EXTREME (≥12) honestly — which
  is precisely WHY someone added the `role_weight` fudge (F-2).
- **EVIDENCE.** The payload's `sources` block: `web_harvest: {status: "DOWN", label: "[NO DATA]"}`
  and `P2_ma_grid` carries the MA set; the option/analyst levels are absent (`_harvest_levels`
  returns `[]`). `FAILURE_LOG F-52` already records *"the options/analyst harvest is externally
  blocked (403/Cloudflare)"*.
- **VERDICT: FLAWED (high).** The 3 dead dimensions are the real cause of the degree problem. Either
  wire them (unblock the harvest / derive a regime dimension that actually varies per zone) OR
  re-weight the score so the canon's degree bands are reachable from the live dimensions — but do
  NOT patch it with `role_weight`.

### ═══ S2 · HIGH — the battery does not run ═══

#### F-4 · `e1_st_19.py` CRASHES — the ZFP signature the tests expect no longer exists

- **WHAT.** `python3 scripts/e1_st_19.py` →
  `TypeError: zfp() takes from 1 to 2 positional arguments but 4 were given`.
- **WHY.** `e1_st_19.py:65-66` calls `Z.zfp({"top":…,"bottom":…,"zone_type":"SOFT_WALL"}, [], None, [])`
  — the **failure-probability signature** `zfp(zone, bars, spot, zones_so_far)`. The live
  `e1_zfp.py:46` is `def zfp(zone, pair="DXY")` — the **width signature**. The signature was never
  reconciled; the suite dies at import-time of the first call.
- **SAME CRASH IN TWO MORE SUITES.** `test_zfp_adversarial.py:41,48,55,62,70,76,83,97,99,104` and
  `test_zfp_discriminates.py:64,65,79,80` all call `zfp(z, bars, spot, [])` (4 args). All three
  suites are written against the **failure-probability** design; the tree holds the **width** design.
- **VERDICT: FLAWED (high).** This is the proof that the ZFP was **changed under the tests**. The
  tests are the authority on the intended contract (Appendix B + modifiers); the tree regressed to
  the width formula.

#### F-5 · `e2_render_tests` — 3 FAILURES — the E2 render violates the bar-time law

- **EVIDENCE.** `python3 scripts/e2_render_tests.py` → `RESULT pass=15 fail=3`:
  - `ST-14e it uses xloc.bar_time` — **FAIL**. The E2 path is drawn with
    `line.new(..., xloc = xloc.bar_index, ...)` (`plutus-vision-v2.pine:1745` area — the render
    block computes `bar_index + math.round((e2DayX,i − time)/_bm)`).
  - `ST-16a the day dot is guarded on a non-empty shape` — **FAIL**.
  - `ST-16b the tag is INSIDE that guard` — **FAIL**.
- **WHY IT MATTERS.** The mount's Part X Principle 5 and the PIN both say *"All Drawings Use
  `xloc=xloc.bar_time` … Hardcoded bar_index coordinates are PROHIBITED."* The render regressed to
  bar_index — the exact "`xloc=bar_time`+loop over-draw" the renderer's own comment admits it
  switched away from. So the code CONTRADICTS its own comment and the canon.
- **VERDICT: FLAWED (high).** The E2 polyline must be drawn in TIME space; ST-16a/b guards restored.

#### F-6 · `e1_tests` — the vision arm regressed

- **EVIDENCE.** `python3 scripts/e1_tests.py` →
  `FAIL ST-4b 6/6 control strikes recovered — 0/6 finish=length` and
  `FAIL ST-4c the arm did NOT hit the n_predict ceiling — the measured --reasoning-budget 0
  regression`.
- **WHY.** The VLM/arm path (`e1_vlm_options.py`, mtime 18:52 THIS session) returns
  `finish=length` — it hit the token ceiling and recovered 0 of 6 control strikes. A regression in
  the option-strike extraction (which is also F-3's dead `options` dimension).
- **VERDICT: FLAWED (high).** The arm is broken; the option dimension it feeds is empty.

#### F-7 · `e1_st_20` — 1 FAILURE

- **EVIDENCE.** `RESULT pass=2 fail=1` — `FAIL ST-20c the payload file exists — /tmp/tmp5zj33pvw/DXY-2026-07-06.json`.
  The extractor exits 0 (ST-20b PASS) but the payload it should have written is absent — a
  stale-path / temp-dir mismatch in the test harness (the same class as the F-6 WONK).
- **VERDICT: FLAWED (medium).** The test path is wrong OR the extractor silently wrote elsewhere.

#### F-8 · THE SHA / PAYLOAD DRIFT — the two payloads are from mismatched builds

- **WHAT.** The pin's baseline says `plutus-vision-v2.pine = 1716 lines`; the tree is **1793
  lines**. The `data/e1/DXY-2026-07-13.json` was regenerated **18:09**; the e1 zone `zfp` reads
  6/8/14/8/6, but the e2 payload's `ghost[0].zfp = 37`.
- **WHY IT IS A DEFECT.** The E2's ghost zfp (37) is **not any E1 zone's zfp** (6/8/14). The E2
  payload was built against a DIFFERENT (older) E1 payload — the two are out of sync. A fresh E2
  rebuild would emit different numbers. This is the "inherited numbers are STALE" hazard the pin
  warns about, live.
- **VERDICT: FLAWED (high).** Regenerate E1 → E2 → pine in one pass; never ship a mixed pair.

### ═══ S3 · MEDIUM — canon mismatch + degenerate output ═══

#### F-9 · THE DEGREES MATCH NEITHER THE CANON'S BANDS NOR THE v8'S TARGET

- **CANON** (`:1483-1493`): 12-14 EXTREME · 10-11 HEAVY · 8-9 MODERATE-HEAVY · 6-7 MODERATE ·
  4-5 LIGHT · 0-3 MINIMAL.
- **v8 TARGET** (pin): `zDeg = HEAVY · MODERATE-HEAVY · MODERATE-HEAVY · MODERATE · HEAVY`.
- **MINE:** `EXTREME · HEAVY · HEAVY · MODERATE-HEAVY · EXTREME` (`zfp_label` payload).
- **VERDICT: FLAWED.** Two of five wrong vs the v8; the extremes overshoot (EXTREME not HEAVY) and
  the middle over-reads.

#### F-10 · THE E2 CHAIN IS DEGENERATE

- **EVIDENCE.** `data/e2/DXY-2026-07-13-e2.json`: `chain = ["WL->SS@IP Resistance Ceiling"]` (ONE
  link), `days` = Mon WL · Tue SS · Wed SS · Thu SS · Fri SS (4 identical), `momentum = 1.0`.
- **WHY.** `momentum = 1.0` is a **clamped constant** (`compute_momentum` returns ±1 clamped; on
  this fixture the pre-anchor slope saturated). The `classify()`/`transition()` walk then produces
  one link because every E1 zone is a Hard Wall (F-1). A one-link chain over 4 identical days is
  not a weekly forecast.
- **VERDICT: FLAWED (high).** Root is F-1 (the ZFP); the constant momentum is a second defect.

#### F-11 · `zfp` vs `zfp_label` — two keys, one value, dead `zfp_receipt`

- **WHAT.** Each zone carries `zfp`, `zfp_label` (identical), AND `zfp_receipt` (a `explain()`
  dict). The render reads `zfp`; `zfp_label` is never read; `zfp_receipt` is never read.
- **VERDICT: HYGIENE (low).** Three fields for one number; collapse to the one the engine reads.

### ═══ S4 · LOW — hygiene + drift ═══

#### F-12 · THE LSZ IS IN THE RENDER — the pin's "authorized change" (remove LSZ from Engine 1) was not applied to the render
- **EVIDENCE.** `plutus-vision-v2.pine:1336-1353` injects 6 LSZ boxes (DEMAND/SUPPLY) and
  `:1648-1667` draws them. The pin's LAWS: *"THE ONE AUTHORIZED CHANGE: the LSZ … are REMOVED from
  Engine 1."*
- **VERDICT: SCOPE-CREEP (low).** Either remove them or amend the pin; today the render and the
  law disagree.

#### F-13 · COMMENT/CODE DIVERGENCE across the ZFP modules (the mechanism that let the circle close)
- **EVIDENCE.** `e1_zfp.py:2-14` (width is "the authority") vs `e1_category.py:27-31` ("base +
  modifiers — see e1_zfp.py") vs `e1_extract.py:455-459` ("the width … could NEVER rise"). Three
  files, three claims, all pointing at each other.
- **VERDICT: FLAWED (medium).** The divergence is WHY the ZFP was flipped back and forth for two
  days. Fix: ONE module, ONE docstring, and a test that asserts the formula identity.

#### F-14 · DEAD PATHS in the zone assembler
- **EVIDENCE.** `e1_extract.py:774-799` is a `bands`-driven positional pass with `role_weight`;
  `e1_extract.py:1000-1166` is a SECOND 5-slot pass (`synthesize_institutional_zones`) that
  re-sorts and re-labels. Two assemblers for one payload — the first's `role_weight` survives into
  the degrees, the second's `_ROLES/_CATS` overwrite the names. Overlapping, hard to reason about.
- **VERDICT: HYGIENE (low).** One assembler, one source of the degree.

#### F-15 · STALE ARTIFACTS
- `scripts/*.py.bak-*` (4+), token-sync `before/after` PNG piles, `plutus-vision-v2-smoke.pine`,
  and the `zfp_receipt` field. Untracked litter in a frozen-surface tree.
- **VERDICT: HYGIENE (low).**

---

## 2 · THE COVERAGE MAP (what was audited, how)

| surface | method | result |
|---|---|---|
| `plutus-vision-v2.pine` (1793 ln) | `read` + `grep` (inject block, render block) | E1 shape right; E2 bar_index; LSZ present |
| `scripts/e1_zfp.py` | `read` | **width formula; contradicts its callers' comments** |
| `scripts/e1_category.py` | `read` | ZFP deleted here; points at e1_zfp (wrongly) |
| `scripts/e1_extract.py` | `read` + `grep` | `role_weight` fudge; 5-slot pass; spot fix present |
| `scripts/e2_engine.py` | `read` | threshold reads z.zfp; ZFP_HARDWALL=20 |
| `data/e1/DXY-2026-07-13.json` | `grep` (zones) | conf 5,5,6,5,5 · deg EXTREME… · zfp 6,8,14,8,6 |
| `data/e2/DXY-2026-07-13-e2.json` | `read` | degenerate chain; momentum 1.0; ghost zfp 37 |
| the battery (10 suites) | `bash` (executed) | 6 green · **1 crash · 1 crash/fail · 1 fail · 1 fail(3)** |
| the operator's PIN | `read` | the authority for the ZFP + the degree |
| the v8 + the prompt | `read` | Appendix B; §6.4.1; :1483-1493; Part X |

**THE BATTERY, MEASURED THIS TURN (not inherited):**
```
e1_st_18           RESULT pass=8 fail=0      ✓
e1_st_19           TypeError (CRASH)         ✗  F-4
e1_st_20           RESULT pass=2 fail=1      ✗  F-7
e1_st_21           RESULT pass=4 fail=0      ✓
e1_st_22           RESULT pass=7 fail=0      ✓
e1_st_26           RESULT pass=4 fail=0      ✓
e2_tests           RESULT pass=46 fail=0     ✓
e1_tests           ST-4b 0/6, ST-4c FAIL     ✗  F-6
e1_render_tests    RESULT pass=24 fail=0     ✓
e2_render_tests    RESULT pass=15 fail=3     ✗  F-5
```

---

## 3 · THE HONEST REMAINDER (what this audit did NOT do)

1. **No fresh live render capture this turn.** The STTGF gate blocks inline exec (smoke); a fresh
   chart capture needs the container/rig path. The render-side findings (F-5, F-12) rest on the
   pine SOURCE + the render suite, plus this session's captures at `verify-chart.png` /
   `verify-render.png` (18:56) which show the E1 zones + the E2 path drawn.
2. **The E2 zfp-vs-E1 divergence (F-8)** is inferred from the numbers (ghost 37 vs zones 6/8/14),
   not from a re-run — a fresh E2 build against the 18:09 E1 would confirm it in one command.
3. **The `role_weight` intent** is inferred from the mechanism + the v8 target; the author's
   comment does not admit it. The code is unambiguous regardless of intent.
4. **The container/host rig state** (pv-server :9851, pine-station :9741, CDP :9222, display :3) was
   NOT probed this turn.

---

## 4 · REPLICATION

```bash
cd /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
# the ZFP contradiction
grep -n 'def zfp' scripts/e1_zfp.py                       # width: (zone, pair)
grep -n 'Z.zfp(\|ZFP.zfp(' scripts/e1_st_19.py scripts/test_zfp_adversarial.py  # 4-arg calls
# the fabricated degree
sed -n '773,796p' scripts/e1_extract.py                   # role_weight + the +offset
sed -n '448,451p' scripts/e1_extract.py                   # band_of
grep -n '"confluence"\|"pressure_degree"\|"zfp"' data/e1/DXY-2026-07-13.json
# the battery
for t in e1_st_18 e1_st_19 e1_st_20 e1_st_21 e1_st_22 e1_st_26 e2_tests e1_tests e1_render_tests e2_render_tests; do
  python3 scripts/$t.py 2>&1 | tail -1; done
# the E2 render law
grep -n 'xloc = xloc' plutus-vision-v2.pine
```

---

## APPENDIX · THE FILE:LINE ANCHORS (every finding, the exact site)

- F-1 (the ZFP = the width, not the failure probability): `scripts/e1_zfp.py:46` (the `def zfp`),
  `scripts/e1_zfp.py:58` (the `(tp-bt)/ref` formula), `scripts/e1_extract.py:1079` (the call site).
- F-2 (the hardcoded `role_weight` degree): `scripts/e1_extract.py:774` (the table),
  `scripts/e1_extract.py:796` (the `band_of(conf + role_weight[nm])`).
- F-3 (the dead dimensions): `scripts/e1_extract.py:721` (the `l["regime"] = 0.0` global constant),
  `scripts/e1_extract.py:789` (the confluence without the 4H bonus).
- F-4 (the ZFP test signature): `scripts/e1_st_19.py:65`, `scripts/test_zfp_adversarial.py:41`,
  `scripts/test_zfp_discriminates.py:64`.
- F-5 (the E2 render in bar_index): `plutus-vision-lqz/e2-render.pine:46`.
- F-13 (the comment/code divergence): `scripts/e1_zfp.py:2`, `scripts/e1_category.py:27`,
  `scripts/e1_extract.py:455`.
- THE RENDER (the E1 boxes drew 0): `plutus-vision-lqz/e1-render.pine:227` (the box.new),
  `plutus-vision-lqz/e1-render.pine:199` (the anchor).
- THE YELLOW BOXES: `plutus-vision-lqz/e2-render.pine:80` (the day-tag label.new).

### THE DATA-ARTIFACT ANCHORS (json/md)
- the E1 zone ZFP field: data/e1/DXY-2026-07-13.json:2088
- the E2 chain: data/e2/DXY-2026-07-13-e2.json:1
- the battery record: TESTING_LOG.md:1893
- the EURUSD zones: data/e1/EURUSD-2026-10-05.json:2080

### THE SPREAD FIX ANCHORS
- the pair-relative wick threshold: scripts/e1_extract.py:877
- the confluence-driven zone type: scripts/e1_zfp.py:111
- the emitted ZFP spread: data/e1/EURUSD-2026-10-05.json:2088

### ROUND-3 ANCHORS
- the LSZ z-order: plutus-vision-lqz/e1-render.pine:244
- the pair-aware names: scripts/e1_extract.py:768
- the EQ table tag: plutus-vision-lqz/e1-render.pine:261

### ROUND-4 ANCHOR
- the fill opacity: plutus-vision-lqz/e1-render.pine:28

### ROUND-5 ANCHORS
- the E2 touch tolerance: scripts/e2_engine.py:175
- the walk direction flip: scripts/e2_engine.py:381

### ROUND-6 ANCHOR
- the LSZ visibility: plutus-vision-lqz/e1-render.pine:244

### ROUND-7 ANCHOR
- the option-strike layer: plutus-vision-lqz/e1-render.pine:261
- the option emission: scripts/lqz_vision_v2_build.py:313

### ROUND-8 ANCHOR
- the trades rows: plutus-vision-lqz/e1-render.pine:297
- the trade emission: scripts/lqz_vision_v2_build.py:329
