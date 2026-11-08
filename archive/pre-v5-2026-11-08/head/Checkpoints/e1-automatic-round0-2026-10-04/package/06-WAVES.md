# 06 — THE WAVE PLAN

WAVES: 10

**The dispatch order.** Each wave owns a DISJOINT file set (no merge chaos). Each wave's gate must
exit 0 before the next fires. The dependencies form a chain: W1 (the anchor) feeds W2 (the gap)
feeds W3 (the data) feeds W4 (the render) feeds W5 (the build); W6 (the harvest) and W7 (the arms)
run PARALLEL to W4/W5 once W3 lands; W8 (the pairs) follows W5; W9 (the test) closes; W10 (the
split test) is deferred.

```
                W1 anchor
                   │
                W2 gap
                   │
                W3 data ────────────────┐
                   │                    │
        ┌──────────┴─────────┐          │
     W4 render            W6 harvest ── W7 arms   (parallel)
        │                                │
     W5 build ◄─────────────────────────┘
        │
     W8 pairs (deferred)
        │
     W9 the test (the rig)
        │
     W10 the split test (deferred)
```

---

## W1 — THE ANCHOR

**Owns:** `scripts/e1_week.py` (NEW) · `scripts/e1_st_18.py` (NEW)
**Gate:** `python3 scripts/e1_st_18.py` → `RESULT pass=N fail=0`, exit 0
**Deliverable:** `resolve(bar_time_ms, *, hindsight_days=14, foresight_days=21) -> {mon,fri,tsL,tsR,tsMid}`
**Why this wave is first:** every other wave consumes the anchor. Getting it wrong (a Sunday
off-by-one) poisons every downstream bound.
**Adversarial (mandatory):** a Sunday input, a pre-2000 input, `bar_time=None` → all raise
`E1_WEEK_INVALID`.

---

## W2 — THE GAP

**Owns:** `scripts/e1_category.py` (NEW) · `scripts/e1_st_19.py` (NEW)
**Gate:** `python3 scripts/e1_st_19.py` → pass=N fail=0
**Deliverable:** `classify(top,bottom,spot) -> RES|MID|SUP` · `tier(confluence) -> T1|T2` ·
`zfp(top,bottom,pair) -> int`
**The measured surprise:** the payload's zones are zero-height (`top==bottom`). `classify` must
handle that (a zero-height zone above spot is still RES).
**Adversarial:** `spot=0`, `spot=None` → raise `E1_SPOT_MISSING`.

---

## W3 — THE DATA

**Owns:** `scripts/e1_extract.py` (EDIT) · `scripts/e1_st_20.py` (NEW) ·
`data/e1/zones.json` (the payload, WRITTEN)
**Gate:** `python3 scripts/e1_st_20.py` → pass=N fail=0; the payload carries ≥1 RES, ≥1 SUP
**Deliverable:** the 6-column v8 contract + `zCat` + `zTir` + a `derivation` per level
**Depends on:** W1 (the anchor), W2 (the classify)
**Adversarial:** with `data/e1` absent → exit 0, `zones==[]`, no crash.

---

## W4 — THE RENDER

**Owns:** `plutus-vision-lqz/e1-render.pine` (REPLACED) · `plutus-vision-lqz/e1-ip-colors.pine` (NEW)
**Gate:** `grep -c 'zfill\|zbord\|pressureLbl\|calcZFP' e1-render.pine` ≥ 4;
`grep -c 'timestamp(2026' e1-render.pine` == 0; `grep -c 'LSZ_' e1-render.pine` == 0
**Deliverable:** the v8 IP block (`:352-365`) ported verbatim, `xloc=xloc.bar_time`, the anchor
computed. The LSZ block EXCLUDED (it lives in `reference/`).
**Depends on:** nothing (the Pine is self-contained; it consumes injected arrays)

---

## W5 — THE BUILD

**Owns:** `scripts/lqz_vision_v2_build.py` (EDIT) · `scripts/e1_st_21.py` (NEW) ·
`plutus-vision-v2.pine` (the artifact, WRITTEN) · `Makefile` (EDIT)
**Gate:** `python3 scripts/e1_st_21.py` → the tamper test prints `HARD STOP H1` and exits ≠0
**Deliverable:** the injection of the 6 `dxy_*` arrays + `tsL/tsR/tsMid`; the auto-run; the
`make e1` target
**Depends on:** W3 (the payload), W4 (the render)
**Adversarial:** tamper v1 → the build refuses.

---

## W6 — THE HARVEST

**Owns:** `scripts/e1_sources.py` (NEW) · `scripts/e1_st_26.py` (NEW)
**Gate:** a dead source → `[NO DATA]` + a `reason`; the 9 harvests run concurrently; one dead
source never kills the harvest
**Deliverable:** `harvest_all(week) -> {pillar: HarvestResult}` with `concurrent.futures` +
per-future capture
**Depends on:** W1 (the week)
**Parallel:** runs alongside W4 / W5.

---

## W7 — THE ARMS

**Owns:** `scripts/e1_vlm_options.py` (NEW) · `scripts/e1_judge.py` (NEW) · `scripts/e1_st_22.py` (NEW)
**Gate:** with the VLM unreachable → exit 0, the options pillar == `[NO DATA]`, ZERO fabricated
strikes
**Deliverable:** the ONE model call (the options image → strikes via the local arm); the judge
tie-breaker (≤10 calls/week asserted)
**Depends on:** the arm at `:8010` being live (the auth probe FIRST)
**Parallel:** runs alongside W4 / W5.

---

## W8 — THE PAIRS (deferred)

**Owns:** `plutus-vision-lqz/e1-render.pine` (EXTEND) — the `isEU`/`isGU`/`isAU` blocks
**Gate:** the DXY path is byte-identical; the four-pair path compiles
**Depends on:** W5 (the DXY build frozen)

---

## W9 — THE TEST (the rig)

**Owns:** `.omp/ct-results.json` (WRITTEN) · the capture (WRITTEN)
**Gate:** the Phase-E 10 checks all true; the 7 angles (A1-A7) each return their pass token
**Deliverable:** the CT results artifact + the looked-at capture (C16)
**Depends on:** W5 (the built artifact)

---

## W10 — THE SPLIT TEST (deferred)

**Owns:** `08-SPLIT-TEST.md` (the results section) · the accuracy comparison
**Gate:** the accuracy instrument run over both arms
**Depends on:** W9 (a working render)

---

## THE PER-WAVE FILE MAP (disjoint — no two waves write one file)

| wave | writes |
|---|---|
| W1 | `scripts/e1_week.py`, `scripts/e1_st_18.py` |
| W2 | `scripts/e1_category.py`, `scripts/e1_st_19.py` |
| W3 | `scripts/e1_extract.py`, `scripts/e1_st_20.py`, `data/e1/*.json` |
| W4 | `plutus-vision-lqz/e1-render.pine`, `plutus-vision-lqz/e1-ip-colors.pine` |
| W5 | `scripts/lqz_vision_v2_build.py`, `scripts/e1_st_21.py`, `Makefile`, `plutus-vision-v2.pine` |
| W6 | `scripts/e1_sources.py`, `scripts/e1_st_26.py` |
| W7 | `scripts/e1_vlm_options.py`, `scripts/e1_judge.py`, `scripts/e1_st_22.py` |
| W8 | `plutus-vision-lqz/e1-render.pine` (EXTEND, after W5) |
| W9 | `.omp/ct-results.json`, `evidence/` |

**The intersection is empty except where a wave EXTENDS an earlier wave's file — and those are
SEQUENCED (W8 after W5), never parallel.**
