GOAL
Finish the PLUTUS VISION indicator so that it renders Engine 1 (institutional pressure zones) + Engine 2 (the shape chain) EXACTLY as `Original_Canon_Data/Trident_System_Prompt_v5.3.3_DOWNLOAD_ME.md` + `Original_Canon_Data/Pine Scripts/trident_v8.pine` specify — no improvisation, no authored substitutes — and STOP only when the live render matches the v8's structure on five random weeks with all gates green, the fence holds a PASS row, and the operator's look (C16) confirms it.

BASELINE (re-measure EVERY number THIS turn before touching anything — inherited numbers are STALE)
- repo `PLUTUS_VISION` @ HEAD 68ea066 · tree has staged files (the G-SEAL gate blocks the commit until the fence PASSes).
- v1 seal `plutus-vision-v1.pine` = `0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1` — NEVER touch (HARD STOP H1).
- v2 `plutus-vision-v2.pine` = `984732d0a37c34a94a313d3e4eda41344a36773511789119a6ce69950f066b40` (1716 lines) · render `plutus-vision-lqz/e1-render.pine` = `79fd8e2477bd7397c1c36d65a8900f95b44d081ccdefb4ea7eff79cd3d2d6555` (238 lines).
- battery: `python3 scripts/e1_st_18.py` → `RESULT pass=8 fail=0` · `python3 scripts/e2_tests.py` → `RESULT pass=42 fail=0` · `e1_render_tests` → pass=24 · `e1_tests` → pass=18.
- THE AUTHORITY (read BOTH, cover-to-cover, BEFORE any edit): the prompt (4216 lines) AND the v8 pine (668 lines). They are ONE authority — the v8 is the prompt rendered as an indicator. The build package (`packages/plutus-vision-e1-automatic/`) is a DERIVED plan, NEVER the authority.
- THE v8 ZONE TABLE (the exact target STRUCTURE — transcribe it):
  `zNm  = IP Resistance Ceiling · Upper IP Resistance · Equilibrium Zone · Mid-Range Support · Key IP Support`
  `zCat = RES · RES · MID · SUP · SUP`          ← 2 above the price, 1 straddling, 2 below
  `zDeg = HEAVY · MODERATE-HEAVY · MODERATE-HEAVY · MODERATE · HEAVY`   ← strongest at BOTH extremes
  `zTp/zBt = 99.23/99.16 · 98.99/98.77 · 98.41/98.29 · 98.12/98.00 · 97.97/97.63`  ← sorted TOP→DOWN
- rig: pv-server `:9851` · pine-station `:9741` · CDP `:9222` · the app on display `:3` (Chrome-for-Testing, window "Plutus Vision"). The chart currently renders 4 zones (WRONG — must be 5) with the RESISTANCE back but the color ladder partially wrong.

WAVES (sequential; each owns DISJOINT files; each gate is MECHANICAL; the loop runs until ALL are green)
- W1 — THE v8 STRUCTURE (Engine 1's shape). Owns `scripts/e1_extract.py`. Deliverable: the payload emits EXACTLY 5 zones — 2 RES above the spot, 1 MID straddling (or nearest), 2 SUP below — sorted TOP→DOWN, with the degree from the cluster's HIGHEST-scoring level so the EXTREMES are the strongest. Gate: the payload's `zCat` sequence matches `^RES,RES,MID,SUP,SUP$` AND `grep -c '"zCat": "RES"' data/e1/*.json ≥ 2` AND the floor zone's `zfp` < the mid zones' `zfp`. Test id: `test_v8_structure`.
- W2 — THE 6-DIMENSION SCORE (Engine 1's heart). Owns `scripts/e1_extract.py` (the score block only) + `scripts/e1_sources.py`. Deliverable: the 0-14 score across Technical/Options/Analyst/Structural/Psychological/Regime + the Structural Extreme Bonus, with NO global constant in any dimension; wire the Options (S3) + Analyst (S4) dimensions. Gate: the dimension totals show `options > 0` AND `analyst > 0` AND ≥4 distinct `zfp` values across the 5 zones. Test id: `test_6dim_score`.
- W3 — ENGINE 2 ZFP-CONDITIONED. Owns `scripts/e2_engine.py`. Deliverable: `classify` + `transition` read the TARGET zone's ZFP per the prompt §6.4.1 ("THE TARGET ZONE'S ZFP DECIDES, NOT THE MOMENTUM"); the shape matrix §6.2 applied in sequence; the tables transcribed verbatim. Gate: `grep -c 'bars_momentum' scripts/e2_engine.py` inside `classify` == 0 AND the transition reads `target_zfp`. Test id: `test_e2_zfp_conditioned`.
- W4 — THE RENDER (verbatim). Owns `plutus-vision-lqz/e1-render.pine` + `scripts/lqz_vision_v2_build.py`. Deliverable: the box spans the v8's full [tp,bt] range; the FULL 6-shade ladder per category (RED for RES, ORANGE for MID, TEAL for SUP) driven by the degree; the 3-week width (previous + target + next week); the label reads the v8's `nm | prs | calcZFP(tp,bt,pair)% ZFP`; NO hardcoded `timestamp(2026…)`; NO `now()`. Gate: `grep -c 'timestamp(2026' plutus-vision-v2.pine` == 0 AND the station render shows ≥1 RED box AND ≥1 TEAL box AND ≥1 ORANGE box. Test id: `test_render_ladder`.
- W5 — THE 5-WEEK CROSS-VALIDATION (the operator's litmus test). Owns `evidence/` + `CROSSVAL_5WEEK.md`. Deliverable: 5 random trading weeks rendered with the FORWARD price action visible, the E1 zones + the E2 chain, each captured + compared. Gate: for each of the 5 weeks the payload has ≥5 zones with ≥1 RES AND ≥1 SUP AND the render `ok:true`. Test id: `test_5week_crossval`.

LAWS (binding on every turn — a violation FAILS the wave on sight)
- THE VERBATIM AUTHORITY: the prompt + the v8 are ONE authority. READ BOTH before ANY edit. Transcribe; NEVER author. Where the prompt is silent, FIND the answer in the prompt/pine — never invent.
- THE ONE AUTHORIZED CHANGE: the LSZ (liquidity zones) are REMOVED from Engine 1 (the baseline has them). Nothing else changes.
- SCOPE: Engine 1 + Engine 2 ONLY. Engine 3 is IGNORED.
- RIPWIRE FIRST-CLASS: map structure (`ripwire` verb=for/callers/impact) before EVERY coding edit; re-map after export-surface edits. A blind/syntax-only patch is FORBIDDEN.
- NO IMPROVISED FORMULAS: the ZFP = the pressure degree's failure band (prompt: MODERATE 30-45% · LIGHT 40-60%); the degree = the cluster's top-scorer's band. NEVER v8's calcZFP for the engine value; NEVER a made-up step function; NEVER a hardcoded constant.
- NO GLOBAL CONSTANT IN ANY DIMENSION: a dimension set identically on every level flattens the score → every zone the same degree → the ZFP 5/6 identical. Check EVERY dimension for a constant.
- THE SPOT = THE PRICE AT THE ANCHOR (the target week's Monday), NOT `bars[-1]` (which is the FUTURE price on a forward-extended fixture).
- EVIDENCE OVER PROSE: every verdict carries a quoted tool result. No prose verdicts.
- LOUD FAIL OR CLEAR PASS: a down source → `[NO DATA]` + a reason; a fabricated level on the chart is a VIOLATION and FAILS THE WAVE ON SIGHT.
- ADVERSARIAL-FIRST: the mutation/adversarial cases run BEFORE the happy path; the happy path is the LAST confirmation.
- BUILDER-UNDER-AUDIT: a subagent return is a CLAIM — re-run the gate YOURSELF on the tree.
- APPEND-ONLY DOCS: DEBUG_LOG, FAILURE_LOG, SPEC_VIOLATION_LOG, TESTING_LOG, THEATRICALITY_LOG — the fresh-capture rule (DEBUG+FAILURE first, at the moment).

HARD STOPS (do not cross; each names its remedy)
- v1 drift: `sha256sum plutus-vision-v1.pine` != `0d20e831…517bd1` → `HARD STOP H1`, never build.
- a fabricated level on the chart → STOP, revert, log the F entry.
- secrets: keys live out-of-band; never in the repo, chat, logs, or doc rows.
- rig down / the arm quota exhausted → BLOCKED with the retry condition. Never PASS.
- editing `plutus-vision-v1.pine` → STOP.
- a commit WITHOUT a fence PASS row → the kernel refuses (`REJECT(G-SEAL)`); run the fence FIRST (`python3 ~/JARVIS_WORKSPACE/Shared_Workspace/JARVIS-CORE/b6/fence2.py adjudicate <job>`) — never bypass the gate.
- the operator's live approval is the ONLY C16 closer; a green battery is NOT C16.

PROOF CONTRACT (four tiers — a claim without its tier artifact is VOID)
- L0: `python3 -c "compile(...)"` / the build → exit codes.
- L1: the pure functions (classify/transition/zfp/band) → exit 0.
- L2: script-test — the real modules, observation-channel asserts → the PASS/FAIL table + exit.
- L3/L4: the container rig (`:9851` + `:9741` + CDP) AND the live host render → the results JSON + the OPENED screenshot.
- Named tests (selectable by name): `test_v8_structure` · `test_6dim_score` · `test_e2_zfp_conditioned` · `test_render_ladder` · `test_5week_crossval`.
- EVERY enforcement is POSITIVE + NEGATIVE: the RES-zone test fires on a week with the price at the high AND the battery passes on the clean build; a GENERIC gate preempting a specific one = UNOBSERVED, never PASS.
- Bound every token to a TOOL RESULT (a verbatim output, an artifact path, `exit 0`, a `sha256sum`), never to agent prose. Independent re-verification: re-run every prior wave's gate on the combined tree. NO ARTIFACT, NO CLAIM.

ANTI-DERAIL (the derailments THIS project's history recorded — recognise, do not re-live)
1. THE SPOT-PROXIMITY FILTER: the prompt step 1 says, in bold, "DO NOT filter by spot proximity." I filtered to ±0.70 → with the price near the week's high EVERY resistance level was discarded → 0 RES zones. NEVER filter by proximity.
2. THE IMPROVISED ZFP: I wrote my own step function (37%/50%) and then v8's width formula — BOTH wrong. The ZFP is DEFINED in the prompt (the degree's failure band). Read it.
3. AUTHORING INSTEAD OF TRANSCRIBING: I built my own clustering/window/degree math instead of reproducing the v8's structure. The v8 IS engine 1. Transcribe.
4. A GLOBAL CONSTANT IN A DIMENSION: `build_levels` set `l["regime"]` identically on every level → 29 levels tied → every zone MODERATE 37%. A constant flattens everything.
5. `bars[-1]` AS THE SPOT: on a forward-extended fixture it is the FUTURE price → the "resistance" sat below it → 0 RES. Use the anchor's price.
6. THE DEGREE-LABEL FALL-THROUGH: `f_e1PressureLbl` expected `"MODERATE_HEAVY"` but received `"MODERATE-HEAVY"` → fell to "Minimal". Match the v8's literal form (hyphen).
7. THE SPOT-LESS NAME: the operator asked eight times for "convert the prompt into an indicator" — the answer is TRANSCRIPTION, never a plausible-looking substitute. A green battery behind an off-spec artifact is THEATRICAL.

ANTI-STOP (false-complete shapes that never close the run)
- stationarity ("no change in N turns") · sub-inner pass as complete · memory-complete · theater-complete (prose summaries, typed-but-unrun commands, screenshots without artifacts) · blocked-as-done · partial-scope close ("5/6 waves green").
- "the STs pass, we're done" while the rig never rendered → W5 + the live capture are MANDATORY.
- Zero defects found in the adversarial pass = RED FLAG, not success.

STOP (the legal stop + the FIRST-REPLY contract)
- The run stops ONLY when: all 5 waves green + the fence PASS row exists + the 5-week cross-validation passes + the operator LOOKS at the live render and says "this is right" (C16). ANYTHING LESS IS OPEN.
- FIRST REPLY: re-measure the baseline (the SHAs, the battery, the tree), post the diff, then FIRE W1 in the same turn. Inherited numbers are STALE until re-run.
- RESUME POINTERS: `SPEC.md` (the fence contract) · `context_management/ENGINE_BLUEPRINT.md` (Engine 1+2 verbatim) · `context_management/NEXT_STEPS_BLUEPRINT.md` (the plan) · `.trident/wave-audit/` · the canon `context_management/CURRENT_STATE.md`. A fresh session resumes from DISK, never from this pin's frozen numbers.

SUPERSEDED (2026-10-11 — read PIN_INDICATOR_PORT_BUILD.md:1 instead; this pin is history)
- This Oct-08 pin ordered 5 waves (v8 structure → 6-dim score → E2 ZFP-conditioned
  → verbatim render → 5-week crossval) against a Python-payload architecture: the
  engine computed OFFLINE and the build INJECTED its output as Pine literals.
- Its baseline is STALE on every number (v2 984732d0, e2_tests 42, CDP :9222 on
  display :3 — all dead paths now; the operator forbade :9222/:3 by RULE-A/B).
- Its W4 render contract (label = `nm | prs | calcZFP(tp,bt,pair)%`, the v8 WIDTH
  formula) was OVERTURNED by F-55: exactly ONE ZFP, the Appendix-B failure
  probability — the width formula is deleted in Python AND in Pine.
- Its W1→W4 landed in substance under the new pin: the 5-zone structure
  (PIN_INDICATOR_PORT_BUILD.md:40), the 6-dim score (PIN_INDICATOR_PORT_BUILD.md:45),
  the E2 engine, and the verbatim color ladder all survive in the served .pine.
- Its W5 (5-week crossval) was REBORN as the W6 litmus: scripts/indicator_gate.py
  renders 5 seeded REAL weeks through pine-station with RES+SUP per week and
  binds a live :99 screenshot by buffer-sha; JEV_GATE/run_gate.sh:54 ingests the
  evidence into every JEV chunk. The `evidence/` + CROSSVAL_5WEEK.md mechanism it
  named was retired (a report-shaped artifact — NO REPORT).
- WHY SUPERSEDED: the payload architecture it assumed IS the A2 derailment the new
  pin forbids (PIN_INDICATOR_PORT_BUILD.md:73 rules A3: compute LIVE in Pine).
  This file stays as the lineage record — the goals were right, the mechanism
  was wrong, and the record shows both.
- LINEAGE: PIN_FINISH_INDICATOR.md:1 (this file, Oct-08, payload-era) →
  PIN_INDICATOR_PORT_BUILD.md:1 (Oct-10, compute-live era, binding). A session
  holding THIS pin must stop and re-read the binding one (SPEC.md:25).
- KEPT, NOT DELETED: superseded pins stay as lineage records. Deleting the
  record would orphan every F-entry, commit message, and checkpoint that cites
  this pin's wave numbering (JEV_GATE/run_gate.sh:54).
