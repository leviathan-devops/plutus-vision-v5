# MASTER PROMPT — PLUTUS VISION E1 AUTOMATIC

**The expanded depth behind `GOAL_PIN.txt`.** The pin (124 lines) is the paste; this carries the
scope items, the gate designs, the derivation procedure, and the resume state.

Companion to the pin · `2026-10-04` · class: SYSTEM

---

## §1 THE EXPANDED MISSION

`trident_v8.pine` renders five institutional pressure zones for ONE hardcoded week (Apr-May 2026),
fed by hardcoded arrays. The operator wants that replaced: the zones must render for the TARGET
trading week, follow bar replay, and be fed from the nine web data sources. The renderer is
proven and must NOT be rewritten — it is PORTED VERBATIM. Only two things change: the anchor
(`:35-37`) and the data source (`:187-192`).

**The three moves (the whole design):**
```
1  PORT    trident_v8.pine:43-65,67-155,112-155,157-158,334-338,352-365  -> e1-render.pine
2  ANCHOR  timestamp(2026,4,6)..(2026,5,15)  ->  anchor = time (the chart's last bar)
3  INJECT  the hardcoded dxy_* arrays        ->  the live payload (6 columns)
```

**The fourth move is FORBIDDEN:** rewriting what works. Every defect F-01..F-20 came from it.

---

## §2 THE BASELINE ASSERTION (first reply)

```bash
sha256sum plutus-vision-v1.pine    # MUST be 0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1
wc -l plutus-vision-v1.pine        # 1270
sha256sum plutus-vision-v2.pine    # 3c3f1a76ee54b60d94d30343d72302d87d01d41768e8582e71d14c83d94155ec
git rev-parse HEAD                 # 4044e97cca441daa49b2dd4d1b440ec8b212fc57
sha256sum packages/plutus-vision-e1-automatic/reference/trident_v8_lsz.pine  # db24a18cc8cdd2349ce2419b1a1439c089ce32d634cdb85d1953f3855a54f985
```
If v1's sha differs → STOP. The seal is the invariant.

---

## §3 THE SCOPE (expanded, each item + its gate)

| # | the item | the deliverable | the gate |
|---|---|---|---|
| 1 | the anchor | `e1_week.resolve(bar_time)` | `test_week_resolve` exit 0 |
| 2 | the gap | `e1_category.classify/tier/zfp` | `test_classify_gap` exit 0 |
| 3 | the data | `e1_extract` + `zones.json` with zCat/zTir | `test_extract_contract`; ≥1 RES + ≥1 SUP |
| 4 | the render | `e1-render.pine` (the v8 port) | grep ≥4 helpers; `timestamp(2026`==0; LSZ_==0 |
| 5 | the build | `lqz_vision_v2_build.py` injects + `make e1` | `test_build_seal`: tamper → HARD STOP H1 |
| 6 | the harvest | `e1_sources.py` (9 sources, concurrent) | `test_harvest_dead_source`: [NO DATA] + exit 0 |
| 7 | the arms | `e1_vlm_options.py` + `e1_judge.py` | `test_vlm_dead_arm`: [NO DATA], 0 fabricated |
| 8 | the pairs | the isEU/isGU/isAU blocks (W8) | the DXY path byte-identical |
| 9 | the rig | the CT angles A1-A7 | `.omp/ct-results.json` overallVerdict PASS |
| 10 | the split | the LSZ vs our ladder (W10) | the accuracy instrument run |

---

## §4 THE GATE DESIGNS

### G-SEAL (the invariant)
```python
V1_SEALED_SHA = "0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1"
if sha256(ROOT/"plutus-vision-v1.pine") != V1_SEALED_SHA:
    sys.exit("HARD STOP H1 — v1 HAS MOVED")
```

### G-FLOOR (the extension proof)
```
v2 must still carry v1's signature: SMC 226 · OB 6 · LQZ 4
grep -c 'pv_alerts\|smc_' plutus-vision-v2.pine   ->  226
```

### G-E3 (the scope proof)
```
grep -icE 'entry\.|strategy\.|sl_|take\.profit' plutus-vision-v2.pine   ->  0
```

### G-ANCHOR (the replay proof)
```
grep -c 'timestamp(2026' e1-render.pine   ->  0     (no hardcoded week)
grep -c 'timenow\|now()'  e1-render.pine  ->  0     (chart-anchored, not wall-clock)
```

### G-CT (the runtime proof)
The 7 angles A1-A7, each binding a pass token in a tool result; the results artifact
`.omp/ct-results.json` with the Phase-E 10 checks.

---

## §5 THE DERIVATION PROCEDURE (how the numbers were obtained)

**The anchor constants (14 / 21 days):** derived from the window the zones need — 2 weeks of
hindsight to contain the prior sweeps (the zones derive FROM them), 3 weeks of foresight to read
the target. Window constants, never per-zone.

**The ZFP reference ranges (DXY 1.60 / EU-GU 0.0200 / AU 0.0150):** v8's own values
(`trident_v8.pine:336`), the operator's calibrated typical weekly ranges.

**The classify thresholds:** positional against spot — derived from v8's colour semantics (a zone
above price is resistance-coloured), not invented.

**The tier threshold (confluence ≥8 → T1):** the canon's threshold; the payload's values are the
engine's.

---

## §6 THE CONTAINER ANGLES (the terminal phase)

```
A1 replay     rewind the rig 5 weeks -> the emitted tsL/tsR DIFFER from the live run
A2 classify   classify(102.0,101.5,101.048)==RES  AND  classify(100.5,100.0,101.048)==SUP
A3 dead arm   stop the VLM, run `make e1` -> [NO DATA] + exit 0 + ZERO fabricated strikes
A4 floor      the builder -> SMC 226 OB 6 LQZ 4
A5 seal       tamper v1, build -> HARD STOP H1 + exit != 0
A6 empty      build with data/e1 absent -> the refusal label, NOT a bare chart
A7 boundary   resolve(a Sunday ts) -> the FOLLOWING Monday, day 0
```

---

## §7 THE RESUME STATE

```
THE PACKAGE    packages/plutus-vision-e1-automatic/   2800+ lines, 11 files
THE PIN        packages/plutus-vision-e1-automatic/GOAL_PIN.txt   124 lines, VALIDATED
THE CHECKPOINT Checkpoints/e1-automatic-round0-2026-10-04/
THE CANON      PLUTUS_VISION/context_management/  (the 2026-10-04 superseding blocks)
THE NEXT       dispatch W1: e1_week.py + test_week_resolve
```

---

## §8 THE ANTI-DERAIL / ANTI-STOP (project-adapted)

**ANTI-DERAIL (the real defects this tree produced):**
- a hardcoded `timestamp(2026…)` slipping into the render (F-21)
- `now()`/`timenow` in the anchor (replay renders the wrong week)
- the LSZ block contaminating the ported render (the split-test arm)
- a fabricated strike when the VLM is down (the fake-zone class)
- a green ST battery cited as runtime capability (theatrical)
- editing v1 (the seal)

**ANTI-STOP (the false-close shapes):**
- "the STs pass, we're done" while the rig never rendered
- "structural PASS / PASS by design" (banned — tool-result-bound only)
- "the render was verified" without a screenshot/artifact
- closing at W5 with W6-W9 unrun

---

## §9 THE DOC CONTRACT

```
SPEC (at completion) 3000+   ·  ARCH 1000+  ·  REPORT 500+  ·  README 300+  ·  GENERIC 200+
update canon + ship docs at EVERY wave · a fact appears ONCE · THEATRICALITY_LOG append-only
```

## ANCHOR NOTE (file:line)

Every claim in this doc traces to a code site named as a file:line anchor — see the
"file:line" references throughout. The Python sites use the form `path.py:N`; read each
"file:line" as the load-bearing location of the mechanism it names.

## ANCHOR INDEX (path:line)

- the spec: `plutus-vision-e1-automatic_DPL1_SPEC.md:1` (the binding authority)
- the wave plan: `06-WAVES.md:3` (`WAVES: 10`)
- the blueprint: `MASTER_BLUEPRINT.md:1` (the verbatim source)
- the goals: `07-GOALS.md:1` (the per-wave goals)
