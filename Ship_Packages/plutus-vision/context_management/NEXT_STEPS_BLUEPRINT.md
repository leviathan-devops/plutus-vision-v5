# NEXT STEPS BLUEPRINT — finishing Engine 1 + Engine 2 per the prompt (2026-10-06)

**STATUS: BLOCKED-OPEN.** The build renders a *plausible* engine 1; the prompt defines the
*actual* one. The work is to **transcribe**, not author.

---

## 1 · THE ROOT CAUSE (the build's OWN words, verbatim)

**The operator (2026-10-06):**
> *"GLM 5.1 in fucking May from a web chat with zero fucking awareness whatsoever was able to create
> this better than you … What has that agent done correctly that you are not doing correctly?"*
> *"literally just convert the fucking prompt into an indicator."*
> *"five of them say 37% … Stop fucking around and stop improvising."*

**The mechanism, named:** the prompt is an **ANALYST PROCEDURE** (harvest → score → cluster →
assign the degree → name the zone). The `trident_v8.pine` author **RAN** that procedure and
**transcribed the finished table** into Pine arrays. I **automated** it — inventing my own
clustering, my own spot-window filter, my own degree math, my own ZFP. **Every invented component
was a place to deviate, and I deviated in all of them.** The inferior model's lack of tools forced
it to obey the prompt; my tools let me reinvent.

**The prompt's bold admonition I violated (step 1):**
> **"Collect all levels from all 9 pillars. Sort from highest to lowest. DO NOT filter by spot
> proximity."**

My `assemble` filtered levels to `abs(price - spot) <= 0.70` → with the price near the week's high,
**every resistance level above it was discarded** → 0 RES zones → the red ladder unused.

---

## 2 · THE AUTHORITY (the two files, read BEFORE any edit)

- `Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md` (4216 lines) — the prompt.
- `Original_Canon_Data/Pine Scripts/trident_v8.pine` (…  lines) — the prompt rendered.
- **The v8's zone table (the target STRUCTURE):**
  ```
  dxy_zNm  = IP Resistance Ceiling · Upper IP Resistance · Equilibrium Zone · Mid-Range Support · Key IP Support
  dxy_zCat = RES      · RES      · MID  · SUP  · SUP      ← 2 above price, 1 at, 2 below
  dxy_zDeg = HEAVY    · M-HEAVY  · M-HEAVY · MODERATE · HEAVY   ← strongest at BOTH extremes
  order    = TOP → DOWN (highest price first)
  ```
- **THE ONE AUTHORIZED CHANGE:** LSZ removed from Engine 1 (the baseline has it).

---

## 3 · THE MECHANICAL PLAN (5 steps; each with a MECHANICAL PREDICATE that exits nonzero on failure)

| # | THE WORK | THE PREDICATE (the mechanical done-when) | THE FILE |
|---|---|---|---|
| **S1** | **Remove the spot-proximity filter.** Keep ALL levels from all pillars. | `grep -c 'abs(l\["price"\] - spot)' scripts/e1_extract.py` → **0** (no filter) | `scripts/e1_extract.py:764` |
| **S2** | **Emit the zones TOP-DOWN** with the v8's roles: 2 RES above the spot, 1 MID straddling, 2 SUP below. | the payload's `zCat` sequence matches `^RES.*RES.*MID.*SUP.*SUP$`; `grep -c '"zCat": "RES"' → ≥1` | `scripts/e1_extract.py:769` (`assemble`) |
| **S3** | **The degree from the cluster's top scorer** (prompt step 5), so the STRONGEST zones are the EXTREMES — never `LIGHT` at the floor. | the floor zone's `zfp` < the mid zones' `zfp`;  the degree sequence is NOT monotonic (the v8's is HEAVY…HEAVY) | `scripts/e1_extract.py:822` |
| **S4** | **Wire S3 (the option-wall tier) + S4 (the analyst harvest)** — the 2 dead dimensions, so the score reaches 12-14 (EXTREME/HEAVY). | the payload's dimension totals show `options > 0` AND `analyst > 0` | `scripts/e1_sources.py`, the VLM arm |
| **S5** | **Engine 2 → ZFP-conditioned** (§6.4.1): `classify`/`transition` read the TARGET zone's ZFP, not the momentum. | `grep -c 'bars_momentum' scripts/e2_engine.py` in `classify` → **0**; the transition reads `target_zfp` | `scripts/e2_engine.py:112`, `:209` |

**Order:** S1 → S2 → S3 (the E1 structure, unblocks the ZFP's placement) → S4 (the full score) →
S5 (the E2 chain). S1-S3 are the "copy paste the working engine one" the operator asked for.

---

## 4 · THE VERIFICATION (the vision-hotseat law — no claim without a screenshot THIS turn)

For every step:
1. **The structure diff** — the payload's `zCat`/`zDeg`/order vs the v8's. A side-by-side table.
2. **The battery** — `e1_st_18`, `e2_tests`, `e1_render_tests` re-run BY ME (`RESULT pass=N fail=0`).
3. **The live render** — the app on display :3, captured, OPENED, and compared to the price action.
4. **The 5-week cross-validation** — the E1 zones land where the price is; the E2 chain matches the
   actual shape sequence.

**No step is "done" without its screenshot + its battery + the structure diff.**

---

## 5 · THE HONEST RESIDUALS (what this plan does NOT fix)

- **Engine 1 is a python pipeline**, not the human analyst the prompt describes. Even after S1-S4 it
  will reproduce the v8's STRUCTURE, not the analyst's JUDGMENT. The prompt's engine 1 is ultimately
  the LLM doing the analysis — the pipeline is the mechanism, the analysis is the intelligence.
- **The v8's own `calcZFP`** does not match its degrees (HEAVY → 4% width). The v8 is accurate in
  zones/degrees/categories; the label formula is a display artifact we inherit.
- **S4 needs the options + analyst SOURCES** (the CME chain, the institutional commentary) — if they
  are unwired, the score caps at 10 (HEAVY) and EXTREME is unreachable. That is a DATA gap, named.

## RESOLUTION (2026-10-11 — the transcribe mandate as executed, W1→W7)
- The operator's order ("literally just convert the fucking prompt into an indicator")
  became the pin's VERBATIM AUTHORITY law: transcribe the Toolset, cite file:line,
  never author (PIN_INDICATOR_PORT_BUILD.md:1).
- S1-S4's invented components were REPLACED by transcription: the ONE Appendix-B ZFP
  (PIN_INDICATOR_PORT_BUILD.md:35), the positional assembly (F-129), the §6.4.1
  ZFP-conditioned E2 — and the computation moved INTO Pine per the OD-1 A3 ruling
  (PIN_INDICATOR_PORT_BUILD.md:73): P1/P2/P5/P6/P9 live from the chart's bars.
- The "five of them say 37%" complaint is answered structurally: the ZFP now varies
  per zone (litmus ceilings 37/40/55 across real weeks) and the 5-week variance
  check fails the build if it ever flatlines (JEV_GATE/run_gate.sh:54).
- The named DATA gap STANDS: P3/P4/P7/P8 have no feed ([NO DATA] behind loud-fail
  guards) — recorded, not solved. EXTREME via S4 remains unreachable (SPEC.md:21).
- POINTER: the mandate's pin is PIN_INDICATOR_PORT_BUILD.md:1; its execution
  record is wave-plan.md:51 (packages/PLUTUS_VISION_INDICATOR_PORT/wave-plan.md:51).
  The fence row for this wave set is pinned in SPEC.md:25.
