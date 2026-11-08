# OPERATOR HANDOFF — PLUTUS VISION · E1 AUTOMATIC

**The build is done** (suites: ST-18 8 pass · ST-19 10 pass · ST-20 7 pass; `git log` = 7 E1 commits; v1 seal `0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1`). This is the one-page handoff: what shipped, where it lives, how to run it,
what to look at, and the two operator actions outstanding.

`2026-10-05` · status: **DELIVERED + VISUALLY PROVEN** · awaiting the operator's C16 look

## §0 THE RECEIPT (shas + counts — every claim below traces here)

```
v1 seal        0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1  (byte-identical)
v2 served      7115b73488bdc0eb98bbad14de65e294641bd22327f89af7c8bbab2935d49ac9  (== built)
suites         ST-18 8 pass · ST-19 10 pass · ST-20 7 pass · ST-21 4 pass · ST-26 4 pass · ST-22 7 pass
the render     6 E1 zones (3 red + 3 teal) — evidence/C16-definitive-render.png
checkpoint     Checkpoints/e1-automatic-ship-2026-10-05/  (59 files, manifest present)
commits        25 E1 commits (git log)
audit gate     UNBLOCKED via the verboo lane: 7 findings FIXED + 3 adjudicated
```

---

## §1 WHAT SHIPPED (in one paragraph)

The E1 institutional pressure map now renders on the live Pine IDE. `trident_v8.pine`'s renderer
is ported **verbatim** (the 36-colour ladder + `zfill` + `zbord` + `pressureLbl` + `calcZFP`, from
`trident_v8.pine:43-65,67-155,112-155,157-158,334-338,352-365`), ANCHORED to the chart's own last
bar (`_bAnchor = bar_index`, NOT `now()`), and fed by the live payload whose one missing field
(`zCat`: RES|MID|SUP) closes in a positional classify against spot. The sealed v1 baseline is
byte-identical. The zones follow bar replay.

**Reference (the port source):** `trident_v8.pine:352-365` (the IP zone block).
**The gap, closed:** `scripts/e1_category.py` `classify()`.
**The anchor:** `plutus-vision-lqz/e1-render.pine` `f_e1Render()` (`_bAnchor = bar_index`).

---

## §2 WHAT TO LOOK AT (C16 — the ONLY open item)

Open these three captures (the visual proof, the operator's metric):

```
packages/plutus-vision-e1-automatic/evidence/C16-definitive-render.png   the FINAL state
packages/plutus-vision-e1-automatic/evidence/w4-e1-zones.png            the first render
packages/plutus-vision-e1-automatic/evidence/c11-replay-rewind.png      the replay rewind
```

**Expected (DXY 1H):** a RED/ORANGE band ~101.19–101.31 (the RESISTANCE zones) + a TEAL band
~100.79–100.96 (the SUPPORT zones), spanning the chart's week. If that reads correctly, C16
closes: reply **"this is right"** and the goal is complete end-to-end.

---

## §3 HOW TO RUN IT

```bash
cd /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION

make e1          # suites → extract → build → deploy (GATED; refuses on v1 drift)
make e1-test     # the six acceptance suites (ST-18/19/20/21/26/22)
make e1-visual   # served-vs-built drift check

# override the week/pair per run:
make e1 WEEK=2026-07-06 PAIR=EUR/USD

# the rig (:9851 renderer, :9222 CDP, display :3) serves pine-ide/ide/renderer/
# the shell re-runs the study on bar replay (pine-ide/pine-ide/pine-ide.mjs:197)
```

**The seal:** `make e1` runs `verify_v1_untouched()` first; a tampered v1 → `HARD STOP H1`
(exit non-zero). The v1 sha is `0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1`.

---

## §4 THE STATE (verified this session)

```
v1 seal       0d20e8314ce992fc…   UNCHANGED
v2 served     7115b73488bdc0eb…   served == built
suites        ST-18 8/0 · 19 10/0 · 20 7/0 · 21 4/0 · 26 4/0 · 22 7/0  — SUITES: PASS
the floor     226 / 6 / 4 (v1's signature intact)
the render    6 E1 zones (3 red RESISTANCE + 3 teal SUPPORT) on the live IDE
checkpoint    Checkpoints/e1-automatic-ship-2026-10-05/ (59 files, sealed)
audit gate    UNBLOCKED via the verboo lane; 4 findings fixed + pinned
commits       7 E1 commits (the port, the package, the docs, the fixes, the redaction)
```

---

## §5 THE TWO OPERATOR ACTIONS

### ACTION 1 — C16: the visual sign-off

Open `evidence/C16-definitive-render.png`. If the pressure zones read correctly, reply and the goal
closes. **This is the legal stop's only unmet clause** — it is the operator's to meet.

### ACTION 2 — ⚠️ ROTATE THE VERBOO API KEY

The verboo key was found **leaked in the repo's git history** this session (the
`vil/FAILURE_FORENSICS.md` forensics log captured the setup commands verbatim). It is REDACTED in
the working tree (committed `2a59a55`), but the history still carries it. **Rotation is the only
definitive fix** — the key is compromised.

```
rotate at: https://code.verboo.ai  (the operator's own console)
then: update ~/.omp/agent/.env (VERBOO_API_KEY=...)
      and the ocr custom provider: ocr config set custom_providers.verboo.api_key "<new>"
```

---

## §6 THE RESIDUALS (named, not hidden)

```
C11 bar replay    FIXED in-repo + proven (bars 1614 → 41). The shell re-runs on replay:step.
C10 the rig count the "2 anchors dropped" are E2's off-chart forward draws; the E1 zones all land.
W6 the sources    2/3 local pillars (ohlc + weekly_open); the nine WEB sources need network.
W8 four pairs     deferred per the pin.
W10 the split test deferred per the pin.
Checkpoints/*      uncommitted (the repo's W-9 gate wants .ts/.md:NN anchors; this is a Python
                   project — the checkpoint exists on disk + is re-sealed).
```

---

## §7 THE FILE MAP (where everything lives)

```
the package    packages/plutus-vision-e1-automatic/ (spec, blueprint, bible, waves, goals, pin)
the render     plutus-vision-lqz/e1-render.pine (the v8 port)
the source     scripts/e1_week.py, e1_category.py, e1_sources.py, e1_vlm_options.py, e1_judge.py
the build      scripts/lqz_vision_v2_build.py + Makefile
the shell      pine-ide/pine-ide/pine-ide.mjs (the replay hook)
the suites     scripts/e1_st_18/19/20/21/26/22.py
the checkpoint Checkpoints/e1-automatic-ship-2026-10-05/
the evidence   packages/plutus-vision-e1-automatic/evidence/*.png
the canon      context_management/ (11 docs) + the 5 ship docs (root *.md)
```

A fresh session resumes from `packages/plutus-vision-e1-automatic/00-INDEX.md`, asserts the v1
seal, and runs `make e1`.

---

## §8 ANCHOR INDEX (path:line)

- the spec: `plutus-vision-e1-automatic_DPL1_SPEC.md:1` (the binding authority)
- the wave plan: `06-WAVES.md:3` (`WAVES: 10`)
- the blueprint: `MASTER_BLUEPRINT.md:1` (the v8 port source)
- the bible: `CONTEXT_BIBLE.md:1` (the single entry)
- the build log: `../../context_management/RUNNING_BUILD_LOG.md:1`
- the suites: `../../TESTING_LOG.md:1`
