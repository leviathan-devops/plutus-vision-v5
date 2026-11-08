GOAL
Port the Toolset's Engine 1 (the 9-Pillar zone map) + Engine 2 (the macro shape chain)
INTO the Pine indicator so it COMPUTES the zones live from the chart's own bars and
renders them on the sealed V1 baseline — transcribed from the authority, never
re-derived; computed, never typed; NO report.
THE ONLY SUCCESS GATE IS THE JEV GATE. No person, agent, unit test, exit code, script,
or battery decides. JEV decides. The run STOPS only when `bash JEV_GATE/run_gate.sh`
returns `JEV VERDICT: YES` (route=act on EVERY context chunk) AND the operator LOOKS at
the live render (C16). ANYTHING ELSE IS REJECTED. ANY non-YES is a rejection, no appeal.

BASELINE (re-measure EVERY number THIS turn; inherited numbers are STALE)
repo /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION @ HEAD
v1 seal pine-ide/ide/renderer/plutus-vision-v1.pine = 0d20e8314ce992fc23e27f1b97fed76b981c84e78c647bbe6b3d6e1206517bd1
  — NEVER touch (HARD STOP H1).
v2 pine-ide/ide/renderer/plutus-vision-v2.pine = 282517ac622769bdb34296ebee94fa8079da28dbab30bff1c27ae2146a74f011
  — CORRECTED 2026-10-10 (see ERRATA in the handover §24). The SERVED/approved render is 282517ac
  (the operator's C16-approved Jul-6 render). The OLD text here read `668e89d7…` (1863 lines) — that
  is the sha of the ROOT copy `./plutus-vision-v2.pine`, NOT the renderer copy; the path/sha were
  mismatched. `668e89d7` is a build artifact, not the served indicator and not the approved render.
AUTHORITY: Original_Canon_Data/Toolset/ (6 files) + Original_Canon_Data/Pine Scripts/trident_v8.pine.
THE BUILD PACKAGE (the DERIVED plan, never the authority):
  packages/plutus-vision-e1-automatic/ + the DPL1 blueprint + PLUTUS_VISION_INDICATOR_PORT_SPEC.md
rig: pv-server :9851 (renderer + workspace proxy), pine-station :9741 (the Pine runner),
  VIL rail :9754, judge :8090. THE APP = the native desktop shell `~/.local/bin/pine-ide`
  (GTK+WebKit2) on the OPERATOR'S display (wayland-0).
  — CORRECTED 2026-10-10 (see ERRATA §24): the OLD text read "CDP :9222, the app on display :3" —
  BOTH ARE DEAD PATHS, forbidden by the operator (RULE-A/RULE-B). NEVER render via a Chrome --app
  CDP window (:9222), NEVER via nested weston (:3) or agent xvfb (:99), NEVER more than ONE window.
THE CONFIRMED DEFECT (JEV rejects the current build on EVERY chunk, max noul=0.364):
  pine-ide/ide/renderer/plutus-vision-v2.pine:1276-1316 — the baked zone arrays.
  grep -cE 'e1_injected_(top|bottom|cat|degree|zfp)\.push\([0-9]' pine-ide/ide/renderer/plutus-vision-v2.pine
  -> 15 (the port spec SC-19 requires 0). The zones are baked literals, not computed.

WAVES (sequential; each owns DISJOINT files; each gate MECHANICAL; loop until the JEV gate says YES)
W1 — zfp-desk — the ONE ZFP (critical path)
  files: scripts/e1_zfp.py (NEW), e1_category.py, e1_fetch.py, e1_extract.py
  deliverable: ZFP = Appendix-B base(zone_type) + the six B.2 modifiers, each from data;
    DELETE the width calcZFP and ZFP_BASE (spec F-55: exactly ONE ZFP)
  gate: test_zfp_discriminates — a breakout-week ceiling ZFP reads HIGHER than in consolidation
W2 — assembly-desk — the canon's 9-step zone assembly
  files: scripts/e1_zone_assembly.py (NEW)
  deliverable: collect -> score(6 dims x2 + bonus <=2, max 14) -> cluster(0.15/0.10, 3+)
    -> degree -> zfp -> name(positional)
  gate: test_v8_structure — zCat matches ^RES,RES,MID,SUP,SUP$ and floor zfp < mid zfp
W3 — pillars-desk — the missing pillars
  files: scripts/e1_pillars.py (NEW)
  deliverable: Pillar 6 (fib + round-number grid) first, then P3/P4/P7/P8; the 4H verification (Step 0f)
  gate: test_6dim_score — options > 0 AND analyst > 0 AND >= 4 distinct zfp across 5 zones
W4 — lsz-desk — the LSZ zone object + the 4H verification
  files: scripts/e1_pillars.py (the P5 section)
  deliverable: the LSZ is a first-class zone (range/type/source/function/priority); 4H date + width <= 0.40
  gate: test_lsz_object — the E1 JSON carries lsz[] with range/type/function
W5 — pine-desk — THE DELIVERABLE: the zones COMPUTED in Pine
  files: pine-ide/ide/renderer/plutus-vision-v2.pine, scripts/pine_emit.py
  deliverable: P1,P2,P5,P6,P9 computed IN the .pine from the chart's bars;
    the e1_injected_* ZONE arrays DELETED; only P3/P4/P7/P8 bake
  gate: test_render_computed — grep -cE 'e1_injected_*.push\([0-9]' plutus-vision-v2.pine == 0
    AND the zones built by ta.* / request.security
W6 — gate-desk — the differential ZFP + the 5-week litmus + wire the live screenshot into the JEV gate
  files: scripts/indicator_gate.py (NEW), JEV_GATE/run_gate.sh
  deliverable: the two-week differential probe wired into the chain; 5 random weeks rendered with
    FORWARD price action visible (real bars, NOT INSUFFICIENT_DATA); the gate ingests the screenshot
  gate: test_5week_crossval — each week has >=5 zones with >=1 RES AND >=1 SUP AND the render ok:true
W7 — cleanup-desk — the scratch + the seal
  files: (deletions per forensic/SLUMP_MAP.md) + the fence SPEC.md
  deliverable: the orphan renderers, the twin, the scratch dirs, the build target removed; the fence PASS row
  gate: test_tree_clean — git status --porcelain == 0 and no duplicate v2 renderer

LAWS (binding every turn; a violation FAILS the wave on sight)
THE JEV GATE IS THE ONLY SUCCESS GATE: `bash JEV_GATE/run_gate.sh` — JEV, given the FULL context,
  returns one noul per chunk: act (>=0.8) = YES, anything else = REJECT. You NEVER grade, judge,
  test, or pass anything yourself.
THE OD-1 RULING (RULED 2026-10-09, A3): P1,P2,P5,P6,P9 run LIVE in the indicator (Pine) from the
  chart's own bars; ONLY P3/P4/P7/P8 bake. A2 (baking ALL pillars and injecting literals) is FORBIDDEN.
THE VERBATIM AUTHORITY: the prompt + the v8 are ONE authority; transcribe, cite file:line, never
  author. Where the prompt is silent, FIND the answer in it — never invent.
RIPWIRE FIRST-CLASS: map structure (ripwire verb=for/callers/impact) before EVERY coding edit.
NO IMPROVISED FORMULAS: the ZFP is Appendix-B (never the v8 width); the degree is the cluster's
  top-scorer band; no global constant in any dimension.
NO REPORT: the chart is the view. No report generator, ever.
AN UNRULED OPEN DECISION (OD-n) IS A HARD STOP — never build a "recommended default."
THE BUILD PACKAGE (the DPL1 blueprint + the wave-plan at packages/plutus-vision-e1-automatic/)
  is the DERIVED plan; the Toolset (the prompt + the v8) is the authority.

HARD STOPS + THE MECHANICAL REJECTIONS (each is an INSTANT, AUTOMATIC rejection)
- the JEV gate returns anything other than act -> REJECTED, redo. No appeal.
- you (or any subagent) grade/judge/test/pass ANY success condition -> REJECTED on sight. JEV judges.
- a unit-test count / exit code 0 / a green battery offered as a success reason -> REJECTED on sight.
- the zones are baked literals (SC-19 != 0) -> REJECTED.
- a BLOCKED audit/gate reported as PASS -> REJECTED.
- a fabricated level on the chart -> STOP, revert, log the F entry.
- v1 drift: sha256sum plutus-vision-v1.pine != 0d20e831...517bd1 -> HARD STOP H1.
- an UNRULED open decision (OD-n) -> STOP + escalate; never build the default.
- a commit WITHOUT a fence PASS row -> the kernel refuses (REJECT(G-SEAL)).

ANTI-PATTERNS (the derailments that burned three days — recognise, NEVER re-live)
AP-1 the A2 substitution: baking the pillars offline and injecting them as Pine literals (the
  report round-trip renamed). The ONE requirement was "compute it live".
AP-2 self-grading: the builder declaring its own work a PASS. The builder is a CLAIM; JEV judges.
AP-3 a green battery / exit code offered as a success reason. Tests are regression guards, never evidence.
AP-4 the substituted ship gate: a BLOCKED qwen-code-audit replaced by a weaker gate and called PASS.
AP-5 the 17 reviewer rounds on a baked payload: polishing the FORM of a render whose SUBSTANCE (the
  computed zones) was absent.
AP-6 duplicated authority: a second ZFP, a twin renderer, two v2 files.
AP-7 a report generator (the retired pipeline as the product).
AP-8 the crossval reported as accuracy over INSUFFICIENT_DATA (zero real bars).
AP-9 treating an open decision (OD-n) as a default.
AP-10 re-deriving where a named artifact exists (the Toolset). Transcribe.

THE MECHANICAL SUCCESS GATE — THE EXACT WIRING (mandatory; you are FORBIDDEN from bypassing this)
The gate IS `bash JEV_GATE/run_gate.sh [artifact]`. It:
  (1) assembles the FULL context (~227KB, nothing omitted): the WHOLE spec · the 6 ship docs ·
      the git history (40 commits) · the checkpoints · the WHOLE theatricality log · the WHOLE
      artifact source (the .pine);
  (2) CHUNKS it (~38KB pieces; measured 7) because the judge's payload cap is ~48KB; the artifact
      evidence header (sha, the SC-19 count, the ta.* count) is prepended to EVERY chunk;
  (3) judges EACH chunk via `jm decision-tree --rows … --recipe JEV_GATE/recipe.json` (the local
      JevK5 at :8090/v1/systemone; ONE noul per chunk; requests=1);
  (4) routes + aggregates: noul >= act(0.80) = route "act" = YES; >= flag(0.50) = "escalate" =
      REJECT; < flag = "noop" = REJECT; policy.fail="closed" → a judge outage REFUSES (never a pass).
      The verdict is the AND: EVERY chunk must be act;
  (5) emits "JEV VERDICT: YES" (exit 0) or "JEV VERDICT: NO — REJECTED" (exit 1).
THE BINARY: only all-chunks-act is YES. Everything else (escalate, noop, refusal, timeout, outage) is REJECT.
THE WIRING FILES: JEV_GATE/recipe.json:1 · JEV_GATE/run_gate.sh:1 · JEV_GATE/WORKFLOW.md:1 ·
  JmManager/src/verbs/decision-tree.ts:155 (answersToPolicyValue) · JmManager/src/judge/policy.ts:31 (the route ladder).

THE PERSISTENT TODO (immutable — pinned, never removed; you are FORBIDDEN to bypass it)
  [PERMANENT] RUN THE JEV GATE AND POST ITS VERDICT — do not pass anything yourself.
    the gate:   bash JEV_GATE/run_gate.sh [artifact]
    the pass:   route=act on EVERY context chunk (only).
    the context: FULL (partial context = REJECT — the gate chunks the whole spec + docs + artifact).
    failure to run the gate = the work is DELETED.

THE CHEAT/BYPASS ANTI-PATTERNS (AP-G1..AP-G12 — each is an INSTANT, AUTOMATIC rejection)
AP-G1 SELF-GRADING: you/subagent declaring your own work a PASS. The builder is a CLAIM; JEV judges.
AP-G2 A TEST AS THE GATE: a unit-test count / "N tests pass" / a green battery as a success reason.
AP-G3 AN EXIT CODE AS THE GATE: "exit 0 therefore it works."
AP-G4 A WEAKER GATE SUBSTITUTED: replacing the JEV gate with VIL / a script / "direct look."
AP-G5 PARTIAL CONTEXT: running the gate without the full context, then trusting the YES.
AP-G6 THE DEGRADED-RUN-AS-PASS: a judge outage / timeout / refusal reported as a pass.
AP-G7 THE RECIPE TAMPER: editing recipe.json to lower `act` / soften the question. The recipe is FROZEN.
AP-G8 THE THRESHOLD TAMPER: reading `escalate` (0.5-0.8) as a pass. Only `act` is YES.
AP-G9 THE EVIDENCE-SUBSTITUTION: hand-writing the artifact evidence instead of running the tool.
AP-G10 THE CACHED-FALSE-YES: trusting a cached decision after the artifact changed.
AP-G11 THE SELF-REPORTED-VERDICT: typing "JEV VERDICT: YES" in prose. Only run_gate.sh's exit code counts.
AP-G12 THE BOOTSTRAPPED-JUDGE: modifying the judge (model/adapter/decision-tree.ts) to make it say yes.
THE META-AP: any reasoning that concludes "this is fine" without the gate's `act` is AP-G1.

PROOF CONTRACT (the JEV gate IS the proof; there is no other)
THE GATE: `bash JEV_GATE/run_gate.sh [artifact]` -> the per-chunk noul decision. all-act = YES, else REJECT.
THE CONTEXT THE GATE CONSUMES (full, no exceptions): the WHOLE spec + the 6 ship docs + the git
  history + the checkpoints + the WHOLE theatricality log + the WHOLE artifact source. A JEV verdict
  reached WITHOUT this full context is VOID — re-supply the context and re-run.
THE CONTEXT-COMPLETENESS CHECK (before trusting any YES): the gate must have printed >= 5 chunks
  (the whole spec + docs + artifact are large); a single tiny chunk means pieces were omitted -> REJECT.
INDEPENDENT: the gate is run by `run_gate.sh` (a mechanical script) over JEV (the local judge) —
  never by the builder, never by a subagent, never by the agent's own reasoning.
NAMED TESTS (regression guards only — they do NOT pass the build): test_zfp_discriminates,
  test_v8_structure, test_6dim_score, test_lsz_object, test_render_computed, test_5week_crossval,
  test_tree_clean.
ADVERSARIAL-FIRST: the mutation/adversarial cases run BEFORE the happy path. Zero defects found = RED FLAG.
THE LIVE PROOF: the render is captured (a screenshot) on the host-live rig and bound to the JEV
  verdict + the results artifact; a claim without the opened screenshot is VOID.
LOG ALL FAILURE DATA: every rejection, every BLOCKED, every F entry lands in FAILURE_LOG.md + the
  DEBUG_LOG the moment it is observed.

STOP
The run stops ONLY when: `bash JEV_GATE/run_gate.sh` returns `JEV VERDICT: YES` (route=act on EVERY
chunk) over the FULL context AND the operator LOOKS at the live render and says it is right (C16).
ANYTHING LESS IS OPEN.
FIRST REPLY: re-measure the baseline (the SHAs, the tree), run `bash JEV_GATE/run_gate.sh` to post
the CURRENT verdict (it is REJECTED — every chunk noop, max noul=0.364 today), then FIRE W1 in the
same turn. Inherited numbers are STALE until re-run.
RESUME from DISK (SPEC.md, context_management/, .trident/wave-audit/), never from frozen numbers.

REFERENCES (file:line anchors — output + verification)
  PLUTUS_VISION_INDICATOR_PORT_SPEC.md:445 (the OD-1 ruling) · JEV_GATE/recipe.json:1 (the noul question)
  JEV_GATE/WORKFLOW.md:1 (the gate workflow) · JmManager/src/verbs/decision-tree.ts:155 (the aggregation)
  JEV_GATE/run_gate.sh:1 (the gate runner) · the output of `bash JEV_GATE/run_gate.sh` is the only
  verdict; the verification is its exit code.
