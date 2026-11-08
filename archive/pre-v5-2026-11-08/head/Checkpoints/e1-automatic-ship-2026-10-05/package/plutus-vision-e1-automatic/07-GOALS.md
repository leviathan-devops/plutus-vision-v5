# 07 — THE GOALS + THE HYDRA ORGANIZATION

**The hydra shape.** This build is MULTI-WAVE with a true dependency chain: W1 → W2 → W3 → {W4,
W6} → W5 → W9. It runs as a SEQUENCE of waves (not four parallel desks) because each wave consumes
the prior's output. Within a wave, one or two desks (a builder + a test author) parallelize.

```
THE ORGAN (top-down)
────────────────────────────────────────────────────────────
THE MISSION      plutus-vision-e1-automatic (this package)
────────────────────────────────────────────────────────────
THE WAVES (10)   W1..W10 (06-WAVES.md) — sequenced by dependency
────────────────────────────────────────────────────────────
THE DESKS         per wave: 1 builder desk + 1 ST-author desk
                  (W4: 1 porter · W6: 1 harvest builder)
────────────────────────────────────────────────────────────
THE TOOLS         ripwire (map before edit) · script-test · container-testing
                  · qwen-code-audit · jq/sed (factual reads)
────────────────────────────────────────────────────────────
THE GATES         the wave gate (the ST exit code) · the wave audit · the qwen gate
────────────────────────────────────────────────────────────
```

**THE ORCHESTRATOR IS THE PRIMARY.** It reads the packet, dispatches each wave, monitors the
session stream, audits every return, and advances. The waves sequence THROUGH it; the desks
parallelize WITHIN a wave.

---

## THE ANCHOR LIST (every goal carries these)

```
THE SEAL        plutus-vision-v1.pine   sha 0d20e8314ce992fc…   1270 lines   READ-ONLY
THE FROZEN REF  reference/trident_v8_lsz.pine   sha db24a18cc8cdd234…   reference only
THE PORT SOURCE /tmp/tph2/Trident_Pine_Handover/reference_files/trident_v8.pine  668 lines
THE SPEC        plutus-vision-e1-automatic_DPL1_SPEC.md   (APPROVED 0/8)
THE BLUEPRINT   MASTER_BLUEPRINT.md   (the verbatim source to copy)
THE RIG         :9741 station · :9754 rail · :9851 renderer · :9222 CDP · :3 weston
```

## THE STOP CONDITION (the whole build's done-when)

```
DONE when: the spec's C1..C16 all hold; the wave audits are recorded; the CT results
artifact carries overallVerdict PASS; the qwen gate reads GATE: PASS; the operator LOOKS
at the capture and says "this is right" (C16).
```

---

## THE PER-WAVE GOAL PROMPTS (paste-ready)

### GOAL — W1 (the anchor)

> Build `scripts/e1_week.py` implementing `resolve(bar_time_ms, *, hindsight_days=14,
> foresight_days=21) -> {mon,fri,tsL,tsR,tsMid}` (all epoch ms). `bar_time_ms` is the chart's last
> bar. Compute `mon = bar_time_ms - weekday(bar_time_ms)*86400000` at midnight; `fri = mon + 4d`;
> `tsL = mon - 14d`; `tsR = fri + 21d`. Raise `E1WeekInvalid("E1_WEEK_INVALID")` on a missing/zero/
> implausible bar_time. Write `scripts/e1_st_18.py` asserting: a Monday resolves to its own Monday;
> a Wednesday to the SAME Monday; a Sunday to the FOLLOWING Monday; `tsL == mon-14d` exactly;
> a `None` input raises. Gate: the ST exits 0. Report the exact ms values for 3 inputs.

### GOAL — W2 (the gap)

> Build `scripts/e1_category.py`: `classify(top,bottom,spot) -> RES|MID|SUP` (RES if the zone is
> ENTIRELY above: bottom>spot; SUP if ENTIRELY below: top<spot; else MID straddles; raise
> `E1SpotMissing` on a falsy spot); `tier(confluence) -> T1|T2`
> (T1 if ≥8); `zfp(top,bottom,pair) -> int` (v8's `round((top-bottom)/ref*100)`, ref DXY 1.60,
> EU/GU 0.0200, AU 0.0150). Write `scripts/e1_st_19.py`. Gate: exit 0. Handle the measured
> zero-height zone (top==bottom) — it is still classified.

### GOAL — W3 (the data)

> Edit `scripts/e1_extract.py` so each emitted zone carries `zCat` (from W2's classify against
> `spot`) and `zTir` (from W2's tier against `confluence`), and each level carries a non-empty
> `derivation`. Write the payload to `data/e1/zones.json` with `pair/week/anchor/spot/zones/levels/
> pillars`. Write `scripts/e1_st_20.py` asserting the contract. Adversarial: `data/e1` absent →
> exit 0, `zones==[]`. Gate: exit 0; ≥1 RES and ≥1 SUP in the output.

### GOAL — W4 (the render)

> REPLACE `plutus-vision-lqz/e1-render.pine` with the v8 port: copy VERBATIM from
> `MASTER_BLUEPRINT.md §14` — the colour ladder, `zfill`, `zbord`, `pressureLbl`, `calcZFP`, and
> the IP zone block (`box.new(tsL,tp,tsR,bt,bgcolor=zfill(c,d),border_color=zbord(c,d),border_width=2,
> xloc=xloc.bar_time)` + the label at `tsMid`). Compute the anchor from `time` (NOT `timenow`).
> EXCLUDE the LSZ block (`trident_v8.pine:367-377`). Create `e1-ip-colors.pine` with the 36 colour
> declarations. Gate: `grep -c 'zfill\|zbord\|pressureLbl\|calcZFP' e1-render.pine` ≥ 4;
> `grep -c 'timestamp(2026' e1-render.pine` == 0; `grep -c 'LSZ_' e1-render.pine` == 0.

### GOAL — W5 (the build)

> Edit `scripts/lqz_vision_v2_build.py` to inject the 6 `dxy_*` arrays + `tsL/tsR/tsMid` from the
> payload, keep `verify_v1_untouched()` FIRST, and write `plutus-vision-v2.pine`. Add `make e1`
> (harvest → extract → category → build). Write `scripts/e1_st_21.py`: a clean build exits 0 and
> contains the arrays; tamper v1 → `HARD STOP H1` + exit ≠0; the floor reads 226/6/4. Gate: exit 0.

### GOAL — W6 (the harvest)

> Build `scripts/e1_sources.py`: nine harvesters returning `{data,label}` or raising `SourceDown`.
> `harvest_all(week)` runs them via `concurrent.futures` with per-future capture (allSettled
> semantics) — one dead source never kills the harvest; a dead source → `{data:[], label:"[NO DATA]",
> reason:"..."}`. Write `scripts/e1_st_26.py`. Gate: a dead source yields `[NO DATA]` + exit 0.

### GOAL — W7 (the arms)

> Build `scripts/e1_vlm_options.py` (the ONE model call: the option-chain image → strikes via the
> local arm `:8010`; `parse_strikes` returns `[]` on ANY unparseable output) and
> `scripts/e1_judge.py` (the tie-breaker; ≤10 calls/week). Auth probe FIRST (`:8010/health`).
> Write `scripts/e1_st_22.py`: with the VLM unreachable → exit 0, options pillar == `[NO DATA]`,
> ZERO fabricated strikes. Gate: exit 0.

### GOAL — W9 (the test)

> Run the container rig (`container-testing`). Deploy the built `plutus-vision-v2.pine` to the
> rig. Run angles A1-A7 (see the spec §7): A1 replay, A2 classify, A3 dead arm, A4 floor, A5 seal,
> A6 empty payload, A7 Sunday boundary. Write `.omp/ct-results.json` per the schema. Phase E:
> all 10 checks. Open the capture (C16). Gate: `overallVerdict == "PASS"`.

---

## THE DISPATCH RULES

1. **ONE wave at a time** (the dependency chain is true). W6/W7 may dispatch in parallel with W4/W5.
2. **Every dispatch reads the packet first** (`00-INDEX → spec → blueprint → the wave's goal`).
3. **Every dispatch carries the anchor list** (the seal sha, the frozen reference, the file set).
4. **Every return is AUDITED** — the wave audit (the ST exit code + the disk diff + the spec
   coverage). A "green" from a desk TRIGGERS the audit.
5. **The gate between waves** — the ST exit code 0 + the audit recorded + the docs updated.
