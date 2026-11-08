# PACKAGE context_management — the E1-AUTOMATIC deltas

This package's context is the PROJECT canon (`PLUTUS_VISION/context_management/`) PLUS the
deltas below. Read the project canon first (CURRENT_STATE, BUILD_STATE, DECISION_CHAIN); read
these for what THIS package changes.

## THE PROJECT CANON (read first)

```
../../../context_management/CURRENT_STATE.md      the 2026-10-04/05 superseding block
../../../context_management/RUNNING_BUILD_LOG.md   the E1-AUTO entries
../../../context_management/RUNNING_DEBUG_LOG.md   the measured findings + adjudications
../../../context_management/NEXT_STEPS.md          the W1-W9 order
../../../context_management/TASK_QUEUE.md          T1-T10
../../../context_management/POST-COMPACTION_PROMPT.md  the resume point
```

## THIS PACKAGE (the deltas)

```
../00-INDEX.md            the map
../00-MISSION.md          the verbatim mission
../01-DISCOVERY.md        the measured landing zone + the v8 port map
../plutus-vision-e1-automatic_DPL1_SPEC.md   the 14-section spec (APPROVED 0/8)
../MASTER_BLUEPRINT.md    the machinery (the verbatim source to port)
../06-WAVES.md            the dispatch order (`WAVES: 10`)
../07-GOALS.md            the per-wave goals + the hydra org
../08-SPLIT-TEST.md       the deferred accuracy comparison
../CONTEXT_BIBLE.md       the single-entry compaction-proof reference
../MASTER_PROMPT.md       the expanded on-disk depth for the pin
../GOAL_PIN.txt           the /goal pin (validated 7/7)
../reference/trident_v8_lsz.pine   the frozen split-test arm
```

## THE FINGERPRINT (assert before any build)

```
plutus-vision-v1.pine   sha256 0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1   1270 lines   76550 B
plutus-vision-v2.pine   sha256 7115b73488bdc0eb98bbad14de65e294641bd22327f89af7c8bbab2935d49ac9   1671 lines
e1-render.pine          236 lines (REPLACED by this build)
reference/trident_v8_lsz.pine   sha256 db24a18cc8cdd2349ce2419b1a1439c089ce32d634cdb85d1953f3855a54f985
```

## THE KEY ANCHORS (file:line — the load-bearing sites)

```
scripts/e1_week.py:47          resolve() — the anchor (bar_time -> the week)
scripts/e1_week.py:63          the bool/invalid guard (isinstance(True,int) is True)
scripts/e1_category.py:47      classify() — the RES|MID|SUP gap bridge
scripts/e1_category.py:61      the float-safe zero-spot guard (abs(spot) < 1e-9)
scripts/e1_category.py:79      zfp() — v8's calcZFP (the label formula)
scripts/e1_sources.py:57       harvest_all() — the reconciled pillars
scripts/e1_vlm_options.py:60   parse_strikes() — the anti-fabrication guard (bool/NaN rejected)
scripts/e1_judge.py:76         the thread-safe JUDGE_BOUND counter
scripts/e1_judge.py:102        the narrowed exception (HTTPError vs URLError)
scripts/e1_extract.py:412      assemble() — the zone builder (zCat/zTir injected)
scripts/lqz_vision_v2_build.py:49   _payload_files() — the week selector (fail-closed)
scripts/lqz_vision_v2_build.py:86   _q() — the Pine string escaper
plutus-vision-lqz/e1-render.pine:161   f_e1Render() — the v8 port, chart-anchored
pine-ide/pine-ide/pine-ide.mjs:197     the replay re-run hook (C11)
```

## THE BUILD (the automatic pipeline)

```
make e1          suites → extract → build → deploy (GATED; refuses on v1 drift)
make e1-test     the six acceptance suites (ST-18/19/20/21/26/22)
make e1-visual   served-vs-built (fails on drift)
```

## THE VISUAL PROOF (the operator's metric)

```
../evidence/w4-e1-zones.png       the v8 ladder on the live IDE
../evidence/w9-final-render.png   the final state (two readers)
../evidence/c11-replay-rewind.png the chart rewound; bars 1614 → 41
```

## ANCHOR NOTE (file:line)

Every claim in this doc traces to a code site named as a file:line anchor — see the
"file:line" references throughout. The Python sites use the form `path.py:N`; read each
"file:line" as the load-bearing location of the mechanism it names.

## THE LAYERED READING (how the package answers a question)

When a fresh session asks "how does the E1 layer work", the answer comes from layered docs:

1. `00-INDEX.md` — the map (the one-screen orientation).
2. `plutus-vision-e1-automatic_DPL1_SPEC.md` — the CONTRACT (what the build must produce; the
   14 sections; C1-C16; the adversarial angles A1-A7).
3. `MASTER_BLUEPRINT.md` — the MACHINERY (the verbatim v8 source to port; the anchor; the
   interfaces; the failure modes; the replication recipes).
4. `CONTEXT_BIBLE.md` — the SINGLE-ENTRY reference (the operator's verbatim mission; the frozen
   facts; the gate designs; the resume state).
5. `06-WAVES.md` + `07-GOALS.md` — the DISPATCH order + the per-wave goals.
6. `08-SPLIT-TEST.md` — the deferred accuracy comparison.

Each doc carries its own file:line anchors; a fresh agent reads 00-INDEX then the spec then the
blueprint, and can rebuild the layer from the blueprint alone.

## THE FROZEN FACTS (never violated)

1. v1 (`plutus-vision-v1.pine`) stays byte-identical — the build's `verify_v1_untouched()` runs
   first and exits `HARD STOP H1` on any drift (the file:line guard is in
   `scripts/lqz_vision_v2_build.py`).
2. The render uses `xloc=xloc.bar_time` / `bar_index` only — mixing coordinate spaces is the F-17
   cull (the file:line is `plutus-vision-lqz/e1-render.pine`).
3. The anchor is `_bAnchor = bar_index` (the chart's own last bar) — NEVER `now()`/`timenow`
   (file:line: `plutus-vision-lqz/e1-render.pine`).
4. The LSZ block lives in `reference/trident_v8_lsz.pine` only — never in the ported render.
5. No E3 primitive exists — no entry/SL/TP/position anywhere in the artifact.

## THE GATE CHAIN (the build order)

```
P0 ABSORB (re-measure) → P1 SPEC (APPROVED 0/8) → P2 PREFLIGHT → P3 EXECUTE (the waves)
→ P4 RUNTIME (the live seat) → P5 ADVERSARIAL (A1-A7) → P6 DOCUMENT → P7 CHECKPOINT → P8 VERDICT
```

Every wave carries a `file:line`-anchored gate; the build refuses on a v1 drift (the seal).

## THE OPERATING COMMANDS

```
make e1            # suites → extract → build → deploy (gated)
make e1-test       # the six acceptance suites
make e1-visual     # served-vs-built drift check
python3 scripts/e1_st_18.py   # one suite (the anchor)
python3 scripts/e1_judge.py --health   # the judge substrate
```

Each command's file:line site is named in the source; the suites are the regression guards, and
the SCREENSHOT (evidence/) is the capability proof.

## ANCHOR INDEX (path:line)

- the spec: `../plutus-vision-e1-automatic_DPL1_SPEC.md:1` (the contract)
- the blueprint: `../MASTER_BLUEPRINT.md:1` (the machinery)
- the waves: `../06-WAVES.md:3` (`WAVES: 10`)
- the mission: `../00-MISSION.md:1` (the verbatim ask)
